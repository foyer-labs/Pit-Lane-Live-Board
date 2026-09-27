"""The payloads of the Calendar, Results and Standings pages (SPEC §7.2 to §7.4).

Pure composition of parsed data: the WebSocket layer fetches, these functions
decide what the page receives, including what no-spoiler mode withholds (INV-5).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from .schedule import Meeting, meeting_state

FIRST_QUALIFYING_SEASON = 1994  # Jolpica qualifying: nothing before
FIRST_LAPS_SEASON = 1996  # Jolpica laps
FIRST_PITSTOPS_SEASON = 2011  # Jolpica pit stops
FIRST_ARCHIVE_SEASON = 2018  # F1's archive

TABS = (
    "race",
    "qualifying",
    "sprint",
    "lap_chart",
    "strategy",
    "lap_times",
    "pit_stops",
    "race_control",
    "weather",
)
# Which session's outcome each tab reveals (for no-spoiler mode).
TAB_SESSION = {
    "race": "race",
    "qualifying": "qualifying",
    "sprint": "sprint",
    "lap_chart": "race",
    "strategy": "race",
    "lap_times": "race",
    "pit_stops": "race",
    "race_control": "race",
    "weather": "race",
}


def session_key(season: int, rnd: int, kind: str) -> str:
    return f"{season}-{rnd}-{kind}"


ARCHIVE_TABS = frozenset({"strategy", "lap_times", "race_control", "weather"})


def without_archive_tabs(page: dict[str, Any]) -> dict[str, Any]:
    """For a season F1's archive does not serve (2022 today): no tab that would
    only ever say "not available"."""
    for row in page.get("rounds", []):
        row["tabs"] = [t for t in row["tabs"] if t not in ARCHIVE_TABS]
    return page


def tabs_for(season: int, sprint: bool) -> list[str]:
    tabs = ["race"]
    if season >= FIRST_QUALIFYING_SEASON:
        tabs.append("qualifying")
    if sprint:
        tabs.append("sprint")
    if season >= FIRST_LAPS_SEASON:
        tabs.append("lap_chart")
    if season >= FIRST_ARCHIVE_SEASON:
        tabs += ["strategy", "lap_times"]
    if season >= FIRST_PITSTOPS_SEASON:
        tabs.append("pit_stops")
    if season >= FIRST_ARCHIVE_SEASON:
        tabs += ["race_control", "weather"]
    return tabs


def _podium_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "position": row.get("position"),
        "name": row.get("name"),
        "code": row.get("code"),
        "team": row.get("team"),
        "team_id": row.get("team_id"),
    }


def calendar_page(
    meetings: list[Meeting],
    now: datetime,
    hidden: frozenset[str],
    podiums: dict[int, list[dict[str, Any]]],
) -> dict[str, Any]:
    out = []
    for meeting in meetings:
        state = meeting_state(meeting, meetings, now)
        race_key = session_key(meeting.season, meeting.round, "race")
        podium = podiums.get(meeting.round)
        out.append(
            {
                **meeting.to_dict(),
                "state": state,
                "podium_hidden": state == "done" and race_key in hidden,
                "podium": (
                    [_podium_row(r) for r in podium]
                    if state == "done" and podium and race_key not in hidden
                    else None
                ),
            }
        )
    season = meetings[0].season if meetings else None
    return {"season": season, "meetings": out}


def season_rounds(
    season: int,
    meetings: list[Meeting],
    winners: list[dict[str, Any]],
    hidden: frozenset[str],
    now: datetime | None = None,
) -> dict[str, Any]:
    """The Results page's list of rounds, with each winner.

    Rounds come from the calendar as soon as their weekend has started, so the
    qualifying and the sprint of the current weekend can be opened before the race
    has a winner; seasons whose calendar is unknown fall back to the winners.
    """
    won = {race.get("round"): race for race in winners if race.get("round")}
    started = [m for m in meetings if now is None or m.started(now)]
    rounds_from = started if started else []
    rows: list[dict[str, Any]] = []
    for meeting in rounds_from:
        race = won.get(meeting.round, {})
        rows.append(_round_row(season, meeting.round, meeting, race, hidden))
    known = {row["round"] for row in rows}
    for rnd, race in won.items():
        if rnd not in known:
            rows.append(_round_row(season, rnd, None, race, hidden))
    rows.sort(key=lambda row: row["round"])
    return {"season": season, "rounds": rows}


def _round_row(
    season: int,
    rnd: int,
    meeting: Meeting | None,
    race: dict[str, Any],
    hidden: frozenset[str],
) -> dict[str, Any]:
    sprint = bool(meeting and meeting.sprint)
    race_hidden = session_key(season, rnd, "race") in hidden
    winner = race.get("winner")
    day = meeting.race.day.isoformat() if meeting and meeting.race else None
    return {
        "round": rnd,
        "name": race.get("name") or (meeting.name if meeting else None),
        "date": race.get("date") or day,
        "circuit": race.get("circuit") or (meeting.circuit if meeting else None),
        "circuit_id": race.get("circuit_id")
        or (meeting.circuit_id if meeting else None),
        "country": race.get("country") or (meeting.country if meeting else None),
        "sprint": sprint,
        "hidden": race_hidden,
        "winner": None if race_hidden or not winner else _podium_row(winner),
        "tabs": tabs_for(season, sprint),
    }


def hidden_tab(season: int, rnd: int, tab: str, hidden: frozenset[str]) -> str | None:
    """The session key that hides this tab, or None when it can be shown."""
    key = session_key(season, rnd, TAB_SESSION.get(tab, "race"))
    return key if key in hidden else None


def _names(rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """driver_id → name, code, team, team_id, from a classification."""
    return {
        r["driver_id"]: {
            "name": r.get("name"),
            "code": r.get("code"),
            "team": r.get("team"),
            "team_id": r.get("team_id"),
            "grid": r.get("grid"),
            "position": r.get("position"),
        }
        for r in rows
        if r.get("driver_id")
    }


def lap_chart(
    positions: dict[str, list[int | None]], results: list[dict[str, Any]]
) -> dict[str, Any]:
    """Lines of positions per lap, starting from the grid, ordered by result."""
    names = _names(results)
    order = {r.get("driver_id"): i for i, r in enumerate(results)}
    drivers = []
    for driver_id, laps in positions.items():
        info = names.get(driver_id, {})
        drivers.append(
            {
                "driver_id": driver_id,
                **info,
                "positions": [info.get("grid"), *laps],
            }
        )
    drivers.sort(key=lambda d: order.get(d["driver_id"], 999))
    laps_count = max((len(d["positions"]) - 1 for d in drivers), default=0)
    return {"laps": laps_count, "drivers": drivers}


def lap_chart_from_archive(
    detail: dict[str, Any], results: list[dict[str, Any]]
) -> dict[str, Any] | None:
    """The lap chart from the archive's `LapSeries` (one file instead of a dozen
    Jolpica pages), keyed like the Jolpica one so the page draws either."""
    positions = detail.get("lap_positions") or {}
    if not positions:
        return None
    by_number = {str(r.get("number")): r for r in results if r.get("number")}
    order = {str(r.get("number")): i for i, r in enumerate(results)}
    drivers_info = detail.get("drivers", {})
    drivers = []
    for number in sorted(positions, key=lambda n: order.get(n, 999)):
        values = positions[number]
        row = by_number.get(number, {})
        info = drivers_info.get(number, {})
        drivers.append(
            {
                "driver_id": row.get("driver_id") or number,
                "name": row.get("name") or info.get("name"),
                "code": row.get("code") or info.get("tla"),
                "team": row.get("team") or info.get("team"),
                "team_id": row.get("team_id"),
                "grid": values[0] if values else None,
                "position": row.get("position"),
                "positions": values,
            }
        )
    laps = max((len(d["positions"]) - 1 for d in drivers), default=0)
    return {"laps": laps, "drivers": drivers}


def pit_stops(
    stops: list[dict[str, Any]], results: list[dict[str, Any]]
) -> dict[str, Any]:
    names = _names(results)
    return {
        "stops": [
            {
                **stop,
                **{
                    k: names.get(stop["driver_id"], {}).get(k)
                    for k in ("name", "code", "team_id")
                },
            }
            for stop in stops
        ]
    }


def _archive_order(detail: dict[str, Any], results: list[dict[str, Any]]) -> list[str]:
    """Racing numbers in finishing order when the classification is known."""
    numbers = [str(r["number"]) for r in results if r.get("number")]
    rest = [n for n in detail.get("drivers", {}) if n not in numbers]
    return [n for n in numbers if n in detail.get("drivers", {})] + sorted(
        rest, key=lambda n: int(n) if n.isdigit() else 999
    )


def strategy(detail: dict[str, Any], results: list[dict[str, Any]]) -> dict[str, Any]:
    drivers = detail.get("drivers", {})
    stints = detail.get("stints", {})
    laps = max(
        (s["end_lap"] for ss in stints.values() for s in ss if s.get("end_lap")),
        default=0,
    )
    return {
        "laps": laps,
        "drivers": [
            {**drivers[n], "stints": stints.get(n, [])}
            for n in _archive_order(detail, results)
        ],
    }


def lap_times(detail: dict[str, Any], results: list[dict[str, Any]]) -> dict[str, Any]:
    drivers = detail.get("drivers", {})
    laps = detail.get("laps", {})
    return {
        "drivers": [
            {**drivers[n], "laps": laps.get(n, [])}
            for n in _archive_order(detail, results)
        ]
    }


def race_control_tab(detail: dict[str, Any]) -> dict[str, Any]:
    return {"messages": detail.get("race_control", [])}


def weather_tab(detail: dict[str, Any]) -> dict[str, Any]:
    return {"weather": detail.get("weather")}


def standings_page(
    current: dict[str, Any] | None,
    rounds: int,
    capped: bool,
) -> dict[str, Any]:
    if current is None:
        return {"rows": [], "round": None, "rounds": rounds, "capped": capped}
    return {**current, "rounds": rounds, "capped": capped}
