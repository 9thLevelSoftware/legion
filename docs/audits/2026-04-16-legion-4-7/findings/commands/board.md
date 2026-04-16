# Audit Findings — commands/board.md

**Audited in session:** S03
**Rubric version:** 1.0
**File layer:** command
**File length:** 333 lines
**Total findings:** 3 (0 P0, 0 P1, 2 P2, 1 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-016 — P2, Open-Set Interpretation (confirmed)

**Lines 45-51**

> Use AskUserQuestion:
> ```
> question: "What topic should the board deliberate on?"
> options: []
> ```
> (free-text entry — no fixed options)
> Store the user's response as the topic.

**Issue:** AskUserQuestion is invoked with an empty `options` array. Per CLAUDE.md the tool requires user-facing questions to use AskUserQuestion, and the tool contract requires options. Under 4.7 literalism the agent will either (a) reject the call (empty options is invalid input), (b) inject default options like "Cancel", or (c) escape AskUserQuestion entirely and prompt in raw text — all three violate intent. The parenthetical "free-text entry — no fixed options" admits the contract violation but does not resolve it. Confirmed as the same anti-pattern observed in commands/advise.md L155-160.

**Remediation sketch:** Replace with two-step flow: AskUserQuestion with closed options "Provide a topic now" / "Cancel"; if Provide, capture topic via the adapter's text-input primitive (not AskUserQuestion). Document in adapter spec which primitive handles free-text input. Apply consistently with the parallel fix in advise.md (LEGION-47-012).

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-017 — P2, Open-Set Interpretation (confirmed)

**Lines 76, 79-85, 89**

> Select top 5–7 candidates from diverse divisions as board candidates
> ...
> question: "Confirm board composition for: {topic}"
> options:
>   - label: "Recommended slate" — {agent1}, {agent2}, {agent3}, {agent4}, {agent5}
>   - label: "Custom composition" — Enter agent IDs manually
> ...
> If "Recommended slate": use the 5 recommended agents as board members

**Issue:** Two issues compound here. (1) The candidate pool is "5–7" (line 76) but the slate option lists exactly 5 agents and the resolution rule (line 89) hard-codes 5. The 6th and 7th candidates are unreachable through the option set. Under 4.7 literalism the slate-construction step will pick 5 deterministically (because the option literal lists 5 placeholders), making the upper bound dead. (2) The two-option AskUserQuestion has no closure language — 4.7 may invent "Modified slate" or "Restart selection" options. Confirmed open-set anti-pattern matching the user's reported failure class.

**Remediation sketch:** Reconcile to a fixed count (5 recommended) or extend the slate literal to "{agent1}..{agentN}" with N derived from the candidate count. Add an explicit option set: "Recommended slate" / "Custom composition" / "Show alternative slate (next-ranked candidates)". Add header: "Choose one of the three options below; do not propose alternatives."

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-018 — P3, Response Calibration Gap (suspected)

**Line 126**

> Collect all results; treat non-response after timeout as ABSTAIN with note

**Issue:** Timeout duration is unspecified. Under 4.7 literalism the dispatcher will pick a timeout (5s? 60s? 5min?) per run, producing inconsistent ABSTAIN counts and undermining vote integrity. A short default could systematically bias the board toward ABSTAIN; a long default could stall MEET mode.

**Remediation sketch:** Specify the timeout explicitly — e.g., "treat non-response after 180 seconds as ABSTAIN, with note 'agent timed out — original prompt logged for replay'." Or delegate to adapter.timeout_assessment with a documented default in the adapter spec.

**Remediation cluster:** `response-calibration`
**Effort estimate:** small

---

## Category Coverage Notes

- **CAT-2 (Ambiguous Triggers):** Step 0 conditional skill loading uses explicit prerequisites (`.planning/memory/` exists, `gh auth status` succeeds). Mode parsing has explicit fallback (line 41). Clean.
- **CAT-3 (Underspecified Dispatch):** Lines 120-126 parallel dispatch has explicit adapter-capability check, model field, and name pattern. The "issue all agent spawns simultaneously" semantics is unambiguous. Clean.
- **CAT-4 (Underspecified Intent):** `<objective>` block front-loads goal. Each step has clear purpose.
- **CAT-5 (Prohibitive Over-Reliance):** Line 282 "Review mode does not write a decision record or commit. It is informational only." defends a closed boundary (review vs. meet behavior). Retained.
- **CAT-6 (Implicit Preconditions):** Step 1 has explicit STATE.md existence check with stop-message; Step 2 has agent-registry lookup. Clean.
- **CAT-7 (Maximalist Persona Language):** N/A — command file.
- **CAT-8 (Unstated Acceptance Criteria):** Each phase has explicit output (vote tally, resolution text, decision record). Clean.
- **CAT-10 (Authority Ambiguity):** ESCALATED tie escalates to user (line 178, 315-323) explicitly. Decision record write is autonomous within `.planning/board/` scope. Clean.
