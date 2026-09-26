"""Automation events derived from state transitions (SPEC §10.2, §10.3).

`derive` compares what was last seen (the marks, persisted by the caller) with the
current released state and returns the events to fire plus the new marks. Rules:

* one event per transition, never one per message;
* the first observation of a session only records, never fires: connecting in the
  middle of a race must not announce a safety car that came out ten minutes ago;
* marks belong to one session: a new session key starts clean;
* because marks survive restarts, a reconnect never fires an event twice.
"""

from __future__ import annotations

from typing import Any

from .panels import race_control
from .session import session_status, track_status
from .values import to_int

EVENT_TYPES = (
    "green_flag",
    "yellow_flag",
    "safety_car",
    "virtual_safety_car",
    "vsc_ending",
    "red_flag",
    "chequered_flag",
    "session_started",
    "session_ended",
)
_TRACK_EVENTS = {
    "clear": "green_flag",
    "yellow": "yellow_flag",
    "safety_car": "safety_car",
    "virtual_safety_car": "virtual_safety_car",
    "vsc_ending": "vsc_ending",
    "red_flag": "red_flag",
}


def _session_key(topics: dict[str, Any]) -> int | None:
    info = topics.get("SessionInfo")
    return to_int(info.get("Key")) if isinstance(info, dict) else None


def _last_chequered(topics: dict[str, Any]) -> str:
    for message in race_control(topics):  # newest first
        if str(message.get("flag") or "").upper() == "CHEQUERED":
            return message.get("utc") or "seen"
    return ""


def derive(
    marks: dict[str, Any], topics: dict[str, Any]
) -> tuple[list[str], dict[str, Any]]:
    key = _session_key(topics)
    if key is None:
        return [], marks
    if marks.get("session_key") != key:
        marks = {"session_key": key}
    new = dict(marks)
    events: list[str] = []

    status = session_status(topics.get("SessionStatus"))
    if status is not None:
        if "session" in marks and marks["session"] != status:
            if status == "started":
                events.append("session_started")
            elif status == "finished" and marks["session"] not in (
                "finished",
                "finalised",
            ):
                events.append("session_ended")
        new["session"] = status

    # The track code alone, without the chequered override: the flag has its own
    # event from race control.
    track = track_status(topics.get("TrackStatus"), None)
    if track is not None:
        if "track" in marks and marks["track"] != track:
            events.append(_TRACK_EVENTS[track])
        new["track"] = track

    chequered = _last_chequered(topics)
    if "chequered" in marks and chequered and marks["chequered"] != chequered:
        events.append("chequered_flag")
    new["chequered"] = chequered

    return events, new
