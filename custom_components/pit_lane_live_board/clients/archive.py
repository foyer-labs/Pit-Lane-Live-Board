"""F1's session archive: history detail, final states and track outlines
(SPEC §4.3, §6.5, §7.1, §7.3).

Each file is downloaded once and parsed from memory: nothing raw is written to disk
(an SD card on a Raspberry Pi is slow and wears). Only compact derived forms stay in
the cache: a race's detail is ~250 KB, its raw streams several MB.
"""

from __future__ import annotations

import asyncio
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
import io
import json
import logging
from typing import Any

import aiohttp

from ..cache import DiskCache
from ..const import ARCHIVE_BASE, USER_AGENT
from ..core.archive_parse import decode_z, iter_stream
from ..core.history import build_detail
from ..core.live_state import PUBLIC_TOPICS
from ..core.outline import Outline, build_outline, position_samples
from ..core.schedule import Meeting, Session, feed_start
from ..core.session import session_kind
from ..core.values import to_int
from .http import Executor, InFlight, SourceError

_LOGGER = logging.getLogger(__name__)

TIMEOUT = aiohttp.ClientTimeout(total=120)
FIRST_ARCHIVED_SEASON = 2018
INDEX_MAX_AGE = 10 * 60
PAST_INDEX_MAX_AGE = 30 * 24 * 3600
OUTLINE_YEARS_BACK = 3
MEETING_WINDOW = timedelta(days=3)

DETAIL_STREAMS = ("TimingData", "WeatherData", "PitLaneTimeCollection")
DETAIL_KEYFRAMES = ("TimingAppData", "DriverList", "RaceControlMessages", "LapSeries")
# The final state of a session, for the Live page after it (SPEC §7.1): the topics'
# keyframes, which in the archive hold each topic's state at the end.
FINAL_KEYFRAMES = tuple(t for t in PUBLIC_TOPICS if t not in ("Heartbeat",))


def _lines(data: bytes | None) -> Iterator[str]:
    if data is None:
        return iter(())
    return io.TextIOWrapper(io.BytesIO(data), encoding="utf-8-sig")


# The TimingData lines the lap collector reads; the rest (segments, speed traps,
# gaps) is more than half of a race's 64,000 lines.
TIMING_WORDS = ("NumberOfLaps", "LastLapTime", "InPit", "PitOut", '"Value"')


def _stream(data: bytes | None, keep: tuple[str, ...] | None = None) -> Iterator[Any]:
    for _, payload in iter_stream(_lines(data), keep):
        yield payload


def _keyframe(data: bytes | None) -> Any:
    if data is None:
        return None
    try:
        return json.loads(data.decode("utf-8-sig"))
    except ValueError:
        return None


def _our_kind(entry: dict[str, Any]) -> str:
    """Our session kind for an archive entry (practice keeps its number)."""
    kind = str(session_kind(entry))
    if kind == "practice":
        number = to_int(entry.get("Number"))
        return f"practice_{number}" if number else "practice"
    return kind


