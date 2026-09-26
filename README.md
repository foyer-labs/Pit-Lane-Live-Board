<h1 align="center">Pit Lane Live Board</h1>

<p align="center"><em>Formula 1 in your Home Assistant sidebar: the live timing tower, the calendar, every race since 1950 and both championships, in one page that is already built.</em></p>

<p align="center"><strong>English</strong> · <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/README.it.md">Italiano</a></p>

<p align="center">
  <img src="https://img.shields.io/badge/status-in%20design-orange" alt="Status: in design">
  <img src="https://img.shields.io/badge/Home%20Assistant-2026.6%2B-41BDF5" alt="Home Assistant 2026.6 or later">
  <img src="https://img.shields.io/badge/HACS-custom%20repository-41BDF5" alt="HACS custom repository">
  <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="Apache-2.0"></a>
</p>

> **Status: in design.** There is no release yet, and nothing below can be installed
> today. This page describes what the first version is being built to do; it will say so
> plainly when each part is real.

Other Formula 1 integrations give you sensors, and then you build the dashboard. Pit Lane
Live Board gives you the dashboard: install it, open **Live Board** in the sidebar, and
the whole weekend is there — the timing tower during the session, the calendar before it,
the results and standings after it.

## What you get

- **The live timing tower.** Position, gap to the leader and to the car ahead, last and
  best lap, the three sectors in purple and green, the tyre each driver is on and how
  many laps it has done, pit stops, and places gained or lost since the start.
- **Qualifying and practice done right.** Q1, Q2 and Q3 with the knockout zone,
  best laps and gaps to P1.
- **Race control and weather.** Flags, safety car, virtual safety car, red flags,
  penalties and every steward message; air and track temperature, wind and rain.
- **Team radio.** The clips F1 publishes during the session, with a play button
  next to each driver.
- **The live track map** — with an F1TV subscription. Every car on the circuit, in its
  team colour. Everything else works without an account.
- **In sync with your TV.** Streams run behind live timing. Set a delay of up to two
  minutes and the page, the radio and your automations wait for your screen.
- **No spoilers.** Watching the race later? Switch on no-spoiler mode and the weekend's
  results stay hidden until you reveal them.
- **The calendar.** Every session of the season in your own time zone, with a countdown
  to the next one.
- **Every race since 1950.** Results, qualifying and sprints for any season; lap charts,
  tyre strategies, lap times, pit stops and race control for the modern era.
- **Both championships.** Drivers and constructors, for any season, after any round.
- **Automations.** A calendar of sessions, the track status and a race-control event, so
  the lights turn yellow with the safety car and your phone tells you the race starts in
  15 minutes.
- **English and Italian**, light and dark, on a phone or a wall tablet.

## Get started

*Not available yet — these are the steps the first release will have.*

1. In HACS, add this repository as a *Custom repository* (category *Integration*),
   install *Pit Lane Live Board* and restart Home Assistant.
2. *Settings → Devices & services → Add integration → Pit Lane Live Board.*
3. Open **Live Board** in the sidebar. For the live track map, add your F1TV token under
   *Configure* (the guide shows how).

## Good to know

- **The data is unofficial.** The live timing and the session archive are the feeds F1
  uses on its own website; they are undocumented and can change or stop without notice.
  Results and standings come from [Jolpica-F1](https://github.com/jolpica/jolpica-f1).
  The project reads them the way one viewer would, with caching, for personal and
  non-commercial use.
- **F1TV is optional.** It is only needed for the live track map. Your token stays in
  your Home Assistant and is renewed automatically; about once a month you paste a new
  one.
- **Team radio is F1's selection.** Some sessions have few clips, some have none.

## Status

In design. The [specification](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/develop/docs/SPEC.md)
describes every part and the order in which they are built. Releases will be GitHub
releases, listed by HACS by version, with a [changelog](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/CHANGELOG.md)
that puts anything you need to act on first.

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
