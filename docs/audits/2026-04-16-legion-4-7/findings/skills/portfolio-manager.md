# Audit Findings — skills/portfolio-manager/SKILL.md

**Audited in session:** S10
**Rubric version:** 1.0
**File layer:** skill
**File length:** 331 lines
**Total findings:** 4 (0 P0, 1 P1, 3 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-225 — P1, Underspecified Intent (confirmed)

**Lines 297-309**

> ### Division Reference (from workflow-common.md)
>
> ```
> engineering        — 8 agents
> design             — 6 agents
> marketing          — 8 agents
> product            — 3 agents
> project-management — 5 agents
> testing            — 7 agents
> support            — 6 agents
> spatial-computing  — 6 agents
> specialized        — 3 agents
> ```

**Issue:** Mass division-count drift against CLAUDE.md canonical Division Index (CLAUDE.md L40-50 table). CLAUDE.md truth: engineering=9, design=6, marketing=4, product=4, project-management=5, testing=6, support=4, specialized=4. This file: engineering=8 (off by -1), marketing=8 (off by +4, catastrophic), product=3 (off by -1), testing=7 (off by +1), support=6 (off by +2), specialized=3 (off by -1). Seven of nine divisions have wrong counts. Sum-of-counts here = 52, sum in CLAUDE.md = 48 (the actual agent count) — confirms this file is a STALE division registry. This skill is consumed by `/legion:portfolio` Section 5 "Agent Allocation" L265-296 which uses division assignments to compute "Underutilized divisions" and "Division spread" metrics. Under 4.7 literalism, the portfolio dashboard reports phantom agents (e.g., "marketing has 4 underutilized agents" when marketing actually has only 4 total agents, so underutilized-count vs registered-count is inverted). Peer of LEGION-47-187 (marketing-workflows 6 non-existent agent IDs, 25+ invalid refs), LEGION-47-199 (board-of-directors "53-agent pool" vs actual 48), LEGION-47-052 (spec-pipeline non-existent agent IDs), LEGION-47-119, 149, 159. This is now the SEVENTH site with non-existent-agent-ID / division-drift class. CI agent-ID validator (cross-cut from S08/S09) MUST land before S11 begins.

**Remediation sketch:** (a) Delete L297-309 entirely. Replace with a single `$include` or runtime-computed reference: "Division counts are derived from CLAUDE.md Division Index — do not duplicate here. If presenting counts to user, read CLAUDE.md or scan `agents/*.md` frontmatter `division` field at runtime: `grep -h '^division:' agents/*.md | sort | uniq -c`." (b) Cross-reference the S08/S09 proposed agent-ID validator: "A CI check in scripts/audit/validate-agent-divisions.sh verifies CLAUDE.md counts match filesystem reality; run before release." (c) Immediate P1 fix: update L297-309 to the correct CLAUDE.md counts OR delete entirely. (d) Update Section 5 "Agent Allocation" L265-296 to ground agent IDs in actual `agents/` directory listing, not this stale table. Cross-reference LEGION-47-187, 199, 052, 119, 149, 159.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** small

---

## LEGION-47-226 — P2, Implicit Preconditions (confirmed)

**Lines 131-159, 271-284**

> ### List Projects (for dashboard assembly)
> ```
> 1. Read {adapter.global_config_dir}/portfolio.md
>    - If not found: return empty list
>
> 2. Parse each ### {project-name} section under ## Projects
>
> 3. For each registered project:
>    a. Extract Path from the "**Path**:" field
>    b. Check if the directory exists (filesystem check: test -d "{path}")
>    c. If directory exists:
>       - Read {path}/.planning/STATE.md — extract:
>       ...
>       - Read {path}/.planning/ROADMAP.md — extract:
>       ...
>       - Assess health using Section 3 rules
>    d. If directory doesn't exist:
>       - Mark project status as Stale in the registry
> ```

**Issue:** Cross-project state reads with no permission, access, or cross-OS-path handling. (a) L142 `test -d "{path}"` executes filesystem check but paths are absolute and project-specific — on Windows with WSL/cygwin mix, `test -d "C:\Users\..."` may succeed or fail by environment. On Unix, absolute paths that are symlinks to another user's directory may be readable or not depending on ACL. No precondition check for read-permission before attempting Read. (b) L149-151 `Read {path}/.planning/STATE.md` — if the project has been migrated to a newer Legion schema, STATE.md fields listed at L146-148 (Current phase, Status, Last Activity, Next Action) may have moved to different heading names (seen in older audits where phase vs plan numbering changed). No schema-version check. (c) L154-156 "Mark project status as Stale in the registry" requires write-access to global `portfolio.md` — if user ran `/legion:portfolio` via read-only filesystem or missing permissions, this write fails silently. Peer LEGION-47-193, 207.

**Remediation sketch:** Add Section 0 "Cross-Project Access Preconditions" before Section 1: "(a) For each registered Path, verify: `test -d "$path" -a -r "$path/.planning"` returns 0. If directory exists but `.planning/` unreadable (permission denied), mark project 'Inaccessible' with reason — distinct from 'Stale' (missing directory). (b) STATE.md read must tolerate schema drift: extract fields via regex anchored to heading (`^## Current Phase\|^Phase:`) rather than positional parsing; on no-match, fields are null and project health assessment reports 'unknown-state' (Yellow health by default). (c) Writing 'Stale' status back to `{adapter.global_config_dir}/portfolio.md` requires write-access check before first write; if write fails, log warning and proceed with read-only dashboard (do not silently lose state changes)." Cross-reference LEGION-47-193, 207.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-227 — P2, Ambiguous Triggers (suspected)

**Lines 183-202, 245-254, 276-284**

> ### Health Assessment Rules
> Assess each project's health based on its state:
> - **Green** `[OK]`: Phase on track, no blockers in STATE.md, progress advancing
>   - Criteria: last activity within 7 days, no "escalated"/"failed"/"blocked" in Status
> - **Yellow** `[!!]`: At risk — activity stale or issues present
>   - Criteria: STATE.md Status mentions "escalated", "failed", or "blocked"; OR no activity in 7+ days
> - **Red** `[XX]`: Blocking — project missing or persistent issues
>   - Criteria: project directory missing (Stale); OR STATE.md has unresolved blockers for 3+ phases
> ...
> c. Check if the phase is marked complete (has [x] prefix)
> ...
> b. Scan plan body text and SUMMARY.md files
>    - Search for agent ID patterns matching {division}-{role} format

**Issue:** Three substring-triggered classifiers. (a) L188 health check: "no 'escalated'/'failed'/'blocked' in Status" — keyword-substring match peer of LEGION-47-028, 044, 048, 057, 072, 086. A Status field like "Phase 3 complete — recovered from blocked dependency" contains "blocked" and gets mis-labeled Yellow despite being healthy. (b) L246-248 `[x] prefix` — the canonical ROADMAP.md phase-complete marker is undefined here; if a project uses `- Complete` vs `[x]` vs `✓` the dependency check fails silently. (c) L278-279 "agent ID patterns matching `{division}-{role}` format" — 4.7 will parse this regex-by-example and may match `engineering-senior-developer` but not `data-analytics-engineer` (which doesn't fit the strict `{division}-{role}` two-segment pattern — the division is `specialized` but the agent ID is `data-analytics-engineer`). Peer LEGION-47-028.

**Remediation sketch:** (a) Health status keywords MUST come from `.planning/config/intent-teams.yaml` under `teams.portfolio.health_signals[]` — the consolidated keyword registry proposed in S09 cross-cut. Current inline list cannot disambiguate "blocked dependency recovered" from "currently blocked". Proposed schema: match against canonical Status values (Running / Blocked / Escalated / Complete) rather than substring scan. (b) L246 phase-complete marker: "Phase is complete when ROADMAP.md Progress table row shows Status='Complete' AND Completed column value is non-empty. Do NOT rely on `[x]` prefix — that is a display convention not a state marker." (c) L278 replace regex-by-example with explicit agent-ID discovery: "Extract candidate agent IDs via `grep -oE '[a-z][a-z0-9-]*-[a-z][a-z0-9-]*' "$file" | grep -Ff <(ls agents/ | sed 's/\.md$//')` — only IDs that exist in `agents/` count. Do not infer division from ID structure — look up division from the agent's frontmatter." Cross-reference LEGION-47-225 (canonical agents/ listing as source of truth).

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---

## LEGION-47-228 — P2, Authority Ambiguity (confirmed)

**Lines 21, 110, 128, 145, 154, 317, 323**

> The global portfolio registry lives at `{adapter.global_config_dir}/portfolio.md` — outside any project directory, accessible from any working directory.
> ...
> 6. Write the updated {adapter.global_config_dir}/portfolio.md
> ...
> 6. Write the updated {adapter.global_config_dir}/portfolio.md
> ...
> - Permission errors on ~/.claude/: Report clearly: "Cannot create portfolio registry at {adapter.global_config_dir}. Check directory permissions."

**Issue:** Writes to global config directory (outside project root) with no authority-matrix carve-out. `{adapter.global_config_dir}` = `~/.claude/` on Claude Code per adapter conformance. This is user-level configuration space — holding settings.json, keybindings.json, hooks, and per-user credentials. Writing a project-discovered `portfolio.md` to this path has privilege and audit-trail implications: (a) The authority-matrix.yaml does not list `~/.claude/` in scope-exempt paths (S08 finding LEGION-47-176 cross-cut); under surgical mode the write is reverted. (b) L323 "Cannot create portfolio registry" error message is ambiguous — is this a permission error or a missing-directory error or a disk-full error? No diagnostic sub-classification. (c) Multiple projects writing to the same global file without locking create concurrent-write loss (same class as LEGION-47-220 memory-manager concurrent writes, but cross-PROJECT this time — not just cross-agent). Peer LEGION-47-176, 203, 211, 220.

**Remediation sketch:** (a) Add `~/.claude/portfolio.md` (and the `{adapter.global_config_dir}/portfolio.md` abstraction) to authority-matrix.yaml `system_paths_exempt_from_scope` under `portfolio` domain. (b) Sub-classify L323 error: "If `{adapter.global_config_dir}` does not exist, attempt `mkdir -p`. If mkdir fails (EACCES): report 'Cannot create {path} — directory permissions restrict creation. Set ~/.claude/ writable or configure XDG_CONFIG_HOME.' If exists but file-write fails (EACCES): report 'Cannot write to {path}/portfolio.md — check file permissions.' If disk-full (ENOSPC): report 'Cannot write to {path} — disk full.' Do not conflate." (c) Add file-locking to cross-project writes: `flock ~/.claude/.portfolio.lock -c 'read+modify+write'`. Cross-reference LEGION-47-176 (authority carve-out), LEGION-47-220 (concurrent write lock), LEGION-47-203 (control-mode integration).

**Remediation cluster:** `authority-language`
**Effort estimate:** medium

---
