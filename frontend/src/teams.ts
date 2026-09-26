// Colours for teams when F1's feed does not carry them (Jolpica has none).
// Plain hex values chosen to match what fans recognise; no names or marks.
const KNOWN: Record<string, string> = {
  mercedes: "#27F4D2",
  ferrari: "#E8002D",
  mclaren: "#F47600",
  red_bull: "#3671C6",
  aston_martin: "#229971",
  alpine: "#00A1E8",
  williams: "#1868DB",
  haas: "#B6BABD",
  rb: "#6692FF",
  sauber: "#52E252",
  audi: "#BB0A30",
  cadillac: "#909090",
};

const PALETTE = ["#5c6bc0", "#26a69a", "#ef6c00", "#8e24aa", "#43a047", "#d81b60", "#00897b", "#6d4c41", "#3949ab", "#c0ca33"];

export function teamColour(teamId: string | null | undefined, fallback?: string | null): string {
  if (fallback) return fallback;
  if (teamId && KNOWN[teamId]) return KNOWN[teamId];
  let hash = 0;
  for (const char of teamId ?? "") hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
