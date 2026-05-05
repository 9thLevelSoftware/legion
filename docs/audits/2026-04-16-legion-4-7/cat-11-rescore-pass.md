# CAT-11 Mechanical Rescore Pass

**Date:** 2026-05-04
**Rubric:** v1.1
**Files re-scored:** 64 (all previously audited)
**Pre-existing findings revisited:** 0 (CAT-1..10 untouched per re-scoring policy)

## Summary

- New CAT-11 findings: 4 (all resolved at landing)
- Files with CAT-11 hits: 4
- Files clean under CAT-11: 60

## Findings (all resolved)

| ID | File | Severity | Issue | Resolution |
|---|---|---|---|---|
| LEGION-47-481 | docs/schemas/plan-frontmatter.schema.json | P1 | Schema required singular `agent`; template emits plural `agents` | Resolved: Task 2 (schema rewrite) |
| LEGION-47-482 | docs/settings.schema.json | P1 | Schema `additionalProperties: false` rejected valid settings fields | Resolved: Task 1 (schema expansion) |
| LEGION-47-483 | commands/explore.md | P0 | Described spawning Polymath but no Agent() invocation or inline-persona mode | Resolved: Task 13 (inline-persona rewrite) |
| LEGION-47-484 | skills/phase-decomposer/SKILL.md | P2 | Template emits frontmatter not aligned with schema (singular agent, flat artifacts) | Resolved: Task 9 (migration aligned plans) |

## Per-file CAT-11 verdicts

| File | Verdict | Reason |
|------|---------|--------|
| `commands/advise.md` | no CAT-11 surface | Command prose; spawn-truthfulness check passes (agents loaded inline) |
| `commands/agent.md` | no CAT-11 surface | Command prose; no schema-enforced contract to falsify |
| `commands/board.md` | no CAT-11 surface | Command prose; no mechanical contract dependency |
| `commands/build.md` | no CAT-11 surface | Command prose; dispatches via wave-executor, no schema drift |
| `commands/explore.md` | **LEGION-47-483** | Spawn-truthfulness: claimed Agent() spawn but used inline-persona |
| `commands/learn.md` | no CAT-11 surface | Command prose; memory operations have no schema contract |
| `commands/milestone.md` | no CAT-11 surface | Command prose; no mechanical contract dependency |
| `commands/plan.md` | no CAT-11 surface | Command prose; delegates to phase-decomposer skill |
| `commands/portfolio.md` | no CAT-11 surface | Command prose; no mechanical contract dependency |
| `commands/quick.md` | no CAT-11 surface | Command prose; spawn-truthfulness check passes |
| `commands/retro.md` | no CAT-11 surface | Command prose; no mechanical contract dependency |
| `commands/review.md` | no CAT-11 surface | Command prose; delegates to review-loop skill |
| `commands/ship.md` | no CAT-11 surface | Command prose; no mechanical contract dependency |
| `commands/start.md` | no CAT-11 surface | Command prose; delegates to questioning-flow skill |
| `commands/status.md` | no CAT-11 surface | Command prose; no mechanical contract dependency |
| `commands/update.md` | no CAT-11 surface | Command prose; no mechanical contract dependency |
| `commands/validate.md` | no CAT-11 surface | Command prose; validator scripts are separate artifacts |
| `cross-cutting: model-tier configuration` | no CAT-11 surface | Virtual audit entry; no file artifact to check |
| `AGENTS.md` | no CAT-11 surface | Roster documentation; no schema-enforced contract |
| `CLAUDE.md` | no CAT-11 surface | Project instructions; no mechanical contract to falsify |
| `.planning/config/agent-communication.yaml` | no CAT-11 surface | Config definition; self-referential (defines its own contract) |
| `.planning/config/authority-matrix.yaml` | no CAT-11 surface | Config definition; self-referential |
| `.planning/config/control-modes.yaml` | no CAT-11 surface | Config definition; self-referential |
| `.planning/config/directory-mappings.yaml` | no CAT-11 surface | Config definition; self-referential |
| `.planning/config/escalation-protocol.yaml` | no CAT-11 surface | Config definition; self-referential |
| `.planning/config/intent-teams.yaml` | no CAT-11 surface | Config definition; self-referential |
| `.planning/config/roster-gap-config.yaml` | no CAT-11 surface | Config definition; self-referential |
| `docs/control-modes.md` | no CAT-11 surface | Documentation prose; describes but does not enforce schema |
| `docs/runtime-audit.md` | no CAT-11 surface | Documentation prose; no enforceable contract |
| `docs/runtime-certification-checklists.md` | no CAT-11 surface | Documentation prose; no enforceable contract |
| `docs/security/install-integrity.md` | no CAT-11 surface | Documentation prose; no enforceable contract |
| `README.md` | no CAT-11 surface | Documentation prose; no enforceable contract |
| `docs/schemas/outcomes-record.schema.json` | no CAT-11 surface | Schema defines contract (is the source of truth, not a consumer) |
| `docs/schemas/plan-frontmatter.schema.json` | **LEGION-47-481** | Schema consumed by templates that emitted non-conformant frontmatter |
| `docs/schemas/review-finding.schema.json` | no CAT-11 surface | Schema defines contract; consumers conform |
| `docs/settings.schema.json` | **LEGION-47-482** | Schema rejected valid fields present in settings.json |
| `docs/schemas/summary.schema.json` | no CAT-11 surface | Schema defines contract; consumers conform |
| `skills/authority-enforcer/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/board-of-directors/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/cli-dispatch/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/codebase-mapper/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/design-workflows/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/execution-tracker/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/intent-router/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/marketing-workflows/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/memory-manager/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/milestone-tracker/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/phase-decomposer/SKILL.md` | **LEGION-47-484** | Template emits frontmatter misaligned with plan schema |
| `skills/plan-critique/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/polymath-engine/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/portfolio-manager/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/questioning-flow/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/review-evaluators/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/review-loop/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/review-panel/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/security-review/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/ship-pipeline/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/spec-pipeline/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/wave-executor/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/workflow-common/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/workflow-common-core/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/workflow-common-domains/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/workflow-common-github/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |
| `skills/workflow-common-memory/SKILL.md` | no CAT-11 surface | Skill prose; no mechanical contract dependency |

## Resolved at landing

All CAT-11 findings opened during this rescore pass were resolved by the
2026-05-04 contract-cleanup spec and its implementation (Tasks 1-16 of this plan).
Each resolved finding's status field is set to "resolved" -- no remediation work remains.
