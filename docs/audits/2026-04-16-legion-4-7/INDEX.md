# Audit Index — Legion v7.3.2 → v7.4.0

**Audit started:** 2026-04-16
**Rubric version:** 1.0
**Baseline tag:** audit-v47-baseline
**Status:** in_progress (49 / 125 files audited)

## Summary by Severity

- P0: 0 findings
- P1: 13 findings
- P2: 120 findings
- P3: 9 findings
- **Total:** 142 findings

## Summary by Category

| Category | Count | Max Severity |
|----------|-------|--------------|
| CAT-1 | 42 | P1 |
| CAT-2 | 28 | P2 |
| CAT-3 | 12 | P1 |
| CAT-4 | 6 | P2 |
| CAT-5 | 4 | P2 |
| CAT-6 | 20 | P1 |
| CAT-7 | 1 | P2 |
| CAT-8 | 17 | P2 |
| CAT-9 | 8 | P2 |
| CAT-10 | 4 | P2 |

## Files

| File | Session | Findings | Max Severity |
|------|---------|----------|--------------|
| `commands/advise.md` | S03 | 3 | P1 |
| `commands/agent.md` | S03 | 2 | P2 |
| `commands/board.md` | S03 | 3 | P2 |
| `commands/build.md` | S03 | 5 | P1 |
| `commands/explore.md` | S03 | 4 | P2 |
| `commands/learn.md` | S03 | 3 | P2 |
| `commands/milestone.md` | S04 | 4 | P2 |
| `commands/plan.md` | S04 | 6 | P1 |
| `commands/portfolio.md` | S04 | 3 | P2 |
| `commands/quick.md` | S04 | 4 | P1 |
| `commands/retro.md` | S04 | 3 | P2 |
| `commands/review.md` | S04 | 7 | P1 |
| `commands/ship.md` | S05 | 6 | P1 |
| `commands/start.md` | S05 | 7 | P1 |
| `commands/status.md` | S05 | 5 | P2 |
| `commands/update.md` | S05 | 5 | P2 |
| `commands/validate.md` | S05 | 5 | — |
| `cross-cutting: model-tier configuration` | S05.1 | 3 | — |
| `AGENTS.md` | S02a | 2 | P2 |
| `CLAUDE.md` | S02a | 2 | P2 |
| `.planning/config/agent-communication.yaml` | S02c | 1 | P2 |
| `.planning/config/authority-matrix.yaml` | S02c | 1 | P2 |
| `.planning/config/control-modes.yaml` | S02c | 0 | — |
| `.planning/config/directory-mappings.yaml` | S02c | 0 | — |
| `.planning/config/escalation-protocol.yaml` | S02c | 0 | — |
| `.planning/config/intent-teams.yaml` | S02c | 0 | — |
| `.planning/config/roster-gap-config.yaml` | S02c | 0 | — |
| `docs/control-modes.md` | S02b | 0 | — |
| `docs/runtime-audit.md` | S02b | 0 | — |
| `docs/runtime-certification-checklists.md` | S02b | 1 | P3 |
| `docs/security/install-integrity.md` | S02b | 0 | — |
| `README.md` | S02a | 1 | P3 |
| `docs/schemas/outcomes-record.schema.json` | S02d | 0 | — |
| `docs/schemas/plan-frontmatter.schema.json` | S02d | 0 | — |
| `docs/schemas/review-finding.schema.json` | S02d | 1 | P3 |
| `docs/settings.schema.json` | S02d | 0 | — |
| `docs/schemas/summary.schema.json` | S02d | 1 | P2 |
| `skills/cli-dispatch/SKILL.md` | S06 | 5 | P2 |
| `skills/intent-router/SKILL.md` | S07 | 7 | P2 |
| `skills/phase-decomposer/SKILL.md` | S07 | 7 | P2 |
| `skills/plan-critique/SKILL.md` | S07 | 5 | P2 |
| `skills/questioning-flow/SKILL.md` | S07 | 6 | P1 |
| `skills/spec-pipeline/SKILL.md` | S07 | 5 | P2 |
| `skills/wave-executor/SKILL.md` | S06 | 9 | P1 |
| `skills/workflow-common/SKILL.md` | S06 | 4 | P1 |
| `skills/workflow-common-core/SKILL.md` | S06 | 3 | P2 |
| `skills/workflow-common-domains/SKILL.md` | S06 | 1 | P2 |
| `skills/workflow-common-github/SKILL.md` | S06 | 2 | P2 |
| `skills/workflow-common-memory/SKILL.md` | S06 | 2 | P2 |
