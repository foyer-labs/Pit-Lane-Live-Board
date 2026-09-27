"""F1's session archive: history detail, final states and track outlines
(SPEC §4.3, §6.5, §7.1, §7.3).

Each file is downloaded once and parsed from memory: nothing raw is written to disk
(an SD card on a Raspberry Pi is slow and wears). Only compact derived forms stay in
the cache: a race's detail is ~250 KB, its raw streams several MB.

The archive has no rate limit of its own, so we keep one (INV-4): at most
`CONCURRENT_BUILDS` sessions are downloaded and parsed at a time (each holds its raw
files in memory), a file past `MAX_FILE_BYTES` is refused, and an answer the archive
does not have, or only partly has, is remembered for a while instead of being asked
for again on every page open.

Derived entries carry a format version in their key. Bump it whenever what
`core/history.py`, `core/outline.py` or the path matching produce changes: entries of
the old format are then deleted, and every race opened before gets the fix.
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

# The formats of the derived entries (see the module docstring).
DETAIL_VERSION = "v2"
FINAL_VERSION = "v2"
OUTLINE_VERSION = "v2"
PATH_VERSION = "v2"

# A race's TimingData is ~7 MB and its Position.z ~9 MB.
MAX_FILE_BYTES = 48 * 1024 * 1024
CONCURRENT_BUILDS = 2
# A session is "recent" while the archive may still be publishing it (0-30 min
# after it ends, SPEC §4.3): what is missing then may appear soon.
RECENT = timedelta(days=2)
MISSING_RECENT = 5 * 60
MISSING_PAST = 7 * 24 * 3600
# A detail with a listed feed missing: kept briefly, not for good (it would freeze
# a gap), but not rebuilt from several megabytes on every open either.
PARTIAL_RECENT = 5 * 60
PARTIAL_PAST = 24 * 3600
# A final state is read only while its session is the last one finished.
FINAL_MAX_AGE = 30 * 24 * 3600
# The archive's own index files are needed only until the derived entries exist.
ARCHIVE_FILE_MAX_AGE = 60 * 24 * 3600

DETAIL_STREAMS = ("TimingData", "WeatherData", "PitLaneTimeCollection")
DETAIL_KEYFRAMES = ("TimingAppData", "DriverList", "RaceControlMessages", "LapSeries")
# Without a session index (2018: most races answer 403 for it, while every feed is
# there), a detail needs at least these to be worth keeping.
DETAIL_REQUIRED = ("TimingData.jsonStream", "TimingAppData.json")
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
    except (ValueError, RecursionError):
        return None


def _dicts(value: Any) -> list[dict[str, Any]]:
    """The dicts in what should be a list of them."""
    return [v for v in value if isinstance(v, dict)] if isinstance(value, list) else []


def _our_kind(entry: dict[str, Any]) -> str:
    """Our session kind for an archive entry (practice keeps its number)."""
    kind = str(session_kind(entry))
    if kind == "practice":
        number = to_int(entry.get("Number"))
        return f"practice_{number}" if number else "practice"
    return kind


def _recent(session: Session) -> bool:
    end = session.end or datetime.combine(
        session.day, datetime.min.time(), UTC
    ) + timedelta(days=1)
    return datetime.now(UTC) - end < RECENT


class ArchiveClient:
    def __init__(
        self, session: aiohttp.ClientSession, cache: DiskCache, run: Executor
    ) -> None:
        self._session = session
        self._cache = cache
        self._run = run
        self.last_error: str | None = None
        self._inflight = InFlight()
        self._builds = asyncio.Semaphore(CONCURRENT_BUILDS)
        for prefix, version in (
            ("detail/", DETAIL_VERSION),
            ("final/", FINAL_VERSION),
            ("outline/", OUTLINE_VERSION),
            ("path/", PATH_VERSION),
        ):
            cache.expire(prefix, 0, unless=f"{prefix}{version}/")
        cache.expire(f"final/{FINAL_VERSION}/", FINAL_MAX_AGE)
        cache.expire("archive/", ARCHIVE_FILE_MAX_AGE)
        cache.expire("archive-missing/", MISSING_PAST)
        cache.expire("detail-partial/", PARTIAL_PAST)

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
                data = await self._body(response, url)
        except (aiohttp.ClientError, TimeoutError) as err:
            self.last_error = type(err).__name__
            raise SourceError(f"archive unreachable: {err}") from err
        self.last_error = None
        return data

    async def _body(self, response: aiohttp.ClientResponse, url: str) -> bytes:
        """The body, refused past `MAX_FILE_BYTES` before it is all in memory."""
        length = getattr(response, "content_length", None)
        if length is not None and length > MAX_FILE_BYTES:
            self.last_error = "too large"
            raise SourceError(f"archive file too large: {url}")
        chunks: list[bytes] = []
        size = 0
        async for chunk in response.content.iter_chunked(1 << 16):
            size += len(chunk)
            if size > MAX_FILE_BYTES:
                self.last_error = "too large"
                raise SourceError(f"archive file too large: {url}")
            chunks.append(chunk)
        return b"".join(chunks)

    async def _json(
        self, relative: str, max_age: float | None, missing_for: float
    ) -> Any:
        """An archive JSON file, cached; None when the archive does not have it.

        A 403 is remembered for `missing_for` seconds: 2022, and most 2018 session
        indexes, answer 403 today, and every page open asked again.
        """
        key = f"archive/{relative}"
        cached = await self._run(self._cache.read_json, key, max_age)
        if cached is not None:
            return cached
        missing_key = f"archive-missing/{relative}"
        if await self._run(self._cache.read_json, missing_key, missing_for):
            return None
        try:
            data = await self._download(ARCHIVE_BASE + relative)
        except SourceError:
            stale = await self._run(self._cache.read_json, key, None)
            if stale is not None:
                return stale
            raise
        if data is None:
            await self._run(self._cache.write_json, missing_key, {"missing": True})
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
            f"{year}/Index.json",
            INDEX_MAX_AGE if current else PAST_INDEX_MAX_AGE,
            INDEX_MAX_AGE if current else MISSING_PAST,
        )

    async def _session_index(self, path: str, recent: bool) -> dict[str, Any] | None:
        index = await self._json(
            f"{path}Index.json", None, MISSING_RECENT if recent else MISSING_PAST
        )
        return index if isinstance(index, dict) and index else None

    async def session_path(
        self, meetings: list[Meeting], session: Session
    ) -> str | None:
        """The archive path of one of our sessions; remembered once found.

        The weekend is matched first (the archive meeting whose sessions fall
        within three days of ours), then the session by kind: Jolpica's times can
        be a day off (Las Vegas 2024 mixes a local date with a UTC time), and old
        seasons carry dates without times.
        """
        key = f"path/{PATH_VERSION}/{session.key}"
        remembered = await self._run(self._cache.read_json, key, None)
        if isinstance(remembered, dict) and remembered.get("path"):
            return str(remembered["path"])
        meeting = next((m for m in meetings if session in m.sessions), None)
        if meeting is None:
            return None
        anchor = meeting.race or meeting.sessions[-1]
        day = anchor.start or datetime.combine(anchor.day, datetime.min.time(), UTC)
        index = await self.season_index(day.year)
        best: tuple[timedelta, dict[str, Any]] | None = None
        meetings_index = index.get("Meetings") if isinstance(index, dict) else None
        for candidate in _dicts(meetings_index):
            entries = [e for e in _dicts(candidate.get("Sessions")) if e.get("Path")]
            starts = [s for e in entries if (s := feed_start(e)) is not None]
            if not starts:
                continue
            distance = min(abs(s - day) for s in starts)
            if distance <= MEETING_WINDOW and (best is None or distance < best[0]):
                best = (distance, candidate)
        if best is None:
            return None
        for entry in _dicts(best[1].get("Sessions")):
            if entry.get("Path") and _our_kind(entry) == session.kind:
                path = str(entry["Path"])
                await self._run(self._cache.write_json, key, {"path": path})
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
        recent = _recent(session)
        return await self._inflight.run(
            f"detail {path}", lambda: self._detail(path, recent)
        )

    async def _detail(self, path: str, recent: bool) -> Any:
        key = f"detail/{DETAIL_VERSION}/{path}"
        cached = await self._run(self._cache.read_json, key, None)
        if cached is not None:
            return cached
        partial_key = f"detail-partial/{DETAIL_VERSION}/{path}"
        partial = await self._run(
            self._cache.read_json,
            partial_key,
            PARTIAL_RECENT if recent else PARTIAL_PAST,
        )
        if isinstance(partial, dict):
            return partial.get("detail")
        async with self._builds:
            index = await self._session_index(path, recent)
            if index is not None:
                feeds = index.get("Feeds")
                feeds = feeds if isinstance(feeds, dict) else {}
                wanted = [f"{n}.jsonStream" for n in DETAIL_STREAMS if n in feeds] + [
                    f"{n}.json" for n in DETAIL_KEYFRAMES if n in feeds
                ]
                # A feed the index lists but that could not be read (a half-uploaded
                # batch) would freeze a gap forever: only a complete detail is kept.
                needed = wanted
            elif recent:
                # Not published yet (0-30 min after a session).
                return None
            else:
                # A past session whose index is 403: its feeds may all be there
                # (16 of 20 races in 2018). Ask for them by their fixed names.
                wanted = [f"{n}.jsonStream" for n in DETAIL_STREAMS] + [
                    f"{n}.json" for n in DETAIL_KEYFRAMES
                ]
                needed = list(DETAIL_REQUIRED)
            files = await self._files(path, wanted)
            if index is None and all(files[n] is None for n in needed):
                await self._run(self._cache.write_json, partial_key, {"detail": None})
                return None
            detail = await self._run(self._build_detail, files)
            detail["session_path"] = path
            if all(files[name] is not None for name in needed):
                await self._run(self._cache.write_json, key, detail)
            else:
                await self._run(self._cache.write_json, partial_key, {"detail": detail})
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
        recent = _recent(session)
        return await self._inflight.run(
            f"final {path}", lambda: self._final(path, recent)
        )

    async def _final(self, path: str, recent: bool) -> dict[str, Any] | None:
        key = f"final/{FINAL_VERSION}/{path}"
        cached = await self._run(self._cache.read_json, key, None)
        if cached is not None:
            return cached
        async with self._builds:
            index = await self._session_index(path, recent)
            if index is None:
                return None
            feeds = index.get("Feeds")
            feeds = feeds if isinstance(feeds, dict) else {}
            wanted = [f"{n}.json" for n in FINAL_KEYFRAMES if n in feeds]
            if "PitLaneTimeCollection" in feeds:
                wanted.append("PitLaneTimeCollection.jsonStream")
            files = await self._files(path, wanted)
            topics = {
                name.removesuffix(".json"): value
                for name, data in files.items()
                if name.endswith(".json") and (value := _keyframe(data)) is not None
            }
            pits: list[Any] = list(
                _stream(files.get("PitLaneTimeCollection.jsonStream"))
            )
            final = {"path": path, "topics": topics, "pit_stream": pits}
            if all(files[name] is not None for name in wanted):
                await self._run(self._cache.write_json, key, final)
        return final

    async def outline(self, circuit_key: int, before: datetime) -> Outline | None:
        """The circuit's outline, drawn once per circuit and kept (SPEC §6.5)."""
        key = f"outline/{OUTLINE_VERSION}/{circuit_key}"
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
        async with self._builds:
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
            meetings = index.get("Meetings") if isinstance(index, dict) else None
            for meeting in _dicts(meetings):
                circuit = meeting.get("Circuit")
                if not isinstance(circuit, dict) or circuit.get("Key") != circuit_key:
                    continue
                for entry in _dicts(meeting.get("Sessions")):
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
                        best = (rank, start, str(entry["Path"]))
            if best is not None:
                break
        return best[2] if best else None
