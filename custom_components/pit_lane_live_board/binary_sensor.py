"""Binary sensors (SPEC §10.2): the session running, and the flags.

The flags read the stewards' book reconciled with the track status (core/stewards):
each is on while its condition holds on the released (TV-delayed) state.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import LiveBoardConfigEntry
from .entity import LiveEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: LiveBoardConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities(
        [
            SessionLiveSensor(entry, "session_live"),
            SafetyCarSensor(entry, "safety_car"),
            SafetyCarSensor(entry, "virtual_safety_car"),
            RedFlagSensor(entry, "red_flag"),
            YellowFlagSensor(entry, "yellow_flag"),
        ]
    )


class SessionLiveSensor(LiveEntity, BinarySensorEntity):
    _attr_device_class = BinarySensorDeviceClass.RUNNING

    @property
    def is_on(self) -> bool:
        # Whether a session is running is not a spoiler; it reads the raw state.
        return self.live["running"]


class SafetyCarSensor(LiveEntity, BinarySensorEntity):
    """On while the (virtual) safety car is out; `ending` when it comes in this
    lap."""

    @property
    def is_on(self) -> bool | None:
        if not self.live["shown"]:
            return None
        return self.shown(self.translation_key) is not None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"ending": self.shown(self.translation_key) == "ending"}


class RedFlagSensor(LiveEntity, BinarySensorEntity):
    @property
    def is_on(self) -> bool | None:
        return self.shown("red_flag")


class YellowFlagSensor(LiveEntity, BinarySensorEntity):
    """On with a yellow anywhere: on the whole track, or in any sector."""

    @property
    def is_on(self) -> bool | None:
        return self.shown("yellow")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {
            "sectors": self.shown("yellow_sectors") or [],
            "double": bool(self.shown("double_yellow")),
        }
