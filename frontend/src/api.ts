// Typed calls to the integration's WebSocket commands (SPEC §10.5).
import type {
  CalendarPage,
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

export const api = {
  settings: (hass: Hass) => hass.callWS<Settings>({ type: `${P}/settings/get` }),
  setSettings: (
    hass: Hass,
    values: { tv_delay?: number; no_spoiler?: boolean; live?: boolean; auto_start?: boolean },
  ) => hass.callWS<Settings>({ type: `${P}/settings/set`, ...values }),
  // Admins only; the answer carries the token's status, never the token (INV-3).
  setToken: (hass: Hass, token: string) => hass.callWS<Settings>({ type: `${P}/f1tv/set`, token }),
  removeToken: (hass: Hass) => hass.callWS<Settings>({ type: `${P}/f1tv/remove` }),
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
  subscribeSettings: (hass: Hass, callback: (settings: Settings) => void) =>
    hass.connection.subscribeMessage<Settings>(callback, { type: `${P}/settings/subscribe` }),
  subscribeLive: (hass: Hass, callback: (view: LiveView) => void) =>
    hass.connection.subscribeMessage<LiveView>(callback, { type: `${P}/live/subscribe` }),
  subscribeMap: (hass: Hass, callback: (view: MapView) => void) =>
    hass.connection.subscribeMessage<MapView>(callback, { type: `${P}/map/subscribe` }),
};
