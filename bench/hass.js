// The bench's fake `hass`: answers the panel's WebSocket commands with the payloads
// scripts/bench_data.py computed from real data through the backend's own code.
//
// Parameters (query string): page, live (race|qualifying|stale|final|paused|idle|
// hidden|syncing|connecting), lang (en|it), theme (light|dark), delay, spoiler,
// admin, f1tv, playing (true|false), auto (true|false), patch (true: after the
// first view, partial messages every second with a `tower_patch` that swaps P2 and
// P3 and changes P2's last lap, and a data age that grows, as the backend sends).
const params = new URLSearchParams(location.search);
const NOW = Date.parse(params.get("now") ?? "2026-09-13T14:00:00Z");

// A frozen clock, so every capture of the same page is the same picture.
const realNow = Date.now.bind(Date);
const started = realNow();
Date.now = () => NOW + (realNow() - started) * 0;

const LIGHT = {
  "--primary-color": "#03a9f4",
  "--primary-background-color": "#fafafa",
  "--secondary-background-color": "#e5e5e5",
  "--card-background-color": "#ffffff",
  "--primary-text-color": "#212121",
  "--secondary-text-color": "#727272",
  "--text-primary-color": "#ffffff",
  "--divider-color": "rgba(0, 0, 0, 0.12)",
  "--error-color": "#db4437",
  "--warning-color": "#ffa600",
  "--app-header-background-color": "#ffffff",
  "--app-header-text-color": "#212121",
};
const DARK = {
  ...LIGHT,
  "--primary-background-color": "#111111",
  "--secondary-background-color": "#282828",
  "--card-background-color": "#1c1c1c",
  "--primary-text-color": "#e1e1e1",
  "--secondary-text-color": "#9b9b9b",
  "--divider-color": "rgba(225, 225, 225, 0.12)",
  "--app-header-background-color": "#1c1c1c",
  "--app-header-text-color": "#e1e1e1",
};

export function applyTheme() {
  const theme = params.get("theme") === "dark" ? DARK : LIGHT;
  for (const [name, value] of Object.entries(theme)) document.documentElement.style.setProperty(name, value);
  document.body.style.margin = "0";
  document.body.style.background = theme["--primary-background-color"];
  document.body.style.fontFamily = "Roboto, 'Segoe UI', system-ui, sans-serif";
}

async function data(name) {
  const response = await fetch(`./data/${name}.json`, { cache: "no-store" });
  if (!response.ok) throw new Error(`bench/data/${name}.json is missing: run scripts/bench_data.py`);
  return response.json();
}

