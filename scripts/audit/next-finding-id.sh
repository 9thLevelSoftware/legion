#!/usr/bin/env bash
set -euo pipefail

DB="docs/audits/2026-04-16-legion-4-7/FINDINGS-DB.jsonl"

if [[ ! -f "$DB" ]] || [[ ! -s "$DB" ]]; then
  echo "LEGION-47-001"
  exit 0
fi

LAST=$(tail -n 1 "$DB" | grep -oE '"id":"LEGION-47-[0-9]{3}"' | head -n 1 | grep -oE '[0-9]{3}')
if [[ -z "$LAST" ]]; then
  echo "ERROR: could not extract last finding ID from $DB" >&2
  exit 1
fi
NEXT=$((10#$LAST + 1))
printf "LEGION-47-%03d\n" "$NEXT"
