"""The season calendar and the live windows (SPEC §6.1, §7.2).

Built from Jolpica's schedule. Times are aware UTC datetimes; the panel converts
them to Home Assistant's timezone. `now` is always a parameter (INV-1).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from typing import Any

from .values import text, to_int

# Jolpica field → our session kind, in weekend order.
_SESSION_FIELDS: tuple[tuple[str, str], ...] = (
    ("FirstPractice", "practice_1"),
    ("SecondPractice", "practice_2"),
    ("ThirdPractice", "practice_3"),
    ("SprintShootout", "sprint_qualifying"),
    ("SprintQualifying", "sprint_qualifying"),
    ("Sprint", "sprint"),
    ("Qualifying", "qualifying"),
)
# Scheduled length, for the calendar and the live window's hard cap.
DURATION = {
    "practice_1": timedelta(minutes=60),
    "practice_2": timedelta(minutes=60),
    "practice_3": timedelta(minutes=60),
    "sprint_qualifying": timedelta(minutes=45),
    "sprint": timedelta(minutes=60),
    "qualifying": timedelta(minutes=60),
    "race": timedelta(minutes=120),
}
WINDOW_BEFORE = timedelta(minutes=30)
WINDOW_HARD_CAP = timedelta(hours=4)


@dataclass(frozen=True, slots=True)
class Session:
    key: str  # "2026-14-race": stable, derived from season, round and kind
    kind: str
    day: date
    start: datetime | None  # None for old seasons, which carry a date only

    @property
    def end(self) -> datetime | None:
        return self.start + DURATION[self.kind] if self.start else None

    def to_dict(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "kind": self.kind,
            "date": self.day.isoformat(),
            "start": self.start.isoformat() if self.start else None,
            "end": self.end.isoformat() if self.end else None,
        }


@dataclass(frozen=True, slots=True)
class Meeting:
    season: int
    round: int
    name: str
    circuit_id: str | None
    circuit: str | None
    locality: str | None
    country: str | None
    sessions: tuple[Session, ...]

    @property
    def sprint(self) -> bool:
        return any(s.kind == "sprint" for s in self.sessions)

    @property
    def race(self) -> Session | None:
        return next((s for s in self.sessions if s.kind == "race"), None)

    def started(self, now: datetime) -> bool:
        first = self.sessions[0] if self.sessions else None
        if first is None:
            return False
        if first.start is not None:
            return first.start <= now
        return first.day <= now.date()

    def finished(self, now: datetime) -> bool:
        last = self.sessions[-1] if self.sessions else None
        if last is None:
            return False
        if last.end is not None:
            return last.end <= now
        return last.day < now.date()

    def to_dict(self) -> dict[str, Any]:
        return {
            "season": self.season,
            "round": self.round,
            "name": self.name,
            "circuit_id": self.circuit_id,
            "circuit": self.circuit,
            "locality": self.locality,
            "country": self.country,
            "sprint": self.sprint,
            "sessions": [s.to_dict() for s in self.sessions],
        }


def _moment(block: Any) -> tuple[date, datetime | None] | None:
    if not isinstance(block, dict):
        return None
    raw_day = text(block.get("date"))
    if raw_day is None:
        return None
    try:
        day = date.fromisoformat(raw_day)
    except ValueError:
        return None
    raw_time = text(block.get("time"))
    if raw_time is None:
        return day, None
    try:
        clock = time.fromisoformat(raw_time.replace("Z", ""))
    except ValueError:
        return day, None
    return day, datetime.combine(day, clock, tzinfo=UTC)


def parse_schedule(payload: Any) -> list[Meeting]:
    """Jolpica's `/{season}.json` response → meetings in round order."""
    try:
        races = payload["MRData"]["RaceTable"]["Races"]
    except (KeyError, TypeError):
        return []
    meetings = []
    for race in races if isinstance(races, list) else []:
        if not isinstance(race, dict):
            continue
        season, rnd = to_int(race.get("season")), to_int(race.get("round"))
        if season is None or rnd is None:
            continue
        sessions = []
        for field, kind in _SESSION_FIELDS:
            moment = _moment(race.get(field))
            if moment and not any(s.kind == kind for s in sessions):
                sessions.append(Session(f"{season}-{rnd}-{kind}", kind, *moment))
        race_moment = _moment(race)
        if race_moment:
            sessions.append(Session(f"{season}-{rnd}-race", "race", *race_moment))
        sessions.sort(key=lambda s: s.start or datetime.combine(s.day, time(), UTC))
        circuit = race.get("Circuit") if isinstance(race.get("Circuit"), dict) else {}
        location = (
            circuit.get("Location") if isinstance(circuit.get("Location"), dict) else {}
        )
        meetings.append(
            Meeting(
                season=season,
                round=rnd,
                name=text(race.get("raceName")) or f"Round {rnd}",
                circuit_id=text(circuit.get("circuitId")),
                circuit=text(circuit.get("circuitName")),
                locality=text(location.get("locality")),
                country=text(location.get("country")),
                sessions=tuple(sessions),
            )
        )
    meetings.sort(key=lambda m: m.round)
    return meetings


