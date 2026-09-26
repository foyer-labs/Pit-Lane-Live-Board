"""The live page around the timing tower: header, race control, weather, team radio
and pit stops (SPEC §7.1)."""

from __future__ import annotations

from datetime import datetime
import re
from typing import Any

from .session import session_kind, session_status, track_status
from .values import clock_seconds, parse_utc, text, to_bool, to_float, to_int

ARCHIVE_BASE = "https://livetiming.formula1.com/static/"

# Penalties have no structured feed: they are recognised in the stewards' text,
# best effort (SPEC §7.1). "NO FURTHER ACTION" and investigations are not penalties.
_PENALTY = re.compile(
    r"\b(TIME PENALTY|DRIVE[ -]THROUGH|STOP[ /-]AND[ /-]GO|STOP/GO|GRID PENALTY|"
    r"PENALTY SERVED|PENALTY POINT|\d+ SECOND PENALTY)\b"
)
_NOT_PENALTY = re.compile(r"\bNO (FURTHER ACTION|PENALTY)\b")
_FLAG_CATEGORIES = {"flag", "safetycar"}


def _items(value: Any) -> list[Any]:
    """A list that F1 may also send as a dict keyed by index."""
    if isinstance(value, list):
        return value
    if isinstance(value, dict):
        return [value[k] for k in sorted(value, key=lambda k: to_int(k) or 0)]
    return []


def _number(value: Any) -> str | None:
    """A racing number as a string; F1 sends it as a string or an int."""
    if isinstance(value, bool) or value in (None, ""):
        return None
    return str(value)


def message_kind(message: dict[str, Any]) -> str:
    """`flag`, `penalty` or `other`, for the race control filter."""
    body = str(message.get("Message") or "").upper()
    if str(message.get("Category") or "").lower() in _FLAG_CATEGORIES:
        return "flag"
    if _PENALTY.search(body) and not _NOT_PENALTY.search(body):
        return "penalty"
    return "other"


def race_control(topics: dict[str, Any]) -> list[dict[str, Any]]:
    """Messages, newest first."""
    rcm = topics.get("RaceControlMessages")
    messages = _items(rcm.get("Messages")) if isinstance(rcm, dict) else []
    out = []
    for m in messages:
        if not isinstance(m, dict) or not text(m.get("Message")):
            continue
        out.append(
            {
                "utc": text(m.get("Utc")),
                "lap": to_int(m.get("Lap")),
                "category": text(m.get("Category")),
                "flag": text(m.get("Flag")),
                "scope": text(m.get("Scope")),
                "sector": to_int(m.get("Sector")),
                "number": _number(m.get("RacingNumber")),
                "message": text(m.get("Message")),
                "kind": message_kind(m),
            }
        )
    out.reverse()
    return out


def weather(topics: dict[str, Any]) -> dict[str, Any] | None:
    data = topics.get("WeatherData")
    if not isinstance(data, dict) or not data:
        return None
    return {
        "air": to_float(data.get("AirTemp")),
        "track": to_float(data.get("TrackTemp")),
        "humidity": to_float(data.get("Humidity")),
        "pressure": to_float(data.get("Pressure")),
        "wind_speed": to_float(data.get("WindSpeed")),
        "wind_direction": to_int(data.get("WindDirection")),
        "rain": to_bool(data.get("Rainfall")),
    }


def team_radio(topics: dict[str, Any]) -> list[dict[str, Any]]:
    """Clips, newest first, with the URL the browser plays directly (decision 17)."""
    info = topics.get("SessionInfo")
    path = text(info.get("Path")) if isinstance(info, dict) else None
    radio = topics.get("TeamRadio")
    captures = _items(radio.get("Captures")) if isinstance(radio, dict) else []
    out = []
    for c in captures:
        if not isinstance(c, dict) or not text(c.get("Path")) or path is None:
            continue
        out.append(
            {
                "utc": text(c.get("Utc")),
                "number": _number(c.get("RacingNumber")),
                "url": f"{ARCHIVE_BASE}{path}{c['Path']}",
            }
        )
    out.sort(key=lambda c: c["utc"] or "", reverse=True)
    return out


def remaining(topics: dict[str, Any], now: datetime) -> float | None:
    """Seconds left on the session clock at `now` (the delayed now, SPEC §8)."""
    clock = topics.get("ExtrapolatedClock")
    if not isinstance(clock, dict):
        return None
    left = clock_seconds(clock.get("Remaining"))
    if left is None:
        return None
    if to_bool(clock.get("Extrapolating")):
        since = parse_utc(clock.get("Utc"))
        if since is not None:
            left -= (now - since).total_seconds()
    return max(0.0, left)


def header(topics: dict[str, Any], now: datetime) -> dict[str, Any]:
    info = topics.get("SessionInfo")
    info = info if isinstance(info, dict) else {}
    meeting = info.get("Meeting") if isinstance(info.get("Meeting"), dict) else {}
    circuit = meeting.get("Circuit") if isinstance(meeting.get("Circuit"), dict) else {}
    country = meeting.get("Country") if isinstance(meeting.get("Country"), dict) else {}
    laps = topics.get("LapCount")
    laps = laps if isinstance(laps, dict) else {}
    timing = topics.get("TimingData")
    status = session_status(topics.get("SessionStatus"))
    return {
        "key": to_int(info.get("Key")),
        "meeting": text(meeting.get("Name")),
        "official_name": text(meeting.get("OfficialName")),
        "circuit": text(circuit.get("ShortName")),
        "circuit_key": to_int(circuit.get("Key")),
        "country": text(country.get("Name")),
        "session": text(info.get("Name")),
        "kind": str(session_kind(info)),
        "status": status,
        "track_status": track_status(topics.get("TrackStatus"), status),
        "lap": to_int(laps.get("CurrentLap")),
        "total_laps": to_int(laps.get("TotalLaps")),
        "part": to_int(timing.get("SessionPart")) if isinstance(timing, dict) else None,
        "remaining": remaining(topics, now),
    }
