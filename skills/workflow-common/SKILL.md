---
name: legion:workflow-common
description: Shared constants, paths, and patterns for all /legion: commands
triggers: [common, shared, paths, conventions, state, config]
token_cost: medium
summary: "Shared constants, paths, and patterns for all /legion: commands. Defines state file locations, personality injection pattern, wave execution pattern, cost profiles, and all workflow conventions."
---

# Legion Workflow Common

Shared constants, paths, and patterns used across all /legion: commands.

## State File Locations

| File | Path | Purpose |
|------|------|---------|
| PROJECT.md | `.planning/PROJECT.md` | Project vision, requirements, constraints, decisions |
| ROADMAP.md | `.planning/ROADMAP.md` | Phase breakdown with agent assignments and progress |
| STATE.md | `.planning/STATE.md` | Current position, recent activity, next action |
| Templates | `skills/questioning-flow/templates/` | Schema files for generating PROJECT/ROADMAP/STATE |
| Phase Plans | `.planning/phases/{NN-name}/` | Plan and summary files per phase |
| Compacted Summaries | `.planning/phases/{NN-name}/{NN}-COMPACTED.md` | AI-compacted phase summaries preserving decisions and outcomes while trimming verbose details (via memory-manager skill) |
| PORTFOLIO.md | `~/.claude/legion/portfolio.md` | Global portfolio registry — all Legion projects |
| Milestone Summaries | `.planning/milestones/MILESTONE-{N}.md` | Completion summaries with metrics per milestone |
| Milestone Archive | `.planning/archive/milestone-{N}/` | Archived phase directories from completed milestones |
| Memory Outcomes | `.planning/memory/OUTCOMES.md` | Agent performance and task outcome records for cross-session learning |
| Memory Patterns | `.planning/memory/PATTERNS.md` | Successful patterns with reuse criteria — distilled from agent outcomes (via memory-manager skill) |
| Memory Errors | `.planning/memory/ERRORS.md` | Error signatures mapped to known fixes — troubleshooting reference for agents (via memory-manager skill) |
| Custom Agents | `agents/{agent-id}.md` | User-created agent personality files (via `/legion:agent`) |
| Codebase Map | `.planning/CODEBASE.md` | Structured map of existing codebase architecture, patterns, and risks (via codebase-mapper skill) |
| Campaign Documents | `.planning/campaigns/{campaign-slug}.md` | Structured campaign plans with objectives, messaging, audience, channels, calendar, and agent assignments (via marketing-workflows skill) |
| Design Documents | `.planning/designs/{project-slug}-system.md` | Structured design system specifications with tokens, components, accessibility, and agent assignments (via design-workflows skill) |
| Spec Documents | `.planning/specs/{NN}-{phase-slug}-spec.md` | Structured specification documents produced by spec-pipeline skill before coding phases |

## Agent Personality Paths

All 51 agent personalities live under `agents/` in a flat directory (no division subdirectories):

```
agents/{agent-id}.md
```

Agent IDs include their division as a prefix (e.g., `engineering-senior-developer`, `testing-reality-checker`). Exceptions: Spatial Computing agents use descriptive prefixes (xr-, visionos-, macos-, terminal-) and Specialized agents use domain prefixes (agents-, data-, lsp-) for shorter, more readable filenames.

**Divisions**: engineering, design, marketing, product, project-management, testing, support, spatial-computing, specialized, custom

Custom agents created via `/legion:agent` follow the same path pattern.

To load an agent personality: `Read agents/{agent-id}.md`

## Personality Injection Pattern

To spawn an agent with its full personality inside a Claude Code Team:

1. Read the agent's .md file to get the full personality content
2. Construct a prompt that includes the personality as system instructions, plus a **Reporting Results** block instructing the agent to send its structured summary via SendMessage:
   ```
   Agent tool call:
     subagent_type: "general-purpose"
     prompt: "{personality_content}\n\n---\n\nTask: {task_description}\n\n## Reporting Results\n..."
     model: "{cost_profile_model}"
     team_name: "{phase_team_name}"
   ```
