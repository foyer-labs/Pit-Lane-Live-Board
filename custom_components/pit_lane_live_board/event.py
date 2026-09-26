"""Event entities (SPEC §10.2, §10.3): race control transitions and the stewards'
decisions.

The hub derives both from released state (after the TV delay), never from stale
state and never while no-spoiler mode hides the session; these entities only relay
them. Persisted marks make sure a restart never fires one twice.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.event import EventEntity
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import LiveBoardConfigEntry
from .core.events import EVENT_TYPES
from .core.stewards import DECISIONS
from .entity import LiveBoardEntity
from .hub import SIGNAL_EVENT, SIGNAL_LIVE, SIGNAL_STEWARDS


async def async_setup_entry(
    hass: HomeAssistant,
    entry: LiveBoardConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities(
        [RaceControlEvent(entry, "race_control"), StewardsEvent(entry, "stewards")]
    )


class _RelayedEvent(LiveBoardEntity, EventEntity):
    signal: str
    signals = (SIGNAL_LIVE,)  # availability follows play and pause

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(
            async_dispatcher_connect(self.hass, self.signal, self._relay)
        )

    @property
    def available(self) -> bool:
        return not self.hub.entity_state["paused"]

    def _session(self) -> str | None:
        live = self.hub.live
        return live.session.key if live and live.session else None

    @callback
    def _relay(self, payload: Any) -> None:
        event_type, data = self._event(payload)
        self._trigger_event(event_type, {"session": self._session(), **data})
        self.async_write_ha_state()

    def _event(self, payload: Any) -> tuple[str, dict[str, Any]]:
        raise NotImplementedError


class RaceControlEvent(_RelayedEvent):
    _attr_event_types = list(EVENT_TYPES)
    signal = SIGNAL_EVENT

    def _event(self, payload: Any) -> tuple[str, dict[str, Any]]:
        return payload, {}


class StewardsEvent(_RelayedEvent):
    """One event per decision: penalties, investigations, track limits."""

    _attr_event_types = list(DECISIONS)
    signal = SIGNAL_STEWARDS

    def _event(self, payload: Any) -> tuple[str, dict[str, Any]]:
        cars = payload.get("cars") or []
        return payload["kind"], {
            "drivers": [c["tla"] for c in cars],
            "numbers": [c["number"] for c in cars],
            "seconds": payload.get("seconds"),
            "places": payload.get("places"),
            "reason": payload.get("reason"),
            "turn": payload.get("turn"),
            "lap": payload.get("lap"),
            "message": payload.get("message"),
        }
