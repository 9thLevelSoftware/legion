# Audit Findings — skills/memory-manager/SKILL.md

**Audited in session:** S10
**Rubric version:** 1.0
**File layer:** skill
**File length:** 1201 lines
**Total findings:** 5 (0 P0, 0 P1, 5 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-216 — P2, Prohibitive Over-Reliance (confirmed)

**Lines 372-404**

> ## Section 6: Graceful Degradation
> The golden rule: every workflow that calls memory must work identically without it.
> ```
> Caller Pattern (MUST be followed by all workflows that integrate memory):
>   1. Check if .planning/memory/OUTCOMES.md exists
>   ...
>   4. NEVER:
>      a. Error if memory files are missing
>      b. Block workflow execution on memory operations
>      c. Require memory for any workflow to function
>      d. Change workflow behavior in a way that breaks without memory
>      e. Add mandatory memory steps to any workflow's critical path
> ```

**Issue:** Five-item "NEVER:" cluster stacked under a single heading in the skill's core contract section, plus three additional "Do NOT" directives in Step 3 (L386-388). Peer of LEGION-47-210 (codebase-mapper 7 Nevers), LEGION-47-177 (authority-enforcer DO NOT stack). 4.7 under literalism absorbs prohibitive clusters as a taboo enumeration and adopts over-defensive posture: callers that encounter actionable signals (e.g., OUTCOMES.md parse failed + recall-critical path) suppress the signal to avoid tripping a "NEVER" clause. The contract is correct in intent but the prohibitive framing obscures the positive behavior spec. Additionally, clause `d. Change workflow behavior in a way that breaks without memory` uses vague "breaks" — 4.7 cannot operationalize "breaks" vs "degrades".

**Remediation sketch:** Replace L389-394 with positive spec: "Memory-aware workflows MUST satisfy three invariants: (1) produce identical primary outputs whether memory is present or absent (test: Section 6.1 below); (2) memory reads and writes are off the critical path — failure of a memory operation must not change the return status of the enclosing workflow; (3) recall results enrich presentation but do not override algorithm outputs (recommendations are memory-boosted, not memory-determined). Runtime check: `run workflow with .planning/memory/ renamed to .planning/memory.disabled/; assert core workflow returns success`." Retain L389 NEVER only if defending the closed set of file-missing error handling. Cross-reference LEGION-47-210 and LEGION-47-177.

**Remediation cluster:** `prohibitive-to-positive`
**Effort estimate:** small

---

## LEGION-47-217 — P2, Underspecified Intent (suspected)

**Lines 159-165**

> **Store Decision (embedded in outcome records)**:
>
> Key decisions are captured in the Summary and Tags fields of outcome records rather than a separate file. For example:
> - "Chose engineering-senior-developer over engineering-rapid-prototyper for production Laravel work" (tags: `agent-selection, engineering`)
> - "Escalated review after 3 cycles — milestone-tracker had persistent edge case" (tags: `escalation, review, milestone`)

**Issue:** "Store Decision" is a named operation but has no input contract, no call-site, no trigger rule, no required-field list. Two examples are given but no rule for WHEN decisions are embedded vs skipped. Under 4.7 literalism the engine will either (a) never invoke this because there is no procedural description, or (b) embed every Summary with decision-flavored phrasing, inflating OUTCOMES.md with prose that confounds the keyword-match filter in Section 4 recall. The `agent-selection` tag is not in the Section 3 Step 4 "valid task_types" list (L124-126) so a recall filter by tag may match or not depending on whether "agent-selection" is a task_type or a free tag — ambiguous.

**Remediation sketch:** Elevate to full sub-section with (a) trigger criteria: "Embed decision in Summary when the outcome involves a non-default agent selection OR a cycle-count override OR a user-corrective signal (cross-reference Section 13 corrective class)." (b) Required phrasing: "Decision summaries begin with 'Chose X over Y' | 'Escalated after N cycles' | 'Deferred to N' so the recall keyword matcher can pull them with query_tag='decision'." (c) Add `decision` to the task_types valid list OR clarify that `decision` is a free tag (Tags column) distinct from task_types. (d) Caller list: which workflows invoke Store Decision (execution-tracker? review.md? status.md?) — currently unclear.

**Remediation cluster:** `intent-front-loading`
**Effort estimate:** small

---

## LEGION-47-218 — P2, Unstated Acceptance Criteria (suspected)

**Lines 94-157, 246-256**

> Store Outcome:
> Step 7: Verify
>   - Confirm the new record appears in OUTCOMES.md
>   - Confirm Task Type column is non-empty in the new record
>   - If write failed: output the record as text to the user (never lose data)
> ...
> Step 5: Return agent_id → memory_score mapping
>   - Only include agents with total_tasks >= 2 (avoid one-off noise)
>   - Sort by memory_score descending

**Issue:** Three acceptance-criteria gaps. (a) Step 7 says "Confirm the new record appears" — no procedure: does the agent `Read` the file again? `grep` for the ID? `tail -1`? Under literalism, 4.7 likely treats "Confirm" as a narrative assurance rather than a re-read verification. (b) L156 "never lose data" is a promise without a mechanism — if Write fails and the agent also fails to print the record text (e.g., context overflow, premature termination), the outcome is silently lost. (c) Recall Agent Scores L254 threshold `total_tasks >= 2` — the first two tasks per task_type are invisible to the recommendation engine. This is a cold-start problem with no documented semantics: does the agent-registry caller know "no memory boost until task N=2"? Peer LEGION-47-054, 151, 161, 196, 202, 209, 214.

**Remediation sketch:** (a) Step 7: "Re-read OUTCOMES.md, parse the Records table, and assert the last row's ID column equals the ID assigned in Step 2. On mismatch, output the record text to the user AND emit an <escalation severity=warning type=quality> so the caller workflow can decide whether to proceed." (b) Add fallback: "If Write fails, append the record text to stdout AND to `.planning/memory/FAILED-WRITES.md` (create if missing). The FAILED-WRITES.md file is inspected on next store to retry." (c) Add cold-start rule to Section 4 Step 5: "When an agent has total_tasks < 2 for a requested task_type, memory_score = null (not 0). Callers treat null as 'no memory signal' — agent-registry must not penalize nulls vs positive scores; baseline scoring applies." Cross-reference agent-registry Layer 4 Memory Boost wiring.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-219 — P2, Underspecified Dispatch (confirmed)

**Lines 114-136, 256-306**

> Step 4: Validate and resolve task_type
>   - task_type MUST be populated for every outcome record (never leave blank)
>   - Apply the following inference chain in order:
>     1. Primary: use the task_type passed by the execution-tracker
>     2. Fallback 1: if task_type is missing or empty, look up the executing agent's
>        entry in CATALOG.md (skills/agent-registry/CATALOG.md) and use the FIRST
>        value from the agent's Task Types column
>     3. Fallback 2: if the agent is "autonomous" or not found in CATALOG.md,
>        use "general"
>   - Valid task_types: any tag listed in the Task Types column of CATALOG.md

**Issue:** Dual ground-truth anti-pattern peer of LEGION-47-085 (validate.md). (a) This skill defers validity to `skills/agent-registry/CATALOG.md`; agent-registry/SKILL.md lists only partial content (Sections 3+4 visible, Sections 1+2 moved to CATALOG.md per L13 "Agent catalog and task-type index are in CATALOG.md in this directory"). CATALOG.md is not in the context window of `/legion:build` or `/legion:review` so the validation described at L124 CANNOT run — agent will fall through to Fallback 2 (`general`) on every record because it has no access to CATALOG.md at store time. (b) L132 "first Task Type" depends on column ordering being stable in CATALOG.md — a documentation-ordering choice becomes a behavioral dependency. (c) Section 4 Recall Archetype Scores (L258-306) consumes the same Task Type column with no cross-reference to this inference chain — if different callers resolve task_type differently, the recall groups do not match store values. Cross-cut LEGION-47-085, 188 (marketing-workflows schema drift).

**Remediation sketch:** (a) Declare CATALOG.md as a required context file for memory-manager in the skill frontmatter `execution_context:` and ensure build.md/review.md that call Store Outcome load it. Alternative: inline the task_type registry into memory-manager/SKILL.md itself (single source of truth). (b) Replace "first Task Type" with explicit precedence rule: "Look up the Task Types column, split on comma, take index[0] after trimming whitespace. If the agent's row has zero Task Types, use 'general'." (c) Add a Task Type Registry section (near Section 2) listing the canonical valid task_type enum; reference it from all three Recall modes AND from Store Step 4. Cross-reference agent-registry Layer 1 concept normalization list (L32-38) — decide whether normalized concepts (performance, security, accessibility) are valid task_types or a separate namespace.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** medium

---

## LEGION-47-220 — P2, Implicit Preconditions (suspected)

**Lines 416-418, 782-832**

> - **Concurrent writes**: Not a concern in Legion workflows — only one build/review runs at a time per project. If somehow two writes conflict, the second write wins (last-write-wins, consistent with all other Legion state files).
> - **Date parsing failure**: If a record's date cannot be parsed, treat its recency_weight as 0.4 (middle of the range). Do not exclude records with unparseable dates.
> ...
> **Branch Detection:**
> ```
> Get Current Branch:
>   Run: git branch --show-current
>   Result: branch name (e.g., "main", "feature/auth", "phase-33-execution")
>   Fallback: if command fails or returns empty, use "unknown"
> ```

**Issue:** Two preconditions with false-premise handling. (a) L416 "only one build/review runs at a time per project" — contradicts wave-executor's parallel-dispatch model (Wave 1 parallel plans may all record outcomes via execution-tracker simultaneously); the `last-write-wins` falls back on filesystem-level atomicity which is not guaranteed for append-to-table operations (two concurrent `Read → append → Write` cycles can lose records, not just overwrite). Peer LEGION-47-082 (other state files with same assumption). (b) L786-787 `git branch --show-current` preconditions include: (i) git installed, (ii) cwd is inside a git repo, (iii) detached HEAD state returns empty (maps to "unknown" per fallback). No precondition check for (i) or (ii). If memory-manager is invoked outside a git worktree (e.g., `/legion:portfolio` reading `.planning/memory/` in a project that was moved/copied without git), every new record gets Branch="unknown" silently — Section 11 Branch-Scoped Recall becomes useless for that project.

**Remediation sketch:** (a) Section 7 L416: "Concurrent writes from parallel-dispatched agents are a real concern in Wave 2+ parallel plans. Store Outcome MUST acquire a file lock (`flock .planning/memory/OUTCOMES.md.lock -c 'read+append+write'`) or serialize via execution-tracker Section 2 single-writer commit. Without locking, record loss is possible under parallel dispatch." Add verification: concurrent-store regression test. (b) Section 11 L782-788: "Precondition: `git rev-parse --is-inside-work-tree` returns 0. If not, set branch='no-git' and emit <escalation severity=info type=infrastructure> once per session. Do not silently substitute 'unknown' — distinguish missing-git from detached-HEAD from worktree-not-a-repo."

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---
