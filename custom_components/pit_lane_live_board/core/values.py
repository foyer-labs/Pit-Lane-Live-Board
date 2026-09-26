"""Reading F1's loosely typed values: numbers as strings, empty strings for "none"."""

from __future__ import annotations

from datetime import UTC, datetime
import re
from typing import Any

_HEX = re.compile(r"^#?([0-9A-Fa-f]{6})$")
_CLOCK = re.compile(r"^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$")
_LAP = re.compile(r"^(?:(\d+):)?(\d+)\.(\d+)$")


def text(value: Any) -> str | None:
    """A non-empty string, or None."""
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def to_int(value: Any) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.strip().lstrip("-").isdigit():
        return int(value.strip())
    return None


def to_float(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip())
        except ValueError:
            return None
    return None


def to_bool(value: Any) -> bool:
    """F1 sends booleans as true/false, "true"/"false", or "1"/"0"."""
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in ("true", "1")
    return False


def colour(value: Any) -> str | None:
    """`F47600` → `#F47600`; anything else → None."""
    if isinstance(value, str) and (match := _HEX.match(value.strip())):
        return f"#{match.group(1).upper()}"
    return None


def lap_ms(value: Any) -> int | None:
    """`1:36.680` or `29.428` → milliseconds."""
    raw = text(value)
    if raw is None:
        return None
    match = _LAP.match(raw.lstrip("+"))
    if match is None:
        return None
    minutes = int(match.group(1) or 0)
    seconds = int(match.group(2))
    fraction = (match.group(3) + "000")[:3]
    return (minutes * 60 + seconds) * 1000 + int(fraction)


def clock_seconds(value: Any) -> float | None:
    """`00:17:00` or `01:02:03.5` → seconds."""
    raw = text(value)
    if raw is None:
        return None
    match = _CLOCK.match(raw)
    if match is None:
        return None
    hours, minutes, seconds = (int(g) for g in match.groups()[:3])
    fraction = float(f"0.{match.group(4)}") if match.group(4) else 0.0
    return hours * 3600 + minutes * 60 + seconds + fraction


def parse_utc(value: Any) -> datetime | None:
    """An F1 timestamp (with or without `Z` and fraction) as an aware UTC datetime."""
    raw = text(value)
    if raw is None:
        return None
    raw = raw.replace("Z", "+00:00")
    # Python accepts at most 6 fraction digits; F1 sometimes sends 7.
    raw = re.sub(r"(\.\d{6})\d+", r"\1", raw)
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)
