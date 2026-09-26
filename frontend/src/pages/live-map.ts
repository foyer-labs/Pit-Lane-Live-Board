// The live track map (SPEC §6.5): its own element with its own subscription, so the
// cars moving four times a second never redraw the rest of the page. It subscribes
// only while it is on screen and the tab is visible; the outline arrives once and
// its path is built once, then only the cars move (a CSS transform each).
import { LitElement, css, html, nothing, svg } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { api } from "../api";
import { hassChanged } from "../format";
import { translator } from "../i18n";
import { onKey } from "../parts";
import type { Hass, MapView, Outline, Row } from "../types";

export class PlbLiveMap extends LitElement {
  static override properties = {
    hass: { attribute: false, hasChanged: hassChanged },
    tower: { attribute: false },
    selected: { type: String },
    outline: { state: true },
    cars: { state: true },
  };

  hass!: Hass;
  tower: Row[] = [];
  selected = "";
  outline?: Outline | null;
  cars: MapView["cars"] = [];
  private path = "";
  private unsubscribe?: () => void;
  private subscribing = false;
  private onScreen = false;
  private observer?: IntersectionObserver;
  private readonly visibility = () => this.sync();

  override connectedCallback(): void {
    super.connectedCallback();
    this.observer = new IntersectionObserver((entries) => {
      this.onScreen = entries.some((e) => e.isIntersecting);
      this.sync();
    });
    this.observer.observe(this);
    document.addEventListener("visibilitychange", this.visibility);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.observer?.disconnect();
    document.removeEventListener("visibilitychange", this.visibility);
    this.stop();
  }

  private stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  /** Subscribed exactly while the map can be seen. */
  private sync(): void {
    const wanted = this.isConnected && this.onScreen && document.visibilityState === "visible";
    if (wanted && !this.unsubscribe && !this.subscribing && this.hass) void this.subscribe();
    else if (!wanted) this.stop();
  }

  private async subscribe(): Promise<void> {
    this.subscribing = true;
    try {
      const unsubscribe = await api.subscribeMap(this.hass, (m) => this.receive(m));
      if (this.isConnected && this.onScreen) this.unsubscribe = unsubscribe;
      else unsubscribe();
    } catch {
      /* no map this time: the next visibility change asks again */
    } finally {
      this.subscribing = false;
    }
  }

  private receive(m: MapView): void {
    if (m.full) {
      const o = m.outline ?? null;
      if (o !== this.outline) {
        this.path = o ? o.points.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ") + (o.points.length ? "Z" : "") : "";
      }
      this.outline = o;
    }
    this.cars = m.cars;
  }

  private select(number: string): void {
    this.dispatchEvent(new CustomEvent("plb-select", { detail: number, bubbles: true, composed: true }));
  }

  private driver(number: string): Row | undefined {
    return this.tower.find((r) => r.number === number);
  }

  protected override render() {
    const t = translator(this.hass);
    const o = this.outline;
    if (!o) return html`<div class="locked">${t("live.mapDrawing")}</div>`;
    // The selected car is drawn last, on top; keys keep each dot on its own car.
    const cars = [
      ...this.cars.filter((c) => c.number !== this.selected),
      ...this.cars.filter((c) => c.number === this.selected),
    ];
    return html`<svg viewBox="0 0 ${o.width} ${o.height}" role="img" aria-label=${t("live.map")}>
      ${this.path ? svg`<path class="track" d=${this.path}></path><path class="track-line" d=${this.path}></path>` : nothing}
      ${repeat(cars, (c) => c.number, (c) => {
        const sel = c.number === this.selected;
        const row = this.driver(c.number);
        const pick = () => this.select(c.number);
        return svg`<g class="car" style="transform:translate(${c.x}px,${c.y}px)" @click=${pick}
            @keydown=${onKey(pick)} tabindex="0" role="button" aria-label=${row?.tla ?? c.number}>
          <circle r=${sel ? 17 : 12} fill=${row?.colour ?? "var(--divider-color)"}
            stroke=${sel ? "var(--primary-text-color)" : "var(--card-background-color)"} stroke-width="4"
            opacity=${c.on_track ? 1 : 0.4}></circle>
          <text x="16" y="-12">${row?.tla ?? c.number}</text></g>`;
      })}
    </svg>`;
  }

  static override styles = css`
    :host { display: block; }
    svg { display: block; width: 100%; height: auto; }
    .track { fill: none; stroke: var(--secondary-background-color); stroke-width: 18; stroke-linejoin: round; }
    .track-line { fill: none; stroke: var(--secondary-text-color); stroke-width: 3; opacity: 0.5; }
    .car { transition: transform 0.25s linear; cursor: pointer; will-change: transform; }
    .car text { font-size: 20px; font-weight: 700; fill: var(--primary-text-color); paint-order: stroke;
      stroke: var(--card-background-color); stroke-width: 5px; }
    .locked { padding: 20px 16px; color: var(--secondary-text-color); font-size: 13px; }
    @media (prefers-reduced-motion: reduce) { .car { transition: none; } }
  `;
}
