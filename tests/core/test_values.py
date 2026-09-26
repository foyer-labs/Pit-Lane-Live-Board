"""Reading F1's loosely typed values, and feed health (INV-2)."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest

from custom_components.pit_lane_live_board.core.liveness import feed_health
from custom_components.pit_lane_live_board.core.session import (
    SessionKind,
    session_kind,
    session_status,
    track_status,
)
from custom_components.pit_lane_live_board.core.values import (
    clock_seconds,
    colour,
    lap_ms,
    parse_utc,
    to_bool,
    to_float,
    to_int,
)


def test_numbers_and_booleans():
    assert to_int("14") == 14 and to_int("") is None and to_int(True) is None
    assert to_float("31.4") == 31.4 and to_float("x") is None
    assert to_bool("true") and to_bool("1") and to_bool(True)
    assert not to_bool("false") and not to_bool("0") and not to_bool(None)


def test_colours_and_times():
    assert colour("f47600") == "#F47600" and colour("#27F4D2") == "#27F4D2"
    assert colour("red") is None and colour(None) is None
    assert lap_ms("1:36.680") == 96680 and lap_ms("29.428") == 29428
    assert lap_ms("+0.25") == 250 and lap_ms("") is None and lap_ms("LAP 3") is None
    assert clock_seconds("00:17:00") == 1020 and clock_seconds("01:00:00.5") == 3600.5
    assert clock_seconds("bad") is None


def test_utc_parsing():
    assert parse_utc("2026-09-13T13:03:12.3251234Z") == datetime(
        2026, 9, 13, 13, 3, 12, 325123, tzinfo=UTC
    )
    assert parse_utc("2026-09-13T12:30:01") == datetime(
        2026, 9, 13, 12, 30, 1, tzinfo=UTC
    )
    assert parse_utc("nope") is None


@pytest.mark.parametrize(
    ("kind", "name", "expected"),
    [
        ("Race", "Race", SessionKind.RACE),
        ("Race", "Sprint", SessionKind.SPRINT),
        ("Qualifying", "Qualifying", SessionKind.QUALIFYING),
        ("Qualifying", "Sprint Qualifying", SessionKind.SPRINT_QUALIFYING),
        ("Qualifying", "Sprint Shootout", SessionKind.SPRINT_QUALIFYING),
        ("Practice", "Practice 3", SessionKind.PRACTICE),
        ("???", "", SessionKind.PRACTICE),
    ],
)
def test_session_kinds(kind, name, expected):
    assert session_kind({"Type": kind, "Name": name}) == expected


def test_statuses():
    assert session_status({"Status": "Ends"}) == "finalised"
    assert session_status({"Status": "Weird"}) is None
    assert track_status({"Status": "6"}, "started") == "virtual_safety_car"
    assert track_status({"Status": "3"}, "started") is None
    assert track_status(None, "finished") == "chequered"


def test_feed_health():
    assert feed_health(None, 100.0) == "lost"
    assert feed_health(100.0, 129.9) == "ok"
    assert feed_health(100.0, 130.0) == "stale"
    assert feed_health(100.0, 160.0) == "lost"
