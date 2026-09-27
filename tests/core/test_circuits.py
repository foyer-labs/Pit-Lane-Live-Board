"""Local time at the track (decision 50)."""

from __future__ import annotations

from zoneinfo import ZoneInfo

from custom_components.pit_lane_live_board.core.circuits import (
    CIRCUITS,
    COUNTRIES,
    circuit_timezone,
)


def test_every_name_is_a_real_time_zone():
    for name in [*CIRCUITS.values(), *COUNTRIES.values()]:
        ZoneInfo(name)


def test_circuit_first_then_a_single_zone_country_then_nothing():
    assert circuit_timezone("vegas", "USA") == "America/Los_Angeles"
    assert circuit_timezone("a_new_track", "Italy") == "Europe/Rome"
    # Several zones: better no hour than a wrong one.
    assert circuit_timezone("a_new_track", "USA") is None
    assert circuit_timezone(None, None) is None
