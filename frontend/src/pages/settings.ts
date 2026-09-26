// Settings (decision 42): live timing on and off, the TV delay, F1TV access for
// administrators, and the entities the integration provides. Every change goes to
// the backend, which checks it (INV-3: the token is sent once and never shown back).
import { LitElement, css, html, nothing } from "lit";
import { api } from "../api";
import { longDate } from "../format";
import { translator, type Translate } from "../i18n";
import { ICON, icon } from "../icons";
import { tokens } from "../styles";
import type { Hass, LinkedEntity, Settings } from "../types";

const TOKEN_ERRORS = new Set(["token_invalid", "token_expired", "token_no_subscription", "token_missing"]);

export class PlbSettings extends LitElement {
  static override properties = {
    hass: { attribute: false },
    settings: { attribute: false },
    entities: { state: true },
    token: { state: true },
    tokenError: { state: true },
    saving: { state: true },
    confirmRemove: { state: true },
    busy: { state: true },
  };

  hass!: Hass;
  settings!: Settings;
  entities?: LinkedEntity[];
  token = "";
  tokenError = "";
  saving = false;
  confirmRemove = false;
  busy = false;
  private asked = false;

  protected override willUpdate(): void {
    if (this.hass && !this.asked) {
      this.asked = true;
      void this.loadEntities();
    }
  }

  private async loadEntities(): Promise<void> {
    try {
      this.entities = (await api.entities(this.hass)).entities;
    } catch {
      this.entities = [];
    }
  }

  private async set(values: { live?: boolean; auto_start?: boolean }): Promise<void> {
    this.busy = true;
    try {
      await api.setSettings(this.hass, values);
    } catch {
      /* the subscription keeps showing the real state */
    } finally {
      this.busy = false;
    }
  }

  private delay(value: number): void {
    this.dispatchEvent(new CustomEvent("plb-delay", { detail: value, bubbles: true, composed: true }));
  }

  private async saveToken(): Promise<void> {
    const token = this.token.trim();
    if (!token) {
      this.tokenError = "token_missing";
      return;
    }
    this.saving = true;
    this.tokenError = "";
    try {
      await api.setToken(this.hass, token);
      this.token = "";
    } catch (err) {
      const code = (err as { message?: string })?.message ?? "";
      this.tokenError = TOKEN_ERRORS.has(code) ? code : "token_invalid";
    } finally {
      this.saving = false;
    }
  }

  private async removeToken(): Promise<void> {
    this.saving = true;
    try {
      await api.removeToken(this.hass);
    } finally {
      this.saving = false;
      this.confirmRemove = false;
    }
  }

  private moreInfo(entityId: string): void {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }

  protected override render() {
    const t = translator(this.hass);
    const s = this.settings;
    return html`<div class="page">
      ${this.renderLive(t, s)}
      ${this.renderDelay(t, s)}
      ${s.is_admin ? this.renderF1tv(t, s) : nothing}
      ${this.renderEntities(t)}
    </div>`;
  }

  private renderLive(t: Translate, s: Settings) {
    const status = !s.live ? t("settings.pausedHelp") : s.running ? t("settings.running") : t("settings.waiting");
    return html`<section class="card">
      <div class="card-head">${t("settings.live")}</div>
      <div class="live">
        <button class="big-play ${s.live ? "on" : ""}" ?disabled=${this.busy} @click=${() => this.set({ live: !s.live })}
          aria-pressed=${s.live ? "true" : "false"} aria-label=${s.live ? t("settings.pause") : t("settings.start")}>
          ${icon(s.live ? ICON.pause : ICON.play, 36)}
        </button>
        <div class="what">
          <b>${s.live ? t("settings.on") : t("settings.off")}</b>
          <span>${status}</span>
        </div>
      </div>
      <label class="row">
        <input type="checkbox" .checked=${s.auto_start} ?disabled=${this.busy}
          @change=${(e: Event) => this.set({ auto_start: (e.target as HTMLInputElement).checked })} />
        <span><b>${t("settings.autoStart")}</b><small>${t("settings.autoStartHelp")}</small></span>
      </label>
    </section>`;
  }

  private renderDelay(t: Translate, s: Settings) {
    return html`<section class="card">
      <div class="card-head">${t("delay.title")}</div>
      <div class="body">
        <p>${t("delay.help")}</p>
        <div class="stepper">
          <button @click=${() => this.delay(s.tv_delay - 1)} aria-label=${t("delay.less")}>−</button>
          <b class="num">${s.tv_delay ? t("delay.seconds", { n: s.tv_delay }) : t("delay.none")}</b>
          <button @click=${() => this.delay(s.tv_delay + 1)} aria-label=${t("delay.more")}>+</button>
        </div>
        <input type="range" min="0" max="120" step="1" .value=${String(s.tv_delay)} aria-label=${t("delay.title")}
          @input=${(e: Event) => this.delay(Number((e.target as HTMLInputElement).value))} />
      </div>
    </section>`;
  }

