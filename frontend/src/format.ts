// Dates and times in Home Assistant's timezone and the user's language.
import { language } from "./i18n";
import type { Hass } from "./types";

function locale(hass: Hass): string {
  return language(hass) === "it" ? "it-IT" : "en-GB";
}

export function sessionTime(hass: Hass, iso: string | null, day: string): string {
  if (!iso) {
    return new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(hass), {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  }
  return new Date(iso).toLocaleString(locale(hass), {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: hass.config.time_zone,
  });
}

export function longDate(hass: Hass, iso: string | null): string {
  if (!iso) return "";
  const date = iso.length === 10 ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  return date.toLocaleDateString(locale(hass), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: iso.length === 10 ? "UTC" : hass.config.time_zone,
  });
}

export function dayRange(hass: Hass, first: string, last: string): string {
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", timeZone: "UTC" };
  const a = new Date(`${first}T12:00:00Z`);
  const b = new Date(`${last}T12:00:00Z`);
  if (a.getUTCMonth() === b.getUTCMonth()) {
    return `${a.getUTCDate()}–${b.toLocaleDateString(locale(hass), options)}`;
  }
  return `${a.toLocaleDateString(locale(hass), options)} – ${b.toLocaleDateString(locale(hass), options)}`;
}

export function clockTime(hass: Hass, iso: string | null): string {
  if (!iso) return "";
  const date = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
  return date.toLocaleTimeString(locale(hass), {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: hass.config.time_zone,
  });
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
  return value.toLocaleString(locale(hass), { maximumFractionDigits: digits });
}
