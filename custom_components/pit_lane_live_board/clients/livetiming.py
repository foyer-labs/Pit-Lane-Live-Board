"""F1 live timing over SignalR Core (SPEC §4.2).

Negotiate (OPTIONS for the load-balancer cookies, then POST for the connection
token), open the websocket, handshake, subscribe, then read. Messages are JSON
records separated by `\\x1e`:

* `type 3` answers our Subscribe with the keyframes;
* `type 1, target "feed"` carries `[topic, delta, utc]`;
* `type 6` is a ping (we send one every 15 s so the server keeps us);
* `type 7` is the server closing.

Only data counts as life (INV-2): the server's pings keep the socket open even when
F1's publisher has stalled, so `last_message` moves only with keyframes and feed
records, and 45 s without data counts as a dead connection. The client reconnects by
itself with a capped, jittered backoff, and waits as long as F1 asks on 429/503.

When F1 answers 401/403 while we offer the F1TV token, the client tries once
without it. Only if that works was it the token: then it tells the hub (which marks
the token refused and stops offering it) and goes on without it, losing only the
map. Otherwise the refusal was not about the token, which is offered again.
"""

from __future__ import annotations

import asyncio
from collections.abc import Callable
import json
import logging
import random
import time
from typing import Any

import aiohttp

from ..const import USER_AGENT
from ..core.live_state import AUTH_TOPICS, PUBLIC_TOPICS
from .http import retry_after

_LOGGER = logging.getLogger(__name__)

SEPARATOR = "\x1e"
PING_EVERY = 15.0
SILENCE_LIMIT = 45.0
BACKOFF_MAX = 30.0
TIMEOUT = aiohttp.ClientTimeout(total=20)
RETRY_AFTER_MAX = 300.0

type OnKeyframes = Callable[[dict[str, Any]], None]
type OnFeed = Callable[[str, Any, str | None], None]
type TokenProvider = Callable[[], str | None]
type OnRefused = Callable[[], None]


class LiveTimingError(Exception):
    """The connection ended: closed by F1, or refused at the handshake."""


# Failures of the network or of F1's answers: logged quietly. Anything else is a
# bug or a surprise, logged loudly, and reconnected from all the same.
_EXPECTED = (aiohttp.ClientError, TimeoutError, ValueError, KeyError, LiveTimingError)


