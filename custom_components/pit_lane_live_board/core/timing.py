"""The timing tower view model (SPEC §7.1).

Derived from the merged live state; JSON-ready dicts, so the WebSocket layer only
serialises. Every field F1 might omit is optional: a missing value is `None`, never
a guess.
"""

from __future__ import annotations

from typing import Any

from . import stints as stints_core
from .session import (
    QUALIFYING_LIKE,
    RACE_LIKE,
    SessionKind,
    session_kind,
    session_status,
)
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


def _stints(
    app_line: Any, pits: list[int] | None, done: int | None
) -> list[dict[str, Any]]:
    """The driver's stints, rebuilt from the pit stops (core/stints.py), with
    the laps each set had before its stint (`start_age`)."""
    if not isinstance(app_line, dict):
        return []
    return stints_core.build(app_line.get("Stints"), pits, done)


# Mini-sector (segment) statuses in TimingData: F1's colours of each segment.
SEGMENT_STATUS = {2048: "y", 2049: "g", 2051: "p", 2064: "pit"}


def _segments(line: dict[str, Any]) -> list[list[str]]:
    """Per sector, the colour of each mini-sector of the current lap: `p` purple,
    `g` green, `y` yellow, `pit`, `o` another status, `` not run yet."""
    sectors = line.get("Sectors")
    if isinstance(sectors, dict):
        sectors = [sectors.get(str(i)) for i in range(3)]
    if not isinstance(sectors, list):
        return []
    out: list[list[str]] = []
    for sector in sectors[:3]:
        segments = sector.get("Segments") if isinstance(sector, dict) else None
        if isinstance(segments, dict):
            segments = [
                segments[k] for k in sorted(segments, key=lambda k: to_int(k) or 0)
            ]
        if not isinstance(segments, list):
            out.append([])
            continue
        colours = []
        for segment in segments:
            status = (
                to_int(segment.get("Status")) if isinstance(segment, dict) else None
            )
            colours.append(SEGMENT_STATUS.get(status or 0, "o" if status else ""))
        out.append(colours)
    return out


def _tyre(stints: list[dict[str, Any]]) -> dict[str, Any] | None:
    """The tyre on the car now: the last stint, with the laps the set has done."""
    if not stints:
        return None
    current = stints[-1]
    return {
        "compound": current["compound"],
        "new": current["new"],
        # The laps on this set: those it had before the stint, and the stint's.
        "age": current["start_age"] + current["laps"],
        "stint": len(stints),
    }


def _name(driver: dict[str, Any]) -> str | None:
    first, last = text(driver.get("FirstName")), text(driver.get("LastName"))
    if first and last:
        return f"{first} {last}"
    return text(driver.get("FullName")) or text(driver.get("BroadcastName"))


def _status(
    line: dict[str, Any], kind: SessionKind, classified_from: int | None
) -> str:
    """`retired`, `stopped`, `knocked_out` or `running`.

    In races and sprints F1's `Retired` is not the whole story: a car stopped for
    good may keep `Retired: false` with its position hidden (`ShowPosition:
    false`), and F1 can even turn `Retired` back off when the car is recovered to
    the pits. So a stopped car with a hidden position is out, and once the session
    is over so is every car short of the laps needed to be classified
    (`classified_from`).
    """
    if to_bool(line.get("Retired")):
        return "retired"
    if kind in RACE_LIKE:
        laps = to_int(line.get("NumberOfLaps")) or 0
        if classified_from is not None and laps < classified_from:
            return "retired"
        if to_bool(line.get("Stopped")) and line.get("ShowPosition") is False:
            return "retired"
    if to_bool(line.get("Stopped")):
        return "stopped"
    if kind in QUALIFYING_LIKE and to_bool(line.get("KnockedOut")):
        return "knocked_out"
    return "running"


def _classified_from(lines: dict[str, Any], status: str | None) -> int | None:
    """After a race or sprint, the laps a car needs to be classified: 90% of the
    winner's, rounded down (F1's rule). None while the session runs."""
    if status not in ("finished", "finalised"):
        return None
    leader = max(
        (
            to_int(line.get("NumberOfLaps")) or 0
            for line in lines.values()
            if isinstance(line, dict)
        ),
        default=0,
    )
    return int(leader * 0.9) if leader else None


def _drop_zone(position: int | None, part: int, entries: Any) -> bool:
    """Whether a position is in the knockout zone of this part: below the number
    of cars that go through to the next one (`NoEntries`, e.g. `[22, 16, 10]`).

    Not F1's `Cutoff`: that marks the cars with no time yet in this part, so at
    the end of Q1 it sits under P20 instead of P16.
    """
    if isinstance(entries, dict):
        entries = [entries[k] for k in sorted(entries, key=lambda k: to_int(k) or 0)]
    if position is None or not isinstance(entries, list) or part >= len(entries):
        return False
    going_through = to_int(entries[part])
    return going_through is not None and position > going_through


def _qualifying(
    line: dict[str, Any], part: int, position: int | None, entries: Any
) -> dict[str, Any]:
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
        "cutoff": _drop_zone(position, part, entries),
    }


def build_tower(
    topics: dict[str, Any], pits: dict[str, list[int]] | None = None
) -> list[dict[str, Any]]:
    """One row per driver, ordered by position (drivers without one go last).

    `pits`: racing number → the laps of its pit stops, which place the stints."""
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
    classified_from = (
        _classified_from(lines, session_status(topics.get("SessionStatus")))
        if kind in RACE_LIKE
        else None
    )

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
        laps = to_int(line.get("NumberOfLaps"))
        stints = _stints(app_line, (pits or {}).get(str(number)), laps)
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
            "tyre": _tyre(stints),
            "stints": [
                {k: v for k, v in stint.items() if k != "start_age"} for stint in stints
            ],
            "segments": _segments(line),
            "pit_stops": to_int(line.get("NumberOfPitStops")) or 0,
            "in_pit": to_bool(line.get("InPit")),
            "pit_out": to_bool(line.get("PitOut")),
            "laps": laps,
            "grid": grid if grid else None,
            "gained": (
                grid - position if kind in RACE_LIKE and grid and position else None
            ),
            "status": _status(line, kind, classified_from),
        }
        if kind in QUALIFYING_LIKE:
            row["qualifying"] = _qualifying(
                line, part, position, timing.get("NoEntries")
            )
        rows.append(row)

    rows.sort(key=lambda r: (r["position"] is None, r["position"] or 0, r["number"]))
    return rows
