"""The TV-delay buffer (SPEC §8).

Every live message, keyframes included, is pushed with the time it was received and
released once `now >= received + delay`. Everything downstream (timing, map, radio,
race control, automation events) reads only what was released, so one delay applies
to all of it.

Times are plain seconds on a monotonic clock supplied by the caller (INV-1).
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass

from .settings import MAX_DELAY, clamp_delay


@dataclass(frozen=True, slots=True)
class _Held[T]:
    received: float
    item: T


class DelayBuffer[T]:
    def __init__(self, delay: int = 0) -> None:
        self._delay = clamp_delay(delay)
        self._held: deque[_Held[T]] = deque()
        self._released_any = False
        self._last_released: float | None = None

    @property
    def delay(self) -> int:
        return self._delay

    def set_delay(self, delay: int) -> None:
        """Raising the delay holds output until it catches up; lowering it lets the
        backlog through on the next `release`."""
        self._delay = clamp_delay(delay)

    @property
    def last_released(self) -> float | None:
        """When the most recently released message was received: what the page
        shows is exactly that old, plus the delay (INV-2)."""
        return self._last_released

    def reset(self) -> None:
        """A new connection: forget what was held for the old one."""
        self._held.clear()
        self._released_any = False

    def push(self, received: float, item: T) -> None:
        self._held.append(_Held(received, item))

    def release(self, now: float, limit: int | None = None) -> list[T]:
        """Everything due at `now`, in arrival order; at most `limit` messages, so
        a lowered delay's backlog is applied over several calls."""
        due: list[T] = []
        while (
            (limit is None or len(due) < limit)
            and self._held
            and (
                self._held[0].received + self._delay <= now
                # Nothing waits longer than the largest possible delay, even if the
                # clock the caller passes jumped.
                or self._held[0].received + MAX_DELAY < now
            )
        ):
            held = self._held.popleft()
            self._last_released = held.received
            due.append(held.item)
        if due:
            self._released_any = True
        return due

    def syncing(self) -> bool:
        """True while a new connection's first messages are still held back: the
        page says "syncing with your TV delay" instead of showing nothing."""
        return not self._released_any and bool(self._held)

    def next_release_in(self, now: float) -> float | None:
        """Seconds until the next message is due, or None when nothing is held."""
        if not self._held:
            return None
        return max(0.0, self._held[0].received + self._delay - now)

    def __len__(self) -> int:
        return len(self._held)
