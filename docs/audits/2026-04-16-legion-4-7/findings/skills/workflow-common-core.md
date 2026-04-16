# Audit Findings — skills/workflow-common-core/SKILL.md

**Audited in session:** S06
**Rubric version:** 1.0
**File layer:** skill
**File length:** 163 lines
**Total findings:** 3 (3 P2)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-093 — P2, CAT-1 Open-Set Interpretation of Closed Options (confirmed)

**Lines 28-43**

> **CRITICAL**: When commands or skills reference `adapter.ask_user`, `Use adapter.ask_user`, or instruct you to ask the user a question with structured choices, you MUST use the `AskUserQuestion` tool. Do NOT output questions as raw text and wait for a reply. The `AskUserQuestion` tool provides structured selection UI (arrow keys + Enter) which is the intended interaction model for all Legion commands.
>
> For Claude Code, `adapter.ask_user` maps to:
> ```
> AskUserQuestion(questions: [{
>   question: "Your question here",
>   options: [
>     {label: "option-1", description: "Description of option 1"},
>     {label: "option-2", description: "Description of option 2"}
>   ]
> }])
> ```
>
> This applies to ALL question prompts in ALL commands — confirmation gates, mode selection, workflow preferences, and any other structured choice.

**Issue:** Inheriting S03 cross-cut. This is the canonical declaration of the user-interaction contract in the always-load core skill. "ALL question prompts in ALL commands" is absolute; `AskUserQuestion` requires non-empty `options` per its tool schema (documented in S03). But many commands capture free-text input (project vision, phase descriptions, task natural-language inputs) where no bounded options exist. Readers of this file are instructed to route free-text captures through `AskUserQuestion`, which either (a) forces synthetic fake options the user must navigate past, or (b) causes silent tool-schema errors when `options: []` is rejected. No `adapter.prompt_free_text` primitive exists to resolve this. This finding inherits the S03/S04/S05 confirmed status and is the root-cause declaration of the cross-cut.

**Remediation sketch:** Introduce `adapter.prompt_free_text` as a sibling primitive. Split this rule into (1) "For bounded-choice questions (enumerable options): use adapter.ask_user / AskUserQuestion"; (2) "For free-text captures (project description, task prompts): use adapter.prompt_free_text / raw stdin". Document which commands fall into each category. Ship before next release to eliminate the contract defect.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-094 — P2, CAT-6 Implicit Preconditions (suspected)

**Lines 68-78**

> ### Mode Profile Resolution
>
> After resolving `control_mode` from settings (default: `"guarded"`), load the corresponding profile:
>
> 1. Read `.planning/config/control-modes.yaml`
> 2. Look up `profiles[control_mode]` to get the flag set
> 3. If file missing or mode not found: fall back to `guarded` profile hardcoded as:
>    - `authority_enforcement: true`, `domain_filtering: true`, `human_approval_required: true`, `file_scope_restriction: false`, `read_only: false`
> 4. Pass resolved profile to authority-enforcer and wave-executor integration points
>
> The resolved profile is a set of 5 boolean flags: `authority_enforcement`, `domain_filtering`, `human_approval_required`, `file_scope_restriction`, `read_only`.

**Issue:** Precondition verification is missing from Step 4. "Pass resolved profile to authority-enforcer and wave-executor integration points" assumes those integration points exist and accept the 5-flag schema. If either downstream consumer reads only a subset of flags or expects different keys, silent mis-configuration follows. Additionally, Step 2 ("Look up `profiles[control_mode]`") does not specify whether the key lookup is case-sensitive, nor what happens if the profile exists but is missing one of the 5 required flags (partial profile). These three gaps (downstream contract, case sensitivity, partial profile) are Implicit Preconditions under CAT-6.

**Remediation sketch:** Specify (1) key lookup is case-sensitive and must match exactly; (2) partial profiles are rejected with warn+fallback to hardcoded guarded; (3) the 5-flag schema is the contract — downstream consumers (authority-enforcer, wave-executor) MUST read all 5 or none; reference the config schema if one exists. Add a one-line precondition verifier: before passing the profile, assert all 5 flag keys exist and are boolean.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-095 — P2, CAT-4 Underspecified Intent (suspected)

**Lines 124-132**

> ## Context Budget Ceiling (Core)
>
> Execution-context budgets (always-load skills only):
> - `build`: soft 180 KB, hard 225 KB
> - `plan`: soft 180 KB, hard 225 KB
> - `review`: soft 180 KB, hard 225 KB
> - `status`: soft 120 KB, hard 150 KB
>
> Release checks enforce hard ceilings and print telemetry for every command. Agent line-count remains telemetry, not a gate.

**Issue:** Specified HOW (budgets in KB) but not WHY or what action is taken. "Soft" vs "hard" ceilings are undefined — does soft trigger warning, pruning, gate failure? What happens when a command hits 181 KB? 4.7 reading this finds no decision procedure. "Release checks enforce hard ceilings" defers enforcement to an unspecified external process. This is textbook CAT-4: mechanics without intent. The 7 other commands (quick, portfolio, milestone, agent, advise, board, retro, ship, learn, update, validate — 11 in the table L105-122) have no budget entries, so 4.7 has no rule for whether they have budgets, are unlimited, or inherit something.

**Remediation sketch:** Front-load goal: "GOAL: prevent context-overflow crashes during command execution. Budgets are measured at command-load time (sum of always-load skill file sizes). Behavior: soft ceiling triggers telemetry warning 'command at X% of soft budget'; hard ceiling causes command abort with user-facing error 'Context budget exceeded — open an issue'. Commands not listed inherit: soft 120 KB / hard 150 KB." Define where budgets are enforced (which file, which check).

**Remediation cluster:** `intent-front-loading`
**Effort estimate:** small

---
