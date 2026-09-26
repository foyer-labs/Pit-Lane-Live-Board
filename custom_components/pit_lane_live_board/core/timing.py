"""The timing tower view model (SPEC §7.1).

Derived from the merged live state; JSON-ready dicts, so the WebSocket layer only
serialises. Every field F1 might omit is optional: a missing value is `None`, never
a guess.
"""

from __future__ import annotations

from typing import Any

from .session import QUALIFYING_LIKE, RACE_LIKE, SessionKind, session_kind
from .values import colour, text, to_bool, to_int

COMPOUNDS = ("soft", "medium", "hard", "intermediate", "wet")


def _compound(value: Any) -> str:
    name = str(value or "").lower()
    return name if name in COMPOUNDS else "unknown"


def _timed(value: Any) -> dict[str, Any] | None:
    """A lap or sector time with its purple/green flags, or None when empty."""
    if not isinstance(value, dict):
        return None
    shown = text(value.get("Value"))
    previous = False
    if shown is None:
        # Between laps the current sector is blank and the last one sits in
        # PreviousValue: show it, marked, rather than an empty cell.
        shown = text(value.get("PreviousValue"))
        previous = shown is not None
    if shown is None:
        return None
    return {
        "time": shown,
        "personal_best": to_bool(value.get("PersonalFastest")) and not previous,
        "overall_best": to_bool(value.get("OverallFastest")) and not previous,
        "previous": previous,
    }


def _sectors(line: dict[str, Any]) -> list[dict[str, Any] | None]:
    sectors = line.get("Sectors")
    if isinstance(sectors, dict):
        sectors = [sectors.get(str(i)) for i in range(3)]
    if not isinstance(sectors, list):
        return [None, None, None]
    return [_timed(sectors[i]) if i < len(sectors) else None for i in range(3)]


def _tyre(app_line: Any) -> dict[str, Any] | None:
    if not isinstance(app_line, dict):
        return None
    stints = app_line.get("Stints")
    if isinstance(stints, dict):
        stints = [stints[k] for k in sorted(stints, key=lambda k: to_int(k) or 0)]
    if not isinstance(stints, list):
        return None
    stints = [s for s in stints if isinstance(s, dict)]
    if not stints:
        return None
    current = stints[-1]
    return {
        "compound": _compound(current.get("Compound")),
        "new": to_bool(current.get("New")),
        # TotalLaps counts the laps on this set, including those it had before
        # the stint (a used set starts above zero).
        "age": to_int(current.get("TotalLaps")) or 0,
        "stint": len(stints),
    }


def _name(driver: dict[str, Any]) -> str | None:
    first, last = text(driver.get("FirstName")), text(driver.get("LastName"))
    if first and last:
        return f"{first} {last}"
    return text(driver.get("FullName")) or text(driver.get("BroadcastName"))


def _status(line: dict[str, Any], kind: SessionKind) -> str:
    if to_bool(line.get("Retired")):
        return "retired"
    if to_bool(line.get("Stopped")):
        return "stopped"
    if kind in QUALIFYING_LIKE and to_bool(line.get("KnockedOut")):
        return "knocked_out"
    return "running"


def _qualifying(line: dict[str, Any], part: int) -> dict[str, Any]:
    bests = line.get("BestLapTimes")
    if isinstance(bests, dict):
        bests = [bests.get(str(i)) for i in range(3)]
    bests = bests if isinstance(bests, list) else []
    stats = line.get("Stats")
    if isinstance(stats, dict):
        stats = [stats.get(str(i)) for i in range(3)]
    stats = stats if isinstance(stats, list) else []

    part_bests = [
        text(bests[i].get("Value"))
        if i < len(bests) and isinstance(bests[i], dict)
        else None
        for i in range(3)
    ]
    # The part that counts for this driver: the current one, or the last part in
    # which they set a time if they were knocked out earlier.
    part = min(max(part, 1), 3)
    counting = part
    if not part_bests[part - 1]:
        set_parts = [i + 1 for i, v in enumerate(part_bests) if v]
        counting = set_parts[-1] if set_parts else part
    gap = None
    if counting <= len(stats) and isinstance(stats[counting - 1], dict):
        gap = text(stats[counting - 1].get("TimeDiffToFastest"))
    return {
        "part_bests": part_bests,
        "best": part_bests[counting - 1],
        "gap": gap,
        "cutoff": to_bool(line.get("Cutoff")),
    }


def build_tower(topics: dict[str, Any]) -> list[dict[str, Any]]:
    """One row per driver, ordered by position (drivers without one go last)."""
    timing = topics.get("TimingData")
    lines = timing.get("Lines") if isinstance(timing, dict) else None
    if not isinstance(lines, dict):
        return []
    drivers = topics.get("DriverList")
    drivers = drivers if isinstance(drivers, dict) else {}
    app = topics.get("TimingAppData")
    app_lines = app.get("Lines") if isinstance(app, dict) else None
    app_lines = app_lines if isinstance(app_lines, dict) else {}
    kind = session_kind(topics.get("SessionInfo"))
    part = to_int(timing.get("SessionPart")) or 1

    rows = []
    for number, line in lines.items():
        if not isinstance(line, dict):
            continue
        driver = drivers.get(number)
        driver = driver if isinstance(driver, dict) else {}
        position = to_int(line.get("Position"))
        interval = line.get("IntervalToPositionAhead")
        app_line = app_lines.get(number)
        grid = to_int(app_line.get("GridPos")) if isinstance(app_line, dict) else None
        best = line.get("BestLapTime")
        row: dict[str, Any] = {
            "number": str(number),
            "tla": text(driver.get("Tla")) or str(number),
            "name": _name(driver),
            "team": text(driver.get("TeamName")),
            "colour": colour(driver.get("TeamColour")),
            "position": position,
            "gap": text(line.get("GapToLeader")) or text(line.get("TimeDiffToFastest")),
            "interval": (
                text(interval.get("Value"))
                if isinstance(interval, dict)
                else text(line.get("TimeDiffToPositionAhead"))
            ),
            "catching": to_bool(interval.get("Catching"))
            if isinstance(interval, dict)
            else False,
            "last_lap": _timed(line.get("LastLapTime")),
            "best_lap": (
                {"time": text(best.get("Value")), "lap": to_int(best.get("Lap"))}
                if isinstance(best, dict) and text(best.get("Value"))
                else None
            ),
            "sectors": _sectors(line),
            "tyre": _tyre(app_line),
            "pit_stops": to_int(line.get("NumberOfPitStops")) or 0,
            "in_pit": to_bool(line.get("InPit")),
            "pit_out": to_bool(line.get("PitOut")),
            "laps": to_int(line.get("NumberOfLaps")),
            "grid": grid if grid else None,
            "gained": (
                grid - position if kind in RACE_LIKE and grid and position else None
            ),
            "status": _status(line, kind),
        }
        if kind in QUALIFYING_LIKE:
            row["qualifying"] = _qualifying(line, part)
        rows.append(row)

    rows.sort(key=lambda r: (r["position"] is None, r["position"] or 0, r["number"]))
    return rows
