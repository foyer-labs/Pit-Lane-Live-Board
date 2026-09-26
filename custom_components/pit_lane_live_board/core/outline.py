"""The track outline for the live map (SPEC §6.5).

F1 publishes no circuit geometry, so the outline is drawn from car positions: one
clean lap of one car, cleaned and resampled. The method follows F1 Sensor's (MIT):
keep on-track non-zero samples, find a loop that closes, drop outliers, downsample.

The result carries its own projection: raw feed coordinates go in, map coordinates
come out, so the outline and the live cars always share one frame. The circuit is
rotated so its longest axis is horizontal, which fills a wide panel best.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from itertools import pairwise
import math
from statistics import median
from typing import Any

POINTS = 300
MAX_PER_CAR = 3000
MAP_WIDTH = 1000.0
PADDING = 40.0

Point = tuple[float, float]


@dataclass(frozen=True, slots=True)
class Outline:
    points: tuple[Point, ...]  # already projected into map coordinates
    width: float
    height: float
    # Projection: rotate raw coordinates by `angle` around `center`, then scale and
    # shift into the map box.
    angle: float
    center: Point
    scale: float
    offset: Point

    def project(self, x: float, y: float) -> Point:
        cos_a, sin_a = math.cos(self.angle), math.sin(self.angle)
        dx, dy = x - self.center[0], y - self.center[1]
        rx = dx * cos_a - dy * sin_a
        ry = dx * sin_a + dy * cos_a
        # Screen y grows downwards; feed y grows upwards.
        return (
            round(rx * self.scale + self.offset[0], 1),
            round(-ry * self.scale + self.offset[1], 1),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "points": [list(p) for p in self.points],
            "width": self.width,
            "height": self.height,
            "angle": self.angle,
            "center": list(self.center),
            "scale": self.scale,
            "offset": list(self.offset),
        }

    @classmethod
    def from_dict(cls, data: Any) -> Outline | None:
        try:
            return cls(
                points=tuple((float(p[0]), float(p[1])) for p in data["points"]),
                width=float(data["width"]),
                height=float(data["height"]),
                angle=float(data["angle"]),
                center=(float(data["center"][0]), float(data["center"][1])),
                scale=float(data["scale"]),
                offset=(float(data["offset"][0]), float(data["offset"][1])),
            )
        except (KeyError, TypeError, ValueError, IndexError):
            return None


def _distance(a: Point, b: Point) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def _path_length(points: list[Point]) -> float:
    return sum(_distance(a, b) for a, b in pairwise(points))


def _diagonal(points: list[Point]) -> float:
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return math.hypot(max(xs) - min(xs), max(ys) - min(ys))


def _loops(points: list[Point]) -> list[list[Point]]:
    """Closed laps found from several starting points along one car's path."""
    diagonal = _diagonal(points)
    if diagonal <= 0:
        return []
    close = max(150.0, min(900.0, diagonal * 0.025))
    far = diagonal * 0.3
    loops = []
    step = max(1, len(points) // 12)
    for start in range(0, len(points), step):
        anchor = points[start]
        went_far = False
        for end in range(start + 1, len(points)):
            gap = _distance(anchor, points[end])
            if gap > far:
                went_far = True
            elif went_far and gap < close:
                loops.append(points[start : end + 1])
                break
    return loops


def _drop_outliers(points: list[Point]) -> list[Point]:
    """Remove single samples that jump away from their neighbours."""
    if len(points) < 5:
        return points
    steps = [_distance(a, b) for a, b in pairwise(points)]
    typical = median(steps) or 1.0
    kept = [points[0]]
    for i in range(1, len(points) - 1):
        before = _distance(points[i - 1], points[i])
        after = _distance(points[i], points[i + 1])
        bridge = _distance(points[i - 1], points[i + 1])
        if before > 6 * typical and after > 6 * typical and bridge < 3 * typical:
            continue
        kept.append(points[i])
    kept.append(points[-1])
    return kept


def _resample(points: list[Point], count: int) -> list[Point]:
    """`count` points evenly spaced along the path."""
    cumulative = [0.0]
    for a, b in pairwise(points):
        cumulative.append(cumulative[-1] + _distance(a, b))
    total = cumulative[-1]
    if total <= 0:
        return points[:count]
    out = []
    segment = 0
    for k in range(count):
        target = total * k / count
        while segment < len(points) - 2 and cumulative[segment + 1] < target:
            segment += 1
        start, end = cumulative[segment], cumulative[segment + 1]
        t = (target - start) / (end - start) if end > start else 0.0
        a, b = points[segment], points[segment + 1]
        out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    return out


def _principal_angle(points: list[Point]) -> float:
    """The rotation that lays the circuit's longest axis horizontally."""
    cx = sum(p[0] for p in points) / len(points)
    cy = sum(p[1] for p in points) / len(points)
    sxx = sum((p[0] - cx) ** 2 for p in points)
    syy = sum((p[1] - cy) ** 2 for p in points)
    sxy = sum((p[0] - cx) * (p[1] - cy) for p in points)
    axis = 0.5 * math.atan2(2 * sxy, sxx - syy)
    return -axis


def build_outline(samples: Iterable[tuple[str, float, float, bool]]) -> Outline | None:
    """`samples` are `(racing number, x, y, on track)` in time order.

    At most `MAX_PER_CAR` samples per car are kept, and reading stops once five
    cars have them all: a few laps of five cars draw the circuit as well as a whole
    race does, for a tenth of the memory (104 MB to under 10 MB on a race file).
    """
    by_car: dict[str, list[Point]] = {}
    full = 0
    for number, x, y, on_track in samples:
        if not on_track or (x == 0 and y == 0):
            continue
        points = by_car.setdefault(number, [])
        if len(points) >= MAX_PER_CAR:
            continue
        points.append((x, y))
        if len(points) == MAX_PER_CAR:
            full += 1
            if full >= 5:
                break

    candidates: list[list[Point]] = []
    for points in sorted(by_car.values(), key=len, reverse=True)[:5]:
        candidates.extend(_loops(points))
    if not candidates:
        return None
    # The median length is a normal lap: shorter ones cut through the pit lane or
    # lost samples, longer ones went off or wandered.
    candidates.sort(key=_path_length)
    lap = _drop_outliers(candidates[len(candidates) // 2])
    if len(lap) < 20:
        return None
    lap = _resample(lap, POINTS)

    angle = _principal_angle(lap)
    center = (
        sum(p[0] for p in lap) / len(lap),
        sum(p[1] for p in lap) / len(lap),
    )
    cos_a, sin_a = math.cos(angle), math.sin(angle)
    rotated = [
        (
            (x - center[0]) * cos_a - (y - center[1]) * sin_a,
            (x - center[0]) * sin_a + (y - center[1]) * cos_a,
        )
        for x, y in lap
    ]
    min_x = min(p[0] for p in rotated)
    max_x = max(p[0] for p in rotated)
    min_y = min(p[1] for p in rotated)
    max_y = max(p[1] for p in rotated)
    span_x = max(max_x - min_x, 1.0)
    span_y = max(max_y - min_y, 1.0)
    scale = (MAP_WIDTH - 2 * PADDING) / span_x
    height = round(span_y * scale + 2 * PADDING, 1)
    # y is flipped on screen, so the top of the box is the largest rotated y.
    offset = (PADDING - min_x * scale, PADDING + max_y * scale)
    outline = Outline(
        points=(),
        width=MAP_WIDTH,
        height=height,
        angle=angle,
        center=center,
        scale=scale,
        offset=offset,
    )
    return Outline(
        points=tuple(outline.project(x, y) for x, y in lap),
        width=outline.width,
        height=outline.height,
        angle=angle,
        center=center,
        scale=scale,
        offset=offset,
    )


def position_samples(decoded: Any) -> list[tuple[str, float, float, bool]]:
    """Samples from one decoded `Position.z` message, in time order."""
    out: list[tuple[str, float, float, bool]] = []
    if not isinstance(decoded, dict) or not isinstance(decoded.get("Position"), list):
        return out
    for sample in decoded["Position"]:
        entries = sample.get("Entries") if isinstance(sample, dict) else None
        if not isinstance(entries, dict):
            continue
        for number, entry in entries.items():
            if not isinstance(entry, dict):
                continue
            x, y = entry.get("X"), entry.get("Y")
            if isinstance(x, (int, float)) and isinstance(y, (int, float)):
                out.append(
                    (str(number), float(x), float(y), entry.get("Status") == "OnTrack")
                )
    return out


def provisional(samples: Iterable[tuple[str, float, float, bool]]) -> Outline | None:
    """A projection fitted to where the cars have been, with no track drawn: on a
    new circuit the map shows the dots until a lap closes (SPEC §6.5)."""
    xs: list[float] = []
    ys: list[float] = []
    for _, x, y, _on in samples:
        if not (x == 0 and y == 0):
            xs.append(x)
            ys.append(y)
    if len(xs) < 2:
        return None
    min_x, max_x, min_y, max_y = min(xs), max(xs), min(ys), max(ys)
    span_x = max(max_x - min_x, 1.0)
    span_y = max(max_y - min_y, 1.0)
    scale = (MAP_WIDTH - 2 * PADDING) / max(span_x, span_y)
    center = ((min_x + max_x) / 2, (min_y + max_y) / 2)
    height = round(span_y * scale + 2 * PADDING, 1)
    width = round(span_x * scale + 2 * PADDING, 1)
    return Outline(
        points=(),
        width=width,
        height=height,
        angle=0.0,
        center=center,
        scale=scale,
        offset=(width / 2, height / 2),
    )
