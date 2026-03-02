# Phase 14: Design Workflows -- Context

## Phase Goal
Design agents have structured workflows for design systems, UX research, and design-specific review cycles — not just ad-hoc quick tasks.

## Requirements Covered
- DSN-01: Design system creation — structured design system workflow with design agents
- DSN-02: UX research workflow — user research planning and synthesis
- DSN-03: Design review cycle — design-specific quality gates (brand, accessibility, usability)

## What Already Exists (from prior phases)

### Skills (all at `.claude/skills/agency/`)
- `workflow-common.md` — Shared constants, paths, conventions (includes Portfolio, Milestone, Memory, GitHub, Brownfield, Marketing Conventions sections)
- `agent-registry.md` — 51 agent registry with recommendation algorithm, team assembly patterns (Section 4 includes Design Sprint and Marketing Campaign assembly), and custom agent support
- `questioning-flow.md` — 3-stage adaptive questioning engine
- `phase-decomposer.md` — Phase decomposition into wave-structured plans with agent recommendation and marketing domain detection
- `wave-executor.md` — Parallel execution engine with personality injection
- `execution-tracker.md` — Progress tracking with STATE.md updates and atomic commits
- `review-loop.md` — Dev-QA loop engine with structured feedback and escalation (design phase type mapped to design-brand-guardian)
- `portfolio-manager.md` — Multi-project registry and state aggregation
- `milestone-tracker.md` — Milestone lifecycle management with archiving
- `memory-manager.md` — Cross-session learning with outcome store/recall/decay
- `agent-creator.md` — Guided agent creation with schema validation
- `github-sync.md` — GitHub issue/PR/milestone integration with graceful degradation
- `codebase-mapper.md` — Brownfield codebase analysis with graceful degradation
- `marketing-workflows.md` — Campaign planning, content calendars, cross-channel coordination with graceful degradation

### Design Agents (all at `agency-agents/design/`)
- `design-brand-guardian.md` — Brand strategy, visual identity systems, brand voice, compliance monitoring
- `design-ui-designer.md` — Visual design systems, component libraries, design tokens, accessibility, developer handoff
- `design-ux-architect.md` — CSS systems, layout frameworks, responsive breakpoints, UX structure, design-to-code bridge
- `design-ux-researcher.md` — User research, usability testing, personas, journey mapping, A/B testing
- `design-visual-storyteller.md` — Visual narrative, multimedia content, infographics, cross-platform adaptation
- `design-whimsy-injector.md` — Micro-interactions, delight design, playful copy, gamification, accessible animations

### Commands (all at `.claude/commands/agency/`)
- `start.md` — Project initialization (11-step process with brownfield detection)
- `plan.md` — Phase planning with agent recommendation (11-step process with GitHub + brownfield + marketing)
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
- Domain detection pattern: check requirement IDs + keyword matching + agent signal (proven in marketing)
- Domain-specific wave patterns replace generic decomposition when domain is detected
- Team assembly replaces per-plan agent recommendation for domain phases
- agent-registry Section 4 already has a Design Sprint team assembly pattern

## Key Design Decisions
- **No new command**: Design workflows integrate into existing `/agency:plan` and `/agency:build` flow — no `/agency:design` command (keeps command surface minimal, consistent with marketing Phase 13)
- **Design documents at `.planning/designs/`**: Parallel to `.planning/campaigns/` — design system documents and UX research reports stored separately from phase plans
- **Design domain detection in phase-decomposer**: Triggered by DSN-* requirements or design-keyword detection — mirrors marketing detection exactly
- **Design-specific wave patterns**: Research & Foundation → Design System & Creation → Polish & Validation (not Build → Test → Deploy)
- **Three-lens design review**: Brand (design-brand-guardian) + Accessibility (design-ux-architect) + Usability (design-ux-researcher) — enhances the existing single-reviewer "design" phase type in review-loop
- **Follows Phase 13 model exactly**: skill first (Wave 1), integration second (Wave 2) — proven in Phases 10, 11, 12, 13
- **Team assembly over single-agent assignment**: Design projects use agent-registry Section 4 Design Sprint pattern + discipline-agent mapping
- **Design documents as templates, not final assets**: Specify component structure, token values, and research findings — not pixel-perfect mockups
- **design-ui-designer as Design Lead**: Component libraries and design systems are this agent's core expertise
- **design-ux-researcher as Research Lead**: User research methodology and synthesis are this agent's core expertise

## Plan Structure
- **Plan 14-01 (Wave 1)**: design-workflows skill — 6-section design workflow engine with design system creation, UX research workflow, three-lens design review, design document formats, discipline-agent mapping, plus workflow-common Design Workflow Conventions section
- **Plan 14-02 (Wave 2)**: Workflow integration — update phase-decomposer.md (design domain detection + design wave patterns + design team assembly), plan.md (design-workflows reference + DESIGN PHASE DETECTION step), review.md (three-lens design review), REQUIREMENTS.md (check DSN-01/02/03), CLAUDE.md (document design workflows)
