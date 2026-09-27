// How a live message joins the view already on screen (SPEC §10.5). A full message
// replaces the view; a partial one carries only the sections that changed, and the
// tower may come as a patch: the display order plus the rows that changed. Rows
// that did not change keep their object, so the page's `repeat` and `guard` skip
// them, and every section that did not travel keeps its identity too.
import type { LiveView, Row } from "./types";

export function mergeTower(previous: Row[] | undefined, patch: NonNullable<LiveView["tower_patch"]>): Row[] {
  const before = new Map((previous ?? []).map((row) => [row.number, row]));
  const tower: Row[] = [];
  for (const number of patch.order) {
    const key = String(number);
    const row = patch.rows[key] ?? before.get(key);
    // A number with neither a new row nor an old one cannot be drawn: skipped.
    if (row) tower.push(row);
  }
  return tower;
}

export function mergeLive(view: LiveView | undefined, message: LiveView): LiveView {
  if (message.full || !view) {
    if (!message.tower_patch) return message;
    // A patch with nothing to patch (should not happen): what it carries.
    const { tower_patch, ...rest } = message;
    return { ...rest, tower: mergeTower(undefined, tower_patch) };
  }
  const { tower_patch, ...rest } = message;
  const merged: LiveView = { ...view, ...rest };
  if (tower_patch) merged.tower = mergeTower(view.tower, tower_patch);
  return merged;
}
