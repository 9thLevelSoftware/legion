---
phase: 38-intent-driven-execution
plan: 02
type: execute
subsystem: commands
requires: [38-01]
provides: [INTENT-01, INTENT-02, INTENT-03]
tech-stack:
  patterns:
    - Intent flag parsing with validation
    - Ad-hoc team spawning for security audits
    - Filter predicates for plan filtering
    - Two-phase execution (ad_hoc vs filter_plans)
key-files:
  created: []
  modified:
    - commands/build.md
    - skills/wave-executor/SKILL.md
decisions: []
metrics:
  duration: 30m
  completed_date: 2026-03-05
---

# Phase 38 Plan 02: Intent-Driven Build Integration

**One-liner:** Integrated intent flags (--just-harden, --just-document, --skip-frontend) into `/legion:build` with validation, ad-hoc team spawning, and plan filtering.

## What Was Built

Enhanced the `/legion:build` command to support semantic intent flags for targeted operations:

1. **Intent Detection (Step 0.5)** - Parse and validate flags like `--just-harden`, `--skip-frontend`
2. **Ad-hoc Execution (Step 4-ADHOC)** - Spawn intent-specific teams for security audits without phase plans
3. **Plan Filtering (Section 6)** - Filter existing plans by agent, file patterns, and task types

### Key Features

| Flag | Mode | Behavior |
|------|------|----------|
| `--just-harden` | ad_hoc | Spawns Testing + Security agents for security audit |
| `--just-document` | filter_plans | Filters to documentation-only tasks |
| `--skip-frontend` | filter_plans | Excludes UI/frontend tasks |
| `--skip-backend` | filter_plans | Excludes API/backend tasks |

### Validation
- Mutual exclusion rules prevent conflicting flags
- Command context validation (e.g., --just-harden only for build)
- Empty result detection (--skip-frontend + --skip-backend = error)

## Changes Made

### commands/build.md
- Added **Step 0.5: INTENT DETECTION AND VALIDATION** with 4 sub-steps
  - Parse intent flags using intent-router skill
  - Validate flag combinations
  - Determine execution mode (ad_hoc vs filter_plans)
  - User confirmation
- Added **Intent-Driven Execution** section to USAGE
  - Documented all 4 intent flags with descriptions and modes
  - Included usage examples
- Added **Step 4-ADHOC: SPAWN INTENT-SPECIFIC TEAM**
  - Load intent templates from intent-teams.yaml
  - Resolve Testing + Security agent teams
  - Spawn agents with security audit prompts
  - Generate security-audit-{timestamp}.md report
  - EXIT without proceeding to normal build

### skills/wave-executor/SKILL.md
- Added **Section 6: INTENT-BASED PLAN FILTERING**
  - 6.1 Filter Predicates (agent-based, file-based, task-type)
  - 6.2 Filter Execution (Step 3.5 with validation)
  - 6.3 Task Type Detection
- Supports combining multiple filters with AND logic
- Validates results and provides helpful error messages

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

✅ All 55 tests passing:
- 28 intent flag parsing tests
- 27 intent filtering tests

✅ Build command verification:
- Intent detection section present (Step 0.5)
- Ad-hoc spawning section present (Step 4-ADHOC)
- USAGE section documents all intent flags

✅ Wave executor verification:
- Section 6 for plan filtering present
- All filter predicate types implemented
- Step 3.5 for filter execution documented

## Requirements Satisfied

| Requirement | Status | Notes |
|-------------|--------|-------|
| INTENT-01 | ✅ | `/legion:build --just-harden` summons Testing + Security divisions |
| INTENT-02 | ✅ | `/legion:build --just-document` filters to documentation tasks |
| INTENT-03 | ✅ | `/legion:build --skip-frontend` excludes frontend tasks |

## Commits

1. `16af610` - feat(38-02): Add intent detection and validation to build command
2. `c116c2c` - feat(38-02): Add ad-hoc team spawning for --just-harden intent
3. `9aa6d76` - feat(38-02): Add intent-based plan filtering to wave executor

## Dependencies

- Requires: `intent-router` skill (from Plan 38-01)
- Requires: `intent-teams.yaml` registry (from Plan 38-01)
- Enables: Plan 38-03 (/legion:review --just-security integration)

## Self-Check: PASSED

✓ Created files exist: None (all modifications)
✓ Modified files exist: commands/build.md, skills/wave-executor/SKILL.md
✓ Commits verified: 16af610, c116c2c, 9aa6d76
✓ Tests passing: 55/55
✓ Requirements satisfied: INTENT-01, INTENT-02, INTENT-03
