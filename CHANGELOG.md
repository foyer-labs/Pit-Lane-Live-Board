# Changelog

All notable changes to Pit Lane Live Board are listed here. Versions follow
[Semantic Versioning](https://semver.org/). Anything that asks you to act comes first,
under **Changed — read before updating**.

## [Unreleased]

## [0.5.0] - 2026-09-27

### Added
- **Click a driver in the timing tower** to see their race so far: every stint with its
  compound, the laps it covered and the best lap of each ("laps 1–24, medium, best
  1:33.1 on lap 18"), and where a stop now would bring them back out ("back out P9,
  behind BOR, ahead of COL"), an estimate from the circuit's typical pit loss, lower
  under a safety car or VSC.
- **Mini-sectors**: under each sector time, the strip of F1's purple, green and yellow
  mini-sectors, in the panel and in the tower card.
- **My drivers**: follow up to five drivers in Settings. Each gets a sensor (position,
  gap, tyre and its age, pits, penalty, where a stop would bring them out), their rows
  get a ★, and the **My drivers** event fires when they gain or lose a place, take the
  lead, pit, set the fastest lap, retire or get a penalty.
- **Session summary**: when a session ends, podium, fastest lap, retirements, penalties
  and your drivers, sent to the notify services you choose in Settings (for the races,
  sprints, qualifying or practice you pick), and as the **Session summary** event. With
  no-spoiler mode on it waits until you reveal the session. *Send a test* tries it.

## [0.4.0] - 2026-09-27

### Added
- **Choose the clock for the times**, in the panel's Settings, each user for
  themselves: as in your Home Assistant profile, this device's time zone, or the local
  time at the track. *Show both times* adds the other one in small, e.g. "15:00 at the
  track" next to your time.

### Fixed
- Times now follow the time zone chosen in your Home Assistant profile ("use my
  device's time zone"); before, they always used the server's.

## [0.3.0] - 2026-09-27

### Added
- **Dashboard cards.** Every piece of the Live page is now also a card: timing tower
  (choose rows and columns, highlight a driver), track map, flags & stewards, team
  radio, race control, session, weather and championship standings. They appear in
  *Add card* under **Pit Lane** with a visual editor, with no resource to add by hand.
  They follow the TV delay and no-spoiler mode like the panel, and all the cards on a
  page share one connection.
- **Only administrators can open the panel**: a new option, off by default, in the
  panel's Settings and under *Configure*.
- *Show Live Board in the sidebar* can now also be changed from the panel's Settings.

### Fixed
- An open panel no longer freezes on its last view when Home Assistant restarts:
  it reconnects by itself as soon as the integration is back.

## [0.2.0] - 2026-09-26

### Changed — read before updating
- **Live timing now starts paused.** After updating, nothing connects to F1 until you
  open **Settings** (the gear in the panel's header) and press play, turn on the new
  **Live timing** switch, or enable *Start automatically at each session*. While paused
  nothing live is written to disk, which spares the SD card of a Raspberry Pi. Calendar,
  results and standings work either way.
- Automations that used the **Lap** sensor's long-term statistics lose them: a lap count
  is not a measurement, and it no longer has a state class.

### Added
- **Flags & stewards** on the Live page: the track status, yellow and double yellow
  sectors, the safety car and VSC with their last lap, every penalty (served or not),
  incidents noted or under investigation and their outcome, deleted laps and black and
  white flags. An unserved time penalty shows as `+5s` next to the driver in the tower.
  On a phone the card is one row of chips that opens on a tap.
- New entities: **Safety car**, **Virtual safety car**, **Red flag** and **Yellow flag**
  binary sensors (with the yellow sectors), **Penalties** and **Investigations** sensors
  (with the list), the latest **Race control message**, a **Stewards** event for every
  decision (penalty, drive-through, investigation, warning, deleted lap…) with the
  drivers, seconds, reason and lap, and the **Live timing** switch.
- **Settings** in the panel, behind the gear: live timing on and off, auto-start, the TV
  delay, the F1TV token for administrators (pasted, replaced or removed, never shown
  back), and the list of the integration's entities.
- **The Live page after a session**: the final classification, the stewards' decisions,
  race control and the pit stops stay, frozen, with the next session's countdown. When
  the session was not followed live, they come from F1's archive the first time the
  page is opened.

### Improved
- The Live page is much lighter during a session: the backend sends only what changed,
  once for every open page; the map moves on its own and is not even asked for while it
  is off screen; the clocks tick without redrawing the page. Entities write only when
  their value changes.
- History opens faster and downloads less: files are read in parallel and from memory,
  the lap chart of recent races comes from one archive file, and results of a finished
  weekend are kept for 30 days instead of 10 minutes.
- The Results page lists the current weekend as soon as it starts, so its qualifying
  and sprint can be opened before the race.
- Qualifying sector 3 times that arrive after the lap closes are no longer lost.
- Home Assistant starts without waiting for the calendar; the panel stays open across a
  reload of the integration; the "Live timing unreachable" notice survives restarts and
  is removed with the integration.

### Fixed
- The Qualifying tab is no longer offered for seasons before 1994, which have none.
- A TV delay that could not be saved no longer stays on screen as if it had been.
- Calendar event descriptions ("Round 14") follow Home Assistant's language.

## [0.1.0] - 2026-09-26

The first release.

### Added
- The specification, the README in English and Italian, the support, security and
  contribution documents, and the issue forms.
- The integration's skeleton: it can be added once (with the non-affiliation notice
  and the data attribution), and it remembers the TV delay and no-spoiler settings
  across restarts. It shows nothing yet.
- Behind the scenes: the calendar is read at start-up; during a session window the
  integration connects to F1's live timing, holds everything back by the TV delay,
  and never shows a silent feed as live. An F1TV token is renewed automatically; a
  repair notice appears when a new one is needed, or when three session windows in a
  row could not connect. Diagnostics never contain the token.
- The **Live Board** panel in the sidebar, for every user: the season calendar in
  your timezone with a countdown and the podium of each finished weekend; results of
  every season since 1950 with race, qualifying, sprint, lap chart, tyre strategy,
  lap times, pit stops, race control and weather where the data exists; drivers' and
  constructors' standings after any round. The TV delay and no-spoiler mode are set
  from the panel's header; no-spoiler mode withholds results in the backend.
- The **Live** page: the timing tower (position, places gained, gap, interval, last and
  best lap, sectors in purple and green, tyre and its age, pit stops, PIT/OUT/RET
  badges; Q1–Q3 with the knockout line in qualifying), the session strip with lap or
  clock and the track status, race control with a flag/penalty filter, team radio
  played straight from F1, weather, pit lane times, and the track map when F1 sends
  positions. A lost feed is announced after 30 s and greys the page after 60 s.
- Entities for automations: a **Sessions** calendar (with Home Assistant's calendar
  triggers, "15 minutes before the race" needs no code), **Next session**, **Session
  status**, **Track status**, **Lap**, **Session running**, a **Race control** event
  (green, yellow, safety car, VSC, VSC ending, red, chequered, session started and
  ended), the **No-spoiler mode** switch and the **TV delay** number. Live entities are
  delayed like the page, go unavailable when the feed is lost, and stay quiet in
  no-spoiler mode.
- *Configure*: show or hide the panel in the sidebar, and paste, replace or remove the
  F1TV token, with step-by-step instructions. The token is never shown again.
