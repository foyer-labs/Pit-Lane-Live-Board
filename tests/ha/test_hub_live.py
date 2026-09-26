"""The hub's live pipeline (SPEC §6, §8, §9, §10.3, INV-2)."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
import time
from unittest.mock import patch

from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.dispatcher import async_dispatcher_connect
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.pit_lane_live_board.const import DOMAIN, JOLPICA_BASE
from custom_components.pit_lane_live_board.hub import (
    FAILED_WINDOWS_FOR_REPAIR,
    ISSUE_LIVE,
    SIGNAL_EVENT,
)

from .conftest import FakeClient, schedule_payload

HUB = "custom_components.pit_lane_live_board.hub.LiveTimingClient"


def keyframes(track: str = "1") -> dict:
    return {
        "SessionInfo": {
            "Key": 9001,
            "Type": "Race",
            "Name": "Race",
            "Meeting": {"Name": "Test Grand Prix", "Circuit": {"Key": 99}},
            "Path": "2026/test/race/",
        },
        "SessionStatus": {"Status": "Started"},
        "TrackStatus": {"Status": track},
        "LapCount": {"CurrentLap": 3, "TotalLaps": 50},
        "DriverList": {"4": {"Tla": "NOR"}, "16": {"Tla": "LEC"}},
        "TimingData": {"Lines": {"4": {"Position": "1"}, "16": {"Position": "2"}}},
    }


async def settle(seconds: float = 0.8) -> None:
    await asyncio.sleep(seconds)


@pytest.fixture
async def hub(hass: HomeAssistant, aioclient_mock, race_start, fake_client):
    aioclient_mock.get(
        f"{JOLPICA_BASE}{race_start.year}.json", json=schedule_payload(race_start)
    )
    with patch(HUB, FakeClient):
        entry = MockConfigEntry(domain=DOMAIN, data={})
        entry.add_to_hass(hass)
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        yield entry.runtime_data.hub
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()


async def test_idle_outside_windows(hub):
    view = hub.live_view()
    assert view["state"] == "idle"
    assert view["next_session"]["meeting"] == "Test Grand Prix"
    assert FakeClient.instances == []


async def test_keyframes_then_deltas_reach_the_view(hub):
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    assert hub.live_view()["state"] in ("connecting", "idle", "live")
    client.keyframes(keyframes())
    await settle()
    view = hub.live_view()
    assert view["state"] == "live"
    assert [row["tla"] for row in view["tower"]] == ["NOR", "LEC"]
    client.feed(
        "TimingData", {"Lines": {"4": {"Position": "2"}, "16": {"Position": "1"}}}
    )
    await settle()
    assert [row["tla"] for row in hub.live_view()["tower"]] == ["LEC", "NOR"]


async def test_the_tv_delay_holds_everything(hub):
    await hub.async_update_settings(hub.settings.with_delay(1))
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    client.keyframes(keyframes())
    await settle(0.5)
    # The first keyframes wait for the delay too: nothing from the future.
    assert hub.live_view()["state"] == "syncing"
    await settle(1.0)
    assert hub.live_view()["state"] == "live"
    client.feed("LapCount", {"CurrentLap": 4})
    await settle(0.5)
    assert hub.live_view()["header"]["lap"] == 3
    await settle(1.0)
    assert hub.live_view()["header"]["lap"] == 4


async def test_events_fire_once_per_transition(hass: HomeAssistant, hub):
    fired: list[str] = []
    unsub = async_dispatcher_connect(hass, SIGNAL_EVENT, fired.append)
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    client.keyframes(keyframes(track="1"))
    await settle()
    assert fired == []  # the first observation only records
    client.feed("TrackStatus", {"Status": "4", "Message": "SCDeployed"})
    await settle()
    client.feed("TimingData", {"Lines": {"4": {"GapToLeader": "+0.1"}}})
    await settle()
    assert fired == ["safety_car"]
    unsub()


async def test_no_spoiler_hides_the_view_and_mutes_events(hass: HomeAssistant, hub):
    fired: list[str] = []
    unsub = async_dispatcher_connect(hass, SIGNAL_EVENT, fired.append)
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    client.keyframes(keyframes())
    await settle()
    await hub.async_update_settings(hub.settings.with_no_spoiler(True))
    client.feed("TrackStatus", {"Status": "5", "Message": "Red"})
    await settle()
    view = hub.live_view()
    assert view["state"] == "hidden"
    assert "tower" not in view and "race_control" not in view
    assert view["header"] == {
        "meeting": "Test Grand Prix",
        "session": "Race",
        "kind": "race",
    }
    assert fired == []
    unsub()


async def test_a_silent_feed_is_never_shown_as_live(hub):
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    client.keyframes(keyframes())
    await settle()
    client.last_message = time.monotonic() - 40
    await settle(0.5)
    assert hub.live_view()["state"] == "stale"
    client.last_message = time.monotonic() - 70
    await settle(0.5)
    assert hub.live_view()["state"] == "lost"
    client.feed("LapCount", {"CurrentLap": 5})
    await settle(0.5)
    assert hub.live_view()["state"] == "live"


async def test_the_window_opens_and_closes(hass: HomeAssistant, hub):
    now = datetime.now(UTC)
    from custom_components.pit_lane_live_board.core.schedule import parse_schedule

    hub.meetings = parse_schedule(schedule_payload(now + timedelta(minutes=10)))
    await hub._async_tick(now)
    assert hub.live is not None and hub.live.session.kind == "race"
    await hub._async_tick(now + timedelta(hours=8))
    assert hub.live is None


async def test_failed_windows_raise_a_repair(hass: HomeAssistant, hub):
    now = datetime.now(UTC)
    from custom_components.pit_lane_live_board.core.schedule import parse_schedule

    hub.meetings = parse_schedule(schedule_payload(now + timedelta(minutes=10)))
    with patch.object(FakeClient, "run", new=lambda self: asyncio.Event().wait()):
        for _ in range(FAILED_WINDOWS_FOR_REPAIR):
            await hub._async_tick(now)
            await hub._async_stop_live()
    assert ir.async_get(hass).async_get_issue(DOMAIN, ISSUE_LIVE) is not None
