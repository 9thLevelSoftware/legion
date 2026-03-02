# Phase 9: Cross-Session Learning — Context

## Phase Goal
A lightweight "daem0n-lite" memory layer — Agency workflows explicitly store and recall outcomes to improve over time. Inspired by Daem0n-MCP's proven patterns (semantic memory, outcome tracking, importance scoring, decay) but passive and opt-in, not hook-driven.

## Requirements Covered
- LEARN-01: Memory skill — lightweight semantic memory inspired by Daem0n-MCP patterns (store, recall, decay) called explicitly by Agency workflows, not via hooks
- LEARN-02: Outcome recording — after build/review, store agent performance, task outcomes, and review findings with importance scoring
- LEARN-03: Pattern recall — during plan/agent selection, query past outcomes to improve recommendations (falls back to registry algorithm if no memory available)
- LEARN-04: Session briefing — richer resume via stored decision history and recent outcomes, enhancing STATUS.md-only restore
- LEARN-05: Graceful degradation — all memory integration is optional; workflows function identically without it

## What Already Exists (from Phases 1-8)

### Functional Commands
| Command | Status | Purpose |
|---------|--------|---------|
| `/agency:start` | Functional | Project initialization with questioning flow |
| `/agency:plan` | Functional | Phase decomposition with agent recommendations |
| `/agency:build` | Functional | Parallel agent execution using Teams |
| `/agency:review` | Functional | Quality gate with dev-QA loops |
| `/agency:status` | Functional | Progress dashboard and next-action routing |
| `/agency:quick` | Functional | Ad-hoc single-task execution |
| `/agency:portfolio` | Functional | Multi-project tracking |
| `/agency:milestone` | Functional | Milestone completion, archiving, and metrics |

### Supporting Skills (all ready to use)
- `.claude/skills/agency/workflow-common.md` — state paths, plan file conventions, wave execution, cost profiles, personality injection, error handling, division constants, portfolio conventions, milestone conventions
- `.claude/skills/agency/agent-registry.md` — 51-agent catalog, task type index, recommendation algorithm (6 steps), team assembly patterns
- `.claude/skills/agency/questioning-flow.md` — 3-stage adaptive conversation engine
- `.claude/skills/agency/phase-decomposer.md` — wave-structured plan decomposition (8 sections)
- `.claude/skills/agency/wave-executor.md` — parallel execution with personality injection
- `.claude/skills/agency/execution-tracker.md` — progress tracking, state updates, atomic commits (7 sections)
- `.claude/skills/agency/review-loop.md` — dev-QA loop with fix routing and escalation (9 sections)
- `.claude/skills/agency/portfolio-manager.md` — multi-project registry, state aggregation, dependencies
- `.claude/skills/agency/milestone-tracker.md` — milestone format, completion, archiving, summary generation (6 sections)

### State Files (per-project)
- `.planning/PROJECT.md` — project vision, requirements, constraints
- `.planning/ROADMAP.md` — phase breakdown with goals, requirements, success criteria, progress table
- `.planning/STATE.md` — current position, recent activity, next action
- `.planning/REQUIREMENTS.md` — requirement tracking with traceability
- `.planning/phases/{NN-name}/` — phase plan and summary files

### Claude Code Primitives Available
- **Agent tool**: Spawn subagents with `subagent_type`, `prompt`, `model`, `name`
- **AskUserQuestion**: Structured choices for user confirmation
- **Bash**: Git commands for atomic commits, filesystem operations (mkdir, test -d)
- **Read/Write/Edit**: File operations
- **Glob/Grep**: File discovery and content search

## Key Design Decisions

### Memory is a single-file outcome log at `.planning/memory/OUTCOMES.md`
One structured markdown table tracking agent outcomes across build/review cycles. No binary state, no database, no JSON — pure markdown consistent with all other Agency state. A single file avoids the complexity of managing multiple memory fragments while the table format enables efficient grep-based querying.

### Decay is computed at recall time, not via background processes
Each outcome record has a timestamp and importance score. When memory is recalled, a recency weight is applied (1.0 for 7d, 0.7 for 30d, 0.4 for 90d, 0.1 for 90d+). This keeps the system hook-free and passive — no background pruning, no scheduled tasks, no side effects. Records are never auto-deleted; they just contribute less to recommendations over time.

### Memory boosts supplement the existing recommendation algorithm
The agent-registry's Section 3 recommendation algorithm is the source of truth. Memory adds a bonus score to agents who have performed well on similar task types. Memory cannot override mandatory roles (testing agent for code, coordinator for cross-division) or division alignment. It only adjusts tie-breaking and ranking.

### All integration is guarded by file existence checks
Every workflow that calls memory first checks if `.planning/memory/OUTCOMES.md` exists. If not, the workflow proceeds identically to how it works today. This satisfies LEARN-05 (graceful degradation) at the code level, not just the documentation level.

### Outcome recording happens in the plan completion flow
Memory writes happen between STATE.md update and the git commit in execution-tracker Section 2. The `git add -A` in the plan completion commit includes memory file changes automatically. No separate memory commits needed.

### Session briefing enriches /agency:status, not /agency:start
Status is the session-resume command. Adding memory context (recent outcomes, agent performance trends) to the status dashboard makes session handoff richer. Start is for new projects and doesn't benefit from memory.

## Existing Patterns to Follow
- **State Update Pattern** (workflow-common.md): Read → Update → Write
- **Commit Convention** (execution-tracker.md Section 6): Conventional commits with `(agency)` scope
- **Cost Profiles** (workflow-common.md): Haiku for status display, Sonnet for execution
- **Error Handling** (workflow-common.md): Capture, update state, report to user, don't auto-retry
- **Command Structure**: YAML frontmatter + objective + execution_context + context + process
- **Graceful Degradation**: Check existence → use if available → skip silently if not

## Plan Structure
- **Plan 09-01 (Wave 1)**: Memory Manager skill + workflow-common and execution-tracker updates — creates the memory-manager skill defining outcome format, store/recall/decay operations; updates workflow-common with memory paths; updates execution-tracker with memory recording step
- **Plan 09-02 (Wave 2)**: Outcome recording integration — updates build.md to record outcomes after execution; updates review.md to record outcomes after review; updates agent-registry.md with memory boost step in recommendation algorithm
- **Plan 09-03 (Wave 2)**: Pattern recall + session briefing + state updates — updates phase-decomposer.md with memory-enhanced recommendation; updates plan.md and status.md execution_context; updates status.md with memory section in dashboard; updates REQUIREMENTS.md, CLAUDE.md, ROADMAP.md, STATE.md
