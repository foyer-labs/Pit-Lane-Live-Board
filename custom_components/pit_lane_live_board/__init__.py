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

_COMMANDS_KEY = "pit_lane_live_board_commands"


@dataclass
class RuntimeData:
    store: SettingsStore
    hub: Hub


type LiveBoardConfigEntry = ConfigEntry[RuntimeData]


async def async_setup_entry(hass: HomeAssistant, entry: LiveBoardConfigEntry) -> bool:
    from . import panel, websocket
    from .hub import Hub
    from .store import SettingsStore

    store = SettingsStore(hass)
    await store.async_load()
    hub = Hub(hass, entry, store)
    entry.runtime_data = RuntimeData(store=store, hub=hub)
    if not hass.data.get(_COMMANDS_KEY):
        websocket.async_register(hass)
        hass.data[_COMMANDS_KEY] = True
    await hub.async_start()
    await panel.async_register(hass, entry)
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    return True


async def _async_options_updated(
    hass: HomeAssistant, entry: LiveBoardConfigEntry
) -> None:
    from . import panel

    await panel.async_register(hass, entry)


async def async_unload_entry(hass: HomeAssistant, entry: LiveBoardConfigEntry) -> bool:
    from . import panel

    await entry.runtime_data.hub.async_stop()
    panel.async_remove(hass)
    return True
