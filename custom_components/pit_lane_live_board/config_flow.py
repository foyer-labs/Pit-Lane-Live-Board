"""Config and options flows (SPEC §10.1).

Setup has one step and no fields: its description carries the non-affiliation
notice and the data attribution (INV-6). The options hold "show in sidebar" and the
optional F1TV token, pasted by an administrator (decision 2). The token field is
never pre-filled and the token is never shown back (INV-3).
"""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import callback
from homeassistant.helpers.selector import (
    BooleanSelector,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)
from homeassistant.util import dt as dt_util
import voluptuous as vol

from .const import DATA_F1TV_TOKEN, DOMAIN, NAME, OPTION_SHOW_IN_SIDEBAR
from .core.f1tv_token import acceptable, evaluate, extract_token

FIELD_TOKEN = "f1tv_token"
FIELD_REMOVE = "remove_f1tv_token"
F1TV_SITE = "https://f1tv.formula1.com"


class LiveBoardConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(title=NAME, data={})
        return self.async_show_form(step_id="user", data_schema=vol.Schema({}))

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return LiveBoardOptionsFlow()


class LiveBoardOptionsFlow(OptionsFlow):
    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        entry = self.config_entry
        has_token = bool(entry.data.get(DATA_F1TV_TOKEN))
        errors: dict[str, str] = {}
        if user_input is not None:
            data = dict(entry.data)
            pasted = (user_input.get(FIELD_TOKEN) or "").strip()
            if pasted:
                token = extract_token(pasted)
                now = dt_util.utcnow()
                error = (
                    acceptable(evaluate(token, now), now) if token else "token_invalid"
                )
                if error:
                    errors[FIELD_TOKEN] = error
                else:
                    data[DATA_F1TV_TOKEN] = token
            elif user_input.get(FIELD_REMOVE):
                data.pop(DATA_F1TV_TOKEN, None)
            if not errors:
                changed = data.get(DATA_F1TV_TOKEN) != entry.data.get(DATA_F1TV_TOKEN)
                if changed:
                    self.hass.config_entries.async_update_entry(entry, data=data)
                    hub = getattr(entry, "runtime_data", None)
                    if hub is not None:
                        await hub.hub.async_token_changed()
                return self.async_create_entry(
                    data={OPTION_SHOW_IN_SIDEBAR: user_input[OPTION_SHOW_IN_SIDEBAR]}
                )

        fields: dict[Any, Any] = {
            vol.Required(
                OPTION_SHOW_IN_SIDEBAR,
                default=entry.options.get(OPTION_SHOW_IN_SIDEBAR, True),
            ): BooleanSelector(),
            vol.Optional(FIELD_TOKEN): TextSelector(
                TextSelectorConfig(type=TextSelectorType.PASSWORD, multiline=False)
            ),
        }
        if has_token:
            fields[vol.Optional(FIELD_REMOVE, default=False)] = BooleanSelector()
        status = evaluate(entry.data.get(DATA_F1TV_TOKEN), dt_util.utcnow())
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(fields),
            errors=errors,
            description_placeholders={
                "site": F1TV_SITE,
                "status": status.status,
                "expires": status.expires.strftime("%Y-%m-%d %H:%M UTC")
                if status.expires
                else "—",
            },
        )
