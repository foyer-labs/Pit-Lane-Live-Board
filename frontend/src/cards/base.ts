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
import { tokens } from "../styles";
import type { Hass, LiveView } from "../types";
import { liveStore } from "./store";

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

/** The editor's labels, translated like the rest of the panel. */
export function form(fields: FormField[]) {
  return {
    schema: [...fields, { name: "show_title", selector: { boolean: {} } }],
    computeLabel: (field: FormField) => pageTranslator()(`cards.fields.${field.name}`),
  };
}

export abstract class LiveCard extends LitElement {
  static override properties = {
    hass: { attribute: false, hasChanged: hassChanged },
    config: { state: true },
    view: { state: true },
    starting: { state: true },
  };

  hass?: Hass;
  config!: CardConfig;
  view?: LiveView;
  starting = false;
  private unlisten?: () => void;

  /** Defaults each card fills its configuration with. */
  protected defaults(): Partial<CardConfig> {
    return {};
  }

  setConfig(config: CardConfig): void {
    if (!config) throw new Error("Invalid configuration");
    this.config = { ...this.defaults(), ...config };
  }

  getCardSize(): number {
    return 4;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.listen();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unlisten?.();
    this.unlisten = undefined;
  }

  protected override willUpdate(): void {
    this.listen();
  }

  /** Whether the card reads the live stream (the standings card does not). */
  protected get usesLive(): boolean {
    return true;
  }

  private listen(): void {
    if (this.usesLive && this.hass && this.isConnected && !this.unlisten) {
      this.unlisten = liveStore.listen(this.hass, (view) => (this.view = view));
    }
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
    try {
      await api.setSettings(this.hass, { live: true });
    } catch {
      /* the card keeps saying it is paused */
    } finally {
      this.starting = false;
    }
  }

  /** The states without a board: the same words as the Live page. */
  protected renderState(t: Translate, v: LiveView) {
    const next = v.next_session;
    const nextLine = next
      ? html`<div class="next">${t("live.next", { meeting: next.meeting, session: t(`sessions.${next.kind}`) })}
          ${next.start
            ? html`<b class="num"><plb-countdown .to=${next.start}></plb-countdown></b>
                <small>${sessionTime(this.hass!, next.start, next.date)}</small>`
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
          <button class="btn" ?disabled=${this.starting} @click=${() => this.start()}>${t("settings.start")}</button>
          ${nextLine}</div>`;
      default:
        return html`<div class="state">${icon(ICON.timer, 28)}<span>${t("live.idle")}</span>${nextLine}</div>`;
    }
  }

  /** The title: the user's, else the card's own; none when `show_title` is off
   *  (the visual editor drops an emptied text field, so it cannot mean "none"). */
  protected cardTitle(t: Translate): string {
    if (this.config.show_title === false) return "";
    return (this.config.title as string | undefined) || this.defaultTitle(t);
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
    if (!this.hass || !v) body = html`<div class="state">${t("common.loading")}</div>`;
    else if (this.hasBoard(v)) body = this.renderBody(t, v);
    else body = this.renderState(t, v);
    const flag =
      v?.state === "final"
        ? html`<span class="tag">${t("live.final")}</span>`
        : v?.state === "stale" || v?.state === "lost"
          ? html`<span class="tag warn">${t(v.state === "lost" ? "cards.lost" : "cards.stale")}</span>`
          : nothing;
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
        background: var(--secondary-background-color); color: var(--secondary-text-color); }
      .tag.warn { background: color-mix(in srgb, var(--warning-color, #ffa600) 20%, transparent); color: var(--primary-text-color); }
      .state { display: grid; justify-items: center; gap: 8px; text-align: center; padding: 16px; color: var(--secondary-text-color); font-size: 14px; }
      .state svg { opacity: 0.5; }
      .state .next { display: grid; gap: 2px; justify-items: center; }
      .state .next b { font-size: 22px; font-weight: 400; color: var(--primary-text-color); }
      .state .next small { font-size: 12px; }
      .row { display: flex; align-items: center; gap: 10px; padding: 6px 16px; font-size: 14px; min-height: 32px; }
      .row + .row { border-top: 1px solid var(--divider-color); }
      .empty { padding: 8px 16px 12px; color: var(--secondary-text-color); font-size: 13px; }
      .btn:disabled { opacity: 0.6; }
    `,
  ];
}
