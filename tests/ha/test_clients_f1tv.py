"""F1TV renewal answers (SPEC §4.5): only F1's own refusal asks for a new token."""

from __future__ import annotations

import base64
from datetime import UTC, datetime, timedelta
import json

from homeassistant.helpers.aiohttp_client import async_get_clientsession

from custom_components.pit_lane_live_board.clients.f1tv import (
    RETRIEVE_SUBSCRIBER,
    RenewalOutcome,
    renew,
)


def token(**claims) -> str:
    part = base64.urlsafe_b64encode(json.dumps(claims).encode()).decode().rstrip("=")
    return f"eyJhbGciOiJSUzI1NiJ9.{part}.sig"


async def outcome(hass, aioclient_mock, **answer) -> str:
    now = datetime.now(UTC)
    old = token(exp=int((now + timedelta(hours=10)).timestamp()), SessionId="s-1")
    aioclient_mock.clear_requests()
    aioclient_mock.post(RETRIEVE_SUBSCRIBER, **answer)
    return (await renew(async_get_clientsession(hass), old, now))[0]


async def test_a_bot_wall_403_is_retried_not_a_repair(hass, aioclient_mock):
    wall = "<html><body>Request blocked</body></html>"
    assert await outcome(hass, aioclient_mock, status=403, text=wall) == (
        RenewalOutcome.RETRY
    )
    assert await outcome(hass, aioclient_mock, status=403) == RenewalOutcome.RETRY
    assert await outcome(
        hass, aioclient_mock, status=403, json={"Fault": {"message": "Session"}}
    ) == (RenewalOutcome.PAIRING)
    assert await outcome(hass, aioclient_mock, status=401) == RenewalOutcome.PAIRING


async def test_a_renewed_token_with_an_absurd_expiry_is_retried(hass, aioclient_mock):
    absurd = token(exp=1e20, SessionId="s-1")
    assert await outcome(
        hass, aioclient_mock, json={"data": {"subscriptionToken": absurd}}
    ) == (RenewalOutcome.RETRY)
