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
from homeassistant.core import HomeAssistant, callback
import voluptuous as vol

from .clients.http import SourceError
from .const import DOMAIN
from .core import pages
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
from .core.spoiler import hidden_sessions, standings_round_cap
from .hub import Hub

FIRST_SEASON = 1950


def _hub(hass: HomeAssistant) -> Hub | None:
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    return entries[0].runtime_data.hub if entries else None


def _now() -> datetime:
    return datetime.now(UTC)


def _hidden(hub: Hub) -> frozenset[str]:
    return hidden_sessions(hub.settings, hub.meetings, _now())


def _settings_payload(hub: Hub, is_admin: bool) -> dict[str, Any]:
    return {
        **hub.settings.to_dict(),
        "season": hub.season,
        "first_season": FIRST_SEASON,
        "is_admin": is_admin,
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
    await hub.async_update_settings(settings)
    connection.send_result(msg["id"], _settings_payload(hub, connection.user.is_admin))


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/spoiler/reveal", vol.Required("session"): str}
)
@websocket_api.async_response
async def ws_spoiler_reveal(hass, connection, msg):
    if (hub := _ready(hass, connection, msg)) is None:
        return
    await hub.async_update_settings(hub.settings.with_revealed(msg["session"]))
    connection.send_result(msg["id"], _settings_payload(hub, connection.user.is_admin))


# Calendar.


async def _podiums(hub: Hub, season: int) -> dict[int, list[dict[str, Any]]]:
    podiums: dict[int, list[dict[str, Any]]] = {}
    for place in (1, 2, 3):
        payload = await hub.jolpica.get(f"{season}/results/{place}", season=season)
        for race in parse_season_races(payload):
            if race.get("round") and race.get("winner"):
                podiums.setdefault(race["round"], []).append(race["winner"])
    return podiums


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/calendar/get",
        vol.Optional("season"): vol.All(vol.Coerce(int), vol.Range(min=FIRST_SEASON)),
    }
)
@websocket_api.async_response
async def ws_calendar_get(hass, connection, msg):
    if (hub := _ready(hass, connection, msg)) is None:
        return
    season = msg.get("season", hub.season)
    try:
        meetings = await hub.async_meetings(season)
        podiums = await _podiums(hub, season)
    except SourceError as err:
        _error(connection, msg["id"], err)
        return
    connection.send_result(
        msg["id"], pages.calendar_page(meetings, _now(), _hidden(hub), podiums)
    )


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
        vol.Required("season"): vol.All(vol.Coerce(int), vol.Range(min=FIRST_SEASON)),
    }
)
@websocket_api.async_response
async def ws_results_season(hass, connection, msg):
    if (hub := _ready(hass, connection, msg)) is None:
        return
    season = msg["season"]
    try:
        winners = parse_season_races(await hub.jolpica.winners(season))
        meetings = await hub.async_meetings(season)
    except SourceError as err:
        _error(connection, msg["id"], err)
        return
    connection.send_result(
        msg["id"], pages.season_rounds(season, meetings, winners, _hidden(hub))
    )


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
    results = await _classification(hub, season, rnd)
    if tab == "lap_chart":
        return pages.lap_chart(parse_laps(await hub.jolpica.laps(season, rnd)), results)
    if tab == "pit_stops":
        stops = parse_pitstops(await hub.jolpica.pitstops(season, rnd))
        return pages.pit_stops(stops, results)
    detail = await _archive_detail(hub, season, rnd)
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
        vol.Required("season"): vol.All(vol.Coerce(int), vol.Range(min=FIRST_SEASON)),
        vol.Required("round"): vol.All(vol.Coerce(int), vol.Range(min=1)),
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


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/standings/get",
        vol.Required("season"): vol.All(vol.Coerce(int), vol.Range(min=FIRST_SEASON)),
        vol.Optional("round"): vol.Any(
            None, vol.All(vol.Coerce(int), vol.Range(min=1))
        ),
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
        latest = parse_standings(await hub.jolpica.standings(season, None, api_kind))
        rounds = latest["round"] if latest and latest.get("round") else 0
        wanted = msg.get("round") or rounds
        cap = standings_round_cap(hub.settings, hub.meetings, _now())
        capped = False
        if cap is not None and cap[0] == season and wanted > cap[1]:
            wanted, capped = cap[1], True
        if wanted < 1:
            connection.send_result(
                msg["id"], pages.standings_page(None, rounds, capped)
            )
            return
        current, previous = await asyncio.gather(
            hub.jolpica.standings(season, wanted, api_kind),
            hub.jolpica.standings(season, wanted - 1, api_kind)
            if wanted > 1
            else asyncio.sleep(0, None),
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


# Live (SPEC §7.1): the view pushed on every change.


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/live/subscribe"})
@callback
def ws_live_subscribe(hass, connection, msg):
    if (hub := _ready(hass, connection, msg)) is None:
        return

    @callback
    def send() -> None:
        connection.send_message(websocket_api.event_message(msg["id"], hub.live_view()))

    connection.subscriptions[msg["id"]] = hub.listen_live(send)
    connection.send_result(msg["id"])
    send()


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/map/subscribe"})
@callback
def ws_map_subscribe(hass, connection, msg):
    if (hub := _ready(hass, connection, msg)) is None:
        return

    @callback
    def send() -> None:
        connection.send_message(websocket_api.event_message(msg["id"], hub.map_view()))

    connection.subscriptions[msg["id"]] = hub.listen_map(send)
    connection.send_result(msg["id"])
    send()


COMMANDS = (
    ws_settings_get,
    ws_settings_set,
    ws_spoiler_reveal,
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
