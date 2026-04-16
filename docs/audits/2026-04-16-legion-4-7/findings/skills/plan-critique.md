# Audit Findings — skills/plan-critique/SKILL.md

**File size:** 537 lines
**Session:** S07
**Rubric version:** 1.0

---

## LEGION-47-122 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 312-334**

> Step 4: Route based on verdict
>   Use AskUserQuestion:
>
>   If PASS:
>     "Plan critique found no critical issues. What next?"
>     - "Proceed to execution" (Recommended)
>     - "Run critique again with different agents"
>
>   If CAUTION:
>     "Plan critique found {N} addressable issues. What next?"
>     - "Apply mitigations and proceed" (Recommended) — user applies fixes, then executes
>     - "Revise the plan first" — return to plan editing
>     - "Proceed anyway" — skip mitigations, execute as-is
>
>   If REWORK:
>     "Plan critique found {N} critical issues needing revision. What next?"
>     - "Revise the plan" (Recommended) — return to plan editing
>     - "Proceed anyway" — execute despite warnings (user takes responsibility)
>     - "Re-plan from scratch" — delete plans, restart /legion:plan

**Issue:** The PASS path has only 2 options and omits "Cancel", "Revise anyway" (user may want to revise even with no critical issues), and "Run schema check only" (partial validation). More critically, multiple branches contain free-text follow-ups: "Apply mitigations" does not specify how — does the skill auto-apply, or does the user edit plans manually, or is an agent spawned? "Revise the plan" on both CAUTION and REWORK is compound and unbounded — which plan, which section, which way? This is the top-level load-bearing verdict gate of the critique skill; its closed-set discipline matters. CAT-1 peer to LEGION-47-040 (review.md reviewer-selection), 117, 120.

**Remediation sketch:** (a) Add to PASS: "Revise anyway" and "Cancel" options (at minimum 4 options for symmetry with CAUTION/REWORK). (b) "Apply mitigations and proceed" → define precisely: "Apply mitigations — spawn engineering-senior-developer with the mitigation list; user reviews diff before execution." Bind to a concrete primitive. (c) "Revise the plan" → nested AskUserQuestion enumerating plans NN-PP (bounded), then options per plan: "Edit Task X", "Add mitigation", "Change agent", "Change wave". (d) "Re-plan from scratch" → add confirmation step ("This will delete all plan files in .planning/phases/{NN}-{slug}/. Continue?") since this is destructive.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-123 — P2, Underspecified Intent

**Lines 37-51**

> Step 2: Generate failure headlines
>   Assume the phase has been executed and FAILED. Generate 3-5 failure headlines
>   that describe plausible ways the phase could fail. Each headline should be:
>   - Specific to THIS phase (not generic project risks)
>   - Grounded in the plan tasks and files_modified
>   - Phrased as a post-incident headline: "Phase {N} failed because {specific cause}"
>
>   Example headlines for a "Plugin Scaffold" phase:
>   - "Phase 15 failed because plugin.json schema didn't match Claude Code's validation"
>   - "Phase 15 failed because settings.json defaults broke existing user configurations"
>   - "Phase 15 failed because the directory structure conflicted with .gitignore patterns"
>
>   Do NOT generate vague headlines like "Phase failed due to poor planning" or
>   "Phase failed because requirements were unclear."

**Issue:** Intent (pre-mortem reasoning, inversion technique) is established in Section 1 preamble (L17-20). However this file's Section 3 / Section 5 dispatch these steps to an external critique agent (L343-389 Section 4). The pre-mortem prompt is written assuming a *specific* reasoning stance (skepticism, adversarial framing); yet nothing in the dispatch prompt or CONTEXT injection enforces that the spawned agent holds this stance. A senior-developer personality spawned with these steps will output optimistic headlines. A testing-qa-verification-specialist (the preferred agent per L354) will output skeptical ones. The variance is unbounded and undocumented. Same CAT-4 intent-late class as LEGION-47-039 (plan.md intent-front-loading cluster), but inverse: here intent IS stated, but the dispatch primitive does not carry the stance forward.

**Remediation sketch:** (a) In Section 4 dispatch, require inclusion of the Section 1 preamble as HANDOFF_CONTEXT — not just "Section 1 as task instructions" but the full "Assume the project has already failed. Works backward from the failure" framing. (b) Add a verification step: the agent's first output line must be "Stance check: I am operating in skeptical/pre-mortem mode, assuming the plan has failed." If the agent's SUMMARY.md lacks this line, critique output is invalid — re-dispatch with a stricter persona or escalate. (c) Cross-reference S06 LEGION-47-093 handoff-context-inheritance findings.

**Remediation cluster:** `intent-front-loading`
**Effort estimate:** small

---

## LEGION-47-124 — P2, Implicit Preconditions

**Lines 25-35**

