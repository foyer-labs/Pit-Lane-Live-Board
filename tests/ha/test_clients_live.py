"""The live timing client's resilience (SPEC §4.2, §5.2): it never dies but on
cancellation, backs off with jitter, honours Retry-After, and blames the F1TV
token only when leaving it out makes the difference."""

from __future__ import annotations

import asyncio
from typing import Any
from unittest.mock import patch

import aiohttp
from multidict import CIMultiDict
import pytest

from custom_components.pit_lane_live_board.clients import livetiming
from custom_components.pit_lane_live_board.clients.livetiming import (
    LiveTimingClient,
    records,
)


class Stop(BaseException):
    """Ends a test's run() loop from inside its sleep."""


def _error(status: int, headers: dict[str, str] | None = None) -> Exception:
    return aiohttp.ClientResponseError(
        None,  # type: ignore[arg-type]
        (),
        status=status,
        headers=CIMultiDict(headers or {}),
    )


class FakeResponse:
    def __init__(self, status: int = 200, body: Any = None, headers=None) -> None:
        self.status = status
        self._body = body
        self.cookies: dict[str, Any] = {}
        self.headers = CIMultiDict(headers or {})
        self.request_info = None
        self.history = ()

    async def __aenter__(self) -> FakeResponse:
        return self

    async def __aexit__(self, *_: Any) -> None:
        return None

    def raise_for_status(self) -> None:
        if self.status >= 400:
            raise _error(self.status, dict(self.headers))

    async def json(self, **_: Any) -> Any:
        return self._body


class FakeWebSocket:
    def __init__(self, frames: list[str]) -> None:
        self._frames = list(frames)
        self.sent: list[str] = []

    async def __aenter__(self) -> FakeWebSocket:
        return self

    async def __aexit__(self, *_: Any) -> None:
        return None

    async def send_str(self, data: str) -> None:
        self.sent.append(data)

    async def receive(self, timeout: float | None = None) -> aiohttp.WSMessage:  # noqa: ASYNC109
        if self._frames:
            return aiohttp.WSMessage(aiohttp.WSMsgType.TEXT, self._frames.pop(0), None)
        return aiohttp.WSMessage(aiohttp.WSMsgType.CLOSED, None, None)


class FakeSession:
    """Negotiate answers from `negotiate`, one per attempt (the last repeats)."""

    def __init__(self, negotiate: list[Any], frames: list[str] | None = None) -> None:
        self.negotiate = negotiate
        self.frames = frames or []
        self.posts: list[dict[str, str]] = []
        self.sockets = 0

    def options(self, *_: Any, **__: Any) -> FakeResponse:
        return FakeResponse(405)

    def post(self, _url: str, headers: dict[str, str], **__: Any) -> FakeResponse:
        self.posts.append(headers)
        answer = self.negotiate[min(len(self.posts), len(self.negotiate)) - 1]
        return answer if isinstance(answer, FakeResponse) else FakeResponse(200, answer)

    async def ws_connect(self, *_: Any, **__: Any) -> FakeWebSocket:
        self.sockets += 1
        return FakeWebSocket(self.frames)


def client(session: Any, token: str | None = None, refused: list | None = None):
    return LiveTimingClient(
        session,
        "https://x/signalrcore",
        lambda _k: None,
        lambda *_a: None,
        lambda: token,
        on_refused=(lambda: refused.append(1)) if refused is not None else None,
    )


async def run_for(live: LiveTimingClient, attempts: int) -> list[float]:
    """Run until `attempts` sleeps between attempts; the sleeps' lengths."""
    sleeps: list[float] = []

    async def sleep(seconds: float) -> None:
        sleeps.append(seconds)
        if len(sleeps) >= attempts:
            raise Stop

    with patch.object(livetiming.asyncio, "sleep", sleep), pytest.raises(Stop):
        await live.run()
    return sleeps


@pytest.mark.parametrize("body", [None, [], "x", 5, {"nothing": 1}])
async def test_a_strange_negotiate_is_a_failure_not_the_end(body):
    session = FakeSession([body])
    live = client(session)
    await run_for(live, 3)
    assert len(session.posts) == 3
    assert live.failures == 3 and live.last_error.startswith("ValueError")


async def test_any_exception_reconnects():
    live = client(FakeSession([]))
    calls = 0

    async def boom() -> None:
        nonlocal calls
        calls += 1
        raise RuntimeError("surprise")

    live._connect_once = boom  # type: ignore[method-assign]
    await run_for(live, 4)
    assert calls == 4 and live.last_error == "RuntimeError: surprise"


async def test_cancellation_still_ends_it():
    live = client(FakeSession([None]))
    task = asyncio.create_task(live.run())
    await asyncio.sleep(0.05)
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task


