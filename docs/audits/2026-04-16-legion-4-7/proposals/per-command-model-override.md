# Proposal — Per-Command Model Override Mechanism

**Status:** Draft
**Filed:** 2026-04-16
**Resolves:** LEGION-47-077, LEGION-47-078
**Audience:** maintainers planning Phase 22+ remediation

---

## Problem Statement

Today Legion offers three model knobs in `settings.json` (`models.planning|execution|check`), but:

1. The **inline-executing** commands (`/legion:start`, `/legion:explore`, `/legion:plan`, `/legion:status`, `/legion:advise`) run in the user's current Claude Code session and inherit whatever model `/model` is set to. Legion has no programmatic override.
2. The **subagent-spawning** commands (`/legion:build`, `/legion:quick`, `/legion:review`, `/legion:ship`) bind every spawn to `model_execution`. The `model_tier` field declared on agents and review evaluators is never consumed by `cli-dispatch`.
3. There is no per-command field that says "this command should run on X tier or X model" — only the global tier knobs.

Result: a user who wants `/legion:plan` on opus and `/legion:quick` on haiku has no clean way to express that.

---

## Goals

- Allow each command to declare a default model tier in its frontmatter.
- Allow each agent to declare a model tier and have `cli-dispatch` honor it.
- Preserve the existing tier-name indirection (`planning | execution | check`) so adapters remain CLI-agnostic.
- Allow explicit model names for power users (`model: opus`).
- Degrade gracefully on adapters that don't support model selection.

## Non-Goals

- Forcing model swaps mid-session for inline commands (Claude Code does not permit this — Legion will warn but not block).
- Per-task overrides finer-grained than per-agent (already overkill for Phase 22).
- Cost telemetry or per-tier usage tracking (separate concern).

---

## Design

### 1. Command frontmatter — new `model:` field

Extend `commands/*.md` frontmatter:

```yaml
name: legion:plan
description: Plan phase N with agent recommendations
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion]
model: planning      # NEW — tier name OR explicit model
execution_mode: inline   # NEW — inline | spawned (informational)
```

`model` accepts:
- A tier name: `planning | execution | check` — resolved via the active adapter's `model_{tier}` mapping.
- An explicit model name: `opus | sonnet | haiku | <vendor-specific>` — passed through unchanged.
- Absent — defaults to `execution` (current behavior).

Recommended defaults per command:

| Command | Tier | Reason |
|---------|------|--------|
| `/legion:start` | `planning` | Multi-step elicitation, architectural reasoning |
| `/legion:explore` | `planning` | Polymath debate, deep analysis |
| `/legion:plan` | `planning` | Decomposition, dependency analysis |
| `/legion:advise` | `planning` | Expert consultation requires depth |
| `/legion:board` | `planning` | High-stakes governance |
| `/legion:build` | `execution` | Coding work, sonnet-class adequate |
| `/legion:quick` | `execution` | Single-task work |
| `/legion:review` | `execution` | Substantive critique |
| `/legion:ship` | `execution` | Deployment orchestration |
| `/legion:status` | `check` | Mostly file reads + summary |
| `/legion:validate` | `check` | Schema/cross-ref checks |
| `/legion:milestone` | `check` | Aggregation and reporting |
| `/legion:learn` | `check` | Memory write |
| `/legion:retro` | `execution` | Synthesis work |
| `/legion:portfolio` | `check` | Aggregation and reporting |
| `/legion:agent` | `planning` | Agent design |
| `/legion:update` | `check` | npm bump |

### 2. Agent frontmatter — honor existing `model_tier`

Already declared on agents in `agent-registry/SKILL.md:147` but never read. Make `cli-dispatch` honor it:

```yaml
# agents/engineering-senior-developer.md frontmatter
model_tier: execution    # default if absent
```

### 3. `cli-dispatch` resolver — Section 3, new Part 0

Insert before Part 1 in `skills/cli-dispatch/SKILL.md`:

