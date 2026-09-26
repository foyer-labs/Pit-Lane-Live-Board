"""Household settings kept in the store (SPEC §8, §9, §11).

The TV delay and no-spoiler mode are one value per installation (decision 14):
automations and every open page must agree with the same TV.
"""

from __future__ import annotations

from dataclasses import dataclass, field, replace
from typing import Any

MIN_DELAY = 0
MAX_DELAY = 120


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

    def with_delay(self, value: Any) -> Settings:
        return replace(self, tv_delay=clamp_delay(value))

    def with_no_spoiler(self, on: bool) -> Settings:
        # Switching the mode off forgets the per-session reveals: the next time it
        # is switched on, it starts from a clean slate.
        return replace(self, no_spoiler=bool(on), revealed=frozenset())

    def with_revealed(self, session_key: str) -> Settings:
        return replace(self, revealed=self.revealed | {str(session_key)})

    def to_dict(self) -> dict[str, Any]:
        return {
            "tv_delay": self.tv_delay,
            "no_spoiler": self.no_spoiler,
            "revealed": sorted(self.revealed),
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
            revealed=frozenset(str(k) for k in revealed if isinstance(k, (str, int)))
            if isinstance(revealed, list)
            else frozenset(),
        )