def _retry_after(err: aiohttp.ClientResponseError) -> float | None:
    """The seconds F1 asks for on 429/503 (`Retry-After`), capped; else None."""
    if err.status not in (429, 503):
        return None
    # A date, or garbage, leaves it to the ordinary backoff.
    seconds = retry_after(err.headers)
    return None if seconds is None else min(seconds, RETRY_AFTER_MAX)


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
        except (ValueError, RecursionError):
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
        *,
        on_refused: OnRefused | None = None,
    ) -> None:
        self._session = session
        self._base = base_url.rstrip("/")
        self._on_keyframes = on_keyframes
        self._on_feed = on_feed
        self._token = token
        self._on_refused = on_refused
        self.connected = False
        self.authenticated = False
        self.last_message: float | None = None
        self.last_error: str | None = None
        self.topics_seen: set[str] = set()
        self.failures = 0
        self._connected_at = 0.0
        # Whether the last attempt carried the token, and whether this one is the
        # attempt without it that tells a refused token from a refused client.
        self._offered = False
        self._probing = False

    def _headers(self) -> dict[str, str]:
        headers = {"User-Agent": USER_AGENT}
        if not self._probing and (token := self._token()):
            headers["Authorization"] = f"Bearer {token}"
        return headers

    async def run(self) -> None:
        """Connect and read until cancelled, reconnecting after any failure.

        Nothing but a cancellation ends this loop. The hub starts it once per
        window and does not watch it: an exception escaping here would leave the
        rest of the session without data and without a single reconnect.
        """
        backoff = 1.0
        while True:
            started = time.monotonic()
            probe = self._probing
            wait: float | None = None
            try:
                await self._connect_once()
            except asyncio.CancelledError:
                raise
            except aiohttp.ClientResponseError as err:
                self._failed(f"HTTP {err.status}")
                wait = _retry_after(err)
                if (
                    err.status in (401, 403)
                    and self._offered
                    and not probe
                    and self._on_refused is not None
                ):
                    # A WAF, a geo block or an edge fault answers 403 too: the
                    # token is blamed only if the same connection works without it.
                    self._probing = True
                    wait = random.uniform(0.5, 1.0)
            except _EXPECTED as err:
                self._failed(f"{type(err).__name__}: {err}")
                _LOGGER.debug("Live timing connection failed: %s", err)
            except Exception as err:
                self._failed(f"{type(err).__name__}: {err}")
                # The traceback once per run of failures, not every 30 s.
                _LOGGER.warning(
                    "Live timing client error, reconnecting: %s",
                    self.last_error,
                    exc_info=self.failures == 1,
                )
            finally:
                self.connected = False
                self.authenticated = False
                if probe:
                    self._probing = False
            # A connection that held for a while resets the backoff.
            if time.monotonic() - started > 60:
                backoff = 1.0
            # Jittered, so installations that lost the feed at the same instant
            # do not come back in step.
            await asyncio.sleep(
                wait if wait is not None else random.uniform(backoff / 2, backoff)
            )
            backoff = min(backoff * 2, BACKOFF_MAX)

    def _failed(self, error: str) -> None:
        self.last_error = error
        self.failures += 1

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
        # An empty 200 or a JSON list from a CDN in maintenance is a failed
        # negotiate, not a crash.
        if not isinstance(body, dict):
            raise ValueError("negotiate: not a JSON object")
        token = body.get("connectionToken") or body.get("connectionId")
        if not isinstance(token, str) or not token:
            raise ValueError("negotiate: no connection token")
        cookie = "; ".join(f"{k}={v}" for k, v in cookies.items())
        return token, cookie

    async def _connect_once(self) -> None:
        """One connection, from negotiate to its end; always ends by raising."""
        headers = self._headers()
        authenticated = self._offered = "Authorization" in headers
        connection, cookie = await self._negotiate(headers)
        ws_headers = dict(headers)
        if cookie:
            ws_headers["Cookie"] = cookie
        url = f"{_ws_url(self._base)}?id={connection}"
        # The upgrade gets the same 20 s as negotiate: under the session's default
        # an edge that stalls the 101 would hold us for 5 minutes, long after the
        # connection token expired.
        async with asyncio.timeout(TIMEOUT.total):
            ws = await self._session.ws_connect(
                url,
                headers=ws_headers,
                heartbeat=None,
                timeout=aiohttp.ClientWSTimeout(ws_close=10),
            )
        async with ws:
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
            self.last_error = None
            self._connected_at = time.monotonic()
            if self._probing and self._on_refused is not None:
                # Refused with the token, let in without it: it was the token.
                # Tell the hub, which stops offering it.
                _LOGGER.warning("F1 refused the F1TV token: continuing without it")
                self._probing = False
                self._on_refused()
            pinger = asyncio.create_task(self._ping(ws))
            try:
                await self._read(ws)
            finally:
                pinger.cancel()
                # `wait` never raises the pinger's own error, which raised here
                # would replace (and so swallow) our own cancellation.
                await asyncio.wait([pinger])
                if not pinger.cancelled() and pinger.exception() is not None:
                    _LOGGER.debug("Live timing ping failed: %s", pinger.exception())

    async def _ping(self, ws: aiohttp.ClientWebSocketResponse) -> None:
        while True:
            await asyncio.sleep(PING_EVERY)
            await ws.send_str(json.dumps({"type": 6}) + SEPARATOR)

    def _silent_for(self) -> float:
        since = max(self.last_message or 0.0, self._connected_at)
        return time.monotonic() - since

    async def _read(self, ws: aiohttp.ClientWebSocketResponse) -> None:
        """Read until the connection ends, which it reports by raising."""
        while True:
            # Woken no later than the silence limit, so a dead connection is
            # dropped at 45 s and not up to one receive timeout later.
            remaining = SILENCE_LIMIT - self._silent_for()
            if remaining <= 0:
                raise TimeoutError(f"no live data for {SILENCE_LIMIT:.0f} s")
            try:
                message = await ws.receive(timeout=max(0.1, min(PING_EVERY, remaining)))
            except TimeoutError:
                continue
            if message.type in (
                aiohttp.WSMsgType.CLOSE,
                aiohttp.WSMsgType.CLOSED,
                aiohttp.WSMsgType.CLOSING,
                aiohttp.WSMsgType.ERROR,
            ):
                raise LiveTimingError("connection closed")
            if message.type != aiohttp.WSMsgType.TEXT:
                continue
            for record in records(message.data):
                if self._handle(record):
                    raise LiveTimingError(self.last_error or "closed by server")

    def _handle(self, record: dict[str, Any]) -> bool:
        """Dispatch one record; True when the server is closing."""
        kind = record.get("type")
        if kind == 1 and record.get("target") == "feed":
            arguments = record.get("arguments")
            if (
                isinstance(arguments, list)
                and len(arguments) >= 2
                and isinstance(arguments[0], str)
            ):
                self.last_message = time.monotonic()
                utc = arguments[2] if len(arguments) > 2 else None
                self.topics_seen.add(arguments[0])
                self._on_feed(arguments[0], arguments[1], utc)
        elif kind == 3 and record.get("invocationId") == "0":
            result = record.get("result")
            if isinstance(result, dict):
                self.last_message = time.monotonic()
                self.topics_seen.update(result)
                self._on_keyframes(result)
            elif record.get("error"):
                self.last_error = str(record["error"])
        elif kind == 7:
            self.last_error = str(record.get("error") or "closed by server")
            return True
        elif kind is None and record.get("error"):
            # The handshake's answer: `{}`, or `{"error": ...}` when refused.
            self.last_error = f"handshake: {record['error']}"
            return True
        return False
