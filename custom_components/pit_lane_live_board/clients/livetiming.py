"""F1 live timing over SignalR Core (SPEC §4.2).

Negotiate (OPTIONS for the load-balancer cookies, then POST for the connection
token), open the websocket, handshake, subscribe, then read. Messages are JSON
records separated by `\\x1e`:

* `type 3` answers our Subscribe with the keyframes;
* `type 1, target "feed"` carries `[topic, delta, utc]`;
* `type 6` is a ping (we send one every 15 s so the server keeps us);
* `type 7` is the server closing.

The client reconnects by itself with a capped backoff; 45 s of silence counts as a
dead connection.
"""

from __future__ import annotations

import asyncio
from collections.abc import Callable
import contextlib
import json
import logging
import time
from typing import Any

import aiohttp

from ..const import USER_AGENT
from ..core.live_state import AUTH_TOPICS, PUBLIC_TOPICS

_LOGGER = logging.getLogger(__name__)

SEPARATOR = "\x1e"
PING_EVERY = 15.0
SILENCE_LIMIT = 45.0
BACKOFF_MAX = 30.0
TIMEOUT = aiohttp.ClientTimeout(total=20)

type OnKeyframes = Callable[[dict[str, Any]], None]
type OnFeed = Callable[[str, Any, str | None], None]
type TokenProvider = Callable[[], str | None]


def _ws_url(base: str) -> str:
    if base.startswith("https://"):
        return "wss://" + base[len("https://") :]
    if base.startswith("http://"):
        return "ws://" + base[len("http://") :]
    return base


def records(frame: str) -> list[dict[str, Any]]:
    """The JSON records in one websocket frame; damaged ones are skipped."""
    out = []
    for raw in frame.split(SEPARATOR):
        if not raw.strip():
            continue
        try:
            value = json.loads(raw)
        except ValueError:
            continue
        if isinstance(value, dict):
            out.append(value)
    return out


class LiveTimingClient:
    def __init__(
        self,
        session: aiohttp.ClientSession,
        base_url: str,
        on_keyframes: OnKeyframes,
        on_feed: OnFeed,
        token: TokenProvider,
    ) -> None:
        self._session = session
        self._base = base_url.rstrip("/")
        self._on_keyframes = on_keyframes
        self._on_feed = on_feed
        self._token = token
        self.connected = False
        self.authenticated = False
        self.last_message: float | None = None
        self.last_error: str | None = None
        self.topics_seen: set[str] = set()
        self.failures = 0

    def _headers(self) -> dict[str, str]:
        headers = {"User-Agent": USER_AGENT}
        if token := self._token():
            headers["Authorization"] = f"Bearer {token}"
        return headers

    async def run(self) -> None:
        """Connect and read until cancelled, reconnecting after any failure."""
        backoff = 1.0
        while True:
            started = time.monotonic()
            try:
                await self._connect_once()
                self.last_error = None
            except asyncio.CancelledError:
                raise
            except (aiohttp.ClientError, TimeoutError, ValueError, KeyError) as err:
                self.last_error = f"{type(err).__name__}: {err}"
                self.failures += 1
                _LOGGER.debug("Live timing connection failed: %s", err)
            finally:
                self.connected = False
            # A connection that held for a while resets the backoff.
            if time.monotonic() - started > 60:
                backoff = 1.0
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, BACKOFF_MAX)

    async def _negotiate(self, headers: dict[str, str]) -> tuple[str, str]:
        url = f"{self._base}/negotiate?negotiateVersion=1"
        cookies: dict[str, str] = {}
        # The OPTIONS answer is a 405 carrying the load balancer's affinity cookies.
        async with self._session.options(url, headers=headers, timeout=TIMEOUT) as r:
            cookies.update({k: v.value for k, v in r.cookies.items()})
        async with self._session.post(url, headers=headers, timeout=TIMEOUT) as r:
            if r.status == 401:
                raise aiohttp.ClientResponseError(
                    r.request_info, r.history, status=401, message="unauthorised"
                )
            r.raise_for_status()
            cookies.update({k: v.value for k, v in r.cookies.items()})
            body = await r.json(content_type=None)
        token = body.get("connectionToken") or body["connectionId"]
        cookie = "; ".join(f"{k}={v}" for k, v in cookies.items())
        return token, cookie

    async def _connect_once(self) -> None:
        headers = self._headers()
        authenticated = "Authorization" in headers
        connection, cookie = await self._negotiate(headers)
        ws_headers = dict(headers)
        if cookie:
            ws_headers["Cookie"] = cookie
        url = f"{_ws_url(self._base)}?id={connection}"
        async with self._session.ws_connect(
            url,
            headers=ws_headers,
            heartbeat=None,
            timeout=aiohttp.ClientWSTimeout(ws_close=10),
        ) as ws:
            await ws.send_str(
                json.dumps({"protocol": "json", "version": 1}) + SEPARATOR
            )
            topics = list(PUBLIC_TOPICS) + (list(AUTH_TOPICS) if authenticated else [])
            await ws.send_str(
                json.dumps(
                    {
                        "type": 1,
                        "target": "Subscribe",
                        "arguments": [topics],
                        "invocationId": "0",
                    }
                )
                + SEPARATOR
            )
            self.connected = True
            self.authenticated = authenticated
            self.failures = 0
            self.last_message = time.monotonic()
            pinger = asyncio.create_task(self._ping(ws))
            try:
                await self._read(ws)
            finally:
                pinger.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await pinger

    async def _ping(self, ws: aiohttp.ClientWebSocketResponse) -> None:
        while True:
            await asyncio.sleep(PING_EVERY)
            await ws.send_str(json.dumps({"type": 6}) + SEPARATOR)

    async def _read(self, ws: aiohttp.ClientWebSocketResponse) -> None:
        while True:
            try:
                message = await ws.receive(timeout=SILENCE_LIMIT)
            except TimeoutError:
                _LOGGER.debug("Live timing silent for %ss: reconnecting", SILENCE_LIMIT)
                return
            if message.type in (
                aiohttp.WSMsgType.CLOSE,
                aiohttp.WSMsgType.CLOSED,
                aiohttp.WSMsgType.CLOSING,
                aiohttp.WSMsgType.ERROR,
            ):
                return
            if message.type != aiohttp.WSMsgType.TEXT:
                continue
            self.last_message = time.monotonic()
            for record in records(message.data):
                if self._handle(record):
                    return

    def _handle(self, record: dict[str, Any]) -> bool:
        """Dispatch one record; True when the server is closing."""
        kind = record.get("type")
        if kind == 1 and record.get("target") == "feed":
            arguments = record.get("arguments") or []
            if len(arguments) >= 2 and isinstance(arguments[0], str):
                utc = arguments[2] if len(arguments) > 2 else None
                self.topics_seen.add(arguments[0])
                self._on_feed(arguments[0], arguments[1], utc)
        elif kind == 3 and record.get("invocationId") == "0":
            result = record.get("result")
            if isinstance(result, dict):
                self.topics_seen.update(result)
                self._on_keyframes(result)
            elif record.get("error"):
                self.last_error = str(record["error"])
        elif kind == 7:
            self.last_error = str(record.get("error") or "closed by server")
            return True
        return False
