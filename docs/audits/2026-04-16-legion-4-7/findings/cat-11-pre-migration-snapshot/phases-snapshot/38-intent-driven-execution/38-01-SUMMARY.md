---
phase: 38-intent-driven-execution
plan: 01
subsystem: intent-routing
completed: "2026-03-05"
duration: "45 minutes"
tags: [intent-flags, team-templates, validation, yaml-registry]
requires: [38-00]
provides: [38-02]
affects: [.planning/config/intent-teams.yaml, skills/intent-router/SKILL.md, skills/agent-registry/CATALOG.md]
tech-stack:
  added: []
  patterns: [yaml-configuration, intent-routing, flag-validation, team-templates]
key-files:
  created:
    - .planning/config/intent-teams.yaml
    - skills/intent-router/SKILL.md
  modified:
    - skills/agent-registry/CATALOG.md
decisions:
  - "Use engineering-security-engineer reference in YAML even though agent file doesn't exist yet (defined in authority-matrix.yaml)"
  - "5 intent templates: harden, document, skip-frontend, skip-backend, security-only"
  - "3 execution modes: ad_hoc, filter_plans, filter_review"
metrics:
  tasks: 3
  test-coverage: 123 passing tests
  files-created: 2
  files-modified: 1
  commits: 3
---

# Phase 38 Plan 01: Intent Teams Registry — Summary

**One-liner:** Created declarative YAML registry for intent-to-team mapping with validation rules, plus routing skill for parsing and resolution.

## What Was Built

### 1. intent-teams.yaml Registry (`.planning/config/intent-teams.yaml`)

A declarative YAML configuration file mapping semantic intent flags to agent teams:

- **5 Intent Templates:**
  - `harden` — Security audit with Testing + Security divisions (ad_hoc mode)
  - `document` — Documentation-only generation (filter_plans mode)  
  - `skip-frontend` — Exclude frontend/UI tasks (filter_plans mode)
  - `skip-backend` — Exclude backend/API tasks (filter_plans mode)
  - `security-only` — Security review filtering (filter_review mode)

- **Task Type Taxonomy:** 7 categories (documentation, implementation, testing, ui-components, frontend-architecture, api-endpoints, database-schema)

- **Validation Rules:**
  - Mutual exclusion (can't combine conflicting intents)
  - Command context requirements (e.g., --just-harden only for build)
  - Redundancy detection (e.g., --just-document + --skip-frontend)
  - Empty result detection (skip-frontend + skip-backend = nothing to build)

### 2. intent-router Skill (`skills/intent-router/SKILL.md`)

Complete routing skill with 6 sections:

1. **Intent Flag Parsing** — `parseIntentFlags()` extracts and normalizes flags
2. **Validation Engine** — `validateFlagCombination()` applies rules from YAML
3. **Team Template Resolution** — `resolveTeamTemplate()` loads agent configurations
4. **Execution Mode Detection** — `detectExecutionMode()` determines strategy
5. **Filter Predicates** — `createAgentFilter()`, `createFileFilter()`, `createTaskFilter()`
6. **Integration Guide** — Usage in `/legion:build` and `/legion:review`

### 3. Agent Registry Updates (`skills/agent-registry/CATALOG.md`)

- Added `intent_mappings` frontmatter with harden/document/security-only mappings
- Created Section 2: Intent Routing with team composition table
- Cross-referenced divisions and documented dynamic composition patterns

## Requirements Satisfied

| Requirement | Status | Evidence |
|-------------|--------|----------|
| INTENT-05 | ✅ | intent-teams.yaml maps 5 semantic flags to team templates |
| INTENT-06 | ✅ | Validation rules reject invalid combinations with helpful errors |

## Test Results

All 123 intent-related tests passing:
- `intent-flag-parsing.test.js` — 28 tests for flag detection
- `intent-filtering.test.js` — 27 tests for plan filtering  
- `intent-validation.test.js` — 26 tests for validation rules
- `intent-teams.test.js` — 15 tests for team assembly
- `intent-review.test.js` — 12 tests for review integration

## Deviations from Plan

**None** — plan executed exactly as written.

User decision (Option A) to proceed with `engineering-security-engineer` reference was followed. The agent is defined in authority-matrix.yaml and the reference is valid for the YAML registry.

## Key Decisions

1. **Agent Reference Handling**: Used `engineering-security-engineer` in YAML registry per user decision. Agent is defined in authority-matrix.yaml and can be created later.

2. **Intent Scope**: Limited to 5 core intents covering the most common use cases (security, documentation, frontend/backend filtering).

3. **Execution Modes**: Three modes (ad_hoc, filter_plans, filter_review) cover all routing scenarios without over-engineering.

## Commits

| Hash | Message |
|------|---------|
| c67cc87 | feat(38-01): create intent-teams.yaml registry |
| a31cf75 | feat(38-01): create intent-router skill with validation and routing |
| 3054833 | feat(38-01): update agent registry with intent metadata |

## Next Steps

- Plan 38-02: Integrate intent-router into `/legion:build` command
- Plan 38-03: Integrate intent-router into `/legion:review` command
- Future: Add more intent templates based on usage patterns

---

## Self-Check: PASSED

- [x] intent-teams.yaml exists with 5 intent templates
- [x] intent-router skill created with 6 documented sections
- [x] Agent registry updated with intent_mappings
- [x] All 123 tests passing
- [x] All 3 tasks committed
- [x] INTENT-05 satisfied
- [x] INTENT-06 satisfied
