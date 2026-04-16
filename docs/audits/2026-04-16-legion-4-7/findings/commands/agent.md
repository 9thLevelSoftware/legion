# Audit Findings — commands/agent.md

**Audited in session:** S03
**Rubric version:** 1.0
**File layer:** command
**File length:** 119 lines
**Total findings:** 2 (0 P0, 0 P1, 2 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-014 — P2, Open-Set Interpretation (confirmed)

**Lines 47-49**

> Confirm via adapter.ask_user:
>   "I'll create a {division} agent — '{suggested-name}'. Specialty: {description}. Correct, or would you like to adjust?"
> If user adjusts: update inferred values and re-confirm

**Issue:** The prompt is phrased as natural-language question with no enumerated option set. Under 4.7 literalism the AskUserQuestion call requires explicit options; without them the agent will either invent options ("Yes / No / Adjust") or render the prompt as raw text (violating CLAUDE.md's mandate that all user-facing questions go through AskUserQuestion). The "adjust" branch is undefined — what does the user adjust? Just the name? Division? Specialty? All three? 4.7 will pick one interpretation per run. Confirmed: matches the open-set anti-pattern (binary-feeling prompt with no closure or explicit choice set). The same pattern repeats in stages 4-5 ("Confirm summary via adapter.ask_user before proceeding", lines 58, 64).

**Remediation sketch:** Replace with explicit AskUserQuestion options: "Looks correct — create this agent" / "Adjust the name only" / "Adjust the division only" / "Adjust the specialty description only" / "Restart from scratch". On any adjust branch, follow up with a targeted free-text capture for that specific field. Apply the same fix to lines 58 and 64.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-015 — P2, Ambiguous Triggers (suspected)

**Lines 56, 113**

> - Skip questions already answered in Stage 1
> ...
> - The 3-stage conversation is adaptive — skip questions the user already answered

**Issue:** "Skip questions already answered" has no operational definition. Under 4.7 literalism the agent must decide: does a passing mention of a personality trait in Stage 1 count as having "answered" the personality question in Stage 2? Does inference from the one-liner count as an answer, or only an explicit user statement? Without rules, two runs of the same input will produce different question sets, and the user experience varies between "you keep asking what I already told you" and "you skipped the question I wanted to answer fully". The `adaptive` keyword in line 113 is itself a CAT-2 trigger — branching logic without explicit conditions.

**Remediation sketch:** Define answered-ness explicitly: a question is "answered" when (a) the user's prior text contains a complete sentence addressing the question's core noun (capability list / personality / hard rules), AND (b) the answer is at least 10 words. Otherwise ask. State this rule at the top of Stage 2. Optionally include an internal worked example.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---

## Category Coverage Notes

- **CAT-3 (Underspecified Dispatch):** Step 7 dispatches to agent-creator skill sections explicitly. No subagent fan-out.
- **CAT-4 (Underspecified Intent):** `<objective>` block front-loads goal at top.
- **CAT-5 (Prohibitive Over-Reliance):** Lines 79, 114, 117 contain "Do NOT proceed", "no partial state", "prevents partial state" — each defends a closed correctness boundary (validation must pass before file write). Per rubric, retained.
- **CAT-6 (Implicit Preconditions):** Line 110 "Update STATE.md: add a line under Recent Decisions" assumes a `Recent Decisions` section exists in STATE.md. Close-call but the create-section-if-missing semantics are inherited from the broader STATE.md update convention; not filed as a standalone finding to avoid duplication with cross-cut S17 work.
- **CAT-7 (Maximalist Persona Language):** N/A — command file.
- **CAT-8 (Unstated Acceptance Criteria):** Step 6 has explicit "all 8 checks must pass" gate; step 7 has file-existence verification. Clean.
- **CAT-9 (Response Calibration Gaps):** Step 4 capabilities prompt asks for "top 3-5 things" — bounded. Personality and rules prompts are open by design. Acceptable for conversational discovery.
- **CAT-10 (Authority Ambiguity):** This command writes to agents/ and CATALOG.md. Per CLAUDE.md authority matrix, custom agent creation is autonomous within scope. Authority boundary is implicit but consistent with command's purpose. Not flagged.
