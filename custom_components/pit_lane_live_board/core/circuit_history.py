"""A circuit's history for the current season's drivers, and the affinity index.

For one circuit (a Jolpica circuit id), every race each driver of the current
season ran there: qualifying, grid, finish, points, fastest lap and how the race
ended, plus the stewards' penalties from F1's archive (2018+). The **affinity
index** (0-100) says how that circuit suits a driver compared with how their car
went that season (decision 58):

- `expected` is the team's expected position that season, from the constructors'
  championship: two cars per team, so `2 * constructor_position - 0.5`
  (constructor P1 → 1.5, P5 → 9.5). No standings (before 1958, or a team missing
  from them): the year does not count.
- `delta_race = expected - finish` (positive: better than the car). A DNF counts
  only when it was the driver's doing, with the classified position Jolpica gives;
  a mechanical DNF does not count.
- `delta_quali = expected - quali_position`, when a qualifying position exists.
- `year_score = 0.6 * delta_race + 0.4 * delta_quali`, or `delta_race` alone.
- Each year weighs `0.85 ** (current_season - season)`: recent form matters more.
- `index = clamp(50 + 5 * weighted mean, 0, 100)`, one decimal: 50 is "as the car",
  +5 per position better. None when no year counted.

Pure (INV-1): the WebSocket layer fetches the pages, the standings and the archive
details, and hands them here.
"""

from __future__ import annotations

from collections.abc import Container, Iterable
import re
from typing import Any

from .jolpica_parse import race_meta
from .stewards import PENALTIES, book_from
from .values import text, to_float, to_int

FIRST_STANDINGS_SEASON = 1958  # the constructors' championship starts here
FIRST_ARCHIVE_SEASON = 2018  # F1's archive: race control, so penalties
WEIGHT_BASE = 0.85
RACE_WEIGHT = 0.6
QUALI_WEIGHT = 0.4
POINTS_PER_PLACE = 5.0

# How a race ended, read from Jolpica's `status` (the Ergast status table).
#
# The index compares a driver with their car, so a retirement counts only when it
# says something about the driver: they crashed, collided, spun off, were
# disqualified or excluded, or failed to qualify. A retirement the car caused
# (engine, gearbox, hydraulics, brakes, electrics, power unit, suspension, wheel,
# tyre, fuel, water, oil, overheating, and the plain "Retired") says nothing about
# the driver and is left out of the index. Everything not listed as the driver's
# doing is read as mechanical: an unknown or ambiguous status ("Damage",
# "Stalled", "Not classified", "Withdrew", "Illness") must never lower a driver's
# index for something that may not have been theirs.
DRIVER_STATUSES = frozenset(
    {
        "accident",
        "collision",
        "collision damage",
        "spun off",
        "disqualified",
        "excluded",
        "did not qualify",
        "did not prequalify",
        "107% rule",
    }
)
# Kept for the reader: the statuses seen for retirements the car caused. They are
# mechanical by the rule above whether listed or not.
MECHANICAL_STATUSES = frozenset(
    {
        "retired",
        "engine",
        "gearbox",
        "transmission",
        "clutch",
        "hydraulics",
        "brakes",
        "electrical",
        "electronics",
        "power unit",
        "ers",
        "power loss",
        "suspension",
        "wheel",
        "wheel nut",
        "tyre",
        "puncture",
        "fuel pressure",
        "fuel system",
        "fuel pump",
        "out of fuel",
        "water pressure",
        "water leak",
        "oil leak",
        "oil pressure",
        "overheating",
        "radiator",
        "mechanical",
        "technical",
        "driveshaft",
        "turbo",
        "exhaust",
        "throttle",
        "steering",
        "cooling system",
    }
)
_LAPS_DOWN = re.compile(r"^\+\d+ laps?$")


def dnf_kind(status: str | None) -> str | None:
    """`"driver"`, `"mechanical"`, or None when the driver finished."""
    value = (status or "").strip().lower()
    if value in ("finished", "lapped") or _LAPS_DOWN.match(value):
        return None
    if value in DRIVER_STATUSES:
        return "driver"
    return "mechanical"


def expected_position(constructor_position: int | None) -> float | None:
    """Where a team's cars are expected to finish, from its championship place."""
    if constructor_position is None or constructor_position < 1:
        return None
    return 2 * constructor_position - 0.5


