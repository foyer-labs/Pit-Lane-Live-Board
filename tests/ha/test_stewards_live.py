"""Flags, stewards and play/pause on the live path (SPEC §7.1.1, §10.2, §10.3,
decision 42), and the Live page after a session."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, patch

from homeassistant.const import STATE_OFF, STATE_ON, STATE_UNAVAILABLE
from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_connect
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.pit_lane_live_board.const import DOMAIN, JOLPICA_BASE
from custom_components.pit_lane_live_board.hub import SIGNAL_STEWARDS, listen_live

from .conftest import FakeClient, schedule_payload
from .test_hub_live import HUB, keyframes, settle

PENALTY = "FIA STEWARDS: 5 SECOND TIME PENALTY FOR CAR 4 (NOR) - CAUSING A COLLISION"
NOTED = (
    "TURN 4 INCIDENT INVOLVING CARS 16 (LEC) AND 4 (NOR) NOTED - CAUSING A COLLISION"
)


def rcm(text: str, **extra) -> dict:
    return {
        "Utc": "2026-05-10T13:30:00",
        "Lap": 7,
        "Category": "Other",
        "Message": text,
        **extra,
    }


def with_messages(*messages: dict, track: str = "1") -> dict:
    frames = keyframes(track=track)
    frames["RaceControlMessages"] = {"Messages": list(messages)}
    return frames


@pytest.fixture
async def entry(hass: HomeAssistant, aioclient_mock, race_start, fake_client):
    aioclient_mock.get(
        f"{JOLPICA_BASE}{race_start.year}.json", json=schedule_payload(race_start)
    )
    with patch(HUB, FakeClient):
        entry = MockConfigEntry(domain=DOMAIN, data={})
        entry.add_to_hass(hass)
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        hub = entry.runtime_data.hub
        await hub.async_update_settings(hub.settings.with_live(True))
        yield entry
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()


async def test_flag_entities_and_the_tower_badge(hass: HomeAssistant, entry):
    hub = entry.runtime_data.hub
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    client.keyframes(
        with_messages(
            rcm(NOTED),
            {
                "Category": "Flag",
                "Flag": "DOUBLE YELLOW",
                "Scope": "Sector",
                "Sector": 7,
                "Message": "DOUBLE YELLOW IN TRACK SECTOR 7",
            },
            track="4",
        )
    )
    await settle()
    await hass.async_block_till_done()
    assert (
        hass.states.get("binary_sensor.pit_lane_live_board_safety_car").state
        == STATE_ON
    )
    assert (
        hass.states.get("binary_sensor.pit_lane_live_board_red_flag").state == STATE_OFF
    )
    yellow = hass.states.get("binary_sensor.pit_lane_live_board_yellow_flag")
    assert yellow.state == STATE_ON
    assert yellow.attributes["sectors"] == [7] and yellow.attributes["double"] is True
    investigations = hass.states.get("sensor.pit_lane_live_board_investigations")
    assert investigations.state == "1"
    assert investigations.attributes["investigations"][0]["drivers"] == ["LEC", "NOR"]

    client.feed("RaceControlMessages", {"Messages": {"2": rcm(PENALTY)}})
    await settle()
    await hass.async_block_till_done()
    penalties = hass.states.get("sensor.pit_lane_live_board_penalties")
    assert penalties.state == "1"
    assert penalties.attributes["penalties"][0]["seconds"] == 5
    assert hass.states.get("sensor.pit_lane_live_board_investigations").state == "0"
    assert (
        hass.states.get("sensor.pit_lane_live_board_race_control_message").state
        == PENALTY
    )
    tower = {row["number"]: row for row in hub.live_view()["tower"]}
    assert tower["4"]["penalty"] == 5 and tower["16"]["penalty"] is None


async def test_stewards_events_fire_once_and_only_for_news(hass: HomeAssistant, entry):
    hub = entry.runtime_data.hub
    fired: list[dict] = []
    unsub = async_dispatcher_connect(hass, SIGNAL_STEWARDS, fired.append)
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    # Joined mid-session: what race control said before is the baseline.
    client.keyframes(with_messages(rcm(NOTED)))
    await settle()
    assert fired == []
    client.feed("RaceControlMessages", {"Messages": {"1": rcm(PENALTY)}})
    await settle()
    assert [d["kind"] for d in fired] == ["time_penalty"]
    # A reconnect replays every message: none fires again.
    client.keyframes(with_messages(rcm(NOTED), rcm(PENALTY)))
    await settle()
    assert len(fired) == 1
    await hass.async_block_till_done()
    state = hass.states.get("event.pit_lane_live_board_stewards")
    assert state.attributes["event_type"] == "time_penalty"
    assert state.attributes["drivers"] == ["NOR"] and state.attributes["seconds"] == 5
    unsub()


async def test_paused_means_unavailable_and_nothing_written(hass: HomeAssistant, entry):
    hub = entry.runtime_data.hub
    await hub.async_update_settings(hub.settings.with_live(False))
    await hass.async_block_till_done()
    for entity_id in (
        "binary_sensor.pit_lane_live_board_safety_car",
        "sensor.pit_lane_live_board_penalties",
        "event.pit_lane_live_board_stewards",
    ):
        assert hass.states.get(entity_id).state == STATE_UNAVAILABLE
    assert hub.live is None and hub.store.marks == {}


async def test_the_view_travels_as_sections_that_changed(hass: HomeAssistant, entry):
    hub = entry.runtime_data.hub
    received: list[dict] = []
    unsub = listen_live(hass, lambda payload: received.append(json.loads(payload)))
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    client.keyframes(keyframes())
    await settle()
    full = [m for m in received if m.get("state") == "live"]
    assert full[0]["full"] is True and "tower" in full[0] and "weather" in full[0]
    received.clear()
    client.feed("LapCount", {"CurrentLap": 4})
    await settle()
    delta = received[-1]
    assert delta["full"] is False and delta["header"]["lap"] == 4
    assert "tower" not in delta and "weather" not in delta
    unsub()


async def test_the_live_page_after_a_session_is_final(hass: HomeAssistant, entry):
    hub = entry.runtime_data.hub
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    client.keyframes(with_messages(rcm(PENALTY)))
    await settle()
    await hub._async_stop_live(counts_as_window=False)
    view = hub.live_view()
    assert view["state"] == "final" and view["ended"]
    assert [row["tla"] for row in view["tower"]] == ["NOR", "LEC"]
    assert view["stewards"]["penalties"][0]["cars"][0]["tla"] == "NOR"
    # No-spoiler hides it like the live session.
    await hub.async_update_settings(hub.settings.with_no_spoiler(True))
    assert hub.live_view()["state"] == "hidden"


async def test_the_final_view_comes_from_the_archive(hass: HomeAssistant, entry):
    from datetime import UTC, datetime, timedelta

    from custom_components.pit_lane_live_board.core.schedule import parse_schedule

    hub = entry.runtime_data.hub
    await hub.async_update_settings(hub.settings.with_live(False))
    hub.meetings = parse_schedule(
        schedule_payload(datetime.now(UTC) - timedelta(hours=5))
    )
    topics = with_messages(rcm(PENALTY))
    topics["SessionStatus"] = {"Status": "Finalised"}
    hub.archive.final_state = AsyncMock(
        return_value={"path": "p/", "topics": topics, "pit_stream": []}
    )
    hub.ensure_final()
    await hass.async_block_till_done()
    view = hub.live_view()
    assert view["state"] == "final" and view["paused"] is True
    assert view["header"]["status"] == "finalised"
    assert hub.archive.final_state.await_args.args[1].kind == "race"
