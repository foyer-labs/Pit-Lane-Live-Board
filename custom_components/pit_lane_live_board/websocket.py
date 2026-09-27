"""WebSocket commands of the panel (SPEC §10.5).

Every command needs an authenticated Home Assistant user. Reads go through the hub's
cached clients; `core/pages.py` decides what each page receives, and no-spoiler
mode is applied here, before anything is sent (INV-5).
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any

from homeassistant.components import websocket_api
from homeassistant.components.websocket_api.messages import construct_event_message
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.json import json_bytes
from homeassistant.util import dt as dt_util
import voluptuous as vol

from .clients.http import SourceError
from .const import DOMAIN, OPTION_ADMIN_ONLY, OPTION_SHOW_IN_SIDEBAR
from .core import pages
from .core.f1tv_token import acceptable, evaluate, extract_token
from .core.jolpica_parse import (
    add_changes,
    parse_laps,
    parse_pitstops,
    parse_qualifying,
    parse_results,
    parse_season_races,
    parse_seasons,
    parse_sprint,
    parse_standings,
)
from .core.schedule import spoiler_scope
from .core.spoiler import hidden_sessions, standings_round_cap
from .hub import SIGNAL_SETTINGS, Hub, listen_live, listen_map

FIRST_SEASON = 1950
# No season has had more than 24 rounds; 30 leaves room without letting a script
# walk round 999 through the request budget.
MAX_ROUND = 30


def _hub(hass: HomeAssistant) -> Hub | None:
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    return entries[0].runtime_data.hub if entries else None


def _now() -> datetime:
    return datetime.now(UTC)


def _season_in_range(value: int) -> int:
    """From 1950 to next year: a season further ahead has no data, and each one
    asked for would cost a request from the budget the calendar relies on."""
    if not FIRST_SEASON <= value <= _now().year + 1:
        raise vol.Invalid(f"season must be between {FIRST_SEASON} and next year")
    return value


SEASON = vol.All(vol.Coerce(int), _season_in_range)
ROUND = vol.All(vol.Coerce(int), vol.Range(min=1, max=MAX_ROUND))


class _Season(frozenset):
    """Every session of one season: what no-spoiler mode hides while the
    calendar is unknown, so the mode fails closed (INV-5)."""

    def __new__(cls, season: int) -> _Season:
        instance = super().__new__(cls)
        instance.prefix = f"{season}-"
        return instance

    def __contains__(self, key: object) -> bool:
        return isinstance(key, str) and key.startswith(self.prefix)


def _hidden(hub: Hub) -> frozenset[str]:
    if hub.settings.no_spoiler and not hub.meetings:
        return _Season(hub.season)
    return hidden_sessions(hub.settings, hub.meetings, _now())


def _settings_payload(hub: Hub, is_admin: bool) -> dict[str, Any]:
    return {
        **hub.settings.to_dict(),
        "season": hub.season,
        "first_season": FIRST_SEASON,
        "is_admin": is_admin,
        "running": hub.live is not None,
        "show_in_sidebar": bool(hub.entry.options.get(OPTION_SHOW_IN_SIDEBAR, True)),
        "admin_only": bool(hub.entry.options.get(OPTION_ADMIN_ONLY, False)),
        # Only a status, never the token (INV-3); and only for admins.
        "f1tv": hub.f1tv.to_dict() if is_admin else None,
    }


def _error(
    connection: websocket_api.ActiveConnection, msg_id: int, err: Exception
) -> None:
    connection.send_error(msg_id, "source_unavailable", str(err))


def _ready(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> Hub | None:
    hub = _hub(hass)
    if hub is None:
        connection.send_error(
            msg["id"], "not_loaded", "Pit Lane Live Board is not set up"
        )
    return hub


# Settings.


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/settings/get"})
@callback
def ws_settings_get(hass, connection, msg):
    if (hub := _ready(hass, connection, msg)) is None:
        return
    connection.send_result(msg["id"], _settings_payload(hub, connection.user.is_admin))


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/settings/set",
        vol.Optional("tv_delay"): vol.All(vol.Coerce(int), vol.Range(min=0, max=120)),
        vol.Optional("no_spoiler"): bool,
        vol.Optional("live"): bool,
        vol.Optional("auto_start"): bool,
        # The household's drivers and the summary (administrators only).
        vol.Optional("favourites"): [vol.All(str, vol.Length(max=3))],
        vol.Optional("notify_targets"): [vol.All(str, vol.Length(max=100))],
        vol.Optional("summary_kinds"): [str],
        vol.Optional("summary_format"): vol.In(("compact", "full")),
    }
)
@websocket_api.async_response
async def ws_settings_set(hass, connection, msg):
    if (hub := _ready(hass, connection, msg)) is None:
        return
    settings = hub.settings
    if "tv_delay" in msg:
        settings = settings.with_delay(msg["tv_delay"])
    if "no_spoiler" in msg and msg["no_spoiler"] != settings.no_spoiler:
        settings = settings.with_no_spoiler(msg["no_spoiler"])
    if "live" in msg:
        settings = settings.with_live(msg["live"])
    if "auto_start" in msg:
        settings = settings.with_auto_start(msg["auto_start"])
    household = ("favourites", "notify_targets", "summary_kinds", "summary_format")
    if any(key in msg for key in household) and not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrators only")
        return
    if "favourites" in msg:
        settings = settings.with_favourites(msg["favourites"])
    if any(k in msg for k in ("notify_targets", "summary_kinds", "summary_format")):
        settings = settings.with_summary(
            msg.get("notify_targets"),
            msg.get("summary_kinds"),
            msg.get("summary_format"),
        )
    await hub.async_update_settings(settings)
    connection.send_result(msg["id"], _settings_payload(hub, connection.user.is_admin))


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/settings/subscribe"})
@callback
def ws_settings_subscribe(hass, connection, msg):
    """Settings pushed on every change, wherever it came from (the switch and
    number entities, another device)."""
    if _ready(hass, connection, msg) is None:
        return

    @callback
    def send() -> None:
        if (hub := _hub(hass)) is not None:
            payload = _settings_payload(hub, connection.user.is_admin)
            connection.send_message(websocket_api.event_message(msg["id"], payload))

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(
        hass, SIGNAL_SETTINGS, send
    )
    connection.send_result(msg["id"])
    send()


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/spoiler/reveal",
        vol.Required("session"): vol.All(str, vol.Length(max=40)),
    }
)
@websocket_api.async_response
async def ws_spoiler_reveal(hass, connection, msg):
    """Reveal one hidden session. Only a session of the current calendar is
    accepted, and reveals outside the spoiler scope (which hide nothing) are
    forgotten, so the stored list stays a handful of keys. With no-spoiler mode
    off nothing is hidden, and nothing is written."""
    if (hub := _ready(hass, connection, msg)) is None:
        return
    key = msg["session"]
    if hub.settings.no_spoiler:
        known = {s.key for m in hub.meetings for s in m.sessions}
        if key not in known:
            connection.send_error(
                msg["id"], "invalid_session", "Not a session of the current calendar"
            )
            return
        scope = spoiler_scope(hub.meetings, _now())
        keep = frozenset(s.key for s in scope.sessions) if scope else frozenset()
        await hub.async_update_settings(hub.settings.with_revealed(key, keep))
    connection.send_result(msg["id"], _settings_payload(hub, connection.user.is_admin))


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/f1tv/set",
        vol.Required("token"): vol.All(str, vol.Length(min=1, max=20000)),
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_f1tv_set(hass, connection, msg):
    """Save a pasted token (admins only). It is checked here and never sent back
    (INV-3): the answer carries only its status."""
    if (hub := _ready(hass, connection, msg)) is None:
        return
    token = extract_token(msg["token"].strip())
    now = dt_util.utcnow()
    error = acceptable(evaluate(token, now), now) if token else "token_invalid"
    if error:
        connection.send_error(msg["id"], "invalid_token", error)
        return
    await hub.async_set_token(token)
    connection.send_result(msg["id"], _settings_payload(hub, True))


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/f1tv/remove"})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_f1tv_remove(hass, connection, msg):
    if (hub := _ready(hass, connection, msg)) is None:
        return
    await hub.async_set_token(None)
    connection.send_result(msg["id"], _settings_payload(hub, True))


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/panel/set",
        vol.Optional("show_in_sidebar"): bool,
        vol.Optional("admin_only"): bool,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_panel_set(hass, connection, msg):
    """The panel's options, from Settings (administrators only): the same options
    as the integration's Configure form."""
    if (hub := _ready(hass, connection, msg)) is None:
        return
    options = dict(hub.entry.options)
    for key in (OPTION_SHOW_IN_SIDEBAR, OPTION_ADMIN_ONLY):
        if key in msg:
            options[key] = msg[key]
    hass.config_entries.async_update_entry(hub.entry, options=options)
    connection.send_result(msg["id"], _settings_payload(hub, True))


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/summary/test"})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_summary_test(hass, connection, msg):
    """Send the summary of what the Live page shows now, to try the services."""
    if (hub := _ready(hass, connection, msg)) is None:
        return
    connection.send_result(msg["id"], {"result": await hub.async_send_test_summary()})


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/entities"})
@callback
def ws_entities(hass, connection, msg):
    """The integration's entities, for the Settings page to list and open."""
    if (hub := _ready(hass, connection, msg)) is None:
        return
    registry = er.async_get(hass)
    entities = [
        {
            "entity_id": e.entity_id,
            "key": e.translation_key,
            "domain": e.domain,
            "disabled": e.disabled_by is not None,
        }
        for e in er.async_entries_for_config_entry(registry, hub.entry.entry_id)
    ]
    entities.sort(key=lambda e: (e["domain"], e["entity_id"]))
    connection.send_result(msg["id"], {"entities": entities})


