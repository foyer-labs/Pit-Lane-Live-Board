// Settings (decision 42): live timing on and off, the TV delay, F1TV access for
// administrators, and the entities the integration provides. Every change goes to
// the backend, which checks it (INV-3: the token is sent once and never shown back).
import { LitElement, css, html, nothing } from "lit";
import { api } from "../api";
import { clockTime, deviceZone, homeZone, longDate } from "../format";
import { saveTimePrefs, timePrefs, type TimePrefs, type ZoneMode } from "../timeprefs";
import { translator, type Translate } from "../i18n";
import { ICON, icon } from "../icons";
import { tokens } from "../styles";
import type { Hass, LinkedEntity, Settings } from "../types";

const TOKEN_ERRORS = new Set(["token_invalid", "token_expired", "token_no_subscription", "token_missing"]);
// "remove_failed" is set here, never by the backend.

export class PlbSettings extends LitElement {
  static override properties = {
    hass: { attribute: false },
    settings: { attribute: false },
    entities: { state: true },
    drivers: { state: true },
    testResult: { state: true },
    token: { state: true },
    tokenError: { state: true },
    saving: { state: true },
    confirmRemove: { state: true },
    busy: { state: true },
    clock: { attribute: false },
  };

  hass!: Hass;
  settings!: Settings;
  entities?: LinkedEntity[];
  drivers?: { code: string; name: string | null; team_id: string | null }[];
  testResult = "";
  token = "";
  tokenError = "";
  saving = false;
  confirmRemove = false;
  busy = false;
  /** Bumped by the panel when the clock of the times changes: drawn again. */
  clock = 0;
  private asked = false;

  protected override willUpdate(): void {
    if (this.hass && !this.asked) {
      this.asked = true;
      void this.loadEntities();
      if (this.settings?.is_admin) void this.loadDrivers();
    }
  }

  /** The season's drivers, to pick from: the championship lists them all. */
  private async loadDrivers(): Promise<void> {
    try {
      // Before the first round the season has no table yet: last season's.
      let page = await api.standings(this.hass, this.settings.season, null, "drivers");
      if (!page.rows.length) page = await api.standings(this.hass, this.settings.season - 1, null, "drivers");
      this.drivers = page.rows
        .filter((r) => r.code)
        .map((r) => ({ code: r.code as string, name: r.name ?? null, team_id: r.team_id }));
    } catch {
      this.drivers = [];
    }
  }

  private async loadEntities(): Promise<void> {
    try {
      this.entities = (await api.entities(this.hass)).entities;
    } catch {
      this.entities = [];
    }
  }

  private async set(values: { live?: boolean; auto_start?: boolean }, box?: EventTarget | null): Promise<void> {
    this.busy = true;
    try {
      await api.setSettings(this.hass, values);
    } catch {
      // Not saved: the box goes back to what is saved (Lit would not redraw it).
      if (box instanceof HTMLInputElement) box.checked = !box.checked;
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
    } catch {
      this.tokenError = "remove_failed";
    } finally {
      this.saving = false;
      this.confirmRemove = false;
    }
  }

