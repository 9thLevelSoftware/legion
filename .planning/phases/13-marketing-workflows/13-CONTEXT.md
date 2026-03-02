# Phase 13: Marketing Workflows -- Context

## Phase Goal
Marketing agents have structured workflows for campaign planning, content calendars, and cross-channel coordination — not just ad-hoc quick tasks.

## Requirements Covered
- MKT-01: Campaign planning workflow — structured campaign creation with marketing agents
- MKT-02: Content calendar generation — time-based content planning with assignments
- MKT-03: Cross-channel coordination — align messaging across social, email, web

## What Already Exists (from prior phases)

### Skills (all at `.claude/skills/agency/`)
- `workflow-common.md` — Shared constants, paths, conventions (includes Portfolio, Milestone, Memory, GitHub, Brownfield Conventions sections)
- `agent-registry.md` — 51 agent registry with recommendation algorithm, team assembly patterns (Section 4 includes Marketing Campaign assembly), and custom agent support
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
- `codebase-mapper.md` — Brownfield codebase analysis with graceful degradation

### Marketing Agents (all at `agency-agents/marketing/`)
- `marketing-social-media-strategist.md` — Cross-platform strategy, thought leadership, campaign coordination
- `marketing-content-creator.md` — Multi-format content, editorial calendars, brand storytelling, SEO
- `marketing-growth-hacker.md` — Funnel optimization, viral mechanics, analytics, experimentation
- `marketing-twitter-engager.md` — Real-time engagement, threads, Twitter Spaces, community growth
- `marketing-instagram-curator.md` — Visual storytelling, Reels, Shopping, aesthetic curation
- `marketing-tiktok-strategist.md` — Viral content, FYP optimization, trend riding, creator partnerships
- `marketing-reddit-community-builder.md` — Authentic engagement, AMAs, value-first content, 90/10 rule
- `marketing-app-store-optimizer.md` — ASO, keyword research, conversion optimization, localization

### Commands (all at `.claude/commands/agency/`)
- `start.md` — Project initialization (11-step process with brownfield detection)
- `plan.md` — Phase planning with agent recommendation (11-step process with GitHub + brownfield)
- `build.md` — Parallel execution with Teams-based agent spawning
- `review.md` — Quality review with dev-QA loops
- `status.md` — Progress dashboard with session resume
- `quick.md` — Ad-hoc single-task execution
- `portfolio.md` — Multi-project dashboard
- `milestone.md` — Milestone completion and archiving
- `agent.md` — Custom agent creation

### Established Conventions
- Skills follow numbered-section structure with constants, error handling, and graceful degradation
- All optional features use the degradation pattern: check file/tool → if available: use → if not: skip silently
- State files are human-readable markdown
- Campaign artifacts will follow this same pattern
- agent-registry Section 4 already has a Marketing Campaign team assembly pattern

## Key Design Decisions
- **No new command**: Marketing workflows integrate into existing `/agency:plan` and `/agency:build` flow — no `/agency:campaign` command (keeps command surface minimal)
- **Campaign documents as standalone artifacts**: `.planning/campaigns/{slug}.md` — not embedded in plan files, not embedded in phase directories
- **Marketing domain detection in phase-decomposer**: Triggered by MKT-* requirements or marketing-keyword detection in phase descriptions — not a manual toggle
- **Marketing-specific wave patterns**: Strategy → Content Creation → Distribution (not Build → Test → Deploy)
- **Follows github-sync/codebase-mapper model exactly**: skill first (Wave 1), integration second (Wave 2) — proven in Phases 10, 11, 12
- **Team assembly over single-agent assignment**: Marketing campaigns use agent-registry Section 4 team pattern (strategy lead + content + channel specialists) rather than single-agent-per-plan
- **Content calendars as templates**: Specify content types, themes, and responsible agents — not word-for-word content
- **marketing-social-media-strategist for skill creation**: Cross-channel strategy is this agent's core expertise; understands the full marketing landscape
- **agents-orchestrator for integration**: Wiring a skill into multiple commands is orchestration work — proven in prior phases

## Plan Structure
- **Plan 13-01 (Wave 1)**: marketing-workflows skill — 6-section marketing campaign engine with campaign planning, content calendar generation, cross-channel coordination, campaign document format, plus workflow-common Marketing Workflow Conventions section
- **Plan 13-02 (Wave 2)**: Workflow integration — update phase-decomposer.md (marketing domain detection + marketing wave patterns), plan.md (marketing phase awareness), REQUIREMENTS.md (check MKT-01/02/03), CLAUDE.md (document marketing workflows)
