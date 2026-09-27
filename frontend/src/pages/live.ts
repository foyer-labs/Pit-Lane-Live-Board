// Live (SPEC §7.1): the session strip, flags & stewards, the timing tower, and around
// it race control, team radio, weather, pit stops and the track map. Everything the
// page shows was released by the backend through the TV delay; stale data says so
// (INV-2). Between sessions it shows the last session's final state, frozen.
//
// The backend sends the whole view once, then only the sections that changed: they
// are merged here, keeping the identity of what did not change, and each section of
// the page is guarded by what it shows, so a message that only ages the data redraws
// nothing. The map and the ticking clocks are their own elements, so neither
// redraws the page. While the tab is hidden nothing is drawn: the newest view is
// kept and drawn once on return.
import { LitElement, css, html, nothing } from "lit";
import { guard } from "lit/directives/guard.js";
import { repeat } from "lit/directives/repeat.js";
import { api } from "../api";
import { ageLabel } from "../clock";
import { clockTime, hassChanged, number, sessionClock, sessionTime, shortTime } from "../format";
import { translator, type Translate } from "../i18n";
import { ICON, icon } from "../icons";
import { mergeLive } from "../merge";
import { alsoTime, failure, gained, gapText, onKey, segmentStrip, sessionName, tyre } from "../parts";
import { feedStyles, tokens } from "../styles";
import type { Hass, LiveView, Message, NextSession, Row, Settings, Timed } from "../types";
import { pillStyles, stewardsCard, stewardsStyles } from "./stewards";

const FILTER_KIND: Record<string, string | null> = { all: null, flags: "flag", penalties: "penalty", other: "other" };
const BOARD_STATES = new Set(["live", "stale", "lost", "final"]);
const RACES = new Set(["race", "sprint"]);

export class PlbLive extends LitElement {
  static override properties = {
    hass: { attribute: false, hasChanged: hassChanged },
    settings: { attribute: false },
    kiosk: { type: Boolean, reflect: true },
    clock: { attribute: false },
    view: { state: true },
    selected: { state: true },
    filter: { state: true },
    playing: { state: true },
    failed: { state: true },
    starting: { state: true },
    stewardsOpen: { state: true },
  };

  hass!: Hass;
  settings!: Settings;
  /** On a TV (kiosk mode): tighter rows and the one-line stewards strip. */
  kiosk = false;
  /** Bumped by the panel when the user picks another clock for the times. */
  clock = 0;
  view?: LiveView;
  selected = "";
  filter = "all";
  playing = "";
  failed = false;
  starting = false;
  stewardsOpen = false;
  private unsubscribe?: () => void;
  private subscribing = false;
  private retry?: number;
  // When the current view arrived: while the feed is quiet, the data keeps ageing.
  private receivedAt = Date.now();
  private audio?: HTMLAudioElement;
  // The tower by racing number, rebuilt only when the tower changes.
  private byNumber = new Map<string, Row>();
  private byNumberOf?: Row[];
  private readonly visibility = () => {
    if (document.visibilityState === "visible") this.requestUpdate();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("visibilitychange", this.visibility);
    // Back on the page (the panel keeps it while another is shown): subscribe
    // again, even though no property changed.
    if (this.hasUpdated) this.requestUpdate();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("visibilitychange", this.visibility);
    window.clearTimeout(this.retry);
    this.retry = undefined;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.stopAudio();
  }

  /** Nothing is drawn in a hidden tab; the view keeps arriving and is drawn on
   *  return (the visibility listener asks for it). */
  protected override shouldUpdate(): boolean {
    return document.visibilityState !== "hidden" || !this.hasUpdated;
  }

  protected override willUpdate(): void {
    if (this.hass && !this.unsubscribe && !this.subscribing && this.retry === undefined) {
      void this.subscribe();
    }
  }

  private async subscribe(): Promise<void> {
    this.subscribing = true;
    try {
      const unsubscribe = await api.subscribeLive(this.hass, (message) => this.receive(message));
      // Left the page while subscribing: do not leave a subscription behind.
      if (!this.isConnected) {
        unsubscribe();
        return;
      }
      this.unsubscribe = unsubscribe;
      this.failed = false;
    } catch {
      if (!this.isConnected) return;
      this.failed = true;
      this.retry = window.setTimeout(() => {
        this.retry = undefined;
        this.requestUpdate();
      }, 10_000);
    } finally {
      this.subscribing = false;
    }
  }

