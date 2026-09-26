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

export function translator(hass: Hass | undefined): Translate {
  const tree = LANGUAGES[language(hass)];
  return (key, vars) => {
    let text = lookup(tree, key) ?? lookup(en, key) ?? key;
    for (const [name, value] of Object.entries(vars ?? {})) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
    return text;
  };
}
