"""Jolpica-F1 responses → the Results and Standings pages (SPEC §4.1, §7.3, §7.4).

Jolpica sends every number as a string and omits what does not exist (no times in
1950, no Q2 for a driver out in Q1): each missing value becomes None.
"""

from __future__ import annotations

from typing import Any

from .values import text, to_float, to_int


def _table(payload: Any, name: str) -> Any:
    try:
        return payload["MRData"][name]
    except (KeyError, TypeError):
        return None


def page_info(payload: Any) -> tuple[int, int, int]:
    """`(total, limit, offset)` of a paginated response; zeros when unreadable."""
    try:
        data = payload["MRData"]
    except (KeyError, TypeError):
        return 0, 0, 0
    return (
        to_int(data.get("total")) or 0,
        to_int(data.get("limit")) or 0,
        to_int(data.get("offset")) or 0,
    )


def parse_seasons(payload: Any) -> list[int]:
    table = _table(payload, "SeasonTable")
    seasons = table.get("Seasons") if isinstance(table, dict) else None
    out = {to_int(s.get("season")) for s in seasons or [] if isinstance(s, dict)}
    return sorted(s for s in out if s is not None)


def _races(payload: Any) -> list[dict[str, Any]]:
    table = _table(payload, "RaceTable")
    races = table.get("Races") if isinstance(table, dict) else None
    return [r for r in races or [] if isinstance(r, dict)]


def _driver(row: dict[str, Any]) -> dict[str, Any]:
    driver = row.get("Driver") if isinstance(row.get("Driver"), dict) else {}
    team = row.get("Constructor") if isinstance(row.get("Constructor"), dict) else {}
    given, family = text(driver.get("givenName")), text(driver.get("familyName"))
    return {
        "driver_id": text(driver.get("driverId")),
        "code": text(driver.get("code")),
        "number": text(row.get("number")) or text(driver.get("permanentNumber")),
        "name": " ".join(p for p in (given, family) if p) or None,
        "nationality": text(driver.get("nationality")),
        "team": text(team.get("name")),
        "team_id": text(team.get("constructorId")),
    }


def race_meta(race: dict[str, Any]) -> dict[str, Any]:
    circuit = race.get("Circuit") if isinstance(race.get("Circuit"), dict) else {}
    location = (
        circuit.get("Location") if isinstance(circuit.get("Location"), dict) else {}
    )
    return {
        "season": to_int(race.get("season")),
        "round": to_int(race.get("round")),
        "name": text(race.get("raceName")),
        "date": text(race.get("date")),
        "circuit": text(circuit.get("circuitName")),
        "circuit_id": text(circuit.get("circuitId")),
        "locality": text(location.get("locality")),
        "country": text(location.get("country")),
    }


def _classification(rows: Any) -> list[dict[str, Any]]:
    out = []
    for row in rows if isinstance(rows, list) else []:
        if not isinstance(row, dict):
            continue
        timing = row.get("Time") if isinstance(row.get("Time"), dict) else {}
        fastest = (
            row.get("FastestLap") if isinstance(row.get("FastestLap"), dict) else None
        )
        fastest_time = (
            fastest.get("Time")
            if fastest and isinstance(fastest.get("Time"), dict)
            else {}
        )
        position = to_int(row.get("position"))
        grid = to_int(row.get("grid"))
        out.append(
            {
                **_driver(row),
                "position": position,
                "position_text": text(row.get("positionText")),
                # Grid 0 means a pit lane start: no places to count from.
                "grid": grid if grid else None,
                "gained": grid - position if grid and position else None,
                "laps": to_int(row.get("laps")),
                "status": text(row.get("status")),
                "time": text(timing.get("time")),
                "points": to_float(row.get("points")),
                "fastest_lap": (
                    {
                        "rank": to_int(fastest.get("rank")),
                        "lap": to_int(fastest.get("lap")),
                        "time": text(fastest_time.get("time")),
                    }
                    if fastest
                    else None
                ),
            }
        )
    return out


def parse_results(payload: Any) -> dict[str, Any] | None:
    """Race classification, or None when the race has no results (yet)."""
    races = _races(payload)
    if not races or not races[0].get("Results"):
        return None
    return {"race": race_meta(races[0]), "rows": _classification(races[0]["Results"])}


def parse_sprint(payload: Any) -> dict[str, Any] | None:
    races = _races(payload)
    if not races or not races[0].get("SprintResults"):
        return None
    return {
        "race": race_meta(races[0]),
        "rows": _classification(races[0]["SprintResults"]),
    }


