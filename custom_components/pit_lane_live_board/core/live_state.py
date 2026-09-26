"""The merged state of the live topics (SPEC §4.2, §5.3).

One `LiveState` per session. Messages come in already released by the TV-delay
buffer, so this state is always "what the user's TV shows now".

Every topic carries a version that grows with each message, so the page's
sections are rebuilt only when a topic they read has changed (SPEC §5.5).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .archive_parse import decode_z
from .merge import merge

# Topics anyone can receive (verified live on 2026-09-26) and that something reads.
# TopThree, TimingStats and SessionData were dropped: nothing used them, and they
# were 7% of all messages (decision 41).
PUBLIC_TOPICS: tuple[str, ...] = (
    "Heartbeat",
    "SessionInfo",
    "SessionStatus",
    "TrackStatus",
    "LapCount",
    "ExtrapolatedClock",
    "DriverList",
    "TimingData",
    "TimingAppData",
    "RaceControlMessages",
    "WeatherData",
    "TeamRadio",
    "PitLaneTimeCollection",
)
# Topics F1 only sends to an F1TV subscriber. Only Position.z is used (SPEC §1.1).
AUTH_TOPICS: tuple[str, ...] = ("Position.z",)

POSITION_TOPIC = "Position.z"
PITS = "pits"  # the version key of the pit log

type Sample = tuple[str, float, float, bool]


@dataclass(frozen=True, slots=True)
class CarPosition:
    x: float
    y: float
    on_track: bool


@dataclass
class LiveState:
    topics: dict[str, Any] = field(default_factory=dict)
    versions: dict[str, int] = field(default_factory=dict)
    # Latest position per racing number, and the feed timestamp it carries.
    positions: dict[str, CarPosition] = field(default_factory=dict)
    positions_utc: str | None = None
    # Timestamp (UTC string from the feed) of the last message applied.
    last_utc: str | None = None
    # Pit lane times seen this session. F1 deletes each entry from
    # PitLaneTimeCollection soon after sending it, so the log keeps them.
    pit_log: list[dict[str, Any]] = field(default_factory=list)

    def get(self, topic: str) -> Any:
        return self.topics.get(topic)

    def version(self, *topics: str) -> tuple[int, ...]:
        return tuple(self.versions.get(topic, 0) for topic in topics)

    def _bump(self, topic: str) -> None:
        self.versions[topic] = self.versions.get(topic, 0) + 1

    def apply_keyframes(self, keyframes: dict[str, Any]) -> list[Sample]:
        """The subscribe reply: a full state per topic, replacing what was there.

        Returns the position samples it carried (for the live outline)."""
        samples: list[Sample] = []
        for topic, value in keyframes.items():
            if topic == POSITION_TOPIC:
                samples = self._apply_positions(value)
            else:
                self.topics[topic] = merge(None, value)
                self._log_pits(topic, value)
            self._bump(topic)
        return samples

    def apply(self, topic: str, delta: Any, utc: str | None = None) -> list[Sample]:
        """Merge one message; returns its position samples, if it had any."""
        samples: list[Sample] = []
        if topic == POSITION_TOPIC:
            samples = self._apply_positions(delta)
        else:
            self.topics[topic] = merge(self.topics.get(topic), delta)
            self._log_pits(topic, delta)
        self._bump(topic)
        if utc:
            self.last_utc = utc
        return samples

    def carry_over(self, previous: LiveState) -> None:
        """A reconnect to the same session: keep what F1 will not send again.

        Pit times F1 has already deleted are merged with those in the new
        keyframe; positions keep the fresher of each car's two."""
        seen = {(p["number"], p["lap"]) for p in self.pit_log}
        merged = [p for p in previous.pit_log if (p["number"], p["lap"]) not in seen]
        if merged:
            self.pit_log = merged + self.pit_log
            self._bump(PITS)
        self.positions = {**previous.positions, **self.positions}
        self.positions_utc = self.positions_utc or previous.positions_utc

    def _log_pits(self, topic: str, value: Any) -> None:
        if topic != "PitLaneTimeCollection" or not isinstance(value, dict):
            return
        times = value.get("PitTimes")
        if not isinstance(times, dict):
            return
        seen = {(p["number"], p["lap"]) for p in self.pit_log}
        for key, entry in times.items():
            if key == "_deleted" or not isinstance(entry, dict):
                continue
            number = str(entry.get("RacingNumber") or key)
            lap = entry.get("Lap")
            duration = entry.get("Duration")
            if lap is None or duration is None or (number, str(lap)) in seen:
                continue
            self.pit_log.append(
                {"number": number, "lap": str(lap), "duration": str(duration)}
            )
            seen.add((number, str(lap)))
            self._bump(PITS)

    def _apply_positions(self, value: Any) -> list[Sample]:
        decoded = decode_z(value) if isinstance(value, str) else value
        if not isinstance(decoded, dict):
            return []
        samples = decoded.get("Position")
        if not isinstance(samples, list):
            return []
        out: list[Sample] = []
        for sample in samples:
            if not isinstance(sample, dict):
                continue
            entries = sample.get("Entries")
            if not isinstance(entries, dict):
                continue
            for number, entry in entries.items():
                if not isinstance(entry, dict):
                    continue
                x, y = entry.get("X"), entry.get("Y")
                if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
                    continue
                if x == 0 and y == 0:
                    # (0, 0) is "no fix", not the origin of the circuit.
                    continue
                on_track = entry.get("Status") == "OnTrack"
                self.positions[str(number)] = CarPosition(float(x), float(y), on_track)
                out.append((str(number), float(x), float(y), on_track))
            if isinstance(sample.get("Timestamp"), str):
                self.positions_utc = sample["Timestamp"]
        return out
