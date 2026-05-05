---
phase: 37-authority-boundaries
plan: 02
subsystem: wave-execution

tags:
  - wave-executor
  - authority-injection
  - two-wave-pattern
  - agent-prompts
  - parallel-execution

requires:
  - phase: 37-authority-boundaries
    provides: authority matrix infrastructure and wave-executor base functionality

provides:
  - Authority constraint injection into agent prompts via AUTHORITY_CONTEXT
  - Step 3.6 for loading authority constraints from authority matrix
  - Step 3.7 for enforcing authority during agent spawn with conflict detection
  - Section 7 documenting Two-Wave Pattern (Wave A: Build+Analysis, Wave B: Execution+Remediation)
  - Agent prompt template at .planning/templates/agent-prompt.md with authority sections
  - Wave role, wave_a_outputs, and authority_scope frontmatter fields
  - Gates: Requirements, Architecture, Production Readiness

affects:
  - skills/wave-executor
  - .planning/templates
  - agent prompt construction


tech-stack:
  added: []
  patterns:
    - "Authority injection: AUTHORITY_CONTEXT block injected into agent prompts"
    - "Two-wave pattern: Wave A (Build+Analysis) → Wave B (Execution+Remediation)"
    - "Domain ownership: Exclusive domains per agent with deferral rules"
    - "Prompt templating: Handlebars-style variable substitution for authority sections"

key-files:
  created:
    - ".planning/templates/agent-prompt.md — Reusable agent prompt template with authority boundaries and deferral rules"
  modified:
    - "skills/wave-executor/SKILL.md — Added Steps 3.6 and 3.7, updated Step 4, added Section 7"

key-decisions:
  - "AUTHORITY_CONTEXT is empty string when authority matrix doesn't exist (graceful degradation)"
  - "Two-wave pattern activates on plan count >= 4, overridable via two_wave frontmatter flag"
  - "Analysis agents (security, architecture) spawned last in Wave A for review positioning"
  - "Handlebars-style {{}} syntax chosen for template variables for consistency with other templates"

patterns-established:
  - "Authority Reminder section: Visual ownership indicators (✅ OWN, ❌ DEFER) in agent prompts"
  - "Wave role taxonomy: build | analysis | execution | remediation"
  - "Gate pattern: Requirements (implicit) → Architecture (optional) → Production Readiness"

requirements-completed:
  - AUTH-02
  - WAVE-01

duration: 15 min
completed: 2026-03-05
---

# Phase 37 Plan 02: Wave Executor Authority Injection Summary

**Wave executor with authority constraint injection and two-wave parallel execution pattern support**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-05T15:00:00Z
- **Completed:** 2026-03-05T15:15:00Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- **AUTH-02:** Wave executor now injects authority constraints into agent prompts via AUTHORITY_CONTEXT block
- **WAVE-01:** Two-wave pattern fully documented with Wave A (Build+Analysis) and Wave B (Execution+Remediation)
- Agent prompt template created with exclusive domain ownership and deferral rules

## task Commits

Each task was committed atomically:

1. **Task 1: Add authority constraint injection** — `e8c1b5e` (feat)
2. **Task 2: Add two-wave pattern support** — `283448b` (feat)
3. **Task 3: Create agent prompt template** — `8274f92` (feat)

**Plan metadata:** Pending (this summary)

## Files Created/Modified

- `skills/wave-executor/SKILL.md` (710 → 852 lines, +142 lines)
  - Added Step 3.6: Load authority constraints from authority matrix
  - Added Step 3.7: Enforce authority during agent spawn with conflict detection
  - Updated Step 4: Prompt construction now includes AUTHORITY_CONTEXT
  - Added Section 7: Two-Wave Pattern with wave roles, gates, and activation criteria
- `.planning/templates/agent-prompt.md` (NEW, 116 lines)
  - Reusable agent prompt template with Handlebars-style variable substitution
  - AUTHORITY_CONTEXT section with exclusive domains and deferral rules
  - Authority Reminder section with visual ✅/❌ indicators
  - Variable reference table documenting all substitution tokens

## Decisions Made

1. **Graceful degradation for missing authority matrix:** When `.planning/config/authority-matrix.yaml` doesn't exist, AUTHORITY_CONTEXT is set to empty string rather than failing. This allows existing phases without authority configuration to continue working.

2. **Analysis agents spawn last in Wave A:** Security-engineer and backend-architect agents are spawned after build agents complete, ensuring they review completed outputs rather than racing alongside builders.

3. **Handlebars-style template syntax:** Consistent with other Legion templates, using `{{variable}}` and `{{#if}}`/`{{#each}}` constructs for conditional and list rendering.

4. **Three-tier gate system:**
   - Requirements Gate (implicit, automatic)
   - Architecture Gate (optional, user decision)
   - Production Readiness Gate (mandatory, PASS/NEEDS_WORK/FAIL verdict)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Requirements satisfied:**
- ✅ AUTH-02: Wave executor injects authority constraints into agent prompts
- ✅ WAVE-01: Two-wave pattern documented with Wave A (Build+Analysis) and Wave B (Execution)

**Ready for Plan 37-03:** Review panel deduplication and filtering (AUTH-03, AUTH-04)

**Blockers:** None

---
*Phase: 37-authority-boundaries*
*Completed: 2026-03-05*
