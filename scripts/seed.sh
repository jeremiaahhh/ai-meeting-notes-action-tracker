#!/usr/bin/env bash
# Seed the running backend with the sample transcripts.
#
# Usage:
#   bash scripts/seed.sh                 # defaults to http://localhost:8000
#   API_BASE=http://my-host:8000 bash scripts/seed.sh

set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8000}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SAMPLE_DIR="$ROOT/sample-transcripts"

echo "→ Seeding meeting notes at $API_BASE"

for attempt in $(seq 1 30); do
  if curl -sf "$API_BASE/health" > /dev/null; then
    break
  fi
  echo "  ...waiting for backend (attempt $attempt/30)"
  sleep 1
done

seed_one() {
  local title="$1"
  local participants="$2"
  local file="$3"

  local transcript
  transcript="$(python3 -c "import json,sys; print(json.dumps(open(sys.argv[1]).read()))" "$file")"
  local body
  body=$(python3 -c "
import json, sys
print(json.dumps({
  'title': sys.argv[1],
  'participants': sys.argv[2],
  'transcript': json.loads(sys.argv[3]),
}))
" "$title" "$participants" "$transcript")

  echo "  creating: $title"
  local response
  response=$(curl -sf -X POST "$API_BASE/meetings" \
    -H "Content-Type: application/json" \
    -d "$body")
  local id
  id=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['id'])" "$response")

  echo "    generating notes for $id"
  curl -sf -X POST "$API_BASE/meetings/$id/generate-notes" > /dev/null
}

seed_one "Q3 Launch Planning" "Anna, Marc, Sam, Priya" "$SAMPLE_DIR/q3-launch-planning.txt"
seed_one "Incident Postmortem — API Latency" "Jordan, Lee, Ramon, Mei" "$SAMPLE_DIR/incident-postmortem.txt"
seed_one "Product Discovery — Onboarding" "Hana, Tom, Greg, Olivia" "$SAMPLE_DIR/product-discovery.txt"

echo "✓ Seed complete. Visit the frontend or: curl $API_BASE/meetings | jq"
