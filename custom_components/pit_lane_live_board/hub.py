"""The hub: one per config entry (SPEC §5.4, §6).

It owns the calendar, the live session (connection, TV-delay buffer, merged state)
and the F1TV token's lifecycle. Pure decisions are delegated to core/; this module
does the timing and the I/O.

The panel's live and map listeners live in `hass.data`, not in the hub: a reloaded
entry gets a new hub, and the open pages keep receiving from it.
"""

from __future__ import annotations

import asyncio
from collections.abc import Callable
import contextlib
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
import logging
import os
from pathlib import Path
import time
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.util import dt as dt_util

from .cache import DiskCache
from .clients.archive import ArchiveClient
from .clients.f1tv import RenewalOutcome, renew
from .clients.http import SourceError
from .clients.jolpica import JolpicaClient
from .clients.livetiming import LiveTimingClient
from .const import (
    CACHE_DIR,
    DATA_F1TV_TOKEN,
    DOMAIN,
    ENV_DEV_LIVE_URL,
    LIVE_BASE,
)
from .core import live_view
from .core.delay import DelayBuffer
from .core.events import derive
from .core.f1tv_token import TokenStatus, evaluate
from .core.live_state import LiveState
from .core.liveness import feed_health
from .core.outline import Outline, build_outline
from .core.panels import header
from .core.schedule import (
    Meeting,
    Session,
    feed_start,
    live_window,
    match_session,
    next_session,
    parse_schedule,
)
from .core.session import session_kind, session_status
from .core.settings import Settings
from .core.spoiler import live_hidden
from .core.values import to_int
from .store import SettingsStore

_LOGGER = logging.getLogger(__name__)

SIGNAL_LIVE = f"{DOMAIN}_live"  # entities: the released live state changed
SIGNAL_EVENT = f"{DOMAIN}_event"  # the race-control event entity: (event type)
SIGNAL_SETTINGS = f"{DOMAIN}_settings"
SIGNAL_CALENDAR = f"{DOMAIN}_calendar"

TICK = timedelta(seconds=30)
CALENDAR_REFRESH = timedelta(hours=6)
CALENDAR_RETRY = 120.0  # while there is no calendar at all
F1TV_CHECK = timedelta(hours=1)
RELEASE_EVERY = 0.25
PUBLISH_EVERY = 0.5
MAP_EVERY = 0.25
STALE_REPUBLISH = 1.0
CLOSE_AFTER_FINAL = timedelta(minutes=5)
FAILED_WINDOWS_FOR_REPAIR = 3
LIVE_OUTLINE_SAMPLES = 60_000
LIVE_OUTLINE_RETRY = 30.0

ISSUE_F1TV = "f1tv_new_token"
ISSUE_LIVE = "live_unreachable"

_LIVE_LISTENERS = f"{DOMAIN}_live_listeners"
_MAP_LISTENERS = f"{DOMAIN}_map_listeners"


def _listeners(hass: HomeAssistant, key: str) -> set[Callable[[], None]]:
    return hass.data.setdefault(key, set())


@callback
def listen_live(hass: HomeAssistant, listener: Callable[[], None]) -> CALLBACK_TYPE:
    listeners = _listeners(hass, _LIVE_LISTENERS)
    listeners.add(listener)
    return lambda: listeners.discard(listener)


@callback
def listen_map(hass: HomeAssistant, listener: Callable[[], None]) -> CALLBACK_TYPE:
    listeners = _listeners(hass, _MAP_LISTENERS)
    listeners.add(listener)
    return lambda: listeners.discard(listener)


@dataclass
class LiveSession:
    """One connection to the live feed, for one session window."""

    meeting: Meeting | None
    session: Session | None
    client: LiveTimingClient
    buffer: DelayBuffer[tuple[Any, ...]]
    state: LiveState = field(default_factory=LiveState)
    started: float = field(default_factory=time.monotonic)
    task: asyncio.Task[None] | None = None
    loops: list[asyncio.Task[None]] = field(default_factory=list)
    dirty: bool = True
    map_dirty: bool = False
    health: str = "lost"
    last_push: float = 0.0
    finalised_at: datetime | None = None
    ever_connected: bool = False
    outline: Outline | None = None
    outline_circuit: int | None = None
    outline_task: asyncio.Task[None] | None = None
    live_samples: list[tuple[str, float, float, bool]] = field(default_factory=list)
    next_outline_try: float = 0.0