  /** A full view replaces; a partial one carries the sections that changed. */
  private receive(message: LiveView): void {
    this.view = mergeLive(this.view, message);
    this.receivedAt = Date.now();
  }

  private select(number: string): void {
    this.selected = this.selected === number ? "" : number;
  }

  private async start(): Promise<void> {
    this.starting = true;
    try {
      await api.setSettings(this.hass, { live: true });
    } catch {
      /* the page keeps saying it is paused */
    } finally {
      this.starting = false;
    }
  }

  private play(url: string): void {
    if (this.playing === url) {
      this.stopAudio();
      return;
    }
    this.stopAudio();
    // The browser plays F1's clip directly (decision 17). Each listener checks it
    // still belongs to the clip playing: a late "ended" never stops the next one.
    const audio = new Audio(url);
    this.audio = audio;
    const done = () => {
      if (this.audio === audio) this.stopAudio();
    };
    audio.addEventListener("ended", done);
    audio.addEventListener("error", done);
    void audio.play().catch(done);
    this.playing = url;
  }

  private stopAudio(): void {
    const audio = this.audio;
    this.audio = undefined;
    this.playing = "";
    if (audio) {
      audio.pause();
      audio.removeAttribute("src"); // releases the download
      audio.load();
    }
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
    if (BOARD_STATES.has(v.state)) return this.renderBoard(t, v);
    switch (v.state) {
      case "hidden":
        return html`<div class="card state">${icon(ICON.eyeOff, 56)}<h2>${t("live.hidden")}</h2>
          <div>${t("live.hiddenHelp", { meeting: v.header?.meeting ?? "", session: sessionName(t, v.header?.kind, v.header?.session) })}</div>
          <button class="btn" @click=${() => this.dispatchEvent(new CustomEvent("plb-spoiler-off", { bubbles: true, composed: true }))}>${t("live.showAll")}</button></div>`;
      case "syncing":
        return html`<div class="card state">${icon(ICON.clock, 56)}<h2>${t("live.syncing")}</h2>
          <div>${t("live.syncingHelp", { n: v.delay })}</div></div>`;
      case "connecting":
        return html`<div class="card state"><span class="spin">${icon(ICON.timer, 56)}</span><h2>${t("live.connecting")}</h2></div>`;
      case "paused":
        return this.renderPaused(t, v);
      default:
        return this.renderIdle(t, v);
    }
  }

  private nextBlock(t: Translate, next: NextSession | null) {
    if (!next) return html`<div>${t("live.noNext")}</div>`;
    return html`<div>${t("live.next", { meeting: next.meeting, session: t(`sessions.${next.kind}`) })}</div>
      ${next.start
        ? html`<div class="starts">${t("live.startsIn")}</div>
            <div class="big num"><plb-countdown .to=${next.start}></plb-countdown></div>
            <div>${sessionTime(this.hass, next.start, next.date, next.timezone)}
              ${alsoTime(t, this.hass, next.start, next.timezone)}</div>`
        : nothing}`;
  }

  private playButton(t: Translate) {
    return html`<button class="btn play-live" ?disabled=${this.starting} @click=${() => this.start()}>
      ${icon(ICON.play, 18)}${t("settings.start")}</button>`;
  }

  private renderPaused(t: Translate, v: LiveView) {
    return html`<div class="card state">${icon(ICON.pause, 56)}<h2>${t("live.paused")}</h2>
      <div>${t("live.pausedHelp")}</div>
      ${this.playButton(t)}
      ${v.auto_start ? html`<div class="muted">${t("live.autoStart")}</div>` : nothing}
      <div class="next">${this.nextBlock(t, v.next_session)}</div>
    </div>`;
  }

  private renderIdle(t: Translate, v: LiveView) {
    return html`<div class="card state">${icon(ICON.timer, 56)}<h2>${t("live.idle")}</h2>
      ${this.nextBlock(t, v.next_session)}
    </div>`;
  }

