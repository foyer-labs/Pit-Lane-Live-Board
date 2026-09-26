"""Check the real sources still speak the formats the code expects (SPEC §13).

Manual, never in CI: it makes real requests. Run it before each release and when
something looks wrong after F1 or Jolpica changed something.

    python scripts/contract_check.py

Standard library only. Exits 1 when any check drifts.
"""

from __future__ import annotations

from datetime import UTC, datetime
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
    LIVE_BASE,
    USER_AGENT,
)

RESULTS: list[tuple[str, bool, str]] = []


def fetch(url: str, method: str = "GET") -> tuple[int, bytes]:
    request = urllib.request.Request(
        url, method=method, headers={"User-Agent": USER_AGENT}
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as err:
        return err.code, err.read()


def check(name: str, ok: bool, detail: str = "") -> None:
    RESULTS.append((name, ok, detail))
    print(f"{'OK   ' if ok else 'DRIFT'} {name}{': ' + detail if detail else ''}")


def jolpica(path: str) -> dict:
    time.sleep(0.6)  # stay well inside Jolpica's burst limit
    status, body = fetch(f"{JOLPICA_BASE}{path}.json")
    if status != 200:
        raise RuntimeError(f"HTTP {status}")
    return json.loads(body)["MRData"]


def main() -> int:
    year = datetime.now(UTC).year

    races = jolpica(str(year))["RaceTable"]["Races"]
    first = races[0]
    check(
        "Jolpica schedule",
        bool(races) and {"round", "raceName", "date", "Circuit"} <= set(first),
        f"{len(races)} rounds",
    )
    check("Jolpica session times", "time" in first and "Qualifying" in first)

    results = jolpica(f"{year}/last/results")["RaceTable"]["Races"]
    row = results[0]["Results"][0] if results else {}
    check(
        "Jolpica results",
        {"position", "grid", "points", "Driver", "Constructor"} <= set(row),
    )

    standings = jolpica(f"{year}/driverstandings")["StandingsTable"]["StandingsLists"]
    check("Jolpica standings", bool(standings) and "DriverStandings" in standings[0])

    status, body = fetch(f"{ARCHIVE_BASE}{year}/Index.json")
    check("Archive season index", status == 200, f"HTTP {status}")
    if status == 200:
        index = json.loads(body.decode("utf-8-sig"))
        sessions = [
            s for m in index["Meetings"] for s in m["Sessions"] if s.get("Path")
        ]
        last = sessions[-1]
        check(
            "Archive session fields",
            {"Type", "Name", "StartDate", "GmtOffset", "Path"} <= set(last),
        )
        status, body = fetch(f"{ARCHIVE_BASE}{last['Path']}Index.json")
        feeds = (
            json.loads(body.decode("utf-8-sig")).get("Feeds", {})
            if status == 200
            else {}
        )
        wanted = {"TimingData", "TimingAppData", "DriverList", "RaceControlMessages"}
        check(
            "Archive session feeds",
            wanted <= set(feeds),
            ", ".join(sorted(wanted - set(feeds))),
        )
        status, _ = fetch(f"{ARCHIVE_BASE}{last['Path']}NoSuchFile.json")
        check("Archive missing files answer 403", status == 403, f"HTTP {status}")

    status, _ = fetch(f"{LIVE_BASE}/negotiate?negotiateVersion=1", method="POST")
    check("Live timing negotiate", status == 200, f"HTTP {status}")

    drifted = [name for name, ok, _ in RESULTS if not ok]
    print(f"\n{len(RESULTS) - len(drifted)}/{len(RESULTS)} checks match.")
    return 1 if drifted else 0


if __name__ == "__main__":
    sys.exit(main())
