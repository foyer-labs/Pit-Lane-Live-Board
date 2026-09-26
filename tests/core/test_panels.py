"""Header, race control, weather, team radio (SPEC §7.1)."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest

from custom_components.pit_lane_live_board.core.panels import (
    header,
    message_kind,
    race_control,
    remaining,
    team_radio,
    weather,
)

from .feed import race_topics, session_info

NOW = datetime(2026, 5, 10, 13, 30, tzinfo=UTC)


@pytest.mark.parametrize(
    ("message", "kind"),
    [
        (
            {"Category": "Flag", "Flag": "YELLOW", "Message": "YELLOW IN SECTOR 3"},
            "flag",
        ),
        ({"Category": "SafetyCar", "Message": "SAFETY CAR DEPLOYED"}, "flag"),
        (
            {
                "Category": "Other",
                "Message": "FIA STEWARDS: 5 SECOND TIME PENALTY FOR CAR 44 (HAM)",
            },
            "penalty",
        ),
        (
            {
                "Category": "Other",
                "Message": "FIA STEWARDS: DRIVE THROUGH PENALTY FOR CAR 1",
            },
            "penalty",
        ),
        (
            {
                "Category": "Other",
                "Message": "FIA STEWARDS: 10 SECOND STOP/GO PENALTY FOR CAR 2",
            },
            "penalty",
        ),
        (
            {"Category": "Other", "Message": "FIA STEWARDS: PENALTY SERVED - CAR 44"},
            "penalty",
        ),
        (
            {
                "Category": "Other",
                "Message": "FIA STEWARDS: INCIDENT UNDER INVESTIGATION",
            },
            "other",
        ),
        ({"Category": "Other", "Message": "FIA STEWARDS: NO FURTHER ACTION"}, "other"),
        ({"Category": "Other", "Message": "PIT EXIT CLOSED"}, "other"),
    ],
)
def test_message_kinds(message, kind):
    assert message_kind(message) == kind


def test_race_control_newest_first_from_a_dict():
    topics = {
        "RaceControlMessages": {
            "Messages": {
                "0": {"Utc": "t1", "Lap": 1, "Category": "Other", "Message": "FIRST"},
                "1": {
                    "Utc": "t2",
                    "Lap": 2,
                    "Category": "Flag",
                    "Flag": "GREEN",
                    "Message": "SECOND",
                    "RacingNumber": 44,
                },
                "2": {"Utc": "t3", "Message": ""},
            }
        }
    }
    messages = race_control(topics)
    assert [m["message"] for m in messages] == ["SECOND", "FIRST"]
    assert messages[0]["number"] == "44" and messages[0]["kind"] == "flag"


def test_weather():
    topics = {
        "WeatherData": {
            "AirTemp": "31.4",
            "TrackTemp": "53.3",
            "Humidity": "21.4",
            "Pressure": "944.3",
            "Rainfall": "0",
            "WindDirection": "81",
            "WindSpeed": "2.2",
        }
    }
    assert weather(topics) == {
        "air": 31.4,
        "track": 53.3,
        "humidity": 21.4,
        "pressure": 944.3,
        "wind_speed": 2.2,
        "wind_direction": 81,
        "rain": False,
    }
    assert weather({}) is None


def test_team_radio_urls_newest_first():
    topics = {
        "SessionInfo": session_info(),
        "TeamRadio": {
            "Captures": [
                {
                    "Utc": "2026-05-10T13:01:00Z",
                    "RacingNumber": "4",
                    "Path": "TeamRadio/NOR_4_1.mp3",
                },
                {
                    "Utc": "2026-05-10T13:09:00Z",
                    "RacingNumber": 16,
                    "Path": "TeamRadio/LEC_16_2.mp3",
                },
            ]
        },
    }
    clips = team_radio(topics)
    assert [c["number"] for c in clips] == ["16", "4"]
    assert clips[0]["url"] == (
        "https://livetiming.formula1.com/static/"
        "2026/2026-05-10_Test_Grand_Prix/2026-05-10_Race/TeamRadio/LEC_16_2.mp3"
    )


def test_no_radio_without_a_session_path():
    assert team_radio({"TeamRadio": {"Captures": [{"Path": "x.mp3"}]}}) == []


def test_remaining_extrapolates_from_the_clock():
    clock = {
        "Utc": "2026-05-10T13:29:00Z",
        "Remaining": "00:17:00",
        "Extrapolating": True,
    }
    assert remaining({"ExtrapolatedClock": clock}, NOW) == 16 * 60
    clock["Extrapolating"] = False
    assert remaining({"ExtrapolatedClock": clock}, NOW) == 17 * 60
    assert remaining({}, NOW) is None


def test_header_race():
    h = header(race_topics(), NOW)
    assert h["meeting"] == "Test Grand Prix"
    assert h["circuit"] == "Testring" and h["circuit_key"] == 99
    assert h["kind"] == "race"
    assert h["status"] == "started"
    assert h["track_status"] == "clear"
    assert (h["lap"], h["total_laps"]) == (20, 57)


def test_header_finished_is_chequered():
    topics = race_topics()
    topics["SessionStatus"] = {"Status": "Finalised"}
    topics["TrackStatus"] = {"Status": "4"}
    h = header(topics, NOW)
    assert h["status"] == "finalised" and h["track_status"] == "chequered"
