"""No-spoiler mode (SPEC §9)."""

from __future__ import annotations

from custom_components.pit_lane_live_board.core.settings import Settings
from custom_components.pit_lane_live_board.core.spoiler import (
    hidden_sessions,
    live_hidden,
    standings_round_cap,
)

from .test_schedule import MEETINGS, at

ON = Settings().with_no_spoiler(True)


def test_off_hides_nothing():
    assert hidden_sessions(Settings(), MEETINGS, at(10, 20)) == frozenset()
    assert standings_round_cap(Settings(), MEETINGS, at(10, 20)) is None
    assert live_hidden(Settings()) is False


def test_on_hides_the_latest_started_meeting():
    hidden = hidden_sessions(ON, MEETINGS, at(12, 0))
    assert hidden == {s.key for s in MEETINGS[0].sessions}
    assert live_hidden(ON) is True


def test_nothing_started_nothing_hidden():
    assert hidden_sessions(ON, MEETINGS, at(1, 0)) == frozenset()
    assert standings_round_cap(ON, MEETINGS, at(1, 0)) is None


def test_revealing_one_session_reveals_only_that():
    settings = ON.with_revealed("2026-1-qualifying")
    hidden = hidden_sessions(settings, MEETINGS, at(12, 0))
    assert "2026-1-qualifying" not in hidden
    assert "2026-1-race" in hidden


def test_standings_stop_before_the_hidden_race():
    assert standings_round_cap(ON, MEETINGS, at(12, 0)) == (2026, 0)
    assert standings_round_cap(ON, MEETINGS, at(16, 0)) == (2026, 1)


def test_revealing_the_race_lifts_the_cap():
    settings = ON.with_revealed("2026-1-race")
    assert standings_round_cap(settings, MEETINGS, at(12, 0)) is None


def test_a_hidden_sprint_also_caps():
    settings = ON.with_revealed("2026-2-race")
    assert standings_round_cap(settings, MEETINGS, at(18, 0)) == (2026, 1)
    settings = settings.with_revealed("2026-2-sprint")
    assert standings_round_cap(settings, MEETINGS, at(18, 0)) is None
