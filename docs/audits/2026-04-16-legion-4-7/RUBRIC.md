# RUBRIC.md — Legion v7.4.0 Audit Criteria

**Version:** 1.1 (2026-05-04)

## Changelog

- **v1.1 (2026-05-04)**: Added CAT-11 (Mechanical Contract Drift). Mechanical re-score pass against all 64 already-audited files; existing 10 prose categories not revisited.
- **v1.0 (2026-04-16)**: Initial rubric — CAT-1 through CAT-10 frozen.
**Source spec:** docs/superpowers/specs/2026-04-16-legion-4-7-audit-design.md
**Do not edit without bumping version AND flagging all files for re-scoring.**

---

## 4. Audit Rubric (10 Categories)

The rubric is the single source of truth for what constitutes a finding. It is frozen at Session 1 as `RUBRIC.md` v1.0. Any mid-audit revisions bump the version and require re-scoring of previously-audited files.

### CAT-1: Open-Set Interpretation of Closed Options

The confirmed failure class. Prompts that present a bounded decision space without explicit closure.

- **Detection**: prompt presents N discrete options (A/B, numbered list, menu) without explicit "these are the only valid choices" framing. Phrases like "choose between", "you can [option1] or [option2]", numbered lists where option N+1 is not prohibited.
- **Severity range**: P0–P1 (P0 in user-facing flows; P1 in internal dispatch)
- **Example anti-pattern**: `Ask the user: "Do you want to (A) rebuild from scratch or (B) refine the existing plan?"`
- **Remediation pattern**: `Ask the user exactly one question with exactly two options: A or B. Do not propose option C. Do not offer alternatives. Do not take any action until the user selects A or B.` Also: wrap in `AskUserQuestion` tool invocation per CLAUDE.md mandate.

### CAT-2: Ambiguous Triggers

Branching logic without explicit conditions.

- **Detection**: phrases like "when appropriate", "if needed", "as applicable", "when you think it's time", "if the user seems to want X".
- **Severity range**: P1–P2
- **Example**: `When appropriate, dispatch agents in parallel.`
- **Remediation pattern**: replace with concrete condition: `If the plan has 2+ tasks with no shared files_modified entries, dispatch those tasks as parallel agents in a single tool call. Otherwise, dispatch sequentially.`

### CAT-3: Underspecified Dispatch

Agent/tool invocation without when/why and fan-out criteria. Critical because 4.7 defaults to fewer subagents.

- **Detection**: references to `Agent` tool, `dispatch`, `spawn`, `parallel` without trigger conditions, fan-out rules, or justification.
- **Severity range**: P1 (P0 in core dispatch skills like `wave-executor`, `cli-dispatch`)
- **Example**: `Consider running QA-verification and code-review in parallel.`
- **Remediation pattern**: state all three of (a) when to dispatch, (b) why parallel is safe (no shared write targets), (c) how many to spawn in one call.

### CAT-4: Underspecified Intent

Procedures that describe HOW without WHY. Progressive clarification across turns is an explicit Anthropic anti-pattern.

- **Detection**: multi-step procedures listing steps without stating the goal or acceptance criteria upfront. Skills that describe mechanics without upfront intent. Deferred context ("I'll tell you more in step 3").
- **Severity range**: P1–P2
- **Example**: `Step 1: read PROJECT.md. Step 2: read ROADMAP.md. Step 3: generate phase plan.`
- **Remediation pattern**: front-load intent: `GOAL: produce a phase plan that (a) fits within 3 waves, (b) respects file-overlap constraints, (c) maps each requirement to exactly one plan task. To accomplish this: Step 1...`

### CAT-5: Prohibitive Over-Reliance

Inverse of CAT-1. Clusters of DO-NOT language where positive framing works better.

- **Detection**: clusters of "DO NOT" / "NEVER" / "do not attempt" in contexts not defending a closed set. Distinguish from CAT-1: if the DO-NOT defends a closed decision boundary, it stays; if it's a general taboo list, rewrite as positive instruction.
- **Severity range**: P2–P3
- **Example**: `DO NOT skip the verification step. DO NOT commit without reviewing. DO NOT use relative paths.`
- **Remediation pattern**: `Verify the change before committing by running <exact command>. Use absolute paths throughout.`

### CAT-6: Implicit Preconditions

Prompts assuming state without verification.

- **Detection**: references to "the plan file", "using the context from earlier", "the loaded state" without specifying path, source, or verification step.
- **Severity range**: P1 in orchestration skills, P2 elsewhere
- **Example**: `Read the plan file and execute the tasks.`
- **Remediation pattern**: `Read the plan file at the exact path .planning/phases/phase-<N>/plans/<plan-id>.md. If it does not exist, emit an escalation (severity: blocker, type: scope) and stop. Do not proceed with execution.`

### CAT-7: Maximalist Persona Language

Agent personality files with absolute behavioral language that 4.7 may now interpret as hard constraints.

