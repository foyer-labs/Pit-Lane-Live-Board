"""Keep the backend translations in step (SPEC §14, INV-7).

strings.json is the English source; translations/en.json is a copy of it, and
translations/it.json is written by hand with exactly the same keys.

    python scripts/sync_translations.py          # rewrite en.json from strings.json
    python scripts/sync_translations.py --check  # exit 1 when anything diverges
"""

from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / "custom_components" / "pit_lane_live_board"
SOURCE = PACKAGE / "strings.json"
ENGLISH = PACKAGE / "translations" / "en.json"
ITALIAN = PACKAGE / "translations" / "it.json"


def keys(tree: object, prefix: str = "") -> set[str]:
    """Every leaf path of a translation tree, as dotted keys."""
    if isinstance(tree, dict):
        found: set[str] = set()
        for name, value in tree.items():
            found |= keys(value, f"{prefix}{name}.")
        return found
    return {prefix.rstrip(".")}


def problems() -> list[str]:
    found = []
    if not ENGLISH.exists() or ENGLISH.read_bytes() != SOURCE.read_bytes():
        found.append("translations/en.json differs from strings.json")
    source = keys(json.loads(SOURCE.read_text(encoding="utf-8")))
    italian = keys(json.loads(ITALIAN.read_text(encoding="utf-8")))
    found += [f"missing in it.json: {k}" for k in sorted(source - italian)]
    found += [f"only in it.json: {k}" for k in sorted(italian - source)]
    return found


def main() -> int:
    if "--check" in sys.argv[1:]:
        found = problems()
        print("\n".join(found))
        return 1 if found else 0
    ENGLISH.write_bytes(SOURCE.read_bytes())
    return 0


if __name__ == "__main__":
    sys.exit(main())
