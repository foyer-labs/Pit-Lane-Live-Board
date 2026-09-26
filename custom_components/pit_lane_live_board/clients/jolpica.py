"""Jolpica-F1: calendar, results and standings (SPEC §4.1).

Cached on disk: past seasons and settled rounds (their race ended two days ago)
for 30 days, since they only change when a result is corrected; the rest of the
current season for 10 minutes (the API's own max-age). Anything cached before a
season ended is refreshed once it has. When the API fails or our budget is spent, a
stale cached answer is better than none.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime
import logging
from typing import Any

import aiohttp

from ..cache import DiskCache
from ..const import JOLPICA_BASE, USER_AGENT
from ..core.jolpica_parse import page_info
from .http import BudgetExhausted, Executor, InFlight, RateLimiter, SourceError

_LOGGER = logging.getLogger(__name__)

CURRENT_MAX_AGE = 10 * 60
PAST_MAX_AGE = 30 * 24 * 3600
SEASONS_MAX_AGE = 24 * 3600
PAGE = 100
TIMEOUT = aiohttp.ClientTimeout(total=20)


class JolpicaClient:
    def __init__(
        self, session: aiohttp.ClientSession, cache: DiskCache, run: Executor
    ) -> None:
        self._session = session
        self._cache = cache
        self._run = run
        self.limiter = RateLimiter(per_second=2, per_hour=200)
        self._inflight = InFlight()
        self.last_error: str | None = None
        # Set by the hub: whether a round of the current season is settled.
        self.settled: Callable[[int, int], bool] = lambda _season, _round: False

    def max_age(self, season: int | None, rnd: int | None = None) -> float:
        now = datetime.now(UTC)
        if season is None:
            return SEASONS_MAX_AGE
        if season < now.year:
            # Written before the season ended? Then it may miss its last rounds.
            since = (now - datetime(season + 1, 1, 1, tzinfo=UTC)).total_seconds()
            return min(PAST_MAX_AGE, since)
        if rnd is not None and self.settled(season, rnd):
            return PAST_MAX_AGE
        return CURRENT_MAX_AGE

    async def get(
        self,
        path: str,
        *,
        season: int | None,
        rnd: int | None = None,
        offset: int = 0,
        fresh: bool = False,
        priority: bool = False,
    ) -> Any:
        """`path` like `2026/14/results`; returns the parsed JSON."""
        return await self._inflight.run(
            f"{path}?{offset}&{fresh}",
            lambda: self._get(
                path=path,
                season=season,
                rnd=rnd,
                offset=offset,
                fresh=fresh,
                priority=priority,
            ),
        )

    async def _get(
        self,
        *,
        path: str,
        season: int | None,
        rnd: int | None,
        offset: int,
        fresh: bool,
        priority: bool,
    ) -> Any:
        key = f"jolpica/{path}?offset={offset}"
        if not fresh:
            cached = await self._run(
                self._cache.read_json, key, self.max_age(season, rnd)
            )
            if cached is not None:
                return cached
        try:
            payload = await self._fetch(path, offset, priority)
        except SourceError as err:
            stale = await self._run(self._cache.read_json, key, None)
            if stale is not None:
                _LOGGER.debug("Jolpica %s failed (%s); serving the cache", path, err)
                return stale
            raise
        await self._run(self._cache.write_json, key, payload)
        return payload

    async def _fetch(self, path: str, offset: int, priority: bool) -> Any:
        try:
            await self.limiter.acquire(priority)
        except BudgetExhausted:
            self.last_error = "budget"
            raise
        url = f"{JOLPICA_BASE}{path}.json"
        try:
            async with self._session.get(
                url,
                params={"limit": str(PAGE), "offset": str(offset)},
                headers={"User-Agent": USER_AGENT},
                timeout=TIMEOUT,
            ) as response:
                if response.status != 200:
                    self.last_error = f"http {response.status}"
                    raise SourceError(f"Jolpica answered {response.status} for {path}")
                payload = await response.json(content_type=None)
        except (aiohttp.ClientError, TimeoutError, ValueError) as err:
            self.last_error = type(err).__name__
            raise SourceError(f"Jolpica unreachable for {path}: {err}") from err
        self.last_error = None
        return payload

    async def get_all(
        self, path: str, *, season: int, rnd: int | None = None
    ) -> list[Any]:
        """Every page of a paginated resource (laps run to ~1,200 rows a race)."""
        first = await self.get(path, season=season, rnd=rnd)
        pages = [first]
        total, limit, _ = page_info(first)
        offset = limit or PAGE
        while offset < total:
            pages.append(await self.get(path, season=season, rnd=rnd, offset=offset))
            offset += limit or PAGE
        return pages

    # The resources the pages use.

    async def seasons(self) -> Any:
        return await self.get("seasons", season=None)

    async def schedule(self, season: int, *, fresh: bool = False) -> Any:
        return await self.get(str(season), season=season, fresh=fresh, priority=True)

    async def winners(self, season: int) -> Any:
        return await self.get(f"{season}/results/1", season=season)

    async def results(self, season: int, rnd: int) -> Any:
        return await self.get(f"{season}/{rnd}/results", season=season, rnd=rnd)

    async def qualifying(self, season: int, rnd: int) -> Any:
        return await self.get(f"{season}/{rnd}/qualifying", season=season, rnd=rnd)

    async def sprint(self, season: int, rnd: int) -> Any:
        return await self.get(f"{season}/{rnd}/sprint", season=season, rnd=rnd)

    async def pitstops(self, season: int, rnd: int) -> Any:
        return await self.get(f"{season}/{rnd}/pitstops", season=season, rnd=rnd)

    async def laps(self, season: int, rnd: int) -> list[Any]:
        return await self.get_all(f"{season}/{rnd}/laps", season=season, rnd=rnd)

    async def standings(self, season: int, rnd: int | None, kind: str) -> Any:
        """`kind` is `driver` or `constructor`; `rnd` None is the latest."""
        where = f"{season}/{rnd}" if rnd else str(season)
        return await self.get(f"{where}/{kind}standings", season=season, rnd=rnd)
