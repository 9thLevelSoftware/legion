# Phase 4: Observability -- Context

## Phase Goal
Add decision logging to SUMMARY.md and cycle-over-cycle diff to REVIEW.md for improved trust and debuggability.

## Requirements Covered
- **OBS-01**: Decision logging in SUMMARY.md (agent scores, adapter, confidence)
- **OBS-02**: Cycle-over-cycle diff in REVIEW.md
- **OBS-03**: Structured decision capture in wave executor output

## What Already Exists (from prior phases)
- **Phase 1 completed**: Plan Schema Hardening — `files_forbidden`, `expected_artifacts`, `verification_commands` in plan frontmatter
- **Phase 2 completed**: Wave Safety — plan-critique file overlap detection and `sequential_files` convention
- **Phase 3 completed**: Control Modes — `control_mode` setting with 4 presets, authority matrix mode integration, control-modes.yaml profiles
- **SUMMARY.md template** (`skills/wave-executor/SKILL.md` Section 7): Captures status, agent, files modified, verification results, decisions, deviations — but no recommendation scores, adapter info, or confidence data
- **REVIEW.md template** (`skills/review-loop/SKILL.md` Section 7-8): Captures findings, reviewer verdicts, cross-cutting themes — but no cycle-over-cycle delta or progression tracking
- **Agent-registry scoring** (`skills/agent-registry/SKILL.md` Section 3): Semantic shortlist → heuristic tiebreak → confidence classification — but scores are ephemeral (not persisted)
- **Review-loop re-review** (`skills/review-loop/SKILL.md` Section 6): Compares findings across cycles using fingerprints — already has deduplication logic to build on
- **Memory-manager outcome recording** (`skills/workflow-common-memory/SKILL.md`): Lightweight outcome records with agent ID, task type, tags — pattern for structured data capture

## Key Design Decisions
- **No architecture proposals needed**: Phase modifies existing markdown skill files only — enrichment, not new structure
- **Score breakdown structure**: Reuse agent-registry's existing semantic/heuristic/memory scoring, just persist the breakdown alongside recommendations
- **LLM-native data flow**: Score data is NOT serialized between `/plan` and `/build` commands. Instead, the executing agent re-derives the rationale at SUMMARY.md generation time by applying agent-registry scoring rules to the task description. The score_export structure defines WHAT fields to populate; the agent computes them.
- **Two-tier fingerprinting for cycle delta**: Location fingerprint (file + line + issue hash, WITHOUT severity) for cross-cycle identity matching. Full fingerprint (+ severity) for existing stale-loop detection. This enables downgrade/upgrade detection without breaking existing deduplication.
- **Correct section references**: SUMMARY.md template is in wave-executor Section 5 (Agent Result Processing), NOT Section 7. REVIEW.md template's last section is `## Suggestions (Not Required)`, NOT `## Cross-Cutting Themes`. Escalation content spans both Section 8 AND Section 8.5.
- **Phase Decision Summary is NEW**: No phase-level completion report existed in wave-executor — this is a new addition at the end of Section 5, not an extension of an existing section.
- **Graceful degradation**: Autonomous tasks omit "Agent Selection Rationale" section. Single-cycle reviews omit "Cycle Delta" section.
- **Wave 1 parallelism**: Plans 04-01 and 04-02 modify different files (wave-executor + agent-registry + phase-decomposer vs review-loop) — no dependency

## Plan Critique Results (CAUTION — mitigations applied)
Critique agents identified 6 issues, all mitigated:
1. score_export transport gap → resolved as LLM-native re-derivation
2. Fingerprint includes severity → resolved with two-tier fingerprint strategy
3. Wrong section references → corrected in plan task instructions
4. Verification invariant ignores downgraded/upgraded → formula fixed to include all 5 categories
5. No test plan → Plan 04-03 added (Wave 2)
6. Phase Decision Summary is new → acknowledged in plan instructions

Pre-existing issues noted (not in scope): review-loop duplicate Section 8 numbering, agent count inconsistency (52 vs 53)

## Plan Structure
- **Plan 04-01 (Wave 1)**: Decision capture & SUMMARY logging — extend agent-registry score export, wave-executor SUMMARY.md template, phase-decomposer documentation (OBS-01, OBS-03)
- **Plan 04-02 (Wave 1)**: Review cycle delta — extend review-loop with cycle comparison logic and "Cycle Delta" section in REVIEW.md template (OBS-02)
- **Plan 04-03 (Wave 2)**: Observability tests — test suites for Agent Selection Rationale, Phase Decision Summary, Cycle Delta, and two-tier fingerprint logic (depends on 04-01 and 04-02)
