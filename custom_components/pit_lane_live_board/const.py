"""Constants shared by the integration. Pure: importable without Home Assistant."""

from __future__ import annotations

DOMAIN = "pit_lane_live_board"
NAME = "Pit Lane Live Board"
# Kept equal to manifest.json and pyproject.toml by a test.
VERSION = "0.10.0"
REPOSITORY = "https://github.com/foyer-labs/Pit-Lane-Live-Board"

# Every request says who is asking (INV-4; Jolpica asks for it).
USER_AGENT = f"PitLaneLiveBoard/{VERSION} (+{REPOSITORY})"

JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1/"
ARCHIVE_BASE = "https://livetiming.formula1.com/static/"
LIVE_BASE = "https://livetiming.formula1.com/signalrcore"

# Disk cache under <config>/.cache, which Home Assistant leaves out of backups
# (SPEC §11).
CACHE_DIR = ".cache/pit_lane_live_board"
CACHE_CAP_BYTES = 500 * 1024 * 1024

# A development-only override of the live endpoint, for scripts/dev_session.py
# (decision 19). Never set in a real installation.
ENV_DEV_LIVE_URL = "PIT_LANE_DEV_LIVE_URL"

# Persistent state (SPEC §11).
STORE_KEY = DOMAIN
STORE_VERSION = 1
STORE_MINOR_VERSION = 1

# Options (SPEC §10.1).
OPTION_SHOW_IN_SIDEBAR = "show_in_sidebar"
# The panel for administrators only (decision 48). Off by default.
OPTION_ADMIN_ONLY = "admin_only"

# Config entry data (SPEC §4.5): the F1TV token. Never returned to the frontend.
DATA_F1TV_TOKEN = "f1tv_token"
