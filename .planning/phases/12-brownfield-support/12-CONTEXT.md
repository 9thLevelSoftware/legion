# Phase 12: Brownfield Support -- Context

## Phase Goal
Before planning phases on an existing codebase, the system maps what's already there — patterns, frameworks, dependencies, and risk areas.

## Requirements Covered
- BROWN-01: Codebase mapping — analyze existing codebase before planning phases
- BROWN-02: Dependency detection — identify existing patterns, frameworks, conventions
- BROWN-03: Risk assessment — flag areas of complexity or technical debt before agent work

## What Already Exists (from prior phases)

### Skills (all at `.claude/skills/agency/`)
- `workflow-common.md` — Shared constants, paths, conventions (includes Portfolio, Milestone, Memory, GitHub Conventions sections)
- `agent-registry.md` — 51 agent registry with recommendation algorithm and custom agent support
- `questioning-flow.md` — 3-stage adaptive questioning engine
- `phase-decomposer.md` — Phase decomposition into wave-structured plans with agent recommendation
- `wave-executor.md` — Parallel execution engine with personality injection
- `execution-tracker.md` — Progress tracking with STATE.md updates and atomic commits
- `review-loop.md` — Dev-QA loop engine with structured feedback and escalation
- `portfolio-manager.md` — Multi-project registry and state aggregation
- `milestone-tracker.md` — Milestone lifecycle management with archiving
- `memory-manager.md` — Cross-session learning with outcome store/recall/decay
- `agent-creator.md` — Guided agent creation with schema validation
- `github-sync.md` — GitHub issue/PR/milestone integration with graceful degradation

### Commands (all at `.claude/commands/agency/`)
- `start.md` — Project initialization with questioning flow (9-step process)
- `plan.md` — Phase planning with agent recommendation (11-step process with GitHub issue creation)
- `build.md` — Parallel execution with Teams-based agent spawning
- `review.md` — Quality review with dev-QA loops
- `status.md` — Progress dashboard with session resume
- `quick.md` — Ad-hoc single-task execution
- `portfolio.md` — Multi-project dashboard
- `milestone.md` — Milestone completion and archiving
- `agent.md` — Custom agent creation

### State Files
- `.planning/PROJECT.md` — Project vision, requirements, constraints
- `.planning/ROADMAP.md` — Phase breakdown with progress tracking
- `.planning/STATE.md` — Current position, recent activity, next action
- `.planning/REQUIREMENTS.md` — Requirements with traceability
- `.planning/memory/OUTCOMES.md` — Agent performance records (optional)

### Established Conventions
- Skills follow a numbered-section structure with constants, error handling, and graceful degradation
- All optional features (Memory, GitHub) use the degradation pattern: check file/tool → if available: use → if not: skip silently
- State files are human-readable markdown
- CODEBASE.md will follow this same pattern

## Key Design Decisions
- **Follows github-sync model exactly**: skill first (Wave 1), integration second (Wave 2) — proven in Phases 9, 10, 11
- **Heuristic-based detection**: File presence + content grep, not AST or LSP analysis — appropriate for Claude Code's tool set and the no-custom-tooling constraint
- **Depth-limited analysis**: Max 2-3 directory levels for tree, counts rather than exhaustive enumeration — avoids context window exhaustion on large codebases
- **Two-stage framework detection**: File presence check THEN content verification — avoids false positives
- **Relative risk scoring**: Per-file rates, not absolute counts — calibrated to project size
- **Opt-in via AskUserQuestion**: start.md detects existing codebase and asks user whether to analyze — never mandatory
- **Staleness warnings**: plan.md checks CODEBASE.md age (>30 days = stale) — warn, don't auto-re-analyze
- **CODEBASE.md as single artifact**: One markdown file with structured sections — consistent with all other Agency state files
- **engineering-backend-architect for skill creation**: Risk assessment and architecture analysis require architectural judgment
- **agents-orchestrator for integration**: Wiring a skill into multiple commands is pipeline/orchestration work

## Plan Structure
- **Plan 12-01 (Wave 1)**: codebase-mapper skill — 6-section brownfield analysis engine with map generation, pattern detection, risk assessment, format spec, integration patterns, plus workflow-common Brownfield Conventions section
- **Plan 12-02 (Wave 2)**: Workflow integration — update start.md (brownfield detection branch), plan.md (CODEBASE.md context injection), REQUIREMENTS.md (check BROWN-01/02/03), CLAUDE.md (document brownfield support)
