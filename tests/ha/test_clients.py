"""The source clients (SPEC §4): caching, fallbacks, the wire formats."""

from __future__ import annotations

import base64
from datetime import UTC, datetime, timedelta
import json
from pathlib import Path

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
import pytest

from custom_components.pit_lane_live_board.cache import DiskCache
from custom_components.pit_lane_live_board.clients.archive import ArchiveClient
from custom_components.pit_lane_live_board.clients.f1tv import (
    RETRIEVE_SUBSCRIBER,
    RenewalOutcome,
    renew,
)
from custom_components.pit_lane_live_board.clients.http import SourceError
from custom_components.pit_lane_live_board.clients.jolpica import JolpicaClient
from custom_components.pit_lane_live_board.clients.livetiming import (
    LiveTimingClient,
    records,
)
from custom_components.pit_lane_live_board.const import (
    ARCHIVE_BASE,
    JOLPICA_BASE,
    USER_AGENT,
)
from custom_components.pit_lane_live_board.core.archive_parse import encode_z
from custom_components.pit_lane_live_board.core.schedule import parse_schedule

from .conftest import schedule_payload


@pytest.fixture
def cache(tmp_path: Path) -> DiskCache:
    return DiskCache(tmp_path / "cache")


def jolpica(hass: HomeAssistant, cache: DiskCache) -> JolpicaClient:
    return JolpicaClient(
        async_get_clientsession(hass), cache, hass.async_add_executor_job
    )


async def test_jolpica_caches_and_identifies_itself(hass, aioclient_mock, cache):
    url = f"{JOLPICA_BASE}2026/14/results.json"
    aioclient_mock.get(url, json={"MRData": {"x": 1}})
    client = jolpica(hass, cache)
    assert await client.results(2026, 14) == {"MRData": {"x": 1}}
    assert await client.results(2026, 14) == {"MRData": {"x": 1}}
    assert aioclient_mock.call_count == 1
    _, _, _, headers = aioclient_mock.mock_calls[0]
    assert headers["User-Agent"] == USER_AGENT


async def test_jolpica_serves_stale_cache_when_down(hass, aioclient_mock, cache):
    client = jolpica(hass, cache)
    await hass.async_add_executor_job(
        cache.write_json, "jolpica/2026/1/results?offset=0", {"old": True}
    )
    aioclient_mock.get(f"{JOLPICA_BASE}2026/1/results.json", status=503)
    assert await client.get("2026/1/results", season=2026, fresh=True) == {"old": True}
    assert client.last_error == "http 503"


async def test_jolpica_fails_loudly_with_nothing_cached(hass, aioclient_mock, cache):
    aioclient_mock.get(f"{JOLPICA_BASE}2026/1/results.json", status=500)
    with pytest.raises(SourceError):
        await jolpica(hass, cache).results(2026, 1)


async def test_jolpica_pages(hass, aioclient_mock, cache):
    url = f"{JOLPICA_BASE}2026/1/laps.json"
    aioclient_mock.get(
        url,
        params={"limit": "100", "offset": "0"},
        json={"MRData": {"total": "150", "limit": "100", "offset": "0"}},
    )
    aioclient_mock.get(
        url,
        params={"limit": "100", "offset": "100"},
        json={"MRData": {"total": "150", "limit": "100", "offset": "100"}},
    )
    pages = await jolpica(hass, cache).laps(2026, 1)
    assert [p["MRData"]["offset"] for p in pages] == ["0", "100"]


def stream(*payloads) -> bytes:
    lines = [f"00:00:{i:02d}.000{json.dumps(p)}" for i, p in enumerate(payloads)]
    return ("﻿" + "\r\n".join(lines)).encode()


