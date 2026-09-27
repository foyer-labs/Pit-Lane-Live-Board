// A circuit's history (decision 58): the season's drivers at one circuit, sorted by
// the affinity index, and each driver's years there on a click. Opened from a
// Calendar meeting or a Results round; not a tab.
import { LitElement, css, html, nothing } from "lit";
import { api } from "../api";
import { fixed, number } from "../format";
import { translator, type Translate } from "../i18n";
import { ICON, icon } from "../icons";
import { failure, loading, onKey, spoilerKey } from "../parts";
import { tokens } from "../styles";
import { teamColour } from "../teams";
import type { CircuitDriver, CircuitDriverHistory, CircuitHistory, CircuitPenalty, CircuitYear, Hass, Settings } from "../types";
import { statusText } from "./results";
import { penaltyLabel } from "./stewards";

/** Half a place either side of 50 reads as "as the car": neither green nor red. */
const NEUTRAL = 2.5;

/** Decisions that cost the driver something: red. Warnings and the rest: grey. */
const PENALTY_KINDS = new Set(["time_penalty", "drive_through", "stop_go", "grid_penalty", "disqualified"]);

type Years = CircuitDriverHistory | "loading" | "failed";

function tone(index: number): "up" | "down" | "even" {
  if (index >= 50 + NEUTRAL) return "up";
  if (index <= 50 - NEUTRAL) return "down";
  return "even";
}

