# Phase 12 Context: Integration & Release

## Phase Goal

Cross-phase regression testing, documentation updates, repo hygiene, and version bump to 6.0.0.

## Requirements

- **REL-01**: Cross-phase regression testing
- **REL-02**: Documentation updates for all new features
- **REL-03**: `.gitignore` and `package.json` files audit (repo hygiene)
- **REL-04**: Version bump to 6.0.0

## Existing Assets

### Test Infrastructure
- 29 test files in `tests/` covering all v6.0 phases
- Test runner: `node --test`
- Release check: `node scripts/release-check.js`
- Checksums: `node scripts/generate-checksums.js`
- Validation: `bash scripts/validate.sh`

### Current State
- `package.json` version: `5.0.0`
- `.gitignore`: missing `node_modules/`
- `package.json` files field: may need `docs/control-modes.md` addition
- 12 commands, 25 skills, 53 agents (counts unchanged from v5.0)

### v6.0 Features Added (Phases 1-11)
1. **Plan Schema Hardening** (Phase 1): `files_forbidden`, `expected_artifacts`, mandatory `verification_commands`
2. **Wave Safety** (Phase 2): File overlap detection, `sequential_files` convention
3. **Control Modes** (Phase 3): `autonomous`/`guarded`/`advisory`/`surgical` presets in settings.json
4. **Observability** (Phase 4): Decision logging in SUMMARY.md, cycle-over-cycle diff in REVIEW.md
5. **Agent Metadata Enrichment** (Phase 5): `languages`, `frameworks`, `artifact_types`, `review_strengths` in 53 agent frontmatter files
6. **Recommendation Engine v2** (Phase 6): Metadata-aware scoring, `task_type` in OUTCOMES.md, archetype-weighted boosts
7. **Validation & Conformance** (Phase 7): Adapter conformance tests, cross-reference validation, lint-commands, `max_prompt_size`/`known_quirks` in ADAPTER.md
8. **Codebase Mapper Enrichment** (Phase 8): Dependency risk assessment, test coverage summary in CODEBASE.md
9. **Polymath Advanced Modes** (Phase 9): Onboard, compare, debate modes in `/legion:explore`
10. **Authority & Conflict Resolution** (Phase 10): Escalation automation protocol, agent-to-agent communication conventions
11. **Intent Routing v2** (Phase 11): Natural language intent parsing, context-aware suggestions

### Config Files Added
- `.planning/config/control-modes.yaml`
- `.planning/config/agent-communication.yaml`
- `.planning/config/escalation-protocol.yaml`
- `docs/control-modes.md`

## Decisions

- Architecture proposals: skipped (straightforward release phase)
- Wave structure: 2 plans across 2 waves (testing/docs first, then version bump/release)
- Agent selection: testing-qa-verification-specialist + engineering-senior-developer (wave 1), project-management-studio-producer + engineering-senior-developer (wave 2)

## Plan Structure

| Plan | Wave | Focus | Agents |
|------|------|-------|--------|
| 12-01 | 1 | Regression Testing & Documentation Updates | testing-qa-verification-specialist, engineering-senior-developer |
| 12-02 | 2 | Version Bump & Release | project-management-studio-producer, engineering-senior-developer |
