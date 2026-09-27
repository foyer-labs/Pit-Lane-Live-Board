"""The archive client's limits and memory (SPEC §4.3, INV-4)."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
import json
import os
from pathlib import Path
import time
from unittest.mock import patch

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
import pytest

from custom_components.pit_lane_live_board import cache as cache_module
from custom_components.pit_lane_live_board.cache import DiskCache
from custom_components.pit_lane_live_board.clients import archive
from custom_components.pit_lane_live_board.clients.archive import (
    DETAIL_KEYFRAMES,
    DETAIL_STREAMS,
    ArchiveClient,
)
from custom_components.pit_lane_live_board.clients.http import SourceError
from custom_components.pit_lane_live_board.const import ARCHIVE_BASE
from custom_components.pit_lane_live_board.core.schedule import parse_schedule

from .conftest import schedule_payload

PATH = "2018/2018-04-08_Bahrain_Grand_Prix/2018-04-08_Race/"


@pytest.fixture
def cache(tmp_path: Path) -> DiskCache:
    return DiskCache(tmp_path / "cache")


def client(hass: HomeAssistant, cache: DiskCache) -> ArchiveClient:
    return ArchiveClient(
        async_get_clientsession(hass), cache, hass.async_add_executor_job
    )


def season_2018(aioclient_mock) -> list:
    aioclient_mock.get(
        f"{ARCHIVE_BASE}2018/Index.json",
        json={
            "Meetings": [
                {
                    "Sessions": [
                        {
                            "Type": "Race",
                            "StartDate": "2018-05-10T15:00:00",
                            "GmtOffset": "02:00:00",
                            "Path": PATH,
                        }
                    ]
                }
            ]
        },
    )
    return parse_schedule(schedule_payload(datetime(2018, 5, 10, 13, tzinfo=UTC)))


def stream(*payloads) -> bytes:
    lines = [f"00:00:{i:02d}.000{json.dumps(p)}" for i, p in enumerate(payloads)]
    return ("﻿" + "\r\n".join(lines)).encode()


async def test_a_past_session_without_an_index_is_read_by_file_names(
    hass, aioclient_mock, cache
):
    meetings = season_2018(aioclient_mock)
    aioclient_mock.get(f"{ARCHIVE_BASE}{PATH}Index.json", status=403)
    present = {
        "TimingData.jsonStream": {
            "content": stream(
                {
                    "Lines": {
                        "4": {"NumberOfLaps": 2, "LastLapTime": {"Value": "1:30.000"}}
                    }
                }
            )
        },
        "TimingAppData.json": {"json": {"Lines": {}}},
        "DriverList.json": {"json": {"4": {"Tla": "NOR"}}},
    }
    for name in DETAIL_STREAMS:
        aioclient_mock.get(
            f"{ARCHIVE_BASE}{PATH}{name}.jsonStream",
            **present.get(f"{name}.jsonStream", {"status": 403}),
        )
    for name in DETAIL_KEYFRAMES:
        aioclient_mock.get(
            f"{ARCHIVE_BASE}{PATH}{name}.json",
            **present.get(f"{name}.json", {"status": 403}),
        )
    archive_client = client(hass, cache)
    detail = await archive_client.detail(meetings, meetings[0].race)
    assert detail["drivers"]["4"]["tla"] == "NOR"
    calls = aioclient_mock.call_count
    assert await archive_client.detail(meetings, meetings[0].race) == detail
    assert aioclient_mock.call_count == calls
    assert list(cache.root.glob("detail_v2_*"))


async def test_a_missing_season_is_remembered(hass, aioclient_mock, cache):
    aioclient_mock.get(f"{ARCHIVE_BASE}2022/Index.json", status=403)
    archive_client = client(hass, cache)
    assert await archive_client.season_index(2022) is None
    assert await archive_client.season_index(2022) is None
    assert aioclient_mock.call_count == 1


async def test_a_hostile_index_is_no_match(hass, aioclient_mock, cache):
    aioclient_mock.get(f"{ARCHIVE_BASE}2018/Index.json", json=["not", "an", "index"])
    meetings = parse_schedule(schedule_payload(datetime(2018, 5, 10, 13, tzinfo=UTC)))
    archive_client = client(hass, cache)
    assert await archive_client.detail(meetings, meetings[0].race) is None
    assert await archive_client.outline(1, datetime(2018, 12, 1, tzinfo=UTC)) is None


async def test_a_file_past_the_cap_is_refused(hass, aioclient_mock, cache):
    aioclient_mock.get(f"{ARCHIVE_BASE}{PATH}big.json", content=b"x" * 5000)
    archive_client = client(hass, cache)
    with (
        patch.object(archive, "MAX_FILE_BYTES", 1000),
        pytest.raises(SourceError, match="too large"),
    ):
        await archive_client._download(f"{ARCHIVE_BASE}{PATH}big.json")
    assert archive_client.last_error == "too large"


async def test_at_most_two_sessions_are_built_at_once(hass, cache):
    archive_client = client(hass, cache)
    active = peak = 0
    release = asyncio.Event()

    async def index(_path, _recent):
        return {"Feeds": {"TimingData": {}}}

    async def files(_path, names):
        nonlocal active, peak
        active += 1
        peak = max(peak, active)
        await release.wait()
        active -= 1
        return dict.fromkeys(names)

    archive_client._session_index = index  # type: ignore[method-assign]
    archive_client._files = files  # type: ignore[method-assign]
    tasks = [
        asyncio.create_task(archive_client._detail(f"2019/s{i}/", False))
        for i in range(5)
    ]
    await asyncio.sleep(0.05)
    assert peak == 2
    release.set()
    await asyncio.gather(*tasks)
    assert peak == 2


async def test_old_formats_are_retired(hass, cache):
    client(hass, cache)
    for key in (
        f"detail/{PATH}",
        f"detail/v2/{PATH}",
        "outline/12",
        "path/2018-5-race",
    ):
        await hass.async_add_executor_job(cache.write_json, key, {})
    for p in cache.root.iterdir():
        then = time.time() - 60
        os.utime(p, (then, then))
    cache._tidied = time.monotonic() - cache_module.TIDY_EVERY - 1
    await hass.async_add_executor_job(cache.write_json, "trigger", {})
    names = sorted(p.name.split("-")[0] for p in cache.root.iterdir())
    assert names == ["detail_v2_2018_2018", "trigger"]
