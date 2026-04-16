# METHODOLOGY.md — Per-File Audit Procedure

**This document is the definitive procedure for auditing a single file. Every file-audit task in the plan references this procedure. Do not deviate.**

## Procedure (applied to each file in a session)

1. **Read the file completely.** Note its layer (command / skill / agent / adapter / root). Note whether it is prose-heavy (most files) or schema-heavy (JSON schemas).

2. **Identify the interaction surface.** What parts of this file become LLM-context at runtime? For commands/skills/agents: usually the whole file. For schemas: usually only `title`/`description`/`examples` fields.

3. **Apply each of the 10 rubric categories as a sequential pass.** For CAT-1 through CAT-10:
   - Scan for the category's detection patterns (see RUBRIC.md).
   - For each match, note: line range, exact excerpt, preliminary severity.
   - Distinguish `confirmed` (matches the observed open-set-interpretation failure class OR another externally-reported failure) vs `suspected` (structural risk only, no observed evidence).

4. **Generate finding IDs.** For each finding, run `bash scripts/audit/next-finding-id.sh` to get the next `LEGION-47-NNN`.

5. **Write the findings file** at `docs/audits/2026-04-16-legion-4-7/findings/<layer>/<slug>.md` using the template in this document.

6. **Append each finding to FINDINGS-DB.jsonl** using the JSONL schema below. One finding per line.

7. **Update INDEX.md** with the file's row: status, per-category finding counts, max severity, session ID.

8. **Commit per-file:** `audit: <file-path> — N findings (<severity-summary>)`

### Finding Record JSONL Schema

One line per finding. All fields required.

```json
{"id":"LEGION-47-042","file":"skills/wave-executor/SKILL.md","line_range":"87-94","category":"CAT-3","severity":"P0","confirmed":true,"excerpt":"Consider dispatching peer tasks in parallel when it makes sense.","issue":"Ambiguous trigger and missing fan-out criteria. 4.7 defaults to sequential dispatch.","remediation_sketch":"Replace with explicit condition: dispatch as parallel agents when (a) no shared files_modified, (b) same wave, (c) CLI supports parallel.","remediation_effort":"small","remediation_cluster":"dispatch-specification","status":"open","rubric_version":"1.0","session":"S06"}
```

**Field constraints:**
- `id`: matches regex `^LEGION-47-[0-9]{3}$`
- `file`: relative path from repo root
- `line_range`: `N` or `N-M` where N,M are 1-indexed line numbers
- `category`: one of `CAT-1`..`CAT-10`
- `severity`: one of `P0`,`P1`,`P2`,`P3`
- `confirmed`: boolean
- `remediation_effort`: one of `small`,`medium`,`large`
- `remediation_cluster`: lowercase kebab-case identifier (e.g., `closed-set-enforcement`, `dispatch-specification`, `intent-front-loading`, `persona-calibration`, `acceptance-criteria`, `authority-language`, `prohibitive-to-positive`, `response-calibration`, `precondition-verification`, `trigger-explicitness`)
- `status`: one of `open`,`in-remediation`,`resolved`,`wontfix`
- `session`: matches regex `^S[0-9]+[a-e]?$` (widened to accommodate S17e review-gate session)

### Per-File Findings Document Template

```markdown
# Audit Findings — <file-path>

**Audited in session:** <SXX>
**Rubric version:** 1.0
**File layer:** <command|skill|agent|adapter|root>
**File length:** <N lines>
**Total findings:** <N> (<severity breakdown>)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-NNN — <severity>, <category short name> (<confirmed|suspected>)

**Lines NN-MM**

> <exact excerpt from file>

**Issue:** <1-3 sentences describing the 4.7-literalism risk>

**Remediation sketch:** <1-3 sentences describing the fix pattern>

**Remediation cluster:** `<cluster-slug>`
**Effort estimate:** <small|medium|large>

---

[Repeat for each finding in file]
```

### Zero-Findings Files

If a file has no findings, still create the findings file. Content:

```markdown
# Audit Findings — <file-path>

**Audited in session:** <SXX>
**Rubric version:** 1.0
**File layer:** <layer>
**File length:** <N lines>
**Total findings:** 0 (clean)
**Baseline commit:** audit-v47-baseline

---

No findings. All 10 rubric categories applied; no matches detected.

## Category Coverage Notes

(Optional) Notes on why specific categories were checked but produced no findings, if non-obvious.
```

### Session-End Procedure

At the end of each session:
1. Update `SESSIONS.md` with session end time, files completed, total findings surfaced, any blockers.
2. Run `bash scripts/audit/validate-findings-db.sh` to verify JSONL integrity.
3. Run `bash scripts/audit/update-index.sh` to refresh INDEX.md aggregates.
4. Commit: `audit: close session <SXX> — <N> files audited, <K> total findings`

### Heavy-File Rule

A file is "heavy" if any of: >200 lines, 5+ H2 sections, 3+ code fences. Heavy files get their own session slot or share a session with at most 2 other heavy files. If a session hits 70% of context budget before completing, stop, commit, and split the remainder to a new session (update SESSIONS.md accordingly).

### Context Loading Discipline

At session start, load ONLY: RUBRIC.md, METHODOLOGY.md, SESSIONS.md (tail), and the files being audited this session. Do NOT load the full FINDINGS-DB.jsonl — use `tail -5 FINDINGS-DB.jsonl` for ID continuity, and let `next-finding-id.sh` handle ID generation.
