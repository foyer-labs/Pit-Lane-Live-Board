"""The session summary: facts and the notification (decisions 53, 56, 59)."""

from __future__ import annotations

import json
from pathlib import Path

from custom_components.pit_lane_live_board.core import summary

TRANSLATIONS = (
    Path(__file__).parents[2] / "custom_components/pit_lane_live_board/translations"
)


def texts(lang: str = "en") -> dict[str, str]:
    data = json.loads((TRANSLATIONS / f"{lang}.json").read_text(encoding="utf-8"))
    return data["selector"]["summary"]["options"]


def car(
    tla, position, gap=None, best=None, gained=None, status="running", laps=57, **more
):
    return {
        "number": tla,
        "tla": tla,
        "name": more.pop("name", None),
        "position": position,
        "gap": gap,
        "gained": gained,
        "best_lap": {"time": best} if best else None,
        "status": status,
        "laps": laps,
        **more,
    }


RACE = [
    car("ANT", 1, "LAP 57", "1:36.030", 1, name="Kimi Antonelli"),
    car("VER", 2, "+4.351", "1:36.760", 1),
    car("NOR", 3, "+5.089", "1:36.680", -2),
    car("LEC", 4, "+29.116", "1:36.063", 1),
    car("RUS", 5, "+29.829", "1:35.587", 0),
    car("LAW", 6, "+86.746", "1:36.846", 2),
    car("BEA", 7, "1L", "1:37.308", 6, laps=56),
    car("ALO", 8, "2L", "1:39.003", -1, laps=55),
    # Retired cars keep a place in F1's order; stopped on track counts as out.
    car("PER", 9, None, None, -3, status="retired", laps=31),
    car("HAM", 10, None, None, -6, status="retired", laps=6),
    car("ALB", None, None, None, None, status="stopped", laps=None),
]
STEWARDS = {
    "penalties": [
        {"kind": "time_penalty", "seconds": 5, "cars": [{"tla": "GAS"}]},
        {"kind": "stop_go", "cars": [{"tla": "SAI"}]},
    ]
}


def race_facts(favourites=("LEC", "HAM"), kind="race"):
    header = {"meeting": "Spanish Grand Prix", "session": "Race", "kind": kind}
    return summary.build(header, RACE, STEWARDS, favourites)


def test_the_facts_of_a_race():
    facts = race_facts()
    assert facts["fastest_lap"] == {"driver": "RUS", "time": "1:35.587"}
    # In the order they stopped, with the lap they stopped on.
    assert facts["retired"] == ["HAM", "PER", "ALB"]
    assert facts["dnf"] == [
        {"driver": "HAM", "lap": 7},
        {"driver": "PER", "lap": 32},
        {"driver": "ALB", "lap": None},
    ]
    assert facts["mover"] == {"driver": "BEA", "grid": 13, "position": 7, "gained": 6}
    assert [p["driver"] for p in facts["podium"]] == ["ANT", "VER", "NOR"]
    assert [y["driver"] for y in facts["yours"]] == ["LEC", "HAM"]


def test_a_race_reads_as_a_headline():
    title, message = summary.render(race_facts(), texts())
    assert title == "🏆 Antonelli wins the Spanish GP"
    assert message.splitlines() == [
        "🥇 ANT · 🥈 VER +4.351 · 🥉 NOR +5.089",
        "★ LEC P4 ▲1 · HAM DNF lap 7",
        "⏱️ Fastest lap: RUS 1:35.587",
        "📈 Biggest mover: BEA P13 → P7",
        "❌ DNF: HAM, PER, ALB",
        "⚖️ Penalties: SAI stop-and-go, GAS +5s",
    ]


def test_a_race_in_italian():
    title, message = summary.render(race_facts(), texts("it"))
    assert title == "🏆 Antonelli vince · Spanish GP"
    assert message.splitlines()[1] == "★ LEC P4 ▲1 · HAM ritirato al giro 7"
    assert "📈 Rimonta: BEA da P13 a P7" in message


def test_the_full_race_classification():
    _, message = summary.render(race_facts(), texts(), full=True)
    assert "❌ DNF: " not in message  # the block below says it
    assert message.split("📋 Classification\n")[1].splitlines() == [
        "🥇 ANT · 1:36.030",
        "🥈 VER +4.351 · 1:36.760",
        "🥉 NOR +5.089 · 1:36.680",
        "4. ★LEC +29.116 · 1:36.063",
        "5. RUS +29.829 · 1:35.587 ⏱️",
        "6. LAW +1:26.746 · 1:36.846",
        "7. BEA +1 lap · 1:37.308",
        "8. ALO +2 laps · 1:39.003",
        "",
        "❌ DNF",
        "★HAM · lap 7",
        "PER · lap 32",
        "ALB",
    ]


def test_no_mover_under_three_places_and_none_on_the_podium():
    rows = [car("ANT", 1, gained=9), car("VER", 2, "+1.0", gained=2)]
    facts = summary.build({"kind": "race"}, rows, None, ())
    assert facts["mover"] is None


