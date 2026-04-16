#!/usr/bin/env bash
set -euo pipefail

AUDIT_DIR="docs/audits/2026-04-16-legion-4-7"
DB="$AUDIT_DIR/FINDINGS-DB.jsonl"
INDEX="$AUDIT_DIR/INDEX.md"

# `grep -c '^'` counts every line including a final unterminated line; `wc -l`
# would undercount if the last JSONL record lacks a trailing newline. Use
# `|| true` (not `|| echo 0`) because grep already emits "0" to stdout on
# empty input AND exits 1 — `|| echo 0` would produce "0\n0".
TOTAL=$(grep -c '^' "$DB" 2>/dev/null || true)
[[ -z "$TOTAL" ]] && TOTAL=0
# Note: `grep -c ... || echo 0` is double-counting on empty DB (grep prints 0
# AND exits 1, so the `|| echo 0` fires and appends a second 0). Suppress the
# non-match exit via `|| true` so the real zero from grep is preserved.
# Whitespace-tolerant severity match: some JSONL producers emit `"severity": "P2"`
# (space after colon) instead of compact `"severity":"P2"`. Both are valid JSON.
# Use [[:space:]]* to handle both.
P0=$(grep -cE '"severity":[[:space:]]*"P0"' "$DB" || true); [[ -z "$P0" ]] && P0=0
P1=$(grep -cE '"severity":[[:space:]]*"P1"' "$DB" || true); [[ -z "$P1" ]] && P1=0
P2=$(grep -cE '"severity":[[:space:]]*"P2"' "$DB" || true); [[ -z "$P2" ]] && P2=0
P3=$(grep -cE '"severity":[[:space:]]*"P3"' "$DB" || true); [[ -z "$P3" ]] && P3=0

AUDITED_COUNT=$(find "$AUDIT_DIR/findings" -name "*.md" -not -name ".gitkeep" | wc -l | tr -d ' ')

cat > "$INDEX.tmp" <<EOF
# Audit Index — Legion v7.3.2 → v7.4.0

**Audit started:** 2026-04-16
**Rubric version:** 1.0
**Baseline tag:** audit-v47-baseline
**Status:** in_progress ($AUDITED_COUNT / 125 files audited)

## Summary by Severity

- P0: $P0 findings
- P1: $P1 findings
- P2: $P2 findings
- P3: $P3 findings
- **Total:** $TOTAL findings

## Summary by Category

| Category | Count | Max Severity |
|----------|-------|--------------|
EOF

for CAT in CAT-1 CAT-2 CAT-3 CAT-4 CAT-5 CAT-6 CAT-7 CAT-8 CAT-9 CAT-10; do
  COUNT=$(grep -cE "\"category\":[[:space:]]*\"$CAT\"" "$DB" || true)
  MAX_SEV=$(grep -E "\"category\":[[:space:]]*\"$CAT\"" "$DB" 2>/dev/null | grep -oE '"severity":[[:space:]]*"P[0-3]"' | grep -oE 'P[0-3]' | sort | head -n 1 || echo "-")
  echo "| $CAT | $COUNT | $MAX_SEV |" >> "$INDEX.tmp"
done

# Per-file rows
echo "" >> "$INDEX.tmp"
echo "## Files" >> "$INDEX.tmp"
echo "" >> "$INDEX.tmp"
echo "| File | Session | Findings | Max Severity |" >> "$INDEX.tmp"
echo "|------|---------|----------|--------------|" >> "$INDEX.tmp"

# Iterate findings files and extract metadata
find "$AUDIT_DIR/findings" -name "*.md" -not -name ".gitkeep" -type f | sort | while IFS= read -r ff; do
  # Source path is the authoritative identifier. Extract it from the findings
  # file H1 header: `# Audit Findings — <source path>`. This avoids lossy
  # reverse-mapping of slug conventions (e.g. `doc-security-install-integrity`
  # → `docs/security/install-integrity.md`).
  SRC=$(head -n 1 "$ff" | sed -E 's/^# Audit Findings — //' | tr -d '\r')
  [[ -z "$SRC" ]] && SRC="(unknown) $(basename "$ff")"

  # Extract metadata from findings file header
  SESSION=$(grep -oE '\*\*Audited in session:\*\* S[0-9a-e.]+' "$ff" | head -n 1 | sed 's/.*S/S/')
  TOTAL_FINDINGS=$(grep -oE '\*\*Total findings:\*\* [0-9]+' "$ff" | head -n 1 | grep -oE '[0-9]+')
  # Max severity: look up FINDINGS-DB entries where "file" matches the
  # source path extracted from the H1. Exact-string match prevents the
  # `0 P0, 0 P1, ...` summary-line false-positive that a naive grep of
  # the findings markdown would produce.
  DB_ENTRIES=$(grep -F "\"file\":\"$SRC\"" "$DB" 2>/dev/null || true)
  if [[ -n "$DB_ENTRIES" ]]; then
    MAX_SEV=$(echo "$DB_ENTRIES" | grep -oE '"severity":[[:space:]]*"P[0-3]"' | grep -oE 'P[0-3]' | sort | head -n 1)
  else
    MAX_SEV=""
  fi
  [[ -z "$MAX_SEV" ]] && MAX_SEV="—"
  [[ -z "$TOTAL_FINDINGS" ]] && TOTAL_FINDINGS="0"
  [[ -z "$SESSION" ]] && SESSION="—"

  echo "| \`$SRC\` | $SESSION | $TOTAL_FINDINGS | $MAX_SEV |" >> "$INDEX.tmp"
done

mv "$INDEX.tmp" "$INDEX"
echo "INDEX.md updated. $AUDITED_COUNT / 125 audited, $TOTAL findings."
