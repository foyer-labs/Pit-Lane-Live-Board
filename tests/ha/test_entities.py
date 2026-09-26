"""Entities for automations and the options flow (SPEC §10.1, §10.2, INV-2, INV-3)."""

from __future__ import annotations

import asyncio
import base64
from datetime import UTC, datetime, timedelta
import json
import time
from unittest.mock import patch

from homeassistant.const import STATE_OFF, STATE_ON, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers.dispatcher import async_dispatcher_send
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.pit_lane_live_board.const import (
    DATA_F1TV_TOKEN,
    DOMAIN,
    JOLPICA_BASE,
    OPTION_SHOW_IN_SIDEBAR,
)
from custom_components.pit_lane_live_board.hub import SIGNAL_EVENT
from custom_components.pit_lane_live_board.panel import URL_PATH

from .conftest import FakeClient, schedule_payload
from .test_hub_live import HUB, keyframes, settle

E = {
    "next": "sensor.pit_lane_live_board_next_session",
    "status": "sensor.pit_lane_live_board_session_status",
    "track": "sensor.pit_lane_live_board_track_status",
    "lap": "sensor.pit_lane_live_board_lap",
    "f1tv": "sensor.pit_lane_live_board_f1tv",
    "running": "binary_sensor.pit_lane_live_board_session_running",
    "safety_car": "binary_sensor.pit_lane_live_board_safety_car",
    "vsc": "binary_sensor.pit_lane_live_board_virtual_safety_car",
    "red_flag": "binary_sensor.pit_lane_live_board_red_flag",
    "yellow": "binary_sensor.pit_lane_live_board_yellow_flag",
    "penalties": "sensor.pit_lane_live_board_penalties",
    "investigations": "sensor.pit_lane_live_board_investigations",
    "message": "sensor.pit_lane_live_board_race_control_message",
    "stewards": "event.pit_lane_live_board_stewards",
    "live": "switch.pit_lane_live_board_live_timing",
    "event": "event.pit_lane_live_board_race_control",
    "spoiler": "switch.pit_lane_live_board_no_spoiler_mode",
    "delay": "number.pit_lane_live_board_tv_delay",
    "calendar": "calendar.pit_lane_live_board_sessions",
}


def jwt(**claims) -> str:
    part = base64.urlsafe_b64encode(json.dumps(claims).encode()).decode().rstrip("=")
    return f"eyJhbGciOiJSUzI1NiJ9.{part}.sig"


@pytest.fixture
async def entry(hass: HomeAssistant, aioclient_mock, race_start, fake_client):
    aioclient_mock.get(
        f"{JOLPICA_BASE}{race_start.year}.json", json=schedule_payload(race_start)
    )
    with patch(HUB, FakeClient):
        entry = MockConfigEntry(domain=DOMAIN, data={})
        entry.add_to_hass(hass)
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        yield entry
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()


async def test_entities_outside_a_session(hass: HomeAssistant, entry, race_start):
    quali = race_start - timedelta(days=1)
    assert hass.states.get(E["next"]).state == quali.isoformat()
    assert hass.states.get(E["next"]).attributes["session"] == "qualifying"
    # Paused (decision 42): the live entities know nothing.
    assert hass.states.get(E["live"]).state == STATE_OFF
    assert hass.states.get(E["status"]).state == STATE_UNAVAILABLE
    await hass.services.async_call(
        "switch", "turn_on", {"entity_id": E["live"]}, blocking=True
    )
    await hass.async_block_till_done()
    assert hass.states.get(E["status"]).state == "inactive"
    for key in ("safety_car", "red_flag", "yellow", "penalties"):
        assert hass.states.get(E[key]).state == STATE_UNKNOWN
    assert hass.states.get(E["track"]).state == STATE_UNKNOWN
    assert hass.states.get(E["lap"]).state == STATE_UNKNOWN
    assert hass.states.get(E["running"]).state == STATE_OFF
    assert hass.states.get(E["spoiler"]).state == STATE_OFF
    assert hass.states.get(E["delay"]).state == "0"
    assert hass.states.get(E["f1tv"]).state == "not_configured"
    assert (
        hass.states.get(E["calendar"]).attributes["message"]
        == "Test Grand Prix — Qualifying"
    )


