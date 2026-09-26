"""The timing tower view model (SPEC §7.1)."""

from __future__ import annotations

from custom_components.pit_lane_live_board.core.timing import build_tower

from .feed import race_topics, session_info


def test_race_rows_in_position_order():
    rows = build_tower(race_topics())
    assert [r["tla"] for r in rows] == ["LEC", "NOR"]


def test_race_row_fields():
    leader, second = build_tower(race_topics())
    assert second["name"] == "Lando Norris"
    assert second["team"] == "McLaren"
    assert second["colour"] == "#F47600"
    assert second["gap"] == "+1.482"
    assert second["interval"] == "+1.482"
    assert second["catching"] is True
    assert second["last_lap"] == {
        "time": "1:31.020",
        "personal_best": True,
        "overall_best": False,
        "previous": False,
    }
    assert second["best_lap"] == {"time": "1:31.020", "lap": 19}
    assert second["pit_stops"] == 1
    assert second["laps"] == 19
    assert second["status"] == "running"
    assert "qualifying" not in second
    assert leader["gap"] == "LAP 20"


def test_places_gained_against_the_grid():
    leader, second = build_tower(race_topics())
    assert leader["grid"] == 3 and leader["gained"] == 2
    assert second["grid"] == 1 and second["gained"] == -1


def test_sectors_show_the_previous_value_marked():
    _, second = build_tower(race_topics())
    s1, s2, s3 = second["sectors"]
    assert s1["time"] == "29.100" and s1["personal_best"] is True
    assert s2["time"] == "31.500"
    assert s3 == {
        "time": "30.420",
        "personal_best": False,
        "overall_best": False,
        "previous": True,
    }


def test_empty_sectors_are_none():
    leader, _ = build_tower(race_topics())
    assert leader["sectors"][0]["overall_best"] is True
    assert leader["sectors"][1] is None and leader["sectors"][2] is None


def test_tyre_from_the_last_stint():
    leader, second = build_tower(race_topics())
    # A used set: TotalLaps already includes the laps it had before.
    assert leader["tyre"] == {"compound": "hard", "new": False, "age": 11, "stint": 2}
    # Stints sent as a dict keyed by index read the same.
    assert second["tyre"] == {"compound": "soft", "new": True, "age": 9, "stint": 2}


def test_unknown_compound_and_no_stints():
    topics = race_topics()
    topics["TimingAppData"]["Lines"]["16"]["Stints"] = [{"Compound": "TEST_UNKNOWN"}]
    topics["TimingAppData"]["Lines"]["4"]["Stints"] = []
    leader, second = build_tower(topics)
    assert leader["tyre"]["compound"] == "unknown"
    assert second["tyre"] is None


def test_retired_stopped_and_missing_position():
    topics = race_topics()
    topics["TimingData"]["Lines"]["16"]["Retired"] = True
    topics["TimingData"]["Lines"]["4"]["Position"] = ""
    topics["TimingData"]["Lines"]["4"]["Stopped"] = True
    rows = build_tower(topics)
    assert rows[0]["status"] == "retired"
    assert rows[1]["position"] is None and rows[1]["status"] == "stopped"
    assert rows[1]["gained"] is None


def test_no_gained_outside_races():
    topics = race_topics()
    topics["SessionInfo"] = session_info("Practice", "Practice 2")
    assert all(r["gained"] is None for r in build_tower(topics))


def test_qualifying_uses_the_current_part():
    topics = race_topics()
    topics["SessionInfo"] = session_info("Qualifying", "Qualifying")
    topics["TimingData"]["SessionPart"] = 2
    topics["TimingData"]["Lines"]["4"].update(
        {
            "BestLapTimes": [{"Value": "1:30.1"}, {"Value": "1:29.8"}, {}],
            "Stats": [
                {"TimeDiffToFastest": "+0.1"},
                {"TimeDiffToFastest": "+0.25"},
                {},
            ],
            "KnockedOut": False,
            "Cutoff": True,
        }
    )
    topics["TimingData"]["Lines"]["16"].update(
        {
            "BestLapTimes": {"0": {"Value": "1:30.5"}, "1": {"Value": ""}},
            "Stats": {"0": {"TimeDiffToFastest": "+0.5"}},
            "KnockedOut": True,
        }
    )
    rows = {r["tla"]: r for r in build_tower(topics)}
    assert rows["NOR"]["qualifying"] == {
        "part_bests": ["1:30.1", "1:29.8", None],
        "best": "1:29.8",
        "gap": "+0.25",
        "cutoff": True,
    }
    # Knocked out in Q1: their Q1 time and gap count, not an empty Q2.
    assert rows["LEC"]["status"] == "knocked_out"
    assert rows["LEC"]["qualifying"]["best"] == "1:30.5"
    assert rows["LEC"]["qualifying"]["gap"] == "+0.5"


def test_practice_gap_comes_from_time_diff():
    topics = race_topics()
    topics["SessionInfo"] = session_info("Practice", "Practice 1")
    line = topics["TimingData"]["Lines"]["4"]
    del line["GapToLeader"], line["IntervalToPositionAhead"]
    line["TimeDiffToFastest"] = "+0.321"
    line["TimeDiffToPositionAhead"] = "+0.100"
    _, second = build_tower(topics)
    assert second["gap"] == "+0.321"
    assert second["interval"] == "+0.100"


def test_nothing_to_show():
    assert build_tower({}) == []
    assert build_tower({"TimingData": {"Lines": "x"}}) == []
