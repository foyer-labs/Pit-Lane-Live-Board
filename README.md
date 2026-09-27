<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/custom_components/pit_lane_live_board/brand/icon.png" alt="Pit Lane Live Board" width="112">
</p>

<h1 align="center">Pit Lane Live Board</h1>

<p align="center"><em>Formula 1 in your Home Assistant sidebar: the live timing tower, the calendar, every race since 1950 and both championships, in one page that is already built.</em></p>

<p align="center"><strong>English</strong> · <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/README.it.md">Italiano</a> · <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.md">📖 Guide</a> · <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/CHANGELOG.md">What's new</a></p>

<p align="center">
  <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/releases"><img src="https://img.shields.io/github/v/release/foyer-labs/Pit-Lane-Live-Board?sort=semver&include_prereleases&label=version" alt="Latest version"></a>
  <img src="https://img.shields.io/badge/Home%20Assistant-2026.6%2B-41BDF5" alt="Home Assistant 2026.6 or later">
  <img src="https://img.shields.io/badge/HACS-custom%20repository-41BDF5" alt="HACS custom repository">
  <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="Apache-2.0"></a>
  <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/actions/workflows/ci.yml"><img src="https://github.com/foyer-labs/Pit-Lane-Live-Board/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
</p>

Other Formula 1 integrations give you sensors, and then you build the dashboard. Pit Lane
Live Board gives you the dashboard: install it, open **Live Board** in the sidebar, and
the whole weekend is there — the timing tower during the session, the calendar before it,
the results and standings after it. Free, with no account.

One install, three ways to use it:

| | |
|---|---|
| 🏁 **A ready-made panel** | Live timing, calendar, results since 1950 and both championships, in the sidebar. |
| 🧩 **Eight dashboard cards** | The timing tower, the track map, flags & stewards, team radio and more, for your own dashboards. Nothing to install, a visual editor for each. |
| ⚡ **Sensors and events** | Safety car, red flag, yellow sectors, penalties, every stewards' decision: triggers for your lights, speakers and phone. |

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/live.png" alt="The Live page during a race: the timing tower with gaps, sectors in purple and green and tyres, the track map, race control and team radio" width="900">
</p>

## What you get

- **The live timing tower.** Position, gap to the leader and to the car ahead, last and
  best lap, the three sectors in purple and green, the tyre each driver is on and how
  many laps it has done, pit stops, and places gained or lost since the start.
- **Qualifying done right.** Q1, Q2 and Q3 with the knockout line, best laps and gaps,
  and the mini-sectors in F1's purple, green and yellow.
- **Every driver's race, one click away.** Their stints with the laps and best lap of
  each, and where a stop now would bring them back out.
- **Flags and stewards at a glance.** The track status, yellow sectors, the safety car
  and its last lap, every penalty (a `+5s` next to the driver until it is served),
  incidents under investigation and deleted laps, in one card above the tower.
- **Race control and weather.** Every message from race control, filtered by flags or
  penalties; air and track temperature, wind and rain.
- **Team radio.** The clips F1 publishes during the session, with a play button.
- **The live track map** — with an F1TV subscription. Every car on the circuit, in its
  team colour. Everything else works without an account.
- **In sync with your TV.** Streams run behind live timing. Set a delay of up to two
  minutes and the page, the radio and your automations wait for your screen.
- **No spoilers.** Watching the race later? No-spoiler mode keeps the weekend's
  results inside Home Assistant until you reveal them.
- **The calendar.** Every session of the season in your own time zone, a countdown to
  the next one, the podium of every weekend already run.
- **Every race since 1950.** Results, qualifying and sprints for any season; lap charts,
  tyre strategies, lap times, pit stops, race control and weather for the modern era.
- **Both championships.** Drivers and constructors, for any season, after any round.
- **After the flag.** Between sessions the Live page keeps the final classification,
  the stewards' decisions and the pit stops, with a countdown to the next session.
- **Easy on a Raspberry Pi.** Live timing starts paused: nothing connects to F1 and
  nothing is written to disk until you press play, or let it start by itself at each
  session.
- **You decide who sees it.** The panel is for the whole house, or for administrators
  only; each dashboard keeps its own visibility.
- **English and Italian**, light and dark, on a phone or a wall tablet.

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/strategy.png" alt="Results: the tyre strategy of every driver in a race, stints coloured by compound" width="820">
</p>

## Your dashboard, your cards

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/cards.png" alt="The dashboard cards: session, timing tower, flags and stewards, track map, race control, team radio, weather and drivers' standings" width="900">
</p>

Every piece of the Live page is also a card. *Edit dashboard → Add card → Pit Lane*,
and pick what you want where you want it:

