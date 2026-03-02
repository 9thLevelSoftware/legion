# Legion

## What This Is

A Claude Code plugin that orchestrates 51 AI specialist personalities as coordinated teams. Forked from The Agency Workflows and rebranded as Legion — "My name is Legion, for we are many." The agents have deep expertise and distinct voices; this project gives them a coordination layer so they work together on real projects.

## Core Value

Turn a collection of 51 isolated agent personalities into a functional AI legion. Users type `/legion:start`, describe what they want, and the system assembles the right team, plans the work, executes in parallel, and runs quality checks — with each agent operating in full character.

## Who It's For

- Developers, designers, marketers, and project managers using Claude Code
- Projects spanning any of the 9 divisions (engineering, design, marketing, product, PM, testing, support, spatial, specialized)
- Both code and non-code work (marketing campaigns, design systems, content strategies, not just software)

## Current Milestone: v3.0 — Legion Rebrand

**Goal:** Rebrand from "The Agency Workflows" to "Legion" — new identity, `/legion:` command namespace, updated docs, and proper attribution to the original project.

**Target features:**
- Rename project identity from "The Agency Workflows" / "agency-agents" to "Legion"
- Change all `/agency:` commands to `/legion:` commands
- Update plugin manifest, marketplace entry, and all documentation
- Rewrite README with Legion branding and the quote "My name is Legion, for we are many."
- Add original agency-agents repo to Shoulders of Giants as the source of the 51 agent personalities
- Update CLAUDE.md, CONTRIBUTING.md, CHANGELOG.md for new identity

## Current State

**v2.0 shipped** (2026-03-02) — 10 commands, 17 skills, 51 agents, 26 requirements delivered across 9 phases.

All v1.0 workflows operational plus three advisory capabilities:
- **Strategic Advisors** — `/agency:advise` for read-only expert consultation
- **Dynamic Review Panels** — 2-4 reviewer composition with domain-weighted rubrics
- **Plan Critique** — Pre-mortem analysis and assumption hunting

See [v2.0 archived requirements](milestones/v2.0-REQUIREMENTS.md) for full details.

<details>
<summary>v1.0 (2026-03-01)</summary>

9 commands, 15 skills, 51 agents, 54 requirements across 14 phases. Core workflows: project initialization, phase planning with agent recommendation, parallel execution, quality review, portfolio management, milestone tracking, cross-session memory, custom agent creation, GitHub integration, brownfield analysis, marketing campaigns, design systems. See [v1.0 archived requirements](milestones/v1.0-REQUIREMENTS.md).

</details>

## Out of Scope

- Custom CLI tooling (like GSD's gsd-tools.cjs) — keep it pure markdown/skills
- Board of directors / governance model (Conductor-style) — too heavy
- MCP server requirements — user brings their own
- Jira / Linear / other issue trackers — GitHub only for now
- New features beyond the rebrand — v3.0 is identity-only

## Constraints

- **No custom tooling**: Pure Claude Code primitives (skills, commands, agents, Tasks, Teams)
- **Human-readable state**: All planning files are markdown, readable without tools
- **Personality-first**: Agent .md files are the source of truth for agent behavior
- **Balanced cost**: Opus for planning, Sonnet for execution, Haiku for lightweight checks
- **Max 3 tasks per plan**: Keeps plans focused and reviewable (borrowed from Shipyard)
- **Fresh context per agent**: Each spawned agent gets its own context window

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rebrand to Legion | Fresh identity for the fork; "for we are many" captures the 51-agent concept perfectly | Confirmed (v3.0) |
| Namespace under /legion: | Clean break from /agency:, avoids collision | Confirmed (v3.0) |
| Plugin name: legion | Simple, memorable, clean `claude plugin install legion` | Confirmed (v3.0) |
| Full personality injection | The personalities ARE the product — must be preserved | Confirmed |
| Minimal .planning/ state | Users want human-readable files, not complex state machines | Confirmed |
| Cherry-pick patterns from 4 repos | GSD questioning + Shipyard waves + Conductor evaluate-loop + Best Practice config | Confirmed |
| Cross-division support | 51 agents span 9 divisions — workflows must handle all, not just engineering | Confirmed |
| Hybrid agent selection | Workflow recommends based on task analysis, user confirms/overrides | Confirmed |

## Architecture Influences

| Source | What We're Taking | What We're Leaving |
|--------|-------------------|-------------------|
| **Agency Agents** | 51 agent personalities, division structure, personality-first design | Original "Agency" branding and namespace |
| **GSD** | Questioning flow, orchestrator/subagent split, phase planning, state management pattern | CLI tooling, 33+ workflows, complex config, milestone system |
| **Conductor** | Evaluate-loop (build→review→fix), quality gates, parallel dispatch | Board governance, message bus, 50+ iteration limits, metadata.json |
| **Shipyard** | Wave-based execution, max 3 tasks/plan, atomic commits, agent role boundaries | 29 commands, checkpoint/rollback system, hook complexity |
| **Best Practice** | Skills/commands/agents structure, agent frontmatter, permission patterns | RPI workflow (too specific), custom hooks infrastructure |

---
*Last updated: 2026-03-02 — v3.0 milestone started*