def constructor_positions(standings: dict[str, Any] | None) -> dict[str, int]:
    """team_id → championship position, from a parsed constructors' table."""
    if not standings or standings.get("kind") != "constructors":
        return {}
    return {
        row["team_id"]: row["position"]
        for row in standings.get("rows", [])
        if row.get("team_id") and row.get("position")
    }


def _races(payload: Any, key: str) -> list[dict[str, Any]]:
    try:
        races = payload["MRData"]["RaceTable"]["Races"]
    except (KeyError, TypeError):
        return []
    return [r for r in races if isinstance(r, dict) and isinstance(r.get(key), list)]


def _person(row: dict[str, Any]) -> dict[str, Any]:
    driver = row.get("Driver") if isinstance(row.get("Driver"), dict) else {}
    team = row.get("Constructor") if isinstance(row.get("Constructor"), dict) else {}
    given, family = text(driver.get("givenName")), text(driver.get("familyName"))
    return {
        "driver_id": text(driver.get("driverId")),
        "code": text(driver.get("code")),
        "number": text(row.get("number")) or text(driver.get("permanentNumber")),
        "name": " ".join(p for p in (given, family) if p) or None,
        "team": text(team.get("name")),
        "team_id": text(team.get("constructorId")),
    }


def parse_circuit_results(
    pages: Iterable[Any],
) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]:
    """The circuit and one row per driver per race, from every page of
    `/circuits/{id}/results`. A race cut by a page boundary arrives in two parts,
    and a driver repeated at a boundary is kept once."""
    meta: dict[str, Any] | None = None
    rows: list[dict[str, Any]] = []
    seen: set[tuple[int, int, str]] = set()
    for payload in pages:
        for race in _races(payload, "Results"):
            info = race_meta(race)
            season, rnd = info["season"], info["round"]
            if season is None or rnd is None:
                continue
            if meta is None:
                meta = info
            for row in race["Results"]:
                if not isinstance(row, dict):
                    continue
                person = _person(row)
                key = (season, rnd, person["driver_id"] or "")
                if not person["driver_id"] or key in seen:
                    continue
                seen.add(key)
                fastest = (
                    row.get("FastestLap")
                    if isinstance(row.get("FastestLap"), dict)
                    else {}
                )
                fastest_time = (
                    fastest.get("Time") if isinstance(fastest.get("Time"), dict) else {}
                )
                rows.append(
                    {
                        **person,
                        "season": season,
                        "round": rnd,
                        "position": to_int(row.get("position")),
                        "position_text": text(row.get("positionText")),
                        # 0 is a pit lane start.
                        "grid": to_int(row.get("grid")),
                        "status": text(row.get("status")),
                        "points": to_float(row.get("points")),
                        "fastest_lap_rank": to_int(fastest.get("rank")),
                        "fastest_lap": text(fastest_time.get("time")),
                    }
                )
    return meta, rows


def parse_circuit_qualifying(pages: Iterable[Any]) -> dict[tuple[int, int, str], int]:
    """(season, round, driver_id) → qualifying position, from every page of
    `/circuits/{id}/qualifying`."""
    out: dict[tuple[int, int, str], int] = {}
    for payload in pages:
        for race in _races(payload, "QualifyingResults"):
            season, rnd = to_int(race.get("season")), to_int(race.get("round"))
            if season is None or rnd is None:
                continue
            for row in race["QualifyingResults"]:
                if not isinstance(row, dict):
                    continue
                driver = (
                    row.get("Driver") if isinstance(row.get("Driver"), dict) else {}
                )
                driver_id = text(driver.get("driverId"))
                position = to_int(row.get("position"))
                if driver_id and position:
                    out.setdefault((season, rnd, driver_id), position)
    return out


def row_count(payload: Any, key: str) -> int:
    """How many rows (results or qualifying rows) one page holds."""
    return sum(len(race[key]) for race in _races(payload, key))


def without_hidden(
    results: list[dict[str, Any]],
    quali: dict[tuple[int, int, str], int],
    hidden: Container[str],
) -> tuple[list[dict[str, Any]], dict[tuple[int, int, str], int]]:
    """What no-spoiler mode withholds (INV-5), as if not run yet: a hidden race
    takes its whole row (a year without its race is no year here), a hidden
    qualifying only the qualifying position."""
    shown = [
        row for row in results if f"{row['season']}-{row['round']}-race" not in hidden
    ]
    shown_quali = {
        key: position
        for key, position in quali.items()
        if f"{key[0]}-{key[1]}-qualifying" not in hidden
    }
    return shown, shown_quali