3. The agent operates in full character with access to its specialist knowledge
4. When finished, the agent sends its structured summary to the coordinator via SendMessage (not via Agent return value). This keeps the coordinator's context window small.

## Plan File Convention

```
.planning/phases/{NN-name}/{NN}-{PP}-PLAN.md    — Executable plan
.planning/phases/{NN-name}/{NN}-{PP}-SUMMARY.md  — Completion summary
.planning/phases/{NN-name}/{NN}-CONTEXT.md        — Phase research/context
```

Naming: `{NN}` = zero-padded phase number, `{PP}` = zero-padded plan number.
Example: `.planning/phases/01-plugin-foundation/01-02-PLAN.md`

## Wave Execution Pattern

Plans declare a `wave` number in frontmatter. Execution uses a Claude Code Team per phase:

1. **TeamCreate** — create one Team for the entire phase (e.g., `"phase-{NN}-execution"`)
2. **TaskCreate** — create one Task per plan, setting `addBlockedBy` for cross-wave dependencies
3. Group plans by wave number
4. For each wave, **spawn agents** via Agent tool with `team_name` set to the phase Team
5. Agents execute their plans and **report results via SendMessage** to the coordinator
6. Coordinator collects SendMessage summaries — wait for all agents in the wave before advancing
7. Repeat steps 4-6 for subsequent waves
8. **Shutdown + TeamDelete** — send `shutdown_request` to all agents, then TeamDelete to clean up

Within a wave, plans have no dependencies on each other. Between waves, later waves may depend on earlier wave outputs. Agents send lightweight structured summaries (~200 tokens) via SendMessage instead of returning full execution traces, preserving the coordinator's context window.

## State Update Pattern

After any significant operation:

1. Read current `.planning/STATE.md`
2. Update relevant fields:
   - `Phase`: current phase number and status
   - `Status`: what just happened
   - `Last Activity`: timestamp and description
   - `Progress`: recalculate completion percentage
   - `Next Action`: what the user should do next
3. Write updated STATE.md

## Cost Profile Convention

| Role | Model | When |
|------|-------|------|
| Planning/Decisions | Opus | /legion:start, /legion:plan, architecture choices |
| Execution/Implementation | Sonnet | /legion:build, agent task execution |
| Lightweight Checks | Haiku | /legion:status, quick validations, simple queries |

Set via `model` parameter on Agent tool calls.

## Skill Loading Protocol

Legion skills use progressive disclosure: lightweight metadata at startup, full content on activation.

### Metadata Schema

Every SKILL.md file has YAML frontmatter with these fields:

| Field | Type | Purpose |
|-------|------|---------|
| `name` | string | Skill identifier (`legion:{skill-name}`) |
| `description` | string | One-line description for catalog display |
| `triggers` | string[] | 3-6 keywords that indicate this skill should be loaded |
| `token_cost` | enum | `low` (<300 lines), `medium` (300-500), `high` (500+) |
| `summary` | string | ≤100 token summary of purpose and activation conditions |

### Loading Stages

**Stage 1: Metadata Only (orchestrator startup)**
When a `/legion:` command initializes, load ONLY the frontmatter block from each skill. This provides:
- Skill names and summaries for routing decisions (~100 tokens per skill, ~1,700 total)
- Trigger keywords for matching user intent to relevant skills
- Token cost estimates for context budget planning

**Stage 2: Full Injection (skill activation)**
When a command determines it needs a specific skill, load the ENTIRE SKILL.md content. This happens when:
- A command's workflow references the skill (e.g., `/legion:build` activates `wave-executor`)
- Trigger keywords in user input match a skill's triggers array
- An agent is spawned that requires the skill's instructions

### Implementation Rules

