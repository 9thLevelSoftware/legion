---
phase: 37-authority-boundaries
plan: 04
subsystem: execution

tags: [two-wave, parallel-execution, wave-executor, build-command, gates]

requires:
  - phase: 37-01
    provides: Authority matrix infrastructure and enforcer skill
  - phase: 37-02
    provides: Wave executor with authority injection
  - phase: 37-03
    provides: Review panel deduplication and filtering

provides:
  - Two-wave execution mode in /legion:build command
  - Wave A (Build + Analysis) protocol
  - Wave B (Execution + Remediation) protocol
  - Architecture Gate between Wave A and Wave B
  - Production Readiness Gate after Wave B
  - Two-wave manifest template for plan authors

affects:
  - commands/build
  - skills/wave-executor
  - .planning/templates

tech-stack:
  added: []
  patterns:
    - Two-wave execution pattern (Wave A/Wave B)
    - Service group parallelization
    - Dual-stream validation (execution + remediation)
    - Gate-based quality control

key-files:
  created:
    - .planning/templates/two-wave-manifest.md — Template for two-wave phase plans
    - skills/wave-executor/WAVE-A.md — Wave A execution protocol
    - skills/wave-executor/WAVE-B.md — Wave B execution protocol
  modified:
    - commands/build.md — Added two-wave execution mode

key-decisions:
  - "Auto-detection of two-wave mode based on plan count (>=4) and service groups"
  - "Parallel execution of build per service group, not just per plan"
  - "Remediation runs parallel to validation (not sequential) for faster feedback"
  - "Architecture Gate is mandatory if analysis plans exist, skippable otherwise"
  - "Three-verdict system: PASS, NEEDS_WORK, FAIL for production readiness"

patterns-established:
  - "Two-Wave Pattern: Wave A (Build+Analysis) → Gate → Wave B (Execution+Remediation) → Gate"
  - "Service Group Parallelism: Group plans by service, run groups in parallel"
  - "Dual-Stream Validation: Execution tests + Remediation chaos run simultaneously"
  - "Gate-Based Quality: Architecture review before Wave B, production readiness after Wave B"
  - "Wave Role Specialization: build|analysis|execution|remediation for clear responsibilities"

requirements-completed: [WAVE-02, WAVE-03, WAVE-04, WAVE-05]

duration: 12min
completed: 2026-03-05
---

# Phase 37 Plan 04: Two-Wave Execution Pattern Summary

**Two-wave execution mode with Wave A (Build+Analysis), Wave B (Execution+Remediation), Architecture Gate, and Production Readiness Gate for maximum parallelism with quality control**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-05T00:00:00Z
- **Completed:** 2026-03-05T00:12:00Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- Build command now supports two-wave execution with auto-detection based on plan count and service groups
- Wave A protocol documented: parallel builds per service group, analysis agents with read-only access, Architecture Gate
- Wave B protocol documented: parallel Execution Stream (tests) + Remediation Stream (chaos), synthesis of findings, Production Readiness Gate
- Two-wave manifest template created for plan authors with wave_role, service_group, and authority_scope fields
- Three-verdict system for production readiness: PASS, NEEDS_WORK, or FAIL

## Task Commits

Each task was committed atomically:

1. **Task 1: Update build command with two-wave execution** — `99d055d` (feat)
2. **Task 2: Create two-wave manifest template** — `39980da` (feat)
3. **Task 3: Create Wave A execution protocol** — `9bc0b43` (feat)
4. **Task 4: Create Wave B execution protocol** — `71beacb` (feat)

**Plan metadata:** `TBD` (docs: complete plan)

## Files Created/Modified

- `commands/build.md` — Added Two-Wave Execution Mode section with auto-detection, Wave A/Wave B flow, and command options (--two-wave, --single-wave, --skip-gates)
- `.planning/templates/two-wave-manifest.md` — Template for two-wave phase plans with wave roles, service groups, and gate documentation
- `skills/wave-executor/WAVE-A.md` — Wave A execution protocol: Build Phase, Analysis Phase, Architecture Gate, manifest generation
- `skills/wave-executor/WAVE-B.md` — Wave B execution protocol: Execution Stream, Remediation Stream, Production Readiness Gate, synthesis

## Decisions Made

1. **Auto-detection over manual flag**: Two-wave mode activates automatically when phase has >=4 plans spanning multiple service groups OR includes analysis tasks. Manual --two-wave flag available for override.

2. **Service group parallelization**: Within Wave A, plans are grouped by service (frontend, backend, shared) and each group runs in parallel. Cross-service groups also run in parallel.

3. **Dual-stream Wave B**: Execution (tests, validation) and Remediation (chaos, data analysis) run simultaneously, not sequentially. Findings are synthesized after both complete.

4. **Three-verdict system**: Production Readiness Gate produces PASS (complete phase), NEEDS_WORK (offer fix cycle), or FAIL (block completion). Gives user clear action paths.

5. **Analysis agents get read-only access**: Security/architecture agents review Wave A outputs without modifying them. Keeps concerns separated.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All requirements WAVE-02, WAVE-03, WAVE-04, WAVE-05 satisfied
- Two-wave pattern is functional and documented end-to-end
- Next: Phase 37 is complete. Ready for Phase 38 or milestone completion.

---
*Phase: 37-authority-boundaries*
*Completed: 2026-03-05*