> Step 1: Set the scene
>   Read ALL plan files for the phase ({NN}-{PP}-PLAN.md).
>   Read the CONTEXT.md for phase goal, requirements, and success criteria.
>   Read ROADMAP.md for dependencies and the broader milestone context.
>   Read `.planning/CODEBASE.md` if it exists (optional):
>     - Extract the Risk Areas table
>     - Cross-reference each plan's `files_modified` against Risk Areas
>     - If overlap with HIGH or MEDIUM risk areas: pre-seed Step 2 failure headlines
>       with risk-informed scenarios (e.g., "Phase failed because changes to {risky_file}
>       introduced regressions in a high-churn area")
>     - If CODEBASE.md absent: skip, no pre-seeding

**Issue:** Multiple precondition ambiguities accumulate. (1) "Read ALL plan files" — plan file naming is `{NN}-{PP}-PLAN.md` but no enumeration mechanism is specified. If the Glob fails (no plans yet, phase directory missing, partial write state), behavior is undefined. (2) "CONTEXT.md" — path is `.planning/phases/{NN}-{slug}/CONTEXT.md` per phase-decomposer Section 7, but this skill does not reference that path. A 4.7-literal reader looking for CONTEXT.md in the repository root or `.planning/` will fail-silent. (3) "Risk Areas table" is a specific section name inside CODEBASE.md, but no schema is cross-referenced — if codebase-mapper renames or removes the table, this skill silently degrades (the "pre-seed" branch just produces zero seeds, indistinguishable from CODEBASE.md having no risks). Dual-source-of-truth drift class peer to LEGION-47-085, 118.

**Remediation sketch:** (a) Specify concrete paths: "Read `.planning/phases/{NN}-{slug}/CONTEXT.md` (phase-decomposer Section 7 writes here)." (b) Enumerate plan file glob: "Glob `.planning/phases/{NN}-{slug}/*-PLAN.md`. If zero results: abort with error PRE-MORTEM-NO-PLANS." (c) Reference codebase-mapper Section 4 for the Risk Areas table schema. Add a schema-presence check: "Confirm CODEBASE.md contains a `## Risk Areas` heading with table format. If heading present but no rows, note: 'CODEBASE.md exists but Risk Areas empty — proceeding without risk pre-seeding.' If heading absent but file exists, warn: 'CODEBASE.md schema drift — re-run /legion:quick analyze codebase.'"

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-125 — P2, Underspecified Dispatch

**Lines 363-389**

> Panel size:
>   - 1 agent: Quick critique (single agent runs both passes sequentially)
>   - 2 agents: Standard critique (one per pass — recommended)
>   Each agent is spawned with its full personality file loaded from
>   {AGENTS_DIR}/{agent-id}.md (AGENTS_DIR resolved via workflow-common
>   Agent Path Resolution Protocol), plus the relevant section (1 or 2)
>   as task instructions, using adapter.spawn_agent_readonly to prevent
>   plan modification. If personality file is missing: run critique
>   autonomously without personality injection.

**Issue:** Dispatch specification is incomplete in two ways. (1) "Panel size 2 agents" does not specify fan-out mechanism. Same CAT-3 class as S06 LEGION-47-101, 102, 112. For true parallel panel execution, both agent spawns must issue in the same LLM response via the same-response Bash fan-out. The text says "run both passes" but says nothing about whether the two passes run concurrently or sequentially in the 2-agent case. If sequential, the second agent's critique may contaminate with the first (no handoff-context isolation spec); if parallel, no file-overlap check is needed because critique is read-only, but no rendezvous mechanism is specified either (how does Section 3 Step 1 merge the two outputs?). (2) "If personality file is missing: run critique autonomously without personality injection" — silent degradation path that masks S04 non-existent-agent-ID bugs (LEGION-47-052) and LEGION-47-118 precondition-drift. A 4.7-literal reader facing a missing file will produce an unsigned critique output that looks identical to a signed one, defeating the dual-ground-truth pattern.

**Remediation sketch:** (a) Add fan-out specification: "For panel size 2, issue both adapter.spawn_agent_readonly calls in a SINGLE response block; they run concurrently. Poll for both SUMMARY.md files before Section 3 merging. For panel size 1, single call, sequential passes within one agent's instructions." (b) Replace silent degradation with: "If personality file missing: abort critique with PERSONALITY-MISSING error citing the agent-id and resolved path. Do NOT fall through to autonomous mode — that masks deployment drift (LEGION-47-052 peer bug class). Surface the drift; user can swap to another agent via Section 4 Fallback list or re-run install." (c) Add merge spec: "Section 3 Step 1 combines pre-mortem and assumption outputs by: (1) concatenating findings under their respective Step 5 headers; (2) applying deduplication per Step 1 bullet 'if a pre-mortem finding and an assumption point to the same plan section...' rule." Currently the merge algorithm is implicit.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** small

---

## LEGION-47-126 — P2, Unstated Acceptance Criteria (confirmed)

**Lines 256-310**

> ## Section 3: Critique Report and Routing
> ...
> Step 2: Compute critique verdict
>   - PASS: No schema BLOCKERs AND no critical risks AND no critical assumptions
>     → "Plan looks solid. Proceed to execution."
>   - CAUTION: 1-2 critical items (including schema warnings), all have clear mitigations
>     → "Plan has addressable risks. Review mitigations before proceeding."
>   - REWORK: Any schema BLOCKER OR any wave overlap BLOCKER OR 3+ critical items OR any item without clear mitigation
>     → "Plan needs revision before execution."

**Issue:** Verdict computation has underspecified boundary cases. (1) "1-2 critical items" for CAUTION vs. "3+ critical items" for REWORK — what about exactly 2 items where one lacks clear mitigation? The clause "OR any item without clear mitigation" under REWORK could override, but "all have clear mitigations" under CAUTION is not an exclusive condition. A 4.7-literal reader with 2 critical items (one mitigated, one not) may compute CAUTION (passes the 1-2 count) and REWORK (passes the without-clear-mitigation clause) simultaneously. (2) "Clear mitigations" has no acceptance test — what makes a mitigation "clear"? Section 1 Step 5 produces "mitigation actions" but does not rank their clarity. (3) No verdict for "0 critical items + schema WARNING" — falls into the PASS clause ("No schema BLOCKERs AND no critical risks AND no critical assumptions" — WARNINGs are not BLOCKERs) but the verdict message "Plan looks solid" contradicts the presence of warnings. Peer to LEGION-47-050, 055 bracketed-stub acceptance-criteria class.

**Remediation sketch:** (a) Make verdict computation an ordered rule chain with first-match semantics: "(1) If any schema BLOCKER or wave overlap BLOCKER → REWORK. (2) If any critical item without clear mitigation → REWORK. (3) If ≥3 critical items → REWORK. (4) If 1-2 critical items (all mitigated) or any schema WARNING → CAUTION. (5) Else PASS." (b) Define "clear mitigation": "A mitigation is clear iff it specifies (i) a concrete action, (ii) a responsible agent or autonomous step, (iii) a verifiable outcome. Mitigations failing any criterion are tagged UNCLEAR and trigger REWORK under rule (2)." (c) Rewrite PASS message: "Plan looks solid" → "Plan passes all blocking checks" — stronger and does not contradict warnings if present.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## Category Coverage Notes

- **CAT-1** (Open-Set Interpretation): 1 finding (LEGION-47-122). Verdict-routing AskUserQuestion has asymmetric option counts and unbounded follow-ups.
- **CAT-2** (Ambiguous Triggers): 0 findings. This skill does not own keyword-trigger detection.
- **CAT-3** (Underspecified Dispatch): 1 finding (LEGION-47-125). Panel-size fan-out and missing-personality silent-degradation.
- **CAT-4** (Underspecified Intent): 1 finding (LEGION-47-123). Pre-mortem stance stated here but not carried through Section 4 dispatch primitive. Not confirmed — intent is present; transport is the gap.
- **CAT-5** (Prohibitive Over-Reliance): 0 findings. The "Do NOT generate vague headlines" clause (L49-50) is specific and bounded, not a blanket prohibition.
- **CAT-6** (Implicit Preconditions): 1 finding (LEGION-47-124). Plan file glob, CONTEXT.md path, Risk Areas schema-drift.
- **CAT-7** (Maximalist Persona Language): 0 findings. Analysis skill, not a persona.
- **CAT-8** (Unstated Acceptance Criteria): 1 finding (LEGION-47-126). Verdict computation boundary-overlap and "clear mitigation" undefined. Peer to LEGION-47-055 bracketed-stub class.
- **CAT-9** (Response Calibration Gaps): 0 findings. Severity tiers (PASS/CAUTION/REWORK) are enumerated.
- **CAT-10** (Authority Ambiguity): 0 findings. This skill does not assert authority over other skills; it cross-references correctly (plan-critique defers to agent-registry Section 3, review-panel for verdict structure).

**Severity summary:** 5 findings total — 0 P0, 0 P1, 5 P2, 0 P3.
**Confirmed count:** 2 of 5 (LEGION-47-122 closed-set peer to S04 load-bearing gates; LEGION-47-126 acceptance-criteria peer to S04/S05 bracketed-stub class). LEGION-47-123, 124, 125 unconfirmed — each single-instance in this session but tied to outstanding cross-cuts (CODEBASE.md schema drift in plan-critique is distinct from prior CODEBASE.md findings because here the concern is schema-drift detection, not content coverage).

**Note on S07 target list vs. task description:** Task 10 description flagged "Section 3 Steps 4.b/4.c" as expected home for LEGION-47-050-style bracketed-stub remediation ("the 'existing behavior' references that LEGION-47-050 flagged — here is where they should be defined"). Review of Section 3 Step 4 (L312-334) finds no bracketed stubs in plan-critique — the verdict routing is self-contained. LEGION-47-050's "existing behavior" references live in commands/plan.md (already audited in S04) and reference plan-critique as a destination but plan-critique itself does not carry forward the stubs. No finding to re-file here; LEGION-47-050 remediation remains a commands/plan.md fix. This is a clarification finding, not a defect.
