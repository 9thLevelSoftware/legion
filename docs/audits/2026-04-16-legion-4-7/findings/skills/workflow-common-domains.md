# Audit Findings — skills/workflow-common-domains/SKILL.md

**Audited in session:** S06
**Rubric version:** 1.0
**File layer:** skill
**File length:** 18 lines
**Total findings:** 1 (1 P2)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-096 — P2, CAT-2 Ambiguous Triggers (confirmed)

**Lines 13-17**

> ## Rules
> - Activate only when phase requirements or task context indicates domain relevance.
> - Marketing workflows produce campaign artifacts under `.planning/campaigns/`.
> - Design workflows produce design artifacts under `.planning/designs/`.
> - Domain extensions refine execution; they never replace core phase/state flow.

**Issue:** The first rule is the activation trigger itself and it is maximally vague: "when phase requirements or task context indicates domain relevance". "Indicates domain relevance" has no enumeration, no reference to a canonical keyword list, and no fallback behavior. The rest of the skill's content (which is all four bullet points) fails to define what "domain relevance" means operationally. Compared to the parent `workflow-common/SKILL.md` lines 722-803 which at least provide the MKT-*/DSN-* prefix as a partial trigger, this extension skill gives no procedural hook at all. A 4.7 reader loading this skill either (a) activates domain behavior always (it's "loaded" after all), or (b) never activates because "domain relevance" is unprovable. Parity with S02c cross-cut — marketing/design keyword registry does not exist in intent-teams.yaml.

**Remediation sketch:** Add a concrete activation rule: "Activate when (a) the active phase has any requirement ID matching `^(MKT|DSN)-\d+`, OR (b) the user explicitly passes `--domain=marketing` or `--domain=design` to the command, OR (c) the active phase's `domain:` frontmatter field equals 'marketing' or 'design'. Otherwise do NOT activate." Drop the "indicates domain relevance" phrasing entirely. Cross-reference `.planning/config/intent-teams.yaml` once the keyword registry is added.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---
