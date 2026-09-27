// Dates and times in Home Assistant's timezone and the user's language.
//
// Intl formatters are expensive to build and the Live page formats many times a
// second at its busiest: each one is built once per language and shape, and kept.
import { language } from "./i18n";
import { timePrefs } from "./timeprefs";
import type { Hass } from "./types";

function locale(hass: Hass): string {
  return language(hass) === "it" ? "it-IT" : "en-GB";
}

const dateFormats = new Map<string, Intl.DateTimeFormat>();
const numberFormats = new Map<string, Intl.NumberFormat>();

// The shapes of date the panel uses; a formatter is kept per language, shape and zone.
const SHAPES = {
  day: { weekday: "short", day: "numeric", month: "short" },
  weekdayTime: { weekday: "short", hour: "2-digit", minute: "2-digit" },
  date: { day: "numeric", month: "short", year: "numeric" },
  dayMonth: { day: "numeric", month: "short" },
  clock: { hour: "2-digit", minute: "2-digit", second: "2-digit" },
  clockShort: { hour: "2-digit", minute: "2-digit" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

function dateFormat(hass: Hass, shape: keyof typeof SHAPES, timeZone: string): Intl.DateTimeFormat {
  const key = `${locale(hass)}|${shape}|${timeZone}`;
  let format = dateFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale(hass), { ...SHAPES[shape], timeZone });
    dateFormats.set(key, format);
  }
  return format;
}

function numberFormat(hass: Hass, digits: number, fixed = false): Intl.NumberFormat {
  const key = `${locale(hass)}|${digits}|${fixed}`;
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale(hass), {
      maximumFractionDigits: digits,
      ...(fixed ? { minimumFractionDigits: digits } : {}),
    });
    numberFormats.set(key, format);
  }
  return format;
}

export function deviceZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/** The zone Home Assistant itself would use for this user (their profile). */
export function homeZone(hass: Hass): string {
  return hass.locale?.time_zone === "local" ? deviceZone() : hass.config.time_zone;
}

/** The zone times are shown in (decision 50): the user's choice, and the track's
 *  when they chose it and it is known. */
export function zone(hass: Hass, trackZone?: string | null): string {
  const mode = timePrefs().zone;
  if (mode === "circuit" && trackZone) return trackZone;
  if (mode === "device") return deviceZone();
  return homeZone(hass);
}

export function sessionTime(hass: Hass, iso: string | null, day: string, trackZone?: string | null): string {
  if (!iso) {
    return dateFormat(hass, "day", "UTC").format(
      new Date(`${day}T12:00:00Z`),
    );
  }
  return dateFormat(hass, "weekdayTime", zone(hass, trackZone)).format(
    new Date(iso),
  );
}

/**
 * The other clock, when the user asked for both: the track's time next to theirs,
 * or theirs next to the track's. `local` says which of the two it is. Empty when
 * both clocks read the same zone or the track's is unknown.
 */
export function otherTime(
  hass: Hass,
  iso: string | null,
  trackZone: string | null | undefined,
): { time: string; local: boolean } | null {
  if (!iso || !trackZone || !timePrefs().both) return null;
  const shown = zone(hass, trackZone);
  const other = shown === trackZone ? homeZone(hass) : trackZone;
  if (other === shown) return null;
  const at = (timeZone: string) =>
    dateFormat(hass, "weekdayTime", timeZone).format(new Date(iso));
  const time = at(other);
  // Two zone names, one clock (Madrid and Rome): nothing to add.
  if (time === at(shown)) return null;
  return { time, local: other === trackZone };
}

export function longDate(hass: Hass, iso: string | null): string {
  if (!iso) return "";
  const dateOnly = iso.length === 10;
  const date = dateOnly ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  return dateFormat(hass, "date", dateOnly ? "UTC" : zone(hass)).format(date);
}

/** A weekend's days. Dates without a time are the circuit's local days, shown as
 *  they are whatever Home Assistant's timezone. */
export function dayRange(hass: Hass, first: string, last: string): string {
  const format = dateFormat(hass, "dayMonth", "UTC");
  const a = new Date(`${first}T12:00:00Z`);
  const b = new Date(`${last}T12:00:00Z`);
  if (a.getUTCMonth() === b.getUTCMonth()) {
    return `${a.getUTCDate()}–${format.format(b)}`;
  }
  return `${format.format(a)} – ${format.format(b)}`;
}

function parseUtc(iso: string): Date {
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
}

// Race control and radio repeat the same few hundred times on every render: each
// string is kept, until the language or the zone changes.
const clockTimes = new Map<string, string>();
let clockTimesFor = "";

/** "15:55:49", or "15:55" when `short`. */
export function clockTime(hass: Hass, iso: string | null, short = false): string {
  if (!iso) return "";
  const timeZone = zone(hass);
  const scope = `${locale(hass)}|${timeZone}`;
  if (scope !== clockTimesFor || clockTimes.size > 2000) {
    clockTimes.clear();
    clockTimesFor = scope;
  }
  const key = short ? `s${iso}` : iso;
  let text = clockTimes.get(key);
  if (text === undefined) {
    text = dateFormat(hass, short ? "clockShort" : "clock", timeZone).format(parseUtc(iso));
    clockTimes.set(key, text);
  }
  return text;
}

export function shortTime(hass: Hass, iso: string | null): string {
  if (!iso) return "";
  return dateFormat(hass, "weekdayTime", zone(hass)).format(parseUtc(iso));
}

/** "2 d 14 h 06 m", "14 h 06 m", "06 m 12 s". */
export function countdown(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  if (days) return `${days} d ${two(hours)} h ${two(minutes)} m`;
  if (hours) return `${hours} h ${two(minutes)} m`;
  return `${two(minutes)} m ${two(seconds)} s`;
}

/** Session clock: "07:42" or "1:07:42". */
export function sessionClock(seconds: number | null): string {
  if (seconds === null) return "";
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
}

export function number(hass: Hass, value: number | null, digits = 1): string {
  if (value === null || value === undefined) return "—";
  return numberFormat(hass, digits).format(value);
}

/** Always `digits` decimals ("59.0", not "59"): numbers read down a column. */
export function fixed(hass: Hass, value: number | null, digits = 1): string {
  if (value === null || value === undefined) return "—";
  return numberFormat(hass, digits, true).format(value);
}

/** Home Assistant hands every element a new `hass` on each state change in the
 *  house; most pages only care about the language, the timezone and the user. */
export function hassChanged(value?: Hass, old?: Hass): boolean {
  return (
    !old ||
    !value ||
    value.language !== old.language ||
    value.locale?.language !== old.locale?.language ||
    value.config?.time_zone !== old.config?.time_zone ||
    value.user?.is_admin !== old.user?.is_admin
  );
}
