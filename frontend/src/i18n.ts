// Every user-visible string comes from here (INV-7). Italian when Home Assistant
// speaks Italian, English otherwise.
import en from "./i18n/en.json";
import it from "./i18n/it.json";
import type { Hass } from "./types";

type Tree = { [key: string]: string | Tree };
const LANGUAGES: Record<string, Tree> = { en, it };

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

export function language(hass: Hass | undefined): "en" | "it" {
  const lang = hass?.locale?.language ?? hass?.language ?? "en";
  return lang.toLowerCase().startsWith("it") ? "it" : "en";
}

function lookup(tree: Tree, key: string): string | undefined {
  let node: string | Tree | undefined = tree;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

// Resolved strings, per language: the Live page looks up the same few keys for
// every row of every render.
const resolved: Record<string, Map<string, string>> = { en: new Map(), it: new Map() };

export function translator(hass: Hass | undefined): Translate {
  const lang = language(hass);
  const tree = LANGUAGES[lang];
  const cache = resolved[lang];
  return (key, vars) => {
    let text = cache.get(key);
    if (text === undefined) {
      text = lookup(tree, key) ?? lookup(en, key) ?? key;
      cache.set(key, text);
    }
    for (const [name, value] of Object.entries(vars ?? {})) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
    return text;
  };
}
