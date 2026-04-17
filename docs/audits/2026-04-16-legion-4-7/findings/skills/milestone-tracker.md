# Audit Findings — skills/milestone-tracker/SKILL.md

**Audited in session:** S10
**Rubric version:** 1.0
**File layer:** skill
**File length:** 437 lines
**Total findings:** 4 (0 P0, 0 P1, 4 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-221 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 94-111, 176-180, 309-310, 427-429**

> Step 4: Present proposals to user
>   Use AskUserQuestion to show the proposed milestones:
>   "Here are the proposed milestones for your project:
>
>   Milestone 1: {name} (Phases {start}-{end})
>   Goal: {goal}
>   ...
>   Accept these milestones, or describe changes?"
>
> Step 5: Handle user response
>   - Accept: proceed to write milestones
>   - Modify: adjust boundaries, names, or goals as directed
>   - Define from scratch: user provides their own groupings
> ...
> Step 2: Check if .planning/milestones/MILESTONE-{N}.md already exists
>   - If it exists: ask user whether to overwrite or skip summary generation
> ...
> If `.planning/archive/milestone-{N}/` already exists:
>     Ask user whether to continue (move remaining dirs) or abort
> ...
> - **Milestone summary already exists**: ... ask user via AskUserQuestion: "Milestone summary already exists at .planning/milestones/MILESTONE-{N}.md. Overwrite with fresh metrics, or skip summary generation?"

**Issue:** Four user-facing prompts in one skill, three of which mix CLAUDE.md AskUserQuestion mandate with free-text escape hatches. (a) L94-111 "Accept these milestones, or describe changes?" — three handling branches (Accept/Modify/Define from scratch) but "describe changes" is free-text capture that AskUserQuestion cannot collect via its structured-options API; under 4.7 literalism the agent will either render this as a structured two-option prompt and ignore "Modify"/"Define from scratch", or render as raw text (violating the mandate). (b) L309 "ask user whether to continue (move remaining dirs) or abort" — no AskUserQuestion invocation specified; free-text [Y/n] anti-pattern peer of LEGION-47-020. (c) L427 is properly structured but duplicates L176-180 — two different prompts for the same decision point. Same closed-set / free-text defect observed in 10+ prior findings: LEGION-47-019, 020, 033, 043, 058, 070, 092, 116, 159, 191, 198, 212.

**Remediation sketch:** Replace L94-111 Step 4 with explicit structured prompt: "Invoke AskUserQuestion with three options: id='accept' label='Accept proposed milestones'; id='modify' label='Adjust boundaries or goals'; id='restart' label='Define milestones from scratch'. If user selects modify: re-enter with AskUserQuestion per-milestone {Keep / Change name / Change range / Remove}. If user selects restart: prompt for free-form milestone-count count then loop." Replace L309 with AskUserQuestion {id='continue' label='Continue moving remaining directories'; id='abort' label='Abort archiving, leave partial state'}. Consolidate L176-180 and L427 into single canonical prompt referenced by both. Cross-reference the `adapter.prompt_free_text` primitive decision outstanding per S05/S09.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-222 — P2, Unstated Acceptance Criteria (suspected)

**Lines 115-135, 155-169, 285-301**

> ### Write Milestones to ROADMAP.md
> ```
> Step 1: Read current ROADMAP.md
> Step 2: Validate milestone ranges
>   - Ranges must cover all phases exactly (no gaps, no overlaps)
>   - Each phase appears in exactly one milestone
>   - If validation fails: report the issue and ask user to fix
> ...
> Step 3: Verify all phases are Complete
>   - Read the Progress table
>   - For each phase in the milestone's range (start through end inclusive):
>     - Check that Status = "Complete"
>   - If any phase is NOT Complete:
>     ...
>     - Do NOT mark the milestone complete
>     - Exit completion flow
> Step 4: Verify reviews passed
>   - Check for UAT.md files in each phase directory
>   - Or check STATE.md for review status indicators
>   - If reviews are missing: warn but do not block completion

**Issue:** Two acceptance-criteria gaps. (a) L132 "If validation fails: report the issue and ask user to fix" — no resumption semantics: does the skill wait for an edited ROADMAP.md and re-run? Does it offer AskUserQuestion with options to auto-fix gaps? Under literalism, 4.7 prints the error and exits, leaving the user stuck without a recovery path. (b) L165-169 Step 4 Verify reviews passed: "Check for UAT.md files ... OR check STATE.md for review status indicators" — two competing truth sources with no priority rule. Worse, L168 "If reviews are missing: warn but do not block completion" — this contradicts the skill's name (milestone-tracker tracks milestone completion, but allows milestones to complete with missing reviews). (c) Pre-flight checks at L285-301 (archive) similarly use "ask whether to proceed with partial archive" without operationalizing the prompt.

**Remediation sketch:** (a) Step 2 validation failure: "Invoke AskUserQuestion with options {id='auto-fix' label='Let me repair gaps by extending the last milestone'; id='manual' label='I'll edit ROADMAP.md and you should retry'; id='abort' label='Cancel milestone definition'}. On auto-fix, extend the last milestone's end-phase to cover the gap; on manual, exit non-fatally with instruction; on abort, discard proposals." (b) Step 4: define authoritative review-check: "Priority 1: phase's UAT.md exists AND contains `## Verdict: PASS`; Priority 2: STATE.md Phase Results section lists `reviewed: pass`; otherwise reviews=missing. On reviews=missing, block completion by default; allow override only via AskUserQuestion {id='complete-without-review' label='Mark complete without review evidence (documented exception)'; id='block' label='Run /legion:review first'}." (c) Tie archive pre-flight to the same AskUserQuestion pattern.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-223 — P2, Authority Ambiguity (suspected)

**Lines 278-351**

> ## Section 4: Milestone Archiving
> ...
> ### Archive Operations
> ```
> Step 1: Create archive directory
>   - Create .planning/archive/ if it doesn't exist
>   - Create .planning/archive/milestone-{N}/ directory
> ...
> Step 2: Move phase directories
>   For each phase in the milestone's range:
>   - Source: .planning/phases/{NN-name}/
>   - Destination: .planning/archive/milestone-{N}/{NN-name}/
>   - Move the entire directory (preserving all files: CONTEXT.md, PLAN.md, SUMMARY.md, UAT.md)
> ...
> ### Update State Files After Archiving
> ```
> ROADMAP.md updates: ...
> STATE.md updates: ...
> Milestone summary updates: ...

**Issue:** Archive operation writes to `.planning/archive/`, mutates `.planning/phases/{NN-name}/` (moves), rewrites `.planning/ROADMAP.md` and `.planning/STATE.md` and `.planning/milestones/MILESTONE-{N}.md`. This is a multi-file, non-atomic, partially-destructive state transition with no authority-matrix carve-out. Cross-cut to LEGION-47-176 (authority-enforcer missing system-path carve-out for state writes) and LEGION-47-146 (writing config-adjacent files). Under surgical control_mode, post-execution boundary check will see writes outside the agent's `files_modified` list and revert — leaving the project in a torn state: phase directories moved but STATE.md rewind, or ROADMAP.md updated but phase directories still present. The skill has no rollback procedure for Step 2 partial-move failures (L322 "If any move failed: report the failure, continue with remaining phases" is the OPPOSITE of atomic — guarantees torn state).

**Remediation sketch:** (a) Add authority-matrix carve-out: list `.planning/archive/`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/milestones/MILESTONE-*.md` and `.planning/phases/*/` (move-source-and-destination) in authority-matrix.yaml `system_paths_exempt_from_scope` under milestone-tracker domain. (b) Add transaction wrapper: "Before Step 1: create .planning/.archive-txn-{N}.lock listing all paths to modify. On any failure in Steps 2-5, roll forward (complete) or roll back (restore) using the lock manifest. Never leave torn state." (c) L322 replace "continue with remaining phases" with: "On move failure: halt Step 2 entirely. Emit <escalation severity=blocker type=infrastructure> with the failed path. Do NOT proceed to Steps 3-5. User resolves manually and re-runs with --resume." Cross-reference LEGION-47-176, 146, 203, 211.

**Remediation cluster:** `authority-language`
**Effort estimate:** medium

---

## LEGION-47-224 — P2, Implicit Preconditions (confirmed)

**Lines 37-40, 182-198**

> - Phase ranges are inclusive and must not overlap (e.g., Phases 1-7 and Phases 8-14, not 1-7 and 7-14)
> - Phase ranges must cover ALL phases in the roadmap — no gaps allowed
> - Every phase belongs to exactly one milestone
> ...
> Step 3: Gather quantitative metrics
>   From ROADMAP.md Progress table for phases in range:
>   - Total plans: sum of Plans column
>   - Plans completed: sum of Completed column
>   - Phases: count of phases in the milestone (end - start + 1)
>
>   From REQUIREMENTS.md traceability table:
>   - Find all requirement IDs mapped to phases in the milestone's range
>   - Count how many are checked [x] vs total
> ...
>   From SUMMARY.md files for each phase:
>   - Extract key-files lists (created/modified)
>   - Deduplicate and count
>
>   From CONTEXT.md files for each phase:
>   - Extract agent recommendations
>   - Deduplicate agent IDs

**Issue:** Six file-read preconditions without existence or schema checks. (a) ROADMAP.md `Progress` table assumes specific columns (`Plans`, `Completed`) — if `/legion:plan` has not populated this table yet, summing an empty/malformed table silently yields 0. (b) REQUIREMENTS.md "traceability table" — not declared in any Legion schema document; whether this file always exists is unknown (S04 audit of validate.md referenced requirement-spec format but REQUIREMENTS.md is optional per CLAUDE.md). (c) `SUMMARY.md files for each phase` assumes every phase has a SUMMARY.md — phases skipped or failed (per plans-failed path in execution-tracker) may not have one. (d) CONTEXT.md similar — written by /legion:plan but phases planned in older Legion versions may not have CONTEXT.md. Under 4.7 literalism the skill errors on first missing file; the error-handling section (L415-437) does not cover this case. Peer LEGION-47-205, 206, 207.

**Remediation sketch:** Add Section 0 "Source File Preconditions" before Section 1: "Milestone operations require: (a) ROADMAP.md with populated Progress table — verify via grep `| Phase [0-9]+ |` count > 0 before summing; if empty, emit info 'Milestone metrics skipped — ROADMAP.md has no plans'; (b) REQUIREMENTS.md traceability table is optional — if missing, Requirements satisfied metric = 'not tracked' not 0/0; (c) per-phase files optional — for each phase: if SUMMARY.md missing, phase contributes 0 to files-modified count with a note; if CONTEXT.md missing, skip agent extraction." Update Section 6 error-handling to cover each of (a)-(c) explicitly. Cross-reference ROADMAP.md schema (docs/schemas/) — if schema absent, document the Progress table format in this skill.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---
