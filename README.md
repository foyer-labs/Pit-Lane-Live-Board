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

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/live.png" alt="The Live page during a race: the timing tower with gaps, sectors in purple and green and tyres, the track map, race control and team radio" width="900">
</p>

## What you get

- **The live timing tower.** Position, gap to the leader and to the car ahead, last and
  best lap, the three sectors in purple and green, the tyre each driver is on and how
  many laps it has done, pit stops, and places gained or lost since the start.
- **Qualifying done right.** Q1, Q2 and Q3 with the knockout line, best laps and gaps.
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
- **Automations.** A calendar of sessions, the track status, safety car, VSC, red and
  yellow flag sensors, penalties and investigations, and events for race control and
  every stewards' decision: the lights turn yellow with the safety car, your phone
  tells you your driver got a penalty or that the race starts in 15 minutes.
- **Easy on a Raspberry Pi.** Live timing starts paused: nothing connects to F1 and
  nothing is written to disk until you press play, or let it start by itself at each
  session.
- **Cards for your own dashboards.** Timing tower, track map, flags & stewards, team
  radio, race control, session, weather and championship, each a card with a visual
  editor, ready in the card picker with nothing to install.
- **You decide who sees it.** The panel is for the whole house, or for administrators
  only; each dashboard keeps its own visibility.
- **English and Italian**, light and dark, on a phone or a wall tablet.

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/strategy.png" alt="Results: the tyre strategy of every driver in a race, stints coloured by compound" width="820">
</p>

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
