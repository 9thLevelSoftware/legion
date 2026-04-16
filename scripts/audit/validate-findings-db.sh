#!/usr/bin/env bash
set -euo pipefail

DB="docs/audits/2026-04-16-legion-4-7/FINDINGS-DB.jsonl"
FINDINGS_DIR="docs/audits/2026-04-16-legion-4-7/findings"

if [[ ! -f "$DB" ]]; then
  echo "ERROR: $DB not found"; exit 1
fi

# 1. Every line is valid JSON
LINE_NUM=0
while IFS= read -r line; do
  LINE_NUM=$((LINE_NUM + 1))
  if [[ -z "$line" ]]; then continue; fi
  if ! echo "$line" | python3 -c "import sys,json; json.loads(sys.stdin.read())" 2>/dev/null; then
    echo "ERROR: invalid JSON at line $LINE_NUM"; exit 2
  fi
done < "$DB"

# 2. All IDs are unique and sequential
# Empty DB is valid; suppress grep's non-match exit under `set -e`.
IDS=$( { grep -oE '"id":"LEGION-47-[0-9]{3}"' "$DB" || true; } | grep -oE 'LEGION-47-[0-9]{3}' | sort || true)
DUPES=$( { echo "$IDS" | uniq -d; } || true)
if [[ -n "$DUPES" ]]; then
  echo "ERROR: duplicate IDs: $DUPES"; exit 3
fi

# 3. Every finding in DB references a findings file that exists
while IFS= read -r line; do
  if [[ -z "$line" ]]; then continue; fi
  FILE=$(echo "$line" | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['file'])")
  # Map source path to findings path
  case "$FILE" in
    commands/*) SLUG="${FILE#commands/}"; EXPECTED="$FINDINGS_DIR/commands/${SLUG}" ;;
    skills/*/SKILL.md) SLUG="${FILE#skills/}"; SLUG="${SLUG%/SKILL.md}.md"; EXPECTED="$FINDINGS_DIR/skills/$SLUG" ;;
    agents/*) SLUG="${FILE#agents/}"; EXPECTED="$FINDINGS_DIR/agents/${SLUG}" ;;
    adapters/*) SLUG="${FILE#adapters/}"; EXPECTED="$FINDINGS_DIR/adapters/${SLUG}" ;;
    *) EXPECTED="" ;;  # root files — manual mapping, skip strict check
  esac
  if [[ -n "$EXPECTED" ]] && [[ ! -f "$EXPECTED" ]]; then
    echo "ERROR: finding references file $FILE but $EXPECTED missing"; exit 4
  fi
done < "$DB"

echo "OK: $(wc -l < "$DB") findings, all valid"
