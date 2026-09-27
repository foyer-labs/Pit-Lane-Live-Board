"""Jolpica-F1: calendar, results and standings (SPEC §4.1).

Cached on disk: past seasons and settled rounds (their race ended two days ago)
for 30 days, since they only change when a result is corrected; the rest of the
current season for 10 minutes (the API's own max-age). Anything cached before a
season ended, or before a round settled, is refreshed once it has: a settled round
is kept under its own key, which only holds answers written after it settled. When
the API fails, asks us to wait (429), or our budget is spent, a stale cached answer
is better than none.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime
import logging
from typing import Any

import aiohttp

from ..cache import DiskCache
from ..const import JOLPICA_BASE, USER_AGENT
from ..core.circuit_history import row_count
from ..core.jolpica_parse import page_info
from .http import (
    BackingOff,
    BudgetExhausted,
    Executor,
    InFlight,
    RateLimiter,
    SourceError,
    retry_after,
)

_LOGGER = logging.getLogger(__name__)

CURRENT_MAX_AGE = 10 * 60
PAST_MAX_AGE = 30 * 24 * 3600
SEASONS_MAX_AGE = 24 * 3600
# A circuit's history across seasons (§7.3 circuit history): refreshed daily, when
# a race there this season may have added rows.
CIRCUIT_MAX_AGE = 24 * 3600
PAGE = 100
# Laps, the longest resource, run to ~1,200 rows (13 pages): more than this is a
# payload that lies about its total, not a race.
MAX_PAGES = 30
TIMEOUT = aiohttp.ClientTimeout(total=20)
# A failure short of a 429 (5xx, timeout) closes the limiter for less, and never
# for long: the source may be back in a minute.
FAILURE_BACK_OFF = 15.0
FAILURE_BACK_OFF_MAX = 300.0
SETTLED_PREFIX = "jolpica/settled/"


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
        # Settled answers are read only while their season is current.
        cache.expire(SETTLED_PREFIX, 2 * PAST_MAX_AGE)

    def _settled(self, season: int | None, rnd: int | None) -> bool:
        return (
            season is not None
            and rnd is not None
            and season >= datetime.now(UTC).year
            and self.settled(season, rnd)
        )

    def max_age(self, season: int | None, rnd: int | None = None) -> float:
        now = datetime.now(UTC)
        if season is None:
            return SEASONS_MAX_AGE
        if season < now.year:
            # Written before the season ended? Then it may miss its last rounds.
            since = (now - datetime(season + 1, 1, 1, tzinfo=UTC)).total_seconds()
            return min(PAST_MAX_AGE, since)
        if self._settled(season, rnd):
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
        max_age: float | None = None,
    ) -> Any:
        """`path` like `2026/14/results`; returns the parsed JSON. `max_age`
        overrides the age the season and round would give (resources that span
        seasons)."""
        return await self._inflight.run(
            f"{path}?{offset}&{fresh}",
            lambda: self._get(
                path=path,
                season=season,
                rnd=rnd,
                offset=offset,
                fresh=fresh,
                priority=priority,
                max_age=max_age,
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
        max_age: float | None = None,
    ) -> Any:
        key = f"jolpica/{path}?offset={offset}"
        # A settled round's answer lives under its own key, written only once the
        # round settled: what was cached before (empty on Friday, provisional
        # during the two days after the race) never passes for 30-day data.
        settled_key = f"{SETTLED_PREFIX}{path}?offset={offset}"
        settled = self._settled(season, rnd)
        write_key = settled_key if settled else key
        if not fresh:
            age = self.max_age(season, rnd) if max_age is None else max_age
            cached = await self._run(self._cache.read_json, write_key, age)
            if cached is not None:
                return cached
        try:
            payload = await self._fetch(path, offset, priority)
        except SourceError as err:
            for stale_key in (settled_key, key) if settled else (key,):
                stale = await self._run(self._cache.read_json, stale_key, None)
                if stale is not None:
                    _LOGGER.debug(
                        "Jolpica %s failed (%s); serving the cache", path, err
                    )
                    return stale
            raise
        await self._run(self._cache.write_json, write_key, payload)
        return payload

    async def _fetch(self, path: str, offset: int, priority: bool) -> Any:
        try:
            await self.limiter.acquire(priority)
        except BackingOff:
            # last_error keeps saying why we are waiting.
            raise
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
                    if response.status == 429:
                        self.limiter.back_off(retry_after(response.headers))
                    elif response.status >= 500:
                        self.limiter.back_off(
                            retry_after(response.headers),
                            first=FAILURE_BACK_OFF,
                            cap=FAILURE_BACK_OFF_MAX,
                        )
                    raise SourceError(f"Jolpica answered {response.status} for {path}")
                payload = await response.json(content_type=None)
        except (aiohttp.ClientError, TimeoutError) as err:
            self.last_error = type(err).__name__
            self.limiter.back_off(first=FAILURE_BACK_OFF, cap=FAILURE_BACK_OFF_MAX)
            raise SourceError(f"Jolpica unreachable for {path}: {err}") from err
        except ValueError as err:
            self.last_error = type(err).__name__
            raise SourceError(f"Jolpica unreadable for {path}: {err}") from err
        self.last_error = None
        self.limiter.succeeded()
        return payload

    async def get_all(
        self, path: str, *, season: int, rnd: int | None = None
    ) -> list[Any]:
        """Every page of a paginated resource (laps run to ~1,200 rows a race).

        The paging is ours, not the payload's: a limit outside 1-100 or a total
        past `MAX_PAGES` pages could otherwise walk the budget away.
        """
        first = await self.get(path, season=season, rnd=rnd)
        pages = [first]
        total, limit, _ = page_info(first)
        step = limit if 0 < limit <= PAGE else PAGE
        total = min(total, step * MAX_PAGES)
        offset = step
        while offset < total:
            pages.append(await self.get(path, season=season, rnd=rnd, offset=offset))
            offset += step
        return pages

    # The resources the pages use.

    async def seasons(self) -> Any:
        return await self.get("seasons", season=None)

    async def schedule(self, season: int, *, fresh: bool = False) -> Any:
        """The reserve is for the live windows: only this season's schedule (or
        the next one's, around New Year) may draw on it, never a past season
        someone is browsing."""
        year = datetime.now(UTC).year
        return await self.get(
            str(season), season=season, fresh=fresh, priority=year <= season <= year + 1
        )

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

    async def circuit(self, circuit_id: str, resource: str) -> list[Any]:
        """Every page of `/circuits/{id}/results` or `/qualifying`, every season.

        Rows come in date order, so only the last page gains rows (a race this
        season) and only the first carries the total that says a page was added:
        both are refreshed daily. The full pages in between are past races,
        cached like a past season; one cached while it was still the last,
        partial page is read again.
        """
        path = f"circuits/{circuit_id}/{resource}"
        key = "QualifyingResults" if resource == "qualifying" else "Results"
        first = await self.get(path, season=None, max_age=CIRCUIT_MAX_AGE)
        pages = [first]
        total, limit, _ = page_info(first)
        step = limit if 0 < limit <= PAGE else PAGE
        total = min(total, step * MAX_PAGES)
        offset = step
        while offset < total:
            last = offset + step >= total
            page = await self.get(
                path,
                season=None,
                offset=offset,
                max_age=CIRCUIT_MAX_AGE if last else PAST_MAX_AGE,
            )
            if not last and row_count(page, key) < step:
                page = await self.get(path, season=None, offset=offset, fresh=True)
            pages.append(page)
            offset += step
        return pages

    async def standings(self, season: int, rnd: int | None, kind: str) -> Any:
        """`kind` is `driver` or `constructor`; `rnd` None is the latest."""
        where = f"{season}/{rnd}" if rnd else str(season)
        pages = await self.get_all(f"{where}/{kind}standings", season=season, rnd=rnd)
        return _joined_standings(pages)


def _joined_standings(pages: list[Any]) -> Any:
    """One payload holding every page's rows (1952 has 103 drivers).

    Built anew: a payload may be shared with another request in flight.
    """
    first = pages[0]
    if len(pages) == 1:
        return first
    try:
        table = first["MRData"]["StandingsTable"]
        standing = dict(table["StandingsLists"][0])
        row_key = next(
            k for k in ("DriverStandings", "ConstructorStandings") if k in standing
        )
        rows = list(standing[row_key])
        for page in pages[1:]:
            more = page["MRData"]["StandingsTable"]["StandingsLists"][0].get(row_key)
            if isinstance(more, list):
                rows.extend(more)
    except (KeyError, IndexError, TypeError, AttributeError, StopIteration):
        return first
    standing[row_key] = rows
    return {
        **first,
        "MRData": {
            **first["MRData"],
            "StandingsTable": {**table, "StandingsLists": [standing]},
        },
    }
