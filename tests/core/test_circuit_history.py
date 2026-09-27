"""A circuit's history and the affinity index (decision 58, INV-5)."""

from __future__ import annotations

import pytest

from custom_components.pit_lane_live_board.core import circuit_history as ch

CURRENT = 2026


def result(driver, season, rnd, position, **fields):
    row = {
        "number": fields.pop("number", "16"),
        "position": str(position),
        "positionText": fields.pop("text", str(position)),
        "points": fields.pop("points", "10"),
        "grid": str(fields.pop("grid", position)),
        "status": fields.pop("status", "Finished"),
        "Driver": {
            "driverId": driver,
            "code": driver.upper()[:3],
            "givenName": "Given",
            "familyName": driver.title(),
        },
        "Constructor": {
            "constructorId": fields.pop("team", "t"),
            "name": "Team",
        },
    }
    if "fastest" in fields:
        rank, time = fields.pop("fastest")
        row["FastestLap"] = {"rank": str(rank), "Time": {"time": time}}
    return row


def page(*races, total=None, key="Results"):
    rows = [
        {
            "season": str(season),
            "round": str(rnd),
            "raceName": "Grand Prix",
            "Circuit": {
                "circuitId": "c",
                "circuitName": "Circuit",
                "Location": {"locality": "Town", "country": "Land"},
            },
            key: list(results),
        }
        for season, rnd, results in races
    ]
    count = sum(len(r) for _, _, r in races)
    return {
        "MRData": {
            "total": str(total or count),
            "limit": "100",
            "offset": "0",
            "RaceTable": {"Races": rows},
        }
    }


def quali_row(driver, position):
    return {"position": str(position), "Driver": {"driverId": driver}}


# The hand-made example: one driver, one team, four years at the circuit.
#
#   2026  constructor P2 → expected 3.5; Q1, finished P2
#         delta_race 1.5, delta_quali 2.5 → 0.6*1.5 + 0.4*2.5 = 1.9, weight 1
#   2025  constructor P1 → expected 1.5; no qualifying, finished P5
#         delta_race -3.5 → -3.5, weight 0.85
#   2024  engine failure: mechanical, not counted
#   2023  constructor P3 → expected 5.5; Q4, accident, classified P18
#         delta_race -12.5, delta_quali 1.5 → -7.5 + 0.6 = -6.9, weight 0.6141
#   1955  no constructors' championship yet: not counted
#
#   weighted mean = (1.9 - 2.975 - 4.23729) / 2.4641 = -2.15588
#   index = 50 + 5 * -2.15588 = 43.5
RESULTS = [
    page(
        (1955, 3, [result("ann", 1955, 3, 1)]),
        (2023, 4, [result("ann", 2023, 4, 18, text="R", status="Accident")]),
        (2024, 4, [result("ann", 2024, 4, 15, text="R", status="Engine")]),
        (2025, 4, [result("ann", 2025, 4, 5, fastest=(1, "1:43.009"))]),
        total=5,
    ),
    # 2026 arrives on the next page.
    page((2026, 6, [result("ann", 2026, 6, 2, grid=4, points="18")]), total=5),
]
QUALI = [
    page(
        (2023, 4, [quali_row("ann", 4)]),
        (2024, 4, [quali_row("ann", 3)]),
        (2026, 6, [quali_row("ann", 1)]),
        key="QualifyingResults",
    )
]
CONSTRUCTORS = {2023: {"t": 3}, 2024: {"t": 2}, 2025: {"t": 1}, 2026: {"t": 2}}


def years(hidden=frozenset()):
    _meta, results = ch.parse_circuit_results(RESULTS)
    quali = ch.parse_circuit_qualifying(QUALI)
    results, quali = ch.without_hidden(results, quali, hidden)
    return ch.year_rows("ann", results, quali, CONSTRUCTORS, CURRENT)


def test_the_index_of_the_hand_made_example():
    rows = years()
    assert [(r["season"], r["counted"]) for r in rows] == [
        (2026, True),
        (2025, True),
        (2024, False),
        (2023, True),
        (1955, False),
    ]
    latest, last_year, engine, accident, old = rows
    assert latest["expected"] == 3.5 and latest["delta_race"] == 1.5
    assert latest["delta_quali"] == 2.5 and latest["weight"] == 1.0
    assert ch.year_score(latest) == pytest.approx(1.9)
    assert last_year["quali"] is None and ch.year_score(last_year) == -3.5
    assert last_year["weight"] == 0.85
    assert last_year["fastest_lap_rank"] == 1 and last_year["fastest_lap"] == "1:43.009"
    assert engine["dnf"] == "mechanical" and engine["delta_race"] is None
    assert accident["dnf"] == "driver" and accident["delta_race"] == -12.5
    assert ch.year_score(accident) == pytest.approx(-6.9)
    assert accident["weight"] == 0.6141
    assert old["expected"] is None and old["counted"] is False
    assert ch.affinity_index(rows) == 43.5


