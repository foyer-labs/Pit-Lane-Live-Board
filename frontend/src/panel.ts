// The sidebar panel (SPEC §7): app bar with the four pages, the TV-delay control,
// the no-spoiler switch, live timing's state and the settings behind the gear, and
// the footer with the non-affiliation notice (INV-6).
import { LitElement, css, html, nothing } from "lit";
import { api } from "./api";
import { define } from "./define";
import { translator, type Translate } from "./i18n";
import { ICON, icon } from "./icons";
import { failure } from "./parts";
import { tokens } from "./styles";
import { TIME_PREFS_EVENT, loadTimePrefs } from "./timeprefs";
import { keyed } from "lit/directives/keyed.js";
import type { Hass, Settings } from "./types";
import { PlbAge, PlbCountdown } from "./clock";
import { PlbCalendar } from "./pages/calendar";
import { PlbLive } from "./pages/live";
import { PlbLiveMap } from "./pages/live-map";
import { PlbResults } from "./pages/results";
import { PlbSettings } from "./pages/settings";
import { PlbStandings } from "./pages/standings";

export type Page = "live" | "calendar" | "results" | "standings" | "settings";
// The tabs; Settings opens from the gear, not a fifth tab.
const PAGES: Page[] = ["live", "calendar", "results", "standings"];
const ALL_PAGES: Page[] = [...PAGES, "settings"];
const STORAGE_KEY = "pit-lane-live-board-page";

