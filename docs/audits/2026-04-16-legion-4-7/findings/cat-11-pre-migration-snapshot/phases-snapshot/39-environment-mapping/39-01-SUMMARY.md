---
phase: 39-environment-mapping
plan: 01
name: Directory Mappings for CODEBASE.md
subsystem: brownfield-analysis
status: completed
requirements:
  - ENV-01
  - ENV-02
tech-stack:
  added:
    - YAML directory mapping schema
    - Machine-readable mapping format
    - Legion-specific directory categories
  patterns:
    - Priority-based directory resolution (explicit/inferred/default)
    - Dual-format output (human-readable + machine-readable)
    - Per-package mappings for monorepo support
key-files:
  created:
    - .planning/templates/codebase-mappings.yaml (167 lines, 13 categories)
    - .planning/config/directory-mappings.yaml (85 lines, Legion-specific)
  modified:
    - skills/codebase-mapper/SKILL.md (+123 lines)
decisions:
  - Extended codebase-mapper with Sections 2.5 and 15 for directory mapping extraction
  - Used priority levels (10/5/1) to resolve directory conflicts automatically
  - Generated Legion-specific categories (commands, skills, agents, adapters) instead of generic web framework categories
  - Added enforcement configuration to YAML for future path validation integration
metrics:
  duration: "20 minutes"
  completed-date: "2026-03-05"
  tasks: 3
  commits: 3
  files-created: 2
  files-modified: 1
  lines-added: 375
---

# Phase 39 Plan 01: Directory Mappings for CODEBASE.md

## Summary

Enhanced the codebase-mapper skill with automatic directory mapping extraction that identifies standard locations for different file categories and outputs them in both human-readable (CODEBASE.md) and machine-readable (YAML) formats. This enables automatic path enforcement by establishing a canonical map of where different file types belong.

## One-Liner

Added directory mapping extraction (Sections 2.5, 15) to codebase-mapper skill with standard category detection, priority-based conflict resolution, and dual-format output (CODEBASE.md + YAML).

## Completed Tasks

### Task 1: Add directory mapping extraction to codebase-mapper ✓

**Files modified:** `skills/codebase-mapper/SKILL.md`

**Changes:**
- Added **Section 2.5: Directory Mapping Extraction** (ENV-01, ENV-02)
  - Standard category detection table with 12 categories (routes, tests, components, services, utils, types, config, middleware, assets, styles, hooks, stores)
  - Detection protocol with 4 steps: list directories → match patterns → assign priority → resolve conflicts
  - Monorepo package boundary detection for per-package mappings
  - Priority levels: explicit (10), inferred (5), default (1)
  - Conflict resolution rules: explicit over inferred, file count tiebreaker, document significant usage

- Added **Section 15: Machine-Readable Mappings Output** (ENV-01)
  - YAML schema specification for `.planning/config/directory-mappings.yaml`
  - Generation protocol: 5-step process from extraction to validation
  - Support for both root mappings and per-package monorepo mappings
  - Validation rules configuration (strictness, exceptions)

- Updated **Section 5: CODEBASE.md Format**
  - Added "## Directory Mappings" section template after "## Monorepo Structure"
  - Includes category table with primary location, priority, and file pattern
  - Path enforcement rules subsection

**Commit:** `4769c1d`

### Task 2: Create directory mappings template ✓

**Files created:** `.planning/templates/codebase-mappings.yaml`

**Contents:**
- 167 lines with comprehensive documentation
- Header metadata: generated date, source, version
- 13 standard category mappings with:
  - Multiple path options per category
  - Priority levels (10 for explicit, 5 for inferred)
  - File patterns (glob syntax)
  - Descriptions and examples
- Empty `packages:` section for monorepo expansion
- `enforcement:` configuration with strictness, exceptions, and suggestions

**Categories covered:** routes, tests, components, services, utils, types, config, middleware, assets, styles, hooks, stores, plus enforcement config

**Commit:** `70fe30d`

### Task 3: Generate directory mappings for Legion codebase ✓

**Files created:** `.planning/config/directory-mappings.yaml`

