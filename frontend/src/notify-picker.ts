// Where the session summary goes: the chosen notify targets with Remove, and a
// search field whose suggestions this element draws itself.
//
// Not a <datalist>: the Companion app's web views show its suggestions badly or
// not at all, and an id-linked datalist inside a shadow root is fragile. Not only
// services either: integrations now create notify *entities* (Telegram bot, ntfy,
// e-mail…) instead of `notify.<name>` services, and a list of services alone
// leaves those households with nothing to pick (decision 60). A service is kept by
// name (`mobile_app_pixel`), an entity by id (`notify.telegram_bot_123`); the
// backend tells them apart again when it sends.
import { LitElement, css, html, nothing } from "lit";
import type { Translate } from "./i18n";
import { tokens } from "./styles";
import type { Hass } from "./types";

export interface NotifyTarget {
  /** What is stored: a service name, or a notify entity id. */
  id: string;
  /** How people know it: the entity's name, or the service's made readable. */
  label: string;
  /** The technical name, shown under the label. */
  detail: string;
}

// `send_message` is the action that drives the entities, not a target.
const NOT_TARGETS = new Set(["send_message"]);

function words(name: string): string {
  const text = name.replace(/_+/g, " ").trim();
  return text ? text[0].toUpperCase() + text.slice(1) : name;
}

/** Every target this Home Assistant offers: services first, then entities. */
export function notifyTargets(hass: Hass, t: Translate): NotifyTarget[] {
  const services = Object.keys(hass.services?.notify ?? {})
    .filter((name) => !NOT_TARGETS.has(name))
    .map((name) => ({
      id: name,
      label:
        name === "persistent_notification"
          ? t("summary.haNotifications")
          : name.startsWith("mobile_app_")
            ? `${words(name.slice("mobile_app_".length))} · ${t("summary.app")}`
            : words(name),
      detail: `notify.${name}`,
    }));
  const entities = Object.entries(hass.states ?? {})
    .filter(([id]) => id.startsWith("notify."))
    .map(([id, entity]) => ({
      id,
      label: String(entity.attributes?.friendly_name ?? "") || words(id.slice("notify.".length)),
      detail: id,
    }));
  const byLabel = (a: NotifyTarget, b: NotifyTarget) => a.label.localeCompare(b.label);
  return [...services.sort(byLabel), ...entities.sort(byLabel)];
}

