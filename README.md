<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/custom_components/pit_lane_live_board/brand/icon.png" alt="Pit Lane Live Board" width="112">
</p>

<h1 align="center">Pit Lane Live Board</h1>

<p align="center"><strong>Put your Home Assistant on the pit wall.</strong></p>

<p align="center"><em>A ready-made Formula 1 page in your sidebar: the live timing tower, flags and stewards, your driver's race, the calendar and every result since 1950. Free, no account, nothing to build.</em></p>

<p align="center"><strong>English</strong> · <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/README.it.md">Italiano</a> · <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.md">📖 Guide</a> · <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/CHANGELOG.md">What's new</a></p>

<p align="center">
  <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/releases"><img src="https://img.shields.io/github/v/release/foyer-labs/Pit-Lane-Live-Board?sort=semver&include_prereleases&label=version" alt="Latest version"></a>
  <img src="https://img.shields.io/badge/Home%20Assistant-2026.6%2B-41BDF5" alt="Home Assistant 2026.6 or later">
  <img src="https://img.shields.io/badge/HACS-custom%20repository-41BDF5" alt="HACS custom repository">
  <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="Apache-2.0"></a>
  <a href="https://github.com/foyer-labs/Pit-Lane-Live-Board/actions/workflows/ci.yml"><img src="https://github.com/foyer-labs/Pit-Lane-Live-Board/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
</p>

<p align="center">
  <a href="https://my.home-assistant.io/redirect/hacs_repository/?owner=foyer-labs&repository=Pit-Lane-Live-Board&category=integration"><img src="https://my.home-assistant.io/badges/hacs_repository.svg" alt="Open your Home Assistant instance and open this repository inside HACS"></a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/tv.png" alt="Kiosk mode on a TV, dark theme: lap 31 of 57, flags and stewards, the timing tower with gaps, sectors, mini-sectors and tyres, the track map and race control" width="900">
  <br>
  <sub><em>Kiosk mode on the living-room TV, 45 seconds behind live timing to match the stream. Real data from the 2026 Spanish Grand Prix; the track map needs an F1TV subscription.</em></sub>
</p>

<p align="center"><b>Works with</b> Home Assistant 2026.6+ · HACS · phone and tablet · TV and Raspberry Pi kiosk · ESP32 with ESPHome · English and Italian · light and dark</p>

<p align="center"><sub>Unofficial fan project, not associated with the Formula 1 companies or the FIA (full notice at the bottom).</sub></p>

### Why fans install it

- 🏁 **It's already built.** Install, open **Live Board** in the sidebar, and the whole
  weekend is there. No YAML dashboard, no card hunting, no sensors to wire up first.
- 📺 **It waits for your TV.** Streams run behind live timing. Set a delay of up to two
  minutes and the page, the team radio *and your automations* land when your screen
  shows it. No more spoilers from your own dashboard.
- 💡 **Your house joins the race.** The living room turns amber under the safety car,
  your phone buzzes when your driver gets a penalty, the podium arrives when the session ends.
- 🆓 **Free, with no account.** Only the live track map needs an F1TV subscription.

<p align="center"><strong><a href="https://github.com/foyer-labs/Pit-Lane-Live-Board#get-started">→ Get it running in three steps</a></strong></p>

---

## More than a pile of sensors

Sensors are where most home automations start; the dashboard is then yours to build.
Here it is already built — and you still get the sensors.

| | Starting from sensors | Pit Lane Live Board |
|---|---|---|
| A timing tower to look at | Your job | In the sidebar, on install |
| In sync with your stream | Your job | TV delay up to 2 minutes, for the page *and* your automations |
| The stewards | Your job | One event per decision: driver, seconds, reason |
| Your driver | Your job | A ★ in the tower, a sensor each, an event when they pit, gain a place or get a penalty |
| Watching later | Your job | No-spoiler mode keeps the weekend's results inside Home Assistant until you reveal them |
| The history | Your job | Every race since 1950; lap charts and tyre strategies from 2018 |

