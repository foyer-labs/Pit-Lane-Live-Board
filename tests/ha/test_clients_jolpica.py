"""Jolpica's cache ages, back-off, reserve and paging (SPEC §4.1, INV-4)."""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
import time

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
import pytest

from custom_components.pit_lane_live_board.cache import DiskCache
from custom_components.pit_lane_live_board.clients.http import (
    BackingOff,
    BudgetExhausted,
    SourceError,
)
from custom_components.pit_lane_live_board.clients.jolpica import JolpicaClient
from custom_components.pit_lane_live_board.const import JOLPICA_BASE

YEAR = datetime.now(UTC).year


@pytest.fixture
def cache(tmp_path: Path) -> DiskCache:
    return DiskCache(tmp_path / "cache")


def jolpica(hass: HomeAssistant, cache: DiskCache) -> JolpicaClient:
    return JolpicaClient(
        async_get_clientsession(hass), cache, hass.async_add_executor_job
    )


async def test_a_settled_round_ignores_what_was_cached_before(
    hass, aioclient_mock, cache
):
    client = jolpica(hass, cache)
    # Cached on Friday, before the race: an empty table.
    await hass.async_add_executor_job(
        cache.write_json, f"jolpica/{YEAR}/17/results?offset=0", {"Races": []}
    )
    aioclient_mock.get(f"{JOLPICA_BASE}{YEAR}/17/results.json", json={"Races": [1]})
    assert await client.results(YEAR, 17) == {"Races": []}  # not settled: 10 min
    client.settled = lambda season, rnd: (season, rnd) == (YEAR, 17)
    assert await client.results(YEAR, 17) == {"Races": [1]}
    assert await client.results(YEAR, 17) == {"Races": [1]}
    assert aioclient_mock.call_count == 1


async def test_a_settled_round_falls_back_to_the_earlier_copy_when_down(
    hass, aioclient_mock, cache
):
    client = jolpica(hass, cache)
    client.settled = lambda _season, _rnd: True
    await hass.async_add_executor_job(
        cache.write_json, f"jolpica/{YEAR}/3/results?offset=0", {"old": True}
    )
    aioclient_mock.get(f"{JOLPICA_BASE}{YEAR}/3/results.json", status=502)
    assert await client.results(YEAR, 3) == {"old": True}


async def test_429_backs_off_and_spends_nothing_meanwhile(hass, aioclient_mock, cache):
    client = jolpica(hass, cache)
    aioclient_mock.get(
        f"{JOLPICA_BASE}{YEAR}/1/results.json",
        status=429,
        headers={"Retry-After": "120"},
    )
    await hass.async_add_executor_job(
        cache.write_json, f"jolpica/{YEAR}/2/results?offset=0", {"stale": True}
    )
    with pytest.raises(SourceError):
        await client.results(YEAR, 1)
    budget = client.limiter.remaining()
    assert 110 < client.limiter.blocked_for() <= 120
    with pytest.raises(BackingOff):
        await client.results(YEAR, 1)
    assert await client.get(f"{YEAR}/2/results", season=YEAR, fresh=True) == {
        "stale": True
    }
    assert aioclient_mock.call_count == 1
    assert client.limiter.remaining() == budget
    assert client.last_error == "http 429"


async def test_a_429_without_retry_after_doubles_from_a_minute(
    hass, aioclient_mock, cache
):
    client = jolpica(hass, cache)
    client.limiter.back_off()
    assert 59 < client.limiter.blocked_for() <= 60
    client.limiter._blocked_until = 0
    client.limiter.back_off()
    assert 119 < client.limiter.blocked_for() <= 120
    client.limiter.succeeded()
    client.limiter._blocked_until = 0
    client.limiter.back_off(first=15, cap=300)
    assert client.limiter.blocked_for() <= 15


async def test_only_this_seasons_schedule_draws_on_the_reserve(
    hass, aioclient_mock, cache
):
    client = jolpica(hass, cache)
    # Spend everything but the reserve.
    client.limiter._hour.extend([time.monotonic()] * (200 - 20))
    aioclient_mock.get(f"{JOLPICA_BASE}{YEAR}.json", json={"now": 1})
    aioclient_mock.get(f"{JOLPICA_BASE}2019.json", json={"then": 1})
    with pytest.raises(BudgetExhausted):
        await client.schedule(2019)
    assert await client.schedule(YEAR) == {"now": 1}


async def test_paging_is_ours_not_the_payloads(hass, aioclient_mock, cache):
    url = f"{JOLPICA_BASE}2017/1/laps.json"
    for offset in (0, 100, 200):
        aioclient_mock.get(
            url,
            params={"limit": "100", "offset": str(offset)},
            json={"MRData": {"total": "250", "limit": "-5", "offset": str(offset)}},
        )
    pages = await jolpica(hass, cache).laps(2017, 1)
    assert len(pages) == 3


async def test_paging_stops_at_a_sane_number_of_pages(hass, aioclient_mock, cache):
    client = jolpica(hass, cache)
    calls: list[int] = []

    async def get(path, *, season, rnd=None, offset=0, **_):
        calls.append(offset)
        return {"MRData": {"total": "99999999", "limit": "100"}}

    client.get = get  # type: ignore[method-assign]
    await client.get_all("2017/1/laps", season=2017)
    assert len(calls) == 30


async def test_standings_past_one_page_are_joined(hass, aioclient_mock, cache):
    url = f"{JOLPICA_BASE}1952/driverstandings.json"

    def page(offset: int, count: int) -> dict:
        return {
            "MRData": {
                "total": "103",
                "limit": "100",
                "offset": str(offset),
                "StandingsTable": {
                    "season": "1952",
                    "StandingsLists": [
                        {
                            "season": "1952",
                            "DriverStandings": [
                                {"position": str(offset + i + 1)} for i in range(count)
                            ],
                        }
                    ],
                },
            }
        }

    aioclient_mock.get(url, params={"limit": "100", "offset": "0"}, json=page(0, 100))
    aioclient_mock.get(url, params={"limit": "100", "offset": "100"}, json=page(100, 3))
    joined = await jolpica(hass, cache).standings(1952, None, "driver")
    rows = joined["MRData"]["StandingsTable"]["StandingsLists"][0]["DriverStandings"]
    assert [r["position"] for r in rows] == [str(i) for i in range(1, 104)]