# Calendar.


async def _podiums(hub: Hub, season: int) -> dict[int, list[dict[str, Any]]]:
    """First, second and third of every race: three requests at once."""
    payloads = await asyncio.gather(
        *(
            hub.jolpica.get(f"{season}/results/{place}", season=season)
            for place in (1, 2, 3)
        )
    )
    podiums: dict[int, list[dict[str, Any]]] = {}
    for payload in payloads:
        for race in parse_season_races(payload):
            if race.get("round") and race.get("winner"):
                podiums.setdefault(race["round"], []).append(race["winner"])
    return podiums


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/calendar/get",
        vol.Optional("season"): SEASON,
    }
)
@websocket_api.async_response
async def ws_calendar_get(hass, connection, msg):
    if (hub := _ready(hass, connection, msg)) is None:
        return
    season = msg.get("season", hub.season)
    try:
        meetings, podiums = await asyncio.gather(
            hub.async_meetings(season), _podiums(hub, season)
        )
    except SourceError as err:
        _error(connection, msg["id"], err)
        return
    page = pages.calendar_page(meetings, _now(), _hidden(hub), podiums)
    # The season asked for, even when it has no meetings yet (January).
    page["season"] = season
    connection.send_result(msg["id"], page)


# Results.


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/seasons"})
@websocket_api.async_response
async def ws_seasons(hass, connection, msg):
    if (hub := _ready(hass, connection, msg)) is None:
        return
    try:
        seasons = parse_seasons(await hub.jolpica.seasons())
    except SourceError:
        seasons = []
    if not seasons:
        seasons = list(range(FIRST_SEASON, hub.season + 1))
    connection.send_result(msg["id"], {"seasons": sorted(seasons, reverse=True)})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/results/season",
        vol.Required("season"): SEASON,
    }
)
@websocket_api.async_response
async def ws_results_season(hass, connection, msg):
    if (hub := _ready(hass, connection, msg)) is None:
        return
    season = msg["season"]
    try:
        payload, meetings = await asyncio.gather(
            hub.jolpica.winners(season), hub.async_meetings(season)
        )
    except SourceError as err:
        _error(connection, msg["id"], err)
        return
    winners = parse_season_races(payload)
    page = pages.season_rounds(season, meetings, winners, _hidden(hub), _now())
    if season >= pages.FIRST_ARCHIVE_SEASON and season < hub.season:
        try:
            archived = await hub.archive.season_index(season) is not None
        except SourceError:
            archived = True  # unreachable now: keep the tabs, they say so if empty
        if not archived:
            page = pages.without_archive_tabs(page)
    connection.send_result(msg["id"], page)


