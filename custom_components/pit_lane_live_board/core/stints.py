"""A driver's stints, rebuilt from what F1 gets right (decision 61).

F1's `TimingAppData.Stints` cannot be read as it stands. Seen in the 2026 Bahrain
race: when F1 drops or inserts a stint it shifts the entries by sending only the
fields that changed — compound and laps — so each entry's best lap (`LapTime`,
`LapNumber`) stays behind on the wrong tyre; a pit stop shows an `UNKNOWN` tyre
for a moment, phantom entries of 0 or 1 lap come and stay, and a first stint
counted 1, then 3, then 0 laps. The laps of the entries do not even add up to
the race (52 of 55 for Leclerc). Summing them from lap 1 put every stint in the
wrong place.

Two things in the feed are right: the lap of every pit stop
(`PitLaneTimeCollection`, its in-lap) and the lap of a best lap (`LapNumber` is
the race lap, only attached to the wrong entry). So:

- the stints' boundaries are the pit stops: a stint ends on the lap its stop
  was made, the next starts on the lap after;
- F1's entries are matched to those stints in order by their lap counts, which
  drops phantoms (a stint with no stop around it) and stops that changed no tyre
  (a drive-through);
- when that does not fit — stops not seen, as after joining a race halfway —
  the stints are counted back from the driver's current lap, each boundary
  snapped to a stop seen within two laps;
- each best lap goes to the stint whose laps contain it.
"""

from __future__ import annotations

from dataclasses import dataclass
from itertools import combinations
from typing import Any

from .values import text, to_bool, to_int

COMPOUNDS = frozenset({"soft", "medium", "hard", "intermediate", "wet"})
# How far a counted boundary may move to meet a stop that was seen.
SNAP = 2
# Above this many ways to match entries and stops, the count back is used.
MAX_TRIES = 5000


@dataclass(frozen=True)
class Entry:
    compound: str
    new: bool
    start_age: int  # laps the set had before the stint (StartLaps)
    total: int  # laps the set has now (TotalLaps)

    @property
    def driven(self) -> int:
        return max(0, self.total - self.start_age)


def _compound(value: Any) -> str:
    name = str(value or "").lower()
    return name if name in COMPOUNDS else "unknown"


def raw_stints(value: Any) -> list[dict[str, Any]]:
    """F1's entries in their order, from a list or an index-keyed dict."""
    if isinstance(value, dict):
        keys = [k for k in value if to_int(k) is not None]
        value = [value[k] for k in sorted(keys, key=lambda k: to_int(k) or 0)]
    if not isinstance(value, list):
        return []
    return [s for s in value if isinstance(s, dict)]


def _seconds(lap_time: str) -> float | None:
    minutes, _, seconds = lap_time.rpartition(":")
    try:
        return (int(minutes) * 60 if minutes else 0) + float(seconds)
    except ValueError:
        return None


def _entries(raw: list[dict[str, Any]]) -> list[Entry]:
    entries = [
        Entry(
            compound=_compound(s.get("Compound")),
            new=to_bool(s.get("New")),
            start_age=to_int(s.get("StartLaps")) or 0,
            total=to_int(s.get("TotalLaps")) or 0,
        )
        for s in raw
    ]
    # An unknown tyre is F1's placeholder while a car is in the pits; it is kept
    # only when nothing else is known.
    known = [e for e in entries if e.compound != "unknown"]
    return known or entries


def _bests(raw: list[dict[str, Any]]) -> list[tuple[float, str, int]]:
    """Every best lap F1 still carries, wherever it was left: (seconds, time, lap)."""
    out = set()
    for s in raw:
        lap_time, lap = text(s.get("LapTime")), to_int(s.get("LapNumber"))
        if lap_time and lap and (seconds := _seconds(lap_time)) is not None:
            out.add((seconds, lap_time, lap))
    return sorted(out)


def _segments(pits: list[int], done: int) -> list[tuple[int, int]]:
    """(first, last) lap of each stint between the stops; the last one runs to
    the laps completed, and may not have a lap yet (last < first)."""
    bounds = [p for p in pits if 1 <= p <= done]
    out, first = [], 1
    for pit in bounds:
        out.append((first, pit))
        first = pit + 1
    out.append((first, done))
    return out


def _length(segment: tuple[int, int]) -> int:
    return max(0, segment[1] - segment[0] + 1)


