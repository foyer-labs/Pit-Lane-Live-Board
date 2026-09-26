"""Switches (SPEC §9, §10.2): live timing (play and pause) and no-spoiler mode."""

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
    async_add_entities(
        [LiveTimingSwitch(entry, "live_timing"), NoSpoilerSwitch(entry, "no_spoiler")]
    )


class LiveTimingSwitch(LiveBoardEntity, SwitchEntity):
    """Play and pause (decision 42): off, nothing connects to F1 and nothing live
    is written to disk."""

    @property
    def is_on(self) -> bool:
        return self.hub.settings.live

    async def async_turn_on(self, **kwargs: Any) -> None:
        if not self.hub.settings.live:
            await self.hub.async_update_settings(self.hub.settings.with_live(True))

    async def async_turn_off(self, **kwargs: Any) -> None:
        if self.hub.settings.live:
            await self.hub.async_update_settings(self.hub.settings.with_live(False))


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