  /** Home Assistant's own formatting; before it existed, a timestamp is still
   *  written as a date and time rather than an ISO string. */
  private stateText(state: { state: string; attributes: Record<string, unknown> }, domain: string): string {
    if (this.hass.formatEntityState) return this.hass.formatEntityState(state);
    const timestamp = state.attributes.device_class === "timestamp" || domain === "event";
    if (timestamp && !Number.isNaN(Date.parse(state.state))) {
      return `${longDate(this.hass, state.state)} ${clockTime(this.hass, state.state, true)}`;
    }
    return state.state;
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
      ${this.renderClock(t)}
      ${s.is_admin ? this.renderDrivers(t, s) : nothing}
      ${s.is_admin ? this.renderSummary(t, s) : nothing}
      ${s.is_admin ? this.renderPanel(t, s) : nothing}
      ${s.is_admin ? this.renderF1tv(t, s) : nothing}
      ${this.renderKiosk(t)}
      ${this.renderEntities(t)}
    </div>`;
  }

  private renderLive(t: Translate, s: Settings) {
    const status = !s.live ? t("settings.pausedHelp") : s.running ? t("settings.running") : t("settings.waiting");
    return html`<section class="card">
      <div class="card-head">${t("settings.live")}</div>
      <div class="live">
        <div class="play-box">
          <button class="big-play ${s.live ? "on" : ""}" ?disabled=${this.busy} @click=${() => this.set({ live: !s.live })}
            aria-pressed=${s.live ? "true" : "false"} aria-label=${s.live ? t("settings.pause") : t("settings.start")}>
            ${icon(s.live ? ICON.pause : ICON.play, 36)}
          </button>
          <small aria-hidden="true">${s.live ? t("settings.pauseShort") : t("settings.startShort")}</small>
        </div>
        <div class="what">
          <b>${s.live ? t("settings.on") : t("settings.off")}</b>
          <span>${status}</span>
        </div>
      </div>
      <label class="row">
        <input type="checkbox" .checked=${s.auto_start} ?disabled=${this.busy}
          @change=${(e: Event) => this.set({ auto_start: (e.target as HTMLInputElement).checked }, e.target)} />
        <span><b>${t("settings.autoStart")}</b><small>${t("settings.autoStartHelp")}</small></span>
      </label>
    </section>`;
  }

  private async setHousehold(
    values: {
      favourites?: string[];
      notify_targets?: string[];
      summary_kinds?: string[];
      summary_format?: "compact" | "full";
    },
    box?: EventTarget | null,
  ): Promise<void> {
    this.busy = true;
    try {
      await api.setHousehold(this.hass, values);
      // The entity list gains or loses a driver's sensor.
      if (values.favourites) void this.loadEntities();
    } catch {
      if (box instanceof HTMLInputElement) box.checked = !box.checked;
    } finally {
      this.busy = false;
    }
  }

  private toggle(list: string[], value: string, on: boolean): string[] {
    return on ? [...list.filter((v) => v !== value), value] : list.filter((v) => v !== value);
  }

  private renderDrivers(t: Translate, s: Settings) {
    const chosen = s.favourites ?? [];
    const full = chosen.length >= 5;
    const drivers = this.drivers;
    return html`<section class="card">
      <div class="card-head">${t("drivers.title")}<span class="spacer"></span><small>${t("settings.adminOnly")}</small></div>
      <div class="body">
        <p>${t("drivers.help")}</p>
        ${!drivers
          ? html`<span class="muted">${t("common.loading")}</span>`
          : html`<div class="chips">${drivers.map((d) => {
              const on = chosen.includes(d.code);
              return html`<button class="chip ${on ? "on" : ""}" ?disabled=${this.busy || (!on && full)}
                title=${d.name ?? d.code} aria-pressed=${on ? "true" : "false"}
                @click=${() => this.setHousehold({ favourites: this.toggle(chosen, d.code, !on) })}>
                ${on ? "★ " : ""}${d.code}</button>`;
            })}</div>`}
        <small class="muted">${t("drivers.max")}</small>
      </div>
    </section>`;
  }

  private async testSummary(): Promise<void> {
    this.testResult = "";
    try {
      const { result } = await api.testSummary(this.hass);
      this.testResult =
        result === "sent" ? "summary.testSent" : result === "hidden" ? "summary.testHidden" : "summary.testNothing";
    } catch {
      this.testResult = "summary.testFailed";
    }
  }

  private renderSummary(t: Translate, s: Settings) {
    const services = Object.keys(this.hass.services?.notify ?? {})
      .filter((name) => !["send_message"].includes(name))
      .sort();
    const targets = s.notify_targets ?? [];
    const kinds = s.summary_kinds ?? [];
    const allKinds = ["race", "sprint", "qualifying", "sprint_qualifying", "practice"];
    return html`<section class="card">
      <div class="card-head">${t("summary.title")}<span class="spacer"></span><small>${t("settings.adminOnly")}</small></div>
      <div class="body">
        <p>${t("summary.help")}</p>
        <b class="small">${t("summary.where")}</b>
        ${services.length
          ? services.map(
              (name) => html`<label class="line">
                <input type="checkbox" .checked=${targets.includes(name)} ?disabled=${this.busy}
                  @change=${(e: Event) => this.setHousehold({ notify_targets: this.toggle(targets, name, (e.target as HTMLInputElement).checked) }, e.target)} />
                <span>notify.${name}</span></label>`,
            )
          : html`<span class="muted">${t("summary.noServices")}</span>`}
        <b class="small">${t("summary.which")}</b>
        <div class="chips">${allKinds.map((kind) => {
          const on = kinds.includes(kind);
          return html`<button class="chip ${on ? "on" : ""}" ?disabled=${this.busy}
            @click=${() => this.setHousehold({ summary_kinds: this.toggle(kinds, kind, !on) })}>${t(`sessions.${kind}`)}</button>`;
        })}</div>
        <b class="small">${t("summary.format")}</b>
        <div class="chips" role="radiogroup" aria-label=${t("summary.format")}>
          ${(["compact", "full"] as const).map(
            (format) => html`<button class="chip ${(s.summary_format ?? "compact") === format ? "on" : ""}" role="radio"
              aria-checked=${(s.summary_format ?? "compact") === format ? "true" : "false"} ?disabled=${this.busy}
              @click=${() => this.setHousehold({ summary_format: format })}>${t(`summary.${format}`)}</button>`,
          )}
        </div>
        <small class="muted">${t(`summary.${s.summary_format === "full" ? "fullHelp" : "compactHelp"}`)}</small>
        <div class="line">
          <button class="btn flat" ?disabled=${!targets.length} @click=${() => this.testSummary()}>${t("summary.test")}</button>
          ${this.testResult ? html`<span class="muted small">${t(this.testResult)}</span>` : nothing}
        </div>
        <small class="muted">${t("summary.spoiler")}</small>
      </div>
    </section>`;
  }

  private async setPanel(
    values: { show_in_sidebar?: boolean; admin_only?: boolean },
    box: EventTarget | null,
  ): Promise<void> {
    this.busy = true;
    try {
      await api.setPanel(this.hass, values);
    } catch {
      if (box instanceof HTMLInputElement) box.checked = !box.checked;
    } finally {
      this.busy = false;
    }
  }

  private renderPanel(t: Translate, s: Settings) {
    return html`<section class="card">
      <div class="card-head">${t("settings.panel")}<span class="spacer"></span><small>${t("settings.adminOnly")}</small></div>
      <label class="row">
        <input type="checkbox" .checked=${s.show_in_sidebar} ?disabled=${this.busy}
          @change=${(e: Event) => this.setPanel({ show_in_sidebar: (e.target as HTMLInputElement).checked }, e.target)} />
        <span><b>${t("settings.sidebar")}</b><small>${t("settings.sidebarHelp")}</small></span>
      </label>
      <label class="row">
        <input type="checkbox" .checked=${s.admin_only} ?disabled=${this.busy}
          @change=${(e: Event) => this.setPanel({ admin_only: (e.target as HTMLInputElement).checked }, e.target)} />
        <span><b>${t("settings.adminPanel")}</b><small>${t("settings.adminPanelHelp")}</small></span>
      </label>
    </section>`;
  }

  private async setClock(next: TimePrefs): Promise<void> {
    try {
      await saveTimePrefs(this.hass, next);
    } catch {
      /* not saved: the previous choice is back on screen */
    }
    this.requestUpdate();
  }

  /** Which clock times are in: a choice of each user, not of the house. */
  private renderClock(t: Translate) {
    const prefs = timePrefs();
    const options: [ZoneMode, string][] = [
      ["home_assistant", t("time.home", { zone: homeZone(this.hass) })],
      ["device", t("time.device", { zone: deviceZone() })],
      ["circuit", t("time.circuit")],
    ];
    return html`<section class="card">
      <div class="card-head">${t("time.title")}<span class="spacer"></span><small>${t("time.justYou")}</small></div>
      <div class="radios" role="radiogroup" aria-label=${t("time.title")}>
        ${options.map(
          ([mode, label]) => html`<label class="row">
            <input type="radio" name="clock" .checked=${prefs.zone === mode}
              @change=${() => this.setClock({ ...prefs, zone: mode })} />
            <span><b>${label}</b></span>
          </label>`,
        )}
      </div>
      <label class="row">
        <input type="checkbox" .checked=${prefs.both} @change=${(e: Event) => this.setClock({ ...prefs, both: (e.target as HTMLInputElement).checked })} />
        <span><b>${t("time.both")}</b><small>${t("time.bothHelp")}</small></span>
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
            : html`<button class="btn flat danger" @click=${() => (this.confirmRemove = true)}>${t("settings.remove")}</button>`
          : nothing}
      </div>
    </section>`;
  }

  /** A dedicated screen: the kiosk address and the small-screen sensor. */
  private renderKiosk(t: Translate) {
    const address = `${location.origin}${location.pathname}?kiosk`;
    return html`<section class="card">
      <div class="card-head">${t("kiosk.title")}</div>
      <div class="body">
        <p>${t("kiosk.help")}</p>
        <div class="token">
          <input readonly .value=${address} aria-label=${t("kiosk.title")} @focus=${(e: Event) => (e.target as HTMLInputElement).select()} />
          <button class="btn flat" @click=${() => void navigator.clipboard?.writeText(address)}>${t("kiosk.copy")}</button>
        </div>
        <small class="muted">${t("kiosk.options")}</small>
        <p>${t("kiosk.small")}</p>
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
              <span class="name">${name}<small title=${e.entity_id}>${e.entity_id}</small></span>
              ${((value) => html`<span class="value" title=${value}>${value}</span>`)(
                e.disabled ? t("settings.disabled") : state ? this.stateText(state, e.domain) : "—",
              )}
            </button></li>`;
          })}</ul>`}
      <div class="note">${t("settings.entitiesHelp")}</div>
    </section>`;
  }

  static override styles = [
    tokens,
    css`
      :host { display: block; container-type: inline-size; }
      .page { display: grid; gap: var(--plb-gap); max-width: 760px; margin: 0 auto; }
      .body { padding: 14px 16px; display: grid; gap: 12px; }
      .body p { margin: 0; color: var(--secondary-text-color); font-size: 13px; line-height: 1.5; }
      .small { font-size: 12px; }
      .chips { display: flex; flex-wrap: wrap; gap: 6px; }
      .line { display: flex; align-items: center; gap: 10px; font-size: 14px; }
      .line input { width: 18px; height: 18px; accent-color: var(--primary-color); }
      .body > .btn { justify-self: start; }
      .live { display: flex; align-items: center; gap: 18px; padding: 18px 16px 8px; }
      .play-box { display: grid; justify-items: center; gap: 4px; flex: none; }
      .play-box small { font-size: 11px; color: var(--secondary-text-color); }
      .big-play { width: 72px; height: 72px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer; flex: none;
        background: var(--primary-color); color: var(--text-primary-color, #fff); }
      .big-play.on { background: var(--secondary-background-color); color: var(--primary-text-color); box-shadow: inset 0 0 0 2px var(--divider-color); }
      .big-play:disabled { opacity: 0.6; cursor: default; }
      .what { display: grid; gap: 4px; font-size: 13px; color: var(--secondary-text-color); line-height: 1.5; }
      .what b { font-size: 16px; color: var(--primary-text-color); font-weight: 500; }
      .row { display: flex; gap: 12px; align-items: flex-start; padding: 12px 16px 16px; cursor: pointer; }
      .row input { width: 18px; height: 18px; margin-top: 2px; accent-color: var(--primary-color); }
      .radios .row { padding-top: 8px; padding-bottom: 8px; }
      .radios .row:first-child { padding-top: 14px; }
      .row span { display: grid; gap: 2px; font-size: 14px; }
      .row small { color: var(--secondary-text-color); font-size: 12px; line-height: 1.5; }
      .stepper { display: flex; align-items: center; gap: 10px; }
      .stepper button { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--divider-color);
        background: none; color: inherit; font-size: 18px; cursor: pointer; }
      .stepper b { font-size: 22px; font-weight: 500; min-width: 110px; text-align: center; }
      input[type="range"] { width: 100%; accent-color: var(--primary-color); }
      .status { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 14px; }
      .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--divider-color); }
      .dot.active { background: var(--plb-green); }
      .dot.expiring { background: var(--warning-color, #ffa600); }
      .dot.expired, .dot.invalid { background: var(--error-color, #db4437); }
      .token { display: flex; gap: 8px; }
      .token input { flex: 1; min-width: 0; height: 40px; box-sizing: border-box; border-radius: 8px; border: 1px solid var(--divider-color);
        background: var(--card-background-color); color: var(--primary-text-color); padding: 0 10px; font: inherit; }
      .error-text { color: var(--error-color, #db4437); font-size: 13px; }
      .confirm { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 13px; }
      .btn.danger:not(.flat) { background: var(--error-color, #db4437); }
      .entities { list-style: none; margin: 0; padding: 0; }
      .entity { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 16px; border: 0; border-bottom: 1px solid var(--divider-color);
        background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
      .entity:hover { background: var(--plb-row-alt); }
      .entity .name { flex: 1; display: grid; gap: 2px; min-width: 0; font-size: 14px; }
      .entity small { color: var(--secondary-text-color); font-size: 11px; overflow: hidden; text-overflow: ellipsis; }
      .entity .value { color: var(--secondary-text-color); font-size: 13px; max-width: 45%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      @container (max-width: 640px) {
        .token { flex-direction: column; }
      }
    `,
  ];
}
