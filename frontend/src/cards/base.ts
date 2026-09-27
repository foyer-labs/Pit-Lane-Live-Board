// What every dashboard card shares (SPEC §7.6): Home Assistant's card contract
// (setConfig, getCardSize, a form for the visual editor), the shared live stream,
// and the states the Live page also shows (paused, waiting, hidden). The backend
// has already applied the TV delay and no-spoiler mode to what arrives (INV-5).
import { LitElement, css, html, nothing } from "lit";
import { api } from "../api";
import { hassChanged, sessionTime } from "../format";
import { translator, type Translate } from "../i18n";
import { ICON, icon } from "../icons";
import { pillStyles } from "../pages/stewards";
import { alsoTime } from "../parts";
import { TIME_PREFS_EVENT, loadTimePrefs } from "../timeprefs";
import { tokens } from "../styles";
import type { Hass, LiveView, Settings } from "../types";
import { liveStore, settingsStore } from "./store";

export interface CardConfig {
  type: string;
  title?: string;
  [key: string]: unknown;
}

/** The form schema Home Assistant's visual editor draws (`getConfigForm`). */
export interface FormField {
  name: string;
  selector: Record<string, unknown>;
  required?: boolean;
}

/** The language of the page before a card has `hass`: Home Assistant sets it. */
export function pageTranslator(): Translate {
  const lang = document.documentElement.lang || navigator.language || "en";
  return translator({ language: lang, locale: { language: lang } } as Hass);
}

/** The editor's labels, translated like the rest of the panel. The title option
 *  is "hide", off by default: the editor shows a missing boolean as off, so a
 *  "show" option would read off over a card that shows its title. */
export function form(fields: FormField[]) {
  return {
    schema: [...fields, { name: "hide_title", selector: { boolean: {} } }],
    computeLabel: (field: FormField) => pageTranslator()(`cards.fields.${field.name}`),
  };
}

/** A whole number within bounds, or the default when the option is not a number. */
export function whole(value: unknown, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && value !== null && value !== "" ? Math.min(max, Math.max(min, n)) : fallback;
}

export abstract class LiveCard extends LitElement {
  static override properties = {
    hass: { attribute: false, hasChanged: hassChanged },
    config: { state: true },
    view: { state: true },
    settings: { state: true },
    liveFailed: { state: true },
    starting: { state: true },
    startFailed: { state: true },
  };

  hass?: Hass;
  config!: CardConfig;
  view?: LiveView;
  /** Shared by every card of the page through one subscription (settingsStore). */
  settings?: Settings;
  /** The live stream could not open (it keeps trying): say so, not "Loading". */
  liveFailed = false;
  starting = false;
  startFailed = false;
  private unlisten?: () => void;
  private unlistenSettings?: () => void;
  private readonly redraw = () => this.requestUpdate();

  /** Defaults each card fills its configuration with. */
  protected defaults(): Partial<CardConfig> {
    return {};
  }

  setConfig(config: CardConfig): void {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    this.config = this.validate({ ...this.defaults(), ...config });
  }

  /** Checks and normalises the options: Home Assistant shows a thrown error on
   *  the card, which is better than a card that quietly does something else. */
  protected validate(config: CardConfig): CardConfig {
    return config;
  }

  getCardSize(): number {
    return 4;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener(TIME_PREFS_EVENT, this.redraw);
    this.listen();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(TIME_PREFS_EVENT, this.redraw);
    this.unlisten?.();
    this.unlisten = undefined;
    this.unlistenSettings?.();
    this.unlistenSettings = undefined;
  }

  protected override willUpdate(): void {
    if (this.hass) void loadTimePrefs(this.hass);
    this.listen();
  }

  /** Whether the card reads the live stream (the standings card does not). */
  protected get usesLive(): boolean {
    return true;
  }

  /** Whether the card needs the settings (favourites, season, no-spoiler). */
  protected get usesSettings(): boolean {
    return false;
  }

