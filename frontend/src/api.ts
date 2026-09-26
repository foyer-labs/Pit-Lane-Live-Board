// Typed calls to the integration's WebSocket commands (SPEC §10.5).
import type {
  CalendarPage,
  Hass,
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
  setSettings: (hass: Hass, values: { tv_delay?: number; no_spoiler?: boolean }) =>
    hass.callWS<Settings>({ type: `${P}/settings/set`, ...values }),
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
  subscribeLive: (hass: Hass, callback: (view: LiveView) => void) =>
    hass.connection.subscribeMessage<LiveView>(callback, { type: `${P}/live/subscribe` }),
  subscribeMap: (hass: Hass, callback: (view: MapView | null) => void) =>
    hass.connection.subscribeMessage<MapView | null>(callback, { type: `${P}/map/subscribe` }),
};