def standings_seasons(
    results: list[dict[str, Any]], drivers: Container[str]
) -> list[int]:
    """The seasons whose constructors' table the index needs for these drivers."""
    return sorted(
        {
            row["season"]
            for row in results
            if row["driver_id"] in drivers and row["season"] >= FIRST_STANDINGS_SEASON
        }
    )


def _classified(row: dict[str, Any]) -> bool:
    return bool(row.get("position_text") and row["position_text"].isdigit())


def _num(value: float | None) -> float | int | None:
    """A whole number as an int, else the value (a JSON the panel reads plainly)."""
    if value is None:
        return None
    return int(value) if float(value).is_integer() else value


def year_rows(
    driver_id: str,
    results: list[dict[str, Any]],
    quali: dict[tuple[int, int, str], int],
    constructors: dict[int, dict[str, int]],
    current_season: int,
) -> list[dict[str, Any]]:
    """One row per race the driver ran at the circuit, newest first."""
    out = []
    for row in results:
        if row["driver_id"] != driver_id:
            continue
        season, rnd = row["season"], row["round"]
        position = row["position"]
        q = quali.get((season, rnd, driver_id))
        grid = row["grid"]
        dnf = dnf_kind(row["status"])
        team_position = constructors.get(season, {}).get(row["team_id"] or "")
        expected = (
            expected_position(team_position)
            if season >= FIRST_STANDINGS_SEASON
            else None
        )
        delta_race = (
            expected - position
            if expected is not None and position is not None and dnf != "mechanical"
            else None
        )
        delta_quali = expected - q if expected is not None and q is not None else None
        out.append(
            {
                "season": season,
                "round": rnd,
                "team": row["team"],
                "team_id": row["team_id"],
                "quali": q,
                "grid": grid if grid else None,
                "grid_penalty": grid == 0
                or (bool(grid) and q is not None and grid > q),
                "finish": position,
                "position_text": row["position_text"],
                "status": row["status"],
                "points": _num(row["points"]),
                "fastest_lap_rank": row["fastest_lap_rank"],
                "fastest_lap": row["fastest_lap"],
                "dnf": dnf,
                "counted": delta_race is not None,
                "expected": expected,
                "delta_race": delta_race,
                "delta_quali": delta_quali,
                "weight": round(WEIGHT_BASE ** max(0, current_season - season), 4),
            }
        )
    out.sort(key=lambda r: (r["season"], r["round"]), reverse=True)
    return out


def year_score(row: dict[str, Any]) -> float | None:
    if not row["counted"] or row["delta_race"] is None:
        return None
    if row["delta_quali"] is None:
        return row["delta_race"]
    return RACE_WEIGHT * row["delta_race"] + QUALI_WEIGHT * row["delta_quali"]


def affinity_index(years: list[dict[str, Any]]) -> float | None:
    """The weighted mean of the counted years, on the 0-100 scale."""
    total = weights = 0.0
    for row in years:
        score = year_score(row)
        if score is None:
            continue
        total += row["weight"] * score
        weights += row["weight"]
    if weights == 0:
        return None
    value = 50 + POINTS_PER_PLACE * total / weights
    return round(min(100.0, max(0.0, value)), 1)


def _mean(values: list[int]) -> float | None:
    return round(sum(values) / len(values), 1) if values else None


def driver_summary(
    entrant: dict[str, Any], years: list[dict[str, Any]]
) -> dict[str, Any]:
    """One row of the drivers list: the index and the aggregates."""
    classified = [y["finish"] for y in years if _classified_year(y)]
    qualis = [y["quali"] for y in years if y["quali"] is not None]
    return {
        "driver_id": entrant.get("driver_id"),
        "code": entrant.get("code"),
        "name": entrant.get("name"),
        "team": entrant.get("team"),
        "team_id": entrant.get("team_id"),
        "index": affinity_index(years),
        "races": len(years),
        "counted": sum(1 for y in years if y["counted"]),
        "wins": sum(1 for y in years if _classified_year(y) and y["finish"] == 1),
        "podiums": sum(1 for y in years if _classified_year(y) and y["finish"] <= 3),
        "poles": sum(
            1
            for y in years
            if y["quali"] == 1 or (y["quali"] is None and y["grid"] == 1)
        ),
        "best_finish": min(classified) if classified else None,
        "avg_finish": _mean(classified),
        "avg_quali": _mean(qualis),
        "last_season": max((y["season"] for y in years), default=None),
    }


def _classified_year(year: dict[str, Any]) -> bool:
    return year["finish"] is not None and _classified(year)


