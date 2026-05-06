# Phase 8 Context — Codebase Mapper Enrichment

## Phase Goal

Enrich codebase-mapper skill output with dependency risk assessment and test coverage summary.

## Requirements

| ID | Description |
|----|-------------|
| MAP-01 | Dependency risk assessment in CODEBASE.md output (outdated, unmaintained, heavy deps) |
| MAP-02 | Test coverage summary in CODEBASE.md output (coverage percentage, untested areas) |

## Existing Assets

- `skills/codebase-mapper/SKILL.md` — Full codebase analysis engine (Sections 1-14)
  - Section 4.4: Config-level dependency checks (missing lockfile, no CI, no README, outdated manifests)
  - Section 4.5: Risk summary table
  - Section 5: CODEBASE.md template with existing sections
  - Section 8: Dependency/import graph (file-level fan-in/fan-out)
  - Section 9: Test coverage map (sample-based test file matching)
- `tests/` — 27 existing test files using `node:test` + `node:assert/strict`
- `tests/fixtures/` — Test fixture data

## Key Decisions

- Architecture proposals: skipped by user (straightforward enrichment)
- Spec document: `.planning/specs/08-codebase-mapper-enrichment-spec.md`
- Both plans modify `skills/codebase-mapper/SKILL.md` — `sequential_files` enforced

## Plan Structure

| Plan | Wave | Requirement | Agent | Focus |
|------|------|-------------|-------|-------|
| 08-01 | 1 | MAP-01 | engineering-senior-developer | Dependency risk assessment: new Section 4.6 + template + tests |
| 08-02 | 1 | MAP-02 | testing-evidence-collector | Test coverage enrichment: enhanced Section 9 + template + tests |

**Sequential files:** `skills/codebase-mapper/SKILL.md` (both plans modify this file)

## Success Criteria

- [ ] CODEBASE.md template includes `## Dependency Risk` section with outdated/unmaintained/heavy analysis
- [ ] CODEBASE.md `## Test Coverage Map` enriched with coverage tool integration and critical file correlation
- [ ] Both sections degrade gracefully when data unavailable
- [ ] Tests validate enriched output format
