"""The small-screen sensor's content (decision 54)."""

from __future__ import annotations

from custom_components.pit_lane_live_board.core.display import build


def view(state="live"):
    return {
        "state": state,
        "header": {
            "meeting": "Spanish Grand Prix",
            "session": "Race",
            "kind": "race",
            "lap": 31,
            "total_laps": 57,
            "track_status": "safety_car",
            "remaining": None,
        },
        "stewards": {"safety_car": "deployed"},
        "tower": [
            {
                "position": 1,
                "tla": "LEC",
                "gap": "LAP 31",
                "tyre": {"compound": "hard", "age": 30},
            },
            {
                "position": 2,
                "tla": "ANT",
                "gap": "+3.561",
                "tyre": {"compound": "medium", "age": 16},
            },
            {
                "position": 3,
                "tla": "VER",
                "gap": "+8.951",
                "in_pit": True,
                "tyre": None,
            },
        ],
        "next_session": {
            "meeting": "Azerbaijan Grand Prix",
            "kind": "practice_1",
            "start": "2026-09-24T08:30:00+00:00",
        },
    }


def test_flat_short_rows_for_a_screen():
    out = build(view(), ("ANT",))
    a = out["attributes"]
    assert out["state"] == "live"
    assert (a["lap"], a["total_laps"], a["track"]) == (31, 57, "safety_car")
    assert a["flag_colour"] == "#ff8c00" and a["safety_car"] is True
    assert a["p1"] == " 1 LEC          H30"
    assert a["p2"] == " 2 ANT   +3.561 M16"
    assert a["p3"] == " 3 VER      PIT"
    assert a["p4"] == ""
    assert a["mine"] == "2 ANT   +3.561 M16"
    assert a["next_meeting"] == "Azerbaijan Grand Prix"


def test_nothing_shown_when_hidden_or_paused():
    for state in ("hidden", "paused"):
        a = build(view(state), ("ANT",))["attributes"]
        assert a["p1"] == "" and a["meeting"] is None and a["track"] is None
        assert a["flag_colour"] == "#000000"


def test_a_car_out_says_the_lap_it_stopped_on():
    """`laps` counts the laps completed: out after 6 is out on lap 7."""
    v = view()
    v["tower"] += [
        {"position": 4, "tla": "HAM", "gap": None, "status": "retired", "laps": 6},
        {"position": 5, "tla": "STR", "gap": "+1L", "status": "stopped", "laps": 12},
        {"position": 6, "tla": "ALB", "gap": None, "status": "retired", "laps": None},
    ]
    a = build(v, ())["attributes"]
    assert a["p4"] == " 4 HAM   OUT L7"
    assert a["p5"] == " 5 STR STOP L13"
    assert a["p6"] == " 6 ALB      OUT"
