"""Flags, safety car and the stewards' decisions, read from race control (SPEC §7.1.1).

F1 publishes no structured penalty feed: decisions arrive as the stewards' text in
`RaceControlMessages`. This module reads them, best effort, into records the page
and the entities can use. The forms were collected from the 2024-2026 archives:

    FIA STEWARDS: 5 SECOND TIME PENALTY FOR CAR 44 (HAM) - CAUSING A COLLISION
    FIA STEWARDS: DRIVE THROUGH PENALTY FOR CAR 1 (VER) - ...
    FIA STEWARDS: 10 SECOND STOP/GO PENALTY FOR CAR 2 (SAR)
    FIA STEWARDS: PENALTY SERVED - 10 SECOND TIME PENALTY FOR CAR 22 (TSU) - ...
    TURN 2 INCIDENT INVOLVING CARS 10 (GAS) AND 11 (PER) NOTED - CAUSING A COLLISION
    FIA STEWARDS: ... UNDER INVESTIGATION - ...
    FIA STEWARDS: ... WILL BE INVESTIGATED AFTER THE RACE - ...
    FIA STEWARDS: ... REVIEWED NO FURTHER INVESTIGATION - ...  /  ... NO FURTHER ACTION
    FIA STEWARDS: WARNING FOR CAR 5 (BOR) - MOVING UNDER BRAKING
    BLACK AND WHITE FLAG FOR CAR 44 (HAM) - TRACK LIMITS
    CAR 63 (RUS) TIME 1:36.556 DELETED - TRACK LIMITS AT TURN 14 LAP 2 14:06:24

`StewardsBook` is fed one message at a time, in order, so a live session costs one
parse per new message rather than a pass over the whole list at every update.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import re
from typing import Any

from .values import text, to_int

DECISIONS = (
    "time_penalty",
    "drive_through",
    "stop_go",
    "grid_penalty",
    "penalty_served",
    "disqualified",
    "noted",
    "investigation",
    "investigation_after_race",
    "no_further_action",
    "warning",
    "black_and_white_flag",
    "lap_deleted",
)
PENALTIES = frozenset(
    {"time_penalty", "drive_through", "stop_go", "grid_penalty", "disqualified"}
)

_CARS = re.compile(r"\bCARS? ((?:\d+ \([A-Z]{3}\)(?:, | AND )?)+)")
_CAR = re.compile(r"(\d+) \(([A-Z]{3})\)")
_FOR_CAR = re.compile(r"\bFOR CAR (\d+) \(([A-Z]{3})\)")
_SECONDS = re.compile(r"\b(\d+) SECOND\b")
_PLACES = re.compile(r"\b(\d+) PLACE GRID PENALTY\b")
_TURN = re.compile(r"\bTURN (\d+)\b")
_TRAILING_TIME = re.compile(r"\s*\(\d{1,2}:\d{2}:+\d{2}\)\s*$")
_SECTOR = re.compile(r"\bSECTOR (\d+)\b")


def _reason(body: str) -> str | None:
    """What the decision is about: the text after the first " - "."""
    if " - " not in body:
        return None
    reason = body.split(" - ", 1)[1]
    # "PENALTY SERVED - 10 SECOND TIME PENALTY FOR CAR 22 (TSU) - CAUSING A COLLISION"
    if "PENALTY FOR CAR" in reason and " - " in reason:
        reason = reason.split(" - ", 1)[1]
    elif "PENALTY FOR CAR" in reason:
        return None
    reason = _TRAILING_TIME.sub("", reason).strip()
    # Some messages carry a dash as a replacement character or a typographic dash.
    for dash in ("\ufffd", "\u2013", "\u2014"):
        reason = reason.replace(dash, "-")
    return reason or None


def _cars(body: str) -> list[tuple[str, str]]:
    target = _FOR_CAR.search(body)
    if target:
        return [(target.group(1), target.group(2))]
    group = _CARS.search(body)
    if group:
        return _CAR.findall(group.group(1))
    return _CAR.findall(body)[:1]


def classify(message: str) -> str | None:
    """The decision a race control message carries, or None."""
    body = message.upper()
    if "PENALTY SERVED" in body:
        return "penalty_served"
    if "DISQUALIFIED" in body:
        return "disqualified"
    if "TIME PENALTY" in body or re.search(r"\d+ SECOND PENALTY", body):
        return "time_penalty"
    if "DRIVE THROUGH" in body or "DRIVE-THROUGH" in body:
        return "drive_through"
    if "STOP/GO" in body or "STOP AND GO" in body or "STOP-GO" in body:
        return "stop_go"
    if _PLACES.search(body):
        return "grid_penalty"
    if "NO FURTHER ACTION" in body or "NO FURTHER INVESTIGATION" in body:
        return "no_further_action"
    if "INVESTIGATED AFTER THE RACE" in body:
        return "investigation_after_race"
    if "UNDER INVESTIGATION" in body:
        return "investigation"
    if body.startswith("FIA STEWARDS: WARNING") or " WARNING FOR CAR" in body:
        return "warning"
    if "BLACK AND WHITE FLAG" in body:
        return "black_and_white_flag"
    if "DELETED" in body and "TRACK LIMITS" in body:
        return "lap_deleted"
    if "INCIDENT" in body and "NOTED" in body:
        return "noted"
    return None


def decision(message: dict[str, Any]) -> dict[str, Any] | None:
    """A structured record of one message, or None when it is no decision."""
    body = text(message.get("Message"))
    if body is None:
        return None
    upper = body.upper()
    kind = classify(upper)
    if kind is None:
        return None
    cars = _cars(upper)
    seconds = _SECONDS.search(upper)
    places = _PLACES.search(upper)
    turn = _TURN.search(upper.split(" - ")[0])
    return {
        "kind": kind,
        "cars": [{"number": number, "tla": tla} for number, tla in cars],
        "seconds": to_int(seconds.group(1))
        if seconds and kind != "lap_deleted"
        else None,
        "places": to_int(places.group(1)) if places else None,
        "turn": to_int(turn.group(1)) if turn else None,
        "reason": _reason(upper) if kind != "lap_deleted" else "TRACK LIMITS",
        "lap": to_int(message.get("Lap")),
        "utc": text(message.get("Utc")),
        "message": body,
    }


def _incident_key(record: dict[str, Any]) -> tuple[Any, ...]:
    """The same incident across "noted", "under investigation" and its outcome."""
    return (
        tuple(sorted(c["number"] for c in record["cars"])),
        record["turn"],
        record["reason"],
    )


@dataclass
class StewardsBook:
    """Everything decided in one session so far, updated one message at a time."""

    penalties: list[dict[str, Any]] = field(default_factory=list)
    incidents: dict[tuple[Any, ...], dict[str, Any]] = field(default_factory=dict)
    track_limits: dict[str, dict[str, Any]] = field(default_factory=dict)
    sectors: dict[int, str] = field(default_factory=dict)
    safety_car: str | None = None  # "deployed", "ending"
    virtual_safety_car: str | None = None
    last_message: dict[str, Any] | None = None
    seen: int = 0
    new_decisions: list[dict[str, Any]] = field(default_factory=list)

    def feed(self, message: dict[str, Any]) -> None:
        self.seen += 1
        self.last_message = message
        self._flags(message)
        record = decision(message)
        if record is None:
            return
        # The message's position in the session: automation events fire only for
        # messages past the persisted mark, so a restart never repeats one.
        record["index"] = self.seen - 1
        self.new_decisions.append(record)
        kind = record["kind"]
        if kind in PENALTIES:
            self.penalties.append({**record, "served": False})
            self._close_incident(record, kind)
        elif kind == "penalty_served":
            self._serve(record)
        elif kind in ("noted", "investigation", "investigation_after_race"):
            key = _incident_key(record)
            known = self.incidents.get(key)
            if known is None or known["status"] == "noted" or kind != "noted":
                self.incidents[key] = {**record, "status": kind}
        elif kind in ("no_further_action", "warning"):
            self._close_incident(record, kind)
        elif kind in ("lap_deleted", "black_and_white_flag"):
            for car in record["cars"]:
                entry = self.track_limits.setdefault(
                    car["number"], {**car, "deleted": 0, "black_and_white": False}
                )
                if kind == "lap_deleted":
                    entry["deleted"] += 1
                else:
                    entry["black_and_white"] = True

    def _close_incident(self, record: dict[str, Any], outcome: str) -> None:
        key = _incident_key(record)
        match = self.incidents.get(key)
        if match is None:
            # Penalties name only the penalised car: find the incident by it.
            number = record["cars"][0]["number"] if record["cars"] else None
            for other_key, incident in self.incidents.items():
                if (
                    incident["status"]
                    in (
                        "noted",
                        "investigation",
                        "investigation_after_race",
                    )
                    and number in {c["number"] for c in incident["cars"]}
                    and (
                        record["reason"] is None
                        or incident["reason"] == record["reason"]
                    )
                ):
                    key, match = other_key, incident
                    break
        if match is not None:
            self.incidents[key] = {**match, "status": outcome}

    def _serve(self, record: dict[str, Any]) -> None:
        number = record["cars"][0]["number"] if record["cars"] else None
        for penalty in self.penalties:
            if (
                not penalty["served"]
                and penalty["cars"]
                and penalty["cars"][0]["number"] == number
                and (
                    record["seconds"] is None or penalty["seconds"] == record["seconds"]
                )
            ):
                penalty["served"] = True
                return

    def _flags(self, message: dict[str, Any]) -> None:
        category = str(message.get("Category") or "")
        flag = str(message.get("Flag") or "").upper()
        scope = str(message.get("Scope") or "")
        body = str(message.get("Message") or "").upper()
        if category == "Flag":
            if scope == "Sector":
                sector = to_int(message.get("Sector"))
                if sector is None and (found := _SECTOR.search(body)):
                    sector = to_int(found.group(1))
                if sector is not None:
                    if flag in ("YELLOW", "DOUBLE YELLOW"):
                        self.sectors[sector] = (
                            "double_yellow" if flag == "DOUBLE YELLOW" else "yellow"
                        )
                    elif flag in ("CLEAR", "GREEN"):
                        self.sectors.pop(sector, None)
            elif scope == "Track" and flag in ("GREEN", "CLEAR", "CHEQUERED", "RED"):
                self.sectors.clear()
        elif category == "SafetyCar":
            mode = str(message.get("Mode") or "").upper()
            status = str(message.get("Status") or "").upper()
            virtual = mode.startswith("VIRTUAL") or "VIRTUAL" in body
            if status == "DEPLOYED":
                state = "deployed"
            elif status in ("ENDING", "IN THIS LAP"):
                state = "ending"
            else:
                state = None
            if virtual:
                self.virtual_safety_car = state
            else:
                self.safety_car = state

    def take_new(self) -> list[dict[str, Any]]:
        """Decisions fed since the last call, for the automation events."""
        new, self.new_decisions = self.new_decisions, []
        return new

    def summary(self, track: str | None) -> dict[str, Any]:
        """What the page and the entities show, reconciled with the track status:
        the status is F1's authority on the safety car, the messages add the
        "ending" phase and the sectors."""
        safety_car = None
        if track == "safety_car":
            safety_car = "ending" if self.safety_car == "ending" else "deployed"
        virtual = None
        if track == "virtual_safety_car":
            virtual = "deployed"
        elif track == "vsc_ending":
            virtual = "ending"
        sectors = (
            {}
            if track in ("clear", "red_flag", "chequered") and not self.sectors
            else dict(self.sectors)
        )
        open_incidents = [
            i
            for i in self.incidents.values()
            if i["status"] in ("noted", "investigation", "investigation_after_race")
        ]
        closed = [i for i in self.incidents.values() if i not in open_incidents]
        return {
            "safety_car": safety_car,
            "virtual_safety_car": virtual,
            "red_flag": track == "red_flag",
            "yellow_sectors": [
                {"sector": s, "flag": f} for s, f in sorted(sectors.items())
            ],
            "yellow": track == "yellow" or bool(sectors),
            "double_yellow": any(f == "double_yellow" for f in sectors.values()),
            "penalties": list(reversed(self.penalties)),
            "investigations": list(reversed(open_incidents)),
            "decided": list(reversed(closed))[:20],
            "track_limits": sorted(
                self.track_limits.values(),
                key=lambda e: (-e["deleted"], e["tla"]),
            ),
        }


def penalty_seconds(summary: dict[str, Any]) -> dict[str, int]:
    """Time penalties not yet served, per racing number, for the tower's badge."""
    out: dict[str, int] = {}
    for penalty in summary["penalties"]:
        if (
            penalty["kind"] == "time_penalty"
            and not penalty["served"]
            and penalty["cars"]
        ):
            number = penalty["cars"][0]["number"]
            out[number] = out.get(number, 0) + (penalty["seconds"] or 0)
    return out


def book_from(messages: list[Any]) -> StewardsBook:
    """A book of a whole list (history, tests)."""
    book = StewardsBook()
    for message in messages:
        if isinstance(message, dict):
            book.feed(message)
    book.take_new()
    return book
