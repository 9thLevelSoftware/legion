# Audit Findings — commands/advise.md

**Audited in session:** S03
**Rubric version:** 1.0
**File layer:** command
**File length:** 203 lines
**Total findings:** 3 (0 P0, 1 P1, 1 P2, 1 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-011 — P1, Open-Set Interpretation (confirmed)

**Lines 74-84**

> d. Present recommendation to user via adapter.ask_user:
>    "Which agent should advise on this topic?"
>    Options:
>    - "{top_agent_id} — {specialty}" (Recommended)
>    - "{second_agent_id} — {specialty}"
>
> e. If user selects "Other": accept a custom agent ID from user input

**Issue:** The AskUserQuestion options block in step (d) lists exactly two agent options without any closure language ("these are the only choices") and without an explicit "Other" option in the option set. Step (e) then handles an "Other" branch that was never offered to the user. Under 4.7 literalism this is a confirmed open-set anti-pattern: the bounded option set is presented without explicit closure, the "Other" branch is unreachable through the options shown, and a 4.7 interpreter may either (a) invent a third option to expose the "Other" path, (b) silently drop the "Other" handler, or (c) loosen the AskUserQuestion call to free text. All three diverge from intent.

**Remediation sketch:** Add "Other (specify agent ID)" as an explicit third option in the AskUserQuestion call so step (e) becomes reachable. Alternatively, drop step (e) and lock the choice to the two recommended candidates. State in the call header: "Choose one of the three options below; do not propose alternatives." Wrap in the AskUserQuestion tool invocation per CLAUDE.md mandate.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-012 — P2, Open-Set Interpretation (confirmed)

**Lines 155-160**

> - Use adapter.ask_user with a free-text prompt:
>   "What's your follow-up question?"
>   Options:
>   - "Type your question" (with description: "The same advisor will respond")
>   - "End session" (with description: "Close the advisory session")

**Issue:** This pattern misuses AskUserQuestion: "Type your question" is not a selectable option, it is a label for free-text capture. Under 4.7 literalism the agent will either render the two options as actual choices (forcing the user to pick a label) or escape the AskUserQuestion contract entirely and prompt in raw text — which violates the CLAUDE.md mandate that all user-facing questions use AskUserQuestion. The "free-text prompt" hint in the comment conflicts with the "Options:" enumeration in the spec. Confirmed because the pattern matches the documented open-set failure class (bounded options with one option being a free-text escape hatch).

**Remediation sketch:** Replace with two-step flow: first AskUserQuestion with closed options "Continue with a follow-up" / "End session"; if "Continue", then a separate prompt that explicitly captures free-text input via the adapter's text-input primitive (or document that AskUserQuestion does not support free-text capture and use a different surface). Do not mix labeled-option and free-text semantics in one call.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-013 — P3, Response Calibration Gap (suspected)

**Lines 161-166**

> Spawn the SAME agent again with updated prompt that includes:
> - Original personality
> - Original advisory context
> - "## Follow-Up Question\n{user's follow-up question}"
> - "Review your previous advice (summarized below) and address this follow-up:\n{brief summary of prior advice}"

**Issue:** "brief summary of prior advice" is unbounded — no length cap, no structure, no extractor specified. Under 4.7 literalism the prompt-constructor agent will produce summaries of widely varying length and shape across runs, leading to inconsistent follow-up context. A summary so long it reproduces the prior response defeats the point; one so short it omits key recommendations breaks continuity.

**Remediation sketch:** Specify the summary contract: "extract the Recommendations section verbatim plus the first sentence of each other section, capped at 400 words. If the prior response lacked a Recommendations section, include the entire prior response verbatim."

**Remediation cluster:** `response-calibration`
**Effort estimate:** small

---

## Category Coverage Notes

- **CAT-2 (Ambiguous Triggers):** Not triggered. The command does not gate on marketing/design keywords; topic parsing is a free-string passed to the agent-registry recommendation algorithm.
- **CAT-3 (Underspecified Dispatch):** Step 5 specifies model, name, and read-only mode explicitly. The CLI-capability fork at lines 130-131 (read_only_agents present vs. absent) is explicit. Clean.
- **CAT-4 (Underspecified Intent):** Front-loaded by `<objective>` block at top. Each step has a stated purpose.
- **CAT-5 (Prohibitive Over-Reliance):** Lines 114-119 cluster two "do not" statements but each defends a closed boundary (read-only mode, no sugarcoating). Per rubric, DO-NOTs that defend a closed decision boundary stay. Not a finding.
- **CAT-6 (Implicit Preconditions):** Step 4b has explicit path resolution and missing-file error. Step 2 explicitly handles missing PROJECT.md. Clean.
- **CAT-7 (Maximalist Persona Language):** N/A — this is a command, not a persona file.
- **CAT-8 (Unstated Acceptance Criteria):** Each step has either an exit condition or a clear next-step transition. Clean.
- **CAT-10 (Authority Ambiguity):** Read-only enforcement is explicit; advisory mode does not mutate state and this is stated at line 200-202. Clean.
