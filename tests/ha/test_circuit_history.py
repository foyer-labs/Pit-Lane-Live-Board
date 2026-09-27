"""The circuit history commands (decision 58, SPEC §10.5, INV-5)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

from homeassistant.core import HomeAssistant
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.pit_lane_live_board.const import DOMAIN, JOLPICA_BASE
from custom_components.pit_lane_live_board.core.schedule import parse_schedule

from .conftest import schedule_payload

P = "pit_lane_live_board/"
YEAR = datetime.now(UTC).year


def row(driver, position, *, team="ferrari", status="Finished", grid=None):
    return {
        "number": "16" if driver == "leclerc" else "44",
        "position": str(position),
        "positionText": str(position) if status == "Finished" else "R",
        "points": "10",
        "grid": str(grid if grid is not None else position),
        "status": status,
        "Driver": {
            "driverId": driver,
            "code": driver[:3].upper(),
            "givenName": "G",
            "familyName": driver.title(),
        },
        "Constructor": {"constructorId": team, "name": team.title()},
    }


def circuit(key, *races):
    return {
        "MRData": {
            "total": str(sum(len(r) for _, _, r in races)),
            "limit": "100",
            "offset": "0",
            "RaceTable": {
                "Races": [
                    {
                        "season": str(season),
                        "round": str(rnd),
                        "raceName": "Test Grand Prix",
                        "Circuit": {
                            "circuitId": "test",
                            "circuitName": "Testring",
                            "Location": {"locality": "Town", "country": "Land"},
                        },
                        key: rows,
                    }
                    for season, rnd, rows in races
                ]
            },
        }
    }


def drivers_table(season, *drivers):
    return {
        "MRData": {
            "total": str(len(drivers)),
            "limit": "100",
            "offset": "0",
            "StandingsTable": {
                "StandingsLists": [
                    {
                        "season": str(season),
                        "round": "3",
                        "DriverStandings": [
                            {
                                "position": str(i + 1),
                                "points": "10",
                                "wins": "0",
                                "Driver": {
                                    "driverId": d,
                                    "code": d[:3].upper(),
                                    "givenName": "G",
                                    "familyName": d.title(),
                                },
                                "Constructors": [
                                    {"constructorId": "ferrari", "name": "Ferrari"}
                                ],
                            }
                            for i, d in enumerate(drivers)
                        ],
                    }
                ]
            },
        }
    }


def constructors_table(season, *teams):
    return {
        "MRData": {
            "total": str(len(teams)),
            "limit": "100",
            "offset": "0",
            "StandingsTable": {
                "StandingsLists": [
                    {
                        "season": str(season),
                        "round": "20",
                        "ConstructorStandings": [
                            {
                                "position": str(i + 1),
                                "points": "100",
                                "wins": "0",
                                "Constructor": {"constructorId": t, "name": t.title()},
                            }
                            for i, t in enumerate(teams)
                        ],
                    }
                ]
            },
        }
    }


@pytest.fixture
async def setup(hass: HomeAssistant, aioclient_mock, race_start):
    aioclient_mock.get(
        f"{JOLPICA_BASE}{race_start.year}.json", json=schedule_payload(race_start)
    )
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    yield entry
    await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()


def mock_circuit(aioclient_mock, *, current=False):
    races = [
        (2016, 8, [row("leclerc", 20, team="sauber", status="Accident")]),
        (2017, 8, [row("leclerc", 3), row("hamilton", 5, team="mercedes")]),
        (2019, 4, [row("leclerc", 5, grid=8), row("hamilton", 1, team="mercedes")]),
    ]
    if current:
        races.append((YEAR, 1, [row("leclerc", 1)]))
    aioclient_mock.get(
        f"{JOLPICA_BASE}circuits/test/results.json", json=circuit("Results", *races)
    )
    aioclient_mock.get(
        f"{JOLPICA_BASE}circuits/test/qualifying.json",
        json=circuit(
            "QualifyingResults",
            (2019, 4, [{"position": "4", "Driver": {"driverId": "leclerc"}}]),
            *(
                [(YEAR, 1, [{"position": "1", "Driver": {"driverId": "leclerc"}}])]
                if current
                else []
            ),
        ),
    )
    # The 2019 calendar, where the archive's race is found.
    payload = schedule_payload(datetime(2019, 4, 28, 12, tzinfo=UTC))
    payload["MRData"]["RaceTable"]["Races"][0]["round"] = "4"
    aioclient_mock.get(f"{JOLPICA_BASE}2019.json", json=payload)
    for season in (2016, 2017, 2019):
        aioclient_mock.get(
            f"{JOLPICA_BASE}{season}/constructorstandings.json",
            json=constructors_table(season, "mercedes", "ferrari", "sauber"),
        )


async def test_history_lists_this_seasons_drivers_by_index(
    hass, setup, hass_ws_client, aioclient_mock
):
    mock_circuit(aioclient_mock)
    aioclient_mock.get(
        f"{JOLPICA_BASE}{YEAR}/driverstandings.json",
        json=drivers_table(YEAR, "hamilton", "leclerc", "rookie"),
    )
    ws = await hass_ws_client(hass)
    await ws.send_json_auto_id({"type": f"{P}circuit/history", "circuit_id": "test"})
    reply = await ws.receive_json()
    assert reply["success"], reply
    result = reply["result"]
    assert result["circuit"] == "Testring" and result["country"] == "Land"
    assert (result["first_season"], result["last_season"]) == (2016, 2019)
    # Hamilton's -1.2 beats Leclerc's -4.1, weighed by the accident of 2016.
    assert [d["driver_id"] for d in result["drivers"]] == [
        "hamilton",
        "leclerc",
        "rookie",
    ]
    hamilton, leclerc, rookie = result["drivers"]
    # 2016: Sauber P3 → 5.5, accident classified P20 → -14.5
    # 2017: Ferrari P2 → 3.5, P3 → 0.5
    # 2019: Ferrari P2 → 3.5, P5 and Q4 → 0.6*-1.5 + 0.4*-0.5 = -1.1
    assert leclerc["races"] == 3 and leclerc["counted"] == 3
    assert leclerc["team"] == "Ferrari" and leclerc["podiums"] == 1
    weights = [0.85 ** (YEAR - s) for s in (2016, 2017, 2019)]
    scores = [-14.5, 0.5, -1.1]
    mean = sum(w * s for w, s in zip(weights, scores, strict=True)) / sum(weights)
    assert leclerc["index"] == pytest.approx(
        round(max(0, min(100, 50 + 5 * mean * 3 / 5)), 1), abs=0.11
    )
    assert hamilton["wins"] == 1 and hamilton["index"] is not None
    assert rookie["races"] == 0 and rookie["index"] is None


async def test_driver_years_with_penalties_from_the_archive(
    hass, setup, hass_ws_client, aioclient_mock
):
    mock_circuit(aioclient_mock)
    aioclient_mock.get(
        f"{JOLPICA_BASE}{YEAR}/driverstandings.json",
        json=drivers_table(YEAR, "leclerc"),
    )
    detail = {
        "race_control": [
            {
                "message": "FIA STEWARDS: 5 SECOND TIME PENALTY FOR CAR 16 (LEC) - "
                "LEAVING THE TRACK AND GAINING AN ADVANTAGE",
                "lap": 30,
            },
            {
                "message": "FIA STEWARDS: 5 SECOND TIME PENALTY FOR CAR 44 (HAM) - "
                "CAUSING A COLLISION",
                "lap": 10,
            },
        ]
    }
    hub = setup.runtime_data.hub
    hub.archive.detail = AsyncMock(return_value=detail)
    ws = await hass_ws_client(hass)
    await ws.send_json_auto_id(
        {"type": f"{P}circuit/driver", "circuit_id": "test", "driver_id": "leclerc"}
    )
    reply = await ws.receive_json()
    assert reply["success"], reply
    result = reply["result"]
    assert result["code"] == "LEC" and result["name"] == "G Leclerc"
    assert [y["season"] for y in result["years"]] == [2019, 2017, 2016]
    latest = result["years"][0]
    assert latest["quali"] == 4 and latest["grid"] == 8 and latest["grid_penalty"]
    assert latest["expected"] == 3.5 and latest["delta_race"] == -1.5
    assert latest["penalties"] == [
        {
            "kind": "time_penalty",
            "seconds": 5,
            "reason": "LEAVING THE TRACK AND GAINING AN ADVANTAGE",
            "lap": 30,
        }
    ]
    # Before 2018 there is no archive: not "none", unknown.
    assert result["years"][1]["penalties"] is None
    assert result["years"][2]["dnf"] == "driver"
    hub.archive.detail.assert_awaited_once()


async def test_no_spoiler_leaves_out_the_hidden_race(
    hass, setup, hass_ws_client, aioclient_mock
):
    hub = setup.runtime_data.hub
    started = datetime.now(UTC) - timedelta(hours=1)
    hub.meetings = parse_schedule(schedule_payload(started))
    mock_circuit(aioclient_mock, current=True)
    aioclient_mock.get(
        f"{JOLPICA_BASE}{YEAR - 1}/driverstandings.json",
        json=drivers_table(YEAR - 1, "leclerc"),
    )
    aioclient_mock.get(
        f"{JOLPICA_BASE}{YEAR}/driverstandings.json",
        json=drivers_table(YEAR, "leclerc"),
    )
    aioclient_mock.get(
        f"{JOLPICA_BASE}{YEAR}/constructorstandings.json",
        json=constructors_table(YEAR, "ferrari"),
    )
    hub.archive.detail = AsyncMock(return_value=None)
    ws = await hass_ws_client(hass)
    await ws.send_json_auto_id({"type": f"{P}settings/set", "no_spoiler": True})
    await ws.receive_json()
    await ws.send_json_auto_id(
        {"type": f"{P}circuit/driver", "circuit_id": "test", "driver_id": "leclerc"}
    )
    result = (await ws.receive_json())["result"]
    assert YEAR not in [y["season"] for y in result["years"]]
    await ws.send_json_auto_id({"type": f"{P}circuit/history", "circuit_id": "test"})
    history = (await ws.receive_json())["result"]
    assert history["last_season"] == 2019
    # Neither this season's tables after the hidden race were asked for.
    asked = {str(call[1]) for call in aioclient_mock.mock_calls}
    assert not any(f"{YEAR}/constructorstandings" in url for url in asked)
    assert not any(f"{YEAR}/driverstandings" in url for url in asked)

    await ws.send_json_auto_id({"type": f"{P}settings/set", "no_spoiler": False})
    await ws.receive_json()
    await ws.send_json_auto_id(
        {"type": f"{P}circuit/driver", "circuit_id": "test", "driver_id": "leclerc"}
    )
    result = (await ws.receive_json())["result"]
    assert result["years"][0]["season"] == YEAR
    assert result["years"][0]["expected"] == 1.5


async def test_circuit_commands_validate_and_report_source_errors(
    hass, setup, hass_ws_client, aioclient_mock
):
    ws = await hass_ws_client(hass)
    await ws.send_json_auto_id({"type": f"{P}circuit/history", "circuit_id": "../x"})
    assert (await ws.receive_json())["success"] is False
    await ws.send_json_auto_id(
        {"type": f"{P}circuit/driver", "circuit_id": "test", "driver_id": "Bad-Id"}
    )
    assert (await ws.receive_json())["success"] is False
    aioclient_mock.get(f"{JOLPICA_BASE}circuits/test/results.json", status=500)
    aioclient_mock.get(
        f"{JOLPICA_BASE}circuits/test/qualifying.json", json=circuit("x")
    )
    aioclient_mock.get(
        f"{JOLPICA_BASE}{YEAR}/driverstandings.json", json=drivers_table(YEAR, "a")
    )
    await ws.send_json_auto_id({"type": f"{P}circuit/history", "circuit_id": "test"})
    reply = await ws.receive_json()
    assert reply["success"] is False
    assert reply["error"]["code"] == "source_unavailable"


async def test_an_unknown_circuit_has_no_drivers(
    hass, setup, hass_ws_client, aioclient_mock
):
    empty = {"MRData": {"total": "0", "RaceTable": {"Races": []}}}
    aioclient_mock.get(f"{JOLPICA_BASE}circuits/nowhere/results.json", json=empty)
    aioclient_mock.get(f"{JOLPICA_BASE}circuits/nowhere/qualifying.json", json=empty)
    aioclient_mock.get(
        f"{JOLPICA_BASE}{YEAR}/driverstandings.json", json=drivers_table(YEAR, "a")
    )
    ws = await hass_ws_client(hass)
    await ws.send_json_auto_id({"type": f"{P}circuit/history", "circuit_id": "nowhere"})
    result = (await ws.receive_json())["result"]
    assert result["drivers"] == [] and result["circuit_id"] == "nowhere"
    await ws.send_json_auto_id(
        {"type": f"{P}circuit/driver", "circuit_id": "nowhere", "driver_id": "a"}
    )
    result = (await ws.receive_json())["result"]
    assert result["years"] == [] and result["index"] is None
