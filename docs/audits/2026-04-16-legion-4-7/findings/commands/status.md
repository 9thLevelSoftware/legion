# Audit Findings — commands/status.md

**Audited in session:** S05
**Rubric version:** 1.0
**File layer:** command
**File length:** 313 lines
**Total findings:** 5 (0 P0, 0 P1, 5 P2)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-071 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 240-272**

> 5. DETERMINE NEXT ACTION
>    Apply this decision tree in order (first match wins):
>    a. No ROADMAP.md exists: Next: "Run `/legion:start` to initialize the project."
>    b. Current phase status contains "pending" or "Pending" in ROADMAP.md: Next: "Run `/legion:plan {N}` ..."
>    c. Current phase status contains "Planned" in ROADMAP.md: ...
>    d. Current phase status contains "Executed" or STATE.md says "pending review": ...
>    e. Current phase is "Complete" AND there are more phases: ...
>    e2. Current phase is "Complete" AND it's the last phase of the current milestone AND all phases in the milestone are Complete: ...
>    f. All phases are "Complete": ...
>    g. STATE.md says "escalated" or "failed": ...

**Issue:** "First match wins" decision tree with three subtle problems that make the closed set leak. (1) Branch `e2` is injected out of alphabetical order (after `e`, before `f`) and the rule "This case takes priority over (e) when a milestone boundary is reached" overrides the "first match wins" rule — two match-selection rules collide, and 4.7 has no way to know which governs. (2) Branches `b`–`d` use the verb "contains" against status strings (e.g., `contains "pending"`) — case-insensitive implied but not stated; substring match means a status like "pending review" hits branch `b` and branch `d` simultaneously (first match wins → always `b`, dropping the L253 review suggestion). (3) Status values "pending", "Pending", "Planned", "Executed", "Complete", "Shipped", "escalated", "failed" — validate.md L64 enumerates 6 canonical values (Pending, In Progress, Planned, Executed, Complete, Shipped) but this file also reads "escalated", "failed", "pending review" — open set between the two commands.

**Remediation sketch:** Harden the decision tree: (a) fix ordering — rename `e2` to `e` and demote the milestone-less branch to `f`, eliminating priority-rule conflict with first-match-wins. (b) Replace `contains "X"` with `== "X"` (case-sensitive equality against a canonical value set) — cite validate.md L64 canonical set. (c) Add `== "pending review"` as a distinct status (read from STATE.md `Status:` field, not ROADMAP.md) to disambiguate branch `d`. (d) Add a fall-through branch `h`: "No branch matched — report status value and fields, suggest manual diagnosis. Do not guess."

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-072 — P2, Ambiguous Triggers (confirmed)

**Lines 57-66**

> 2. READ PROJECT STATE
>    Read these files (all required for full dashboard):
>    a. .planning/PROJECT.md — extract project name from the "# {name}" heading
>    b. .planning/STATE.md — extract:
>       - Current phase number and total phases (from "Phase: N of M")
>       - Phase status (from "Status:" field)
>       - Last activity (from "Last Activity:" field)
>       - Next action (from "Next Action:" field)
>       - Recent decisions (from "Recent Decisions" section, last 3)
>       - Pre-existing issues (from "Pre-existing Issues" section, if any)
>       - Phase results for the current phase (from "Phase {N} Results" section)

**Issue:** STATE.md field extraction uses hand-written label patterns ("Phase: N of M", "Status:", "Last Activity:", "Next Action:") as triggers without specifying (1) exact regex, (2) case rule, (3) whitespace tolerance, (4) fallback when a template variant renders the label differently. Peer of LEGION-47-044 / LEGION-47-048 (substring-keyword trigger class). The state-template.md in `<context>` would be the authoritative schema but it is in a different command's context block (@ref from start.md L22, not here). Under 4.7 literalism: a STATE.md produced by /legion:start v7.3 may render "Phase (N of M)" with parens — no extraction, dashboard silently degrades.

**Remediation sketch:** Delegate to execution-tracker or a new state-parser skill with explicit schema: "Read STATE.md and parse fields by the state-schema-v1 format. Field names, label formats, and line positions are defined in `skills/execution-tracker/state-schema.md` (canonical). If any required field is missing from the parsed result, surface a diagnostic warning in the dashboard rather than silently omitting the field. Do not infer or guess." Or enumerate regex patterns inline with explicit case/whitespace rules.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** medium

---

## LEGION-47-073 — P2, Implicit Preconditions (suspected)

**Lines 274-298**

> 5b. CONTEXT-AWARE SUGGESTIONS (Context-Aware Next Actions)
>    Generate proactive next-action suggestions based on project lifecycle position.
>    Uses intent-router Section 8: getContextSuggestions().
>
>    a. Call `getContextSuggestions('.planning/STATE.md')` from intent-router Section 8
>    b. Receive the current lifecycle position and 2-3 ranked suggestions
>    c. Display the suggestions section in the dashboard output:
>    ...
>    - If no suggestions available (degraded state): "Run `/legion:status` for orientation or `/legion:start` to begin a new project."