And you still get the sensors: [plenty of them](https://github.com/foyer-labs/Pit-Lane-Live-Board#sensors-and-events-for-automations).

## Get started

You need **Home Assistant 2026.6 or later** and **[HACS](https://hacs.xyz/)**. Pit Lane
Live Board is a HACS *custom repository* for now: it takes a minute.

**1. Add it to HACS and download it**

<a href="https://my.home-assistant.io/redirect/hacs_repository/?owner=foyer-labs&repository=Pit-Lane-Live-Board&category=integration"><img src="https://my.home-assistant.io/badges/hacs_repository.svg" alt="Open your Home Assistant instance and open this repository inside HACS"></a>

Or by hand: HACS → ⋮ → *Custom repositories* → `https://github.com/foyer-labs/Pit-Lane-Live-Board`,
category *Integration*. Download **Pit Lane Live Board** and **restart Home Assistant**.

**2. Add the integration**

<a href="https://my.home-assistant.io/redirect/config_flow_start/?domain=pit_lane_live_board"><img src="https://my.home-assistant.io/badges/config_flow_start.svg" alt="Open your Home Assistant instance and start setting up Pit Lane Live Board"></a>

Or *Settings → Devices & services → Add integration → Pit Lane Live Board*. There is
nothing to fill in.

**3. Open Live Board in the sidebar**

Calendar, results and standings work straight away. **Live timing starts paused**: press
play in the panel's **Settings** (the gear), or turn on *Start automatically at each
session*. For the live track map, an administrator pastes an F1TV token there too
([how](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.md#f1tv-and-the-live-map)).

That's it — the next session is on your board.

## A race weekend, the Pit Lane way

**Thursday.** Who is at home here? The circuit history ranks this season's drivers by an
**affinity index** — how they have gone at this track compared with their car that year —
with every past race a click away: qualifying, finish, fastest lap, penalties.

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/circuit-driver.png" alt="Circuit history for Baku: drivers ranked by affinity index, one driver opened on each of their years there with qualifying, grid, finish, points, the car's expected place and penalties" width="820">
  <br>
  <sub><em>50 = as the car. Above it, the circuit suits the driver.</em></sub>
</p>

**Friday.** The calendar shows every session in your own time zone — or the local time at
the track, or both side by side — with a countdown to the next one and the podium of every
weekend already run.

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/calendar.png" alt="The Calendar page: every round of the season with its podium, the weekend in progress marked Live now and the next one marked Next" width="820">
  <br>
  <sub><em>The whole season at a glance, podiums included.</em></sub>
</p>

**Saturday.** Qualifying the way it should look: Q1, Q2 and Q3 with the knockout line,
best laps and gaps, and the mini-sectors in purple, green and yellow under each sector time.

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/qualifying.png" alt="Qualifying on the Live page: Q1, Q2 and Q3 times, gaps, sectors with mini-sectors, knocked-out drivers marked KO, investigations and track limits" width="820">
  <br>
  <sub><em>Q3, the knockout zone and every deleted lap, in one view.</em></sub>
</p>

**Sunday, 15 minutes to go.** A calendar trigger pings your phone: *the race starts in 15
minutes*. No code, one of the ready-made automations in the guide.

**Lights out.** Press play (or let it start by itself at each session). The tower fills in:
position, gap to the leader and to the car ahead, last and best lap, three sectors, the
tyre and how old it is, pit stops, places gained since the start.

**Your driver pits.** Click their row: every stint with its compound, laps and best lap, and
where a stop *right now* would bring them back out.

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/driver.png" alt="A driver opened in the timing tower: three stints with compound, laps and best lap, and a pit estimate: back out P9, behind BOR, ahead of COL" width="900">
  <br>
  <sub><em>"Pitting now: back out P9." An estimate from the circuit's typical pit loss, lower under a safety car or VSC.</em></sub>
</p>

**Safety car.** The binary sensor flips and the living-room lights go amber until it comes
in. Red flag? Red. Green again? Green.

**Five-second penalty.** A `+5s` appears next to the driver until it is served, and the
stewards event fires with the driver, the seconds and the reason — straight to your phone
if you want.

**Chequered flag.** The session summary lands on your phone: podium, fastest lap,
retirements, penalties and your drivers — or the whole classification with every time. In
no-spoiler mode it waits until you reveal the session.

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/final.png" alt="The Live page after the race: final classification with the chequered flag, penalties, investigations, track limits, and the countdown to the next session" width="820">
  <br>
  <sub><em>After the flag the board keeps the final order, the stewards' decisions and a countdown to the next session.</em></sub>
</p>

**Monday.** Relive it: lap chart, tyre strategy, lap times, pit stops, race control and
weather from 2018; results, qualifying and sprints for every season since 1950;
both championships after any round.

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/lap-chart.png" alt="Results: the lap chart of a race, every driver's position lap by lap in team colours" width="440">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/strategy.png" alt="Results: the tyre strategy of every driver in a race, stints coloured by compound" width="440">
  <br>
  <sub><em>Every overtake, every stint.</em></sub>
</p>

## Everything on the board

**Live**
- **Timing tower** with gaps, intervals, last and best lap, sectors and mini-sectors in
  F1's purple, green and yellow, tyres and their age, pit stops, places gained or lost.
- **Flags & stewards** above the tower: track status, yellow sectors, the safety car and its
  last lap, every penalty, incidents under investigation, deleted laps.
- **Race control** messages, filtered by flags or penalties, and **weather**: air and track
  temperature, wind, rain.
- **Team radio**: the clips F1 publishes during the session, with a play button.
- **Live track map**, every car in its team colour — with an F1TV subscription.
- **My drivers**: follow up to five, each with a ★ in the tower and a sensor of their own.

**Around the weekend**
- **Calendar** in your time zone, with a countdown; **results since 1950**; **both
  championships**, drivers and constructors, for any season.
- **Circuit history** with an **affinity index**: how each driver goes at this track,
  net of their car.
- **No-spoiler mode** for when you watch later.
- **English and Italian**, light and dark, phone or wall tablet.

**Built for a home server**
- **Easy on a Raspberry Pi.** Live timing starts paused: nothing connects to F1 and nothing
  live is written to disk until you press play, or let it start by itself at each session.
- **You decide who sees it**: the whole house, or administrators only.

## Your dashboard, your cards

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/cards.png" alt="The dashboard cards: session, timing tower, flags and stewards, track map, race control, team radio, weather and drivers' standings" width="900">
  <br>
  <sub><em>Eight cards, a visual editor for each, nothing to add by hand.</em></sub>
</p>

Every piece of the Live page is also a card. *Edit dashboard → Add card → Pit Lane*, and
put it where you want it:

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

The cards follow the same TV delay and no-spoiler mode as the panel. A wall tablet with the
tower and the flags, a phone view with just the session and your driver:
[the guide](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.md#dashboard-cards)
has examples.

## Every screen in the house

| | |
|---|---|
| 📺 **TV or monitor** | Add `?kiosk` to the panel's address and it fills the screen and the pointer hides when it rests; `&scale=1.3` makes it readable from the sofa. On a Raspberry Pi, one `chromium --kiosk` line. |
| 📱 **Phone** | The same board, laid out for a narrow screen. |
| 🔌 **ESP32 or e-paper** | The optional **Small screen** sensor hands ESPHome the lap, the track status (with a colour for a LED ring), the top ten and your drivers, ready to print. [ESPHome example](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.md#dedicated-screens). |

<p align="center">
  <img src="https://raw.githubusercontent.com/foyer-labs/Pit-Lane-Live-Board/main/docs/screenshots/phone.png" alt="The Live page on a phone: track status, penalties and investigations as chips, and the timing tower with gap, last lap and tyre" width="300">
  <br>
  <sub><em>On the phone, during the race.</em></sub>
</p>

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

Everything is released through the TV delay, so the lights change when *your* screen shows
it. Ready-made automations — safety car lights, red flag, race in 15 minutes, penalty for
your driver — are [in the guide](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.md#entities-and-automations):

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
- **Live timing starts paused.** Press play in the panel's Settings, or turn on *Start
  automatically at each session*. Calendar, results and standings work without it.
- **F1TV is optional.** It is only needed for the live track map. The token stays in
  your Home Assistant and is renewed automatically; about once a month you paste a new
  one.
- **Team radio is F1's selection.** Some sessions have few clips, some have none.
- **The pit estimate is an estimate**, from the circuit's typical pit loss.
- **Not a video stream.** It shows timing data, not the race: use the TV delay to match
  your stream.
- **Lap-by-lap detail starts in 2018**, with F1's archive, which has gaps.
- **No driver photos or team logos.** They belong to F1 and the teams: drivers appear by
  code, number, name and team colour.

## Project status

**Young and moving fast (0.x)**, with new features every few days. Found something
that looks wrong, or have an idea? [Open an issue](https://github.com/foyer-labs/Pit-Lane-Live-Board/issues).

Every version is a GitHub release that HACS offers by version number; the
[changelog](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/CHANGELOG.md) puts
anything you need to act on first.

## Support, contributing and licence

Issues and pull requests are welcome and answered as time allows, with no promise of a
reply or a fix ([SUPPORT.md](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/SUPPORT.md),
[CONTRIBUTING.md](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/CONTRIBUTING.md)).
Pit Lane Live Board is the personal, non-commercial project of one person, published as
Foyer Labs; there is no company behind it.

If it made your race weekend better, a coffee keeps it going:

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
