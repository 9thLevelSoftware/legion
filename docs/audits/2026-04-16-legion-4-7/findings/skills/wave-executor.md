# Audit Findings — skills/wave-executor/SKILL.md

**Audited in session:** S06
**Rubric version:** 1.0
**File layer:** skill
**File length:** 1893 lines
**Total findings:** 9 (1 P1, 7 P2, 1 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-101 — P1, CAT-3 Underspecified Dispatch (confirmed)

**Lines 692-707**

> Step 4: Execute plans for this wave (adapter-conditional)
>
>   **If adapter.parallel_execution is true** (e.g., Claude Code, Cursor):
>   - For a SINGLE plan in the wave:
>     - Spawn one agent per adapter.spawn_agent_personality
>   - For MULTIPLE plans in the wave:
>     - Issue ALL agent spawn calls simultaneously per adapter.coordinate_parallel
>     - This maximizes parallelism — agents run concurrently
>     - Do NOT spawn agents one at a time for multi-plan waves
>     - Each agent gets its own fully-constructed prompt (personality + plan)
>     - Agents in the same wave are fully independent — they share no state

**Issue:** Core dispatch authority in a skill rated P0-eligible per rubric. "Issue ALL agent spawn calls simultaneously" does not specify the mechanism: must they be (a) multiple tool calls in one LLM response block, or (b) sequential tool calls that internally start parallel tasks, or (c) a single tool call that accepts an array of tasks? Claude Code's Agent tool accepts one task per call; parallel execution is achieved only by issuing multiple tool calls in the SAME response. 4.7's documented regression is defaulting to fewer subagents and serializing spawns across turns. Without the explicit "issue all N Agent tool calls in a single response block (not across turns)" instruction, 4.7 will read "Issue ALL ... simultaneously" as meaning "as fast as possible, one at a time" — which is the exact observed failure mode. Confirmed as core cause of parallel-dispatch collapse. Parent finding cited by LEGION-47-023 (commands/build.md) which delegates to this section.

**Remediation sketch:** Rewrite Step 4 parallel branch: "For multi-plan waves, issue N Agent tool calls within a SINGLE LLM response block — do not split across turns. The Claude Code runtime executes same-response tool calls in parallel. Example: if the wave has 4 plans, your response contains exactly 4 Agent tool invocations in one `<tool_use>` array. If you find yourself issuing agent call 1, waiting for the result, then issuing agent call 2, STOP — you have serialized the wave and violated the parallelism contract. Re-issue all remaining spawns in the next response." Add a counter-example block showing the wrong pattern. Add verification: after dispatch, confirm the LLM response contained N tool calls, not 1.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** medium

---

## LEGION-47-102 — P2, CAT-3 Underspecified Dispatch (confirmed)

**Lines 126-142**

> - Two-Wave Plan Structure
> Plans in two-wave mode have extended frontmatter:
>
> ```yaml
> ---
> phase: XX-name
> plan: NN
> type: execute
> wave: A | B                    # Wave A or Wave B
> depends_on: []                 # Can depend on other wave plans
> wave_a_outputs: []             # For Wave B plans: which Wave A plans produced inputs
> wave_role: build | analysis | execution | remediation
> authority_scope: []            # Domains this plan touches
> ---
> ```

(Referenced section: line 1519, "Two-Wave Plan Structure" within Section 7.)

**Issue:** Section 7 introduces a Two-Wave Pattern where `wave: A | B` is a STRING ("A"/"B") but Section 2 Step 3 (line 174) declares `wave: integer`. This is a schema contradiction for the same frontmatter field. The Two-Wave Activation rule (lines 1584-1594) says this mode activates when "Phase plan count >= 4" AND "plans span multiple service/page groups OR include explicit analysis tasks" — both triggers are underspecified (no enumeration of what "service/page groups" are, no rule for detecting "explicit analysis tasks"). A 4.7 reader cannot determine when to switch from integer to string wave semantics, so it will either (a) always use integer (Section 2 wins) and reject two-wave plans, or (b) always use string and break Section 2's wave ordering. Parallel dispatch silently breaks in either case.

**Remediation sketch:** Pick one schema. Either (a) unify on integer waves (Wave A = 1, Wave B = 2, drop string form), or (b) explicitly define string-wave-only mode with a top-level `two_wave: true` frontmatter flag that switches interpretation. Document the detection rule for automatic activation, or delete automatic activation and require explicit opt-in. Cross-reference `docs/schemas/plan-frontmatter.schema.json`.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** medium

---

## LEGION-47-103 — P2, CAT-2 Ambiguous Triggers (confirmed)

**Lines 1584-1594**

> ### Two-Wave Activation
>
> Two-wave pattern activates when:
> - Phase plan count >= 4 (needs enough work to parallelize)
> - Plans span multiple service/page groups OR include explicit analysis tasks
> - `two_wave: true` in phase CONTEXT.md (optional override)
>
> Standard single-wave execution when:
> - Phase has < 4 plans
> - All plans touch same files (no parallelization benefit)
> - `two_wave: false` in phase CONTEXT.md

**Issue:** "Plans span multiple service/page groups" — no definition of "service/page group". "include explicit analysis tasks" — no rule for detecting "analysis" from plan content. "All plans touch same files" — ambiguous: any overlap? Full overlap? >50% overlap? These are three unenumerated triggers gating a major execution-mode switch. If `two_wave: true` is set but the detection rules say "standard single-wave", who wins? The override is marked "optional" but has no priority rule. Pre-existing bug class matching S05 keyword-substring findings (LEGION-47-028, 044, 048, etc.).

**Remediation sketch:** Replace heuristic triggers with explicit rules: "Two-wave activates ONLY when `two_wave: true` is set in phase CONTEXT.md frontmatter. Auto-detection is disabled." OR specify: "Auto-activate two-wave when (1) plan count >= 4 AND (2) any plan has `wave_role:` set in its frontmatter. The `two_wave: true/false` override ALWAYS wins over auto-detection." Drop "service/page groups" and "explicit analysis tasks" prose entirely.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---

## LEGION-47-104 — P2, CAT-8 Unstated Acceptance Criteria (confirmed)

**Lines 1311-1369**

> ## Section 5.7: SUMMARY.md Export Validation
>
> After each plan completes and its SUMMARY.md is written, validate that the file conforms to the export standard defined in `.planning/config/agent-communication.yaml`.
>
> ### Validation Protocol
>
> ```
> After a plan's SUMMARY.md is written (Section 5, after result collection):
> ...
> 3. For each missing required section:
>    - Log advisory warning ...
>    - This is advisory, NOT blocking — the plan is not failed for missing sections
>    - Missing sections degrade handoff quality but do not halt execution
> ...
> Rationale: This maintains Legion's "degrade gracefully" principle.
> ```

**Issue:** The validator has no done state. After logging advisory warnings, what is the acceptance criterion? Is this section complete when: (a) all SUMMARY.md files have been read exactly once, (b) all warnings have been emitted, (c) the validation output appears in wave completion, or some combination? Section 5.7 Step 5 says "Report validation results in wave completion output" — but the wave completion report in Section 4 Step 6 doesn't list validation as a required section. So the validation output may or may not appear. Additionally, "graceful degradation" philosophy collides with Section 1 Principle 12 "Verification-gated completion" — which wins for SUMMARY.md structural validation vs. task verification?

**Remediation sketch:** Specify done state: "Section 5.7 is complete when: (1) every plan's SUMMARY.md has been read and checked for required sections; (2) a line `SUMMARY.md validation: {plan_id} — {pass_count}/{total} required sections present` has been printed to the wave completion report for each plan; (3) warnings are captured in the wave completion report's `## Advisories` sub-section. This section does not block the wave — degradation is by design for structural defects; task verification failures from Principle 12 are separate and DO block."

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-105 — P2, CAT-6 Implicit Preconditions (suspected)

**Lines 273-299**

> Step 1.5: Validate the agent-id against actual files (MANDATORY — DO NOT SKIP)
>   - Use the Read tool to open {AGENTS_DIR}/{agent-id}.md
>   ...
>   - If Read returns a file-not-found error: the plan may have a hallucinated or abbreviated agent-id.
>     Run a fuzzy match:
>     a) Extract the suffix after the last hyphen-delimited division prefix
>        (e.g., "dev-senior-developer" → "senior-developer",
>               "backend-architect" → "backend-architect")
>     b) Run: Glob {AGENTS_DIR}/*-{suffix}.md
>     ...
>     d) If MULTIPLE matches: pick the first and log a warning:
>        "Multiple agent matches for {original-id}: {matches}. Using {selected}."
>     e) If ZERO matches: try a broader search:
>        Run: Glob {AGENTS_DIR}/*{last-word-of-id}*.md
>     ...
>     If ZERO matches: fall back to autonomous mode and log:
>     "No agent file found for {original-id}. Executing plan autonomously."

**Issue:** The fuzzy-match cascade creates silent-correctness problems. (1) "Extract the suffix after the last hyphen-delimited division prefix" — there is no enumeration of division prefixes, so "backend-architect" yields suffix "backend-architect" (unchanged — ambiguous: is "backend" the prefix?). This inconsistency is baked into the example: "dev-senior-developer" → "senior-developer" vs "backend-architect" → "backend-architect". A 4.7 reader will interpret this inconsistently. (2) "MULTIPLE matches: pick the first" — first in glob order is filesystem-dependent and non-deterministic across OSes. (3) The fallback to autonomous mode at the end contradicts Section 2 Step 5(f) which says "STOP and error — do not fall back to autonomous mode" and Section 6 Error #5 which reiterates "STOP execution for this plan. Do NOT fall back to autonomous mode." Three sections give three different instructions for the same error condition. Pre-existing defect class matching LEGION-47-052 (non-existent agent ID bug).

**Remediation sketch:** (a) Unify the fallback policy across Sections 2, 3, and 6 — pick ONE: fuzzy-match-then-autonomous-fallback OR fuzzy-match-then-STOP. The current text has both. Per Section 6's explicit rationale ("Autonomous fallback silently degrades execution quality"), pick STOP. (b) Enumerate the division prefixes list in Step 1.5 or reference the agent-registry CATALOG.md. (c) Replace "pick the first" with "STOP with error: ambiguous agent-id {original-id} matched {N} candidates: {list}. Plan must specify exact agent-id." Remove fuzzy matching altogether as a pre-existing misfeature. Fuzzy matching is the defect, not the fix.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** medium

---

## LEGION-47-106 — P2, CAT-10 Authority Ambiguity (suspected)

**Lines 93-96**

> ### Integration with Existing Principles
>
> When worktree mode is active:
> - **Principle 8 (Files isolation per wave)** is relaxed — worktrees provide filesystem-level isolation instead of plan-level file list disjointness
> - **Principle 9 (Sequential file ordering)** is NOT relaxed — sequential_files still serialize dispatch even in worktree mode, because merge order matters for files that require single-writer semantics
> - **Principle 12 (Verification-gated completion)** runs inside the worktree — verification commands execute against the worktree's file state, not the main tree

**Issue:** Worktree mode silently relaxes Principle 8 (files isolation per wave) — a safety invariant. The relaxation is authorized by a single boolean (`execution.use_worktrees: true` in settings.json), with no human-approval gate per the CLAUDE.md authority matrix. "Architecture changes (new patterns, new abstractions)" are listed as requiring human approval; enabling worktree mode IS an architecture change (changes how files are isolated), but no mechanism prevents a programmatic flip of the flag. A 4.7 reader sees "when worktree mode is active" as an unconditional state check — it does not verify whether the user consented to this mode or whether the project has the prerequisites. Authority boundary is ambiguous.

**Remediation sketch:** Add authority gate: "Worktree mode activation requires one of: (a) `execution.use_worktrees: true` written to settings.json AND a recorded user confirmation in STATE.md (look for `worktree_mode_consent: true` under `## Consent`), OR (b) explicit `--worktrees` flag on the current /legion:build invocation. If neither is present, treat `execution.use_worktrees` as `false` regardless of settings value." Add an initial-activation prompt via adapter.ask_user before first use per phase.

**Remediation cluster:** `authority-language`
**Effort estimate:** medium

---

## LEGION-47-107 — P2, CAT-8 Unstated Acceptance Criteria (suspected)

**Lines 1629-1721**

> ## Section 6: INTENT-BASED PLAN FILTERING
>
> When build command detects filter_plans mode intents (--just-document, --skip-frontend, etc.), apply filtering before wave execution.
> ...
> ## Step 3.5: APPLY INTENT FILTERS (conditional)
> ...
> ## Section 10: File Placement Utilities (ENV-04)

**Issue:** Structural defect — this file has TWO `## Section 6` headings: Section 6: Error Scenarios at line 1370, and Section 6: INTENT-BASED PLAN FILTERING at line 1629. It also jumps from Section 7 (line 1486) to Section 10 (line 1722), with no Sections 8 or 9. "Step 3.5: APPLY INTENT FILTERS" (line 1679) appears to belong to Section 4 (Wave Execution) but is located far below it. This is a done-state and structural-integrity defect: a 4.7 reader scanning for "Section 6" gets two contradictory results. When `commands/build.md` references "Section 6" without qualification, which Section 6 is meant? The references table at line 1596-1625 lists Section 6 as the Error Handling Pattern, contradicting the Section 6: INTENT-BASED PLAN FILTERING header below it. 4.7 will either silently follow the first Section 6 it encounters (Error Scenarios) or (less likely) the last. Pre-existing structural defect.

**Remediation sketch:** Renumber: "Section 6: INTENT-BASED PLAN FILTERING" → "Section 8" and "Section 10: File Placement Utilities" → "Section 9" to restore monotonic ordering. Or better: move intent-filtering into Section 2 (Plan Discovery) since it runs before wave execution, and move file-placement utilities into a clearly-named appendix "Appendix A: File Placement Utilities". Move "Step 3.5: APPLY INTENT FILTERS" into Section 4 near Step 3/4 where it actually runs. Audit all cross-file references to "wave-executor Section 6/8/9/10" and update.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** medium

---

## LEGION-47-108 — P2, CAT-4 Underspecified Intent (suspected)

**Lines 1486-1550**

> ## Section 7: Two-Wave Pattern
>
> Enhanced execution model with distinct Build/Analysis and Execution waves for maximum parallelism.
>
> ### Wave Pattern Overview
>
> ```
> Wave A: Build + Analysis (Parallel)
> ├── Plan A1: Build service/page group 1 (e.g., frontend components)
> ...
> ```
>
> ### Wave A Execution
>
> **Step 1: Dynamic agent spawning per service group**
> - Parse plans for service/page group identifiers
> - Group plans by service: all plans touching "auth-service" spawn together

**Issue:** Goal is stated ("maximum parallelism") but operational intent is not front-loaded. The mechanic (Wave A has builds+analysis, Wave B has execution+remediation) is described before the reader knows WHY this particular partition is correct. Why is security audit in Wave A and not Wave B? Why is chaos testing in Wave B and not A? The categories "build/analysis/execution/remediation" are presented without a decision procedure for classifying new plans into them. `wave_role` is a frontmatter field but has no defined rule for who sets it or how. A 4.7 reader attempting to use Section 7 without the context here will guess, producing non-deterministic phase layouts. Compounds with LEGION-47-102 (string vs integer wave schema) — this whole section is not integrated with Section 2 or Section 4.

**Remediation sketch:** Front-load intent: "GOAL: Section 7 exists to execute phases that need explicit architecture review between build and validation. To decide whether your phase needs this: (1) ask whether any two plans must produce artifacts that other plans review before execution — if yes, use Section 7; if no, use Section 4. (2) Assign `wave_role: build` to plans that produce code, `wave_role: analysis` to plans that read-only-review, `wave_role: execution` to plans that run tests, `wave_role: remediation` to plans that fix issues found by execution plans." Integrate Section 7 with Section 2's wave map (string→integer mapping).

**Remediation cluster:** `intent-front-loading`
**Effort estimate:** medium

---

## LEGION-47-109 — P3, CAT-9 Response Calibration Gaps (suspected)

**Lines 1434-1447**

> 9. AGENT COMPLETES BUT DOESN'T REPORT
>    Symptom: An agent goes idle without reporting results per adapter.collect_results.
>             The agent may have completed its work but forgot the Reporting Results step.
>    Detection: Agent appears idle but no completion report was received per adapter protocol.
>    Action:
>    - Follow up per adapter protocol: send a message asking for the structured summary
>      with Status, Files, Verification, Decisions, Issues, and Errors fields.
>    - Wait for the agent's response
>    - If the agent still doesn't respond: infer the result from the filesystem
>      - Check if the plan's files_modified list has been created/updated
>      - Run the plan's <verification> commands manually
>      - Write the SUMMARY.md based on filesystem evidence
>      - Mark Status as "Complete with Warnings" and note: "Agent did not send
>        completion message — result inferred from filesystem."

**Issue:** "Agent appears idle" is a response-calibration trigger with no quantified threshold. How long is "idle"? 10 seconds? 5 minutes? "Wait for the agent's response" — how long? The inference fallback silently upgrades a no-response state to "Complete with Warnings" which appears in the wave result and may fool downstream consumers into treating the plan as successful when the agent may have crashed mid-task. The filesystem evidence approach does not distinguish between (a) agent completed successfully and forgot to report, and (b) agent partially completed and hung.

**Remediation sketch:** Add thresholds: "Agent is considered idle when no adapter.collect_results message has arrived within 60 seconds after the last known activity. Send follow-up and wait an additional 30 seconds. If no response: infer from filesystem ONLY IF files_modified creation is complete AND all <verification> commands pass; otherwise mark Status: Failed with 'Agent did not report and filesystem evidence inconclusive.'"

**Remediation cluster:** `response-calibration`
**Effort estimate:** small

---
