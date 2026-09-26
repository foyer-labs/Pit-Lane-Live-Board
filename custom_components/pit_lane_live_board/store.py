"""Persistent household state (SPEC §11)."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import STORE_KEY, STORE_MINOR_VERSION, STORE_VERSION
from .core.settings import Settings


class _VersionedStore(Store[dict[str, Any]]):
    async def _async_migrate_func(
        self, old_major_version: int, old_minor_version: int, old_data: dict[str, Any]
    ) -> dict[str, Any]:
        # Version 1.1 is the first schema: nothing to migrate yet. Unknown fields are
        # dropped by Settings.from_dict, so a downgrade never breaks loading.
        return old_data


class SettingsStore:
    """Loads and saves the Settings; saves immediately, they change rarely."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store = _VersionedStore(
            hass, STORE_VERSION, STORE_KEY, minor_version=STORE_MINOR_VERSION
        )
        self.settings = Settings()

    async def async_load(self) -> Settings:
        self.settings = Settings.from_dict(await self._store.async_load())
        return self.settings

    async def async_save(self, settings: Settings) -> None:
        self.settings = settings
        await self._store.async_save(settings.to_dict())
