# Phase A — Wire `model_tier` Through Dispatch (Skill Diff)

**Status:** Draft
**Resolves:** LEGION-47-077
**Sequencing:** Land before Phase B (per-command `model:` field, LEGION-47-078)
**Backward compat:** Agents without `model_tier` default to `execution` — current behavior preserved

This document contains the exact textual changes for Phase A. Each hunk is keyed by file + line anchor so a remediation agent can apply them mechanically.

---

## Pre-flight discovery

Agents in `agents/*.md` do **not** currently have YAML frontmatter — they are plain markdown bodies (`# Senior Developer Agent Personality\n\nYou are...`). So `model_tier` cannot live on agent files without restructuring. Phase A uses a centralized table in `agent-registry` instead. Phase B+ may migrate to per-agent frontmatter once the precedent is set.

---

## Hunk 1 — `skills/agent-registry/SKILL.md`

### 1a. Add new Section: Agent Model Tier Defaults

**Where:** Insert as new top-level section immediately before the existing "Section 1" (agent ID listing). Anchor: search for `^# Agent Registry` heading; insert after the section that lists all 48 agent IDs.

**New section text:**

````markdown
## Agent Model Tier Defaults

Each agent ID maps to a default model tier consumed by `cli-dispatch` Section 3 Part 0. Tiers are resolved against the active adapter's `model_{tier}` mapping. Override mechanisms (`settings.json` `models.{tier}`, command frontmatter `model:`) take precedence per the resolver chain in `cli-dispatch`.

| Agent ID | Tier | Reason |
|----------|------|--------|
| `agents-orchestrator` | `planning` | Multi-agent coordination |
| `polymath` | `planning` | Deep research and debate |
| `engineering-senior-developer` | `execution` | Implementation default |
| `engineering-backend-architect` | `planning` | Architectural decisions |
| `engineering-frontend-developer` | `execution` | Implementation work |
| `engineering-ai-engineer` | `execution` | Implementation work |
| `engineering-infrastructure-devops` | `execution` | Implementation work |
| `engineering-laravel-specialist` | `execution` | Implementation work |
| `engineering-mobile-app-builder` | `execution` | Implementation work |
| `engineering-rapid-prototyper` | `execution` | Speed over depth |
| `engineering-security-engineer` | `planning` | Threat modeling depth |
| `design-ui-designer` | `execution` | Asset production |
| `design-ux-architect` | `planning` | System design |
| `design-ux-researcher` | `execution` | Synthesis work |
| `design-brand-guardian` | `execution` | Compliance review |
| `design-visual-storyteller` | `execution` | Asset production |
| `design-whimsy-injector` | `execution` | Asset production |
| `marketing-content-social-strategist` | `planning` | Strategy work |
| `marketing-social-platform-specialist` | `execution` | Asset production |
| `marketing-growth-hacker` | `planning` | Funnel design |
| `marketing-app-store-optimizer` | `execution` | Optimization passes |
| `product-sprint-prioritizer` | `planning` | Prioritization reasoning |
| `product-feedback-synthesizer` | `execution` | Synthesis work |
| `product-trend-researcher` | `planning` | Research depth |
| `product-technical-writer` | `execution` | Documentation |
| `testing-qa-verification-specialist` | `execution` | Verification rigor |
| `testing-performance-benchmarker` | `execution` | Analysis work |
| `testing-api-tester` | `execution` | Test execution |
| `testing-test-results-analyzer` | `check` | Result aggregation |
| `testing-tool-evaluator` | `execution` | Comparison work |
| `testing-workflow-optimizer` | `planning` | Pipeline design |
| `project-manager-senior` | `planning` | Coordination depth |
| `project-management-project-shepherd` | `execution` | Tracking work |
| `project-management-studio-producer` | `planning` | Multi-project oversight |
| `project-management-studio-operations` | `check` | Operational reporting |
| `project-management-experiment-tracker` | `execution` | Tracking work |
| `support-finance-tracker` | `execution` | Financial analysis |
| `support-legal-compliance-checker` | `planning` | Compliance reasoning |
| `support-executive-summary-generator` | `planning` | C-suite synthesis |
| `support-support-responder` | `execution` | Response drafting |
| `macos-spatial-metal-engineer` | `execution` | Implementation work |
| `visionos-spatial-engineer` | `execution` | Implementation work |
| `xr-immersive-developer` | `execution` | Implementation work |
| `xr-cockpit-interaction-specialist` | `execution` | Implementation work |
| `xr-interface-architect` | `planning` | System design |
| `terminal-integration-specialist` | `execution` | Implementation work |
| `data-analytics-engineer` | `execution` | Pipeline + analysis (default) |
| `lsp-index-engineer` | `execution` | Implementation work |

