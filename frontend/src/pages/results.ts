// Results (SPEC §7.3): every season since 1950; a round opens tabs that exist only
// when the data does. No-spoiler mode withholds a tab until the user reveals it.
import { LitElement, css, html, nothing, svg } from "lit";
import { api } from "../api";
import { clockTime, longDate, number } from "../format";
import { translator, type Translate } from "../i18n";
import { ICON, icon } from "../icons";
import { failure, gained, loading, onKey, person, spoilerKey, tyre } from "../parts";
import { tokens } from "../styles";
import { teamColour } from "../teams";
import type { Classified, Hass, Message, Round, Settings, TabResult } from "../types";

const ARCHIVE_TABS = new Set(["strategy", "lap_times", "race_control", "weather"]);

export class PlbResults extends LitElement {
  static override properties = {
    hass: { attribute: false },
    settings: { attribute: false },
    seasons: { attribute: false },
    season: { state: true },
    rounds: { state: true },
    failed: { state: true },
    selected: { state: true },
    tab: { state: true },
    result: { state: true },
    tabFailed: { state: true },
    driver: { state: true },
    filter: { state: true },
    highlight: { state: true },
    target: { attribute: false },
  };

  hass!: Hass;
  settings!: Settings;
  seasons: number[] = [];
  season?: number;
  rounds?: Round[];
  failed = false;
  selected?: Round;
  tab = "race";
  result?: TabResult;
  tabFailed = false;
  driver = "";
  filter = "all";
  highlight = "";
  target?: { page: string; season?: number; round?: number };
  private request = 0;
  private roundsRequest = 0;
  private spoilers = "";
  private wanted?: number;

