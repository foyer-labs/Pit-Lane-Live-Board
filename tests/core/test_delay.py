"""The TV-delay buffer (SPEC §8)."""

from __future__ import annotations

from hypothesis import given, strategies as st

from custom_components.pit_lane_live_board.core.delay import DelayBuffer


def test_no_delay_releases_at_once():
    buffer: DelayBuffer[str] = DelayBuffer(0)
    buffer.push(10.0, "a")
    assert buffer.release(10.0) == ["a"]


def test_a_delay_holds_until_due():
    buffer: DelayBuffer[str] = DelayBuffer(30)
    buffer.push(10.0, "a")
    buffer.push(12.0, "b")
    assert buffer.release(39.9) == []
    assert buffer.syncing() is True
    assert buffer.next_release_in(39.0) == 1.0
    assert buffer.release(40.0) == ["a"]
    assert buffer.syncing() is False
    assert buffer.release(42.0) == ["b"]
    assert buffer.next_release_in(42.0) is None


def test_raising_the_delay_freezes_the_output():
    buffer: DelayBuffer[str] = DelayBuffer(5)
    buffer.push(0.0, "a")
    buffer.set_delay(20)
    assert buffer.release(10.0) == []
    assert buffer.release(20.0) == ["a"]


def test_lowering_the_delay_lets_the_backlog_through():
    buffer: DelayBuffer[str] = DelayBuffer(60)
    for t in range(5):
        buffer.push(float(t), str(t))
    buffer.set_delay(0)
    assert buffer.release(5.0) == ["0", "1", "2", "3", "4"]


def test_the_delay_is_clamped():
    assert DelayBuffer(500).delay == 120
    buffer: DelayBuffer[str] = DelayBuffer(0)
    buffer.set_delay(-3)
    assert buffer.delay == 0


def test_nothing_waits_longer_than_the_maximum():
    buffer: DelayBuffer[str] = DelayBuffer(120)
    buffer.push(0.0, "a")
    assert buffer.release(119.0) == []
    assert buffer.release(120.5) == ["a"]


def test_reset_drops_what_was_held():
    buffer: DelayBuffer[str] = DelayBuffer(30)
    buffer.push(0.0, "a")
    buffer.reset()
    assert len(buffer) == 0
    assert buffer.release(100.0) == []
    assert buffer.syncing() is False


@given(
    st.lists(st.floats(min_value=0, max_value=1000), max_size=30),
    st.integers(min_value=0, max_value=120),
    st.lists(st.floats(min_value=0, max_value=1300), max_size=10),
)
def test_never_early_never_reordered(arrivals, delay, checks):
    arrivals = sorted(arrivals)
    buffer: DelayBuffer[int] = DelayBuffer(delay)
    for i, t in enumerate(arrivals):
        buffer.push(t, i)
    released: list[int] = []
    for now in sorted(checks):
        for i in buffer.release(now):
            assert arrivals[i] + delay <= now
            released.append(i)
    assert released == sorted(released)


def test_last_released_is_the_receive_time_of_what_is_shown():
    buffer: DelayBuffer[str] = DelayBuffer(10)
    assert buffer.last_released is None
    buffer.push(1.0, "a")
    buffer.push(3.0, "b")
    buffer.release(12.0)
    assert buffer.last_released == 1.0
    buffer.release(20.0)
    assert buffer.last_released == 3.0
