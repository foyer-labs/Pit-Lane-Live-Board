# Pit Lane Live Board — Specification

Draft 2 · 2026-09-26 · Foyer Labs

A Home Assistant custom integration, installed through HACS, that adds a **ready-made
sidebar panel** for Formula 1 fans: the season calendar, every race since 1950 with its
results, the live session (timing tower, sectors, tyres, gaps, race control, weather,
team radio, and — with an F1TV subscription — a live track map), and the drivers' and
constructors' championships. Nothing to assemble: install, open **Live Board** in the
sidebar, and it is all there.

This document is the source of truth. It carries the reasoning behind decisions that look
arbitrary until you know why. Decisions taken in chat are recorded in §17; choices made
while writing it and still awaiting the owner's confirmation are in §18.

---

## 1. What it is

- One HACS integration (`pit_lane_live_board`) with a sidebar panel, a handful of
  entities for automations, and no YAML.
- A **reader** of public, unofficial Formula 1 data sources (§4). It holds one upstream
  connection per Home Assistant, however many people have the page open.
- Bilingual from day one: English and Italian (§14).

### 1.1 What it is not

- **Not official.** Not associated in any way with the Formula 1 companies (§15). No F1
  logo, font, or mark in the name, the icon or the panel.
- **Not a video or audio stream.** It shows timing data; team radio clips are the short
  clips F1 itself publishes.
- **Not a replay tool.** A past session is shown as results and static lap detail, never
  replayed "as if live" (decision 8).
- **Not a telemetry analysis tool.** No speed traces, throttle, braking, or car-data
  comparisons. FastF1 already does this very well, in a notebook.
- **Not a betting, fantasy or prediction product.**
- **Not built on F1 Sensor, FastF1 or OpenF1** (decision 1, §4.6).

---

## 2. Glossary

| Term | Meaning |
|---|---|
| **Meeting** | A Grand Prix weekend (e.g. *Italian Grand Prix 2026*). Contains sessions. |
| **Session** | Practice 1–3, Sprint Qualifying, Sprint, Qualifying, Race. |
| **Round** | The meeting's position in the season (Jolpica's `round`). |
| **Timing tower** | The live leaderboard: one row per driver, ordered by position. |
| **Gap** | Time to the leader. **Interval**: time to the car immediately ahead. |
| **Stint** | A run on one set of tyres. **Tyre age**: laps on the current set, including laps it had before this stint (a used set starts with age > 0). |
| **TLA** | Three-letter driver abbreviation (`LEC`, `VER`). |
| **Keyframe** | The full state of a live topic, sent on subscribe; later messages are **deltas** merged into it. |
| **Topic** | A named SignalR stream (`TimingData`, `TrackStatus`, …). |
| **TV delay** | Seconds by which the page and the automations are held back to match the user's TV (§8). |
| **No-spoiler mode** | Hides the outcome of the current meeting until the user asks (§9). |
| **Archive** | `livetiming.formula1.com/static/`: the per-session files F1 publishes after each session. |

---

## 3. Invariants

These are not style preferences. Each one, if broken, disables a headline feature or
creates a problem that needs a rewrite rather than a patch.

**INV-1 — `core/` is pure.** Parsing, merging live deltas, deriving the timing tower,
the delay buffer, the spoiler filter, the automation events and the track outline are
pure functions and data structures: no I/O, no clock that was not passed in, no imports
from `homeassistant.*`, `aiohttp` or `asyncio`. Clients (§5.2) do the I/O and hand bytes
or parsed JSON to `core/`. A test enforces the import rule; if it fails, the fix is the
code, never the test. This is what makes the live logic testable without a live race.

**INV-2 — Stale is never shown as live.** Every live view carries the age of its data.
When the upstream feed is lost during a session, the page says so within 30 s and the
live entities become `unavailable` within 60 s. A frozen timing tower that looks live is
the worst failure this product can have: the user trusts it.

**INV-3 — Credentials never leave the backend.** The F1TV token is stored in the config
entry and used only by the backend. No WebSocket command, entity attribute, diagnostic,
log line or repair issue ever contains it; diagnostics redact it. The panel sees only
a status (`not_configured`, `active`, `expiring`, `expired`, `invalid`).

**INV-4 — Good citizen of every source.** One upstream live connection per Home
Assistant, opened only inside session windows (§6.1). Every HTTP source is cached and
rate-limited on our side (§4). A custom `User-Agent` identifies the project. A page open
on five devices costs the sources the same as a page open on one.

**INV-5 — Spoilers are filtered in the backend.** When no-spoiler mode is on, hidden
data never reaches the browser: the panel cannot leak what it never received, and a
curious look at the WebSocket traffic reveals nothing.

**INV-6 — Unofficial, and says so.** README, guide and panel carry the non-affiliation
notice (§15). Jolpica data is attributed as its licence requires. The project stays
non-commercial.

**INV-7 — Every user-visible string is translated.** No user-visible text is hard-coded
in a component. CI fails when the English and Italian key sets diverge.

---

## 4. Data sources

Researched on 2026-09-26, partly against the live 2026 Azerbaijan Grand Prix. Every fact
here was checked against source code or a live request; the unverified ones are marked.

### 4.1 Jolpica-F1 (calendar, results, standings)

- Base `https://api.jolpi.ca/ergast/f1/`, Ergast-compatible. Every path ends in `/` or
  `.json`. `current` and `last` are accepted for season and round.
- Used for: seasons, the season schedule with session times, race results, qualifying,
  sprint, driver and constructor standings (also *after round N*), laps (1996+) and pit
  stops (2011+).
- Coverage: 1950 to the current season.
- Limits: burst 4 req/s, sustained 500 req/h per client, and the docs say they will
  decrease. Pagination: `limit` ≤ 100, `offset`.
- **Our rules:** a token bucket at 2 req/s, a self-imposed budget of 200 req/h, and a
  `User-Agent: PitLaneLiveBoard/<version> (+https://github.com/foyer-labs/Pit-Lane-Live-Board)`.
  On `429`, back off and serve the cache. Past seasons are cached on disk indefinitely,
  and refreshed only when the user opens them after 30 days. The current season is
  cached for 10 minutes (the API sends `max-age=600`) and refreshed after each session
  ends.
- **Licence:** the data is CC BY-NC-SA 4.0, free for non-commercial use. It is attributed
  in the panel footer, the README and the guide (INV-6).

### 4.2 Live timing, SignalR Core (the live session)

- Endpoint: `https://livetiming.formula1.com/signalrcore`. The legacy `/signalr`
  endpoint answers 401 and is not used.
- Flow:
  1. `OPTIONS …/negotiate?negotiateVersion=1` sets load-balancer cookies (`AWSALB`,
     `AWSALBCORS`).
  2. `POST …/negotiate?negotiateVersion=1` returns `connectionToken`.
  3. Websocket to `wss://…/signalrcore?id=<connectionToken>`, sending the cookies.
  4. Handshake `{"protocol":"json","version":1}\x1e`.
  5. `Subscribe` with the topic list.
