"""The archive's formats (SPEC §4.3)."""

from __future__ import annotations

import io

from custom_components.pit_lane_live_board.core.archive_parse import (
    decode_text,
    decode_z,
    encode_z,
    iter_stream,
    parse_offset,
)


def test_offsets():
    assert parse_offset("00:00:08.731{") == 8731
    assert parse_offset("01:02:03.004") == 3723004
    assert parse_offset("garbage") is None


def test_stream_lines_with_bom_and_damage():
    raw = (
        '﻿00:00:01.000{"a":1}\n'
        "\n"
        '00:00:02.500"a string payload"\n'
        "00:00:03.000{broken\n"
        "no offset here\n"
        '00:00:04.000{"b":[1,2]}\r\n'
    )
    assert list(iter_stream(io.StringIO(raw))) == [
        (1000, {"a": 1}),
        (2500, "a string payload"),
        (4000, {"b": [1, 2]}),
    ]


def test_decode_text_drops_the_bom():
    assert decode_text("﻿{}".encode()) == "{}"
    assert decode_text(b"{}") == "{}"


def test_z_round_trip():
    value = {"Position": [{"Timestamp": "2026-09-13T13:00:00Z", "Entries": {}}]}
    assert decode_z(encode_z(value)) == value


def test_damaged_z_is_none():
    assert decode_z("not base64 !!") is None
    assert decode_z("aGVsbG8=") is None  # valid base64, not deflate
    assert decode_z(42) is None