async def _classification(hub: Hub, season: int, rnd: int) -> list[dict[str, Any]]:
    parsed = parse_results(await hub.jolpica.results(season, rnd))
    return parsed["rows"] if parsed else []


async def _archive_detail(hub: Hub, season: int, rnd: int) -> dict[str, Any] | None:
    meetings = await hub.async_meetings(season)
    meeting = next((m for m in meetings if m.round == rnd), None)
    if meeting is None or meeting.race is None:
        return None
    return await hub.archive.detail(meetings, meeting.race)


async def _tab(hub: Hub, season: int, rnd: int, tab: str) -> dict[str, Any] | None:
    if tab == "race":
        return parse_results(await hub.jolpica.results(season, rnd))
    if tab == "qualifying":
        return parse_qualifying(await hub.jolpica.qualifying(season, rnd))
    if tab == "sprint":
        return parse_sprint(await hub.jolpica.sprint(season, rnd))
    if tab == "lap_chart" and season >= pages.FIRST_ARCHIVE_SEASON:
        # One archive file instead of a dozen pages of Jolpica laps.
        results, detail = await asyncio.gather(
            _classification(hub, season, rnd), _archive_detail(hub, season, rnd)
        )
        chart = pages.lap_chart_from_archive(detail, results) if detail else None
        if chart is not None:
            return chart
    elif tab in ("lap_chart", "pit_stops"):
        results = await _classification(hub, season, rnd)
    else:
        results, detail = await asyncio.gather(
            _classification(hub, season, rnd), _archive_detail(hub, season, rnd)
        )
    if tab == "lap_chart":
        positions = parse_laps(await hub.jolpica.laps(season, rnd))
        return pages.lap_chart(positions, results) if positions else None
    if tab == "pit_stops":
        stops = parse_pitstops(await hub.jolpica.pitstops(season, rnd))
        return pages.pit_stops(stops, results)
    if detail is None:
        return None
    if tab == "strategy":
        return pages.strategy(detail, results)
    if tab == "lap_times":
        return pages.lap_times(detail, results)
    if tab == "race_control":
        return pages.race_control_tab(detail)
    return pages.weather_tab(detail)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/results/detail",
        vol.Required("season"): SEASON,
        vol.Required("round"): ROUND,
        vol.Required("tab"): vol.In(pages.TABS),
    }
)
@websocket_api.async_response
async def ws_results_detail(hass, connection, msg):
    if (hub := _ready(hass, connection, msg)) is None:
        return
    season, rnd, tab = msg["season"], msg["round"], msg["tab"]
    key = pages.hidden_tab(season, rnd, tab, _hidden(hub))
    if key is not None:
        connection.send_result(msg["id"], {"tab": tab, "hidden": True, "session": key})
        return
    try:
        data = await _tab(hub, season, rnd, tab)
    except SourceError as err:
        _error(connection, msg["id"], err)
        return
    connection.send_result(
        msg["id"],
        {"tab": tab, "hidden": False, "available": data is not None, "data": data},
    )