- Messages:
  - The subscribe reply (`type:3`) carries the keyframes.
  - `type:1, target:"feed"` carries `[topic, delta, utc]`. Deltas are partial and merged
    into the keyframe. Some collections arrive as dicts keyed by index.
  - `type:6` is a ping.
- Without F1TV (verified live): `TimingData`, `TimingAppData`, `TimingStats`,
  `DriverList`, `SessionInfo`, `SessionStatus`, `SessionData`, `TrackStatus`,
  `RaceControlMessages`, `WeatherData`, `LapCount`, `ExtrapolatedClock`, `TopThree`,
  `TeamRadio`, `PitLaneTimeCollection`, `CurrentTyres`, `TyreStintSeries`, `Heartbeat`.
- With F1TV only: `Position.z` (the map), `CarData.z` (not used, §1.1), `PitStopSeries`,
  `DriverRaceInfo`, `ChampionshipPrediction`. Without auth these are silently absent:
  no error, just no key.
- With F1TV, the token goes in the `Authorization: Bearer <token>` header of negotiate
  and of the websocket.
- *Unverified:* that an authenticated connection really delivers `Position.z` today (no
  subscription was available to test). The gating can change per session; the code
  treats every topic as optional.

### 4.3 The archive (history detail, track outlines)

- `https://livetiming.formula1.com/static/{year}/Index.json` lists meetings and sessions
  with their `Path`. Each session has its own `Index.json` listing its feeds as
  `X.json` (keyframe) and `X.jsonStream`.
- `.jsonStream` lines are `HH:MM:SS.mmm` followed by JSON. The file starts with a BOM,
  so decode as `utf-8-sig`. `.z` values are base64 of raw deflate:
  `zlib.decompress(b64decode(s), -zlib.MAX_WBITS)`.
- No auth. Missing files answer **403**, not 404. Feeds can be missing per session (the
  2026 Australian race has no `TeamRadio`), so always read the session index first.
- Published in one batch 0–30 minutes after a session ends. Nothing exists during the
  session.
- Coverage from 2018; `2017/Index.json` is 403.
- **Our rules:**
  - Download once and keep on disk under `<config>/.cache/pit_lane_live_board/` with a
    500 MB cap and least-recently-used eviction.
  - Parse in the executor, line by line; never load a whole stream into memory at once.
  - `Position.z` for past sessions is downloaded **only** to build a track outline
    (§6.5), never for replay.

### 4.4 Team radio

- URL: `https://livetiming.formula1.com/static/{SessionInfo.Path}{Capture.Path}`,
  `audio/mpeg`. No auth, and available during the live session.
- F1 publishes a small selection, and in 2026 some sessions have none. The page says
  "no team radio published for this session" rather than showing an empty list.

### 4.5 F1TV (optional, for the live map)

- The token is the `subscriptionToken`, an RS256 JWT. Its claims are read, not
  verified: F1's servers reject a bad token anyway, and verifying would need F1's
  signing keys at setup time. Claims used: `exp`, `SubscriptionStatus`,
  `SubscribedProduct`, `SessionId`.
- The user may paste the bare token, a `Bearer …` header, or the whole
  `loginSession` cookie (URL-encoded JSON holding `data.subscriptionToken`): all
  three are accepted.
- **Password login is not possible.** `…/authenticate/by-password` sits behind bot
  protection (reese84) and rejects programmatic logins. FastF1 and F1 Sensor avoid it
  for this reason.
- First token: **pasted by the user** (decision 2), following step-by-step instructions
  in the options flow (log in to F1TV in a browser, copy the value).
- Renewal: `POST https://api.formula1.com/v1/account/Subscriber/RetrieveSubscriber` with
  the current token's `SessionId`. This uses constants of F1's own web client (`apikey`,
  `CD-SystemId`).
  - Renewal runs 24 h before expiry, with backoff from 60 s to 1 h.
  - The token lives about 4 days; the F1 login session behind it lives about 30 days
    (per F1 Sensor's documentation, *unverified*).
  - When the session ends, a **repair issue** asks the admin to paste a new token.
- Those constants and the renewal call are isolated in one module (`f1tv.py`), because
  they are the most fragile part of the project. When they break, only the map stops
  working.
- The token lives in the config entry's data. Home Assistant stores it in `.storage/` in
  plain text, like every other integration token; the guide says so.

### 4.6 Sources deliberately not used

- **FastF1** as a dependency: it cannot be used in real time (its own docs), it pulls
  pandas, numpy, scipy and matplotlib, and it is synchronous. It remains the reference
  for the formats. It is MIT-licensed; any ported algorithm is credited in `NOTICE`.
- **OpenF1:** live data is paid, and during a live session it refuses even historical
  requests without auth (verified on 2026-09-26).
- **F1 Sensor** (MIT) as a dependency (decision 1). It can be read as a reference with
  credit.
- **livef1-ha:** it has no licence file, so none of its code may be copied.
- **MultiViewer's circuit API** (`api.multiviewer.app`): undocumented, with no terms of
  use (§18 F).

---

## 5. Architecture

### 5.1 Overview

```
 Jolpica ─┐                         ┌─ WebSocket API ─► panel (Lit)
 Archive ─┼─► clients ─► core/ ─► hub ┤
 SignalR ─┤   (I/O)     (pure)       └─ entities / events ─► automations
 F1TV   ──┘
```

### 5.2 Clients (I/O, `clients/`)

- `jolpica.py`: rate limiter, disk cache, typed parse into `core` models.
- `archive.py`: season and session indexes, streamed downloads, disk cache, LRU cap.
- `livetiming.py`: SignalR Core client.
  - Reconnects with exponential backoff capped at 30 s.
  - Treats 45 s without a message as a dead connection.
  - Emits `(topic, payload, utc, received_monotonic)`.
- `f1tv.py`: token validation, renewal and status.

### 5.3 `core/` (pure)

- `live_state.py`: keyframe plus delta merge per topic, including the dict-as-list
  quirks.
- `timing.py`: derives the **timing tower view model** from the merged state (§7.1).
- `delay.py`: the TV-delay buffer (§8), given the current time as a parameter.
- `spoiler.py`: the no-spoiler filter (§9).
- `events.py`: derives automation events from state transitions (§10.3).
- `schedule.py`: session windows, next session, meeting state from the calendar and the
  current time.
- `archive_parse.py`: `.jsonStream` lines to timed messages; `.z` decoding.
- `outline.py`: builds a track outline from position samples (§6.5).
- `history.py`: history detail models (§7.3).

### 5.4 Hub (`hub.py`)

One per config entry. It owns:
- the live lifecycle (§6.1);
- the delay buffer;
- the current view models;
- subscribers (WebSocket connections and entities);
- the caches.

It throttles pushes to the panel: timing at most every 500 ms, the map every 250 ms,
and only while someone watches it. One 0.25 s loop per live session releases the
delayed messages (at most 2,000 per step, so a lowered delay's backlog never blocks
the event loop), measures health and publishes when due (decision 45):

- the page's view is made of sections (header, tower, race control, stewards, radio,
  weather, pits), each rebuilt only when a topic it reads changed (the state's
  versions), encoded once for every open page; after the first, complete message a
  page receives only the sections that changed (`full: false`);
