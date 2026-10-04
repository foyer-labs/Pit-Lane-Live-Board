"""What a small screen shows (decision 54): an ESP32 with ESPHome, an e-paper
frame, a LED ring.

ESPHome reads a Home Assistant state and attributes one by one as text, so
everything here is flat and short: no lists, no nested objects, no sentences to
translate (the screen formats them), fixed-width rows ready to print. The screen
never talks to F1: the TV delay and no-spoiler mode are already applied.
"""

from __future__ import annotations

from typing import Any

ROWS = 10

# One colour per track status, for a LED ring or a coloured bar.
FLAG_COLOURS = {
    "clear": "#1fa855",
    "yellow": "#f2c200",
    "vsc_ending": "#f2c200",
    "safety_car": "#ff8c00",
    "virtual_safety_car": "#ff8c00",
    "red_flag": "#db4437",
    "chequered": "#ffffff",
}
COMPOUND_LETTER = {
    "soft": "S",
    "medium": "M",
    "hard": "H",
    "intermediate": "I",
    "wet": "W",
}


def _row(row: dict[str, Any], qualifying: bool) -> str:
    """`1 LEC  +3.561 M12`: position, code, gap, tyre and its age."""
    tyre = row.get("tyre") or {}
    letter = COMPOUND_LETTER.get(tyre.get("compound") or "", "?")
    age = tyre.get("age")
    gap = (row.get("qualifying") or {}).get("gap") if qualifying else row.get("gap")
    if row.get("position") == 1 or not gap:
        gap = ""
    if row.get("in_pit"):
        gap = "PIT"
    elif row.get("status") in ("retired", "stopped"):
        # The lap it happened on: `laps` counts the laps completed.
        word = "OUT" if row["status"] == "retired" else "STOP"
        laps = row.get("laps")
        gap = (
            f"{word} L{laps + 1}" if isinstance(laps, int) and not qualifying else word
        )
    tyre_text = f"{letter}{age}" if tyre and age is not None else ""
    return (
        f"{row.get('position') or '-':>2} {row['tla']:<3} {gap:>8} {tyre_text}".rstrip()
    )


def build(view: dict[str, Any], favourites: tuple[str, ...]) -> dict[str, Any]:
    """`{state, attributes}` from the Live page's view (what the page would show)."""
    state = view.get("state") or "idle"
    head = view.get("header") or {}
    rows = view.get("tower") or []
    shown = state in ("live", "stale", "lost", "final")
    kind = head.get("kind") or ""
    qualifying = kind in ("qualifying", "sprint_qualifying")
    track = head.get("track_status") if shown else None
    stewards = view.get("stewards") or {}
    attributes: dict[str, Any] = {
        "meeting": head.get("meeting") if shown else None,
        "session": head.get("session") if shown else None,
        "kind": kind or None,
        "lap": head.get("lap") if shown else None,
        "total_laps": head.get("total_laps") if shown else None,
        "part": head.get("part") if shown and qualifying else None,
        "remaining": head.get("remaining") if shown and state != "final" else None,
        "track": track,
        "flag_colour": FLAG_COLOURS.get(track or "", "#000000"),
        "safety_car": bool(
            stewards.get("safety_car") or stewards.get("virtual_safety_car")
        )
        if shown
        else False,
        "red_flag": bool(stewards.get("red_flag")) if shown else False,
    }
    for index in range(ROWS):
        attributes[f"p{index + 1}"] = (
            _row(rows[index], qualifying) if shown and index < len(rows) else ""
        )
    mine = [r for r in rows if r.get("tla") in favourites] if shown else []
    attributes["mine"] = " · ".join(_row(r, qualifying).strip() for r in mine[:3])
    next_session = view.get("next_session") or {}
    attributes["next_meeting"] = next_session.get("meeting")
    attributes["next_session"] = next_session.get("kind")
    attributes["next_start"] = next_session.get("start")
    return {"state": state, "attributes": attributes}
