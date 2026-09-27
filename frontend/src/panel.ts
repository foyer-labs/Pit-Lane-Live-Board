// The sidebar panel (SPEC §7): app bar with the four pages, the TV-delay control,
// the no-spoiler switch, live timing's state and the settings behind the gear, and
// the footer with the non-affiliation notice (INV-6).
import { LitElement, css, html, nothing } from "lit";
import { cache } from "lit/directives/cache.js";
import { api } from "./api";
import { define } from "./define";
import { translator, type Translate } from "./i18n";
import { ICON, icon } from "./icons";
import { failure } from "./parts";
import { tokens } from "./styles";
import { TIME_PREFS_EVENT, loadTimePrefs } from "./timeprefs";
import type { Hass, Settings } from "./types";
import { PlbAge, PlbCountdown } from "./clock";
import { PlbCalendar } from "./pages/calendar";
import { PlbCircuit } from "./pages/circuit";
import { PlbLive } from "./pages/live";
import { PlbLiveMap } from "./pages/live-map";
import { PlbResults } from "./pages/results";
import { PlbSettings } from "./pages/settings";
import { PlbStandings } from "./pages/standings";

export type Page = "live" | "calendar" | "results" | "standings" | "settings" | "circuit";
// The tabs; Settings opens from the gear, not a fifth tab.
const PAGES: Page[] = ["live", "calendar", "results", "standings"];
// The pages an address or the last visit can open. A circuit's history is not
// among them: it needs the circuit it was opened for.
const ALL_PAGES: Page[] = [...PAGES, "settings"];
const STORAGE_KEY = "pit-lane-live-board-page";
const SEASONS_RETRY = 30_000;

/**
 * Kiosk mode (decision 55), from the address: `?kiosk` fills the screen with the
 * panel, over Home Assistant's sidebar and header, for a TV or a wall tablet;
 * `page=calendar` picks the page, `scale=1.3` makes everything bigger for a TV
 * seen from the sofa.
 */
// Read when the panel opens, not when the module loads: Home Assistant keeps the
// module between visits, and the address can change.
function query(): URLSearchParams {
  return new URLSearchParams(location.search);
}

function kioskFromAddress(): boolean {
  const q = query();
  return q.has("kiosk") && !["0", "false", "off", "no"].includes((q.get("kiosk") ?? "").toLowerCase());
}

function scale(): number {
  return Math.min(2.5, Math.max(0.6, Number(query().get("scale")) || 1));
}

function rememberedPage(): Page {
  const asked = query().get("page") as Page | null;
  if (asked && ALL_PAGES.includes(asked)) return asked;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Page | null;
    return saved && ALL_PAGES.includes(saved) ? saved : "live";
  } catch {
    return "live";
  }
}

export interface GoTo {
  page: Page;
  season?: number;
  round?: number;
  /** A circuit's history: Jolpica's circuit id and the name to show meanwhile. */
  circuit_id?: string;
  circuit?: string;
  /** The page Back returns to (the circuit page). */
  from?: Page;
}

type WakeLock = { release(): Promise<void> };

