# Changelog

All notable changes to Pit Lane Live Board are listed here. Versions follow
[Semantic Versioning](https://semver.org/). Anything that asks you to act comes first,
under **Changed — read before updating**.

## [Unreleased]

## [0.10.0] - 2026-10-02

### Changed — read before updating
- **The session summary has a new look**, written like a push headline: the title says
  what happened (`🏆 Antonelli wins the Spanish GP`, `⚡ Norris on pole by 0.011s`),
  the first line is the result with medals, the second your drivers (★) with places
  gained or the lap they retired on, then the fastest lap, the biggest mover,
  retirements and penalties. The full format adds the classification with medals, gaps
  like `+1:26.746` and `+1 lap`, retirements at the end, and qualifying in its parts
  (Q3, out in Q2, out in Q1). Automations that read `title` or `message` see the new
  text.
- The event's `facts`: `retired` is in the order the cars stopped; new `dnf` (driver and
  lap) and `mover`; retired cars come last in `classification`; qualifying rows carry
  `segment` (the part reached).

### Added
- On phones with the Home Assistant app, a tap on the summary opens the board, a new
  summary replaces the previous one, and on Android it has its own notification
  channel (*Pit Lane Live Board*) for a sound of its own. In Home Assistant's
  notifications the summary replaces the previous one too.

### Fixed
- A followed driver who retired no longer reads as "P22 (-18)" but as retired on lap N.

## [0.9.2] - 2026-09-30

Restart Home Assistant after updating. Nothing to add by hand.

### Fixed
- **"Configuration error" in the Companion app:** opening the app, the dashboard
  cards could be missing, and came back only with *Reload resources* until the next
  opening. The app started from an old copy of the page kept by Home Assistant's
  service worker, without the cards; now they also arrive as a dashboard resource,
  which the app always receives up to date.
- **Live cards after the app comes back from the background:** their subscription is
  opened again a moment later instead of in the very instant the connection returns,
  when Home Assistant's own sidebar could cancel it by mistake, and a subscription
  that died with the connection is no longer unsubscribed with an id the new
  connection may have given to someone else.

### Changed
- **A new dashboard resource**, `/api/pit_lane_live_board/frontend/loader.js`, added
  and removed by the integration. With YAML resources it lives in memory only and never
  touches your files; a Pit Lane resource you added by hand in the past is no longer
  needed (removed by itself from UI-managed resources).
- **If the integration cannot start**, the cards still load and say so, and if the
  frontend files are unreadable only the panel and the cards are missing.

## [0.9.1] - 2026-09-27

### Changed
- **Session summary, Send to:** the notify services are chosen from a field that
  suggests them as you type, with *Add* and *Remove*, instead of one tick-box per
  service — tidy even in a house with many phones and tablets.

## [0.9.0] - 2026-09-27

### Added
- **Circuit history**: open it from a weekend in the Calendar or a round in Results.
  Every driver of this season at that circuit, all their years there — qualifying,
  grid, finish, points, fastest lap, outcome and the stewards' penalties (2018+) — and
  an **affinity index**: how the circuit suits the driver compared with how their car
  went that year. 50 = as the car; higher = better than the car. Mechanical
  retirements do not count against the driver, and one or two races are pulled
  towards 50, so a single good afternoon does not top the list.

### Fixed
- The live connection's silence check no longer misreads a freshly started host.

## [0.8.0] - 2026-09-27

A complete review of the code, by ten reviewers, for bugs and above all for resources:
less sent, less written, less work in the browser.

### Changed — read before updating
- **Session events:** `session_started` fires at the first start of a session only, and
  `session_ended` at the end of its last part (qualifying no longer fires them for every
  part). The chequered flag still fires once per part.
- The **Driver** sensors no longer carry `laps` and `tyre_age` (they changed every lap
  and filled the history).

### Improved
- **Much less data during a race:** the timing tower travels as the rows that changed,
  not whole twice a second (about a quarter of the data), and nothing is sent again
  when nothing changed. Each open page and card benefits.