**Default for unlisted agents:** `execution`.

**Override precedence** (highest wins):
1. Command frontmatter `model:` field (Phase B — see proposals/per-command-model-override.md)
2. Agent's `model_tier` from this table
3. `execution` (fallback default)
````

### 1b. Update existing recommendation context block

**Where:** lines 145-148 (the existing `model_tier: "{planning|execution|check}"` block).

**Before:**
```
  adapter: "{adapter name from current CLI}"
  model_tier: "{planning|execution|check}"
  recommendation_source: "{semantic|heuristic|memory|archetype|override}"
```

**After:**
```
  adapter: "{adapter name from current CLI}"
  model_tier: "{looked up from Agent Model Tier Defaults table; defaults to execution if absent}"
  recommendation_source: "{semantic|heuristic|memory|archetype|override}"
```

---

## Hunk 2 — `skills/cli-dispatch/SKILL.md` Section 3

### 2a. Insert Part 0 (Model resolution)

**Where:** Section 3, line 131, between the opening `For each dispatched task, assemble a prompt from these parts:` and `Part 1: Agent personality`.

**Insert text:**

```
Part 0: Model resolution
  - resolved_tier = (in precedence order, first non-null wins):
      1. command.frontmatter.model            (Phase B — read from active command's frontmatter)
      2. agent.model_tier                     (looked up via agent-registry "Agent Model Tier Defaults" table by agent-id)
      3. "execution"                          (fallback default)
  - If resolved_tier ∈ {planning, execution, check}:
      resolved_model = adapter.model_{resolved_tier}
      e.g., resolved_tier="planning", adapter=claude-code → resolved_model="opus"
  - Else (caller passed an explicit model name like "opus" or "sonnet"):
      resolved_model = resolved_tier   (passed through unchanged)
  - If adapter capability supports_per_spawn_model_selection is false:
      Log "model field ignored on {adapter.cli_display_name} (no per-spawn model selection)"
      resolved_model = adapter.model_execution  (graceful fallback)
  - Capture as RESOLVED_MODEL
  - For autonomous tasks (no agent assigned): skip step 2; use command.frontmatter.model OR "execution"
```

### 2b. Renumber and update final assembly notes

**Where:** Section 3, line 160 (the line `Assemble the final prompt using this exact template:`).

The prompt template itself does NOT change — `RESOLVED_MODEL` is consumed by the adapter spawn call, not by the prompt body. Add the following note immediately above the template fence at line 160:

**Insert text:**

```
The adapter's spawn_agent_personality / spawn_agent_autonomous / spawn_agent_readonly
mappings receive RESOLVED_MODEL via the {RESOLVED_MODEL} substitution variable.
Adapters that previously hardcoded {model_execution} in their spawn rows must update
to {RESOLVED_MODEL} (see Hunk 3).
```

---

## Hunk 3 — Adapter spawn-row updates

### 3a. `adapters/claude-code.md` (canonical example)

**Where:** lines 28-30 (Tool Mappings table — three spawn rows).