def parse_qualifying(payload: Any) -> dict[str, Any] | None:
    races = _races(payload)
    if not races or not races[0].get("QualifyingResults"):
        return None
    rows = []
    for row in races[0]["QualifyingResults"]:
        if not isinstance(row, dict):
            continue
        rows.append(
            {
                **_driver(row),
                "position": to_int(row.get("position")),
                "q1": text(row.get("Q1")),
                "q2": text(row.get("Q2")),
                "q3": text(row.get("Q3")),
            }
        )
    return {"race": race_meta(races[0]), "rows": rows}


def parse_season_races(payload: Any) -> list[dict[str, Any]]:
    """The season's rounds with their winner, from `/{season}/results/1.json`."""
    out = []
    for race in _races(payload):
        results = race.get("Results")
        winner = (
            _classification(results[:1])[0]
            if isinstance(results, list) and results
            else None
        )
        out.append({**race_meta(race), "winner": winner})
    return out


def parse_standings(payload: Any) -> dict[str, Any] | None:
    """Driver or constructor standings, whichever the response holds."""
    table = _table(payload, "StandingsTable")
    lists = table.get("StandingsLists") if isinstance(table, dict) else None
    if not isinstance(lists, list) or not lists or not isinstance(lists[0], dict):
        return None
    standing = lists[0]
    rows = []
    if isinstance(standing.get("DriverStandings"), list):
        kind = "drivers"
        for row in standing["DriverStandings"]:
            if not isinstance(row, dict):
                continue
            teams = row.get("Constructors")
            last_team = teams[-1] if isinstance(teams, list) and teams else {}
            rows.append(
                {
                    **_driver({**row, "Constructor": last_team}),
                    "position": to_int(row.get("position")),
                    "position_text": text(row.get("positionText")),
                    "points": to_float(row.get("points")),
                    "wins": to_int(row.get("wins")),
                }
            )
    elif isinstance(standing.get("ConstructorStandings"), list):
        kind = "constructors"
        for row in standing["ConstructorStandings"]:
            if not isinstance(row, dict):
                continue
            team = (
                row.get("Constructor")
                if isinstance(row.get("Constructor"), dict)
                else {}
            )
            rows.append(
                {
                    "team": text(team.get("name")),
                    "team_id": text(team.get("constructorId")),
                    "nationality": text(team.get("nationality")),
                    "position": to_int(row.get("position")),
                    "position_text": text(row.get("positionText")),
                    "points": to_float(row.get("points")),
                    "wins": to_int(row.get("wins")),
                }
            )
    else:
        return None
    leader = rows[0]["points"] if rows and rows[0]["points"] is not None else None
    for row in rows:
        row["behind"] = (
            round(leader - row["points"], 1)
            if leader is not None and row["points"] is not None
            else None
        )
    return {
        "kind": kind,
        "season": to_int(standing.get("season")),
        "round": to_int(standing.get("round")),
        "rows": rows,
    }


def add_changes(current: dict[str, Any], previous: dict[str, Any] | None) -> None:
    """Positions gained or lost since the previous round, in place."""
    key = "driver_id" if current.get("kind") == "drivers" else "team_id"
    before = {row[key]: row["position"] for row in previous["rows"]} if previous else {}
    for row in current["rows"]:
        was = before.get(row[key])
        row["change"] = was - row["position"] if was and row["position"] else None


def parse_laps(pages: list[Any]) -> dict[str, list[int | None]]:
    """Position on every lap per driver id, from all pages of `/laps`."""
    positions: dict[str, dict[int, int]] = {}
    last_lap = 0
    for payload in pages:
        for race in _races(payload):
            for lap in race.get("Laps") or []:
                number = to_int(lap.get("number")) if isinstance(lap, dict) else None
                if number is None:
                    continue
                last_lap = max(last_lap, number)
                for timing in lap.get("Timings") or []:
                    if not isinstance(timing, dict):
                        continue
                    driver = text(timing.get("driverId"))
                    position = to_int(timing.get("position"))
                    if driver and position:
                        positions.setdefault(driver, {})[number] = position
    return {
        driver: [by_lap.get(n) for n in range(1, last_lap + 1)]
        for driver, by_lap in positions.items()
    }


def parse_pitstops(payload: Any) -> list[dict[str, Any]]:
    out = []
    for race in _races(payload):
        for stop in race.get("PitStops") or []:
            if not isinstance(stop, dict):
                continue
            out.append(
                {
                    "driver_id": text(stop.get("driverId")),
                    "lap": to_int(stop.get("lap")),
                    "stop": to_int(stop.get("stop")),
                    "duration": text(stop.get("duration")),
                }
            )
    return out
