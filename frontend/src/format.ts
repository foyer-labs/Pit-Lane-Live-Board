// Dates and times in Home Assistant's timezone and the user's language.
//
// Intl formatters are expensive to build and the Live page formats many times a
// second at its busiest: each one is built once per language and shape, and kept.
import { language } from "./i18n";
import type { Hass } from "./types";

function locale(hass: Hass): string {
  return language(hass) === "it" ? "it-IT" : "en-GB";
}

const dateFormats = new Map<string, Intl.DateTimeFormat>();
const numberFormats = new Map<string, Intl.NumberFormat>();

function dateFormat(hass: Hass, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale(hass)}|${JSON.stringify(options)}`;
  let format = dateFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale(hass), options);
    dateFormats.set(key, format);
  }
  return format;
}

function numberFormat(hass: Hass, digits: number): Intl.NumberFormat {
  const key = `${locale(hass)}|${digits}`;
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale(hass), { maximumFractionDigits: digits });
    numberFormats.set(key, format);
  }
  return format;
}

function zone(hass: Hass): string {
  return hass.config.time_zone;
}

export function sessionTime(hass: Hass, iso: string | null, day: string): string {
  if (!iso) {
    return dateFormat(hass, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
      new Date(`${day}T12:00:00Z`),
    );
  }
  return dateFormat(hass, { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: zone(hass) }).format(
    new Date(iso),
  );
}

export function longDate(hass: Hass, iso: string | null): string {
  if (!iso) return "";
  const dateOnly = iso.length === 10;
  const date = dateOnly ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  return dateFormat(hass, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: dateOnly ? "UTC" : zone(hass),
  }).format(date);
}

/** A weekend's days. Dates without a time are the circuit's local days, shown as
 *  they are whatever Home Assistant's timezone. */
export function dayRange(hass: Hass, first: string, last: string): string {
  const format = dateFormat(hass, { day: "numeric", month: "short", timeZone: "UTC" });
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

export function clockTime(hass: Hass, iso: string | null): string {
  if (!iso) return "";
  return dateFormat(hass, { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: zone(hass) }).format(
    parseUtc(iso),
  );
}

export function shortTime(hass: Hass, iso: string | null): string {
  if (!iso) return "";
  return dateFormat(hass, { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: zone(hass) }).format(
    parseUtc(iso),
  );
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
