"""The disk cache (SPEC §4, §11).

Plain files under `<config>/.cache/pit_lane_live_board/`, which Home Assistant's
backups leave out. Disposable: deleting it costs downloads, never data. Capped at
500 MB, evicting the least recently used files first.

Every method does blocking file I/O and runs in the executor.
"""

from __future__ import annotations

import contextlib
import hashlib
import json
import os
from pathlib import Path
import time
from typing import Any

from .const import CACHE_CAP_BYTES


def _safe(key: str) -> str:
    """A file name for any key: readable prefix plus a short hash."""
    readable = "".join(c if c.isalnum() or c in "-_." else "_" for c in key)[:80]
    digest = hashlib.sha256(key.encode()).hexdigest()[:10]
    return f"{readable}-{digest}"


class DiskCache:
    def __init__(self, root: Path, cap: int = CACHE_CAP_BYTES) -> None:
        self.root = root
        self.cap = cap

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
        if max_age is not None and time.time() - stat.st_mtime > max_age:
            return None
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return None
        # Reading marks the file as recently used, without changing its age.
        with contextlib.suppress(OSError):
            os.utime(path, (time.time(), stat.st_mtime))
        return value

    def write_json(self, key: str, value: Any) -> None:
        self.write_bytes(
            key, ".json", json.dumps(value, separators=(",", ":")).encode()
        )

    def write_bytes(self, key: str, suffix: str, data: bytes) -> Path:
        self.root.mkdir(parents=True, exist_ok=True)
        path = self.path(key, suffix)
        temporary = path.with_suffix(path.suffix + ".part")
        temporary.write_bytes(data)
        temporary.replace(path)
        self.evict()
        return path

    def size(self) -> int:
        try:
            return sum(p.stat().st_size for p in self.root.iterdir() if p.is_file())
        except OSError:
            return 0

    def evict(self) -> None:
        """Remove the least recently used files until the cache fits its cap."""
        try:
            files = [p for p in self.root.iterdir() if p.is_file()]
        except OSError:
            return
        stats = []
        for p in files:
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

    def clear(self) -> None:
        try:
            for p in self.root.iterdir():
                if p.is_file():
                    p.unlink(missing_ok=True)
        except OSError:
            return
