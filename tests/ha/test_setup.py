"""Setup, the config flow and diagnostics (SPEC §10.1, §10.4)."""

from __future__ import annotations

import json
from unittest.mock import patch

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.pit_lane_live_board.const import (
    DATA_F1TV_TOKEN,
    DOMAIN,
    JOLPICA_BASE,
    NAME,
)
from custom_components.pit_lane_live_board.diagnostics import (
    async_get_config_entry_diagnostics,
)

from .conftest import schedule_payload


async def test_config_flow_creates_the_entry(
    hass: HomeAssistant, aioclient_mock, race_start
):
    aioclient_mock.get(
        f"{JOLPICA_BASE}{race_start.year}.json", json=schedule_payload(race_start)
    )
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"

    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == NAME
    assert result["data"] == {}
    entry = hass.config_entries.async_entries(DOMAIN)[0]
    await hass.config_entries.async_unload(entry.entry_id)


async def test_only_one_instance(hass: HomeAssistant):
    MockConfigEntry(domain=DOMAIN, data={}).add_to_hass(hass)
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "single_instance_allowed"


async def test_setup_loads_settings_and_calendar(
    hass: HomeAssistant, hass_storage, aioclient_mock, race_start
):
    hass_storage[DOMAIN] = {
        "version": 1,
        "minor_version": 1,
        "key": DOMAIN,
        "data": {"tv_delay": 30, "no_spoiler": True, "revealed": [], "marks": {"x": 1}},
    }
    aioclient_mock.get(
        f"{JOLPICA_BASE}{race_start.year}.json", json=schedule_payload(race_start)
    )
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)

    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    runtime = entry.runtime_data
    # The calendar loads in the background (setup never waits on F1).
    await runtime.hub.first_tick
    assert runtime.store.settings.tv_delay == 30
    assert runtime.store.settings.no_spoiler is True
    assert runtime.store.marks == {"x": 1}
    assert [m.name for m in runtime.hub.meetings] == ["Test Grand Prix"]
    assert runtime.hub.next_session_dict()["kind"] == "qualifying"
    assert await hass.config_entries.async_unload(entry.entry_id)


async def test_setup_survives_an_unreachable_calendar(
    hass: HomeAssistant, aioclient_mock
):
    aioclient_mock.get(f"{JOLPICA_BASE}2026.json", status=500)
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.runtime_data.hub.meetings == []
    assert entry.runtime_data.hub.calendar_error
    assert await hass.config_entries.async_unload(entry.entry_id)


async def test_diagnostics_never_contain_the_token(
    hass: HomeAssistant, aioclient_mock, race_start
):
    secret = "eyJhbGciOiJSUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.c2VjcmV0LXNpZ25hdHVyZQ"
    aioclient_mock.get(
        f"{JOLPICA_BASE}{race_start.year}.json", json=schedule_payload(race_start)
    )
    entry = MockConfigEntry(domain=DOMAIN, data={DATA_F1TV_TOKEN: secret})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    diagnostics = await async_get_config_entry_diagnostics(hass, entry)

    text = json.dumps(diagnostics, default=str)
    assert secret not in text
    assert "c2VjcmV0LXNpZ25hdHVyZQ" not in text
    assert diagnostics["hub"]["f1tv"]["status"] == "active"
    assert await hass.config_entries.async_unload(entry.entry_id)


async def test_removing_the_integration_deletes_its_store(
    hass: HomeAssistant, hass_storage, aioclient_mock, race_start
):
    from custom_components.pit_lane_live_board import async_remove_entry

    aioclient_mock.get(
        f"{JOLPICA_BASE}{race_start.year}.json", json=schedule_payload(race_start)
    )
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    hub = entry.runtime_data.hub
    await hub.async_update_settings(hub.settings.with_delay(30))
    assert DOMAIN in hass_storage
    assert await hass.config_entries.async_unload(entry.entry_id)
    await async_remove_entry(hass, entry)
    assert DOMAIN not in hass_storage


async def test_the_options_form_names_the_f1tv_status(
    hass: HomeAssistant, aioclient_mock, race_start
):
    aioclient_mock.get(
        f"{JOLPICA_BASE}{race_start.year}.json", json=schedule_payload(race_start)
    )
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["description_placeholders"]["status"] == "Not configured"
    assert await hass.config_entries.async_unload(entry.entry_id)


async def test_unload_stops_the_hub_before_the_entities(
    hass: HomeAssistant, aioclient_mock, race_start
):
    """While the platforms unload no live loop may advance the event marks: the
    events would be lost after the reload (SPEC §10.3)."""
    aioclient_mock.get(
        f"{JOLPICA_BASE}{race_start.year}.json", json=schedule_payload(race_start)
    )
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    hub = entry.runtime_data.hub
    seen: list[bool] = []
    unload = hass.config_entries.async_unload_platforms

    async def watch(*args, **kwargs):
        seen.append(hub._stopped)
        return await unload(*args, **kwargs)

    with patch.object(hass.config_entries, "async_unload_platforms", watch):
        assert await hass.config_entries.async_unload(entry.entry_id)
    assert seen == [True]


async def test_open_pages_hear_from_a_reloaded_entry(
    hass: HomeAssistant, aioclient_mock, race_start
):
    from custom_components.pit_lane_live_board.hub import listen_live

    aioclient_mock.get(
        f"{JOLPICA_BASE}{race_start.year}.json", json=schedule_payload(race_start)
    )
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    received: list[dict] = []
    unsub = listen_live(hass, lambda payload: received.append(json.loads(payload)))
    with patch(
        "custom_components.pit_lane_live_board.hub.Hub.async_refresh_calendar"
    ):  # a source down: the new hub must speak all the same
        assert await hass.config_entries.async_reload(entry.entry_id)
        await hass.async_block_till_done()
    assert len(received) >= 2  # the old hub's last word, the new hub's first
    assert received[-1]["full"] is True and received[-1]["state"] == "paused"
    unsub()
    assert await hass.config_entries.async_unload(entry.entry_id)