**Before:**
```
| `spawn_agent_personality` | `Agent(subagent_type: "general-purpose", prompt: "{personality}\n\n---\n\n{task}", model: "{model_execution}", name: "{agent-id}-{NN}-{PP}", team_name: "{phase_team_name}")` |
| `spawn_agent_autonomous` | `Agent(subagent_type: "general-purpose", prompt: "{task}", model: "{model_execution}", name: "executor-{NN}-{PP}", team_name: "{phase_team_name}")` |
| `spawn_agent_readonly` | `Agent(subagent_type: "Explore", prompt: "{personality}\n\n---\n\n{task}", model: "{model_execution}", name: "{agent-id}-advisor")` — Explore agents cannot Write or Edit, enforced at the platform level |
```

**After:**
```
| `spawn_agent_personality` | `Agent(subagent_type: "general-purpose", prompt: "{personality}\n\n---\n\n{task}", model: "{RESOLVED_MODEL}", name: "{agent-id}-{NN}-{PP}", team_name: "{phase_team_name}")` |
| `spawn_agent_autonomous` | `Agent(subagent_type: "general-purpose", prompt: "{task}", model: "{RESOLVED_MODEL}", name: "executor-{NN}-{PP}", team_name: "{phase_team_name}")` |
| `spawn_agent_readonly` | `Agent(subagent_type: "Explore", prompt: "{personality}\n\n---\n\n{task}", model: "{RESOLVED_MODEL}", name: "{agent-id}-advisor")` — Explore agents cannot Write or Edit, enforced at the platform level. RESOLVED_MODEL for readonly defaults to `model_check` unless agent's tier specifies otherwise. |
```

### 3b. Other adapters

Same `{model_execution}` → `{RESOLVED_MODEL}` substitution in all three spawn rows for each adapter that uses an explicit `model` parameter:

| Adapter | Spawn-row line numbers | Notes |
|---------|------------------------|-------|
| `adapters/codex-cli.md` | 29-31 | Codex CLI uses `--model` flag — substitute in the flag value |
| `adapters/copilot-cli.md` | 29-31 | Same pattern |
| `adapters/cursor.md` | 29-31 | Cursor uses model picker — pass through name |
| `adapters/gemini-cli.md` | 29-31 | Gemini CLI uses `--model` flag |
| `adapters/kiro-cli.md` | 29-31 | Same pattern |
| `adapters/opencode.md` | 29-31 | Same pattern |
| `adapters/windsurf.md` | 29-31 | Cascade model picker |
| `adapters/aider.md` | 31-33 | **No-op** — Aider has no spawning; personality is prepended. Add note: "Aider does not honor RESOLVED_MODEL because it has no per-spawn model selection. The user-configured editor/architect models in `.aider.conf.yml` apply globally." Set `supports_per_spawn_model_selection: false` in frontmatter (Hunk 4). |

For each adapter, also add a `supports_per_spawn_model_selection` capability boolean in the YAML frontmatter (see Hunk 4 below).

---

## Hunk 4 — `adapters/ADAPTER.md` spec extension

### 4a. New capability field

**Where:** "Capabilities (YAML frontmatter)" table, after `supports_extended_thinking` row.

**Insert row:**

```
| `supports_per_spawn_model_selection` | boolean | Whether the CLI permits a per-spawn model parameter (true for Claude Code's Agent tool, Codex `--model` flag, etc.; false for Aider where the model is set globally). When false, the cli-dispatch resolver falls back to `model_execution` and logs a notice. |
```

### 4b. New substitution variable documentation

**Where:** "Tool Mappings" section preamble (immediately before the `spawn_agent_*` rows table).

**Insert paragraph:**

```
Spawn-row substitution variables (set by `cli-dispatch` Section 3):

- `{personality}` — agent personality content (PERSONALITY_CONTENT)
- `{task}` — composed task body (TASK_DESCRIPTION + RESULT_INSTRUCTION + CONTROL_SCOPE + HANDOFF_CONTEXT)
- `{agent-id}` — assigned agent ID (e.g., `engineering-senior-developer`)
- `{NN}` — phase number, zero-padded
- `{PP}` — plan-within-phase number, zero-padded
- `{phase_team_name}` — phase coordination team name
- `{RESOLVED_MODEL}` — model name resolved by `cli-dispatch` Part 0 (replaces hardcoded `{model_execution}` in pre-Phase-A adapters)
```

