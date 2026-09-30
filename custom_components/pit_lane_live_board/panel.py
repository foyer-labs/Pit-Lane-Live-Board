"""Serves the frontend: the sidebar panel and the dashboard cards (SPEC §7, §7.6,
§10.1).

The panel stays registered when hidden from the sidebar: it opens from its address.
Changing an option updates the registration without removing it, so whoever is
using the panel stays where they are. Every user can open it unless an
administrator restricts it to administrators (decision 48); the cards follow the
dashboard they are on, whose visibility Home Assistant already controls.

The cards reach every page through two channels (decision 59). The Companion app
opens on "/?external_auth=1", and Home Assistant's service worker answers with the
copy of index.html it saved when it installed, possibly weeks old: a module that
only the index brings (`add_extra_js_url`) can be missing on a cold start, and the
card shows "Configuration error". Lovelace resources travel over the websocket and
are always current. Both channels lead to the same module, which the browser runs
once:

- LOADER_URL, under /api/, never changes and the service worker never caches it:
  it imports the cards' module with the content hash in its path. It is the
  Lovelace resource.
- STATIC_URL/<hash>/<file>: one address, one content, cacheable forever. The panel
  opens from its own module here too.
- INDEX_LOADER is the index's channel: outside /api/, so the service worker caches
  it. It tries the fresh loader and falls back to the module.
- Addresses of earlier versions ("…cards.js?v=…", superseded hashes) lead to the
  current module, never to an error: the indexes saved by phones still hold them.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
from pathlib import Path
from typing import Any

from aiohttp import web
from homeassistant.components import frontend
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_CALL_SERVICE
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.http import HomeAssistantView

from .const import DOMAIN, OPTION_ADMIN_ONLY, OPTION_SHOW_IN_SIDEBAR

_LOGGER = logging.getLogger(__name__)

FRONTEND_DIR = Path(__file__).parent / "frontend"
MODULE = "pit-lane-live-board-panel.js"
CARDS = "pit-lane-live-board-cards.js"
ELEMENT = "pit-lane-live-board-panel"
URL_PATH = "pit-lane-live-board"
STATIC_URL = f"/{DOMAIN}_static"
# The Lovelace resource of the cards: stable forever (decision 59).
LOADER_URL = f"/api/{DOMAIN}/frontend/loader.js"
INDEX_LOADER = f"{STATIC_URL}/loader.js"
TITLE = "Live Board"
ICON = "mdi:flag-checkered"
_DATA = f"{DOMAIN}_frontend"
_LOCK = f"{DOMAIN}_frontend_lock"
_JS = "text/javascript"
_NO_CACHE = {"Cache-Control": "no-cache"}
# Compressed per browser: a shared cache must keep both versions apart.
_FOREVER = {
    "Cache-Control": "public, max-age=31536000, immutable",
    "Vary": "Accept-Encoding",
}
# After "Reload resources" the collection is watched for half a minute, often: the
# page reloads at once, without waiting for the service to finish.
_WATCH = 30.0
_STEP = 0.1

type Modules = dict[str, tuple[str, bytes]]


def _read_modules() -> Modules:
    """Hash and bytes of both modules, read once per Home Assistant run.

    These bytes are served, not the file: an address with a hash always gets the
    same content, even when an update replaces the file before the restart, and
    the JavaScript stays the one of the Python code that is running.
    """
    modules: Modules = {}
    for name in (CARDS, MODULE):
        content = (FRONTEND_DIR / name).read_bytes()
        modules[name] = (hashlib.sha256(content).hexdigest()[:12], content)
    return modules


def _url(modules: Modules, name: str) -> str:
    return f"{STATIC_URL}/{modules[name][0]}/{name}"


class _Loader(HomeAssistantView):
    """The Lovelace resource: a stable address, never cached, leading to the cards."""

    url = LOADER_URL
    name = f"api:{DOMAIN}:loader"
    requires_auth = False  # only the cards' JavaScript, like the static files

    def __init__(self, modules: Modules) -> None:
        self._modules = modules

    async def get(self, request: web.Request) -> web.Response:
        etag = f'"{self._modules[CARDS][0]}"'
        headers = {**_NO_CACHE, "ETag": etag}
        if request.headers.get("If-None-Match") == etag:
            return web.Response(status=304, headers=headers)
        return web.Response(
            text=f'import "{_url(self._modules, CARDS)}";\n',
            content_type=_JS,
            headers=headers,
        )


class _Static(HomeAssistantView):
    """The hashed modules, the index's loader and the addresses of before."""

    url = STATIC_URL + "/{tail:.+}"
    name = f"{DOMAIN}:static"
    requires_auth = False

    def __init__(self, modules: Modules) -> None:
        self._modules = modules

    async def get(self, request: web.Request, tail: str) -> web.Response:
        folder, _, name = tail.rpartition("/")
        if name in self._modules:
            fingerprint, content = self._modules[name]
            if folder == fingerprint:
                response = web.Response(
                    body=content, content_type=_JS, charset="utf-8", headers=_FOREVER
                )
                response.enable_compression()
                return response
            # A superseded hash, or the unhashed address of the versions up to
            # 0.9.1: the current module.
            text = f'import "{_url(self._modules, name)}";\n'
        elif tail == "loader.js":
            text = (
                f'import("{LOADER_URL}")'
                # Home Assistant is not answering yet: the module, from the cache.
                f'.catch(() => import("{_url(self._modules, CARDS)}"))'
                # A rejection left unhandled can make Safari's Home Assistant think
                # the page is broken.
                '.catch((error) => console.error("Pit Lane: cards not loaded",'
                " error));\n"
            )
        else:
            raise web.HTTPNotFound
        return web.Response(text=text, content_type=_JS, headers=_NO_CACHE)