- the map's outline travels once per revision, then only the projected cars;
- the entities read one snapshot computed by the hub, and are told to write only when
  it changed.

### 5.5 Resource budget

Targets on a Raspberry Pi 4:
- paused (the default, decision 42): no connection to F1's live feed and nothing live
  written to disk; the only writes are settings the user changes, the window
  auto-start has seen (once per session), and, when a page opens Live after a
  session, that session's final state downloaded once from the archive and cached;
- idle outside session windows: no connection and no timers except the schedule;
- live: under 5% CPU and under 150 MB of memory for the integration.

History detail is parsed in the executor and cached as a compact derived form, not as
raw streams.

---

## 6. Live lifecycle

### 6.1 Session windows

- The connection opens 30 minutes before a scheduled session start, from the calendar
  (§7.2).
- It closes when `SessionStatus` reaches `Finalised`, or when `ArchiveStatus` becomes
  `Complete`, plus 5 minutes. A hard cap is 4 hours after the scheduled end.
- Outside windows there is no connection, and the live page shows the next session with
  a countdown.
- A session started early or late is followed by `SessionInfo` and `SessionStatus`, not
  by the schedule.

### 6.2 Startup and restarts

After a restart inside a window, the hub reconnects and rebuilds from keyframes. The
page states "reconnected at HH:MM"; nothing is interpolated.

### 6.3 Loss of feed (INV-2)

Silence is measured on what the page shows: the receive time of the last *released*
message plus the TV delay, so a gap in the feed is noticed when the page reaches it,
not when the network had it. Only data counts: the server's keep-alive pings do not.

| After | What happens |
|---|---|
| 30 s | Banner "Live feed lost — reconnecting", data age visible on every block. |
| 60 s | Live entities go `unavailable`, and no automation event fires from stale state. |
| On return | Keyframes are reapplied, the banner clears, and entities recover. |

### 6.4 Session kinds

- **Race and Sprint:** gap and interval. Positions gained or lost vs the grid, where the
  grid comes from `TimingAppData.GridPos` live and from Jolpica in history.
- **Qualifying and Sprint Qualifying:**
  - the current segment (Q1/Q2/Q3 or SQ1–3);
  - the best lap in that segment;
  - the gap to P1;
  - the knocked-out zone marked, and knocked-out drivers greyed out.
- **Practice:** best lap order, gap to fastest, laps completed.

### 6.5 Track outline

- The map draws the circuit from positions, since there is no official geometry.
- Source: the most recent earlier session at the same circuit key in the archive. The
  outline is built once from its `Position.z` and cached as about 300 points plus
  rotation.
- Method (after F1 Sensor's, MIT, credited):
  1. keep only on-track, non-zero samples;
  2. take one clean lap of one driver;
  3. remove outliers by median absolute deviation;
  4. detect loop closure;
  5. downsample.
- For a circuit with no earlier session in the archive (a new venue), the outline is
  built live from positions after the first complete lap. Until then the map shows only
  the dots.
- The outline is rotated so the circuit's principal axis is horizontal, which fills
  a wide panel best. No corner numbers: they need data we do not have.
- The outline carries its own projection, so the hub projects every live car
  position with the same transform before sending it.

---

## 7. The panel

The navigation shows four pages: **Live**, **Calendar**, **Results**, **Standings**.

The header carries:
- the TV delay control (§8);
- the no-spoiler switch (§9);
- a small F1TV status chip for admins;
- a dashed "Paused" chip while live timing is paused, opening Settings;
- a gear opening Settings (§7.5): not a fifth tab (decision 44).

The footer carries the attribution and non-affiliation line.

The panel works on a phone: on narrow screens the timing tower collapses to position,
driver, gap, tyre and last lap, and a tap expands the row.

A navigable HTML prototype (`docs/panel-prototype.html`) is built and approved before
the panel (phase 3).

### 7.1 Live

**Header strip:**
- meeting and session name;
- lap `n/N` for races, or the remaining clock for timed sessions;
- a "data age" indicator while live; after a session, the next session and its
  countdown in the same place (decision 43).

**Flags & stewards** (§7.1.1), between the strip and the tower.

**Timing tower**, one row per driver:
- position and positions gained or lost (race and sprint);
- driver: TLA, number and full name on hover or tap, with a team-colour bar from
  `DriverList.TeamColour`;
- gap to leader and interval to the car ahead. In qualifying and practice: best lap and
  gap to P1;
- last lap and best lap, coloured: purple for overall fastest, green for personal best,
  default otherwise;
- sectors 1, 2 and 3 of the current lap, coloured the same way;
- tyre: compound (soft red, medium yellow, hard white, intermediate green, wet blue,
  unknown grey), a "new" or "used" marker, **tyre age in laps**, and the stint number;
- pit stop count and a `PIT` or `OUT` badge while in the pit lane;
- status: `RET`, `STOP`, knocked out, and so on.

**Side panels** (below the tower on a phone):
- **Race control:** messages newest first, with a filter "All / Flags / Penalties /
  Other". Penalties are recognised from the message text (`PENALTY`, `DRIVE THROUGH`,
  `STOP AND GO`, time penalties): best effort, because F1 has no structured penalty
  feed. The guide says so.
- **Weather:** air temperature, track temperature, humidity, wind (speed and direction),
  rainfall yes/no, pressure.
- **Pit stops:** driver, lap and pit lane time, from `PitLaneTimeCollection`. Stationary
  time appears only when F1TV provides `PitStopSeries`.
- **Team radio:** clips newest first, with driver, time and a play button. The browser
  plays the mp3 directly from F1's URL (§18 G). Clips are released through the TV delay
  like everything else.
- **Track map** (F1TV): the outline plus one dot per car in team colour with its TLA.
  Dots animate between samples. The leader and the selected driver are highlighted.
  - Without F1TV the block shows what it would add and how to enable it (admins), or
    only that it is not enabled (other users).
  - With F1TV but no positions arriving, it says "no position data from F1 for this
    session".

Selecting a driver highlights them everywhere: the tower row, the map dot and their
radio clips.

#### 7.1.1 Flags & stewards (decision 40)

Race control is the only source of penalties, investigations, sector flags and the
safety car's phases; `core/stewards.py` reads each message once into a book:

- **decisions:** time penalty, drive-through, stop and go, grid penalty, penalty
  served, disqualified, noted, under investigation, investigated after the race, no
  further action, warning, black and white flag, lap deleted; with the cars, seconds,
  places, turn, reason and lap;
