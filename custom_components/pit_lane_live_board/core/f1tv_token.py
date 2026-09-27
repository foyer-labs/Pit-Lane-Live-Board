"""Reading an F1TV token (SPEC §4.5, INV-3).

The user pastes what they copied from their browser: the bare token, a
`Bearer ...` header, or the whole `loginSession` cookie (URL-encoded JSON holding
`data.subscriptionToken`). All three are accepted.

The token is a JWT. Its claims are read, not verified: F1's servers reject a bad
token anyway, and verifying would need F1's signing keys at setup time. The status
only drives what the page says and when renewal runs.
"""

from __future__ import annotations

import base64
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
import json
from typing import Any
from urllib.parse import unquote

EXPIRING_WITHIN = timedelta(hours=24)
MIN_REMAINING_TO_ACCEPT = timedelta(minutes=10)
STATUSES = ("not_configured", "active", "expiring", "expired", "invalid")


def _jwt_part(part: str) -> dict[str, Any]:
    padded = part + "=" * (-len(part) % 4)
    value = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")))
    if not isinstance(value, dict):
        raise ValueError("not a JSON object")
    return value


def _expiry(exp: Any) -> datetime | None:
    """A JWT `exp` as a datetime, or None when it is not a usable one.

    `bool` is refused although it is an `int`, and so is anything `fromtimestamp`
    cannot represent (`1e20`, `NaN`, which `json.loads` accepts): a pasted token or
    one F1 sends back must end up `invalid`, never as an exception in the options
    flow, the WebSocket command or the renewal check.
    """
    if isinstance(exp, bool) or not isinstance(exp, (int, float)):
        return None
    try:
        return datetime.fromtimestamp(exp, tz=UTC)
    except (OverflowError, OSError, ValueError):
        return None


def extract_token(pasted: Any) -> str | None:
    """The bare JWT from whatever the user pasted, or None."""
    if not isinstance(pasted, str):
        return None
    text = pasted.strip().strip('"').strip()
    if not text:
        return None
    if text.lower().startswith("bearer "):
        text = text[7:].strip()
    if "%7B" in text[:10] or text.startswith("{"):
        try:
            cookie = json.loads(unquote(text))
        except ValueError:
            return None
        data = cookie.get("data") if isinstance(cookie, dict) else None
        token = data.get("subscriptionToken") if isinstance(data, dict) else None
        return token.strip() if isinstance(token, str) and token.strip() else None
    return text if text.count(".") == 2 else None


@dataclass(frozen=True, slots=True)
class TokenStatus:
    status: str
    expires: datetime | None = None
    session_id: str | None = None
    product: str | None = None
    reason: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """What the panel and diagnostics may see: never the token (INV-3)."""
        return {
            "status": self.status,
            "expires": self.expires.isoformat() if self.expires else None,
            "product": self.product,
            "reason": self.reason,
        }


def evaluate(token: str | None, now: datetime) -> TokenStatus:
    if not token:
        return TokenStatus("not_configured")
    parts = token.split(".")
    if len(parts) != 3:
        return TokenStatus("invalid", reason="not_a_token")
    try:
        _jwt_part(parts[0])
        claims = _jwt_part(parts[1])
    except (ValueError, UnicodeDecodeError):
        return TokenStatus("invalid", reason="not_a_token")
    expires = _expiry(claims.get("exp"))
    if expires is None:
        return TokenStatus("invalid", reason="no_expiry")
    subscription = str(claims.get("SubscriptionStatus") or "").lower()
    product = claims.get("SubscribedProduct")
    session_id = claims.get("SessionId")
    common = {
        "expires": expires,
        "session_id": session_id if isinstance(session_id, str) else None,
        "product": product if isinstance(product, str) else None,
    }
    if subscription and subscription != "active":
        return TokenStatus("invalid", reason="no_active_subscription", **common)
    if expires <= now:
        return TokenStatus("expired", reason="expired", **common)
    if expires - now <= EXPIRING_WITHIN:
        return TokenStatus("expiring", **common)
    return TokenStatus("active", **common)


def acceptable(status: TokenStatus, now: datetime) -> str | None:
    """Why a pasted token cannot be saved, as a translation key, or None."""
    if status.status == "not_configured":
        return "token_missing"
    if status.status == "invalid":
        return (
            "token_no_subscription"
            if status.reason == "no_active_subscription"
            else "token_invalid"
        )
    if status.status == "expired" or (
        status.expires is not None and status.expires - now < MIN_REMAINING_TO_ACCEPT
    ):
        return "token_expired"
    return None


def session_expired(session_id: str | None, now: datetime) -> bool:
    """The F1 login session behind the token, when it is itself a JWT with `exp`.

    An opaque session id is left for F1 to judge.
    """
    if not session_id or session_id.count(".") != 2:
        return False
    try:
        exp = _jwt_part(session_id.split(".")[1]).get("exp")
    except (ValueError, UnicodeDecodeError):
        return False
    expires = _expiry(exp)
    return expires is not None and expires <= now
