"""What every entity shares (SPEC §10.2): one service device, the hub, and updates
pushed by the hub's signals rather than polled."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity import Entity

from . import LiveBoardConfigEntry
from .const import DOMAIN, NAME, VERSION
from .core.spoiler import live_hidden
from .hub import SIGNAL_CALENDAR, SIGNAL_LIVE, SIGNAL_SETTINGS, Hub
from .panel import URL_PATH


class LiveBoardEntity(Entity):
    _attr_has_entity_name = True
    _attr_should_poll = False
    signals: tuple[str, ...] = (SIGNAL_LIVE, SIGNAL_SETTINGS, SIGNAL_CALENDAR)

    def __init__(self, entry: LiveBoardConfigEntry, key: str) -> None:
        self.hub: Hub = entry.runtime_data.hub
        self._attr_translation_key = key
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=NAME,
            manufacturer="Foyer Labs",
            model="Unofficial Formula 1 panel",
            sw_version=VERSION,
            entry_type=DeviceEntryType.SERVICE,
            configuration_url=f"homeassistant://{URL_PATH}",
        )

    async def async_added_to_hass(self) -> None:
        for signal in self.signals:
            self.async_on_remove(
                async_dispatcher_connect(self.hass, signal, self.async_write_ha_state)
            )


class LiveEntity(LiveBoardEntity):
    """An entity that reads the live session.

    Unavailable when the feed is lost (INV-2); no value while no-spoiler mode hides
    the session (decision 15); no value outside a session.
    """

    @property
    def available(self) -> bool:
        live = self.hub.live
        return live is None or live.health != "lost" or not live.ever_connected

    @property
    def live_topics(self) -> dict | None:
        live = self.hub.live
        if live is None or live_hidden(self.hub.settings) or live.buffer.syncing():
            return None
        return live.state.topics or None