- **Detection**: "You are obsessed with X", "You ALWAYS do Y", "You NEVER accept Z", "You relentlessly pursue...".
- **Severity range**: P2 default; P1 for agents with orchestration authority (`agents-orchestrator.md`, `polymath.md`, `testing-qa-verification-specialist.md`, and the `agent-creator` skill's template).
- **Example**: `You are OBSESSED with perfect code quality. You NEVER accept anything less than 100% test coverage.`
- **Remediation pattern**: soften to tendencies with explicit flexibility: `You strongly prefer rigorous code quality and comprehensive test coverage. When trade-offs are required (time pressure, scope constraints), you document what was skipped and why, and flag it as a follow-up item.`

### CAT-8: Unstated Acceptance Criteria

Workflows and skills without a defined "done" state.

- **Detection**: procedures without "acceptance criteria", "done when", or explicit output contract.
- **Severity range**: P1 (workflow skills), P2 (agents)
- **Example**: a skill that says "run the review loop" without defining what "complete" looks like.
- **Remediation pattern**: add explicit done-state: `This skill is complete when: (1) all findings have been written to REVIEW.md, (2) every P0 finding has a resolution status, (3) SUMMARY.md includes a Review Verdict section with 'ship' or 'hold'. If any of these are missing, the skill has not completed.`

### CAT-9: Response Calibration Gaps

Places expecting specific output shapes without stating them.

- **Detection**: output instructions without length/format hints; "summarize", "describe", "explain" with no bounds.
- **Severity range**: P2–P3
- **Example**: `Summarize the findings.`
- **Remediation pattern**: `Summarize findings in 3–5 bullet points, each starting with the finding ID. Total length under 200 words.`

### CAT-10: Authority Ambiguity

Escalation boundaries not clearly stated.

- **Detection**: places where an agent might need to escalate but the prompt doesn't reference the Authority Matrix or escalation protocol.
- **Severity range**: P1 (core execution skills), P2 (elsewhere)
- **Example**: `If you encounter a problem, stop and tell the user.`
- **Remediation pattern**: `If you encounter a decision outside your authority (see CLAUDE.md Authority Matrix), emit an <escalation> block per .planning/config/escalation-protocol.yaml with severity, type, decision, and context fields, then continue with other in-scope work.`

### CAT-11: Mechanical Contract Drift

A finding under CAT-11 exists when a file makes a claim that is mechanically falsifiable against a sibling artifact, and the claim is currently false.

This category differs from CAT-1 through CAT-10: detection is by running a check, not by matching prose patterns.

**Detection table:**

| File class | Mechanical claim | Falsification check |
|---|---|---|
| `settings.json` | conforms to schema | Ajv against `docs/settings.schema.json` |
| `docs/settings.schema.json` | every field is consumed somewhere | grep field name across `skills/`, `adapters/`, `commands/`, `tests/` |
| `docs/schemas/plan-frontmatter.schema.json` | every required field is in phase-decomposer template | parse template frontmatter, diff against schema's `required` |
| `skills/phase-decomposer/SKILL.md` (template section) | template emits valid frontmatter | extract template, validate against schema with Ajv |
| `commands/*.md` | if "spawn agent" present, `Agent(` invoked OR `mode: inline-persona` declared | regex + frontmatter parse |
| `commands/*.md` `<execution_context>` | every listed path exists | filesystem check |
| `commands/*.md` | command appears in `workflow-common-core` canonical map | parse map, diff command list |

**Severity rubric:**

- **P0:** invalid contract that causes runtime failure on common path (e.g., bad PLAN.md crashes wave-executor; explore.md fails to dispatch Polymath).
- **P1:** invalid contract that causes silent wrong behavior (e.g., schema accepts garbage because `additionalProperties: true`).
- **P2:** drift that is currently survivable due to forgiving consumers (e.g., consumer reads a field with a fallback).
- **P3:** documentation-level drift only.

**Re-scoring policy:**

When CAT-11 is added mid-audit, all already-audited files get a CAT-11-only pass — not a full re-audit. The pass is mechanical: run the checks above, record findings. Files with zero CAT-11 hits get a one-line note in their findings file. Files with CAT-11 hits get appended findings (LEGION-47-NNN ID continues from current max). Existing 10-category findings are NOT revisited.

**Overlap policy:**

When a CAT-11 finding overlaps an existing CAT-N finding (e.g., a missing skill load is both CAT-6 implicit precondition and CAT-11 missing-loader), both findings stay. Different rubric lenses, not duplicates.

---

## 5. Severity Scale

| Severity | Definition |
|----------|------------|
| **P0 — Critical** | Prompt is empirically broken on 4.7 OR virtually guaranteed to cause wrong-path execution in common usage. User-facing, high-traffic, blocks workflows. |
| **P1 — High** | Clear structural risk matching a documented 4.7 anti-pattern. Not guaranteed to fail but likely in edge cases. Touches core orchestration. |
| **P2 — Medium** | Minor ambiguity, imprecise language, or stylistic issue. Most agent persona findings land here. |
| **P3 — Low / Informational** | Documentation/style notes. No behavioral risk. |
