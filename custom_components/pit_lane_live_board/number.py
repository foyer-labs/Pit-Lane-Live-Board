"""The TV delay as a number (SPEC §8, §10.2)."""

from __future__ import annotations

from homeassistant.components.number import NumberDeviceClass, NumberEntity, NumberMode
from homeassistant.const import UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import LiveBoardConfigEntry
from .core.settings import MAX_DELAY, MIN_DELAY
from .entity import LiveBoardEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: LiveBoardConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities([TvDelayNumber(entry, "tv_delay")])


class TvDelayNumber(LiveBoardEntity, NumberEntity):
    _attr_device_class = NumberDeviceClass.DURATION
    _attr_native_unit_of_measurement = UnitOfTime.SECONDS
    _attr_native_min_value = MIN_DELAY
    _attr_native_max_value = MAX_DELAY
    _attr_native_step = 1
    _attr_mode = NumberMode.SLIDER

    @property
    def native_value(self) -> float:
        return self.hub.settings.tv_delay

    async def async_set_native_value(self, value: float) -> None:
        await self.hub.async_update_settings(self.hub.settings.with_delay(value))
