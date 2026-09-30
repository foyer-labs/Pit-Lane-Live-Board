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
PLATFORMS = ["binary_sensor", "calendar", "event", "number", "sensor", "switch"]


@dataclass
class RuntimeData:
    store: SettingsStore
    hub: Hub
    sidebar: bool = True
    admin_only: bool = False


type LiveBoardConfigEntry = ConfigEntry[RuntimeData]


async def async_setup_entry(hass: HomeAssistant, entry: LiveBoardConfigEntry) -> bool:
    from . import panel, websocket
    from .hub import Hub
    from .store import SettingsStore

    # First, before anything that can fail: the cards reach every page even when
    # the entry does not start, and say so instead of "Configuration error"
    # (decision 59).
    await panel.async_register_frontend(hass)
    store = SettingsStore(hass)
    await store.async_load()
    hub = Hub(hass, entry, store)
    entry.runtime_data = RuntimeData(
        store=store,
        hub=hub,
        sidebar=panel.show_in_sidebar(entry),
        admin_only=panel.admin_only(entry),
    )
    if not hass.data.get(_COMMANDS_KEY):
        websocket.async_register(hass)
        hass.data[_COMMANDS_KEY] = True
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    # Timers and the calendar start in the background: setup never waits on F1.
    await hub.async_start()
    await panel.async_register(hass, entry)
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    return True


async def _async_options_updated(
    hass: HomeAssistant, entry: LiveBoardConfigEntry
) -> None:
    """Only the panel's options need the panel again; a saved token does not."""
    from . import panel

    sidebar, admin_only = panel.show_in_sidebar(entry), panel.admin_only(entry)
    data = entry.runtime_data
    if (sidebar, admin_only) != (data.sidebar, data.admin_only):
        data.sidebar, data.admin_only = sidebar, admin_only
        await panel.async_register(hass, entry)
        from homeassistant.helpers.dispatcher import async_dispatcher_send

        from .hub import SIGNAL_SETTINGS

        async_dispatcher_send(hass, SIGNAL_SETTINGS)


async def async_unload_entry(hass: HomeAssistant, entry: LiveBoardConfigEntry) -> bool:
    """The panel stays while the entry reloads: open pages keep their place and
    receive from the new hub. It goes when the entry is removed or disabled."""
    from . import panel

    # The hub first: while the platforms unload, a live loop still running would
    # advance the event marks for events no entity is left to fire, and after the
    # reload they would count as fired (SPEC §10.3).
    await entry.runtime_data.hub.async_stop()
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if not unloaded:
        return False
    if entry.disabled_by is not None:
        await panel.async_remove(hass)
    return True


async def async_remove_entry(hass: HomeAssistant, entry: LiveBoardConfigEntry) -> None:
    from homeassistant.helpers import issue_registry as ir

    from . import panel, store
    from .const import DOMAIN
    from .hub import ISSUE_F1TV, ISSUE_LIVE

    await panel.async_remove(hass)
    for issue in (ISSUE_F1TV, ISSUE_LIVE):
        ir.async_delete_issue(hass, DOMAIN, issue)
    await store.async_remove(hass)
