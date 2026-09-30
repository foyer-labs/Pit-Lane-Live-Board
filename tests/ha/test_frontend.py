"""How the panel and the cards reach the page (SPEC §7.6, decision 59)."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
import hashlib
from pathlib import Path
from unittest.mock import patch

from homeassistant.components.frontend import DATA_EXTRA_MODULE_URL, DATA_PANELS
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.pit_lane_live_board.const import DOMAIN, JOLPICA_BASE
from custom_components.pit_lane_live_board.panel import (
    INDEX_LOADER,
    LOADER_URL,
    STATIC_URL,
    URL_PATH,
)

from .conftest import schedule_payload

FRONTEND = (
    Path(__file__).resolve().parents[2]
    / "custom_components"
    / "pit_lane_live_board"
    / "frontend"
)
CARDS = "pit-lane-live-board-cards.js"
PANEL = "pit-lane-live-board-panel.js"
OTHER = "/local/other-card.js"
PANEL_PY = "custom_components.pit_lane_live_board.panel"
YAML = {
    "lovelace": {
        "resource_mode": "yaml",
        "resources": [{"url": OTHER, "type": "module"}],
    }
}


def _url(name: str) -> str:
    fingerprint = hashlib.sha256((FRONTEND / name).read_bytes()).hexdigest()[:12]
    return f"{STATIC_URL}/{fingerprint}/{name}"


def _resources(hass) -> list[str]:
    return [item["url"] for item in hass.data["lovelace"].resources.async_items()]


def _in_index(hass) -> bool:
    return INDEX_LOADER in hass.data[DATA_EXTRA_MODULE_URL].urls


async def _setup(hass: HomeAssistant, aioclient_mock, race_start) -> MockConfigEntry:
    aioclient_mock.get(
        f"{JOLPICA_BASE}{datetime.now(UTC).year}.json",
        json=schedule_payload(race_start),
    )
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _unload(hass: HomeAssistant, entry: MockConfigEntry) -> None:
    await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()


async def test_cards_come_from_resource_and_index(hass, aioclient_mock, race_start):
    entry = await _setup(hass, aioclient_mock, race_start)

    assert _resources(hass) == [LOADER_URL]
    assert _in_index(hass)
    panel = hass.data[DATA_PANELS][URL_PATH]
    assert panel.config["_panel_custom"]["module_url"] == _url(PANEL)
    await _unload(hass, entry)


async def test_the_loader_leads_to_the_hashed_module(
    hass, aioclient_mock, race_start, hass_client_no_auth
):
    entry = await _setup(hass, aioclient_mock, race_start)
    client = await hass_client_no_auth()

    response = await client.get(LOADER_URL)
    assert response.status == 200
    assert response.headers["Cache-Control"] == "no-cache"
    assert await response.text() == f'import "{_url(CARDS)}";\n'
    same = await client.get(
        LOADER_URL, headers={"If-None-Match": response.headers["ETag"]}
    )
    assert same.status == 304

    module = await client.get(_url(CARDS))
    assert module.status == 200
    assert "immutable" in module.headers["Cache-Control"]
    assert module.headers["Vary"] == "Accept-Encoding"
    assert await module.read() == (FRONTEND / CARDS).read_bytes()

    index = await (await client.get(INDEX_LOADER)).text()
    assert index.startswith(f'import("{LOADER_URL}")')
    assert f'.catch(() => import("{_url(CARDS)}"))' in index
    await _unload(hass, entry)


async def test_earlier_addresses_lead_to_the_current_module(
    hass, aioclient_mock, race_start, hass_client_no_auth
):
    """The indexes saved by phones still hold them: never an error."""
    entry = await _setup(hass, aioclient_mock, race_start)
    client = await hass_client_no_auth()

    for old, current in (
        (f"{CARDS}?v=0123456789ab", CARDS),
        (f"0123456789ab/{CARDS}", CARDS),
        (f"{PANEL}?v=0123456789ab", PANEL),
        (f"0123456789ab/{PANEL}", PANEL),
    ):
        response = await client.get(f"{STATIC_URL}/{old}")
        assert response.status == 200, old
        assert await response.text() == f'import "{_url(current)}";\n', old
    assert (await client.get(f"{STATIC_URL}/other.js")).status == 404
    await _unload(hass, entry)


async def test_one_resource_and_the_old_ones_go(
    hass, hass_storage, aioclient_mock, race_start
):
    hass_storage["lovelace_resources"] = {
        "version": 1,
        "minor_version": 1,
        "key": "lovelace_resources",
        "data": {
            "items": [
                {"id": "a", "type": "module", "url": OTHER},
                {"id": "b", "type": "module", "url": f"{STATIC_URL}/{CARDS}?v=1"},
                {"id": "c", "type": "module", "url": LOADER_URL},
                {"id": "d", "type": "module", "url": LOADER_URL},
            ]
        },
    }
    entry = await _setup(hass, aioclient_mock, race_start)
    assert _resources(hass) == [OTHER, LOADER_URL]

    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert _resources(hass) == [OTHER, LOADER_URL]

    await hass.config_entries.async_remove(entry.entry_id)
    await hass.async_block_till_done()
    assert _resources(hass) == [OTHER]
    assert not _in_index(hass)


@pytest.fixture
async def yaml_resources(hass):
    """YAML resources, and a 2 s watch instead of 30 s so the tests do not wait."""
    assert await async_setup_component(hass, "lovelace", YAML)
    with patch(f"{PANEL_PY}._WATCH", 2.0):
        yield


def _reread(*seconds: float):
    """ "Reload resources" reading the YAML at different speeds, one read each."""
    waits = iter(seconds)

    async def _read(_hass):
        await asyncio.sleep(next(waits))
        return YAML

    return patch(
        "homeassistant.components.lovelace.async_hass_config_yaml", side_effect=_read
    )


async def _reload(hass) -> None:
    await hass.services.async_call("lovelace", "reload_resources", blocking=True)


async def test_yaml_entry_lives_in_memory_and_survives_reloads(
    hass, hass_storage, aioclient_mock, race_start, yaml_resources
):
    entry = await _setup(hass, aioclient_mock, race_start)
    assert _resources(hass) == [OTHER, LOADER_URL]

    # Two reloads, the second ending after the entry was already put back once.
    with _reread(0.2, 0.6):
        await asyncio.gather(_reload(hass), _reload(hass))
        await hass.async_block_till_done(wait_background_tasks=True)

    assert _resources(hass) == [OTHER, LOADER_URL]
    assert "lovelace_resources" not in hass_storage
    await _unload(hass, entry)


async def test_a_reload_already_running_at_setup(
    hass, aioclient_mock, race_start, yaml_resources
):
    with _reread(0.5):
        running = hass.async_create_task(_reload(hass))
        await asyncio.sleep(0)
        entry = await _setup(hass, aioclient_mock, race_start)
        await running
        await hass.async_block_till_done(wait_background_tasks=True)

    assert _resources(hass) == [OTHER, LOADER_URL]
    await _unload(hass, entry)


async def test_removed_during_a_reload_the_entry_stays_out(
    hass, aioclient_mock, race_start, yaml_resources
):
    entry = await _setup(hass, aioclient_mock, race_start)

    with _reread(0.3):
        running = hass.async_create_task(_reload(hass))
        await asyncio.sleep(0)
        await hass.config_entries.async_remove(entry.entry_id)
        await running
        await hass.async_block_till_done(wait_background_tasks=True)

    assert _resources(hass) == [OTHER]


async def test_without_frontend_files_the_rest_runs(hass, aioclient_mock, race_start):
    with patch(f"{PANEL_PY}._read_modules", side_effect=FileNotFoundError):
        entry = await _setup(hass, aioclient_mock, race_start)

    assert URL_PATH not in hass.data.get(DATA_PANELS, {})
    assert _resources(hass) == []
    assert not _in_index(hass)
    assert hass.states.async_entity_ids("calendar")
    await _unload(hass, entry)
