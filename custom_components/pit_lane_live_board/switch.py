"""No-spoiler mode as a switch (SPEC §9, §10.2)."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import LiveBoardConfigEntry
from .entity import LiveBoardEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: LiveBoardConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities([NoSpoilerSwitch(entry, "no_spoiler")])


class NoSpoilerSwitch(LiveBoardEntity, SwitchEntity):
    @property
    def is_on(self) -> bool:
        return self.hub.settings.no_spoiler

    async def async_turn_on(self, **kwargs: Any) -> None:
        if not self.hub.settings.no_spoiler:
            await self.hub.async_update_settings(
                self.hub.settings.with_no_spoiler(True)
            )

    async def async_turn_off(self, **kwargs: Any) -> None:
        if self.hub.settings.no_spoiler:
            await self.hub.async_update_settings(
                self.hub.settings.with_no_spoiler(False)
            )