# Standings.


async def _same(value: Any) -> Any:
    return value


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/standings/get",
        vol.Required("season"): SEASON,
        vol.Optional("round"): vol.Any(None, ROUND),
        vol.Required("kind"): vol.In(("drivers", "constructors")),
    }
)
@websocket_api.async_response
async def ws_standings_get(hass, connection, msg):
    if (hub := _ready(hass, connection, msg)) is None:
        return
    season, kind = msg["season"], msg["kind"]
    api_kind = "driver" if kind == "drivers" else "constructor"
    try:
        latest_payload = await hub.jolpica.standings(season, None, api_kind)
        latest = parse_standings(latest_payload)
        rounds = latest["round"] if latest and latest.get("round") else 0
        wanted = msg.get("round") or rounds
        cap = standings_round_cap(hub.settings, hub.meetings, _now())
        if hub.settings.no_spoiler and not hub.meetings and season == hub.season:
            cap = (season, 0)  # no calendar: fail closed (INV-5)
        capped = False
        if cap is not None and cap[0] == season and wanted > cap[1]:
            wanted, capped = cap[1], True
        if wanted < 1:
            connection.send_result(
                msg["id"], pages.standings_page(None, rounds, capped)
            )
            return
        # The latest standings already answer the latest round.
        current, previous = await asyncio.gather(
            _same(latest_payload)
            if wanted == rounds
            else hub.jolpica.standings(season, wanted, api_kind),
            hub.jolpica.standings(season, wanted - 1, api_kind)
            if wanted > 1
            else _same(None),
        )
    except SourceError as err:
        _error(connection, msg["id"], err)
        return
    parsed = parse_standings(current)
    if parsed is not None:
        add_changes(parsed, parse_standings(previous) if previous else None)
    visible_rounds = min(rounds, cap[1]) if cap and cap[0] == season else rounds
    connection.send_result(
        msg["id"], pages.standings_page(parsed, visible_rounds, capped)
    )


# Live (SPEC §7.1): the hub encodes each view once for every open page; here it
# is only wrapped in this subscription's envelope. The first message is complete,
# the next ones carry the sections that changed (`full: false`).


# The subscriptions look the hub up at every send: after an entry reload the open
# pages receive from the new hub.


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/live/subscribe"})
@callback
def ws_live_subscribe(hass, connection, msg):
    if (hub := _ready(hass, connection, msg)) is None:
        return

    @callback
    def send(payload: bytes) -> None:
        connection.send_message(construct_event_message(msg["id"], payload))

    connection.subscriptions[msg["id"]] = listen_live(hass, send)
    connection.send_result(msg["id"])
    send(json_bytes(hub.live_view()))
    hub.ensure_final()


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/map/subscribe"})
@callback
def ws_map_subscribe(hass, connection, msg):
    if (hub := _ready(hass, connection, msg)) is None:
        return

    @callback
    def send(payload: bytes) -> None:
        connection.send_message(construct_event_message(msg["id"], payload))

    connection.subscriptions[msg["id"]] = listen_map(hass, send)
    connection.send_result(msg["id"])
    send(hub.map_payload(broadcast=False, full=True))


COMMANDS = (
    ws_settings_get,
    ws_settings_set,
    ws_settings_subscribe,
    ws_spoiler_reveal,
    ws_f1tv_set,
    ws_f1tv_remove,
    ws_panel_set,
    ws_summary_test,
    ws_entities,
    ws_calendar_get,
    ws_seasons,
    ws_results_season,
    ws_results_detail,
    ws_standings_get,
    ws_live_subscribe,
    ws_map_subscribe,
)


@callback
def async_register(hass: HomeAssistant) -> None:
    for command in COMMANDS:
        websocket_api.async_register_command(hass, command)
