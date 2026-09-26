// The sidebar panel (SPEC §7): app bar with the four pages, the TV-delay control,
// the no-spoiler switch, and the footer with the non-affiliation notice (INV-6).
import { LitElement, css, html, nothing } from "lit";
import { api } from "./api";
import { define } from "./define";
import { translator, type Translate } from "./i18n";
import { ICON, icon } from "./icons";
import { tokens } from "./styles";
import type { Hass, Settings } from "./types";
import { PlbCalendar } from "./pages/calendar";
import { PlbLive } from "./pages/live";
import { PlbResults } from "./pages/results";
import { PlbStandings } from "./pages/standings";

type Page = "live" | "calendar" | "results" | "standings";
const PAGES: Page[] = ["live", "calendar", "results", "standings"];
const STORAGE_KEY = "pit-lane-live-board-page";

function rememberedPage(): Page {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Page | null;
    return saved && PAGES.includes(saved) ? saved : "live";
  } catch {
    return "live";
  }
}

export class PitLaneLiveBoardPanel extends LitElement {
  static override properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
    page: { state: true },
    settings: { state: true },
    seasons: { state: true },
    delayOpen: { state: true },
  };

  hass?: Hass;
  narrow = false;
  page: Page = rememberedPage();
  settings?: Settings;
  seasons: number[] = [];
  delayOpen = false;
  private loaded = false;

  private get t(): Translate {
    return translator(this.hass);
  }

  protected override updated(): void {
    if (this.hass && !this.loaded) {
      this.loaded = true;
      void this.load();
    }
  }

  private async load(): Promise<void> {
    if (!this.hass) return;
    try {
      this.settings = await api.settings(this.hass);
    } catch {
      this.loaded = false;
      return;
    }
    try {
      this.seasons = (await api.seasons(this.hass)).seasons;
    } catch {
      this.seasons = [this.settings.season];
    }
  }

  private go(page: Page): void {
    this.page = page;
    this.delayOpen = false;
    try {
      localStorage.setItem(STORAGE_KEY, page);
    } catch {
      /* private mode: the page is simply not remembered */
    }
  }

  private async setDelay(value: number): Promise<void> {
    if (!this.hass || !this.settings) return;
    const tv_delay = Math.max(0, Math.min(120, Math.round(value)));
    this.settings = { ...this.settings, tv_delay };
    this.settings = await api.setSettings(this.hass, { tv_delay });
  }

  private async toggleSpoiler(): Promise<void> {
    if (!this.hass || !this.settings) return;
    this.settings = await api.setSettings(this.hass, { no_spoiler: !this.settings.no_spoiler });
  }

  private async reveal(event: CustomEvent<string>): Promise<void> {
    if (!this.hass) return;
    this.settings = await api.reveal(this.hass, event.detail);
  }

  private toggleMenu(): void {
    this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }));
  }

  private renderPage() {
    if (!this.hass || !this.settings) return html`<div class="card loading">${this.t("common.loading")}</div>`;
    const common = { hass: this.hass, settings: this.settings, seasons: this.seasons };
    switch (this.page) {
      case "calendar":
        return html`<plb-calendar .hass=${common.hass} .settings=${common.settings} .seasons=${common.seasons}
          @plb-go=${(e: CustomEvent<Page>) => this.go(e.detail)}></plb-calendar>`;
      case "results":
        return html`<plb-results .hass=${common.hass} .settings=${common.settings} .seasons=${common.seasons}
          @plb-reveal=${this.reveal}></plb-results>`;
      case "standings":
        return html`<plb-standings .hass=${common.hass} .settings=${common.settings} .seasons=${common.seasons}></plb-standings>`;
      default:
        return html`<plb-live .hass=${common.hass} .settings=${common.settings}
          @plb-spoiler-off=${this.toggleSpoiler}></plb-live>`;
    }
  }

  protected override render() {
    const t = this.t;
    const s = this.settings;
    const f1tv = s?.f1tv && s.f1tv.status !== "not_configured" ? s.f1tv.status : null;
    return html`
      <header class="appbar">
        ${this.narrow
          ? html`<button class="icon-btn" @click=${this.toggleMenu} aria-label="menu">${icon(ICON.menu, 24)}</button>`
          : nothing}
        <div class="brand"><span class="mark">${icon(ICON.board, 18)}</span><span class="name">Live Board</span></div>
        <nav class="tabs">
          ${PAGES.map(
            (p) => html`<button class="tab ${this.page === p ? "active" : ""}" @click=${() => this.go(p)}>
              ${t(`tabs.${p}`)}
            </button>`,
          )}
        </nav>
        <span class="spacer"></span>
        ${f1tv
          ? html`<span class="chip small ${f1tv === "active" ? "" : "warn"}" title=${t(`f1tv.${f1tv}`)}>F1TV</span>`
          : nothing}
        <button class="chip ${s?.tv_delay ? "on" : ""}" @click=${() => (this.delayOpen = !this.delayOpen)}
          aria-expanded=${this.delayOpen ? "true" : "false"}>
          ${icon(ICON.clock, 18)}<span class="num">${s?.tv_delay ? `+${s.tv_delay} s` : "0 s"}</span>
          <span class="label">${t("delay.title")}</span>
        </button>
        <button class="chip ${s?.no_spoiler ? "on" : ""}" @click=${this.toggleSpoiler} title=${t("spoiler.help")}>
          ${icon(s?.no_spoiler ? ICON.eyeOff : ICON.eye, 18)}
          <span class="label">${s?.no_spoiler ? t("spoiler.on") : t("spoiler.off")}</span>
        </button>
      </header>
      ${this.delayOpen && s ? this.renderPopover(s) : nothing}
      <main>${this.renderPage()}</main>
      <footer>${t("common.disclaimer")}</footer>
    `;
  }

  private renderPopover(s: Settings) {
    const t = this.t;
    return html`<div class="card pop" role="dialog" aria-label=${t("delay.title")}>
      <h3>${t("delay.title")}</h3>
      <p>${t("delay.help")}</p>
      <div class="stepper">
        <button @click=${() => this.setDelay(s.tv_delay - 1)} aria-label="−1 s">−</button>
        <b class="num">${s.tv_delay ? t("delay.seconds", { n: s.tv_delay }) : t("delay.none")}</b>
        <button @click=${() => this.setDelay(s.tv_delay + 1)} aria-label="+1 s">+</button>
      </div>
      <input type="range" min="0" max="120" step="1" .value=${String(s.tv_delay)}
        @change=${(e: Event) => this.setDelay(Number((e.target as HTMLInputElement).value))} />
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
define("pit-lane-live-board-panel", PitLaneLiveBoardPanel);
