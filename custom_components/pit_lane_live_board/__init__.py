"""Pit Lane Live Board: Formula 1 in a ready-made Home Assistant panel.

Unofficial; not associated in any way with the Formula 1 companies (SPEC §15).

Home Assistant is imported inside the functions on purpose: importing
`custom_components.pit_lane_live_board.core` loads this package first, and the pure
suite runs without Home Assistant installed (INV-1).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

    from .hub import Hub
    from .store import SettingsStore


@dataclass
class RuntimeData:
    store: SettingsStore
    hub: Hub


type LiveBoardConfigEntry = ConfigEntry[RuntimeData]


async def async_setup_entry(hass: HomeAssistant, entry: LiveBoardConfigEntry) -> bool:
    from .hub import Hub
    from .store import SettingsStore

    store = SettingsStore(hass)
    await store.async_load()
    hub = Hub(hass, entry, store)
    entry.runtime_data = RuntimeData(store=store, hub=hub)
    await hub.async_start()
    return True


async def async_unload_entry(hass: HomeAssistant, entry: LiveBoardConfigEntry) -> bool:
    await entry.runtime_data.hub.async_stop()
    return True
