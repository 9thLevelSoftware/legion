# Audit Findings — cross-cutting: model-tier configuration

**Audited in session:** S05.1
**Total findings:** 3 (3 P2)
**Filed:** 2026-04-16 (interlude during S05; user-driven discovery)
**Discovery prompt:** "Is there a way to bake in a lower model for the workflow?"
**Scope:** `adapters/claude-code.md`, `commands/start.md`, `skills/agent-registry/SKILL.md`, `skills/phase-decomposer/SKILL.md`, `skills/review-evaluators/SKILL.md`, `skills/cli-dispatch/SKILL.md`, `docs/settings.schema.json`

These three findings form a single architectural cluster: Legion exposes a `models.{planning,execution,check}` knob in `settings.json`, but the plumbing between that knob and what model actually gets spawned is partially dead, partially undocumented, and unreachable per-command. Filing as one document because remediation is interlocked.

---

## LEGION-47-076 — P2, Orphan Configuration Reference (suspected)

**File:** `commands/start.md`
**Line:** 202

> `      - Workflow: {mode}, {depth}, {cost_profile}`

**Issue:** `cost_profile` appears as a template variable in the start-command questioning summary, but no settings key, schema field, or skill consumes it. `docs/settings.schema.json` defines `models.{planning,execution,check}` and `planning_reasoning` — no `cost_profile`. Grep across `skills/`, `commands/`, `adapters/`, `.planning/config/` yields zero readers. Failure modes under 4.7-literal interpretation: (a) the questioning flow asks the user to pick a `cost_profile` value and silently discards it, (b) the model invents a settings.json key that never gets read, (c) downstream commands that print the workflow summary substitute an empty string, signaling broken state to the user. Adjacent peers `mode` and `depth` are real keys captured by `questioning-flow`. `cost_profile` is the odd one out — most likely an artifact of an earlier design where cost tier was an explicit user choice that got refactored into adapter mappings without removing the reference.

**Remediation sketch:** Two clean paths. **(A)** Delete the `{cost_profile}` reference from `commands/start.md:202` and any companion question in `skills/questioning-flow/`. Audit `skills/portfolio-manager/` and `skills/memory-manager/` for any `cost_profile` consumers — none expected, but verify. **(B)** Implement `cost_profile` as a real settings key (e.g., `models.cost_profile: "premium" | "balanced" | "budget"`) with each value mapping to a fixed `{planning, execution, check}` triplet in `docs/settings.schema.json`. Recommendation: take path A unless there's a deliberate plan to expose a cost dial — the current `models.{planning,execution,check}` already handles per-tier control.

**Remediation cluster:** `orphan-config-reference`
**Effort estimate:** small (path A) / medium (path B)

---

## LEGION-47-077 — P2, Dead Plumbing — `model_tier` Never Consumed (confirmed)

**Files & lines:**
- `skills/agent-registry/SKILL.md:147` — declares `model_tier: "{planning|execution|check}"` as agent metadata
- `skills/phase-decomposer/SKILL.md:459` — passes `model_tier` as a context field to recommendations
- `skills/review-evaluators/SKILL.md:1259` — sets `model_tier: "execution"` for review calls

> `  model_tier: "{planning|execution|check}"`  *(agent-registry)*
> `Plus context fields: task_type_detected, adapter, model_tier.`  *(phase-decomposer)*
> `  model_tier: "execution" (this is a substantive review, not a planning call)`  *(review-evaluators)*

**Issue:** `model_tier` is set in three skills as if it should influence model selection, but `skills/cli-dispatch/SKILL.md` (the actual dispatcher that constructs the spawn call) never reads it. Section 3 of `cli-dispatch` constructs the prompt from PERSONALITY_CONTENT + TASK_DESCRIPTION + RESULT_INSTRUCTION + CONTROL_SCOPE + HANDOFF_CONTEXT — no `model_tier` lookup. The Claude-Code adapter's `spawn_agent_personality` row hardcodes `model: "{model_execution}"` for every spawn regardless of the assigned agent's `model_tier`. Net effect: a review-evaluator that declares `model_tier: "execution"` and a planning agent that declares `model_tier: "planning"` both spawn on the same `model_execution` (sonnet by default). Three failure modes: (a) maintainers add `model_tier` to new agents thinking it does something, accumulating dead metadata; (b) cost-conscious users override `models.execution` in settings.json expecting check-tier agents to drop to haiku and don't, because all spawns use `model_execution`; (c) a future change to make `model_tier` live silently produces large cost shifts because nobody's audited the actual tier assignments. Confirmed by reading all four files end-to-end — the consumer side is empty.