async def test_a_bad_feed_record_does_not_kill_the_connection():
    frames = [
        '{"type":1,"target":"feed","arguments":5}\x1e',
        '{"type":1,"target":"feed","arguments":{"a":1}}\x1e',
        "[" * 100_000 + "\x1e",
        '{"type":1,"target":"feed","arguments":["LapCount",{"CurrentLap":2},"t"]}\x1e',
    ]
    feed: list[Any] = []
    session = FakeSession([{"connectionToken": "c"}], frames)
    live = LiveTimingClient(
        session, "https://x", lambda _k: None, lambda *a: feed.append(a), lambda: None
    )
    await run_for(live, 1)
    assert feed == [("LapCount", {"CurrentLap": 2}, "t")]
    assert live.last_error == "LiveTimingError: connection closed"
    assert not live.connected and not live.authenticated


async def test_backoff_is_jittered_and_capped():
    live = client(FakeSession([FakeResponse(502)]))
    sleeps = await run_for(live, 8)
    for seconds, ceiling in zip(sleeps, (1, 2, 4, 8, 16, 30, 30, 30), strict=True):
        assert ceiling / 2 <= seconds <= ceiling


async def test_retry_after_is_honoured_and_capped():
    live = client(
        FakeSession(
            [
                FakeResponse(429, headers={"Retry-After": "120"}),
                FakeResponse(503, headers={"Retry-After": "99999"}),
                FakeResponse(503, headers={"Retry-After": "Wed, 21 Oct 2026"}),
            ]
        )
    )
    sleeps = await run_for(live, 3)
    assert sleeps[0] == 120 and sleeps[1] == livetiming.RETRY_AFTER_MAX
    assert sleeps[2] <= 4


async def test_the_token_is_blamed_only_when_leaving_it_out_works():
    refused: list[int] = []
    session = FakeSession(
        [FakeResponse(403), {"connectionToken": "c"}], ['{"type":6}\x1e']
    )
    live = client(session, token="jwt", refused=refused)
    await run_for(live, 2)
    assert "Authorization" in session.posts[0]
    assert "Authorization" not in session.posts[1]
    assert refused == [1]


async def test_a_403_for_everyone_is_not_the_tokens_fault():
    refused: list[int] = []
    session = FakeSession([FakeResponse(403)])
    live = client(session, token="jwt", refused=refused)
    await run_for(live, 4)
    # With, without, then with the token again: it is still offered.
    assert ["Authorization" in h for h in session.posts] == [True, False, True, False]
    assert refused == []


async def test_silence_is_a_failure_and_checked_on_time():
    live = client(FakeSession([{"connectionToken": "c"}]))
    # Silence counts from the later of the connection and the last message:
    # make the connection the only clock, 2 s before the limit.
    live.last_message = None
    live._connected_at = livetiming.time.monotonic() - livetiming.SILENCE_LIMIT + 2
    timeouts: list[float] = []

    class Quiet:
        async def receive(self, timeout: float) -> aiohttp.WSMessage:  # noqa: ASYNC109
            timeouts.append(timeout)
            await asyncio.sleep(0)
            live._connected_at -= timeout
            raise TimeoutError

    with pytest.raises(TimeoutError, match="no live data"):
        await live._read(Quiet())  # type: ignore[arg-type]
    assert timeouts[0] <= 2


def test_a_handshake_error_ends_the_connection():
    live = client(None)
    assert live._handle({"error": "no such hub"}) is True
    assert live.last_error == "handshake: no such hub"
    assert live._handle({}) is False


def test_deep_nesting_is_a_damaged_record():
    assert records("[" * 100_000 + "\x1e{}") == [{}]


async def test_a_failed_pinger_does_not_swallow_a_cancellation():
    started = asyncio.Event()

    class Socket(FakeWebSocket):
        async def send_str(self, data: str) -> None:
            if '"type": 6' in data:
                raise aiohttp.ClientConnectionResetError("closing")
            self.sent.append(data)

        async def receive(self, timeout: float | None = None) -> aiohttp.WSMessage:  # noqa: ASYNC109
            started.set()
            await asyncio.sleep(3600)
            raise AssertionError

    class Session(FakeSession):
        async def ws_connect(self, *_: Any, **__: Any) -> FakeWebSocket:
            return Socket([])

    live = client(Session([{"connectionToken": "c"}]))
    with patch.object(livetiming, "PING_EVERY", 0):
        task = asyncio.create_task(live.run())
        await started.wait()
        await asyncio.sleep(0.01)  # the pinger has failed by now
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await asyncio.wait_for(task, 2)
