"""Jolpica responses (SPEC §7.3, §7.4). Synthetic, shaped like the real ones."""

from __future__ import annotations

from custom_components.pit_lane_live_board.core.jolpica_parse import (
    add_changes,
    page_info,
    parse_laps,
    parse_pitstops,
    parse_qualifying,
    parse_results,
    parse_season_races,
    parse_seasons,
    parse_sprint,
    parse_standings,
)

RACE = {
    "season": "2026",
    "round": "7",
    "raceName": "Test Grand Prix",
    "date": "2026-05-10",
    "Circuit": {
        "circuitId": "test",
        "circuitName": "Testring",
        "Location": {"locality": "Town", "country": "Land"},
    },
}


def driver(driver_id, given, family, code=None, number=None):
    out = {"driverId": driver_id, "givenName": given, "familyName": family}
    if code:
        out["code"] = code
    if number:
        out["permanentNumber"] = number
    return out


def team(team_id, name):
    return {"constructorId": team_id, "name": name}


def wrap(table, **extra):
    return {"MRData": {"total": "2", "limit": "100", "offset": "0", **extra, **table}}


def races(**race_fields):
    return wrap({"RaceTable": {"Races": [{**RACE, **race_fields}]}})


RESULTS = [
    {
        "number": "12",
        "position": "1",
        "positionText": "1",
        "points": "25",
        "Driver": driver("antonelli", "Andrea Kimi", "Antonelli", "ANT", "12"),
        "Constructor": team("mercedes", "Mercedes"),
        "grid": "2",
        "laps": "57",
        "status": "Finished",
        "Time": {"millis": "5663754", "time": "1:34:23.754"},
        "FastestLap": {"rank": "2", "lap": "57", "Time": {"time": "1:36.030"}},
    },
    {
        "number": "44",
        "position": "2",
        "positionText": "R",
        "points": "0",
        "Driver": driver("hamilton", "Lewis", "Hamilton", "HAM", "44"),
        "Constructor": team("ferrari", "Ferrari"),
        "grid": "0",
        "laps": "6",
        "status": "Retired",
    },
]


def test_results():
    parsed = parse_results(races(Results=RESULTS))
    assert parsed["race"]["name"] == "Test Grand Prix"
    assert parsed["race"]["circuit"] == "Testring"
    winner, retired = parsed["rows"]
    assert winner["name"] == "Andrea Kimi Antonelli"
    assert winner["code"] == "ANT" and winner["team"] == "Mercedes"
    assert (winner["grid"], winner["gained"]) == (2, 1)
    assert winner["time"] == "1:34:23.754" and winner["points"] == 25.0
    assert winner["fastest_lap"] == {"rank": 2, "lap": 57, "time": "1:36.030"}
    # Pit lane start: grid 0 is no grid.
    assert retired["grid"] is None and retired["gained"] is None
    assert retired["position_text"] == "R" and retired["fastest_lap"] is None


def test_no_results_yet():
    assert parse_results(races()) is None
    assert parse_results(None) is None


def test_old_results_without_codes_or_times():
    old = [
        {
            "number": "2",
            "position": "1",
            "points": "9",
            "Driver": driver("farina", "Nino", "Farina"),
            "Constructor": team("alfa", "Alfa Romeo"),
            "grid": "1",
            "laps": "70",
            "status": "Finished",
        }
    ]
    (row,) = parse_results(races(Results=old))["rows"]
    assert row["code"] is None and row["time"] is None and row["number"] == "2"


def test_sprint_and_qualifying():
    assert parse_sprint(races(SprintResults=RESULTS[:1]))["rows"][0]["code"] == "ANT"
    assert parse_sprint(races(Results=RESULTS)) is None
    quali = parse_qualifying(
        races(
            QualifyingResults=[
                {
                    "number": "77",
                    "position": "20",
                    "Driver": driver("bottas", "Valtteri", "Bottas"),
                    "Constructor": team("cadillac", "Cadillac"),
                    "Q1": "1:38.011",
                },
            ]
        )
    )
    assert quali["rows"][0] | {} == quali["rows"][0]
    assert (quali["rows"][0]["q1"], quali["rows"][0]["q2"]) == ("1:38.011", None)