def all_sessions(meetings: list[Meeting]) -> list[Session]:
    return [s for m in meetings for s in m.sessions]


def next_session(
    meetings: list[Meeting], now: datetime
) -> tuple[Meeting, Session] | None:
    """The first session that starts after `now`."""
    for meeting in meetings:
        for session in meeting.sessions:
            if session.start is not None and session.start > now:
                return meeting, session
    return None


def live_window(
    meetings: list[Meeting], now: datetime, skip: frozenset[str] = frozenset()
) -> tuple[Meeting, Session] | None:
    """The session whose live window contains `now` (SPEC §6.1).

    The window opens 30 minutes before the scheduled start and, at the latest,
    closes 4 hours after the scheduled end; the live feed's own status closes it
    earlier, and the caller then passes that session in `skip`.

    Windows overlap on a busy day (FP3's hard cap runs into Qualifying's window): the
    latest session to start wins, so the next session is never shadowed by one
    that already ended.
    """
    best: tuple[Meeting, Session] | None = None
    for meeting in meetings:
        for session in meeting.sessions:
            if session.start is None or session.end is None or session.key in skip:
                continue
            if (
                not session.start - WINDOW_BEFORE
                <= now
                <= session.end + WINDOW_HARD_CAP
            ):
                continue
            if best is None or session.start > best[1].start:
                best = (meeting, session)
    return best


def meeting_state(meeting: Meeting, meetings: list[Meeting], now: datetime) -> str:
    """`done`, `live`, `next` or `upcoming`, for the calendar cards."""
    if meeting.finished(now):
        return "done"
    for session in meeting.sessions:
        if session.start and session.end and session.start <= now <= session.end:
            return "live"
    # The meeting that holds the next session to start, so during a live race the
    # next weekend is already "next".
    following = next_session(meetings, now)
    if following is not None and following[0] is meeting:
        return "next"
    return "upcoming"


def spoiler_scope(meetings: list[Meeting], now: datetime) -> Meeting | None:
    """The most recent meeting that has started: its sessions are what no-spoiler
    mode hides (SPEC §9)."""
    started = [m for m in meetings if m.started(now)]
    return started[-1] if started else None


def match_session(
    meetings: list[Meeting], kind: str, start: datetime | None
) -> Session | None:
    """Our session for a live or archive session of `kind` starting near `start`.

    F1 and Jolpica agree on the day and the kind; the times can differ by minutes.
    """
    if start is None:
        return None
    best: tuple[timedelta, Session] | None = None
    for session in all_sessions(meetings):
        if session.start is None or not _same_kind(session.kind, kind):
            continue
        distance = abs(session.start - start)
        if distance <= timedelta(hours=12) and (best is None or distance < best[0]):
            best = (distance, session)
    return best[1] if best else None


def feed_start(info: Any) -> datetime | None:
    """A live or archive `SessionInfo` start (local time plus `GmtOffset`) in UTC."""
    if not isinstance(info, dict):
        return None
    raw = text(info.get("StartDate"))
    if raw is None:
        return None
    try:
        local = datetime.fromisoformat(raw)
    except ValueError:
        return None
    if local.tzinfo is not None:
        return local.astimezone(UTC)
    offset = text(info.get("GmtOffset")) or "00:00:00"
    sign = -1 if offset.startswith("-") else 1
    parts = [int(p) for p in offset.lstrip("+-").split(":")[:2] if p.isdigit()]
    hours, minutes = [*parts, 0, 0][:2]
    delta = timedelta(hours=hours, minutes=minutes) * sign
    return (local - delta).replace(tzinfo=UTC)


def _same_kind(ours: str, theirs: str) -> bool:
    if theirs == "practice":
        return ours.startswith("practice")
    return ours == theirs
