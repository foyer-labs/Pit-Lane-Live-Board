// The dashboard cards (SPEC §7.6, decision 47): each piece of the Live page as a
// Lovelace card, fed by one shared stream and configured in the visual editor.
import { css, html, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { api } from "../api";
import { clockTime, number, sessionClock, sessionTime, shortTime } from "../format";
import type { Translate } from "../i18n";
import { ICON, icon } from "../icons";
import { gained, tyre } from "../parts";
import { teamColour } from "../teams";
import { stewardsCard, stewardsStyles, trackClass } from "../pages/stewards";
import type { LiveView, Row, StandingsPage, Timed } from "../types";
import { LiveCard, form, pageTranslator, type CardConfig } from "./base";

export const TOWER_COLUMNS = ["gap", "interval", "last", "best", "sectors", "tyre", "pits"] as const;
const COLUMN_LABEL: Record<string, string> = {
  gap: "live.gap",
  interval: "live.int",
  last: "live.last",
  best: "live.best",
  tyre: "live.tyre",
  pits: "live.pits",
};

function timed(value: Timed | null) {
  if (!value) return html`<span class="t prev">—</span>`;
  const cls = value.overall_best ? "ob" : value.personal_best ? "pb" : value.previous ? "prev" : "";
  return html`<span class="t ${cls}">${value.time}</span>`;
}

function driverOf(view: LiveView, number: string | null): Row | undefined {
  return view.tower?.find((r) => r.number === number);
}

// Timing tower.

export class PitLaneTowerCard extends LiveCard {
  static getConfigForm() {
    const t = pageTranslator();
    return form([
      { name: "title", selector: { text: {} } },
      { name: "rows", selector: { number: { min: 1, max: 22, mode: "box" } } },
      {
        name: "columns",
        selector: {
          select: {
            multiple: true,
            mode: "list",
            options: TOWER_COLUMNS.map((c) => ({ value: c, label: c === "sectors" ? "S1 S2 S3" : t(COLUMN_LABEL[c]) })),
          },
        },
      },
      { name: "highlight", selector: { text: {} } },
    ]);
  }

  static getStubConfig() {
    return { rows: 10, columns: ["gap", "last", "tyre"] };
  }

  protected override defaults() {
    return { rows: 10, columns: ["gap", "last", "tyre"], highlight: "" };
  }

  override getCardSize(): number {
    return 1 + Math.ceil(Number(this.config?.rows ?? 10) / 2);
  }

  protected defaultTitle(t: Translate) {
    return t("cards.tower.title");
  }

  protected renderBody(t: Translate, v: LiveView) {
    const rows = (v.tower ?? []).slice(0, Math.max(1, Number(this.config.rows) || 10));
    const columns = new Set((this.config.columns as string[] | undefined) ?? []);
    const highlight = String(this.config.highlight ?? "").trim().toUpperCase();
    if (!rows.length) return html`<div class="empty">${t("common.noData")}</div>`;
    return html`<table class="tower">
      <thead><tr>
        <th class="pos">${t("common.pos")}</th><th>${t("common.driver")}</th>
        ${columns.has("gap") ? html`<th>${t("live.gap")}</th>` : nothing}
        ${columns.has("interval") ? html`<th>${t("live.int")}</th>` : nothing}
        ${columns.has("last") ? html`<th>${t("live.last")}</th>` : nothing}
        ${columns.has("best") ? html`<th>${t("live.best")}</th>` : nothing}
        ${columns.has("sectors") ? html`<th>S1</th><th>S2</th><th>S3</th>` : nothing}
        ${columns.has("tyre") ? html`<th>${t("live.tyre")}</th>` : nothing}
        ${columns.has("pits") ? html`<th>${t("live.pits")}</th>` : nothing}
      </tr></thead>
      <tbody>${repeat(
        rows,
        (r) => r.number,
        (r) => html`<tr class=${[r.tla === highlight || r.number === highlight ? "sel" : "", r.status === "retired" || r.status === "knocked_out" ? "out" : ""].join(" ")}>
          <td class="pos num">${r.position ?? "—"}</td>
          <td><span class="drv"><span class="bar" style="background:${r.colour ?? "var(--divider-color)"}"></span>
            <span class="tla" title=${r.name ?? ""}>${r.tla}</span>
            ${r.penalty ? html`<span class="badge pen">+${r.penalty}s</span>` : nothing}
            ${r.in_pit ? html`<span class="badge pit">${t("live.pit")}</span>` : nothing}
            ${gained(r.gained, false)}</span></td>
          ${columns.has("gap") ? html`<td class="t">${r.qualifying?.gap ?? r.gap ?? ""}</td>` : nothing}
          ${columns.has("interval") ? html`<td class="t">${r.interval ?? ""}</td>` : nothing}
          ${columns.has("last") ? html`<td>${timed(r.last_lap)}</td>` : nothing}
          ${columns.has("best") ? html`<td class="t">${r.qualifying?.best ?? r.best_lap?.time ?? ""}</td>` : nothing}
          ${columns.has("sectors") ? r.sectors.map((s) => html`<td>${timed(s)}</td>`) : nothing}
          ${columns.has("tyre") ? html`<td>${r.tyre ? tyre(t, r.tyre.compound, r.tyre.new, r.tyre.age) : ""}</td>` : nothing}
          ${columns.has("pits") ? html`<td class="num">${r.pit_stops}</td>` : nothing}
        </tr>`,
      )}</tbody>
    </table>`;
  }

  static override styles = [
    ...LiveCard.styles,
    css`
      .tower { width: 100%; border-collapse: collapse; font-size: 13px; }
      .tower th { text-align: left; font-weight: 500; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--secondary-text-color); padding: 4px 6px; white-space: nowrap; }
      .tower td { padding: 0 6px; height: 32px; border-top: 1px solid var(--divider-color); white-space: nowrap; }
      .tower th:first-child, .tower td:first-child { padding-left: 16px; }
      .tower th:last-child, .tower td:last-child { padding-right: 16px; }
      .tower tr.sel td { background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
      .tower tr.out td { color: var(--plb-muted); }
      .pos { width: 24px; text-align: center; font-weight: 600; }
      .badge.pen { background: var(--error-color, #db4437); color: #fff; }
      .tyre-dot { width: 20px; height: 20px; font-size: 10px; }
    `,
  ];
}

// Track map.

export class PitLaneMapCard extends LiveCard {
  static getConfigForm() {
    return form([{ name: "title", selector: { text: {} } }]);
  }

  static getStubConfig() {
    return {};
  }

  override getCardSize(): number {
    return 6;
  }

  protected defaultTitle(t: Translate) {
    return t("live.map");
  }

  protected renderBody(t: Translate, v: LiveView) {
    if (v.state === "final" || !v.map_available) {
      const reason = v.state === "final" ? "cards.mapAfter" : v.map_reason === "no_data" ? "live.mapNoData" : "cards.mapNeedsF1tv";
      return html`<div class="empty">${icon(ICON.lock, 18)} ${t(reason)}</div>`;
    }
    return html`<plb-live-map .hass=${this.hass} .tower=${v.tower ?? []} .selected=${String(this.config.highlight ?? "")}></plb-live-map>`;
  }
}

// Flags & stewards.

export class PitLaneStewardsCard extends LiveCard {
  static override properties = { ...LiveCard.properties, open: { state: true } };
  open = false;

  static getConfigForm() {
    return form([{ name: "title", selector: { text: {} } }]);
  }

  static getStubConfig() {
    return {};
  }

  protected defaultTitle() {
    return "";
  }

  protected renderBody(t: Translate, v: LiveView) {
    return stewardsCard(t, v.stewards, v.header?.track_status, this.open, () => (this.open = !this.open));
  }

  static override styles = [
    ...LiveCard.styles,
    stewardsStyles,
    css`
      .body { padding: 0; }
      .stewards { margin: 0; box-shadow: none; border-radius: 0; background: none; }
    `,
  ];
}

// Team radio.

export class PitLaneRadioCard extends LiveCard {
  static override properties = { ...LiveCard.properties, playing: { state: true } };
  playing = "";
  private audio?: HTMLAudioElement;

  static getConfigForm() {
    return form([
      { name: "title", selector: { text: {} } },
      { name: "count", selector: { number: { min: 1, max: 30, mode: "box" } } },
    ]);
  }

  static getStubConfig() {
    return { count: 5 };
  }

  protected override defaults() {
    return { count: 5 };
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stop();
  }

  protected defaultTitle(t: Translate) {
    return t("live.radio");
  }

  private stop(): void {
    const audio = this.audio;
    this.audio = undefined;
    this.playing = "";
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
  }

  private play(url: string): void {
    if (this.playing === url) {
      this.stop();
      return;
    }
    this.stop();
    const audio = new Audio(url);
    this.audio = audio;
    const done = () => {
      if (this.audio === audio) this.stop();
    };
    audio.addEventListener("ended", done);
    audio.addEventListener("error", done);
    void audio.play().catch(done);
    this.playing = url;
  }

  protected renderBody(t: Translate, v: LiveView) {
    const clips = (v.radio ?? []).slice(0, Number(this.config.count) || 5);
    if (!clips.length) return html`<div class="empty">${t("live.noRadio")}</div>`;
    return html`${repeat(
      clips,
      (c) => c.url,
      (c) => {
        const who = driverOf(v, c.number);
        const on = this.playing === c.url;
        return html`<div class="row">
          <button class="play" @click=${() => this.play(c.url)}
            aria-label=${t(on ? "live.pause" : "live.play", { driver: who?.tla ?? c.number ?? "", time: clockTime(this.hass!, c.utc) })}>
            ${icon(on ? ICON.pause : ICON.play, 16)}</button>
          <span class="bar" style="background:${who?.colour ?? "var(--divider-color)"}"></span><b>${who?.tla ?? c.number}</b>
          <span class="spacer"></span><small class="muted">${clockTime(this.hass!, c.utc)}</small></div>`;
      },
    )}`;
  }

  static override styles = [
    ...LiveCard.styles,
    css`
      .play { width: 30px; height: 30px; border-radius: 50%; border: 0; background: var(--primary-color); color: #fff;
        cursor: pointer; display: grid; place-items: center; flex: none; }
    `,
  ];
}

// Race control.

const FILTERS = ["all", "flags", "penalties", "other"] as const;
const FILTER_KIND: Record<string, string | null> = { all: null, flags: "flag", penalties: "penalty", other: "other" };

export class PitLaneRaceControlCard extends LiveCard {
  static getConfigForm() {
    const t = pageTranslator();
    return form([
      { name: "title", selector: { text: {} } },
      { name: "count", selector: { number: { min: 1, max: 50, mode: "box" } } },
      { name: "filter", selector: { select: { mode: "dropdown", options: FILTERS.map((f) => ({ value: f, label: t(`live.${f}`) })) } } },
    ]);
  }

  static getStubConfig() {
    return { count: 6, filter: "all" };
  }

  protected override defaults() {
    return { count: 6, filter: "all" };
  }

  protected defaultTitle(t: Translate) {
    return t("live.raceControl");
  }

  protected renderBody(t: Translate, v: LiveView) {
    const want = FILTER_KIND[String(this.config.filter)] ?? null;
    const messages = (v.race_control ?? []).filter((m) => !want || m.kind === want).slice(0, Number(this.config.count) || 6);
    if (!messages.length) return html`<div class="empty">${t("common.noData")}</div>`;
    return html`${repeat(
      messages,
      (m) => `${m.utc}|${m.message}`,
      (m) => html`<div class="row msg ${m.kind}"><small class="lap">${m.lap ? `${t("common.lap")} ${m.lap}` : ""}</small>
        <span class="text">${m.message}<small>${clockTime(this.hass!, m.utc)}</small></span></div>`,
    )}`;
  }

  static override styles = [
    ...LiveCard.styles,
    css`
      .msg { align-items: flex-start; font-size: 13px; padding-top: 8px; padding-bottom: 8px; }
      .msg.flag { box-shadow: inset 3px 0 var(--plb-yellow); }
      .msg.penalty { box-shadow: inset 3px 0 var(--error-color, #db4437); }
      .lap { flex: none; width: 48px; color: var(--secondary-text-color); }
      .text small { display: block; color: var(--secondary-text-color); font-size: 11px; }
    `,
  ];
}

// Session.

export class PitLaneSessionCard extends LiveCard {
  static getConfigForm() {
    return form([{ name: "title", selector: { text: {} } }]);
  }

  static getStubConfig() {
    return {};
  }

  override getCardSize(): number {
    return 2;
  }

  protected defaultTitle() {
    return "";
  }

  protected renderBody(t: Translate, v: LiveView) {
    const h = v.header;
    const final = v.state === "final";
    const qualifying = h?.kind === "qualifying" || h?.kind === "sprint_qualifying";
    const progress =
      qualifying && h?.part
        ? html`Q${h.part}${!final && h.remaining !== null ? html` <small>${sessionClock(h.remaining)}</small>` : nothing}`
        : h?.lap
          ? html`${t("common.lap")} ${h.lap}${h.total_laps ? html`<small> / ${h.total_laps}</small>` : nothing}`
          : !final && h?.remaining != null
            ? html`${sessionClock(h.remaining)} <small>${t("live.remaining")}</small>`
            : nothing;
    const next = v.next_session;
    return html`<div class="session">
      <div class="name"><b>${h?.meeting ?? ""}</b><small>${h?.session ?? ""}${h?.circuit ? ` · ${h.circuit}` : ""}</small></div>
      <div class="progress num">${progress}</div>
      ${final
        ? html`<div class="muted small">${t("live.ended", { time: shortTime(this.hass!, v.ended) })}</div>`
        : h?.track_status
          ? html`<span class="status-pill ${trackClass(h.track_status)}">${t(`live.status.${h.track_status}`)}</span>`
          : nothing}
      ${final && next
        ? html`<div class="next small">${t("live.next", { meeting: next.meeting, session: t(`sessions.${next.kind}`) })}
            ${next.start ? html`· <b class="num"><plb-countdown .to=${next.start}></plb-countdown></b>` : nothing}
            ${next.start ? html`<span class="muted">(${sessionTime(this.hass!, next.start, next.date)})</span>` : nothing}</div>`
        : nothing}
    </div>`;
  }

  static override styles = [
    ...LiveCard.styles,
    css`
      .session { display: grid; gap: 8px; justify-items: start; padding: 8px 16px 12px; }
      .name { display: grid; }
      .name b { font-size: 18px; font-weight: 500; }
      .name small, .small { color: var(--secondary-text-color); font-size: 13px; }
      .progress { font-size: 26px; font-weight: 600; }
      .progress small { font-size: 14px; color: var(--secondary-text-color); font-weight: 400; }
      .next { color: var(--secondary-text-color); }
      .next b { color: var(--primary-text-color); }
    `,
  ];
}

// Weather.

export class PitLaneWeatherCard extends LiveCard {
  static getConfigForm() {
    return form([{ name: "title", selector: { text: {} } }]);
  }

  static getStubConfig() {
    return {};
  }

  override getCardSize(): number {
    return 2;
  }

  protected defaultTitle(t: Translate) {
    return t("live.weather");
  }

  protected renderBody(t: Translate, v: LiveView) {
    const w = v.weather;
    if (!w) return html`<div class="empty">${t("common.noData")}</div>`;
    const hass = this.hass!;
    const arrow = w.wind_direction === null ? "" : html`<span class="wind" style="transform:rotate(${w.wind_direction + 180}deg)">↑</span>`;
    return html`<div class="weather">
      <div><small>${t("live.air")}</small><b class="num">${number(hass, w.air)}°</b></div>
      <div><small>${t("live.track")}</small><b class="num">${number(hass, w.track)}°</b></div>
      <div><small>${t("live.rain")}</small><b>${w.rain ? t("live.wet") : t("live.dry")}</b></div>
      <div><small>${t("live.humidity")}</small><b class="num">${number(hass, w.humidity, 0)}%</b></div>
      <div><small>${t("live.wind")}</small><b class="num">${t("live.windSpeed", { n: number(hass, w.wind_speed) })} ${arrow}</b></div>
      <div><small>${t("live.pressure")}</small><b class="num">${number(hass, w.pressure, 0)}</b></div>
    </div>`;
  }

  static override styles = [
    ...LiveCard.styles,
    css`
      .weather { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 8px 16px 12px; }
      .weather div { display: grid; gap: 2px; }
      .weather small { color: var(--secondary-text-color); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
      .weather b { font-size: 17px; font-weight: 500; }
      .wind { display: inline-block; }
    `,
  ];
}

// Championship standings: not live, read once and again every 10 minutes.

const STANDINGS_REFRESH = 10 * 60 * 1000;

export class PitLaneStandingsCard extends LiveCard {
  static override properties = { ...LiveCard.properties, page: { state: true }, failed: { state: true } };
  page?: StandingsPage;
  failed = false;
  private timer?: number;
  private loading = false;

  static getConfigForm() {
    const t = pageTranslator();
    return form([
      { name: "title", selector: { text: {} } },
      {
        name: "kind",
        selector: { select: { mode: "dropdown", options: ["drivers", "constructors"].map((k) => ({ value: k, label: t(`standings.${k}`) })) } },
      },
      { name: "rows", selector: { number: { min: 1, max: 30, mode: "box" } } },
    ]);
  }

  static getStubConfig() {
    return { kind: "drivers", rows: 10 };
  }

  protected override defaults() {
    return { kind: "drivers", rows: 10 };
  }

  protected override get usesLive(): boolean {
    return false;
  }

  override setConfig(config: CardConfig): void {
    const kind = this.config?.kind;
    super.setConfig(config);
    if (kind !== undefined && kind !== this.config.kind) {
      this.page = undefined;
      void this.load();
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.timer = window.setInterval(() => void this.load(), STANDINGS_REFRESH);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this.timer);
  }

  protected override updated(): void {
    if (this.hass && !this.page && !this.loading && !this.failed) void this.load();
  }

  private async load(): Promise<void> {
    if (!this.hass || this.loading) return;
    this.loading = true;
    try {
      const settings = await api.settings(this.hass);
      this.page = await api.standings(this.hass, settings.season, null, String(this.config.kind));
      this.failed = false;
    } catch {
      this.failed = true;
    } finally {
      this.loading = false;
    }
  }

  override getCardSize(): number {
    return 1 + Math.ceil(Number(this.config?.rows ?? 10) / 2);
  }

  protected defaultTitle(t: Translate) {
    return t(`standings.${this.config.kind === "constructors" ? "constructors" : "drivers"}`);
  }

  protected renderBody() {
    return nothing;
  }

  protected override render() {
    if (!this.config) return nothing;
    const t = this.t;
    const title = this.config.title === undefined ? this.defaultTitle(t) : this.config.title;
    const page = this.page;
    const rows = (page?.rows ?? []).slice(0, Number(this.config.rows) || 10);
    const drivers = this.config.kind !== "constructors";
    const body = !page
      ? html`<div class="state">${this.failed ? t("common.unavailable") : t("common.loading")}</div>`
      : !rows.length
        ? html`<div class="empty">${t("standings.empty")}</div>`
        : html`${page.round ? html`<div class="empty">${t("standings.after", { n: page.round })}${page.capped ? ` · ${t("spoiler.standingsCap")}` : ""}</div>` : nothing}
            ${rows.map(
              (r) => html`<div class="row"><b class="pos num">${r.position_text ?? r.position ?? ""}</b>
                <span class="bar" style="background:${teamColour(r.team_id, null)}"></span>
                <span class="name">${drivers ? (r.name ?? r.code) : r.team}</span>
                ${drivers && r.team ? html`<small class="muted">${r.team}</small>` : nothing}
                <span class="spacer"></span><b class="num">${number(this.hass!, r.points, 1)}</b></div>`,
            )}`;
    return html`<ha-card>
      ${title ? html`<div class="head"><span>${title}</span></div>` : nothing}
      <div class="body">${body}</div>
    </ha-card>`;
  }

  static override styles = [
    ...LiveCard.styles,
    css`
      .pos { width: 22px; text-align: right; }
      .name { font-weight: 500; }
    `,
  ];
}

/** Every card, with its element name, for the card picker. */
export const CARDS = [
  { tag: "pit-lane-tower-card", element: PitLaneTowerCard, key: "tower" },
  { tag: "pit-lane-map-card", element: PitLaneMapCard, key: "map" },
  { tag: "pit-lane-stewards-card", element: PitLaneStewardsCard, key: "stewards" },
  { tag: "pit-lane-radio-card", element: PitLaneRadioCard, key: "radio" },
  { tag: "pit-lane-race-control-card", element: PitLaneRaceControlCard, key: "race_control" },
  { tag: "pit-lane-session-card", element: PitLaneSessionCard, key: "session" },
  { tag: "pit-lane-weather-card", element: PitLaneWeatherCard, key: "weather" },
  { tag: "pit-lane-standings-card", element: PitLaneStandingsCard, key: "standings" },
] as const;
