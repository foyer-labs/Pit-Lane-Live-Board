// The live track map (SPEC §6.5): its own element with its own subscription, so the
// cars moving four times a second never redraw the rest of the page. It subscribes
// only while it is on screen and the tab is visible; the outline arrives once and
// its path is built once, then only the cars move.
//
// The outline is SVG; the cars are HTML over it, each moved by a CSS transform in
// container units. A transform on an HTML element is animated by the compositor,
// off the main thread (on an SVG child it would cost a style, layout and paint of
// the whole map on every frame). Labels are placed so they do not overlap: each
// tries the right, the left, above and below, and the ones that fit nowhere are
// left out, except the selected driver's and the household's.
import { LitElement, css, html, nothing, svg } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { api } from "../api";
import { hassChanged } from "../format";
import { translator } from "../i18n";
import type { Hass, MapView, Outline, Row } from "../types";

const RETRY_FIRST = 5_000;
const RETRY_MAX = 60_000;
// Room around the outline, as a share of its larger side, for the track's width
// and the labels of cars on the edge.
const PAD = 0.05;
// A label's box in CSS pixels: three bold letters at 12 px, and where it sits.
const LABEL_W = 30;
const LABEL_H = 15;
const SIDES = ["r", "l", "t", "b"] as const;
type Side = (typeof SIDES)[number];
const OFFSET: Record<Side, [number, number]> = {
  r: [9, -LABEL_H / 2],
  l: [-9 - LABEL_W, -LABEL_H / 2],
  t: [-LABEL_W / 2, -8 - LABEL_H],
  b: [-LABEL_W / 2, 8],
};

export class PlbLiveMap extends LitElement {
  static override properties = {
    hass: { attribute: false, hasChanged: hassChanged },
    tower: { attribute: false },
    selected: { type: String },
    favourites: { attribute: false },
    outline: { state: true },
    cars: { state: true },
    width: { state: true },
  };

  hass!: Hass;
  tower: Row[] = [];
  /** A racing number or a TLA (the map card's `highlight`). */
  selected = "";
  favourites: string[] = [];
  outline?: Outline | null;
  cars: MapView["cars"] = [];
  /** The map's width in CSS pixels, for placing the labels. */
  width = 0;
  private path = "";
  private unsubscribe?: () => void;
  private subscribing = false;
  private retry?: number;
  private backoff = RETRY_FIRST;
  private onScreen = false;
  private observer?: IntersectionObserver;
  private resize?: ResizeObserver;
  private sides = new Map<string, Side>();
  private focusNumber = "";
  private readonly visibility = () => this.sync();

  override connectedCallback(): void {
    super.connectedCallback();
    this.observer = new IntersectionObserver((entries) => {
      this.onScreen = entries.some((e) => e.isIntersecting);
      this.sync();
    });
    this.observer.observe(this);
    this.resize = new ResizeObserver((entries) => {
      const width = Math.round(entries[0]?.contentRect.width ?? 0);
      if (Math.abs(width - this.width) > 2) this.width = width;
    });
    this.resize.observe(this);
    document.addEventListener("visibilitychange", this.visibility);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.observer?.disconnect();
    this.resize?.disconnect();
    document.removeEventListener("visibilitychange", this.visibility);
    this.stop();
  }

  private stop(): void {
    window.clearTimeout(this.retry);
    this.retry = undefined;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  /** Subscribed exactly while the map can be seen. */
  private sync(): void {
    const wanted = this.isConnected && this.onScreen && document.visibilityState === "visible";
    if (wanted && !this.unsubscribe && !this.subscribing && this.retry === undefined && this.hass) void this.subscribe();
    else if (!wanted) this.stop();
  }

  private async subscribe(): Promise<void> {
    this.subscribing = true;
    let failed = false;
    try {
      const unsubscribe = await api.subscribeMap(this.hass, (m) => this.receive(m));
      // Hidden or scrolled away while subscribing: sync() below lets go at once.
      this.unsubscribe = unsubscribe;
      this.backoff = RETRY_FIRST;
    } catch {
      failed = true;
    } finally {
      this.subscribing = false;
    }
    if (failed) {
      // Not at once (the integration may be starting): again after a pause that
      // grows, while the map can still be seen.
      if (this.isConnected) {
        this.retry = window.setTimeout(() => {
          this.retry = undefined;
          this.sync();
        }, this.backoff);
        this.backoff = Math.min(this.backoff * 2, RETRY_MAX);
      }
      return;
    }
    this.sync();
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

  /** Arrow keys move between the cars; one car at a time is in the tab order. */
  private key(event: KeyboardEvent, numbers: string[], number: string): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.select(number);
      return;
    }
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = numbers[(numbers.indexOf(number) + step + numbers.length) % numbers.length];
    this.focusNumber = next;
    this.renderRoot.querySelector<HTMLElement>(`[data-number="${next}"]`)?.focus();
    this.requestUpdate();
  }

