"""Fixtures of the Home Assistant suite.

Run with the plugin enabled explicitly, so the pure suite never loads it:

    pytest -p pytest_homeassistant_custom_component tests/ha
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta
from typing import Any, ClassVar
from unittest.mock import patch

from homeassistant.core import HomeAssistant
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.pit_lane_live_board.const import DOMAIN, JOLPICA_BASE


@pytest.fixture(autouse=True)
def custom_integrations(enable_custom_integrations):
    """Home Assistant loads custom_components/ only when asked to."""
    return


@pytest.fixture(autouse=True)
def isolated_cache(tmp_path):
    """Each test gets its own disk cache: the test config directory is shared."""
    with patch(
        "custom_components.pit_lane_live_board.hub.CACHE_DIR", str(tmp_path / "cache")
    ):
        yield tmp_path / "cache"


def schedule_payload(race_start: datetime) -> dict[str, Any]:
    """A one-race season whose race starts at `race_start` (UTC)."""
    day = race_start.date().isoformat()
    time = race_start.strftime("%H:%M:%SZ")
    quali = race_start - timedelta(days=1)
    return {
        "MRData": {
            "total": "1",
            "limit": "100",
            "offset": "0",
            "RaceTable": {
                "season": str(race_start.year),
                "Races": [
                    {
                        "season": str(race_start.year),
                        "round": "1",
                        "raceName": "Test Grand Prix",
                        "Circuit": {
                            "circuitId": "test",
                            "circuitName": "Testring",
                            "Location": {"locality": "Town", "country": "Land"},
                        },
                        "date": day,
                        "time": time,
                        "Qualifying": {
                            "date": quali.date().isoformat(),
                            "time": quali.strftime("%H:%M:%SZ"),
                        },
                    }
                ],
            },
        }
    }


class FakeClient:
    """Stands in for LiveTimingClient: the test pushes keyframes and deltas."""

    instances: ClassVar[list[FakeClient]] = []

    def __init__(
        self, session, base_url, on_keyframes, on_feed, token, *, on_refused=None
    ) -> None:
        self.on_refused = on_refused
        self.base_url = base_url
        self.on_keyframes = on_keyframes
        self.on_feed = on_feed
        self.token = token
        self.connected = False
        self.authenticated = False
        self.last_message: float | None = None
        self.last_error: str | None = None
        self.topics_seen: set[str] = set()
        FakeClient.instances.append(self)

    async def run(self) -> None:
        import asyncio
        import time

        self.connected = True
        self.authenticated = self.token() is not None
        self.last_message = time.monotonic()
        await asyncio.Event().wait()

    def keyframes(self, value: dict[str, Any]) -> None:
        import time

        self.last_message = time.monotonic()
        self.on_keyframes(value)

    def feed(self, topic: str, delta: Any, utc: str | None = None) -> None:
        import time

        self.last_message = time.monotonic()
        self.on_feed(topic, delta, utc)


@pytest.fixture
def fake_client() -> type[FakeClient]:
    FakeClient.instances = []
    return FakeClient


@pytest.fixture
def race_start() -> datetime:
    """A race far in the future: no live window opens unless a test asks."""
    return datetime.now(UTC).replace(microsecond=0) + timedelta(days=30)


@pytest.fixture
async def loaded_entry(
    hass, aioclient_mock, race_start
) -> AsyncIterator[MockConfigEntry]:
    year = datetime.now(UTC).year
    aioclient_mock.get(f"{JOLPICA_BASE}{year}.json", json=schedule_payload(race_start))
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    yield entry
    await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()


HUB = "custom_components.pit_lane_live_board.hub.LiveTimingClient"


@pytest.fixture
async def hub(hass: HomeAssistant, aioclient_mock, race_start, fake_client):
    """A loaded entry's hub, with the fake live client."""
    aioclient_mock.get(
        f"{JOLPICA_BASE}{race_start.year}.json", json=schedule_payload(race_start)
    )
    with patch(HUB, FakeClient):
        entry = MockConfigEntry(domain=DOMAIN, data={})
        entry.add_to_hass(hass)
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        # The first tick runs in the background: let it finish, so it never
        # closes a session a test opens by hand.
        await entry.runtime_data.hub.first_tick
        yield entry.runtime_data.hub
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()
