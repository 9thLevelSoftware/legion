# Audit Findings — commands/plan.md

**Audited in session:** S04
**Rubric version:** 1.0
**File layer:** command
**File length:** 420 lines
**Total findings:** 6 (0 P0, 1 P1, 5 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-045 — P1, Open-Set Interpretation of Closed Options (confirmed)

**Lines 258-267**

> Use adapter.ask_user: "Does this plan breakdown look right?"
> - "Looks good, generate the plans" -- proceed
> - "Swap an agent" -- ask which plan, present alternatives, update
> - "Adjust the plan structure" -- discuss changes, revise decomposition
> - Loop until user confirms

**Issue:** The central user-facing gate of `/legion:plan`. Three defects. (1) Em-dash prose format, no closure framing; 4.7 may invent a fourth "Abort" or "Skip". (2) "Swap an agent" branch delegates to "ask which plan, present alternatives" — two nested free-text captures that inherit the S03 `adapter.prompt_free_text` contract defect (AskUserQuestion requires non-empty options). (3) "Adjust the plan structure" says "discuss changes, revise decomposition" — unbounded free-text exchange with no termination condition; "Loop until user confirms" defines the outer loop but the inner discussion loop is not bounded. P1 because a planning failure at this gate produces wrong waves or wrong agents for the entire phase, amplified by the `--auto` flag behavior flagged in LEGION-47-046. Related: LEGION-47-011 (advise.md advisor selection) and LEGION-47-018 (build.md intent-flag confirmation) — same class of load-bearing gate.

**Remediation sketch:** Wrap the outer question in explicit AskUserQuestion with three items and closure. For "Swap an agent": follow up with AskUserQuestion enumerating plan IDs (from the current decomposition), then AskUserQuestion with agent candidates for the chosen plan (from agent-registry recommendation top 5). For "Adjust the plan structure": require the user to specify which sub-aspect (AskUserQuestion: "Change wave structure" / "Change plan boundaries" / "Change task breakdown" / "Done adjusting"). Cross-reference the S03 `adapter.prompt_free_text` architectural decision before remediation.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** large

---

## LEGION-47-046 — P2, Underspecified Dispatch

**Lines 55-64**

> AUTO-PIPELINE MODE
> If `$ARGUMENTS` contains `--auto`:
> - Skip all user confirmation gates (steps 3.5b, 3.6b, 6, 8.5) — auto-select recommended defaults
> - Run the full pipeline without pausing: board quick-assess → decomposition → plan critique → design review (if applicable) → security scan (if applicable)
> ...
> - If any stage raises a BLOCKER-severity escalation: halt the pipeline and present to user

**Issue:** "Auto-select recommended defaults" is not operationally defined for Step 6 (the plan confirmation gate flagged in LEGION-47-045). Step 6 has three options — which is the default? If the implicit default is "Looks good, generate the plans", then `--auto` silently accepts every plan regardless of quality. If the default is different per-situation, 4.7 will pick inconsistently. Also, the cascade of stages ("board quick-assess → decomposition → plan critique → design review → security scan") lacks per-stage abort criteria beyond the BLOCKER-escalation exit. No guidance on what CAUTION or WARNING-level findings do mid-pipeline.

**Remediation sketch:** Enumerate defaults explicitly: "Auto mode defaults: 3.5b → 'Yes, generate proposals'; 3.6b → 'No, proceed to planning'; 6 → 'Looks good, generate the plans'; 8.5 → 'Run plan critique'." Add a per-stage abort predicate: "If critique verdict = REWORK AND AUTO_REFINE=false, halt and present to user before stage N+1." Document what stages run on which severity levels.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** medium

---

## LEGION-47-047 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 88-92, 182-188, 215-218, 222-228, 285-291**

> L88-92: "Phase {N} already has {count} plan(s). What would you like to do?" / "Re-plan from scratch" / "Keep existing plans"
> L182-188: "Phase {N} has enough complexity ... Generate them?" / "Yes, generate 2-3 proposals" / "Skip, I know the approach I want"
> L215-218: "Use existing spec or regenerate?" / "Use existing" / "Regenerate"
> L222-228: "Run spec pipeline before planning Phase {N}?" / "Yes, create a spec first" / "No, proceed to planning (Recommended for straightforward phases)"
> L285-291: "Plans generated. Stress-test before execution?" / "Run plan critique" / "Skip critique, proceed to execution"

**Issue:** Five parallel adapter.ask_user gates, all formatted as em-dash or hyphen option lists with no explicit closure framing. Several embed recommendations ("(Recommended)") inside option text — 4.7 may parse the parenthetical as part of the option string when matching the returned value. Repeat of the closed-set-enforcement pattern documented in S03 and reinforced in LEGION-47-031, -034, -038, -042. The L88 prompt is particularly risky because "Re-plan from scratch" is a destructive operation (deletes existing plans).

**Remediation sketch:** Convert all five to explicit AskUserQuestion tool invocations with structured label/description pairs. Move "(Recommended)" out of option labels into the description field. Add a shared closure clause or document once in CLAUDE.md: "All AskUserQuestion invocations in Legion commands present a closed set; invented options are invalid responses." For the L88 destructive prompt, require a confirmation sub-question before deletion.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-048 — P2, Ambiguous Triggers (confirmed)

**Lines 127-132, 149-155**

> MARKETING PHASE DETECTION: Check if phase description contains marketing keywords ("campaign", "content calendar", "social media", "cross-channel", "marketing", "brand awareness", "audience", "engagement strategy")
> DESIGN PHASE DETECTION: Check if phase description contains design keywords ("design system", "component library", "UX research", "usability testing", "accessibility audit", "brand guidelines", "design tokens", "wireframes", "user persona", "user journey", "information architecture", "visual design")

**Issue:** Inlined keyword lists drift from the authoritative registry that does not exist. Per S02c cross-cut: `intent-teams.yaml` has no marketing or design keyword registry; plan.md inlines its own list, CLAUDE.md/AGENTS.md/README.md reference keywords without enumerating them (LEGION-47-002, -004, -005). Plan.md thus becomes a de-facto registry, but with no cross-check against the marketing-workflows or design-workflows skill files — drift is guaranteed. Also, "phase description contains" does not specify whether match is case-sensitive, word-boundary-sensitive, or stopword-aware; "audience" appears in many non-marketing phases ("target audience for the admin CLI"). Confirmed under S02c rule (CAT-2 findings citing marketing/design keyword triggers are confirmed).

**Remediation sketch:** (1) Move the keyword list to `.planning/config/intent-teams.yaml` under a new `marketing_keywords` and `design_keywords` section. (2) Replace inline lists in plan.md with a reference to the config file. (3) Operationalize match: "Case-insensitive word-boundary match; phrase keywords match exact phrase only." (4) Add a de-duplication clause: "If a phase matches both marketing and design keywords, treat as multi-domain and run both detection paths."

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** medium

---

## LEGION-47-049 — P2, Authority Ambiguity

**Lines 55-73**

> AUTO-PIPELINE MODE ... If any stage raises a BLOCKER-severity escalation: halt the pipeline and present to user
> AUTO-REFINE MODE ... If still REWORK after 2 cycles: halt and present to user for manual decision

**Issue:** The `--auto` and `--auto-refine` flags delegate authority to the command itself — user confirmation gates are skipped and the command proceeds on recommended defaults. The only escalation surface is "BLOCKER-severity" (for auto-pipeline) or "REWORK after 2 cycles" (for auto-refine). This does not reference CLAUDE.md's Authority Matrix or the escalation-protocol.yaml contract. Several decisions that `--auto` would make (e.g., accepting an architecture-proposal that implies new dependencies, accepting a spec that changes API contracts) require human approval per the Authority Matrix. `--auto` mode could silently commit those decisions.

**Remediation sketch:** Add an explicit clause: "Auto modes must not skip gates where the auto-selected default would trigger an Authority Matrix escalation type (architecture, dependency, schema, api, deletion). If the decomposition or critique introduces such a change, emit an <escalation> block per .planning/config/escalation-protocol.yaml and halt, regardless of --auto." Reference the authority matrix explicitly in the auto-mode section.

**Remediation cluster:** `authority-language`
**Effort estimate:** medium

---

## LEGION-47-050 — P2, Unstated Acceptance Criteria

**Lines 311-336**

> d. Route based on verdict (plan-critique Section 3, Step 4):
>    - PASS: proceed to Step 8.6 (or 8.7/9 depending on pipeline)
>    - CAUTION:
>      - If AUTO_REFINE=true: treat CAUTION same as REWORK
>      - If AUTO_REFINE=false: user chooses to apply mitigations or proceed (existing behavior)
>    ...
>    - REWORK:
>      ...
>      - If AUTO_REFINE=false: user chooses to revise plans or proceed anyway (existing behavior)

**Issue:** Two references to "existing behavior" without stating what that behavior is. 4.7 reading this file in isolation (without loading plan-critique SKILL.md) cannot determine the flow for the non-auto path. The "user chooses to apply mitigations or proceed" line is not operationalized — no adapter.ask_user wrapper, no option enumeration, no done-state. Reading plan-critique skill is the resolution, but the delegation is informal ("existing behavior") rather than a named section reference.

**Remediation sketch:** Replace "existing behavior" with explicit pointers: "follow plan-critique Section 3, Step 4.b (CAUTION user gate)" and "plan-critique Section 3, Step 4.c (REWORK user gate)". Inline the option list from those sections as a backstop so 4.7 can resolve without the skill file loaded.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---
