---
name: legion:workflow-common-memory
description: Optional memory conventions shared across commands
triggers: [memory, outcomes, preferences, learning]
token_cost: low
summary: "Project-scoped memory behavior and integration rules used when memory-manager is activated."
---

# Workflow Common Memory Extension

Use only when memory behavior is active.

## Rules
- Memory is project-scoped by default and never cross-project for recommendation boosts.
- Memory is additive guidance and cannot override mandatory role constraints.
- Missing memory files must not block command execution.

### Recording trigger (concrete — no "when told to")

Record memory ONLY at the canonical integration points enumerated in `workflow-common/SKILL.md` § Memory Integration Points. That table defines the 14 write sites across `/legion:build`, `/legion:review`, `/legion:plan`, and `/legion:status`. Do NOT record at any other site.

Binding rules:
1. Every memory write MUST correspond to one of the canonical integration points (by command + operation name).
2. If a new memory write is needed, add it to `workflow-common/SKILL.md` § Memory Integration Points FIRST, then implement — never write outside the registry.
3. Recall (read) operations are unrestricted — they may be called wherever a workflow benefits from prior context.
4. All writes are append-only and project-scoped; never cross-project.