/** Lower case, no accents, `_ . -` as spaces: "Pixel 7" finds mobile_app_pixel_7. */
export function searchable(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[_.\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The targets with every word of the query somewhere in their label or name. */
export function matchTargets(targets: NotifyTarget[], query: string): NotifyTarget[] {
  const wanted = searchable(query).split(" ").filter(Boolean);
  if (!wanted.length) return targets;
  return targets.filter((target) => {
    const haystack = searchable(`${target.label} ${target.id} ${target.detail}`);
    return wanted.every((word) => haystack.includes(word));
  });
}

export class PlbNotifyPicker extends LitElement {
  static override properties = {
    hass: { attribute: false },
    t: { attribute: false },
    chosen: { attribute: false },
    disabled: { type: Boolean },
    query: { state: true },
    open: { state: true },
    active: { state: true },
    hint: { state: true },
  };

  hass!: Hass;
  t!: Translate;
  chosen: string[] = [];
  disabled = false;
  query = "";
  open = false;
  active = 0;
  hint = "";

  private all(): NotifyTarget[] {
    return this.hass && this.t ? notifyTargets(this.hass, this.t) : [];
  }

  private suggestions(all: NotifyTarget[]): NotifyTarget[] {
    return matchTargets(
      all.filter((target) => !this.chosen.includes(target.id)),
      this.query,
    );
  }

  private pick(target: NotifyTarget | undefined): void {
    if (!target) {
      this.hint = this.query.trim() ? "summary.pickOne" : "";
      this.open = true;
      return;
    }
    this.query = "";
    this.hint = "";
    this.active = 0;
    if (this.chosen.includes(target.id)) return;
    this.dispatchEvent(
      new CustomEvent("targets-changed", { detail: { targets: [...this.chosen, target.id] } }),
    );
  }

  /** Add from what is typed: the highlighted suggestion, or the one that is
   * exactly or alone what was typed. */
  private pickTyped(matches: NotifyTarget[]): void {
    const typed = searchable(this.query);
    const exact = matches.find(
      (m) => searchable(m.id) === typed || searchable(m.detail) === typed || searchable(m.label) === typed,
    );
    const chosen = this.open ? matches[this.activeIn(matches)] : undefined;
    this.pick(exact ?? chosen ?? (matches.length === 1 ? matches[0] : undefined));
  }

  private activeIn(matches: NotifyTarget[]): number {
    return this.active < matches.length ? this.active : 0;
  }

  private drop(id: string): void {
    this.dispatchEvent(
      new CustomEvent("targets-changed", { detail: { targets: this.chosen.filter((v) => v !== id) } }),
    );
  }

  private onKey(e: KeyboardEvent, matches: NotifyTarget[]): void {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!this.open) {
        this.open = true;
        return;
      }
      const step = e.key === "ArrowDown" ? 1 : -1;
      const at = this.activeIn(matches);
      this.active = matches.length ? (at + step + matches.length) % matches.length : 0;
      this.updateComplete.then(() =>
        this.renderRoot.querySelector(".option.active")?.scrollIntoView({ block: "nearest" }),
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      this.pickTyped(matches);
    } else if (e.key === "Escape") {
      this.open = false;
    }
  }

  override render() {
    const t = this.t;
    if (!t || !this.hass) return nothing;
    const all = this.all();
    const known = new Map(all.map((target) => [target.id, target]));
    const matches = this.suggestions(all);
    const active = this.activeIn(matches);
    const free = all.filter((target) => !this.chosen.includes(target.id));
    const listId = "plb-notify-options";
    return html`
      ${this.chosen.length
        ? html`<ul class="chosen">
            ${this.chosen.map((id) => {
              const target = known.get(id) ?? known.get(id.replace(/^notify\./, ""));
              return html`<li>
                <span class="who">
                  <strong>${target?.label ?? id}</strong>
                  <span class="muted small">${target?.detail ?? id}</span>
                </span>
                ${target ? nothing : html`<span class="missing small">${t("summary.missing")}</span>`}
                <button class="btn flat" ?disabled=${this.disabled} @click=${() => this.drop(id)}>
                  ${t("summary.remove")}
                </button>
              </li>`;
            })}
          </ul>`
        : html`<span class="muted small">${t("summary.none")}</span>`}
      ${!all.length
        ? html`<span class="muted">${t("summary.noServices")}</span>`
        : html`<div class="search">
            <div class="add-row">
              <input
                type="text"
                role="combobox"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                enterkeyhint="done"
                aria-autocomplete="list"
                aria-controls=${listId}
                aria-expanded=${this.open ? "true" : "false"}
                aria-activedescendant=${this.open && matches[active] ? `plb-opt-${active}` : ""}
                aria-label=${t("summary.placeholder")}
                placeholder=${free.length ? t("summary.placeholder") : t("summary.allChosen")}
                .value=${this.query}
                ?disabled=${this.disabled || !free.length}
                @focus=${() => (this.open = true)}
                @click=${() => (this.open = true)}
                @blur=${() => (this.open = false)}
                @input=${(e: Event) => {
                  this.query = (e.target as HTMLInputElement).value;
                  this.open = true;
                  this.active = 0;
                  this.hint = "";
                }}
                @keydown=${(e: KeyboardEvent) => this.onKey(e, matches)}
              />
              <button class="btn flat" ?disabled=${this.disabled || !free.length}
                @click=${() => this.pickTyped(matches)}>${t("summary.add")}</button>
            </div>
            ${this.open && free.length
              ? matches.length
                ? html`<ul class="options" id=${listId} role="listbox">
                    ${matches.map(
                      (target, i) => html`<li
                        id=${`plb-opt-${i}`}
                        role="option"
                        class="option ${i === active ? "active" : ""}"
                        aria-selected=${i === active ? "true" : "false"}
                        @pointerdown=${(e: Event) => e.preventDefault()}
                        @pointerenter=${() => (this.active = i)}
                        @click=${() => this.pick(target)}
                      >
                        <strong>${target.label}</strong>
                        <span class="muted small">${target.detail}</span>
                      </li>`,
                    )}
                  </ul>`
                : html`<div class="muted small empty">${t("summary.noMatch")}</div>`
              : nothing}
            ${this.hint ? html`<div class="hint small">${t(this.hint)}</div>` : nothing}
          </div>`}
    `;
  }

  static override styles = [
    tokens,
    css`
      :host { display: grid; gap: 6px; }
      .small { font-size: 12px; }
      .muted { color: var(--secondary-text-color); }
      ul { list-style: none; margin: 0; padding: 0; }
      .chosen li { display: flex; align-items: center; gap: 10px; padding: 6px 0; font-size: 14px;
        border-bottom: 1px solid var(--divider-color, #e0e0e0); }
      .who { display: flex; flex-direction: column; flex: 1; min-width: 0; overflow-wrap: anywhere; }
      .missing, .hint { color: var(--error-color, #db4437); }
      .search { display: grid; gap: 4px; }
      .add-row { display: flex; gap: 8px; align-items: center; }
      input { flex: 1; min-width: 0; font: inherit; font-size: 16px; padding: 8px 10px; border-radius: 8px;
        border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff);
        color: var(--primary-text-color); box-sizing: border-box; }
      input:focus { outline: 2px solid var(--primary-color); outline-offset: -1px; }
      /* In the flow, not floating: nothing to clip it, on any screen. */
      .options { max-height: 240px; overflow-y: auto; border: 1px solid var(--divider-color, #ccc);
        border-radius: 8px; background: var(--card-background-color, #fff); }
      .option { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; cursor: pointer;
        min-height: 40px; justify-content: center; overflow-wrap: anywhere; }
      .option + .option { border-top: 1px solid var(--divider-color, #e0e0e0); }
      .option.active { background: color-mix(in srgb, var(--primary-color) 14%, transparent); }
      .empty { padding: 6px 2px; }
    `,
  ];
}
