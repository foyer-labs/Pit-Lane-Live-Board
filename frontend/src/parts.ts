// Small pieces shared by the pages.
import { html, nothing } from "lit";
import { COMPOUND_VAR } from "./styles";
import { teamColour } from "./teams";
import type { Translate } from "./i18n";
import { otherTime } from "./format";
import type { Hass, Settings } from "./types";

/** Only no-spoiler mode and the reveals change what a page receives; the TV
 *  delay does not, so a page reloads only when this key changes. */
export function spoilerKey(settings: Settings | undefined): string {
  return settings ? `${settings.no_spoiler}|${settings.revealed.join(",")}` : "";
}

/** Keyboard support for things that are clicked: Enter and Space act. */
export function onKey(action: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  };
}

export function tyre(
  t: Translate,
  compound: string,
  isNew: boolean | null,
  age: number | null,
) {
  const letter = compound === "unknown" ? "?" : compound[0].toUpperCase();
  return html`<span class="tyre" title=${t(`tyres.${compound}`)}>
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

/** "· 15:00 at the track" (or "· 21:00 your time"), when the user wants both. */
export function alsoTime(t: Translate, hass: Hass, iso: string | null, trackZone: string | null | undefined) {
  const other = otherTime(hass, iso, trackZone);
  if (!other) return nothing;
  return html`<small class="also">${t(other.local ? "time.atTrack" : "time.yours", { time: other.time })}</small>`;
}

/** The mini-sectors of one sector as a thin strip of F1's colours. */
export function segmentStrip(segments: string[] | undefined) {
  if (!segments?.length || segments.every((s) => !s)) return nothing;
  return html`<span class="seg" aria-hidden="true">${segments.map((s) => html`<i class=${s}></i>`)}</span>`;
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
