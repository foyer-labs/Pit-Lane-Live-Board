// "Flags & stewards" (SPEC §7.1.1): what the track status and race control say
// about flags, the safety car, penalties, investigations and track limits, read
// from the backend's stewards summary. One line when all is calm.
import { css, html, nothing } from "lit";
import type { Translate } from "../i18n";
import type { Decision, Stewards } from "../types";

const SHOWN = 4; // per column; the rest behind "show all"

const TRACK_CLASS: Record<string, string> = {
  clear: "st-clear",
  yellow: "st-yellow",
  safety_car: "st-sc",
  virtual_safety_car: "st-sc",
  vsc_ending: "st-yellow",
  red_flag: "st-red",
  chequered: "st-chequered",
};

export function trackClass(status: string | null | undefined): string {
  return status ? (TRACK_CLASS[status] ?? "") : "";
}

function calm(s: Stewards, track: string | null | undefined): boolean {
  return (
    (!track || track === "clear" || track === "chequered") &&
    !s.yellow &&
    !s.red_flag &&
    !s.safety_car &&
    !s.virtual_safety_car &&
    !s.penalties.length &&
    !s.investigations.length &&
    !s.track_limits.length
  );
}

/** "+5s", "DT", "SG 10s", "3 grid", "DSQ". */
export function penaltyLabel(t: Translate, d: Decision): string {
  switch (d.kind) {
    case "time_penalty":
      return `+${d.seconds ?? "?"}s`;
    case "drive_through":
      return t("stewards.short.drive_through");
    case "stop_go":
      return d.seconds ? `${t("stewards.short.stop_go")} ${d.seconds}s` : t("stewards.short.stop_go");
    case "grid_penalty":
      return t("stewards.short.grid", { n: d.places ?? "?" });
    case "disqualified":
      return t("stewards.short.disqualified");
    default:
      return t(`stewards.kind.${d.kind}`);
  }
}

function cars(d: Decision): string {
  return d.cars.map((c) => c.tla).join(" · ");
}

function more<T>(items: T[], row: (item: T) => unknown, t: Translate) {
  if (items.length <= SHOWN) return items.map(row);
  return html`${items.slice(0, SHOWN).map(row)}
    <details><summary>${t("stewards.showAll", { n: items.length - SHOWN })}</summary>${items.slice(SHOWN).map(row)}</details>`;
}

function penalty(t: Translate, d: Decision) {
  return html`<li class=${d.served ? "served" : ""}>
    <span class="pen">${penaltyLabel(t, d)}</span>
    <span class="what"><b>${cars(d)}</b>${d.reason ? html` <span class="why">${d.reason}</span>` : nothing}</span>
    <span class="when">${d.served ? html`✓ ${t("stewards.served")}` : d.lap ? `${t("common.lap")} ${d.lap}` : ""}</span>
  </li>`;
}

function incident(t: Translate, d: Decision) {
  return html`<li>
    <span class="tag">${t(`stewards.kind.${d.status ?? d.kind}`)}</span>
    <span class="what"><b>${cars(d)}</b>${d.reason ? html` <span class="why">${d.reason}</span>` : nothing}</span>
    <span class="when">${d.turn ? t("stewards.turn", { n: d.turn }) : d.lap ? `${t("common.lap")} ${d.lap}` : ""}</span>
  </li>`;
}

function trackColumn(t: Translate, s: Stewards, track: string | null | undefined) {
  const phase = s.safety_car ?? s.virtual_safety_car;
  const which = s.safety_car ? "sc" : "vsc";
  return html`<div class="col">
    <h4>${t("stewards.track")}</h4>
    ${track ? html`<span class="status-pill ${trackClass(track)}">${t(`live.status.${track}`)}</span>` : html`<span class="muted">—</span>`}
    ${phase ? html`<div class="phase">${t(`stewards.${which}.${phase}`)}</div>` : nothing}
    ${s.yellow_sectors.length
      ? html`<div class="sectors">${s.yellow_sectors.map(
          (y) => html`<span class="sector-chip ${y.flag}" title=${t(`stewards.${y.flag}`)}
            >S${y.sector}${y.flag === "double_yellow" ? html`<small>×2</small>` : nothing}</span>`,
        )}</div>`
      : nothing}
  </div>`;
}

/** On a phone: one row of chips; a tap opens the columns. */
function compact(t: Translate, s: Stewards, track: string | null | undefined, open: boolean, toggle: () => void) {
  const unserved = s.penalties.filter((p) => !p.served).length;
  return html`<button class="compact" @click=${toggle} aria-expanded=${open ? "true" : "false"}>
    ${track ? html`<span class="status-pill ${trackClass(track)}">${t(`live.status.${track}`)}</span>` : nothing}
    ${s.yellow_sectors.map((y) => html`<span class="sector-chip ${y.flag}">S${y.sector}</span>`)}
    ${s.penalties.length ? html`<span class="count ${unserved ? "hot" : ""}">${t("stewards.penalties")} ${s.penalties.length}</span>` : nothing}
    ${s.investigations.length ? html`<span class="count">${t("stewards.investigations")} ${s.investigations.length}</span>` : nothing}
    ${s.track_limits.length ? html`<span class="count">${t("stewards.trackLimits")} ${s.track_limits.length}</span>` : nothing}
    <span class="chevron">${open ? "▴" : "▾"}</span>
  </button>`;
}

