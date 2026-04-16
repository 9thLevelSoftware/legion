# Audit Findings — commands/build.md

**Audited in session:** S03
**Rubric version:** 1.0
**File layer:** command
**File length:** 531 lines
**Total findings:** 5 (0 P0, 2 P1, 3 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

**File scope note:** `commands/build.md` is the primary execution orchestration entry point. Its surface includes wave dispatch, gate prompts, intent-flag routing, and plan discovery — each of which is a high-yield target for CAT-1 and CAT-3 per the plan's threat model. Heavy file.

---

## LEGION-47-019 — P1, Open-Set Interpretation (confirmed)

**Lines 67-72**

> 5. Gate: Architecture Review
>    - Show analysis findings to user
>    - Ask: "Proceed to Wave B, or revise Wave A outputs?"
> 6. If proceed: Generate Wave A manifest
>    If revise: Pause, user fixes, re-run Wave A

**Issue:** Core two-wave gate prompt presented as free-text natural-language question with exactly two branches ("proceed" / "revise") but no AskUserQuestion wrapper, no enumerated options, and no closure language. This is the confirmed failure class: a bounded option set presented without explicit closure. Under 4.7 literalism the gate is empirically exposed to: (a) Claude rendering the prompt as raw text (violating CLAUDE.md's "use AskUserQuestion for every user-facing question" mandate), (b) inventing a third option like "Cancel phase" or "Skip Wave B", or (c) treating the question rhetorically and auto-picking "proceed". High severity because this gate is the architectural safety rail for two-wave mode — failure skips human review of analysis findings.

**Remediation sketch:** Replace with explicit AskUserQuestion call: options "Proceed to Wave B" / "Revise Wave A outputs" / "Abort phase". Add header "Choose one of the three options below; do not propose alternatives." State the receiver-side handler for each option before the question. Wrap per CLAUDE.md mandate.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-020 — P1, Open-Set Interpretation (confirmed)

**Line 168**

> 4. **User Confirmation (yolo mode skip)**
>    - Display: "Detected intents: harden, skip-frontend"
>    - Display: "Execution mode: ad_hoc" or "Execution mode: filter_plans"
>    - Prompt: "Proceed? [Y/n]"

**Issue:** Raw `[Y/n]` prompt is a direct violation of CLAUDE.md mandate ("When any /legion: command needs to ask the user a question or present choices, you MUST use the AskUserQuestion tool. No exceptions."). Under 4.7 literalism the agent will either (a) render `[Y/n]` as literal text requiring the user to type `y` or `n` (which no CLI adapter handles uniformly), (b) auto-assume yes (the default per the `[Y/n]` convention) and proceed without confirmation, or (c) wrap it in an AskUserQuestion call with ad-hoc options that differ run-to-run. The "yolo mode skip" parenthetical is itself ambiguous — yolo mode is not defined in this file and no skip condition is specified. Confirmed open-set / mandate-violation anti-pattern.

**Remediation sketch:** Replace with explicit AskUserQuestion: options "Proceed with these intents" / "Cancel and adjust flags". Remove the `[Y/n]` convention. Define "yolo mode" elsewhere or delete the parenthetical — if a skip-confirmation mode exists it should be a named setting with a specific value check, not a parenthetical aside.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-021 — P2, Open-Set Interpretation (confirmed)

**Lines 228, 243-247**

> - Ask user: "Re-run all plans (including completed ones), or skip to incomplete plans only?"
> ...
> - Use adapter.ask_user: "Ready to execute Phase {N}: {phase_name}?"
>   Options:
>   - "Execute all plans" — proceed with full wave execution
>   - "Execute specific wave only" — ask which wave number, execute only that wave
>   - "Cancel" — abort immediately with no changes made

**Issue:** Two defects. (1) Line 228's "Re-run all ... or skip" is free-text without AskUserQuestion wrapper or closure — same anti-pattern as LEGION-47-019. (2) Lines 243-247's three-option AskUserQuestion is properly structured, but the "Execute specific wave only" branch then "ask which wave number" inline — the follow-up wave-number capture has no specification (AskUserQuestion with integer options? Free text? What if the user enters 99?). The nested prompt inherits the parent's lack of closure. Confirmed because the pattern matches the observed open-set failure class (bounded choice with one branch being an unspecified escape to another open question).

**Remediation sketch:** Line 228: convert to AskUserQuestion with closed options "Re-run all plans" / "Skip to incomplete plans only" / "Cancel". Lines 243-247: after "Execute specific wave only" is selected, follow with a second AskUserQuestion whose options are the enumerated wave numbers discovered in Step 2 (e.g. "Wave 1", "Wave 2", "Wave 3") plus "Cancel" — never a free-text integer capture.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-022 — P2, Ambiguous Triggers (suspected)

**Lines 29-32, 43-46**

> The build command automatically activates two-wave mode when:
> 1. Phase has >= 4 plans
> 2. Plans span multiple service groups OR include explicit analysis tasks
> 3. `two_wave: true` in phase CONTEXT.md (optional override)
> ...
> Step 2: Detect analysis plans
>   - Plans with `wave_role: analysis` in frontmatter
>   - Plans assigned to architecture or security agents
>   - Plans with "review", "audit", "analyze" in objective

**Issue:** The trigger set for two-wave activation mixes three detection methods (frontmatter tag, agent-registry role, objective-substring) without stating precedence or conjunction. Under 4.7 literalism the detection algorithm may: (a) require all three (strictest), (b) require any one (loosest), or (c) apply an unstated priority. The substring check `"review", "audit", "analyze" in objective` is a keyword trigger with no registry — literally matching any use of the word "review" in objective prose (e.g., "review the input for validity") will incorrectly classify the plan as analysis. Same class as the marketing/design keyword gap documented in S02c cross-cut, but the consumer surface here is clear ("in objective" is explicit). Suspected rather than confirmed because the substring check is at least bounded to three exact tokens (not an open "keyword" set).

**Remediation sketch:** State the combinator explicitly: "A plan is an analysis plan if ANY of the following hold: (a) frontmatter `wave_role: analysis`, (b) the plan's Agent: field resolves to an agent whose division is 'testing' or whose id is 'engineering-security-engineer' or 'engineering-backend-architect', (c) the `<objective>` block's first sentence begins with 'Review', 'Audit', or 'Analyze' (case-insensitive, word-boundary). Do not match these tokens elsewhere in the objective."

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---

## LEGION-47-023 — P2, Underspecified Dispatch (confirmed)

**Lines 307-311**

> d. Execute plans for this wave (wave-executor Section 4, Step 4):
>    Follow the adapter-conditional execution from wave-executor:
>    - If adapter.parallel_execution: spawn all agents simultaneously
>    - If not: execute plans sequentially
>    - Each agent uses adapter.model_execution

**Issue:** The dispatch rule is underspecified at two levels. (1) "spawn all agents simultaneously" does not state the fan-out cap — 4.7 defaults to fewer subagents (documented 4.7 regression per the plan's threat model), so without an explicit "issue all N spawns in a single tool call" instruction the agent will serialize spawns even when the adapter supports parallel execution. (2) The "spawn all agents simultaneously" instruction does not reference the file-overlap safety gate (`files_modified` collision detection in wave-executor Section 2, Step 5). A plan that references this file alone is missing the safety prerequisites. Confirmed as a CAT-3 case matching the rubric's example anti-pattern (`Consider running X and Y in parallel` without fan-out criteria). Delegated to wave-executor Section 4, but this file's inlining of the rule omits the critical fan-out language.

**Remediation sketch:** Expand the conditional: "If adapter.parallel_execution AND no two plans in this wave share any files_modified entry: issue all plan spawns as agents in a SINGLE tool call (not sequentially). The fan-out count equals the plan count; do not reduce for perceived context cost. Otherwise: execute plans sequentially in wave order, committing between each." Cross-reference wave-executor Section 4, Step 4 for the canonical safety check.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** small

---

## Category Coverage Notes

- **CAT-1 (Open-Set Interpretation):** Three confirmed findings (019, 020, 021). Other potential CAT-1 sites reviewed: lines 84-86 ("Verdict: PASS, NEEDS_WORK, or FAIL") enumerate the closed set fully; lines 183-195 (natural-language routing) are structurally AskUserQuestion calls with explicit options per confidence tier; lines 505-508 (PR creation) are a closed binary in AskUserQuestion. No finding on those.
- **CAT-3 (Underspecified Dispatch):** One confirmed finding (023). Lines 288-305 (personality vs. autonomous prompt construction) delegate to wave-executor Section 3 Step 4 with explicit "Do NOT use simplified templates" guard — the dispatch is well-specified.
- **CAT-4 (Underspecified Intent):** `<objective>` block front-loads goal ("Execute all plans for the current (or specified) phase"). Each step number has a short heading describing intent. No finding.
- **CAT-5 (Prohibitive Over-Reliance):** Multiple "Do NOT" instructions (lines 126, 283, 296-297, 339, 374, 489, 530). Each defends a closed correctness boundary (dry-run side-effect prohibition, template integrity, file-not-found semantics, failure-commit prohibition, fail-stop gate, cleanup on failure path, post-phase routing). Per rubric CAT-5 exception, all retained.
- **CAT-6 (Implicit Preconditions):** Step 1 (line 199-207) verifies phase existence, plan directory presence, STATE.md status — explicit. The `AGENTS_DIR` resolution is delegated to workflow-common with a clear protocol reference (lines 258-260). No finding.
- **CAT-7 (Maximalist Persona):** N/A — not a persona file.
- **CAT-8 (Unstated Acceptance Criteria):** Phase completion is defined at lines 441-443 ("All plans succeeded: phase is complete. Some plans failed: phase is partial."). Each wave's done-state is defined at line 313-315. No finding.
- **CAT-9 (Response Calibration Gaps):** No finding. Output sections (lines 231-235 discovery summary, 369-372 wave status, 491-497 final progress) have explicit format blocks.
- **CAT-10 (Authority Ambiguity):** Step 4-ADHOC section (line 422-424) references `@.planning/config/authority-matrix.yaml` for security-domain authority. No ambiguity surfaced.