1. **Never load all skills at once** — only the orchestrating command's direct dependencies
2. **Metadata is free** — reading frontmatter blocks adds negligible context (~100 tokens each)
3. **Full load is expensive** — a high-cost skill adds 500+ lines to context; only load when needed
4. **Commands know their skills** — each command declares which skills it needs (e.g., `/legion:build` always loads `wave-executor` and `execution-tracker`)
5. **Trigger matching is secondary** — commands have fixed skill dependencies; trigger matching is for edge cases and `/legion:quick` routing

### Command-to-Skill Mapping

| Command | Always Loads | Conditionally Loads |
|---------|-------------|-------------------|
| `/legion:start` | questioning-flow, workflow-common | codebase-mapper (brownfield) |
| `/legion:plan` | phase-decomposer, agent-registry, workflow-common | marketing-workflows, design-workflows, plan-critique, spec-pipeline |
| `/legion:build` | wave-executor, execution-tracker, workflow-common | github-sync, spec-pipeline |
| `/legion:review` | review-loop, review-panel, workflow-common | — |
| `/legion:status` | execution-tracker, workflow-common | memory-manager |
| `/legion:quick` | agent-registry, workflow-common | {matched by triggers} |
| `/legion:portfolio` | portfolio-manager, workflow-common | — |
| `/legion:milestone` | milestone-tracker, workflow-common | — |
| `/legion:agent` | agent-creator, agent-registry, workflow-common | — |
| `/legion:advise` | agent-registry, workflow-common | {matched by triggers} |

### Context Budget Guideline

Before loading a skill, check the estimated token impact:
- `low` skills: load freely (negligible context impact)
- `medium` skills: load when clearly needed (moderate context, ~300-500 lines)
- `high` skills: load only when the command requires them (heavy context, 500+ lines)

If multiple high-cost skills are needed in a single command, consider whether the orchestrator can delegate to sub-agents (each with their own context window) rather than loading all skills into the main context.

## Error Handling Pattern

When an agent fails during execution:

1. Capture the error output
2. Update STATE.md: mark the failed plan/task with error details
3. Do NOT retry automatically — present the error to the user
4. Suggest: re-run the specific plan, or run /legion:review for diagnosis
5. If multiple agents fail in a wave, stop the wave and report all failures

## Division Constants

```
DIVISIONS = [
  "engineering",        # 7 agents — code, architecture, DevOps
  "design",             # 6 agents — UI/UX, branding, visual
  "marketing",          # 8 agents — content, social, growth
  "product",            # 3 agents — sprints, feedback, trends
  "project-management", # 5 agents — coordination, portfolio
  "testing",            # 7 agents — QA, evidence, performance
  "support",            # 6 agents — analytics, finance, legal
  "spatial-computing",  # 6 agents — XR, VisionOS, Metal
  "specialized"         # 3 agents — orchestration, data, LSP
]

TOTAL_AGENTS = 51
```

## Portfolio Conventions

### Global Portfolio Path
The portfolio registry lives at `~/.claude/legion/portfolio.md` — outside any project directory. This file is shared across all Legion projects on the machine.

### Portfolio Registration
Projects are auto-registered in the portfolio when `/legion:start` completes. Registration stores the project name, absolute path, registration date, and one-line description.

### Cross-Project State Reading
Portfolio commands read each registered project's `.planning/STATE.md` and `.planning/ROADMAP.md` at request time. There is no background sync. If a project directory is missing, it's marked Stale.

### Portfolio Command Convention
| Command | Purpose | Cost Tier |
|---------|---------|-----------|
| `/legion:portfolio` | Multi-project dashboard and dependency management | Haiku (dashboard), Opus (Studio Producer insights) |

## Milestone Conventions

### Milestone Definition
Milestones group consecutive phases in ROADMAP.md under a `## Milestones` section. Each milestone has a name, phase range, goal, and status. Milestones are defined interactively via `/legion:milestone` or during `/legion:start` for new projects.

### Milestone Lifecycle
```
Pending → In Progress → Complete → Archived
```
- **Pending**: No phases started
- **In Progress**: At least one phase started
- **Complete**: All phases in range are Complete in the Progress table
- **Archived**: Phase directories moved to `.planning/archive/milestone-{N}/`

