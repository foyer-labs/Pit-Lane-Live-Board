// The payloads the backend sends (custom_components/pit_lane_live_board/core/*.py).

export interface Hass {
  language: string;
  /** The profile's choice: the server's time zone or the device's. */
  locale?: { language: string; time_zone?: "local" | "server" };
  config: { time_zone: string };
  user?: { is_admin: boolean };
  themes?: { darkMode?: boolean };
  states?: Record<string, { state: string; attributes: Record<string, unknown> }>;
  /** Home Assistant's own state formatting, in the user's language and units. */
  services?: Record<string, Record<string, unknown>>;
  formatEntityState?: (state: { state: string; attributes: Record<string, unknown> }) => string;
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  connection: {
    subscribeMessage<T>(
      callback: (msg: T) => void,
      msg: Record<string, unknown>,
      options?: { resubscribe?: boolean },
    ): Promise<() => void>;
    addEventListener?(event: "ready" | "disconnected", listener: () => void): void;
    removeEventListener?(event: "ready" | "disconnected", listener: () => void): void;
  };
}

export interface Settings {
  tv_delay: number;
  no_spoiler: boolean;
  live: boolean;
  auto_start: boolean;
  running: boolean;
  show_in_sidebar: boolean;
  admin_only: boolean;
  favourites: string[];
  notify_targets: string[];
  summary_kinds: string[];
  revealed: string[];
  season: number;
  first_season: number;
  is_admin: boolean;
  f1tv: { status: string; expires: string | null; product: string | null } | null;
}

export interface LinkedEntity {
  entity_id: string;
  key: string | null;
  domain: string;
  disabled: boolean;
}

export interface Session {
  key: string;
  kind: string;
  date: string;
  start: string | null;
  end: string | null;
}

export interface Person {
  position?: number | null;
  name: string | null;
  code: string | null;
  team: string | null;
  team_id: string | null;
}

export interface Meeting {
  season: number;
  round: number;
  name: string;
  circuit: string | null;
  locality: string | null;
  country: string | null;
  /** The IANA time zone at the track, when known. */
  timezone: string | null;
  sprint: boolean;
  sessions: Session[];
  state: "done" | "live" | "next" | "upcoming";
  podium: Person[] | null;
  podium_hidden: boolean;
}

export interface CalendarPage {
  season: number | null;
  meetings: Meeting[];
}

export interface Round {
  round: number;
  name: string | null;
  date: string | null;
  circuit: string | null;
  country: string | null;
  sprint: boolean;
  hidden: boolean;
  winner: Person | null;
  tabs: string[];
}

export interface Classified extends Person {
  driver_id: string | null;
  number: string | null;
  position_text?: string | null;
  grid?: number | null;
  gained?: number | null;
  laps?: number | null;
  status?: string | null;
  time?: string | null;
  points?: number | null;
  fastest_lap?: { rank: number | null; lap: number | null; time: string | null } | null;
  q1?: string | null;
  q2?: string | null;
  q3?: string | null;
}

export interface TabResult {
  tab: string;
  hidden: boolean;
  session?: string;
  available?: boolean;
  data?: any;
}

export interface Standing {
  position: number | null;
  position_text: string | null;
  points: number | null;
  wins: number | null;
  behind: number | null;
  change: number | null;
  name?: string | null;
  code?: string | null;
  team: string | null;
  team_id: string | null;
  driver_id?: string | null;
}

export interface StandingsPage {
  kind?: string;
  season?: number;
  round: number | null;
  rounds: number;
  capped: boolean;
  rows: Standing[];
}

export interface Timed {
  time: string;
  personal_best: boolean;
  overall_best: boolean;
  previous: boolean;
}

