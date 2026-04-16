# Audit Findings — commands/learn.md

**Audited in session:** S03
**Rubric version:** 1.0
**File layer:** command
**File length:** 249 lines
**Total findings:** 3 (0 P0, 0 P1, 2 P2, 1 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-028 — P2, Ambiguous Triggers (confirmed)

**Lines 70-80**

> **Pattern**: A reusable approach that works well
> - Signals: "always", "use", "prefer", "works well", "best practice", positive framing
>
> **Pitfall**: A mistake or problem to avoid
> - Signals: "don't", "never", "avoid", "causes", "breaks", "watch out", negative framing
>
> **Preference**: A team or project convention or choice
> - Signals: "we use", "prefer X over Y", "convention", "standard", "our approach"

**Issue:** Classification triggers are keyword lists with two defects. (1) Overlap: `"prefer"` appears in Pattern signals (line 71) AND Preference signals (line 79). A lesson containing "prefer" alone matches both, and the command does not specify a tie-break. 4.7 literalism picks the first-listed type (Pattern) deterministically, which systematically misclassifies Preferences written with "prefer" instead of "prefer X over Y". (2) The "positive framing" / "negative framing" signals are not operational — there is no classifier for framing polarity at the token level. Confirmed because the failure mode is observable: a lesson like "I prefer Tailwind" will be classified as Pattern, not Preference. Relates to the S02c cross-cut: keyword-based triggers without a closed, authoritative registry; unlike the intent-teams.yaml case, here the registry is inlined in prose, but still suffers overlap.

**Remediation sketch:** Resolve overlap: move `"prefer"` to Preference-only and require Pattern to match one of its non-overlapping tokens. Delete "positive framing" / "negative framing" — they are not implementable. Add a precedence rule: "If a lesson matches multiple types, classify as the most specific: Preference > Pitfall > Pattern." Document the precedence in a comment and let the user-confirmation step at lines 82-90 remain as a safety net.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---

## LEGION-47-029 — P2, Open-Set Interpretation (confirmed)

**Lines 82-90, 143**

> Present classification via adapter.ask_user:
> "I classified this as a **{type}**. Correct?"
> Options:
> - "Correct" — "Save as {type}"
> - "It's a pattern" — "Reusable approach that works"
> - "It's a pitfall" — "Mistake or problem to avoid"
> - "It's a preference" — "Team/project convention"
> ...
> If "Yes": prompt for the next lesson text and return to Step 4

**Issue:** Two defects. (1) Lines 82-88 present four options but one of the three type-specific options always duplicates the "Correct" option — whichever type was classified at line 82 has two selectable paths ("Correct" and "It's a {classified_type}"). Under 4.7 literalism this is ambiguous (which does the agent pick? which does the user pick?), and the tool call is internally inconsistent. (2) Line 143's "prompt for the next lesson text" has no AskUserQuestion wrapper despite line 246's self-claim that "All user-facing questions use adapter.ask_user (AskUserQuestion tool)". Confirmed as an open-set / free-text anti-pattern (same class as advise.md LEGION-47-012 and board.md LEGION-47-016). Confirmed also because line 246 explicitly advertises the invariant that line 143 violates.

**Remediation sketch:** (1) Collapse the four options to three distinct alternatives: "Confirm: {classified_type}" / "No — pick a different type" / "Cancel" — on "No", follow with a second AskUserQuestion whose options are the three types minus the one just rejected. (2) For line 143: document the adapter's free-text primitive and call it (not AskUserQuestion), OR convert to a two-step flow matching the pattern in the other files' remediations (AskUserQuestion to start; adapter text-input to capture).

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-030 — P3, Response Calibration Gaps (suspected)

**Lines 94-99**

> a. **Tags**: Extract relevant keywords from the lesson text
>    - Technical terms (e.g., "migrations", "auth", "API", "CSS")
>    - Domain terms (e.g., "testing", "deployment", "design")
>    - Generate 2-5 tags
> ...
> c. **Summary**: Generate a one-line summary (max 80 characters)

**Issue:** Tag extraction instruction is underspecified. "Technical terms" vs "domain terms" have no operational distinction — "API" could be either, and the examples overlap. Under 4.7 literalism tag sets for the same input will vary run-to-run, breaking `/legion:learn --recall` which scores by "exact tag match = 3 points" (line 160). Two runs recording the same lesson produce different tag sets, which then miss each other in recall. The 2-5 cap is good; the classification criteria are the gap. Suspected because the blast radius is bounded to recall-quality degradation (not correctness).

**Remediation sketch:** Drop the Technical/Domain split — it is descriptive only. Replace with: "Extract 2-5 tags. Each tag is one lowercase word, taken verbatim from the lesson text, at least 3 characters, not a stopword (a/an/the/is/are/it/in/on/to/of/for/and/or)." Drop the (e.g., ...) examples that imply a category split. Specify the summary constraint further: "Summary is the first 80 characters of the lesson, stopping at the nearest word boundary. Do not generate new phrasing."

**Remediation cluster:** `response-calibration`
**Effort estimate:** small

---

## Category Coverage Notes

- **CAT-1 (Open-Set Interpretation):** One finding (029). Other option sets reviewed: line 137-141 (record another — "Yes" / "Done") is closed binary in AskUserQuestion, OK; lines 226-231 (prune confirm) is closed binary, OK.
- **CAT-2 (Ambiguous Triggers):** One confirmed finding (028). Related to S02c cross-cut.
- **CAT-3 (Underspecified Dispatch):** N/A — this command does not dispatch agents.
- **CAT-4 (Underspecified Intent):** `<objective>` block (lines 8-13) front-loads goal. Each step has intent-first heading.
- **CAT-5 (Prohibitive Over-Reliance):** No clusters of "Do NOT". Step 10.b defends correctness boundary (line 225-231). No finding.
- **CAT-6 (Implicit Preconditions):** Directory existence checks at lines 55-59 are explicit. Step 7 recall targets all enumerated with "if exists" guards (lines 149-154). No finding.
- **CAT-7 (Maximalist Persona):** N/A — not a persona file.
- **CAT-8 (Unstated Acceptance Criteria):** Each mode (record/recall/list/prune) ends with an explicit Display+Exit contract. Step 6 defines record's done-state. No finding.
- **CAT-9 (Response Calibration):** One finding (030). List/recall output templates are well-specified (lines 164-175, 189-210).
- **CAT-10 (Authority Ambiguity):** Line 248 ("The command never modifies phase files, STATE.md, or ROADMAP.md") is an explicit scope bound. No escalation surface. No finding.
