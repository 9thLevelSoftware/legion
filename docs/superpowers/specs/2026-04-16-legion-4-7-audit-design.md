# Legion v7.4.0 — Claude 4.7 Literalism Audit & Remediation Design

**Design document**
**Date**: 2026-04-16
**Baseline version**: Legion v7.3.2
**Target version**: Legion v7.4.0
**Status**: Approved (awaiting implementation plan)

---

## 1. Problem Statement

Claude 4.7 (Opus 4.7) follows instructions more literally than prior models and exhibits specific behavioral differences documented by Anthropic ([Best Practices for Using Claude Opus 4.7 with Claude Code](https://claude.com/blog/best-practices-for-using-claude-opus-4-7-with-claude-code)). Legion — a multi-CLI plugin consisting of 17 commands, 31 skills, 47 agent personalities, 10 CLI adapters, and supporting configuration — was designed and authored against earlier models. Many prompts, skills, and workflows contain language patterns that 4.7 now interprets differently than 4.6, producing suboptimal or incorrect behavior. The full LLM-facing surface area is ~120 files.

### 1.1 Confirmed Failure (Evidence-Based Anchor)

During production use of Legion under Claude 4.7, the user observed the following failure class, hereafter called **Open-Set Interpretation of Closed Options**:

> A Legion workflow presents two bounded options (A or B) to the model. Under 4.7, the model responds along the lines of: *"I see that the workflow says A or B, but I'm not doing that yet and instead will present you option C first."*

This indicates that 4.7 treats enumerated options as illustrative examples rather than as a complete decision boundary, unless the prompt explicitly closes the set.

### 1.2 Documented Behavioral Differences in 4.7

From Anthropic's published guidance:

- **Verbosity calibration**: response length scales with task complexity; no default-verbose behavior.
- **Subagent economy**: "spawns fewer subagents by default"; requires explicit fan-out justification.
- **Reasoning-over-tools**: "calls tools less often and reasons more"; tool-use guidance must state when and why.
- **First-turn specification preference**: "well-specified task descriptions that incorporate intent, constraints, acceptance criteria, and relevant file locations"; progressive clarification across turns is an anti-pattern.
- **Thinking control**: adaptive-only (no fixed thinking budgets); thinking can be explicitly invited or suppressed per task.
- **Positive framing bias**: "positive examples work better than prohibitive instructions" — with an exception documented in this audit for closed-set enforcement (see CAT-1 and CAT-5).

### 1.3 Goal

Perform a structured audit of all 124 in-scope files against a Claude-4.7-literalism rubric and produce a thematically-clustered remediation roadmap feedable to Legion's own `/legion:plan` workflow for v7.4.0 hardening.

---

## 2. Scope

### 2.1 In-Scope Files (~120)

| Layer | Location | Count |
|-------|----------|-------|
| Commands | `commands/*.md` | 17 |
| Skills | `skills/*/SKILL.md` | 31 |
| Agent personalities | `agents/*.md` | 47 |
| CLI adapters | `adapters/*.md` | 10 |
| Root markdown (LLM-facing) | `CLAUDE.md`, `AGENTS.md`, `README.md` | 3 |
| Reference docs | `docs/control-modes.md`, `docs/runtime-audit.md`, `docs/runtime-certification-checklists.md`, `docs/security/install-integrity.md` | 4 |
| Config YAMLs | `.planning/config/agent-communication.yaml`, `authority-matrix.yaml`, `control-modes.yaml`, `directory-mappings.yaml`, `escalation-protocol.yaml`, `intent-teams.yaml`, `roster-gap-config.yaml` | 7 |
| JSON schemas | `docs/settings.schema.json`, `docs/schemas/outcomes-record.schema.json`, `plan-frontmatter.schema.json`, `review-finding.schema.json`, `summary.schema.json` | 5 |
| **Total** |  | **124** |

### 2.2 Out of Scope

- Source code (`bin/install.js`, `scripts/*`) — not LLM-facing.
- Test files — not part of runtime context.
- Third-party dependencies.
- `.planning/` project-state files (these are per-user, not shipped with Legion).
- Website/marketing content (`docs/index.html`).

---

## 3. Deliverable

### 3.1 Shape

An audit report + prioritized remediation plan, structured as:

```
docs/audits/2026-04-16-legion-4-7/
├── INDEX.md                  # Master dashboard
├── RUBRIC.md                 # 10 audit categories, frozen at audit start
├── METHODOLOGY.md            # How the audit was conducted
├── REMEDIATION.md            # Thematically-clustered remediation roadmap
├── SESSIONS.md               # Audit session log (progress tracking)
├── FINDINGS-DB.jsonl         # Machine-readable findings (one per line)
├── FINDINGS-DB.meta.json     # Top-level metadata (versioning, counts)
└── findings/
    ├── commands/             # 17 files
    ├── skills/               # 31 files
    ├── agents/               # 47 files
    ├── adapters/             # 10 files
    └── root/                 # 19 files (3 md + 4 docs + 7 yaml + 5 schemas)
```

### 3.2 Separation of Audit from Remediation

This design produces an audit and a roadmap. It does not execute any remediation edits. Remediation is handled separately via `/legion:plan` and `/legion:build` phases, one per thematic cluster in `REMEDIATION.md`.

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

---

## 5. Severity Scale

| Severity | Definition |
|----------|------------|
| **P0 — Critical** | Prompt is empirically broken on 4.7 OR virtually guaranteed to cause wrong-path execution in common usage. User-facing, high-traffic, blocks workflows. |
| **P1 — High** | Clear structural risk matching a documented 4.7 anti-pattern. Not guaranteed to fail but likely in edge cases. Touches core orchestration. |
| **P2 — Medium** | Minor ambiguity, imprecise language, or stylistic issue. Most agent persona findings land here. |
| **P3 — Low / Informational** | Documentation/style notes. No behavioral risk. |

---

## 6. Per-File Audit Workflow

Every file follows this exact procedure:

1. Read the file completely. Note its layer (command / skill / agent / adapter / root).
2. Identify the file's interaction surface: user-facing prompts, agent dispatch points, branching logic, tool invocations, authority/escalation language.
3. Apply each of the 10 rubric categories as a sequential pass. For each match, record line range, excerpt, category, preliminary severity.
4. Mark each finding as `confirmed` (matches an observed failure class) or `suspected` (structural risk only).
5. Write the findings file at `docs/audits/2026-04-16-legion-4-7/findings/<layer>/<slug>.md`.
6. Append each finding to `FINDINGS-DB.jsonl` with a stable sequential ID (`LEGION-47-NNN`).
7. Update `INDEX.md` with the file's status, per-category finding count, and max severity.
8. Commit with message: `audit: <file-path> — N findings (<severity summary>)`.

### 6.1 Finding Record Schema

Each finding in `FINDINGS-DB.jsonl` is a single line:

```json
{"id":"LEGION-47-042","file":"skills/wave-executor/SKILL.md","line_range":"87-94","category":"CAT-3","severity":"P0","confirmed":true,"excerpt":"Consider dispatching peer tasks in parallel when it makes sense.","issue":"Ambiguous trigger and missing fan-out criteria. 4.7 defaults to sequential dispatch.","remediation_sketch":"Replace with explicit condition: dispatch as parallel agents when (a) no shared files_modified, (b) same wave, (c) CLI supports parallel.","remediation_effort":"small","remediation_cluster":"dispatch-specification","status":"open","rubric_version":"1.0"}
```

### 6.2 Per-File Findings Document Shape

```markdown
# Audit Findings — <file-path>

**Audited in session**: S07
**Rubric version**: 1.0
**File layer**: skill
**Total findings**: 4 (1 P0, 2 P1, 1 P2)

---

## LEGION-47-042 — P0, CAT-3 Underspecified Dispatch (confirmed)

**Lines 87-94**

> Consider dispatching peer tasks in parallel when it makes sense.

**Issue**: ambiguous trigger ("makes sense") and missing fan-out criteria. 4.7 defaults to sequential dispatch per Anthropic guidance ("spawns fewer subagents by default").

**Remediation sketch**: Replace with explicit condition.

**Remediation cluster**: `dispatch-specification`
**Effort estimate**: small

---

## LEGION-47-043 — P1, CAT-4 Underspecified Intent (suspected)

...
```

---

## 7. Remediation Roadmap Construction

After the audit completes, `REMEDIATION.md` groups findings into thematic clusters. Each cluster becomes a candidate Legion phase (feedable directly to `/legion:plan N`).

### 7.1 Projected Phase Structure

```markdown
## Phase 1 — Closed-Set Enforcement (remediates all CAT-1 findings)
**Target**: eliminate open-set interpretation across all user-facing options
**Finding IDs**: [list]
**Files modified**: [list]
**Pattern**: wrap all multi-option prompts in closed-set language per CAT-1 remediation pattern
**Severity**: P0-heavy
**Effort estimate**: medium (2-3 days)
**Verification**: run /legion:start, /legion:plan, /legion:build; confirm no option injection in test transcripts

## Phase 2 — Dispatch Specification (remediates all CAT-3 findings)
...

## Phase 3 — Intent Front-Loading (remediates all CAT-4 findings)
...

## Phase 4 — Persona Calibration (remediates CAT-7 findings across 47 agents)
...

## Phase 5 — Acceptance Criteria & Authority (remediates CAT-8 + CAT-10)
...

## Phase 6 — Prose Polish (CAT-5, CAT-9, residual P3s)
...
```

### 7.2 Ordering Rules

1. P0-heavy clusters first.
2. Among equal-severity clusters, sort by leverage (more files affected → earlier).
3. Among equal severity and leverage, sort by effort (smaller → earlier).

### 7.3 Phase-to-Release Mapping

Phases are labeled `must-ship-v7.4.0`, `recommended-v7.4.0`, or `defer-v7.5.0`. P0-heavy clusters are always must-ship. Any P0 finding not remediated before v7.4.0 ships becomes a known-issue in release notes.

---

## 8. Execution Model & Schedule

**Total estimated effort**: ~28 hours focused audit work spread across 23 sessions at 1 session/day, ~3–3.5 weeks wall-clock (allowing for weekend breaks).

| Session | Target | Files | Est. Duration |
|---------|--------|-------|--------------|
| S01 | Setup: create folder, freeze RUBRIC.md, write METHODOLOGY.md, initialize INDEX and FINDINGS-DB. Tag baseline `audit-v47-baseline`. | 0 | 30 min |
| S02a | Root markdown (CLAUDE.md, AGENTS.md, README.md) — these are large and LLM-facing | 3 | 1.5 hr |
| S02b | Reference docs (`docs/control-modes.md`, `runtime-audit.md`, `runtime-certification-checklists.md`, `security/install-integrity.md`) | 4 | 1 hr |
| S02c | Config YAMLs (7 files in `.planning/config/`) | 7 | 1.25 hr |
| S02d | JSON schemas (5 files; fast audit — mostly structural, only description/title fields carry 4.7-risk) | 5 | 45 min |
| S03 | Commands 1–6 | 6 | 1.5 hr |
| S04 | Commands 7–12 | 6 | 1.5 hr |
| S05 | Commands 13–17 | 5 | 1.25 hr |
| S06 | Core skills (workflow-common*, cli-dispatch, wave-executor, phase-decomposer, plan-critique) | ~7 | 1.75 hr |
| S07 | Execution skills (execution-tracker, review-loop, review-panel, review-evaluators, authority-enforcer) | ~6 | 1.5 hr |
| S08 | Planning skills (spec-pipeline, intent-router, codebase-mapper, questioning-flow) | ~5 | 1.25 hr |
| S09 | Domain skills (design-workflows, marketing-workflows, security-review, ship-pipeline) | ~6 | 1.5 hr |
| S10 | Intelligence & tracking skills (polymath-engine, memory-manager, milestone-tracker, portfolio-manager, agent-creator, agent-registry, github-sync, hooks-integration, board-of-directors) | ~7 | 1.75 hr |
| S11 | Agents — Engineering division (9) | 9 | 1 hr |
| S12 | Agents — Design + Marketing (10) | 10 | 1 hr |
| S13 | Agents — Product + Testing (10) | 10 | 1 hr |
| S14 | Agents — Project management + Support (9) | 9 | 1 hr |
| S15 | Agents — Spatial + Specialized (9) | 9 | 1 hr |
| S16 | Adapters (10) | 10 | 1.5 hr |
| S17 | Cross-cut review: re-scan INDEX for patterns, validate clustering, rescore S02/S06/S11/S16 samples against final rubric state | — | 1 hr |
| S17.5 | `/legion:advise` review gate — QA-verification-specialist + technical-writer agents review stratified sample | — | 1 hr |
| S18 | Generate REMEDIATION.md | — | 2 hr |
| S19 | Final self-review, commit cleanup, audit sign-off | — | 1 hr |

### 8.1 Session Rules

- Each session begins by loading `RUBRIC.md` and the `SESSIONS.md` tail for resumption context.
- Each session commits per-file; a session-end commit updates `SESSIONS.md` and `INDEX.md`.
- Hard cap: 10 files per session regardless of size. If a session hits 70% context budget, stop, commit, split remaining work into a new session.
- **Heavy file definition**: any file over 200 lines, OR any file with 5+ H2 sections, OR any file containing more than 3 code fences. Heavy files get their own session slot or share a session with at most 2 other heavy files.

### 8.2 Baseline & Rebase

- Audit runs against git tag `audit-v47-baseline` set at S01.
- Before REMEDIATION.md phases execute (after S18), a 30-minute rebase pass updates line ranges against current HEAD. Finding `excerpt` field makes this robust.

---

## 9. Review Gate (S17.5)

Before REMEDIATION.md is generated, a formal review gate is executed via `/legion:advise` with two agents:

### 9.1 QA-Verification-Specialist

Reviews a stratified sample of 5 files (one P0-heavy, one P1-heavy, one P2-only, one "no findings", one agent persona). Judges:
- Are findings real (or invented)?
- Are severities calibrated consistently?
- Are remediation sketches actionable?

Verdicts: `ship-audit` | `adjust-rubric` | `re-audit-sample`.

### 9.2 Product-Technical-Writer

Reviews audit outputs for clarity, consistency, executability. Specifically: could a fresh reader execute REMEDIATION.md without prior context?

Verdicts: `publish-ready` | `revise`.

### 9.3 Gate Behavior

If either verdict is negative, the audit does not progress to S18. Findings are adjusted, the rubric bumps to v1.1 if needed, affected files are re-scored, then the gate re-runs.

---

## 10. Risks & Mitigations

| # | Risk | Mitigation |
|---|------|------------|
| 1 | Rubric drift across sessions | Rubric frozen at S01 with version field on every finding; S17 re-samples prior sessions against final rubric state |
| 2 | CAT-1 confirmation bias | `confirmed` vs `suspected` flag is honest-by-construction; monitor CAT-1 ratio per session; "no findings" is a valid outcome |
| 3 | Agent persona files get over-audited | CAT-7 is P2 by default; batch-remediated in Phase 4; agent sessions accelerated (10 files each) |
| 4 | 4.7 auditing 4.7 (self-fallibility) | Rubric grounded in external evidence (Anthropic blog + confirmed user observation); Phase 1 empirically validated before downstream phases execute |
| 5 | Audit output staleness | Baseline git tag + `excerpt` field per finding makes findings robust to line drift; rebase pass before remediation |
| 6 | Too many remediation phases for v7.4.0 capacity | Phases explicitly labeled must-ship / recommended / defer; known-issues documented in release notes |
| 7 | Context budget blown mid-session | Hard 10-file cap; stop at 70% context; heavy files get dedicated sessions |
| 8 | No second-party review of audit deliverables | S17.5 `/legion:advise` gate with QA-verification + technical-writer agents; negative verdict blocks progression to REMEDIATION.md |

---

## 11. Out-of-Scope Decisions

The following are deliberately not part of this design and are handled separately:

- Actual remediation edits to any Legion file (handled by v7.4.0 phase plans generated from `REMEDIATION.md`).
- Changes to `bin/install.js`, `scripts/`, or test infrastructure.
- Changes to Legion's own workflow model (phase/wave/plan structure).
- New features or capabilities.
- Migration of project state files (`.planning/`).

---

## 12. Success Criteria

This audit is complete when all of the following are true:

1. All 124 in-scope files have a corresponding findings file (including files with zero findings).
2. `INDEX.md` shows 124/124 audited, with severity and category rollups.
3. `FINDINGS-DB.jsonl` contains one line per finding, each with a stable `LEGION-47-NNN` ID.
4. `REMEDIATION.md` groups every finding into a thematic cluster with phase-to-release mapping.
5. S17.5 review gate produces `ship-audit` + `publish-ready` verdicts.
6. `SESSIONS.md` documents every session with start/end timestamps, files completed, findings surfaced.
7. All audit work is committed to git with traceable history.
8. The audit baseline git tag `audit-v47-baseline` exists and points to the commit against which findings were recorded.

---

## 13. Handoff to Implementation Plan

This design document terminates here. The next step is generating an executable implementation plan via the `superpowers:writing-plans` skill. The implementation plan will decompose this design into session-by-session tasks with acceptance criteria, verification commands, and checkpoint commits.