def _sort_key(driver: dict[str, Any]) -> tuple[Any, ...]:
    index = driver["index"]
    return (index is None, -(index or 0), -driver["races"], driver["name"] or "")


def entrants(standings: dict[str, Any] | None) -> list[dict[str, Any]]:
    """The season's drivers, from a parsed drivers' table."""
    if not standings or standings.get("kind") != "drivers":
        return []
    return [
        {k: row.get(k) for k in ("driver_id", "code", "name", "team", "team_id")}
        for row in standings.get("rows", [])
        if row.get("driver_id")
    ]


def _circuit(
    circuit_id: str, meta: dict[str, Any] | None, results: list[dict[str, Any]]
) -> dict[str, Any]:
    seasons = [row["season"] for row in results]
    return {
        "circuit_id": circuit_id,
        "circuit": meta.get("circuit") if meta else None,
        "locality": meta.get("locality") if meta else None,
        "country": meta.get("country") if meta else None,
        "first_season": min(seasons, default=None),
        "last_season": max(seasons, default=None),
    }


def history_payload(
    circuit_id: str,
    meta: dict[str, Any] | None,
    results: list[dict[str, Any]],
    quali: dict[tuple[int, int, str], int],
    *,
    drivers: list[dict[str, Any]],
    constructors: dict[int, dict[str, int]],
    current_season: int,
) -> dict[str, Any]:
    """`circuit/history`: the circuit and its drivers by index, best first.

    `results` and `quali` come already filtered by no-spoiler mode. A circuit with
    no race at all (unknown, or not raced yet) lists no drivers.
    """
    rows = []
    if results:
        for entrant in drivers:
            years = year_rows(
                entrant["driver_id"], results, quali, constructors, current_season
            )
            rows.append(driver_summary(entrant, years))
        rows.sort(key=_sort_key)
    return {**_circuit(circuit_id, meta, results), "drivers": rows}


def driver_payload(
    circuit_id: str,
    driver_id: str,
    results: list[dict[str, Any]],
    quali: dict[tuple[int, int, str], int],
    *,
    constructors: dict[int, dict[str, int]],
    current_season: int,
    penalties: dict[tuple[int, int], list[dict[str, Any]] | None],
    entrant: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """`circuit/driver`: every race of one driver at the circuit, newest first."""
    years = year_rows(driver_id, results, quali, constructors, current_season)
    for year in years:
        year["penalties"] = penalties.get((year["season"], year["round"]))
    own = [row for row in results if row["driver_id"] == driver_id]
    latest = max(own, key=lambda r: (r["season"], r["round"]), default=None)
    known = entrant or latest or {}
    return {
        "circuit_id": circuit_id,
        "driver_id": driver_id,
        "code": known.get("code"),
        "name": known.get("name"),
        "index": affinity_index(years),
        "years": years,
    }


def archive_races(own: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    """A driver's result rows of the races F1's archive may hold race control for
    (2018+): the code and the number there match the stewards' messages."""
    return [row for row in own if row["season"] >= FIRST_ARCHIVE_SEASON]


def _raw_messages(race_control: Any) -> list[dict[str, Any]]:
    """An archive detail's race control (newest first, our keys) back to F1's
    message shape in time order, as the stewards' book reads it."""
    if not isinstance(race_control, list):
        return []
    out = []
    for message in reversed(race_control):
        if not isinstance(message, dict):
            continue
        out.append(
            {
                "Message": message.get("message"),
                "Lap": message.get("lap"),
                "Utc": message.get("utc"),
                "Category": message.get("category"),
                "Flag": message.get("flag"),
                "Scope": message.get("scope"),
                "Sector": message.get("sector"),
            }
        )
    return out


def penalties_for(
    detail: Any, code: str | None, number: str | None
) -> list[dict[str, Any]] | None:
    """The stewards' penalties for one driver in one race, from its archive
    detail; None when there is no detail to read."""
    if not isinstance(detail, dict) or not isinstance(detail.get("race_control"), list):
        return None
    book = book_from(_raw_messages(detail["race_control"]))

    def mine(car: dict[str, Any]) -> bool:
        return bool(
            (code and car.get("tla") == code)
            or (number and car.get("number") == number)
        )

    return [
        {
            "kind": penalty["kind"],
            "seconds": penalty["seconds"],
            "reason": penalty["reason"],
            "lap": penalty["lap"],
        }
        for penalty in book.penalties
        if penalty["kind"] in PENALTIES and any(mine(c) for c in penalty["cars"])
    ]
