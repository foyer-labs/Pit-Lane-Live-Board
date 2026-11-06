"""The live page payload (SPEC §7.1, INV-2, INV-5)."""

from __future__ import annotations

from datetime import UTC, datetime

from custom_components.pit_lane_live_board.core import live_view
from custom_components.pit_lane_live_board.core.live_state import LiveState

from .feed import race_topics

NOW = datetime(2026, 5, 10, 13, 30, tzinfo=UTC)
NEXT = {"meeting": "Next GP", "kind": "race"}


def build(state, **overrides):
    args = {
        "state": state,
        "now": NOW,
        "health": "ok",
        "syncing": False,
        "hidden": False,
        "delay": 0,
        "next_session": NEXT,
        "data_age": 0.4,
        "map_available": False,
    }
    return live_view.build(**{**args, **overrides})


def loaded() -> LiveState:
    state = LiveState()
    state.apply_keyframes(race_topics())
    return state


def test_idle_connecting_syncing():
    assert build(None)["state"] == "idle"
    assert build(None)["next_session"] == NEXT
    assert build(LiveState())["state"] == "connecting"
    assert build(loaded(), syncing=True)["state"] == "syncing"


def test_live_payload():
    view = build(loaded(), delay=30)
    assert view["state"] == "live"
    assert view["delay"] == 30
    assert [r["tla"] for r in view["tower"]] == ["LEC", "NOR"]
    assert view["header"]["meeting"] == "Test Grand Prix"
    assert set(view) >= {"race_control", "weather", "radio", "pits", "map_available"}


def test_stale_and_lost_are_said():
    assert build(loaded(), health="stale")["state"] == "stale"
    assert build(loaded(), health="lost")["state"] == "lost"


def test_hidden_sends_only_the_session_name():
    view = build(loaded(), hidden=True)
    assert view["state"] == "hidden"
    assert view["header"] == {
        "meeting": "Test Grand Prix",
        "session": "Race",
        "kind": "race",
    }
    assert not {"tower", "race_control", "radio", "weather", "pits"} & set(view)


def test_the_session_clock_moves_by_whole_seconds():
    """A header that moved by a fraction of a second would travel again at every
    publish."""
    from datetime import timedelta

    state = LiveState()
    state.apply_keyframes(
        {
            **race_topics(),
            "ExtrapolatedClock": {
                "Utc": "2026-05-10T13:29:00Z",
                "Remaining": "00:17:00",
                "Extrapolating": True,
            },
        }
    )
    builder = live_view.LiveViewBuilder()
    first = builder.sections(state, NOW + timedelta(seconds=0.2))["header"]
    again = builder.sections(state, NOW + timedelta(seconds=0.4))["header"]
    assert first[1]["remaining"] == 16 * 60 and isinstance(first[1]["remaining"], int)
    assert first[0] == again[0]


def test_the_next_session_does_not_inherit_the_last_ones_penalties():
    """São Paulo FP1 2026: the window opened on the Mexico race's keyframes and the
    practice summary listed the race's penalties."""
    topics = race_topics()
    topics["RaceControlMessages"] = {
        "Messages": [
            {
                "Utc": "2026-05-10T13:30:00",
                "Lap": 30,
                "Category": "Other",
                "Message": "FIA STEWARDS: 5 SECOND TIME PENALTY FOR CAR 16 (LEC) - "
                "CAUSING A COLLISION",
            }
        ]
    }
    state = LiveState()
    state.apply_keyframes(topics)
    builder = live_view.LiveViewBuilder()
    sections = builder.sections(state, NOW)
    assert len(sections["stewards"][1]["penalties"]) == 1
    assert {r["number"]: r["penalty"] for r in sections["tower"][1]}["16"] == 5

    state.apply("SessionInfo", {"Key": 9002, "Type": "Practice", "Name": "Practice 1"})
    sections = builder.sections(state, NOW)
    assert sections["stewards"][1]["penalties"] == []
    assert all(row["penalty"] is None for row in sections["tower"][1])

    state.apply(
        "RaceControlMessages",
        {
            "Messages": {
                "0": {
                    "Utc": "2026-05-10T14:00:00",
                    "Category": "Other",
                    "Message": "FIA STEWARDS: 5 SECOND TIME PENALTY FOR CAR 4 (NOR) - "
                    "SPEEDING IN THE PIT LANE",
                }
            }
        },
    )
    penalties = builder.sections(state, NOW)["stewards"][1]["penalties"]
    assert [p["cars"][0]["tla"] for p in penalties] == ["NOR"]