export interface Row {
  number: string;
  tla: string;
  name: string | null;
  team: string | null;
  colour: string | null;
  position: number | null;
  gap: string | null;
  interval: string | null;
  catching: boolean;
  last_lap: Timed | null;
  best_lap: { time: string; lap: number | null } | null;
  sectors: (Timed | null)[];
  tyre: { compound: string; new: boolean; age: number; stint: number } | null;
  pit_stops: number;
  in_pit: boolean;
  pit_out: boolean;
  laps: number | null;
  grid: number | null;
  gained: number | null;
  status: string;
  penalty?: number | null;
  /** Every stint so far: its compound, laps and best lap (decision 51). */
  stints?: {
    compound: string;
    new: boolean;
    from_lap: number;
    to_lap: number | null;
    laps: number;
    best: { time: string; lap: number | null } | null;
  }[];
  /** Per sector, the colour of each mini-sector: p, g, y, pit, o, or "". */
  segments?: string[][];
  /** Where a stop now would bring the driver back out: an estimate. */
  pit_rejoin?: {
    position: number;
    ahead: string | null;
    ahead_gap: number | null;
    behind: string | null;
    behind_gap: number | null;
    loss: number;
    /** The circuit's typical loss (true) or the generic one. */
    known: boolean;
  } | null;
  qualifying?: { part_bests: (string | null)[]; best: string | null; gap: string | null; cutoff: boolean };
}

export interface Message {
  utc: string | null;
  lap: number | null;
  category: string | null;
  flag: string | null;
  message: string;
  number: string | null;
  kind: "flag" | "penalty" | "other";
}

export interface LiveHeader {
  key: number | null;
  meeting: string | null;
  official_name?: string | null;
  circuit: string | null;
  circuit_key?: number | null;
  country?: string | null;
  session: string | null;
  kind: string;
  status: string | null;
  track_status: string | null;
  lap: number | null;
  total_laps: number | null;
  part: number | null;
  remaining: number | null;
}

export interface NextSession extends Session {
  timezone: string | null;
  meeting: string;
  round: number;
  season: number;
  circuit: string | null;
  country: string | null;
}

export interface Car {
  number: string;
  tla: string;
}

export interface Decision {
  kind: string;
  status?: string;
  cars: Car[];
  seconds: number | null;
  places: number | null;
  turn: number | null;
  reason: string | null;
  lap: number | null;
  utc: string | null;
  served?: boolean;
  index?: number;
}

export interface Stewards {
  safety_car: "deployed" | "ending" | null;
  virtual_safety_car: "deployed" | "ending" | null;
  red_flag: boolean;
  yellow_sectors: { sector: number; flag: "yellow" | "double_yellow" }[];
  yellow: boolean;
  double_yellow: boolean;
  penalties: Decision[];
  investigations: Decision[];
  decided: Decision[];
  track_limits: { number: string; tla: string; deleted: number; black_and_white: boolean }[];
}

export type LiveState =
  | "idle"
  | "paused"
  | "connecting"
  | "syncing"
  | "live"
  | "stale"
  | "lost"
  | "final"
  | "hidden";

/** What the backend sends: complete when `full`, else only what changed. */
export interface LiveView {
  full: boolean;
  state: LiveState;
  delay: number;
  paused: boolean;
  auto_start: boolean;
  ended: string | null;
  stewards?: Stewards;
  next_session: NextSession | null;
  header?: LiveHeader | null;
  data_age?: number | null;
  tower?: Row[];
  race_control?: Message[];
  weather?: {
    air: number | null;
    track: number | null;
    humidity: number | null;
    pressure: number | null;
    wind_speed: number | null;
    wind_direction: number | null;
    rain: boolean;
  } | null;
  radio?: { utc: string | null; number: string | null; url: string }[];
  pits?: { number: string; lap: string; duration: string }[];
  map_available?: boolean;
  map_reason?: "available" | "no_data" | "not_configured" | "token_problem";
}

export interface Outline {
  points: [number, number][];
  width: number;
  height: number;
}

/** The outline travels only when `full`; then only the cars. */
export interface MapView {
  full: boolean;
  outline?: Outline | null;
  cars: { number: string; x: number; y: number; on_track: boolean }[];
  utc: string | null;
}