### Milestone Paths
| Artifact | Path | When Created |
|----------|------|-------------|
| Milestone section | `.planning/ROADMAP.md ## Milestones` | During milestone definition |
| Milestone summary | `.planning/milestones/MILESTONE-{N}.md` | On milestone completion |
| Archive directory | `.planning/archive/milestone-{N}/{NN-name}/` | On milestone archiving |

### Milestone Command Convention
| Command | Purpose | Cost Tier |
|---------|---------|-----------|
| `/legion:milestone` | Milestone status, completion, archiving, and definition | Haiku (status), Sonnet (summary generation) |

## Memory Conventions

### Memory Purpose
Cross-session learning layer that tracks agent performance and task outcomes. All memory operations are explicit calls from workflows — no hooks, no background processes, no automatic triggers.

### Memory Lifecycle
```
Absent → Created (first store) → Growing (appending records) → Mature (200+ records, pruning suggested)
```
- **Absent**: No `.planning/memory/` directory. All workflows function identically.
- **Created**: First build or review outcome triggers `.planning/memory/OUTCOMES.md` creation.
- **Growing**: Records accumulate as phases execute and review.
- **Mature**: When record count exceeds 200, recall suggests pruning. Never auto-prunes.

### Memory Paths
| Artifact | Path | When Created |
|----------|------|-------------|
| Memory directory | `.planning/memory/` | On first store operation |
| Outcome log | `.planning/memory/OUTCOMES.md` | On first store operation |
| Pattern library | `.planning/memory/PATTERNS.md` | On first pattern store operation |
| Error fixes | `.planning/memory/ERRORS.md` | On first error store operation |
| Compacted summaries | `.planning/phases/{NN-name}/{NN}-COMPACTED.md` | After phase review passes (opt-in) |

### Memory Integration Points
| Workflow | Operation | When |
|----------|-----------|------|
| `/legion:build` | Store outcome | After each plan completes (success, partial, or failed) |
| `/legion:build` | Store error fix | When an agent resolves a non-trivial error during execution |
| `/legion:build` | Recall error fixes | Before agent starts task — check if known fixes exist for relevant error patterns |
| `/legion:review` | Store outcome | After review passes or escalates |
| `/legion:review` | Store pattern | When review passes on first cycle (clean approach worth capturing) |
| `/legion:review` | Store error fix | When review identifies and fixes a recurring issue |
| `/legion:plan` | Recall agent scores | During agent recommendation (phase-decomposer Section 4) |
| `/legion:plan` | Recall patterns | During phase decomposition — suggest proven approaches for similar task types |
| `/legion:status` | Recall session briefing | During dashboard display |

### Graceful Degradation Rule
All memory integration follows this pattern:
1. Check if `.planning/memory/OUTCOMES.md` exists
2. If yes: use memory data to enhance the operation
3. If no: skip silently, proceed with default behavior
4. Never error, never block, never require memory for workflow completion

### Branch Awareness
Memory files live in `.planning/memory/` inside the git repository. They branch and merge naturally with git operations.
- All memory records include a `Branch` field recording the git branch at write time
- Recall operations accept an optional `branch_filter` parameter (default: "all")
- When branches merge, memory files merge via git — append-only tables merge cleanly
- Existing records without a Branch field are treated as belonging to the default branch

### Semantic Compaction
Completed phases can be compacted into condensed summaries that preserve reasoning while trimming verbose details.
- Compacted summaries are written to `.planning/phases/{NN-name}/{NN}-COMPACTED.md`
- Original SUMMARY files are never deleted or overwritten
- Compaction is always opt-in — never automatic
- When recalling phase context, prefer COMPACTED.md over individual SUMMARY files if available

## GitHub Conventions

### GitHub Purpose
Optional integration that connects Legion Workflows to GitHub — phases link to issues, completed work produces PRs, and milestones sync. All operations use the `gh` CLI and are entirely opt-in.