  private listen(): void {
    if (!this.hass || !this.isConnected) return;
    if (this.usesLive && !this.unlisten) {
      this.unlisten = liveStore.listen(this.hass, (view) => {
        if (view) this.view = view;
        this.liveFailed = !view;
      });
    }
    if (this.usesSettings && !this.unlistenSettings) {
      this.unlistenSettings = settingsStore.listen(this.hass, (settings) => {
        if (settings) this.settingsChanged(settings);
      });
    }
  }

  /** A new settings value arrived (the first one too). */
  protected settingsChanged(settings: Settings): void {
    this.settings = settings;
  }

  /** The household's drivers. */
  protected get followed(): string[] {
    return this.settings?.favourites ?? [];
  }

  protected get t(): Translate {
    return translator(this.hass);
  }

  /** What the card shows while there is a session to show (live or final). */
  protected abstract renderBody(t: Translate, view: LiveView): unknown;

  /** The card's own title, unless the user changed or removed it. */
  protected abstract defaultTitle(t: Translate): string;

  private async start(): Promise<void> {
    if (!this.hass) return;
    this.starting = true;
    this.startFailed = false;
    try {
      await api.setSettings(this.hass, { live: true });
    } catch {
      this.startFailed = true; // the card keeps saying it is paused, and why
    } finally {
      this.starting = false;
    }
  }

  /** Whether this card shows the next session's countdown between sessions. Only
   *  the session card does: a dashboard of cards each repeating it is noise. */
  protected get showsCountdown(): boolean {
    return false;
  }

  /** The states without a board: the same words as the Live page. */
  protected renderState(t: Translate, v: LiveView) {
    if (!this.showsCountdown) return this.renderQuietState(t, v);
    const next = v.next_session;
    const nextLine = next
      ? html`<div class="next">${t("live.next", { meeting: next.meeting, session: t(`sessions.${next.kind}`) })}
          ${next.start
            ? html`<b class="num"><plb-countdown .to=${next.start}></plb-countdown></b>
                <small>${sessionTime(this.hass!, next.start, next.date, next.timezone)}
                  ${alsoTime(t, this.hass!, next.start, next.timezone)}</small>`
            : nothing}</div>`
      : html`<div class="next">${t("live.noNext")}</div>`;
    switch (v.state) {
      case "hidden":
        return html`<div class="state">${icon(ICON.eyeOff, 28)}<span>${t("live.hidden")}</span></div>`;
      case "syncing":
        return html`<div class="state">${icon(ICON.clock, 28)}<span>${t("live.syncing")}</span></div>`;
      case "connecting":
        return html`<div class="state">${icon(ICON.timer, 28)}<span>${t("live.connecting")}</span></div>`;
      case "paused":
        return html`<div class="state">${icon(ICON.pause, 28)}<span>${t("live.paused")}</span>
          ${this.startButton(t)}
          ${nextLine}</div>`;
      default:
        return html`<div class="state">${icon(ICON.timer, 28)}<span>${t("live.idle")}</span>${nextLine}</div>`;
    }
  }

  private startButton(t: Translate) {
    return html`<button class="btn" ?disabled=${this.starting} @click=${() => this.start()}>${t("settings.start")}</button>
      ${this.startFailed ? html`<small class="error-line" role="alert">${t("cards.startFailed")}</small>` : nothing}`;
  }

  /** One short line in place of the board: what the card is waiting for. */
  private renderQuietState(t: Translate, v: LiveView) {
    const next = v.next_session;
    const back = next
      ? t("cards.backWith", {
          session: t(`sessions.${next.kind}`),
          time: sessionTime(this.hass!, next.start, next.date, next.timezone),
        })
      : t("live.noNext");
    const [glyph, text] =
      v.state === "hidden"
        ? [ICON.eyeOff, t("live.hidden")]
        : v.state === "syncing"
          ? [ICON.clock, t("live.syncing")]
          : v.state === "connecting"
            ? [ICON.timer, t("live.connecting")]
            : v.state === "paused"
              ? [ICON.pause, t("live.paused")]
              : [ICON.timer, back];
    return html`<div class="quiet">${icon(glyph, 18)}<span>${text}</span>
      ${v.state === "paused" ? html`<span class="spacer"></span>${this.startButton(t)}` : nothing}</div>`;
  }

