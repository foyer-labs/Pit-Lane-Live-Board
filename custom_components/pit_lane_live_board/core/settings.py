"""Household settings kept in the store (SPEC §8, §9, §11).

The TV delay and no-spoiler mode are one value per installation (decision 14):
automations and every open page must agree with the same TV.

Live timing starts **paused** (decision 42): until someone presses play, nothing
connects to F1 and nothing live is written, which matters on a Raspberry Pi with an
SD card. `auto_start` turns live timing on by itself when a session window opens.
"""

from __future__ import annotations

from dataclasses import dataclass, field, replace
from typing import Any

from .favourites import normalise

SESSION_KINDS = ("practice", "qualifying", "sprint_qualifying", "sprint", "race")
DEFAULT_SUMMARY_KINDS = ("sprint", "race")
SUMMARY_FORMATS = ("compact", "full")


def _kinds(value: Any) -> tuple[str, ...]:
    if not isinstance(value, (list, tuple)):
        return DEFAULT_SUMMARY_KINDS
    return tuple(k for k in SESSION_KINDS if k in {str(v) for v in value})


def _targets(value: Any) -> tuple[str, ...]:
    """Notify services by name (`mobile_app_pixel`), without the domain."""
    if not isinstance(value, (list, tuple)):
        return ()
    out: list[str] = []
    for item in value:
        name = str(item).strip().removeprefix("notify.")
        if name and name.replace("_", "").isalnum() and name not in out:
            out.append(name)
    return tuple(out[:10])


MIN_DELAY = 0
MAX_DELAY = 120
# Reveals only matter inside the spoiler scope (one meeting, a handful of
# sessions): the cap keeps a looping script from growing the store without end.
MAX_REVEALED = 30


def clamp_delay(value: Any) -> int:
    """A delay in whole seconds within 0 to 120; anything unreadable becomes 0."""
    try:
        seconds = round(float(value))
    except (TypeError, ValueError):
        return MIN_DELAY
    return max(MIN_DELAY, min(MAX_DELAY, seconds))


@dataclass(frozen=True, slots=True)
class Settings:
    """What the store keeps between restarts."""

    tv_delay: int = 0
    no_spoiler: bool = False
    # Session keys the user revealed while no-spoiler mode is on (SPEC §9).
    revealed: frozenset[str] = field(default_factory=frozenset)
    live: bool = False
    auto_start: bool = False
    # The household's drivers (decision 52) and the session summary (decision 53).
    favourites: tuple[str, ...] = ()
    notify_targets: tuple[str, ...] = ()
    summary_kinds: tuple[str, ...] = DEFAULT_SUMMARY_KINDS
    # Compact (podium and highlights) or full (the whole classification, decision 56).
    summary_format: str = "compact"

    def with_delay(self, value: Any) -> Settings:
        return replace(self, tv_delay=clamp_delay(value))

    def with_no_spoiler(self, on: bool) -> Settings:
        # Switching the mode off forgets the per-session reveals: the next time it
        # is switched on, it starts from a clean slate.
        return replace(self, no_spoiler=bool(on), revealed=frozenset())

    def with_revealed(
        self, session_key: str, keep: frozenset[str] | None = None
    ) -> Settings:
        """One more session revealed. `keep`, when given, are the reveals still
        worth keeping (those of the spoiler scope): the others are forgotten.
        Past the cap nothing is added."""
        kept = self.revealed if keep is None else self.revealed & keep
        revealed = kept | {str(session_key)}
        if len(revealed) > MAX_REVEALED:
            return self
        return replace(self, revealed=revealed)

    def with_live(self, on: bool) -> Settings:
        return replace(self, live=bool(on))

    def with_auto_start(self, on: bool) -> Settings:
        return replace(self, auto_start=bool(on))

    def with_favourites(self, codes: Any) -> Settings:
        return replace(self, favourites=normalise(codes))

    def with_summary(
        self, targets: Any = None, kinds: Any = None, fmt: Any = None
    ) -> Settings:
        return replace(
            self,
            notify_targets=self.notify_targets
            if targets is None
            else _targets(targets),
            summary_kinds=self.summary_kinds if kinds is None else _kinds(kinds),
            summary_format=str(fmt) if fmt in SUMMARY_FORMATS else self.summary_format,
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "tv_delay": self.tv_delay,
            "no_spoiler": self.no_spoiler,
            "revealed": sorted(self.revealed),
            "live": self.live,
            "auto_start": self.auto_start,
            "favourites": list(self.favourites),
            "notify_targets": list(self.notify_targets),
            "summary_kinds": list(self.summary_kinds),
            "summary_format": self.summary_format,
        }

    @classmethod
    def from_dict(cls, data: Any) -> Settings:
        """Read stored settings, tolerating missing or damaged fields."""
        if not isinstance(data, dict):
            return cls()
        revealed = data.get("revealed")
        return cls(
            tv_delay=clamp_delay(data.get("tv_delay", 0)),
            no_spoiler=data.get("no_spoiler") is True,
            revealed=frozenset(
                sorted(str(k) for k in revealed if isinstance(k, (str, int)))[
                    :MAX_REVEALED
                ]
            )
            if isinstance(revealed, list)
            else frozenset(),
            live=data.get("live") is True,
            auto_start=data.get("auto_start") is True,
            favourites=normalise(data.get("favourites")),
            notify_targets=_targets(data.get("notify_targets")),
            summary_kinds=_kinds(
                data.get("summary_kinds", list(DEFAULT_SUMMARY_KINDS))
            ),
            summary_format=data["summary_format"]
            if data.get("summary_format") in SUMMARY_FORMATS
            else "compact",
        )
