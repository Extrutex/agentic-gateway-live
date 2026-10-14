#!/usr/bin/env bash
# Deploys the lead webhook as a Google Apps Script web app with clasp and
# writes the resulting /exec URL into assets/site.js (leadEndpoint).
#
# One-time prerequisites (browser, Google account that owns the sheet):
#   1. https://script.google.com/home/usersettings  -> "Google Apps Script API" ON
#   2. clasp login                                   (OAuth consent, once)
#
# Usage: ops/lead-webhook/deploy.sh            first run: creates sheet + script
#        ops/lead-webhook/deploy.sh            later runs: push + new version
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
SITE_JS="$ROOT/assets/site.js"
TITLE="Agentic Gateway – Leads"

command -v clasp >/dev/null || { echo "clasp missing: npm install -g @google/clasp" >&2; exit 1; }
clasp show-authorized-user >/dev/null 2>&1 || { echo "not logged in: run 'clasp login' first" >&2; exit 1; }

cd "$HERE"
if [ ! -f .clasp.json ]; then
  echo "creating sheet + bound script '$TITLE'"
  clasp create-script --type sheets --title "$TITLE" --rootDir . >/dev/null
fi

clasp push -f
if clasp list-deployments 2>/dev/null | grep -q '@HEAD' && [ -n "$(clasp list-deployments | grep -v '@HEAD' | grep -o 'AKfy[A-Za-z0-9_-]*' | head -1)" ]; then
  DEP="$(clasp list-deployments | grep -v '@HEAD' | grep -o 'AKfy[A-Za-z0-9_-]*' | head -1)"
  clasp update-deployment "$DEP" -d "lead-webhook $(date +%Y-%m-%d)" >/dev/null
else
  DEP="$(clasp create-deployment -d "lead-webhook $(date +%Y-%m-%d)" | grep -o 'AKfy[A-Za-z0-9_-]*' | head -1)"
fi
[ -n "$DEP" ] || { echo "no deployment id found" >&2; exit 1; }

URL="https://script.google.com/macros/s/$DEP/exec"
echo "web app: $URL"

if grep -q 'leadEndpoint: ""' "$SITE_JS"; then
  sed -i '' "s#leadEndpoint: \"\"#leadEndpoint: \"$URL\"#" "$SITE_JS"
  echo "leadEndpoint written to assets/site.js"
elif ! grep -q "leadEndpoint: \"$URL\"" "$SITE_JS"; then
  echo "assets/site.js already has a different leadEndpoint, left unchanged" >&2
fi

echo "next: clasp open-script  -> run testLead once (authorizes Sheets + Mail), then test:"
echo "  curl -sL -X POST -H 'Content-Type: text/plain' -d '{\"typ\":\"kontakt\",\"email\":\"you@example.com\",\"firma\":\"Test\",\"nachricht\":\"Test\"}' $URL"
