# Phase B — Per-Command `model:` Frontmatter

**Status:** Draft
**Resolves:** LEGION-47-078 (core mechanism)
**Depends on:** Phase A (Part 0 resolver must exist)
**Sequencing:** Land after Phase A
**Backward compat:** Full — commands without `model:` field default to current behavior

---

## Hunk 1 — Add `model:` field to all 17 commands

Each `commands/*.md` file gets two new frontmatter keys:

- `model:` — tier name (`planning | execution | check`) OR explicit model name
- `execution_mode:` — `inline | spawned` (informational; consumed by Phase C warning)

### Defaults table (apply per command)

| Command | `model:` | `execution_mode:` | Reason |
|---------|----------|-------------------|--------|
| `commands/start.md` | `planning` | `inline` | Multi-step elicitation, architectural reasoning |
| `commands/explore.md` | `planning` | `inline` | Polymath debate, deep analysis |
| `commands/plan.md` | `planning` | `inline` | Decomposition, dependency analysis |
| `commands/advise.md` | `planning` | `inline` | Expert consultation requires depth |
| `commands/board.md` | `planning` | `spawned` | High-stakes governance |
| `commands/agent.md` | `planning` | `inline` | Agent design |
| `commands/build.md` | `execution` | `spawned` | Coding work, sonnet adequate |
| `commands/quick.md` | `execution` | `spawned` | Single-task work |
| `commands/review.md` | `execution` | `spawned` | Substantive critique |
| `commands/ship.md` | `execution` | `spawned` | Deployment orchestration |
| `commands/retro.md` | `execution` | `inline` | Synthesis work |
| `commands/status.md` | `check` | `inline` | File reads + summary |
| `commands/validate.md` | `check` | `inline` | Schema/cross-ref checks |
| `commands/milestone.md` | `check` | `inline` | Aggregation and reporting |
| `commands/learn.md` | `check` | `inline` | Memory write |
| `commands/portfolio.md` | `check` | `inline` | Aggregation and reporting |
| `commands/update.md` | `check` | `inline` | npm bump |

### Hunk 1a — example: `commands/plan.md`

**Before:**
```yaml
name: legion:plan
description: Plan phase N with agent recommendations and wave-structured tasks
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion]
```

**After:**
```yaml
name: legion:plan
description: Plan phase N with agent recommendations and wave-structured tasks
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion]
model: planning
execution_mode: inline
```

Apply the same pattern to all 17 commands per the table above.

---

## Hunk 2 — Frontmatter schema documentation

### Hunk 2a — `commands/COMMANDS.md` (or equivalent commands-spec doc)

If a commands-spec doc exists, add frontmatter field documentation. If not, add it to `adapters/ADAPTER.md` under a new "Command Frontmatter" section.

**New section:**

