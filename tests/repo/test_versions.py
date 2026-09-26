"""One version everywhere (SPEC §16.5): manifest, pyproject and the User-Agent."""

from __future__ import annotations

import json
from pathlib import Path
import tomllib

from custom_components.pit_lane_live_board.const import USER_AGENT, VERSION

ROOT = Path(__file__).resolve().parents[2]


def test_versions_agree():
    manifest = json.loads(
        (ROOT / "custom_components/pit_lane_live_board/manifest.json").read_text()
    )
    pyproject = tomllib.loads((ROOT / "pyproject.toml").read_text())
    assert manifest["version"] == VERSION
    assert pyproject["project"]["version"] == VERSION
    assert VERSION in USER_AGENT
