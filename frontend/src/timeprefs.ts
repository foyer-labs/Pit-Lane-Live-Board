// Which clock the panel and the cards show times in (decision 50): a choice of
// each user, kept by Home Assistant with the user's other frontend preferences
// (`frontend/set_user_data`), so it follows them from device to device.
import type { Hass } from "./types";

export type ZoneMode = "home_assistant" | "device" | "circuit";

export interface TimePrefs {
  /** home_assistant: as the user's profile says (server's zone, or the device's). */
  zone: ZoneMode;
  /** Also the other clock, in small: the track's, or yours at the track's. */
  both: boolean;
}

const KEY = "pit_lane_live_board_time";
export const TIME_PREFS_EVENT = "plb-time-prefs";

let prefs: TimePrefs = { zone: "home_assistant", both: false };
let loading: Promise<TimePrefs> | undefined;

export function timePrefs(): TimePrefs {
  return prefs;
}

/** Read once per page; every element asking shares the answer. */
export function loadTimePrefs(hass: Hass): Promise<TimePrefs> {
  loading ??= hass
    .callWS<{ value: Partial<TimePrefs> | null }>({ type: "frontend/get_user_data", key: KEY })
    .then((reply) => {
      const value = reply?.value ?? {};
      prefs = {
        zone: ["home_assistant", "device", "circuit"].includes(String(value.zone)) ? (value.zone as ZoneMode) : "home_assistant",
        both: value.both === true,
      };
      window.dispatchEvent(new Event(TIME_PREFS_EVENT));
      return prefs;
    })
    .catch(() => prefs);
  return loading;
}

export async function saveTimePrefs(hass: Hass, next: TimePrefs): Promise<void> {
  const before = prefs;
  prefs = next;
  window.dispatchEvent(new Event(TIME_PREFS_EVENT));
  try {
    await hass.callWS({ type: "frontend/set_user_data", key: KEY, value: next });
  } catch (err) {
    prefs = before;
    window.dispatchEvent(new Event(TIME_PREFS_EVENT));
    throw err;
  }
}
