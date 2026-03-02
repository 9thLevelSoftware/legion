# Project State

## Project Reference

**Core Value:** Turn 51 isolated agent personalities into a functional AI legion — "My name is Legion, for we are many."

## Current Position

Milestone: v3.0 — Legion Rebrand
Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-03-02 — Milestone v3.0 started

## Shipped Milestones

| Milestone | Phases | Plans | Requirements | Shipped |
|-----------|--------|-------|-------------|---------|
| v1.0 | 14 | 30 | 54 | 2026-03-01 |
| v2.0 | 9 | 9 | 26 | 2026-03-02 |

## What's Deployed

- 10 commands (`/agency:start`, `plan`, `build`, `review`, `status`, `quick`, `portfolio`, `milestone`, `agent`, `advise`)
- 17 skills (agent-registry, phase-decomposer, wave-executor, review-loop, review-panel, plan-critique, + 11 more)
- 51 agents across 9 divisions
- Plugin manifest at `.claude-plugin/plugin.json`
- Distribution: marketplace.json, README, CHANGELOG, CONTRIBUTING

## Session Continuity

### Key Decisions (carried forward)

- Full personality injection for all agent spawns
- /legion: namespace for all commands (v3.0 rebrand from /agency:)
- Plugin name: legion (renamed from agency-workflows)
- Minimal state: PROJECT.md + ROADMAP.md + STATE.md
- Balanced cost: Opus planning, Sonnet execution
- Hybrid agent selection: recommend → confirm
- Wave-based execution with max 3 tasks per plan
- Plugin-relative paths: `commands/`, `skills/`, `agents/` at root
- Three-layer read-only for advisory: allowed-tools + Explore subagent + prompt
- Dynamic review panels over fixed board of directors
- Pre-mortem + assumption hunting for plan critique
