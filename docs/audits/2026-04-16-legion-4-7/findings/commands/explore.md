# Audit Findings — commands/explore.md

**Audited in session:** S03
**Rubric version:** 1.0
**File layer:** command
**File length:** 436 lines
**Total findings:** 4 (0 P0, 0 P1, 3 P2, 1 P3)
**Baseline commit:** audit-v47-baseline

**File scope note:** Heavy file (>200 lines, 8 H2 sections, 6+ code fences). Primarily an orchestration wrapper around the Polymath agent. The `<anti_patterns>` and decision-point blocks are structurally closed sets, so CAT-1 exposure concentrates at the command's own user-facing prompts (not at Polymath's choice output, which is delegated).

---

## LEGION-47-024 — P2, Open-Set Interpretation (confirmed)

**Lines 44-53**

> - Use adapter.ask_user with structured choices:
>   ```
>   "Which exploration mode fits your goal?"
>   → Crystallize (default): Transform a raw idea into a clear project concept
>     Onboard: Get familiar with an existing codebase through guided exploration
>     Compare: Evaluate multiple approaches side-by-side with decision capture
>     Debate: Explore a question from opposing viewpoints with winner tracking
>   ```
> - Store selected mode in exploration state as `mode: crystallize|onboard|compare|debate`

**Issue:** Mode selection uses `adapter.ask_user` with a decorative-arrow code block instead of an explicit AskUserQuestion options array. The four modes are a closed set (confirmed by the `mode: crystallize|onboard|compare|debate` restriction on line 52), but the presentation format uses Unicode arrow characters and indentation rather than the tool's `options` contract. Under 4.7 literalism the agent may (a) render the code block as literal text with arrows instead of selectable options, (b) infer options from the arrow prefix but miss the indented continuations, or (c) re-format into free text. The "Crystallize (default)" parenthetical adds further ambiguity: is there a default-selection behavior? Confirmed open-set presentation anti-pattern per the user's failure class.

**Remediation sketch:** Replace the code-block pseudo-menu with an explicit AskUserQuestion call: options exactly `["Crystallize", "Onboard", "Compare", "Debate"]` with the descriptions as option descriptions. Handle the "default" semantics separately — either drop the "(default)" label or auto-route empty input to Crystallize before invoking AskUserQuestion. Add header "Choose one of the four modes; do not propose alternatives."

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-025 — P2, Open-Set Interpretation (confirmed)

**Lines 59-62, 84-91, 303-307**

> ### Crystallize mode (default)
> - Display: "What are you exploring? Give me the raw idea — a sentence or two."
> - Wait for user's initial concept (this is the ONE open input — everything after is structured choices)
> ...
> ### Compare mode
> - Display: "What alternatives are you evaluating?"
> - Wait for user's input naming the concepts/approaches to compare
> ...
> ### Debate mode
> - Display: "What question or decision are you exploring?"
> - Wait for user's input describing the debate topic
> ...
> 3. Confirm transition:
>    - "Ready to run `/legion:start` with this crystallized concept?"
>    - Option 1: "Yes, start planning" → Transition to `/legion:start`
>    - Option 2: "Review the summary first" → Display again
>    - Option 3: "Explore a different idea" → Return to step 2

**Issue:** Two classes of anti-pattern compound here. (1) Lines 60, 84, 89: "Display: ...; Wait for user's input" is a pure free-text capture with no AskUserQuestion wrapper, directly violating CLAUDE.md's "every user-facing question MUST use AskUserQuestion. No exceptions." Line 61 admits the pattern ("this is the ONE open input") but the Compare and Debate modes repeat the same free-text capture, contradicting the claimed restriction to one open input. (2) Lines 303-307's "Option 1/2/3" enumeration is not wrapped in an AskUserQuestion invocation — it is prose description of what the options are, not a tool call. Under 4.7 literalism the command will render these as raw text. Confirmed.

**Remediation sketch:** For free-text modes (Crystallize/Compare/Debate openings): document that they require an adapter text-input primitive (not AskUserQuestion) and specify it explicitly, OR convert to two-step AskUserQuestion ("Provide topic now" / "Cancel") followed by the free-text capture. For lines 303-307: replace "Option 1/2/3" prose with explicit AskUserQuestion tool invocation with three options, each tagged with its description.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-026 — P2, Ambiguous Triggers (confirmed)

**Lines 156-160**

> ### Intervention triggers
> Only intervene if:
> - Polymath asks an open-ended question (violation) → Correct: "Polymath, use structured choices"
> - User is stuck for >60 seconds → Offer: "Need help deciding?"
> - Exchange count reaches 7 without decision point → Remind Polymath

