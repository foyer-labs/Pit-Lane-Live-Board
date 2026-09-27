"""The household settings (SPEC §8, §9, §11)."""

from __future__ import annotations

import pytest

from custom_components.pit_lane_live_board.core.settings import Settings, clamp_delay


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (0, 0),
        (35, 35),
        (35.6, 36),
        ("12", 12),
        (-5, 0),
        (500, 120),
        (None, 0),
        ("x", 0),
    ],
)
def test_delay_is_clamped_to_whole_seconds(value, expected):
    assert clamp_delay(value) == expected


def test_round_trip():
    settings = Settings().with_delay(42).with_no_spoiler(True).with_revealed("9876")
    assert Settings.from_dict(settings.to_dict()) == settings


def test_switching_no_spoiler_off_forgets_reveals():
    settings = (
        Settings().with_no_spoiler(True).with_revealed("1").with_no_spoiler(False)
    )
    assert settings.revealed == frozenset()


@pytest.mark.parametrize(
    "damaged",
    [None, [], "x", {"tv_delay": "lots", "no_spoiler": "yes", "revealed": "all"}],
)
def test_damaged_data_reads_as_defaults(damaged):
    settings = Settings.from_dict(damaged)
    assert settings.tv_delay == 0
    assert settings.no_spoiler is False
    assert settings.revealed == frozenset()


def test_reveals_keep_to_the_scope_and_are_capped():
    from custom_components.pit_lane_live_board.core.settings import MAX_REVEALED

    settings = Settings(no_spoiler=True).with_revealed("2026-1-race")
    moved = settings.with_revealed("2026-2-race", keep=frozenset({"2026-2-race"}))
    assert moved.revealed == frozenset({"2026-2-race"})
    for index in range(MAX_REVEALED + 5):
        settings = settings.with_revealed(f"x-{index}")
    assert len(settings.revealed) == MAX_REVEALED
    stored = {"revealed": [f"k{i}" for i in range(500)]}
    assert len(Settings.from_dict(stored).revealed) == MAX_REVEALED
