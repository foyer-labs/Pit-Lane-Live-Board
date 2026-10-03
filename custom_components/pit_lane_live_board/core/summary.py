"""The summary of a session, when it ends (decisions 53, 56 and 59).

`build` makes the facts (podium, fastest lap, retirements with their lap,
penalties, the biggest mover, the household's drivers, the whole classification
with the qualifying part each driver reached) from the final state; `render`
writes them as a notification in the language of the given templates, which come
from the integration's translations (INV-7).

The layout is a push headline, not a report (decision 59): the title says what
happened (`🏆 Antonelli wins the Spanish GP`), the first line of the message
carries the result on its own and the second the household's drivers, because a
locked phone shows two to four lines. Emoji only open a line, as anchors, so an
automation that speaks the summary can strip them. Plain text throughout: the
same message lands on phones, Telegram, a persistent notification or a speaker.
"""

from __future__ import annotations

from collections.abc import Callable
import re
from typing import Any

from .session import QUALIFYING_LIKE, RACE_LIKE
from .stewards import PENALTIES

_OUT = ("retired", "stopped")
MEDALS = ("🥇", "🥈", "🥉")
KEYCAPS = ("1️⃣", "2️⃣", "3️⃣")
FOLLOWED = "★"
# A biggest mover is named from this many places gained.
MOVER_PLACES = 3
# A pole won by less than this (seconds) makes the margin the headline.
CLOSE_POLE = 0.05
_TITLES = frozenset({"race", "sprint", "qualifying", "sprint_qualifying", "practice"})

# What the notify call carries beyond title and message (decision 59).
TAG = "pit_lane_live_board_summary"
GROUP = "pit_lane_live_board"
CHANNEL = "Pit Lane Live Board"

_LAPPED = re.compile(r"^\+?\s*(\d+)\s*L(?:APS?)?$", re.IGNORECASE)
_SECONDS = re.compile(r"^\+(\d+(?:\.\d+)?)$")

Fill = Callable[..., str]


def _seconds(lap_time: str | None) -> float | None:
    """`1:35.587` → 95.587."""
    if not lap_time:
        return None
    try:
        minutes, _, seconds = lap_time.rpartition(":")
        return (int(minutes) * 60 if minutes else 0) + float(seconds)
    except ValueError:
        return None


def _joined(*parts: str | None) -> str:
    return " ".join(part for part in parts if part)


def _segments(rows: list[dict[str, Any]]) -> dict[str, int]:
    """tla → the qualifying part reached (3, 2 or 1). Still running at the end is
    the last part; knocked out, the last part with a time. Never more than the
    car ahead, so a driver out without a time stays in the block they were in."""
    out: dict[str, int] = {}
    ceiling = 3
    for row in rows:
        if row.get("status") != "knocked_out":
            reached = 3
        else:
            bests = (row.get("qualifying") or {}).get("part_bests") or []
            timed = [i + 1 for i, value in enumerate(bests[:3]) if value]
            # Knocked out means out before the last part.
            reached = min(timed[-1], 2) if timed else 1
        reached = min(reached, ceiling)
        ceiling = reached
        out[row["tla"]] = reached
    return out


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
    segments = _segments(ranked) if qualifying else {}

    def out(row: dict[str, Any]) -> bool:
        # A car stopped on track at the end did not finish either.
        return race and row.get("status") in _OUT

    def result(row: dict[str, Any]) -> dict[str, Any]:
        q = row.get("qualifying") or {}
        best = row.get("best_lap") or {}
        laps = row.get("laps")
        item = {
            "position": row.get("position"),
            "driver": row["tla"],
            "name": row.get("name"),
            "gap": q.get("gap") if qualifying else row.get("gap"),
            "time": q.get("best") if qualifying else best.get("time"),
            "gained": row.get("gained") if race else None,
            "status": row.get("status"),
            "laps": laps,
            # `laps` counts the laps completed: the car stopped on the next one.
            "out_lap": laps + 1 if out(row) and isinstance(laps, int) else None,
        }
        if qualifying:
            item["segment"] = segments.get(row["tla"])
        return item

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
    finished = [r for r in ranked if not out(r)]
    classification = [result(r) for r in finished] + [
        result(r) for r in rows if out(r) or not r.get("position")
    ]
    # Retirements in the order they happened: by laps completed.
    dnf = sorted(
        (item for item in classification if race and item["status"] in _OUT),
        key=lambda item: (item["laps"] is None, item["laps"] or 0),
    )
    mover = None
    if race:
        movers = [
            r
            for r in finished
            if isinstance(r.get("gained"), int)
            and r["gained"] >= MOVER_PLACES
            and r["position"] > 3
        ]
        if movers:
            best = max(movers, key=lambda r: (r["gained"], -r["position"]))
            mover = {
                "driver": best["tla"],
                "grid": best["position"] + best["gained"],
                "position": best["position"],
                "gained": best["gained"],
            }
    wanted = set(favourites)
    return {
        "meeting": header.get("meeting"),
        "session": header.get("session"),
        "kind": kind,
        "qualifying": qualifying,
        "podium": [result(r) for r in finished[:3]],
        "fastest_lap": fastest,
        "retired": [item["driver"] for item in dnf],
        "dnf": [{"driver": item["driver"], "lap": item["out_lap"]} for item in dnf],
        "mover": mover,
        "penalties": list(reversed(penalties)),
        "yours": [item for item in classification if item["driver"] in wanted],
        "classification": classification,
    }


