# Plan 12-01 Summary: Regression Testing & Documentation Updates

## Status: Complete

## Completed Tasks

### Task 1: Cross-Phase Regression Testing
- All 1056 tests pass across 186 suites (0 failures)
- `validate.sh`: 313 checks pass, 0 fail, 0 warn
- Pre-existing issue found: checksums.sha256 had 12 stale hashes from phases 8-11. Fixed via regeneration.
- No regressions detected.

### Task 2: CLAUDE.md Documentation Updates
- Added `/legion:explore` to Available Commands table (Phase 9)
- Added agent metadata enrichment note (Phase 5: `languages`, `frameworks`, `artifact_types`, `review_strengths`)
- Updated Brownfield support with dependency risk and test coverage (Phase 8)
- Updated Memory Layer with `task_type` classification and archetype boosts (Phase 6)
- Added Plan schema hardening convention (Phase 1: `files_forbidden`, `expected_artifacts`, `verification_commands`)
- Added Wave safety convention (Phase 2: `sequential_files`, file overlap detection)
- Added Observability convention (Phase 4: decision logging, cycle-over-cycle diff)
- Added adapter conformance metadata note (Phase 7: `lint_commands`, `max_prompt_size`, `known_quirks`)
- Added intent routing description (Phase 11: natural language parsing, context-aware suggestions)
- Verified existing docs: Control Modes (Phase 3), Escalation Protocol (Phase 10), Wave Handoff (Phase 10) — already accurate
- Verified counts: 12 commands, 25 skills, 53 agents — correct

### Task 3: Repo Hygiene Audit
- Added `node_modules/` to `.gitignore`
- Added `docs/control-modes.md` to package.json `files` field
- `npm pack --dry-run` shows expected contents

## Files Modified
- CLAUDE.md
- .gitignore
- package.json
- README.md (fixed agent line range drift)
- checksums.sha256 (regenerated)

## Verification Results
- `node --test`: PASS (1056/1056)
- `bash scripts/validate.sh`: PASS (313/313)
- `node scripts/release-check.js`: PASS
- `grep -q "node_modules" .gitignore`: PASS

## Handoff Context
- All tests green — safe to proceed with version bump
- checksums.sha256 freshly regenerated
- package.json files field now includes docs/control-modes.md
- CLAUDE.md fully documents all v6.0 features