class ArchiveClient:
    def __init__(
        self, session: aiohttp.ClientSession, cache: DiskCache, run: Executor
    ) -> None:
        self._session = session
        self._cache = cache
        self._run = run
        self.last_error: str | None = None
        self._inflight = InFlight()

    async def _download(self, url: str) -> bytes | None:
        """The file's bytes, or None when the archive does not have it (403)."""
        try:
            async with self._session.get(
                url, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT
            ) as response:
                if response.status in (403, 404):
                    return None
                if response.status != 200:
                    self.last_error = f"http {response.status}"
                    raise SourceError(f"archive answered {response.status} for {url}")
                data = await response.read()
        except (aiohttp.ClientError, TimeoutError) as err:
            self.last_error = type(err).__name__
            raise SourceError(f"archive unreachable: {err}") from err
        self.last_error = None
        return data

    async def _json(self, relative: str, max_age: float | None) -> Any:
        key = f"archive/{relative}"
        cached = await self._run(self._cache.read_json, key, max_age)
        if cached is not None:
            return cached
        try:
            data = await self._download(ARCHIVE_BASE + relative)
        except SourceError:
            stale = await self._run(self._cache.read_json, key, None)
            if stale is not None:
                return stale
            raise
        if data is None:
            return None
        value = _keyframe(data)
        if value is None:
            return None
        await self._run(self._cache.write_json, key, value)
        return value

    async def season_index(self, year: int) -> Any:
        if year < FIRST_ARCHIVED_SEASON:
            return None
        current = year >= datetime.now(UTC).year
        return await self._json(
            f"{year}/Index.json", INDEX_MAX_AGE if current else PAST_INDEX_MAX_AGE
        )

    async def session_path(
        self, meetings: list[Meeting], session: Session
    ) -> str | None:
        """The archive path of one of our sessions; remembered once found.

        The weekend is matched first (the archive meeting whose sessions fall
        within three days of ours), then the session by kind: Jolpica's times can
        be a day off (Las Vegas 2024 mixes a local date with a UTC time), and old
        seasons carry dates without times.
        """
        remembered = await self._run(self._cache.read_json, f"path/{session.key}", None)
        if isinstance(remembered, dict) and remembered.get("path"):
            return str(remembered["path"])
        meeting = next((m for m in meetings if session in m.sessions), None)
        if meeting is None:
            return None
        anchor = meeting.race or meeting.sessions[-1]
        day = anchor.start or datetime.combine(anchor.day, datetime.min.time(), UTC)
        index = await self.season_index(day.year)
        best: tuple[timedelta, dict[str, Any]] | None = None
        for candidate in (index or {}).get("Meetings") or []:
            entries = [e for e in candidate.get("Sessions") or [] if e.get("Path")]
            starts = [s for e in entries if (s := feed_start(e)) is not None]
            if not starts:
                continue
            distance = min(abs(s - day) for s in starts)
            if distance <= MEETING_WINDOW and (best is None or distance < best[0]):
                best = (distance, candidate)
        if best is None:
            return None
        for entry in best[1].get("Sessions") or []:
            if entry.get("Path") and _our_kind(entry) == session.kind:
                path = str(entry["Path"])
                await self._run(
                    self._cache.write_json, f"path/{session.key}", {"path": path}
                )
                return path
        return None

    async def _files(self, path: str, names: list[str]) -> dict[str, bytes | None]:
        """Download several files of one session at once."""
        results = await asyncio.gather(
            *(self._download(f"{ARCHIVE_BASE}{path}{name}") for name in names)
        )
        return dict(zip(names, results, strict=True))

    async def detail(self, meetings: list[Meeting], session: Session) -> Any:
        """The derived detail of a 2018+ session, or None when not archived."""
        path = await self.session_path(meetings, session)
        if path is None:
            return None
        return await self._inflight.run(f"detail {path}", lambda: self._detail(path))

    async def _detail(self, path: str) -> Any:
        key = f"detail/{path}"
        cached = await self._run(self._cache.read_json, key, None)
        if cached is not None:
            return cached
        index = await self._json(f"{path}Index.json", None)
        if not index:
            # Not published yet (0-30 min after a session): nothing to cache.
            return None
        feeds = index.get("Feeds") or {}
        wanted = [f"{n}.jsonStream" for n in DETAIL_STREAMS if n in feeds] + [
            f"{n}.json" for n in DETAIL_KEYFRAMES if n in feeds
        ]
        files = await self._files(path, wanted)
        # A feed the index lists but that could not be read (a half-uploaded batch)
        # would freeze a gap forever: only a complete detail is kept.
        complete = all(files[name] is not None for name in wanted)
        detail = await self._run(self._build_detail, files)
        detail["session_path"] = path
        if complete:
            await self._run(self._cache.write_json, key, detail)
        return detail

    @staticmethod
    def _build_detail(files: dict[str, bytes | None]) -> dict[str, Any]:
        return build_detail(
            timing_stream=_stream(files.get("TimingData.jsonStream"), TIMING_WORDS),
            app_keyframe=_keyframe(files.get("TimingAppData.json")),
            driver_list=_keyframe(files.get("DriverList.json")),
            rcm_keyframe=_keyframe(files.get("RaceControlMessages.json")),
            weather_stream=_stream(files.get("WeatherData.jsonStream")),
            pit_stream=_stream(files.get("PitLaneTimeCollection.jsonStream")),
            lap_series=_keyframe(files.get("LapSeries.json")),
        )

    async def final_state(
        self, meetings: list[Meeting], session: Session
    ) -> dict[str, Any] | None:
        """The topics at the end of a session, and its pit lane times: what the
        Live page shows after it. None while the archive has not published it."""
        path = await self.session_path(meetings, session)
        if path is None:
            return None
        return await self._inflight.run(f"final {path}", lambda: self._final(path))

    async def _final(self, path: str) -> dict[str, Any] | None:
        key = f"final/{path}"
        cached = await self._run(self._cache.read_json, key, None)
        if cached is not None:
            return cached
        index = await self._json(f"{path}Index.json", None)
        if not index:
            return None
        feeds = index.get("Feeds") or {}
        wanted = [f"{n}.json" for n in FINAL_KEYFRAMES if n in feeds]
        if "PitLaneTimeCollection" in feeds:
            wanted.append("PitLaneTimeCollection.jsonStream")
        files = await self._files(path, wanted)
        topics = {
            name.removesuffix(".json"): value
            for name, data in files.items()
            if name.endswith(".json") and (value := _keyframe(data)) is not None
        }
        pits: list[Any] = list(_stream(files.get("PitLaneTimeCollection.jsonStream")))
        final = {"path": path, "topics": topics, "pit_stream": pits}
        if all(files[name] is not None for name in wanted):
            await self._run(self._cache.write_json, key, final)
        return final

    async def outline(self, circuit_key: int, before: datetime) -> Outline | None:
        """The circuit's outline, drawn once per circuit and kept (SPEC §6.5)."""
        key = f"outline/{circuit_key}"
        cached = await self._run(self._cache.read_json, key, None)
        if cached is not None:
            return Outline.from_dict(cached)
        return await self._inflight.run(
            key, lambda: self._outline(key, circuit_key, before)
        )

    async def _outline(
        self, key: str, circuit_key: int, before: datetime
    ) -> Outline | None:
        source = await self._outline_source(circuit_key, before)
        if source is None:
            return None
        data = await self._download(f"{ARCHIVE_BASE}{source}Position.z.jsonStream")
        if data is None:
            return None
        outline = await self._run(self._build_outline, data)
        if outline is not None:
            await self._run(self._cache.write_json, key, outline.to_dict())
        return outline

    @staticmethod
    def _build_outline(data: bytes) -> Outline | None:
        def samples() -> Iterator[tuple[str, float, float, bool]]:
            for payload in _stream(data):
                yield from position_samples(decode_z(payload))

        return build_outline(samples())

    async def _outline_source(self, circuit_key: int, before: datetime) -> str | None:
        """The latest qualifying at this circuit (a race is three times bigger and
        draws the same circuit), else the latest race."""
        best: tuple[int, datetime, str] | None = None
        for year in range(before.year, before.year - OUTLINE_YEARS_BACK - 1, -1):
            index = await self.season_index(year)
            for meeting in (index or {}).get("Meetings") or []:
                circuit = meeting.get("Circuit") or {}
                if circuit.get("Key") != circuit_key:
                    continue
                for entry in meeting.get("Sessions") or []:
                    start = feed_start(entry)
                    kind = entry.get("Type")
                    if (
                        not entry.get("Path")
                        or kind not in ("Race", "Qualifying")
                        or start is None
                        or start >= before - timedelta(hours=1)
                    ):
                        continue
                    rank = 1 if kind == "Qualifying" else 0
                    if best is None or (rank, start) > (best[0], best[1]):
                        best = (rank, start, entry["Path"])
            if best is not None:
                break
        return best[2] if best else None