- **penalties** stay listed, marked served when race control says so; an unserved time
  penalty shows as `+5s` next to the driver in the tower;
- **incidents** open while noted or under investigation, closed by a decision about
  the same cars and reason;
- **track limits:** laps deleted and black and white flags per driver;
- **flags:** yellow and double yellow per sector until cleared; the safety car and the
  VSC with their "ending" phase. The track status stays F1's authority; the messages
  add the sectors and the phases.

The card has four columns: track (status, sector chips, safety car phase), penalties,
investigations, track limits. It collapses to one line when all is calm, and carries a
yellow or red edge under the safety car or a red flag. On a phone it is one row of
chips that opens the columns (decision 46).

Recognising decisions is text parsing, best effort: checked against four real races
(Canada 2024, Britain 2025, Italy and Spain 2026) with no steward message left
unclassified. The guide says so.

#### 7.1.2 States of the page

`paused` (live timing is off and there is nothing to show), `idle` (on, outside a
session), `connecting`, `syncing` (§8), `live`, `stale` and `lost` (§6.3), `final`
(decision 43) and `hidden` (§9).

After a session the page shows its **final state**, frozen: a grey "FINAL" pill,
"Ended 17:00 · data frozen", no map. It is the last live state kept in memory when the
session was followed, else the archive's end-of-session keyframes (every public topic
plus the pit lane stream), downloaded once when a page opens Live and cached. No-spoiler
mode hides it like the live session.

### 7.2 Calendar

- The season schedule (any season, current by default). One card per meeting:
  - round, name, circuit and country;
  - the dates;
  - a sprint badge;
  - every session with its start time in **Home Assistant's timezone**;
  - a state: done, live now, next, or upcoming.
- The next session has a countdown. A done meeting shows its podium (decision 28) and
  links to its results; a live one links to Live.
- Source: Jolpica's schedule. The archive's season index cross-checks session names and
  gives the archive path.

### 7.3 Results (history)

- A season selector (1950 to now) and the season's rounds. A round opens its detail
  with tabs, **shown only when the data exists** (decision 4):

| Tab | Content | From |
|---|---|---|
| Race | Classification: position, driver, team, grid, positions gained, laps, time or status, points, fastest lap | 1950 (Jolpica) |
| Qualifying | Q1/Q2/Q3 times, position | Jolpica (Q times from 1994 onwards where present) |
| Sprint | Sprint classification | 2021 (Jolpica) |
| Lap chart | Position of every driver on every lap, drawn as lines | 1996 (Jolpica laps) |
| Tyre strategy | One bar per driver, stints coloured by compound, pit laps marked | 2018 (archive `TimingAppData`) |
| Lap times | Per driver: lap time, sectors, compound, tyre age; personal and overall bests coloured | 2018 (archive `TimingData`) |
| Pit stops | Driver, lap, duration | 2011 (Jolpica) |
| Race control | Full message log, with the same filter as live | 2018 (archive) |
| Weather | Start/end and min/max of air and track temperature, rain yes/no | 2018 (archive) |

- The first opening of a 2018+ race downloads its archive files once (a few MB), shows
  progress, and caches the derived detail. Later openings are instant.

### 7.4 Standings

- Drivers and constructors, any season, **after any round** (default: latest).
- Columns: position, driver or team, points, wins, gap to leader, and the change since
  the previous round.
- Source: Jolpica.

### 7.5 Settings (decision 44)

Behind the gear in the header:

