"""Flags, safety car and stewards' decisions from race control (SPEC §7.1.1).

The message texts are single lines in the forms F1 uses, as short as the tests need
(decision 27).
"""

from __future__ import annotations

import pytest

from custom_components.pit_lane_live_board.core.stewards import (
    StewardsBook,
    book_from,
    classify,
    decision,
    penalty_seconds,
)


def msg(text, lap=10, **extra):
    return {
        "Utc": "2026-05-10T13:30:00",
        "Lap": lap,
        "Category": "Other",
        "Message": text,
        **extra,
    }


@pytest.mark.parametrize(
    ("text", "kind"),
    [
        (
            "FIA STEWARDS: 5 SECOND TIME PENALTY FOR CAR 44 (HAM) - CAUSING A COLLISION",
            "time_penalty",
        ),
        (
            "FIA STEWARDS: DRIVE THROUGH PENALTY FOR CAR 1 (VER) - SPEEDING",
            "drive_through",
        ),
        ("FIA STEWARDS: 10 SECOND STOP/GO PENALTY FOR CAR 2 (SAR)", "stop_go"),
        (
            "FIA STEWARDS: 3 PLACE GRID PENALTY FOR CAR 4 (NOR) - IMPEDING",
            "grid_penalty",
        ),
        (
            "FIA STEWARDS: PENALTY SERVED - 10 SECOND TIME PENALTY FOR CAR 22 (TSU) - CAUSING A COLLISION",
            "penalty_served",
        ),
        (
            "TURN 2 INCIDENT INVOLVING CARS 10 (GAS) AND 11 (PER) NOTED - CAUSING A COLLISION",
            "noted",
        ),
        (
            "FIA STEWARDS: INCIDENT INVOLVING CAR 3 (RIC) UNDER INVESTIGATION - FALSE START",
            "investigation",
        ),
        (
            "FIA STEWARDS: INCIDENT INVOLVING CAR 11 (PER) WILL BE INVESTIGATED AFTER THE RACE - UNSAFE CONDITION",
            "investigation_after_race",
        ),
        (
            "FIA STEWARDS: TURN 2 INCIDENT INVOLVING CARS 10 (GAS) AND 11 (PER) REVIEWED NO FURTHER INVESTIGATION",
            "no_further_action",
        ),
        (
            "FIA STEWARDS: INCIDENT INVOLVING CAR 63 (RUS) NO FURTHER ACTION - YELLOW FLAG INFRINGEMENT",
            "no_further_action",
        ),
        ("FIA STEWARDS: WARNING FOR CAR 5 (BOR) - MOVING UNDER BRAKING", "warning"),
        (
            "BLACK AND WHITE FLAG FOR CAR 44 (HAM) - TRACK LIMITS",
            "black_and_white_flag",
        ),
        (
            "CAR 63 (RUS) TIME 1:36.556 DELETED - TRACK LIMITS AT TURN 14 LAP 2 14:06:24",
            "lap_deleted",
        ),
        (
            "CAR 16 (LEC) LAP DELETED - TRACK LIMITS AT TURN 9 LAP 31 14:52:46 (PIT)",
            "lap_deleted",
        ),
        ("GREEN LIGHT - PIT EXIT OPEN", None),
        ("WAVED BLUE FLAG FOR CAR 55 (SAI) TIMED AT 15:55:49", None),
    ],
)
def test_classify(text, kind):
    assert classify(text) == kind


def test_decision_fields():
    record = decision(
        msg(
            "FIA STEWARDS: 5 SECOND TIME PENALTY FOR CAR 44 (HAM) - "
            "LEAVING THE TRACK AND GAINING AN ADVANTAGE (16:37:16)",
            lap=33,
        )
    )
    assert record["cars"] == [{"number": "44", "tla": "HAM"}]
    assert record["seconds"] == 5 and record["lap"] == 33
    assert record["reason"] == "LEAVING THE TRACK AND GAINING AN ADVANTAGE"
    three = decision(
        msg(
            "TURN 10 INCIDENT INVOLVING CARS 55 (SAI), 77 (BOT) AND 3 (RIC) NOTED - CAUSING A COLLISION"
        )
    )
    assert [c["tla"] for c in three["cars"]] == ["SAI", "BOT", "RIC"]
    assert three["turn"] == 10
    deleted = decision(
        msg(
            "CAR 63 (RUS) TIME 1:36.556 DELETED - TRACK LIMITS AT TURN 14 LAP 2 14:06:24"
        )
    )
    assert deleted["seconds"] is None and deleted["reason"] == "TRACK LIMITS"
    dashed = decision(
        msg("FIA STEWARDS: WARNING FOR CAR 5 (BOR) - FAILING TO FOLLOW � ESCAPE ROAD")
    )
    assert dashed["reason"] == "FAILING TO FOLLOW - ESCAPE ROAD"
    assert decision(msg("PIT EXIT CLOSED")) is None


