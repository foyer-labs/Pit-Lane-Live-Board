"""History detail from the archive (SPEC §7.3)."""

from __future__ import annotations

from custom_components.pit_lane_live_board.core.history import (
    LapCollector,
    build_detail,
    pit_lane_times,
    stints,
    weather_summary,
)


def line(number, **fields):
    return {"Lines": {number: fields}}


def s(index, value):
    return {"Sectors": {str(index): {"Value": value}}}


def race_stream():
    """Car 4: grid pit-lane shuffle, two laps, a pit stop at the end of lap 2."""
    return [
        line("4", InPit=True, PitOut=False, Sectors=[{"Value": ""}] * 3),
        line("4", InPit=False),
        line("4", InPit=True),  # to the grid and back: not a stop
        line("4", InPit=False),
        line("4", **s(0, "30.0")),
        line("4", **s(1, "31.0")),
        line("4", NumberOfLaps=1, **s(2, "32.0")),  # lap 1: no lap time yet
        line("4", **s(0, "29.5")),
        line("4", **s(1, "30.5")),
        line("4", InPit=True, NumberOfPitStops=1),
        line("4", NumberOfLaps=2, LastLapTime={"Value": "1:31.500"}, **s(2, "31.5")),
        line("4", InPit=False, PitOut=True),
        line("4", PitOut=False),
        line("4", **s(0, "29.0")),
        line("4", **s(1, "30.9")),
        line("4", NumberOfLaps=3, LastLapTime={"Value": "1:31.400"}, **s(2, "31.5")),
        line("16", NumberOfLaps=1),
        line("16", NumberOfLaps=2, LastLapTime={"Value": "1:30.000"}),
    ]


def test_laps_with_sectors_and_pit_flags():
    collector = LapCollector()
    for payload in race_stream():
        collector.feed(payload)
    laps = collector.laps["4"]
    assert [lap["lap"] for lap in laps] == [1, 2, 3]
    assert laps[0]["time"] is None
    assert laps[0]["sectors"] == ["30.0", "31.0", "32.0"]
    assert laps[0]["pit_in"] is False and laps[0]["pit_out"] is False
    assert laps[1] | {} == laps[1] and laps[1]["time"] == "1:31.500"
    assert laps[1]["pit_in"] is True
    assert laps[2]["pit_out"] is True and laps[2]["pit_in"] is False
    assert laps[2]["sectors"] == ["29.0", "30.9", "31.5"]


def test_stints_cover_their_laps():
    app = {
        "Lines": {
            "4": {
                "Stints": [
                    {
                        "Compound": "MEDIUM",
                        "New": "true",
                        "TotalLaps": 2,
                        "StartLaps": 0,
                    },
                    {
                        "Compound": "HARD",
                        "New": "false",
                        "TotalLaps": 5,
                        "StartLaps": 3,
                    },
                ]
            }
        }
    }
    assert stints(app) == {
        "4": [
            {
                "compound": "medium",
                "new": True,
                "start_lap": 1,
                "end_lap": 2,
                "start_age": 0,
            },
            {
                "compound": "hard",
                "new": False,
                "start_lap": 3,
                "end_lap": 4,
                "start_age": 3,
            },
        ]
    }
    assert stints(None) == {}


def test_detail_marks_bests_and_tyres():
    detail = build_detail(
        timing_stream=race_stream(),
        app_keyframe={
            "Lines": {
                "4": {
                    "Stints": [
                        {"Compound": "SOFT", "TotalLaps": 2, "StartLaps": 0},
                        {"Compound": "HARD", "TotalLaps": 3, "StartLaps": 2},
                    ]
                }
            }
        },
        driver_list={
            "4": {
                "Tla": "NOR",
                "FirstName": "Lando",
                "LastName": "Norris",
                "TeamName": "McLaren",
                "TeamColour": "F47600",
            }
        },
        rcm_keyframe={
            "Messages": [{"Utc": "t", "Category": "Other", "Message": "PIT EXIT OPEN"}]
        },
        weather_stream=[
            {"AirTemp": "20.0", "TrackTemp": "30.0"},
            {"AirTemp": "22.5", "Rainfall": "1"},
        ],
        pit_stream=[
            {"PitTimes": {"4": {"RacingNumber": "4", "Lap": "2", "Duration": "22.1"}}}
        ],
    )
    laps = detail["laps"]["4"]
    assert [lap["compound"] for lap in laps] == ["soft", "soft", "hard"]
    # The used hards had 2 laps before this stint.
    assert [lap["tyre_age"] for lap in laps] == [1, 2, 3]
    assert laps[2]["best"] == "personal"  # 1:31.400; car 16's 1:30.000 is overall
    assert detail["laps"]["16"][1]["best"] == "overall"
    # Sector 2 was faster on lap 2 (30.5): lap 3's 30.9 is no best.
    assert laps[2]["sector_bests"] == ["overall", None, "overall"]
    assert detail["drivers"]["4"]["colour"] == "#F47600"
    assert detail["race_control"][0]["message"] == "PIT EXIT OPEN"
    assert detail["weather"]["rain"] is True
    assert detail["weather"]["air"] == {
        "start": 20.0,
        "end": 22.5,
        "min": 20.0,
        "max": 22.5,
    }
    assert detail["pit_lane"] == [{"number": "4", "lap": 2, "duration": "22.1"}]


def test_pit_lane_times_are_deduplicated():
    entry = {"RacingNumber": "3", "Lap": "14", "Duration": "31.0"}
    stream = [
        {"PitTimes": {"3": entry}},
        {"PitTimes": {"_deleted": ["3"]}},
        {"PitTimes": {"3": entry}},
    ]
    assert pit_lane_times(stream) == [{"number": "3", "lap": 14, "duration": "31.0"}]


def test_no_weather():
    assert weather_summary([]) is None
