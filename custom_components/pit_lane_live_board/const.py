"""Constants shared by the integration. Pure: importable without Home Assistant."""

from __future__ import annotations

DOMAIN = "pit_lane_live_board"
NAME = "Pit Lane Live Board"

# Persistent state (SPEC §11).
STORE_KEY = DOMAIN
STORE_VERSION = 1
STORE_MINOR_VERSION = 1

# Options (SPEC §10.1).
OPTION_SHOW_IN_SIDEBAR = "show_in_sidebar"

# Config entry data (SPEC §4.5): the F1TV token. Never returned to the frontend.
DATA_F1TV_TOKEN = "f1tv_token"
