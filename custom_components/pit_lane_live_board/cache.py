"""The disk cache (SPEC §4, §11).

Plain files under `<config>/.cache/pit_lane_live_board/`, which Home Assistant's
backups leave out. Disposable: deleting it costs downloads, never data. Capped at
500 MB, evicting the least recently used files first.

The cache lives on what is often an SD card, so it writes as little as it can: a
read marks a file as used at most once a day, a payload identical to the one on disk
is not written again, and entries that are never read again are given a lifetime
(`expire`) instead of waiting for an eviction that a 500 MB cap almost never runs.

Every method does blocking file I/O and runs in the executor.
"""

from __future__ import annotations

import contextlib
import hashlib
import json
import os
from pathlib import Path
import threading
import time
from typing import Any
import uuid

from .const import CACHE_CAP_BYTES

# LRU order needs no finer grain than this: touching a file on every read would
# write its inode on every cache hit.
TOUCH_EVERY = 24 * 3600
TIDY_EVERY = 24 * 3600
# A temporary file this old belongs to a write that died (a crash, a power cut).
PART_MAX_AGE = 3600


def _readable(key: str) -> str:
    return "".join(c if c.isalnum() or c in "-_." else "_" for c in key)[:80]


def _safe(key: str) -> str:
    """A file name for any key: readable prefix plus a short hash."""
    digest = hashlib.sha256(key.encode()).hexdigest()[:10]
    return f"{_readable(key)}-{digest}"


class DiskCache:
    def __init__(self, root: Path, cap: int = CACHE_CAP_BYTES) -> None:
        self.root = root
        self.cap = cap
        # Measured once, then kept as a running total (see write_bytes).
        self._size: int | None = None
        # Writers run on several executor threads.
        self._lock = threading.Lock()
        self._tidied = 0.0
        # (file-name prefix, lifetime in seconds, prefix exempt from it).
        self._lifetimes: list[tuple[str, float, str | None]] = []

    def expire(
        self, key_prefix: str, max_age: float, *, unless: str | None = None
    ) -> None:
        """Delete entries whose key starts with `key_prefix` once written more
        than `max_age` seconds ago, except those starting with `unless`.

        With `max_age` 0 and `unless` the current format's prefix, this retires
        every entry of an older format.
        """
        self._lifetimes.append(
            (_readable(key_prefix), max_age, _readable(unless) if unless else None)
        )

    def path(self, key: str, suffix: str) -> Path:
        return self.root / f"{_safe(key)}{suffix}"

    def age(self, key: str, suffix: str = ".json") -> float | None:
        """Seconds since the entry was written, or None when absent."""
        try:
            return time.time() - self.path(key, suffix).stat().st_mtime
        except OSError:
            return None

    def read_json(self, key: str, max_age: float | None = None) -> Any:
        """The cached value, or None when absent, too old or damaged."""
        path = self.path(key, ".json")
        try:
            stat = path.stat()
        except OSError:
            return None
        now = time.time()
        if max_age is not None and now - stat.st_mtime > max_age:
            return None
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError, RecursionError):
            return None
        # Reading marks the file as recently used, without changing its age.
        if now - stat.st_atime > TOUCH_EVERY:
            with contextlib.suppress(OSError):
                os.utime(path, (now, stat.st_mtime))
        return value

    def write_json(self, key: str, value: Any) -> None:
        self.write_bytes(
            key, ".json", json.dumps(value, separators=(",", ":")).encode()
        )

    def write_bytes(self, key: str, suffix: str, data: bytes) -> Path:
        self.root.mkdir(parents=True, exist_ok=True)
        path = self.path(key, suffix)
        try:
            replaced = path.stat().st_size
        except OSError:
            replaced = 0
        if replaced == len(data) and self._same(path, data):
            # A refresh that changed nothing (a season between two races): only
            # its age is renewed, not its blocks.
            with contextlib.suppress(OSError):
                os.utime(path)
                return path
        # A unique temporary name: two writers of the same key never share it.
        temporary = path.with_suffix(f"{path.suffix}.{uuid.uuid4().hex[:8]}.part")
        temporary.write_bytes(data)
        temporary.replace(path)
        with self._lock:
            # A running total: the directory is scanned once, then only past the
            # cap, and once a day to tidy it.
            if self._size is None or time.monotonic() - self._tidied > TIDY_EVERY:
                self._tidied = time.monotonic()
                self._size = self._tidy()
            else:
                self._size += len(data) - replaced
            if self._size > self.cap:
                self._evict()
        return path

    @staticmethod
    def _same(path: Path, data: bytes) -> bool:
        try:
            return path.read_bytes() == data
        except OSError:
            return False

    def _files(self) -> list[Path]:
        """The cache's files, without another writer's temporary file."""
        try:
            return [
                p for p in self.root.iterdir() if p.is_file() and p.suffix != ".part"
            ]
        except OSError:
            return []

    def size(self) -> int:
        total = 0
        for p in self._files():
            try:
                total += p.stat().st_size
            except OSError:
                continue
        return total

    def _tidy(self) -> int:
        """Delete dead temporary files and expired entries; the size left."""
        now = time.time()
        total = 0
        try:
            entries = [p for p in self.root.iterdir() if p.is_file()]
        except OSError:
            return 0
        for p in entries:
            try:
                stat = p.stat()
            except OSError:
                continue
            age = now - stat.st_mtime
            if p.suffix == ".part":
                if age > PART_MAX_AGE:
                    with contextlib.suppress(OSError):
                        p.unlink()
                continue
            if self._expired(p.name, age):
                with contextlib.suppress(OSError):
                    p.unlink()
                continue
            total += stat.st_size
        return total

    def _expired(self, name: str, age: float) -> bool:
        return any(
            name.startswith(prefix)
            and not (unless and name.startswith(unless))
            and age > max_age
            for prefix, max_age, unless in self._lifetimes
        )

    def evict(self) -> None:
        """Remove the least recently used files until the cache fits its cap."""
        with self._lock:
            self._evict()

    def _evict(self) -> None:
        stats = []
        for p in self._files():
            try:
                stats.append((p, p.stat()))
            except OSError:
                continue
        total = sum(s.st_size for _, s in stats)
        for path, stat in sorted(stats, key=lambda item: item[1].st_atime):
            if total <= self.cap:
                break
            try:
                path.unlink()
                total -= stat.st_size
            except OSError:
                continue
        self._size = total
