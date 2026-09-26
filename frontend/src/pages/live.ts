// Live (SPEC §7.1): the session strip, the timing tower, and around it race control,
// team radio, weather, pit stops and the track map. Everything the page shows was
// released by the backend through the TV delay; stale data says so (INV-2).
import { LitElement, css, html, nothing, svg } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { api } from "../api";
import { clockTime, countdown, number, sessionClock, sessionTime } from "../format";
import { translator, type Translate } from "../i18n";
import { ICON, icon } from "../icons";
import { failure, gained, onKey, tyre } from "../parts";
import { tokens } from "../styles";
import type { Hass, LiveView, MapView, Message, Row, Settings, Timed } from "../types";

const STATUS_CLASS: Record<string, string> = {
  clear: "st-clear",
  yellow: "st-yellow",
  safety_car: "st-sc",
  virtual_safety_car: "st-sc",
  vsc_ending: "st-yellow",
  red_flag: "st-red",
  chequered: "st-chequered",
};
const FILTER_KIND: Record<string, string | null> = { all: null, flags: "flag", penalties: "penalty", other: "other" };

export class PlbLive extends LitElement {
  static override properties = {
    hass: { attribute: false },
    settings: { attribute: false },
    view: { state: true },
    map: { state: true },
    now: { state: true },
    selected: { state: true },
    filter: { state: true },
    playing: { state: true },
    failed: { state: true },
  };

  hass!: Hass;
  settings!: Settings;
  view?: LiveView;
  map?: MapView | null;
  now = Date.now();
  selected = "";
  filter = "all";
  playing = "";
  failed = false;
  private unsubscribe?: () => void;
  private unsubscribeMap?: () => void;
  private subscribing = false;
  private subscribingMap = false;
  private retry?: number;
  // When the current view arrived: while the feed is quiet, the data keeps ageing.
  private receivedAt = Date.now();
  private timer?: number;
  private audio?: HTMLAudioElement;

