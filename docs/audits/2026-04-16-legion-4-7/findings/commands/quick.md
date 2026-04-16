# Audit Findings — commands/quick.md

**Audited in session:** S04
**Rubric version:** 1.0
**File layer:** command
**File length:** 315 lines
**Total findings:** 4 (0 P0, 1 P1, 3 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-041 — P1, Open-Set Interpretation of Closed Options (confirmed)

**Lines 81-93**

> Present recommendation to user via adapter.ask_user:
> "Which agent should handle this task?"
> Options:
> - "{top_agent_id} — {specialty}" (Recommended)
> - "{second_agent_id} — {specialty}"
> - "No agent — run autonomously"
> e. If user selects "Other": accept a custom agent ID from user input
> - Validate the ID exists in agent-registry Section 1

**Issue:** Structural contradiction. Step 3.d enumerates exactly three options (top, second, autonomous). Step 3.e references an "Other" branch that is never offered in the 3.d option list. 4.7 reading the AskUserQuestion contract strictly cannot reach 3.e — the tool returns one of the three provided options. Three failure modes: (a) 4.7 silently drops the 3.e branch, (b) 4.7 invents a fourth "Other" option to reach 3.e (CAT-1 proper), (c) 4.7 accepts free text in the user's response even though no option permits it. Additionally the 3.d option set has em-dash prose pairs and no closure framing. P1 because agent selection is the load-bearing decision in `/legion:quick` — a failure here produces wrong-agent execution on every run. User-facing high-traffic gate, same severity class as the build.md L168 finding (LEGION-47-018) from S03.

**Remediation sketch:** Add a fourth "Other — pick a different agent" option to the 3.d list. On selection, use a second AskUserQuestion with the full agent-registry Section 1 ID list chunked (AskUserQuestion supports ~10 options; paginate by division). Delete the dangling 3.e reference or tie it explicitly to the new fourth option. Wrap 3.d in an explicit AskUserQuestion tool invocation with closure.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-042 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 178-184**

> Use adapter.ask_user: "Commit the changes from this quick task?"
> Options:
> - "Yes — commit with conventional message" (Recommended)
> - "No — leave uncommitted"

**Issue:** Two-option set with em-dash prose format, no closure. Matches the repeating failure pattern across S03/S04 (LEGION-47-031, -034, -035, -038). 4.7 may invent "Amend previous commit" or "Stage but don't commit".

**Remediation sketch:** Wrap in explicit AskUserQuestion with two items plus closure: "Exactly two valid responses. Do not propose a third."

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-043 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 254-265**

> "Review found blocking issues. How to proceed?"
> Options:
> - "Fix and retry" — "Apply reviewer's suggestions, then re-review"
>   → Re-spawn the original agent ...
> - "Proceed anyway" — "Create PR with known issues noted"
>   → Continue to Step 9 ...
> - "Abort" — "Stop here, I'll fix manually"

**Issue:** Three options with em-dash descriptions and inline action notes (arrow-prefixed). The arrow notes mix AskUserQuestion option metadata with command-side branching logic — 4.7 may treat the `→` lines as part of the option text. No closure framing. Gate sits on the fix-mode review-fail critical path; a mis-selection here either ships broken code (Proceed anyway) or silently aborts.

**Remediation sketch:** Wrap in explicit AskUserQuestion with three items; move arrow lines into a separate "Branch handling" subsection indexed by the returned option string. Example: `match user_choice: "Fix and retry" => re-spawn agent...`.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-044 — P2, Ambiguous Triggers

**Lines 188-194**

> Determine commit type from task description:
> - FIX_MODE or task mentions "fix", "bug", "repair" -> fix(legion)
> - Task mentions "test", "spec" -> test(legion)
> - Task mentions "doc", "readme", "comment" -> docs(legion)
> - Task mentions "refactor", "clean", "reorganize" -> refactor(legion)
> - Default -> feat(legion)

**Issue:** Keyword-substring dispatch without precedence tiebreak. Task description "refactor the test for the doc bug fix" matches fix, test, doc, AND refactor. 4.7 picks first-listed deterministically, which means many reasonable tasks are mis-classified (e.g., "fix the test" → fix, not test, arguably wrong). Same defect class as S02c intent-teams cross-cut and LEGION-47-028 (learn.md signal-keyword overlap).

**Remediation sketch:** Add explicit precedence rule: "Evaluate in this order; use the first match: FIX_MODE → fix; then test; then docs; then refactor; else feat." Alternatively, pass the task description to a bounded classifier sub-question via AskUserQuestion when two or more keywords match, letting the user pick.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---
