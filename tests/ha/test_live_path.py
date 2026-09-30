"""The live path after the 0.8 review: the tower as row patches, one computation
of the sections per publish, robustness per message, the map only for its
listeners, the provisional projection, and what reaches the recorder and the disk
(SPEC §5.4, §5.5, §10.3, §11)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
import json
import time
from unittest.mock import AsyncMock, patch

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from custom_components.pit_lane_live_board import hub as hub_module
from custom_components.pit_lane_live_board.core.schedule import parse_schedule
from custom_components.pit_lane_live_board.hub import (
    SIGNAL_DISPLAY,
    listen_live,
    listen_map,
)

from .conftest import FakeClient, schedule_payload
from .test_hub_live import keyframes, settle


def _release(hub) -> None:
    """Apply what the buffer holds now, without publishing (no await in between,
    so the live loop cannot run)."""
    live = hub.live
    for item in live.buffer.release(time.monotonic()):
        hub._apply(live, item)


async def _live(hub, frames=None):
    await hub._async_start_live(None, None)
    client = FakeClient.instances[-1]
    client.keyframes(frames or keyframes())
    await settle()
    return client


async def test_the_tower_travels_as_row_patches(hass: HomeAssistant, hub):
    received: list[dict] = []
    unsub = listen_live(hass, lambda payload: received.append(json.loads(payload)))
    frames = keyframes()
    # Not running: no rejoin estimates, which follow every gap.
    frames["SessionStatus"] = {"Status": "Inactive"}
    client = await _live(hub, frames)
    full = [m for m in received if m.get("tower")]
    assert full and full[-1]["full"] is True
    assert [r["number"] for r in full[-1]["tower"]] == ["4", "16"]
    received.clear()
    client.feed("TimingData", {"Lines": {"16": {"GapToLeader": "+1.5"}}})
    await settle()
    (message,) = [m for m in received if "tower_patch" in m]
    assert message["full"] is False and "tower" not in message
    patch_ = message["tower_patch"]
    assert patch_["order"] == ["4", "16"]
    assert list(patch_["rows"]) == ["16"]  # only the row that changed
    assert patch_["rows"]["16"]["gap"] == "+1.5"
    assert patch_["rows"]["16"] == next(
        r for r in hub.live_view()["tower"] if r["number"] == "16"
    )  # a complete row, not a field diff
    received.clear()
    client.feed(
        "TimingData", {"Lines": {"4": {"Position": "2"}, "16": {"Position": "1"}}}
    )
    await settle()
    (message,) = [m for m in received if "tower_patch" in m]
    assert message["tower_patch"]["order"] == ["16", "4"]
    unsub()


async def test_a_new_page_never_misses_a_row_that_changed_back(
    hass: HomeAssistant, hub
):
    received: list[dict] = []
    unsub = listen_live(hass, lambda payload: received.append(json.loads(payload)))
    client = await _live(hub)
    live = hub.live
    # A page subscribes between two broadcasts and sees a row the others never
    # got; the row then returns to its broadcast value.
    client.feed("TimingData", {"Lines": {"16": {"GapToLeader": "+9.9"}}})
    _release(hub)
    page = hub.live_view()
    assert next(r for r in page["tower"] if r["number"] == "16")["gap"] == "+9.9"
    client.feed("TimingData", {"Lines": {"16": {"GapToLeader": None}}})
    _release(hub)
    received.clear()
    hub._send_view(full=False, parts=hub._view_parts())
    (message,) = received
    assert "16" in message["tower_patch"]["rows"]  # the new page is set right
    assert live is hub.live
    unsub()


async def test_a_reconnect_sends_the_tower_whole(hass: HomeAssistant, hub):
    received: list[dict] = []
    unsub = listen_live(hass, lambda payload: received.append(json.loads(payload)))
    client = await _live(hub)
    received.clear()
    client.keyframes(keyframes())
    await settle()
    assert received[-1]["full"] is True and len(received[-1]["tower"]) == 2
    unsub()


async def test_identical_views_are_not_sent_again(hass: HomeAssistant, hub):
    received: list[bytes] = []
    unsub = listen_live(hass, received.append)
    client = await _live(hub)
    await hub.async_update_settings(hub.settings.with_no_spoiler(True))
    await settle()
    count = len(received)
    for lap in range(4, 8):
        client.feed("LapCount", {"CurrentLap": lap})
        await settle(0.6)
    # Hidden: the feed runs, the page's view does not change.
    assert len(received) == count
    unsub()


async def test_one_bad_message_costs_only_itself(hass: HomeAssistant, hub):
    client = await _live(hub)
    original = hub._apply

    def flaky(live, item):
        if item[0] == "feed" and item[1] == "Boom":
            raise ValueError("an unexpected shape")
        original(live, item)

    hub._apply = flaky
    client.feed("Boom", {})
    client.feed("LapCount", {"CurrentLap": 7})
    await settle()
    assert hub.live_view()["header"]["lap"] == 7


async def test_a_failing_event_step_still_updates_the_page(hass: HomeAssistant, hub):
    received: list[dict] = []
    unsub = listen_live(hass, lambda payload: received.append(json.loads(payload)))
    client = await _live(hub)
    with patch.object(hub, "_fire_events", side_effect=RuntimeError("boom")):
        client.feed("LapCount", {"CurrentLap": 8})
        await settle()
    assert received[-1]["header"]["lap"] == 8
    unsub()


async def test_the_sections_are_computed_once_per_publish(hass: HomeAssistant, hub):
    await hub.async_update_settings(hub.settings.with_favourites(["LEC"]))
    unsub = listen_live(hass, lambda _payload: None)
    hub.display_enabled = True
    client = await _live(hub)
    builder = hub.live.builder
    with patch.object(builder, "sections", wraps=builder.sections) as sections:
        client.feed("LapCount", {"CurrentLap": 9})
        await settle(0.6)
    assert sections.call_count == 1
    unsub()


async def test_the_map_is_built_only_for_its_listeners(hass: HomeAssistant, hub):
    client = await _live(hub)
    frame = {
        "Position": [
            {"Timestamp": "t", "Entries": {"4": {"Status": "OnTrack", "X": 5, "Y": 6}}}
        ]
    }
    with patch.object(hub, "map_payload", wraps=hub.map_payload) as payload:
        client.feed("Position.z", frame)
        await settle()
        assert payload.call_count == 0
        received: list[bytes] = []
        unsub = listen_map(hass, received.append)
        client.feed("Position.z", frame)
        await settle()
        assert payload.call_count >= 1 and received
    unsub()


async def test_the_provisional_projection_widens(hass: HomeAssistant, hub):
    client = await _live(hub)

    def frame(*points):
        entries = {
            str(n): {"Status": "OnTrack", "X": x, "Y": y}
            for n, (x, y) in enumerate(points, 1)
        }
        return {"Position": [{"Timestamp": "t", "Entries": entries}]}

    with patch.object(hub_module, "PROVISIONAL_EVERY", 0.0):
        client.feed("Position.z", frame((0, 10), (100, 20)))  # on the grid
        await settle()
        first = hub.live.outline
        assert first is not None and not first.points
        client.feed("Position.z", frame((-5000, -3000), (6000, 4000)))  # racing
        await settle()
    wider = hub.live.outline
    assert wider.scale < first.scale
    assert 0 <= wider.project(6000, 4000)[0] <= wider.width
    assert 0 <= wider.project(-5000, -3000)[1] <= wider.height


async def test_driver_entities_leave_out_the_lap_by_lap_fields(
    hass: HomeAssistant, hub
):
    await hub.async_update_settings(hub.settings.with_favourites(["LEC"]))
    await _live(hub)
    driver = hub.entity_state["drivers"]["LEC"]
    assert driver["position"] == 2
    assert "laps" not in driver and "tyre_age" not in driver


async def test_live_entities_write_only_what_changed(hass: HomeAssistant, hub):
    await hub.async_update_settings(hub.settings.with_live(True))
    client = await _live(hub)
    await hass.async_block_till_done()
    lap = "sensor.pit_lane_live_board_lap"
    track = "sensor.pit_lane_live_board_track_status"
    before = {e: hass.states.get(e).last_reported for e in (lap, track)}
    client.feed("LapCount", {"CurrentLap": 12})
    await settle()
    await hass.async_block_till_done()
    assert hass.states.get(lap).state == "12"
    # The track status did not change: not even a `state_reported` write.
    assert hass.states.get(track).last_reported == before[track]
    assert hass.states.get(lap).last_reported != before[lap]


async def test_the_small_screen_writes_only_on_change(hass: HomeAssistant, hub):
    written: list[None] = []
    # A plain lambda would run in the executor, counted too late on a slow runner.
    unsub = async_dispatcher_connect(
        hass, SIGNAL_DISPLAY, callback(lambda: written.append(None))
    )
    hub.display_enabled = True
    hub._update_display()
    count = len(written)
    hub._display_at = 0.0  # due again, nothing changed
    hub._update_display()
    assert len(written) == count
    await hub.async_update_settings(hub.settings.with_live(True))
    # Paused → idle is a change (a slow runner may also see the tick's update,
    # which carries the same content and must not write again).
    assert hub.display["state"] == "idle" and len(written) >= count + 1
    settled = len(written)
    hub._display_at = 0.0
    hub._update_display()
    assert len(written) == settled
    unsub()


async def test_unchanged_settings_are_not_saved(hass: HomeAssistant, hub):
    with patch.object(hub.store, "async_save", AsyncMock()) as save:
        await hub.async_update_settings(hub.settings.with_delay(hub.settings.tv_delay))
        save.assert_not_awaited()
        await hub.async_update_settings(hub.settings.with_delay(5))
        save.assert_awaited_once()


async def test_a_window_seen_with_auto_start_off_is_not_written(
    hass: HomeAssistant, hub
):
    now = datetime.now(UTC)
    hub.meetings = parse_schedule(schedule_payload(now + timedelta(minutes=10)))
    with patch.object(hub.store, "async_save", AsyncMock()) as save:
        await hub._async_tick(now)
        save.assert_not_awaited()
    assert hub.store.auto_window == hub.meetings[0].race.key  # remembered in memory


async def test_an_open_page_gets_the_final_view_from_the_tick(hass: HomeAssistant, hub):
    now = datetime.now(UTC)
    hub.meetings = parse_schedule(schedule_payload(now - timedelta(hours=5)))
    hub.archive.final_state = AsyncMock(return_value=None)
    await hub._async_tick(now)
    hub.archive.final_state.assert_not_awaited()  # nobody is watching
    unsub = listen_live(hass, lambda _payload: None)
    await hub._async_tick(now)
    await hass.async_block_till_done()
    hub.archive.final_state.assert_awaited_once()
    # Not published yet: asked again only after a while (INV-4).
    await hub._async_tick(now)
    await hass.async_block_till_done()
    hub.archive.final_state.assert_awaited_once()
    unsub()


async def test_a_stopped_hub_does_nothing_on_its_tick(hass: HomeAssistant, hub):
    hub._stopped = True
    try:
        with (
            patch.object(hub, "_update_entities") as update,
            patch.object(hub, "release_summaries") as release,
        ):
            await hub._async_tick(datetime.now(UTC))
        update.assert_not_called()
        release.assert_not_called()
    finally:
        hub._stopped = False


async def test_marks_are_written_at_most_every_30_s(hass: HomeAssistant, hub):
    store = hub.store
    with patch.object(store._store, "async_delay_save") as delay:
        store.save_marks({"rcm_seen": 1})
        store.save_marks({"rcm_seen": 2})
        store.save_marks({"rcm_seen": 3})
        assert delay.call_count == 1  # armed once, not pushed back by each call
        data = delay.call_args.args[0]()
        assert data["marks"] == {"rcm_seen": 3}  # the latest, read at write time
        store.save_marks({"rcm_seen": 4})
        assert delay.call_count == 2
    with patch.object(store._store, "async_save", AsyncMock()) as save:
        await store.async_flush()
        save.assert_awaited_once()  # marks were waiting
        await store.async_flush()
        save.assert_awaited_once()  # nothing waiting: nothing written
