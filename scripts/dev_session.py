"""Replay an archived session as a fake live feed (SPEC §13, decision 19).

A development tool, never a user feature (decision 8). It serves F1's SignalR Core
protocol on localhost and plays an archived session's streams at a chosen speed, so
the live page can be built and checked without waiting for a race weekend.

    python scripts/dev_session.py 2026/2026-09-13_Spanish_Grand_Prix/2026-09-13_Race/ \
        --speed 10 --start 00:58:00 --port 8765 [--positions]

Then start Home Assistant with

    PIT_LANE_DEV_LIVE_URL=http://127.0.0.1:8765/signalrcore

and the integration connects here instead of to F1, as if a window were open.
Downloads are kept in .dev-cache/ (git-ignored).
"""

from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path
import sys
import urllib.request

from aiohttp import WSMsgType, web

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from custom_components.pit_lane_live_board.const import (  # noqa: E402
    ARCHIVE_BASE,
    USER_AGENT,
)
from custom_components.pit_lane_live_board.core.archive_parse import (  # noqa: E402
    iter_stream,
    parse_offset,
)
from custom_components.pit_lane_live_board.core.live_state import (  # noqa: E402
    AUTH_TOPICS,
    PUBLIC_TOPICS,
)
from custom_components.pit_lane_live_board.core.merge import merge  # noqa: E402

SEPARATOR = "\x1e"
CACHE = ROOT / ".dev-cache"


def download(session_path: str, topic: str) -> Path | None:
    target = CACHE / session_path / f"{topic}.jsonStream"
    if target.exists():
        return target
    url = f"{ARCHIVE_BASE}{session_path}{topic}.jsonStream"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            data = response.read()
    except OSError as err:
        print(f"  {topic}: not available ({err})")
        return None
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    print(f"  {topic}: {len(data) // 1024} KB")
    return target


def load(session_path: str, positions: bool) -> list[tuple[int, str, object]]:
    topics = list(PUBLIC_TOPICS) + (list(AUTH_TOPICS) if positions else [])
    messages: list[tuple[int, str, object]] = []
    for topic in topics:
        path = download(session_path, topic)
        if path is None:
            continue
        with path.open(encoding="utf-8-sig") as handle:
            messages.extend(
                (offset, topic, payload) for offset, payload in iter_stream(handle)
            )
    messages.sort(key=lambda m: m[0])
    return messages


def build_app(messages, start_ms: int, speed: float) -> web.Application:
    keyframes: dict[str, object] = {}
    later = []
    for offset, topic, payload in messages:
        if offset <= start_ms:
            if topic in AUTH_TOPICS:
                keyframes[topic] = payload
            else:
                keyframes[topic] = merge(keyframes.get(topic), payload)
        else:
            later.append((offset, topic, payload))

    async def negotiate(request: web.Request) -> web.Response:
        if request.method == "OPTIONS":
            return web.Response(status=405)
        return web.json_response(
            {"negotiateVersion": 1, "connectionId": "dev", "connectionToken": "dev"}
        )

    async def socket(request: web.Request) -> web.WebSocketResponse:
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        player: asyncio.Task | None = None
        async for message in ws:
            if message.type != WSMsgType.TEXT:
                continue
            for raw in message.data.split(SEPARATOR):
                if not raw.strip():
                    continue
                record = json.loads(raw)
                if "protocol" in record:
                    await ws.send_str("{}" + SEPARATOR)
                elif record.get("target") == "Subscribe":
                    await ws.send_str(
                        json.dumps(
                            {"type": 3, "invocationId": "0", "result": keyframes}
                        )
                        + SEPARATOR
                    )
                    player = asyncio.create_task(play(ws))
        if player:
            player.cancel()
        return ws

    async def play(ws: web.WebSocketResponse) -> None:
        clock = start_ms
        for offset, topic, payload in later:
            await asyncio.sleep(max(0.0, (offset - clock) / 1000 / speed))
            clock = offset
            await ws.send_str(
                json.dumps(
                    {"type": 1, "target": "feed", "arguments": [topic, payload, None]}
                )
                + SEPARATOR
            )
        print("End of the recorded session.")

    app = web.Application()
    app.router.add_route("*", "/signalrcore/negotiate", negotiate)
    app.router.add_get("/signalrcore", socket)
    return app


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("session_path", help="archive path ending with /")
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument("--start", default="00:00:00.000", help="HH:MM:SS offset")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--positions", action="store_true", help="also play Position.z")
    args = parser.parse_args()
    start = args.start if "." in args.start else f"{args.start}.000"
    start_ms = parse_offset(start) or 0
    print(f"Loading {args.session_path}")
    messages = load(args.session_path, args.positions)
    print(
        f"{len(messages)} messages; serving on http://127.0.0.1:{args.port}/signalrcore"
    )
    web.run_app(
        build_app(messages, start_ms, args.speed), host="127.0.0.1", port=args.port
    )


if __name__ == "__main__":
    main()