def _resources(hass: HomeAssistant) -> Any:
    """Lovelace's resources, in storage or in YAML; None when there are none."""
    return getattr(hass.data.get("lovelace"), "resources", None)


def _is_loader(url: object) -> bool:
    return str(url or "").split("?")[0] == LOADER_URL


async def _async_ensure_resource(hass: HomeAssistant) -> None:
    """The loader among the Lovelace resources, once. Never stops the setup."""
    resources = _resources(hass)
    try:
        if hasattr(resources, "async_create_item"):  # resources in storage
            await resources.async_get_info()  # loads them from disk
            ours = [
                item
                for item in resources.async_items()
                if _is_loader(item.get("url"))
                or str(item.get("url") or "").startswith(STATIC_URL + "/")
            ]
            keep = next((i for i in ours if i.get("url") == LOADER_URL), None)
            # Duplicates, and entries added by hand for earlier versions.
            for item in ours:
                if item is not keep:
                    await resources.async_delete_item(item["id"])
            if keep is None:
                await resources.async_create_item(
                    {"res_type": "module", "url": LOADER_URL}
                )
        elif isinstance(getattr(resources, "data", None), list):  # resources in YAML
            # Read-only for Home Assistant, but a list: the entry lives in memory,
            # never touches configuration.yaml and comes back after "Reload
            # resources".
            if not any(
                isinstance(item, dict) and _is_loader(item.get("url"))
                for item in resources.data
            ):
                resources.data.append({"type": "module", "url": LOADER_URL})
        else:
            _LOGGER.warning("No Lovelace resources: the cards come from the index only")
    except Exception:
        _LOGGER.exception("The cards' Lovelace resource could not be registered")


@callback
def _is_resource_reload(data: Any) -> bool:
    return data.get("domain") == "lovelace" and data.get("service") == (
        "reload_resources"
    )


