"""What every HTTP client shares: errors, the rate limiter and the executor hook."""

from __future__ import annotations

import asyncio
from collections import deque
from collections.abc import Awaitable, Callable
import time
from typing import Any

# Runs a blocking function in Home Assistant's executor.
type Executor = Callable[..., Awaitable[Any]]


class SourceError(Exception):
    """A source could not answer and nothing usable was cached."""


class BudgetExhausted(SourceError):
    """Our own request budget for the hour is spent (INV-4)."""


class RateLimiter:
    """A token bucket plus an hourly budget, both on our side of the wire.

    Jolpica allows 4 requests a second and 500 an hour, and says both will go
    down; we stay at half of each (SPEC §4.1).
    """

    def __init__(self, per_second: float, per_hour: int) -> None:
        self._interval = 1.0 / per_second
        self._per_hour = per_hour
        self._next = 0.0
        self._hour: deque[float] = deque()
        self._lock = asyncio.Lock()

    def remaining(self) -> int:
        self._forget()
        return self._per_hour - len(self._hour)

    def _forget(self) -> None:
        cutoff = time.monotonic() - 3600
        while self._hour and self._hour[0] < cutoff:
            self._hour.popleft()

    async def acquire(self) -> None:
        async with self._lock:
            self._forget()
            if len(self._hour) >= self._per_hour:
                raise BudgetExhausted
            now = time.monotonic()
            if self._next > now:
                await asyncio.sleep(self._next - now)
                now = time.monotonic()
            self._next = now + self._interval
            self._hour.append(now)
