"""Merging live deltas into a topic's state (SPEC §4.2).

F1's live timing sends a full keyframe per topic, then partial deltas:

* a dict merges key by key, recursively;
* a dict whose keys are indexes updates a list in place (`{"Sectors": {"2": {...}}}`),
  appending when the index is the next free one;
* `_deleted: [keys]` removes those keys (or list indexes) at that level;
* a list or a scalar replaces what was there.

`merge` mutates `target` when it can and returns the merged value: callers always
store the return value, because a scalar or a list replaces the target outright.
"""

from __future__ import annotations

from typing import Any

DELETED = "_deleted"


def _index(key: Any) -> int | None:
    if isinstance(key, int):
        return key
    if isinstance(key, str) and key.isdigit():
        return int(key)
    return None


def _merge_into_list(target: list[Any], delta: dict[str, Any]) -> list[Any]:
    deleted = delta.get(DELETED)
    for key, value in delta.items():
        if key == DELETED:
            continue
        index = _index(key)
        if index is None:
            # A named key sent against a list: the shape changed upstream. Keep the
            # data rather than lose it, as a dict.
            as_dict = {str(i): v for i, v in enumerate(target)}
            return merge(as_dict, delta)
        if index < len(target):
            target[index] = merge(target[index], value)
        else:
            # Missing indexes in between are filled with None so positions hold.
            target.extend([None] * (index - len(target)))
            target.append(merge(None, value))
    if isinstance(deleted, list):
        for index in sorted(
            (i for i in map(_index, deleted) if i is not None), reverse=True
        ):
            if index < len(target):
                del target[index]
    return target


def merge(target: Any, delta: Any) -> Any:
    """Merge `delta` into `target` and return the result."""
    if isinstance(delta, dict):
        if isinstance(target, list):
            return _merge_into_list(target, delta)
        if not isinstance(target, dict):
            target = {}
        for key, value in delta.items():
            if key == DELETED:
                continue
            target[key] = merge(target.get(key), value)
        deleted = delta.get(DELETED)
        if isinstance(deleted, list):
            for key in deleted:
                target.pop(str(key), None)
        return target
    # Lists and scalars replace. Lists are copied so the caller's delta is never
    # shared with the state.
    if isinstance(delta, list):
        return [merge(None, item) for item in delta]
    return delta
