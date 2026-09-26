"""Every session of the season as a calendar (SPEC §10.2).

Home Assistant's calendar triggers take an offset, so "15 minutes before the race"
needs no code of ours. Session names follow Home Assistant's language, from the
integration's translations (the `selector` category holds them, INV-7).
"""

from __future__ import annotations

from datetime import datetime, timedelta

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.translation import async_get_translations
from homeassistant.util import dt as dt_util

from . import LiveBoardConfigEntry
from .const import DOMAIN
from .core.schedule import Meeting, Session
from .entity import LiveBoardEntity
from .hub import SIGNAL_CALENDAR


async def async_setup_entry(
    hass: HomeAssistant,
    entry: LiveBoardConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities([SessionsCalendar(entry, "sessions")])


class SessionsCalendar(LiveBoardEntity, CalendarEntity):
    signals = (SIGNAL_CALENDAR,)

    def __init__(self, entry: LiveBoardConfigEntry, key: str) -> None:
        super().__init__(entry, key)
        self._names: dict[str, str] = {}

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        translations = await async_get_translations(
            self.hass, self.hass.config.language, "selector", {DOMAIN}
        )
        prefix = f"component.{DOMAIN}.selector.session.options."
        self._names = {
            key.removeprefix(prefix): value
            for key, value in translations.items()
            if key.startswith(prefix)
        }

    def _event(self, meeting: Meeting, session: Session) -> CalendarEvent:
        name = self._names.get(session.kind, session.kind.replace("_", " ").title())
        where = ", ".join(
            p for p in (meeting.circuit, meeting.locality, meeting.country) if p
        )
        if session.start is None:
            return CalendarEvent(
                start=session.day,
                end=session.day + timedelta(days=1),
                summary=f"{meeting.name} — {name}",
                location=where or None,
                uid=session.key,
            )
        return CalendarEvent(
            start=session.start,
            end=session.end,
            summary=f"{meeting.name} — {name}",
            description=f"Round {meeting.round}",
            location=where or None,
            uid=session.key,
        )

    def _events(self) -> list[CalendarEvent]:
        return [
            self._event(meeting, session)
            for meeting in self.hub.meetings
            for session in meeting.sessions
        ]

    @property
    def event(self) -> CalendarEvent | None:
        """The session running now, or the next one."""
        now = dt_util.utcnow()
        for event in self._events():
            if event.end_datetime_local > now:
                return event
        return None

    async def async_get_events(
        self, hass: HomeAssistant, start_date: datetime, end_date: datetime
    ) -> list[CalendarEvent]:
        return [
            event
            for event in self._events()
            if event.end_datetime_local > start_date
            and event.start_datetime_local < end_date
        ]
