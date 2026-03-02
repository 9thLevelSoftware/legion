# Phase 7: Portfolio Management — Context

## Phase Goal
Users can manage multiple Agency projects through a global portfolio registry, with a dashboard showing cross-project status, dependencies, and agent allocation. The Studio Producer agent provides strategic coordination insights for cross-project decisions.

## Requirements Covered
- PORT-01: Multi-project portfolio management — track multiple projects with shared agent pool
- PORT-02: Studio Producer agent coordination — orchestrate cross-project dependencies and resources

## What Already Exists (from Phases 1-6)

### Functional Commands
| Command | Status | Purpose |
|---------|--------|---------|
| `/agency:start` | Functional | Project initialization with questioning flow |
| `/agency:plan` | Functional | Phase decomposition with agent recommendations |
| `/agency:build` | Functional | Parallel agent execution using Teams |
| `/agency:review` | Functional | Quality gate with dev-QA loops |
| `/agency:status` | Functional | Progress dashboard and next-action routing |
| `/agency:quick` | Functional | Ad-hoc single-task execution |

### Supporting Skills (all ready to use)
- `.claude/skills/agency/workflow-common.md` — state paths, plan file conventions, wave execution pattern, cost profiles, personality injection pattern, error handling pattern, division constants
- `.claude/skills/agency/agent-registry.md` — 51-agent catalog, task type index, recommendation algorithm, team assembly patterns
- `.claude/skills/agency/questioning-flow.md` — 3-stage adaptive conversation engine
- `.claude/skills/agency/phase-decomposer.md` — wave-structured plan decomposition
- `.claude/skills/agency/wave-executor.md` — parallel execution with personality injection
- `.claude/skills/agency/execution-tracker.md` — progress tracking, state updates, atomic commits
- `.claude/skills/agency/review-loop.md` — dev-QA loop with fix routing and escalation

### State Files (per-project)
- `.planning/PROJECT.md` — project vision, requirements, constraints
- `.planning/ROADMAP.md` — phase breakdown with goals, requirements, success criteria, progress table
- `.planning/STATE.md` — current position, recent activity, next action
- `.planning/REQUIREMENTS.md` — requirement tracking with traceability

### Key Agent: Studio Producer
- `agency-agents/project-management/project-management-studio-producer.md`
- Executive portfolio orchestrator with strategic planning templates
- Includes Strategic Portfolio Plan Template and Portfolio Review Template
- Performance metrics: 25% ROI, 95% on-time delivery, 4.8/5 satisfaction
- Capabilities: cross-project dependency management, resource allocation, risk assessment

### Claude Code Primitives Available
- **Agent tool**: Spawn subagents with `subagent_type`, `prompt`, `model`, `name`
- **AskUserQuestion**: Structured choices for user confirmation
- **Bash**: Git commands for atomic commits, filesystem operations
- **Read/Write/Edit**: File operations (including reading from `~/.claude/` paths)

## Key Design Decisions

### Global portfolio registry at `~/.claude/agency/portfolio.md`
The portfolio registry lives outside any project directory at `~/.claude/agency/portfolio.md`. This global location:
- Survives project directory moves
- Is accessible from any project directory
- Follows Claude Code's `~/.claude/` convention for user-level config
- Is automatically created by `/agency:start` when registering a project

### New `/agency:portfolio` command (not extending `/agency:status`)
Portfolio management is a distinct workflow separate from per-project status. `/agency:status` stays focused on the current project. `/agency:portfolio` provides cross-project visibility. This keeps both commands focused and follows the single-responsibility pattern.

### Scope: Dashboard + Cross-Project Dependencies
Phase 7 delivers:
- Multi-project dashboard (all projects with status, progress, health)
- Cross-project dependency tracking (which project phases block other project phases)
- Agent allocation visibility (which agents are commonly used across projects)
- Studio Producer insights (strategic coordination via personality injection)

Phase 7 does NOT include (deferred):
- Agent reservation/locking across projects
- Token budget tracking per project
- Priority-based scheduling
- Automated resource rebalancing

### Portfolio state aggregation is read-time, not sync-time
The portfolio skill reads each project's STATE.md and ROADMAP.md when the dashboard is requested. There's no background sync or push mechanism. This keeps the system simple, stateless, and reliable. The portfolio registry stores project paths and metadata — live state is always read fresh from project directories.

### Studio Producer invocation is on-demand
The portfolio command offers Studio Producer analysis as an opt-in step. Users can view the dashboard without invoking the agent. When requested, Studio Producer analyzes cross-project state and provides strategic recommendations. This respects the cost profile (Opus for strategic decisions) while keeping the basic dashboard lightweight (Haiku-tier).

## Existing Patterns to Follow
- **Personality Injection** (workflow-common.md): Read agent .md -> construct prompt with personality + task -> spawn via Agent tool
- **Agent Selection** (agent-registry.md Section 3): Parse task -> match agents -> rank -> cap size -> present to user
- **State Updates** (workflow-common.md): Read STATE.md -> update fields -> write back
- **Cost Profiles** (workflow-common.md): Opus for planning/strategic, Sonnet for execution, Haiku for checks
- **Error Handling** (workflow-common.md): Capture errors, don't auto-retry, report to user
- **Command Structure**: YAML frontmatter + objective + execution_context + context + process sections

## Plan Structure
- **Plan 07-01 (Wave 1)**: Portfolio Manager skill + registration integration — creates the portfolio-manager skill, updates workflow-common with portfolio paths, modifies /agency:start to auto-register projects
- **Plan 07-02 (Wave 2)**: Portfolio command + Studio Producer integration — creates /agency:portfolio command wiring the portfolio-manager skill with Studio Producer personality for strategic insights
