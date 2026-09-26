"""Sensors (SPEC §10.2): next session, session status, track status, lap, F1TV."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import LiveBoardConfigEntry
from .core.f1tv_token import STATUSES as F1TV_STATUSES
from .core.session import SESSION_STATUSES, TRACK_STATUSES, session_status, track_status
from .core.values import to_int
from .entity import LiveBoardEntity, LiveEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: LiveBoardConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities(
        [
            NextSessionSensor(entry, "next_session"),
            SessionStatusSensor(entry, "session_status"),
            TrackStatusSensor(entry, "track_status"),
            LapSensor(entry, "lap"),
            F1tvSensor(entry, "f1tv"),
        ]
    )


class NextSessionSensor(LiveBoardEntity, SensorEntity):
    _attr_device_class = SensorDeviceClass.TIMESTAMP

    @property
    def native_value(self) -> datetime | None:
        found = self.hub.next_session()
        return found[1].start if found else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        found = self.hub.next_session()
        if found is None:
            return {}
        meeting, session = found
        return {
            "meeting": meeting.name,
            "session": session.kind,
            "circuit": meeting.circuit,
            "country": meeting.country,
            "round": meeting.round,
            "season": meeting.season,
        }


class SessionStatusSensor(LiveEntity, SensorEntity):
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = list(SESSION_STATUSES)

    @property
    def native_value(self) -> str | None:
        if self.hub.live is None:
            return "inactive"
        topics = self.live_topics
        return session_status(topics.get("SessionStatus")) if topics else None


class TrackStatusSensor(LiveEntity, SensorEntity):
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = list(TRACK_STATUSES)

    @property
    def native_value(self) -> str | None:
        topics = self.live_topics
        if not topics:
            return None
        return track_status(
            topics.get("TrackStatus"), session_status(topics.get("SessionStatus"))
        )


class LapSensor(LiveEntity, SensorEntity):
    _attr_state_class = SensorStateClass.MEASUREMENT

    def _laps(self) -> dict[str, Any]:
        topics = self.live_topics
        laps = topics.get("LapCount") if topics else None
        return laps if isinstance(laps, dict) else {}

    @property
    def native_value(self) -> int | None:
        return to_int(self._laps().get("CurrentLap"))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"total_laps": to_int(self._laps().get("TotalLaps"))}


class F1tvSensor(LiveBoardEntity, SensorEntity):
    """Only a status and the expiry, never the token (INV-3)."""

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = list(F1TV_STATUSES)
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    @property
    def native_value(self) -> str:
        return self.hub.f1tv.status

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        expires = self.hub.f1tv.expires
        return {"expires": expires.isoformat() if expires else None}