  /** The right of the strip: the data's age while live; the next session after. */
  private stripEnd(t: Translate, v: LiveView) {
    if (v.state !== "final") {
      return html`<span class="age">${ageLabel(this.hass, v.data_age ?? 0, this.receivedAt, v.state === "live")}</span>`;
    }
    const next = v.next_session;
    if (!next) return nothing;
    return html`<div class="next-slot">
      <small>${t("live.nextShort")}</small>
      <b>${next.meeting} · ${t(`sessions.${next.kind}`)}</b>
      ${next.start ? html`<span class="num"><plb-countdown .to=${next.start}></plb-countdown></span>` : nothing}
    </div>`;
  }

  private stripStart(t: Translate, v: LiveView) {
    const h = v.header;
    const final = v.state === "final";
    const qualifying = h?.kind === "qualifying" || h?.kind === "sprint_qualifying";
    return html`<div><h1>${h?.meeting ?? ""}</h1><div class="sub">${sessionName(t, h?.kind, h?.session)}${h?.circuit ? ` · ${h.circuit}` : ""}</div></div>
      ${qualifying && h?.part
        ? html`<div class="laps num">Q${h.part}${!final && h.remaining !== null ? html`<small> · ${sessionClock(h.remaining)} ${t("live.remaining")}</small>` : nothing}</div>`
        : h?.lap
          ? html`<div class="laps num">${t("common.lap")} ${h.lap}${h.total_laps ? html`<small> / ${h.total_laps}</small>` : nothing}</div>`
          : !final && h?.remaining !== null && h?.remaining !== undefined
            ? html`<div class="laps num">${sessionClock(h.remaining)} <small>${t("live.remaining")}</small></div>`
            : nothing}
      ${final
        ? html`<span class="final-pill">${t("live.final")}</span>
            <span class="sub">${t("live.ended", { time: shortTime(this.hass, v.ended) })}</span>`
        : nothing}
      ${final && v.paused ? html`<span class="paused-pill">${t("live.pausedShort")}</span>${this.playButton(t)}` : nothing}`;
  }

  private renderBoard(t: Translate, v: LiveView) {
    const h = v.header;
    const final = v.state === "final";
    const banner =
      v.state === "stale"
        ? html`<div class="banner">${icon(ICON.alert)}${t("live.stale", { n: Math.round(v.data_age ?? 0) })}</div>`
        : v.state === "lost"
          ? html`<div class="banner lost">${icon(ICON.alert)}${t("live.lost")}</div>`
          : nothing;
    const qualifying = h?.kind === "qualifying" || h?.kind === "sprint_qualifying";
    const live = v.state === "live" || v.state === "stale";
    const hass = this.hass;
    const tower = v.tower ?? [];
    const favourites = this.settings?.favourites;
    // Each section is drawn again only when what it shows changed.
    return html`${banner}
      <div class="card strip">
        ${guard([hass, this.clock, h, v.state, v.ended, v.paused, this.starting], () => this.stripStart(t, v))}
        <span class="spacer"></span>
        ${this.stripEnd(t, v)}
      </div>
      ${guard([hass, this.clock, v.stewards, h?.track_status, this.stewardsOpen, final], () =>
        stewardsCard(t, v.stewards, h?.track_status, this.stewardsOpen, () => (this.stewardsOpen = !this.stewardsOpen), final),
      )}
      <div class="grid ${v.state === "lost" ? "dim" : ""}">
        <div class="col">
          <div class="card scroll">${guard([hass, this.clock, tower, qualifying, h?.part, this.selected, favourites], () =>
            this.renderTower(t, tower, qualifying),
          )}</div>
          ${guard([hass, this.clock, v.weather, v.pits, tower, h?.kind], () => html`<div class="pair">${this.renderWeather(t, v)}${this.renderPits(t, v)}</div>`)}
        </div>
        <div class="col">
          ${final ? nothing : guard([hass, this.clock, v.map_available, v.map_reason, live, tower, this.selected, this.settings?.is_admin], () => this.renderMap(t, v, live))}
          ${guard([hass, this.clock, v.race_control, this.filter], () => this.renderRaceControl(t, v.race_control ?? []))}
          ${guard([hass, this.clock, v.radio, this.playing, this.selected, tower], () => this.renderRadio(t, v))}
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
      <thead><tr>
        <th class="pos">${t("common.pos")}</th><th>${t("common.driver")}</th>
        ${qualifying
          ? html`${[1, 2, 3].map((p) => html`<th class=${p === part ? "" : "col-s"}>Q${p}</th>`)}<th>${t("live.gap")}</th>`
          : html`<th class="col-gain"></th><th>${t("live.gap")}</th><th class="col-int">${t("live.int")}</th><th class="col-last">${t("live.last")}</th><th class="col-best">${t("live.best")}</th>`}
        <th class="col-s">S1</th><th class="col-s">S2</th><th class="col-s">S3</th>
        <th>${t("live.tyre")}</th>${qualifying ? nothing : html`<th class="col-pits">${t("live.pits")}</th>`}
      </tr></thead>
      ${repeat(
        rows,
        (r) => r.number,
        (r, i) => html`<tbody>${this.row(t, r, i, qualifying, part, i === cutoffAfter - 1)}</tbody>`,
      )}
    </table>`;
  }

