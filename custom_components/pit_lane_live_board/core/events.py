"""Automation events derived from state transitions (SPEC §10.2, §10.3).

`derive` compares what was last seen (the marks, persisted by the caller) with the
current released state and returns the events to fire plus the new marks. Rules:

* one event per transition, never one per message;
* the first observation of a session only records, never fires: connecting in the
  middle of a race must not announce a safety car that came out ten minutes ago;
* marks belong to one session: a new session key starts clean;
* because marks survive restarts, a reconnect never fires an event twice;
* a session starts once and ends once: a restart after a red flag is not a new
  start, and qualifying ends after its last part (or when F1 finalises it, which
  also covers a session abandoned under a red flag), not after Q1. The chequered
  flag, from race control, is shown at the end of every part and fires each time.
"""

from __future__ import annotations

from typing import Any

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
    """The raw messages, newest first, compared on the flag alone: this runs at
    every publish and must not build the whole race control view."""
    rcm = topics.get("RaceControlMessages")
    messages = rcm.get("Messages") if isinstance(rcm, dict) else None
    if isinstance(messages, dict):
        messages = list(messages.values())
    for message in reversed(messages if isinstance(messages, list) else []):
        if (
            isinstance(message, dict)
            and str(message.get("Flag") or "").upper() == "CHEQUERED"
        ):
            return str(message.get("Utc") or "seen")
    return ""


def _is_end(status: str, topics: dict[str, Any]) -> bool:
    """Whether this status ends the whole session: finalised always; finished
    unless more parts follow (qualifying: `SessionPart` below the number of parts,
    from `NoEntries`)."""
    if status == "finalised":
        return True
    if status != "finished":
        return False
    timing = topics.get("TimingData")
    if not isinstance(timing, dict):
        return True
    part = to_int(timing.get("SessionPart"))
    parts = timing.get("NoEntries")
    if part is None or not isinstance(parts, (list, dict)):
        return True
    return part >= len(parts)


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
        # Marks written before these two existed: a session already under way.
        started = marks.get("started", marks.get("session") not in (None, "inactive"))
        ended = marks.get("ended", marks.get("session") == "finalised")
        if "session" not in marks:
            ended = _is_end(status, topics)
        elif status != marks["session"]:
            if status == "started" and not started:
                events.append("session_started")
            # On the change of status only: F1 moves `SessionPart` on while the
            # previous part is still Finished.
            if not ended and _is_end(status, topics):
                events.append("session_ended")
                ended = True
        new["session"] = status
        new["started"] = started or status != "inactive"
        new["ended"] = ended

    # As the track status sensor reads it (a red flag lasts while the session is
    # stopped), except the chequered flag: that has its own event from race
    # control, and after it the track codes are no news.
    track = track_status(topics.get("TrackStatus"), status)
    if track is not None and track != "chequered":
        if "track" in marks and marks["track"] != track:
            events.append(_TRACK_EVENTS[track])
        new["track"] = track

    chequered = _last_chequered(topics)
    if "chequered" in marks and chequered and marks["chequered"] != chequered:
        events.append("chequered_flag")
    new["chequered"] = chequered

    return events, new