async def test_archive_detail_is_derived_and_cached(hass, aioclient_mock, cache):
    start = datetime(2026, 5, 10, 13, tzinfo=UTC)
    meetings = parse_schedule(schedule_payload(start))
    race = meetings[0].race
    path = "2026/2026-05-10_Test/2026-05-10_Race/"
    aioclient_mock.get(
        f"{ARCHIVE_BASE}2026/Index.json",
        text="﻿"
        + json.dumps(
            {
                "Meetings": [
                    {
                        "Name": "Test",
                        "Circuit": {"Key": 9},
                        "Sessions": [
                            {
                                "Type": "Race",
                                "Name": "Race",
                                "StartDate": "2026-05-10T15:00:00",
                                "GmtOffset": "02:00:00",
                                "Path": path,
                            }
                        ],
                    }
                ]
            }
        ),
    )
    aioclient_mock.get(
        f"{ARCHIVE_BASE}{path}Index.json",
        json={"Feeds": {"TimingData": {}, "DriverList": {}}},
    )
    aioclient_mock.get(
        f"{ARCHIVE_BASE}{path}TimingData.jsonStream",
        content=stream(
            {"Lines": {"4": {"NumberOfLaps": 1}}},
            {"Lines": {"4": {"NumberOfLaps": 2, "LastLapTime": {"Value": "1:30.000"}}}},
        ),
    )
    aioclient_mock.get(
        f"{ARCHIVE_BASE}{path}DriverList.json", json={"4": {"Tla": "NOR"}}
    )
    aioclient_mock.get(f"{ARCHIVE_BASE}{path}TimingAppData.json", status=403)
    client = ArchiveClient(
        async_get_clientsession(hass), cache, hass.async_add_executor_job
    )

    detail = await client.detail(meetings, race)

    assert detail["session_path"] == path
    assert [lap["time"] for lap in detail["laps"]["4"]] == [None, "1:30.000"]
    assert detail["drivers"]["4"]["tla"] == "NOR"
    assert detail["stints"] == {}  # TimingAppData is not in this session's index
    calls = aioclient_mock.call_count
    assert await client.detail(meetings, race) == detail
    assert aioclient_mock.call_count == calls
    # Raw streams are thrown away once derived.
    assert not list(cache.root.glob("*.raw"))


async def test_archive_has_no_detail_before_2018(hass, aioclient_mock, cache):
    meetings = parse_schedule(schedule_payload(datetime(2010, 5, 10, 13, tzinfo=UTC)))
    client = ArchiveClient(
        async_get_clientsession(hass), cache, hass.async_add_executor_job
    )
    assert await client.detail(meetings, meetings[0].race) is None
    assert aioclient_mock.call_count == 0


async def test_archive_outline(hass, aioclient_mock, cache):
    import math

    path = "2025/2025-05-11_Test/2025-05-11_Race/"
    aioclient_mock.get(f"{ARCHIVE_BASE}2026/Index.json", json={"Meetings": []})
    for year in (2024, 2023, 2022):
        aioclient_mock.get(f"{ARCHIVE_BASE}{year}/Index.json", status=403)
    aioclient_mock.get(
        f"{ARCHIVE_BASE}2025/Index.json",
        json={
            "Meetings": [
                {
                    "Circuit": {"Key": 99},
                    "Sessions": [
                        {
                            "Type": "Race",
                            "StartDate": "2025-05-11T15:00:00",
                            "GmtOffset": "02:00:00",
                            "Path": path,
                        }
                    ],
                }
            ]
        },
    )
    samples = []
    for i in range(1200):
        t = 2 * math.pi * i / 400
        samples.append(
            {
                "Position": [
                    {
                        "Entries": {
                            "4": {
                                "Status": "OnTrack",
                                "X": 8000 * math.cos(t),
                                "Y": 3000 * math.sin(t),
                            }
                        }
                    }
                ]
            }
        )
    lines = [
        f"00:00:{i % 60:02d}.{i // 60:03d}{json.dumps(encode_z(s))}"
        for i, s in enumerate(samples)
    ]
    aioclient_mock.get(
        f"{ARCHIVE_BASE}{path}Position.z.jsonStream", content="\n".join(lines).encode()
    )
    client = ArchiveClient(
        async_get_clientsession(hass), cache, hass.async_add_executor_job
    )
    outline = await client.outline(99, datetime(2026, 5, 10, tzinfo=UTC))
    assert outline is not None and len(outline.points) == 300
    assert await client.outline(1, datetime(2026, 5, 10, tzinfo=UTC)) is None


def token(**claims) -> str:
    part = base64.urlsafe_b64encode(json.dumps(claims).encode()).decode().rstrip("=")
    return f"eyJhbGciOiJSUzI1NiJ9.{part}.sig"


async def test_f1tv_renewal(hass, aioclient_mock):
    now = datetime.now(UTC)
    old = token(exp=int((now + timedelta(hours=10)).timestamp()), SessionId="s-1")
    new = token(exp=int((now + timedelta(days=4)).timestamp()), SessionId="s-1")
    aioclient_mock.post(RETRIEVE_SUBSCRIBER, json={"data": {"subscriptionToken": new}})
    outcome, value = await renew(async_get_clientsession(hass), old, now)
    assert (outcome, value) == (RenewalOutcome.RENEWED, new)
    _, _, _, headers = aioclient_mock.mock_calls[0]
    assert headers["cd-sessionid"] == "s-1"


