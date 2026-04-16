# Audit Findings — CLAUDE.md

**Audited in session:** S02a
**Rubric version:** 1.0
**File layer:** root
**File length:** 225 lines
**Total findings:** 2 (0 P0, 0 P1, 2 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-001 — P2, CAT-6 Implicit Preconditions (suspected)

**Lines 64-66**

> [Legion Agents Index]|root: {AGENTS_DIR} (resolve via workflow-common-core Agent Path Resolution)
> |engineering:{engineering-ai-engineer.md,...}

**Issue:** The Dynamic Knowledge Index instructs the reader (line 62) to "use the `Read` tool to read their exact markdown file from the index below before generating any code, plans, or reviews" — but the index root is the placeholder `{AGENTS_DIR}` with only a parenthetical "(resolve via workflow-common-core Agent Path Resolution)". Under Claude 4.7 literalism, a reader may (a) attempt to `Read` the literal path `{AGENTS_DIR}/engineering/engineering-ai-engineer.md` and fail silently, or (b) give up on retrieval-led reasoning if `workflow-common-core` isn't in context. The precondition ("agent path resolution must already be loaded and understood") is assumed rather than verified.

**Remediation sketch:** State both the resolution rule inline AND the failure path. Example: "Resolve `{AGENTS_DIR}` by reading `skills/workflow-common-core/SKILL.md` first if not already loaded; if resolution yields no concrete path, stop and emit an `<escalation>` block of type `scope` rather than guessing."

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-002 — P2, CAT-2 Ambiguous Triggers (suspected)

**Lines 110-112**

> Marketing workflows activate when `/legion:plan` detects a marketing-focused phase (MKT-* requirements or marketing keywords). Campaign planning produces structured documents at `.planning/campaigns/`...
>
> Design workflows activate when `/legion:plan` detects a design-focused phase (DSN-* requirements or design keywords). Design system creation produces structured documents at `.planning/designs/`...

**Issue:** "marketing keywords" and "design keywords" are unenumerated triggers. The `MKT-*` / `DSN-*` requirement prefix is precise, but "keywords" is open-ended. Under 4.7 literalism, a reader deciding whether to activate these workflows may over-match (e.g., treating "branding" in any context as a design-workflow trigger) or under-match (missing synonyms not in a canonical list). This is primarily descriptive prose about `/legion:plan` behavior — exposure is limited to readers expected to reproduce the decision elsewhere.

**Remediation sketch:** Either (a) restrict the trigger to the `MKT-*` / `DSN-*` prefix and drop "or keywords", or (b) enumerate the exact keyword lists used by `intent-router` / `codebase-mapper`, or (c) cross-reference the config file that defines them (`.planning/config/intent-teams.yaml`) and explicitly state "see that file for the authoritative trigger list".

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---

## Category Coverage Notes

- **CAT-1 (Open-Set Interpretation):** No matches. The file itself is exemplary: line 7 is a strong CAT-1 remediation pattern (the `AskUserQuestion` mandate with "No exceptions" closure). Schema-style enumerations (e.g., `<escalation>` field values at lines 150-154, Escalation Types table at 161-170) are data-format specifications — not runtime decision prompts — so do not trigger CAT-1.
- **CAT-3 (Underspecified Dispatch):** N/A. CLAUDE.md is reference documentation, not a dispatch point.
- **CAT-5 (Prohibitive Over-Reliance):** "Do NOT output questions as raw text" (line 7) and "Never rationalize" (line 157) both defend closed decision boundaries and are preserved per the CAT-5 exception.
- **CAT-7 (Maximalist Persona):** N/A. This is not a persona file.
- **CAT-8 (Acceptance Criteria):** N/A. Not a workflow.
- **CAT-9 (Response Calibration):** N/A. Not an output-producing instruction.
- **CAT-10 (Authority Ambiguity):** The Authority Matrix (lines 114-172) IS the authority reference; it defines autonomous scope, approval scope, escalation format, and type enumeration with trigger table. No ambiguity.
