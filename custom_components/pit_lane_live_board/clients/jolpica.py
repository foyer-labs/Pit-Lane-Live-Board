"""Jolpica-F1: calendar, results and standings (SPEC §4.1).

Cached on disk: past seasons for 30 days (they only change when a result is
corrected), the current season for 10 minutes (the API's own max-age). When the
API fails or our budget is spent, a stale cached answer is better than none.
"""

from __future__ import annotations

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

    @staticmethod
    def max_age(season: int | None) -> float:
        if season is not None and season < datetime.now(UTC).year:
            return PAST_MAX_AGE
        return CURRENT_MAX_AGE

    async def get(
        self, path: str, *, season: int | None, offset: int = 0, fresh: bool = False
    ) -> Any:
        """`path` like `2026/14/results`; returns the parsed JSON."""
        return await self._inflight.run(
            f"{path}?{offset}&{fresh}", lambda: self._get(path, season, offset, fresh)
        )

    async def _get(
        self, path: str, season: int | None, offset: int, fresh: bool
    ) -> Any:
        key = f"jolpica/{path}?offset={offset}"
        if not fresh:
            cached = await self._run(self._cache.read_json, key, self.max_age(season))
            if cached is not None:
                return cached
        try:
            payload = await self._fetch(path, offset)
        except SourceError as err:
            stale = await self._run(self._cache.read_json, key, None)
            if stale is not None:
                _LOGGER.debug("Jolpica %s failed (%s); serving the cache", path, err)
                return stale
            raise
        await self._run(self._cache.write_json, key, payload)
        return payload

    async def _fetch(self, path: str, offset: int) -> Any:
        try:
            await self.limiter.acquire()
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

    async def get_all(self, path: str, *, season: int | None) -> list[Any]:
        """Every page of a paginated resource (laps run to ~1,200 rows a race)."""
        first = await self.get(path, season=season)
        pages = [first]
        total, limit, _ = page_info(first)
        offset = limit or PAGE
        while offset < total:
            pages.append(await self.get(path, season=season, offset=offset))
            offset += limit or PAGE
        return pages

    # The resources the pages use.

    async def seasons(self) -> Any:
        return await self.get("seasons", season=None)

    async def schedule(self, season: int, *, fresh: bool = False) -> Any:
        return await self.get(str(season), season=season, fresh=fresh)

    async def winners(self, season: int) -> Any:
        return await self.get(f"{season}/results/1", season=season)

    async def results(self, season: int, rnd: int) -> Any:
        return await self.get(f"{season}/{rnd}/results", season=season)

    async def qualifying(self, season: int, rnd: int) -> Any:
        return await self.get(f"{season}/{rnd}/qualifying", season=season)

    async def sprint(self, season: int, rnd: int) -> Any:
        return await self.get(f"{season}/{rnd}/sprint", season=season)

    async def pitstops(self, season: int, rnd: int) -> Any:
        return await self.get(f"{season}/{rnd}/pitstops", season=season)

    async def laps(self, season: int, rnd: int) -> list[Any]:
        return await self.get_all(f"{season}/{rnd}/laps", season=season)

    async def standings(self, season: int, rnd: int | None, kind: str) -> Any:
        """`kind` is `driver` or `constructor`; `rnd` None is the latest."""
        where = f"{season}/{rnd}" if rnd else str(season)
        return await self.get(f"{where}/{kind}standings", season=season)