  private row(t: Translate, r: Row, i: number, qualifying: boolean, part: number, zone: boolean) {
    const out = r.status === "retired" || r.status === "knocked_out";
    const selected = r.number === this.selected;
    const classes = [selected ? "sel" : "", out ? "out" : "", zone ? "zone" : "", i % 2 ? "" : "alt"].join(" ");
    const q = r.qualifying;
    const pick = () => this.select(r.number);
    return html`<tr class=${classes} tabindex="0" aria-selected=${selected ? "true" : "false"}
        @click=${pick} @keydown=${onKey(pick)}>
      <td class="pos num">${r.position ?? "—"}</td>
      <td><div class="drv"><span class="bar" style="background:${r.colour ?? "var(--divider-color)"}"></span>
        ${this.settings?.favourites?.includes(r.tla) ? html`<span class="fav" title=${t("drivers.followed")}>★</span>` : nothing}
        <span class="tla" title=${r.name ?? ""}>${r.tla}</span><small>${r.number}</small>
        ${r.penalty ? html`<span class="badge pen" title=${t("stewards.unserved")}>+${r.penalty}s</span>` : nothing}
        ${this.badge(t, r)}
        ${r.status === "knocked_out" ? html`<span class="badge ko">${t("live.ko")}</span>` : nothing}</div></td>
      ${qualifying && q
        ? html`${[0, 1, 2].map(
              (p) => html`<td class="t ${p + 1 === part ? "" : "col-s muted"}">${q.part_bests[p] ?? ""}</td>`,
            )}<td class="t">${q.gap ?? ""}</td>`
        : html`<td class="col-gain">${gained(r.gained)}</td><td class="t">${gapText(t, r.gap)}</td><td class="t col-int">${gapText(t, r.interval, true)}</td>
            <td class="col-last">${this.timed(r.last_lap)}</td>
            <td class="col-best">${r.best_lap ? html`<span class="t">${r.best_lap.time}</span>` : ""}</td>`}
      ${r.sectors.map(
        (s, i) => html`<td class="col-s">${this.timed(s, "sector")}${segmentStrip(r.segments?.[i])}</td>`,
      )}
      <td>${r.tyre ? tyre(t, r.tyre.compound, r.tyre.new, r.tyre.age) : ""}</td>
      ${qualifying ? nothing : html`<td class="num col-pits">${r.pit_stops}</td>`}
    </tr>
    ${selected ? this.details(t, r, qualifying ? 10 : 12) : nothing}`;
  }

