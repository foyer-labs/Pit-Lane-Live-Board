// Typed calls to the integration's WebSocket commands (SPEC §10.5).
import type {
  CalendarPage,
  CircuitDriverHistory,
  CircuitHistory,
  Hass,
  LinkedEntity,
  LiveView,
  MapView,
  Round,
  Settings,
  StandingsPage,
  TabResult,
} from "./types";

const P = "pit_lane_live_board";
const RETRY_AFTER = 10_000;

/**
 * A subscription that survives Home Assistant restarting.
 *
 * The WebSocket library resubscribes by itself after a reconnect, but when that
 * fails (the integration is still starting) the subscription is lost without a
 * word and the page keeps showing its last view. So the library's resubscribe is
 * off, and on each "ready" of the connection the subscription is opened again,
 * retried every 10 s until the integration answers. The first open is awaited:
 * its failure reaches the caller, as before.
 *
 * Opens can overlap (two "ready" events close together, or the retry timer firing
 * while one is in flight): a generation counter keeps only the newest, and any
 * other subscription that lands is closed at once, so none is left behind.
 */
async function resilient<T>(
  hass: Hass,
  msg: Record<string, unknown>,
  callback: (message: T) => void,
): Promise<() => void> {
  const connection = hass.connection;
  let current: (() => void) | undefined;
  let closed = false;
  let retry: number | undefined;
  let generation = 0;
  const release = (unsubscribe: (() => void) | undefined) => {
    try {
      // The library's unsubscribe is async: a refusal (the socket went) is fine.
      void Promise.resolve(unsubscribe?.() as unknown).catch(() => undefined);
    } catch {
      /* the connection is already closed */
    }
  };
  const open = async (): Promise<void> => {
    const mine = ++generation;
    const unsubscribe = await connection.subscribeMessage<T>(
      // A superseded subscription may still deliver before it is closed: ignore it.
      (message) => {
        if (mine === generation && !closed) callback(message);
      },
      msg,
      { resubscribe: false },
    );
    if (closed || mine !== generation) {
      release(unsubscribe);
      return;
    }
    current = unsubscribe;
  };
  const reopen = () => {
    window.clearTimeout(retry);
    retry = undefined;
    if (closed) return;
    current = undefined; // the old socket's subscription is gone with it
    const mine = generation + 1;
    open().catch(() => {
      // Only the newest open schedules a retry.
      if (!closed && mine === generation) retry = window.setTimeout(reopen, RETRY_AFTER);
    });
  };
  await open();
  connection.addEventListener?.("ready", reopen);
  return () => {
    closed = true;
    generation++;
    window.clearTimeout(retry);
    connection.removeEventListener?.("ready", reopen);
    release(current);
    current = undefined;
  };
}

export const api = {
  settings: (hass: Hass) => hass.callWS<Settings>({ type: `${P}/settings/get` }),
  setSettings: (
    hass: Hass,
    values: { tv_delay?: number; no_spoiler?: boolean; live?: boolean; auto_start?: boolean },
  ) => hass.callWS<Settings>({ type: `${P}/settings/set`, ...values }),
  // Admins only; the answer carries the token's status, never the token (INV-3).
  setToken: (hass: Hass, token: string) => hass.callWS<Settings>({ type: `${P}/f1tv/set`, token }),
  removeToken: (hass: Hass) => hass.callWS<Settings>({ type: `${P}/f1tv/remove` }),
  // Admins only: the panel's place in the sidebar and who may open it.
  setPanel: (hass: Hass, values: { show_in_sidebar?: boolean; admin_only?: boolean }) =>
    hass.callWS<Settings>({ type: `${P}/panel/set`, ...values }),
  // Admins only: the household's drivers and the session summary (decisions 52, 53).
  setHousehold: (
    hass: Hass,
    values: {
      favourites?: string[];
      notify_targets?: string[];
      summary_kinds?: string[];
      summary_format?: "compact" | "full";
    },
  ) => hass.callWS<Settings>({ type: `${P}/settings/set`, ...values }),
  testSummary: (hass: Hass) =>
    hass.callWS<{ result: "sent" | "nothing" | "hidden" }>({ type: `${P}/summary/test` }),
  entities: (hass: Hass) => hass.callWS<{ entities: LinkedEntity[] }>({ type: `${P}/entities` }),
  reveal: (hass: Hass, session: string) =>
    hass.callWS<Settings>({ type: `${P}/spoiler/reveal`, session }),
  seasons: (hass: Hass) => hass.callWS<{ seasons: number[] }>({ type: `${P}/seasons` }),
  calendar: (hass: Hass, season: number) =>
    hass.callWS<CalendarPage>({ type: `${P}/calendar/get`, season }),
  rounds: (hass: Hass, season: number) =>
    hass.callWS<{ season: number; rounds: Round[] }>({ type: `${P}/results/season`, season }),
  detail: (hass: Hass, season: number, round: number, tab: string) =>
    hass.callWS<TabResult>({ type: `${P}/results/detail`, season, round, tab }),
  standings: (hass: Hass, season: number, round: number | null, kind: string) =>
    hass.callWS<StandingsPage>({ type: `${P}/standings/get`, season, round, kind }),
  // A circuit's history for the season's drivers, and one driver's years there.
  circuitHistory: (hass: Hass, circuit_id: string) =>
    hass.callWS<CircuitHistory>({ type: `${P}/circuit/history`, circuit_id }),
  circuitDriver: (hass: Hass, circuit_id: string, driver_id: string) =>
    hass.callWS<CircuitDriverHistory>({ type: `${P}/circuit/driver`, circuit_id, driver_id }),
  subscribeSettings: (hass: Hass, callback: (settings: Settings) => void) =>
    resilient<Settings>(hass, { type: `${P}/settings/subscribe` }, callback),
  subscribeLive: (hass: Hass, callback: (view: LiveView) => void) =>
    resilient<LiveView>(hass, { type: `${P}/live/subscribe` }, callback),
  subscribeMap: (hass: Hass, callback: (view: MapView) => void) =>
    resilient<MapView>(hass, { type: `${P}/map/subscribe` }, callback),
};
