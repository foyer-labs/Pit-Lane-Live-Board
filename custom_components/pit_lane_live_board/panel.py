"""Serves the frontend and registers the sidebar panel (SPEC §7, §10.1).

The panel stays registered when hidden from the sidebar: it opens from its address.
Changing the option updates the registration without removing it, so whoever is
using the panel stays where they are. Every user can open it; there is nothing in
it that needs an administrator (decision 13).
"""

from __future__ import annotations

import hashlib
from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, OPTION_SHOW_IN_SIDEBAR

FRONTEND_DIR = Path(__file__).parent / "frontend"
MODULE = "pit-lane-live-board-panel.js"
ELEMENT = "pit-lane-live-board-panel"
URL_PATH = "pit-lane-live-board"
STATIC_URL = f"/{DOMAIN}_static"
TITLE = "Live Board"
ICON = "mdi:flag-checkered"
_VERSION_KEY = f"{DOMAIN}_frontend_version"


def _fingerprint() -> str:
    """A content hash, so a new version is never hidden by the browser's cache."""
    path = FRONTEND_DIR / MODULE
    return hashlib.sha256(path.read_bytes()).hexdigest()[:12] if path.exists() else "0"


def show_in_sidebar(entry: ConfigEntry) -> bool:
    return bool(entry.options.get(OPTION_SHOW_IN_SIDEBAR, True))


async def async_register(hass: HomeAssistant, entry: ConfigEntry) -> None:
    if (version := hass.data.get(_VERSION_KEY)) is None:
        version = await hass.async_add_executor_job(_fingerprint)
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(FRONTEND_DIR), cache_headers=True)]
        )
        hass.data[_VERSION_KEY] = version
    frontend.async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title=TITLE,
        sidebar_icon=ICON,
        show_in_sidebar=show_in_sidebar(entry),
        frontend_url_path=URL_PATH,
        config={
            "_panel_custom": {
                "name": ELEMENT,
                "embed_iframe": False,
                "trust_external": False,
                "module_url": f"{STATIC_URL}/{MODULE}?v={version}",
            }
        },
        require_admin=False,
        update=URL_PATH in hass.data.get("frontend_panels", {}),
    )


def async_remove(hass: HomeAssistant) -> None:
    frontend.async_remove_panel(hass, URL_PATH, warn_if_unknown=False)
