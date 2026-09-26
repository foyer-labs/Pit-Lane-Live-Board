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


class InFlight:
    """Joins identical requests made at the same time into one (INV-4: five
    open pages cost the sources what one does)."""

    def __init__(self) -> None:
        self._running: dict[str, asyncio.Future[Any]] = {}

    async def run(self, key: str, make: Callable[[], Awaitable[Any]]) -> Any:
        if (running := self._running.get(key)) is not None:
            return await asyncio.shield(running)
        future: asyncio.Future[Any] = asyncio.get_running_loop().create_future()
        self._running[key] = future
        try:
            result = await make()
        except asyncio.CancelledError:
            future.cancel()
            raise
        except Exception as err:
            future.set_exception(err)
            # Retrieved here so a failure nobody else awaited is not reported as
            # an unhandled one.
            future.exception()
            raise
        else:
            future.set_result(result)
            return result
        finally:
            self._running.pop(key, None)


class RateLimiter:
    """A token bucket plus an hourly budget, both on our side of the wire.

    Jolpica allows bursts of 4 requests a second and 500 an hour, and says both
    will go down. We allow bursts of 3 refilled at 2 a second, and 200 an hour, of
    which the last `reserve` are kept for the calendar: browsing old seasons can
    never leave the live windows without a schedule (SPEC §4.1).
    """

    def __init__(
        self, per_second: float, per_hour: int, burst: int = 3, reserve: int = 20
    ) -> None:
        self._rate = per_second
        self._burst = float(burst)
        self._tokens = float(burst)
        self._refilled = time.monotonic()
        self._per_hour = per_hour
        self._reserve = reserve
        self._hour: deque[float] = deque()
        self._lock = asyncio.Lock()

    def remaining(self) -> int:
        self._forget()
        return self._per_hour - len(self._hour)

    def _forget(self) -> None:
        cutoff = time.monotonic() - 3600
        while self._hour and self._hour[0] < cutoff:
            self._hour.popleft()

    def _refill(self) -> None:
        now = time.monotonic()
        self._tokens = min(
            self._burst, self._tokens + (now - self._refilled) * self._rate
        )
        self._refilled = now

    async def acquire(self, priority: bool = False) -> None:
        async with self._lock:
            self._forget()
            left = self._per_hour - len(self._hour)
            if left <= 0 or (left <= self._reserve and not priority):
                raise BudgetExhausted
            self._refill()
            if self._tokens < 1:
                await asyncio.sleep((1 - self._tokens) / self._rate)
                self._refill()
            self._tokens -= 1
            self._hour.append(time.monotonic())
