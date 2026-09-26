# Contributing

Thank you for your interest. Code, comments, commits and the specification are in
English; the user interface and the user documentation are in English and Italian.

## Two branches

- **`main`** is what HACS installs: only the integration, the guide and the user-facing
  files.
- **`develop`** is where the work happens: frontend sources, tests, specification,
  scripts. Pull requests target `develop`; `main` is only updated by releases.

## Before writing code

[`docs/SPEC.md`](https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/develop/docs/SPEC.md)
is the source of truth. Read it, especially the invariants (§3) and the decision log
(§17). A feature the spec does not describe is proposed first with an issue.

## Rules that do not bend

- `core/` is pure: no Home Assistant, no network, no clock it was not given. A test
  enforces it; if it fails, the code is fixed, never the test.
- Stale data is never shown as live.
- The F1TV token never leaves the backend.
- One upstream connection, session windows only, and caches and rate limits on every
  source.
- Spoilers are filtered in the backend.
- No F1 marks, logos or driver photos; the non-affiliation notice stays everywhere it
  is.
- Every user-visible string goes through the translations, in English **and** Italian.
- Every user-visible change updates, in the same branch, both READMEs, both guides and
  the `[Unreleased]` entry of `CHANGELOG.md`.
- Test fixtures are synthetic or tiny excerpts: F1's terms forbid reproducing
  substantial parts of their data.

## Development environment

Filled in by phase 0 of the specification: Python and Node versions, the pure suite, the
Home Assistant suite, lint, the frontend build and the translation checks.

## Pull requests

One branch per topic, and small commits with a message that says *why*. CI must be
green.
