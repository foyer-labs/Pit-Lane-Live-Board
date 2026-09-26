"""The merged live state (SPEC §4.2)."""

from __future__ import annotations

from custom_components.pit_lane_live_board.core.archive_parse import encode_z
from custom_components.pit_lane_live_board.core.live_state import CarPosition, LiveState


def test_keyframes_then_deltas():
    state = LiveState()
    state.apply_keyframes({"LapCount": {"CurrentLap": 1, "TotalLaps": 57}})
    state.apply("LapCount", {"CurrentLap": 2}, "2026-05-10T13:05:00Z")
    assert state.get("LapCount") == {"CurrentLap": 2, "TotalLaps": 57}
    assert state.last_utc == "2026-05-10T13:05:00Z"


def test_keyframes_replace_old_state():
    state = LiveState()
    state.apply("TrackStatus", {"Status": "4", "Message": "SCDeployed"})
    state.apply_keyframes({"TrackStatus": {"Status": "1"}})
    assert state.get("TrackStatus") == {"Status": "1"}


def _positions(entries: dict, timestamp: str = "2026-05-10T13:05:00.1Z") -> str:
    return encode_z({"Position": [{"Timestamp": timestamp, "Entries": entries}]})


def test_positions_are_decoded_and_zero_fixes_dropped():
    state = LiveState()
    state.apply(
        "Position.z",
        _positions(
            {
                "4": {"Status": "OnTrack", "X": 1200, "Y": -300, "Z": 0},
                "16": {"Status": "OffTrack", "X": 50, "Y": 60, "Z": 0},
                "44": {"Status": "OnTrack", "X": 0, "Y": 0, "Z": 0},
            }
        ),
    )
    assert state.positions == {
        "4": CarPosition(1200.0, -300.0, True),
        "16": CarPosition(50.0, 60.0, False),
    }
    assert state.positions_utc == "2026-05-10T13:05:00.1Z"


def test_damaged_positions_change_nothing():
    state = LiveState()
    state.apply("Position.z", "not z data")
    state.apply("Position.z", {"Position": "x"})
    assert state.positions == {}


def test_pit_log_keeps_entries_f1_deletes():
    state = LiveState()
    state.apply_keyframes({"PitLaneTimeCollection": {"PitTimes": {}}})
    state.apply(
        "PitLaneTimeCollection",
        {"PitTimes": {"3": {"RacingNumber": "3", "Duration": "31.0", "Lap": "14"}}},
    )
    state.apply("PitLaneTimeCollection", {"PitTimes": {"_deleted": ["3"]}})
    state.apply(
        "PitLaneTimeCollection",
        {"PitTimes": {"3": {"RacingNumber": "3", "Duration": "31.0", "Lap": "14"}}},
    )
    assert state.get("PitLaneTimeCollection") == {
        "PitTimes": {"3": {"RacingNumber": "3", "Duration": "31.0", "Lap": "14"}}
    }
    assert state.pit_log == [{"number": "3", "lap": "14", "duration": "31.0"}]
