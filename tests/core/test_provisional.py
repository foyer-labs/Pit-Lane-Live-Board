"""A session's classification from F1's timing, until Jolpica has it (decision 63)."""

from __future__ import annotations

from custom_components.pit_lane_live_board.core import pages, provisional

META = {"season": 2026, "round": 18, "name": "Singapore Grand Prix"}


def row(tla, position, **more):
    return {
        "number": tla,
        "tla": tla,
        "name": f"Driver {tla}",
        "team": "Ferrari",
        "colour": "#e8002d",
        "position": position,
        "laps": 20,
        "status": "running",
        **more,
    }


def test_a_sprint_from_the_tower():
    """Singapore 2026 sprint, as the archive has it."""
    tower = [
        row(
            "HAM",
            2,
            gap="+2.591",
            grid=6,
            gained=4,
            best_lap={"time": "1:45.457", "lap": 20},
        ),
        row(
            "VER",
            1,
            gap="LAP 20",
            grid=1,
            gained=0,
            best_lap={"time": "1:46.017", "lap": 19},
        ),
        row("ALB", 3, gap="1L", laps=19),
        row("RUS", 4, status="retired", laps=1, grid=2),
        row("XXX", None),  # no place: left out
    ]
    data = provisional.race(tower, META)
    rows = data["rows"]
    assert data["race"] == META
    assert [r["code"] for r in rows] == ["VER", "HAM", "ALB", "RUS"]
    assert rows[0]["time"] is None and rows[0]["status"] == "Finished"
    assert rows[1]["time"] == "+2.591" and rows[1]["grid"] == 6
    assert rows[1]["fastest_lap"] == {"rank": 1, "lap": 20, "time": "1:45.457"}
    assert rows[2]["status"] == "+1 Lap" and rows[2]["time"] is None
    assert rows[3]["position_text"] == "R" and rows[3]["status"] == "Retired"
    # What only Jolpica knows stays empty rather than guessed.
    assert all(r["points"] is None and r["driver_id"] is None for r in rows)
    assert rows[0]["colour"] == "#e8002d" and rows[0]["team"] == "Ferrari"


def test_qualifying_from_the_tower():
    tower = [
        row("VER", 1, qualifying={"part_bests": ["1:33.241", "1:31.639", "1:31.373"]}),
        row("PER", 2, qualifying={"part_bests": ["1:35.123"]}),
        row("HAD", 3, qualifying=None),
    ]
    rows = provisional.qualifying(tower, META)["rows"]
    assert (rows[0]["q1"], rows[0]["q2"], rows[0]["q3"]) == (
        "1:33.241",
        "1:31.639",
        "1:31.373",
    )
    assert (rows[1]["q1"], rows[1]["q2"], rows[1]["q3"]) == ("1:35.123", None, None)
    assert (rows[2]["q1"], rows[2]["q3"]) == (None, None)


def test_an_empty_tower_is_no_classification():
    assert provisional.race([], META) is None
    assert provisional.qualifying([row("VER", None)], META) is None


def test_sprint_weekends_have_a_sprint_qualifying_tab_from_2023():
    assert "sprint_qualifying" in pages.tabs_for(2026, True)
    assert "sprint_qualifying" not in pages.tabs_for(2026, False)
    assert "sprint_qualifying" not in pages.tabs_for(2022, True)
    assert pages.TAB_SESSION["sprint_qualifying"] == "sprint_qualifying"