function rememberedPage(): Page {
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
}

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
  };

  hass?: Hass;
  narrow = false;
  page: Page = rememberedPage();
  settings?: Settings;
  seasons: number[] = [];
  delayOpen = false;
  failed = false;
  target?: GoTo;
  // Bumped when the user changes which clock times are shown in: the pages are
  // drawn again (their own `hass` guard would otherwise skip it).
  clockVersion = 0;
  private readonly clockChanged = () => this.clockVersion++;
  private unsubscribe?: () => void;
  private connecting = false;
  private retry?: number;
  private backoff = 5_000;
  // A delay chosen here and not yet confirmed: pushed settings do not undo it.
  private pendingDelay: number | null = null;
  private delayTimer?: number;

  private get t(): Translate {
    return translator(this.hass);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener(TIME_PREFS_EVENT, this.clockChanged);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(TIME_PREFS_EVENT, this.clockChanged);
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    window.clearTimeout(this.retry);
    this.retry = undefined;
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
    if (!this.seasons.length) {
      try {
        this.seasons = (await api.seasons(this.hass)).seasons;
      } catch {
        this.seasons = this.settings ? [this.settings.season] : [];
      }
    }
  }

  private receive(settings: Settings): void {
    this.settings = this.pendingDelay === null ? settings : { ...settings, tv_delay: this.pendingDelay };
  }

  private go(target: GoTo): void {
    this.page = target.page;
    this.target = target;
    this.delayOpen = false;
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
    const common = { hass: this.hass, settings: this.settings, seasons: this.seasons };
    switch (this.page) {
      case "settings":
        return html`<plb-settings .hass=${common.hass} .settings=${common.settings}
          @plb-delay=${(e: CustomEvent<number>) => this.setDelay(e.detail)}></plb-settings>`;
      case "calendar":
        return html`<plb-calendar .hass=${common.hass} .settings=${common.settings} .seasons=${common.seasons}
          @plb-go=${(e: CustomEvent<GoTo>) => this.go(e.detail)}></plb-calendar>`;
      case "results":
        return html`<plb-results .hass=${common.hass} .settings=${common.settings} .seasons=${common.seasons}
          .target=${this.target} @plb-reveal=${this.reveal}></plb-results>`;
      case "standings":
        return html`<plb-standings .hass=${common.hass} .settings=${common.settings} .seasons=${common.seasons}></plb-standings>`;
      default:
        return html`<plb-live .hass=${common.hass} .settings=${common.settings}
          @plb-spoiler-off=${() => this.setSpoiler(false)}></plb-live>`;
    }
  }

  protected override render() {
    const t = this.t;
    const s = this.settings;
    const f1tv = s?.f1tv && s.f1tv.status !== "not_configured" ? s.f1tv.status : null;
    return html`
      <header class="appbar">
        ${this.narrow
          ? html`<button class="icon-btn" @click=${this.toggleMenu} aria-label=${t("common.menu")}>${icon(ICON.menu, 24)}</button>`
          : nothing}
        <div class="brand"><span class="mark">${icon(ICON.board, 18)}</span><span class="name">${t("common.title")}</span></div>
        <nav class="tabs">
          ${PAGES.map(
            (p) => html`<button class="tab ${this.page === p ? "active" : ""}" @click=${() => this.go({ page: p })}>
              ${t(`tabs.${p}`)}
            </button>`,
          )}
        </nav>
        <span class="spacer"></span>
        ${s && !s.live
          ? html`<button class="chip paused" @click=${() => this.go({ page: "settings" })} title=${t("settings.pausedHelp")}>
              ${icon(ICON.pause, 16)}<span class="label">${s.auto_start ? t("live.pausedAuto") : t("live.pausedShort")}</span></button>`
          : nothing}
        ${f1tv
          ? html`<span class="chip small ${f1tv === "active" ? "" : "warn"}" title=${t(`f1tv.${f1tv}`)}>F1TV</span>`
          : nothing}
        <button class="chip ${s?.tv_delay ? "on" : ""}" @click=${() => (this.delayOpen = !this.delayOpen)}
          aria-expanded=${this.delayOpen ? "true" : "false"} aria-label=${t("delay.title")}>
          ${icon(ICON.clock, 18)}<span class="num">${t("delay.seconds", { n: s?.tv_delay ? `+${s.tv_delay}` : 0 })}</span>
          <span class="label">${t("delay.title")}</span>
        </button>
        <button class="chip ${s?.no_spoiler ? "on" : ""}" @click=${() => this.setSpoiler(!s?.no_spoiler)}
          title=${t("spoiler.help")} aria-pressed=${s?.no_spoiler ? "true" : "false"}
          aria-label=${s?.no_spoiler ? t("spoiler.on") : t("spoiler.off")}>
          ${icon(s?.no_spoiler ? ICON.eyeOff : ICON.eye, 18)}
          <span class="label">${s?.no_spoiler ? t("spoiler.on") : t("spoiler.off")}</span>
        </button>
        <button class="icon-btn gear ${this.page === "settings" ? "active" : ""}" @click=${() => this.go({ page: "settings" })}
          aria-label=${t("settings.title")} title=${t("settings.title")}>${icon(ICON.cog, 22)}</button>
      </header>
      ${this.delayOpen && s ? this.renderPopover(s) : nothing}
      <main>${keyed(this.clockVersion, this.renderPage())}</main>
      <footer>${t("common.disclaimer")}</footer>
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
      .appbar {
        position: sticky; top: 0; z-index: 5;
        display: flex; align-items: center; gap: 12px;
        min-height: 56px; padding: 0 16px;
        background: var(--app-header-background-color, var(--card-background-color));
        color: var(--app-header-text-color, var(--primary-text-color));
        border-bottom: 1px solid var(--divider-color);
      }
      .icon-btn { border: 0; background: none; color: inherit; cursor: pointer; padding: 4px; display: grid; }
      .brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 500; white-space: nowrap; }
      .mark {
        width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; color: #fff;
        background: linear-gradient(135deg, var(--primary-color), #7c4dff);
      }
      .tabs { display: flex; gap: 4px; margin-left: 8px; }
      .appbar .chip { color: inherit; }
      .appbar .chip.on { color: var(--primary-color); }
      .chip.warn { color: var(--warning-color, #ffa600); }
      .chip.paused { border-style: dashed; color: var(--secondary-text-color); }
      .gear.active { color: var(--primary-color); }
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
        width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--divider-color);
        background: none; color: inherit; font-size: 18px; cursor: pointer;
      }
      .stepper b { font-size: 22px; font-weight: 500; min-width: 110px; text-align: center; }
      input[type="range"] { width: 100%; accent-color: var(--primary-color); }
      @media (max-width: 1180px) {
        .appbar .chip .label { display: none; }
        .appbar { gap: 8px; }
      }
      @media (max-width: 640px) {
        .appbar { flex-wrap: wrap; gap: 6px; padding: 8px 8px 0; }
        .tabs { order: 3; width: 100%; margin: 0; overflow-x: auto; }
        .tab { flex: 1; padding: 8px 6px; }
        .chip .label { display: none; }
        main { padding: 10px; }
        .pop { left: 8px; right: 8px; width: auto; top: 112px; }
      }
    `,
  ];
}

define("plb-calendar", PlbCalendar);
define("plb-results", PlbResults);
define("plb-standings", PlbStandings);
define("plb-live", PlbLive);
define("plb-live-map", PlbLiveMap);
define("plb-settings", PlbSettings);
define("plb-countdown", PlbCountdown);
define("plb-age", PlbAge);
define("pit-lane-live-board-panel", PitLaneLiveBoardPanel);
