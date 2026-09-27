"""The household's drivers and the session summary (decisions 51-53)."""

from __future__ import annotations

from unittest.mock import patch

from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_connect
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.pit_lane_live_board.const import DOMAIN, JOLPICA_BASE
from custom_components.pit_lane_live_board.hub import SIGNAL_FAVOURITE

from .conftest import FakeClient, schedule_payload
from .test_hub_live import HUB, keyframes, settle

P = "pit_lane_live_board/"


def race(**lines) -> dict:
    frames = keyframes()
    frames["TimingData"] = {"Lines": lines}
    return frames


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
        hub = entry.runtime_data.hub
        await hub.first_tick
        await hub.async_update_settings(
            hub.settings.with_live(True).with_favourites(["LEC"])
        )
        await hass.async_block_till_done()
        yield entry
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()


async def test_a_sensor_per_followed_driver(hass: HomeAssistant, entry):
    hub = entry.runtime_data.hub
    registry = er.async_get(hass)
    sensor = registry.async_get_entity_id(
        "sensor", DOMAIN, f"{entry.entry_id}_driver_LEC"
    )
    assert sensor is not None
    await hub._async_start_live(None, None)
    FakeClient.instances[-1].keyframes(
        race(**{"4": {"Position": "1"}, "16": {"Position": "2", "GapToLeader": "+1.2"}})
    )
    await settle()
    await hass.async_block_till_done()
    state = hass.states.get(sensor)
    assert state.state == "2" and state.attributes["number"] == "16"
    assert "gap" not in state.attributes  # moves every lap: not an entity's job
    # Following someone else: the old sensor goes, the new one comes.
    await hub.async_update_settings(hub.settings.with_favourites(["NOR"]))
    await hass.async_block_till_done()
    assert (
        registry.async_get_entity_id("sensor", DOMAIN, f"{entry.entry_id}_driver_LEC")
        is None
    )
    assert registry.async_get_entity_id(
        "sensor", DOMAIN, f"{entry.entry_id}_driver_NOR"
    )


async def test_events_of_a_followed_driver(hass: HomeAssistant, entry):
    hub = entry.runtime_data.hub
    fired: list[tuple[str, dict]] = []
    unsub = async_dispatcher_connect(
        hass, SIGNAL_FAVOURITE, lambda kind, data: fired.append((kind, data))
    )
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    client.keyframes(race(**{"4": {"Position": "1"}, "16": {"Position": "2"}}))
    await settle()
    assert fired == []  # the baseline
    client.feed(
        "TimingData", {"Lines": {"4": {"Position": "2"}, "16": {"Position": "1"}}}
    )
    await settle()
    assert [kind for kind, _ in fired] == ["took_lead"]
    assert fired[0][1]["driver"] == "LEC"
    await hass.async_block_till_done()
    state = hass.states.get("event.pit_lane_live_board_my_drivers")
    assert state.attributes["event_type"] == "took_lead"
    unsub()


async def test_the_summary_goes_to_the_chosen_services(hass: HomeAssistant, entry):
    hub = entry.runtime_data.hub
    sent: list[ServiceCall] = []
    hass.services.async_register("notify", "family_phone", sent.append)
    await hub.async_update_settings(
        hub.settings.with_summary(["notify.family_phone"], ["race"])
    )
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    client.keyframes(
        race(**{"4": {"Position": "1"}, "16": {"Position": "2", "GapToLeader": "+1.2"}})
    )
    await settle()
    client.feed("SessionStatus", {"Status": "Finalised"})
    await settle()
    await hass.async_block_till_done()
    assert len(sent) == 1
    assert sent[0].data["title"].endswith("Test Grand Prix — Race")
    assert sent[0].data["message"].splitlines()[0] == "1. NOR · 2. LEC +1.2"
    state = hass.states.get("event.pit_lane_live_board_session_summary")
    assert state.attributes["event_type"] == "summary"


async def test_no_spoiler_holds_the_summary_until_it_is_off(hass: HomeAssistant, entry):
    hub = entry.runtime_data.hub
    sent: list[ServiceCall] = []
    hass.services.async_register("notify", "family_phone", sent.append)
    await hub.async_update_settings(
        hub.settings.with_summary(["family_phone"], ["race"]).with_no_spoiler(True)
    )
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    client.keyframes(race(**{"4": {"Position": "1"}}))
    await settle()
    client.feed("SessionStatus", {"Status": "Finalised"})
    await settle()
    await hass.async_block_till_done()
    assert sent == [] and len(hub.store.pending_summaries) == 1
    await hub.async_update_settings(hub.settings.with_no_spoiler(False))
    await hass.async_block_till_done()
    assert len(sent) == 1 and hub.store.pending_summaries == []


async def test_household_settings_are_for_administrators(
    hass: HomeAssistant, entry, hass_ws_client, hass_admin_user
):
    ws = await hass_ws_client(hass)
    await ws.send_json_auto_id({"type": f"{P}settings/set", "favourites": ["ham"]})
    assert (await ws.receive_json())["result"]["favourites"] == ["HAM"]
    hass_admin_user.groups = []
    ws = await hass_ws_client(hass)
    await ws.send_json_auto_id({"type": f"{P}settings/set", "notify_targets": ["x"]})
    reply = await ws.receive_json()
    assert not reply["success"] and reply["error"]["code"] == "unauthorized"


async def test_the_small_screen_sensor(hass: HomeAssistant, entry):
    """Off by default; once enabled it follows the Live page (decision 54)."""
    registry = er.async_get(hass)
    entity_id = registry.async_get_entity_id(
        "sensor", DOMAIN, f"{entry.entry_id}_display"
    )
    assert registry.async_get(entity_id).disabled
    registry.async_update_entity(entity_id, disabled_by=None)
    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    hub = entry.runtime_data.hub
    await hub.first_tick
    await hub._async_start_live(None, None)
    FakeClient.instances[-1].keyframes(
        race(**{"4": {"Position": "1"}, "16": {"Position": "2", "GapToLeader": "+1.2"}})
    )
    await settle()
    await hass.async_block_till_done()
    state = hass.states.get(entity_id)
    assert state.state == "live"
    assert state.attributes["p2"].split() == ["2", "LEC", "+1.2"]
    assert state.attributes["flag_colour"] == "#1fa855"
