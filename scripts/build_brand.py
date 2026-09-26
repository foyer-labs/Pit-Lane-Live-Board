"""Render the brand images from docs/logo/*.svg (SPEC §16.4).

Home Assistant and HACS read an integration's icon and logo from a `brand` directory
next to its code. This writes the eight files there (icon and logo, 1x and 2x, light
and dark ground) plus the README's images in docs/logo/. It draws nothing of its own:
change the SVGs and run it again.

It renders with headless Chrome (the wordmark uses the system UI face) and trims and
scales with Pillow:

    pip install pillow
    python scripts/build_brand.py [path-to-chrome]
"""

from __future__ import annotations

from pathlib import Path
import re
import subprocess
import sys
import tempfile

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LOGO = ROOT / "docs" / "logo"
BRAND = ROOT / "custom_components" / "pit_lane_live_board" / "brand"
CHROME = (
    sys.argv[1]
    if len(sys.argv) > 1
    else r"C:\Program Files\Google\Chrome\Application\chrome.exe"
)
INK = {"light": "#1c1f24", "dark": "#e8eaed"}
SCALE = 8  # render big, then scale down: crisp edges at every size


def render(svg: Path, ink: str, out: Path) -> Image.Image:
    text = svg.read_text(encoding="utf-8")
    view = text.split('viewBox="')[1].split('"')[0].split()
    width, height = float(view[2]) * SCALE, float(view[3]) * SCALE
    # Only the root element's size changes; the shapes inside keep theirs.
    root = re.match(r"<svg[^>]*>", text)
    assert root is not None, f"{svg} does not start with <svg>"
    sized = re.sub(r'\s(width|height)="[^"]*"', "", root.group(0)).replace(
        "<svg ", f"<svg style='width:{width}px;height:{height}px' ", 1
    )
    page = (
        "<!doctype html><html><body style='margin:0;background:transparent'>"
        f"<div style='width:{width}px;height:{height}px;--ink:{ink}'>"
        + sized
        + text[root.end() :]
        + "</div></body></html>"
    )
    with tempfile.TemporaryDirectory() as tmp:
        html = Path(tmp) / "page.html"
        html.write_text(page, encoding="utf-8")
        shot = Path(tmp) / "shot.png"
        subprocess.run(
            [
                CHROME,
                "--headless=new",
                "--disable-gpu",
                "--hide-scrollbars",
                "--default-background-color=00000000",
                f"--screenshot={shot}",
                f"--window-size={int(width)},{int(height) + 200}",
                html.as_uri(),
            ],
            check=True,
            capture_output=True,
        )
        image = Image.open(shot).convert("RGBA").crop((0, 0, int(width), int(height)))
    image.save(out)
    return image


def fit(image: Image.Image, height: int) -> Image.Image:
    width = round(image.width * height / image.height)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def main() -> None:
    BRAND.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for ground, ink in INK.items():
            prefix = "" if ground == "light" else "dark_"
            symbol = render(LOGO / "symbol.svg", ink, Path(tmp) / f"s-{ground}.png")
            lockup = render(LOGO / "lockup.svg", ink, Path(tmp) / f"l-{ground}.png")
            fit(symbol, 256).save(BRAND / f"{prefix}icon.png")
            fit(symbol, 512).save(BRAND / f"{prefix}icon@2x.png")
            fit(lockup, 256).save(BRAND / f"{prefix}logo.png")
            fit(lockup, 512).save(BRAND / f"{prefix}logo@2x.png")
            fit(lockup, 128).save(LOGO / f"lockup-{ground}.png")
        fit(symbol, 192).save(LOGO / "symbol-192.png")
    for path in sorted(BRAND.iterdir()):
        with Image.open(path) as image:
            print(path.relative_to(ROOT), image.size)


if __name__ == "__main__":
    main()
