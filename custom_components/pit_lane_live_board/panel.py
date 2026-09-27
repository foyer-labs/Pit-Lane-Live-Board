"""Serves the frontend: the sidebar panel and the dashboard cards (SPEC §7, §7.6,
§10.1).

The panel stays registered when hidden from the sidebar: it opens from its address.
Changing an option updates the registration without removing it, so whoever is
using the panel stays where they are. Every user can open it unless an
administrator restricts it to administrators (decision 48); the cards follow the
dashboard they are on, whose visibility Home Assistant already controls.

The cards' module is added to every page of the frontend, so the cards appear in
the card picker with no resource to add by hand (decision 47).
"""

from __future__ import annotations

import hashlib
from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, OPTION_ADMIN_ONLY, OPTION_SHOW_IN_SIDEBAR

FRONTEND_DIR = Path(__file__).parent / "frontend"
MODULE = "pit-lane-live-board-panel.js"
CARDS = "pit-lane-live-board-cards.js"
ELEMENT = "pit-lane-live-board-panel"
URL_PATH = "pit-lane-live-board"
STATIC_URL = f"/{DOMAIN}_static"
TITLE = "Live Board"
ICON = "mdi:flag-checkered"
_VERSION_KEY = f"{DOMAIN}_frontend_version"
_CARDS_KEY = f"{DOMAIN}_cards_url"


def _fingerprint(name: str) -> str:
    """A content hash, so a new version is never hidden by the browser's cache."""
    path = FRONTEND_DIR / name
    return hashlib.sha256(path.read_bytes()).hexdigest()[:12] if path.exists() else "0"


def _fingerprints() -> dict[str, str]:
    return {name: _fingerprint(name) for name in (MODULE, CARDS)}


def show_in_sidebar(entry: ConfigEntry) -> bool:
    return bool(entry.options.get(OPTION_SHOW_IN_SIDEBAR, True))


def admin_only(entry: ConfigEntry) -> bool:
    return bool(entry.options.get(OPTION_ADMIN_ONLY, False))


async def _versions(hass: HomeAssistant) -> dict[str, str]:
    if (versions := hass.data.get(_VERSION_KEY)) is None:
        versions = await hass.async_add_executor_job(_fingerprints)
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(FRONTEND_DIR), cache_headers=True)]
        )
        hass.data[_VERSION_KEY] = versions
    return versions


async def async_register(hass: HomeAssistant, entry: ConfigEntry) -> None:
    versions = await _versions(hass)
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
                "module_url": f"{STATIC_URL}/{MODULE}?v={versions[MODULE]}",
            }
        },
        require_admin=admin_only(entry),
        update=URL_PATH in hass.data.get("frontend_panels", {}),
    )


async def async_register_cards(hass: HomeAssistant) -> None:
    """Once per Home Assistant run: the module stays across entry reloads."""
    if hass.data.get(_CARDS_KEY):
        return
    versions = await _versions(hass)
    url = f"{STATIC_URL}/{CARDS}?v={versions[CARDS]}"
    frontend.add_extra_js_url(hass, url)
    hass.data[_CARDS_KEY] = url


def async_remove(hass: HomeAssistant) -> None:
    frontend.async_remove_panel(hass, URL_PATH, warn_if_unknown=False)
    if url := hass.data.pop(_CARDS_KEY, None):
        frontend.remove_extra_js_url(hass, url)