---

## Hunk 5 — Schema extension (settings, no breaking change)

### 5a. `docs/settings.schema.json`

No required schema changes for Phase A. The existing `models.{planning,execution,check}` keys already provide the override hook the resolver consumes — Phase A merely connects the wires.

**Optional addition** (recommended for clarity, not required for the diff to function):

```json
"models": {
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "planning": { "type": "string", "description": "Override for adapter.model_planning. Use 'adapter_default' to honor the adapter's mapping." },
    "execution": { "type": "string", "description": "Override for adapter.model_execution." },
    "check": { "type": "string", "description": "Override for adapter.model_check." },
    "planning_reasoning": { "type": "boolean", "description": "DEPRECATED: prefer per-command 'model: planning' frontmatter (Phase B). Currently boosts the decomposer subagent to model_planning when true." }
  },
  "required": ["planning", "execution", "check"]
}
```

---

## Verification commands

After applying Hunks 1-4, the remediation agent must run:

```bash
# 1. Confirm no hardcoded model_execution remains in spawn rows
grep -n 'model: "{model_execution}"' adapters/*.md
# Expected: zero matches (or only inside documentation/example blocks, not in Tool Mappings table)

# 2. Confirm RESOLVED_MODEL substitution variable is documented
grep -n 'RESOLVED_MODEL' adapters/ADAPTER.md skills/cli-dispatch/SKILL.md
# Expected: at least 2 hits in ADAPTER.md (substitution table + spec text), at least 3 hits in cli-dispatch (Part 0 definition + assembly note + capture line)

# 3. Confirm Agent Model Tier Defaults table exists in agent-registry
grep -n 'Agent Model Tier Defaults' skills/agent-registry/SKILL.md
# Expected: 1 hit

# 4. Confirm capability flag added to all adapters
grep -n 'supports_per_spawn_model_selection' adapters/*.md
# Expected: 9 hits (one per adapter file: aider, claude-code, codex-cli, copilot-cli, cursor, gemini-cli, kiro-cli, opencode, windsurf) + 1 hit in ADAPTER.md spec
```

---

## Backward compatibility checklist

- [ ] Agents not in the new tier table → resolver returns `execution` → identical to current behavior
- [ ] Adapters with `supports_per_spawn_model_selection: false` (Aider) → resolver returns `model_execution` → identical to current behavior
- [ ] `settings.json` with `models.execution: "adapter_default"` → adapter mapping wins → identical to current behavior
- [ ] No command frontmatter changes required for Phase A (Phase B owns that)
- [ ] No agent file changes required for Phase A (table is centralized in agent-registry)

---

## Out of scope for Phase A

- Per-command `model:` frontmatter — Phase B
- Inline-vs-spawned warning system — Phase C
- Deprecation of `models.planning_reasoning` — Phase D, after Phase B lands the per-command alternative
- Migrating tier defaults from agent-registry table to per-agent YAML frontmatter — Phase E (optional consolidation)

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Agent registry table drifts from agent file inventory | Add `/legion:validate` check: every agent ID in `agents/*.md` must appear in the table or be defaulted explicitly |
| Cost spike if a tier default is wrong (e.g., heavy agent set to `planning`) | Tier defaults table documents reason per row; reviewers can spot-check before merge |
| Adapters that gain spawn support later (e.g., Aider plugin) need the flag flipped | Document `supports_per_spawn_model_selection` semantics clearly in ADAPTER.md so future contributors update it |
| `model_tier` declarations elsewhere (phase-decomposer, review-evaluators) drift from the table | Phase A also normalizes those callers to read from agent-registry's table — see Hunk 1b note about consumers |