- **A lighter Live page:** only the parts that changed are redrawn; the cars on the map
  move on the graphics card; nothing is drawn while the tab is hidden.
- **Fewer writes to disk and to the history:** entities write only when their own value
  changes; settings are saved only when they change; event marks at most every 30 s;
  the cache no longer touches files on every read and does not rewrite identical data.
- **Fewer requests:** the cards share one settings subscription; pages keep what they
  loaded when you switch tab; old seasons no longer use the calendar's reserve.
- **The layout follows the panel's own width**, so it fits with Home Assistant's
  sidebar open; the header never overflows; phone tables keep their key column; better
  contrast for green and purple times; bigger touch targets on phones.
- **Track map:** labels no longer overlap, retired cars and cars not in the session are
  not drawn, and the provisional map of a new circuit widens as the cars go round.
- **Kiosk:** the screen stays awake after the tab comes back, 22 rows fit on a 1080p
  TV, `scale=` enlarges the header too, `?kiosk=0` turns it off.
- The Italian panel translates "Leader", laps down and the session names.

### Fixed
- Stewards: "investigated after the session/sprint", "stop-and-go" penalties, `UPDATE:`
  messages, deleted laps for other reasons and VSC messages are read correctly.
- A red-flag stoppage no longer reads green when F1 sets the track clear while the cars
  are still stopped.
- Retirements are detected like F1's classification (cars stopped and hidden, or under
  90% of the winner's laps), in the tower and in the summary.
- "My drivers" `pit_out` reports the new tyre, and no pit events fire before the start.
- The qualifying drop zone is the real one.
- Lapped cars show "+1 lap" in race results instead of a time.
- A settled round is never served from a copy cached before the race; an archive
  missing its index is read anyway; seasons F1's archive does not serve (2022) no
  longer offer tabs that are always empty; standings with more than 100 rows are
  complete; Jolpica is given a rest after a 429.
- The live connection never stops for a malformed message or a bad reply; a 403 from
  F1's servers is no longer blamed on your F1TV token; the connection gives up a stalled
  opening after 20 s; retries are spread out.
- The Live page picks up the newest finished session while it stays open; open pages
  are refreshed after a reload; removing the integration also removes its saved data.
- The calendar and standings refresh while open; the standings card follows no-spoiler
  mode at once.

## [0.7.0] - 2026-09-27

### Added
- **Full session summary**: in Settings, choose *Compact* (as before: podium, fastest
  lap, retirements, penalties, your drivers) or *Full*, which adds the whole
  classification with every driver's time — gap and best lap in a race, best lap and gap
  in qualifying and practice, retirements with the lap they stopped on. The summary
  event always carries the classification in its facts.

## [0.6.0] - 2026-09-27

### Added
- **Kiosk mode** for a TV, a Raspberry Pi monitor or a wall tablet: add `?kiosk` to the
  panel's address (Settings shows it) and the panel fills the screen over Home
  Assistant's sidebar and header, with the pointer hidden when it rests;
  `&page=calendar` and `&scale=1.3` pick the page and the size. The ⛶ button in the
  header does the same for the moment.
- **Small screen** sensor, off by default, for an ESP32 with ESPHome or an e-paper
  frame: the Live page's state and short flat attributes ready to print — lap, track
  status and its colour for a LED ring, the top ten as rows, your drivers, the next
  session. The guide has an ESPHome example.

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
  tyre and its age, pits, penalty, best lap), their rows
  get a ★, and the **My drivers** event fires when they gain or lose a place, take the
  lead, pit, set the fastest lap, retire or get a penalty.
- **Session summary**: when a session ends, podium, fastest lap, retirements, penalties
  and your drivers, sent to the notify services you choose in Settings (for the races,
  sprints, qualifying or practice you pick), and as the **Session summary** event. With
  no-spoiler mode on it waits until the session is no longer hidden. *Send a test*
  tries it.

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