  override connectedCallback(): void {
    super.connectedCallback();
    this.timer = window.setInterval(() => (this.now = Date.now()), 1000);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this.timer);
    window.clearTimeout(this.retry);
    this.retry = undefined;
    this.unsubscribe?.();
    this.unsubscribeMap?.();
    this.unsubscribe = this.unsubscribeMap = undefined;
    this.audio?.pause();
  }

  protected override willUpdate(): void {
    if (this.hass && !this.unsubscribe && !this.subscribing && this.retry === undefined) {
      void this.subscribe();
    }
    // The map is only asked for while it has something to show (SPEC §5.4).
    const wantMap = !!this.view?.map_available && ["live", "stale"].includes(this.view.state);
    if (wantMap && !this.unsubscribeMap && !this.subscribingMap) {
      void this.subscribeMap();
    } else if (!wantMap && this.unsubscribeMap) {
      this.unsubscribeMap();
      this.unsubscribeMap = undefined;
      this.map = undefined;
    }
  }

  private async subscribe(): Promise<void> {
    this.subscribing = true;
    try {
      this.unsubscribe = await api.subscribeLive(this.hass, (view) => {
        this.view = view;
        this.receivedAt = Date.now();
      });
      this.failed = false;
    } catch {
      this.failed = true;
      this.retry = window.setTimeout(() => {
        this.retry = undefined;
        this.requestUpdate();
      }, 10_000);
    } finally {
      this.subscribing = false;
    }
  }

  private async subscribeMap(): Promise<void> {
    this.subscribingMap = true;
    try {
      this.unsubscribeMap = await api.subscribeMap(this.hass, (map) => (this.map = map));
    } catch {
      /* no map this time: the next view asks again */
    } finally {
      this.subscribingMap = false;
    }
  }

  private select(number: string): void {
    this.selected = this.selected === number ? "" : number;
  }

  private play(url: string): void {
    if (this.playing === url) {
      this.audio?.pause();
      this.playing = "";
      return;
    }
    this.audio?.pause();
    // The browser plays F1's clip directly (decision 17).
    this.audio = new Audio(url);
    this.audio.addEventListener("ended", () => (this.playing = ""));
    this.audio.addEventListener("error", () => (this.playing = ""));
    void this.audio.play().catch(() => (this.playing = ""));
    this.playing = url;
  }

  protected override render() {
    const t = translator(this.hass);
    const v = this.view;
    if (!v) {
      return this.failed
        ? failure(t, () => {
            window.clearTimeout(this.retry);
            this.retry = undefined;
            void this.subscribe();
          })
        : html`<div class="card loading">${t("common.loading")}</div>`;
    }
    switch (v.state) {
      case "hidden":
        return html`<div class="card state">${icon(ICON.eyeOff, 56)}<h2>${t("live.hidden")}</h2>
          <div>${t("live.hiddenHelp", { meeting: v.header?.meeting ?? "", session: v.header?.session ?? "" })}</div>
          <button class="btn" @click=${() => this.dispatchEvent(new CustomEvent("plb-spoiler-off", { bubbles: true, composed: true }))}>${t("live.showAll")}</button></div>`;
      case "syncing":
        return html`<div class="card state">${icon(ICON.clock, 56)}<h2>${t("live.syncing")}</h2>
          <div>${t("live.syncingHelp", { n: v.delay })}</div></div>`;
      case "connecting":
        return html`<div class="card state">${icon(ICON.timer, 56)}<h2>${t("live.connecting")}</h2></div>`;
      case "idle":
        return this.renderIdle(t, v);
      default:
        return this.renderLive(t, v);
    }
  }

  private renderIdle(t: Translate, v: LiveView) {
    const next = v.next_session;
    return html`<div class="card state">${icon(ICON.timer, 56)}<h2>${t("live.idle")}</h2>
      ${next
        ? html`<div>${t("live.next", { meeting: next.meeting, session: t(`sessions.${next.kind}`) })}</div>
            ${next.start
              ? html`<div class="big num">${countdown(Date.parse(next.start) - this.now)}</div>
                  <div>${t("live.startsIn")} · ${sessionTime(this.hass, next.start, next.date)}</div>`
              : nothing}`
        : html`<div>${t("live.noNext")}</div>`}
    </div>`;
  }

  private renderLive(t: Translate, v: LiveView) {
    const h = v.header;
    const ageSeconds = (v.data_age ?? 0) + Math.max(0, this.now - this.receivedAt) / 1000;
    const age = Math.round(ageSeconds);
    const banner =
      v.state === "stale"
        ? html`<div class="banner">${icon(ICON.alert)}${t("live.stale", { n: age })}</div>`
        : v.state === "lost"
          ? html`<div class="banner lost">${icon(ICON.alert)}${t("live.lost")}</div>`
          : nothing;
    const qualifying = h?.kind === "qualifying" || h?.kind === "sprint_qualifying";
    return html`${banner}
      <div class="card strip">
        <div><h1>${h?.meeting ?? ""}</h1><div class="sub">${h?.session ?? ""}${h?.circuit ? ` · ${h.circuit}` : ""}</div></div>
        ${qualifying && h?.part
          ? html`<div class="laps num">Q${h.part}${h.remaining !== null ? html`<small> · ${sessionClock(h.remaining)} ${t("live.remaining")}</small>` : nothing}</div>`
          : h?.lap
            ? html`<div class="laps num">${t("common.lap")} ${h.lap}${h.total_laps ? html`<small> / ${h.total_laps}</small>` : nothing}</div>`
            : h?.remaining !== null && h?.remaining !== undefined
              ? html`<div class="laps num">${sessionClock(h.remaining)} <small>${t("live.remaining")}</small></div>`
              : nothing}
        ${h?.track_status
          ? html`<span class="status-pill ${STATUS_CLASS[h.track_status] ?? ""}">${t(`live.status.${h.track_status}`)}</span>`
          : nothing}
        <span class="spacer"></span>
        <span class="age">${t("live.updated", { n: number(this.hass, ageSeconds, v.state === "live" ? 1 : 0) })}</span>
      </div>
      <div class="grid ${v.state === "lost" ? "dim" : ""}">
        <div class="col">
          <div class="card scroll">${this.renderTower(t, v.tower ?? [], qualifying)}</div>
          <div class="pair">${this.renderWeather(t, v)}${this.renderPits(t, v)}</div>
        </div>
        <div class="col">
          ${this.renderMap(t, v)}${this.renderRaceControl(t, v.race_control ?? [])}${this.renderRadio(t, v)}
        </div>
      </div>`;
  }

  private timed(value: Timed | null, extra = "") {
    if (!value) return html`<span class="t prev ${extra}">—</span>`;
    const cls = value.overall_best ? "ob" : value.personal_best ? "pb" : value.previous ? "prev" : "";
    return html`<span class="t ${cls} ${extra}">${value.time}</span>`;
  }

  private badge(t: Translate, r: Row) {
    if (r.status === "retired") return html`<span class="badge ret">${t("live.ret")}</span>`;
    if (r.status === "stopped") return html`<span class="badge ret">${t("live.stop")}</span>`;
    if (r.in_pit) return html`<span class="badge pit">${t("live.pit")}</span>`;
    if (r.pit_out) return html`<span class="badge out">${t("live.out")}</span>`;
    return nothing;
  }

  private renderTower(t: Translate, rows: Row[], qualifying: boolean) {
    const part = this.view?.header?.part ?? 1;
    const cutoffAfter = qualifying ? rows.findIndex((r) => r.qualifying?.cutoff) : -1;
    return html`<table class="tower">
      <tr>
        <th class="pos">${t("common.pos")}</th><th>${t("common.driver")}</th>
        ${qualifying
          ? html`${[1, 2, 3].map((p) => html`<th class=${p === part ? "" : "col-s"}>Q${p}</th>`)}<th>${t("live.gap")}</th>`
          : html`<th></th><th>${t("live.gap")}</th><th class="col-int">${t("live.int")}</th><th>${t("live.last")}</th><th class="col-best">${t("live.best")}</th>`}
        <th class="col-s">S1</th><th class="col-s">S2</th><th class="col-s">S3</th>
        <th>${t("live.tyre")}</th>${qualifying ? nothing : html`<th class="col-pits">${t("live.pits")}</th>`}
      </tr>
      ${rows.map((r, i) => {
        const out = r.status === "retired" || r.status === "knocked_out";
        const classes = [r.number === this.selected ? "sel" : "", out ? "out" : "", i === cutoffAfter - 1 ? "zone" : ""].join(" ");
        const q = r.qualifying;
        const pick = () => this.select(r.number);
        const selected = r.number === this.selected;
        return html`<tr class=${classes} tabindex="0" aria-selected=${selected ? "true" : "false"}
            @click=${pick} @keydown=${onKey(pick)}>
          <td class="pos num">${r.position ?? "—"}</td>
          <td><div class="drv"><span class="bar" style="background:${r.colour ?? "var(--divider-color)"}"></span>
            <span class="tla" title=${r.name ?? ""}>${r.tla}</span><small>${r.number}</small>${this.badge(t, r)}
            ${r.status === "knocked_out" ? html`<span class="badge ko">${t("live.ko")}</span>` : nothing}</div></td>
          ${qualifying && q
            ? html`${[0, 1, 2].map(
                  (p) => html`<td class="t ${p + 1 === part ? "" : "col-s muted"}">${q.part_bests[p] ?? ""}</td>`,
                )}<td class="t">${q.gap ?? ""}</td>`
            : html`<td>${gained(r.gained)}</td><td class="t">${r.gap ?? ""}</td><td class="t col-int">${r.interval ?? ""}</td>
                <td>${this.timed(r.last_lap)}</td>
                <td class="col-best">${r.best_lap ? html`<span class="t">${r.best_lap.time}</span>` : ""}</td>`}
          ${r.sectors.map((s) => html`<td class="col-s">${this.timed(s, "sector")}</td>`)}
          <td>${r.tyre ? tyre(t, r.tyre.compound, r.tyre.new, r.tyre.age) : ""}</td>
          ${qualifying ? nothing : html`<td class="num col-pits">${r.pit_stops}</td>`}
        </tr>
        ${selected ? this.details(t, r, qualifying ? 10 : 12) : nothing}`;
      })}
    </table>`;
  }

  /** On a narrow screen the selected row opens: what its hidden columns say. */
  private details(t: Translate, r: Row, columns: number) {
    const sectors = r.sectors.map((s, i) => html`<span>S${i + 1} ${this.timed(s)}</span>`);
    return html`<tr class="details"><td colspan=${columns}>
      <div><b>${r.name ?? r.tla}</b>${r.team ? html` · ${r.team}` : nothing}</div>
      <div class="facts">
        ${r.interval ? html`<span>${t("live.int")} <span class="t">${r.interval}</span></span>` : nothing}
        ${r.best_lap ? html`<span>${t("live.best")} <span class="t">${r.best_lap.time}</span></span>` : nothing}
        ${sectors}
        <span>${t("live.pits")} ${r.pit_stops}</span>
      </div>
    </td></tr>`;
  }

  private tla(number: string | null): string {
    return this.view?.tower?.find((r) => r.number === number)?.tla ?? number ?? "";
  }

  private colour(number: string | null): string {
    return this.view?.tower?.find((r) => r.number === number)?.colour ?? "var(--divider-color)";
  }

  private renderMap(t: Translate, v: LiveView) {
    const head = html`<div class="card-head">${t("live.map")}</div>`;
    if (!v.map_available) {
      const admin = this.settings?.is_admin;
      const reason = v.map_reason ?? "not_configured";
      const message =
        reason === "no_data"
          ? t("live.mapNoData")
          : !admin
            ? t("live.mapNotEnabled")
            : reason === "token_problem"
              ? t("live.mapToken")
              : t("live.mapLocked");
      return html`<div class="card">${head}<div class="locked">${icon(ICON.lock, 36)}
        <div>${message}</div></div></div>`;
    }
    const m = this.map;
    if (!m?.outline) {
      return html`<div class="card">${head}<div class="locked">${t("live.mapDrawing")}</div></div>`;
    }
    const o = m.outline;
    const d = o.points.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ") + "Z";
    // The selected car is drawn last, on top; keys keep each dot on its own car.
    const cars = [
      ...m.cars.filter((c) => c.number !== this.selected),
      ...m.cars.filter((c) => c.number === this.selected),
    ];
    return html`<div class="card map">${head}
      <svg viewBox="0 0 ${o.width} ${o.height}" role="img" aria-label=${t("live.map")}>
        <path class="track" d=${d}></path><path class="track-line" d=${d}></path>
        ${repeat(cars, (c) => c.number, (c) => {
          const sel = c.number === this.selected;
          const pick = () => this.select(c.number);
          return svg`<g class="car" style="transform:translate(${c.x}px,${c.y}px)" @click=${pick}
              @keydown=${onKey(pick)} tabindex="0" role="button" aria-label=${this.tla(c.number)}>
            <circle r=${sel ? 17 : 12} fill=${this.colour(c.number)} stroke=${sel ? "var(--primary-text-color)" : "var(--card-background-color)"} stroke-width="4"
              opacity=${c.on_track ? 1 : 0.4}></circle>
            <text x="16" y="-12">${this.tla(c.number)}</text></g>`;
        })}
      </svg></div>`;
  }

  private renderRaceControl(t: Translate, messages: Message[]) {
    const want = FILTER_KIND[this.filter];
    const shown = messages.filter((m) => !want || m.kind === want);
    return html`<div class="card">
      <div class="card-head">${t("live.raceControl")}</div>
      <div class="filters">${Object.keys(FILTER_KIND).map(
        (k) => html`<button class="chip small ${this.filter === k ? "on" : ""}" @click=${() => (this.filter = k)}>${t(`live.${k}`)}</button>`,
      )}</div>
      <div class="feed">${shown.map(
        (m) => html`<div class="msg ${m.kind}"><span class="lap num">${m.lap ? `${t("common.lap")} ${m.lap}` : ""}</span>
          <span>${m.message}<time>${clockTime(this.hass, m.utc)}</time></span></div>`,
      )}</div>
    </div>`;
  }

  private renderRadio(t: Translate, v: LiveView) {
    const clips = v.radio ?? [];
    return html`<div class="card">
      <div class="card-head">${t("live.radio")}</div>
      ${clips.length
        ? html`<div class="feed short">${clips.map(
            (c) => html`<div class="radio ${c.number === this.selected ? "sel" : ""}">
              <button class="play" @click=${() => this.play(c.url)}
                aria-label=${t(this.playing === c.url ? "live.pause" : "live.play", { driver: this.tla(c.number), time: clockTime(this.hass, c.utc) })}>${icon(this.playing === c.url ? ICON.pause : ICON.play, 18)}</button>
              <span class="bar" style="background:${this.colour(c.number)}"></span><b>${this.tla(c.number)}</b>
              <time>${clockTime(this.hass, c.utc)}</time></div>`,
          )}</div>`
        : html`<div class="empty">${t("live.noRadio")}</div>`}
    </div>`;
  }

  private renderWeather(t: Translate, v: LiveView) {
    const w = v.weather;
    if (!w) return nothing;
    const arrow = w.wind_direction === null ? "" : html`<span class="wind" style="transform:rotate(${w.wind_direction + 180}deg)">↑</span>`;
    return html`<div class="card">
      <div class="card-head">${t("live.weather")}</div>
      <div class="weather">
        <div><small>${t("live.air")}</small><b class="num">${number(this.hass, w.air)}°</b></div>
        <div><small>${t("live.track")}</small><b class="num">${number(this.hass, w.track)}°</b></div>
        <div><small>${t("live.rain")}</small><b>${w.rain ? t("live.wet") : t("live.dry")}</b></div>
        <div><small>${t("live.humidity")}</small><b class="num">${number(this.hass, w.humidity, 0)}%</b></div>
        <div><small>${t("live.wind")}</small><b class="num">${t("live.windSpeed", { n: number(this.hass, w.wind_speed) })} ${arrow}</b></div>
        <div><small>${t("live.pressure")}</small><b class="num">${number(this.hass, w.pressure, 0)}</b></div>
      </div>
    </div>`;
  }

  private renderPits(t: Translate, v: LiveView) {
    const pits = v.pits ?? [];
    return html`<div class="card">
      <div class="card-head">${t("live.pitStops")}<span class="spacer"></span><small>${t("live.pitLane")}</small></div>
      ${pits.length
        ? html`<div class="feed short pits">${pits.map(
            (p) => html`<div><span class="bar" style="background:${this.colour(p.number)}"></span><b>${this.tla(p.number)}</b>
              <span>${t("common.lap")} ${p.lap}</span><span class="num end">${t("delay.seconds", { n: p.duration })}</span></div>`,
          )}</div>`
        : html`<div class="empty">${t("live.noPits")}</div>`}
    </div>`;
  }

  static override styles = [
    tokens,
    css`
      :host { display: block; }
      .strip { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; padding: 14px 18px; margin-bottom: var(--plb-gap); }
      .strip h1 { margin: 0; font-size: 20px; font-weight: 500; }
      .sub { color: var(--secondary-text-color); font-size: 13px; }
      .laps { font-size: 26px; font-weight: 600; }
      .laps small { font-size: 14px; color: var(--secondary-text-color); font-weight: 400; }
      .age { color: var(--secondary-text-color); font-size: 12px; }
      .status-pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 13px; letter-spacing: 0.04em; }
      .status-pill::before { content: ""; width: 10px; height: 10px; border-radius: 50%; background: currentColor; }
      .st-clear { background: color-mix(in srgb, var(--plb-green) 16%, transparent); color: var(--plb-green); }
      .st-yellow { background: color-mix(in srgb, var(--plb-yellow) 22%, transparent); color: #a07d00; }
      .st-sc { background: #f2c200; color: #1a1a1a; }
      .st-red { background: var(--error-color, #db4437); color: #fff; }
      .st-chequered { background: repeating-conic-gradient(#222 0 25%, #fff 0 50%) 0 0 / 12px 12px; color: #111; text-shadow: 0 0 3px #fff; }
      .banner { display: flex; align-items: center; gap: 10px; padding: 10px 16px; margin-bottom: var(--plb-gap); border-radius: 10px; font-size: 14px;
        background: color-mix(in srgb, var(--warning-color, #ffa600) 16%, transparent); }
      .banner.lost { background: color-mix(in srgb, var(--error-color, #db4437) 16%, transparent); }
      .dim { opacity: 0.45; filter: grayscale(0.6); }
      .grid { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: var(--plb-gap); align-items: start; }
      .col { display: grid; gap: var(--plb-gap); align-content: start; min-width: 0; }
      .pair { display: grid; grid-template-columns: 1fr 1fr; gap: var(--plb-gap); align-items: start; }
      .tower { width: 100%; border-collapse: collapse; font-size: 14px; }
      .tower th { text-align: left; font-weight: 500; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--secondary-text-color); padding: 8px 6px; border-bottom: 1px solid var(--divider-color); white-space: nowrap; }
      .tower td { padding: 0 6px; height: 40px; border-bottom: 1px solid var(--divider-color); white-space: nowrap; cursor: pointer; }
      .tower tr:nth-child(odd) td { background: var(--plb-row-alt); }
      .tower tr.sel td { background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
      .tower tr.out td { color: var(--plb-muted); }
      .tower tr.zone td { border-bottom: 2px dashed var(--error-color, #db4437); }
      .tower tr:focus-visible td { outline: 2px solid var(--primary-color); outline-offset: -2px; }
      .tower tr.details td { height: auto; padding: 8px 12px; white-space: normal; cursor: default; font-size: 13px;
        background: color-mix(in srgb, var(--primary-color) 6%, transparent); }
      .tower tr.details .facts { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 4px; color: var(--secondary-text-color); }
      .tower tr.details { display: none; }
      @media (max-width: 900px) { .tower tr.details { display: table-row; } }
      .pos { width: 34px; text-align: center; font-weight: 600; font-size: 15px; }
      .tower .drv { min-width: 100px; }
      .tower .drv small { color: var(--secondary-text-color); font-size: 11px; }
      .sector { display: inline-block; min-width: 46px; }
      .map svg { display: block; width: 100%; height: auto; }
      .track { fill: none; stroke: var(--secondary-background-color); stroke-width: 18; stroke-linejoin: round; }
      .track-line { fill: none; stroke: var(--secondary-text-color); stroke-width: 3; opacity: 0.5; }
      .car { transition: transform 0.25s linear; cursor: pointer; }
      .car text { font-size: 20px; font-weight: 700; fill: var(--primary-text-color); paint-order: stroke; stroke: var(--card-background-color); stroke-width: 5px; }
      .locked { padding: 20px 16px; color: var(--secondary-text-color); font-size: 13px; line-height: 1.5; display: grid; gap: 10px; justify-items: start; }
      .locked svg { opacity: 0.6; }
      .filters { display: flex; gap: 6px; padding: 8px 16px; border-bottom: 1px solid var(--divider-color); flex-wrap: wrap; }
      .feed { max-height: 340px; overflow: auto; }
      .feed.short { max-height: 260px; }
      .msg { display: grid; grid-template-columns: 56px 1fr; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--divider-color); font-size: 13px; }
      .msg .lap { color: var(--secondary-text-color); font-size: 12px; }
      .msg.flag { box-shadow: inset 3px 0 var(--plb-yellow); }
      .msg.penalty { box-shadow: inset 3px 0 var(--error-color, #db4437); }
      .msg time { display: block; color: var(--secondary-text-color); font-size: 11px; margin-top: 2px; }
      .radio { display: flex; align-items: center; gap: 10px; padding: 8px 16px; border-bottom: 1px solid var(--divider-color); font-size: 13px; }
      .radio.sel { background: color-mix(in srgb, var(--primary-color) 10%, transparent); }
      .play { width: 32px; height: 32px; border-radius: 50%; border: 0; background: var(--primary-color); color: #fff; cursor: pointer; display: grid; place-items: center; flex: none; }
      .radio time { margin-left: auto; color: var(--secondary-text-color); font-size: 12px; }
      .weather { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 12px 16px; }
      .weather div { display: grid; gap: 2px; }
      .weather small { color: var(--secondary-text-color); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
      .weather b { font-size: 18px; font-weight: 500; }
      .wind { display: inline-block; }
      .pits div { display: flex; align-items: center; gap: 10px; padding: 7px 16px; border-bottom: 1px solid var(--divider-color); font-size: 13px; }
      .pits .end { margin-left: auto; }
      .empty { padding: 14px 16px; color: var(--secondary-text-color); font-size: 13px; }
      @media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
      @media (max-width: 900px) { .col-s { display: none; } }
      @media (max-width: 640px) {
        .col-best, .col-int, .col-pits, .tower .drv small { display: none; }
        .tower td, .tower th { padding: 0 4px; }
        .tower td { height: 44px; }
        .pos { width: 26px; }
        .pair { grid-template-columns: 1fr; }
        .strip { padding: 12px 14px; }
      }
    `,
  ];
}
