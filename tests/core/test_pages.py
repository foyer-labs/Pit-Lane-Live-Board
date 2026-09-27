"""The Calendar, Results and Standings payloads (SPEC §7.2-§7.4, INV-5)."""

from __future__ import annotations

from custom_components.pit_lane_live_board.core import pages

from .test_schedule import MEETINGS, at


def test_tabs_follow_what_exists():
    assert pages.tabs_for(1950, False) == ["race"]  # no qualifying before 1994
    assert pages.tabs_for(1994, False) == ["race", "qualifying"]
    assert pages.tabs_for(2000, False) == ["race", "qualifying", "lap_chart"]
    assert pages.tabs_for(2015, True) == [
        "race",
        "qualifying",
        "sprint",
        "lap_chart",
        "pit_stops",
    ]
    assert pages.tabs_for(2026, False) == [
        "race",
        "qualifying",
        "lap_chart",
        "strategy",
        "lap_times",
        "pit_stops",
        "race_control",
        "weather",
    ]


WINNER = {
    "position": 1,
    "name": "A Driver",
    "code": "ADR",
    "team": "Team",
    "team_id": "team",
}


def test_calendar_podium_only_when_done_and_not_hidden():
    podiums = {1: [WINNER]}
    page = pages.calendar_page(MEETINGS, at(12, 0), frozenset(), podiums)
    first, second = page["meetings"]
    assert first["state"] == "done" and first["podium"][0]["code"] == "ADR"
    assert second["podium"] is None
    hidden = pages.calendar_page(
        MEETINGS, at(12, 0), frozenset({"2026-1-race"}), podiums
    )
    assert hidden["meetings"][0]["podium"] is None
    assert hidden["meetings"][0]["podium_hidden"] is True


def test_rounds_hide_the_winner():
    winners = [
        {"round": 1, "name": "GP 1", "date": "2026-05-10", "winner": WINNER},
        {"round": 2, "name": "GP 2", "date": "2026-05-17", "winner": None},
    ]
    page = pages.season_rounds(2026, MEETINGS, winners, frozenset({"2026-1-race"}))
    first, second = page["rounds"]
    assert first["hidden"] is True and first["winner"] is None
    assert second["sprint"] is True and "sprint" in second["tabs"]
    # The circuit history link needs the circuit (from the calendar here).
    assert first["circuit_id"] == "c1" and second["circuit_id"] == "c2"


def test_hidden_tabs_map_to_their_session():
    hidden = frozenset({"2026-1-race"})
    assert pages.hidden_tab(2026, 1, "strategy", hidden) == "2026-1-race"
    assert pages.hidden_tab(2026, 1, "qualifying", hidden) is None
    assert pages.hidden_tab(2026, 2, "race", hidden) is None


RESULTS = [
    {
        "driver_id": "b",
        "number": "16",
        "name": "B",
        "code": "BBB",
        "team_id": "x",
        "grid": 3,
        "position": 1,
    },
    {
        "driver_id": "a",
        "number": "4",
        "name": "A",
        "code": "AAA",
        "team_id": "y",
        "grid": 1,
        "position": 2,
    },
]


def test_lap_chart_starts_from_the_grid_in_result_order():
    chart = pages.lap_chart({"a": [1, 2], "b": [2, 1]}, RESULTS)
    assert [d["code"] for d in chart["drivers"]] == ["BBB", "AAA"]
    assert chart["drivers"][0]["positions"] == [3, 2, 1]
    assert chart["laps"] == 2


def test_archive_tabs_in_finishing_order():
    detail = {
        "drivers": {"4": {"tla": "AAA"}, "16": {"tla": "BBB"}, "99": {"tla": "ZZZ"}},
        "stints": {"4": [{"end_lap": 50}], "16": [{"end_lap": 52}]},
        "laps": {"4": [{"lap": 1}]},
    }
    strategy = pages.strategy(detail, RESULTS)
    assert [d["tla"] for d in strategy["drivers"]] == ["BBB", "AAA", "ZZZ"]
    assert strategy["laps"] == 52
    assert pages.lap_times(detail, RESULTS)["drivers"][1]["laps"] == [{"lap": 1}]


def test_pit_stops_get_names():
    stops = pages.pit_stops(
        [{"driver_id": "a", "lap": 14, "stop": 1, "duration": "22.1"}], RESULTS
    )
    assert stops["stops"][0]["code"] == "AAA"


def test_standings_page():
    assert pages.standings_page(None, 14, True) == {
        "rows": [],
        "round": None,
        "rounds": 14,
        "capped": True,
    }
    page = pages.standings_page(
        {"kind": "drivers", "round": 13, "rows": [1]}, 14, False
    )
    assert page["round"] == 13 and page["rounds"] == 14


def test_a_season_without_archive_has_no_archive_tabs():
    page = {"rounds": [{"round": 1, "tabs": pages.tabs_for(2022, False)}]}
    assert pages.without_archive_tabs(page)["rounds"][0]["tabs"] == [
        "race",
        "qualifying",
        "lap_chart",
        "pit_stops",
    ]