  /** Where each label goes: the important ones first, each on the first side
   *  that overlaps no dot and no label already placed and stays inside the map
   *  (the side it had last time is tried first, so labels do not jump about). */
  private placeLabels(
    cars: { number: string; x: number; y: number; important: boolean }[],
    width: number,
    height: number,
  ): Map<string, Side | null> {
    // Every dot is in the way too: a label over another car hides it.
    const placed: [number, number, number, number][] = cars.map((c) => [c.x - 7, c.y - 7, c.x + 7, c.y + 7]);
    const out = new Map<string, Side | null>();
    const overlaps = (a: [number, number, number, number]) =>
      placed.some((b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]);
    for (const car of cars) {
      const before = this.sides.get(car.number);
      const order = before ? [before, ...SIDES.filter((s) => s !== before)] : [...SIDES];
      let chosen: Side | null = null;
      let fallback: [number, number, number, number] | null = null;
      for (const side of order) {
        const [dx, dy] = OFFSET[side];
        const box: [number, number, number, number] = [car.x + dx, car.y + dy, car.x + dx + LABEL_W, car.y + dy + LABEL_H];
        const inside = box[0] >= 0 && box[2] <= width && box[1] >= 0 && box[3] <= height;
        if (inside && !fallback) fallback = box;
        if (inside && !overlaps(box)) {
          chosen = side;
          placed.push(box);
          break;
        }
      }
      if (!chosen && car.important && fallback) {
        // Always labelled: on the first side inside the map, over another label.
        chosen = order.find((side) => {
          const [dx, dy] = OFFSET[side];
          return car.x + dx >= 0 && car.x + dx + LABEL_W <= width && car.y + dy >= 0 && car.y + dy + LABEL_H <= height;
        }) ?? null;
        placed.push(fallback);
      }
      out.set(car.number, chosen);
      if (chosen) this.sides.set(car.number, chosen);
    }
    return out;
  }

