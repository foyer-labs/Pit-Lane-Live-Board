#!/bin/bash
# Put on a publish branch, based on main, only the files users and HACS need
# (publish/published-files.txt), with the reduced workflow. Then open a pull
# request to main and, with green CI, release from main (SPEC §16.2).
#
#   bash scripts/publish_main.sh <branch-name>
set -euo pipefail
BRANCH="${1:?name the publish branch}"
cd "$(dirname "$0")/.."
git diff --quiet && git diff --cached --quiet || { echo "There are uncommitted changes."; exit 1; }
[ "$(git branch --show-current)" = "develop" ] || { echo "Start from the develop branch."; exit 1; }

mapfile -t FILES < <(grep -v '^#' publish/published-files.txt | grep -v '^$')
EXISTING=()
for f in "${FILES[@]}"; do
  if git cat-file -e "develop:$f" 2>/dev/null; then EXISTING+=("$f"); fi
done
git fetch -q origin
git checkout -q -B "$BRANCH" origin/main
git rm -r -q --ignore-unmatch .
git clean -fdq
git checkout develop -- "${EXISTING[@]}"
mkdir -p .github/workflows
git show develop:publish/ci-main.yml > .github/workflows/ci.yml
# No Python caches in the published package.
find custom_components -name __pycache__ -prune -exec rm -rf {} +
git add -A
git status --short
echo "Ready on branch $BRANCH: review, commit and open the pull request to main."
