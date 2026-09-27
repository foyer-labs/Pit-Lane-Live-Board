"""Persistent household state (SPEC §11).

The settings (TV delay, no-spoiler, reveals, live timing on/off), the automation
event marks, so a restart never fires an event twice (SPEC §10.3), and the count of
session windows that never connected (the "unreachable" repair survives restarts).

Writes are rare on purpose (decision 42): settings save when changed, marks only
while live timing runs and at most every 30 s, and everything is flushed on unload.
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import STORE_KEY, STORE_MINOR_VERSION, STORE_VERSION
from .core.settings import Settings

MARKS_SAVE_DELAY = 30


class _VersionedStore(Store[dict[str, Any]]):
    async def _async_migrate_func(
        self, old_major_version: int, old_minor_version: int, old_data: dict[str, Any]
    ) -> dict[str, Any]:
        if old_major_version > STORE_VERSION:
            # Written by a newer version: refuse rather than misread it.
            raise NotImplementedError
        # 1.1 is the first schema; new fields default on load.
        return old_data


class SettingsStore:
    def __init__(self, hass: HomeAssistant) -> None:
        self._store = _VersionedStore(
            hass, STORE_VERSION, STORE_KEY, minor_version=STORE_MINOR_VERSION
        )
        self.settings = Settings()
        self.marks: dict[str, Any] = {}
        self.failed_windows = 0
        self.auto_window: str | None = None  # the last session window seen
        # Session summaries already sent, and one held back by no-spoiler mode.
        self.summaries_sent: list[str] = []
        self.pending_summaries: list[dict[str, Any]] = []

    async def async_load(self) -> Settings:
        data = await self._store.async_load()
        self.settings = Settings.from_dict(data)
        marks = data.get("marks") if isinstance(data, dict) else None
        self.marks = dict(marks) if isinstance(marks, dict) else {}
        failed = data.get("failed_windows") if isinstance(data, dict) else None
        self.failed_windows = failed if isinstance(failed, int) and failed >= 0 else 0
        window = data.get("auto_window") if isinstance(data, dict) else None
        self.auto_window = window if isinstance(window, str) else None
        sent = data.get("summaries_sent") if isinstance(data, dict) else None
        self.summaries_sent = [str(k) for k in sent] if isinstance(sent, list) else []
        pending = data.get("pending_summaries") if isinstance(data, dict) else None
        self.pending_summaries = (
            [p for p in pending if isinstance(p, dict)][-10:]
            if isinstance(pending, list)
            else []
        )
        return self.settings

    def _data(self) -> dict[str, Any]:
        return {
            **self.settings.to_dict(),
            "marks": self.marks,
            "failed_windows": self.failed_windows,
            "auto_window": self.auto_window,
            "summaries_sent": self.summaries_sent[-30:],
            "pending_summaries": self.pending_summaries,
        }

    async def async_save(self, settings: Settings | None = None) -> None:
        if settings is not None:
            self.settings = settings
        await self._store.async_save(self._data())

    def save_marks(self, marks: dict[str, Any]) -> None:
        self.marks = dict(marks)
        self._store.async_delay_save(self._data, MARKS_SAVE_DELAY)

    async def async_flush(self) -> None:
        """Write now (also replaces a pending delayed write): on unload, so a
        reload never reads marks older than the ones in memory."""
        await self._store.async_save(self._data())