**Remediation sketch:** Two paths. **(A)** Wire `model_tier` through. In `skills/cli-dispatch/SKILL.md` Section 3, add a Part 0: "Resolve `model_tier` from the assigned agent's frontmatter (default: `execution`). Map to the adapter's `model_{tier}` field. Substitute into the spawn call instead of hardcoded `model_execution`." Then update each adapter's `spawn_agent_personality` row from `model: "{model_execution}"` to `model: "{model_resolved}"`. **(B)** Delete the `model_tier` declarations from agent-registry / phase-decomposer / review-evaluators if there's no intent to honor them. Recommendation: path A — the metadata is already there and the user value is real (cheaper review and check passes).

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** medium

---

## LEGION-47-078 — P2, No Per-Command Model Override Hook (confirmed)

**Files & lines:**
- `commands/*.md` — zero files contain a `model:` frontmatter field (`grep -l '^model:' commands/*.md` returns empty)
- `adapters/claude-code.md` — `model_planning|execution|check` mapping is the only knob; no command-level routing
- `docs/settings.schema.json` — `models` object accepts only the three tier names

> `| \`model_planning\`  | \`opus\`   |`
> `| \`model_execution\` | \`sonnet\` |`
> `| \`model_check\`     | \`haiku\`  |`

**Issue:** Users have three model knobs (one per tier) and an adapter file that hardcodes the tier→model mapping. There is no mechanism to say "always run `/legion:plan` on opus and `/legion:quick` on haiku regardless of session model." Inline-executing commands (`/legion:start`, `/legion:explore`, `/legion:plan`) inherit whatever model the user selected via Claude Code's `/model` — Legion has no override. Spawned-subagent commands (`/legion:build`, `/legion:quick`, `/legion:review`) all bind to `model_execution` because cli-dispatch doesn't honor `model_tier` (see LEGION-47-077). Failure modes: (a) cost-sensitive user wants `/legion:quick` on haiku and `/legion:plan` on opus — currently impossible without running two CC sessions; (b) user assumes setting `models.planning: "opus"` in settings.json affects `/legion:plan` (it does not — the inline command uses session model, only the decomposer subagent honors `planning_reasoning: true`); (c) per-command tuning is the natural extension point and its absence will generate repeated user questions. Confirmed: `phase-decomposer/SKILL.md:39-47` shows the only place `models.planning` is consumed is the decomposer subagent under the `planning_reasoning` flag — every other command ignores the setting.

**Remediation sketch:** Add a `model:` key to command frontmatter, parsed by adapter dispatch. Three sub-tasks: **(1)** Extend `commands/*.md` frontmatter schema to allow `model: planning | execution | check | <explicit-model-name>`. **(2)** Document in `adapters/ADAPTER.md` that adapters must read this field and resolve via the same `model_{tier}` mapping (or pass the explicit name through). **(3)** Document the inline-vs-spawned distinction prominently — for inline commands the field is advisory only (Claude Code does not allow mid-session model swap), so Legion should print a warning when an inline command's declared `model:` mismatches the session model. See `proposals/per-command-model-override.md` for the full design.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** medium

---

## Cluster summary

| ID | File | Severity | Cluster | Effort |
|----|------|----------|---------|--------|
| LEGION-47-076 | `commands/start.md` | P2 | orphan-config-reference | small |
| LEGION-47-077 | `skills/{agent-registry,phase-decomposer,review-evaluators,cli-dispatch}` | P2 | dispatch-specification | medium |
| LEGION-47-078 | `commands/*.md`, `adapters/claude-code.md` | P2 | dispatch-specification | medium |

Recommended sequencing: 077 before 078 (the per-command override depends on `model_tier` being live). 076 is independent — fix anytime.
