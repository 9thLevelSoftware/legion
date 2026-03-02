# Phase 8: Milestone Management — Context

## Phase Goal
Users can group phases into milestones, mark milestones complete with summary reports and metrics, and archive completed milestone artifacts to reduce active state clutter — while keeping archived work accessible.

## Requirements Covered
- MILE-01: Milestone completion — mark milestones done with summary and metrics
- MILE-02: Milestone archiving — archive completed milestone artifacts to reduce active state

## What Already Exists (from Phases 1-7)

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

### Supporting Skills (all ready to use)
- `.claude/skills/agency/workflow-common.md` — state paths, plan file conventions, wave execution, cost profiles, personality injection, error handling, division constants, portfolio conventions
- `.claude/skills/agency/agent-registry.md` — 51-agent catalog, task type index, recommendation algorithm
- `.claude/skills/agency/questioning-flow.md` — 3-stage adaptive conversation engine
- `.claude/skills/agency/phase-decomposer.md` — wave-structured plan decomposition
- `.claude/skills/agency/wave-executor.md` — parallel execution with personality injection
- `.claude/skills/agency/execution-tracker.md` — progress tracking, state updates, atomic commits (7 sections)
- `.claude/skills/agency/review-loop.md` — dev-QA loop with fix routing and escalation
- `.claude/skills/agency/portfolio-manager.md` — multi-project registry, state aggregation, dependencies

### State Files (per-project)
- `.planning/PROJECT.md` — project vision, requirements, constraints
- `.planning/ROADMAP.md` — phase breakdown with goals, requirements, success criteria, progress table
- `.planning/STATE.md` — current position, recent activity, next action
- `.planning/REQUIREMENTS.md` — requirement tracking with traceability
- `.planning/phases/{NN-name}/` — phase plan and summary files

### Relevant Agents
- `project-management/project-management-project-shepherd.md` — coordinates phase execution, project health
- `project-management/project-management-studio-producer.md` — strategic portfolio insights, milestone analysis
- `product/product-sprint-prioritizer.md` — milestone/sprint planning expertise

### Claude Code Primitives Available
- **Agent tool**: Spawn subagents with `subagent_type`, `prompt`, `model`, `name`
- **AskUserQuestion**: Structured choices for user confirmation
- **Bash**: Git commands for atomic commits, filesystem operations (mkdir, mv, test -d)
- **Read/Write/Edit**: File operations
- **Glob/Grep**: File discovery and content search

## Key Design Decisions

### Milestones are a lightweight grouping layer in ROADMAP.md
Milestones are defined as a `## Milestones` section in ROADMAP.md, grouping consecutive phases by name. No separate MILESTONES.md file — milestones belong in the roadmap alongside phases. This follows the "minimal state, human-readable markdown" principle.

### Milestone format in ROADMAP.md
```markdown
## Milestones

### Milestone 1: {name}
- **Phases**: {start}-{end}
- **Goal**: {one-line milestone goal}
- **Status**: Pending | In Progress | Complete | Archived

### Milestone 2: {name}
...
```

### Milestone summaries stored in `.planning/milestones/`
Each completed milestone generates a summary file at `.planning/milestones/MILESTONE-{N}.md` with metrics, key outcomes, decisions, and an archive manifest. This is a durable record even after archiving.

### Archiving moves phase directories to `.planning/archive/`
When a milestone is archived:
- Phase directories move from `.planning/phases/{NN-name}/` to `.planning/archive/milestone-{N}/{NN-name}/`
- The milestone summary in `.planning/milestones/` lists what was archived and where
- STATE.md phase results for archived milestones are condensed to a one-line reference
- ROADMAP.md phase rows keep their status but gain an "Archived" note
- Archived files are still readable — just out of the active directory

### Auto-detection over subcommands
The `/agency:milestone` command auto-detects what action is appropriate based on project state (like `/agency:status` does routing), then presents options via AskUserQuestion. No subcommand syntax needed.

### Milestone definition is a first-class operation
For existing projects that don't have milestones defined yet, the command offers an interactive "define milestones" flow that proposes logical phase groupings from the roadmap.

### Kept minimal per PROJECT.md constraint
PROJECT.md explicitly says GSD's milestone system was left behind as "too heavy." Phase 8 is deliberately lightweight:
- No milestone-specific planning or execution — milestones are a bookkeeping/summary layer
- No milestone-level dependencies (cross-project dependencies are in portfolio)
- No milestone-level agent assignment
- No complex archive/restore lifecycle — archive is a one-way move with full accessibility

## Existing Patterns to Follow
- **State Update Pattern** (workflow-common.md): Read → Update → Write STATE.md
- **Commit Convention** (execution-tracker.md Section 6): Conventional commits with `(agency)` scope
- **Cost Profiles** (workflow-common.md): Haiku for status display, Sonnet for summary generation
- **Error Handling** (workflow-common.md): Capture, update state, report to user, don't auto-retry
- **Command Structure**: YAML frontmatter + objective + execution_context + context + process
- **Personality Injection**: Full agent .md → prompt construction → Agent tool spawn

## Plan Structure
- **Plan 08-01 (Wave 1)**: Milestone Tracker skill + workflow-common and execution-tracker updates — creates the milestone-tracker skill defining milestone format, completion logic, archiving rules, and summary generation; updates workflow-common with milestone paths; adds milestone commit type to execution-tracker
- **Plan 08-02 (Wave 2)**: `/agency:milestone` command + status integration + state updates — creates the command wiring the milestone-tracker skill, updates `/agency:status` to show milestone info, updates CLAUDE.md/REQUIREMENTS.md/ROADMAP.md/STATE.md