  private renderF1tv(t: Translate, s: Settings) {
    const f = s.f1tv;
    const configured = f && f.status !== "not_configured";
    return html`<section class="card">
      <div class="card-head">F1TV<span class="spacer"></span><small>${t("settings.adminOnly")}</small></div>
      <div class="body">
        <p>${t("settings.f1tvHelp")}</p>
        <div class="status">
          <span class="dot ${f?.status ?? ""}"></span><b>${t(`f1tv.${f?.status ?? "not_configured"}`)}</b>
          ${f?.expires ? html`<span class="muted">${t("settings.expires", { date: longDate(this.hass, f.expires) })}</span>` : nothing}
        </div>
        <form class="token" @submit=${(e: Event) => { e.preventDefault(); void this.saveToken(); }}>
          <input type="password" autocomplete="off" spellcheck="false" .value=${this.token}
            placeholder=${t(configured ? "settings.tokenReplace" : "settings.tokenPaste")}
            aria-label=${t("settings.tokenPaste")}
            @input=${(e: Event) => { this.token = (e.target as HTMLInputElement).value; this.tokenError = ""; }} />
          <button class="btn" type="submit" ?disabled=${this.saving || !this.token.trim()}>${t("settings.save")}</button>
        </form>
        ${this.tokenError ? html`<div class="error-text" role="alert">${t(`settings.errors.${this.tokenError}`)}</div>` : nothing}
        <p class="muted small">${t("settings.tokenSteps")}</p>
        ${configured
          ? this.confirmRemove
            ? html`<div class="confirm">${t("settings.removeConfirm")}
                <button class="btn danger" ?disabled=${this.saving} @click=${() => this.removeToken()}>${t("settings.remove")}</button>
                <button class="btn flat" @click=${() => (this.confirmRemove = false)}>${t("settings.cancel")}</button></div>`
            : html`<button class="btn flat" @click=${() => (this.confirmRemove = true)}>${t("settings.remove")}</button>`
          : nothing}
      </div>
    </section>`;
  }

  private renderEntities(t: Translate) {
    const list = this.entities;
    return html`<section class="card">
      <div class="card-head">${t("settings.entities")}</div>
      ${!list
        ? html`<div class="body muted">${t("common.loading")}</div>`
        : html`<ul class="entities">${list.map((e) => {
            const state = this.hass.states?.[e.entity_id];
            const name = (state?.attributes.friendly_name as string | undefined) ?? e.entity_id;
            return html`<li><button class="entity" @click=${() => this.moreInfo(e.entity_id)}>
              <span class="name">${name}<small>${e.entity_id}</small></span>
              <span class="value">${e.disabled
                ? t("settings.disabled")
                : state
                  ? (this.hass.formatEntityState?.(state) ?? state.state)
                  : "—"}</span>
            </button></li>`;
          })}</ul>`}
      <div class="note">${t("settings.entitiesHelp")}</div>
    </section>`;
  }

  static override styles = [
    tokens,
    css`
      :host { display: block; }
      .page { display: grid; gap: var(--plb-gap); max-width: 760px; margin: 0 auto; }
      .body { padding: 14px 16px; display: grid; gap: 12px; }
      .body p { margin: 0; color: var(--secondary-text-color); font-size: 13px; line-height: 1.5; }
      .small { font-size: 12px; }
      .body > .btn { justify-self: start; }
      .live { display: flex; align-items: center; gap: 18px; padding: 18px 16px 8px; }
      .big-play { width: 72px; height: 72px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer; flex: none;
        background: var(--primary-color); color: var(--text-primary-color, #fff); }
      .big-play.on { background: var(--secondary-background-color); color: var(--primary-text-color); box-shadow: inset 0 0 0 2px var(--divider-color); }
      .big-play:disabled { opacity: 0.6; cursor: default; }
      .what { display: grid; gap: 4px; font-size: 13px; color: var(--secondary-text-color); line-height: 1.5; }
      .what b { font-size: 16px; color: var(--primary-text-color); font-weight: 500; }
      .row { display: flex; gap: 12px; align-items: flex-start; padding: 12px 16px 16px; cursor: pointer; }
      .row input { width: 18px; height: 18px; margin-top: 2px; accent-color: var(--primary-color); }
      .row span { display: grid; gap: 2px; font-size: 14px; }
      .row small { color: var(--secondary-text-color); font-size: 12px; line-height: 1.5; }
      .stepper { display: flex; align-items: center; gap: 10px; }
      .stepper button { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--divider-color);
        background: none; color: inherit; font-size: 18px; cursor: pointer; }
      .stepper b { font-size: 22px; font-weight: 500; min-width: 110px; text-align: center; }
      input[type="range"] { width: 100%; accent-color: var(--primary-color); }
      .status { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 14px; }
      .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--divider-color); }
      .dot.active { background: var(--plb-green); }
      .dot.expiring { background: var(--warning-color, #ffa600); }
      .dot.expired, .dot.invalid { background: var(--error-color, #db4437); }
      .token { display: flex; gap: 8px; }
      .token input { flex: 1; min-width: 0; height: 36px; border-radius: 8px; border: 1px solid var(--divider-color);
        background: var(--card-background-color); color: var(--primary-text-color); padding: 0 10px; font: inherit; }
      .error-text { color: var(--error-color, #db4437); font-size: 13px; }
      .confirm { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 13px; }
      .btn.danger { background: var(--error-color, #db4437); }
      .btn:disabled { opacity: 0.6; cursor: default; }
      .entities { list-style: none; margin: 0; padding: 0; }
      .entity { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 16px; border: 0; border-bottom: 1px solid var(--divider-color);
        background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
      .entity:hover { background: var(--plb-row-alt); }
      .entity .name { flex: 1; display: grid; gap: 2px; min-width: 0; font-size: 14px; }
      .entity small { color: var(--secondary-text-color); font-size: 11px; overflow: hidden; text-overflow: ellipsis; }
      .entity .value { color: var(--secondary-text-color); font-size: 13px; max-width: 45%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      @media (max-width: 640px) {
        .token { flex-direction: column; }
      }
    `,
  ];
}
