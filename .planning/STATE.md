# Project State

> ⚠ **Stale notice (2026-05-04)**: This file frames the project at v6.0 milestone completion. `package.json` is authoritative and currently reports **v7.3.3**. Post-v6.0 work (4.7 literalism audit; security/dispatch hardening) is tracked outside `.planning/` at `docs/audits/2026-04-16-legion-4-7/` and `docs/superpowers/specs/`. Run `/legion:milestone` to reconcile this file before the next milestone cycle.

## Project Reference

**Core Value:** Turn 48 isolated agent personalities into a functional AI legion — "My name is Legion, for we are many."

## Current Position

- **Phase**: 12 of 12 (complete)
- **Milestone**: v6.0 — Discipline & Intelligence
- **Status**: All 12 phases complete — v6.0.0 ready to publish
- **Last Activity**: Phase 12 execution (2026-03-07)

## Progress
```
[##########] 100% — 34/34 plans complete (Phase 12 executed — v6.0.0)
```

## Shipped Milestones

| Milestone | Phases | Plans | Requirements | Shipped |
|-----------|--------|-------|-------------|---------|
| v1.0 | 14 | 30 | 54 | 2026-03-01 |
| v2.0 | 9 | 9 | 26 | 2026-03-02 |
| v3.0 | 5 | 6 | 13 | 2026-03-02 |
| v4.0 | 7 | 13 | 18 | 2026-03-02 |
| v5.0 | 5 | 22 | 32 | 2026-03-05 |

## What's Deployed

- 12 commands (`/legion:start`, `plan`, `build`, `review`, `status`, `quick`, `portfolio`, `milestone`, `agent`, `advise`, `explore`, `update`)
- 25 skills with progressive disclosure metadata (triggers, token_cost, summary in frontmatter)
- 49 agents across 9 divisions (including Polymath + security-engineer + technical-writer + code-polisher)
- Agent registry gap analysis skill for roster coverage validation
- Intent teams with validated agent mappings for harden/document/security-only
- Authority matrix with domain ownership for 49 agents across 9 divisions
- Two-wave execution pattern (Wave A + Wave B with gates)
- Environment mapping with directory mappings and path enforcement
- Plugin manifest at `.claude-plugin/plugin.json` — name: `legion`, version: `6.0.0`
- Repository: `https://github.com/9thLevelSoftware/legion`

## Recent Decisions
- **Execution mode**: Autonomous — trusted workflow, 5th milestone cycle
- **Planning depth**: Deep Analysis — 12 phases from exploration
- **Cost profile**: Premium — Opus for planning and execution, Sonnet for checks
- **Scope**: One big v6.0 milestone covering all Tier 1/2/3 + backlog items
- **Ordering**: Foundation → Features (discipline infrastructure before advanced features)
- **ROI boundaries**: Follow FEEDBACK-ROI-ANALYSIS.md "worth doing" lines

## Session Continuity

### Key Decisions (carried forward)

- Full personality injection for all agent spawns
- /legion: namespace for all commands (v3.0 rebrand)
- Plugin name: legion
- Minimal state: PROJECT.md + ROADMAP.md + STATE.md
- Hybrid agent selection: recommend → confirm
- Wave-based execution with max 3 tasks per plan
- Plugin-relative paths: `commands/`, `skills/`, `agents/` at root
- Three-layer read-only for advisory
- Dynamic review panels over fixed board of directors
- Pre-mortem + assumption hunting for plan critique
- Competing architecture proposals: opt-in, 3 philosophies (Minimal, Clean, Pragmatic)
- Spec pipeline: optional 5-stage pre-coding specification
- Polymath engine: research-first exploration with structured choice protocol
- Cherry-pick from 10 inspiration sources, don't wholesale adopt any
- Maintain Legion's core identity: personality-first, wave execution, human-readable state
- Anti-patterns documented as guardrails
- Specificity hierarchy: tool/framework > subdomain > broad domain > general for conflict resolution
- BLOCKER severity overrides domain ownership per authority conflict resolution rules
- Authority constraints injected proactively into agent prompts
- Two-wave pattern: Wave A (Build+Analysis) → Architecture Gate → Wave B (Execution+Remediation) → Production Readiness Gate
- Directory mapping extraction: Priority-based resolution (explicit/inferred/default)

## Next Action
Run `/legion:review` to verify Phase 12: Integration & Release

---

*Last updated: 2026-03-07 — Phase 12 executed*
