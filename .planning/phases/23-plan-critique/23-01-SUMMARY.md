---
phase: 23
plan: 1
status: complete
completed: 2026-03-02
requirements_covered:
  - CRIT-01
  - CRIT-02
---

# Plan 23-01 Summary: Create plan-critique skill and integrate into /agency:plan

## What Was Done

### Task 1: Created skills/plan-critique/SKILL.md
New skill with four sections:
- **Section 1: Pre-Mortem Analysis (CRIT-01)** — Assumes the phase has failed, generates 3-5 specific failure headlines, traces each to root causes in plan tasks, ranks by risk score (Likelihood x Impact), separates into Critical Risks (score >= 6) and Watch Items
- **Section 2: Assumption Hunting (CRIT-02)** — Extracts 5-10 implicit assumptions from plan tasks across 4 categories (technical, dependency, scope, knowledge), rates each by Impact x Evidence strength, flags Critical (High Impact + Weak Evidence) and Warning assumptions, generates specific challenge actions
- **Section 3: Critique Report and Routing** — Merges findings from both passes, deduplicates, computes verdict (PASS/CAUTION/REWORK), presents consolidated report, routes to user action via AskUserQuestion
- **Section 4: Agent Selection** — Selects skeptical/analytical agents via agent-registry with bias terms, preferred agents: testing-reality-checker (pre-mortem) + product-sprint-prioritizer (assumptions), spawns read-only via Explore subagent type

### Task 2: Updated commands/plan.md
Three surgical changes:
1. Added `skills/plan-critique/SKILL.md` to execution_context
2. Inserted Step 8.5 (PLAN CRITIQUE) — AskUserQuestion offers "Run plan critique (Recommended for complex phases)" vs "Skip critique, proceed to execution"
3. If critique selected: agent selection, read-only spawning (Explore), findings synthesis, verdict routing (PASS → proceed, CAUTION → mitigate or proceed, REWORK → revise or proceed anyway)

All existing steps (1-11) preserved unchanged.

### Task 3: Updated state files
- ROADMAP.md: Phase 23 progress → 1/1 Complete
- STATE.md: 100% progress (9/9 phases), next steps point to verify/complete milestone

## Verification Results

24/24 checks passed across all 3 tasks:
- Task 1: 13/13 (file exists, correct name, all 4 sections, agent-registry ref, failure headlines, verdict levels, user routing, actionable mitigations, plan section mapping, read-only pattern)
- Task 2: 11/11 (plan-critique ref, critique step, critique choice, skip option, verdict routing, read-only spawning, steps 1/8/9/10/11 preserved)
- Task 3: 5/5 (ROADMAP has 23-01, STATE has Phase 23, planned status, cross-refs to agent-registry/workflow-common/review-panel exist)

## Requirements Satisfied

- **CRIT-01**: Pre-mortem analysis skill with failure headline generation, root cause tracing to specific plan tasks, risk scoring (Likelihood x Impact), Critical Risks vs Watch Items separation
- **CRIT-02**: Assumption hunting with 4-category extraction, Impact x Evidence rating matrix, Critical/Warning/Accepted classification, specific challenge actions per assumption

## Files Changed

- `skills/plan-critique/SKILL.md` (created) — 4-section critique skill
- `commands/plan.md` (modified) — execution_context + Step 8.5
- `.planning/ROADMAP.md` (modified) — Phase 23 Complete
- `.planning/STATE.md` (modified) — 100% progress, milestone complete