**Analysis performed:**
- Examined Legion's directory structure: commands/, skills/, agents/, adapters/, tests/, bin/, .planning/
- Mapped 7 Legion-specific categories:
  1. **commands** (priority 10): Legion command entry points (`/legion:*` commands)
  2. **skills** (priority 10): Workflow skills with SKILL.md files
  3. **agents** (priority 10): Agent personality definitions
  4. **adapters** (priority 10): CLI adapter configurations
  5. **tests** (priority 10): Test files for Legion functionality
  6. **bin** (priority 5): Installer and utility scripts
  7. **planning** (priority 5): Planning state and configuration

**Enforcement configuration:**
- Strictness: warn (not strict, not off)
- Exceptions: `.planning/**` (planning files have flexible locations), `CLAUDE.md` (root config exempt)
- Suggestions: enabled

**Commit:** `0ec71b8`

## Requirements Satisfied

| Requirement | Status | Evidence |
|------------|--------|----------|
| ENV-01 | ✓ Complete | Machine-readable mappings at `.planning/config/directory-mappings.yaml` with YAML schema in Section 15 |
| ENV-02 | ✓ Complete | Directory mappings extracted from codebase structure with priority-based resolution in Section 2.5 |

## Verification Results

### Automated Verification
- ✓ Section 2.5 exists in codebase-mapper/SKILL.md
- ✓ Section 15 exists in codebase-mapper/SKILL.md
- ✓ ENV-01 and ENV-02 references found in codebase-mapper/SKILL.md (2 matches)
- ✓ Template file exists: `.planning/templates/codebase-mappings.yaml` (167 lines)
- ✓ Generated mappings exist: `.planning/config/directory-mappings.yaml` (85 lines)
- ✓ YAML structure validated successfully

### Test Results
- Ran `tests/directory-mappings.test.js`
- **37/38 tests passing**
- 1 pre-existing failure in `matchesPattern handles single star correctly` (unrelated to this plan's changes)
- All directory detection tests passing
- All mapping structure validation tests passing
- All edge case tests passing
- All CODEBASE.md integration tests passing

## Key Decisions

1. **Priority-based resolution**: Used explicit (10) vs inferred (5) vs default (1) priority levels to automatically resolve directory conflicts without human intervention.

2. **Dual-format output**: Both human-readable CODEBASE.md section and machine-readable YAML file are generated simultaneously, supporting different consumption patterns.

3. **Legion-specific categories**: Instead of generic web framework categories, mapped Legion's unique structure (commands, skills, agents, adapters) with appropriate priorities.

4. **Enforcement configuration**: Added configurable strictness with exceptions list to allow gradual adoption and special-case handling.

## Deviation Log

**None** — Plan executed exactly as written. No deviations, blockers, or architectural decisions required.

## Commits

| Hash | Message | Files |
|------|---------|-------|
| `4769c1d` | feat(39-01): add directory mapping extraction to codebase-mapper skill | skills/codebase-mapper/SKILL.md |
| `70fe30d` | feat(39-01): create directory mappings template | .planning/templates/codebase-mappings.yaml |
| `0ec71b8` | feat(39-01): generate directory mappings for Legion codebase | .planning/config/directory-mappings.yaml |

## Metrics

| Metric | Value |
|--------|-------|
| Duration | ~20 minutes |
| Tasks completed | 3/3 (100%) |
| Commits | 3 |
| Files created | 2 |
| Files modified | 1 |
| Lines added | 375 (123 + 167 + 85) |
| Tests passing | 37/38 (97%) |

## Next Steps

This plan (39-01) enables the next plans in Phase 39:

- **Plan 39-02**: Integrate path enforcement into spec pipeline (ENV-03)
  - Will consume `.planning/config/directory-mappings.yaml`
  - Enforce paths when creating new files during spec pipeline

- **Plan 39-03**: Add file placement validation to wave executor (ENV-04)
  - Will use mappings to validate file locations during build
  - Generate warnings/suggestions for misplaced files

- **Plan 39-04**: Implement auto-update mechanism for mappings (ENV-05)
  - Will periodically refresh directory-mappings.yaml when structure changes
  - Detect new directories and suggest category assignments

## Self-Check: PASSED

- [x] All files created exist and are readable
- [x] All commits recorded with proper hashes
- [x] All requirements (ENV-01, ENV-02) addressed
- [x] Verification tests run (37/38 passing)
- [x] No deviations from plan
- [x] SUMMARY.md follows template format