  protected override render() {
    const t = translator(this.hass);
    const o = this.outline;
    if (!o) return html`<div class="locked">${t("live.mapDrawing")}</div>`;
    const pad = Math.max(o.width, o.height) * PAD;
    const vw = o.width + 2 * pad;
    const vh = o.height + 2 * pad;
    const rows = new Map(this.tower.map((r) => [r.number, r]));
    const favourites = new Set(this.favourites);
    const wanted = this.selected.toUpperCase();
    // Only the cars in the session's tower, and not the ones out of the race.
    const cars = this.cars.filter((c) => {
      const row = rows.get(c.number);
      return row ? row.status !== "retired" : !this.tower.length;
    });
    const isSelected = (number: string) => {
      const row = rows.get(number);
      return !!wanted && (number === wanted || row?.tla === wanted);
    };
    // Label placement in pixels (a guess of 380 px until the map is measured).
    const px = (this.width || 380) / vw;
    const byPriority = cars
      .map((c) => {
        const row = rows.get(c.number);
        const important = isSelected(c.number) || (row ? favourites.has(row.tla) : false);
        return { number: c.number, x: (c.x + pad) * px, y: (c.y + pad) * px, important, position: row?.position ?? 99 };
      })
      .sort((a, b) => Number(b.important) - Number(a.important) || a.position - b.position);
    const sides = this.placeLabels(byPriority, vw * px, vh * px);
    const numbers = cars.map((c) => c.number);
    const focusable = numbers.includes(this.focusNumber) ? this.focusNumber : (numbers.find(isSelected) ?? numbers[0]);
    // The position in container units: the same share of the width on both axes.
    const unit = 100 / vw;
    return html`<div class="map" role="group" aria-label=${t("live.map")} style="aspect-ratio:${vw} / ${vh}">
      <svg viewBox="${-pad} ${-pad} ${vw} ${vh}" aria-hidden="true">
        ${this.path ? svg`<path class="track" d=${this.path}></path><path class="track-line" d=${this.path}></path>` : nothing}
      </svg>
      ${repeat(cars, (c) => c.number, (c) => {
        const row = rows.get(c.number);
        const sel = isSelected(c.number);
        const side = sides.get(c.number);
        const classes = [
          "car",
          sel ? "sel" : "",
          row?.position === 1 ? "leader" : "",
          row && favourites.has(row.tla) ? "fav" : "",
          c.on_track && row?.status !== "stopped" ? "" : "off",
        ].join(" ");
        return html`<div class=${classes} data-number=${c.number} role="button" tabindex=${c.number === focusable ? "0" : "-1"}
            aria-label=${row?.tla ?? c.number} aria-pressed=${sel ? "true" : "false"}
            style="transform:translate(${((c.x + pad) * unit).toFixed(3)}cqw,${((c.y + pad) * unit).toFixed(3)}cqw);--c:${row?.colour ?? "var(--divider-color)"}"
            @click=${() => this.select(c.number)} @keydown=${(e: KeyboardEvent) => this.key(e, numbers, c.number)}
            @focus=${() => (this.focusNumber = c.number)}>
          <span class="dot"></span>${side ? html`<span class="label ${side}">${row?.tla ?? c.number}</span>` : nothing}</div>`;
      })}
    </div>`;
  }

  static override styles = css`
    :host { display: block; padding: 4px; }
    .map { position: relative; container-type: inline-size; width: 100%; }
    svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    .track { fill: none; stroke: var(--secondary-background-color); stroke-width: 18; stroke-linejoin: round; }
    .track-line { fill: none; stroke: var(--secondary-text-color); stroke-width: 3; opacity: 0.5; }
    .car { position: absolute; left: 0; top: 0; width: 0; height: 0; cursor: pointer; outline: none;
      transition: transform 0.25s linear; will-change: transform; }
    .dot { position: absolute; left: -6px; top: -6px; width: 12px; height: 12px; border-radius: 50%; box-sizing: border-box;
      background: var(--c); border: 2px solid var(--card-background-color); }
    .car.leader .dot { box-shadow: 0 0 0 2px var(--plb-yellow); }
    .car.fav .dot { box-shadow: 0 0 0 2px #f2c200; }
    .car.sel { z-index: 2; }
    .car.sel .dot { left: -9px; top: -9px; width: 18px; height: 18px; border: 3px solid var(--primary-text-color); }
    .car.off { opacity: 0.4; }
    .car:focus-visible .dot { box-shadow: 0 0 0 3px var(--primary-color); }
    /* The dot is small; the target around it is 36 px. */
    .car::before { content: ""; position: absolute; left: -18px; top: -18px; width: 36px; height: 36px; border-radius: 50%; }
    .label { position: absolute; width: ${LABEL_W}px; height: ${LABEL_H}px; line-height: ${LABEL_H}px; font-size: 12px; font-weight: 700;
      color: var(--primary-text-color); text-align: center; pointer-events: none; white-space: nowrap;
      text-shadow: 0 0 3px var(--card-background-color), 0 0 3px var(--card-background-color), 0 0 2px var(--card-background-color); }
    .label.r { left: ${OFFSET.r[0]}px; top: ${OFFSET.r[1]}px; text-align: left; }
    .label.l { left: ${OFFSET.l[0]}px; top: ${OFFSET.l[1]}px; text-align: right; }
    .label.t { left: ${OFFSET.t[0]}px; top: ${OFFSET.t[1]}px; }
    .label.b { left: ${OFFSET.b[0]}px; top: ${OFFSET.b[1]}px; }
    .car.sel .label { z-index: 1; }
    .locked { padding: 20px 16px; color: var(--secondary-text-color); font-size: 13px; }
    @media (prefers-reduced-motion: reduce) { .car { transition: none; } }
  `;
}