| Card | What it shows |
|---|---|
| **Timing tower** | Positions, gaps, lap times, sectors and tyres; choose the rows and columns, highlight your driver. |
| **Track map** | Every car on the circuit, live (with F1TV). |
| **Flags & stewards** | Track status, yellow sectors, safety car, penalties, investigations, track limits. |
| **Team radio** | The latest clips, with play. |
| **Race control** | The latest messages, filtered by flags or penalties. |
| **Session** | The session, its lap or clock and track status; afterwards, the countdown to the next one. |
| **Weather** | Air and track temperature, rain, humidity, wind. |
| **Championship** | Drivers' or constructors' standings, top N. |

No resource to add by hand, a visual editor for every card, and the same TV delay and
no-spoiler mode as the panel. A wall tablet with the tower and the flags, a phone
view with just the session and your driver: [the guide](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.md#dashboard-cards)
has examples.

## Sensors and events for automations

| Entity | Use it for |
|---|---|
| `binary_sensor` Safety car · Virtual safety car · Red flag · Yellow flag | Lights that follow the track: amber under the safety car, red for a red flag. |
| `sensor` Track status · Session status · Lap | The state of the session, on any card or in any condition. |
| `sensor` Penalties · Investigations · Race control message | What the stewards are looking at, with the details as attributes. |
| `event` Race control | Green, yellow, safety car, VSC, red, chequered flag, session started and ended. |
| `event` Stewards | One event per decision: time penalty, drive-through, investigation, warning, deleted lap… with driver, seconds and reason. |
| `sensor` Driver LEC · `event` My drivers | Up to five drivers you follow: position, gap, tyre and pits, and an event when they gain a place, take the lead, pit, set the fastest lap or get a penalty. |
| `event` Session summary | Podium, fastest lap, penalties and your drivers when a session ends — also sent to your phones if you choose. |
| `calendar` Sessions · `sensor` Next session | "The race starts in 15 minutes", with no code. |
| `switch` Live timing · No-spoiler mode · `number` TV delay | Control the board from your own automations and voice assistant. |

Everything is released through the TV delay, so the lights change when *your* screen
shows it. Ready-made automations are [in the guide](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.md#entities-and-automations):

```yaml
triggers:
  - trigger: state
    entity_id: event.pit_lane_live_board_stewards
conditions:
  - "{{ 'LEC' in trigger.to_state.attributes.drivers }}"
actions:
  - action: notify.mobile_app_my_phone
    data:
      message: "Penalty for Leclerc: {{ trigger.to_state.attributes.reason }}"
```

## Get started

You need Home Assistant 2026.6 or later and HACS.

1. In HACS, add this repository as a *Custom repository* (category *Integration*),
   download *Pit Lane Live Board* and restart Home Assistant.
2. *Settings → Devices & services → Add integration → Pit Lane Live Board.*
3. Open **Live Board** in the sidebar, open **Settings** (the gear) and press play, or
   turn on *Start automatically at each session*. Calendar, results and standings work
   without it.

For the live track map, an administrator pastes an F1TV token in the panel's
**Settings**; the
**[guide](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.md)**
shows where to find it, how to read the timing tower, how to set the TV delay, and
ready-made automations.

## Documentation

| | |
|---|---|
| [Guide](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.md) | Install, settings, the four pages, reading the timing tower, flags and stewards, TV delay, no-spoiler mode, F1TV, dashboard cards, entities and automations, troubleshooting, FAQ |
| [What's new](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/CHANGELOG.md) | What changes in each version |
| [Support](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/SUPPORT.md) | How to ask for help or report a problem |

## Good to know

- **The data is unofficial.** The live timing and the session archive are the feeds F1
  uses on its own website; they are undocumented and can change or stop without notice.
  Results and standings come from [Jolpica-F1](https://github.com/jolpica/jolpica-f1).
  The project reads them the way one viewer would, with caching, for personal and
  non-commercial use.
- **F1TV is optional.** It is only needed for the live track map. The token stays in
  your Home Assistant and is renewed automatically; about once a month you paste a new
  one.
- **Team radio is F1's selection.** Some sessions have few clips, some have none.

## Status

In use and released by version. Every version is a GitHub release, offered by HACS by
version number, and the [changelog](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/CHANGELOG.md)
lists what changes, anything you need to act on first.

## Support, contributing and licence

Issues and pull requests are welcome and answered as time allows, with no promise of a
reply or a fix ([SUPPORT.md](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/SUPPORT.md),
[CONTRIBUTING.md](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/CONTRIBUTING.md)).
Pit Lane Live Board is the personal, non-commercial project of one person, published as
Foyer Labs; there is no company behind it.

<p align="center">
  <a href="https://www.buymeacoffee.com/foyerlabs" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-green.png" alt="Buy Me a Coffee" height="60"></a>
</p>

A donation is a thank-you and buys neither support nor priority.

Apache-2.0. See [LICENSE](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/LICENSE)
and [NOTICE](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/NOTICE).
Results and standings data: Jolpica-F1, [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

---

<sub>Pit Lane Live Board is unofficial and is not associated in any way with the Formula 1
companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and
related marks are trade marks of Formula One Licensing B.V.</sub>
