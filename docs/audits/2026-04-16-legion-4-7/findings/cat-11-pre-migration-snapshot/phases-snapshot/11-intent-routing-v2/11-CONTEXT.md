# Phase 11: Intent Routing v2 -- Context

## Phase Goal
Add natural language intent parsing and context-aware intent suggestions based on project state.

## Requirements Covered
- INTENT-07: Natural language intent parsing for command routing — parse free-text queries like "fix the tests" or "harden security" into command+flags with confidence scoring and fallback to explicit commands
- INTENT-08: Context-aware intent suggestions based on project state — read STATE.md current position to recommend next actions (e.g., "phase planned but not built" suggests `/legion:build`)

## What Already Exists (from prior phases)

### Intent Router Infrastructure (v5.0)
- `skills/intent-router/SKILL.md` — 6 sections: flag parsing, validation engine, team template resolution, execution mode detection, filter predicates, integration guide
- `.planning/config/intent-teams.yaml` — 5 intent definitions (harden, document, skip-frontend, skip-backend, security-only) with validation rules and task type taxonomy
- `commands/build.md` — consumes intent flags via `parseIntentFlags()` for build execution
- `commands/review.md` — consumes intent flags for review filtering
- `skills/agent-registry/CATALOG.md` Section 2 — intent-to-agent mappings for harden/document/security-only

### Current Intent System Limitations
- Only supports structured `--just-*` and `--skip-*` flags — no natural language input
- No awareness of project state — suggestions are static, not contextual
- Users must know exact flag names to use intent routing

### Project State Infrastructure
- `.planning/STATE.md` — tracks current phase, status, last activity, next action
- `commands/status.md` — displays progress dashboard
- 12 commands available for routing targets

## Key Design Decisions
- **Wave structure**: 2 waves — NL parsing foundation first (Wave 1), then context-aware suggestions that build on it (Wave 2)
- **Agent selection**: AI engineer for NL pattern matching (Plan 01), senior developer for integration work (Plan 02)
- **Architecture proposals**: Skipped — 2 requirements, straightforward enhancement of existing skill
- **Approach**: Extend existing intent-router skill with new sections rather than creating new skills. NL parsing adds pattern matching on top of existing flag parsing. Context suggestions read STATE.md and map lifecycle positions to recommended actions.

## Plan Structure
- **Plan 11-01 (Wave 1)**: Natural Language Intent Parsing -- add NL parsing section to intent-router, extend intent-teams.yaml with NL patterns, update build/review commands
- **Plan 11-02 (Wave 2)**: Context-Aware Intent Suggestions -- add context suggestion engine to intent-router, integrate with status command, verification tests
