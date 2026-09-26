"""The live page's payload (SPEC §7.1, §6.3, §8, §9).

The payload is split into sections. Each section is rebuilt only when a topic it
reads has changed (the state's versions), and the hub sends a section again only
when it changed: most of a race's publishes carry the tower alone (SPEC §5.5).

The `state` field tells the page which screen to draw:

* `idle`: no session to show (nothing run yet this season, or paused with none);
* `connecting`: inside a window, no data yet;
* `syncing`: data is held back by the TV delay;
* `live`, `stale` (no data for 30 s), `lost` (60 s): INV-2;
* `final`: the last session's final state, static, between sessions;
* `paused`: live timing is paused by the user; nothing connects;
* `hidden`: no-spoiler mode is on (INV-5): nothing else is sent.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from .live_state import PITS, LiveState
from .panels import header, race_control, team_radio, weather
from .session import session_status, track_status
from .stewards import StewardsBook, penalty_seconds
from .timing import build_tower
from .values import to_int

SECTIONS = ("header", "tower", "race_control", "stewards", "radio", "weather", "pits")

# The topics each section reads: its cache key.
_READS: dict[str, tuple[str, ...]] = {
    "tower": (
        "TimingData",
        "TimingAppData",
        "DriverList",
        "SessionInfo",
        "RaceControlMessages",
    ),
    "race_control": ("RaceControlMessages",),
    "stewards": ("RaceControlMessages", "TrackStatus", "SessionStatus"),
    "radio": ("TeamRadio", "SessionInfo"),
    "weather": ("WeatherData",),
    "pits": (PITS,),
}


def _messages(topics: dict[str, Any]) -> list[Any]:
    rcm = topics.get("RaceControlMessages")
    messages = rcm.get("Messages") if isinstance(rcm, dict) else None
    if isinstance(messages, dict):
        return [messages[k] for k in sorted(messages, key=lambda k: to_int(k) or 0)]
    return messages if isinstance(messages, list) else []


class LiveViewBuilder:
    """Builds and caches the sections for one `LiveState`.

    It also keeps the session's `StewardsBook`, fed with each new race control
    message once, so penalties and flags cost one parse per message.
    """

    def __init__(self) -> None:
        self._state: LiveState | None = None
        self._cache: dict[str, tuple[tuple[int, ...], Any]] = {}
        self.book = StewardsBook()

    def sync(self, state: LiveState) -> None:
        """Feed the book the messages it has not seen (also done by `sections`)."""
        self._sync(state)

    def _sync(self, state: LiveState) -> None:
        if state is not self._state:
            # A new state (a reconnect's keyframes): start the book and the cache
            # again from its messages.
            self._state = state
            self._cache.clear()
            self.book = StewardsBook()
        messages = _messages(state.topics)
        for message in messages[self.book.seen :]:
            if isinstance(message, dict):
                self.book.feed(message)
            else:
                self.book.seen += 1

    def _track(self, topics: dict[str, Any]) -> str | None:
        return track_status(
            topics.get("TrackStatus"), session_status(topics.get("SessionStatus"))
        )

    def _section(self, name: str, state: LiveState) -> tuple[tuple[int, ...], Any]:
        key = state.version(*_READS[name])
        cached = self._cache.get(name)
        if cached is not None and cached[0] == key:
            return cached
        topics = state.topics
        if name == "tower":
            value = build_tower(topics)
            penalties = penalty_seconds(self.book.summary(self._track(topics)))
            for row in value:
                row["penalty"] = penalties.get(row["number"])
        elif name == "race_control":
            value = race_control(topics)
        elif name == "stewards":
            value = self.book.summary(self._track(topics))
        elif name == "radio":
            value = team_radio(topics)
        elif name == "weather":
            value = weather(topics)
        else:
            value = list(reversed(state.pit_log))
        self._cache[name] = (key, value)
        return key, value

    def sections(self, state: LiveState, now: datetime) -> dict[str, tuple[Any, Any]]:
        """`{section: (version key, value)}`; the header is always rebuilt (its
        clock moves) and keyed by its own value."""
        self._sync(state)
        out: dict[str, tuple[Any, Any]] = {}
        head = header(state.topics, now)
        out["header"] = (repr(sorted(head.items())), head)
        for name in SECTIONS[1:]:
            out[name] = self._section(name, state)
        return out


def assemble(
    *,
    state_name: str,
    sections: dict[str, tuple[Any, Any]] | None,
    delay: int,
    next_session: dict[str, Any] | None,
    data_age: float | None,
    map_available: bool,
    map_reason: str,
    ended: str | None = None,
) -> dict[str, Any]:
    """The full payload: the screen, what always travels, and the sections."""
    view: dict[str, Any] = {
        "state": state_name,
        "delay": delay,
        "next_session": next_session,
        "data_age": round(data_age, 1) if data_age is not None else None,
        "map_available": map_available,
        "map_reason": map_reason,
        "ended": ended,
    }
    if sections:
        view.update({name: value for name, (_, value) in sections.items()})
    return view


def hidden_header(state: LiveState | None, now: datetime) -> dict[str, Any] | None:
    """Only the session's name: enough to say what is hidden, nothing more."""
    if state is None:
        return None
    session = header(state.topics, now)
    return {k: session[k] for k in ("meeting", "session", "kind")}


def build(
    *,
    state: LiveState | None,
    now: datetime,
    health: str,
    syncing: bool,
    hidden: bool,
    delay: int,
    next_session: dict[str, Any] | None,
    data_age: float | None,
    map_available: bool,
    map_reason: str = "not_configured",
    paused: bool = False,
    auto_start: bool = False,
    final: bool = False,
) -> dict[str, Any]:
    """One complete payload in a single call (tests, the bench), shaped like the
    hub's first message to a page."""
    common = {
        "delay": delay,
        "next_session": next_session,
        "data_age": data_age,
        "map_available": map_available,
        "map_reason": map_reason,
        "ended": now.isoformat() if final else None,
    }

    def done(view: dict[str, Any]) -> dict[str, Any]:
        return {**view, "full": True, "paused": paused, "auto_start": auto_start}

    if hidden:
        view = assemble(state_name="hidden", sections=None, **common)
        view["header"] = hidden_header(state, now)
        return done(view)
    if state is None:
        name = "paused" if paused else "idle"
        return done(assemble(state_name=name, sections=None, **common))
    if syncing:
        return done(assemble(state_name="syncing", sections=None, **common))
    if not state.topics:
        return done(assemble(state_name="connecting", sections=None, **common))
    sections = LiveViewBuilder().sections(state, now)
    name = "final" if final else "live" if health == "ok" else health
    return done(assemble(state_name=name, sections=sections, **common))