- **Live timing:** a large play/pause button, the state in words ("Paused: nothing
  connects to F1 and nothing live is written to disk"), and "Start automatically at each
  session";
- **TV delay:** the same control as the header's;
- **Times** (decision 50, each user): the clock of the times shown;
- **F1TV** (administrators only): status and expiry, a password field to paste a token,
  save, and remove with a confirmation. The backend validates the token as the options
  flow does; the answer carries the status only (INV-3);
- **Entities:** the integration's entities with their state; a click opens Home
  Assistant's more-info dialog.
- **Panel** (administrators only): show in the sidebar, and only administrators can
  open it (decisions 48, 49).

### 7.6 Dashboard cards (decision 47)

Each piece of the Live page is a Lovelace card, in its own module
(`pit-lane-live-board-cards.js`) that the integration adds to every page of the
frontend with `frontend.add_extra_js_url`: the cards are in the card picker with no
resource to add, and a dashboard never loads the panel.

| Card | Element | Options |
|---|---|---|
| Timing tower | `pit-lane-tower-card` | `rows`, `columns`, `highlight` |
| Track map | `pit-lane-map-card` | — |
| Flags & stewards | `pit-lane-stewards-card` | — |
| Team radio | `pit-lane-radio-card` | `count` |
| Race control | `pit-lane-race-control-card` | `count`, `filter` |
| Session | `pit-lane-session-card` | — |
| Weather | `pit-lane-weather-card` | — |
| Championship | `pit-lane-standings-card` | `kind`, `rows` |

- Every card takes `title` and has a visual editor (`getConfigForm`), labels
  translated (INV-7).
- The cards read the same `live/subscribe` stream as the panel, so the TV delay,
  no-spoiler mode, INV-2 and the final view apply unchanged. One subscription per page
  is shared by all its cards and closed 5 s after the last card goes. The map card
  uses the panel's map element; the championship card reads `standings/get` every
  10 minutes.
- The stewards card sizes by its own width (container queries), not the window's.


---

## 8. TV delay (decision 7)

- One value per installation, 0–120 s, default 0. It is set from the panel header (a
  slider plus −1/+1 buttons, since the user tunes it while watching) and exposed as a
  `number` entity (§10). Global because the automations must match the same TV
  (§18 D).
- The delay buffer (`core/delay.py`) holds every live message with its receive time and
  releases it when `now ≥ received + delay`. The released stream feeds the same merge as
  without delay, so everything downstream is identical: timing, map, radio, race control
  and automation events.
- The buffer covers 120 s plus one keyframe snapshot.
  - Raising the delay freezes the output until it catches up.
  - Lowering it releases the backlog at once.
- The initial keyframes after connecting are held for the delay too, so a new connection
  never shows the future. The page says "syncing with your TV delay (n s)".

---

## 9. No-spoiler mode (decision 3)

For watching a session later.

- One switch per installation, in the panel header and as a `switch` entity. It stays on
  until turned off.
- When on, the **spoiler scope** is every session of the most recent meeting that has
  started.
  - **Live:** shows only the session name, the schedule and "session in progress —
    hidden". No tower, map, radio, race control or weather.
  - **Results:** sessions in scope show "Hidden — reveal" per session; revealing one
    reveals only that session.
  - **Standings:** show the table after the last round before the scope, with a note.
  - **Calendar:** sessions in scope show as done, without winners.
  - **Entities:** track status and lap go to `unknown`, and no race control events fire
    (§18 E).
- Filtering happens in the backend (INV-5).

---

## 10. Home Assistant

### 10.1 Setup

- Single instance. The config flow has one step: a short description with the
  non-affiliation notice and the attribution. No fields.
- The **options flow** holds:
  - F1TV: step-by-step instructions, a token field (write-only, never pre-filled),
    validation (signature, expiry, active subscription) and a remove option;
  - "Show in sidebar" (on by default).
- Minimum Home Assistant **2026.6.0** (§18 B).

### 10.2 Entities

| Entity | Kind | Purpose |
|---|---|---|
| `calendar.…_sessions` | calendar | Every session of the season. HA's calendar triggers with an offset give "15 minutes before the race" with no custom code. |
| `sensor.…_next_session` | timestamp | Start of the next session; attributes: meeting, session, circuit, round. |
| `sensor.…_session_status` | enum | `inactive`, `started`, `aborted`, `finished`, `finalised`. |
| `sensor.…_track_status` | enum | `clear`, `yellow`, `safety_car`, `virtual_safety_car`, `vsc_ending`, `red_flag`, `chequered`. |
| `sensor.…_lap` | number | Current lap. Attribute `total_laps`. Races and sprints only. No state class: a lap count is not worth long-term statistics. |
| `binary_sensor.…_session_live` | running | On inside an active session. |
| `binary_sensor.…_safety_car` | binary | On while the safety car is out; attribute `ending` in its last lap. |
| `binary_sensor.…_virtual_safety_car` | binary | Same for the VSC. |
| `binary_sensor.…_red_flag` | binary | On under a red flag. |
| `binary_sensor.…_yellow_flag` | binary | On with a yellow anywhere; attributes `sectors`, `double`. |
| `sensor.…_penalties` | count | Penalties given this session; attribute `penalties` (kept out of the recorder). |
| `sensor.…_investigations` | count | Incidents noted or under investigation; attribute `investigations` (unrecorded). |
| `sensor.…_race_control_message` | text | The latest race control message, as F1 wrote it. |
| `event.…_race_control` | event | `green_flag`, `yellow_flag`, `safety_car`, `virtual_safety_car`, `vsc_ending`, `red_flag`, `chequered_flag`, `session_started`, `session_ended`. |
| `event.…_stewards` | event | One per decision (§7.1.1), with drivers, numbers, seconds, places, reason, turn, lap and the message. |
| `switch.…_live_timing` | switch | Play and pause (decision 42). |
| `switch.…_no_spoiler` | switch | §9. |
| `number.…_tv_delay` | number (s) | §8. |
| `sensor.…_f1tv` | diagnostic enum | `not_configured`, `active`, `expiring`, `expired`, `invalid`. |

**Who sees what** (decision 48): the panel, every user unless the `admin_only` option
restricts it to administrators (off by default); the cards, whoever sees their
dashboard; the F1TV token and the panel's options, administrators only. `admin_only`
hides the panel; it is not an access control on data that is public anyway, and the
guide says so.

- Every live entity and event is released through the TV delay.
- Every live entity goes `unavailable` per §6.3, and while live timing is paused.
- No per-driver entities: 20 drivers × many fields would flood the registry, and the
  panel is the place for them (decision 1).

### 10.3 Events

`core/events.py` compares consecutive released states and emits at most one event per
transition. A reconnect never re-fires an event already fired for the same message.

The stewards event fires once per decision whose race control message lies past the
persisted mark `rcm_seen`: joining a session midway, what race control already said is
the baseline, and a reconnect or a restart replays nothing. Marks are written at most
every 30 s and only while live timing runs, and flushed on unload: only after a crash
can the events of the last 30 s fire again.

### 10.4 Repairs and diagnostics

- **Repair issues:**
  - "F1TV needs a new token" when the login session ends or renewal fails for 24 h;
  - "Live timing unreachable" after 3 failed session windows in a row. The count is
    persisted, so it survives restarts; a pause or an unload never counts.
- **Diagnostics:**
  - source reachability;
  - last errors;
  - cache size;
  - live connection state;
  - which topics arrived in the last session;
  - F1TV status and expiry date, never the token (INV-3).

### 10.5 WebSocket API

Every command requires an authenticated Home Assistant user.

- **Read:**
  - `calendar/get` (season);
  - `results/season` (season);
  - `results/detail` (season, round, tab);
  - `standings/get` (season, round);
  - `live/subscribe`: the whole view first, then only the sections that changed
    (`full: false`), pushed on change and throttled; opening it outside a session loads
    the final view (§7.1.2);
  - `map/subscribe`: the outline once, then the cars; the panel subscribes only while
    the map is on screen and the tab visible;
  - `settings/get`, `settings/subscribe`;
  - `entities`: the integration's entities, for Settings.
- **Settings** (any user; they are household TV settings, §18 C):
  - `settings/set` (`tv_delay`, `no_spoiler`, `live`, `auto_start`);
  - `spoiler/reveal` (session).
- **Admin only:** `f1tv/set` (token, validated, never returned), `f1tv/remove`, and
  `panel/set` (`show_in_sidebar`, `admin_only`). The options flow still works too.

---

## 11. Persistence

- **Config entry:** the F1TV token (data) and "show in sidebar" (options).
- **`Store`** (`.storage/pit_lane_live_board`): the TV delay, no-spoiler state and
  per-session reveals, live timing on/off and auto-start, the last fired event per
  topic and the stewards mark (§10.3), and the count of failed windows. Versioned
  schema, migrated forward; a newer major version is refused rather than misread.
  Settings save when changed; marks at most every 30 s while live; everything is
  flushed on unload.
- **Cache:** `<config>/.cache/pit_lane_live_board/`, disposable. Deleting it costs
  downloads, never data. Home Assistant's backups exclude `.cache/*` (verified in
  `homeassistant/components/backup/const.py`, 2026.6).

---

## 12. Frontend

- Lit 3 + TypeScript, built into `custom_components/pit_lane_live_board/frontend/`.
  Registered with `panel_custom` and served from the integration.
- Charts (lap chart, tyre strategy) are plain SVG written for the purpose: no chart
  library, which keeps the bundle small and theme-aware.
- Follows the Home Assistant theme (light and dark) through its CSS variables. Team
  colours come from the feed. Compound colours are the generic ones in §7.1.
- **No driver photos, team logos or F1 marks** (§18 H). A driver is TLA, number, name
  and team colour.
- Wait for Home Assistant's element registry before defining elements. Raccolta 0.4.1
  and Home Defender 1.0.12 found that HA's scoped-registry polyfill hides elements
  defined too early; reuse that fix.

---

## 13. Tests

- **Pure suite** (`tests/core/`), no Home Assistant: merge and delta quirks, timing tower
  derivation for every session kind, the delay buffer (raise, lower, keyframes), the
  spoiler filter, event derivation (no duplicates across reconnects), `.jsonStream`
  parsing (BOM, timestamps), `.z` decoding, outline building, schedule windows. Property
  tests with Hypothesis where they fit (merge, delay).
