"""INV-1: core/ imports nothing but the standard library and core/ itself.

If this test fails, fix the code, never the test.

Two checks, because each catches what the other misses:

* a static one on the source: every import in core/ is from the standard library
  (minus asyncio) or from core/, so even an unused relative import that leaves core/
  is caught;
* a runtime one in a fresh interpreter: importing the pure modules loads no
  `homeassistant`, `aiohttp` or `asyncio` module, so indirect imports are caught.
"""

from __future__ import annotations

import ast
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
PACKAGE = ROOT / "custom_components" / "pit_lane_live_board"
CORE = PACKAGE / "core"
FORBIDDEN_STDLIB = {"asyncio"}
FORBIDDEN_AT_RUNTIME = ("homeassistant", "aiohttp", "asyncio")


def _core_files() -> list[Path]:
    files = sorted(CORE.rglob("*.py"))
    assert files, "core/ has no Python files: was it moved?"
    return files


def _pure_modules() -> list[str]:
    modules = ["custom_components.pit_lane_live_board.const"]
    for path in _core_files():
        parts = path.relative_to(ROOT).with_suffix("").parts
        if parts[-1] == "__init__":
            parts = parts[:-1]
        modules.append(".".join(parts))
    return modules


def _violations(path: Path, core: Path) -> list[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    depth = len(path.relative_to(core).parts) - 1
    found = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            names = [alias.name for alias in node.names]
        elif isinstance(node, ast.ImportFrom):
            if node.level > 0:
                if node.level - 1 > depth:
                    found.append(f"{path.name}:{node.lineno} leaves core/")
                continue
            names = [node.module or ""]
        else:
            continue
        for name in names:
            root = name.split(".")[0]
            if root == "__future__" or (
                root in sys.stdlib_module_names and root not in FORBIDDEN_STDLIB
            ):
                continue
            found.append(f"{path.name}:{node.lineno} imports {name!r}")
    return found


def test_core_imports_only_stdlib_and_core():
    found = [v for f in _core_files() for v in _violations(f, CORE)]
    assert not found, "core/ must stay pure (INV-1):\n" + "\n".join(found)


def test_the_static_check_catches_what_it_exists_for(tmp_path):
    fake_core = tmp_path / "core"
    fake_core.mkdir()
    bad = fake_core / "bad.py"
    bad.write_text(
        "import homeassistant.core\n"
        "import asyncio\n"
        "from aiohttp import web\n"
        "from .. import const\n"
        "from .timing import x\n",
        encoding="utf-8",
    )

    found = _violations(bad, fake_core)

    assert len(found) == 4
    assert "homeassistant.core" in found[0]
    assert "asyncio" in found[1]
    assert "aiohttp" in found[2]
    assert "leaves core/" in found[3]


def test_pure_modules_import_without_forbidden_packages():
    script = (
        "import sys\n"
        f"for name in {_pure_modules()!r}:\n"
        "    __import__(name)\n"
        "bad = sorted(m for m in sys.modules\n"
        f"             if m.split('.')[0] in {FORBIDDEN_AT_RUNTIME!r})\n"
        "print('\\n'.join(bad))\n"
        "sys.exit(1 if bad else 0)\n"
    )
    result = subprocess.run(
        [sys.executable, "-c", script],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, (
        f"importing the pure modules loaded:\n{result.stdout}{result.stderr}"
    )
