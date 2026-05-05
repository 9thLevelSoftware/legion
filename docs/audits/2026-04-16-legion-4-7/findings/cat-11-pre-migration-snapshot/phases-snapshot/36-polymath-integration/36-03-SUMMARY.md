---
phase: 36-polymath-integration
plan: 03
type: execute
wave: 2
depends_on: [36-01, 36-02]
subsystem: command-integration
tags: [polymath, exploration, start-command, workflow-integration, crystallization]
decisions:
  - Exploration offered as optional Step 2 in /legion:start (not mandatory, default is "Yes")
  - Seamless transition from exploration to start via crystallized summary pre-population
  - Park decision preserves exploration output for later continuation
key-files:
  created: []
  modified:
    - commands/start.md
    - skills/workflow-common/SKILL.md
    - skills/agent-registry/CATALOG.md
metrics:
  duration: "15 minutes"
  completed_date: "2026-03-05"
  tasks_completed: 3
  commits: 3
---

# Phase 36 Plan 03: Polymath Integration Summary

## One-Liner
Integrated the Polymath exploration workflow into `/legion:start` command, enabling users to crystallize vague ideas before committing to formal project planning.

## What Was Built

### 1. Updated `/legion:start` Command (`commands/start.md`)
**Exploration Offer Integration:**
- Inserted new **Step 2: EXPLORATION OFFER** between pre-flight check and brownfield detection
- User sees: "Before we create your project plan, would you like to explore and clarify your idea first?"
- Options: "Yes, explore with Polymath" (default) or "No, jump straight to planning"

**Transition Handling:**
- **Proceed path**: Exploration → capture crystallized summary → pre-populate Stage 1 questioning → continue to brownfield detection
- **Explore more path**: Loop back to exploration with narrowed scope
- **Park path**: Save exploration output to `.planning/exploration-{timestamp}.md` and exit gracefully

**Step Renumbering:**
- Brownfield detection: step 2 → step 3
- Ensure directory structure: step 3 → step 4
- Stage 1 questioning: step 4 → step 5 (with exploration integration)
- All subsequent steps incremented accordingly (5-11 → 6-12)

**Stage 1 Integration:**
- If exploration completed: Skip "What are you building?", open with crystallized summary
- If no exploration: Standard questioning flow unchanged
- Pre-populates: project_name, project_description, value_proposition from exploration

**Decision Matrix Added:**
```
| Exploration completed | Use crystallized summary in Stage 1 | Pre-populate questioning |
| User skipped exploration | Run standard Stage 1 questioning | No changes |
| Exploration parked | Exit start command, preserve exploration file | User can re-run start later |
```

### 2. Updated Workflow Common (`skills/workflow-common/SKILL.md`)
**Command-to-Skill Mapping Table:**
Added complete mapping table with `/legion:explore` entry (alphabetically placed after `/legion:build`):
- Primary skills: polymath-engine, questioning-flow
- Agent registry: Specialized (Polymath)
- Purpose: Entry point for pre-flight exploration with research-first workflow

**Command Relationships Section:**
Documented the two-phase entry pattern:
- `/legion:start` conditionally invokes `/legion:explore` before formal planning
- `/legion:explore` can transition to `/legion:start` when user selects "Proceed to planning"
- Forms: exploration (optional pre-alignment) → initialization (required formal planning)

**State File Locations:**
Added entry for Exploration Documents:
- Path: `.planning/exploration-{timestamp}.md`
- Purpose: Crystallized exploration outputs from `/legion:explore` sessions

**Pre-Flight Alignment Agent Reference:**
Added Polymath agent documentation:
- Role: Pre-flight alignment specialist
- Invoked by: `/legion:explore` command
- Key behaviors: Research-first workflow, structured choices only, 7-exchange limit
- Task types: exploration, clarification, research-first, structured-questions, gap-detection

### 3. Updated Agent Registry Catalog (`skills/agent-registry/CATALOG.md`)
**Verification:**
- Confirmed polymath entry exists in Specialized Division table (line 90)
- Verified task types: exploration, clarification, research-first, structured-questions, gap-detection

**Task Type Index Addition:**
Added new "Exploration & Clarification" section:
- Pre-flight Alignment: polymath
- Use case: Crystallize raw ideas through structured exploration before formal planning
- Task types listed for discoverability

## Decisions Made

1. **Exploration is optional but recommended**: Default selection is "Yes, explore with Polymath" but users can skip if they have a clear concept.

2. **Crystallized summary pre-population**: Instead of repeating questions, Stage 1 uses exploration output as a starting point for confirmation.

3. **Park preserves state**: Users who aren't ready to proceed don't lose their exploration work — it's saved for later continuation.

4. **Seamless transition UX**: The boundary between `/legion:explore` and `/legion:start` should feel like a continuous flow, not a jarring handoff.

## Requirements Satisfied

| Requirement | Status | Evidence |
|-------------|--------|----------|
| POLY-06 | ✅ Complete | `/legion:start` offers exploration option before formal planning |

## Deviations from Plan

**None** — Plan executed exactly as written.

All three tasks completed without deviations:
- Task 1: Start command updated with exploration option, proper step renumbering, and integration logic
- Task 2: Workflow-common updated with command mapping, state file locations, and command relationships
- Task 3: Agent registry verified and enhanced with Task Type Index section

## Self-Check: PASSED

- [x] `commands/start.md` contains "Explore first with Polymath, or jump straight to planning?" question
- [x] Start command properly renumbered (steps 1-12 sequential)
- [x] Start command references `/legion:explore`
- [x] Start command handles proceed/park transitions
- [x] Stage 1 questioning uses crystallized summary when exploration completed
- [x] `skills/workflow-common/SKILL.md` has `/legion:explore` in Command-to-Skill Mapping
- [x] Workflow-common documents exploration documents in State File Locations
- [x] Workflow-common documents Command Relationships (explore ↔ start)
- [x] `skills/agent-registry/CATALOG.md` has polymath entry with correct task types
- [x] All commits use conventional commit format

## Commits

| Hash | Message | Files |
|------|---------|-------|
| 0b62530 | feat(36-03): integrate exploration option into /legion:start command | commands/start.md |
| 38eb5b5 | feat(36-03): update workflow-common with exploration command mapping | skills/workflow-common/SKILL.md |
| 11afe88 | docs(36-03): verify and update agent registry catalog for polymath | skills/agent-registry/CATALOG.md |

## Next Steps

Phase 36 (Polymath Integration) is now complete with:
- Plan 01: Polymath agent + `/legion:explore` command ✅
- Plan 02: Polymath engine skill + exploration summary template ✅
- Plan 03: Integration with `/legion:start` ✅

The exploration workflow is now fully integrated into the Legion system as a first-class citizen. Users can:
1. Run `/legion:explore` standalone to crystallize ideas
2. Be offered exploration during `/legion:start` initialization
3. Transition seamlessly from exploration to formal planning
4. Park exploration output for later continuation

All requirements (POLY-01 through POLY-06) are satisfied.
