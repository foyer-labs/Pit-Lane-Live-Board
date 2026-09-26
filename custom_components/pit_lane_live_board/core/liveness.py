"""INV-2: stale is never shown as live (SPEC §6.3).

The hub records when the last live message arrived (a monotonic clock, in seconds)
and asks here how healthy the feed is.
"""

from __future__ import annotations

STALE_AFTER = 30.0  # the page shows "Live feed lost — reconnecting"
LOST_AFTER = 60.0  # live entities go unavailable, no event fires


def feed_health(last_message: float | None, now: float) -> str:
    """`ok`, `stale` or `lost`. No message yet counts from the connection attempt,
    which the caller passes as `last_message`."""
    if last_message is None:
        return "lost"
    silence = now - last_message
    if silence >= LOST_AFTER:
        return "lost"
    if silence >= STALE_AFTER:
        return "stale"
    return "ok"
