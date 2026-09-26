"""Merging live deltas (SPEC §4.2)."""

from __future__ import annotations

import copy

from hypothesis import given, strategies as st

from custom_components.pit_lane_live_board.core.merge import merge


def test_dicts_merge_key_by_key():
    state = {"Lines": {"1": {"Position": "1", "GapToLeader": ""}}}
    merged = merge(
        state, {"Lines": {"1": {"GapToLeader": "+1.2"}, "4": {"Position": "2"}}}
    )
    assert merged == {
        "Lines": {"1": {"Position": "1", "GapToLeader": "+1.2"}, "4": {"Position": "2"}}
    }


def test_index_keys_update_a_list_in_place():
    state = {"Sectors": [{"Value": "30.1"}, {"Value": ""}, {"Value": ""}]}
    merged = merge(
        state, {"Sectors": {"1": {"Value": "35.0", "PersonalFastest": True}}}
    )
    assert merged["Sectors"][1] == {"Value": "35.0", "PersonalFastest": True}
    assert merged["Sectors"][0] == {"Value": "30.1"}


def test_the_next_index_appends():
    state = {"Stints": [{"Compound": "SOFT"}]}
    merged = merge(state, {"Stints": {"1": {"Compound": "HARD", "TotalLaps": 0}}})
    assert [s["Compound"] for s in merged["Stints"]] == ["SOFT", "HARD"]


def test_a_gap_in_indexes_keeps_positions():
    merged = merge([], {"2": "c"})
    assert merged == [None, None, "c"]


def test_deleted_removes_keys():
    state = {"PitTimes": {"3": {"Duration": "31.0"}, "44": {"Duration": "30.2"}}}
    merged = merge(state, {"PitTimes": {"_deleted": ["3"]}})
    assert merged == {"PitTimes": {"44": {"Duration": "30.2"}}}


def test_deleted_inside_a_value():
    state = {"BestLapTime": {"Value": "1:31.8", "Lap": 18}}
    merged = merge(state, {"BestLapTime": {"Value": "", "_deleted": ["Lap"]}})
    assert merged == {"BestLapTime": {"Value": ""}}


def test_deleted_list_indexes():
    merged = merge({"Messages": ["a", "b", "c"]}, {"Messages": {"_deleted": ["0", 2]}})
    assert merged == {"Messages": ["b"]}


def test_lists_and_scalars_replace():
    assert merge({"a": [1, 2, 3]}, {"a": [9]}) == {"a": [9]}
    assert merge({"a": {"b": 1}}, {"a": "x"}) == {"a": "x"}
    assert merge("old", {"b": 1}) == {"b": 1}


def test_a_named_key_against_a_list_keeps_the_data():
    merged = merge([{"x": 1}], {"Name": "new"})
    assert merged == {"0": {"x": 1}, "Name": "new"}


def test_the_delta_is_never_shared_with_the_state():
    delta = {"a": {"b": [1, {"c": 2}]}}
    state = merge(None, delta)
    state["a"]["b"][1]["c"] = 99
    assert delta == {"a": {"b": [1, {"c": 2}]}}


json_values = st.recursive(
    st.none() | st.booleans() | st.integers() | st.text(max_size=5),
    lambda children: (
        st.lists(children, max_size=4)
        | st.dictionaries(
            st.text("abcXYZ", min_size=1, max_size=3), children, max_size=4
        )
    ),
    max_leaves=20,
)


@given(json_values)
def test_merging_into_nothing_copies(value):
    assert merge(None, copy.deepcopy(value)) == value


@given(st.dictionaries(st.text("abc", min_size=1, max_size=2), json_values, max_size=5))
def test_merging_a_dict_into_itself_changes_nothing(value):
    assert merge(copy.deepcopy(value), copy.deepcopy(value)) == value