async def test_f1tv_renewal_refused_or_down(hass, aioclient_mock):
    now = datetime.now(UTC)
    old = token(exp=int((now + timedelta(hours=10)).timestamp()), SessionId="s-1")
    aioclient_mock.post(RETRIEVE_SUBSCRIBER, status=401)
    assert (await renew(async_get_clientsession(hass), old, now))[
        0
    ] == RenewalOutcome.PAIRING
    aioclient_mock.clear_requests()
    aioclient_mock.post(RETRIEVE_SUBSCRIBER, status=502)
    assert (await renew(async_get_clientsession(hass), old, now))[
        0
    ] == RenewalOutcome.RETRY
    no_session = token(exp=int((now + timedelta(hours=10)).timestamp()))
    assert (await renew(async_get_clientsession(hass), no_session, now))[
        0
    ] == RenewalOutcome.PAIRING


def test_signalr_records_and_dispatch():
    frame = (
        '{"type":3,"invocationId":"0","result":{"LapCount":{"CurrentLap":1}}}\x1e'
        '{"type":1,"target":"feed","arguments":["LapCount",{"CurrentLap":2},"t"]}\x1e'
        "garbage\x1e"
        '{"type":6}\x1e'
    )
    assert [r.get("type") for r in records(frame)] == [3, 1, 6]
    keyframes, feed = [], []
    client = LiveTimingClient(
        None,
        "https://x/signalrcore",
        keyframes.append,
        lambda *a: feed.append(a),
        lambda: None,
    )
    for record in records(frame):
        assert client._handle(record) is False
    assert keyframes == [{"LapCount": {"CurrentLap": 1}}]
    assert feed == [("LapCount", {"CurrentLap": 2}, "t")]
    assert client.topics_seen == {"LapCount"}
    assert client._handle({"type": 7, "error": "bye"}) is True
    assert client.last_error == "bye"


def test_signalr_sends_the_token_only_when_there_is_one():
    client = LiveTimingClient(None, "https://x", print, print, lambda: None)
    assert "Authorization" not in client._headers()
    client = LiveTimingClient(None, "https://x", print, print, lambda: "abc")
    assert client._headers()["Authorization"] == "Bearer abc"


async def test_an_incomplete_archive_is_not_cached(hass, aioclient_mock, cache):
    start = datetime(2026, 5, 10, 13, tzinfo=UTC)
    meetings = parse_schedule(schedule_payload(start))
    path = "2026/2026-05-10_Test/2026-05-10_Race/"
    aioclient_mock.get(
        f"{ARCHIVE_BASE}2026/Index.json",
        json={
            "Meetings": [
                {
                    "Sessions": [
                        {
                            "Type": "Race",
                            "Name": "Race",
                            "StartDate": "2026-05-10T15:00:00",
                            "GmtOffset": "02:00:00",
                            "Path": path,
                        }
                    ]
                }
            ]
        },
    )
    aioclient_mock.get(
        f"{ARCHIVE_BASE}{path}Index.json", json={"Feeds": {"TimingData": {}}}
    )
    # Listed but not there yet: a half-uploaded batch.
    aioclient_mock.get(f"{ARCHIVE_BASE}{path}TimingData.jsonStream", status=403)
    client = ArchiveClient(
        async_get_clientsession(hass), cache, hass.async_add_executor_job
    )
    assert (await client.detail(meetings, meetings[0].race))["laps"] == {}
    assert not list(cache.root.glob("detail*"))


async def test_the_archive_not_published_yet(hass, aioclient_mock, cache):
    start = datetime(2026, 5, 10, 13, tzinfo=UTC)
    meetings = parse_schedule(schedule_payload(start))
    path = "2026/2026-05-10_Test/2026-05-10_Race/"
    aioclient_mock.get(
        f"{ARCHIVE_BASE}2026/Index.json",
        json={
            "Meetings": [
                {
                    "Sessions": [
                        {
                            "Type": "Race",
                            "Name": "Race",
                            "StartDate": "2026-05-10T15:00:00",
                            "GmtOffset": "02:00:00",
                            "Path": path,
                        }
                    ]
                }
            ]
        },
    )
    aioclient_mock.get(f"{ARCHIVE_BASE}{path}Index.json", status=403)
    client = ArchiveClient(
        async_get_clientsession(hass), cache, hass.async_add_executor_job
    )
    assert await client.detail(meetings, meetings[0].race) is None


def test_pings_are_not_data():
    client = LiveTimingClient(None, "https://x", print, print, lambda: None)
    client._handle({"type": 6})
    assert client.last_message is None
    client._handle({"type": 1, "target": "feed", "arguments": ["Heartbeat", {}, "t"]})
    assert client.last_message is not None