def render(
    summary: dict[str, Any], texts: dict[str, str], full: bool = False
) -> tuple[str, str]:
    """`(title, message)` from templates such as `{driver} P{position}`; `full`
    adds the whole classification with every driver's time."""

    def fill(key: str, **values: Any) -> str:
        text = texts.get(key, key)
        for name, value in values.items():
            text = text.replace("{" + name + "}", "" if value is None else str(value))
        return text

    kind = summary.get("kind") or "race"
    race = kind in RACE_LIKE
    qualifying = kind in QUALIFYING_LIKE
    gap = _gap_writer(fill)

    lines: list[str] = []
    podium = summary.get("podium") or []
    marks = MEDALS if race else KEYCAPS
    if podium:
        lines.append(
            " · ".join(
                _joined(
                    marks[i],
                    item["driver"],
                    item.get("time") if i == 0 and not race else gap(item),
                )
                for i, item in enumerate(podium[:3])
            )
        )
    yours = []
    for item in summary.get("yours") or []:
        if item.get("position") is None or (race and item.get("status") in _OUT):
            lap = item.get("out_lap")
            yours.append(
                fill("yours_out", driver=item["driver"], lap=lap)
                if lap
                else fill("yours_dnf", driver=item["driver"])
            )
            continue
        entry = fill("yours_one", driver=item["driver"], position=item["position"])
        if race:
            gained = item.get("gained")
            if isinstance(gained, int):
                entry += " " + (
                    f"▲{gained}" if gained > 0 else f"▼{-gained}" if gained else "="
                )
        elif not qualifying or item.get("segment") == 3:
            entry = _joined(entry, gap(item))
        yours.append(entry)
    if yours:
        lines.append(fill("yours", list=" · ".join(yours)))
    if race:
        if summary.get("fastest_lap"):
            lines.append(fill("fastest", **summary["fastest_lap"]))
        if summary.get("mover"):
            lines.append(fill("mover", **summary["mover"]))
        if summary.get("retired") and not full:
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
    if full and summary.get("classification"):
        lines.extend(_full(summary, fill, gap))
    return _title(summary, fill), "\n".join(lines)


def resolve_target(
    target: str, is_entity: Callable[[str], bool], has_service: Callable[[str], bool]
) -> tuple[str, str] | None:
    """`("entity", "notify.x")`, `("service", "x")`, or None when neither exists.

    A bare name is a service. `notify.x` is the notify entity when there is one,
    else the service `x` written with its domain (how older settings named it).
    """
    if target.startswith("notify."):
        if is_entity(target):
            return ("entity", target)
        target = target.removeprefix("notify.")
    if target and target != "send_message" and has_service(target):
        return ("service", target)
    return None


def delivery_data(target: str, panel_path: str) -> dict[str, Any] | None:
    """The `data` of the notify call for one service, or None for none.

    Only for what is known to read it: the Companion app (`mobile_app_*`) opens
    the panel on a tap (`url` on iOS, `clickAction` on Android), replaces the last
    summary instead of stacking one per session (`tag`), groups them, and gives
    them an Android channel of their own, so its sound can be set apart;
    `persistent_notification` replaces the last one by id. Other services get
    nothing: some act on keys they know, and title and message are enough.
    """
    if target.startswith("mobile_app_"):
        path = "/" + panel_path.strip("/")
        return {
            "tag": TAG,
            "group": GROUP,
            "url": path,
            "clickAction": path,
            "channel": CHANNEL,
        }
    if target == "persistent_notification":
        return {"notification_id": TAG}
    return None