class Hub:
    def __init__(
        self,
        hass: HomeAssistant,
        entry: ConfigEntry,
        store: SettingsStore,
        client_factory: Callable[..., LiveTimingClient] | None = None,
    ) -> None:
        self.hass = hass
        self.entry = entry
        self.store = store
        session = async_get_clientsession(hass)
        self.session = session
        self.cache = DiskCache(Path(hass.config.path(CACHE_DIR)))
        run = hass.async_add_executor_job
        self.jolpica = JolpicaClient(session, self.cache, run)
        self.archive = ArchiveClient(session, self.cache, run)
        self._client_factory = client_factory or LiveTimingClient
        self.dev_url = os.environ.get(ENV_DEV_LIVE_URL)
        self.meetings: list[Meeting] = []
        self.season = dt_util.utcnow().year
        self.calendar_error: str | None = None
        self._calendar_tried = 0.0
        self.live: LiveSession | None = None
        self._lock = asyncio.Lock()
        self._done_sessions: set[str] = set()
        self._failed_windows = 0
        self._unsubs: list[CALLBACK_TYPE] = []
        self._token_refused = False
        self.f1tv = self._evaluate_token()
        self._renewing = False

    # Lifecycle.

    async def async_start(self) -> None:
        await self.async_refresh_calendar()
        self._unsubs.append(
            async_track_time_interval(self.hass, self._async_tick, TICK)
        )
        self._unsubs.append(
            async_track_time_interval(
                self.hass, self._async_calendar_timer, CALENDAR_REFRESH
            )
        )
        self._unsubs.append(
            async_track_time_interval(self.hass, self._async_f1tv_timer, F1TV_CHECK)
        )
        self.hass.async_create_background_task(
            self._async_tick(dt_util.utcnow()), f"{DOMAIN} first tick"
        )
        self.hass.async_create_background_task(
            self._async_check_f1tv(), f"{DOMAIN} F1TV check"
        )

    async def async_stop(self) -> None:
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()
        async with self._lock:
            await self._async_stop_live(counts_as_window=False)

    # Calendar.

    async def async_refresh_calendar(self, fresh: bool = False) -> None:
        self.season = dt_util.utcnow().year
        self._calendar_tried = time.monotonic()
        try:
            payload = await self.jolpica.schedule(self.season, fresh=fresh)
        except SourceError as err:
            self.calendar_error = str(err)
            _LOGGER.warning("Calendar unavailable: %s", err)
            return
        meetings = parse_schedule(payload)
        self.calendar_error = None if meetings else "empty"
        if meetings:
            self.meetings = meetings
            async_dispatcher_send(self.hass, SIGNAL_CALENDAR)
            self._notify_live()

    async def async_meetings(self, season: int) -> list[Meeting]:
        if season == self.season and self.meetings:
            return self.meetings
        return parse_schedule(await self.jolpica.schedule(season))

    async def _async_calendar_timer(self, _now: datetime) -> None:
        await self.async_refresh_calendar()

    def next_session(self) -> tuple[Meeting, Session] | None:
        return next_session(self.meetings, dt_util.utcnow())

    def next_session_dict(self) -> dict[str, Any] | None:
        found = self.next_session()
        if found is None:
            return None
        meeting, session = found
        return {
            "meeting": meeting.name,
            "round": meeting.round,
            "season": meeting.season,
            "circuit": meeting.circuit,
            "country": meeting.country,
            **session.to_dict(),
        }

    # Settings.

    @property
    def settings(self) -> Settings:
        return self.store.settings

    async def async_update_settings(self, settings: Settings) -> None:
        await self.store.async_save(settings)
        if self.live is not None:
            self.live.buffer.set_delay(settings.tv_delay)
            self.live.dirty = True
        async_dispatcher_send(self.hass, SIGNAL_SETTINGS)
        async_dispatcher_send(self.hass, SIGNAL_LIVE)
        self._notify_live()
        self._notify_map()

    # The live window.

    async def _async_tick(self, now: datetime) -> None:
        if (
            not self.meetings
            and time.monotonic() - self._calendar_tried >= CALENDAR_RETRY
        ):
            # No calendar at all (first start while a source was down): no window
            # can open, so try again soon rather than in six hours.
            await self.async_refresh_calendar()
        async with self._lock:
            await self._async_tick_locked(now)

    async def _async_tick_locked(self, now: datetime) -> None:
        if self.dev_url:
            if self.live is None:
                await self._async_start_live(None, None)
            return
        live = self.live
        if live is not None:
            finished = live.finalised_at is not None and (
                now - live.finalised_at >= CLOSE_AFTER_FINAL
            )
            if finished and live.session is not None:
                self._done_sessions.add(live.session.key)
        window = live_window(self.meetings, now, frozenset(self._done_sessions))
        if live is not None:
            same = (
                window is not None
                and live.session is not None
                and (window[1].key == live.session.key)
            )
            if same:
                return
            await self._async_stop_live(counts_as_window=True)
        if window is not None:
            await self._async_start_live(*window)

    async def _async_start_live(
        self, meeting: Meeting | None, session: Session | None
    ) -> None:
        buffer: DelayBuffer[tuple[Any, ...]] = DelayBuffer(self.settings.tv_delay)
        client = self._client_factory(
            self.session,
            self.dev_url or LIVE_BASE,
            lambda keyframes: buffer.push(time.monotonic(), ("keyframes", keyframes)),
            lambda topic, delta, utc: buffer.push(
                time.monotonic(), ("feed", topic, delta, utc)
            ),
            self._live_token,
            on_refused=self._token_refused_by_f1,
        )
        live = LiveSession(meeting, session, client, buffer)
        self.live = live
        live.task = self.hass.async_create_background_task(
            client.run(), f"{DOMAIN} live timing"
        )
        live.loops = [
            self.hass.async_create_background_task(
                self._async_release_loop(live), f"{DOMAIN} release"
            ),
            self.hass.async_create_background_task(
                self._async_publish_loop(live), f"{DOMAIN} publish"
            ),
        ]
        _LOGGER.debug("Live window open for %s", session.key if session else "dev")

    async def _async_stop_live(self, *, counts_as_window: bool) -> None:
        """Close the live connection. Only a window that ran its course without a
        single connection counts towards the "unreachable" repair, not one cut
        short by an unload or a token change."""
        live, self.live = self.live, None
        if live is None:
            return
        if live.ever_connected or live.client.connected:
            self._failed_windows = 0
            ir.async_delete_issue(self.hass, DOMAIN, ISSUE_LIVE)
        elif counts_as_window and live.session is not None:
            self._failed_windows += 1
            if self._failed_windows >= FAILED_WINDOWS_FOR_REPAIR:
                ir.async_create_issue(
                    self.hass,
                    DOMAIN,
                    ISSUE_LIVE,
                    is_fixable=False,
                    severity=ir.IssueSeverity.WARNING,
                    translation_key=ISSUE_LIVE,
                )
        tasks = [t for t in (live.task, live.outline_task, *live.loops) if t]
        for task in tasks:
            task.cancel()
        for task in tasks:
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await task
        async_dispatcher_send(self.hass, SIGNAL_LIVE)
        self._notify_live()
        self._notify_map()

    def _live_token(self) -> str | None:
        """Evaluated at each connection, not trusted from the hourly check."""
        if self._token_refused:
            return None
        token = self.entry.data.get(DATA_F1TV_TOKEN)
        if evaluate(token, dt_util.utcnow()).status in ("active", "expiring"):
            return token
        return None

    @callback
    def _token_refused_by_f1(self) -> None:
        """F1 answered 401/403 to our token: stop offering it (the client goes on
        without it), and ask the admin for a new one."""
        self._token_refused = True
        status = self.f1tv
        self.f1tv = TokenStatus(
            "invalid",
            expires=status.expires,
            session_id=status.session_id,
            product=status.product,
            reason="refused",
        )
        self._raise_f1tv_issue()
        async_dispatcher_send(self.hass, SIGNAL_SETTINGS)

    # Releasing and publishing.

    def _health(self, live: LiveSession, now: float) -> tuple[str, float]:
        """`(health, data age)` of what the page shows (INV-2).

        What is shown is the last released message, which was received at
        `last_released`; it reached the page `delay` seconds later. So the page's
        data is `now - (last_released + delay)` old: a gap in the feed shows up when
        its last message is released, not when it was received.
        """
        received = live.buffer.last_released
        base = (received if received is not None else live.started) + live.buffer.delay
        age = max(0.0, now - base)
        return feed_health(base, now), age

    async def _async_release_loop(self, live: LiveSession) -> None:
        while True:
            await asyncio.sleep(RELEASE_EVERY)
            try:
                self._release(live)
            except Exception:
                _LOGGER.exception("Live release failed; the loop goes on")

    def _release(self, live: LiveSession) -> None:
        now = time.monotonic()
        for item in live.buffer.release(now):
            self._apply(live, item)
        if live.client.connected:
            live.ever_connected = True
        health, _ = self._health(live, now)
        if health != live.health:
            live.health = health
            live.dirty = True
            async_dispatcher_send(self.hass, SIGNAL_LIVE)
        elif health != "ok" and now - live.last_push >= STALE_REPUBLISH:
            # While the feed is quiet the page's data age keeps growing.
            live.dirty = True

    def _apply(self, live: LiveSession, item: tuple[Any, ...]) -> None:
        if item[0] == "keyframes":
            previous = live.state
            live.state = LiveState()
            live.state.apply_keyframes(item[1])
            if _session_key(previous.topics) == _session_key(live.state.topics):
                # A reconnect to the same session: F1 deletes pit times soon after
                # sending them, so the log cannot come back; keep it, and keep the
                # cars on the map until new positions arrive.
                live.state.pit_log = previous.pit_log
                live.state.positions = previous.positions or live.state.positions
        else:
            _, topic, delta, utc = item
            live.state.apply(topic, delta, utc)
            if topic == "Position.z":
                live.map_dirty = True
                self._collect_outline_samples(live)
        live.dirty = True
        self._check_finalised(live)
        self._ensure_outline(live)

    def _check_finalised(self, live: LiveSession) -> None:
        """Close the window only for the session we follow (SPEC §6.1): early in a
        window the feed may still carry the previous session, finalised."""
        info = live.state.get("SessionInfo")
        if live.session is not None:
            kind = str(session_kind(info))
            matched = match_session(
                self.meetings,
                "practice" if kind == "practice" else kind,
                feed_start(info),
            )
            if matched is None or matched.key != live.session.key:
                live.finalised_at = None
                return
        status = session_status(live.state.get("SessionStatus"))
        if status == "finalised":
            if live.finalised_at is None:
                live.finalised_at = dt_util.utcnow()
        else:
            live.finalised_at = None

    async def _async_publish_loop(self, live: LiveSession) -> None:
        last_map = 0.0
        while True:
            await asyncio.sleep(PUBLISH_EVERY / 2)
            try:
                now = time.monotonic()
                if live.map_dirty and now - last_map >= MAP_EVERY:
                    live.map_dirty = False
                    last_map = now
                    self._notify_map()
                if not live.dirty:
                    continue
                live.dirty = False
                live.last_push = now
                self._fire_events(live)
                async_dispatcher_send(self.hass, SIGNAL_LIVE)
                self._notify_live()
            except Exception:
                _LOGGER.exception("Live publish failed; the loop goes on")
            await asyncio.sleep(PUBLISH_EVERY / 2)

    def _fire_events(self, live: LiveSession) -> None:
        """Automation events.

        The marks always follow the released state, so nothing that happened while
        events were withheld fires later; events are only withheld, never from
        stale state (INV-2) nor while no-spoiler mode hides the session (decision
        15).
        """
        events, marks = derive(self.store.marks, live.state.topics)
        if marks != self.store.marks:
            self.store.save_marks(marks)
        if live.health != "ok" or live_hidden(self.settings):
            return
        for event in events:
            async_dispatcher_send(self.hass, SIGNAL_EVENT, event)

    # The live view.

    def map_reason(self) -> str:
        """Why there is no map, for the page to say the right thing."""
        live = self.live
        if live is not None and live.state.positions:
            return "available"
        if live is not None and live.client.authenticated:
            return "no_data"
        if self.f1tv.status == "not_configured":
            return "not_configured"
        return "token_problem"

    def live_view(self) -> dict[str, Any]:
        live = self.live
        health, age = (
            (live.health, self._health(live, time.monotonic())[1])
            if live
            else ("lost", None)
        )
        view = live_view.build(
            state=live.state if live else None,
            now=dt_util.utcnow() - timedelta(seconds=self.settings.tv_delay),
            health=health,
            syncing=bool(live and live.buffer.syncing()),
            hidden=live_hidden(self.settings) and live is not None,
            delay=self.settings.tv_delay,
            next_session=self.next_session_dict(),
            data_age=age,
            map_available=bool(live and live.state.positions),
        )
        view["map_reason"] = self.map_reason()
        return view

    def map_view(self) -> dict[str, Any] | None:
        live = self.live
        if live is None or live_hidden(self.settings) or live.health == "lost":
            return None
        outline = live.outline
        cars = []
        if outline is not None:
            for number, pos in live.state.positions.items():
                x, y = outline.project(pos.x, pos.y)
                cars.append(
                    {"number": number, "x": x, "y": y, "on_track": pos.on_track}
                )
        return {
            "outline": outline.to_dict() if outline else None,
            "cars": cars,
            "utc": live.state.positions_utc,
        }

    # Track outline (SPEC §6.5).

    def _ensure_outline(self, live: LiveSession) -> None:
        if not live.client.authenticated or live.outline_task is not None:
            return
        info = header(live.state.topics, dt_util.utcnow())
        circuit = info.get("circuit_key")
        if circuit is None:
            return
        live.outline_circuit = circuit
        live.outline_task = self.hass.async_create_background_task(
            self._async_load_outline(live, circuit), f"{DOMAIN} outline"
        )

    async def _async_load_outline(self, live: LiveSession, circuit: int) -> None:
        try:
            live.outline = await self.archive.outline(circuit, dt_util.utcnow())
        except (SourceError, OSError) as err:
            _LOGGER.debug("No archived outline for circuit %s: %s", circuit, err)
        live.map_dirty = True

    def _collect_outline_samples(self, live: LiveSession) -> None:
        """A new circuit has no archived session: draw it from live positions,
        trying again every 30 s until one lap closes."""
        if live.outline is not None or (
            live.outline_task is not None and not live.outline_task.done()
        ):
            return
        for number, pos in live.state.positions.items():
            live.live_samples.append((number, pos.x, pos.y, pos.on_track))
        if len(live.live_samples) > LIVE_OUTLINE_SAMPLES:
            del live.live_samples[: len(live.live_samples) - LIVE_OUTLINE_SAMPLES]
        now = time.monotonic()
        if now < live.next_outline_try:
            return
        live.next_outline_try = now + LIVE_OUTLINE_RETRY
        live.outline_task = self.hass.async_create_background_task(
            self._async_live_outline(live, list(live.live_samples)),
            f"{DOMAIN} live outline",
        )

    async def _async_live_outline(
        self, live: LiveSession, samples: list[tuple[str, float, float, bool]]
    ) -> None:
        outline = await self.hass.async_add_executor_job(build_outline, samples)
        if outline is not None:
            live.outline = outline
            live.map_dirty = True

    # The panel's listeners.

    def _notify(self, key: str) -> None:
        for listener in list(_listeners(self.hass, key)):
            try:
                listener()
            except Exception:
                _LOGGER.exception("A live listener failed")

    def _notify_live(self) -> None:
        self._notify(_LIVE_LISTENERS)

    def _notify_map(self) -> None:
        self._notify(_MAP_LISTENERS)

    # F1TV (SPEC §4.5).

    def _evaluate_token(self) -> TokenStatus:
        return evaluate(self.entry.data.get(DATA_F1TV_TOKEN), dt_util.utcnow())

    async def _async_f1tv_timer(self, _now: datetime) -> None:
        await self._async_check_f1tv()

    async def _async_check_f1tv(self) -> None:
        if self._token_refused:
            return
        self.f1tv = self._evaluate_token()
        token = self.entry.data.get(DATA_F1TV_TOKEN)
        if self.f1tv.status in ("not_configured", "active"):
            ir.async_delete_issue(self.hass, DOMAIN, ISSUE_F1TV)
            return
        if self.f1tv.status == "invalid" or not token or self._renewing:
            self._raise_f1tv_issue()
            return
        self._renewing = True
        try:
            outcome, new = await renew(self.session, token, dt_util.utcnow())
        finally:
            self._renewing = False
        if outcome == RenewalOutcome.RENEWED and new:
            self.hass.config_entries.async_update_entry(
                self.entry, data={**self.entry.data, DATA_F1TV_TOKEN: new}
            )
            self.f1tv = self._evaluate_token()
            ir.async_delete_issue(self.hass, DOMAIN, ISSUE_F1TV)
            _LOGGER.info("F1TV access renewed until %s", self.f1tv.expires)
        elif outcome == RenewalOutcome.PAIRING or self.f1tv.status == "expired":
            self._raise_f1tv_issue()
        async_dispatcher_send(self.hass, SIGNAL_SETTINGS)

    def _raise_f1tv_issue(self) -> None:
        ir.async_create_issue(
            self.hass,
            DOMAIN,
            ISSUE_F1TV,
            is_fixable=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key=ISSUE_F1TV,
        )

    async def async_token_changed(self) -> None:
        """The options flow saved or removed a token."""
        self._token_refused = False
        self.f1tv = self._evaluate_token()
        ir.async_delete_issue(self.hass, DOMAIN, ISSUE_F1TV)
        async with self._lock:
            if self.live is not None:
                # Reconnect so the new token (or its absence) takes effect.
                meeting, session = self.live.meeting, self.live.session
                await self._async_stop_live(counts_as_window=False)
                await self._async_start_live(meeting, session)
        async_dispatcher_send(self.hass, SIGNAL_SETTINGS)

    # Diagnostics (INV-3: never the token).

    async def async_diagnostics(self) -> dict[str, Any]:
        live = self.live
        return {
            "season": self.season,
            "meetings": len(self.meetings),
            "calendar_error": self.calendar_error,
            "jolpica": {
                "last_error": self.jolpica.last_error,
                "budget_left_this_hour": self.jolpica.limiter.remaining(),
            },
            "archive": {"last_error": self.archive.last_error},
            "cache_bytes": await self.hass.async_add_executor_job(self.cache.size),
            "f1tv": self.f1tv.to_dict(),
            "settings": self.settings.to_dict(),
            "failed_windows": self._failed_windows,
            "done_sessions": sorted(self._done_sessions),
            "dev_override": bool(self.dev_url),
            "live": None
            if live is None
            else {
                "session": live.session.key if live.session else None,
                "connected": live.client.connected,
                "authenticated": live.client.authenticated,
                "health": live.health,
                "held_messages": len(live.buffer),
                "last_error": live.client.last_error,
                "topics_seen": sorted(live.client.topics_seen),
                "outline": live.outline is not None,
            },
            "now": datetime.now(UTC).isoformat(),
        }


def _session_key(topics: dict[str, Any]) -> int | None:
    info = topics.get("SessionInfo")
    return to_int(info.get("Key")) if isinstance(info, dict) else None
