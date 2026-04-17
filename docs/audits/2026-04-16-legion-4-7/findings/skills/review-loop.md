# Audit Findings — skills/review-loop/SKILL.md

**Audited in session:** S08
**Rubric version:** 1.0
**File layer:** skill
**File length:** 1168 lines
**Total findings:** 10 (0 P0, 1 P1, 9 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-149 — P1, Underspecified Dispatch (confirmed)

**Lines 76-81, 94-98, 362, 1153-1162**

> | code           | testing-qa-verification-specialist       | testing-evidence-collector            |
> ...
> {AGENTS_DIR}/testing-evidence-collector.md
> ...
> | 2  | WARNING     | HIGH (85%) | path/to/other.md        | Inconsistent naming        | testing-evidence-collector |
> ...
> {AGENTS_DIR}/testing-evidence-collector.md

**Issue:** `testing-evidence-collector` is referenced 4+ times (L76, 95, 362, 1154) as the canonical "code" phase secondary reviewer, on the file-path list, and in example tables — but the agent does not exist in `agents/`. Actual testing agents: api-tester, performance-benchmarker, qa-verification-specialist, test-results-analyzer, tool-evaluator, workflow-optimizer (6 total, per CLAUDE.md). A 4.7 reader dispatching for a `code` phase will attempt to Read `{AGENTS_DIR}/testing-evidence-collector.md`, the file will not exist, and the skill's own Step 2 fallback at L102-108 says to fall back to qa-verification-specialist — so every `code` phase quietly loses its secondary reviewer. Additionally, L397 references `marketing-content-creator` (actual: `marketing-content-social-strategist`) and L399 references `engineering-devops-automator` (actual: `engineering-infrastructure-devops`). Three non-existent agent IDs in the canonical review-routing table. Same bug class as LEGION-47-052 (spec-pipeline) and LEGION-47-119 (authority-matrix). P1 elevation because review-loop is the core engine for `/legion:review` — wrong IDs cause silent degradation on every invocation.

**Remediation sketch:** (a) Replace `testing-evidence-collector` everywhere with an actual agent — likely `testing-test-results-analyzer` or `testing-qa-verification-specialist` depending on intent. Update L76, L95, L198-204 rubric (review-panel canonical), L362 example, L1154 quick-reference list. (b) Replace `marketing-content-creator` (L397) with `marketing-content-social-strategist`. (c) Replace `engineering-devops-automator` (L399) with `engineering-infrastructure-devops`. (d) Add a CI cross-reference check: every agent-ID string in skills/*.md must match an existing `agents/<id>.md` file. (e) Cross-link to LEGION-47-052, LEGION-47-119 remediation.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** small

---

## LEGION-47-150 — P2, Open-Set Interpretation (confirmed)

**Lines 111-128**

> ### Reviewer Confirmation Display
> Before spawning review agents, show this to the user and wait for confirmation:
> ...
> Proceed with this reviewer team? (or name a replacement)

**Issue:** Free-text confirmation "(or name a replacement)" — no AskUserQuestion structure, no closed option set. Same class as LEGION-47-040 (commands/review.md reviewer-selection gate) and inherited S03/S04 free-text AskUserQuestion defects. 4.7 literal reader either (a) emits raw-text prompt violating CLAUDE.md mandate, (b) invokes AskUserQuestion with empty options (contract violation — LEGION-47-016 class), or (c) skips confirmation silently. The parenthetical "or name a replacement" opens an infinite response space with no disambiguation. Peer to the S03 AskUserQuestion free-text contract defect cluster; blocked by outstanding `adapter.prompt_free_text` primitive decision (6+ sessions).

**Remediation sketch:** Replace with AskUserQuestion closed options: "Use this panel" / "Replace reviewer 1 with alternative" / "Replace reviewer 2 with alternative" / "Add Testing-division reviewer" / "Other" → if Other, dispatch to adapter.prompt_free_text for custom agent ID with validation against agents/ directory. Resolve via the same `adapter.prompt_free_text` primitive blocking LEGION-47-016, 040, 093, 117, 120, 122, 127, 132, 133, 138.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-151 — P2, Unstated Acceptance Criteria (confirmed)

**Lines 349-352, 639, 789**

> - If the must-fix list is EMPTY and ALL reviewers gave PASS verdict:
>     → Review passes. Proceed to Section 7 (Review Passed).
>   - If the must-fix list has ANY items:
>     → Proceed to Section 5 (Fix Cycle).
> ...
> When review passes (must-fix list is empty and all reviewers give PASS verdict):
> ...
> When cycle_count exceeds {max_cycles} AND (BLOCKERs OR unresolved WARNINGs) remain:

**Issue:** Same state-partition gap as LEGION-47-054 (commands/review.md) at the canonical owner. Edge case: must-fix list is empty (no BLOCKERs, no WARNINGs) but at least one reviewer returned NEEDS WORK or FAIL verdict (e.g., for SUGGESTION-only findings they graded NEEDS WORK). Section 4 triage at L349 requires BOTH empty must-fix AND all-reviewer PASS — fails. No other exit condition matches: Section 5 Fix Cycle only runs when must-fix has items. Section 6 re-review assumes Section 5 ran. Section 8 escalation (L789) requires BLOCKERs or WARNINGs remaining — fails because must-fix is empty. Loop stuck with no exit path. Confirmed same-class as LEGION-47-054; canonical owner of the exit-condition defect. Inheriting `confirmed: true`.

**Remediation sketch:** Rewrite Section 4 Step 3 exit conditions to partition state. "After triage: if cycle_count >= max_cycles → Section 8 (escalation with whatever must-fix remains, including empty); elif must-fix is empty → Section 7 (PASS) regardless of individual reviewer strings; else → Section 5 (Fix Cycle)." Decouple pass from reviewer verdict text; the must-fix list is the authoritative gate — if a reviewer graded NEEDS WORK for SUGGESTION-only findings, surface that in the REVIEW.md notes but do not block PASS. Align Section 7 and Section 8 preconditions.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-152 — P2, Maximalist Persona Language (suspected)

**Lines 39, 271**

> 7. **Skeptical by default** — "no issues found" on a first review is a yellow flag. Review agents should expect to find at least something on an initial pass. If a reviewer returns PASS on cycle 1, their reasoning must explain what was checked and why confidence is warranted.
> ...
> - Default to NEEDS WORK — first reviews almost always surface issues

**Issue:** "Skeptical by default", "expect to find at least something", "Default to NEEDS WORK — first reviews almost always surface issues" biases the reviewer against PASS. 4.7 literal reader will (a) fabricate findings to meet the implicit "at least one" quota, (b) grade NEEDS WORK to satisfy the default, (c) escalate confidence on weak evidence to avoid the "no issues found" flag. This contradicts Section 1, Rule 3 ("no performative agreement — state factually") and Rule 8 ("Confidence-gated — LOW findings are discarded"). Same defect shape as CAT-7 maximalist language found in commands/review.md and several S06/S07 skills. Also concerning: the phrase "almost always surface issues" is an empirical claim unsupported by evidence; forcing agents to conform to it warps review quality.

**Remediation sketch:** Replace with evidence-based guidance: "If a reviewer returns PASS on cycle 1, their reasoning MUST cite (a) each success-criterion and how it was verified, (b) each files_modified file with a 1-line assessment, (c) specific edge cases checked and not found. Short-form PASS (e.g., 'looks good') is rejected — PASS requires equal rigor to NEEDS WORK. Do NOT fabricate findings to meet an implicit quota." Remove "default to NEEDS WORK" and "almost always surface issues" — these are biasing priors, not acceptance criteria.

**Remediation cluster:** `persona-calibration`
**Effort estimate:** small

---

## LEGION-47-153 — P2, Implicit Preconditions (suspected)

**Lines 23-31, 288-292, 475-486**

> > **If adapter.parallel_execution is true AND adapter.structured_messaging is true** (e.g., Claude Code):
> > Use the adapter's full coordination lifecycle for the review Team.
> > On Claude Code specifically: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` must be enabled.
> ...
> Step 4: Spawn the review agent per adapter protocol
>   Use adapter.spawn_agent_personality with:
> ...
> Step 4: Spawn fix agents (adapter-conditional)
>   **If adapter.parallel_execution is true:**

**Issue:** `adapter.parallel_execution`, `adapter.structured_messaging`, `adapter.spawn_agent_personality`, `adapter.collect_results`, `adapter.coordinate_parallel`, `adapter.model_execution`, `adapter.commit_signature`, `adapter.shutdown_agents`, `adapter.cleanup_coordination` are referenced extensively — but the skill does not state (a) how to load the adapter, (b) what happens if a flag is missing from the adapter frontmatter, (c) what the default is. 4.7 reader loading a minimal adapter file that omits `parallel_execution` will either crash the flag check or treat undefined as falsy by accident. Same-class as CAT-6 adapter-precondition cluster (LEGION-47-117, 125 from earlier sessions). The "mandatory: follow the active CLI adapter's Execution Protocol" at L19 does not specify the load-and-default procedure.

**Remediation sketch:** (a) Add Section 1.1 "Adapter Resolution Protocol" at the top: "Before Section 2, run workflow-common CLI Detection Protocol to resolve active adapter. Load adapter file completely. If any required key is missing, fail with error 'Adapter {name} missing required key {key}' — do NOT silently default. Required keys: parallel_execution, structured_messaging, spawn_agent_personality, collect_results, model_execution, commit_signature." (b) Cross-reference adapter conformance metadata (lint_commands per CLAUDE.md) so a linter can catch missing keys pre-runtime. (c) Document default behavior for optional keys (shutdown_agents, cleanup_coordination) — no-op when absent.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-154 — P2, Unstated Acceptance Criteria (suspected)

**Lines 784, 1045**

> ## Section 8: Escalation
> ...
> ## Section 8: Authority Conflict Resolution

**Issue:** Two sections both numbered "Section 8" (L784 "Escalation", L1045 "Authority Conflict Resolution"). Cross-references from other files ("review-loop Section 8") are now ambiguous. 4.7 literal reader doing "go to Section 8" (as Section 6 Step 1 L532 instructs: "If cycle_count > {max_cycles}: go to Section 8 (Escalation)") may resolve to the wrong section and take the wrong action. Broken structural navigation. Distinct from the CAT-8 acceptance-criteria class but same underlying integrity defect as review-evaluators' broken 6.1-6.5 / 8.1-8.5 numbering (LEGION-47-161 elsewhere in this session). Also Section 8.5 (L912) comes between the two Section 8s — resolvable only by line proximity, not by the numbering.

**Remediation sketch:** Renumber the second "Section 8: Authority Conflict Resolution" (L1045) to "Section 9: Authority Conflict Resolution". Renumber "Section 9: Error Handling" (L1079) to "Section 10: Error Handling". Update every cross-reference: "go to Section 8 (Escalation)" at L532, 622; "Section 7, Step 4" at L1003; "See Section 7, Step 4" — all fine as-is. Add a Section-ID table at the top of the file listing canonical section numbers and titles so future drift is visible.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-155 — P2, Underspecified Dispatch (suspected)

**Lines 475-486, 591-592**

> Step 4: Spawn fix agents (adapter-conditional)
>   **If adapter.parallel_execution is true:**
>   - Issue ALL fix agent spawn calls simultaneously (same pattern as wave-executor Section 4, Step 4)
>   - All fix agents run concurrently — they work on non-overlapping files
> ...
> Step 3: Spawn review agents for re-review
>   - Use the SAME review agent personalities from the initial review (consistency)

**Issue:** "All fix agents run concurrently — they work on non-overlapping files" is an assertion, not a verification step. Nothing in Section 5 enforces non-overlap. If two BLOCKERs in the same file are routed to different fix agents (e.g., one for .ts file assigned to engineering-frontend-developer, one for engineering-backend-architect per L391-394), they will write concurrently to the same file. 4.7 literal reader fires both spawns. No pre-dispatch overlap detection, no serialization fallback, no post-dispatch conflict merge. Peer to LEGION-47-101/102/112/125/128/141 dispatch-specification cluster. Also: "Use the SAME review agent personalities" (L592) assumes the original review completed with all intended reviewers — but L1088-1091 fallback to testing-qa-verification-specialist may have already substituted; re-review would replay the substitution without awareness.

**Remediation sketch:** (a) Before Step 4 spawn-all, run overlap check: group findings by file, compute `group_files = {file: [finding_ids]}`. For any file with findings assigned to different agents, serialize those assignments or consolidate to a single agent. (b) Explicitly state: "Parallel dispatch is safe only when each agent's file set is disjoint. If overlap detected, fall back to sequential dispatch for overlapping files." (c) For re-review (L592), record the actual agent set used in initial review (post-fallback) and replay that set, not the originally selected set.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** medium

---

## LEGION-47-156 — P2, Closed-Set Drift (suspected)

**Lines 385-402**

> | File Type                        | Fix Agent                          | Mode        |
> |----------------------------------|------------------------------------|-------------|
> | .md skill files (skills/)       | Autonomous (no personality needed) | autonomous  |
> | .md command files (commands/)    | Autonomous                        | autonomous  |
> | .md agent personality files      | Autonomous                         | autonomous  |
> | .md planning/docs files          | Autonomous                         | autonomous  |
> | .ts, .js, .jsx, .tsx             | engineering-frontend-developer or  | personality |
> |                                  | engineering-backend-architect      | injected    |
> | .py, .rb, .go, .rs               | engineering-backend-architect      | personality |
> ...
> | No clear match                   | Autonomous (direct fix)            | autonomous  |

**Issue:** File-type → fix-agent mapping is a hardcoded closed set that (a) does not cover .vue, .svelte, .astro, .swift, .kt, .cs, .java, .cpp, .sql, .yaml, .json, .toml, (b) routes .py, .rb, .go, .rs all to the same agent with no language specialization, (c) mixes spoken-language personality selection (engineering-frontend-developer OR engineering-backend-architect at L391-392) with an undefined disambiguation rule — 4.7 picks the first. Line 403 says "Apply agent-registry.md Section 3 (Recommendation Algorithm) for ambiguous file types" but the ambiguity at L391 (OR between two agents on the SAME row) is not "ambiguous file type" — it's an unresolved assignment. Peer to CAT-2 stale triggers (intent-teams.yaml, phase-decomposer keyword registries). Note: also contains non-existent `marketing-content-creator` (L397) and `engineering-devops-automator` (L399) — covered by LEGION-47-149.

**Remediation sketch:** (a) Move the fix-agent mapping out of this table and delegate wholly to agent-registry recommendation (let agent-registry own the closed set). Replace the table with a single rule: "Apply agent-registry.md Section 3 for every finding; if recommendation confidence < N, fall back to autonomous." (b) If the table must stay, specify disambiguation for .ts/.jsx/.tsx: "frontend if file path contains /components/|/pages/|/ui/|/hooks/; backend if /api/|/services/|/controllers/|/db/". (c) Cover .vue, .svelte, .astro, .swift, .kt, .cs, .java explicitly or delegate. (d) Fix agent-ID typos per LEGION-47-149.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** medium

---

## LEGION-47-157 — P2, Prohibitive Over-Reliance (suspected)

**Lines 41, 269-280, 907, 1040**

> 9. **Do not auto-proceed after escalation** — if the configured cycle budget is exhausted, stop and wait for user decision. Do NOT mark the phase complete or advance to the next phase without explicit user confirmation.
> ...
> IMPORTANT:
>   - Do NOT give letter grades, numeric scores, or vague assessments like "looks good"
>   - Default to NEEDS WORK — first reviews almost always surface issues
>   - Every finding MUST reference a specific file and line/section
>   - "No issues found" requires a brief paragraph explaining what you checked and why you're
>     confident — this is not permitted as a bare statement
>   - PASS on the first review cycle requires a clear explanation of what evidence you reviewed
>   - Every finding MUST include a Confidence rating with a percentage
>   - Only HIGH-confidence findings (80%+) are actioned by default
>   - If you are unsure, rate MEDIUM and explain your uncertainty in Details
>   - Never pad reports with LOW-confidence findings to appear thorough
> ...
>   **Do not auto-proceed.** Wait for explicit user decision before taking any action.

**Issue:** Review loop leans heavily on Do-NOT prohibitions (do NOT auto-proceed, do NOT give letter grades, do NOT pad reports, do NOT modify files beyond scope at L443). Per CAT-5, prohibitions defending correctness boundaries are acceptable, but here several are behavior-biasing rather than contract-defining ("default to NEEDS WORK", "never pad reports" — duplicating the confidence gate which already handles this). 4.7 literal reader operating under the Do-NOT scaffolding may over-correct toward reviewer paralysis. Where a prohibition maps to a positive rule (e.g., "Every finding MUST reference a specific file and line/section" is positive and clean), retain. Where it doesn't, convert.

**Remediation sketch:** (a) Replace "Default to NEEDS WORK — first reviews almost always surface issues" with "Calibrate verdict strictly to must-fix list: empty → PASS; non-empty → NEEDS WORK or FAIL." (b) Remove "Never pad reports with LOW-confidence findings" — redundant with Section 1 Rule 8 confidence gate. (c) Replace "Do NOT give letter grades" with "Produce Finding blocks in the exact schema defined in Section 3; the verdict is PASS / NEEDS WORK / FAIL — no other labels." (d) Keep "Do NOT modify files beyond what is needed" (L443) — it defends a correctness boundary. Cross-reference LEGION-47-152 on maximalist language — this is the same defect viewed through CAT-5 lens.

**Remediation cluster:** `prohibitive-to-positive`
**Effort estimate:** small

---

## LEGION-47-158 — P2, Maximalist Persona Language (suspected)

**Lines 1113-1123**

> 4. PERSONALITY FILE MISSING FOR REVIEWER
>    Symptom: Expected reviewer .md file not found at {AGENTS_DIR}/{agent-id}.md
>    IMPORTANT: This is almost always a model error. You MUST have actually attempted
>    to Read the file before claiming it is missing. The 48 agent files ship with Legion.
>    Action:
>    - FIRST: Confirm you actually tried to Read the file. If not, do it now.
>    - If Read genuinely returns file-not-found: fall back to testing-qa-verification-specialist
>    - Log: "Warning: personality file not found for {agent-id} after Read attempt.
>      Using testing-qa-verification-specialist."
>    - If the fallback file is also genuinely missing: STOP and error.
>      Do NOT run personality-less reviews.

**Issue:** "This is almost always a model error" is an accusation encoded in the skill, not a contract. Multiple emphatic qualifiers ("MUST have actually attempted", "Do NOT run", "genuinely missing", "the 48 agent files ship with Legion") read as a defensive lecture rather than a procedure. 4.7 literal reader hitting a genuine file-not-found (e.g., because of LEGION-47-149 — testing-evidence-collector, marketing-content-creator, engineering-devops-automator are referenced but do not exist) will loop on "did I really try? let me try again" rather than falling back cleanly. The lecture is necessitated by the underlying bug (LEGION-47-149); fixing that bug removes the need for this defensive scaffolding. Also: if L102-108 instructs the same thing at Step 2 Validate Reviewer Availability, this is redundant.

**Remediation sketch:** Collapse to procedural minimum: "1. Attempt Read {AGENTS_DIR}/{agent-id}.md. 2. If ENOENT: log warning, fall back to testing-qa-verification-specialist. 3. If testing-qa-verification-specialist.md also missing: emit structured <escalation severity=blocker type=infrastructure> with decision 'Cannot run review — agent files missing' and stop." Remove "almost always a model error" — once LEGION-47-149 is fixed, genuine ENOENT will be rare but the handler does not need to accuse the model. Deduplicate with Section 2 Step 3 at L92-108.

**Remediation cluster:** `persona-calibration`
**Effort estimate:** small

---