def test_season_races_with_winners():
    payload = wrap(
        {
            "RaceTable": {
                "Races": [{**RACE, "Results": RESULTS[:1]}, {**RACE, "round": "8"}]
            }
        }
    )
    rounds = parse_season_races(payload)
    assert rounds[0]["winner"]["code"] == "ANT"
    assert rounds[1]["winner"] is None


def test_driver_standings_with_gap_and_change():
    def standings(rows, round_):
        return wrap(
            {
                "StandingsTable": {
                    "StandingsLists": [
                        {"season": "2026", "round": round_, "DriverStandings": rows}
                    ]
                }
            }
        )

    now = parse_standings(
        standings(
            [
                {
                    "position": "1",
                    "points": "292",
                    "wins": "8",
                    "Driver": driver("antonelli", "Andrea Kimi", "Antonelli", "ANT"),
                    "Constructors": [team("mercedes", "Mercedes")],
                },
                {
                    "position": "2",
                    "points": "211.5",
                    "wins": "2",
                    "Driver": driver("russell", "George", "Russell", "RUS"),
                    "Constructors": [team("mercedes", "Mercedes")],
                },
            ],
            "15",
        )
    )
    before = parse_standings(
        standings(
            [
                {
                    "position": "1",
                    "points": "260",
                    "wins": "7",
                    "Driver": driver("russell", "George", "Russell"),
                },
                {
                    "position": "2",
                    "points": "250",
                    "wins": "7",
                    "Driver": driver("antonelli", "A", "A"),
                },
            ],
            "14",
        )
    )
    add_changes(now, before)
    assert now["kind"] == "drivers" and now["round"] == 15
    assert [r["behind"] for r in now["rows"]] == [0.0, 80.5]
    assert [r["change"] for r in now["rows"]] == [1, -1]
    assert now["rows"][0]["team"] == "Mercedes"


def test_constructor_standings():
    payload = wrap(
        {
            "StandingsTable": {
                "StandingsLists": [
                    {
                        "season": "2026",
                        "round": "15",
                        "ConstructorStandings": [
                            {
                                "position": "1",
                                "points": "503",
                                "wins": "10",
                                "Constructor": team("mercedes", "Mercedes"),
                            }
                        ],
                    }
                ]
            }
        }
    )
    parsed = parse_standings(payload)
    add_changes(parsed, None)
    assert parsed["kind"] == "constructors"
    assert parsed["rows"][0]["team_id"] == "mercedes"
    assert parsed["rows"][0]["change"] is None
    assert parse_standings(wrap({"StandingsTable": {"StandingsLists": []}})) is None


def test_laps_across_pages():
    page1 = races(
        Laps=[
            {
                "number": "1",
                "Timings": [
                    {"driverId": "a", "position": "1"},
                    {"driverId": "b", "position": "2"},
                ],
            }
        ]
    )
    page2 = races(
        Laps=[{"number": "2", "Timings": [{"driverId": "b", "position": "1"}]}]
    )
    assert parse_laps([page1, page2]) == {"a": [1, None], "b": [2, 1]}


def test_pitstops_seasons_and_pages():
    stops = parse_pitstops(
        races(
            PitStops=[{"driverId": "a", "lap": "14", "stop": "1", "duration": "31.8"}]
        )
    )
    assert stops == [{"driver_id": "a", "lap": 14, "stop": 1, "duration": "31.8"}]
    seasons = wrap(
        {"SeasonTable": {"Seasons": [{"season": "1951"}, {"season": "1950"}]}}
    )
    assert parse_seasons(seasons) == [1950, 1951]
    assert page_info(seasons) == (2, 100, 0)
    assert page_info(None) == (0, 0, 0)