**Issue:** The three triggers have no operational test. (a) "Polymath asks an open-ended question" — there is no classifier specified that distinguishes open-ended from structured. Under 4.7 literalism the command must decide, per turn, whether Polymath's output qualifies; two runs with identical Polymath output may diverge on intervention. (b) "User is stuck for >60 seconds" — no CLI adapter surfaces per-turn wall-clock time to the orchestrator; the command has no way to observe this condition. This is a CAT-2 trigger referencing unobservable state (implicit precondition — CAT-6 also applies, but the primary gap is trigger detectability). (c) "Exchange count reaches 7" — only this trigger is observable, assuming Polymath reports exchange counts, but the reporting contract is not specified. Confirmed because failure mode is clear: the command will either intervene inconsistently or never intervene.

**Remediation sketch:** For (a): define open-ended as "Polymath's final output turn ends with a question mark and does not contain a markdown list with at least 2 items prefixed by `[A]` / `[B]` / `-`"; apply as a string check. For (b): delete the timer trigger — orchestrator cannot observe it. If user-stuck handling is needed, delegate to the CLI adapter via a documented adapter primitive. For (c): define how exchange counts are reported — Polymath includes a literal `Exchange N of 7` marker in each turn's output; command counts the highest N seen.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** medium

---

## LEGION-47-027 — P3, Ambiguous Triggers (suspected)

**Line 63**

> - Validate: if concept is extremely vague (less than 5 words), ask for slightly more detail

**Issue:** "Extremely vague" is given an operational definition ("less than 5 words"), which is good, but the 5-word threshold has no stated rationale and "slightly more detail" is unbounded in the re-prompt. Under 4.7 literalism the agent will produce varying re-prompts — some may escalate to a full AskUserQuestion menu, others may output one line. The threshold of 5 also conflicts with the example inputs at lines 65-68, several of which are 5-9 words — putting inputs on the edge where the decision depends on exact tokenization. Suspected (not confirmed) because the behavior impact is minor: a marginal re-prompt does not derail the flow.

**Remediation sketch:** Specify the re-prompt: "If the concept has fewer than 5 whitespace-separated tokens, respond with exactly: 'Add one or two more details about the user, the problem, or the scope. Then continue.' Accept any non-empty follow-up." Or drop the word-count check — let Polymath's research phase surface vagueness.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---

## Category Coverage Notes

- **CAT-1 (Open-Set Interpretation):** Two confirmed findings (024, 025). Decision points at lines 162-196 (Mode-specific decision options with `[A]/[B]/[C]`) are Polymath-delegated output, not the command's direct prompts — any CAT-1 finding on those attaches to `agents/polymath.md` or `skills/polymath-engine/SKILL.md`. No finding here.
- **CAT-2 (Ambiguous Triggers):** Two findings (026, 027). The "marketing/design keyword" S02c cross-cut does not apply — this command does not dispatch on marketing/design keywords.
- **CAT-3 (Underspecified Dispatch):** Polymath dispatch (lines 93-129) passes a fully-specified prompt with CRITICAL RULES and mode-specific briefings. No finding.
- **CAT-4 (Underspecified Intent):** `<objective>` block at line 7-9 front-loads goal. Each process step has an intent-first heading. No finding.
- **CAT-5 (Prohibitive Over-Reliance):** `<anti_patterns>` block (lines 387-394) has six "Do NOT" items — each defends a closed correctness boundary (missing opening prompt, unbounded exchanges, open-ended questions, implicit transition, skipped persistence, command-override). Per rubric CAT-5 exception, all retained. Line 122 "NO OPEN-ENDED QUESTIONS" is a CRITICAL RULES item and also retained.
- **CAT-6 (Implicit Preconditions):** Pre-flight check (lines 22-38) verifies `.planning/PROJECT.md` and exploration-*.md files explicitly. No finding beyond what's covered in 026 (user-stuck timer).
- **CAT-7 (Maximalist Persona):** N/A — not a persona file.
- **CAT-8 (Unstated Acceptance Criteria):** Success indicators at lines 367-372 are checkboxes targeting a reviewer, not agent self-verification. Decision-point outcomes define done-state per mode (lines 198-285). No finding.
- **CAT-9 (Response Calibration):** Completion template (lines 347-365) specifies exact output shape. No finding.
- **CAT-10 (Authority Ambiguity):** No escalation surfaces — the command is advisory/read-only and delegates to Polymath. No finding.