- **Fixtures** are small and mostly **synthetic**, shaped like the real formats (§18 Q):
  the F1 terms forbid reproducing substantial parts of their data.
- **Integration suite** (`tests/ha/`) with `pytest-homeassistant-custom-component`:
  setup, options flow, entities, WebSocket commands, repairs, diagnostics redaction
  (INV-3), and a fake SignalR server that feeds a scripted session.
- **Contract check** (`scripts/contract_check.py`), manual, not in CI: hits the real
  sources and reports format drift. It is run before each release and after F1 changes
  something.
- **Development session player** (`scripts/dev_session.py`, §18 I): serves the
  SignalR Core protocol on localhost and plays an archived session at a chosen speed.
  Home Assistant started with `PIT_LANE_DEV_LIVE_URL=http://127.0.0.1:8765/signalrcore`
  connects to it as if a window were open. It is a development tool, never shipped as
  a user feature (decision 8).

---

## 14. Language

- Code, identifiers, comments, commits, SPEC and CONTRIBUTING: English.
- The UI is in English and Italian from day one (decision 5):
  - backend strings live in `strings.json` and `translations/{en,it}.json`;
  - panel strings live in `frontend/src/i18n/{en,it}.json`;
  - CI checks that the key sets match in both places.
- **User documentation is bilingual** (decision 9): `README.md` + `README.it.md`,
  `docs/guide.md` + `docs/guide.it.md`, `SUPPORT.md` + `SUPPORT.it.md`. `CHANGELOG.md`
  is English only (§18 L).
- Race control messages and circuit names are shown as F1 sends them (English); they
  are data, not UI.

---

## 15. Legal and attribution

- **Non-affiliation notice**, in the README, the guide, `NOTICE` and the panel footer:
  > Pit Lane Live Board is unofficial and is not associated in any way with the
  > Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP,
  > GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.
- The name carries no F1 mark (decision 6). "Formula 1" appears only descriptively (repo
  description, topics, text), as F1's guidelines allow.
- The live timing feed and the archive are unofficial and undocumented. formula1.com's
  terms limit use to personal, non-commercial use. The project reads them the way the
  community tools do: at the rate of one viewer, cached, for personal use. The README
  says this plainly in "Good to know".
- Jolpica data: CC BY-NC-SA 4.0, attributed as "Data: Jolpica-F1 (CC BY-NC-SA 4.0)".
- Non-commercial: donations are gifts and buy no support or priority, as in the other
  Foyer Labs projects.

---

## 16. Repository, CI and releases

### 16.1 Layout

```
custom_components/pit_lane_live_board/
    core/            pure logic (INV-1)
    clients/         jolpica, archive, livetiming, f1tv
    __init__.py hub.py config_flow.py websocket.py panel.py
    calendar.py sensor.py binary_sensor.py event.py switch.py number.py
    repairs.py diagnostics.py store.py
    translations/  frontend/ (built)  brand/
frontend/            Lit + TypeScript sources, i18n
tests/core/          pure suite
tests/ha/            integration suite
scripts/             contract_check.py, dev_session.py, translation checks
docs/                SPEC.md, panel-prototype.html, guide.md, guide.it.md, screenshots/
```

### 16.2 Two branches (§18 A)

- **`develop`**: everything, work happens here, pull requests target it, and the full
  CI runs here.
- **`main`**: the default branch, the one users and HACS see. It holds only the
  published files (`custom_components/`, `hacs.json`, READMEs, guide, CHANGELOG, LICENSE,
  NOTICE, SUPPORT, CONTRIBUTING, SECURITY, issue templates, screenshots, brand) plus a
  reduced CI (hassfest and HACS validation).
- To publish, a script copies the published paths from `develop` to a branch, a pull
  request merges it into `main`, and the tag `vX.Y.Z` and the GitHub release go on
  `main`'s commit. This is the model Raccolta reached with decision 58.

### 16.3 CI on `develop`

- ruff;
- the pure suite;
- the import ban on `core/`;
- the integration suite on 2026.6 and on the latest stable;
- hassfest;
- HACS validation;
- the translation key parity check (backend and panel);
- the frontend typecheck and build, plus a check that the built files match the
  sources.

### 16.4 HACS readiness

- `hacs.json` with the name, `homeassistant: "2026.6.0"` and `render_readme: true`.
- The repo description, topics and issues are set (done 2026-09-26).
- The manifest has `codeowners: ["@foyer-labs"]`, `iot_class: cloud_push`, and
  `integration_type: service`.
- The brand icons live in `custom_components/…/brand/`, with no F1 marks.
- Releases are GitHub releases. Submission to `hacs/default` is the owner's call and is
  never done from a session.

### 16.5 Versions

Semantic Versioning. The same version appears in `manifest.json`, the tag and the
release title. Test versions are pre-releases.

---

## 17. Decision log

Decisions taken in chat with the owner.

1. **Own integration with a ready-made panel** (2026-09-26). F1 Sensor exposes sensors
   and cards you still have to assemble; the value here is a page that is already built.
   No dependency on F1 Sensor. FastF1 is a reference, not a dependency. Data reaches the
   panel over WebSocket commands, not as entities, and history loads on demand.
2. **F1TV optional; the token is pasted, then renewed automatically.** The owner first
   chose an email+password login with renewal. Research then showed that password login
   is blocked by F1TV's bot protection, so the final choice is: paste the token once,
   renew it automatically (~4 days), and raise a repair issue to paste again when the
   login session ends (~30 days). Without F1TV everything works except the live map;
   team radio does **not** need F1TV (verified live).
3. **Extras in the first version:** race control and weather; pit stops, penalties and
   positions gained or lost; no-spoiler mode; entities and events for automations.
4. **History:** every season since 1950 with results and standings. Lap-by-lap detail
   (sectors, tyres, race control, weather) from 2018. Everything is fetched on demand
   and cached.
5. **Languages:** English and Italian UI from day one; code in English.
6. **Name: Pit Lane Live Board.** Chosen after "F1 Live Board": F1's trademark
   guidelines forbid F1 marks in a product name, and the owner chose to rename now while
   the repository was empty. Repo `foyer-labs/Pit-Lane-Live-Board`, domain
   `pit_lane_live_board`, sidebar title "Live Board". "Formula 1" only descriptively.
7. **TV delay:** adjustable in the page, 0–120 s, applied equally to live data, map,
   radio and automation events. No guided calibration.
8. **No replay mode.** Past sessions are results and static detail only.
9. **Documentation:** README and guide complete in English **and** Italian, kept up to
   date with every change. All repository attributes set for a future HACS submission.
