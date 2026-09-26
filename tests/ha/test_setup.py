"""Setup, the config flow and diagnostics (SPEC §10.1, §10.4)."""

from __future__ import annotations

import json

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
