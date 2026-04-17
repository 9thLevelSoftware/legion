# Audit Findings — skills/board-of-directors/SKILL.md

**Audited in session:** S09
**Rubric version:** 1.0
**File layer:** skill
**File length:** 778 lines
**Total findings:** 7 (7 P2)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-199 — P2, CAT-3 Underspecified Dispatch (confirmed)

**Line 24**

> How to assemble a governance board dynamically from the 53-agent pool based on the topic under deliberation.

**Issue:** "53-agent pool" is false. The actual agent count is 48, declared in CLAUDE.md L77 ("48 agent personality .md files"), `ls agents/*.md | wc -l` = 48, and consistent across AGENTS.md, README.md. The review-panel.md L23 was caught stating "52-agent pool" (LEGION-47-159); this skill states "53". Third distinct incorrect agent-count claim across the codebase. Under 4.7 literalism, a board-composition algorithm instructed to "score all agents from the 53-agent pool" may attempt to iterate 53 candidates and fabricate 5 agent IDs to fill the gap — or the claim anchors future maintainers to a non-existent target. Peer of the non-existent-agent-ID class (LEGION-47-052, 119, 149, 159, 187).

**Remediation sketch:** (a) Replace L24 "53-agent pool" with "agent pool defined in agent-registry.md (48 agents as of 2026-04-16, across 9 divisions)" — parameterize rather than hardcode the count. (b) Add pre-flight step to Section 1 Step 2: "Read agent-registry.md or scan agents/ directory to determine actual pool size at runtime; do not hardcode." (c) The CI agent-ID validator proposed in S08 must also validate agent-count references; add a second check that any "{N}-agent" phrase in skills/*.md, commands/*.md matches the actual count. (d) Cross-reference LEGION-47-159 (review-panel 52-agent claim) for systemic fix.

**Remediation cluster:** `non-existent-agent-ids`
**Effort estimate:** small

---

## LEGION-47-200 — P2, CAT-1 Open-Set Interpretation (confirmed)

**Lines 84-95**

> Options:
> - "Convene this board" (Recommended)
> - "Replace a member" — swap one agent for an alternative from the ranked list
> - "Add a member" — add one more agent (up to board.default_size if currently under-sized)
> - "Remove a member" — drop one agent (must stay at or above board.min_size)
> - "Other" — enter custom agent IDs manually
> ...
> If user selects "Other": accept custom agent IDs, validate each exists, assign default evaluation
>   lenses from their frontmatter review_strengths

**Issue:** Fifth option "Other — enter custom agent IDs manually" is a free-text capture dressed as a bounded option — peer of LEGION-47-012, 040, 051, 150, 162 (AskUserQuestion free-text contract cluster). Under 4.7 literalism the agent will either (a) render "Other" as a concrete option the user selects (then silently fall through to accept-string), or (b) escape the AskUserQuestion contract and prompt in raw text. Additionally, the four-option preceding set ("Convene", "Replace", "Add", "Remove") compounds into a five-option AskUserQuestion with no closure — 4.7 may invent "Reshuffle entire board" or "Score again with different signals".

**Remediation sketch:** (a) Reduce the first gate to three closed options: "Convene this board", "Modify composition" (branches to a separate AskUserQuestion for Replace/Add/Remove), "Restart scoring with different topic text". (b) Replace "Other — enter custom agent IDs manually" with a two-step flow: first a closed "Modify composition" option, then a follow-up AskUserQuestion enumerating agent IDs grouped by division (multi-select). (c) Free-text custom-ID entry blocked by the S03 `adapter.prompt_free_text` primitive decision; cross-reference LEGION-47-041, 045, 051. (d) Add closure to every AskUserQuestion in this file: "Choose exactly one of the options above. Do not propose alternatives."

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-201 — P2, CAT-6 Implicit Preconditions (suspected)

**Lines 161-172**

> a. Check if the board member's primary task type matches an external CLI's
>    capabilities (e.g., design-ux-architect might map to a CLI with strong
>    ui_design capabilities). If a cli-dispatch skill is available and the
>    member's task type matches an external CLI's strengths, dispatch via
>    cli-dispatch. Otherwise, spawn as an internal Claude Code agent.
>
> b. All assessments run in parallel:
>    - If adapter.parallel_execution is true: spawn all board member agents simultaneously
>    - If adapter.parallel_execution is false: execute sequentially

**Issue:** Two compounding implicit preconditions: (a) "task_type → external CLI capability" mapping is not defined anywhere — `ui_design` as a capability string does not appear in any adapters/*.md or agent frontmatter schema. cli-dispatch.md (S06) has no task_type-to-CLI-strength mapping table. The hypothetical example "design-ux-architect might map to a CLI with strong ui_design capabilities" is prose that 4.7 may try to resolve by inventing a mapping. (b) L168 `adapter.parallel_execution` is read without verifying the key exists — if missing, the conditional's else branch runs (sequential), but there's no warning that a potentially-parallel-capable adapter is being serialized. Peer of LEGION-47-101, 163 precondition-verification cluster.

**Remediation sketch:** (a) Delete the "(e.g., design-ux-architect might map to a CLI with strong ui_design capabilities)" hypothetical; replace with a concrete check: "If cli-dispatch.md Section 4 defines a task_type_to_cli mapping: consult it. Otherwise: spawn all board members as internal Claude Code agents." (b) L168 add precondition: "Read adapter.parallel_execution. If the key is missing from the active adapter: default to false AND emit INFO-level log 'Parallel execution unspecified for adapter {name}; running board assessments serially.'" (c) Cross-reference LEGION-47-101 cli-dispatch contract and LEGION-47-163 agent-registry precondition.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-202 — P2, CAT-8 Unstated Acceptance Criteria (suspected)

**Lines 386-429**

> General formula for any board size N (2 <= N <= board.default_size):
> Conditions are evaluated in order — first match wins.
>
>   1. approve_count >= ceil(2 * N / 3)          → APPROVED
>   2. approve_count > floor(N / 2)              → APPROVED WITH CONDITIONS
>   3. approve_count == N / 2 (even N only)      → ESCALATE to user
>   4. Otherwise                                 → REJECTED
> ...
>   N = 2 (under-population, requires user opt-in):
>   | Approve | Reject | Result |
>   |---------|--------|--------|
>   | 2       | 0      | APPROVED (unanimous) |
>   | 1       | 1      | ESCALATE (split) |
>   | 0       | 2      | REJECTED |

**Issue:** Resolution formula has an exit-condition state partition gap: at N=2 the table omits "APPROVED WITH CONDITIONS" entirely. Reading the formula at N=2: condition 1 (approve_count >= ceil(4/3) = 2) only fires at unanimous 2-0. Condition 2 (approve_count > floor(2/2) = 1) fires when approve_count = 2 — but condition 1 already captured that, so condition 2 is unreachable at N=2. Result: a 2-member board cannot produce APPROVED WITH CONDITIONS even if both approving members state conditions. Condition aggregation (L431-436) says "ALL conditions are mandatory" for APPROVED WITH CONDITIONS — but at N=2, conditions stated by both approvers are collapsed into plain APPROVED per L436 "If no approving member stated conditions: upgrade to APPROVED" applied in reverse. Additionally: (a) the ABSTAIN path (L366-367) reduces N; if N=3 starts with one abstention, effective N=2 and the 2-member table applies — but resolution never re-communicates the effective-N change to the user. Exit-condition state-partition class peer LEGION-47-054, 151, 161, 196.

**Remediation sketch:** (a) Fix the formula: state condition 2 as `approve_count > floor(N / 2) AND approve_count < ceil(2 * N / 3)`, making it strictly the "majority-but-not-supermajority" partition. (b) Add explicit N=2 condition row: "approve_count == 2 AND any approver stated conditions → APPROVED WITH CONDITIONS". (c) Document ABSTAIN effect explicitly: "When ABSTAIN votes reduce effective N, announce the updated effective-N to the user before applying the resolution table." (d) Add acceptance-criteria block: "Resolution is complete when: verdict ∈ {APPROVED, APPROVED WITH CONDITIONS, REJECTED, ESCALATED} AND verdict has been written to MEETING.md AND vote tally is persisted." Cross-reference LEGION-47-054 exit-condition cluster.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-203 — P2, CAT-10 Authority Ambiguity (suspected)

**Lines 467-472, 710-747**

> Save all board deliberation artifacts for auditability. Only runs when `settings.board.persist_artifacts` is true (default: true).
> ...
> Output: persisted artifacts at .planning/board/{YYYY-MM-DD}-{topic-slug}/
> ...
> Step 3: Append and verify
>   - Append the record to the OUTCOMES.md Records table

**Issue:** This skill writes to multiple project-state paths (`.planning/board/**`, `.planning/memory/OUTCOMES.md`) as part of normal operation — but those paths are not in any plan's `files_modified` list, so authority-enforcer Section 11 under `surgical` mode would flag them as scope violations and revert them (LEGION-47-146, 176). Same defect class as execution-tracker / review-loop / memory-manager: legitimate Legion-skill state writes get flagged. Additionally, `.planning/board/{YYYY-MM-DD}-{topic-slug}/MEETING.md` is a new directory structure not declared in any Authority Matrix system-paths exemption list. Peer of LEGION-47-146, 176 system-paths carve-out cluster.

**Remediation sketch:** (a) Add Section 11 "Allowed System Paths" to authority-enforcer (per LEGION-47-176 remediation) and include: `.planning/board/**`, `.planning/memory/OUTCOMES.md`. (b) In this skill, add a "System Paths" block at the top of Section 6: "Board persistence writes to .planning/board/ and .planning/memory/OUTCOMES.md. These paths are declared in authority-matrix.yaml system_paths_exempt_from_scope; they do not appear in plans' files_modified lists." (c) Cross-reference LEGION-47-146 (execution-tracker parallel) and LEGION-47-176 (authority-enforcer canonical remediation).

**Remediation cluster:** `authority-language`
**Effort estimate:** small

---

## LEGION-47-204 — P2, CAT-4 Underspecified Intent (suspected)

**Lines 203-209**

> Rationale for internal execution:
>   Phase 2 runs INTERNALLY (Claude Code agents or inline) rather than dispatching
>   to external CLIs. External dispatch would mean rounds x board_members CLI calls
>   (e.g., 2 rounds x 5 members = 10+ invocations), which is cost-prohibitive and
>   slow. External CLI assessments from Phase 1 are the authoritative domain input;
>   Phase 2 discussion refines and synthesizes based on those findings.

**Issue:** The "Rationale for internal execution" block is placed MID-Section 3 as a post-hoc explanation — a reader of Section 1 and Section 2 has already seen the phrase "Step 2: Dispatch assessments (parallel)" with cli-dispatch as an option (L161-165) and naturally expects Phase 2 to follow the same pattern. The rationale appears only on reaching Section 3 Step 0 (L203). 4.7 literally reading Section 2 and beginning Phase 2 preparation with cli-dispatch may attempt external dispatch before reaching L203. CAT-4 underspecified intent: the WHY (cost, authoritative-domain-input) is stated but deferred; the WHAT (Phase 2 is internal) should be front-loaded in Section 1's workflow overview.

**Remediation sketch:** (a) Move the rationale to Section 1 as an "Execution Model Overview" block: "Phase 1 (Assessment) and Phase 3 (Vote) support external CLI dispatch when adapter + cli-dispatch allow it. Phase 2 (Discussion) and Phase 4 (Resolution) run internally — Phase 2 because external dispatch is cost-prohibitive (rounds × board_members external calls); Phase 4 because it is pure computation." (b) Remove the duplicated explanation from Section 3 L203-209, replace with a one-line reference: "Per Section 1 Execution Model, Phase 2 runs internally." (c) Apply the same treatment to Phase 4 (computation) and Phase 5 (file writes). Cross-reference CAT-4 intent-front-loading cluster.

**Remediation cluster:** `intent-front-loading`
**Effort estimate:** small

---

## LEGION-47-205 — P2, CAT-7 Maximalist Persona Language (suspected)

**Lines 143, 257-267, 335-341**

> You MUST produce your assessment in this exact format:
> ...
> - **CHALLENGE**: You disagree with another member's assessment. State which member,
>   which point, and why you disagree. Provide evidence or reasoning.
> - **AGREE**: You endorse another member's position. ...
> ...
> Cast your final vote. You MUST choose APPROVE or REJECT — there is no CONCERNS
> option in the final vote.
> ...
> **IMPORTANT**: Your Phase 1 verdict was CONCERNS. You did not shift your position
> during discussion. You must now explicitly choose APPROVE or REJECT. There is no
> default — your decision must be deliberate.

**Issue:** Injection-into-agent-prompts density: "You MUST produce" (L143), "You MUST choose APPROVE or REJECT — there is no CONCERNS option" (L335-336), "**IMPORTANT**: ... You did not shift... You must now explicitly choose... There is no default — your decision must be deliberate" (L338-341), plus the CHALLENGE/AGREE/QUESTION/CLARIFY/SHIFT imperative list (L257-267 eight imperatives in 11 lines). A board member is spawned three times (Phase 1, Phase 2 rounds, Phase 3) with progressively more maximalist injection each time. 4.7 may adopt over-defensive voting patterns: a CONCERNS-initial member faced with "no default — your decision must be deliberate" under-confidence-bets toward REJECT to avoid the risk of a non-deliberate APPROVE. Persona-calibration cluster peer LEGION-47-152, 157, 158, 172, 177.

**Remediation sketch:** (a) L143 replace "You MUST produce your assessment in this exact format" with "Produce your assessment in the following format. If a section doesn't apply, write 'None' rather than omitting it." (b) L335-336 replace "You MUST choose APPROVE or REJECT — there is no CONCERNS option" with "This vote is binary: APPROVE or REJECT. Your Phase 1 CONCERNS verdict must now resolve to one of the two." (c) L338-341 remove "IMPORTANT / must now explicitly / There is no default / must be deliberate" cascade; replace with: "If your Phase 1 verdict was CONCERNS and you did not SHIFT in Phase 2, your final vote should reflect whether the discussion resolved your concerns (→ APPROVE with conditions) or left them unresolved (→ REJECT)." (d) L257-267 keep the five message-type definitions but remove the imperative "State ..." framing; state the definitions as conditions: "CHALLENGE: a message expressing disagreement with a specific member on a specific point, backed by evidence."

**Remediation cluster:** `persona-calibration`
**Effort estimate:** small

---
