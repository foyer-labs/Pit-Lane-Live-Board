"""Automation events (SPEC §10.3)."""

from __future__ import annotations

from custom_components.pit_lane_live_board.core.events import derive

from .feed import session_info


def topics(status="Started", track="1", key=9001, messages=None):
    return {
        "SessionInfo": session_info(key=key),
        "SessionStatus": {"Status": status},
        "TrackStatus": {"Status": track},
        "RaceControlMessages": {"Messages": messages or []},
    }


def test_the_first_observation_only_records():
    events, marks = derive({}, topics(track="4"))
    assert events == []
    assert marks == {
        "session_key": 9001,
        "session": "started",
        "track": "safety_car",
        "chequered": "",
    }


def test_transitions_fire_once():
    _, marks = derive({}, topics(status="Inactive"))
    events, marks = derive(marks, topics(status="Started"))
    assert events == ["session_started"]
    events, marks = derive(marks, topics(status="Started"))
    assert events == []
    events, marks = derive(marks, topics(track="2"))
    assert events == ["yellow_flag"]
    events, marks = derive(marks, topics(track="4"))
    assert events == ["safety_car"]
    events, marks = derive(marks, topics(track="1"))
    assert events == ["green_flag"]
    for code, name in (
        ("6", "virtual_safety_car"),
        ("7", "vsc_ending"),
        ("5", "red_flag"),
    ):
        events, marks = derive(marks, topics(track=code))
        assert events == [name]


def test_finish_and_chequered():
    _, marks = derive({}, topics())
    flag = {
        "Utc": "2026-05-10T14:35:00",
        "Category": "Flag",
        "Flag": "CHEQUERED",
        "Message": "CHEQUERED FLAG",
    }
    events, marks = derive(marks, topics(status="Finished", messages=[flag]))
    assert events == ["session_ended", "chequered_flag"]
    events, marks = derive(marks, topics(status="Finalised", messages=[flag]))
    assert events == []


def test_marks_survive_a_reconnect():
    _, marks = derive({}, topics(track="4"))
    stored = dict(marks)
    events, _ = derive(stored, topics(track="4"))
    assert events == []


def test_a_new_session_starts_clean():
    _, marks = derive({}, topics(track="4"))
    events, marks = derive(marks, topics(key=9002, track="1"))
    assert events == []
    assert marks["session_key"] == 9002


def test_no_session_no_events():
    assert derive({"a": 1}, {}) == ([], {"a": 1})