def _gap_writer(fill: Fill) -> Callable[[dict[str, Any]], str]:
    """The gap as fans write it: none for the leader, `+1 lap`, `+1:26.746`."""

    def gap(item: dict[str, Any]) -> str:
        value = (item.get("gap") or "").strip()
        if not value or item.get("position") == 1 or value.upper().startswith("LAP"):
            return ""
        lapped = _LAPPED.match(value)
        if lapped:
            laps = int(lapped.group(1))
            return fill("lapped_one") if laps == 1 else fill("lapped_other", n=laps)
        seconds = _SECONDS.match(value)
        if seconds and float(seconds.group(1)) >= 60:
            minutes, rest = divmod(float(seconds.group(1)), 60)
            return f"+{int(minutes)}:{rest:06.3f}"
        return value

    return gap


def _full(
    summary: dict[str, Any], fill: Fill, gap: Callable[[dict[str, Any]], str]
) -> list[str]:
    """The whole classification: medals and the fastest lap in a race, the
    retirements last with their lap; qualifying in its parts, the knocked out
    with their own time (gaps are per part, and would mislead in one list)."""
    kind = summary.get("kind") or "race"
    followed = {item["driver"] for item in summary.get("yours") or []}
    rows = summary["classification"]

    def code(item: dict[str, Any]) -> str:
        return f"{FOLLOWED if item['driver'] in followed else ''}{item['driver']}"

    lines: list[str] = []
    if kind in RACE_LIKE:
        fastest = (summary.get("fastest_lap") or {}).get("driver")
        lines += ["", fill("classification")]
        for item in rows:
            if item.get("status") in _OUT or item.get("position") is None:
                continue
            place = item["position"]
            head = _joined(MEDALS[place - 1] if place <= 3 else f"{place}.", code(item))
            row = " · ".join(
                part for part in (_joined(head, gap(item)), item.get("time")) if part
            )
            lines.append(row + (" ⏱️" if item["driver"] == fastest else ""))
        laps = {d["driver"]: d["lap"] for d in summary.get("dnf") or []}
        out = [
            item
            for item in rows
            if item.get("status") in _OUT or item.get("position") is None
        ]
        if out:
            out.sort(
                key=lambda i: (
                    laps.get(i["driver"]) is None,
                    laps.get(i["driver"]) or 0,
                )
            )
            lines += ["", fill("head_dnf")]
            for item in out:
                lap = laps.get(item["driver"])
                lines.append(
                    fill("dnf_row", driver=code(item), lap=lap) if lap else code(item)
                )
        return lines

    def row(item: dict[str, Any], with_gap: bool) -> str:
        return _joined(
            f"{item['position']}.",
            code(item),
            item.get("time") or fill("no_time"),
            gap(item) if with_gap else "",
        )

    ranked = [item for item in rows if item.get("position") is not None]
    reached = [item.get("segment") or 0 for item in ranked]
    if kind in QUALIFYING_LIKE and any(reached):
        prefix = "SQ" if kind == "sprint_qualifying" else "Q"
        top = max(reached)
        for part in (3, 2, 1):
            block = [item for item in ranked if item.get("segment") == part]
            if block:
                head = "head_top" if part == top else "head_out"
                lines += ["", fill(head, segment=f"{prefix}{part}")]
                lines += [row(item, part == top) for item in block]
        return lines
    lines += ["", fill("classification")]
    lines += [row(item, True) for item in ranked]
    return lines


def _title(summary: dict[str, Any], fill: Fill) -> str:
    """A headline: who won, took pole or was fastest, then the meeting."""
    kind = summary.get("kind") or "race"
    meeting = (summary.get("meeting") or "").replace("Grand Prix", "GP").strip()
    session = summary.get("session") or ""
    podium = summary.get("podium") or []
    if not podium:
        return fill("title_fallback", meeting=meeting, session=session).strip(" ·—-")
    first = podium[0]
    name = (first.get("name") or "").split()
    values = {"winner": name[-1] if name else first["driver"], "meeting": meeting}
    if kind == "qualifying" and len(podium) > 1:
        margin = (podium[1].get("gap") or "").lstrip("+")
        try:
            close = float(margin) < CLOSE_POLE
        except ValueError:
            close = False
        if close:
            return fill("title_qualifying_close", margin=margin, **values).strip(" ·—-")
    if kind == "practice":
        number = re.search(r"(\d)\s*$", session)
        values["session"] = (
            fill("practice_label", n=number.group(1)) if number else session
        )
    key = f"title_{kind}" if kind in _TITLES else "title_race"
    return fill(key, **values).strip(" ·—-")
