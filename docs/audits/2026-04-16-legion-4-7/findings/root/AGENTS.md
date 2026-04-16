# Audit Findings — AGENTS.md

**Audited in session:** S02a
**Rubric version:** 1.0
**File layer:** root
**File length:** 225 lines
**Total findings:** 2 (0 P0, 0 P1, 2 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

**Note:** `AGENTS.md` is byte-identical to `CLAUDE.md` except for line 36 (skill count: 31 vs 30). The 4.7-literalism surface is therefore the same; findings here are paired to `LEGION-47-001` and `LEGION-47-002` in `CLAUDE.md` and share the same remediation clusters. Both files should be remediated together so they do not drift.

---

## LEGION-47-003 — P2, CAT-6 Implicit Preconditions (suspected)

**Lines 64-66**

> [Legion Agents Index]|root: {AGENTS_DIR} (resolve via workflow-common-core Agent Path Resolution)
> |engineering:{engineering-ai-engineer.md,...}

**Issue:** Same surface as `LEGION-47-001` in `CLAUDE.md`. The Dynamic Knowledge Index instructs the reader (line 62) to "use the `Read` tool to read their exact markdown file from the index below" — but the index root is the placeholder `{AGENTS_DIR}` with only a parenthetical "(resolve via workflow-common-core Agent Path Resolution)". Under Claude 4.7 literalism, a reader may treat `{AGENTS_DIR}` as a literal path or fail silently if `workflow-common-core` isn't loaded. Since Codex CLI and other tools read `AGENTS.md` as their primary root context (not `CLAUDE.md`), this finding has parity exposure on those adapters.

**Remediation sketch:** Same as `LEGION-47-001`. Apply identical fix to both files in a single edit batch; consider generating both from a single source of truth to prevent drift.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-004 — P2, CAT-2 Ambiguous Triggers (confirmed)

**Status update (post-S02c):** Flag changed `suspected` → `confirmed`. S02c audit of `.planning/config/intent-teams.yaml` verified no `marketing_keywords` / `design_keywords` entries exist. Parity with `LEGION-47-002`.

**Lines 110-112**

> Marketing workflows activate when `/legion:plan` detects a marketing-focused phase (MKT-* requirements or marketing keywords). Campaign planning produces structured documents at `.planning/campaigns/`...
>
> Design workflows activate when `/legion:plan` detects a design-focused phase (DSN-* requirements or design keywords). Design system creation produces structured documents at `.planning/designs/`...

**Issue:** Same surface as `LEGION-47-002` in `CLAUDE.md`. "marketing keywords" and "design keywords" are unenumerated triggers; under 4.7 literalism, readers reproducing this decision may over-match or under-match.

**Remediation sketch:** Same as `LEGION-47-002`. Apply identical fix to both files.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---

## Category Coverage Notes

All category coverage notes from `findings/root/CLAUDE.md` apply identically here (CAT-1, CAT-3, CAT-5, CAT-7, CAT-8, CAT-9, CAT-10 all clean for the same reasons). The one inter-file drift (line 36: `30` vs `31` skills) is a data-consistency issue, not a 4.7-literalism issue; it is out of audit scope and should be tracked as a separate maintenance follow-up.
