"""A session's classification from F1's live timing, for the Results page (decision 63).

Jolpica publishes a weekend's results after the race, sometimes later; F1's archive
has each session 0-30 minutes after it ends. Until Jolpica has a session, its
Results tab is built from the archive's final state — the same tower the Live page
shows after a session — in the shape of Jolpica's rows, marked `provisional`: no
points, no driver ids, and the stewards may still change the order. Sprint
qualifying, which Jolpica does not carry at all, is always built this way, and is
not provisional: the archive is its only source.
"""

from __future__ import annotations

import re
from typing import Any

_OUT = ("retired", "stopped")
_LAPPED = re.compile(r"^\+?\s*(\d+)\s*L(?:APS?)?$", re.IGNORECASE)


def _seconds(lap_time: str | None) -> float | None:
    if not lap_time:
        return None
    minutes, _, seconds = lap_time.rpartition(":")
    try:
        return (int(minutes) * 60 if minutes else 0) + float(seconds)
    except ValueError:
        return None


def _person(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "driver_id": None,
        "code": row.get("tla"),
        "number": row.get("number"),
        "name": row.get("name") or row.get("tla"),
        "nationality": None,
        "team": row.get("team"),
        "team_id": None,
        # F1's own colour: the feed has no Jolpica team id to colour by.
        "colour": row.get("colour"),
    }


def _ranked(tower: list[dict[str, Any]]) -> list[dict[str, Any]]:
    placed = [r for r in tower if r.get("position")]
    placed.sort(key=lambda r: r["position"])
    return placed


def race(tower: list[dict[str, Any]], meta: dict[str, Any]) -> dict[str, Any] | None:
    """A race or sprint classification: finishing order, grid, laps, the gap or
    the laps down, retirements, and the fastest laps ranked."""
    rows = _ranked(tower)
    if not rows:
        return None
    timed = sorted(
        (s, r["number"])
        for r in rows
        if (s := _seconds((r.get("best_lap") or {}).get("time"))) is not None
    )
    rank = {number: i + 1 for i, (_, number) in enumerate(timed)}
    out = []
    for row in rows:
        gap = (row.get("gap") or "").strip()
        status, time, position_text = "Finished", None, str(row["position"])
        lapped = _LAPPED.match(gap)
        if row.get("status") in _OUT:
            status, position_text = "Retired", "R"
        elif lapped:
            down = int(lapped.group(1))
            status = f"+{down} Lap" + ("s" if down > 1 else "")
        elif row["position"] != 1 and gap.startswith("+"):
            time = gap
        best = row.get("best_lap") or {}
        out.append(
            {
                **_person(row),
                "position": row["position"],
                "position_text": position_text,
                "grid": row.get("grid"),
                "gained": row.get("gained"),
                "laps": row.get("laps"),
                "status": status,
                "time": time,
                "points": None,
                "fastest_lap": {
                    "rank": rank.get(row["number"]),
                    "lap": best.get("lap"),
                    "time": best.get("time"),
                }
                if best.get("time")
                else None,
            }
        )
    return {"race": meta, "rows": out}


def qualifying(
    tower: list[dict[str, Any]], meta: dict[str, Any]
) -> dict[str, Any] | None:
    """A qualifying or sprint qualifying classification: the best time of each
    part a driver ran."""
    rows = _ranked(tower)
    if not rows:
        return None
    out = []
    for row in rows:
        parts = list((row.get("qualifying") or {}).get("part_bests") or [])
        parts += [None] * (3 - len(parts))
        out.append(
            {
                **_person(row),
                "position": row["position"],
                "q1": parts[0],
                "q2": parts[1],
                "q3": parts[2],
            }
        )
    return {"race": meta, "rows": out}