/** "Causing a collision": the stewards write in capitals. */
function sentence(text: string | null | undefined): string {
  if (!text) return "";
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export class PlbCircuit extends LitElement {
  static override properties = {
    hass: { attribute: false },
    settings: { attribute: false },
    circuitId: { attribute: false },
    circuitName: { attribute: false },
    data: { state: true },
    failed: { state: true },
    open: { state: true },
    years: { state: true },
  };

  hass!: Hass;
  settings!: Settings;
  circuitId = "";
  /** The name the link knew, shown until the history arrives. */
  circuitName = "";
  data?: CircuitHistory;
  failed = false;
  /** The driver whose years are open. */
  open = "";
  years = new Map<string, Years>();
  private request = 0;
  private spoilers = "";
  // Kept per circuit while the page lives: back and forth between the calendar
  // and a circuit does not ask again. No-spoiler mode forgets it all.
  private readonly histories = new Map<string, CircuitHistory>();

  protected override willUpdate(changed: Map<string, unknown>): void {
    const spoilers = spoilerKey(this.settings);
    const spoilersChanged = spoilers !== this.spoilers;
    this.spoilers = spoilers;
    if (spoilersChanged) {
      this.histories.clear();
      this.years = new Map();
    }
    if (changed.has("circuitId") || spoilersChanged) {
      if (changed.has("circuitId")) {
        this.open = "";
        this.years = new Map();
      }
      void this.load();
    }
  }

  private async load(): Promise<void> {
    if (!this.hass || !this.circuitId) return;
    const request = ++this.request;
    const circuit = this.circuitId;
    this.failed = false;
    const kept = this.histories.get(circuit);
    if (kept) {
      this.data = kept;
      return;
    }
    if (this.data?.circuit_id !== circuit) this.data = undefined;
    try {
      const data = await api.circuitHistory(this.hass, circuit);
      this.histories.set(circuit, data);
      if (request === this.request) this.data = data;
    } catch {
      if (request === this.request) this.failed = true;
    }
  }

  private toggle(driver: CircuitDriver): void {
    this.open = this.open === driver.driver_id ? "" : driver.driver_id;
    const known = this.years.get(driver.driver_id);
    if (this.open && (!known || known === "failed")) void this.loadYears(driver.driver_id);
  }

  private async loadYears(driverId: string): Promise<void> {
    const circuit = this.circuitId;
    this.years = new Map(this.years).set(driverId, "loading");
    try {
      const years = await api.circuitDriver(this.hass, circuit, driverId);
      if (circuit === this.circuitId) this.years = new Map(this.years).set(driverId, years);
    } catch {
      if (circuit === this.circuitId) this.years = new Map(this.years).set(driverId, "failed");
    }
  }

  private back(): void {
    this.dispatchEvent(new CustomEvent("plb-back", { bubbles: true, composed: true }));
  }

  protected override render() {
    const t = translator(this.hass);
    const d = this.data?.circuit_id === this.circuitId ? this.data : undefined;
    return html`
      <div class="toolbar">
        <button class="link back" @click=${this.back}>${icon(ICON.back, 18)} ${t("circuit.back")}</button>
        <h1>${d?.circuit ?? this.circuitName ?? t("circuit.title")}</h1>
      </div>
      ${this.failed
        ? failure(t, () => this.load())
        : !d
          ? loading(t)
          : html`${this.intro(t, d)}${d.drivers.length
              ? this.table(t, d.drivers)
              : html`<div class="card state">${t("circuit.empty")}</div>`}`}
    `;
  }

  private intro(t: Translate, d: CircuitHistory) {
    const first = d.first_season;
    const last = d.last_season;
    const seasons =
      first && last
        ? first === last
          ? t("circuit.seasonOne", { n: first })
          : t("circuit.seasons", { first, last })
        : "";
    const where = [d.locality, d.country, seasons].filter(Boolean).join(" · ");
    return html`<div class="card intro">
      <div class="kicker">${t("circuit.title")}</div>
      ${where ? html`<div class="where">${where}</div>` : nothing}
      <p class="explain">${this.scale()}<span>${t("circuit.explain")}</span></p>
      <details>
        <summary>${t("circuit.how")}</summary>
        <p>${t("circuit.howText")}</p>
      </details>
    </div>`;
  }

  /** A tiny key to the bars: red below, grey near, green above 50. */
  private scale() {
    return html`<span class="scale" aria-hidden="true"><i class="down"></i><i class="even"></i><i class="up"></i></span>`;
  }

  private table(t: Translate, drivers: CircuitDriver[]) {
    // The backend sorts; sorted again so a missing index never lands on top.
    const sorted = [...drivers].sort((a, b) => (b.index ?? -1) - (a.index ?? -1));
    let rank = 0;
    return html`<div class="card"><div class="scroll"><table class="tbl drivers">
      <thead><tr>
        <th class="pos">${t("common.pos")}</th><th>${t("common.driver")}</th><th>${t("circuit.index")}</th>
        <th class="r" title=${t("circuit.racesHelp")}>${t("circuit.races")}</th>
        <th class="r col-stat">${t("circuit.wins")}</th><th class="r col-stat">${t("circuit.podiums")}</th>
        <th class="r col-stat">${t("circuit.poles")}</th><th class="r col-stat">${t("circuit.best")}</th>
        <th class="r col-avg">${t("circuit.avgFinish")}</th><th class="r col-avg">${t("circuit.avgQuali")}</th>
        <th class="chev"></th>
      </tr></thead>
      ${sorted.map((driver, i) => {
        const ranked = driver.index !== null;
        if (ranked) rank++;
        return html`<tbody>${this.row(t, driver, ranked ? rank : null, i)}</tbody>`;
      })}
    </table></div></div>`;
  }

  private row(t: Translate, d: CircuitDriver, rank: number | null, i: number) {
    const never = d.races === 0;
    const open = this.open === d.driver_id;
    const name = d.name ?? d.code ?? d.driver_id;
    const driver = html`<div class="drv"><span class="bar" style="background:${teamColour(d.team_id)}"></span>
      <span class="tla">${d.code ?? name.slice(0, 3).toUpperCase()}</span><span class="name">${name}</span></div>`;
    if (never) {
      return html`<tr class="never ${i % 2 ? "" : "alt"}">
        <td class="pos num"></td><td>${driver}</td>
        <td colspan="9" class="muted"><i>${t("circuit.never")}</i></td>
      </tr>`;
    }
    const pick = () => this.toggle(d);
    return html`<tr class="click ${open ? "sel" : ""} ${i % 2 ? "" : "alt"}" tabindex="0" aria-expanded=${open ? "true" : "false"}
        aria-label=${t("circuit.open", { driver: name })} @click=${pick} @keydown=${onKey(pick)}>
      <td class="pos num">${rank ?? "—"}</td>
      <td>${driver}</td>
      <td>${this.index(t, d.index)}</td>
      <td class="r num" title=${t("circuit.racesHelp")}>${d.counted !== d.races ? html`${d.counted}<small class="muted">/${d.races}</small>` : d.races}</td>
      <td class="r num col-stat">${d.wins || html`<span class="muted">0</span>`}</td>
      <td class="r num col-stat">${d.podiums || html`<span class="muted">0</span>`}</td>
      <td class="r num col-stat">${d.poles || html`<span class="muted">0</span>`}</td>
      <td class="r num col-stat">${d.best_finish !== null ? `P${d.best_finish}` : "—"}</td>
      <td class="r num col-avg">${fixed(this.hass, d.avg_finish, 1)}</td>
      <td class="r num col-avg">${fixed(this.hass, d.avg_quali, 1)}</td>
      <td class="chev" aria-hidden="true">${open ? "▾" : "▸"}</td>
    </tr>
    ${open ? this.details(t, d) : nothing}`;
  }

  /** The index as a number and a bar from the middle: green above 50, red below. */
  private index(t: Translate, value: number | null) {
    if (value === null) return html`<span class="muted small">${t("circuit.noIndex")}</span>`;
    const v = Math.max(0, Math.min(100, value));
    const left = Math.min(v, 50);
    const width = Math.abs(v - 50);
    return html`<div class="index ${tone(v)}">
      <b class="num">${fixed(this.hass, value, 1)}</b>
      <span class="track" aria-hidden="true"><i style="left:${left}%;width:${width}%"></i><span class="mid"></span></span>
    </div>`;
  }

  private details(t: Translate, d: CircuitDriver) {
    const years = this.years.get(d.driver_id);
    const stat = (value: number | null) => fixed(this.hass, value, 1);
    return html`<tr class="details"><td colspan="11"><div class="dwrap">
      <div class="dhead"><b>${d.name ?? d.code}</b>${d.team ? html` · <span class="muted">${d.team}</span>` : nothing}</div>
      <div class="facts narrow">
        <span>${t("circuit.wins")} <b class="num">${d.wins}</b></span>
        <span>${t("circuit.podiums")} <b class="num">${d.podiums}</b></span>
        <span>${t("circuit.poles")} <b class="num">${d.poles}</b></span>
        <span>${t("circuit.best")} <b class="num">${d.best_finish !== null ? `P${d.best_finish}` : "—"}</b></span>
        <span>${t("circuit.avgFinish")} <b class="num">${stat(d.avg_finish)}</b></span>
        <span>${t("circuit.avgQuali")} <b class="num">${stat(d.avg_quali)}</b></span>
      </div>
      ${!years || years === "loading"
        ? html`<div class="muted pad">${t("common.loading")}</div>`
        : years === "failed"
          ? failure(t, () => this.loadYears(d.driver_id))
          : years.years.length
            ? this.yearsTable(t, years.years)
            : html`<div class="muted pad">${t("circuit.noYears")}</div>`}
    </div></td></tr>`;
  }

  private yearsTable(t: Translate, years: CircuitYear[]) {
    return html`<div class="scroll years-wrap"><table class="years">
        <thead><tr>
          <th>${t("circuit.season")}</th><th class="col-team">${t("common.team")}</th>
          <th class="r">${t("circuit.quali")}</th><th class="r">${t("circuit.grid")}</th><th class="r">${t("circuit.finish")}</th>
          <th class="r">${t("common.points")}</th><th title=${t("circuit.expectedHelp")}>${t("circuit.expected")}</th>
          <th>${t("circuit.outcome")}</th><th>${t("circuit.fastest")}</th><th>${t("circuit.penalties")}</th>
        </tr></thead>
        <tbody>${years.map((y) => this.year(t, y))}</tbody>
      </table></div>
      <div class="cards">${years.map((y) => this.yearCard(t, y))}</div>
      <p class="legend">${t("circuit.legend")}</p>`;
  }

  private finishText(y: CircuitYear): string {
    return y.position_text && !/^\d+$/.test(y.position_text) ? y.position_text : y.finish !== null ? `P${y.finish}` : "—";
  }

  private gridCell(t: Translate, y: CircuitYear) {
    return html`${y.grid !== null && y.grid !== undefined ? (y.grid === 0 ? t("circuit.pitLane") : y.grid) : "—"}${y.grid_penalty
      ? html`<span class="gpen" title=${t("circuit.gridPenalty")} aria-label=${t("circuit.gridPenalty")}>▼</span>`
      : nothing}`;
  }

  /** On a phone a year is a small block, not a row ten columns wide. */
  private yearCard(t: Translate, y: CircuitYear) {
    return html`<div class="ycard ${y.counted ? "" : "uncounted"}">
      <div class="yline"><span class="bar" style="background:${teamColour(y.team_id)}"></span>
        <b class="num">${y.season}</b><span class="muted">${y.team ?? ""}</span>
        <span class="spacer"></span><b class="num fin">${this.finishText(y)}</b>
        <span class="num muted">${y.points ? number(this.hass, y.points, 1) : 0} ${t("common.points")}</span></div>
      <div class="yline facts">
        <span>${t("circuit.quali")} <b class="num">${y.quali !== null ? `P${y.quali}` : "—"}</b></span>
        <span>${t("circuit.grid")} <b class="num">${this.gridCell(t, y)}</b></span>
        <span>${t("circuit.expected")} ${this.versus(t, y)}</span>
      </div>
      <div class="yline facts">
        <span>${this.outcome(t, y)}</span>
        ${y.fastest_lap
          ? html`<span>${t("circuit.fastest")} <span class="t ${y.fastest_lap_rank === 1 ? "ob" : ""}">${y.fastest_lap}</span>${y.fastest_lap_rank
              ? html` <small class="muted">${t("circuit.fastestRank", { n: y.fastest_lap_rank })}</small>`
              : nothing}</span>`
          : nothing}
      </div>
      <div class="yline facts pens"><span>${t("circuit.penalties")}</span><div>${this.penalties(t, y.penalties)}</div></div>
    </div>`;
  }

  private year(t: Translate, y: CircuitYear) {
    const finishText = this.finishText(y);
    const weight = y.weight !== null && y.weight !== undefined ? t("circuit.weight", { n: number(this.hass, y.weight, 2) }) : "";
    return html`<tr class=${y.counted ? "" : "uncounted"}>
      <td title=${weight}><div class="drv"><span class="bar" style="background:${teamColour(y.team_id)}"></span><span class="num">${y.season}</span></div></td>
      <td class="col-team muted">${y.team ?? ""}</td>
      <td class="r num">${y.quali !== null ? `P${y.quali}` : "—"}</td>
      <td class="r num">${this.gridCell(t, y)}</td>
      <td class="r num"><b>${finishText}</b></td>
      <td class="r num">${y.points ? number(this.hass, y.points, 1) : html`<span class="muted">0</span>`}</td>
      <td class="vs">${this.versus(t, y)}</td>
      <td class="wrap">${this.outcome(t, y)}</td>
      <td>${y.fastest_lap
        ? html`<span class="t ${y.fastest_lap_rank === 1 ? "ob" : ""}">${y.fastest_lap}</span>${y.fastest_lap_rank
            ? html` <small class="muted">${t("circuit.fastestRank", { n: y.fastest_lap_rank })}</small>`
            : nothing}`
        : "—"}</td>
      <td class="wrap pens">${this.penalties(t, y.penalties)}</td>
    </tr>`;
  }

  /** "P3.5 ▲1.5" and "Q ▲2.5": the car's expected place and what was made of it. */
  private versus(t: Translate, y: CircuitYear) {
    if (y.expected === null || y.expected === undefined) return html`<span class="muted">—</span>`;
    const delta = (value: number | null) => {
      if (value === null || value === undefined) return nothing;
      const text = fixed(this.hass, Math.abs(value), 1);
      if (value > 0) return html`<span class="gained up">▲${text}</span>`;
      if (value < 0) return html`<span class="gained down">▼${text}</span>`;
      return html`<span class="gained muted">=</span>`;
    };
    return html`<span class="muted num">P${fixed(this.hass, y.expected, 1)}</span>
      <span class="${y.counted ? "" : "faded"}">${delta(y.delta_race)}</span>${y.delta_quali !== null && y.delta_quali !== undefined
        ? html` <small class="q ${y.counted ? "" : "faded"}">${t("circuit.q")} ${delta(y.delta_quali)}</small>`
        : nothing}`;
  }

  private outcome(t: Translate, y: CircuitYear) {
    const status = statusText(t, y.status);
    if (y.dnf) {
      return html`<span class="badge ${y.dnf === "driver" ? "ret" : "mech"}">${t(y.dnf === "driver" ? "circuit.dnfDriver" : "circuit.dnfMechanical")}</span>
        ${status ? html`<small class="muted">${status}</small>` : nothing}
        ${y.counted ? nothing : html`<span class="pill nc">${t("circuit.notCounted")}</span>`}`;
    }
    return html`${status || "—"}${y.counted ? nothing : html` <span class="pill nc">${t("circuit.notCounted")}</span>`}`;
  }

  private penalties(t: Translate, list: CircuitPenalty[] | null) {
    if (list === null || list === undefined) {
      return html`<span class="muted" title=${t("circuit.penaltiesUnknown")} aria-label=${t("circuit.penaltiesUnknown")}>—</span>`;
    }
    if (!list.length) return html`<span class="muted">${t("circuit.penaltiesNone")}</span>`;
    return list.map(
      (p) => html`<div class="pen"><span class="badge ${PENALTY_KINDS.has(p.kind) ? "pen" : ""}">${penaltyLabel(t, p)}</span>
        ${p.reason ? html`<span>${sentence(p.reason)}</span>` : nothing}
        ${p.lap ? html`<small class="muted">${t("circuit.onLap", { n: p.lap })}</small>` : nothing}</div>`,
    );
  }

  static override styles = [
    tokens,
    css`
      :host { display: block; container-type: inline-size; }
      .back { display: inline-flex; align-items: center; gap: 4px; min-height: 40px; }
      .intro { padding: 14px 16px 4px; margin-bottom: var(--plb-gap); }
      .kicker { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--secondary-text-color); }
      .where { margin-top: 4px; font-size: 14px; }
      .explain { display: flex; align-items: center; gap: 10px; margin: 10px 0 4px; font-size: 13px; line-height: 1.5; }
      .scale { display: inline-flex; flex: none; width: 42px; height: 8px; border-radius: 4px; overflow: hidden; }
      .scale i { flex: 1; }
      .scale .down, .index.down .track i { background: var(--error-color, #db4437); }
      .scale .even, .index.even .track i { background: var(--plb-unknown); }
      .scale .up, .index.up .track i { background: var(--plb-green); }
      details { font-size: 13px; }
      summary { cursor: pointer; color: var(--plb-primary-text); min-height: 40px; display: flex; align-items: center; width: fit-content; }
      details p { margin: 0 0 12px; line-height: 1.55; color: var(--secondary-text-color); max-width: 900px; }
      /* The drivers' own rows, not the years table nested in an open one. */
      .drivers > tbody > tr > td { height: 44px; padding-top: 0; padding-bottom: 0; }
      .drivers > tbody > tr.alt > td { background: var(--plb-row-alt); }
      .drivers > tbody > tr.sel > td { background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
      .drivers > tbody > tr:focus-visible > td { outline: 2px solid var(--primary-color); outline-offset: -2px; }
      .drivers > tbody > tr.never > td { color: var(--plb-muted); }
      .drivers tr.never .bar { opacity: 0.4; }
      .pos { width: 34px; text-align: center; font-weight: 600; }
      .drv .name { color: var(--secondary-text-color); font-size: 13px; }
      .tla { min-width: 34px; }
      .index { display: flex; align-items: center; gap: 10px; }
      .index b { width: 36px; text-align: right; font-weight: 600; font-size: 15px; }
      .index.up b { color: var(--plb-green-text); }
      .index.down b { color: var(--error-color, #db4437); }
      .track { position: relative; width: 140px; height: 10px; border-radius: 5px; flex: none;
        background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
      .track i { position: absolute; top: 0; bottom: 0; border-radius: 5px; min-width: 2px; }
      .track .mid { position: absolute; left: calc(50% - 1px); top: -3px; bottom: -3px; width: 2px;
        background: var(--secondary-text-color); border-radius: 1px; }
      .small { font-size: 12px; }
      .chev { width: 20px; color: var(--secondary-text-color); text-align: center; }
      .drivers > tbody > tr.details > td { height: auto; padding: 10px 12px 14px; white-space: normal; cursor: default;
        background: color-mix(in srgb, var(--primary-text-color) 4%, transparent); }
      .dwrap { display: grid; gap: 8px; min-width: 0; }
      .dhead { font-size: 14px; }
      .facts { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 13px; color: var(--secondary-text-color); }
      .facts b { color: var(--primary-text-color); font-weight: 500; }
      .narrow { display: none; }
      .pad { padding: 8px 0; }
      .years-wrap { max-width: 100%; }
      .years { border-collapse: collapse; font-size: 13px; width: 100%; }
      .years th { font-size: 10px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--secondary-text-color);
        text-align: left; padding: 4px 14px 4px 0; white-space: nowrap; }
      .years td { padding: 6px 14px 6px 0; border: 0; border-top: 1px solid var(--divider-color); white-space: nowrap; vertical-align: middle; }
      .years th { border: 0; }
      .years .r { text-align: right; }
      .years td.wrap { white-space: normal; min-width: 120px; }
      .years td.pens { min-width: 180px; }
      .years tr.uncounted td { color: var(--plb-muted); }
      .years .bar { height: 16px; }
      .gpen { color: var(--error-color, #db4437); font-size: 10px; margin-left: 3px; cursor: help; }
      .vs { white-space: nowrap; }
      .vs .q { color: var(--secondary-text-color); font-size: 11px; }
      .faded { opacity: 0.5; }
      .gained { font-size: 12px; }
      .badge.mech { background: var(--secondary-background-color); color: var(--primary-text-color); }
      .badge.pen { background: var(--error-color, #db4437); color: #fff; margin-right: 4px; }
      .pill.nc { font-size: 10px; font-weight: 600; letter-spacing: 0.02em; margin-left: 4px; white-space: nowrap; }
      .pen { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 6px; }
      .pen + .pen { margin-top: 4px; }
      .legend { margin: 2px 0 0; font-size: 11px; color: var(--secondary-text-color); line-height: 1.5; }
      .error { padding: 8px 0; }
      @container (max-width: 1100px) { .col-avg { display: none; } }
      @container (max-width: 900px) {
        .drv .name { display: none; }
        .col-team { display: none; }
      }
      .cards { display: none; }
      .ycard { display: grid; gap: 4px; padding: 8px 0; border-top: 1px solid var(--divider-color); font-size: 13px; }
      .ycard.uncounted { color: var(--plb-muted); }
      .yline { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 10px; }
      .yline .bar { height: 16px; }
      .yline .fin { font-size: 15px; }
      .ycard .facts { color: var(--secondary-text-color); gap: 4px 14px; }
      .ycard .facts b { color: var(--primary-text-color); font-weight: 500; }
      .ycard .pens { align-items: flex-start; flex-wrap: nowrap; }
      .ycard .pens > div { min-width: 0; color: var(--primary-text-color); }
      @container (max-width: 640px) {
        .years-wrap { display: none; }
        .cards { display: block; }
        .col-stat { display: none; }
        .narrow { display: flex; }
        .track { width: 72px; }
        .index { gap: 8px; }
        .index b { width: 30px; font-size: 14px; }
        .pos { width: 24px; }
        .intro { padding: 12px 14px 2px; }
      }
      @media (pointer: coarse) {
        .drivers > tbody > tr > td { height: 48px; }
      }
    `,
  ];
}
