"""Stints placed by the pit stops (decision 61), on F1's own data from the 2026
Bahrain race, where the feed's stints were shifted, padded and miscounted."""

from __future__ import annotations

from custom_components.pit_lane_live_board.core import history, stints
from custom_components.pit_lane_live_board.core.timing import build_tower


def s(compound, total, start=0, new=True, best=None):
    entry = {
        "Compound": compound,
        "New": "true" if new else "false",
        "TotalLaps": total,
        "StartLaps": start,
    }
    if best:
        entry["LapTime"], entry["LapNumber"] = best
    return entry


# Leclerc at the flag: the first stint counted 0 laps (it had been 1, then 3),
# and every best lap sat one entry later than its stint.
LECLERC = [
    s("SOFT", 0),
    s("INTERMEDIATE", 6),
    s("SOFT", 19, best=("1:50.593", 6)),
    s("SOFT", 18, 3, new=False, best=("1:40.906", 31)),
    s("SOFT", 15, 3, new=False, best=("1:39.336", 54)),
]
# Piastri at the flag: the same shift, and a last phantom hard of one lap.
PIASTRI = [
    s("MEDIUM", 2),
    s("INTERMEDIATE", 7),
    s("HARD", 24, best=("2:44.744", 2)),
    s("HARD", 12, best=("1:50.656", 4)),
    s("MEDIUM", 12, 2, new=False, best=("1:42.616", 16)),
    s("HARD", 1),
]


def short(built):
    return [
        (
            x["compound"],
            x["from_lap"],
            x["to_lap"],
            x["best"]["lap"] if x["best"] else None,
        )
        for x in built
    ]


def test_the_stops_place_leclercs_stints():
    built = stints.build(LECLERC, [3, 9, 28, 43], 55)
    assert short(built) == [
        ("soft", 1, 3, None),
        ("intermediate", 4, 9, 6),  # the 1:50.593 was set on the inters
        ("soft", 10, 28, None),  # its best was overwritten by F1: none, not a wrong one
        ("soft", 29, 43, 31),
        ("soft", 44, 55, 54),
    ]
    assert sum(x["laps"] for x in built) == 55
    assert built[-1]["start_age"] == 3 and built[-1]["new"] is False


def test_a_phantom_stint_is_dropped():
    built = stints.build(PIASTRI, [2, 9, 33, 45], 55)
    assert short(built) == [
        ("medium", 1, 2, 2),
        ("intermediate", 3, 9, 4),
        ("hard", 10, 33, 16),
        ("hard", 34, 45, None),
        ("medium", 46, 55, None),
    ]


def test_an_entry_left_behind_by_a_shift_is_dropped():
    """Piastri at lap 30: F1 shifted the list and left the old last entry."""
    shifted = [
        s("MEDIUM", 2),
        s("MEDIUM", 2),
        s("INTERMEDIATE", 7, best=("2:44.744", 2)),
        s("HARD", 20, best=("1:50.656", 4)),
        s("HARD", 19, best=("1:42.616", 16)),
    ]
    assert short(stints.build(shifted, [2, 9], 30)) == [
        ("medium", 1, 2, 2),
        ("intermediate", 3, 9, 4),
        ("hard", 10, 30, 16),
    ]


def test_a_stop_that_changed_no_tyre_is_not_a_stint():
    """A drive-through is a stop in the pit lane log, not a new set."""
    built = stints.build([s("MEDIUM", 20), s("HARD", 30)], [12, 20], 50)
    assert short(built) == [("medium", 1, 20, None), ("hard", 21, 50, None)]


def test_stops_not_seen_count_back_from_the_current_lap():
    """Joined at lap 40: only the last stop is in the log."""
    built = stints.build(
        [s("MEDIUM", 2), s("INTERMEDIATE", 7), s("HARD", 24), s("HARD", 12)], [33], 45
    )
    assert short(built) == [
        ("medium", 1, 2, None),
        ("intermediate", 3, 9, None),
        ("hard", 10, 33, None),
        ("hard", 34, 45, None),
    ]


def test_without_any_stop_the_counts_follow_one_another():
    built = stints.build([s("SOFT", 5), s("SOFT", 4, new=False, start=2)], [], None)
    assert short(built) == [("soft", 1, 5, None), ("soft", 6, 7, None)]


def test_the_unknown_tyre_of_a_stop_in_progress_is_not_a_stint():
    built = stints.build([s("SOFT", 10), s("UNKNOWN", 0)], [10], 10)
    assert short(built) == [("soft", 1, 10, None)]


def test_a_stint_just_started_has_no_lap_yet():
    built = stints.build([s("SOFT", 10), s("HARD", 0)], [10], 10)
    assert built[-1]["from_lap"] == 11 and built[-1]["to_lap"] is None
    assert built[-1]["laps"] == 0


def test_the_tower_reads_the_tyre_from_the_placed_stints():
    topics = {
        "TimingData": {"Lines": {"81": {"Position": "6", "NumberOfLaps": 55}}},
        "TimingAppData": {"Lines": {"81": {"Stints": PIASTRI}}},
        "DriverList": {"81": {"Tla": "PIA"}},
        "SessionInfo": {"Type": "Race", "Name": "Race"},
    }
    row = build_tower(topics, {"81": [2, 9, 33, 45]})[0]
    # The used medium of the last stint, not F1's phantom hard.
    assert row["tyre"] == {"compound": "medium", "new": False, "age": 12, "stint": 5}
    assert "start_age" not in row["stints"][0]


def test_the_strategy_tab_uses_the_stops_too():
    strategy = history.stints(
        {"Lines": {"16": {"Stints": LECLERC}}}, {"16": [3, 9, 28, 43]}, {"16": 55}
    )
    assert [(x["start_lap"], x["end_lap"]) for x in strategy["16"]] == [
        (1, 3),
        (4, 9),
        (10, 28),
        (29, 43),
        (44, 55),
    ]


def test_pit_laps_from_the_log():
    log = [
        {"number": "16", "lap": "3"},
        {"number": "81", "lap": "2"},
        {"number": "16", "lap": "9"},
    ]
    assert stints.pit_laps(log) == {"16": [3, 9], "81": [2]}
