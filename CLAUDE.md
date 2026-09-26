# Pit Lane Live Board — working agreement

A Home Assistant custom integration (HACS) with a ready-made sidebar panel for Formula 1
fans: calendar, history since 1950, the live session (timing tower, sectors, tyres, gaps,
race control, weather, team radio, track map with F1TV) and both championships.
Unofficial, non-commercial, Apache-2.0.

Replies and questions to the owner in **Italian**. Code, identifiers, comments, commits,
SPEC and CONTRIBUTING in **English**. User documentation in **English and Italian**.

## Read this first, every session

**`docs/SPEC.md` is the source of truth.** Read all of it before writing code, not only
the parts that look relevant: it carries the reasons behind the choices.

- The decision log is SPEC §17. The choices still awaiting confirmation are SPEC §18: a
  phase that depends on an unconfirmed §18 item does not start. Ask first.
- The repository is the only memory shared between the machines this project is worked
  from. Every decision taken in chat goes into SPEC §17, in the same branch as the work
  that uses it.
- `docs/panel-prototype.html` (from phase 3) is the approved design of the panel. Open
  it before building UI.

## The seven invariants (SPEC §3)

- **INV-1 — `core/` is pure.** No I/O, no clock it was not given, no `homeassistant.*`,
  `aiohttp` or `asyncio` imports. A test enforces it; if it fails, fix the code, never
  the test.
- **INV-2 — Stale is never shown as live.** Feed lost → banner within 30 s, live
  entities `unavailable` within 60 s.
- **INV-3 — Credentials never leave the backend.** The F1TV token is never returned,
  logged, put in attributes or in diagnostics.
- **INV-4 — Good citizen of every source.** One live connection, session windows only,
  cache, rate limits, our own User-Agent.
- **INV-5 — Spoilers are filtered in the backend**, never only hidden in the page.
- **INV-6 — Unofficial, and says so.** Non-affiliation notice and Jolpica attribution;
  no F1 marks in name, icon or panel.
- **INV-7 — Every user-visible string is translated** (en, it). CI checks key parity.

## Two branches (SPEC §16.2)

- **`develop`**: everything. Work here, branches start here, pull requests come back
  here. The full CI runs here.
- **`main`**: the default branch, the one users and HACS see: only published files plus
  a reduced CI (hassfest and HACS). Never work on `main` directly; it is updated only by
  the publish script's pull request, and tags and releases go on `main`'s commit.

## How to work here

- One phase per session (SPEC §19). Nothing from a later phase, even when it is one line
  away.
- A branch per phase or topic, with a pull request to `develop`. Small, working commits
  whose messages say *why*, not *what*.
- Git identity: only `Foyer Labs <foyerlabs@gmail.com>`. Check `git config user.email`
  before the first commit on a new machine.
- Tests go alongside the code for all of `core/`, and run with no Home Assistant
  installed.
- **If the spec is ambiguous or contradicts itself, stop and ask**, one question at a
  time, with the alternatives and the recommended one first.
- Configuration is done from the UI only; no YAML schema.
- Every user-visible change updates, in the same branch:
  - `README.md` and `README.it.md`, when what the user gets changes;
  - `docs/guide.md` and `docs/guide.it.md`, once they exist;
  - the `[Unreleased]` entry of `CHANGELOG.md`.

  The README never promises what the published version does not do.
- Never submit to `hacs/default` and never touch the owner's Home Assistant: both are
  the owner's call.
- Look at every page as an image as soon as it exists: composition defects do not show
  when reading code.
- At the end of a session, report three things: what you built, what you did not build
  and why, and anything in the spec you believe is wrong.

## Things that are easy to get wrong here

- Live deltas are partial and some lists arrive as dicts keyed by index: merge, never
  replace.
- Archive files answer **403**, not 404, when missing; `.jsonStream` starts with a BOM;
  `.z` is base64 of raw deflate (`-zlib.MAX_WBITS`).
- `Position.z` needs F1TV; `TeamRadio` does not. Treat every topic as optional.
- The TV delay applies to **everything** live, including the first keyframes after
  connecting and the automation events.
- Jolpica wants a custom User-Agent and will lower its rate limits: always cache.
- Home Assistant's scoped custom-element registry polyfill: wait for `<home-assistant>`
  before defining elements (the fix from Raccolta 0.4.1 and Home Defender 1.0.12).
- The F1TV renewal uses constants of F1's own web client: keep them in `f1tv.py` only,
  and when renewal breaks, only the map may stop working.
