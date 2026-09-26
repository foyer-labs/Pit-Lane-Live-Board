// Small elements that tick on their own, so the page around them is not redrawn
// every second: a countdown to a moment, and the age of the data shown.
import { LitElement, css, html } from "lit";
import { countdown, number, hassChanged } from "./format";
import { translator } from "./i18n";
import type { Hass } from "./types";

/** "2 d 14 h 06 m": ticks every second under an hour, every 30 s above. */
export class PlbCountdown extends LitElement {
  static override properties = { to: { type: String }, now: { state: true } };
  to = "";
  now = Date.now();
  private timer?: number;

  override connectedCallback(): void {
    super.connectedCallback();
    this.schedule();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearTimeout(this.timer);
  }

  private schedule(): void {
    const left = Date.parse(this.to) - Date.now();
    const every = Number.isFinite(left) && left < 3_600_000 ? 1_000 : 30_000;
    this.timer = window.setTimeout(() => {
      this.now = Date.now();
      this.schedule();
    }, every);
  }

  protected override render() {
    const at = Date.parse(this.to);
    return Number.isFinite(at) ? countdown(at - this.now) : "";
  }

  static override styles = css`
    :host { font-variant-numeric: tabular-nums; }
  `;
}

/** "updated 3.2 s ago": the backend's age plus the time since it arrived. */
export class PlbAge extends LitElement {
  static override properties = {
    hass: { attribute: false, hasChanged: hassChanged },
    age: { type: Number },
    at: { type: Number },
    precise: { type: Boolean },
    now: { state: true },
  };
  hass?: Hass;
  age = 0;
  at = Date.now();
  precise = true;
  now = Date.now();
  private timer?: number;

  override connectedCallback(): void {
    super.connectedCallback();
    this.timer = window.setInterval(() => (this.now = Date.now()), 1_000);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this.timer);
  }

  protected override render() {
    if (!this.hass) return "";
    const seconds = this.age + Math.max(0, this.now - this.at) / 1000;
    return translator(this.hass)("live.updated", { n: number(this.hass, seconds, this.precise ? 1 : 0) });
  }

  static override styles = css`
    :host { font-variant-numeric: tabular-nums; }
  `;
}

export function ageLabel(hass: Hass, age: number, at: number, precise: boolean) {
  return html`<plb-age .hass=${hass} .age=${age} .at=${at} ?precise=${precise}></plb-age>`;
}
