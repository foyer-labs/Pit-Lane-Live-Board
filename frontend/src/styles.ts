// The panel's look, from docs/panel-prototype.html. Colours follow Home Assistant's
// theme variables, so light and dark themes work without a second stylesheet.
import { css } from "lit";

export const tokens = css`
  :host {
    --plb-purple: #a24bdb;
    --plb-green: #1fa855;
    --plb-yellow: #e0b000;
    --plb-soft: #e8333a;
    --plb-medium: #f2c200;
    --plb-hard: #eeeeee;
    --plb-intermediate: #3aa845;
    --plb-wet: #2f7de1;
    --plb-unknown: #8a8a8a;
    --plb-row-alt: color-mix(in srgb, var(--primary-text-color) 3%, transparent);
    --plb-muted: color-mix(in srgb, var(--primary-text-color) 55%, transparent);
    --plb-radius: var(--ha-card-border-radius, 12px);
    --plb-gap: 16px;
    color: var(--primary-text-color);
    font-family: var(--ha-font-family-body, Roboto, "Segoe UI", system-ui, sans-serif);
  }
  .num, .t { font-variant-numeric: tabular-nums; }
  .card {
    background: var(--card-background-color, #fff);
    border-radius: var(--plb-radius);
    box-shadow: var(--ha-card-box-shadow, 0 1px 2px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06));
    border: var(--ha-card-border-width, 0) solid var(--ha-card-border-color, var(--divider-color));
    overflow: hidden;
  }
  .card-head {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 16px; border-bottom: 1px solid var(--divider-color);
    font-size: 15px; font-weight: 500;
  }
  .card-head .spacer, .spacer { flex: 1; }
  .card-head small { color: var(--secondary-text-color); font-weight: 400; font-size: 12px; }
  .toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: var(--plb-gap); }
  .toolbar h1 { margin: 0 8px 0 0; font-size: 22px; font-weight: 500; }
  select {
    height: 36px; border-radius: 8px; border: 1px solid var(--divider-color);
    background: var(--card-background-color); color: var(--primary-text-color);
    padding: 0 10px; font: inherit; font-size: 14px;
  }
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    height: 32px; padding: 0 12px; border-radius: 16px;
    border: 1px solid var(--divider-color); background: none;
    color: var(--primary-text-color); font: inherit; font-size: 13px; cursor: pointer; white-space: nowrap;
  }
  .chip.on {
    background: color-mix(in srgb, var(--primary-color) 16%, transparent);
    border-color: transparent; color: var(--primary-color);
  }
  .chip.small { height: 26px; font-size: 12px; padding: 0 10px; }
  .tab {
    border: 0; background: none; color: var(--secondary-text-color);
    font: inherit; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;
    padding: 8px 14px; border-radius: 18px; cursor: pointer; white-space: nowrap;
  }
  .tab.active { color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 14%, transparent); }
  .btn {
    height: 36px; padding: 0 16px; border-radius: 18px; border: 0;
    background: var(--primary-color); color: var(--text-primary-color, #fff);
    font: inherit; font-weight: 500; cursor: pointer;
  }
  .btn.flat { background: none; color: var(--primary-color); border: 1px solid var(--divider-color); }
  .link { border: 0; background: none; color: var(--primary-color); font: inherit; cursor: pointer; padding: 0; }
  .bar { display: inline-block; width: 4px; height: 20px; border-radius: 2px; flex: none; }
  .drv { display: inline-flex; align-items: center; gap: 8px; }
  .tla { font-weight: 600; letter-spacing: 0.03em; }
  .gained { font-size: 11px; font-weight: 600; }
  .up { color: var(--plb-green); }
  .down { color: var(--error-color, #db4437); }
  .t.pb { color: var(--plb-green); font-weight: 600; }
  .t.ob { color: var(--plb-purple); font-weight: 600; }
  .t.prev { color: var(--plb-muted); }
  .tbl { width: 100%; border-collapse: collapse; font-size: 14px; }
  .tbl td, .tbl th { padding: 8px 12px; border-bottom: 1px solid var(--divider-color); text-align: left; white-space: nowrap; }
  .tbl th { font-size: 11px; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }
  .tbl .r { text-align: right; }
  .tbl tr.click { cursor: pointer; }
  .tbl tr.click:hover td { background: var(--plb-row-alt); }
  .scroll { overflow-x: auto; }
  .muted { color: var(--secondary-text-color); }
  .hidden-cell { color: var(--secondary-text-color); font-style: italic; }
  .state {
    display: grid; justify-items: center; gap: 12px; text-align: center;
    padding: 56px 24px; color: var(--secondary-text-color);
  }
  .state h2 { margin: 0; color: var(--primary-text-color); font-weight: 500; font-size: 22px; }
  .state .big { font-size: 44px; font-weight: 300; color: var(--primary-text-color); }
  .state svg { width: 56px; height: 56px; opacity: 0.5; }
  .note { font-size: 12px; color: var(--secondary-text-color); padding: 10px 16px; border-top: 1px solid var(--divider-color); line-height: 1.5; }
  .pill { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; padding: 2px 8px; border-radius: 10px; background: var(--secondary-background-color); }
  .pill.sprint { background: #7c4dff; color: #fff; }
  .pill.live { background: var(--error-color, #db4437); color: #fff; }
  .tyre { display: inline-flex; align-items: center; gap: 6px; }
  .tyre-dot {
    width: 22px; height: 22px; border-radius: 50%; display: inline-grid; place-items: center;
    font-size: 11px; font-weight: 700; color: var(--primary-text-color);
    border: 3px solid var(--c); background: var(--card-background-color);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--primary-text-color) 22%, transparent);
    box-sizing: border-box;
  }
  .tyre small { color: var(--secondary-text-color); font-size: 12px; }
  .tyre .used { font-size: 10px; color: var(--secondary-text-color); }
  .badge {
    display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
    background: var(--secondary-background-color); color: var(--primary-text-color);
  }
  .badge.pit { background: #1e88e5; color: #fff; }
  .badge.out { background: #6d4c41; color: #fff; }
  .badge.ret { background: var(--error-color, #db4437); color: #fff; }
  .badge.ko { color: var(--secondary-text-color); }
  .error { padding: 24px; display: grid; gap: 12px; justify-items: start; color: var(--secondary-text-color); }
  .loading { padding: 32px; color: var(--secondary-text-color); }
  .chart { padding: 12px 8px 16px; overflow-x: auto; }
  .chart svg { display: block; min-width: 640px; width: 100%; height: auto; }
  .chart .axis { stroke: var(--divider-color); }
  .chart text { fill: var(--secondary-text-color); font-size: 11px; }
  @media (max-width: 640px) {
    .tbl td, .tbl th { padding: 8px 8px; }
  }
`;

export const COMPOUND_VAR: Record<string, string> = {
  soft: "--plb-soft",
  medium: "--plb-medium",
  hard: "--plb-hard",
  intermediate: "--plb-intermediate",
  wet: "--plb-wet",
  unknown: "--plb-unknown",
};
