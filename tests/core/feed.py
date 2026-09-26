"""Synthetic live-timing topics, shaped like F1's (decision 27: no real data here)."""

from __future__ import annotations

from typing import Any


def session_info(
    kind: str = "Race", name: str = "Race", key: int = 9001
) -> dict[str, Any]:
    return {
        "Meeting": {
            "Key": 1200,
            "Name": "Test Grand Prix",
            "OfficialName": "TEST GRAND PRIX 2026",
            "Country": {"Name": "Testland"},
            "Circuit": {"Key": 99, "ShortName": "Testring"},
        },
        "Key": key,
        "Type": kind,
        "Name": name,
        "StartDate": "2026-05-10T15:00:00",
        "GmtOffset": "02:00:00",
        "Path": "2026/2026-05-10_Test_Grand_Prix/2026-05-10_Race/",
    }


def driver(
    number: str, tla: str, first: str, last: str, team: str, colour: str
) -> dict:
    return {
        "RacingNumber": number,
        "Tla": tla,
        "FirstName": first,
        "LastName": last,
        "FullName": f"{first} {last.upper()}",
        "TeamName": team,
        "TeamColour": colour,
    }


def sector(
    value: str = "", pb: bool = False, ob: bool = False, previous: str = ""
) -> dict:
    out = {"Value": value, "PersonalFastest": pb, "OverallFastest": ob}
    if previous:
        out["PreviousValue"] = previous
    return out


def race_topics() -> dict[str, Any]:
    """Two cars mid-race: the leader on used hards, the second on new softs."""
    return {
        "SessionInfo": session_info(),
        "SessionStatus": {"Status": "Started"},
        "TrackStatus": {"Status": "1", "Message": "AllClear"},
        "LapCount": {"CurrentLap": 20, "TotalLaps": 57},
        "DriverList": {
            "16": driver("16", "LEC", "Charles", "Leclerc", "Ferrari", "E8002D"),
            "4": driver("4", "NOR", "Lando", "Norris", "McLaren", "F47600"),
        },
        "TimingData": {
            "Lines": {
                "4": {
                    "Position": "2",
                    "GapToLeader": "+1.482",
                    "IntervalToPositionAhead": {"Value": "+1.482", "Catching": True},
                    "LastLapTime": {"Value": "1:31.020", "PersonalFastest": True},
                    "BestLapTime": {"Value": "1:31.020", "Lap": 19},
                    "Sectors": [
                        sector("29.100", pb=True),
                        sector("31.500"),
                        sector(previous="30.420"),
                    ],
                    "NumberOfLaps": 19,
                    "NumberOfPitStops": 1,
                    "InPit": False,
                    "PitOut": False,
                    "Retired": False,
                    "Stopped": False,
                },
                "16": {
                    "Position": "1",
                    "GapToLeader": "LAP 20",
                    "IntervalToPositionAhead": {"Value": "LAP 20", "Catching": False},
                    "LastLapTime": {"Value": "1:31.300", "OverallFastest": False},
                    "BestLapTime": {"Value": "1:30.950", "Lap": 12},
                    "Sectors": [sector("28.990", ob=True), sector(""), sector("")],
                    "NumberOfLaps": 20,
                    "NumberOfPitStops": 1,
                },
            }
        },
        "TimingAppData": {
            "Lines": {
                "16": {
                    "GridPos": "3",
                    "Stints": [
                        {
                            "Compound": "MEDIUM",
                            "New": "true",
                            "TotalLaps": 12,
                            "StartLaps": 0,
                        },
                        {
                            "Compound": "HARD",
                            "New": "false",
                            "TotalLaps": 11,
                            "StartLaps": 3,
                        },
                    ],
                },
                "4": {
                    "GridPos": "1",
                    "Stints": {
                        "0": {"Compound": "MEDIUM", "New": "true", "TotalLaps": 10},
                        "1": {"Compound": "SOFT", "New": "true", "TotalLaps": 9},
                    },
                },
            }
        },
    }
