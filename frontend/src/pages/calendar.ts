// Calendar (SPEC §7.2): one card per meeting, sessions in Home Assistant's timezone,
// the next one counting down, finished ones with their podium (decision 28).
import { LitElement, css, html, nothing } from "lit";
import { api } from "../api";
import { countdown, dayRange, sessionTime } from "../format";
import { translator } from "../i18n";
import { failure, loading, person, spoilerKey } from "../parts";
import { tokens } from "../styles";
import type { CalendarPage, Hass, Meeting, Settings } from "../types";

export class PlbCalendar extends LitElement {
  static override properties = {
    hass: { attribute: false },
    settings: { attribute: false },
    seasons: { attribute: false },
    season: { state: true },
    data: { state: true },
    failed: { state: true },
    now: { state: true },
  };

  hass!: Hass;
  settings!: Settings;
  seasons: number[] = [];
  season?: number;
  data?: CalendarPage;
  failed = false;
  now = Date.now();
  private timer?: number;
  private request = 0;
  private spoilers = "";

  override connectedCallback(): void {
    super.connectedCallback();
    this.timer = window.setInterval(() => (this.now = Date.now()), 30_000);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this.timer);
  }

  protected override willUpdate(changed: Map<string, unknown>): void {
    if (this.season === undefined && this.settings) this.season = this.settings.season;
    const spoilers = spoilerKey(this.settings);
    if (changed.has("season") || spoilers !== this.spoilers) {
      this.spoilers = spoilers;
      void this.load();
    }
  }

  private async load(): Promise<void> {
    if (!this.hass || this.season === undefined) return;
    const request = ++this.request;
    this.failed = false;
    try {
      const data = await api.calendar(this.hass, this.season);
      if (request === this.request) this.data = data;
    } catch {
      if (request === this.request) this.failed = true;
    }
  }

  protected override render() {
    const t = translator(this.hass);
    const seasons = this.seasons.length ? this.seasons : [this.season ?? 0];
    return html`
      <div class="toolbar">
        <h1>${t("calendar.title")}</h1>
        <select aria-label=${t("common.season")} @change=${(e: Event) => {
          this.data = undefined;
          this.season = Number((e.target as HTMLSelectElement).value);
        }}>
          ${seasons.map((s) => html`<option .selected=${s === this.season} value=${s}>${s}</option>`)}
        </select>
      </div>
      ${this.failed
        ? failure(t, () => this.load())
        : !this.data || this.data.season !== this.season
          ? loading(t)
          : this.data.meetings.length
            ? html`<div class="cal">${this.data.meetings.map((m) => this.renderMeeting(m))}</div>`
            : html`<div class="card state">${t("calendar.empty")}</div>`}
    `;
  }

  private go(detail: { page: string; season?: number; round?: number }): void {
    this.dispatchEvent(new CustomEvent("plb-go", { detail, bubbles: true, composed: true }));
  }

  private renderMeeting(m: Meeting) {
    const t = translator(this.hass);
    const first = m.sessions[0]?.date;
    const last = m.sessions[m.sessions.length - 1]?.date;
    const next = m.state === "next" ? m.sessions.find((s) => s.start && Date.parse(s.start) > this.now) : undefined;
    return html`<div class="card meet ${m.state}">
      <div class="meet-head"><span class="round">${t("calendar.round", { n: m.round })}</span><h3>${m.name}</h3></div>
      <div class="where">${[m.locality, m.country].filter(Boolean).join(" · ")}${first && last ? ` · ${dayRange(this.hass, first, last)}` : ""}</div>
      ${m.sprint || m.state === "next" || m.state === "live"
        ? html`<div class="flagline">
            ${m.sprint ? html`<span class="pill sprint">${t("common.sprint")}</span>` : nothing}
            ${m.state === "next" ? html`<span class="pill">${t("calendar.next")}</span>` : nothing}
            ${m.state === "live" ? html`<span class="pill live">${t("calendar.live")}</span>` : nothing}
          </div>`
        : nothing}
      ${m.state === "done"
        ? html`<div class="podium">
              ${m.podium_hidden
                ? html`<div class="hidden-cell">${t("spoiler.hiddenRound")}</div>`
                : (m.podium ?? []).map(
                    (p, i) => html`<div><b>${i + 1}</b>${person(p.name, p.team_id)}</div>`,
                  )}
            </div>
            <button class="link more" @click=${() => this.go({ page: "results", season: m.season, round: m.round })}>
              ${t("calendar.results")} →
            </button>`
        : html`<ul>
            ${m.sessions.map(
              (s) => html`<li><span>${t(`sessions.${s.kind}`)}</span><span class="num">${sessionTime(this.hass, s.start, s.date)}</span></li>`,
            )}
          </ul>`}
      ${m.state === "live"
        ? html`<button class="link more" @click=${() => this.go({ page: "live" })}>${t("calendar.watch")} →</button>`
        : nothing}
      ${next?.start
        ? html`<div class="countdown">${t(`sessions.${next.kind}`)} · ${t("calendar.startsIn")}
            <b class="num">${countdown(Date.parse(next.start) - this.now)}</b></div>`
        : nothing}
    </div>`;
  }

  static override styles = [
    tokens,
    css`
      :host { display: block; }
      .cal { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--plb-gap); align-items: start; }
      .meet { display: grid; }
      .meet-head { display: flex; align-items: baseline; gap: 10px; padding: 14px 16px 6px; }
      .round { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); letter-spacing: 0.06em; }
      h3 { margin: 0; font-size: 17px; font-weight: 500; }
      .where { padding: 0 16px 10px; color: var(--secondary-text-color); font-size: 13px; }
      .flagline { display: flex; align-items: center; gap: 6px; padding: 0 16px 10px; }
      ul { list-style: none; margin: 0; padding: 0 16px 12px; display: grid; gap: 6px; font-size: 13px; }
      li { display: flex; gap: 10px; }
      li span:first-child { width: 150px; color: var(--secondary-text-color); }
      .meet.done { opacity: 0.8; }
      .meet.next { outline: 2px solid var(--primary-color); outline-offset: -2px; }
      .meet.live { outline: 2px solid var(--error-color, #db4437); outline-offset: -2px; }
      .countdown {
        margin: 0 16px 14px; padding: 10px 12px; border-radius: 8px; font-size: 13px;
        background: color-mix(in srgb, var(--primary-color) 10%, transparent);
      }
      .countdown b { font-size: 18px; font-weight: 500; }
      .podium { display: grid; gap: 4px; padding: 0 16px 10px; font-size: 13px; }
      .podium div { display: flex; align-items: center; gap: 8px; }
      .podium b { width: 18px; color: var(--secondary-text-color); font-weight: 500; }
      .more { justify-self: start; margin: 0 16px 14px; font-size: 13px; }
      @media (max-width: 640px) {
        .cal { grid-template-columns: 1fr; }
        li span:first-child { width: 130px; }
      }
    `,
  ];
}