### GitHub Prerequisites
```
1. gh CLI installed (checked via `which gh`)
2. gh authenticated (checked via `gh auth status`)
3. Git remote pointing to GitHub (checked via `git remote get-url origin`)
All three must pass for GitHub operations to be available.
```

### GitHub Lifecycle
```
Unavailable → Available (prerequisites pass) → Active (first issue created) → Synced (milestones linked)
```
- **Unavailable**: No gh CLI, no auth, or no remote. All GitHub operations skip silently.
- **Available**: Prerequisites pass. Operations can be performed.
- **Active**: At least one GitHub issue has been created. STATE.md has a ## GitHub section.
- **Synced**: ROADMAP milestones have corresponding GitHub milestones.

### GitHub Paths
| Artifact | Location | When Created |
|----------|----------|-------------|
| GitHub metadata | `.planning/STATE.md ## GitHub` section | On first issue or PR creation |
| Legion label | GitHub repo labels | On first issue creation |
| Phase issues | GitHub issues with "legion" label | During `/legion:plan` |
| Phase PRs | GitHub pull requests | During `/legion:build` |
| GitHub milestones | GitHub API milestones | During `/legion:plan` (if ROADMAP milestones defined) |

### GitHub Integration Points
| Workflow | Operation | When |
|----------|-----------|------|
| `/legion:plan` | Create phase issue, sync milestone | After plan files generated |
| `/legion:build` | Update issue checklist, create PR | After plans execute and after phase completes |
| `/legion:status` | Read-back live GitHub status | During dashboard display |
| `/legion:review` | Close phase issue | After review passes |
| `/legion:milestone` | Close GitHub milestone | After milestone completion |

### Graceful Degradation Rule
All GitHub integration follows this pattern:
1. Run github-sync Section 1 prerequisites check
2. If github_available is true: perform the operation
3. If github_available is false: skip silently, proceed with default behavior
4. Never error, never block, never require GitHub for workflow completion

## Brownfield Conventions

### Brownfield Purpose
Pre-planning codebase analysis that maps existing architecture, detects patterns and frameworks, and flags risk areas before agents begin work. All operations are opt-in and degrade gracefully.

### Brownfield Lifecycle
```
Absent → Analyzed (CODEBASE.md created) → Stale (>30 days old, re-analysis recommended)
```
- **Absent**: No `.planning/CODEBASE.md`. All workflows function identically (greenfield mode).
- **Analyzed**: Codebase mapped during `/legion:start`. CODEBASE.md available for plan enrichment.
- **Stale**: CODEBASE.md is >30 days old. `/legion:plan` warns but does not block or auto-refresh.

### Brownfield Paths
| Artifact | Path | When Created |
|----------|------|-------------|
| Codebase map | `.planning/CODEBASE.md` | After brownfield analysis during /legion:start (user opts in) |

### Brownfield Integration Points
| Workflow | Operation | When |
|----------|-----------|------|
| `/legion:start` | Detect + analyze | After pre-flight, before questioning (if existing codebase found) |
| `/legion:plan` | Inject risk areas into context | During phase decomposition (if CODEBASE.md exists) |

### Graceful Degradation Rule
All brownfield integration follows this pattern:
1. Check if `.planning/CODEBASE.md` exists
2. If yes: inject relevant sections into planning context
3. If no: skip silently -- greenfield project, proceed normally
4. Never error, never block, never require brownfield analysis for workflow completion

## Marketing Workflow Conventions

### Marketing Purpose
Structured campaign workflows for marketing-focused phases -- campaign planning, content calendar generation, and cross-channel coordination. Marketing agents (8 specialists) are orchestrated through domain-specific wave patterns rather than generic engineering decomposition.

### Marketing Lifecycle
```
Unplanned --> Planning (campaign document created) --> Active (content in production) --> Measuring --> Complete
```
- **Unplanned**: Phase not yet planned. Standard decomposition applies.
- **Planning**: Marketing phase detected during `/legion:plan`. Campaign document generated at `.planning/campaigns/{slug}.md`.
- **Active**: Campaign content being produced and distributed via `/legion:build`.
- **Measuring**: Campaign ended, performance data collected.
- **Complete**: Learnings captured, outcomes recorded to memory (if memory layer active).

