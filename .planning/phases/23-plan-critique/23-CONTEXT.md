# Phase 23: Plan Critique — Context

## Phase Goal

Before executing a plan, users can stress-test it with pre-mortem analysis ("assume it failed — why?") and assumption hunting ("what are we taking for granted?") using the most skeptical agents from the pool.

## Dependencies

- Phase 19 (Registry Integration) — Complete. Agent-registry skill references correct plugin-relative paths for agent recommendation.

## Requirements

| Requirement | Description |
|-------------|-------------|
| CRIT-01 | Pre-mortem analysis skill — "assume the project failed, write the headline, explain what happened" technique for plans and proposals |
| CRIT-02 | Assumption hunting — extract, prioritize, and challenge foundational beliefs in plans before execution begins |

## Success Criteria (from ROADMAP.md)

1. Plan critique skill performs a pre-mortem pass: assumes the project failed, generates the failure headline, and works backward to identify causes
2. Assumption hunting pass extracts foundational beliefs from the plan, rates them by impact x evidence strength, and flags high-impact/weak-evidence assumptions as critical risks
3. Critique output maps each finding to a specific plan section or requirement with actionable next steps
4. Critique is invocable from `/agency:plan` as an optional validation step before execution

## Design Decisions

1. **New skill `plan-critique`** — Pre-mortem analysis and assumption hunting live in a dedicated skill (`skills/plan-critique/SKILL.md`), not inlined into the plan command. Keeps command orchestration clean and critique logic reusable (e.g., could be invoked standalone or from other commands).

2. **Agent selection uses skeptical agents** — The critique skill selects agents with skeptical/analytical personalities (testing-reality-checker, testing-evidence-collector, product-sprint-prioritizer) via the agent-registry recommendation algorithm, biasing toward agents whose task-types include risk assessment, validation, and evidence evaluation.

3. **Two-pass analysis structure** — Pre-mortem (CRIT-01) and assumption hunting (CRIT-02) are separate passes that produce distinct outputs. Pre-mortem works backward from assumed failure; assumption hunting works forward through the plan's implicit beliefs. Both map findings to specific plan sections.

4. **Opt-in critique step in `/agency:plan`** — After plan generation (Step 8) and before state update (Step 10), a new optional step offers: "Stress-test this plan with critique? (Recommended for complex phases)". This preserves the existing flow while adding validation.

5. **Read-only critique** — Critique agents analyze plan files without modifying them. Findings are presented as a report; the user decides what (if anything) to change. No automatic plan rewrites.

## Existing Patterns to Preserve

- Full personality injection (workflow-common pattern)
- Agent-registry recommendation algorithm for agent selection
- AskUserQuestion for user confirmation/choice
- Plan file format unchanged — critique operates on existing plan files, not a new format
- State update patterns unchanged
- ROADMAP.md phase detail format

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `skills/plan-critique/SKILL.md` | Create | Pre-mortem analysis, assumption hunting, finding-to-section mapping |
| `commands/plan.md` | Modify | Add optional critique step after plan generation |
| `.planning/ROADMAP.md` | Update | Plan entry for Phase 23 |
| `.planning/STATE.md` | Update | Current position to Phase 23 |
