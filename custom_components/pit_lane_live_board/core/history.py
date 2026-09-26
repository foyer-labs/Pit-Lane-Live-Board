"""History detail from the archive, 2018 onwards (SPEC §7.3).

The archive's `.json` keyframes hold each topic's final state; laps need the
`TimingData` stream replayed. Everything here turns those into the compact form the
cache keeps and the Results page shows: lap times with sectors and tyres, tyre
strategy, race control, weather and pit lane times.

Personal and overall bests are computed here from the laps, not taken from F1's
flags, which describe the moment they were sent rather than the finished session.
"""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from .merge import merge
from .panels import race_control
from .timing import COMPOUNDS
from .values import colour, lap_ms, text, to_bool, to_float, to_int


def _items(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    if isinstance(value, dict):
        return [value[k] for k in sorted(value, key=lambda k: to_int(k) or 0)]
    return []


class LapCollector:
    """Replays `TimingData` deltas and records each completed lap per driver.

    A lap completes when `NumberOfLaps` rises. The sector values seen since the
    previous lap belong to it; F1 sends sector 3 in the same message that closes
    the lap, so sectors are applied before the lap count.
    """

    def __init__(self) -> None:
        self.laps: dict[str, list[dict[str, Any]]] = {}
        self._lines: dict[str, Any] = {}
        self._sectors: dict[str, list[str | None]] = {}
        self._flags: dict[str, dict[str, bool]] = {}

    def feed(self, payload: Any) -> None:
        lines = payload.get("Lines") if isinstance(payload, dict) else None
        if not isinstance(lines, dict):
            return
        for number, delta in lines.items():
            if isinstance(delta, dict):
                self._feed_line(str(number), delta)

    def _feed_line(self, number: str, delta: dict[str, Any]) -> None:
        before = self._lines.get(number, {})
        # merge() updates `before` in place: read what it said first.
        seen_before = bool(before)
        laps_before = to_int(before.get("NumberOfLaps"))
        was_in_pit = to_bool(before.get("InPit"))
        was_pit_out = to_bool(before.get("PitOut"))
        line = merge(before, delta)
        self._lines[number] = line

        sectors = self._sectors.setdefault(number, [None, None, None])
        raw_sectors = delta.get("Sectors")
        for index, sector in _indexed(raw_sectors):
            if index < 3 and isinstance(sector, dict) and text(sector.get("Value")):
                sectors[index] = text(sector.get("Value"))

        # Only a change counts, and only once the car has a lap count: before the
        # start the cars go in and out of the pit lane to reach the grid, and that
        # is not a pit stop on lap 1.
        flags = self._flags.setdefault(number, {"pit_in": False, "pit_out": False})
        counting = seen_before and laps_before is not None
        if counting and to_bool(line.get("InPit")) and not was_in_pit:
            flags["pit_in"] = True
        if counting and to_bool(line.get("PitOut")) and not was_pit_out:
            flags["pit_out"] = True

        laps_now = to_int(line.get("NumberOfLaps"))
        if laps_now is None or laps_now == laps_before or laps_now < 1:
            return
        last = line.get("LastLapTime")
        self.laps.setdefault(number, []).append(
            {
                "lap": laps_now,
                "time": text(last.get("Value")) if isinstance(last, dict) else None,
                "sectors": list(sectors),
                "pit_in": flags["pit_in"],
                "pit_out": flags["pit_out"],
            }
        )
        self._sectors[number] = [None, None, None]
        self._flags[number] = {"pit_in": False, "pit_out": False}


def _indexed(value: Any) -> list[tuple[int, Any]]:
    if isinstance(value, list):
        return list(enumerate(value))
    if isinstance(value, dict):
        out = []
        for key, item in value.items():
            index = to_int(key)
            if index is not None:
                out.append((index, item))
        return out
    return []


def stints(app_keyframe: Any) -> dict[str, list[dict[str, Any]]]:
    """Each driver's stints with the laps they cover, from `TimingAppData`."""
    lines = app_keyframe.get("Lines") if isinstance(app_keyframe, dict) else None
    out: dict[str, list[dict[str, Any]]] = {}
    if not isinstance(lines, dict):
        return out
    for number, line in lines.items():
        if not isinstance(line, dict):
            continue
        first_lap = 1
        driver_stints = []
        for stint in _items(line.get("Stints")):
            if not isinstance(stint, dict):
                continue
            total = to_int(stint.get("TotalLaps")) or 0
            start = to_int(stint.get("StartLaps")) or 0
            laps = max(total - start, 0)
            compound = str(stint.get("Compound") or "").lower()
            driver_stints.append(
                {
                    "compound": compound if compound in COMPOUNDS else "unknown",
                    "new": to_bool(stint.get("New")),
                    "start_lap": first_lap,
                    "end_lap": first_lap + laps - 1,
                    "start_age": start,
                }
            )
            first_lap += laps
        out[str(number)] = driver_stints
    return out


def _tyre_on(
    stint_list: list[dict[str, Any]], lap: int
) -> tuple[str | None, int | None]:
    for stint in stint_list:
        if stint["start_lap"] <= lap <= stint["end_lap"]:
            return stint["compound"], stint["start_age"] + lap - stint["start_lap"] + 1
    return None, None


def _mark_bests(laps: dict[str, list[dict[str, Any]]]) -> None:
    """Flag personal and overall best laps and sectors."""
    overall_lap = min(
        (t for ls in laps.values() for lap in ls if (t := lap_ms(lap["time"]))),
        default=None,
    )
    overall_sector = [
        min(
            (
                t
                for ls in laps.values()
                for lap in ls
                if (t := lap_ms(lap["sectors"][i]))
            ),
            default=None,
        )
        for i in range(3)
    ]
    for driver_laps in laps.values():
        personal_lap = min(
            (t for lap in driver_laps if (t := lap_ms(lap["time"]))), default=None
        )
        personal_sector = [
            min(
                (t for lap in driver_laps if (t := lap_ms(lap["sectors"][i]))),
                default=None,
            )
            for i in range(3)
        ]
        for lap in driver_laps:
            ms = lap_ms(lap["time"])
            lap["best"] = (
                "overall"
                if ms is not None and ms == overall_lap
                else "personal"
                if ms is not None and ms == personal_lap
                else None
            )
            marks = []
            for i in range(3):
                sms = lap_ms(lap["sectors"][i])
                marks.append(
                    "overall"
                    if sms is not None and sms == overall_sector[i]
                    else "personal"
                    if sms is not None and sms == personal_sector[i]
                    else None
                )
            lap["sector_bests"] = marks


def drivers(driver_list: Any) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    if not isinstance(driver_list, dict):
        return out
    for number, d in driver_list.items():
        if not isinstance(d, dict):
            continue
        first, last = text(d.get("FirstName")), text(d.get("LastName"))
        out[str(number)] = {
            "number": str(number),
            "tla": text(d.get("Tla")) or str(number),
            "name": f"{first} {last}" if first and last else text(d.get("FullName")),
            "team": text(d.get("TeamName")),
            "colour": colour(d.get("TeamColour")),
        }
    return out


def weather_summary(samples: Iterable[Any]) -> dict[str, Any] | None:
    """Start, end, minimum and maximum of air and track temperature; any rain."""
    air: list[float] = []
    track: list[float] = []
    rain = False
    for sample in samples:
        if not isinstance(sample, dict):
            continue
        if (a := to_float(sample.get("AirTemp"))) is not None:
            air.append(a)
        if (t := to_float(sample.get("TrackTemp"))) is not None:
            track.append(t)
        rain = rain or to_bool(sample.get("Rainfall"))
    if not air and not track:
        return None

    def span(values: list[float]) -> dict[str, float] | None:
        if not values:
            return None
        return {
            "start": values[0],
            "end": values[-1],
            "min": min(values),
            "max": max(values),
        }

    return {"air": span(air), "track": span(track), "rain": rain}


def pit_lane_times(messages: Iterable[Any]) -> list[dict[str, Any]]:
    """Every pit lane time sent during the session, in order."""
    seen: set[tuple[str, str]] = set()
    out = []
    for payload in messages:
        times = payload.get("PitTimes") if isinstance(payload, dict) else None
        if not isinstance(times, dict):
            continue
        for key, entry in times.items():
            if key == "_deleted" or not isinstance(entry, dict):
                continue
            number = str(entry.get("RacingNumber") or key)
            lap = str(entry.get("Lap") or "")
            duration = text(str(entry.get("Duration") or ""))
            if not lap or duration is None or (number, lap) in seen:
                continue
            seen.add((number, lap))
            out.append({"number": number, "lap": to_int(lap), "duration": duration})
    return out


def build_detail(
    *,
    timing_stream: Iterable[Any],
    app_keyframe: Any,
    driver_list: Any,
    rcm_keyframe: Any,
    weather_stream: Iterable[Any],
    pit_stream: Iterable[Any],
) -> dict[str, Any]:
    """The compact detail of one archived session, ready to cache and to send."""
    collector = LapCollector()
    for payload in timing_stream:
        collector.feed(payload)
    strategy = stints(app_keyframe)
    for number, driver_laps in collector.laps.items():
        for lap in driver_laps:
            compound, age = _tyre_on(strategy.get(number, []), lap["lap"])
            lap["compound"] = compound
            lap["tyre_age"] = age
    _mark_bests(collector.laps)
    return {
        "drivers": drivers(driver_list),
        "laps": collector.laps,
        "stints": strategy,
        "race_control": race_control({"RaceControlMessages": rcm_keyframe}),
        "weather": weather_summary(weather_stream),
        "pit_lane": pit_lane_times(pit_stream),
    }
