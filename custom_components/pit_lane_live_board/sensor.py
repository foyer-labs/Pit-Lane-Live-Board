"""Sensors (SPEC §10.2): next session, session status, track status, lap, flags and
stewards, F1TV."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.const import EntityCategory
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.event import async_track_point_in_utc_time

from . import LiveBoardConfigEntry
from .core.f1tv_token import STATUSES as F1TV_STATUSES
from .core.session import SESSION_STATUSES, TRACK_STATUSES
from .entity import LiveBoardEntity, LiveEntity
from .hub import SIGNAL_CALENDAR


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
            PenaltiesSensor(entry, "penalties"),
            InvestigationsSensor(entry, "investigations"),
            RaceControlMessageSensor(entry, "race_control_message"),
            F1tvSensor(entry, "f1tv"),
        ]
    )


class NextSessionSensor(LiveBoardEntity, SensorEntity):
    """Moves on when the calendar changes and when the next session starts."""

    _attr_device_class = SensorDeviceClass.TIMESTAMP
    signals = ()
    _unsub_start: CALLBACK_TYPE | None = None

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(
            async_dispatcher_connect(self.hass, SIGNAL_CALENDAR, self._calendar)
        )
        self.async_on_remove(self._cancel)
        self._schedule()

    @callback
    def _cancel(self) -> None:
        if self._unsub_start is not None:
            self._unsub_start()
            self._unsub_start = None

    @callback
    def _schedule(self) -> None:
        self._cancel()
        found = self.hub.next_session()
        start = found[1].start if found else None
        if start is not None:
            self._unsub_start = async_track_point_in_utc_time(
                self.hass, self._started, start
            )

    @callback
    def _calendar(self) -> None:
        self._schedule()
        self.async_write_ha_state()

    @callback
    def _started(self, _now: datetime) -> None:
        self._unsub_start = None
        self._calendar()

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
        if not self.live["connected"]:
            return "inactive"
        return self.shown("session_status")


class TrackStatusSensor(LiveEntity, SensorEntity):
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = list(TRACK_STATUSES)

    @property
    def native_value(self) -> str | None:
        return self.shown("track")


class LapSensor(LiveEntity, SensorEntity):
    """No state class: a lap count is not worth long-term statistics."""

    @property
    def native_value(self) -> int | None:
        return self.shown("lap")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"total_laps": self.shown("total_laps")}


class PenaltiesSensor(LiveEntity, SensorEntity):
    """How many penalties the stewards have given this session; the list, newest
    first, as an attribute kept out of the recorder."""

    _unrecorded_attributes = frozenset({"penalties"})

    @property
    def native_value(self) -> int | None:
        penalties = self.shown("penalties")
        return None if penalties is None else len(penalties)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"penalties": self.shown("penalties") or []}


class InvestigationsSensor(LiveEntity, SensorEntity):
    """Incidents noted or under investigation, not yet decided."""

    _unrecorded_attributes = frozenset({"investigations"})

    @property
    def native_value(self) -> int | None:
        open_incidents = self.shown("investigations")
        return None if open_incidents is None else len(open_incidents)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"investigations": self.shown("investigations") or []}


class RaceControlMessageSensor(LiveEntity, SensorEntity):
    """The latest race control message, as F1 wrote it (in English)."""

    _unrecorded_attributes = frozenset({"category", "flag", "sector", "lap", "utc"})

    def _message(self) -> dict[str, Any]:
        return self.shown("last_message") or {}

    @property
    def native_value(self) -> str | None:
        text = self._message().get("message")
        return text[:255] if text else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        message = self._message()
        return {
            key: message.get(key)
            for key in ("category", "flag", "sector", "lap", "utc")
        }


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