export function stewardsCard(
  t: Translate,
  s: Stewards | undefined,
  track: string | null | undefined,
  open = false,
  toggle: () => void = () => undefined,
) {
  if (!s) return nothing;
  if (calm(s, track)) {
    return html`<div class="card stewards calm">
      <span class="status-pill ${trackClass(track ?? "clear")}">${t(`live.status.${track ?? "clear"}`)}</span>
      <span class="muted">${t("stewards.calm")}</span>
    </div>`;
  }
  const accent = s.red_flag ? "accent-red" : s.safety_car || s.virtual_safety_car ? "accent-sc" : "";
  return html`<section class="card stewards ${accent} ${open ? "open" : ""}" aria-label=${t("stewards.title")}>
    <div class="card-head">${t("stewards.title")}</div>
    ${compact(t, s, track, open, toggle)}
    <div class="cols">
      ${trackColumn(t, s, track)}
      <div class="col">
        <h4>${t("stewards.penalties")} <small>${s.penalties.length || ""}</small></h4>
        ${s.penalties.length
          ? html`<ul>${more(s.penalties, (d) => penalty(t, d), t)}</ul>`
          : html`<span class="muted">${t("stewards.none")}</span>`}
      </div>
      <div class="col">
        <h4>${t("stewards.investigations")} <small>${s.investigations.length || ""}</small></h4>
        ${s.investigations.length
          ? html`<ul>${more(s.investigations, (d) => incident(t, d), t)}</ul>`
          : html`<span class="muted">${t("stewards.none")}</span>`}
      </div>
      <div class="col">
        <h4>${t("stewards.trackLimits")}</h4>
        ${s.track_limits.length
          ? html`<ul>${more(
              s.track_limits,
              (e) => html`<li><b>${e.tla}</b><span class="what">${t("stewards.deleted", { n: e.deleted })}</span>
                ${e.black_and_white ? html`<span class="bw" title=${t("stewards.kind.black_and_white_flag")}>⚑</span>` : nothing}</li>`,
              t,
            )}</ul>`
          : html`<span class="muted">${t("stewards.none")}</span>`}
      </div>
    </div>
  </section>`;
}

export const stewardsStyles = css`
  .stewards { margin-bottom: var(--plb-gap); }
  .stewards.calm { display: flex; align-items: center; gap: 12px; padding: 10px 16px; font-size: 13px; }
  .stewards.accent-sc { box-shadow: inset 4px 0 #f2c200, var(--ha-card-box-shadow, 0 1px 2px rgba(0, 0, 0, 0.08)); }
  .stewards.accent-red { box-shadow: inset 4px 0 var(--error-color, #db4437), var(--ha-card-box-shadow, 0 1px 2px rgba(0, 0, 0, 0.08)); }
  .stewards .cols { display: grid; grid-template-columns: minmax(160px, 0.7fr) 1.2fr 1.2fr 0.8fr; }
  .stewards .col { padding: 12px 16px; display: grid; gap: 8px; align-content: start; min-width: 0; }
  .stewards .col + .col { border-left: 1px solid var(--divider-color); }
  .stewards h4 { margin: 0; font-size: 11px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--secondary-text-color); }
  .stewards ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .stewards li { display: flex; align-items: baseline; gap: 8px; font-size: 13px; min-width: 0; }
  .stewards li.served { color: var(--plb-muted); }
  .stewards .what { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .stewards .why { color: var(--secondary-text-color); font-size: 12px; }
  .stewards .when { color: var(--secondary-text-color); font-size: 11px; white-space: nowrap; }
  .stewards .pen { flex: none; min-width: 36px; text-align: center; padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 700;
    background: var(--error-color, #db4437); color: #fff; font-variant-numeric: tabular-nums; }
  .stewards li.served .pen { background: var(--secondary-background-color); color: var(--plb-muted); }
  .stewards .tag { flex: none; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 0.03em;
    background: color-mix(in srgb, var(--warning-color, #ffa600) 20%, transparent); }
  .stewards .col > .status-pill { justify-self: start; }
  .stewards .compact { display: none; width: 100%; flex-wrap: wrap; align-items: center; gap: 6px; padding: 10px 12px; border: 0;
    background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
  .stewards .compact .status-pill { padding: 4px 10px; font-size: 12px; }
  .stewards .count { padding: 3px 8px; border-radius: 10px; font-size: 12px; background: var(--secondary-background-color); }
  .stewards .count.hot { background: var(--error-color, #db4437); color: #fff; }
  .stewards .chevron { margin-left: auto; color: var(--secondary-text-color); }
  .stewards .phase { font-size: 12px; color: var(--secondary-text-color); }
  .stewards .sectors { display: flex; flex-wrap: wrap; gap: 6px; }
  .sector-chip { display: inline-flex; align-items: baseline; gap: 2px; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 700;
    background: #f2c200; color: #1a1a1a; }
  .sector-chip.double_yellow { outline: 2px solid #f2c200; outline-offset: 1px; }
  .sector-chip small { font-size: 10px; }
  .stewards .bw { font-size: 14px; }
  .stewards details summary { cursor: pointer; font-size: 12px; color: var(--primary-color); list-style: none; }
  .stewards details[open] summary { display: none; }
  .stewards details { display: grid; gap: 6px; }
  @media (max-width: 1100px) {
    .stewards .cols { grid-template-columns: 1fr 1fr; }
    .stewards .col:nth-child(3) { border-left: 0; }
    .stewards .col:nth-child(n + 3) { border-top: 1px solid var(--divider-color); }
  }
  @media (max-width: 640px) {
    .stewards .card-head { display: none; }
    .stewards .compact { display: flex; }
    .stewards .cols { grid-template-columns: 1fr; display: none; border-top: 1px solid var(--divider-color); }
    .stewards.open .cols { display: grid; }
    .stewards .col + .col { border-left: 0; border-top: 1px solid var(--divider-color); }
    .stewards.calm { flex-wrap: wrap; }
  }
`;