async def test_live_entities_follow_the_released_state(hass: HomeAssistant, entry):
    hub = entry.runtime_data.hub
    await hub.store.async_save(hub.settings.with_live(True))
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    client.keyframes(keyframes(track="4"))
    await settle()
    await hass.async_block_till_done()
    assert hass.states.get(E["track"]).state == "safety_car"
    assert hass.states.get(E["lap"]).state == "3"
    assert hass.states.get(E["lap"]).attributes["total_laps"] == 50
    assert hass.states.get(E["status"]).state == "started"
    assert hass.states.get(E["running"]).state == STATE_ON

    # No-spoiler mode, switched from the entity: the live values go quiet.
    await hass.services.async_call(
        "switch", "turn_on", {"entity_id": E["spoiler"]}, blocking=True
    )
    await hass.async_block_till_done()
    assert hub.settings.no_spoiler is True
    assert hass.states.get(E["track"]).state == STATE_UNKNOWN
    await hass.services.async_call(
        "switch", "turn_off", {"entity_id": E["spoiler"]}, blocking=True
    )

    # INV-2: a lost feed makes the live entities unavailable.
    hub.live.buffer._last_released = time.monotonic() - 70
    await settle(0.5)
    await hass.async_block_till_done()
    assert hass.states.get(E["track"]).state == STATE_UNAVAILABLE
    assert hass.states.get(E["lap"]).state == STATE_UNAVAILABLE


async def test_the_delay_number_sets_the_household_delay(hass: HomeAssistant, entry):
    await hass.services.async_call(
        "number", "set_value", {"entity_id": E["delay"], "value": 37}, blocking=True
    )
    assert entry.runtime_data.hub.settings.tv_delay == 37
    assert hass.states.get(E["delay"]).state == "37"


async def test_the_event_entity_relays_hub_events(hass: HomeAssistant, entry):
    hub = entry.runtime_data.hub
    await hub.async_update_settings(hub.settings.with_live(True))
    async_dispatcher_send(hass, SIGNAL_EVENT, "red_flag")
    await hass.async_block_till_done()
    state = hass.states.get(E["event"])
    assert state.attributes["event_type"] == "red_flag"
    assert "red_flag" in state.attributes["event_types"]


async def test_calendar_events(hass: HomeAssistant, entry, race_start):
    result = await hass.services.async_call(
        "calendar",
        "get_events",
        {
            "entity_id": E["calendar"],
            "start_date_time": datetime.now(UTC),
            "end_date_time": race_start + timedelta(days=1),
        },
        blocking=True,
        return_response=True,
    )
    events = result[E["calendar"]]["events"]
    assert [e["summary"] for e in events] == [
        "Test Grand Prix — Qualifying",
        "Test Grand Prix — Race",
    ]
    assert events[1]["location"] == "Testring, Town, Land"


async def test_options_flow_sidebar_and_token(hass: HomeAssistant, entry):
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] is FlowResultType.FORM

    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {OPTION_SHOW_IN_SIDEBAR: True, "f1tv_token": "not a token"}
    )
    assert result["errors"] == {"f1tv_token": "token_invalid"}

    good = jwt(
        exp=int((datetime.now(UTC) + timedelta(days=4)).timestamp()), SessionId="s"
    )
    cookie = json.dumps({"data": {"subscriptionToken": good}})
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {OPTION_SHOW_IN_SIDEBAR: False, "f1tv_token": cookie}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    assert entry.data[DATA_F1TV_TOKEN] == good
    assert entry.options[OPTION_SHOW_IN_SIDEBAR] is False
    assert entry.runtime_data.hub.f1tv.status == "active"
    assert hass.data["frontend_panels"][URL_PATH].show_in_sidebar is False
    assert hass.states.get(E["f1tv"]).state == "active"
    # INV-3: the token is nowhere in the entity.
    assert good not in json.dumps(
        dict(hass.states.get(E["f1tv"]).attributes), default=str
    )

    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {OPTION_SHOW_IN_SIDEBAR: True, "remove_f1tv_token": True}
    )
    await hass.async_block_till_done()
    assert DATA_F1TV_TOKEN not in entry.data
    assert entry.runtime_data.hub.f1tv.status == "not_configured"


async def test_expired_token_is_refused(hass: HomeAssistant, entry):
    old = jwt(exp=int((datetime.now(UTC) - timedelta(hours=1)).timestamp()))
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {OPTION_SHOW_IN_SIDEBAR: True, "f1tv_token": old}
    )
    assert result["errors"] == {"f1tv_token": "token_expired"}
    await asyncio.sleep(0)
