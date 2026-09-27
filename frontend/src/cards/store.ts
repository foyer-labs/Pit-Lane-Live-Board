// One live subscription for every card on the page (decision 47): five cards on a
// dashboard share one stream from the backend, not five. The stream opens with the
// first card and closes a few seconds after the last one goes, so editing a
// dashboard (cards removed and added again) does not reconnect each time.
import { api } from "../api";
import type { Hass, LiveView } from "../types";

type Listener = (view: LiveView) => void;

const CLOSE_AFTER = 5_000;
const RETRY_AFTER = 10_000;

class LiveStore {
  private view?: LiveView;
  private readonly listeners = new Set<Listener>();
  private unsubscribe?: () => void;
  private opening = false;
  private closeTimer?: number;
  private retryTimer?: number;

  listen(hass: Hass, listener: Listener): () => void {
    this.listeners.add(listener);
    window.clearTimeout(this.closeTimer);
    if (this.view) listener(this.view);
    if (!this.unsubscribe && !this.opening) void this.open(hass);
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
      const unsubscribe = await api.subscribeLive(hass, (message) => {
        // A full view replaces; a partial one carries the sections that changed.
        this.view = message.full || !this.view ? message : { ...this.view, ...message };
        for (const listener of this.listeners) listener(this.view);
      });
      if (this.listeners.size) this.unsubscribe = unsubscribe;
      else unsubscribe();
    } catch {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = window.setTimeout(() => {
        if (this.listeners.size && !this.unsubscribe) void this.open(hass);
      }, RETRY_AFTER);
    } finally {
      this.opening = false;
    }
  }

  private close(): void {
    if (this.listeners.size) return;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.view = undefined;
  }
}

export const liveStore = new LiveStore();
