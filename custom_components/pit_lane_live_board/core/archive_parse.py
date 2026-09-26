"""The archive's file formats (SPEC §4.3).

* `.jsonStream`: one message per line, `HH:MM:SS.mmm` (offset from the stream's
  start) immediately followed by JSON. The file starts with a UTF-8 BOM.
* `.z` topics carry a JSON string holding base64 of raw deflate data, both in the
  archive and in the live feed.
"""

from __future__ import annotations

import base64
import binascii
from collections.abc import Iterable, Iterator
import json
import re
from typing import Any
import zlib

_OFFSET = re.compile(r"^(\d+):(\d{2}):(\d{2})\.(\d{3})")


def decode_text(data: bytes) -> str:
    """Archive files are UTF-8 with a BOM; `utf-8-sig` drops it when present."""
    return data.decode("utf-8-sig")


def parse_offset(text: str) -> int | None:
    """`01:02:03.456` → milliseconds, or None when the line has no offset."""
    match = _OFFSET.match(text)
    if match is None:
        return None
    hours, minutes, seconds, millis = (int(g) for g in match.groups())
    return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis


def iter_stream(
    lines: Iterable[str], keep: tuple[str, ...] | None = None
) -> Iterator[tuple[int, Any]]:
    """Yield `(offset_ms, payload)` per line, skipping blank or damaged lines.

    Works on any iterable of lines so a large file can be read without loading it
    whole (SPEC §4.3). `keep`, when given, skips lines containing none of its words
    before parsing them.
    """
    for raw in lines:
        line = raw.lstrip("﻿").strip()
        if not line:
            continue
        if keep is not None and not any(word in line for word in keep):
            # Cheaper than parsing JSON that would be thrown away.
            continue
        match = _OFFSET.match(line)
        if match is None:
            continue
        hours, minutes, seconds, millis = (int(g) for g in match.groups())
        offset = ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis
        try:
            yield offset, json.loads(line[match.end() :])
        except ValueError:
            continue


def decode_z(value: Any) -> Any:
    """Decode a `.z` payload (base64 of raw deflate JSON); None when damaged."""
    if not isinstance(value, str):
        return None
    try:
        raw = zlib.decompress(base64.b64decode(value), -zlib.MAX_WBITS)
        return json.loads(raw)
    except (binascii.Error, zlib.error, ValueError):
        return None


def encode_z(value: Any) -> str:
    """The inverse of `decode_z`, used by tests and the development player."""
    compressor = zlib.compressobj(wbits=-zlib.MAX_WBITS)
    raw = compressor.compress(json.dumps(value).encode()) + compressor.flush()
    return base64.b64encode(raw).decode()