  /** The selected row opens: the driver's stints with the best lap of each, where
   *  a stop now would bring them back out, and on a narrow screen what its hidden
   *  columns say. */
  private details(t: Translate, r: Row, columns: number) {
    const sectors = r.sectors.map((s, i) => html`<span>S${i + 1} ${this.timed(s)}</span>`);
    const stints = r.stints ?? [];
    const rejoin = r.pit_rejoin;
    return html`<tr class="details"><td colspan=${columns}><div class="dwrap">
      <div class="dhead"><b>${r.name ?? r.tla}</b>${r.team ? html` · ${r.team}` : nothing}</div>
      <div class="facts narrow">
        ${r.interval ? html`<span>${t("live.int")} <span class="t">${gapText(t, r.interval, true) || "—"}</span></span>` : nothing}
        ${r.best_lap ? html`<span>${t("live.best")} <span class="t">${r.best_lap.time}</span></span>` : nothing}
        ${sectors}
        <span>${t("live.pits")} ${r.pit_stops}</span>
      </div>
      ${stints.length
        ? html`<table class="stints">
            <tr><th>${t("drivers.stint")}</th><th>${t("live.tyre")}</th><th>${t("drivers.laps")}</th><th>${t("drivers.bestInStint")}</th></tr>
            ${stints.map(
              (s, i) => html`<tr>
                <td class="num">${i + 1}</td>
                <td>${tyre(t, s.compound, s.new, null)}</td>
                <td class="num">${s.to_lap && s.to_lap !== s.from_lap
                  ? t("drivers.lapRange", { from: s.from_lap, to: s.to_lap })
                  : t("drivers.fromLap", { from: s.from_lap })}
                  <small class="muted">(${s.laps})</small></td>
                <td>${s.best ? html`<span class="t">${s.best.time}</span>${s.best.lap ? html` <small class="muted">${t("drivers.onLap", { lap: s.best.lap })}</small>` : nothing}` : "—"}</td>
              </tr>`,
            )}
          </table>`
        : nothing}
      ${rejoin
        ? html`<div class="rejoin">${icon(ICON.timer, 16)}
            <span>${t("drivers.rejoin", { position: rejoin.position })}${rejoin.ahead
              ? html` · ${t("drivers.behindOf", { driver: rejoin.ahead, gap: number(this.hass, rejoin.ahead_gap, 1) })}`
              : nothing}${rejoin.behind
              ? html` · ${t("drivers.aheadOf", { driver: rejoin.behind, gap: number(this.hass, rejoin.behind_gap, 1) })}`
              : nothing}
              <small class="muted">${t(rejoin.known ? "drivers.lossCircuit" : "drivers.lossGeneric", { loss: number(this.hass, rejoin.loss, 1) })}${rejoin.pitting
                ? ` ${t("drivers.pitting", { n: rejoin.pitting })}`
                : ""}</small></span>
          </div>`
        : nothing}
    </div></td></tr>`;
  }

  private driver(number: string | null): Row | undefined {
    const tower = this.view?.tower;
    if (tower !== this.byNumberOf) {
      this.byNumberOf = tower;
      this.byNumber = new Map((tower ?? []).map((r) => [r.number, r]));
    }
    return number === null ? undefined : this.byNumber.get(number);
  }

  private renderMap(t: Translate, v: LiveView, live: boolean) {
    const head = html`<div class="card-head">${t("live.map")}</div>`;
    if (!v.map_available || !live) {
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
      return html`<div class="card">${head}<div class="locked">${icon(ICON.lock, 36)}<div>${message}</div></div></div>`;
    }
    return html`<div class="card">${head}
      <plb-live-map .hass=${this.hass} .tower=${v.tower ?? []} .selected=${this.selected}
        .favourites=${this.settings?.favourites ?? []}
        @plb-select=${(e: CustomEvent<string>) => this.select(e.detail)}></plb-live-map></div>`;
  }

  private renderRaceControl(t: Translate, messages: Message[]) {
    const want = FILTER_KIND[this.filter];
    const shown = messages.filter((m) => !want || m.kind === want);
    // Practice and qualifying messages have no lap: the time takes its place.
    return html`<div class="card">
      <div class="card-head">${t("live.raceControl")}</div>
      <div class="filters">${Object.keys(FILTER_KIND).map(
        (k) => html`<button class="chip small ${this.filter === k ? "on" : ""}" aria-pressed=${this.filter === k ? "true" : "false"}
          @click=${() => (this.filter = k)}>${t(`live.${k}`)}</button>`,
      )}</div>
      <div class="feed">${repeat(
        shown,
        (m) => `${m.utc}|${m.message}`,
        (m) => html`<div class="msg ${m.kind}"><span class="lap num">${m.lap ? `${t("common.lap")} ${m.lap}` : clockTime(this.hass, m.utc, true)}</span>
          <span>${m.message}${m.lap ? html`<time>${clockTime(this.hass, m.utc)}</time>` : nothing}</span></div>`,
      )}</div>
    </div>`;
  }

