// One live subscription, and one settings subscription, for every card on the page
// (decision 47): five cards on a dashboard share one stream from the backend, not
// five. A stream opens with the first card and closes a few seconds after the last
// one goes, so editing a dashboard (cards removed and added again) does not
// reconnect each time.
import { api } from "../api";
import { mergeLive } from "../merge";
import type { Hass, LiveView, Settings } from "../types";

/** A listener hears every value, and `null` when the stream could not open (it
 *  keeps trying on its own: the next value clears it). */
type Listener<T> = (value: T | null) => void;

const CLOSE_AFTER = 5_000;
const RETRY_AFTER = 10_000;

class SharedStream<T, M> {
  private value?: T;
  private failed = false;
  private readonly listeners = new Set<Listener<T>>();
  private unsubscribe?: () => void;
  private opening = false;
  private closeTimer?: number;
  private retryTimer?: number;

  constructor(
    private readonly subscribe: (hass: Hass, callback: (message: M) => void) => Promise<() => void>,
    private readonly merge: (value: T | undefined, message: M) => T,
  ) {}

  listen(hass: Hass, listener: Listener<T>): () => void {
    this.listeners.add(listener);
    window.clearTimeout(this.closeTimer);
    if (this.value) listener(this.value);
    else if (this.failed) listener(null);
    if (!this.unsubscribe && !this.opening) {
      window.clearTimeout(this.retryTimer);
      void this.open(hass);
    }
    return () => {
      this.listeners.delete(listener);
      if (!this.listeners.size) {
        window.clearTimeout(this.closeTimer);
        this.closeTimer = window.setTimeout(() => this.close(), CLOSE_AFTER);
      }
    };
  }

  private async open(hass: Hass): Promise<void> {
    this.opening = true;
    try {
      const unsubscribe = await this.subscribe(hass, (message) => {
        this.value = this.merge(this.value, message);
        this.failed = false;
        for (const listener of this.listeners) listener(this.value);
      });
      if (this.listeners.size) this.unsubscribe = unsubscribe;
      else unsubscribe();
    } catch {
      if (!this.value) {
        this.failed = true;
        for (const listener of this.listeners) listener(null);
      }
      window.clearTimeout(this.retryTimer);
      this.retryTimer = window.setTimeout(() => {
        if (this.listeners.size && !this.unsubscribe && !this.opening) void this.open(hass);
      }, RETRY_AFTER);
    } finally {
      this.opening = false;
    }
  }

  private close(): void {
    if (this.listeners.size) return;
    window.clearTimeout(this.retryTimer);
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.value = undefined;
    this.failed = false;
  }
}

export const liveStore = new SharedStream<LiveView, LiveView>(api.subscribeLive, mergeLive);

/** The settings every card may need (favourites, season, no-spoiler), pushed by
 *  the backend when they change: no card asks for them on its own. */
export const settingsStore = new SharedStream<Settings, Settings>(api.subscribeSettings, (_, settings) => settings);
