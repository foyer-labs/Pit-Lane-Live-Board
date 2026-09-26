"""Diagnostics (SPEC §10.4). Never the F1TV token (INV-3)."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.core import HomeAssistant

from . import LiveBoardConfigEntry
from .const import DATA_F1TV_TOKEN


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: LiveBoardConfigEntry
) -> dict[str, Any]:
    return {
        "entry": {
            "data": async_redact_data(dict(entry.data), {DATA_F1TV_TOKEN}),
            "options": dict(entry.options),
        },
        "hub": await entry.runtime_data.hub.async_diagnostics(),
    }