  private renderRadio(t: Translate, v: LiveView) {
    const clips = v.radio ?? [];
    return html`<div class="card">
      <div class="card-head">${t("live.radio")}</div>
      ${clips.length
        ? html`<div class="feed short">${repeat(
            clips,
            (c) => c.url,
            (c) => {
              const who = this.driver(c.number);
              const on = this.playing === c.url;
              const time = clockTime(this.hass, c.utc);
              return html`<div class="radio ${c.number === this.selected ? "sel" : ""}">
                <button class="play" @click=${() => this.play(c.url)}
                  aria-label=${t(on ? "live.pause" : "live.play", { driver: who?.tla ?? c.number ?? "", time })}>${icon(on ? ICON.pause : ICON.play, 18)}</button>
                <span class="bar" style="background:${who?.colour ?? "var(--divider-color)"}"></span><b>${who?.tla ?? c.number}</b>
                <time>${time}</time></div>`;
            },
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
    // Outside races the pit lane times are time spent in the garage: meaningless.
    if (!RACES.has(v.header?.kind ?? "")) return nothing;
    const pits = v.pits ?? [];
    return html`<div class="card">
      <div class="card-head">${t("live.pitStops")}<span class="spacer"></span><small>${t("live.pitLane")}</small></div>
      ${pits.length
        ? html`<div class="feed short pits">${repeat(
            pits,
            (p) => `${p.number}|${p.lap}`,
            (p) => {
              const who = this.driver(p.number);
              return html`<div><span class="bar" style="background:${who?.colour ?? "var(--divider-color)"}"></span><b>${who?.tla ?? p.number}</b>
                <span>${t("common.lap")} ${p.lap}</span><span class="num end">${t("delay.seconds", { n: p.duration })}</span></div>`;
            },
          )}</div>`
        : html`<div class="empty">${t("live.noPits")}</div>`}
    </div>`;
  }

  static override styles = [
    tokens,
    pillStyles,
    stewardsStyles,
    feedStyles,
    css`
      /* Sized by the panel's own width, not the window's: Home Assistant's sidebar
         takes a varying part of the window. */
      :host { display: block; container-type: inline-size; }
      .strip { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; padding: 14px 18px; margin-bottom: var(--plb-gap); }
      .strip h1 { margin: 0; font-size: 20px; font-weight: 500; }
      .sub { color: var(--secondary-text-color); font-size: 13px; }
      .laps { font-size: 26px; font-weight: 600; }
      .laps small { font-size: 14px; color: var(--secondary-text-color); font-weight: 400; }
      .age { color: var(--secondary-text-color); font-size: 12px; }
      .next-slot { display: grid; gap: 2px; text-align: right; font-size: 13px; }
      .next-slot small { color: var(--secondary-text-color); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
      .next-slot .num { font-size: 18px; font-weight: 500; }
      .final-pill, .paused-pill { display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px; border-radius: 8px;
        font-weight: 600; font-size: 12px; letter-spacing: 0.06em; background: var(--secondary-background-color); color: var(--primary-text-color); }
      .final-pill::before { content: ""; width: 12px; height: 12px; border-radius: 2px;
        background: repeating-conic-gradient(#222 0 25%, #fff 0 50%) 0 0 / 6px 6px; box-shadow: 0 0 0 1px var(--divider-color); }
      .paused-pill { background: none; border: 1px dashed var(--divider-color); color: var(--secondary-text-color); }
      .play-live { display: inline-flex; align-items: center; gap: 6px; }
      .state .play-live svg { width: 18px; height: 18px; opacity: 1; }
      .state .next { display: grid; gap: 8px; justify-items: center; margin-top: 12px; }
      .state .starts { margin-bottom: -10px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
      .spin { display: grid; }
      .spin svg { animation: plb-spin 1.6s linear infinite; }
      @keyframes plb-spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { .spin svg { animation: none; } }
      .banner { display: flex; align-items: center; gap: 10px; padding: 10px 16px; margin-bottom: var(--plb-gap); border-radius: 10px; font-size: 14px;
        background: color-mix(in srgb, var(--warning-color, #ffa600) 16%, transparent); }
      .banner.lost { background: color-mix(in srgb, var(--error-color, #db4437) 16%, transparent); }
      .dim { opacity: 0.45; filter: grayscale(0.6); }
      .grid { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: var(--plb-gap); align-items: start; }
      .col { display: grid; gap: var(--plb-gap); align-content: start; min-width: 0; }
      .pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--plb-gap); align-items: start; }
      .pair:empty { display: none; }
      .tower { width: 100%; border-collapse: collapse; font-size: 14px; }
      .tower th { text-align: left; font-weight: 500; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--secondary-text-color); padding: 8px 6px; border-bottom: 1px solid var(--divider-color); white-space: nowrap; }
      .tower td { padding: 0 6px; height: 40px; border-bottom: 1px solid var(--divider-color); white-space: nowrap; cursor: pointer; }
      .tower tr.alt td { background: var(--plb-row-alt); }
      .tower tr.sel td { background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
      .tower tr.out td { color: var(--plb-muted); }
      .tower tr.zone td { border-bottom: 2px dashed var(--error-color, #db4437); }
      .tower tr:focus-visible td { outline: 2px solid var(--primary-color); outline-offset: -2px; }
      .tower tr.details td { height: auto; padding: 10px 12px 12px; white-space: normal; cursor: default; font-size: 13px;
        background: color-mix(in srgb, var(--primary-text-color) 4%, transparent); }
      .tower .dwrap { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 32px; align-items: start; }
      .tower .dhead { grid-column: 1 / -1; }
      .tower .dwrap .stints { grid-column: 1; grid-row: 2 / span 2; }
      .tower .dwrap .rejoin { grid-column: 2; }
      .tower tr.details .facts { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 4px; color: var(--secondary-text-color); }
      .tower tr.details .narrow { display: none; }
      .tower .stints { border-collapse: collapse; margin-top: 4px; font-size: 13px; }
      .tower .stints th { font-size: 10px; padding: 2px 16px 2px 0; border: 0; }
      .tower tr.details .stints td { height: 30px; padding: 0 16px 0 0; border: 0; background: none; cursor: default; }
      .tower .rejoin { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 13px; }
      .tower .rejoin small { display: block; font-size: 11px; }
      .fav { color: #f2c200; font-size: 12px; }
      .seg { display: flex; gap: 1px; margin-top: 2px; }
      .seg i { flex: 1; height: 3px; min-width: 3px; border-radius: 1px; background: var(--divider-color); }
      .seg i.p { background: var(--plb-purple); }
      .seg i.g { background: var(--plb-green); }
      .seg i.y { background: var(--plb-yellow); }
      .seg i.pit { background: #1e88e5; }
      .seg i.o { background: var(--secondary-text-color); }
      .badge.pen { background: var(--error-color, #db4437); color: #fff; font-variant-numeric: tabular-nums; }
      .pos { width: 34px; text-align: center; font-weight: 600; font-size: 15px; }
      .tower .drv { min-width: 100px; }
      .tower .drv small { color: var(--secondary-text-color); font-size: 11px; }
      .sector { display: inline-block; min-width: 46px; }
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
      @media (pointer: coarse) {
        .play { width: 40px; height: 40px; }
      }
      /* A TV: 22 rows fit in 1080 lines, and the stewards card is one strip. */
      :host([kiosk]) .tower td { height: 32px; }
      :host([kiosk]) .tower th { padding: 4px 6px; }
      :host([kiosk]) .strip { padding: 8px 18px; margin-bottom: 10px; }
      :host([kiosk]) .grid, :host([kiosk]) .col { gap: 10px; }
      :host([kiosk]) .stewards { margin-bottom: 10px; }
      :host([kiosk]) .stewards .card-head { display: none; }
      :host([kiosk]) .stewards .compact { display: flex; }
      :host([kiosk]) .stewards .cols { display: none; }
      :host([kiosk]) .stewards.open .cols { display: grid; }
      @container (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
      @container (max-width: 900px) {
        .col-s { display: none; }
        .tower tr.details .narrow { display: flex; }
        .tower .dwrap { grid-template-columns: 1fr; }
        .tower .dwrap .stints, .tower .dwrap .rejoin { grid-column: 1; grid-row: auto; }
      }
      @container (max-width: 640px) {
        .col-best, .col-int, .col-pits, .tower .drv small { display: none; }
        .tower td, .tower th { padding: 0 4px; }
        .tower td { height: 44px; }
        .tower .drv { min-width: 0; gap: 6px; }
        .pos { width: 26px; }
        .strip { padding: 12px 14px; }
        .next-slot { width: 100%; text-align: left; }
      }
      /* A phone: position, driver, gap, last lap and tyre (SPEC §7). */
      @container (max-width: 480px) {
        .col-gain { display: none; }
        .tyre .used { display: none; }
        .tower { font-size: 13px; }
      }
    `,
  ];
}