### Marketing Paths
| Artifact | Path | When Created |
|----------|------|-------------|
| Campaign documents | `.planning/campaigns/{campaign-slug}.md` | During /legion:plan when marketing phase detected |

### Marketing Wave Pattern
| Wave | Role | Agents | Produces |
|------|------|--------|----------|
| Wave 1 | Strategy & Planning | Social Media Strategist, Growth Hacker | Campaign brief, metrics, audience analysis |
| Wave 2 | Content Creation | Content Creator + Channel Specialists | Content assets, adapted messaging |
| Wave 3 (optional) | Distribution | All channel agents | Published content, engagement |

### Marketing Integration Points
| Workflow | Operation | When |
|----------|-----------|------|
| `/legion:plan` | Detect marketing phase, campaign questioning, generate campaign doc | During phase decomposition (if MKT-* requirements or marketing keywords) |
| `/legion:build` | Marketing wave execution, core messaging handoff | During plan execution (if campaign document exists) |
| `/legion:review` | Cross-channel consistency check | During quality review (if campaign document exists) |

### Graceful Degradation Rule
All marketing workflow integration follows this pattern:
1. Check if phase is marketing (MKT-* requirements or keyword detection)
2. If yes: use marketing-specific decomposition, wave patterns, and campaign templates
3. If no: standard decomposition -- no impact whatsoever
4. Never error, never block, never require marketing workflows for non-marketing phases

## Design Workflow Conventions

### Design Purpose
Structured design workflows for design-focused phases -- design system creation, UX research planning and synthesis, and three-lens design review (brand, accessibility, usability). Design agents (6 specialists) are orchestrated through domain-specific wave patterns rather than generic engineering decomposition.

### Design Lifecycle
```
Unplanned --> Research (user insights, brand audit) --> Designing (tokens, components, visual language) --> Review (3-lens) --> Complete
```
- **Unplanned**: Phase not yet planned. Standard decomposition applies.
- **Research**: UX research and brand audit underway (Wave 1). Design document generated at `.planning/designs/{slug}-system.md`.
- **Designing**: Design system creation, component specs, visual assets (Wave 2).
- **Review**: Three-lens review cycle -- brand, accessibility, usability (Wave 3 or `/legion:review`).
- **Complete**: Design system documented, handoff ready, outcomes recorded to memory (if memory layer active).

### Design Paths
| Artifact | Path | When Created |
|----------|------|-------------|
| Design system documents | `.planning/designs/{project-slug}-system.md` | During /legion:plan when design phase detected |
| UX research reports | `.planning/designs/{research-slug}-research.md` | During /legion:plan when research is in scope |

### Design Wave Pattern
| Wave | Role | Agents | Produces |
|------|------|--------|----------|
| Wave 1 | Research & Foundation | UX Researcher, Brand Guardian | Research brief, brand foundation, design principles |
| Wave 2 | Design System & Creation | UI Designer, UX Architect, Visual Storyteller | Design system document, component specs, visual language |
| Wave 3 (optional) | Polish & Validation | Whimsy Injector, Review agents | Enhanced specs, audit reports |

### Design Integration Points
| Workflow | Operation | When |
|----------|-----------|------|
| `/legion:plan` | Detect design phase, design questioning, generate design docs | During phase decomposition (if DSN-* requirements or design keywords) |
| `/legion:build` | Design wave execution, research-to-design handoff | During plan execution (if design documents exist) |
| `/legion:review` | Three-lens review (brand + accessibility + usability) | During quality review (if design documents exist) |

### Graceful Degradation Rule
All design workflow integration follows this pattern:
1. Check if phase is design (DSN-* requirements or keyword detection)
2. If yes: use design-specific decomposition, wave patterns, and three-lens review
3. If no: standard decomposition -- no impact whatsoever
4. Never error, never block, never require design workflows for non-design phases
