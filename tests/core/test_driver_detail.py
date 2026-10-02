"""Stints, mini-sectors, the pit rejoin estimate, the household's drivers and the
session summary (decisions 51-53)."""

from __future__ import annotations

from custom_components.pit_lane_live_board.core import favourites, strategy
from custom_components.pit_lane_live_board.core.settings import Settings
from custom_components.pit_lane_live_board.core.timing import build_tower


def topics(**lines):
    return {
        "SessionInfo": {"Type": "Race", "Name": "Race"},
        "DriverList": {"1": {"Tla": "NOR"}, "16": {"Tla": "LEC"}, "63": {"Tla": "RUS"}},
        "TimingData": {"Lines": lines or {"1": {"Position": "1"}}},
        "TimingAppData": {
            "Lines": {
                "63": {
                    "Stints": [
                        {
                            "Compound": "MEDIUM",
                            "New": "true",
                            "TotalLaps": 24,
                            "StartLaps": 0,
                            "LapTime": "1:33.100",
                            "LapNumber": 18,
                        },
                        {
                            "Compound": "SOFT",
                            "New": "false",
                            "TotalLaps": 24,
                            "StartLaps": 3,
                            "LapTime": "1:32.400",
                            "LapNumber": 40,
                        },
                    ]
                }
            }
        },
    }


def test_stints_follow_one_another_from_lap_one():
    rows = build_tower(topics(**{"63": {"Position": "3"}}))
    stints = rows[0]["stints"]
    assert [(s["compound"], s["from_lap"], s["to_lap"], s["laps"]) for s in stints] == [
        ("medium", 1, 24, 24),
        # A used set: 24 laps on it, 3 of them before this stint.
        ("soft", 25, 45, 21),
    ]
    assert stints[1]["best"] == {"time": "1:32.400", "lap": 40}
    assert stints[0]["new"] is True and stints[1]["new"] is False


def test_mini_sectors_take_f1_colours():
    line = {
        "Position": "1",
        "Sectors": [
            {
                "Segments": [
                    {"Status": 2051},
                    {"Status": 2049},
                    {"Status": 2048},
                    {"Status": 0},
                ]
            },
            {"Segments": {"0": {"Status": 2064}, "1": {"Status": 2052}}},
            {},
        ],
    }
    row = build_tower(topics(**{"1": line}))[0]
    assert row["segments"] == [["p", "g", "y", ""], ["pit", "o"], []]


def test_gap_reading():
    assert strategy.gap_seconds("+12.345", 4) == 12.345
    assert strategy.gap_seconds("LAP 31", 1) == 0.0
    assert strategy.gap_seconds("1 L", 12) is None
    assert strategy.gap_seconds(None, 3) is None


def test_pit_loss_is_the_circuits_typical_and_cheaper_under_a_safety_car():
    assert strategy.pit_loss("monza", "clear") == (24.0, True)
    assert strategy.pit_loss("a_new_track", "clear") == (22.0, False)
    assert strategy.pit_loss("monza", "safety_car") == (13.2, True)  # 24 x 0.55


def test_every_2026_circuit_has_its_pit_loss():
    """The 2026 calendar's Jolpica circuit ids; Madring and Sepang were missing and
    fell back to the generic 22 s marked unknown."""
    circuits = [
        "albert_park",
        "americas",
        "baku",
        "catalunya",
        "hungaroring",
        "interlagos",
        "losail",
        "madring",
        "marina_bay",
        "miami",
        "monaco",
        "monza",
        "red_bull_ring",
        "rodriguez",
        "sepang",
        "shanghai",
        "silverstone",
        "spa",
        "suzuka",
        "vegas",
        "villeneuve",
        "yas_marina",
        "zandvoort",
    ]
    assert [c for c in circuits if not strategy.pit_loss(c, "clear")[1]] == []


def test_rejoin_position_and_neighbours():
    rows = [
        {
            "number": "1",
            "tla": "NOR",
            "position": 1,
            "gap": "LAP 20",
            "status": "running",
        },
        {
            "number": "16",
            "tla": "LEC",
            "position": 2,
            "gap": "+5.0",
            "status": "running",
        },
        {
            "number": "63",
            "tla": "RUS",
            "position": 3,
            "gap": "+20.0",
            "status": "running",
        },
        {
            "number": "44",
            "tla": "HAM",
            "position": 4,
            "gap": "+30.0",
            "status": "running",
        },
        {
            "number": "10",
            "tla": "GAS",
            "position": 5,
            "gap": "1 L",
            "status": "running",
        },
    ]
    out = strategy.pit_rejoin(rows, 22.0, True)
    # LEC: 5 + 22 = 27 s behind the leader: behind RUS (20), ahead of HAM (30).
    assert out["16"] == {
        "position": 3,
        "ahead": "RUS",
        "ahead_gap": 7.0,
        "behind": "HAM",
        "behind_gap": 3.0,
        "loss": 22.0,
        "known": True,
        "pitting": 0,
    }
    assert out["44"]["position"] == 4 and out["44"]["behind"] is None
    assert "10" not in out  # lapped: its gap does not add up