def test_an_incident_from_noted_to_penalty_to_served():
    book = book_from(
        [
            msg(
                "INCIDENT INVOLVING CAR 10 (GAS) NOTED - SPEEDING IN THE PIT LANE (16:37:16)"
            ),
            msg(
                "FIA STEWARDS: INCIDENT INVOLVING CAR 10 (GAS) UNDER INVESTIGATION - SPEEDING IN THE PIT LANE (16:37:16)"
            ),
        ]
    )
    summary = book.summary("clear")
    assert [i["status"] for i in summary["investigations"]] == ["investigation"]
    book.feed(
        msg(
            "FIA STEWARDS: 5 SECOND TIME PENALTY FOR CAR 10 (GAS) - SPEEDING IN THE PIT LANE (16:37:16)"
        )
    )
    summary = book.summary("clear")
    assert summary["investigations"] == []
    assert summary["decided"][0]["status"] == "time_penalty"
    assert penalty_seconds(summary) == {"10": 5}
    book.feed(
        msg(
            "FIA STEWARDS: PENALTY SERVED - 5 SECOND TIME PENALTY FOR CAR 10 (GAS) - SPEEDING IN THE PIT LANE"
        )
    )
    summary = book.summary("clear")
    assert summary["penalties"][0]["served"] is True
    assert penalty_seconds(summary) == {}


def test_no_further_action_closes_the_incident():
    book = book_from(
        [
            msg(
                "TURN 2 INCIDENT INVOLVING CARS 10 (GAS) AND 11 (PER) NOTED - CAUSING A COLLISION"
            ),
            msg(
                "FIA STEWARDS: TURN 2 INCIDENT INVOLVING CARS 10 (GAS) AND 11 (PER) REVIEWED NO FURTHER INVESTIGATION - CAUSING A COLLISION"
            ),
        ]
    )
    summary = book.summary("clear")
    assert summary["investigations"] == []
    assert summary["decided"][0]["status"] == "no_further_action"


def test_track_limits_count_and_black_and_white():
    book = book_from(
        [
            msg(
                "CAR 44 (HAM) TIME 1:43.055 DELETED - TRACK LIMITS AT TURN 1 LAP 4 15:09:18"
            ),
            msg(
                "CAR 44 (HAM) LAP DELETED - TRACK LIMITS AT TURN 17 LAP 6 15:14:10 (PIT)"
            ),
            msg("BLACK AND WHITE FLAG FOR CAR 44 (HAM) - TRACK LIMITS"),
            msg(
                "CAR 1 (NOR) TIME 1:28.809 DELETED - TRACK LIMITS AT TURN 1 LAP 20 16:06:13"
            ),
        ]
    )
    limits = book.summary("clear")["track_limits"]
    assert [(e["tla"], e["deleted"], e["black_and_white"]) for e in limits] == [
        ("HAM", 2, True),
        ("NOR", 1, False),
    ]


def flag(value, scope="Sector", sector=None):
    out = {
        "Category": "Flag",
        "Flag": value,
        "Scope": scope,
        "Message": f"{value} FLAG",
    }
    if sector is not None:
        out["Sector"] = sector
    return out


def test_sector_yellows_until_clear():
    book = StewardsBook()
    book.feed(flag("YELLOW", sector=7))
    book.feed(flag("DOUBLE YELLOW", sector=10))
    summary = book.summary("yellow")
    assert summary["yellow"] and summary["double_yellow"]
    assert summary["yellow_sectors"] == [
        {"sector": 7, "flag": "yellow"},
        {"sector": 10, "flag": "double_yellow"},
    ]
    book.feed(flag("CLEAR", sector=10))
    assert book.summary("clear")["yellow_sectors"] == [{"sector": 7, "flag": "yellow"}]
    book.feed(flag("GREEN", scope="Track"))
    assert book.summary("clear")["yellow"] is False


