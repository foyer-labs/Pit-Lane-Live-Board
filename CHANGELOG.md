# Changelog

All notable changes to Pit Lane Live Board are listed here. Versions follow
[Semantic Versioning](https://semver.org/). Anything that asks you to act comes first,
under **Changed — read before updating**.

## [Unreleased]

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
