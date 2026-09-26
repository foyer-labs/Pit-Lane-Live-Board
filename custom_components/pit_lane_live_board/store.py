"""Persistent household state (SPEC §11).

The settings (TV delay, no-spoiler, reveals) and the automation event marks, so a
restart never fires an event twice (SPEC §10.3).
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import STORE_KEY, STORE_MINOR_VERSION, STORE_VERSION
from .core.settings import Settings

MARKS_SAVE_DELAY = 5


class _VersionedStore(Store[dict[str, Any]]):
    async def _async_migrate_func(
        self, old_major_version: int, old_minor_version: int, old_data: dict[str, Any]
    ) -> dict[str, Any]:
        # 1.1 is the first schema: nothing to migrate yet. Unknown fields are
        # dropped on load, so a downgrade never breaks loading.
        return old_data


class SettingsStore:
    """Settings save at once, since they change rarely; marks save a moment later,
    since a busy race changes them often."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store = _VersionedStore(
            hass, STORE_VERSION, STORE_KEY, minor_version=STORE_MINOR_VERSION
        )
        self.settings = Settings()
        self.marks: dict[str, Any] = {}

    async def async_load(self) -> Settings:
        data = await self._store.async_load()
        self.settings = Settings.from_dict(data)
        marks = data.get("marks") if isinstance(data, dict) else None
        self.marks = dict(marks) if isinstance(marks, dict) else {}
        return self.settings

    def _data(self) -> dict[str, Any]:
        return {**self.settings.to_dict(), "marks": self.marks}

    async def async_save(self, settings: Settings) -> None:
        self.settings = settings
        await self._store.async_save(self._data())

    def save_marks(self, marks: dict[str, Any]) -> None:
        self.marks = dict(marks)
        self._store.async_delay_save(self._data, MARKS_SAVE_DELAY)
