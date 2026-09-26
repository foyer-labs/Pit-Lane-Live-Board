"""What every entity shares (SPEC §10.2): one service device, the hub, and updates
pushed by the hub's signals rather than polled.

Each entity listens only to the signals of what it shows, and the hub sends
`SIGNAL_LIVE` only when the live entities' snapshot changed: during a race the
recorder sees a few hundred writes, not two a second per entity.
"""

from __future__ import annotations

from typing import Any

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity import Entity

from . import LiveBoardConfigEntry
from .const import DOMAIN, NAME, VERSION
from .hub import SIGNAL_LIVE, SIGNAL_SETTINGS, Hub
from .panel import URL_PATH


class LiveBoardEntity(Entity):
    _attr_has_entity_name = True
    _attr_should_poll = False
    signals: tuple[str, ...] = (SIGNAL_SETTINGS,)

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
        await super().async_added_to_hass()
        for signal in self.signals:
            self.async_on_remove(
                async_dispatcher_connect(self.hass, signal, self.async_write_ha_state)
            )


class LiveEntity(LiveBoardEntity):
    """An entity that reads the live session, through the hub's snapshot.

    Unavailable while live timing is paused (nothing is known) and when the feed
    is lost (INV-2); no value while no-spoiler mode hides the session (decision 15)
    and outside a session.
    """

    signals = (SIGNAL_LIVE,)

    @property
    def live(self) -> dict[str, Any]:
        return self.hub.entity_state

    @property
    def available(self) -> bool:
        return not self.live["paused"] and self.live["available"]

    def shown(self, key: str) -> Any:
        """A value of the snapshot, None when nothing is shown."""
        return self.live.get(key) if self.live["shown"] else None