  /** The title: the user's, else the card's own; none when `hide_title` is on
   *  (the visual editor drops an emptied text field, so it cannot mean "none").
   *  `show_title: false`, the option's earlier name, still hides it. */
  protected cardTitle(t: Translate): string {
    const hide = this.config.hide_title ?? this.config.show_title === false;
    if (hide === true) return "";
    return (this.config.title as string | undefined) || this.defaultTitle(t);
  }

  /** The FINAL / DELAYED / NO FEED tag. */
  protected flag(t: Translate, v: LiveView | undefined) {
    return v?.state === "final"
      ? html`<span class="tag">${t("live.final")}</span>`
      : v?.state === "stale" || v?.state === "lost"
        ? html`<span class="tag warn">${t(v.state === "lost" ? "cards.lost" : "cards.stale")}</span>`
        : nothing;
  }

  /** Whether the card puts its tag in its own body (the session card). */
  protected get flagInBody(): boolean {
    return false;
  }

  protected hasBoard(v: LiveView): boolean {
    return ["live", "stale", "lost", "final"].includes(v.state);
  }

  protected override render() {
    if (!this.config) return nothing;
    const t = this.t;
    const title = this.cardTitle(t);
    const v = this.view;
    let body: unknown;
    if (!this.hass || !v) body = html`<div class="state">${this.liveFailed ? t("common.unavailable") : t("common.loading")}</div>`;
    else if (this.hasBoard(v)) body = this.renderBody(t, v);
    else body = this.renderState(t, v);
    const flag = this.flagInBody && v && this.hasBoard(v) ? nothing : this.flag(t, v);
    return html`<ha-card>
      ${title || flag !== nothing ? html`<div class="head">${title ? html`<span>${title}</span>` : nothing}<span class="spacer"></span>${flag}</div>` : nothing}
      <div class="body ${v?.state === "lost" ? "dim" : ""}">${body}</div>
    </ha-card>`;
  }

  static override styles = [
    tokens,
    pillStyles,
    css`
      :host { display: block; }
      ha-card { display: block; height: 100%; overflow: hidden; }
      .head { display: flex; align-items: center; gap: 8px; padding: 12px 16px 4px; font-size: 16px; font-weight: 500; }
      .body { padding: 4px 0 8px; }
      .dim { opacity: 0.5; filter: grayscale(0.6); }
      .tag { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; padding: 2px 8px; border-radius: 10px;
        background: var(--secondary-background-color); color: var(--primary-text-color);
        border: 1px solid color-mix(in srgb, var(--primary-text-color) 25%, transparent); white-space: nowrap; }
      .tag.warn { background: color-mix(in srgb, var(--warning-color, #ffa600) 20%, transparent); color: var(--primary-text-color); }
      .state { display: grid; justify-items: center; gap: 8px; text-align: center; padding: 16px; color: var(--secondary-text-color); font-size: 14px; }
      .state svg { opacity: 0.5; }
      .state .next { display: grid; gap: 2px; justify-items: center; }
      .state .next b { font-size: 22px; font-weight: 400; color: var(--primary-text-color); }
      .state .next small { font-size: 12px; }
      .quiet { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 8px 16px; min-height: 28px;
        color: var(--secondary-text-color); font-size: 13px; }
      .quiet svg { flex: none; opacity: 0.6; }
      .quiet .btn { height: 32px; font-size: 13px; }
      .error-line { color: var(--error-color, #db4437); font-size: 12px; }
      .row { display: flex; align-items: center; gap: 10px; padding: 6px 16px; font-size: 14px; min-height: 32px; }
      .row + .row { border-top: 1px solid var(--divider-color); }
      .empty { padding: 8px 16px 12px; color: var(--secondary-text-color); font-size: 13px; }
      .btn:disabled { opacity: 0.6; }
      @media (pointer: coarse) {
        .quiet .btn { height: 40px; }
      }
    `,
  ];
}
