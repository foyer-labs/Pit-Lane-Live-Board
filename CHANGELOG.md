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
