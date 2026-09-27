"""The hub: one per config entry (SPEC §5.4, §6).

It owns the calendar, the live session (connection, TV-delay buffer, merged state),
the last session's final state, the F1TV token's lifecycle, and what the entities
show. Pure decisions are delegated to core/; this module does the timing and the I/O.

A Raspberry Pi shapes the live path (SPEC §5.5):

* one 0.25 s loop releases messages, measures health and publishes when due;
* the page's view is sections rebuilt only when a topic they read changed, computed
  once per publish for the events, the entities and the page, and encoded once for
  every open page; after the first message only changed sections travel, and the
  timing tower only as the rows that changed (`tower_patch`);
* the map's outline travels once, then only the cars;
* entities are told to write only when something they show changed.

Live timing starts paused (decision 42): nothing connects and nothing live is
written until someone presses play, or `auto_start` does as a session window opens.

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
from homeassistant.helpers.json import json_bytes
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
from .core import (
    display as screen,
    favourites as fav,
    live_view,
    summary as session_summary,
)
from .core.delay import DelayBuffer
from .core.events import derive
from .core.f1tv_token import TokenStatus, evaluate
from .core.live_state import POSITION_TOPIC, LiveState, Sample
from .core.live_view import LiveViewBuilder
from .core.liveness import feed_health
from .core.outline import Outline, build_outline, provisional
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
from .core.session import RACE_LIKE, session_kind, session_status
from .core.settings import Settings
from .core.spoiler import hidden_sessions, live_hidden
from .core.stewards import PENALTIES
from .core.values import to_int
from .store import SettingsStore

_LOGGER = logging.getLogger(__name__)

SIGNAL_LIVE = f"{DOMAIN}_live"  # live entities: what they show changed
SIGNAL_EVENT = f"{DOMAIN}_event"  # the race-control event entity: (event type)
SIGNAL_STEWARDS = f"{DOMAIN}_stewards"  # the stewards event entity: (decision)
SIGNAL_FAVOURITE = f"{DOMAIN}_favourite"  # the drivers event entity: (type, data)
SIGNAL_SUMMARY = f"{DOMAIN}_summary"  # the summary event entity: (summary)
SIGNAL_DISPLAY = f"{DOMAIN}_display"  # the small-screen sensor
SIGNAL_SETTINGS = f"{DOMAIN}_settings"
SIGNAL_CALENDAR = f"{DOMAIN}_calendar"

TICK = timedelta(seconds=30)
CALENDAR_REFRESH = timedelta(hours=6)
CALENDAR_RETRY = 120.0  # while there is no calendar at all
F1TV_CHECK = timedelta(hours=1)
LOOP_EVERY = 0.25
PUBLISH_EVERY = 0.5
MAP_EVERY = 0.25
STALE_REPUBLISH = 1.0
# The small-screen sensor follows gaps at most every 5 s: a screen needs no more,
# and the recorder is spared. Flags and the page's state change it at once.
DISPLAY_EVERY = 5.0
RELEASE_CHUNK = 2000  # a lowered delay's backlog is applied over a few steps
CLOSE_AFTER_FINAL = timedelta(minutes=5)
# The archive publishes a session 0-30 minutes after it ends: while it has not, an
# open page asks again at most this often (INV-4).
FINAL_RETRY = 120.0
SETTLED_AFTER = timedelta(hours=48)
FAILED_WINDOWS_FOR_REPAIR = 3
LIVE_OUTLINE_SAMPLES = 20_000
LIVE_OUTLINE_RETRY = 30.0
# The provisional projection widens as the cars cover more of the circuit.
PROVISIONAL_EVERY = 5.0
DEV_WINDOW = "dev"

ISSUE_F1TV = "f1tv_new_token"
ISSUE_LIVE = "live_unreachable"

_LIVE_LISTENERS = f"{DOMAIN}_live_listeners"
_MAP_LISTENERS = f"{DOMAIN}_map_listeners"
# Topics that change nothing the page's sections show.
_QUIET_TOPICS = frozenset({POSITION_TOPIC, "Heartbeat"})
# Driver fields left out of the entities: they change every lap, and each change
# would be a recorder row per followed driver (decision 52: slow fields only).
_LAP_BY_LAP = frozenset({"laps", "tyre_age"})

type Listener = Callable[[bytes], None]


def _listeners(hass: HomeAssistant, key: str) -> set[Listener]:
    return hass.data.setdefault(key, set())


@callback
def listen_live(hass: HomeAssistant, listener: Listener) -> CALLBACK_TYPE:
    """A page on the Live tab: it receives each view, encoded once for all."""
    listeners = _listeners(hass, _LIVE_LISTENERS)
    listeners.add(listener)
    return lambda: listeners.discard(listener)


@callback
def listen_map(hass: HomeAssistant, listener: Listener) -> CALLBACK_TYPE:
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
    builder: LiveViewBuilder = field(default_factory=LiveViewBuilder)
    started: float = field(default_factory=time.monotonic)
    task: asyncio.Task[None] | None = None
    loop: asyncio.Task[None] | None = None
    dirty: bool = True
    map_dirty: bool = False
    health: str = "lost"
    last_push: float = 0.0
    last_map: float = 0.0
    finalised_at: datetime | None = None
    finalised_seen: tuple[int, ...] = ()
    ever_connected: bool = False
    outline: Outline | None = None
    outline_rev: int = 0
    outline_task: asyncio.Task[None] | None = None
    archive_outline: asyncio.Task[None] | None = None
    live_samples: list[Sample] = field(default_factory=list)
    next_outline_try: float = 0.0
    next_provisional: float = 0.0
    # The household's drivers as last seen: the baseline of their events.
    favourites_seen: dict[str, dict[str, Any]] | None = None
    favourites_session: int | None = None


@dataclass
class FinalView:
    """The last session's final state, shown between sessions (SPEC §7.1)."""

    key: str | None
    state: LiveState
    ended: datetime | None
    start: datetime | None = None  # when its session started: newer never loses
    builder: LiveViewBuilder = field(default_factory=LiveViewBuilder)


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
        self.jolpica.settled = self._round_settled
        self.archive = ArchiveClient(session, self.cache, run)
        self._client_factory = client_factory
        self.dev_url = os.environ.get(ENV_DEV_LIVE_URL)
        self.meetings: list[Meeting] = []
        self.season = dt_util.utcnow().year
        self.calendar_error: str | None = None
        self._calendar_tried = 0.0
        self.live: LiveSession | None = None
        self.final: FinalView | None = None
        self._final_task: asyncio.Task[None] | None = None
        self._final_missing: tuple[str, float] | None = None  # (session, when)
        self.first_tick: asyncio.Task[None] | None = None
        self._lock = asyncio.Lock()
        self._stopped = False
        self._done_sessions: set[str] = set()
        self._unsubs: list[CALLBACK_TYPE] = []
        self._token_refused = False
        self.f1tv = self._evaluate_token()
        self._renewing = False
        # What the open pages were last sent: the sections' version keys, the
        # tower's rows by racing number (the base of the next `tower_patch`) and
        # the encoded message (an identical one is not sent again).
        self._sent: dict[str, Any] = {}
        self._tower_sent: dict[str, Any] = {}
        self._last_view: bytes | None = None
        self._map_rev_sent = -1
        self.entity_state: dict[str, Any] = self._entity_snapshot()
        self.display: dict[str, Any] = {"state": "idle", "attributes": {}}
        self._display_at = 0.0
        # Set by the sensor when it is added: a disabled one costs nothing.
        self.display_enabled = False

    # Lifecycle.

    async def async_start(self) -> None:
        """Timers, and the calendar in the background: Home Assistant's start-up
        never waits on the network."""
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
        self.first_tick = self.entry.async_create_background_task(
            self.hass, self._async_first_tick(), f"{DOMAIN} first tick"
        )
        self.entry.async_create_background_task(
            self.hass, self._async_check_f1tv(), f"{DOMAIN} F1TV check"
        )
        # Pages left open across a reload hear from the new hub at once, not only
        # once the calendar parses: the old hub's last view may have been live.
        self.publish_full()

    async def _async_first_tick(self) -> None:
        await self.async_refresh_calendar()
        await self._async_tick(dt_util.utcnow())
        if not self._stopped:
            async_dispatcher_send(self.hass, SIGNAL_SETTINGS)  # "running", F1TV

    async def async_stop(self) -> None:
        self._stopped = True
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()
        if self._final_task is not None:
            self._final_task.cancel()
        async with self._lock:
            await self._async_stop_live(counts_as_window=False)
        await self.store.async_flush()
        # Open pages must not keep a live view whose clock froze (INV-2): they
        # get the session's final view, or idle, until a new hub speaks.
        self.publish_full()

    # Calendar.

    async def async_refresh_calendar(self, fresh: bool = False) -> None:
        if self._stopped:
            return
        self.season = dt_util.utcnow().year
        self._calendar_tried = time.monotonic()
        try:
            payload = await self.jolpica.schedule(self.season, fresh=fresh)
        except SourceError as err:
            self.calendar_error = str(err)
            _LOGGER.warning("Calendar unavailable: %s", err)
            return
        try:
            meetings = parse_schedule(payload)
        except Exception:  # hostile or broken data must not stop the calendar
            _LOGGER.exception("Calendar data could not be read")
            self.calendar_error = "unreadable"
            return
        self.calendar_error = None if meetings else "empty"
        if meetings and not self._stopped:
            self.meetings = meetings
            async_dispatcher_send(self.hass, SIGNAL_CALENDAR)
            self.publish_full()

    async def async_meetings(self, season: int) -> list[Meeting]:
        if season == self.season and self.meetings:
            return self.meetings
        return parse_schedule(await self.jolpica.schedule(season))

    async def _async_calendar_timer(self, _now: datetime) -> None:
        await self.async_refresh_calendar()

    def _round_settled(self, season: int, rnd: int) -> bool:
        """A round of the current season whose race ended two days ago: its results
        no longer change, and are cached like a past season's."""
        if season != self.season:
            return False
        meeting = next((m for m in self.meetings if m.round == rnd), None)
        race = meeting.race if meeting else None
        end = race.end if race else None
        return end is not None and end + SETTLED_AFTER < dt_util.utcnow()

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
            "timezone": meeting.timezone,
            **session.to_dict(),
        }

    # Settings.

    @property
    def settings(self) -> Settings:
        return self.store.settings

    async def async_update_settings(self, settings: Settings) -> None:
        if settings == self.settings:
            return  # a click on the value already set: nothing to write or send
        playing = settings.live != self.settings.live
        favourites_changed = settings.favourites != self.settings.favourites
        await self.store.async_save(settings)
        if self.live is not None:
            self.live.buffer.set_delay(settings.tv_delay)
            self.live.dirty = True
        if favourites_changed and self.live is not None:
            self.live.favourites_seen = None  # a new baseline for the new drivers
        async_dispatcher_send(self.hass, SIGNAL_SETTINGS)
        self._update_entities()
        self.publish_full()
        self._broadcast_map(full=True)
        self.release_summaries()
        if playing:
            # Play and pause take effect now, not at the next tick.
            await self._async_tick(dt_util.utcnow())

    # The live window.

    async def _async_tick(self, now: datetime) -> None:
        if self._stopped:
            return
        if (
            not self.meetings
            and time.monotonic() - self._calendar_tried >= CALENDAR_RETRY
        ):
            # No calendar at all (first start while a source was down): no window
            # can open, so try again soon rather than in six hours.
            await self.async_refresh_calendar()
        async with self._lock:
            if not self._stopped:
                await self._async_tick_locked(now)
        if self._stopped:
            return  # unloaded while waiting: the new hub's entities are not ours
        self.release_summaries()
        self._update_entities()
        if _listeners(self.hass, _LIVE_LISTENERS):
            # A page left open (a wall tablet, a dashboard) gets the newest final
            # view as sessions end, also while live timing is paused.
            self.ensure_final()

    def _window(self, now: datetime) -> tuple[Meeting | None, Session | None] | None:
        if self.dev_url:
            return (None, None)
        return live_window(self.meetings, now, frozenset(self._done_sessions))

    async def _async_tick_locked(self, now: datetime) -> None:
        live = self.live
        if (
            live is not None
            and live.finalised_at is not None
            and live.session is not None
            and now - live.finalised_at >= CLOSE_AFTER_FINAL
        ):
            self._done_sessions.add(live.session.key)
        window = self._window(now)
        key = (window[1].key if window[1] else DEV_WINDOW) if window else None
        if key is not None and key != self.store.auto_window:
            # Auto-start acts once per window, as it opens, whether or not live
            # timing is already on: a pause pressed during the session holds, and
            # the window is remembered across restarts.
            # With auto-start off it stays in memory: nothing depends on it after
            # a restart, and a paused install writes nothing (SPEC §5.5).
            self.store.auto_window = key
            if self.settings.auto_start and not self.settings.live:
                await self.store.async_save(self.settings.with_live(True))
                async_dispatcher_send(self.hass, SIGNAL_SETTINGS)
                self.publish_full()
            elif self.settings.auto_start:
                await self.store.async_save()
        wanted = window if self.settings.live else None
        if live is not None:
            if wanted is not None and _same_window(live, wanted):
                return
            # A window that ended counts towards the repair; a pause does not.
            await self._async_stop_live(counts_as_window=self.settings.live)
        if wanted is not None:
            await self._async_start_live(*wanted)

    async def _async_start_live(
        self, meeting: Meeting | None, session: Session | None
    ) -> None:
        if self._stopped:
            return
        buffer: DelayBuffer[tuple[Any, ...]] = DelayBuffer(self.settings.tv_delay)
        factory = self._client_factory or LiveTimingClient
        client = factory(
            self.session,
            self.dev_url or LIVE_BASE,
            lambda keyframes: buffer.push(time.monotonic(), ("keyframes", keyframes)),
            lambda topic, delta, utc: buffer.push(
                time.monotonic(), ("feed", topic, delta, utc)
            ),
            # A development player never gets the real F1TV token.
            (lambda: None) if self.dev_url else self._live_token,
            on_refused=self._token_refused_by_f1,
        )
        live = LiveSession(meeting, session, client, buffer)
        live.builder.circuit_id = meeting.circuit_id if meeting else None
        self.live = live
        live.task = self.entry.async_create_background_task(
            self.hass, client.run(), f"{DOMAIN} live timing"
        )
        live.loop = self.entry.async_create_background_task(
            self.hass, self._async_loop(live), f"{DOMAIN} live loop"
        )
        self.publish_full()
        async_dispatcher_send(self.hass, SIGNAL_SETTINGS)  # Settings: "running"
        _LOGGER.debug("Live window open for %s", session.key if session else "dev")

    async def _async_stop_live(self, *, counts_as_window: bool) -> None:
        """Close the live connection; its last state becomes the final view.

        Only a window that ran its course without a single connection counts
        towards the "unreachable" repair, not one cut short by a pause, an unload
        or a token change.
        """
        live, self.live = self.live, None
        if live is None:
            return
        # The loop first, before any await: it must not publish a view without
        # its session in between.
        if live.loop is not None:
            live.loop.cancel()
        if live.ever_connected or live.client.connected:
            ir.async_delete_issue(self.hass, DOMAIN, ISSUE_LIVE)
            if self.store.failed_windows:
                self.store.failed_windows = 0
                await self.store.async_save()
        elif counts_as_window and live.session is not None:
            self.store.failed_windows += 1
            await self.store.async_save()
            if self.store.failed_windows >= FAILED_WINDOWS_FOR_REPAIR:
                ir.async_create_issue(
                    self.hass,
                    DOMAIN,
                    ISSUE_LIVE,
                    is_fixable=False,
                    is_persistent=True,
                    severity=ir.IssueSeverity.WARNING,
                    translation_key=ISSUE_LIVE,
                )
        tasks = [
            t
            for t in (live.task, live.outline_task, live.archive_outline, live.loop)
            if t
        ]
        for task in tasks:
            task.cancel()
        for task in tasks:
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await task
        if live.state.topics:
            self.final = FinalView(
                live.session.key if live.session else None,
                live.state,
                live.finalised_at or dt_util.utcnow(),
                live.session.start if live.session else dt_util.utcnow(),
            )
        if self._stopped:
            return
        async_dispatcher_send(self.hass, SIGNAL_SETTINGS)  # Settings: "running"
        self._update_entities()
        self.publish_full()
        self._broadcast_map(full=True)

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

    # The live loop.

    def _health(self, live: LiveSession, now: float) -> tuple[str, float]:
        """`(health, data age)` of what the page shows (INV-2).

        What is shown is the last released message, received at `last_released`;
        it reached the page `delay` seconds later, so a gap in the feed shows up
        when its last message is released, not when it was received.
        """
        received = live.buffer.last_released
        base = (received if received is not None else live.started) + live.buffer.delay
        return feed_health(base, now), max(0.0, now - base)

    async def _async_loop(self, live: LiveSession) -> None:
        while True:
            await asyncio.sleep(LOOP_EVERY)
            try:
                self._step(live)
            except Exception:
                _LOGGER.exception("A live step failed; the loop goes on")

    def _step(self, live: LiveSession) -> None:
        now = time.monotonic()
        released = live.buffer.release(now, RELEASE_CHUNK)
        for item in released:
            # One message F1 shaped unexpectedly must not cost the rest of its
            # batch: F1 never sends a delta again.
            try:
                self._apply(live, item)
            except Exception:
                _LOGGER.exception("A live message could not be applied")
        if released:
            self._after_batch(live)
        if live.client.connected:
            live.ever_connected = True
        health, _ = self._health(live, now)
        if health != live.health:
            live.health = health
            live.dirty = True
        elif health != "ok" and now - live.last_push >= STALE_REPUBLISH:
            live.dirty = True  # while the feed is quiet the data age keeps growing
        if live.map_dirty and now - live.last_map >= MAP_EVERY:
            live.map_dirty = False
            live.last_map = now
            self._broadcast_map()
        if live.dirty and now - live.last_push >= PUBLISH_EVERY:
            live.last_push = now
            self._publish(live)
            live.dirty = False  # only once the pages have it: a failure tries again

    def _publish(self, live: LiveSession) -> None:
        """One publish: the sections are computed once and read by the events,
        the entities, the small screen and the pages. A failing event or entity
        step never keeps the page from its update."""
        sections = None
        hidden = live_hidden(self.settings) or live.buffer.syncing()
        if live.state.topics and (self.settings.favourites or not hidden):
            shown = dt_util.utcnow() - timedelta(seconds=self.settings.tv_delay)
            sections = live.builder.sections(live.state, shown)
        try:
            self._fire_events(live, sections)
        except Exception:
            _LOGGER.exception("Automation events failed; the page is still updated")
        parts = self._view_parts(sections)
        try:
            self._update_entities(sections, parts)
        except Exception:
            _LOGGER.exception("Entities failed; the page is still updated")
        self._send_view(full=False, parts=parts)

    def _apply(self, live: LiveSession, item: tuple[Any, ...]) -> None:
        if item[0] == "keyframes":
            previous = live.state
            live.state = LiveState()
            samples = live.state.apply_keyframes(item[1])
            if previous.topics and _session_key(previous.topics) == _session_key(
                live.state.topics
            ):
                # A reconnect to the same session: F1 deletes pit times soon after
                # sending them, and positions come back only when cars move.
                live.state.carry_over(previous)
            # Versions restart with the new state: what the pages hold can no
            # longer be compared with them, so the next view goes out complete.
            self._forget_sent()
            live.dirty = True
        else:
            _, topic, delta, utc = item
            samples = live.state.apply(topic, delta, utc)
            if topic not in _QUIET_TOPICS:
                live.dirty = True
        if samples:
            live.map_dirty = True
            self._collect_outline_samples(live, samples)

    def _after_batch(self, live: LiveSession) -> None:
        """Once per released batch, not per message."""
        seen = live.state.version("SessionInfo", "SessionStatus")
        if seen != live.finalised_seen:
            live.finalised_seen = seen
            try:
                self._check_finalised(live)
            except Exception:
                _LOGGER.exception("The finalised check failed")
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
                self.entry.async_create_background_task(
                    self.hass, self._async_summarise(live), f"{DOMAIN} summary"
                )
        else:
            live.finalised_at = None

    # Automation events and entities.

    def _fire_events(
        self, live: LiveSession, sections: dict[str, tuple[Any, Any]] | None = None
    ) -> None:
        """Race control transitions and stewards' decisions.

        The marks always follow the released state, so nothing that happened while
        events were withheld fires later; events are withheld from stale state
        (INV-2) and while no-spoiler mode hides the session (decision 15).
        """
        events, marks = derive(self.store.marks, live.state.topics)
        live.builder.sync(live.state)
        book = live.builder.book  # a reconnect's keyframes start a new book
        decisions = book.take_new()
        new_decisions: list[dict[str, Any]] = []
        if "session_key" in marks:
            # First sight of a session (a start mid-race): what is there is the
            # baseline, not news.
            first_new = int(marks.get("rcm_seen", book.seen))
            new_decisions = [d for d in decisions if d["index"] >= first_new]
            marks = {**marks, "rcm_seen": max(first_new, book.seen)}
        if marks != self.store.marks:
            self.store.save_marks(marks)
        # The household's drivers: compared with what was last seen, also while
        # events are withheld, so nothing fires late.
        drivers: list[tuple[str, dict[str, Any]]] = []
        if self.settings.favourites and live.state.topics:
            if sections is None:
                sections = live.builder.sections(live.state, dt_util.utcnow())
            rows = sections["tower"][1]
            seen = fav.snapshot(rows, self.settings.favourites)
            kind = session_kind(live.state.get("SessionInfo"))
            session = _session_key(live.state.topics)
            if session != live.favourites_session:
                # Another session in the feed (the previous one early in a
                # window, then this one): a new baseline, not a burst of events.
                live.favourites_session, live.favourites_seen = session, None
            drivers = fav.derive(live.favourites_seen, seen, kind in RACE_LIKE)
            live.favourites_seen = seen
            wanted = set(self.settings.favourites)
            for record in new_decisions:
                cars = record.get("cars") or []
                if record["kind"] in PENALTIES and cars and cars[0]["tla"] in wanted:
                    drivers.append(
                        (
                            "penalty",
                            {
                                "driver": cars[0]["tla"],
                                "number": cars[0]["number"],
                                "kind": record["kind"],
                                "seconds": record.get("seconds"),
                                "reason": record.get("reason"),
                                "lap": record.get("lap"),
                            },
                        )
                    )
        if live.health != "ok" or live_hidden(self.settings):
            return
        for event in events:
            async_dispatcher_send(self.hass, SIGNAL_EVENT, event)
        for record in new_decisions:
            async_dispatcher_send(self.hass, SIGNAL_STEWARDS, record)
        for event_type, data in drivers:
            async_dispatcher_send(self.hass, SIGNAL_FAVOURITE, event_type, data)

    def _update_entities(
        self,
        sections: dict[str, tuple[Any, Any]] | None = None,
        parts: _ViewParts | None = None,
    ) -> None:
        """Entities write only when what they show changed: a race writes a few
        hundred states, not two a second each."""
        snapshot = self._entity_snapshot(sections)
        if snapshot != self.entity_state:
            self.entity_state = snapshot
            async_dispatcher_send(self.hass, SIGNAL_LIVE)
        self._update_display(parts)

    def _update_display(self, parts: _ViewParts | None = None) -> None:
        """The small-screen sensor (decision 54): only while it is enabled, gaps
        at most every 5 s, the page's state and the flag at once; written only
        when what it shows changed."""
        if not self.display_enabled:
            return
        now = time.monotonic()
        meta, sections = parts if parts is not None else self._view_parts()
        if now - self._display_at < DISPLAY_EVERY:
            # Not due: only the page's state or the flag can make it urgent, and
            # both are read before anything is built.
            head = sections["header"][1] if sections else {}
            track = head.get("track_status") if sections else None
            if meta["state"] == self.display["state"] and track == self.display[
                "attributes"
            ].get("track"):
                return
        display = screen.build(_assemble(meta, sections), self.settings.favourites)
        if display == self.display:
            return
        self.display, self._display_at = display, now
        async_dispatcher_send(self.hass, SIGNAL_DISPLAY)

    def _entity_snapshot(
        self, sections: dict[str, tuple[Any, Any]] | None = None
    ) -> dict[str, Any]:
        live = self.live
        running = bool(
            live and session_status(live.state.get("SessionStatus")) == "started"
        )
        base: dict[str, Any] = {
            "paused": not self.settings.live,
            "connected": live is not None,
            # Whether a session is running is not a spoiler (decision 15).
            "running": running,
            "available": live is None
            or live.health != "lost"
            or not live.ever_connected,
            "shown": False,
        }
        if live is None or live_hidden(self.settings) or live.buffer.syncing():
            return base
        if not live.state.topics:
            return base
        if sections is None:
            sections = live.builder.sections(live.state, dt_util.utcnow())
        head = sections["header"][1]
        stewards = sections["stewards"][1]
        messages = sections["race_control"][1]
        return {
            **base,
            "shown": True,
            "session_status": head["status"],
            "track": head["track_status"],
            "lap": head["lap"],
            "total_laps": head["total_laps"],
            "safety_car": stewards["safety_car"],
            "virtual_safety_car": stewards["virtual_safety_car"],
            "red_flag": stewards["red_flag"],
            "yellow": stewards["yellow"],
            "double_yellow": stewards["double_yellow"],
            "yellow_sectors": [s["sector"] for s in stewards["yellow_sectors"]],
            "penalties": [
                _brief(p) for p in stewards["penalties"] if p["kind"] in PENALTIES
            ],
            "investigations": [_brief(i) for i in stewards["investigations"]],
            "last_message": messages[0] if messages else None,
            "drivers": {
                code: {
                    key: value
                    for key, value in fav.for_entity(driver).items()
                    if key not in _LAP_BY_LAP
                }
                for code, driver in fav.snapshot(
                    sections["tower"][1], self.settings.favourites
                ).items()
            },
        }

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

    def _view_parts(
        self, computed: dict[str, tuple[Any, Any]] | None = None
    ) -> _ViewParts:
        """`(meta, sections)`: what the Live page shows now. The meta always
        travels; the sections only when they changed. `computed` are the live
        sections when this publish already has them."""
        now = dt_util.utcnow()
        live = self.live
        meta: dict[str, Any] = {
            "delay": self.settings.tv_delay,
            "next_session": self.next_session_dict(),
            "paused": not self.settings.live,
            "auto_start": self.settings.auto_start,
            "map_available": bool(live and live.state.positions),
            "map_reason": self.map_reason(),
            "data_age": None,
            "ended": None,
        }
        if live is not None:
            if live_hidden(self.settings):
                return {
                    **meta,
                    "state": "hidden",
                    "header": live_view.hidden_header(live.state, now),
                }, None
            if live.buffer.syncing():
                return {**meta, "state": "syncing"}, None
            if not live.state.topics:
                return {**meta, "state": "connecting"}, None
            health, age = self._health(live, time.monotonic())
            meta["data_age"] = round(age, 1)
            shown = now - timedelta(seconds=self.settings.tv_delay)
            state = "live" if health == "ok" else health
            sections = computed or live.builder.sections(live.state, shown)
            return {**meta, "state": state}, sections
        final = self.final
        if final is not None:
            if self.settings.no_spoiler and (
                final.key is None
                or not self.meetings
                or final.key in hidden_sessions(self.settings, self.meetings, now)
            ):
                return {
                    **meta,
                    "state": "hidden",
                    "header": live_view.hidden_header(final.state, now),
                }, None
            ended = final.ended or now
            meta["ended"] = ended.isoformat()
            return {**meta, "state": "final"}, final.builder.sections(
                final.state, ended
            )
        return {**meta, "state": "idle" if self.settings.live else "paused"}, None

    def live_view(self) -> dict[str, Any]:
        """The complete view: for a page that has just subscribed, and tests."""
        view = _assemble(*self._view_parts())
        if self._tower_sent and view.get("tower"):
            # This page now holds rows the others may not have been sent yet.
            # Each one that differs from the last broadcast goes out again in the
            # next patch, so a row that returns to its broadcast value still
            # reaches this page.
            for row in view["tower"]:
                if self._tower_sent.get(row["number"]) != row:
                    self._tower_sent[row["number"]] = None
        return view

    def _forget_sent(self) -> None:
        """The pages' copy can no longer be compared: the next view is complete."""
        self._sent = {}
        self._tower_sent = {}
        self._last_view = None

    def _send_view(self, *, full: bool, parts: _ViewParts | None = None) -> None:
        """Encode once for every open page; after a full view, only what changed.

        In a partial view (`full: false`) the tower travels as a patch against the
        rows last sent: `tower_patch: {order: [numbers], rows: {number: row}}`,
        with every number in display order and only the rows whose content
        changed. A complete view carries `tower` whole."""
        if not _listeners(self.hass, _LIVE_LISTENERS):
            self._forget_sent()
            return
        meta, sections = parts if parts is not None else self._view_parts()
        sent = self._sent
        if full or sections is None or meta["state"] != sent.get("state"):
            view = _assemble(meta, sections)
            self._sent = {"state": meta["state"]}
            for name, (key, _) in (sections or {}).items():
                self._sent[name] = key
            self._tower_sent = {row["number"]: row for row in view.get("tower") or []}
        else:
            view = {**meta, "full": False}
            for name, (key, value) in sections.items():
                if sent.get(name) == key:
                    continue
                sent[name] = key
                if name != "tower":
                    view[name] = value
                elif (patch := self._tower_patch(value)) is not None:
                    view["tower_patch"] = patch
        payload = json_bytes(view)
        if not full and payload == self._last_view:
            # Nothing new (a hidden or syncing page while the feed runs): the
            # pages already hold exactly this.
            return
        self._last_view = payload
        self._notify(_LIVE_LISTENERS, payload)

    def _tower_patch(self, rows: list[dict[str, Any]]) -> dict[str, Any] | None:
        """The rows that differ from those last sent, compared by value, and the
        whole order; None when neither changed."""
        previous = self._tower_sent
        order = [row["number"] for row in rows]
        changed = {
            row["number"]: row for row in rows if previous.get(row["number"]) != row
        }
        self._tower_sent = {row["number"]: row for row in rows}
        if not changed and order == list(previous):
            return None
        return {"order": order, "rows": changed}

    def publish_full(self) -> None:
        """Everything again: settings, pause, a window, the final view changed."""
        self._send_view(full=True)

    def _broadcast_map(self, *, full: bool = False) -> None:
        """The cars to the open maps; nothing is projected or encoded while no
        page watches the map (SPEC §5.4). A new map page gets its own full
        message."""
        if _listeners(self.hass, _MAP_LISTENERS):
            self._notify_map(self.map_payload(broadcast=True, full=full))

    def map_payload(self, *, broadcast: bool, full: bool = False) -> bytes:
        """The cars, projected once for every open page; the outline only when it
        is new to them (`broadcast`) or to the one page that just subscribed."""
        live = self.live
        if live is None or live_hidden(self.settings) or live.health == "lost":
            if broadcast:
                self._map_rev_sent = -1
            return json_bytes({"full": True, "outline": None, "cars": [], "utc": None})
        outline = live.outline
        cars = []
        drivers = live.state.get("DriverList")
        # Only the session's cars: F1's position feed also carries entries for
        # cars that are not racing (reserve numbers, a car already withdrawn).
        entered = set(drivers) if isinstance(drivers, dict) and drivers else None
        if outline is not None:
            for number, pos in live.state.positions.items():
                if entered is not None and number not in entered:
                    continue
                x, y = outline.project(pos.x, pos.y)
                cars.append(
                    {"number": number, "x": x, "y": y, "on_track": pos.on_track}
                )
        message: dict[str, Any] = {"cars": cars, "utc": live.state.positions_utc}
        if full or live.outline_rev != self._map_rev_sent:
            message["full"] = True
            message["outline"] = outline.to_dict() if outline else None
            if broadcast:
                self._map_rev_sent = live.outline_rev
        else:
            message["full"] = False
        return json_bytes(message)

    # Track outline (SPEC §6.5).

    def _ensure_outline(self, live: LiveSession) -> None:
        if not live.client.authenticated or live.archive_outline is not None:
            return
        circuit = header(live.state.topics, dt_util.utcnow()).get("circuit_key")
        if circuit is None:
            return
        live.archive_outline = self.entry.async_create_background_task(
            self.hass, self._async_load_outline(live, circuit), f"{DOMAIN} outline"
        )

    async def _async_load_outline(self, live: LiveSession, circuit: int) -> None:
        try:
            outline = await self.archive.outline(circuit, dt_util.utcnow())
        except (SourceError, OSError) as err:
            _LOGGER.debug("No archived outline for circuit %s: %s", circuit, err)
            return
        if outline is not None and outline.points:
            self._set_outline(live, outline)

    def _set_outline(self, live: LiveSession, outline: Outline) -> None:
        live.outline = outline
        live.outline_rev += 1
        live.map_dirty = True
        if outline.points:
            live.live_samples = []  # no longer needed

    def _collect_outline_samples(
        self, live: LiveSession, samples: list[Sample]
    ) -> None:
        """A circuit with no archived session is drawn from live positions, tried
        again every 30 s until a lap closes; meanwhile the cars show on a
        provisional projection."""
        if live.outline is not None and live.outline.points:
            return
        live.live_samples.extend(samples)
        if len(live.live_samples) > LIVE_OUTLINE_SAMPLES:
            del live.live_samples[: len(live.live_samples) - LIVE_OUTLINE_SAMPLES]
        now = time.monotonic()
        if live.outline is None or now >= live.next_provisional:
            # The first positions (cars in the garage, on the grid) cover a corner
            # of the circuit: refitted every few seconds while the cars spread
            # out, until a real outline exists.
            fitted = provisional(live.live_samples)
            if fitted is not None:
                live.next_provisional = now + PROVISIONAL_EVERY
                if live.outline is None or fitted.to_dict() != live.outline.to_dict():
                    self._set_outline(live, fitted)
        # Drawn from live positions only once the archive has no outline to give.
        archive = live.archive_outline
        if archive is None or not archive.done():
            return
        if live.outline_task is not None and not live.outline_task.done():
            return
        if now < live.next_outline_try:
            return
        live.next_outline_try = now + LIVE_OUTLINE_RETRY
        live.outline_task = self.entry.async_create_background_task(
            self.hass,
            self._async_live_outline(live, list(live.live_samples)),
            f"{DOMAIN} live outline",
        )

    async def _async_live_outline(
        self, live: LiveSession, samples: list[Sample]
    ) -> None:
        outline = await self.hass.async_add_executor_job(build_outline, samples)
        if outline is not None:
            self._set_outline(live, outline)

    # The final view (SPEC §7.1).

    def last_finished_session(self) -> Session | None:
        now = dt_util.utcnow()
        done = [
            s
            for m in self.meetings
            for s in m.sessions
            if s.start is not None
            and (end := s.end) is not None
            and end + CLOSE_AFTER_FINAL <= now
        ]
        return max(done, key=lambda s: s.start or now) if done else None

    @callback
    def ensure_final(self) -> None:
        """A page opened the Live tab outside a session: make sure the last
        session's final state is there, from memory if it was followed live, else
        from F1's archive (downloaded once, cached)."""
        if self.live is not None or self._stopped:
            return
        session = self.last_finished_session()
        if session is None or (self.final and self.final.key == session.key):
            return
        final = self.final
        if final is not None and (
            final.start is None
            or (session.start is not None and session.start <= final.start)
        ):
            # What is shown is as recent or more (a race that ended early, a
            # pause during a session): never swap it for an older session.
            return
        if self._final_task is not None and not self._final_task.done():
            return
        missing = self._final_missing
        if (
            missing is not None
            and missing[0] == session.key
            and time.monotonic() - missing[1] < FINAL_RETRY
        ):
            return
        self._final_task = self.entry.async_create_background_task(
            self.hass, self._async_load_final(session), f"{DOMAIN} final view"
        )

    async def _async_load_final(self, session: Session) -> None:
        try:
            final = await self.archive.final_state(self.meetings, session)
        except (SourceError, OSError) as err:
            _LOGGER.debug("No final state for %s yet: %s", session.key, err)
            final = None
        if not final:
            self._final_missing = (session.key, time.monotonic())
            return
        if self._stopped or self.live is not None:
            return
        state = LiveState()
        state.apply_keyframes(final.get("topics") or {})
        for payload in final.get("pit_stream") or []:
            state.apply("PitLaneTimeCollection", payload)
        if not state.topics:
            return
        self.final = FinalView(session.key, state, session.end, session.start)
        self.publish_full()

    # The session summary (decision 53).

    async def _summary_texts(self) -> dict[str, str]:
        from homeassistant.helpers.translation import async_get_translations

        translations = await async_get_translations(
            self.hass, self.hass.config.language, "selector", {DOMAIN}
        )
        prefix = f"component.{DOMAIN}.selector.summary.options."
        return {
            key.removeprefix(prefix): value
            for key, value in translations.items()
            if key.startswith(prefix)
        }

    def _summary_of(self, state: LiveState, builder: LiveViewBuilder) -> dict[str, Any]:
        sections = builder.sections(state, dt_util.utcnow())
        return session_summary.build(
            sections["header"][1],
            sections["tower"][1],
            sections["stewards"][1],
            self.settings.favourites,
        )

    async def _async_summarise(self, live: LiveSession) -> None:
        """Once per session, when it is finalised: to the chosen notify services
        and to the summary event. Held back while no-spoiler mode hides it."""
        key = (
            live.session.key
            if live.session
            else f"feed-{_session_key(live.state.topics)}"
        )
        facts = self._summary_of(live.state, live.builder)
        kind = (
            "practice" if str(facts["kind"]).startswith("practice") else facts["kind"]
        )
        if kind not in self.settings.summary_kinds:
            return
        if key in self.store.summaries_sent:
            return
        title, message = session_summary.render(
            facts,
            await self._summary_texts(),
            full=self.settings.summary_format == "full",
        )
        record = {"key": key, "title": title, "message": message, "facts": facts}
        self.store.summaries_sent = [*self.store.summaries_sent, key][-30:]
        if self._summary_hidden(key):
            self.store.pending_summaries = [
                *[p for p in self.store.pending_summaries if p.get("key") != key],
                record,
            ][-10:]
            await self.store.async_save()
            return
        await self.store.async_save()
        self._deliver_later(record)

    def _summary_hidden(self, key: str | None) -> bool:
        """Hidden exactly like the session on the Results page (SPEC §9)."""
        if not self.settings.no_spoiler:
            return False
        if key is None or key.startswith("feed-") or not self.meetings:
            return True  # not a session of the calendar: fail closed (INV-5)
        return key in hidden_sessions(self.settings, self.meetings, dt_util.utcnow())

    def _deliver_later(self, record: dict[str, Any]) -> None:
        """Off the caller's path: a slow phone never holds up a reply."""
        if self._stopped:
            return
        self.entry.async_create_background_task(
            self.hass, self._async_deliver(record), f"{DOMAIN} summary delivery"
        )

    @callback
    def release_summaries(self) -> None:
        """Held summaries whose session is no longer hidden: revealed, no-spoiler
        switched off, or the next weekend begun. Called on each change of settings
        and on the 30 s tick."""
        pending = self.store.pending_summaries
        if not pending or self._stopped:
            return
        ready = [p for p in pending if not self._summary_hidden(p.get("key"))]
        if not ready:
            return
        self.store.pending_summaries = [p for p in pending if p not in ready]
        self.hass.async_create_task(self.store.async_save())
        for record in ready:
            self._deliver_later(record)

    async def _async_deliver(self, record: dict[str, Any], event: bool = True) -> None:
        if event:
            async_dispatcher_send(self.hass, SIGNAL_SUMMARY, record)
        for target in self.settings.notify_targets:
            if not self.hass.services.has_service("notify", target):
                _LOGGER.warning("Summary not sent: notify.%s does not exist", target)
                continue
            try:
                await self.hass.services.async_call(
                    "notify",
                    target,
                    {"title": record["title"], "message": record["message"]},
                    blocking=True,
                )
            except Exception as err:  # a phone offline must not stop the others
                _LOGGER.warning("Summary not sent to notify.%s: %s", target, err)

    async def async_send_test_summary(self) -> str:
        """From Settings: the summary of what the Live page shows, sent now to
        the notify services only (not the event: automations would take it for a
        real one), and never while no-spoiler mode hides the Live page."""
        if self._live_page_hidden():
            return "hidden"
        source = self.live or self.final
        if source is None or not source.state.topics:
            return "nothing"
        facts = self._summary_of(source.state, source.builder)
        title, message = session_summary.render(
            facts,
            await self._summary_texts(),
            full=self.settings.summary_format == "full",
        )
        await self._async_deliver(
            {"key": None, "title": title, "message": message, "facts": facts},
            event=False,
        )
        return "sent"

    def _live_page_hidden(self) -> bool:
        return self._view_parts()[0]["state"] == "hidden"

    # The panel's listeners.

    def _notify(self, key: str, payload: bytes) -> None:
        for listener in list(_listeners(self.hass, key)):
            try:
                listener(payload)
            except Exception:
                _LOGGER.exception("A live listener failed")

    def _notify_map(self, payload: bytes) -> None:
        self._notify(_MAP_LISTENERS, payload)

    # F1TV (SPEC §4.5).

    def _evaluate_token(self) -> TokenStatus:
        return evaluate(self.entry.data.get(DATA_F1TV_TOKEN), dt_util.utcnow())

    async def _async_f1tv_timer(self, _now: datetime) -> None:
        await self._async_check_f1tv()

    async def _async_check_f1tv(self) -> None:
        if self._token_refused or self._stopped:
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

    async def async_set_token(self, token: str | None) -> None:
        """Save or remove the token (Settings page, options flow); INV-3: it is
        stored in the config entry and never sent back."""
        data = {k: v for k, v in self.entry.data.items() if k != DATA_F1TV_TOKEN}
        if token:
            data[DATA_F1TV_TOKEN] = token
        self.hass.config_entries.async_update_entry(self.entry, data=data)
        await self.async_token_changed()

    async def async_token_changed(self) -> None:
        """A token was saved or removed: re-evaluate, and reconnect so the new
        token (or its absence) takes effect."""
        self._token_refused = False
        self.f1tv = self._evaluate_token()
        ir.async_delete_issue(self.hass, DOMAIN, ISSUE_F1TV)
        async with self._lock:
            if self.live is not None and not self._stopped:
                meeting, session = self.live.meeting, self.live.session
                await self._async_stop_live(counts_as_window=False)
                await self._async_start_live(meeting, session)
        async_dispatcher_send(self.hass, SIGNAL_SETTINGS)
        self.publish_full()

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
            "failed_windows": self.store.failed_windows,
            "done_sessions": sorted(self._done_sessions),
            "final": self.final.key if self.final else None,
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


type _ViewParts = tuple[dict[str, Any], dict[str, tuple[Any, Any]] | None]


def _assemble(
    meta: dict[str, Any], sections: dict[str, tuple[Any, Any]] | None
) -> dict[str, Any]:
    """A complete view: the meta and every section's value."""
    view = {**meta, "full": True}
    for name, (_, value) in (sections or {}).items():
        view[name] = value
    return view


def _same_window(
    live: LiveSession, wanted: tuple[Meeting | None, Session | None]
) -> bool:
    if wanted[1] is None:
        return live.session is None
    return live.session is not None and live.session.key == wanted[1].key


def _brief(record: dict[str, Any]) -> dict[str, Any]:
    """A decision as an entity attribute: small and stable."""
    return {
        "kind": record["kind"],
        "status": record.get("status"),
        "drivers": [c["tla"] for c in record["cars"]],
        "numbers": [c["number"] for c in record["cars"]],
        "seconds": record.get("seconds"),
        "reason": record.get("reason"),
        "lap": record.get("lap"),
        "served": record.get("served"),
    }


def _session_key(topics: dict[str, Any]) -> int | None:
    info = topics.get("SessionInfo")
    return to_int(info.get("Key")) if isinstance(info, dict) else None