export function createHass() {
  const admin = params.get("admin") !== "false";
  const settings = {
    tv_delay: Number(params.get("delay") ?? 45),
    no_spoiler: params.get("spoiler") === "true",
    live: params.get("playing") !== "false",
    auto_start: params.get("auto") === "true",
    show_in_sidebar: true,
    favourites: (params.get("fav") ?? "LEC").split(",").filter(Boolean),
    notify_targets: ["mobile_app_pixel"],
    summary_kinds: ["sprint", "race"],
    summary_format: "compact",
    admin_only: params.get("adminOnly") === "true",
    running: ["race", "qualifying", "stale"].includes(params.get("live") ?? "race"),
    revealed: [],
    season: 2026,
    first_season: 1950,
    is_admin: admin,
    f1tv: admin ? { status: params.get("f1tv") ?? "active", expires: "2026-09-16T10:00:00+00:00", product: "F1 TV Pro" } : null,
  };
  const P = "pit_lane_live_board/";
  // Per-user frontend data; `clock=circuit&both=true` picks the times' clock.
  const userData = params.get("clock")
    ? { pit_lane_live_board_time: { zone: params.get("clock"), both: params.get("both") === "true" } }
    : {};
  const settingsListeners = [];
  const pushSettings = () => settingsListeners.forEach((listen) => listen({ ...settings }));
  return {
    language: params.get("lang") ?? "en",
    locale: { language: params.get("lang") ?? "en" },
    config: { time_zone: "Europe/Rome" },
    states: {},
    services: { notify: { mobile_app_pixel: {}, mobile_app_tablet: {}, persistent_notification: {} } },
    user: { is_admin: admin },
    // Home Assistant's own formatting of a state, roughly: enough for the bench.
    formatEntityState(state) {
      if (/^\d{4}-\d\d-\d\dT/.test(state.state) && !Number.isNaN(Date.parse(state.state))) {
        return new Date(state.state).toLocaleString(params.get("lang") === "it" ? "it-IT" : "en-GB", {
          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome",
        });
      }
      const words = { on: "On", off: "Off", unavailable: "Unavailable", unknown: "Unknown" };
      return words[state.state] ?? state.state.charAt(0).toUpperCase() + state.state.slice(1).replaceAll("_", " ");
    },
    async callWS(msg) {
      const type = msg.type.replace(P, "");
      switch (type) {
        case "settings/get":
          return settings;
        case "settings/set":
          if ("tv_delay" in msg) settings.tv_delay = msg.tv_delay;
          if ("no_spoiler" in msg) settings.no_spoiler = msg.no_spoiler;
          if ("live" in msg) settings.live = msg.live;
          if ("auto_start" in msg) settings.auto_start = msg.auto_start;
          for (const key of ["favourites", "notify_targets", "summary_kinds", "summary_format"]) {
            if (key in msg) settings[key] = msg[key];
          }
          pushSettings();
          return { ...settings };
        case "f1tv/set":
          if (!msg.token.startsWith("eyJ")) throw { code: "invalid_token", message: "token_invalid" };
          settings.f1tv = { status: "active", expires: "2026-10-16T10:00:00+00:00", product: "F1 TV Pro" };
          pushSettings();
          return { ...settings };
        case "frontend/get_user_data":
          return { value: userData[msg.key] ?? null };
        case "frontend/set_user_data":
          userData[msg.key] = msg.value;
          return null;
        case "summary/test":
          return { sent: true };
        case "panel/set":
          if ("show_in_sidebar" in msg) settings.show_in_sidebar = msg.show_in_sidebar;
          if ("admin_only" in msg) settings.admin_only = msg.admin_only;
          pushSettings();
          return { ...settings };
        case "f1tv/remove":
          settings.f1tv = { status: "not_configured", expires: null, product: null };
          pushSettings();
          return { ...settings };
        case "entities":
          return data("entities");
        case "spoiler/reveal":
          return { ...settings, revealed: [...settings.revealed, msg.session] };
        case "seasons":
          return data("seasons");
        case "calendar/get":
          return data("calendar");
        case "results/season":
          return data("rounds");
        case "results/detail":
          if (settings.no_spoiler && msg.tab === "race") return { tab: "race", hidden: true, session: "2026-14-race" };
          return data(`detail_${msg.tab}`);
        case "standings/get":
          return data(`standings_${msg.kind}`);
        default:
          throw new Error(`bench: no answer for ${msg.type}`);
      }
    },
    connection: {
      async subscribeMessage(callback, msg) {
        const type = msg.type.replace(P, "");
        if (type === "settings/subscribe") {
          settingsListeners.push(callback);
          callback({ ...settings });
        } else if (type === "live/subscribe") {
          const live = params.get("live") ?? "race";
          const view = ["syncing", "connecting"].includes(live)
            ? { full: true, state: live, delay: settings.tv_delay, next_session: null }
            : await data(`live_${live}`);
          callback({ ...view, delay: settings.tv_delay, paused: !settings.live, auto_start: settings.auto_start });
          if (params.get("patch") === "true" && view.tower?.length > 2) {
            // Partials as the backend sends them: the order, and only the rows that changed.
            let order = view.tower.map((r) => r.number);
            let age = 0;
            let tick = 0;
            const timer = setInterval(() => {
              tick++;
              age += 1;
              const message = { full: false, state: view.state, data_age: age };
              if (tick % 2) {
                [order[1], order[2]] = [order[2], order[1]];
                const at = (i) => view.tower.find((r) => r.number === order[i]);
                const second = { ...at(1), position: 2, last_lap: { time: `1:3${tick % 10}.${String(100 + tick).slice(1)}`, personal_best: true, overall_best: false, previous: false } };
                const third = { ...at(2), position: 3 };
                message.tower_patch = { order: [...order], rows: { [second.number]: second, [third.number]: third } };
              }
              callback(message);
            }, 1000);
            return () => clearInterval(timer);
          }
        } else if (type === "map/subscribe") {
          callback(
            params.get("f1tv") === "not_configured"
              ? { full: true, outline: null, cars: [], utc: null }
              : await data("map"),
          );
        }
        return () => {};
      },
    },
  };
}
