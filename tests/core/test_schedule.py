"""Calendar and live windows (SPEC §6.1, §7.2)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from custom_components.pit_lane_live_board.core.schedule import (
    feed_start,
    live_window,
    match_session,
    meeting_state,
    next_session,
    parse_schedule,
    spoiler_scope,
)


def jolpica(*races):
    return {"MRData": {"RaceTable": {"season": "2026", "Races": list(races)}}}


def race(rnd, day, sprint=False, time="13:00:00Z", name=None):
    out = {
        "season": "2026",
        "round": str(rnd),
        "raceName": name or f"Grand Prix {rnd}",
        "Circuit": {
            "circuitId": f"c{rnd}",
            "circuitName": f"Circuit {rnd}",
            "Location": {"locality": "Town", "country": "Land"},
        },
        "date": f"2026-05-{day:02d}",
        "time": time,
        "FirstPractice": {"date": f"2026-05-{day - 2:02d}", "time": "11:30:00Z"},
        "Qualifying": {"date": f"2026-05-{day - 1:02d}", "time": "14:00:00Z"},
    }
    if sprint:
        out["SprintQualifying"] = {
            "date": f"2026-05-{day - 2:02d}",
            "time": "15:30:00Z",
        }
        out["Sprint"] = {"date": f"2026-05-{day - 1:02d}", "time": "10:00:00Z"}
    else:
        out["SecondPractice"] = {"date": f"2026-05-{day - 2:02d}", "time": "15:00:00Z"}
        out["ThirdPractice"] = {"date": f"2026-05-{day - 1:02d}", "time": "10:30:00Z"}
    return out


MEETINGS = parse_schedule(jolpica(race(2, 17, sprint=True), race(1, 10)))


def at(day, hour, minute=0):
    return datetime(2026, 5, day, hour, minute, tzinfo=UTC)


def test_meetings_in_round_order_with_sessions_in_time_order():
    first, second = MEETINGS
    assert (first.round, second.round) == (1, 2)
    assert [s.kind for s in first.sessions] == [
        "practice_1",
        "practice_2",
        "practice_3",
        "qualifying",
        "race",
    ]
    assert [s.kind for s in second.sessions] == [
        "practice_1",
        "sprint_qualifying",
        "sprint",
        "qualifying",
        "race",
    ]
    assert second.sprint and not first.sprint
    assert first.race.key == "2026-1-race"
    assert first.race.start == at(10, 13)
    assert first.race.end == at(10, 15)


def test_old_seasons_have_dates_only():
    old = race(1, 10)
    del (
        old["time"],
        old["FirstPractice"],
        old["Qualifying"],
        old["SecondPractice"],
        old["ThirdPractice"],
    )
    (meeting,) = parse_schedule(jolpica(old))
    assert meeting.race.start is None and meeting.race.day.isoformat() == "2026-05-10"
    assert meeting.started(at(10, 0)) and not meeting.finished(at(10, 23))
    assert meeting.finished(at(11, 0))


def test_garbage_is_no_calendar():
    assert parse_schedule(None) == []
    assert parse_schedule({"MRData": {}}) == []


def test_next_session():
    meeting, session = next_session(MEETINGS, at(10, 12))
    assert (meeting.round, session.kind) == (1, "race")
    meeting, session = next_session(MEETINGS, at(10, 20))
    assert (meeting.round, session.kind) == (2, "practice_1")
    assert next_session(MEETINGS, at(30, 0)) is None


def test_live_window_opens_30_minutes_before():
    assert live_window(MEETINGS, at(10, 12, 29)) is None
    _, session = live_window(MEETINGS, at(10, 12, 30))
    assert session.kind == "race"
    # The hard cap: four hours after the scheduled end.
    assert live_window(MEETINGS, at(10, 19, 0)) is not None
    assert live_window(MEETINGS, at(10, 19, 1)) is None


def test_meeting_states():
    first, second = MEETINGS
    now = at(9, 12)
    assert meeting_state(first, MEETINGS, now) == "next"
    assert meeting_state(second, MEETINGS, now) == "upcoming"
    assert meeting_state(first, MEETINGS, at(10, 14)) == "live"
    # While round 1's race is live, round 2 holds the next session.
    assert meeting_state(second, MEETINGS, at(10, 14)) == "next"
    # Between two sessions of the same weekend, that weekend is still next.
    assert meeting_state(first, MEETINGS, at(9, 12)) == "next"
    assert meeting_state(first, MEETINGS, at(11, 0)) == "done"
    assert meeting_state(second, MEETINGS, at(11, 0)) == "next"


def test_spoiler_scope_is_the_last_meeting_that_started():
    assert spoiler_scope(MEETINGS, at(1, 0)) is None
    assert spoiler_scope(MEETINGS, at(8, 11, 30)).round == 1
    assert spoiler_scope(MEETINGS, at(14, 0)).round == 1
    assert spoiler_scope(MEETINGS, at(15, 12)).round == 2


def test_match_session_by_kind_and_nearest_time():
    session = match_session(MEETINGS, "practice", at(8, 15, 5))
    assert session.key == "2026-1-practice_2"
    assert match_session(MEETINGS, "race", at(10, 13, 3)).key == "2026-1-race"
    assert match_session(MEETINGS, "race", at(20, 13)) is None
    assert match_session(MEETINGS, "race", None) is None


def test_feed_start_to_utc():
    info = {"StartDate": "2026-09-13T15:00:00", "GmtOffset": "02:00:00"}
    assert feed_start(info) == datetime(2026, 9, 13, 13, tzinfo=UTC)
    info = {"StartDate": "2026-03-08T10:00:00", "GmtOffset": "-05:00:00"}
    assert feed_start(info) == datetime(2026, 3, 8, 15, tzinfo=UTC)
    assert feed_start({"StartDate": "nope"}) is None
    assert feed_start(None) is None


def test_session_serialisation():
    data = MEETINGS[0].to_dict()
    assert data["sessions"][-1] == {
        "key": "2026-1-race",
        "kind": "race",
        "date": "2026-05-10",
        "start": "2026-05-10T13:00:00+00:00",
        "end": (at(10, 13) + timedelta(hours=2)).isoformat(),
    }


def test_overlapping_windows_prefer_the_session_about_to_start():
    # FP3 ended at 11:30; Qualifying starts at 14:00: at 13:45 it is Qualifying.
    _, session = live_window(MEETINGS, at(9, 13, 45))
    assert session.kind == "qualifying"
    # Friday: FP2 at 15:00 wins over FP1's hard cap.
    _, session = live_window(MEETINGS, at(8, 15, 0))
    assert session.kind == "practice_2"


def test_finished_sessions_are_skipped():
    # FP3 finished at 11:30: at 12:00 nothing else is open.
    assert (
        live_window(MEETINGS, at(9, 12, 0), skip=frozenset({"2026-1-practice_3"}))
        is None
    )
    # With FP2 finished early, FP1's window (still inside its hard cap) is what is left.
    _, session = live_window(
        MEETINGS, at(8, 16, 0), skip=frozenset({"2026-1-practice_2"})
    )
    assert session.kind == "practice_1"
