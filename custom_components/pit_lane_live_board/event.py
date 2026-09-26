"""The race-control event entity (SPEC §10.2, §10.3).

The hub derives events from released state (after the TV delay), never from stale
state and never while no-spoiler mode hides the session; this entity only relays them.
"""

from __future__ import annotations

from homeassistant.components.event import EventEntity
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import LiveBoardConfigEntry
from .core.events import EVENT_TYPES
from .entity import LiveBoardEntity
from .hub import SIGNAL_EVENT


async def async_setup_entry(
    hass: HomeAssistant,
    entry: LiveBoardConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities([RaceControlEvent(entry, "race_control")])


class RaceControlEvent(LiveBoardEntity, EventEntity):
    _attr_event_types = list(EVENT_TYPES)
    signals = ()

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(
            async_dispatcher_connect(self.hass, SIGNAL_EVENT, self._fire)
        )

    @callback
    def _fire(self, event_type: str) -> None:
        live = self.hub.live
        session = live.session.key if live and live.session else None
        self._trigger_event(event_type, {"session": session})
        self.async_write_ha_state()