10. **Autonomous mandate** (2026-09-26). The owner asked me to build every phase on my own, deciding doubts with the option I recommend, under one hard constraint: **the app must be usable for free, with no subscription to an external service**. F1TV stays strictly optional; if a phase ever needs a paid or registered external service, work stops and the owner decides. Decisions 11 onward were taken by me under this mandate; each says so.
11. **Two branches from day one** (§18 A, taken by me) (`develop` and `main`, §16.2). Raccolta reached this
  model only after releases; starting with it avoids the migration.
12. **Minimum Home Assistant 2026.6.0**, as in Raccolta; CI on 2026.6 and the latest
  stable.** (§18 B, taken by me) 
13. **Every user can change the TV delay and no-spoiler mode; only admins manage F1TV.**
  Delay and no-spoiler are household TV settings, while the token is a credential.** (§18 C, taken by me) 
14. **Delay and no-spoiler are global, not per browser.** (§18 D, taken by me) Automations need one value,
  and a per-browser delay would disagree with the lights.
15. **No-spoiler also mutes the live entities and events** (§18 E, taken by me) (§9). Someone watching later
  does not want the lights to turn red during dinner. Someone watching live with a delay
  uses the delay, not no-spoiler.
16. **Track outline derived from the archive**, not from MultiViewer's API, which has no
  terms of use and no documentation.** (§18 F, taken by me) 
17. **Team radio played straight from F1's URL** (§18 G, taken by me) by the browser, not proxied through
  Home Assistant. It is simpler, and the mp3s need no auth. The cost is that the
  browser contacts F1's servers directly.
18. **No driver photos, team logos or F1 marks** (§18 H, taken by me) (copyright and trademark). TLA, number,
  name and team colour are enough to recognise a driver.
19. **A development-only session player** (§18 I, taken by me) (§13) to build and test the live page without
  waiting for a race weekend. It never ships as a feature (decision 8).
20. **Live connection only inside session windows** (§18 J, taken by me) (§6.1), not for the whole weekend.
21. **Automation surface as in §10.2** (§18 K, taken by me): calendar, a few sensors, one event entity, a
  switch and a number. No per-driver entities and no custom bus events.
22. **CHANGELOG, CONTRIBUTING and SPEC in English only.** (§18 L, taken by me) The user-facing documents are
  bilingual (§14).
23. **No disclaimer acceptance tick.** (§18 M, taken by me) This is not a safety product; the
  non-affiliation notice is shown in the config flow, the panel, the README and the
  guide.
24. **Push rates:** (§18 N, taken by me) timing at most every 500 ms, map every 250 ms with interpolation in
  the browser.
25. **Cache in `<config>/.cache/pit_lane_live_board/`, capped at 500 MB** (§18 O, taken by me), kept out of
  backups (§11).
26. **Standings "after round N"** (§18 P, taken by me) are included: the same call gives the history view
  and no-spoiler's "before this weekend".
27. **Test fixtures synthetic or tiny excerpts** (§18 Q, taken by me); real data only through the manual
  contract check.
28. **The calendar shows each finished meeting's podium** (taken by me, while building
  the prototype): a finished card with only a link looked empty, and the podium is the
  first thing a fan looks for. It costs three Jolpica requests per season
  (`results/1`, `/2`, `/3`), cached like the rest, and no-spoiler mode hides it for the
  meetings in scope.
29. **Weather and pit stops sit under the timing tower; map, race control and radio in
  the side column** (taken by me, from the prototype's screenshots): the tower is
  shorter than the side column, and the space under it was empty.
30. **The bench's data is generated, not committed** (taken by me, phase 4):
  `scripts/bench_data.py` runs real Jolpica and archive data through the backend's own
  `core/` functions into the git-ignored `bench/data/`. The pictures are realistic and
  the repository still carries no F1 data (decision 27).
31. **"Next" is the meeting holding the next session to start** (taken by me, phase 4,
  from the bench): during a live race the following weekend is already "next", and
  between two sessions of the same weekend that weekend still is.
32. **Icons are inline Material Design Icons paths** (taken by me, phase 4), so the
  panel needs no icon element from Home Assistant and the bench needs no fake one.
33. **Checked end to end in a real Home Assistant** (phase 5): a throwaway local
  instance (2026.6) with the development player feeding the 2026 Spanish GP showed the
  live page updating, the calendar from real Jolpica data, and the map drawn from live
  positions through the fallback of §6.5. The map card no longer says "F1TV": the map
  can exist without it.
34. **Calendar event names come from the integration's translations** (taken by me,
  phase 6): Home Assistant has no translation category for data such as event
  summaries, so the session names live under `selector.session` in `strings.json` and
  are read with Home Assistant's own translation loader (INV-7 holds).
35. **One options form** (taken by me, phase 6): "show in sidebar", the F1TV token and,
  when one is stored, "remove the token". A menu of two steps would add a click for
  two fields. URLs in the instructions are placeholders, as hassfest requires.
36. **The brand is a timing tower on the panel's gradient** (taken by me, phase 7):
  four rows with purple, green and yellow timing marks and a chequered corner; no F1
  mark, font or red. `scripts/build_brand.py` renders the eight files of
  `custom_components/pit_lane_live_board/brand/` from `docs/logo/*.svg`.
37. **Screenshots in both languages** (taken by me, phase 7): each README and each guide
  shows its own language, captured from the bench by `scripts/screenshots.sh`.
38. **The first release is 0.1.0, a normal release** (taken by me, phase 7), as with
  Raccolta: HACS offers pre-releases only to those who ask for them, and a version
  below 1.0 already says "young".
39. **A review before the first release** (taken by me, phase 7): two review agents,
  one on the backend and one on the panel, found 29 defects; every one verified was
  fixed with a test where it could be. The ones that mattered most: overlapping
  session windows would have skipped the second session of a day; protocol pings
  counted as live data and health ignored the TV delay (INV-2); no-spoiler mode made
  withheld events fire later, and failed open while the calendar was unknown (INV-5);
  a refused F1TV token stopped the whole feed instead of only the map; open pages kept
  listening to the old hub after a reload; settings changed elsewhere never reached an
  open panel. Settings are now pushed to the panel (`settings/subscribe`).

40. **Flags and stewards get their own card and entities** (asked by the owner after
  0.1.0, designed by me): see §7.1.1 and §10.2. Automations were the reason: a red
  flag, a safety car or a penalty to a favourite driver are good triggers.
41. **Three live topics are no longer subscribed** (taken by me, 0.2 review):
  `TopThree`, `TimingStats` and `SessionData` fed nothing the page shows; dropping
  them saves parsing and memory on every message.
42. **Live timing starts paused** (asked by the owner, 0.2): nothing connects to F1 and
  nothing live is written to disk until someone presses play in Settings, turns on the
  `live_timing` switch, or enables "Start automatically at each session", which turns
  it on once per session window (a pause pressed during a session holds). The reason
  is a Home Assistant on an SD card. The changelog says it first: an update from 0.1
  starts paused.
43. **The Live page after a session** (asked by the owner, 0.2): §7.1.2. The next
  session sits in the strip's right slot, where the data age is during a session (UI
  review): no extra block above or below.
