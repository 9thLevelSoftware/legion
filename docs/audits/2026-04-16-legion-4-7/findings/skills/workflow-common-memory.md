# Audit Findings — skills/workflow-common-memory/SKILL.md

**Audited in session:** S06
**Rubric version:** 1.0
**File layer:** skill
**File length:** 18 lines
**Total findings:** 2 (2 P2)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-099 — P2, CAT-6 Implicit Preconditions (suspected)

**Lines 13-17**

> ## Rules
> - Memory is project-scoped by default and never cross-project for recommendation boosts.
> - Memory is additive guidance and cannot override mandatory role constraints.
> - Missing memory files must not block command execution.
> - Record outcomes/preferences only when workflow explicitly calls for it.

**Issue:** Rule 3 ("Missing memory files must not block command execution") is the graceful-degradation contract, but no verification procedure is specified. The parent `workflow-common/SKILL.md` lines 606-611 provide the canonical 4-step degradation pattern (check existence → branch → use or skip → never block). This extension skill collapses that into one rule without the check-existence step. 4.7 loading this extension without also loading the parent may attempt memory operations before verifying the file exists, producing errors that then get classified as "missing" after the fact — which is the behavior this rule is meant to prevent. Additionally, "the four memory files" (OUTCOMES.md, PATTERNS.md, ERRORS.md, PREFERENCES.md — see workflow-common lines 580-586) are not named here; the reader may assume memory is a single file and check only one.

**Remediation sketch:** Expand rule 3 into the explicit 4-step pattern: "Before any memory operation: (1) check if `.planning/memory/{file}.md` exists where {file} is one of OUTCOMES, PATTERNS, ERRORS, PREFERENCES; (2) if exists, use the record; (3) if not, skip silently with log 'memory file absent: {file}'; (4) never raise, never block." Reference the canonical parent section rather than re-declare.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-100 — P2, CAT-2 Ambiguous Triggers (suspected)

**Line 17**

> - Record outcomes/preferences only when workflow explicitly calls for it.

**Issue:** "when workflow explicitly calls for it" is a circular trigger — it says "record when told to record" without specifying what "explicit" looks like. The parent `workflow-common/SKILL.md` lines 590-604 enumerates 14 concrete memory integration points (build/store-outcome, build/store-error-fix, review/store-pattern, plan/recall-agent-scores, etc.). This extension does not reference them. A 4.7 reader loading this extension without the parent has no integration-point registry to match against, and will default to one of two extremes: (a) never record (safe interpretation of "only when"), or (b) record at every opportunity (each step feels "explicit" to the agent in the moment).

**Remediation sketch:** Replace the vague rule with: "Record memory only at the integration points listed in `workflow-common/SKILL.md` § Memory Integration Points (14 canonical points across /legion:build, /legion:review, /legion:plan, /legion:status). Do not record outside these points."

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---
