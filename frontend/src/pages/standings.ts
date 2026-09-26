// Standings (SPEC §7.4): drivers or constructors, any season, after any round.
import { LitElement, css, html, nothing } from "lit";
import { api } from "../api";
import { number } from "../format";
import { translator } from "../i18n";
import { failure, gained, loading, person } from "../parts";
import { tokens } from "../styles";
import { teamColour } from "../teams";
import type { Hass, Settings, StandingsPage } from "../types";

export class PlbStandings extends LitElement {
  static override properties = {
    hass: { attribute: false },
    settings: { attribute: false },
    seasons: { attribute: false },
    season: { state: true },
    kind: { state: true },
    round: { state: true },
    data: { state: true },
    failed: { state: true },
  };

  hass!: Hass;
  settings!: Settings;
  seasons: number[] = [];
  season?: number;
  kind: "drivers" | "constructors" = "drivers";
  round: number | null = null;
  data?: StandingsPage;
  failed = false;
  private request = 0;

  protected override willUpdate(changed: Map<string, unknown>): void {
    if (this.season === undefined && this.settings) this.season = this.settings.season;
    if (["settings", "season", "kind", "round"].some((k) => changed.has(k))) void this.load();
  }

  private async load(): Promise<void> {
    if (!this.hass || this.season === undefined) return;
    const request = ++this.request;
    this.failed = false;
    try {
      const data = await api.standings(this.hass, this.season, this.round, this.kind);
      if (request === this.request) this.data = data;
    } catch {
      if (request === this.request) this.failed = true;
    }
  }

  protected override render() {
    const t = translator(this.hass);
    const seasons = this.seasons.length ? this.seasons : [this.season ?? 0];
    const rounds = this.data?.rounds ?? 0;
    const shown = this.data?.round ?? rounds;
    return html`
      <div class="toolbar">
        <h1>${t("standings.title")}</h1>
        ${(["drivers", "constructors"] as const).map(
          (k) => html`<button class="chip ${this.kind === k ? "on" : ""}" @click=${() => (this.kind = k)}>${t(`standings.${k}`)}</button>`,
        )}
        <span class="spacer"></span>
        <select aria-label=${t("common.season")} @change=${(e: Event) => {
          this.round = null;
          this.data = undefined;
          this.season = Number((e.target as HTMLSelectElement).value);
        }}>
          ${seasons.map((s) => html`<option .selected=${s === this.season} value=${s}>${s}</option>`)}
        </select>
        ${rounds
          ? html`<select aria-label=${t("common.round")} @change=${(e: Event) => (this.round = Number((e.target as HTMLSelectElement).value))}>
              ${Array.from({ length: rounds }, (_, i) => rounds - i).map(
                (r) => html`<option .selected=${r === shown} value=${r}>${t("standings.after", { n: r })}</option>`,
              )}
            </select>`
          : nothing}
      </div>
      ${this.failed ? failure(t, () => this.load()) : !this.data ? loading(t) : this.renderTable(this.data)}
    `;
  }

  private renderTable(data: StandingsPage) {
    const t = translator(this.hass);
    if (!data.rows.length) {
      return html`<div class="card state">${data.capped ? t("spoiler.standingsCap") : t("standings.empty")}</div>`;
    }
    const drivers = this.kind === "drivers";
    const max = data.rows[0].points || 1;
    return html`<div class="card">
      <div class="scroll"><table class="tbl">
        <tr>
          <th>${t("common.pos")}</th><th>${t("standings.change")}</th>
          <th>${drivers ? t("common.driver") : t("common.team")}</th>
          ${drivers ? html`<th class="wide">${t("common.team")}</th>` : nothing}
          <th class="barcol"></th>
          <th class="r">${t("common.points")}</th><th class="r">${t("standings.wins")}</th><th class="r">${t("standings.behind")}</th>
        </tr>
        ${data.rows.map(
          (r) => html`<tr>
            <td class="num">${r.position_text && r.position_text !== String(r.position) ? r.position_text : r.position}</td>
            <td>${gained(r.change, false)}</td>
            <td>${person(drivers ? r.name : r.team, r.team_id)}</td>
            ${drivers ? html`<td class="wide muted">${r.team ?? ""}</td>` : nothing}
            <td class="barcol"><div class="fill" style="width:${((r.points ?? 0) / max) * 100}%;background:${teamColour(r.team_id)}"></div></td>
            <td class="r num"><b>${number(this.hass, r.points)}</b></td>
            <td class="r num">${r.wins ?? ""}</td>
            <td class="r num">${r.behind ? `−${number(this.hass, r.behind)}` : ""}</td>
          </tr>`,
        )}
      </table></div>
      ${data.capped ? html`<div class="note">${t("spoiler.standingsCap")}</div>` : nothing}
    </div>`;
  }

  static override styles = [
    tokens,
    css`
      :host { display: block; }
      .barcol { width: 30%; min-width: 80px; }
      .fill { height: 6px; border-radius: 3px; min-width: 2px; }
      @media (max-width: 900px) { .wide { display: none; } }
      @media (max-width: 640px) { .barcol { display: none; } }
    `,
  ];
}
