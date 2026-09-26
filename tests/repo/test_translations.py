"""INV-7: English and Italian carry the same keys (SPEC §14)."""

from __future__ import annotations

from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]


def test_backend_translations_are_in_step():
    result = subprocess.run(
        [sys.executable, "scripts/sync_translations.py", "--check"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, (
        result.stdout + "\nRun: python scripts/sync_translations.py"
    )
