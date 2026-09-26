"""Build the bench's data from the real sources, through the backend's own code.

The bench (bench/index.html) shows the real panel with a fake `hass`. Its answers
are the exact payloads the WebSocket commands would send, computed here with the
same core/ functions from real Jolpica and archive data, at a fixed moment: the
2026 Spanish Grand Prix, lap 34. They land in bench/data/ (git-ignored): the
repository carries no F1 data (decision 27).

    python scripts/bench_data.py
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
import json
from pathlib import Path
import sys
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from custom_components.pit_lane_live_board.const import (  # noqa: E402
    ARCHIVE_BASE,
    JOLPICA_BASE,
    USER_AGENT,
)
from custom_components.pit_lane_live_board.core import live_view, pages  # noqa: E402
from custom_components.pit_lane_live_board.core.archive_parse import (  # noqa: E402
    decode_z,
    iter_stream,
)
from custom_components.pit_lane_live_board.core.history import (  # noqa: E402
    build_detail,
)
from custom_components.pit_lane_live_board.core.jolpica_parse import (  # noqa: E402
    add_changes,
    parse_laps,
    parse_pitstops,
    parse_qualifying,
    parse_results,
    parse_season_races,
    parse_sprint,
    parse_standings,
)
from custom_components.pit_lane_live_board.core.live_state import (  # noqa: E402
    PUBLIC_TOPICS,
    LiveState,
)
from custom_components.pit_lane_live_board.core.outline import (  # noqa: E402
    build_outline,
    position_samples,
)
from custom_components.pit_lane_live_board.core.schedule import (  # noqa: E402
    next_session,
    parse_schedule,
)

SEASON = 2026
ROUND = 14
RACE = "2026/2026-09-13_Spanish_Grand_Prix/2026-09-13_Race/"
QUALI = "2026/2026-09-13_Spanish_Grand_Prix/2026-09-12_Qualifying/"
NOW = datetime(2026, 9, 13, 14, 0, tzinfo=UTC)
RACE_OFFSET_MS = 2 * 3600 * 1000 - 10 * 60 * 1000  # about lap 34
QUALI_OFFSET_MS = 60 * 60 * 1000 + 8 * 60 * 1000  # early Q3
CACHE = ROOT / ".dev-cache"
OUT = ROOT / "bench" / "data"


def get(url: str) -> bytes:
    key = (
        CACHE
        / "bench"
        / url.replace("https://", "").replace("/", "_").replace("?", "_")
    )
    if key.exists():
        return key.read_bytes()
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=120) as response:
        data = response.read()
    key.parent.mkdir(parents=True, exist_ok=True)
    key.write_bytes(data)
    time.sleep(0.6)  # inside Jolpica's burst limit
    return data


def jolpica(path: str, offset: int = 0) -> dict:
    return json.loads(get(f"{JOLPICA_BASE}{path}.json?limit=100&offset={offset}"))


def jolpica_all(path: str) -> list[dict]:
    first = jolpica(path)
    pages_ = [first]
    total = int(first["MRData"]["total"])
    offset = 100
    while offset < total:
        pages_.append(jolpica(path, offset))
        offset += 100
    return pages_


def archive_stream(path: str, topic: str):
    try:
        text = get(f"{ARCHIVE_BASE}{path}{topic}.jsonStream").decode("utf-8-sig")
    except urllib.error.HTTPError:
        return []
    return list(iter_stream(text.splitlines()))


def archive_json(path: str, topic: str):
    try:
        return json.loads(get(f"{ARCHIVE_BASE}{path}{topic}.json").decode("utf-8-sig"))
    except urllib.error.HTTPError:
        return None


def write(name: str, value) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"{name}.json").write_text(
        json.dumps(value, ensure_ascii=False), encoding="utf-8"
    )
    print(f"  {name}")


def replay(path: str, until_ms: int, positions: bool = False):
    state = LiveState()
    messages = []
    for topic in PUBLIC_TOPICS:
        messages += [(o, topic, p) for o, p in archive_stream(path, topic)]
    if positions:
        messages += [
            (o, "Position.z", p) for o, p in archive_stream(path, "Position.z")
        ]
    messages.sort(key=lambda m: m[0])
    for offset, topic, payload in messages:
        if offset > until_ms:
            break
        state.apply(topic, payload)
    return state


def main() -> None:
    print("Calendar and results")
    meetings = parse_schedule(jolpica(str(SEASON)))
    hidden: frozenset[str] = frozenset()
    podiums: dict[int, list] = {}
    for place in (1, 2, 3):
        for race in parse_season_races(jolpica(f"{SEASON}/results/{place}")):
            if race["round"] < ROUND and race["winner"]:
                podiums.setdefault(race["round"], []).append(race["winner"])
    write("calendar", pages.calendar_page(meetings, NOW, hidden, podiums))
    winners = [
        w
        for w in parse_season_races(jolpica(f"{SEASON}/results/1"))
        if w["round"] <= ROUND
    ]
    write("rounds", pages.season_rounds(SEASON, meetings, winners, hidden))
    write("seasons", {"seasons": list(range(SEASON, 1949, -1))})

    results = parse_results(jolpica(f"{SEASON}/{ROUND}/results"))
    rows = results["rows"]
    write(
        "detail_race",
        {"tab": "race", "hidden": False, "available": True, "data": results},
    )
    write(
        "detail_qualifying",
        {
            "tab": "qualifying",
            "hidden": False,
            "available": True,
            "data": parse_qualifying(jolpica(f"{SEASON}/{ROUND}/qualifying")),
        },
    )
    write(
        "detail_sprint",
        {
            "tab": "sprint",
            "hidden": False,
            "available": False,
            "data": parse_sprint(jolpica(f"{SEASON}/{ROUND}/sprint")),
        },
    )
    write(
        "detail_lap_chart",
        {
            "tab": "lap_chart",
            "hidden": False,
            "available": True,
            "data": pages.lap_chart(
                parse_laps(jolpica_all(f"{SEASON}/{ROUND}/laps")), rows
            ),
        },
    )
    write(
        "detail_pit_stops",
        {
            "tab": "pit_stops",
            "hidden": False,
            "available": True,
            "data": pages.pit_stops(
                parse_pitstops(jolpica(f"{SEASON}/{ROUND}/pitstops")), rows
            ),
        },
    )

    print("Archive detail")
    detail = build_detail(
        timing_stream=(p for _, p in archive_stream(RACE, "TimingData")),
        app_keyframe=archive_json(RACE, "TimingAppData"),
        driver_list=archive_json(RACE, "DriverList"),
        rcm_keyframe=archive_json(RACE, "RaceControlMessages"),
        weather_stream=(p for _, p in archive_stream(RACE, "WeatherData")),
        pit_stream=(p for _, p in archive_stream(RACE, "PitLaneTimeCollection")),
    )
    for tab, data in (
        ("strategy", pages.strategy(detail, rows)),
        ("lap_times", pages.lap_times(detail, rows)),
        ("race_control", pages.race_control_tab(detail)),
        ("weather", pages.weather_tab(detail)),
    ):
        write(
            f"detail_{tab}",
            {"tab": tab, "hidden": False, "available": True, "data": data},
        )

    print("Standings")
    for kind, api_kind in (("drivers", "driver"), ("constructors", "constructor")):
        now = parse_standings(jolpica(f"{SEASON}/{ROUND}/{api_kind}standings"))
        add_changes(
            now, parse_standings(jolpica(f"{SEASON}/{ROUND - 1}/{api_kind}standings"))
        )
        write(f"standings_{kind}", pages.standings_page(now, ROUND, False))

    print("Live")
    upcoming = next_session(meetings, NOW + timedelta(hours=3))
    meeting, session = upcoming
    next_dict = {
        "meeting": meeting.name,
        "round": meeting.round,
        "season": meeting.season,
        "circuit": meeting.circuit,
        "country": meeting.country,
        **session.to_dict(),
    }
    race_state = replay(RACE, RACE_OFFSET_MS, positions=True)
    common = {
        "now": NOW,
        "syncing": False,
        "hidden": False,
        "delay": 45,
        "next_session": next_dict,
        "data_age": 0.4,
    }
    write(
        "live_race",
        live_view.build(state=race_state, health="ok", map_available=True, **common),
    )
    write(
        "live_stale",
        live_view.build(
            state=race_state,
            health="stale",
            map_available=True,
            **{**common, "data_age": 38.0},
        ),
    )
    quali_state = replay(QUALI, QUALI_OFFSET_MS)
    write(
        "live_qualifying",
        live_view.build(state=quali_state, health="ok", map_available=False, **common),
    )
    write(
        "live_idle",
        live_view.build(state=None, health="lost", map_available=False, **common),
    )
    write(
        "live_hidden",
        live_view.build(
            state=race_state,
            health="ok",
            map_available=False,
            **{**common, "hidden": True},
        ),
    )

    print("Map")
    samples = []
    for _, payload in archive_stream(QUALI, "Position.z"):
        samples += position_samples(decode_z(payload))
    outline = build_outline(samples)
    cars = [
        {
            "number": n,
            "x": outline.project(p.x, p.y)[0],
            "y": outline.project(p.x, p.y)[1],
            "on_track": p.on_track,
        }
        for n, p in race_state.positions.items()
    ]
    write(
        "map",
        {"outline": outline.to_dict(), "cars": cars, "utc": race_state.positions_utc},
    )
    print(f"Done: {OUT}")


if __name__ == "__main__":
    main()