  protected override willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("target") && this.target?.page === "results" && this.target.season) {
      // Opened from the calendar: that season, and that round once it is loaded.
      this.selected = undefined;
      this.rounds = undefined;
      this.season = this.target.season;
      this.wanted = this.target.round;
    }
    if (this.season === undefined && this.settings) this.season = this.settings.season;
    const spoilers = spoilerKey(this.settings);
    const spoilersChanged = spoilers !== this.spoilers;
    this.spoilers = spoilers;
    if (changed.has("season") || spoilersChanged) void this.loadRounds();
    if (this.selected && (spoilersChanged || changed.has("tab") || changed.has("selected"))) {
      void this.loadTab();
    }
  }

  private async loadRounds(): Promise<void> {
    if (!this.hass || this.season === undefined) return;
    const request = ++this.roundsRequest;
    this.failed = false;
    try {
      const data = await api.rounds(this.hass, this.season);
      if (request !== this.roundsRequest) return;
      this.rounds = data.rounds;
      const wanted = this.wanted !== undefined ? data.rounds.find((r) => r.round === this.wanted) : undefined;
      this.wanted = undefined;
      if (wanted) this.open(wanted);
    } catch {
      if (request === this.roundsRequest) this.failed = true;
    }
  }

  private async loadTab(): Promise<void> {
    if (!this.selected || this.season === undefined) return;
    const request = ++this.request;
    this.tabFailed = false;
    if (this.result?.tab !== this.tab) this.result = undefined;
    try {
      const result = await api.detail(this.hass, this.season, this.selected.round, this.tab);
      if (request === this.request) this.result = result;
    } catch {
      if (request === this.request) this.tabFailed = true;
    }
  }

  private get gridLabel(): string {
    return translator(this.hass)("results.gridShort");
  }

  private tyreName(compound: string): string {
    return translator(this.hass)(`tyres.${compound}`);
  }

  private open(round: Round): void {
    this.tab = "race";
    this.result = undefined;
    this.driver = "";
    this.selected = round;
  }

  protected override render() {
    const t = translator(this.hass);
    if (this.selected) return this.renderDetail(t, this.selected);
    const seasons = this.seasons.length ? this.seasons : [this.season ?? 0];
    return html`
      <div class="toolbar">
        <h1>${t("results.title")}</h1>
        <select aria-label=${t("common.season")} @change=${(e: Event) => {
          this.rounds = undefined;
          this.season = Number((e.target as HTMLSelectElement).value);
        }}>
          ${seasons.map((s) => html`<option .selected=${s === this.season} value=${s}>${s}</option>`)}
        </select>
      </div>
      ${this.failed
        ? failure(t, () => this.loadRounds())
        : !this.rounds
          ? loading(t)
          : !this.rounds.length
            ? html`<div class="card state">${t("results.empty")}</div>`
            : html`<div class="card"><div class="scroll"><table class="tbl">
                <tr><th>${t("common.round")}</th><th>${t("results.grandPrix")}</th><th>${t("results.date")}</th><th>${t("results.winner")}</th></tr>
                ${[...this.rounds].reverse().map(
                  (r) => html`<tr class="click" tabindex="0" @click=${() => this.open(r)} @keydown=${onKey(() => this.open(r))}>
                    <td class="num">${r.round}</td>
                    <td>${r.name}${r.sprint ? html` <span class="pill sprint">${t("common.sprint")}</span>` : nothing}</td>
                    <td class="num">${longDate(this.hass, r.date)}</td>
                    <td>${r.hidden ? html`<span class="hidden-cell">${t("spoiler.hiddenRound")}</span>` : r.winner ? person(r.winner.name, r.winner.team_id) : "—"}</td>
                  </tr>`,
                )}
              </table></div></div>`}
    `;
  }

  private renderDetail(t: Translate, round: Round) {
    return html`
      <div class="toolbar">
        <button class="link back" @click=${() => (this.selected = undefined)}>${icon(ICON.back, 18)} ${t("common.back")}</button>
        <h1>${round.name} ${this.season}</h1>
      </div>
      <div class="card">
        <div class="subtabs">
          ${round.tabs.map(
            (k) => html`<button class="tab ${this.tab === k ? "active" : ""}" @click=${() => (this.tab = k)}>${t(`results.tabs.${k}`)}</button>`,
          )}
        </div>
        ${this.renderTab(t)}
      </div>
    `;
  }

  private renderTab(t: Translate) {
    if (this.tabFailed) return failure(t, () => this.loadTab());
    const result = this.result;
    if (!result || result.tab !== this.tab) {
      return html`<div class="loading">${t("common.loading")}${ARCHIVE_TABS.has(this.tab) ? html`<br /><small>${t("results.archive")}</small>` : nothing}</div>`;
    }
    if (result.hidden) {
      return html`<div class="state">${icon(ICON.eyeOff, 56)}<div>${t("spoiler.revealNote")}</div>
        <button class="btn" @click=${() => this.dispatchEvent(new CustomEvent("plb-reveal", { detail: result.session, bubbles: true, composed: true }))}>${t("spoiler.reveal")}</button></div>`;
    }
    if (!result.available || !result.data) {
      return html`<div class="state">${ARCHIVE_TABS.has(this.tab) ? t("results.notArchived") : t("common.noData")}</div>`;
    }
    const data = result.data;
    switch (this.tab) {
      case "race":
      case "sprint":
        return this.classification(t, data.rows as Classified[], this.tab === "race");
      case "qualifying":
        return this.qualifying(t, data.rows as Classified[]);
      case "lap_chart":
        return this.lapChart(data);
      case "strategy":
        return this.strategy(data);
      case "lap_times":
        return this.lapTimes(t, data);
      case "pit_stops":
        return this.pitStops(t, data);
      case "race_control":
        return this.raceControl(t, data.messages as Message[]);
      default:
        return this.weather(t, data.weather);
    }
  }

  private classification(t: Translate, rows: Classified[], race: boolean) {
    return html`<div class="scroll"><table class="tbl">
      <tr><th>${t("common.pos")}</th><th>${t("common.driver")}</th><th></th><th class="wide">${t("common.team")}</th>
        <th class="r phone-hide">${t("results.grid")}</th><th class="r phone-hide">${t("common.laps")}</th><th>${t("results.time")}</th>
        <th class="r">${t("common.points")}</th>${race ? html`<th class="wide">${t("results.fastest")}</th>` : nothing}</tr>
      ${rows.map(
        (r) => html`<tr>
          <td class="num">${r.position_text && !/^\d+$/.test(r.position_text) ? r.position_text : r.position}</td>
          <td>${person(r.name, r.team_id)}</td>
          <td>${gained(r.gained)}</td>
          <td class="wide muted">${r.team ?? ""}</td>
          <td class="r num phone-hide">${r.grid ?? "—"}</td>
          <td class="r num phone-hide">${r.laps ?? ""}</td>
          <td class="num">${r.time ?? r.status ?? ""}</td>
          <td class="r num">${r.points ? number(this.hass, r.points) : ""}</td>
          ${race ? html`<td class="wide t ${r.fastest_lap?.rank === 1 ? "ob" : ""}">${r.fastest_lap?.time ?? ""}</td>` : nothing}
        </tr>`,
      )}
    </table></div>`;
  }

  private qualifying(t: Translate, rows: Classified[]) {
    const best = (key: "q1" | "q2" | "q3") => rows.map((r) => r[key]).filter(Boolean).sort()[0];
    const fastest = { q1: best("q1"), q2: best("q2"), q3: best("q3") };
    return html`<div class="scroll"><table class="tbl">
      <tr><th>${t("common.pos")}</th><th>${t("common.driver")}</th><th class="wide">${t("common.team")}</th><th>Q1</th><th>Q2</th><th>Q3</th></tr>
      ${rows.map(
        (r) => html`<tr>
          <td class="num">${r.position}</td><td>${person(r.name, r.team_id)}</td><td class="wide muted">${r.team ?? ""}</td>
          ${(["q1", "q2", "q3"] as const).map((k) => html`<td class="t ${r[k] && r[k] === fastest[k] ? "ob" : ""}">${r[k] ?? ""}</td>`)}
        </tr>`,
      )}
    </table></div>`;
  }

  private lapChart(data: { laps: number; drivers: (Classified & { positions: (number | null)[] })[] }) {
    const W = 960;
    const count = Math.max(...data.drivers.map((d) => Math.max(0, ...d.positions.filter((p): p is number => p !== null))), 1);
    const H = 24 + count * 22;
    const laps = Math.max(data.laps, 1);
    const x = (lap: number) => 36 + (lap / laps) * (W - 110);
    const y = (p: number) => 14 + (p - 1) * 22;
    const lines = data.drivers.map((d) => {
      let path = "";
      let pen = false;
      d.positions.forEach((p, lap) => {
        if (p === null) {
          pen = false;
          return;
        }
        path += `${pen ? "L" : "M"}${x(lap).toFixed(1)} ${y(p).toFixed(1)}`;
        pen = true;
      });
      const lastIndex = d.positions.map((p) => p !== null).lastIndexOf(true);
      const last = lastIndex >= 0 ? d.positions[lastIndex]! : null;
      const on = !this.highlight || this.highlight === d.driver_id;
      const colour = teamColour(d.team_id);
      const pick = () => (this.highlight = this.highlight === d.driver_id ? "" : d.driver_id ?? "");
      return svg`<g class="line" @click=${pick} @keydown=${onKey(pick)} tabindex="0" role="button"
          aria-label=${d.name ?? d.code ?? ""} aria-pressed=${this.highlight === d.driver_id ? "true" : "false"}
          style="opacity:${on ? 1 : 0.15}">
        <path d=${path} fill="none" stroke=${colour} stroke-width=${this.highlight === d.driver_id ? 4 : 2}></path>
        ${last !== null ? svg`<text x=${x(lastIndex) + 6} y=${y(last) + 4} style="fill:var(--primary-text-color);font-weight:600">${d.code ?? d.name?.slice(0, 3).toUpperCase()}</text>` : nothing}
      </g>`;
    });
    const grid = Array.from({ length: count }, (_, i) => svg`<line class="axis" x1="36" x2=${W - 74} y1=${y(i + 1)} y2=${y(i + 1)}></line><text x="8" y=${y(i + 1) + 4}>${i + 1}</text>`);
    const ticks = Array.from({ length: Math.floor(laps / 10) + 1 }, (_, i) => i * 10).map(
      (l) => svg`<text x=${x(l)} y=${H} text-anchor="middle">${l || this.gridLabel}</text>`,
    );
    return html`<div class="chart"><svg viewBox="0 0 ${W} ${H + 6}">${grid}${lines}${ticks}</svg></div>`;
  }

  private strategy(data: { laps: number; drivers: { tla: string; colour: string | null; stints: { compound: string; start_lap: number; end_lap: number; new: boolean }[] }[] }) {
    const W = 960;
    const row = 26;
    const laps = Math.max(data.laps, 1);
    const x = (l: number) => 60 + (l / laps) * (W - 80);
    const H = 10 + data.drivers.length * row + 24;
    const rows = data.drivers.map((d, i) => svg`
      <text x="8" y=${10 + i * row + 13} style="font-weight:600;fill:var(--primary-text-color)">${d.tla}</text>
      ${d.stints.map((s) => svg`<rect x=${x(s.start_lap - 1) + 1} y=${10 + i * row} width=${Math.max(2, x(s.end_lap) - x(s.start_lap - 1) - 2)}
        height=${row - 8} rx="4" style="fill:var(${`--plb-${s.compound}`}, var(--plb-unknown));stroke:var(--divider-color)"
        opacity=${s.new ? 1 : 0.75}><title>${this.tyreName(s.compound)} ${s.start_lap}–${s.end_lap}</title></rect>`)}`);
    const ticks = [1, ...Array.from({ length: Math.floor(laps / 10) }, (_, i) => (i + 1) * 10), laps]
      .filter((v, i, a) => a.indexOf(v) === i)
      .map((l) => svg`<text x=${x(l)} y=${H - 4} text-anchor="middle">${l}</text>`);
    return html`<div class="chart"><svg viewBox="0 0 ${W} ${H}">${rows}${ticks}</svg></div>`;
  }

  private lapTimes(t: Translate, data: { drivers: { number: string; tla: string; name: string; colour: string | null; laps: any[] }[] }) {
    if (!data.drivers.length) return html`<div class="state">${t("common.noData")}</div>`;
    const chosen = data.drivers.find((d) => d.number === this.driver) ?? data.drivers[0];
    const mark = (b: string | null) => (b === "overall" ? "ob" : b === "personal" ? "pb" : "");
    return html`
      <div class="pick">
        <label>${t("results.chooseDriver")}
          <select @change=${(e: Event) => (this.driver = (e.target as HTMLSelectElement).value)}>
            ${data.drivers.map((d) => html`<option .selected=${d === chosen} value=${d.number}>${d.tla} — ${d.name}</option>`)}
          </select>
        </label>
      </div>
      <div class="scroll"><table class="tbl">
        <tr><th>${t("common.lap")}</th><th>${t("live.last")}</th><th>S1</th><th>S2</th><th>S3</th><th>${t("results.tyre")}</th><th>${t("results.pit")}</th></tr>
        ${chosen.laps.map(
          (l) => html`<tr>
            <td class="num">${l.lap}</td>
            <td class="t ${mark(l.best)}">${l.time ?? "—"}</td>
            ${[0, 1, 2].map((i) => html`<td class="t ${mark(l.sector_bests?.[i])}">${l.sectors[i] ?? "—"}</td>`)}
            <td>${l.compound ? tyre(t, l.compound, null, l.tyre_age) : ""}</td>
            <td>${l.pit_in ? html`<span class="badge pit">${t("results.pitIn")}</span>` : nothing}${l.pit_out ? html`<span class="badge out">${t("results.pitOut")}</span>` : nothing}</td>
          </tr>`,
        )}
      </table></div>`;
  }

  private pitStops(t: Translate, data: { stops: { name: string | null; code: string | null; team_id: string | null; lap: number; stop: number; duration: string | null }[] }) {
    if (!data.stops.length) return html`<div class="state">${t("common.noData")}</div>`;
    return html`<div class="scroll"><table class="tbl">
      <tr><th>${t("common.driver")}</th><th class="r">${t("common.lap")}</th><th class="r">${t("results.stop")}</th><th class="r">${t("results.duration")}</th></tr>
      ${data.stops.map(
        (s) => html`<tr><td>${person(s.name, s.team_id)}</td><td class="r num">${s.lap}</td><td class="r num">${s.stop}</td><td class="r num">${s.duration ?? ""}</td></tr>`,
      )}
    </table></div>`;
  }

  private raceControl(t: Translate, messages: Message[]) {
    const kinds = ["all", "flags", "penalties", "other"];
    const want = { all: null, flags: "flag", penalties: "penalty", other: "other" }[this.filter] ?? null;
    const shown = messages.filter((m) => !want || m.kind === want);
    return html`<div class="filters">${kinds.map(
        (k) => html`<button class="chip small ${this.filter === k ? "on" : ""}" @click=${() => (this.filter = k)}>${t(`live.${k}`)}</button>`,
      )}</div>
      <div class="feed">${shown.map(
        (m) => html`<div class="msg ${m.kind}"><span class="lap num">${m.lap ? `${t("common.lap")} ${m.lap}` : ""}</span>
          <span>${m.message}<time>${clockTime(this.hass, m.utc)}</time></span></div>`,
      )}</div>`;
  }

  private weather(t: Translate, w: { air: any; track: any; rain: boolean } | null) {
    if (!w) return html`<div class="state">${t("common.noData")}</div>`;
    const row = (label: string, v: { start: number; end: number; min: number; max: number } | null) =>
      v
        ? html`<tr><td>${label}</td>${[v.start, v.end, v.min, v.max].map((n) => html`<td class="r num">${number(this.hass, n)}°</td>`)}</tr>`
        : nothing;
    return html`<div class="scroll"><table class="tbl">
      <tr><th></th><th class="r">${t("results.start")}</th><th class="r">${t("results.end")}</th><th class="r">${t("results.min")}</th><th class="r">${t("results.max")}</th></tr>
      ${row(t("results.air"), w.air)}${row(t("results.track"), w.track)}
      <tr><td>${t("results.rain")}</td><td class="r" colspan="4">${w.rain ? t("results.yes") : t("results.no")}</td></tr>
    </table></div>`;
  }

  static override styles = [
    tokens,
    css`
      :host { display: block; }
      .back { display: inline-flex; align-items: center; gap: 4px; }
      .subtabs { display: flex; gap: 4px; flex-wrap: wrap; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); }
      .subtabs .tab { font-size: 13px; padding: 6px 12px; }
      .line { cursor: pointer; }
      .pick { padding: 12px 16px; border-bottom: 1px solid var(--divider-color); }
      .pick label { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--secondary-text-color); }
      .filters { display: flex; gap: 6px; padding: 8px 16px; border-bottom: 1px solid var(--divider-color); }
      .feed { max-height: 70vh; overflow: auto; }
      .msg { display: grid; grid-template-columns: 56px 1fr; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--divider-color); font-size: 13px; }
      .msg .lap { color: var(--secondary-text-color); font-size: 12px; }
      .msg.flag { box-shadow: inset 3px 0 var(--plb-yellow); }
      .msg.penalty { box-shadow: inset 3px 0 var(--error-color, #db4437); }
      .msg time { display: block; color: var(--secondary-text-color); font-size: 11px; margin-top: 2px; }
      .badge + .badge { margin-left: 4px; }
      @media (max-width: 900px) { .wide { display: none; } }
      @media (max-width: 640px) { .phone-hide { display: none; } }
    `,
  ];
}