**Issue:** Function-call precondition not verified. Under 4.7 literalism: (1) "intent-router Section 8" exists only if `skills/intent-router/SKILL.md` is loaded — but the execution_context at L15-20 lists intent-router as always-loaded, whereas Step 0 L40-47 is conditional skill loading that does NOT include intent-router. Discrepancy. (2) `getContextSuggestions('.planning/STATE.md')` is a symbolic function call — it does not exist as executable code; 4.7 must "simulate" it by reading intent-router's Section 8 prose. If Section 8 is missing, malformed, or renamed, the behavior is undefined. (3) Graceful degradation at L300-304 says "skip silently" for three failure modes but still expects the `## Suggested Next Actions` heading at L282 to render — should the whole section omit on degradation, or render with the fallback message at L298? The two rules disagree.

**Remediation sketch:** Add a precondition check at the top of Step 5b: "Verify `skills/intent-router/SKILL.md` is loaded and contains a Section 8 with a `getContextSuggestions` subsection specifying input/output schema. If missing: skip Step 5b entirely (no heading rendered) — do not emit a partial section. If loaded: invoke per intent-router Section 8 schema." Resolve the degradation conflict: "On any degradation (L300-304 conditions), omit the `## Suggested Next Actions` heading entirely. Do not render the fallback message — the rest of the dashboard provides orientation."

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-074 — P2, Underspecified Intent (suspected)

**Lines 28-48**

> <process>
> DRY-RUN MODE (deterministic, no side effects)
>    - If `$ARGUMENTS` contains `--dry-run`, DO NOT write files, spawn agents, commit, or perform external side effects.
>    ...
>    - Stop after reporting.
>
> 0. CONDITIONAL SKILL LOADING (context budget)
>    Load optional skills only when their inputs exist:
>    ...
> 1. CHECK PROJECT EXISTS

**Issue:** Step-numbering and intent-ordering defects. (1) "DRY-RUN MODE" at L29 has no numeric prefix. L40 then jumps to "0." and L48 to "1.". Under 4.7 literalism this may be interpreted as "do DRY-RUN MODE first always" (which is partially correct, but the file's intent is "check dry-run flag, then load skills, then check project"). 4.7 may also treat the unnumbered block as unordered scaffolding and skip to step 0. (2) The command's intent (what DONE looks like) is spread across L8-13 (<objective>) and Step 6 DISPLAY NEXT ACTION (L306-312) — no upfront statement of "the command is done when the dashboard is displayed AND next-action text is printed." Peer of LEGION-47-070 (start.md intent-front-loading) and LEGION-47-013 (plan.md).

**Remediation sketch:** (a) Renumber: make the dry-run handling `Step 0` (currently unnumbered), conditional skill loading `Step 0.5` or folded into Step 0, and re-index downstream (1 → check project exists stays as 1). (b) Add to <objective>: "DONE WHEN both: (a) the dashboard block (Step 4) is rendered; (b) a next-action line matching one of branches a-g in Step 5 is printed OR, if no branch matched, a fall-through diagnostic. If Step 2 cannot read PROJECT.md, stop at Step 1 and emit the 'No Legion project found' message."

**Remediation cluster:** `intent-front-loading`
**Effort estimate:** small

---

## LEGION-47-075 — P2, Prohibitive Over-Reliance (suspected)

**Lines 30, 185, 196-197, 219**

> - If `$ARGUMENTS` contains `--dry-run`, DO NOT write files, spawn agents, commit, or perform external side effects.
> ...
> Omit this section entirely. Do NOT show a placeholder, suggestion, or "no memory" message.
> ...
> If `.planning/board/` does not exist or contains no meeting directories: Omit this section entirely. Do NOT show a placeholder.
> ...
> If github_metadata_available is false: Omit this section entirely. Do NOT show a placeholder.

**Issue:** Four "DO NOT" / "Do NOT" prohibitions cluster the rendering rules. All four defend a closed set (render or omit — two choices) so they're not pure CAT-5; however, the three omit-section rules at L185, L196-197, L219 are identical in intent and could be stated once positively. Under 4.7 literalism, a reader may interpret "Omit ... Do NOT show a placeholder" as two distinct actions (omit the heading AND also avoid emitting a separate placeholder message somewhere else) — the double negation risks defensive rendering of an empty heading. CAT-5 range is P2-P3; suspected P2.

**Remediation sketch:** Add a top-of-file rendering rule: "Section rendering policy — for every section in the dashboard, render the section only if the 'include' predicate is true. If false: omit the entire section including the H2 heading. Never render an empty section, a placeholder, or a 'no X available' message. The include predicates are listed per section." Then simplify each site: L185 → `include: memory_available && record_count > 0`; L196 → `include: board_dir_exists && meeting_count > 0`; L219 → `include: github_metadata_available`.

**Remediation cluster:** `prohibitive-to-positive`
**Effort estimate:** small

---
