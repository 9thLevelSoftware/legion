---
phase: 24-foundation
plan: 01
subsystem: skills
tags: [namespace, rebrand, workflow-common, legion, agency]

# Dependency graph
requires: []
provides:
  - "skills/workflow-common/SKILL.md with /legion: namespace — zero /agency: references"
  - "Portfolio path constant: ~/.claude/legion/portfolio.md"
  - "GitHub label constant: 'legion'"
  - "Frontmatter name: legion:workflow-common"
affects: [25-commands, 26-skills, 27-plugin-manifest, 28-documentation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "All shared constants use /legion: namespace as canonical identity"
    - "Portfolio registry at ~/.claude/legion/portfolio.md (clean break from agency path)"

key-files:
  created: []
  modified:
    - "skills/workflow-common/SKILL.md"

key-decisions:
  - "Single atomic Write used instead of incremental Edits to prevent partial state during 47-occurrence substitution"
  - "Line count 373 vs expected 374 — one trailing newline difference, functionally identical"

patterns-established:
  - "Namespace substitution: /agency: -> /legion: across all shared constants and command references"
  - "Path substitution: ~/.claude/agency/ -> ~/.claude/legion/ for portfolio registry"
  - "Brand substitution: Agency -> Legion in prose and GitHub label references"

requirements-completed: [SKL-01]

# Metrics
duration: 8min
completed: 2026-03-02
---

# Phase 24 Plan 01: Foundation Summary

**Full /legion: namespace established in workflow-common — 47 substitutions applied, zero /agency: remnants, all locked text exact**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-02T00:00:00Z
- **Completed:** 2026-03-02T00:08:00Z
- **Tasks:** 3 (read baseline, write transformed file, verify)
- **Files modified:** 1

## Accomplishments
- Replaced all 47 case-insensitive "agency" occurrences with "legion" in skills/workflow-common/SKILL.md
- Applied locked frontmatter text: name `legion:workflow-common`, description `Shared constants, paths, and patterns for all /legion: commands`
- Updated portfolio path from `~/.claude/agency/portfolio.md` to `~/.claude/legion/portfolio.md` (both occurrences)
- Renamed GitHub label constant from "agency" to "legion"
- Updated all 40 `/agency:` command references to `/legion:` across all integration points

## Task Commits

Each task was committed atomically:

1. **Tasks 1-3: Read baseline, apply substitutions, verify** - `a772397` (feat)

**Plan metadata:** (docs commit — pending)

## Files Created/Modified
- `skills/workflow-common/SKILL.md` — Full /agency: -> /legion: namespace rebrand (47 substitutions, 0 remnants)

## Decisions Made
- Used single atomic Write instead of incremental Edits — prevents partial-state risk when making 47 substitutions across 374 lines
- Tasks 1 and 3 (read + verify) were folded into a single commit with Task 2 since they produced no file changes

## Deviations from Plan

None — plan executed exactly as written. Baseline count confirmed at 47, all substitutions applied in one Write operation, all post-write checks passed on first attempt.

## Issues Encountered

None — grep -ic "agency" returned 0, grep -ic "legion" returned 47, all locked-text spot-checks confirmed on first read-back.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- Phase 24 complete: workflow-common is the shared constants foundation with /legion: namespace
- Phase 25 (Commands) can proceed: all 10 commands reference /legion: patterns from this file
- Phase 26 (Skills) can proceed: remaining 16 skill files consume workflow-common conventions

---
*Phase: 24-foundation*
*Completed: 2026-03-02*
