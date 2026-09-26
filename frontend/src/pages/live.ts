// Live (SPEC §7.1). Phase 4: the states around a session (idle, connecting,
// syncing, hidden). The timing tower and its side cards arrive in phase 5.
import { LitElement, css, html, nothing } from "lit";
import { api } from "../api";
import { countdown, sessionTime } from "../format";
import { translator } from "../i18n";
import { ICON, icon } from "../icons";
import { tokens } from "../styles";
import type { Hass, LiveView, Settings } from "../types";

export class PlbLive extends LitElement {
  static override properties = {
    hass: { attribute: false },
    settings: { attribute: false },
    view: { state: true },
    now: { state: true },
  };

  hass!: Hass;
  settings!: Settings;
  view?: LiveView;
  now = Date.now();
  private unsubscribe?: Promise<() => void>;
  private timer?: number;

  override connectedCallback(): void {
    super.connectedCallback();
    this.timer = window.setInterval(() => (this.now = Date.now()), 1000);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this.timer);
    void this.unsubscribe?.then((stop) => stop());
    this.unsubscribe = undefined;
  }

  protected override willUpdate(): void {
    if (this.hass && !this.unsubscribe) {
      this.unsubscribe = api.subscribeLive(this.hass, (view) => (this.view = view));
    }
  }

  protected override render() {
    const t = translator(this.hass);
    const v = this.view;
    if (!v) return html`<div class="card loading">${t("common.loading")}</div>`;
    if (v.state === "hidden") {
      return html`<div class="card state">${icon(ICON.eyeOff, 56)}<h2>${t("live.hidden")}</h2>
        <div>${t("live.hiddenHelp", { meeting: v.header?.meeting ?? "", session: v.header?.session ?? "" })}</div>
        <button class="btn" @click=${() => this.dispatchEvent(new CustomEvent("plb-spoiler-off", { bubbles: true, composed: true }))}>${t("live.showAll")}</button></div>`;
    }
    if (v.state === "syncing") {
      return html`<div class="card state">${icon(ICON.clock, 56)}<h2>${t("live.syncing")}</h2>
        <div>${t("live.syncingHelp", { n: v.delay })}</div></div>`;
    }
    if (v.state === "connecting") {
      return html`<div class="card state">${icon(ICON.timer, 56)}<h2>${t("live.connecting")}</h2></div>`;
    }
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

  static override styles = [tokens, css`:host { display: block; }`];
}
