"""The panel's translations and element definitions (INV-7, SPEC §12)."""

from __future__ import annotations

import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "frontend" / "src"


def keys(tree: object, prefix: str = "") -> set[str]:
    if isinstance(tree, dict):
        found: set[str] = set()
        for name, value in tree.items():
            found |= keys(value, f"{prefix}{name}.")
        return found
    return {prefix.rstrip(".")}


def test_panel_languages_have_the_same_keys():
    english = keys(
        json.loads((SOURCE / "i18n" / "en.json").read_text(encoding="utf-8"))
    )
    italian = keys(
        json.loads((SOURCE / "i18n" / "it.json").read_text(encoding="utf-8"))
    )
    assert english - italian == set(), "missing in it.json"
    assert italian - english == set(), "missing in en.json"


def test_every_key_used_in_the_code_exists():
    english = keys(
        json.loads((SOURCE / "i18n" / "en.json").read_text(encoding="utf-8"))
    )
    used: set[str] = set()
    for path in SOURCE.rglob("*.ts"):
        used |= set(
            re.findall(r'\bt\("([a-zA-Z_.]+)"', path.read_text(encoding="utf-8"))
        )
    assert used, "no t(...) calls found: did the helper change name?"
    assert used - english == set()


def test_elements_are_defined_only_through_define():
    """Home Assistant's scoped registry hides elements defined too early
    (Raccolta 0.4.1, Home Defender 1.0.12): every definition goes through define()."""
    offenders = [
        str(path.relative_to(ROOT))
        for path in SOURCE.rglob("*.ts")
        if path.name != "define.ts"
        and "customElements.define(" in path.read_text(encoding="utf-8")
    ]
    assert offenders == []