export class PitLaneLiveBoardPanel extends LitElement {
  static override properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
    page: { state: true },
    settings: { state: true },
    seasons: { state: true },
    delayOpen: { state: true },
    failed: { state: true },
    target: { state: true },
    clockVersion: { state: true },
    kiosk: { type: Boolean, reflect: true },
    fullscreen: { state: true },
  };

  hass?: Hass;
  narrow = false;
  page: Page = rememberedPage();
  settings?: Settings;
  seasons: number[] = [];
  delayOpen = false;
  failed = false;
  target?: GoTo;
  // Bumped when the user changes which clock times are shown in: handed to the
  // pages, which draw their times again (their own `hass` guard would skip it).
  clockVersion = 0;
  kiosk = false;
  /** The browser's full screen (the ⛶ button or Esc), apart from kiosk mode. */
  fullscreen = false;
  private kioskAsked = false;
  private scale = 1;
  private idleTimer?: number;
  private wakeLock?: WakeLock;
  private readonly moved = () => {
    this.classList.remove("idle");
    window.clearTimeout(this.idleTimer);
    if (this.kiosk) {
      this.idleTimer = window.setTimeout(() => {
        if (this.kiosk) this.classList.add("idle");
      }, 3_000);
    }
  };
  private readonly fullscreenChanged = () => {
    this.fullscreen = !!document.fullscreenElement;
    // Leaving full screen (Esc) leaves kiosk mode too, unless the address asked.
    if (!this.fullscreen && !this.kioskAsked && this.kiosk) this.endKiosk();
  };
  // The browser lets go of a wake lock whenever the page is hidden (tab switched,
  // app in the background, screen off and on): ask again on return.
  private readonly visibilityChanged = () => {
    if (document.visibilityState === "visible" && this.kiosk) this.keepAwake();
  };
  private readonly clockChanged = () => this.clockVersion++;
  private unsubscribe?: () => void;
  private connecting = false;
  private retry?: number;
  private backoff = 5_000;
  private seasonsTimer?: number;
  private askingSeasons = false;
  // A delay chosen here and not yet confirmed: pushed settings do not undo it.
  private pendingDelay: number | null = null;
  private delayTimer?: number;

  private get t(): Translate {
    return translator(this.hass);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener(TIME_PREFS_EVENT, this.clockChanged);
    window.addEventListener("pointermove", this.moved);
    document.addEventListener("fullscreenchange", this.fullscreenChanged);
    document.addEventListener("visibilitychange", this.visibilityChanged);
    this.kioskAsked = kioskFromAddress();
    this.kiosk = this.kioskAsked;
    this.fullscreen = !!document.fullscreenElement;
    this.scale = scale();
    const asked = query().get("page") as Page | null;
    if (asked && ALL_PAGES.includes(asked)) this.page = asked;
    if (this.kiosk) this.startKiosk();
  }

  /** Keep the screen awake where the browser allows it (a secure page), and
   *  hide the pointer when it rests. */
  private startKiosk(): void {
    this.moved();
    this.keepAwake();
  }

  private endKiosk(): void {
    this.kiosk = false;
    window.clearTimeout(this.idleTimer);
    this.classList.remove("idle");
    this.letSleep();
  }

  private keepAwake(): void {
    const lock = (navigator as unknown as { wakeLock?: { request(kind: string): Promise<WakeLock> } }).wakeLock;
    if (!lock) return;
    const old = this.wakeLock;
    this.wakeLock = undefined;
    void old?.release().catch(() => undefined);
    lock.request("screen").then(
      (sentinel) => {
        // Kiosk ended while asking: let go at once.
        if (this.kiosk && this.isConnected) this.wakeLock = sentinel;
        else void sentinel.release().catch(() => undefined);
      },
      () => undefined,
    );
  }

  private letSleep(): void {
    void this.wakeLock?.release().catch(() => undefined);
    this.wakeLock = undefined;
  }

  /** The ⛶ button: the browser's full screen, with the kiosk layout. With
   *  `?kiosk` in the address the layout stays when full screen is left. */
  private async toggleFullScreen(): Promise<void> {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
      return; // fullscreenChanged ends the kiosk layout, unless the address asked
    }
    if (!this.kiosk) {
      this.kiosk = true;
      this.startKiosk();
    }
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* the browser refused: kiosk layout without full screen, which the
         button (now "Leave full screen") ends */
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(TIME_PREFS_EVENT, this.clockChanged);
    window.removeEventListener("pointermove", this.moved);
    document.removeEventListener("fullscreenchange", this.fullscreenChanged);
    document.removeEventListener("visibilitychange", this.visibilityChanged);
    window.clearTimeout(this.idleTimer);
    this.letSleep();
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    window.clearTimeout(this.retry);
    this.retry = undefined;
    window.clearTimeout(this.seasonsTimer);
    this.seasonsTimer = undefined;
  }

  protected override updated(): void {
    // Home Assistant hands a new `hass` on every state change: subscribe once.
    if (this.hass && !this.unsubscribe && !this.connecting && this.retry === undefined) {
      void this.connect();
    }
  }

  /** Settings arrive through a subscription, so a change made anywhere (the
   *  switch and number entities, another screen) shows here at once. */
  private async connect(): Promise<void> {
    if (!this.hass) return;
    this.connecting = true;
    void loadTimePrefs(this.hass);
    try {
      this.unsubscribe = await api.subscribeSettings(this.hass, (settings) => this.receive(settings));
      this.failed = false;
      this.backoff = 5_000;
    } catch {
      this.failed = true;
      this.retry = window.setTimeout(() => {
        this.retry = undefined;
        this.requestUpdate();
      }, this.backoff);
      this.backoff = Math.min(this.backoff * 2, 60_000);
      return;
    } finally {
      this.connecting = false;
    }
    void this.loadSeasons();
  }

  /** The seasons the selectors offer. Until they arrive (or when the source does
   *  not answer, asked again every 30 s) the range the settings give stands in. */
  private async loadSeasons(): Promise<void> {
    if (!this.hass || this.seasons.length || this.askingSeasons) return;
    this.askingSeasons = true;
    try {
      this.seasons = (await api.seasons(this.hass)).seasons;
    } catch {
      window.clearTimeout(this.seasonsTimer);
      this.seasonsTimer = window.setTimeout(() => {
        this.seasonsTimer = undefined;
        void this.loadSeasons();
      }, SEASONS_RETRY);
    } finally {
      this.askingSeasons = false;
    }
  }

  private get seasonList(): number[] {
    if (this.seasons.length) return this.seasons;
    const s = this.settings;
    if (!s) return [];
    const first = s.first_season || s.season;
    return Array.from({ length: Math.max(1, s.season - first + 1) }, (_, i) => s.season - i);
  }

  private receive(settings: Settings): void {
    this.settings = this.pendingDelay === null ? settings : { ...settings, tv_delay: this.pendingDelay };
  }

  private go(target: GoTo): void {
    if (target.page === "circuit" && !target.circuit_id) return;
    this.page = target.page;
    this.target = target;
    this.delayOpen = false;
    if (target.page === "circuit") return; // not remembered: it needs its circuit
    try {
      localStorage.setItem(STORAGE_KEY, target.page);
    } catch {
      /* private mode: the page is simply not remembered */
    }
  }

  /** Steps and the slider change the number at once; the value is sent once the
   *  user pauses, so quick clicks are never lost to an earlier reply. */
  private setDelay(value: number): void {
    if (!this.hass || !this.settings) return;
    const tv_delay = Math.max(0, Math.min(120, Math.round(value)));
    this.pendingDelay = tv_delay;
    this.settings = { ...this.settings, tv_delay };
    window.clearTimeout(this.delayTimer);
    this.delayTimer = window.setTimeout(() => void this.sendDelay(), 400);
  }

  private async sendDelay(): Promise<void> {
    if (!this.hass || this.pendingDelay === null) return;
    const sent = this.pendingDelay;
    try {
      const settings = await api.setSettings(this.hass, { tv_delay: sent });
      if (this.pendingDelay === sent) this.pendingDelay = null;
      this.receive(settings);
    } catch {
      // Not saved: show what the backend holds, not the value that failed.
      this.pendingDelay = null;
      try {
        this.receive(await api.settings(this.hass));
      } catch {
        /* the subscription corrects it when the connection is back */
      }
    }
  }

  private async setSpoiler(on: boolean): Promise<void> {
    if (!this.hass) return;
    try {
      this.receive(await api.setSettings(this.hass, { no_spoiler: on }));
    } catch {
      /* the subscription keeps showing the real state */
    }
  }

  private async reveal(event: CustomEvent<string>): Promise<void> {
    if (!this.hass) return;
    try {
      this.receive(await api.reveal(this.hass, event.detail));
    } catch {
      /* nothing revealed: the page keeps saying so */
    }
  }

  /** Back from a circuit's history: the page it was opened from, as it was left. */
  private back(): void {
    const from = this.target?.page === "circuit" ? this.target.from : undefined;
    this.go({ page: from && from !== "circuit" ? from : "calendar" });
  }

  private toggleMenu(): void {
    this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }));
  }

  private renderPage() {
    if (!this.hass || !this.settings) {
      return this.failed
        ? failure(this.t, () => {
            window.clearTimeout(this.retry);
            this.retry = undefined;
            void this.connect();
          })
        : html`<div class="card loading">${this.t("common.loading")}</div>`;
    }
    const common = { hass: this.hass, settings: this.settings, seasons: this.seasonList, clock: this.clockVersion };
    // `cache` keeps the pages' elements while another page is shown: going back
    // finds its season, round and data as they were, without asking again.
    switch (this.page) {
      case "settings":
        return html`<plb-settings .hass=${common.hass} .settings=${common.settings} .clock=${common.clock}
          @plb-delay=${(e: CustomEvent<number>) => this.setDelay(e.detail)}></plb-settings>`;
      case "calendar":
        return html`<plb-calendar .hass=${common.hass} .settings=${common.settings} .seasons=${common.seasons} .clock=${common.clock}
          @plb-go=${(e: CustomEvent<GoTo>) => this.go(e.detail)}></plb-calendar>`;
      case "results":
        return html`<plb-results .hass=${common.hass} .settings=${common.settings} .seasons=${common.seasons} .clock=${common.clock}
          .target=${this.target} @plb-reveal=${this.reveal} @plb-go=${(e: CustomEvent<GoTo>) => this.go(e.detail)}></plb-results>`;
      case "circuit":
        return html`<plb-circuit .hass=${common.hass} .settings=${common.settings} .circuitId=${this.target?.circuit_id ?? ""}
          .circuitName=${this.target?.circuit ?? ""} @plb-back=${() => this.back()}></plb-circuit>`;
      case "standings":
        return html`<plb-standings .hass=${common.hass} .settings=${common.settings} .seasons=${common.seasons}></plb-standings>`;
      default:
        return html`<plb-live .hass=${common.hass} .settings=${common.settings} .clock=${common.clock} ?kiosk=${this.kiosk}
          @plb-spoiler-off=${() => this.setSpoiler(false)}></plb-live>`;
    }
  }

  protected override render() {
    const t = this.t;
    const s = this.settings;
    const f1tv = s?.f1tv && s.f1tv.status !== "not_configured" ? s.f1tv.status : null;
    const zoom = this.scale !== 1 ? `zoom:${this.scale}` : "";
    const leave = this.fullscreen || (this.kiosk && !this.kioskAsked);
    return html`
      <div class="barwrap" style=${zoom}><header class="appbar">
        ${this.narrow && !this.kiosk
          ? html`<button class="icon-btn" @click=${this.toggleMenu} aria-label=${t("common.menu")}>${icon(ICON.menu, 24)}</button>`
          : nothing}
        <div class="brand"><span class="mark">${icon(ICON.board, 18)}</span><span class="name">${t("common.title")}</span></div>
        <nav class="tabs">
          ${PAGES.map(
            (p) => html`<button class="tab ${this.page === p || (this.page === "circuit" && this.target?.from === p) ? "active" : ""}"
              aria-current=${this.page === p ? "page" : "false"}
              @click=${() => this.go({ page: p })}>${t(`tabs.${p}`)}</button>`,
          )}
        </nav>
        <span class="spacer"></span>
        ${s && !s.live
          ? html`<button class="chip paused" @click=${() => this.go({ page: "settings" })} title=${t("settings.pausedHelp")}
              aria-label=${s.auto_start ? t("live.pausedAuto") : t("live.pausedShort")}>
              ${icon(ICON.pause, 16)}<span class="label">${s.auto_start ? t("live.pausedAuto") : t("live.pausedShort")}</span></button>`
          : nothing}
        ${f1tv
          ? html`<span class="chip small f1tv ${f1tv === "active" ? "" : "warn"}" title=${t(`f1tv.${f1tv}`)}>F1TV</span>`
          : nothing}
        <button class="chip delay ${s?.tv_delay ? "on" : ""}" @click=${() => (this.delayOpen = !this.delayOpen)}
          aria-expanded=${this.delayOpen ? "true" : "false"} aria-label=${t("delay.title")}>
          ${icon(ICON.clock, 18)}<span class="num">${t("delay.seconds", { n: s?.tv_delay ? `+${s.tv_delay}` : 0 })}</span>
          <span class="label">${t("delay.title")}</span>
        </button>
        <button class="chip spoiler ${s?.no_spoiler ? "on" : ""}" @click=${() => this.setSpoiler(!s?.no_spoiler)}
          title=${t("spoiler.help")} aria-pressed=${s?.no_spoiler ? "true" : "false"}
          aria-label=${s?.no_spoiler ? t("spoiler.on") : t("spoiler.off")}>
          ${icon(s?.no_spoiler ? ICON.eyeOff : ICON.eye, 18)}
          <span class="label">${s?.no_spoiler ? t("spoiler.on") : t("spoiler.off")}</span>
        </button>
        <button class="icon-btn full" @click=${() => (leave && !this.fullscreen ? this.endKiosk() : this.toggleFullScreen())}
          aria-label=${t(leave ? "kiosk.leave" : "kiosk.enter")} title=${t(leave ? "kiosk.leave" : "kiosk.enter")}>
          ${icon(leave ? ICON.exitFullscreen : ICON.fullscreen, 22)}</button>
        <button class="icon-btn gear ${this.page === "settings" ? "active" : ""}" @click=${() => this.go({ page: "settings" })}
          aria-label=${t("settings.title")} title=${t("settings.title")}>${icon(ICON.cog, 22)}</button>
      </header></div>
      ${this.delayOpen && s ? this.renderPopover(s) : nothing}
      <main style=${zoom}>${cache(this.renderPage())}</main>
      <footer style=${zoom}>${t("common.disclaimer")}</footer>
    `;
  }

  private renderPopover(s: Settings) {
    const t = this.t;
    return html`<div class="card pop" role="dialog" aria-label=${t("delay.title")}>
      <h3>${t("delay.title")}</h3>
      <p>${t("delay.help")}</p>
      <div class="stepper">
        <button @click=${() => this.setDelay(s.tv_delay - 1)} aria-label=${t("delay.less")}>−</button>
        <b class="num">${s.tv_delay ? t("delay.seconds", { n: s.tv_delay }) : t("delay.none")}</b>
        <button @click=${() => this.setDelay(s.tv_delay + 1)} aria-label=${t("delay.more")}>+</button>
      </div>
      <input type="range" min="0" max="120" step="1" .value=${String(s.tv_delay)} aria-label=${t("delay.title")}
        @input=${(e: Event) => this.setDelay(Number((e.target as HTMLInputElement).value))} />
    </div>`;
  }

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        min-height: 100vh;
        background: var(--primary-background-color);
      }
      /* Kiosk: over Home Assistant's sidebar and header, the whole screen. */
      :host([kiosk]) {
        position: fixed; inset: 0; z-index: 100;
        overflow: auto; min-height: 0;
      }
      :host([kiosk]) main { max-width: none; }
      :host([kiosk]) footer { max-width: none; font-size: 10px; padding-bottom: 8px; }
      :host([kiosk]) .gear, :host([kiosk]) .chip.paused { display: none; }
      :host([kiosk]) .appbar { min-height: 48px; }
      :host([kiosk]) main { padding-top: 10px; }
      :host(.idle) { cursor: none; }
      /* The bar is sized by the panel's own width (Home Assistant's sidebar takes
         a varying part of the window), and never wider than it. */
      .barwrap { position: sticky; top: 0; z-index: 5; container-type: inline-size; }
      .appbar {
        display: flex; align-items: center; gap: 12px;
        min-height: 56px; padding: 0 16px; box-sizing: border-box; max-width: 100%;
        background: var(--app-header-background-color, var(--card-background-color));
        color: var(--app-header-text-color, var(--primary-text-color));
        border-bottom: 1px solid var(--divider-color);
      }
      .icon-btn { border: 0; background: none; color: inherit; cursor: pointer; padding: 0; display: grid; place-items: center;
        width: 40px; height: 40px; border-radius: 50%; flex: none; }
      .brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 500; white-space: nowrap; flex: none; }
      .mark {
        width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; color: #fff;
        background: linear-gradient(135deg, var(--primary-color), #7c4dff);
      }
      /* Tabs scroll rather than push the actions off the bar. */
      .tabs { display: flex; gap: 4px; margin-left: 8px; min-width: 0; flex: 0 1 auto; overflow-x: auto; scrollbar-width: none; }
      .appbar .chip { color: inherit; flex: none; }
      .appbar .chip.on { color: var(--plb-primary-text); }
      .chip.warn { color: var(--warning-color, #ffa600); }
      .chip.paused { border-style: dashed; color: var(--secondary-text-color); }
      .gear.active { color: var(--plb-primary-text); }
      main { padding: var(--plb-gap); max-width: 1480px; margin: 0 auto; }
      footer {
        max-width: 1480px; margin: 8px auto 0; padding: 0 var(--plb-gap) 24px;
        color: var(--secondary-text-color); font-size: 11px; line-height: 1.5;
      }
      .pop { position: fixed; right: 16px; top: 64px; width: 300px; padding: 16px; display: grid; gap: 12px; z-index: 10; }
      .pop h3 { margin: 0; font-size: 15px; font-weight: 500; }
      .pop p { margin: 0; color: var(--secondary-text-color); font-size: 12px; line-height: 1.5; }
      .stepper { display: flex; align-items: center; gap: 10px; }
      .stepper button {
        width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--divider-color);
        background: none; color: inherit; font-size: 18px; cursor: pointer;
      }
      .stepper b { font-size: 22px; font-weight: 500; min-width: 110px; text-align: center; }
      input[type="range"] { width: 100%; accent-color: var(--primary-color); }
      @container (max-width: 1180px) {
        .appbar .chip .label { display: none; }
        .appbar { gap: 8px; }
      }
      @container (max-width: 960px) {
        .brand .name { display: none; }
      }
      /* Two rows: the tabs under the brand and the actions. */
      @container (max-width: 760px) {
        .appbar { flex-wrap: wrap; gap: 6px; padding: 6px 8px 0; }
        .tabs { order: 3; width: 100%; flex-basis: 100%; margin: 0; }
        .tab { flex: 1; padding: 8px 6px; }
      }
      @container (max-width: 480px) {
        .appbar .f1tv, .appbar .full { display: none; }
        .appbar .chip { padding: 0 10px; }
        .tabs { gap: 2px; }
        .tab { padding: 8px 4px; font-size: 13px; letter-spacing: 0; }
      }
      @media (max-width: 640px) {
        main { padding: 10px; }
        .pop { left: 8px; right: 8px; width: auto; top: 112px; }
      }
    `,
  ];
}

define("plb-calendar", PlbCalendar);
define("plb-results", PlbResults);
define("plb-circuit", PlbCircuit);
define("plb-standings", PlbStandings);
define("plb-live", PlbLive);
define("plb-live-map", PlbLiveMap);
define("plb-settings", PlbSettings);
define("plb-countdown", PlbCountdown);
define("plb-age", PlbAge);
define("pit-lane-live-board-panel", PitLaneLiveBoardPanel);