def test_a_sprint_title():
    title, _ = summary.render(race_facts(kind="sprint"), texts())
    assert title == "🏆 Antonelli wins the Spanish GP sprint"


def quali(kind="qualifying", gap2="+0.011"):
    def q(tla, position, best, gap, status="running", parts=(None, None, None)):
        return {
            "tla": tla,
            "name": {"NOR": "Lando Norris"}.get(tla),
            "position": position,
            "status": status,
            "qualifying": {"best": best, "gap": gap, "part_bests": list(parts)},
        }

    rows = [
        q("NOR", 1, "1:31.824", None, parts=("1:33", "1:32", "1:31.824")),
        q("ANT", 2, "1:31.835", gap2),
        q("LEC", 3, "1:32.019", "+0.195"),
        q("HUL", 4, "1:33.223", "+0.792", "knocked_out", ("1:34", "1:33.223", None)),
        q("SAI", 5, "1:35.312", "+1.1", "knocked_out", ("1:35.312", None, None)),
        # Out without a time: stays in the last block.
        q("STR", 6, None, None, "knocked_out"),
    ]
    header = {"meeting": "Spanish Grand Prix", "session": "Qualifying", "kind": kind}
    return summary.build(header, rows, None, ("LEC", "HUL"))


def test_qualifying_parts_reached():
    segments = {c["driver"]: c["segment"] for c in quali()["classification"]}
    assert segments == {"NOR": 3, "ANT": 3, "LEC": 3, "HUL": 2, "SAI": 1, "STR": 1}


def test_qualifying_reads_as_a_headline():
    title, message = summary.render(quali(gap2="+0.140"), texts())
    assert title == "⚡ Norris on pole · Spanish GP"
    assert message.splitlines() == [
        "1️⃣ NOR 1:31.824 · 2️⃣ ANT +0.140 · 3️⃣ LEC +0.195",
        # Out in Q2: no gap, it was to another part's leader.
        "★ LEC P3 +0.195 · HUL P4",
    ]


def test_a_close_pole_puts_the_margin_in_the_title():
    title, _ = summary.render(quali(), texts())
    assert title == "⚡ Norris on pole by 0.011s"
    title, _ = summary.render(quali(), texts("it"))
    assert title == "⚡ Norris in pole per 0.011s"


def test_the_full_qualifying_in_its_parts():
    _, message = summary.render(quali(kind="sprint_qualifying"), texts(), full=True)
    assert message.split("\n\n", 1)[1].split("\n") == [
        "📋 SQ3",
        "1. NOR 1:31.824",
        "2. ANT 1:31.835 +0.011",
        "3. ★LEC 1:32.019 +0.195",
        "",
        "🚫 Out in SQ2",
        "4. ★HUL 1:33.223",
        "",
        "🚫 Out in SQ1",
        "5. SAI 1:35.312",
        "6. STR no time",
    ]


def test_practice_names_the_session():
    rows = [
        {
            "tla": "PIA",
            "name": "Oscar Piastri",
            "position": 1,
            "status": "running",
            "best_lap": {"time": "1:32.1"},
            "gap": None,
        },
        {
            "tla": "NOR",
            "position": 2,
            "status": "running",
            "best_lap": {"time": "1:32.3"},
            "gap": "+0.200",
        },
    ]
    header = {
        "meeting": "Italian Grand Prix",
        "session": "Practice 2",
        "kind": "practice",
    }
    facts = summary.build(header, rows, None, ())
    title, message = summary.render(facts, texts("it"), full=True)
    assert title == "⏱️ Libere 2: Piastri il più veloce · Italian GP"
    assert message.splitlines() == [
        "1️⃣ PIA 1:32.1 · 2️⃣ NOR +0.200",
        "",
        "📋 Classifica",
        "1. PIA 1:32.1",
        "2. NOR 1:32.3 +0.200",
    ]


def test_without_a_result_the_title_names_the_session():
    facts = summary.build(
        {"meeting": "M", "session": "Race", "kind": "race"}, [], None, ()
    )
    title, message = summary.render(facts, texts())
    assert title == "🏁 M — Race"
    assert message == ""


def test_the_notify_data_goes_only_where_it_is_understood():
    phone = summary.delivery_data("mobile_app_pixel", "pit-lane-live-board")
    assert phone["url"] == phone["clickAction"] == "/pit-lane-live-board"
    assert phone["tag"] == summary.TAG
    assert summary.delivery_data("persistent_notification", "x") == {
        "notification_id": summary.TAG
    }
    assert summary.delivery_data("telegram", "x") is None


def test_the_templates_have_the_same_placeholders_in_both_languages():
    import re

    en, it = texts("en"), texts("it")
    assert en.keys() == it.keys()
    for key in en:
        assert set(re.findall(r"{\w+}", en[key])) == set(
            re.findall(r"{\w+}", it[key])
        ), key
