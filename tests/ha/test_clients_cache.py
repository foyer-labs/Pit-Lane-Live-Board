"""The disk cache (SPEC §4, §11): as few writes as it can, nothing kept forever."""

from __future__ import annotations

import os
from pathlib import Path
import time

from custom_components.pit_lane_live_board import cache as cache_module
from custom_components.pit_lane_live_board.cache import DiskCache

DAY = 24 * 3600


def _age(path: Path, seconds: float, atime: float | None = None) -> None:
    then = time.time() - seconds
    os.utime(path, (then if atime is None else time.time() - atime, then))


def test_a_read_touches_the_file_at_most_once_a_day(tmp_path):
    cache = DiskCache(tmp_path)
    cache.write_json("a", {"x": 1})
    path = cache.path("a", ".json")
    _age(path, 10 * DAY, atime=3600)
    before = path.stat()
    assert cache.read_json("a") == {"x": 1}
    # No metadata write (the kernel may still move atime by itself).
    assert path.stat().st_ctime_ns == before.st_ctime_ns
    _age(path, 10 * DAY, atime=2 * DAY)
    assert cache.read_json("a") == {"x": 1}
    after = path.stat()
    assert time.time() - after.st_atime < 60
    # Its age is untouched: a read is not a refresh.
    assert time.time() - after.st_mtime > 9 * DAY


def test_an_identical_payload_is_not_rewritten(tmp_path):
    cache = DiskCache(tmp_path)
    cache.write_json("a", {"x": 1})
    path = cache.path("a", ".json")
    _age(path, 5 * DAY)
    inode = path.stat().st_ino
    cache.write_json("a", {"x": 1})
    assert cache.age("a") < 60  # counted as fresh again
    assert path.stat().st_ino == inode  # but not replaced
    cache.write_json("a", {"x": 2})
    assert cache.read_json("a") == {"x": 2}


def test_dead_temporary_files_are_removed(tmp_path):
    cache = DiskCache(tmp_path)
    tmp_path.mkdir(exist_ok=True)
    old = tmp_path / "k-123.json.deadbeef.part"
    old.write_bytes(b"x" * 100)
    _age(old, 2 * 3600)
    young = tmp_path / "k-456.json.cafe0000.part"
    young.write_bytes(b"y")
    cache.write_json("a", {"x": 1})
    assert not old.exists() and young.exists()
    assert cache._size == cache.path("a", ".json").stat().st_size


def test_entries_expire_and_old_formats_retire(tmp_path):
    cache = DiskCache(tmp_path)
    cache.expire("final/", 30 * DAY)
    cache.expire("detail/", 0, unless="detail/v2/")
    for key in ("final/old", "final/new", "detail/2026/x", "detail/v2/2026/x", "other"):
        cache.write_json(key, {"k": key})
    _age(cache.path("final/old", ".json"), 31 * DAY)
    _age(cache.path("other", ".json"), 400 * DAY)
    for key in ("detail/2026/x", "detail/v2/2026/x"):
        _age(cache.path(key, ".json"), 1)
    cache._tidied = time.monotonic() - cache_module.TIDY_EVERY - 1
    cache.write_json("trigger", {})
    kept = {
        k
        for k in (
            "final/old",
            "final/new",
            "detail/2026/x",
            "detail/v2/2026/x",
            "other",
        )
        if cache.read_json(k) is not None
    }
    assert kept == {"final/new", "detail/v2/2026/x", "other"}
