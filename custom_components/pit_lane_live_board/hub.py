"""The hub: one per config entry (SPEC §5.4, §6).

It owns the calendar, the live session (connection, TV-delay buffer, merged state),
the F1TV token's lifecycle, and the listeners that the panel and the entities
register. Pure decisions are delegated to core/; this module does the timing and
the I/O.
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
    live_window,
    next_session,
    parse_schedule,
)
from .core.session import session_status
from .core.settings import Settings
from .core.spoiler import live_hidden
from .store import SettingsStore

_LOGGER = logging.getLogger(__name__)

SIGNAL_LIVE = f"{DOMAIN}_live"  # entities: the released live state changed
SIGNAL_EVENT = f"{DOMAIN}_event"  # the race-control event entity: (event type)
SIGNAL_SETTINGS = f"{DOMAIN}_settings"
SIGNAL_CALENDAR = f"{DOMAIN}_calendar"

TICK = timedelta(seconds=30)
CALENDAR_REFRESH = timedelta(hours=6)
F1TV_CHECK = timedelta(hours=1)
RELEASE_EVERY = 0.25
PUBLISH_EVERY = 0.5
MAP_EVERY = 0.25
CLOSE_AFTER_FINAL = timedelta(minutes=5)
FAILED_WINDOWS_FOR_REPAIR = 3
LIVE_OUTLINE_SAMPLES = 60_000
LIVE_OUTLINE_RETRY = 30.0

ISSUE_F1TV = "f1tv_new_token"
ISSUE_LIVE = "live_unreachable"


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
        self.live: LiveSession | None = None
        self._done_sessions: set[str] = set()
        self._failed_windows = 0
        self._window_key: str | None = None
        self._unsubs: list[CALLBACK_TYPE] = []
        self._live_listeners: set[Callable[[], None]] = set()
        self._map_listeners: set[Callable[[], None]] = set()
        self.f1tv = self._evaluate_token()
        self._renewing = False
        self.last_view: dict[str, Any] | None = None

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
        await self._async_stop_live()

    # Calendar.

    async def async_refresh_calendar(self, fresh: bool = False) -> None:
        self.season = dt_util.utcnow().year
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

    # The live window.

    async def _async_tick(self, now: datetime) -> None:
        if self.dev_url:
            if self.live is None:
                await self._async_start_live(None, None)
            return
        window = live_window(self.meetings, now)
        live = self.live
        if live is not None:
            finished = live.finalised_at is not None and (
                now - live.finalised_at >= CLOSE_AFTER_FINAL
            )
            if (
                window is None
                or finished
                or (window[1].key != (live.session.key if live.session else None))
            ):
                if live.session is not None and finished:
                    self._done_sessions.add(live.session.key)
                await self._async_stop_live()
            return
        if window is None:
            return
        meeting, session = window
        if session.key in self._done_sessions:
            return
        await self._async_start_live(meeting, session)

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

    async def _async_stop_live(self) -> None:
        live, self.live = self.live, None
        if live is None:
            return
        if live.ever_connected:
            self._failed_windows = 0
            ir.async_delete_issue(self.hass, DOMAIN, ISSUE_LIVE)
        elif live.session is not None:
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
        self.last_view = None
        async_dispatcher_send(self.hass, SIGNAL_LIVE)
        self._notify_live()
        self._notify_map()

    def _live_token(self) -> str | None:
        if self.f1tv.status in ("active", "expiring"):
            return self.entry.data.get(DATA_F1TV_TOKEN)
        return None

    async def _async_release_loop(self, live: LiveSession) -> None:
        while True:
            await asyncio.sleep(RELEASE_EVERY)
            now = time.monotonic()
            for item in live.buffer.release(now):
                self._apply(live, item)
            health = feed_health(live.client.last_message or live.started, now)
            if live.client.connected:
                live.ever_connected = True
            if health != live.health:
                live.health = health
                live.dirty = True
                async_dispatcher_send(self.hass, SIGNAL_LIVE)

    def _apply(self, live: LiveSession, item: tuple[Any, ...]) -> None:
        if item[0] == "keyframes":
            live.state = LiveState()
            live.state.apply_keyframes(item[1])
        else:
            _, topic, delta, utc = item
            live.state.apply(topic, delta, utc)
            if topic == "Position.z":
                live.map_dirty = True
                self._collect_outline_samples(live)
        live.dirty = True
        status = session_status(live.state.get("SessionStatus"))
        if status in ("finalised",) and live.finalised_at is None:
            live.finalised_at = dt_util.utcnow()
        self._ensure_outline(live)

    async def _async_publish_loop(self, live: LiveSession) -> None:
        last_map = 0.0
        while True:
            await asyncio.sleep(PUBLISH_EVERY / 2)
            now = time.monotonic()
            if live.map_dirty and now - last_map >= MAP_EVERY:
                live.map_dirty = False
                last_map = now
                self._notify_map()
            if not live.dirty:
                continue
            live.dirty = False
            self.last_view = None
            self._fire_events(live)
            async_dispatcher_send(self.hass, SIGNAL_LIVE)
            self._notify_live()
            await asyncio.sleep(PUBLISH_EVERY / 2)

    def _fire_events(self, live: LiveSession) -> None:
        """Automation events; never from stale state (INV-2) nor while no-spoiler
        mode hides the session (decision 15)."""
        if live.health != "ok" or live_hidden(self.settings):
            return
        events, marks = derive(self.store.marks, live.state.topics)
        if marks != self.store.marks:
            self.store.save_marks(marks)
        for event in events:
            async_dispatcher_send(self.hass, SIGNAL_EVENT, event)

    # The live view.

    def live_view(self) -> dict[str, Any]:
        if self.last_view is not None:
            return self.last_view
        live = self.live
        now_mono = time.monotonic()
        view = live_view.build(
            state=live.state if live else None,
            now=dt_util.utcnow() - timedelta(seconds=self.settings.tv_delay),
            health=live.health if live else "lost",
            syncing=bool(live and live.buffer.syncing()),
            hidden=live_hidden(self.settings) and live is not None,
            delay=self.settings.tv_delay,
            next_session=self.next_session_dict(),
            data_age=(
                now_mono - live.client.last_message
                if live and live.client.last_message
                else None
            ),
            map_available=bool(live and live.state.positions),
        )
        self.last_view = view
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
        except SourceError as err:
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

    # Listeners (the panel).

    @callback
    def listen_live(self, listener: Callable[[], None]) -> CALLBACK_TYPE:
        self._live_listeners.add(listener)
        return lambda: self._live_listeners.discard(listener)

    @callback
    def listen_map(self, listener: Callable[[], None]) -> CALLBACK_TYPE:
        self._map_listeners.add(listener)
        return lambda: self._map_listeners.discard(listener)

    def _notify_live(self) -> None:
        for listener in list(self._live_listeners):
            listener()

    def _notify_map(self) -> None:
        for listener in list(self._map_listeners):
            listener()

    # F1TV (SPEC §4.5).

    def _evaluate_token(self) -> TokenStatus:
        return evaluate(self.entry.data.get(DATA_F1TV_TOKEN), dt_util.utcnow())

    async def _async_f1tv_timer(self, _now: datetime) -> None:
        await self._async_check_f1tv()

    async def _async_check_f1tv(self) -> None:
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
        self.f1tv = self._evaluate_token()
        ir.async_delete_issue(self.hass, DOMAIN, ISSUE_F1TV)
        if self.live is not None:
            # Reconnect so the new token (or its absence) takes effect.
            meeting, session = self.live.meeting, self.live.session
            await self._async_stop_live()
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
