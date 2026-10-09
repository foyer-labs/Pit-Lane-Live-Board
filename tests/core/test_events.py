"""Automation events (SPEC §10.3)."""

from __future__ import annotations

from custom_components.pit_lane_live_board.core.events import derive

from .feed import session_info


def topics(status="Started", track="1", key=9001, messages=None, part=None):
    out = {
        "SessionInfo": session_info(key=key),
        "SessionStatus": {"Status": status},
        "TrackStatus": {"Status": track},
        "RaceControlMessages": {"Messages": messages or []},
    }
    if part is not None:
        out["TimingData"] = {"NoEntries": [22, 16, 10], "SessionPart": part}
    return out


def test_the_first_observation_only_records():
    events, marks = derive({}, topics(track="4"))
    assert events == []
    assert marks == {
        "session_key": 9001,
        "session": "started",
        "started": True,
        "ended": False,
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


def test_a_red_flag_lasts_while_the_session_is_stopped():
    """Spain 2026 FP3: the track code went back to AllClear three minutes after the
    red flag, while the session stayed Aborted for half an hour, then ended
    without a restart (Aborted, then Finalised)."""
    _, marks = derive({}, topics())
    events, marks = derive(marks, topics(status="Aborted", track="5"))
    assert events == ["red_flag"]
    events, marks = derive(marks, topics(status="Aborted", track="1"))
    assert events == []
    events, marks = derive(marks, topics(status="Finalised", track="1"))
    assert events == ["session_ended"]


def test_a_restart_after_a_red_flag_is_not_a_new_session():
    _, marks = derive({}, topics(status="Inactive"))
    events, marks = derive(marks, topics())
    assert events == ["session_started"]
    events, marks = derive(marks, topics(status="Aborted", track="5"))
    assert events == ["red_flag"]
    events, marks = derive(marks, topics(status="Inactive", track="1"))
    assert events == ["green_flag"]
    events, marks = derive(marks, topics(status="Started", track="1"))
    assert events == []


def test_qualifying_ends_after_its_last_part():
    """Started, Finished, Inactive for each part: one start, one end, and the
    chequered flag of each part."""

    def chequered(minute):
        return {
            "Utc": f"2026-09-12T14:{minute}:00",
            "Category": "Flag",
            "Flag": "CHEQUERED",
            "Message": "CHEQUERED FLAG",
        }

    _, marks = derive({}, topics(status="Inactive", part=1))
    fired = []
    flags = []
    for part, minute in ((1, 18), (2, 40), (3, 59)):
        for status in ("Started", "Finished"):
            if status == "Finished":
                flags.append(chequered(minute))
            events, marks = derive(
                marks, topics(status=status, part=part, messages=list(flags))
            )
            fired += events
        if part < 3:
            # F1 moves on to the next part while this one still reads Finished.
            for step in (
                topics(status="Finished", part=part + 1, messages=list(flags)),
                topics(status="Inactive", part=part + 1, messages=list(flags)),
            ):
                events, marks = derive(marks, step)
                fired += events
    events, marks = derive(
        marks, topics(status="Finalised", part=3, messages=list(flags))
    )
    fired += events
    assert fired == [
        "session_started",
        "chequered_flag",
        "chequered_flag",
        "session_ended",
        "chequered_flag",
    ]


def test_the_track_status_sensor_reads_red_while_aborted():
    from custom_components.pit_lane_live_board.core.session import track_status

    assert track_status({"Status": "1"}, "aborted") == "red_flag"
    assert track_status({"Status": "1"}, "started") == "clear"


def with_started(status, started, key=9002):
    out = topics(status=status, key=key)
    out["SessionStatus"]["Started"] = started
    return out


def test_the_last_sessions_finalised_does_not_end_the_next_one():
    """Singapore 2026: F1 named the new session while the status still read the
    last one's Finalised; its first word, Inactive/Inactive, starts it clean."""
    events, marks = derive({}, with_started("Finalised", "Finished"))
    assert events == []
    events, marks = derive(marks, with_started("Inactive", "Inactive"))
    assert events == [] and marks["started"] is False and marks["ended"] is False
    events, marks = derive(marks, with_started("Started", "Started"))
    assert events == ["session_started"]
    events, marks = derive(marks, with_started("Finished", "Finished"))
    assert events == ["session_ended"]
    events, marks = derive(marks, with_started("Finalised", "Finished"))
    assert events == [] and marks["ended"] is True


def test_inactive_after_a_red_flag_keeps_the_session_started():
    _, marks = derive({}, with_started("Started", "Started"))
    _, marks = derive(marks, with_started("Aborted", "Started"))
    events, marks = derive(marks, with_started("Inactive", "Started"))
    assert marks["started"] is True
    events, marks = derive(marks, with_started("Started", "Started"))
    assert "session_started" not in events
