"""Reading a pasted F1TV token (SPEC §4.5)."""

from __future__ import annotations

import base64
from datetime import UTC, datetime, timedelta
import json
from urllib.parse import quote

from custom_components.pit_lane_live_board.core.f1tv_token import (
    acceptable,
    evaluate,
    extract_token,
    session_expired,
)

NOW = datetime(2026, 9, 26, 12, tzinfo=UTC)


def _part(value: dict) -> str:
    return base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip("=")


def jwt(**claims) -> str:
    return f"{_part({'alg': 'RS256'})}.{_part(claims)}.signature"


def at(delta: timedelta) -> int:
    return int((NOW + delta).timestamp())


def test_extract_from_every_shape_users_paste():
    token = jwt(exp=at(timedelta(days=4)))
    cookie = json.dumps({"data": {"subscriptionToken": token}})
    assert extract_token(token) == token
    assert extract_token(f"  Bearer {token}\n") == token
    assert extract_token(cookie) == token
    assert extract_token(quote(cookie)) == token
    assert extract_token(f'"{token}"') == token
    assert extract_token("hello") is None
    assert extract_token("") is None
    assert extract_token(None) is None
    assert extract_token(quote('{"data": {}}')) is None


def test_statuses():
    session = jwt(exp=at(timedelta(days=30)))
    active = evaluate(
        jwt(
            exp=at(timedelta(days=4)),
            SubscriptionStatus="active",
            SubscribedProduct="F1 TV Pro",
            SessionId=session,
        ),
        NOW,
    )
    assert active.status == "active"
    assert active.product == "F1 TV Pro" and active.session_id == session
    assert evaluate(jwt(exp=at(timedelta(hours=5))), NOW).status == "expiring"
    assert evaluate(jwt(exp=at(-timedelta(minutes=1))), NOW).status == "expired"
    assert evaluate(jwt(), NOW).status == "invalid"
    assert evaluate("a.b.c", NOW).status == "invalid"
    assert evaluate(None, NOW).status == "not_configured"
    inactive = evaluate(
        jwt(exp=at(timedelta(days=4)), SubscriptionStatus="inactive"), NOW
    )
    assert inactive.status == "invalid" and inactive.reason == "no_active_subscription"


def test_what_can_be_saved():
    assert acceptable(evaluate(jwt(exp=at(timedelta(days=4))), NOW), NOW) is None
    assert (
        acceptable(evaluate(jwt(exp=at(timedelta(minutes=5))), NOW), NOW)
        == "token_expired"
    )
    assert acceptable(evaluate(None, NOW), NOW) == "token_missing"
    assert acceptable(evaluate("x.y.z", NOW), NOW) == "token_invalid"
    no_sub = evaluate(jwt(exp=at(timedelta(days=4)), SubscriptionStatus="lapsed"), NOW)
    assert acceptable(no_sub, NOW) == "token_no_subscription"


def test_the_status_never_carries_the_token():
    token = jwt(exp=at(timedelta(days=4)), SessionId="secret-session")
    text = json.dumps(evaluate(token, NOW).to_dict())
    assert token not in text and "secret-session" not in text


def test_login_session_expiry():
    assert session_expired(jwt(exp=at(-timedelta(seconds=1))), NOW)
    assert not session_expired(jwt(exp=at(timedelta(days=1))), NOW)
    assert not session_expired("opaque-id", NOW)
    assert not session_expired(None, NOW)