async def _async_watch(hass: HomeAssistant, data: dict, seen: Any) -> None:
    """ "Reload resources" rebuilds the collection from YAML, without the entry, after
    the event; a second reload can come before the first ends. While the watch
    lasts, every change gets the entry back. It stops when the integration goes."""
    while hass.loop.time() < data["watch_until"] and "unsub" in data:
        await asyncio.sleep(_STEP)
        if (now := _resources(hass)) is not seen:
            seen = now
            async with hass.data[_LOCK]:
                if "unsub" in data:
                    await _async_ensure_resource(hass)
    data.pop("watch", None)


@callback
def _watch(hass: HomeAssistant, data: dict) -> None:
    """Watch for half a minute from now, extending a watch in progress."""
    data["watch_until"] = max(data.get("watch_until", 0.0), hass.loop.time() + _WATCH)
    if "watch" not in data:
        data["watch"] = hass.async_create_background_task(
            _async_watch(hass, data, _resources(hass)),
            f"{DOMAIN}: Lovelace resource after a reload",
        )


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Modules, loader and resource: first thing in the setup, before anything that
    can fail. Callable again: the views register once per run, the rest comes back
    if the integration had been removed."""
    async with hass.data.setdefault(_LOCK, asyncio.Lock()):
        data = hass.data.get(_DATA)
        if data is None:
            try:
                modules = await hass.async_add_executor_job(_read_modules)
            except OSError:
                # An incomplete install: no panel and cards, the rest still runs.
                _LOGGER.exception("Frontend files unreadable: no panel and no cards")
                return
            data = hass.data[_DATA] = {"modules": modules}
            hass.http.register_view(_Loader(modules))
            hass.http.register_view(_Static(modules))
        if not data.get("index"):
            frontend.add_extra_js_url(hass, INDEX_LOADER)
            data["index"] = True
        await _async_ensure_resource(hass)
        if "unsub" not in data:

            @callback
            def _reloaded(_event: Event) -> None:
                _watch(hass, data)

            data["unsub"] = hass.bus.async_listen(
                EVENT_CALL_SERVICE, _reloaded, event_filter=_is_resource_reload
            )
            # A reload started before the listener would go unseen: with YAML
            # resources, watch right away.
            if isinstance(getattr(_resources(hass), "data", None), list):
                _watch(hass, data)


def show_in_sidebar(entry: ConfigEntry) -> bool:
    return bool(entry.options.get(OPTION_SHOW_IN_SIDEBAR, True))


def admin_only(entry: ConfigEntry) -> bool:
    return bool(entry.options.get(OPTION_ADMIN_ONLY, False))


async def async_register(hass: HomeAssistant, entry: ConfigEntry) -> None:
    if (data := hass.data.get(_DATA)) is None:
        return  # frontend files unreadable: already logged
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
                # From the websocket, always current like the resource.
                "module_url": _url(data["modules"], MODULE),
            }
        },
        require_admin=admin_only(entry),
        update=URL_PATH in hass.data.get("frontend_panels", {}),
    )


async def async_remove(hass: HomeAssistant) -> None:
    """The panel, the index's module, the resource and the listener go. The views
    stay until the restart: aiohttp does not remove them."""
    frontend.async_remove_panel(hass, URL_PATH, warn_if_unknown=False)
    data = hass.data.get(_DATA) or {}
    if data.pop("index", False):
        frontend.remove_extra_js_url(hass, INDEX_LOADER)
    if unsub := data.pop("unsub", None):
        unsub()
    resources = _resources(hass)
    try:
        if hasattr(resources, "async_create_item"):
            await resources.async_get_info()
            for item in list(resources.async_items()):
                if _is_loader(item.get("url")):
                    await resources.async_delete_item(item["id"])
        elif isinstance(getattr(resources, "data", None), list):
            resources.data[:] = [
                item
                for item in resources.data
                if not (isinstance(item, dict) and _is_loader(item.get("url")))
            ]
    except Exception:
        _LOGGER.exception("The cards' Lovelace resource could not be removed")
