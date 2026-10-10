# Pit Lane Live Board — guide

*[Italiano](guide.it.md)*

Formula 1 in your Home Assistant sidebar: the live timing tower, the calendar, every
race since 1950 and both championships. This guide covers everything, in order: read
the first two sections and you are set; come back to the others when you need them.

- [Install](#install)
- [Settings and live timing](#settings-and-live-timing)
- [The four pages](#the-four-pages)
- [Reading the timing tower](#reading-the-timing-tower)
- [Flags and stewards](#flags-and-stewards)
- [TV delay](#tv-delay)
- [No-spoiler mode](#no-spoiler-mode)
- [F1TV and the live map](#f1tv-and-the-live-map)
- [My drivers](#my-drivers)
- [Session summary](#session-summary)
- [Dashboard cards](#dashboard-cards)
- [Dedicated screens](#dedicated-screens)
- [Entities and automations](#entities-and-automations)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

> Pit Lane Live Board is unofficial and is not associated in any way with the
> Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP,
> GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.

## Install

You need Home Assistant 2026.6 or later and HACS. No account anywhere: calendar,
results, standings and live timing are free. An F1TV subscription is optional and
only adds the live track map.

1. In HACS, open the menu (⋮) → *Custom repositories*, add
   `https://github.com/foyer-labs/Pit-Lane-Live-Board` with category *Integration*.
2. Find **Pit Lane Live Board** in HACS, download it, and restart Home Assistant.
3. *Settings → Devices & services → Add integration → Pit Lane Live Board.* There is
   nothing to fill in: read the notice and confirm.
4. **Live Board** appears in the sidebar, for every user of the house.
5. Open the panel's **Settings** (the gear at the top right) and press **play**, or turn
   on *Start automatically at each session*. Live timing starts paused: see the next
   section.

To remove it: delete the integration under *Devices & services*, then remove it from
HACS. Its cache (under `.cache/pit_lane_live_board` in your configuration folder) can
be deleted at any time; it is not part of backups.

## Settings and live timing

![The Settings page](screenshots/settings.png)

The gear at the top right of the panel opens **Settings**:

- **Live timing.** The big button turns it on and off. **Paused**, nothing connects to
  F1 and nothing live is written to disk — worth it on a Raspberry Pi with an SD card —
  and the live entities are unavailable. **On**, the integration connects by itself
  from 30 minutes before each session and lets go a few minutes after it ends; outside
  sessions it only checks the calendar. The same switch is the **Live timing** entity.
- **Start automatically at each session.** Live timing turns itself on as each session
  window opens. If you pause it during a session, it stays paused until the next one.
- **TV delay**, the same control as the clock in the header (see [TV delay](#tv-delay)).
- **Times** (each user for themselves): which clock the calendar and the countdowns
  use — *as in my Home Assistant profile* (the default: the server's time zone, or your
  device's if your profile says so), *this device's time zone*, or *local time at the
  track* — and *Show both times*, which adds the other clock in small ("15:00 at the
  track"). Kept with your Home Assistant user, so it follows you to every device.
- **F1TV** (administrators only): the token's status and expiry, a field to paste a new
  one, and *Remove* (see [F1TV](#f1tv-and-the-live-map)).
- **Entities**: every entity of the integration with its state; click one for its
  history and settings.
- **My drivers** (administrators): up to five drivers the house follows, picked from
  the season's drivers. See [My drivers](#my-drivers).
- **Summary at the end of a session** (administrators): the notify services to send
  it to, and after which sessions. See [Session summary](#session-summary).
- **Panel** (administrators only): *Show Live Board in the sidebar*, and *Only
  administrators can open the panel* — off by default, so every user of the house
  sees it. See [who sees what](#who-sees-what).

While live timing is paused the header shows a dashed **Paused** chip; it opens
Settings. Calendar, results and standings do not depend on it.

## The four pages

![The Live page during a race](screenshots/live.png)

**Live.** During a session: the session strip (lap or clock, and how old the data is),
[flags and stewards](#flags-and-stewards), the timing tower, race control, team radio,
weather, pit stops and — with F1TV — the track map.

![The Live page after the race](screenshots/final.png)

After a session the page keeps its **final state**, frozen: the classification, the
stewards' decisions, race control, radio and pit stops, marked *FINAL* with the time it
ended, and the next session counting down on the right. If live timing was paused
during the session, the final state comes from F1's archive the first time you open the
page (it is published about half an hour after the session). Before the first session
of the year, or with nothing to show, the page shows the next session with a
countdown, and a play button when live timing is paused.

![Qualifying, dark theme](screenshots/qualifying.png)

In qualifying the tower shows each driver's best time in Q1, Q2 and Q3, the gap to the
fastest in the current part, and a dashed red line where the knockout zone starts.

![The calendar](screenshots/calendar.png)

**Calendar.** Every weekend of the season, sessions in your Home Assistant's
timezone, the next session counting down, and the podium of every weekend already run.
Pick any season from the menu.

![Tyre strategy of a race](screenshots/strategy.png)

**Results.** Any season since 1950. Open a round for its tabs; a tab appears only when
the data exists:

| Tab | From |
|---|---|
| Race | 1950 |
| Qualifying | 1994 |
| Sprint | 2021 |
| Sprint qualifying | 2023 |
| Lap chart | 1996 |
| Pit stops | 2011 |
| Tyre strategy, Lap times, Race control, Weather | 2018 |

The 2018+ tabs come from F1's session archive: the first time you open a race, it is
downloaded once (a few MB) and kept in the cache, so later openings are instant.

During a race weekend, each session appears in Results about half an hour after it
ends, before the official results are published (usually after the race): Race,
Qualifying and Sprint then show F1's own timing, marked **provisional** — no points
yet, and the stewards may still change the order — and switch to the official
results by themselves once they are out.

![The lap chart](screenshots/lap-chart.png)

In the lap chart, click a line to highlight that driver.

![Circuit history: every driver's affinity index at Baku](screenshots/circuit.png)

**Circuit history.** From a weekend in the Calendar or a round in Results, *Circuit
history* opens that circuit's record for this season's drivers: races there, wins,
podiums, poles, best and average finish and qualifying, and an **affinity index**.
Click a driver for each of their years there: team, qualifying, grid (▼ when a penalty
or a pit-lane start put them behind their qualifying), finish, points, outcome, fastest
lap and the stewards' penalties (from 2018).

![A driver's years at the circuit](screenshots/circuit-driver.png)

The **affinity index** answers "does this circuit suit them, whatever the car?". Each
year, the team's place in that season's constructors' championship gives where its
cars were expected to finish (constructors' P1 → P1.5, P5 → P9.5); the index looks at
how many places better or worse the driver finished (60%) and qualified (40%). 50 means
"as the car"; each place better adds 5. Recent years weigh more (each year back counts
85% of the next), a mechanical retirement is left out, and with only one or two races
the index stays close to 50 — one good afternoon is not an affinity. It reads a circuit,
not a driver's worth: it cannot see team orders or an upgrade halfway through a season.

![Drivers' standings](screenshots/standings.png)

**Standings.** Drivers and constructors, any season, after any round, with points,
wins, the gap to the leader and places gained or lost since the round before.

## Reading the timing tower

| Column | Meaning |
|---|---|
| Pos | Position. ▲/▼ next to the driver: places gained or lost since the start (races and sprints). |
| Gap | Time to the leader. `1 L`: one lap behind. |
| Int | Interval: time to the car directly ahead. |
| Last, Best | Last and best lap. |
| S1, S2, S3 | The three sectors of the current lap; greyed values are from the lap just finished. |
| Tyre | Compound (S soft red, M medium yellow, H hard white, I intermediate green, W wet blue), then the **laps on that set**. *used* marks a set that had laps before this stint. |
| Pits | Pit stops so far. |

Colours follow F1's convention: **purple** is the fastest of the session, **green** is
the driver's personal best. Badges: `PIT` in the pit lane, `OUT` leaving it, `RET`
retired, `STOP` stopped on track, `KO` knocked out of qualifying. A car retired or
stopped shows, where its gap was, the lap it happened on (`lap 7`).

A red `+5s` after a driver's number is a time penalty not served yet.

Click a row to follow a driver: the row, their dot on the map and their team radio are
highlighted, and the row opens:

![A driver's stints and where a stop would bring them out](screenshots/driver.png)


- **Stints:** each set of tyres so far, with its compound, the laps it covered and the
  best lap on it — laps 1–24 on mediums, best 1:33.1 on lap 18, then softs from lap 25.
- **If they stopped now** (races and sprints): the position they would come back out
  in, and the cars just ahead and behind. It is an estimate: the typical time a stop
  costs at that circuit (22 s where it is not known), less under a safety car or a VSC,
  compared with the gaps of the cars on the same lap.

Under each sector time a thin strip shows the **mini-sectors** of the current lap in
F1's colours: purple for the fastest of the session, green for a personal best, yellow
otherwise.

Race control can be filtered to flags or to penalties.

When the feed goes quiet, a banner says so after 30 seconds and the page greys out
after 60: nothing that is not live is ever shown as live.

![The phone layout](screenshots/phone.png)

On a phone the tower keeps position, driver, gap, last lap and tyre.

## Flags and stewards

The card between the session strip and the tower reads race control for you:

| Column | What it shows |
|---|---|
| Track | The track status, the sectors under yellow (`S7`) or double yellow (`S10 ×2`), and the safety car or VSC phase, including *in this lap*. |
| Penalties | Every penalty of the session, newest first: `+5s`, `DT` (drive-through), `SG` (stop and go), grid penalties, `DSQ`. A served penalty turns grey with a ✓. |
| Investigations | Incidents *noted*, *under investigation* or to be looked at *after the race*, with the cars and the turn. They leave the list when the stewards decide. |
| Track limits | Laps deleted per driver, and ⚑ for a black and white flag. |

When all is calm the card is a single line; under the safety car or a red flag it gets a
coloured edge. On a phone it is one row of chips: tap it to open the columns.

F1 has no structured feed for penalties: they are read from the stewards' messages.
The reading was checked on four whole races without a miss, but a new wording could
slip through; race control always shows the original message.

## TV delay

![Setting the TV delay](screenshots/delay.png)

Live timing arrives before your TV — seconds ahead of broadcast, up to a minute or more
ahead of a stream. Click the clock in the header and set a delay of 0–120 seconds: the
page, the team radio, the entities and the automation events all wait by that amount.

Tune it during a session: when a car crosses the line on your TV, the tower should
change at the same moment. The setting is one for the whole house, because the lights
follow the same TV. It is also the **TV delay** number entity.

After a connection opens, even the first data waits for the delay: the page says
"Syncing with your TV delay" until then.

## No-spoiler mode

Recording the race to watch after dinner? Click the eye in the header (or turn on the
**No-spoiler mode** switch). Until you turn it off:

- the Live page shows only which session is running;
- the results of the current weekend are hidden, round by round and tab by tab, each
  with a *Reveal this session* button;
- the calendar hides the weekend's podium;
- standings show the table from before the weekend;
- the live entities have no value and no race-control event fires.

Hidden data never leaves Home Assistant: it is withheld by the integration, not
covered by the page.

## F1TV and the live map

Everything works without an account. An **F1TV subscription** adds one thing: the
live track map, because F1 only sends car positions to subscribers. Team radio does
not need it.

An administrator adds the token once:

1. In a browser, sign in to F1TV (`f1tv.formula1.com`) with an active subscription.
2. Open the browser's developer tools (F12) → *Application* (*Storage* in Firefox) →
   *Cookies* → `https://f1tv.formula1.com`.
3. Copy the **value** of the cookie named `loginSession`.
4. In the panel: **Settings** (the gear) → *F1TV*, paste it and press *Save*. (Or in
   Home Assistant: *Settings → Devices & services → Pit Lane Live Board → Configure*.)

You can also paste the bare token or a `Bearer …` header. The token is never shown
again. It is renewed automatically (every few days); about once a month F1 ends the
login behind it, and a notice in *Settings → Repairs* asks you to paste a new one —
until then everything except the map keeps working. *Remove the token* in Settings (or
*Configure*) removes it.

Where it is kept: in Home Assistant's `.storage/core.config_entries`, in plain text,
like every other integration's token. It is never sent to the page, entities, logs or
diagnostics — only to F1.

The circuit is drawn from the cars' positions in F1's archive of an earlier session at
the same track; for a brand-new circuit it is drawn live after the first lap.

## Dashboard cards

![The dashboard cards](screenshots/cards.png)

Every piece of the Live page is also a card for your own dashboards. There is nothing
to install: after the integration is set up, *Edit dashboard → Add card* lists them
under **Pit Lane**, each with a visual editor.

Among the dashboard resources (*Settings → Dashboards → ⋮ → Resources*) you will find
one added by the integration, `/api/pit_lane_live_board/frontend/loader.js`: it is what
brings the cards to the Companion app too. Leave it there; if you remove it, it comes
back at the next restart, and it goes away by itself when you remove the integration.
With YAML resources it never ends up in your files.

| Card | Type | Options |
|---|---|---|
| Timing tower | `custom:pit-lane-tower-card` | `rows` (1–22), `columns` (`gap`, `interval`, `last`, `best`, `sectors`, `tyre`, `pits`), `highlight` (a driver's code or number) |
| Track map | `custom:pit-lane-map-card` | — (live only, needs F1TV) |
| Flags & stewards | `custom:pit-lane-stewards-card` | — |
| Team radio | `custom:pit-lane-radio-card` | `count` |
| Race control | `custom:pit-lane-race-control-card` | `count`, `filter` (`all`, `flags`, `penalties`, `other`) |
| Session | `custom:pit-lane-session-card` | — |
| Weather | `custom:pit-lane-weather-card` | — |
| Championship | `custom:pit-lane-standings-card` | `kind` (`drivers`, `constructors`), `rows` |

Every card also takes `title` (leave it empty for none).

The cards show the same thing as the Live page: they follow the TV delay and
no-spoiler mode, say when the feed is late or lost, offer a play button while live
timing is paused, and after a session show its final state (the map comes back at the
next session). All the cards on a page share one connection to Home Assistant.

A compact race dashboard, in YAML:

```yaml
type: vertical-stack
cards:
  - type: custom:pit-lane-session-card
  - type: custom:pit-lane-stewards-card
  - type: custom:pit-lane-tower-card
    rows: 10
    columns: [gap, last, tyre]
    highlight: LEC
```

### Who sees what

- **The panel:** every user of the house, unless an administrator turns on *Only
  administrators can open the panel* in Settings (or under *Configure*). Each user can
  also hide it from their own sidebar (*Profile → Change the order and hide items from
  the sidebar*).
- **The cards:** whoever can see the dashboard they are on; Home Assistant decides
  that, per dashboard.
- **F1TV token and panel options:** administrators only.

"Only administrators" hides the panel; it is not a lock on the data. Calendar,
results and timing are public F1 information, and any signed-in user can still read
them through a card or the entities.

## My drivers

Follow up to five drivers in Settings. For each one:

- a sensor, **Driver LEC**, whose state is the position, with best lap, tyre, stint,
  pit stops, penalty, status and places gained as attributes (gaps, lap times and the
  laps on a tyre move every lap or faster: they stay on the page and the cards, so the
  recorder is not written all the time);
- a ★ next to their code in the timing tower, and their row highlighted in the tower
  card when it has no driver of its own;
- the **My drivers** event: `position_gained`, `position_lost`, `took_lead`, `pit_in`,
  `pit_out`, `fastest_lap`, `retired`, `penalty`, with `driver` (the code), `position`,
  `previous_position` and `lap`. Positions count in races and sprints only.

```yaml
alias: Leclerc takes the lead
triggers:
  - trigger: state
    entity_id: event.pit_lane_live_board_my_drivers
conditions:
  - "{{ trigger.to_state.attributes.event_type == 'took_lead' }}"
  - "{{ trigger.to_state.attributes.driver == 'LEC' }}"
actions:
  - action: light.turn_on
    target: { entity_id: light.living_room }
    data: { color_name: red, flash: long }
```

## Session summary

When a session ends, the integration sends a summary to the destinations chosen in
Settings, after the kinds of session you pick: a phone with the Home Assistant app,
Home Assistant's own notifications, or the notify entities that integrations such as
the Telegram bot or e-mail create. Type part of a name — `pixel`, `telegram` — and
pick it from the suggestions (or use the arrow keys and Enter); each chosen
destination has its *Remove* button. *Send a test* sends the summary of what the Live
page shows.

It reads like a headline: the title says what happened, the first line is the result
and the second your drivers (★), so a locked phone already tells the story.

```text
🏆 Antonelli wins the Spanish GP
🥇 ANT · 🥈 VER +4.351 · 🥉 NOR +5.089
★ LEC P4 ▲1 · HAM DNF lap 7
⏱️ Fastest lap: RUS 1:35.587
📈 Biggest mover: BEA P22 → P16
❌ DNF: HAM, STR, PER, SAI
⚖️ Penalties: SAI +5s, GAS +5s
```

Qualifying leads with the pole (`⚡ Norris on pole · Spanish GP`, or the margin when it
is under five hundredths), practice with the fastest (`⏱️ FP2: Piastri fastest`). The
*biggest mover* is the finisher off the podium who gained most places, from three. A
retirement shows the lap it happened on.

*Content* chooses how much: **Compact**, as above, or **Full**, which adds the whole
classification — medals for the podium, `4. ★LEC +29.116 · 1:36.063` (gap and best
lap), `+1 lap`, ⏱️ by the fastest lap, the retirements at the end with their lap; in
qualifying, the order in its parts: Q3 with the gaps, then *Out in Q2* and *Out in Q1*
with each driver's time. The event's `facts` always carry the whole classification.

On a phone with the Home Assistant app, a tap on the summary opens the board, and each
summary replaces the one before instead of piling up; on Android it has a channel of
its own, *Pit Lane Live Board*, so you can give it its own sound in the phone's
settings. In Home Assistant's notifications, too, the new summary replaces the old one.
Speaking it with a TTS automation? Every emoji opens its line: strip them with
`{{ message | regex_replace('^\\W+', '', multiline=True) }}` if your speaker reads them out.

It is also the **Session summary** event, with `title` and `message` ready to send or
speak and the facts behind them, for your own automations. With no-spoiler mode on it
waits until you reveal the session or turn the mode off.

## Dedicated screens

![Kiosk mode on a TV](screenshots/tv.png)

**A TV, a monitor with a Raspberry Pi, a wall tablet.** Add `?kiosk` to the panel's
address (Settings shows it, ready to copy): the panel fills the whole screen, over
Home Assistant's sidebar and header, and the pointer hides when it rests. On a
Raspberry Pi, open it with `chromium --kiosk "http://homeassistant.local:8123/pit-lane-live-board?kiosk"`.
`&page=calendar` opens another page, `&scale=1.3` makes everything bigger for a TV
seen from the sofa. The ⛶ button in the header does the same for the moment, until Esc.

**A small screen: an ESP32 with ESPHome, an e-paper frame, a LED ring.** Enable the
**Small screen** sensor (it is off by default: during a session it changes every few
seconds, which only a screen needs; if you enable it, you can also leave it out of the
recorder). Its state is the Live page's (`live`, `final`, `paused`…) and its attributes
are short and flat, ready to print:

| Attribute | Example |
|---|---|
| `meeting`, `session`, `kind` | Spanish Grand Prix, Race, race |
| `lap`, `total_laps`, `part`, `remaining` | 31, 57 (or Q2 and seconds left) |
| `track`, `flag_colour` | `safety_car`, `#ff8c00` — for a LED ring |
| `safety_car`, `red_flag` | true / false |
| `p1` … `p10` | `" 2 ANT   +3.561 M16"`: position, code, gap, tyre and its age |
| `mine` | your drivers' rows, on one line |
| `next_meeting`, `next_session`, `next_start` | the next session, for a countdown |

The screen never talks to F1: the TV delay and no-spoiler mode are already applied.
It writes only when what it shows changed, but during a session that is every few
seconds: to keep it out of Home Assistant's history, add this to `configuration.yaml`:

```yaml
recorder:
  exclude:
    entities:
      - sensor.pit_lane_live_board_small_screen
```

```yaml
# ESPHome: read what the screen needs from Home Assistant.
text_sensor:
  - platform: homeassistant
    id: f1_state        # live, final, paused, idle…
    entity_id: sensor.pit_lane_live_board_small_screen
  - platform: homeassistant
    id: f1_track        # clear, yellow, safety_car, red_flag…
    entity_id: sensor.pit_lane_live_board_small_screen
    attribute: track
  - platform: homeassistant
    id: f1_p1           # " 1 LEC          H30"
    entity_id: sensor.pit_lane_live_board_small_screen
    attribute: p1
  - platform: homeassistant
    id: f1_p2
    entity_id: sensor.pit_lane_live_board_small_screen
    attribute: p2
  - platform: homeassistant
    id: f1_mine         # your drivers, one line
    entity_id: sensor.pit_lane_live_board_small_screen
    attribute: mine
sensor:
  - platform: homeassistant
    id: f1_lap
    entity_id: sensor.pit_lane_live_board_small_screen
    attribute: lap

display:
  - platform: ...       # your screen
    lambda: |-
      it.printf(0, 0, id(font_big), "LAP %.0f", id(f1_lap).state);
      it.print(0, 40, id(font_mono), id(f1_p1).state.c_str());
      it.print(0, 60, id(font_mono), id(f1_p2).state.c_str());
      it.print(0, 90, id(font_small), id(f1_mine).state.c_str());
```

## Entities and automations

The integration adds one device, **Pit Lane Live Board**, with these entities (their
ids follow Home Assistant's language when you install; find them on the device page):

| Entity | What it says |
|---|---|
| `calendar.pit_lane_live_board_sessions` | Every session of the season. |
| `sensor.pit_lane_live_board_next_session` | Start of the next session; attributes meeting, session, circuit, round. |
| `sensor.pit_lane_live_board_session_status` | `inactive`, `started`, `aborted`, `finished`, `finalised`. |
| `sensor.pit_lane_live_board_track_status` | `clear`, `yellow`, `safety_car`, `virtual_safety_car`, `vsc_ending`, `red_flag`, `chequered`. |
| `sensor.pit_lane_live_board_lap` | Current lap; attribute `total_laps`. |
| `binary_sensor.pit_lane_live_board_session_running` | On while a session runs. |
| `binary_sensor.pit_lane_live_board_safety_car` | On while the safety car is out; attribute `ending` in its last lap. |
| `binary_sensor.pit_lane_live_board_virtual_safety_car` | The same for the virtual safety car. |
| `binary_sensor.pit_lane_live_board_red_flag` | On under a red flag. |
| `binary_sensor.pit_lane_live_board_yellow_flag` | On with a yellow anywhere; attributes `sectors` and `double`. |
| `sensor.pit_lane_live_board_penalties` | Penalties given this session; attribute `penalties` (driver, kind, seconds, reason, lap, served). |
| `sensor.pit_lane_live_board_investigations` | Incidents noted or under investigation; attribute `investigations`. |
| `sensor.pit_lane_live_board_race_control_message` | The latest race control message, in English as F1 writes it. |
| `event.pit_lane_live_board_race_control` | `green_flag`, `yellow_flag`, `safety_car`, `virtual_safety_car`, `vsc_ending`, `red_flag`, `chequered_flag`, `session_started`, `session_ended`. |
| `event.pit_lane_live_board_stewards` | One event per stewards' decision: `time_penalty`, `drive_through`, `stop_go`, `grid_penalty`, `penalty_served`, `disqualified`, `noted`, `investigation`, `investigation_after_race`, `no_further_action`, `warning`, `black_and_white_flag`, `lap_deleted`; attributes `drivers`, `numbers`, `seconds`, `places`, `reason`, `turn`, `lap`, `message`. |
| `sensor.pit_lane_live_board_driver_lec` (one per followed driver) | The driver's position; the rest as attributes. See [My drivers](#my-drivers). |
| `event.pit_lane_live_board_my_drivers` | The followed drivers' events. |
| `event.pit_lane_live_board_session_summary` | The summary when a session ends. |
| `sensor.pit_lane_live_board_small_screen` (off by default) | For small screens: see [Dedicated screens](#dedicated-screens). |
| `switch.pit_lane_live_board_live_timing` | Live timing on (play) or paused. |
| `switch.pit_lane_live_board_no_spoiler_mode` | No-spoiler mode. |
| `number.pit_lane_live_board_tv_delay` | TV delay in seconds. |
| `sensor.pit_lane_live_board_f1tv` | F1TV status (diagnostic). |

Live entities follow the TV delay, become unavailable when the feed is lost or live
timing is paused, and stay quiet in no-spoiler mode. They write a new state only when
their value changes, so a race adds a few hundred rows to the recorder, not thousands;
the penalty and investigation lists are kept out of the recorder.

**A notification 15 minutes before the race** — the calendar trigger does the timing:

```yaml
alias: Race in 15 minutes
triggers:
  - trigger: calendar
    event: start
    offset: "-0:15:0"
    entity_id: calendar.pit_lane_live_board_sessions
conditions:
  - condition: template
    value_template: "{{ trigger.calendar_event.summary.endswith('Race') }}"
actions:
  - action: notify.mobile_app_my_phone
    data:
      message: "{{ trigger.calendar_event.summary }} starts in 15 minutes"
```

**Lights that follow the track:**

```yaml
alias: Lights follow the track status
triggers:
  - trigger: state
    entity_id: sensor.pit_lane_live_board_track_status
actions:
  - choose:
      - conditions: "{{ trigger.to_state.state in ['yellow', 'safety_car', 'virtual_safety_car', 'vsc_ending'] }}"
        sequence:
          - action: light.turn_on
            target: { entity_id: light.living_room }
            data: { color_name: yellow }
      - conditions: "{{ trigger.to_state.state == 'red_flag' }}"
        sequence:
          - action: light.turn_on
            target: { entity_id: light.living_room }
            data: { color_name: red }
      - conditions: "{{ trigger.to_state.state == 'clear' }}"
        sequence:
          - action: light.turn_on
            target: { entity_id: light.living_room }
            data: { color_name: green }
```

**Something special for a red flag**, from the race-control event:

```yaml
alias: Red flag
triggers:
  - trigger: state
    entity_id: event.pit_lane_live_board_race_control
conditions:
  - condition: state
    entity_id: event.pit_lane_live_board_race_control
    attribute: event_type
    state: red_flag
actions:
  - action: notify.mobile_app_my_phone
    data:
      message: Red flag!
```

**A notification when your driver gets a penalty**, from the stewards event:

```yaml
alias: Penalty for Leclerc
triggers:
  - trigger: state
    entity_id: event.pit_lane_live_board_stewards
conditions:
  - "{{ trigger.to_state.attributes.event_type in ['time_penalty', 'drive_through', 'stop_go', 'grid_penalty'] }}"
  - "{{ 'LEC' in trigger.to_state.attributes.drivers }}"
actions:
  - action: notify.mobile_app_my_phone
    data:
      message: >-
        {{ trigger.to_state.attributes.drivers | join(', ') }}:
        {{ trigger.to_state.attributes.seconds ~ ' s ' if trigger.to_state.attributes.seconds else '' }}penalty
        for {{ trigger.to_state.attributes.reason | lower }}
```

**Amber lights for the whole safety car period**, from its binary sensor:

```yaml
alias: Safety car lights
triggers:
  - trigger: state
    entity_id: binary_sensor.pit_lane_live_board_safety_car
    to: ["on", "off"]
actions:
  - action: light.turn_on
    target: { entity_id: light.living_room }
    data:
      color_name: "{{ 'orange' if trigger.to_state.state == 'on' else 'white' }}"
```

**Live timing on for the race only**, if you prefer it paused the rest of the weekend:

```yaml
alias: Live timing for the race
triggers:
  - trigger: calendar
    event: start
    offset: "-0:30:0"
    entity_id: calendar.pit_lane_live_board_sessions
conditions:
  - "{{ trigger.calendar_event.summary.endswith('Race') }}"
actions:
  - action: switch.turn_on
    target: { entity_id: switch.pit_lane_live_board_live_timing }
```

## Troubleshooting

**The Live page says "Live timing is paused".** Press play on the page or in Settings,
or turn on *Start automatically at each session*.

**The Live page says "No session running" during a session.** The connection opens 30
minutes before the scheduled start; check the time on the Calendar page. If a session
is running and the page still waits after a couple of minutes, look at *Settings →
Repairs* and at the integration's diagnostics (*Devices & services → Pit Lane Live
Board → ⋮ → Download diagnostics*): `live.last_error` says what went wrong.

**"Live timing unreachable" in Repairs.** Three session windows in a row ended
without a connection. Either this Home Assistant cannot reach
`livetiming.formula1.com`, or F1 changed its feed. Calendar, results and standings keep
working; check the project's issues for news.

**"F1TV needs a new token" in Repairs.** The monthly F1 login ended or F1 refused the
renewal: paste a new token (see [F1TV](#f1tv-and-the-live-map)).

**No map.** It needs F1TV, and F1 must send positions for that session; the card says
which of the two is missing.

**A tab says F1's archive has no detail.** Some sessions are simply missing from F1's
archive, and nothing before 2018 is there.

**"The data source did not answer."** Jolpica (results, standings, calendar) may be
busy; the integration also limits itself to 200 requests an hour. Try again in a
minute: what was loaded before is served from the cache.

**Team radio list is empty.** F1 publishes a selection of clips, and for some sessions
none at all.

**In the Companion app a card says "Configuration error".** From 0.9.2 this should no
longer happen: the app started from an old copy of the page, kept by Home Assistant's
service worker, in which the cards were missing; now they also arrive as a dashboard
resource, which the app always receives up to date. If it still happens after closing
and reopening the app twice, clear the page cache from the app's settings: on Android
*Settings → Companion app → Troubleshooting → Reset frontend cache* (Android's "Clear
cache" is not enough); on iPhone *Settings → Companion app → Debugging → Reset frontend
cache* (in some versions *Clear web view cache*).

## FAQ

**Is it official?** No. It reads F1's public live timing and archive the way a single
viewer would, and Jolpica-F1's results database, for personal, non-commercial use.
Both can change or stop without notice.

**Does it cost anything?** No. F1TV is optional and only needed for the live map.

**Is it really live?** As live as F1's own timing site. Use the TV delay to match
your screen.

**How much data does it use?** A live session is a few kilobytes a second. Opening a
2018+ race's detail downloads a few megabytes once. Everything else is small and
cached.

**Will it run on a Raspberry Pi?** Yes: no heavy libraries; outside session windows it
only checks the calendar, and while live timing is paused it writes nothing live to
the SD card. During a session the page receives only what changed.

**Why no driver photos or team logos?** They belong to F1 and to the teams. Drivers are
shown by their three-letter code, number, name and team colour.

**Can I watch an old race lap by lap, as if live?** No: history shows results and the
detail of each lap, not a replay.