def _matched(
    entries: list[Entry], pits: list[int], done: int
) -> list[tuple[Entry, tuple[int, int]]] | None:
    """Entries matched to the stints between the stops, or None when no
    matching fits well enough to trust."""
    segments = _segments(pits, done)
    # (laps that do not fit, laps of the entries dropped): the first decides;
    # the second only between equals, so a phantom goes before a real stint.
    best: tuple[tuple[int, int], list[tuple[Entry, tuple[int, int]]]] | None = None
    if len(entries) >= len(segments):
        # Drop entries: phantoms, and what F1 left behind when it shifted them.
        ways = combinations(range(len(entries)), len(segments))
        for tries, keep in enumerate(ways):
            if tries > MAX_TRIES:
                return None
            kept = [entries[i] for i in keep]
            cost = (
                sum(
                    abs(e.driven - _length(s))
                    for e, s in zip(kept, segments, strict=True)
                ),
                sum(e.driven for i, e in enumerate(entries) if i not in keep),
            )
            if best is None or cost < best[0]:
                best = (cost, list(zip(kept, segments, strict=True)))
    else:
        # Drop stops: a drive-through or a stop that changed no tyre.
        inner = [p for p in pits if 1 <= p <= done]
        ways = combinations(range(len(inner)), len(entries) - 1)
        for tries, keep in enumerate(ways):
            if tries > MAX_TRIES:
                return None
            kept_segments = _segments([inner[i] for i in keep], done)
            cost = (
                sum(
                    abs(e.driven - _length(s))
                    for e, s in zip(entries, kept_segments, strict=True)
                ),
                0,
            )
            if best is None or cost < best[0]:
                best = (cost, list(zip(entries, kept_segments, strict=True)))
    if best is None or best[0][0] > max(3, len(segments)):
        return None
    return best[1]


def _counted_back(
    entries: list[Entry], pits: list[int], done: int
) -> list[tuple[Entry, tuple[int, int]]]:
    """Stints counted back from the current lap, each boundary snapped to a
    stop seen within SNAP laps; the first stint starts on lap 1."""
    out: list[tuple[Entry, tuple[int, int]]] = []
    last = done
    for index in range(len(entries) - 1, -1, -1):
        entry = entries[index]
        if index == 0:
            first = 1
        else:
            first = last - entry.driven + 1
            near = [p for p in pits if abs((p + 1) - first) <= SNAP and p < last]
            if near:
                first = min(near, key=lambda p: abs((p + 1) - first)) + 1
            first = max(first, 2)
        out.append((entry, (first, last)))
        last = first - 1
    out.reverse()
    # Earlier stints squeezed out by a count that ran past lap 1 keep no laps.
    return out


def build(
    raw_value: Any, pits: list[int] | None, done: int | None
) -> list[dict[str, Any]]:
    """The stints: compound, whether the set was new, its laps before the stint,
    the first and last lap (None while it has none), the laps, and the best."""
    raw = raw_stints(raw_value)
    entries = _entries(raw)
    if not entries:
        return []
    stops = sorted({p for p in pits or [] if isinstance(p, int)})
    done = done if isinstance(done, int) and done >= 0 else None
    if done is None:
        # No lap count: the order of F1's entries is all there is.
        done = sum(e.driven for e in entries)
    # Without a stop seen (practice, or a feed joined late) there is nothing
    # to place the stints by but their own counts.
    matched = (_matched(entries, stops, done) if stops else None) or _counted_back(
        entries, stops, done
    )
    bests = _bests(raw)
    out = []
    for entry, (first, last) in matched:
        laps = max(0, last - first + 1)
        inside = [b for b in bests if laps and first <= b[2] <= last]
        best = min(inside) if inside else None
        out.append(
            {
                "compound": entry.compound,
                "new": entry.new,
                "start_age": entry.start_age,
                "from_lap": first,
                "to_lap": last if laps else None,
                "laps": laps,
                "best": {"time": best[1], "lap": best[2]} if best else None,
            }
        )
    return out


def pit_laps(pit_log: list[dict[str, Any]]) -> dict[str, list[int]]:
    """Racing number → the laps of its pit stops, from a pit log."""
    out: dict[str, list[int]] = {}
    for stop in pit_log:
        lap = to_int(stop.get("lap"))
        if lap is not None:
            out.setdefault(str(stop.get("number")), []).append(lap)
    return out
