"""The panel's WebSocket commands and registration (SPEC §10.5, INV-3, INV-5)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from homeassistant.core import HomeAssistant
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.pit_lane_live_board.const import DOMAIN, JOLPICA_BASE
from custom_components.pit_lane_live_board.core.schedule import parse_schedule
from custom_components.pit_lane_live_board.panel import URL_PATH

from .conftest import schedule_payload

P = "pit_lane_live_board/"


def races(**fields):
    race = {
        "season": "2026",
        "round": "1",
        "raceName": "Test Grand Prix",
        "date": "2026-05-10",
        "Circuit": {"circuitId": "test", "circuitName": "Testring", "Location": {}},
        **fields,
    }
    return {
        "MRData": {
            "total": "1",
            "limit": "100",
            "offset": "0",
            "RaceTable": {"Races": [race]},
        }
    }


def result(driver_id, code, position, team="mercedes"):
    return {
        "number": "1",
        "position": str(position),
        "positionText": str(position),
        "points": "25",
        "grid": "2",
        "laps": "57",
        "status": "Finished",
        "Driver": {
            "driverId": driver_id,
            "code": code,
            "givenName": code,
            "familyName": code,
        },
        "Constructor": {"constructorId": team, "name": team.title()},
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


async def test_panel_is_registered_for_everyone(hass: HomeAssistant, setup):
    panel = hass.data["frontend_panels"][URL_PATH]
    assert panel.require_admin is False
    assert panel.sidebar_title == "Live Board"
    await hass.config_entries.async_unload(setup.entry_id)
    assert URL_PATH not in hass.data["frontend_panels"]


async def test_settings_round_trip(hass: HomeAssistant, setup, hass_ws_client):
    ws = await hass_ws_client(hass)
    await ws.send_json_auto_id(
        {"type": f"{P}settings/set", "tv_delay": 42, "no_spoiler": True}
    )
    reply = await ws.receive_json()
    assert reply["success"], reply
    assert reply["result"]["tv_delay"] == 42 and reply["result"]["no_spoiler"] is True
    await ws.send_json_auto_id({"type": f"{P}settings/set", "tv_delay": 500})
    reply = await ws.receive_json()
    assert not reply["success"]  # outside 0-120
    assert setup.runtime_data.store.settings.tv_delay == 42


async def test_f1tv_status_only_for_admins(
    hass: HomeAssistant, setup, hass_ws_client, hass_admin_user
):
    ws = await hass_ws_client(hass)
    await ws.send_json_auto_id({"type": f"{P}settings/get"})
    assert (await ws.receive_json())["result"]["f1tv"]["status"] == "not_configured"
    hass_admin_user.groups = []
    ws = await hass_ws_client(hass)
    await ws.send_json_auto_id({"type": f"{P}settings/get"})
    result = (await ws.receive_json())["result"]
    assert result["is_admin"] is False and result["f1tv"] is None


async def test_calendar_with_podiums(
    hass, setup, hass_ws_client, aioclient_mock, race_start
):
    for place in (1, 2, 3):
        aioclient_mock.get(
            f"{JOLPICA_BASE}{race_start.year}/results/{place}.json",
            json=races(Results=[result("a", "AAA", place)]),
        )
    ws = await hass_ws_client(hass)
    await ws.send_json_auto_id({"type": f"{P}calendar/get", "season": race_start.year})
    reply = await ws.receive_json()
    assert reply["success"], reply
    (meeting,) = reply["result"]["meetings"]
    assert meeting["name"] == "Test Grand Prix"
    assert meeting["state"] in ("next", "upcoming")
    assert meeting["podium"] is None  # not finished yet


async def test_results_detail_and_errors(hass, setup, hass_ws_client, aioclient_mock):
    aioclient_mock.get(
        f"{JOLPICA_BASE}2020/1/results.json",
        json=races(season="2020", Results=[result("a", "AAA", 1)]),
    )
    aioclient_mock.get(f"{JOLPICA_BASE}2020/1/qualifying.json", status=500)
    ws = await hass_ws_client(hass)
    await ws.send_json_auto_id(
        {"type": f"{P}results/detail", "season": 2020, "round": 1, "tab": "race"}
    )
    reply = await ws.receive_json()
    assert reply["result"]["hidden"] is False
    assert reply["result"]["data"]["rows"][0]["code"] == "AAA"
    await ws.send_json_auto_id(
        {"type": f"{P}results/detail", "season": 2020, "round": 1, "tab": "qualifying"}
    )
    reply = await ws.receive_json()
    assert reply["success"] is False and reply["error"]["code"] == "source_unavailable"
    await ws.send_json_auto_id(
        {"type": f"{P}results/detail", "season": 2020, "round": 1, "tab": "nope"}
    )
    assert (await ws.receive_json())["success"] is False


async def test_no_spoiler_withholds_the_race(
    hass, setup, hass_ws_client, aioclient_mock
):
    hub = setup.runtime_data.hub
    started = datetime.now(UTC) - timedelta(hours=1)
    hub.meetings = parse_schedule(schedule_payload(started))
    season = started.year
    aioclient_mock.get(
        f"{JOLPICA_BASE}{season}/1/results.json",
        json=races(season=str(season), Results=[result("a", "AAA", 1)]),
    )
    ws = await hass_ws_client(hass)
    await ws.send_json_auto_id({"type": f"{P}settings/set", "no_spoiler": True})
    await ws.receive_json()
    await ws.send_json_auto_id(
        {"type": f"{P}results/detail", "season": season, "round": 1, "tab": "race"}
    )
    reply = await ws.receive_json()
    assert reply["result"] == {
        "tab": "race",
        "hidden": True,
        "session": f"{season}-1-race",
    }
    assert (
        aioclient_mock.call_count == 1
    )  # only the calendar: the results were never fetched
    await ws.send_json_auto_id(
        {"type": f"{P}spoiler/reveal", "session": f"{season}-1-race"}
    )
    await ws.receive_json()
    await ws.send_json_auto_id(
        {"type": f"{P}results/detail", "season": season, "round": 1, "tab": "race"}
    )
    assert (await ws.receive_json())["result"]["hidden"] is False


async def test_standings_capped_by_no_spoiler(
    hass, setup, hass_ws_client, aioclient_mock
):
    hub = setup.runtime_data.hub
    started = datetime.now(UTC) - timedelta(hours=1)
    hub.meetings = parse_schedule(schedule_payload(started))
    season = started.year

    def standings(round_):
        return {
            "MRData": {
                "StandingsTable": {
                    "StandingsLists": [
                        {
                            "season": str(season),
                            "round": str(round_),
                            "DriverStandings": [
                                {
                                    "position": "1",
                                    "points": "25",
                                    "wins": "1",
                                    "Driver": {
                                        "driverId": "a",
                                        "givenName": "A",
                                        "familyName": "A",
                                    },
                                    "Constructors": [],
                                }
                            ],
                        }
                    ]
                }
            }
        }

    for path in ("driverstandings", "1/driverstandings"):
        aioclient_mock.get(f"{JOLPICA_BASE}{season}/{path}.json", json=standings(1))
    ws = await hass_ws_client(hass)
    await ws.send_json_auto_id(
        {"type": f"{P}standings/get", "season": season, "kind": "drivers"}
    )
    reply = await ws.receive_json()
    assert reply["result"]["round"] == 1 and reply["result"]["capped"] is False
    await ws.send_json_auto_id({"type": f"{P}settings/set", "no_spoiler": True})
    await ws.receive_json()
    await ws.send_json_auto_id(
        {"type": f"{P}standings/get", "season": season, "kind": "drivers"}
    )
    reply = await ws.receive_json()
    # Round 1 is the hidden meeting: nothing before it.
    assert reply["result"]["rows"] == [] and reply["result"]["capped"] is True


async def test_live_subscription_starts_idle(hass, setup, hass_ws_client):
    ws = await hass_ws_client(hass)
    await ws.send_json_auto_id({"type": f"{P}live/subscribe"})
    assert (await ws.receive_json())["success"]
    event = await ws.receive_json()
    assert event["event"]["state"] == "idle"
    assert event["event"]["next_session"]["meeting"] == "Test Grand Prix"
