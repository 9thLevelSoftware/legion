# Audit Findings — commands/milestone.md

**Audited in session:** S04
**Rubric version:** 1.0
**File layer:** command
**File length:** 251 lines
**Total findings:** 4 (0 P0, 0 P1, 4 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-034 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 109-127**

> Based on milestone state, determine available actions:
> **Always available**: "View milestone details" ... "Done" ...
> **If any milestone has Status = "In Progress" and ALL its phases are "Complete"**: "Complete milestone {N}" ...
> **If any milestone has Status = "Complete" (not yet Archived)**: "Archive milestone {N}" ...
> **If milestones need redefinition**: "Redefine milestones" ...
> Present options via adapter.ask_user: "What would you like to do?"

**Issue:** The AskUserQuestion option list is computed dynamically from conditional branches but the prompt at L126-127 does not enumerate the final list — the agent assembles it. 4.7 may either (a) include all conditional options regardless of predicate ("Archive milestone" shown when no milestone is yet Complete), (b) omit "Done" (it is in the "Always available" block but is not emphasized), or (c) add an invented "Cancel". No closure framing ("these are the only choices this turn") exists. Matches the S03 closed-set-enforcement failure pattern on dynamic option construction.

**Remediation sketch:** Convert the dynamic option construction into an explicit predicate-to-option table with a pre-send assertion: "Before invoking AskUserQuestion, enumerate the final option list. Include exactly the options whose predicates are true, plus 'View milestone details' and 'Done' unconditionally. Do not include any option whose predicate is false. Do not invent a 'Cancel' — 'Done' serves that role." Inline a concrete example.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-035 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Line 181**

> Options: "Archive" / "Cancel"

**Issue:** Slash-separated inline options — decorative-menu anti-pattern. Destructive operation (file move). 4.7 may render as prose rather than structured AskUserQuestion items. CLAUDE.md mandates AskUserQuestion for every user question; the syntax here does not match that tool's call shape.

**Remediation sketch:** Wrap in explicit AskUserQuestion tool invocation with two items and closure: "Exactly two valid responses: Archive or Cancel. Do not take any action until the user selects one."

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-036 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 227-233**

> Ask via adapter.ask_user: "Accept these milestone groupings?"
> Options: "Accept" — "Use these milestone definitions", "Modify" — "Let me adjust the groupings"
> If "Modify": Ask for specific changes (which phases to regroup, new names, etc.)

**Issue:** Two defects. (1) The bounded Accept/Modify set has no closure framing. (2) The "Modify" path at L233 instructs "Ask for specific changes" — free-text capture — which under CLAUDE.md's AskUserQuestion mandate requires the contract defect flagged in S03: AskUserQuestion requires a non-empty options array but free-text capture has no enumerable options. This inherits the `adapter.prompt_free_text` cluster from S03 (see LEGION-47-029 learn.md L143 for the identical defect).

**Remediation sketch:** Wrap L227-232 in explicit AskUserQuestion. For L233 either (a) decompose "specific changes" into bounded sub-questions (AskUserQuestion for which phase to move, AskUserQuestion for target milestone) or (b) wait for the documented `adapter.prompt_free_text` primitive recommended in the S03 cross-cut. Cross-reference this finding with that upstream contract decision.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-037 — P2, Ambiguous Triggers

**Lines 215-218**

> Analyze for logical groupings:
> - Look for theme clusters (infrastructure, features, integrations, etc.)
> - Consider dependency chains
> - Aim for 2-4 milestones with 3-7 phases each

**Issue:** Three soft guidance items with no operational definition. "Theme clusters" has no classifier — 4.7 will apply arbitrary categorization. "Consider dependency chains" does not specify how to consult dependencies (no file referenced; ROADMAP.md format makes dependencies implicit). "2-4 milestones with 3-7 phases each" is a bounded hint but admits 2×3=6 or 4×7=28 phases — conflicts if the project has 10 phases (any 2-milestone solution violates "3-7 phases each"). Run-to-run milestone groupings will vary.

**Remediation sketch:** Replace with a deterministic procedure: "(1) Read ROADMAP.md phase dependencies (the 'depends on' column if present, else phase numeric order). (2) Greedy-bin phases into milestones of size ceil(total_phases / 4), starting new milestone at phase boundaries marked with 'milestone boundary' in notes or where the goal keyword cluster changes. (3) If no phase boundaries or keyword shifts are detected, split sequentially into groups of 4." Or: hand groupings to the user for definition rather than asking 4.7 to infer.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** medium

---
