"""The track outline (SPEC §6.5)."""

from __future__ import annotations

import math
import random

from custom_components.pit_lane_live_board.core.archive_parse import encode_z
from custom_components.pit_lane_live_board.core.outline import (
    MAP_WIDTH,
    POINTS,
    Outline,
    build_outline,
    position_samples,
)


def ellipse_laps(laps=3, per_lap=400, a=8000.0, b=3000.0, tilt=0.6, noise=0.0, seed=1):
    """A car driving an ellipse tilted by `tilt` radians, in feed units."""
    rng = random.Random(seed)
    out = []
    for i in range(laps * per_lap):
        t = 2 * math.pi * i / per_lap
        x, y = a * math.cos(t), b * math.sin(t)
        rx = x * math.cos(tilt) - y * math.sin(tilt) + 500
        ry = x * math.sin(tilt) + y * math.cos(tilt) - 200
        out.append(
            (
                "4",
                rx + rng.uniform(-noise, noise),
                ry + rng.uniform(-noise, noise),
                True,
            )
        )
    return out


def test_an_ellipse_becomes_a_horizontal_outline():
    outline = build_outline(ellipse_laps())
    assert outline is not None
    assert len(outline.points) == POINTS
    assert outline.width == MAP_WIDTH
    # The long axis is laid horizontally: the box is about a:b wide.
    assert 0.3 < (outline.height - 80) / (outline.width - 80) < 0.45
    xs = [p[0] for p in outline.points]
    ys = [p[1] for p in outline.points]
    assert min(xs) >= 39 and max(xs) <= MAP_WIDTH - 39
    assert min(ys) >= 39 and max(ys) <= outline.height - 39


def test_live_positions_land_on_the_outline():
    samples = ellipse_laps()
    outline = build_outline(samples)
    _, x, y, _ = samples[123]
    px, py = outline.project(x, y)
    nearest = min(math.hypot(px - ox, py - oy) for ox, oy in outline.points)
    assert nearest < 10


def test_off_track_and_zero_samples_are_ignored():
    samples = ellipse_laps()
    samples += [("4", 0.0, 0.0, True)] * 50
    samples += [("4", 99999.0, 99999.0, False)] * 50
    assert build_outline(samples) is not None


def test_noise_and_a_single_spike_are_tolerated():
    samples = ellipse_laps(noise=40)
    samples.insert(500, ("4", 60000.0, 60000.0, True))
    outline = build_outline(samples)
    assert outline is not None
    assert max(p[0] for p in outline.points) <= MAP_WIDTH


def test_no_loop_no_outline():
    straight = [("4", float(i * 10), 0.0, True) for i in range(500)]
    assert build_outline(straight) is None
    assert build_outline([]) is None


def test_serialisation_round_trip():
    outline = build_outline(ellipse_laps())
    copy = Outline.from_dict(outline.to_dict())
    assert copy is not None
    assert copy.project(1000.0, 2000.0) == outline.project(1000.0, 2000.0)
    assert Outline.from_dict({"points": "x"}) is None


def test_samples_from_a_decoded_message():
    from custom_components.pit_lane_live_board.core.archive_parse import decode_z

    message = decode_z(
        encode_z(
            {
                "Position": [
                    {"Entries": {"4": {"Status": "OnTrack", "X": 1, "Y": 2}}},
                    {
                        "Entries": {
                            "4": {"Status": "OffTrack", "X": 3, "Y": 4},
                            "9": "x",
                        }
                    },
                ]
            }
        )
    )
    assert position_samples(message) == [("4", 1.0, 2.0, True), ("4", 3.0, 4.0, False)]
    assert position_samples(None) == []


def test_the_cap_keeps_the_shape():
    from custom_components.pit_lane_live_board.core.outline import provisional

    many = ellipse_laps(laps=20)
    outline = build_outline(many)
    assert outline is not None and len(outline.points) == POINTS
    first = provisional(many[:50])
    x, y = first.project(many[10][1], many[10][2])
    assert 0 <= x <= first.width and 0 <= y <= first.height
    assert first.points == ()
    assert provisional([]) is None


def test_the_provisional_box_grows_with_the_cars():
    """The first positions of a window are cars in the garages and on the grid: a
    box fitted to them alone left most later positions off the map."""
    from custom_components.pit_lane_live_board.core.outline import (
        provisional,
        widen_provisional,
    )

    lap = ellipse_laps(laps=1)
    grid = lap[:20]  # a short stretch: the cars on the grid
    first = provisional(grid)

    def inside(outline, samples):
        return all(
            0 <= x <= outline.width and 0 <= y <= outline.height
            for x, y in (outline.project(s[1], s[2]) for s in samples)
        )

    assert not inside(first, lap)
    assert widen_provisional(first, grid[5:10]) is None  # nothing new
    wider = widen_provisional(first, lap)
    assert wider is not None and wider.points == ()
    assert inside(wider, lap) and inside(wider, grid)
    assert widen_provisional(wider, lap) is None
    # Just past the edge, within the margin: no refit for every sample.
    x_max = max(s[1] for s in lap)
    x_min = min(s[1] for s in lap)
    assert (
        widen_provisional(wider, [("4", x_max + (x_max - x_min) * 0.01, 0, True)])
        is None
    )
    # A drawn track is never replaced, and no box starts from nothing.
    assert widen_provisional(build_outline(ellipse_laps()), lap) is None
    assert widen_provisional(None, lap) == provisional(lap)
    assert widen_provisional(wider, [("4", 0.0, 0.0, False)]) is None
