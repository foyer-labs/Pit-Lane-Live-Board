"""The household's own drivers (decision 52): their entities and their events.

A driver is followed by their three-letter code, which stays with them from season
to season (numbers can change). Events come from comparing two consecutive
released snapshots; the first snapshot of a session is the baseline, so opening
live timing mid-race does not replay what already happened.
"""

from __future__ import annotations

from typing import Any

FAVOURITE_EVENTS = (
    "position_gained",
    "position_lost",
    "took_lead",
    "pit_in",
    "pit_out",
    "fastest_lap",
    "retired",
    "penalty",
)
MAX_FAVOURITES = 5


def normalise(codes: Any) -> tuple[str, ...]:
    """Upper-case three-letter codes, no duplicates, at most five, in order."""
    out: list[str] = []
    if isinstance(codes, (list, tuple)):
        for code in codes:
            value = str(code).strip().upper()
            if len(value) == 3 and value.isalpha() and value not in out:
                out.append(value)
    return tuple(out[:MAX_FAVOURITES])


def brief(row: dict[str, Any], rejoin: dict[str, Any] | None = None) -> dict[str, Any]:
    """What a driver's entity shows: small, and stable between messages."""
    tyre = row.get("tyre") or {}
    best = row.get("best_lap") or {}
    last = row.get("last_lap") or {}
    return {
        "number": row["number"],
        "tla": row["tla"],
        "name": row.get("name"),
        "team": row.get("team"),
        "position": row.get("position"),
        "gap": row.get("gap"),
        "interval": row.get("interval"),
        "last_lap": last.get("time"),
        "fastest": bool(last.get("overall_best")),
        "best_lap": best.get("time"),
        "tyre": tyre.get("compound"),
        "tyre_age": tyre.get("age"),
        "stint": tyre.get("stint"),
        "pit_stops": row.get("pit_stops"),
        "in_pit": bool(row.get("in_pit")),
        "laps": row.get("laps"),
        "status": row.get("status"),
        "penalty": row.get("penalty"),
        "gained": row.get("gained"),
        "pit_rejoin": rejoin,
    }


def snapshot(
    rows: list[dict[str, Any]], favourites: tuple[str, ...]
) -> dict[str, dict[str, Any]]:
    """`{code: brief}` for the favourites that are in the session."""
    wanted = set(favourites)
    return {
        row["tla"]: brief(row, row.get("pit_rejoin"))
        for row in rows
        if row.get("tla") in wanted
    }


def derive(
    previous: dict[str, dict[str, Any]] | None,
    current: dict[str, dict[str, Any]],
    race_like: bool,
) -> list[tuple[str, dict[str, Any]]]:
    """Events between two snapshots: `(event type, data)`. Positions matter in
    races and sprints only; in practice and qualifying they reshuffle every lap."""
    if previous is None:
        return []
    events: list[tuple[str, dict[str, Any]]] = []
    for code, now in current.items():
        before = previous.get(code)
        if before is None:
            continue
        data = {
            "driver": code,
            "number": now["number"],
            "position": now["position"],
            "previous_position": before["position"],
            "lap": now["laps"],
        }
        if now["status"] == "retired" and before["status"] != "retired":
            events.append(("retired", data))
            continue
        if now["in_pit"] and not before["in_pit"]:
            events.append(("pit_in", data))
        elif before["in_pit"] and not now["in_pit"]:
            events.append(("pit_out", {**data, "tyre": now["tyre"]}))
        if race_like:
            if now["fastest"] and (
                not before["fastest"] or now["last_lap"] != before["last_lap"]
            ):
                events.append(("fastest_lap", {**data, "time": now["last_lap"]}))
            old, new = before["position"], now["position"]
            if (
                old
                and new
                and new != old
                and not now["in_pit"]
                and not before["in_pit"]
            ):
                if new == 1:
                    events.append(("took_lead", data))
                elif new < old:
                    events.append(("position_gained", data))
                else:
                    events.append(("position_lost", data))
    return events
