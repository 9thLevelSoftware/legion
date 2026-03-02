# Project State

## Project Reference

**Core Value:** Turn 51 isolated agent personalities into a functional AI agency, packaged as a proper Claude Code plugin installable via `claude plugin add`
**Current Focus:** v2.0 Proper Plugin — convert Agency from `.claude/` config into distributable plugin with advisory capabilities (strategic advisors, dynamic review panels, plan critique)

## Current Position

Phase: 15 (Plugin Scaffold) — Not started
Plan: —
Status: Roadmap defined, ready for Phase 15
Last activity: 2026-03-01 — v2.0 roadmap created

## Progress (v2.0)

```
[                              ]   0% — 0/9 phases complete
```

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 15. Plugin Scaffold | 0/? | Not started | - |
| 16. Agent Migration | 0/? | Not started | - |
| 17. Skill Migration | 0/? | Not started | - |
| 18. Command Migration and Path Updates | 0/? | Not started | - |
| 19. Registry Integration | 0/? | Not started | - |
| 20. Distribution | 0/? | Not started | - |
| 21. Strategic Advisors | 0/? | Not started | - |
| 22. Dynamic Review Panels | 0/? | Not started | - |
| 23. Plan Critique | 0/? | Not started | - |

## Accumulated Context

### Key Decisions (v2.0)

- Plugin manifest goes in `.claude-plugin/plugin.json` — standard Claude Code plugin location
- `settings.json` at plugin root alongside manifest phase (Phase 15)
- Agent migration (Phase 16) and skill migration (Phase 17) are independent — can proceed in parallel
- Command migration (Phase 18) depends on agents and skills being in place first
- Registry update (Phase 19) depends on agent paths being settled (Phase 16) and commands updated (Phase 18)
- Distribution artifacts (Phase 20) are last — depends on full functional plugin
- Strategic advisors (Phase 21) use dynamic agent selection, not fixed roles — leverages existing agent-registry
- Dynamic review panels (Phase 22) compose 2-4 reviewers with domain-weighted rubrics — replaces Conductor's fixed 5-director board
- Plan critique (Phase 23) uses pre-mortem inversion and assumption hunting — cherry-picked from Conductor's plan-critiquer

### Key Decisions (v1.0, inherited)

- Full personality injection for all agent spawns
- /agency: namespace for all commands
- Minimal state: PROJECT.md + ROADMAP.md + STATE.md
- Balanced cost: Opus planning, Sonnet execution
- Hybrid agent selection: recommend → confirm
- Wave-based execution with max 3 tasks per plan
- Memory stored at .planning/memory/OUTCOMES.md — graceful degradation
- GitHub operations all use graceful degradation
- Marketing/design detection uses three-signal OR heuristic

## Session Continuity

### To Resume Work

1. Read `.planning/ROADMAP.md` for phase structure and requirements
2. Check which phase is "Not started" in the Progress table above
3. Run `/gsd:plan-phase {N}` for the next unstarted phase
4. After planning, run `/gsd:build` to execute

### Phase 15 Entry Point

Start here: `plugin manifest and settings.json`
Requirements: PLUG-01, PLUG-05
Goal: `.claude-plugin/plugin.json` and `settings.json` exist, root directory structure scaffolded
