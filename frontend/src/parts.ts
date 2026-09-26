// Small pieces shared by the pages.
import { html, nothing } from "lit";
import { COMPOUND_VAR } from "./styles";
import { teamColour } from "./teams";
import type { Translate } from "./i18n";

export function tyre(
  t: Translate,
  compound: string,
  isNew: boolean | null,
  age: number | null,
) {
  const letter = compound === "unknown" ? "?" : compound[0].toUpperCase();
  return html`<span class="tyre" title=${compound}>
    <span class="tyre-dot" style="--c:var(${COMPOUND_VAR[compound] ?? COMPOUND_VAR.unknown})">${letter}</span>
    ${age === null ? nothing : html`<small class="num">${age}</small>`}
    ${isNew === false ? html`<span class="used">${t("live.used")}</span>` : nothing}
  </span>`;
}

/** Places gained (▲) or lost (▼); `showZero` draws a dash for "no change". */
export function gained(value: number | null | undefined, showZero = true) {
  if (value === null || value === undefined) return nothing;
  if (value > 0) return html`<span class="gained up">▲${value}</span>`;
  if (value < 0) return html`<span class="gained down">▼${-value}</span>`;
  return showZero ? html`<span class="gained muted">–</span>` : nothing;
}

export function person(
  name: string | null | undefined,
  teamId: string | null | undefined,
  colour?: string | null,
) {
  return html`<span class="drv"
    ><span class="bar" style="background:${teamColour(teamId, colour)}"></span>${name ?? "—"}</span
  >`;
}

export function loading(t: Translate) {
  return html`<div class="card loading">${t("common.loading")}</div>`;
}

export function failure(t: Translate, retry: () => void) {
  return html`<div class="card error">
    <div>${t("common.unavailable")}</div>
    <button class="btn flat" @click=${retry}>${t("common.retry")}</button>
  </div>`;
}
