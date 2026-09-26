"""No-spoiler mode (SPEC §9, INV-5).

These functions decide what is hidden; the WebSocket layer applies them before
anything is sent, so a hidden result never reaches the browser.
"""

from __future__ import annotations

from datetime import datetime

from .schedule import Meeting, spoiler_scope
from .settings import Settings


def hidden_sessions(
    settings: Settings, meetings: list[Meeting], now: datetime
) -> frozenset[str]:
    """Session keys whose outcome is hidden right now.

    The scope is every session of the most recent meeting that has started, minus
    the sessions the user revealed one by one.
    """
    if not settings.no_spoiler:
        return frozenset()
    scope = spoiler_scope(meetings, now)
    if scope is None:
        return frozenset()
    return frozenset(s.key for s in scope.sessions) - settings.revealed


def live_hidden(settings: Settings) -> bool:
    """The live page, the live entities and the events are hidden whenever the mode
    is on: a live session always belongs to the meeting in scope (decision 15)."""
    return settings.no_spoiler


def standings_round_cap(
    settings: Settings, meetings: list[Meeting], now: datetime
) -> tuple[int, int] | None:
    """`(season, last round allowed)` while the mode hides a race, else None.

    Standings then show the table after the last round before the hidden meeting.
    Revealing the meeting's race lifts the cap.
    """
    if not settings.no_spoiler:
        return None
    scope = spoiler_scope(meetings, now)
    if scope is None:
        return None
    race = scope.race
    hidden = hidden_sessions(settings, meetings, now)
    sprint = next((s for s in scope.sessions if s.kind == "sprint"), None)
    # Points come from the sprint and from the race: either hidden caps the table.
    if (race and race.key in hidden) or (sprint and sprint.key in hidden):
        return scope.season, scope.round - 1
    return None
