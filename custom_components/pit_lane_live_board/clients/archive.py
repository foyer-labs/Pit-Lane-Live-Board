"""F1's session archive: history detail and track outlines (SPEC §4.3, §6.5, §7.3).

Downloads each file once. Raw streams are parsed in the executor and thrown away:
only the compact derived form stays in the cache (a race's detail is ~250 KB, its
raw streams several MB).
"""

from __future__ import annotations

from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
import json
import logging
from pathlib import Path
from typing import Any

import aiohttp

from ..cache import DiskCache
from ..const import ARCHIVE_BASE, USER_AGENT
from ..core.archive_parse import decode_z, iter_stream
from ..core.history import build_detail
from ..core.outline import Outline, build_outline, position_samples
from ..core.schedule import Meeting, Session, feed_start, match_session
from ..core.session import session_kind
from .http import Executor, SourceError

_LOGGER = logging.getLogger(__name__)

TIMEOUT = aiohttp.ClientTimeout(total=120)
FIRST_ARCHIVED_SEASON = 2018
INDEX_MAX_AGE = 10 * 60
PAST_INDEX_MAX_AGE = 30 * 24 * 3600
OUTLINE_YEARS_BACK = 3

DETAIL_STREAMS = ("TimingData", "WeatherData", "PitLaneTimeCollection")
DETAIL_KEYFRAMES = ("TimingAppData", "DriverList", "RaceControlMessages")


def _kind_name(session: dict[str, Any]) -> str:
    kind = str(session_kind(session))
    return "practice" if kind == "practice" else kind


def _stream(path: Path | None) -> Iterator[Any]:
    if path is None:
        return
    with path.open(encoding="utf-8-sig") as handle:
        for _, payload in iter_stream(handle):
            yield payload


def _keyframe(path: Path | None) -> Any:
    if path is None:
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, ValueError):
        return None


class ArchiveClient:
    def __init__(
        self, session: aiohttp.ClientSession, cache: DiskCache, run: Executor
    ) -> None:
        self._session = session
        self._cache = cache
        self._run = run
        self.last_error: str | None = None

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
        try:
            value = json.loads(data.decode("utf-8-sig"))
        except ValueError:
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

    async def find_session(
        self, meetings: list[Meeting], session: Session
    ) -> dict[str, Any] | None:
        """The archive entry for one of our sessions, with its `Path`."""
        if session.start is None:
            return None
        index = await self.season_index(session.start.year)
        for meeting in (index or {}).get("Meetings") or []:
            for entry in meeting.get("Sessions") or []:
                if not entry.get("Path"):
                    continue
                matched = match_session(meetings, _kind_name(entry), feed_start(entry))
                if matched is not None and matched.key == session.key:
                    return {**entry, "Meeting": meeting}
        return None

    async def _file_to_cache(self, path: str, name: str) -> Path | None:
        data = await self._download(f"{ARCHIVE_BASE}{path}{name}")
        if data is None:
            return None
        return await self._run(
            self._cache.write_bytes, f"raw/{path}{name}", ".raw", data
        )

    async def detail(self, meetings: list[Meeting], session: Session) -> Any:
        """The derived detail of a 2018+ session, or None when not archived."""
        entry = await self.find_session(meetings, session)
        if entry is None:
            return None
        path = entry["Path"]
        key = f"detail/{path}"
        cached = await self._run(self._cache.read_json, key, None)
        if cached is not None:
            return cached
        index = await self._json(f"{path}Index.json", None)
        feeds = (index or {}).get("Feeds") or {}
        files: dict[str, Path | None] = {}
        for name in DETAIL_STREAMS:
            files[name] = (
                await self._file_to_cache(path, f"{name}.jsonStream")
                if name in feeds
                else None
            )
        for name in DETAIL_KEYFRAMES:
            files[name] = (
                await self._file_to_cache(path, f"{name}.json")
                if name in feeds
                else None
            )
        detail = await self._run(self._build_detail, files)
        detail["session_path"] = path
        await self._run(self._cache.write_json, key, detail)
        await self._run(self._drop, files)
        return detail

    @staticmethod
    def _build_detail(files: dict[str, Path | None]) -> dict[str, Any]:
        return build_detail(
            timing_stream=_stream(files["TimingData"]),
            app_keyframe=_keyframe(files["TimingAppData"]),
            driver_list=_keyframe(files["DriverList"]),
            rcm_keyframe=_keyframe(files["RaceControlMessages"]),
            weather_stream=_stream(files["WeatherData"]),
            pit_stream=_stream(files["PitLaneTimeCollection"]),
        )

    @staticmethod
    def _drop(files: dict[str, Path | None]) -> None:
        for path in files.values():
            if path is not None:
                path.unlink(missing_ok=True)

    async def outline(self, circuit_key: int, before: datetime) -> Outline | None:
        """The circuit's outline from its most recent archived session with
        positions, before `before` (SPEC §6.5)."""
        source = await self._outline_source(circuit_key, before)
        if source is None:
            return None
        key = f"outline/{circuit_key}/{source}"
        cached = await self._run(self._cache.read_json, key, None)
        if cached is not None:
            return Outline.from_dict(cached)
        raw = await self._file_to_cache(source, "Position.z.jsonStream")
        if raw is None:
            return None
        outline = await self._run(self._build_outline, raw)
        await self._run(raw.unlink, True)
        if outline is not None:
            await self._run(self._cache.write_json, key, outline.to_dict())
        return outline

    @staticmethod
    def _build_outline(raw: Path) -> Outline | None:
        def samples() -> Iterator[tuple[str, float, float, bool]]:
            for payload in _stream(raw):
                yield from position_samples(decode_z(payload))

        return build_outline(samples())

    async def _outline_source(self, circuit_key: int, before: datetime) -> str | None:
        """The path of the latest race or qualifying at this circuit."""
        best: tuple[datetime, str] | None = None
        for year in range(before.year, before.year - OUTLINE_YEARS_BACK - 1, -1):
            index = await self.season_index(year)
            for meeting in (index or {}).get("Meetings") or []:
                circuit = meeting.get("Circuit") or {}
                if circuit.get("Key") != circuit_key:
                    continue
                for entry in meeting.get("Sessions") or []:
                    start = feed_start(entry)
                    if (
                        entry.get("Path")
                        and entry.get("Type") in ("Race", "Qualifying")
                        and start is not None
                        and start < before - timedelta(hours=1)
                        and (best is None or start > best[0])
                    ):
                        best = (start, entry["Path"])
            if best is not None:
                break
        return best[1] if best else None
