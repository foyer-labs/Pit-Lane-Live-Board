"""F1TV token renewal (SPEC §4.5).

The renewal asks F1's account API for a fresh subscription token, using the login
session id carried inside the current one. It relies on constants of F1's own web
client, the same ones F1 Sensor uses (MIT, credited in NOTICE); they are the most
fragile part of the project and live here only. When they break, only the live
map stops: everything else never touches F1TV.
"""

from __future__ import annotations

from datetime import datetime
import logging

import aiohttp

from ..core.f1tv_token import acceptable, evaluate, session_expired

_LOGGER = logging.getLogger(__name__)

RETRIEVE_SUBSCRIBER = (
    "https://api.formula1.com/v1/account/Subscriber/RetrieveSubscriber"
)
F1_API_KEY = "fCUCjWrKPu9ylJwRAv8BpGLEgiAuThx7"
F1_SYSTEM_ID = "60a9ad84-e93d-480f-80d6-af37494f2e22"
# F1's account API answers browsers; it is asked the way a browser asks.
BROWSER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
)
TIMEOUT = aiohttp.ClientTimeout(total=15)


class RenewalOutcome:
    RENEWED = "renewed"
    RETRY = "retry"  # a temporary failure: try again later
    PAIRING = "pairing"  # the login session is over: the user must paste again


async def renew(
    session: aiohttp.ClientSession, token: str, now: datetime
) -> tuple[str, str | None]:
    """`(outcome, new token or None)`."""
    status = evaluate(token, now)
    if status.session_id is None or session_expired(status.session_id, now):
        return RenewalOutcome.PAIRING, None
    headers = {
        "User-Agent": BROWSER_AGENT,
        "Content-Type": "application/json",
        "apikey": F1_API_KEY,
        "CD-SystemId": F1_SYSTEM_ID,
        "cd-sessionid": status.session_id,
        "orderSubmitted": "true",
    }
    try:
        async with session.post(
            RETRIEVE_SUBSCRIBER,
            headers=headers,
            json={},
            timeout=TIMEOUT,
            allow_redirects=False,
        ) as response:
            code = response.status
            data = await response.json(content_type=None) if code == 200 else None
    except (aiohttp.ClientError, TimeoutError, ValueError) as err:
        _LOGGER.debug("F1TV renewal failed: %s", type(err).__name__)
        return RenewalOutcome.RETRY, None
    if code in (401, 403):
        return RenewalOutcome.PAIRING, None
    if code != 200 or not isinstance(data, dict):
        return RenewalOutcome.RETRY, None
    subscriber = data.get("data")
    new = subscriber.get("subscriptionToken") if isinstance(subscriber, dict) else None
    if not isinstance(new, str) or not new.strip():
        return RenewalOutcome.RETRY, None
    new = new.strip()
    fresh = evaluate(new, now)
    if (
        acceptable(fresh, now) is not None
        or new == token
        or (status.expires and fresh.expires and fresh.expires <= status.expires)
    ):
        return RenewalOutcome.RETRY, None
    return RenewalOutcome.RENEWED, new