def test_grid_penalty_is_a_grid_behind_qualifying():
    latest = years()[0]
    assert latest["quali"] == 1 and latest["grid"] == 4
    assert latest["grid_penalty"] is True
    assert latest["points"] == 18  # a whole number stays whole
    _meta, results = ch.parse_circuit_results(
        [page((2020, 1, [result("bo", 2020, 1, 9, grid=0)]))]
    )
    (pit_lane,) = ch.year_rows("bo", results, {}, {}, CURRENT)
    assert pit_lane["grid"] is None and pit_lane["grid_penalty"] is True


def test_the_index_is_clamped_and_none_without_counted_years():
    row = {"counted": True, "delta_race": 30.0, "delta_quali": None, "weight": 1.0}
    assert ch.affinity_index([row]) == 100.0
    assert ch.affinity_index([{**row, "delta_race": -30.0}]) == 0.0
    assert ch.affinity_index([{**row, "counted": False}]) is None
    assert ch.affinity_index([]) is None


@pytest.mark.parametrize(
    ("status", "kind"),
    [
        ("Finished", None),
        ("+1 Lap", None),
        ("+3 Laps", None),
        ("Lapped", None),
        ("Accident", "driver"),
        ("Collision", "driver"),
        ("Collision damage", "driver"),
        ("Spun off", "driver"),
        ("Disqualified", "driver"),
        ("Did not qualify", "driver"),
        ("Engine", "mechanical"),
        ("Gearbox", "mechanical"),
        ("Hydraulics", "mechanical"),
        ("Power Unit", "mechanical"),
        ("Retired", "mechanical"),
        # Unknown or ambiguous: never held against the driver.
        ("Damage", "mechanical"),
        ("Something new", "mechanical"),
        (None, "mechanical"),
    ],
)
def test_dnf_classification(status, kind):
    assert ch.dnf_kind(status) == kind


def test_expected_position_from_the_constructors_table():
    assert ch.expected_position(1) == 1.5
    assert ch.expected_position(5) == 9.5
    assert ch.expected_position(None) is None
    assert ch.expected_position(0) is None
    table = {
        "kind": "constructors",
        "rows": [
            {"team_id": "ferrari", "position": 2},
            {"team_id": "mclaren", "position": 1},
        ],
    }
    assert ch.constructor_positions(table) == {"ferrari": 2, "mclaren": 1}
    assert ch.constructor_positions(None) == {}
    assert ch.constructor_positions({"kind": "drivers", "rows": []}) == {}


def test_no_spoiler_leaves_out_hidden_sessions():
    # The race hidden: the whole year goes, as if not run yet.
    assert [r["season"] for r in years(frozenset({"2026-6-race"}))] == [
        2025,
        2024,
        2023,
        1955,
    ]
    # Only the qualifying hidden: the race stays, without its qualifying.
    latest = years(frozenset({"2026-6-qualifying"}))[0]
    assert latest["season"] == 2026 and latest["quali"] is None
    assert latest["delta_quali"] is None and latest["grid_penalty"] is False


def test_a_race_split_across_pages_is_one_race():
    first = page((2024, 4, [result("ann", 2024, 4, 1), result("ben", 2024, 4, 2)]))
    second = page((2024, 4, [result("ben", 2024, 4, 2), result("cy", 2024, 4, 3)]))
    meta, results = ch.parse_circuit_results([first, second])
    assert meta["circuit"] == "Circuit" and meta["country"] == "Land"
    assert [r["driver_id"] for r in results] == ["ann", "ben", "cy"]
    assert ch.row_count(first, "Results") == 2
    assert ch.parse_circuit_results([{"bad": 1}, None]) == (None, [])


def test_history_lists_the_drivers_by_index_nulls_last():
    meta, results = ch.parse_circuit_results(
        [
            *RESULTS,
            page(
                (2025, 4, [result("ben", 2025, 4, 1, team="u")]),
                (2026, 6, [result("ben", 2026, 6, 1, team="u")]),
            ),
        ]
    )
    quali = ch.parse_circuit_qualifying(QUALI)
    drivers = [
        {"driver_id": "new", "code": "NEW", "name": "New Driver", "team": "T"},
        {"driver_id": "ann", "code": "ANN", "name": "Ann", "team": "T"},
        {"driver_id": "ben", "code": "BEN", "name": "Ben", "team": "U"},
    ]
    constructors = {**CONSTRUCTORS, 2025: {"t": 1, "u": 4}, 2026: {"t": 2, "u": 4}}
    out = ch.history_payload(
        "c",
        meta,
        results,
        quali,
        drivers=drivers,
        constructors=constructors,
        current_season=CURRENT,
    )
    assert out["circuit"] == "Circuit" and out["locality"] == "Town"
    assert out["first_season"] == 1955 and out["last_season"] == 2026
    assert [d["driver_id"] for d in out["drivers"]] == ["ben", "ann", "new"]
    ben, ann, new = out["drivers"]
    assert ben["index"] > ann["index"] and ann["index"] == 43.5
    assert ben["wins"] == 2 and ben["podiums"] == 2 and ben["best_finish"] == 1
    assert ann["races"] == 5 and ann["counted"] == 3
    assert ann["wins"] == 1  # 1955
    assert ann["podiums"] == 2 and ann["poles"] == 2  # 1955 from the grid, 2026 Q1
    assert ann["best_finish"] == 1
    assert ann["avg_finish"] == round((1 + 5 + 2) / 3, 1)  # classified only
    assert ann["avg_quali"] == round((4 + 3 + 1) / 3, 1)
    assert ann["last_season"] == 2026
    assert new["index"] is None and new["races"] == 0 and new["last_season"] is None
    # An unknown circuit: nothing at all.
    empty = ch.history_payload(
        "zz", None, [], {}, drivers=drivers, constructors={}, current_season=CURRENT
    )
    assert empty["drivers"] == [] and empty["circuit"] is None