44. **Settings behind a gear** (asked by the owner, 0.2; placement from the UI review):
  §7.5. A fifth tab would crowd the phone's tab row for a page visited rarely.
45. **A performance review of 0.1** (asked by the owner, 0.2): four review agents
  (live backend, Home Assistant integration, history, panel). What changed: the view in
  sections sent as deltas and encoded once; entity writes only on change; one live loop
  with a capped release; the map outline once and the map subscribed only while seen;
  race control parsed once per message; the finalised check once per batch; history
  from memory with parallel downloads, a TimingData prefilter, `LapSeries` for the lap
  chart, an outline per circuit from the latest qualifying; cache ages that follow a
  settled round; a token-bucket limiter keeping 20 requests an hour for the calendar;
  qualifying tabs only from 1994; the current weekend's rounds from the calendar; a
  sector 3 that arrives after the lap closes (qualifying) assigned to that lap; the
  panel kept across a reload; the start-up never waiting on the network.
46. **On a phone the stewards card is one row of chips** (UI review, 0.2): the four
  columns would push the tower below the fold during a race.

47. **Dashboard cards** (asked by the owner, 0.3): §7.6. A separate module loaded on
  every page, registered by the integration (no resource to add), one shared stream,
  a visual editor for each card.
48. **The panel for administrators only, as an option** (asked by the owner, 0.3): off
  by default. It sets the panel's `require_admin`; it is not presented as a security
  boundary (§10.2).
49. **The sidebar option in Settings too** (asked by the owner, 0.3): administrators
  change `show_in_sidebar` and `admin_only` from the panel as well as from *Configure*;
  both write the entry's options, and the panel is registered again only when one of
  them changes.

50. **Each user chooses the clock of the times** (asked by the owner, 0.4): as in the
  Home Assistant profile (server's zone, or the device's when the profile says so;
  before 0.4 the server's was always used), the device's zone, or local time at the
  track; optionally both, the other in small and omitted when both read the same hour.
  The choice is the user's, kept with `frontend/set_user_data`. The track's zone is an
  IANA name per circuit in `core/circuits.py` (Jolpica has none), else per country when
  the country has one zone; unknown means no track time rather than a wrong one.

51. **A driver's race in the tower** (asked by the owner, 0.5): the selected row opens
  on every screen with the stints (from `TimingAppData`: compound, laps as
  `TotalLaps − StartLaps` following one another from lap 1, best lap per stint) and,
  in races and sprints while running, the rejoin estimate of `core/strategy.py`: the
  circuit's typical pit loss (a table by Jolpica circuit id, else 22 s; not F1's pit
  lane time, which includes the stretch driven anyway), × 0.55 under a safety car and
  × 0.65 under a VSC, against the gaps of the cars on the same lap. Mini-sectors come
  from `TimingData` segment statuses (2051 purple, 2049 green, 2048 yellow, 2064 pit).
52. **The household's drivers** (asked by the owner, 0.5): up to five codes, a sensor
  each (added and removed as the list changes), a ★ in the tower, and the "My drivers"
  event from consecutive snapshots (the first one of a session is the baseline;
  position events in races and sprints only; penalties from the stewards' decisions).
  Administrators choose them: they create entities for the house.
53. **The session summary** (asked by the owner, 0.5): built when the followed session
  is finalised, once per session (keys persisted), for the kinds chosen; sent to the
  chosen notify services and as the "Session summary" event; held while no-spoiler mode
  hides the session and released when revealed. Texts from the integration's
  translations (`selector.summary`). Administrators choose the services.

---

## 18. Choices awaiting confirmation

None. Items A–Q of draft 1 became decisions 11–27 under the autonomous mandate (decision 10); the letters are kept in the references for traceability.

---

## 19. Phases

One phase per session, one branch per phase, a pull request to `develop`. Each phase
updates the README, the guide (from the phase that creates it) and the changelog
entry `[Unreleased]` for anything a user can see.

| Phase | Content |
|---|---|
| **0 — Foundations** | Skeleton, manifest, `hacs.json`, `develop`/`main` setup, full CI, config flow, empty store, translations and the parity check, the import-ban test, the publish script. |
| **1 — Core** | `core/`: live state merge, timing tower for all session kinds, delay buffer, spoiler filter, events, schedule windows, archive parsing, `.z` decoding, outline builder, with the pure suite. |
| **2 — Sources** | Jolpica, archive and SignalR clients with rate limits and cache; F1TV validation and renewal; hub lifecycle; repairs; diagnostics; the contract check; the dev session player. |
| **3 — Prototype** | `docs/panel-prototype.html`: every page, both languages, light and dark, phone width. Approved before phase 4. |
| **4 — Panel, static pages** | WebSocket read commands; Calendar, Results (all tabs) and Standings; the header controls; no-spoiler in those pages. |
| **5 — Panel, live** | Live page: tower, race control, weather, pit stops, team radio, track map, delay control, feed-loss states. |
| **6 — Entities** | Calendar, sensors, binary sensor, event entity, switch, number, options flow for F1TV and the sidebar. |
| **7 — Release** | The complete guide (en/it), README screenshots, brand icons, the contract check against a real weekend, the first release. |

README and changelog exist from phase 0 and never promise what the published version
does not do. Until the first release, the README's status is "in design".

---

## 20. Documentation

- **README** (`README.md` + `README.it.md`): the front door.
  - It follows the other Foyer Labs projects: a one-line pitch, badges, a hero
    screenshot as soon as one exists, and "What you get" written from a fan's point of
    view.
  - Then "Get started" in three steps and "Good to know": unofficial sources, what F1TV
    adds, TV delay, and that the data can change or stop without notice.
  - Then Status, then Support and licence with the Buy Me a Coffee button and "a
    donation is a thank-you and buys neither support nor priority".
  - Each README links to the other language at the top.
  - Links are absolute, because HACS renders the README inside Home Assistant.
- **Guide** (`docs/guide.md` + `docs/guide.it.md`), created in the first phase with
  something to install:
  - installation;
  - the four pages, and how to read the timing tower (colours, tyre age, gap vs
    interval);
  - TV delay;
  - no-spoiler mode;
  - F1TV step by step, including where the token is stored;
  - automations with examples: lights following the track status, a notification 15
    minutes before the race;
  - troubleshooting;
  - FAQ.
- **CHANGELOG.md**: `[Unreleased]` on top; behaviour changes first under "Changed —
  read before updating".
- **SUPPORT** (en/it), **CONTRIBUTING**, **SECURITY**, issue forms (problem and idea),
  and **NOTICE** (licence, the non-affiliation notice, Jolpica attribution, credits to
  FastF1 and F1 Sensor for ported algorithms).
- Every pull request that changes something visible updates the README (if what you get
  changes), both guides and the changelog in the same branch. A phase is not finished
  until these tell the truth.
