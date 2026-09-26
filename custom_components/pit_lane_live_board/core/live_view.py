"""The live page's payload (SPEC §7.1, §6.3, §8, §9).

One function assembles everything the Live page shows from the released state, so
the WebSocket layer only sends it. The `state` field tells the page which screen
to draw:

* `idle`: no session window; show the next session;
* `connecting`: inside a window, no data yet;
* `syncing`: data is held back by the TV delay;
* `live`, `stale` (no message for 30 s), `lost` (60 s): INV-2;
* `hidden`: no-spoiler mode is on (INV-5): nothing else is sent.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from .live_state import LiveState
from .panels import header, race_control, team_radio, weather
from .timing import build_tower


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
) -> dict[str, Any]:
    base: dict[str, Any] = {"delay": delay, "next_session": next_session}
    if hidden:
        # Only the session's name: enough to say what is hidden, nothing more.
        session = header(state.topics, now) if state is not None else None
        return {
            **base,
            "state": "hidden",
            "header": (
                {k: session[k] for k in ("meeting", "session", "kind")}
                if session
                else None
            ),
        }
    if state is None:
        return {**base, "state": "idle"}
    if syncing:
        return {**base, "state": "syncing"}
    if not state.topics:
        return {**base, "state": "connecting"}
    topics = state.topics
    return {
        **base,
        "state": "live" if health == "ok" else health,
        "data_age": round(data_age, 1) if data_age is not None else None,
        "header": header(topics, now),
        "tower": build_tower(topics),
        "race_control": race_control(topics),
        "weather": weather(topics),
        "radio": team_radio(topics),
        "pits": list(reversed(state.pit_log)),
        "map_available": map_available,
    }
