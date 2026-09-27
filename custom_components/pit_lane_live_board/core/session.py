"""What kind of session this is, and its status (SPEC §6.4, §10.2)."""

from __future__ import annotations

from enum import StrEnum
from typing import Any


class SessionKind(StrEnum):
    PRACTICE = "practice"
    QUALIFYING = "qualifying"
    SPRINT_QUALIFYING = "sprint_qualifying"
    SPRINT = "sprint"
    RACE = "race"


RACE_LIKE = frozenset({SessionKind.RACE, SessionKind.SPRINT})
QUALIFYING_LIKE = frozenset({SessionKind.QUALIFYING, SessionKind.SPRINT_QUALIFYING})

SESSION_STATUSES = ("inactive", "started", "aborted", "finished", "finalised")
TRACK_STATUSES = (
    "clear",
    "yellow",
    "safety_car",
    "virtual_safety_car",
    "vsc_ending",
    "red_flag",
    "chequered",
)
_TRACK_CODES = {
    "1": "clear",
    "2": "yellow",
    "4": "safety_car",
    "5": "red_flag",
    "6": "virtual_safety_car",
    "7": "vsc_ending",
}
_SESSION_STATUS = {
    "inactive": "inactive",
    "started": "started",
    "aborted": "aborted",
    "finished": "finished",
    "finalised": "finalised",
    "ends": "finalised",
}


def session_kind(info: Any) -> SessionKind:
    """From `SessionInfo` (`Type` and `Name`); unknown sessions count as practice,
    which shows best laps and never claims a race order."""
    if not isinstance(info, dict):
        return SessionKind.PRACTICE
    kind = str(info.get("Type") or "").lower()
    name = str(info.get("Name") or "").lower()
    if kind == "race":
        return SessionKind.SPRINT if "sprint" in name else SessionKind.RACE
    if kind == "qualifying":
        if "sprint" in name or "shootout" in name:
            return SessionKind.SPRINT_QUALIFYING
        return SessionKind.QUALIFYING
    return SessionKind.PRACTICE


def session_status(value: Any) -> str | None:
    """`SessionStatus.Status` → one of SESSION_STATUSES, or None when unknown."""
    if not isinstance(value, dict):
        return None
    return _SESSION_STATUS.get(str(value.get("Status") or "").lower())


def track_status(value: Any, status: str | None) -> str | None:
    """`TrackStatus.Status` code → one of TRACK_STATUSES.

    A finished session shows the chequered flag whatever the last code was. A
    session stopped by a red flag is `Aborted` until it restarts, while the track
    code goes back to AllClear as soon as the track is clear: the flag is still red.
    """
    if status in ("finished", "finalised"):
        return "chequered"
    if status == "aborted":
        return "red_flag"
    if not isinstance(value, dict):
        return None
    return _TRACK_CODES.get(str(value.get("Status") or ""))