def test_entrants_from_the_drivers_table():
    table = {
        "kind": "drivers",
        "rows": [
            {
                "driver_id": "ann",
                "code": "ANN",
                "name": "Ann",
                "team": "T",
                "team_id": "t",
                "points": 10,
            }
        ],
    }
    assert ch.entrants(table) == [
        {"driver_id": "ann", "code": "ANN", "name": "Ann", "team": "T", "team_id": "t"}
    ]
    assert ch.entrants(None) == []


RACE_CONTROL = [  # newest first, as the archive detail keeps it
    {
        "message": "FIA STEWARDS: PENALTY SERVED - 5 SECOND TIME PENALTY FOR CAR 16 "
        "(ANN) - CAUSING A COLLISION",
        "lap": 20,
    },
    {
        "message": "FIA STEWARDS: DRIVE THROUGH PENALTY FOR CAR 7 (BEN) - SPEEDING IN "
        "THE PIT LANE",
        "lap": 15,
    },
    {
        "message": "FIA STEWARDS: 5 SECOND TIME PENALTY FOR CAR 16 (ANN) - CAUSING A "
        "COLLISION",
        "lap": 12,
    },
    {
        "message": "FIA STEWARDS: WARNING FOR CAR 16 (ANN) - MOVING UNDER BRAKING",
        "lap": 3,
    },
    {"message": "GREEN LIGHT - PIT EXIT OPEN", "lap": 1, "category": "Flag"},
]


def test_penalties_for_one_driver_from_race_control():
    detail = {"race_control": RACE_CONTROL}
    expected = [
        {
            "kind": "time_penalty",
            "seconds": 5,
            "reason": "CAUSING A COLLISION",
            "lap": 12,
        }
    ]
    assert ch.penalties_for(detail, "ANN", None) == expected
    assert ch.penalties_for(detail, None, "16") == expected
    assert ch.penalties_for(detail, "BEN", "7")[0]["kind"] == "drive_through"
    assert ch.penalties_for(detail, "CYX", "99") == []
    assert ch.penalties_for(None, "ANN", "16") is None
    assert ch.penalties_for({"race_control": None}, "ANN", "16") is None


def test_driver_payload_carries_penalties_per_race():
    _meta, results = ch.parse_circuit_results(RESULTS)
    quali = ch.parse_circuit_qualifying(QUALI)
    own = [r for r in results if r["driver_id"] == "ann"]
    assert [(r["season"], r["number"]) for r in ch.archive_races(own)] == [
        (2023, "16"),
        (2024, "16"),
        (2025, "16"),
        (2026, "16"),
    ]
    penalties = {(2026, 6): [{"kind": "time_penalty"}], (2025, 4): []}
    out = ch.driver_payload(
        "c",
        "ann",
        results,
        quali,
        constructors=CONSTRUCTORS,
        current_season=CURRENT,
        penalties=penalties,
    )
    assert out["code"] == "ANN" and out["name"] == "Given Ann"
    assert out["index"] == 43.5
    assert [y["penalties"] for y in out["years"]] == [
        [{"kind": "time_penalty"}],
        [],
        None,
        None,
        None,
    ]
    nobody = ch.driver_payload(
        "c",
        "zed",
        results,
        quali,
        constructors={},
        current_season=CURRENT,
        penalties={},
    )
    assert nobody["years"] == [] and nobody["index"] is None


def test_standings_are_needed_only_for_the_drivers_listed_from_1958():
    _meta, results = ch.parse_circuit_results(RESULTS)
    assert ch.standings_seasons(results, {"ann"}) == [2023, 2024, 2025, 2026]
    assert ch.standings_seasons(results, {"zed"}) == []


def test_few_races_pull_the_index_towards_50():
    """One good afternoon is not an affinity: n / (n + 2) of the full value."""
    row = {"counted": True, "delta_race": 4.0, "delta_quali": 4.0, "weight": 1.0}
    assert ch.affinity_index([row]) == round(50 + 5 * 4 * (1 / 3), 1)
    assert ch.affinity_index([row] * 8) == round(50 + 5 * 4 * (8 / 10), 1)
