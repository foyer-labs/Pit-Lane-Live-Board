"""The summary of a session, when it ends (decision 53).

`build` makes the facts (podium, fastest lap, retirements, penalties, the
household's drivers, the whole classification) from the final state; `render`
writes them as a notification in the language of the given templates, which come
from the integration's translations (INV-7): compact, or with the whole
classification and every driver's time (decision 56).
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
        "classification": [
            {**result(r), "status": r.get("status"), "laps": r.get("laps")}
            for r in ranked
        ]
        + [
            {
                "position": None,
                "driver": r["tla"],
                "name": r.get("name"),
                "gap": None,
                "time": (r.get("best_lap") or {}).get("time"),
                "gained": None,
                "status": r.get("status"),
                "laps": r.get("laps"),
            }
            for r in rows
            if not r.get("position")
        ],
    }


def _row(item: dict[str, Any], qualifying: bool, fill: Any) -> str:
    """`2. VER +4.351 · 1:35.100` (race: gap, best lap), `2. NOR 1:26.345 +0.222`
    (qualifying and practice: best lap, gap); `ALB out (lap 23)` without a place."""
    gap = item.get("gap") or ""
    if gap.upper().startswith("LAP") or item.get("position") == 1:
        gap = ""
    time = item.get("time") or ""
    if item.get("position") is None:
        laps = item.get("laps")
        out = fill("out_lap", lap=laps) if laps else fill("out")
        return f"{item['driver']} {out}"
    head = f"{item['position']}. {item['driver']}"
    if qualifying:
        return " ".join(part for part in (head, time, gap) if part)
    if item.get("status") == "retired":
        return f"{head} {fill('out')}"
    return " · ".join(
        part for part in (" ".join(p for p in (head, gap) if p), time) if part
    )


def render(
    summary: dict[str, Any], texts: dict[str, str], full: bool = False
) -> tuple[str, str]:
    """`(title, message)` with templates such as `{position}. {driver}`; `full`
    adds the whole classification with every driver's time."""

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
    if full and summary.get("classification"):
        timed_first = summary.get("qualifying") or summary.get("kind") == "practice"
        lines.append("")
        lines.append(fill("classification"))
        lines.extend(
            _row(item, timed_first, fill) for item in summary["classification"]
        )
    return title, "\n".join(lines)
