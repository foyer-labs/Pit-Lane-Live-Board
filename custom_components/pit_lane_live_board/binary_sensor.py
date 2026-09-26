"""On while a session is running (SPEC §10.2)."""

from __future__ import annotations

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import LiveBoardConfigEntry
from .core.session import session_status
from .entity import LiveEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: LiveBoardConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities([SessionLiveSensor(entry, "session_live")])


class SessionLiveSensor(LiveEntity, BinarySensorEntity):
    _attr_device_class = BinarySensorDeviceClass.RUNNING

    @property
    def is_on(self) -> bool | None:
        live = self.hub.live
        if live is None:
            return False
        # Whether a session is running is not a spoiler; it reads the raw state.
        return session_status(live.state.get("SessionStatus")) == "started"
