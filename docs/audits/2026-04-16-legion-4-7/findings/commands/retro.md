# Audit Findings — commands/retro.md

**Audited in session:** S04
**Rubric version:** 1.0
**File layer:** command
**File length:** 213 lines
**Total findings:** 3 (0 P0, 0 P1, 2 P2, 1 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-031 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 143-149**

> Present via adapter.ask_user: "Save retrospective findings to memory?"
> Options:
> - "Save to memory" — "Record findings to .planning/memory/RETRO.md for future planning context"
> - "View only (don't save)" — "Retrospective displayed but not persisted"
> - "Edit before saving" — "Make adjustments to findings before recording"

**Issue:** Closed 3-option set but formatting uses em-dash description lines rather than the structured label/description pairs an AskUserQuestion tool invocation requires. There is no explicit "these are the only valid choices" framing. 4.7 may render as prose suggestions or attempt to invent a fourth ("Edit and save", "Cancel"). Matches the closed-set-enforcement failure class documented in S03 across advise.md, board.md, build.md.

**Remediation sketch:** Wrap in explicit AskUserQuestion tool invocation with three items. Add closure sentence: "These are the only three valid responses. Do not propose a fourth. Do not take action until the user selects one." Move descriptions into the AskUserQuestion `description` field rather than prose em-dashes.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-032 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 189-191**

> Present the condensed findings via adapter.ask_user: "Which sections need changes?"
> Options: "What Went Well" / "What Didn't Work" / "Patterns" / "Action Items" / "Looks good — save as-is"

**Issue:** Five options rendered as slash-separated inline prose. This is the decorative-menu anti-pattern documented in S03 (explore.md L44-53). 4.7 cannot reliably parse slash-separated strings into AskUserQuestion items; it is likely to treat the line as free text and respond conversationally. Additionally the question admits only one selection but users may need to edit multiple sections — single-select vs. multi-select is unspecified.

**Remediation sketch:** Convert to structured AskUserQuestion with five items: four section names plus the save-as-is exit. Explicitly state "Pick one section to edit; you will be re-prompted after each edit until you select 'Looks good — save as-is.'" Or switch to AskUserQuestion with `multi_select: true` if the adapter supports it.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-033 — P2, Ambiguous Triggers

**Line 196**

> If invoked from `/legion:portfolio` context (detected via portfolio state or $ARGUMENTS containing `--portfolio`):

**Issue:** "Portfolio state" is not operationally defined. There is no specified file path, no key, no value to inspect. 4.7 will either (a) always take the false branch because "portfolio state" is undefined, or (b) invent a check (e.g., "look for a portfolio directory") that may or may not match the real portfolio command's artifacts. The `$ARGUMENTS` check is observable; the other branch is not.

**Remediation sketch:** Replace the disjunction with a single observable condition: `If $ARGUMENTS contains --portfolio OR the file .planning/portfolio/STATE.md exists and its 'active' field is true`. Pick one concrete artifact (consult `/legion:portfolio` spec) and inline the exact path and field. Drop the "or" if only one condition is actually testable.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---
