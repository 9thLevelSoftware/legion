# Phase 6: Status & Quick — Context

## Phase Goal
Users can check progress with `/agency:status` and run ad-hoc tasks with `/agency:quick`. New sessions can resume work by reading STATE.md, and the status dashboard routes users to the right `/agency:` command.

## Requirements Covered
- STATUS-01: `/agency:status` command — shows current progress and next action
- STATUS-02: `/agency:quick` command — lightweight single-task execution with agent selection
- STATUS-03: Session resume — read STATE.md to restore context on new session
- STATUS-04: Next-action routing — direct user to the right command based on project state

## What Already Exists (from Phases 1-5)

### Scaffold Commands
- `.claude/commands/agency/status.md` — has frontmatter (name, description, allowed-tools: Read/Grep/Glob), objective, execution_context referencing workflow-common, context referencing state files, and a 5-step process. Read-only command — no write permissions needed.
- `.claude/commands/agency/quick.md` — has frontmatter (name, description, argument-hint, allowed-tools: Read/Write/Edit/Bash/Grep/Glob), objective, execution_context referencing workflow-common and agent-registry, context referencing PROJECT.md and STATE.md, and a 7-step process.

### Supporting Skills (all ready to use)
- `.claude/skills/agency/workflow-common.md` — state paths, plan file conventions, wave execution pattern, cost profiles, personality injection pattern, error handling pattern, division constants
- `.claude/skills/agency/agent-registry.md` — 51-agent catalog (Section 1), task type index (Section 2), recommendation algorithm (Section 3), team assembly patterns (Section 4)
- `.claude/skills/agency/wave-executor.md` — parallel execution engine with personality injection (reference for agent spawning pattern)
- `.claude/skills/agency/execution-tracker.md` — progress tracking with STATE.md updates, ROADMAP.md progress, atomic git commits, progress calculation formula (Section 5)
- `.claude/skills/agency/phase-decomposer.md` — plan file format reference
- `.claude/skills/agency/questioning-flow.md` — questioning engine (reference for /agency:start)
- `.claude/skills/agency/review-loop.md` — dev-QA loop engine (reference for /agency:review)

### State Files
- `.planning/PROJECT.md` — project vision, requirements, constraints
- `.planning/ROADMAP.md` — phase breakdown with goals, requirements, success criteria, progress table
- `.planning/STATE.md` — current position, recent activity, next action
- `.planning/REQUIREMENTS.md` — requirement tracking with traceability

### All 6 Commands (5 functional, 2 scaffolds being updated)
| Command | Status | Purpose |
|---------|--------|---------|
| `/agency:start` | Functional | Project initialization with questioning flow |
| `/agency:plan` | Functional | Phase decomposition with agent recommendations |
| `/agency:build` | Functional | Parallel agent execution using Teams |
| `/agency:review` | Functional | Quality gate with dev-QA loops |
| `/agency:status` | Scaffold | Progress dashboard and next-action routing |
| `/agency:quick` | Scaffold | Ad-hoc single-task execution |

### Existing Patterns to Follow
- **Personality Injection** (workflow-common.md): Read agent .md -> construct prompt with personality + task -> spawn via Agent tool
- **Agent Selection** (agent-registry.md Section 3): Parse task -> match agents -> rank -> cap size -> present to user
- **State Updates** (workflow-common.md): Read STATE.md -> update fields -> write back
- **Progress Calculation** (execution-tracker.md Section 5): Read ROADMAP.md progress table -> sum plans/completed -> render bar
- **Cost Profiles** (workflow-common.md): Haiku for lightweight checks (status), Sonnet for execution (quick)
- **Error Handling** (workflow-common.md): Capture errors, don't auto-retry, report to user

### Claude Code Primitives Available
- **Agent tool**: Spawn subagents with `subagent_type`, `prompt`, `model`, `name`
- **AskUserQuestion**: Structured choices for agent selection confirmation
- **Bash**: Git commands for atomic commits
- **Read/Write/Edit**: File operations

## Key Design Decisions

### No new skills needed for Phase 6
Unlike Phases 3-5 which each introduced a new skill, Phase 6 commands wire existing skills together. `/agency:status` is a pure read-only dashboard. `/agency:quick` reuses the personality injection pattern from wave-executor and agent selection from agent-registry. No new methodology documents are required.

### Status is read-only by design
`/agency:status` uses only Read, Grep, Glob — it never modifies state. This makes it safe to run at any time without side effects. It's also the lightest command in the system (Haiku-tier per cost profile).

### Quick uses existing selection + injection patterns
`/agency:quick` follows the same agent recommendation algorithm (agent-registry Section 3) and personality injection pattern (workflow-common) used by `/agency:build`. The difference: quick spawns a single agent for a single task, no waves, no teams, no execution tracking. It's the lightweight escape hatch for ad-hoc work.

### Session resume is passive, not active
"Session resume" (STATUS-03) means that `/agency:status` reads STATE.md and displays enough context that a user returning to a project can understand where they left off and what to do next. It does NOT mean automatic state restoration or re-execution. The user reads the dashboard and decides what command to run.

### Next-action routing is deterministic
The routing logic in `/agency:status` follows a fixed decision tree based on state — no AI inference needed. If no PROJECT.md exists -> suggest /agency:start. If a phase is unplanned -> suggest /agency:plan N. If planned but not executed -> suggest /agency:build. And so on. This makes the routing predictable and testable.

### Both plans are Wave 1 — no cross-dependencies
`/agency:status` and `/agency:quick` are completely independent. Status reads state; quick executes tasks. Neither references the other. Both can be built in parallel as Wave 1 plans.

### Quick tasks don't update phase state
`/agency:quick` tasks are outside the phase workflow. They don't update ROADMAP.md progress or STATE.md phase tracking. They optionally create a git commit for the work done, but that's it. This keeps quick tasks lightweight and non-disruptive.

## Plan Structure
- **Plan 06-01 (Wave 1)**: Update `/agency:status` to full implementation — dashboard with session resume and next-action routing
- **Plan 06-02 (Wave 1)**: Update `/agency:quick` to full implementation — single-task execution with agent selection and personality injection
