// Builds the panel as one self-contained ES module into the integration's frontend/
// folder, from where Home Assistant serves it. The result is committed: HACS installs
// custom_components/pit_lane_live_board as it is, with no build step.
import { build } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = resolve(here, "../custom_components/pit_lane_live_board/frontend");

// Minification drops the licence comments of bundled dependencies: the notices
// their licences require are repeated at the top of the file.
const banner =
  "/*! Pit Lane Live Board — Apache-2.0. See LICENSE and NOTICE." +
  "\n * Includes Lit (https://lit.dev): Copyright 2017 Google LLC, BSD-3-Clause." +
  "\n * Icons from Material Design Icons (https://pictogrammers.com), Apache-2.0. */";

await build({
  configFile: false,
  root: here,
  logLevel: "warn",
  build: {
    outDir: out,
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
    lib: {
      entry: resolve(here, "src/panel.ts"),
      formats: ["es"],
      fileName: () => "pit-lane-live-board-panel.js",
    },
    rolldownOptions: { output: { banner } },
  },
});
console.log("built pit-lane-live-board-panel.js");
