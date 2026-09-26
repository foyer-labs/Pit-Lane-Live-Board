"""The hub's live pipeline (SPEC §6, §8, §9, §10.3, INV-2)."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
import json
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


async def test_paused_by_default_then_idle_outside_windows(hub):
    """Decision 42: nothing connects until someone presses play."""
    view = hub.live_view()
    assert view["state"] == "paused" and view["paused"] is True
    assert view["next_session"]["meeting"] == "Test Grand Prix"
    await hub.async_update_settings(hub.settings.with_live(True))
    assert hub.live_view()["state"] == "idle"
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
    hub.live.buffer._last_released = time.monotonic() - 40
    await settle(0.5)
    assert hub.live_view()["state"] == "stale"
    hub.live.buffer._last_released = time.monotonic() - 70
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
    assert hub.live is None  # paused: the window opens, nothing connects
    await hub.store.async_save(hub.settings.with_live(True))
    await hub._async_tick(now)
    assert hub.live is not None and hub.live.session.kind == "race"
    await hub._async_tick(now + timedelta(hours=8))
    assert hub.live is None


async def test_pause_closes_the_connection(hass: HomeAssistant, hub):
    now = datetime.now(UTC)
    from custom_components.pit_lane_live_board.core.schedule import parse_schedule

    hub.meetings = parse_schedule(schedule_payload(now + timedelta(minutes=10)))
    await hub.async_update_settings(hub.settings.with_live(True))
    await hub._async_tick(now)
    assert hub.live is not None
    await hub.async_update_settings(hub.settings.with_live(False))
    assert hub.live is None
    assert hub.store.failed_windows == 0  # a pause is not a failed window


async def test_auto_start_turns_live_timing_on_once_per_window(
    hass: HomeAssistant, hub
):
    now = datetime.now(UTC)
    from custom_components.pit_lane_live_board.core.schedule import parse_schedule

    hub.meetings = parse_schedule(schedule_payload(now + timedelta(minutes=10)))
    await hub.store.async_save(hub.settings.with_auto_start(True))
    await hub._async_tick(now)
    assert hub.settings.live is True and hub.live is not None
    # Paused by hand during the session: auto-start does not undo it.
    await hub.async_update_settings(hub.settings.with_live(False))
    await hub._async_tick(now)
    assert hub.settings.live is False and hub.live is None


async def test_failed_windows_raise_a_repair(hass: HomeAssistant, hub):
    now = datetime.now(UTC)
    from custom_components.pit_lane_live_board.core.schedule import parse_schedule

    hub.meetings = parse_schedule(schedule_payload(now + timedelta(minutes=10)))
    await hub.store.async_save(hub.settings.with_live(True))
    with patch.object(FakeClient, "run", new=lambda self: asyncio.Event().wait()):
        for _ in range(FAILED_WINDOWS_FOR_REPAIR):
            await hub._async_tick(now)
            await hub._async_stop_live(counts_as_window=True)
    assert ir.async_get(hass).async_get_issue(DOMAIN, ISSUE_LIVE) is not None


async def test_the_map_projects_positions_and_respects_no_spoiler(hub):
    from unittest.mock import AsyncMock

    from custom_components.pit_lane_live_board.core.archive_parse import encode_z
    from custom_components.pit_lane_live_board.core.outline import build_outline

    from ..core.test_outline import ellipse_laps

    outline = build_outline(ellipse_laps())
    hub.archive.outline = AsyncMock(return_value=outline)
    hub._live_token = lambda: "token"
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    await settle(0.1)
    client.keyframes(keyframes())
    _, x, y, _ = ellipse_laps()[50]
    client.feed(
        "Position.z",
        encode_z(
            {
                "Position": [
                    {
                        "Timestamp": "t",
                        "Entries": {"4": {"Status": "OnTrack", "X": x, "Y": y}},
                    }
                ]
            }
        ),
    )
    await settle()
    assert hub.archive.outline.await_args.args[0] == 99  # the circuit key
    view = json.loads(hub.map_payload(broadcast=False, full=True))
    assert view["full"] is True and view["outline"]["width"] == 1000.0
    (car,) = view["cars"]
    assert [car["x"], car["y"]] == list(outline.project(x, y))
    assert hub.live_view()["map_available"] is True
    # The outline travels once; then only the cars.
    json.loads(hub.map_payload(broadcast=True))
    assert "outline" not in json.loads(hub.map_payload(broadcast=True))
    await hub.async_update_settings(hub.settings.with_no_spoiler(True))
    hidden = json.loads(hub.map_payload(broadcast=False))
    assert hidden["outline"] is None and hidden["cars"] == []


async def test_a_reconnect_keeps_the_pit_log(hub):
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    client.keyframes(keyframes())
    client.feed(
        "PitLaneTimeCollection",
        {"PitTimes": {"4": {"RacingNumber": "4", "Lap": "12", "Duration": "22.0"}}},
    )
    await settle()
    client.keyframes(keyframes())  # the same session, after a reconnect
    await settle()
    assert hub.live_view()["pits"] == [{"number": "4", "lap": "12", "duration": "22.0"}]


async def test_events_withheld_by_no_spoiler_never_fire_late(hass: HomeAssistant, hub):
    fired: list[str] = []
    unsub = async_dispatcher_connect(hass, SIGNAL_EVENT, fired.append)
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    client.keyframes(keyframes(track="1"))
    await settle()
    await hub.async_update_settings(hub.settings.with_no_spoiler(True))
    client.feed("TrackStatus", {"Status": "5"})
    await settle()
    await hub.async_update_settings(hub.settings.with_no_spoiler(False))
    client.feed("LapCount", {"CurrentLap": 9})
    await settle()
    assert fired == []  # the red flag happened while hidden: it does not fire now
    client.feed("TrackStatus", {"Status": "1"})
    await settle()
    assert fired == ["green_flag"]
    unsub()


async def test_a_refused_token_leaves_everything_but_the_map(hass: HomeAssistant, hub):
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    client.on_refused()
    assert hub.f1tv.status == "invalid" and hub.f1tv.reason == "refused"
    assert hub._live_token() is None
    assert ir.async_get(hass).async_get_issue(DOMAIN, "f1tv_new_token") is not None
    assert hub.live_view()["map_reason"] == "token_problem"


async def test_the_page_says_how_old_its_data_is_while_quiet(hub):
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    client.keyframes(keyframes())
    await settle()
    hub.live.buffer._last_released = time.monotonic() - 40
    await settle(0.5)
    first = hub.live_view()["data_age"]
    await settle(1.2)
    assert hub.live_view()["data_age"] >= first + 1