def test_safety_car_phases():
    book = StewardsBook()
    book.feed(
        {
            "Category": "SafetyCar",
            "Status": "DEPLOYED",
            "Mode": "SAFETY CAR",
            "Message": "SAFETY CAR DEPLOYED",
        }
    )
    assert book.summary("safety_car")["safety_car"] == "deployed"
    book.feed(
        {
            "Category": "SafetyCar",
            "Status": "IN THIS LAP",
            "Mode": "SAFETY CAR",
            "Message": "SAFETY CAR IN THIS LAP",
        }
    )
    assert book.summary("safety_car")["safety_car"] == "ending"
    # The track status is the authority: back to green, no safety car.
    assert book.summary("clear")["safety_car"] is None
    assert book.summary("vsc_ending")["virtual_safety_car"] == "ending"
    assert book.summary("red_flag")["red_flag"] is True


def test_new_decisions_are_handed_out_once():
    book = StewardsBook()
    book.feed(msg("BLACK AND WHITE FLAG FOR CAR 44 (HAM) - TRACK LIMITS"))
    book.feed(msg("PIT EXIT OPEN"))
    assert [d["kind"] for d in book.take_new()] == ["black_and_white_flag"]
    assert book.take_new() == []
    assert book.seen == 2


@pytest.mark.parametrize(
    "text",
    [
        "FIA STEWARDS: TURN 5 INCIDENT INVOLVING CAR 63 (RUS) WILL BE INVESTIGATED AFTER THE SESSION - IMPEDING (16:16:33)",
        "FIA STEWARDS: INCIDENT INVOLVING CAR 10 (GAS) WILL BE INVESTIGATED AFTER THE SPRINT - UNSAFE CONDITION",
        "FIA STEWARDS: INCIDENT INVOLVING CAR 11 (PER) WILL BE INVESTIGATED AFTER THE RACE - UNSAFE CONDITION",
    ],
)
def test_investigated_after_the_session_or_sprint(text):
    """Qualifying and sprints say "after the session" and "after the sprint"."""
    assert classify(text) == "investigation_after_race"
    book = book_from([msg(text)])
    assert [i["status"] for i in book.summary("clear")["investigations"]] == [
        "investigation_after_race"
    ]


@pytest.mark.parametrize(
    "text",
    [
        "FIA STEWARDS: STOP-AND-GO PENALTY FOR CAR 43 (COL) - STARTING PROCEDURE INFRINGEMENT",
        "FIA STEWARDS: 10 SECOND STOP AND GO PENALTY FOR CAR 6 (HAD)",
        "FIA STEWARDS: 10 SECOND STOP-GO PENALTY FOR CAR 6 (HAD)",
    ],
)
def test_every_spelling_of_stop_and_go(text):
    assert classify(text) == "stop_go"


def test_a_stop_and_go_closes_its_investigation():
    book = book_from(
        [
            msg(
                "FIA STEWARDS: INCIDENT INVOLVING CAR 43 (COL) UNDER INVESTIGATION - STARTING PROCEDURE INFRINGEMENT"
            ),
            msg(
                "FIA STEWARDS: STOP-AND-GO PENALTY FOR CAR 43 (COL) - STARTING PROCEDURE INFRINGEMENT"
            ),
        ]
    )
    summary = book.summary("clear")
    assert summary["investigations"] == []
    assert [p["kind"] for p in summary["penalties"]] == ["stop_go"]


def test_sectors_raised_after_the_chequered_flag_are_not_a_yellow():
    """Race control waves yellows for the cars stopping after the flag and never
    clears them: the yellow sensor must not stay on until the window closes."""
    book = StewardsBook()
    book.feed(flag("CHEQUERED", scope="Track"))
    book.feed(flag("DOUBLE YELLOW", sector=4))
    summary = book.summary("chequered")
    assert summary["yellow"] is False and summary["yellow_sectors"] == []
    assert book.summary("red_flag")["yellow"] is False
    # The next part's green light clears them for good.
    book.feed(flag("GREEN", scope="Track"))
    assert book.summary("clear")["yellow"] is False


