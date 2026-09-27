"""Where a driver would rejoin if they pitted now (decision 51).

An estimate, and presented as one. What a stop costs is not the pit lane time F1
sends (that includes the stretch the car would have driven at racing speed anyway)
but the typical loss at this circuit, from public strategy figures, else 22 s;
under a safety car or a VSC the field is slower, so a stop costs less. The rejoin
position compares the driver's gap to the leader plus that loss with the gaps of
the cars on the same lap. Lapped cars and a leader without a gap are skipped:
their numbers do not add up.
"""

from __future__ import annotations

import re
from typing import Any

DEFAULT_PIT_LOSS = 22.0
# Typical time lost by a stop, in seconds, by Jolpica circuit id (approximate).
# Madring and Sepang (on the 2026 calendar, missing at first) from their races'
# in-lap plus out-lap against the laps around them: the 2026 Spanish GP's
# green-flag stops, and Jolpica's laps of the 2017 Malaysian GP.
CIRCUIT_PIT_LOSS: dict[str, float] = {
    "albert_park": 19.0,
    "americas": 21.0,
    "bahrain": 23.0,
    "baku": 20.0,
    "catalunya": 22.0,
    "hungaroring": 21.0,
    "imola": 26.0,
    "interlagos": 21.0,
    "jeddah": 20.0,
    "losail": 25.0,
    "madring": 25.0,
    "marina_bay": 29.0,
    "miami": 20.0,
    "monaco": 20.0,
    "monza": 24.0,
    "red_bull_ring": 21.0,
    "rodriguez": 22.0,
    "sepang": 22.0,
    "shanghai": 23.0,
    "silverstone": 20.0,
    "spa": 19.0,
    "suzuka": 22.0,
    "vegas": 20.0,
    "villeneuve": 18.0,
    "yas_marina": 22.0,
    "zandvoort": 20.0,
}
# The share of a normal stop's cost under a neutralisation (typical values).
NEUTRALISED = {"safety_car": 0.55, "virtual_safety_car": 0.65, "vsc_ending": 0.65}

_SECONDS = re.compile(r"^\+?(\d+(?:\.\d+)?)$")


def gap_seconds(gap: str | None, position: int | None) -> float | None:
    """`+12.345` → 12.345; the leader → 0; `1 L` and anything else → None."""
    if position == 1:
        return 0.0
    if not gap:
        return None
    found = _SECONDS.match(gap.strip())
    return float(found.group(1)) if found else None


def pit_loss(circuit_id: str | None, track: str | None) -> tuple[float, bool]:
    """`(seconds, known)`: the circuit's typical loss, or the generic one."""
    known = circuit_id in CIRCUIT_PIT_LOSS
    loss = CIRCUIT_PIT_LOSS.get(circuit_id or "", DEFAULT_PIT_LOSS)
    return round(loss * NEUTRALISED.get(track or "", 1.0), 1), known


def pit_rejoin(
    rows: list[dict[str, Any]], loss: float, known: bool
) -> dict[str, dict[str, Any]]:
    """Per racing number, the estimate for a stop now; drivers it cannot tell for
    (lapped, in the pits, out of the race) are left out."""
    running = [
        (row, gap_seconds(row.get("gap"), row.get("position")))
        for row in rows
        if row.get("status") == "running"
    ]
    timed = [(row, gap) for row, gap in running if gap is not None]
    # A car in the pit lane will come out about half a stop further back than
    # its gap says: it counts there, and the estimate says it is less certain.
    pitting = sum(1 for row, _ in timed if row.get("in_pit"))
    timed = [(row, gap + loss / 2 if row.get("in_pit") else gap) for row, gap in timed]
    out: dict[str, dict[str, Any]] = {}
    for row, gap in timed:
        if row.get("in_pit"):
            continue
        after = gap + loss
        others = [(o, g) for o, g in timed if o is not row]
        ahead = [(o, g) for o, g in others if g <= after]
        behind = [(o, g) for o, g in others if g > after]
        near_ahead = max(ahead, key=lambda item: item[1]) if ahead else None
        near_behind = min(behind, key=lambda item: item[1]) if behind else None
        out[row["number"]] = {
            "position": len(ahead) + 1,
            "ahead": near_ahead[0]["tla"] if near_ahead else None,
            "ahead_gap": round(after - near_ahead[1], 1) if near_ahead else None,
            "behind": near_behind[0]["tla"] if near_behind else None,
            "behind_gap": round(near_behind[1] - after, 1) if near_behind else None,
            "loss": loss,
            "known": known,
            "pitting": pitting,
        }
    return out
