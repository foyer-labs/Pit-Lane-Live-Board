#!/bin/bash
# Capture docs/screenshots/*.png from the bench (SPEC §20).
#
#   python scripts/bench_data.py      # once: the bench's data
#   bash scripts/screenshots.sh [path-to-chrome]
#
# Serves the repository root on 127.0.0.1:8777 for the duration. Phone captures are
# 500 px wide: headless Chrome cannot make a narrower window, and 500 px is below
# every breakpoint of the panel.
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="${1:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
OUT=docs/screenshots
mkdir -p "$OUT"
python -m http.server 8777 --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1.5

shot() { # name width height query
  local target="$OUT/$1.png"
  if command -v cygpath >/dev/null; then target="$(cygpath -aw "$target")"; fi
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=5000 \
    --screenshot="$target" --window-size="$2,$3" "http://127.0.0.1:8777/bench/?$4" 2>/dev/null
  echo "$OUT/$1.png"
}

for lang in en it; do
  suffix=$([ "$lang" = en ] && echo "" || echo ".it")
  shot "live$suffix" 1440 1180 "page=live&live=race&lang=$lang"
  shot "qualifying$suffix" 1440 900 "page=live&live=qualifying&lang=$lang&theme=dark"
  shot "calendar$suffix" 1440 1000 "page=calendar&lang=$lang"
  shot "strategy$suffix" 1440 860 "page=results&round=14&tab=strategy&lang=$lang"
  shot "lap-chart$suffix" 1440 760 "page=results&round=14&tab=lap_chart&lang=$lang&theme=dark"
  shot "standings$suffix" 1440 900 "page=standings&lang=$lang"
  shot "phone$suffix" 500 1000 "page=live&live=race&lang=$lang"
  shot "delay$suffix" 1440 520 "page=live&live=syncing&lang=$lang&delayOpen=true"
done