def test_favourite_codes_are_normalised():
    assert favourites.normalise(
        ["lec", "LEC", " ham ", "X", "ab1", "NOR", "PIA", "VER", "RUS"]
    ) == (
        "LEC",
        "HAM",
        "NOR",
        "PIA",
        "VER",
    )
    assert Settings().with_favourites(["lec"]).favourites == ("LEC",)
    assert Settings.from_dict(
        Settings().with_favourites(["lec"]).to_dict()
    ).favourites == ("LEC",)


def row(tla, position, **extra):
    base = {
        "number": {"LEC": "16", "NOR": "1"}[tla],
        "tla": tla,
        "position": position,
        "status": "running",
        "in_pit": False,
        "laps": 10,
        "last_lap": {"time": "1:30.0", "overall_best": False},
    }
    return {**base, **extra}


def test_favourite_events_between_snapshots():
    first = favourites.snapshot([row("LEC", 3), row("NOR", 1)], ("LEC",))
    assert set(first) == {"LEC"}
    assert favourites.derive(None, first, True) == []  # the baseline
    second = favourites.snapshot([row("LEC", 2)], ("LEC",))
    assert [e for e, _ in favourites.derive(first, second, True)] == ["position_gained"]
    third = favourites.snapshot(
        [row("LEC", 1, last_lap={"time": "1:29.0", "overall_best": True})], ("LEC",)
    )
    assert [e for e, _ in favourites.derive(second, third, True)] == [
        "fastest_lap",
        "took_lead",
    ]
    boxed = favourites.snapshot([row("LEC", 1, in_pit=True)], ("LEC",))
    assert [e for e, _ in favourites.derive(third, boxed, True)] == ["pit_in"]
    # In practice and qualifying positions reshuffle every lap: no position events,
    # but the fastest lap counts (a provisional pole).
    assert favourites.derive(first, second, False) == []
    assert [e for e, _ in favourites.derive(second, third, False)] == ["fastest_lap"]


def test_pit_out_names_the_new_tyre():
    """Spain 2026: `PitOut` arrives before F1 opens the new stint, whose compound
    is "UNKNOWN" for a moment more; the event waits for the real one."""

    def at(in_pit, stint, compound, laps=13):
        tyre = {"compound": compound, "age": 0, "stint": stint}
        return favourites.snapshot(
            [row("LEC", 4, in_pit=in_pit, laps=laps, tyre=tyre)], ("LEC",)
        )

    running = at(False, 1, "hard")
    boxed = at(True, 1, "hard")
    assert [e for e, _ in favourites.derive(running, boxed, True)] == ["pit_in"]
    out = at(False, 1, "hard", laps=14)
    assert favourites.derive(boxed, out, True) == []
    opened = at(False, 2, "unknown", laps=14)
    assert favourites.derive(out, opened, True) == []
    named = at(False, 2, "medium", laps=14)
    ((event, data),) = favourites.derive(opened, named, True)
    assert (event, data["tyre"], data["lap"]) == ("pit_out", "medium", 14)
    assert favourites.derive(named, at(False, 2, "medium", laps=14), True) == []


def test_a_stop_with_no_new_tyre_goes_out_with_the_lap():
    boxed = favourites.snapshot([row("LEC", 4, in_pit=True, laps=13)], ("LEC",))
    out = favourites.snapshot([row("LEC", 4, laps=13)], ("LEC",))
    assert favourites.derive(boxed, out, True) == []
    lap = favourites.snapshot([row("LEC", 4, laps=14)], ("LEC",))
    assert [e for e, _ in favourites.derive(out, lap, True)] == ["pit_out"]


def test_no_pit_events_on_the_way_to_the_grid():
    """Before the start the cars drive out to the grid and back, with no lap."""
    garage = favourites.snapshot([row("LEC", 4, in_pit=True, laps=None)], ("LEC",))
    out = favourites.snapshot([row("LEC", 4, laps=None)], ("LEC",))
    back = favourites.snapshot([row("LEC", 4, in_pit=True, laps=None)], ("LEC",))
    assert favourites.derive(garage, out, True) == []
    assert favourites.derive(out, back, True) == []


def test_the_summary_format_setting():
    assert Settings().with_summary(fmt="full").summary_format == "full"
    assert Settings.from_dict({"summary_format": "huge"}).summary_format == "compact"
