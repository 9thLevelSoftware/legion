# Legion v6.0 — Discipline & Intelligence

## What This Is

A multi-CLI plugin for orchestrating 48 AI specialist personalities as coordinated teams. v6.0 transforms Legion from a working orchestration protocol into a disciplined, observable, and smarter orchestration protocol — better planning constraints, richer agent selection, advanced exploration modes, and explicit human control.

## Core Value

Make Legion's prompt-based orchestration more disciplined by adding constraints at planning time, richer metadata for agent selection, and better post-execution observability — all within the existing markdown-native, zero-runtime-dependency architecture.

## Who It's For

- Developers, designers, marketers, and project managers using Legion across 9 CLIs
- Enterprise users and cautious adopters who need explicit safety guarantees
- Power users who want smarter agent recommendations and advanced exploration workflows

## Requirements

### Validated
(None yet — ship to validate)

### Active

**Plan Schema & Safety (DSC-01 through DSC-05)**
- [ ] DSC-01: `files_forbidden` field in plan frontmatter schema
- [ ] DSC-02: `expected_artifacts` field in plan frontmatter schema
- [ ] DSC-03: Mandatory `verification_commands` in all plans (plan-critique enforced)
- [ ] DSC-04: Plan-critique file overlap detection for same-wave plans
- [ ] DSC-05: `sequential_files` convention in wave metadata

**Human Control (CTL-01 through CTL-03)**
- [ ] CTL-01: `control_mode` setting with `autonomous`/`guarded`/`advisory`/`surgical` presets
- [ ] CTL-02: Authority matrix mode integration — each preset adjusts active rules
- [ ] CTL-03: Settings schema and documentation updates for control modes

**Observability (OBS-01 through OBS-03)**
- [ ] OBS-01: Decision logging in SUMMARY.md (agent scores, adapter, confidence)
- [ ] OBS-02: Cycle-over-cycle diff in REVIEW.md
- [ ] OBS-03: Structured decision capture in wave executor output

**Agent Intelligence (AGT-01 through AGT-04)**
- [ ] AGT-01: Structured metadata in 53 agent frontmatter (`languages`, `frameworks`, `artifact_types`, `review_strengths`)
- [ ] AGT-02: Recommendation engine scoring against enriched metadata fields
- [ ] AGT-03: `task_type` field in OUTCOMES.md records
- [ ] AGT-04: Archetype-weighted recommendation boosts from task_type history

**Validation & Conformance (VAL-01 through VAL-04)**
- [ ] VAL-01: Adapter schema conformance tests (required fields, capability flags)
- [ ] VAL-02: Cross-reference validation (commands reference existing skills and agents)
- [ ] VAL-03: `lint-commands` test for command .md files
- [ ] VAL-04: `max_prompt_size` and `known_quirks` fields in ADAPTER.md spec

**Codebase Mapper (MAP-01 through MAP-02)**
- [ ] MAP-01: Dependency risk assessment in CODEBASE.md output
- [ ] MAP-02: Test coverage summary in CODEBASE.md output

**Polymath Advanced (POLY-07 through POLY-09)**
- [ ] POLY-07: Onboard mode — guided codebase familiarization via structured choices
- [ ] POLY-08: Compare mode — structured comparison of alternatives with decision capture
- [ ] POLY-09: Debate mode — adversarial exploration with winner tracking

**Authority & Conflict (AUTH-06 through AUTH-07)**
- [ ] AUTH-06: Escalation automation protocol for out-of-scope decisions
- [ ] AUTH-07: Agent-to-agent communication conventions for handoffs

**Intent Routing v2 (INTENT-07 through INTENT-08)**
- [ ] INTENT-07: Natural language intent parsing for command routing
- [ ] INTENT-08: Context-aware intent suggestions based on project state

**Integration & Release (REL-01 through REL-04)**
- [ ] REL-01: Cross-phase regression testing
- [ ] REL-02: Documentation updates for all new features
- [ ] REL-03: `.gitignore` and `package.json` files audit (repo hygiene)
- [ ] REL-04: Version bump to 6.0.0

### Out of Scope

- Token/budget governance — Legion cannot measure tokens or wall-clock time
- Typed orchestration core — requires rebuilding Legion as a different product
- Full replay system — no execution runtime to replay against
- Three-layer memory — triples complexity for marginal improvement over OUTCOMES.md
- Integration test suite per adapter — requires infrastructure Legion doesn't control
- Runtime file locks — no filesystem lock primitive available
- Machine-readable evidence bundles — LLM reading markdown IS the evidence consumer
- Recovery mode — already covered by `/legion:review` and manual intervention
- Rollback commands in plans — git is the rollback mechanism

## Constraints

- **Runtime stays markdown-native**: Agent personalities, commands, skills, and per-CLI adapters remain pure markdown. Dev-only tooling (test/CI scripts, schema validators, release-check helpers) is permitted because it never ships into a runtime prompt. The runtime never imports new JS dependencies.
- **Human-readable state**: All planning files remain markdown
- **Personality-first**: Agent .md files remain the source of truth
- **ROI-bounded**: Follow the FEEDBACK-ROI-ANALYSIS.md "worth doing" boundaries for each proposal
- **Backward compatible**: All changes must work with existing v5.0 project state and adapters

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Execution mode | Trusted workflow, 5th milestone cycle | Autonomous |
| Planning depth | 12 phases already defined from exploration | Deep Analysis |
| Cost profile | Maximum quality for architectural changes | Premium |
| Scope strategy | User wants comprehensive v6.0 | One big milestone, all tiers included |
| Phase ordering | Dependencies flow foundation to features | Foundation → Features |
| ROI boundaries | Follow analysis, don't over-engineer | Accept "worth doing", reject "not worth doing" |
| Concept source | Crystallized via `/legion:explore` | FEEDBACK-ROI-ANALYSIS.md + v5.0 backlog |

## Architecture Influences

v6.0 builds on the same architecture influences as v5.0 with one addition:

| Source | What v6.0 Takes |
|--------|----------------|
| **FEEDBACK-ROI-ANALYSIS.md** | 12 proposals evaluated on feasibility, ROI, and risk. Tier 1-3 "worth doing" items accepted; runtime-dependent proposals rejected. Core reframe: "disciplined prompt orchestration, not runtime enforcement." |

---
*Last updated: 2026-03-06 after initialization (concept crystallized via /legion:explore)*