```markdown
## Command Frontmatter

Every `commands/*.md` file MUST have YAML frontmatter with these fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Slash-command name (e.g., `legion:plan`) |
| `description` | string | Yes | One-line summary shown in `/help` |
| `allowed-tools` | list | Yes | Tools the command may invoke |
| `argument-hint` | string | No | Hint text for required arguments |
| `model` | string | No | Default model tier or explicit model name. One of: `planning`, `execution`, `check`, or an explicit name like `opus`/`sonnet`/`haiku`. Defaults to `execution` if absent. Consumed by `cli-dispatch` Part 0. |
| `execution_mode` | string | No | One of: `inline` (runs in current session), `spawned` (delegates to subagents). Informational; consumed by Phase C inline-warning system. Defaults to `spawned` for commands that invoke `Agent` tool, `inline` otherwise. |
```

---

## Hunk 3 — `cli-dispatch` Section 3 Part 0 — wire command frontmatter into resolver

Phase A's Part 0 already includes `command.frontmatter.model` as the highest-precedence input. Phase B activates it by ensuring the resolver actually parses it.

### Hunk 3a — `skills/cli-dispatch/SKILL.md` Section 3 Part 0

**Before (Phase A version):**
```
Part 0: Model resolution
  - resolved_tier = (in precedence order, first non-null wins):
      1. command.frontmatter.model            (Phase B — read from active command's frontmatter)
      2. agent.model_tier                     (looked up via agent-registry table)
      3. "execution"                          (fallback default)
```

**After (Phase B version):**
```
Part 0: Model resolution
  - resolved_tier = (in precedence order, first non-null wins):
      1. command.frontmatter.model            (parse YAML frontmatter of the active command file)
      2. agent.model_tier                     (looked up via agent-registry "Agent Model Tier Defaults" table)
      3. "execution"                          (fallback default)
  - Reading command frontmatter:
      - Identify active command from invocation context (e.g., /legion:build → commands/build.md)
      - Read YAML frontmatter; extract `model` key
      - If absent: skip to step 2
      - If present and ∈ {planning, execution, check}: tier name
      - If present and not a tier name: explicit model name (passed through)
```

---

## Hunk 4 — `phase-decomposer` integration (no behavior change)

`phase-decomposer/SKILL.md:39-47` currently boosts the decomposer subagent to `model_planning` when `models.planning_reasoning: true`. This is now redundant with `commands/plan.md` declaring `model: planning`. Phase D will deprecate the flag; Phase B leaves it intact for compatibility.

No edit required in Phase B. Document the redundancy in the deprecation note (Phase D).

---

## Hunk 5 — Verification

```bash
# 1. Confirm all 17 commands have model + execution_mode
grep -l '^model:' commands/*.md | wc -l
# Expected: 17

grep -l '^execution_mode:' commands/*.md | wc -l
# Expected: 17

# 2. Confirm resolver reads command frontmatter
grep -n 'command.frontmatter.model' skills/cli-dispatch/SKILL.md
# Expected: 1+ hits

# 3. Spot-check value distribution
grep '^model:' commands/*.md | awk -F: '{print $3}' | sort | uniq -c
# Expected: 6 planning, 5 execution, 6 check (per defaults table)

# 4. Smoke test
#   a. Run /legion:quick "trivial task" with settings.json models.execution: "haiku"
#   b. Confirm spawned agent reports haiku in result file
#   c. Run /legion:status with settings.json models.check: "haiku"
#   d. Confirm no behavior change (status is inline; Phase C warning not yet active)
```

---

## Hunk 6 — Documentation update

### Hunk 6a — `README.md`

Add a new section after "Workflow":

```markdown
## How to Bake In a Lower Model

Legion has three model knobs:

1. **Per-command** (`model:` frontmatter on each command) — declared default
2. **Per-tier** (`settings.json` `models.{planning,execution,check}`) — project override
3. **Per-spawn** (agent `model_tier` from agent-registry table) — agent override

Resolution precedence (highest wins): command frontmatter > agent tier > "execution" default.
Tier name is then mapped to a concrete model via `settings.json` `models.{tier}` (if set)
or the active adapter's `model_{tier}` field (e.g., claude-code: planning=opus, execution=sonnet, check=haiku).

### Common patterns

**Cost-conscious project — drop everything one tier:**
```json
{"models": {"planning": "sonnet", "execution": "haiku", "check": "haiku"}}
```

**Maximum quality:**
```json
{"models": {"planning": "opus", "execution": "opus", "check": "sonnet"}}
```

**One-off override for a single command:**
Edit that command's frontmatter `model:` field. Reverts on next pull.

### Inline vs. spawned commands

Commands marked `execution_mode: inline` (start, explore, plan, status, validate,
milestone, learn, portfolio, update, advise, agent, retro) run in your current
Claude Code session and inherit your session model. Phase C adds a warning when
the declared `model:` mismatches the session model.

Commands marked `execution_mode: spawned` (build, quick, review, ship, board)
spawn subagents and honor `model:` literally.
```

---

## Risk register

| Risk | Mitigation |
|------|------------|
| 17 frontmatter edits introduce typos | Lint check: `/legion:validate` confirms each command frontmatter parses as valid YAML |
| Default tier per command is wrong for some teams | Each project overrides via `settings.json` or local frontmatter edit |
| `execution_mode` field becomes stale (command refactored from inline to spawned) | Add `/legion:validate` check: confirm `execution_mode: spawned` ↔ command invokes `Agent` tool |
| Inline commands don't actually swap model — user expects them to | Phase C warning system addresses this |

---

## Out of scope for Phase B

- Inline-warning system → Phase C
- Deprecating `models.planning_reasoning` → Phase D
- Per-agent frontmatter migration → Phase E
