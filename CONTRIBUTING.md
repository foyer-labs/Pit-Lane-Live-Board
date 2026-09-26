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

- Python 3.13 or 3.14.
- Pure suite, **without** Home Assistant installed (an environment with Home Assistant
  auto-loads `pytest-asyncio` and changes how this suite runs):
  ```bash
  pip install pytest pytest-xdist hypothesis
  pytest -n auto
  ```
- Home Assistant suite (Linux or WSL):
  ```bash
  pip install pytest-homeassistant-custom-component pytest-xdist
  pytest -p pytest_homeassistant_custom_component -o asyncio_mode=auto -o asyncio_default_fixture_loop_scope=function -n auto tests/ha
  ```
- Lint: `ruff check .` and `ruff format --check .`
- After any change to `strings.json`: `python scripts/sync_translations.py`, then add
  the same keys to `translations/it.json`.
- Frontend (Lit + TypeScript, Node 24): `cd frontend && npm ci && npm run build`. The
  built panel in `custom_components/pit_lane_live_board/frontend/` is committed and CI
  checks it matches the sources. Panel strings live in `frontend/src/i18n/{en,it}.json`.
- The bench: `python scripts/bench_data.py` once (it builds git-ignored data from the
  real sources), then serve the repository root (`python -m http.server 8777`) and open
  `/bench/?page=live`. `bash scripts/screenshots.sh` recaptures `docs/screenshots/`.
- `python scripts/dev_session.py <archive session path>` replays an archived session
  as a fake live feed; start Home Assistant with `PIT_LANE_DEV_LIVE_URL` pointing at it.
- `python scripts/contract_check.py` checks the real sources still speak the expected
  formats (manual, not in CI).

## Pull requests

One branch per topic, and small commits with a message that says *why*. CI must be
green.