def test_an_update_that_changes_the_cars_replaces_the_incident():
    """Spain 2026: F1 adds a car in an "UPDATE:" and closes the incident with both;
    the first record must not stay open beside it."""
    book = book_from(
        [
            msg("TURN 5 INCIDENT INVOLVING CAR 22 (TSU) NOTED (15:23:41)"),
            msg(
                "UPDATE: TURN 5 INCIDENT INVOLVING CARS 11 (PER) AND 22 (TSU) NOTED (15:23:41)"
            ),
        ]
    )
    investigations = book.summary("clear")["investigations"]
    assert [[c["tla"] for c in i["cars"]] for i in investigations] == [["PER", "TSU"]]
    book.feed(
        msg(
            "FIA STEWARDS: TURN 5 INCIDENT INVOLVING CARS 11 (PER) AND 22 (TSU) REVIEWED NO FURTHER INVESTIGATION (15:23:41)"
        )
    )
    assert book.summary("clear")["investigations"] == []


def test_an_update_that_drops_a_car_and_adds_the_reason():
    """Canada 2026 qualifying: two cars noted, then one with the reason."""
    book = book_from(
        [
            msg(
                "TURN 13 INCIDENT INVOLVING CARS 11 (PER) AND 14 (ALO) NOTED (16:03:41)"
            ),
            msg(
                "UPDATE: TURN 13 INCIDENT INVOLVING CAR 11 (PER) NOTED - FAILING TO FOLLOW RACE DIRECTORS INSTRUCTIONS (16:03:41)"
            ),
            msg(
                "FIA STEWARDS: TURN 13 INCIDENT INVOLVING CAR 11 (PER) WILL BE INVESTIGATED AFTER THE SESSION - FAILING TO FOLLOW RACE DIRECTORS INSTRUCTIONS (16:03:41)"
            ),
        ]
    )
    investigations = book.summary("clear")["investigations"]
    assert [(i["status"], [c["tla"] for c in i["cars"]]) for i in investigations] == [
        ("investigation_after_race", ["PER"])
    ]


def test_same_moment_different_cars_stay_two_incidents():
    """Two cars leaving the pit exit on a red light at the same second."""
    book = book_from(
        [
            msg(
                "INCIDENT INVOLVING CAR 87 (BEA) NOTED - LEAVING PIT EXIT ON RED LIGHT (15:33:53)"
            ),
            msg(
                "INCIDENT INVOLVING CAR 5 (BOR) NOTED - LEAVING PIT EXIT ON RED LIGHT (15:33:53)"
            ),
        ]
    )
    assert len(book.summary("clear")["investigations"]) == 2


def test_laps_deleted_for_a_double_yellow_and_by_code_alone():
    double = decision(msg("CAR 77 (BOT) LAP DELETED - DOUBLE YELLOW AT TURN 16"))
    assert double["kind"] == "lap_deleted" and double["reason"] == "DOUBLE YELLOW"
    book = book_from(
        [
            msg(
                "CAR 16 (LEC) TIME 1:36.100 DELETED - TRACK LIMITS AT TURN 14 LAP 2 14:06:24"
            ),
            msg(
                "CAR LEC TIME 1:36.518 DELETED - TRACK LIMITS AT TURN 14 (NEXT LAP) (Q1)"
            ),
            msg(
                "CAR BEA TIME 1:39.643 DELETED - TRACK LIMITS AT TURN 14 (NEXT LAP) (Q2)"
            ),
            msg("CAR 77 (BOT) LAP DELETED - DOUBLE YELLOW AT TURN 16"),
            msg(
                "BLACK AND WHITE FLAG FOR CAR 1 (NOR) - FAILING TO FOLLOW RACE DIRECTORS INSTRUCTIONS"
            ),
        ]
    )
    limits = book.summary("clear")["track_limits"]
    # LEC's number comes from the earlier message; BEA's is unknown but still
    # counted; BOT's double yellow and NOR's flag are not track limits.
    assert [(e["number"], e["tla"], e["deleted"]) for e in limits] == [
        ("16", "LEC", 2),
        (None, "BEA", 1),
    ]


def test_the_vsc_is_not_the_safety_car():
    """F1's VSC messages carry the mode "VSC": they must not end a safety car."""
    book = StewardsBook()
    book.feed(
        {
            "Category": "SafetyCar",
            "Status": "DEPLOYED",
            "Mode": "VSC",
            "Message": "VSC DEPLOYED",
        }
    )
    book.feed(
        {
            "Category": "SafetyCar",
            "Status": "ENDING",
            "Mode": "VSC",
            "Message": "VSC ENDING",
        }
    )
    assert book.virtual_safety_car == "ending"
    assert book.safety_car is None
    # A later safety car, seen by the track status before its own message.
    assert book.summary("safety_car")["safety_car"] == "deployed"
