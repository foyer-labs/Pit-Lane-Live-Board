"""The summary of a session, when it ends (decision 53).

`build` makes the facts (podium, fastest lap, retirements, penalties, the
household's drivers) from the final state; `render` writes them as a short
notification in the language of the given templates, which come from the
integration's translations (INV-7).
"""

from __future__ import annotations

from typing import Any

from .session import QUALIFYING_LIKE, RACE_LIKE
from .stewards import PENALTIES


def _seconds(lap_time: str | None) -> float | None:
    """`1:35.587` → 95.587."""
    if not lap_time:
        return None
    try:
        minutes, _, seconds = lap_time.rpartition(":")
        return (int(minutes) * 60 if minutes else 0) + float(seconds)
    except ValueError:
        return None


def build(
    header: dict[str, Any],
    rows: list[dict[str, Any]],
    stewards: dict[str, Any] | None,
    favourites: tuple[str, ...],
) -> dict[str, Any]:
    kind = header.get("kind") or "race"
    ranked = [r for r in rows if r.get("position")]
    qualifying = kind in QUALIFYING_LIKE
    race = kind in RACE_LIKE

    def result(row: dict[str, Any]) -> dict[str, Any]:
        q = row.get("qualifying") or {}
        best = row.get("best_lap") or {}
        return {
            "position": row["position"],
            "driver": row["tla"],
            "name": row.get("name"),
            "gap": q.get("gap") if qualifying else row.get("gap"),
            "time": q.get("best") if qualifying else best.get("time"),
            "gained": row.get("gained") if race else None,
        }

    fastest = None
    if race:
        timed = [(r, _seconds((r.get("best_lap") or {}).get("time"))) for r in rows]
        timed = [(r, s) for r, s in timed if s is not None]
        if timed:
            row, _ = min(timed, key=lambda item: item[1])
            fastest = {"driver": row["tla"], "time": row["best_lap"]["time"]}
    penalties = [
        {"driver": p["cars"][0]["tla"], "kind": p["kind"], "seconds": p.get("seconds")}
        for p in (stewards or {}).get("penalties", [])
        if p["kind"] in PENALTIES and p.get("cars")
    ]
    wanted = set(favourites)
    return {
        "meeting": header.get("meeting"),
        "session": header.get("session"),
        "kind": kind,
        "qualifying": qualifying,
        "podium": [result(r) for r in ranked[:3]],
        "fastest_lap": fastest,
        "retired": [r["tla"] for r in rows if r.get("status") == "retired"]
        if race
        else [],
        "penalties": list(reversed(penalties)),
        "yours": [result(r) for r in ranked if r["tla"] in wanted],
    }


def render(summary: dict[str, Any], texts: dict[str, str]) -> tuple[str, str]:
    """`(title, message)` with templates such as `{position}. {driver}`."""

    def fill(key: str, **values: Any) -> str:
        text = texts.get(key, key)
        for name, value in values.items():
            text = text.replace("{" + name + "}", "" if value is None else str(value))
        return text

    title = fill(
        "title",
        meeting=summary.get("meeting") or "",
        session=summary.get("session") or "",
    ).strip(" —-")
    lines: list[str] = []
    podium = []
    for item in summary["podium"]:
        entry = fill("place", position=item["position"], driver=item["driver"])
        if item["position"] == 1 and item.get("time") and summary.get("qualifying"):
            entry += f" {item['time']}"
        elif item["position"] > 1 and item.get("gap"):
            entry += f" {item['gap']}"
        podium.append(entry)
    if podium:
        lines.append(" · ".join(podium))
    if summary.get("fastest_lap"):
        lines.append(fill("fastest", **summary["fastest_lap"]))
    if summary.get("retired"):
        lines.append(fill("retired", drivers=", ".join(summary["retired"])))
    if summary.get("penalties"):
        described = []
        for penalty in summary["penalties"][:4]:
            label = (
                f"+{penalty['seconds']}s"
                if penalty.get("seconds") and penalty["kind"] == "time_penalty"
                else fill(f"kind_{penalty['kind']}")
            )
            described.append(f"{penalty['driver']} {label}")
        lines.append(fill("penalties", list=", ".join(described)))
    if summary.get("yours"):
        yours = []
        for item in summary["yours"]:
            entry = fill("yours_one", driver=item["driver"], position=item["position"])
            gained = item.get("gained")
            if gained:
                entry += f" ({'+' if gained > 0 else ''}{gained})"
            yours.append(entry)
        lines.append(fill("yours", list=", ".join(yours)))
    return title, "\n".join(lines)