```
Part 0: Model resolution
  - resolved_tier = agent.frontmatter.model_tier OR command.frontmatter.model OR "execution"
  - If resolved_tier ∈ {planning, execution, check}:
      resolved_model = adapter.model_{resolved_tier}
  - Else (explicit model name):
      resolved_model = resolved_tier  (passed through)
  - If adapter does not support model selection: log "model field ignored on {adapter_name}" and proceed
  - Capture as RESOLVED_MODEL
```

Then update each adapter's `spawn_agent_personality` row from hardcoded `model: "{model_execution}"` to substitution `model: "{RESOLVED_MODEL}"`.

### 4. settings.json — no schema change required

Existing `models.{planning,execution,check}` already drives the tier→model mapping when set to non-`adapter_default`. The override chain becomes:

```
settings.json models.{tier}  >  adapter.model_{tier}
                             ↓
                      tier→model mapping
                             ↑
agent.model_tier  >  command.model  >  "execution" default
```

### 5. Inline-command warning

For commands declared `execution_mode: inline`, the resolver checks the active session model. If the declared `model:` resolves to a different model than the session, print:

```
⚠ /legion:plan declared model: planning (opus) but session is on sonnet.
  This command runs inline — model selection cannot be overridden.
  To honor the declared tier: switch via /model opus before running, or
  set settings.json models.planning to your session model to silence this warning.
```

Suppress with `settings.json` key `models.suppress_inline_warning: true`.

### 6. Adapter conformance metadata

`adapters/ADAPTER.md` gains a `supports_per_spawn_model_selection: true | false` field. Adapters that lack it (e.g., a hypothetical CLI with one fixed model) skip Part 0's substitution but still parse the frontmatter for documentation purposes.

---

## Migration Plan

1. **Phase A — wire model_tier (LEGION-47-077):** Add Part 0 to `cli-dispatch`. Update `adapters/claude-code.md` and other adapters' `spawn_agent_personality` rows. Add `model_tier` defaults to all 48 agents (most: `execution`; review evaluators: `execution`; check-tier agents like data-analytics-engineer's report-only mode: `check`). No breaking change — agents without `model_tier` default to `execution` (current behavior).
2. **Phase B — command frontmatter (LEGION-47-078):** Add `model:` field to all 17 commands per the table above. Update `commands/*.md` frontmatter parsers in any consuming skill.
3. **Phase C — inline-warning:** Implement the session-model check for inline commands. Add `models.suppress_inline_warning` to schema.
4. **Phase D — docs:** Update `README.md` and `docs/control-modes.md` with the new override chain. Add a "How to bake in a lower model" section.

---

## Backward Compatibility

- Agents without `model_tier` → defaults to `execution` (current behavior).
- Commands without `model:` → defaults to `execution` for spawned, session model for inline (current behavior).
- Adapters without `supports_per_spawn_model_selection` → field ignored, dispatch proceeds.
- `settings.json` schema unchanged.

No breaking changes.

---

## Open Questions

1. Should `/legion:advise` honor the consulted agent's `model_tier` over the command's `model:` default? (Probably yes — the agent's domain expertise calibration matters more than a generic command default.)
2. For `/legion:board`, should each board member spawn at their own `model_tier` or all at the meeting's tier? (Lean: each member at their own.)
3. Should `models.planning_reasoning: true` (which today only boosts the decomposer subagent) be deprecated in favor of explicit per-command `model: planning`? (Probably yes — `planning_reasoning` is a one-off hack.)

---

## Test Plan

- **Unit:** `cli-dispatch` resolver — assert correct precedence (agent > command > default) under all 6 permutations.
- **Integration:** Run `/legion:quick "trivial task"` with `models.execution: "haiku"` and verify the spawned agent reports the haiku model in its result file.
- **Inline warning:** Run `/legion:plan` on a sonnet session with `commands/plan.md` declaring `model: planning` and verify the warning fires.
- **Backward compat:** Existing project with no `model:` fields anywhere — verify no behavior change vs. v7.4.0 baseline.
