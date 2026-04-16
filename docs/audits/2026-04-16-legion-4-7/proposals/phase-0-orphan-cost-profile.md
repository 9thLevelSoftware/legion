# Phase 0 — Remove Orphan `cost_profile` Reference

**Status:** Draft
**Resolves:** LEGION-47-076
**Sequencing:** Independent — can land any time
**Backward compat:** Full — removing dead reference

---

## Pre-flight discovery

Before applying, the remediation agent must run:

```bash
grep -rn 'cost_profile' \
  C:/Users/dasbl/Documents/legion/commands \
  C:/Users/dasbl/Documents/legion/skills \
  C:/Users/dasbl/Documents/legion/adapters \
  C:/Users/dasbl/Documents/legion/.planning/config \
  C:/Users/dasbl/Documents/legion/docs
```

Confirm the only hits are:
- `commands/start.md:202` (the orphan reference itself)
- Any companion `cost_profile` question in `skills/questioning-flow/`
- Any `proposals/*.md` documentation references (audit-only, do not delete)
- Any `findings/*.md` documentation references (audit-only, do not delete)

If grep returns hits in other skills (`portfolio-manager`, `memory-manager`, `agent-registry`), STOP — switch to Path B (implement as real key) instead of Path A (delete).

---

## Path A — Delete (recommended)

### Hunk 1 — `commands/start.md:202`

**Before:**
```
      - Workflow: {mode}, {depth}, {cost_profile}
```

**After:**
```
      - Workflow: {mode}, {depth}
```

### Hunk 2 — `skills/questioning-flow/SKILL.md` (if companion question exists)

Locate any question that elicits `cost_profile` from the user. Likely shape:

**Before (if present):**
```
AskUserQuestion(questions: [{
  question: "Cost profile?",
  options: [
    {label: "premium", description: "Opus throughout"},
    {label: "balanced", description: "Mixed tiers"},
    {label: "budget", description: "Haiku-heavy"}
  ]
}])
```

**After:**
Remove the question entirely. Replace any downstream variable usage with the corresponding `models.{tier}` settings reference, OR delete if the value is never consumed.

### Hunk 3 — `skills/questioning-flow/templates/project-template.md`

Search for `{{cost_profile}}` or `{cost_profile}` template tokens. Remove if found.

### Hunk 4 — Verification

```bash
# Zero hits expected after cleanup (excluding audit/proposal docs)
grep -rn 'cost_profile' \
  C:/Users/dasbl/Documents/legion/commands \
  C:/Users/dasbl/Documents/legion/skills \
  C:/Users/dasbl/Documents/legion/adapters
# Expected: 0 hits
```

---

## Path B — Implement as real key (alternative)

Only choose this path if there is deliberate product intent to expose a single-knob cost dial.

### Hunk 1 — `docs/settings.schema.json`

Add to the `models` object:

```json
"cost_profile": {
  "type": "string",
  "enum": ["premium", "balanced", "budget", "custom"],
  "default": "custom",
  "description": "High-level cost preset. When set to non-'custom', overrides individual planning/execution/check fields with the preset's mapping."
}
```

### Hunk 2 — `.planning/config/cost-profiles.yaml` (new file)

```yaml
# Cost profile presets — applied when settings.json models.cost_profile != "custom"
profiles:
  premium:
    planning: opus
    execution: opus
    check: sonnet
    description: "Maximum capability across all tiers"
  balanced:
    planning: opus
    execution: sonnet
    check: haiku
    description: "Default — depth where it matters, speed elsewhere"
  budget:
    planning: sonnet
    execution: sonnet
    check: haiku
    description: "Cost-optimized; sacrifices planning depth"
  custom:
    description: "Honor individual planning/execution/check fields as set"
```

### Hunk 3 — `cli-dispatch` resolver update

In Section 3 Part 0 (added by Phase A), insert a pre-resolution step:

```
Part 0a: Cost profile expansion
  - If settings.json models.cost_profile is set AND != "custom":
      Read .planning/config/cost-profiles.yaml
      For each tier in {planning, execution, check}:
        If settings.json models.{tier} is "adapter_default":
          settings.json models.{tier} = profiles.{cost_profile}.{tier}
  - This expansion is ephemeral — does not write back to settings.json
```

### Hunk 4 — `commands/start.md:202` (keep with semantic change)

**Before:**
```
      - Workflow: {mode}, {depth}, {cost_profile}
```

**After:**
```
      - Workflow: {mode}, {depth}, {cost_profile} (one of: premium, balanced, budget, custom)
```

### Hunk 5 — `skills/questioning-flow/SKILL.md`

Add a real `AskUserQuestion` step that captures `cost_profile` and writes to `settings.json`:

```
AskUserQuestion(questions: [{
  question: "Pick a cost profile.",
  header: "Cost",
  options: [
    {label: "balanced", description: "Default — opus for planning, sonnet for code, haiku for checks"},
    {label: "premium", description: "Opus throughout — depth-maximizing, expensive"},
    {label: "budget", description: "Sonnet/haiku — cost-optimized, shallower planning"},
    {label: "custom", description: "Set planning/execution/check tiers individually in settings.json"}
  ]
}])
```

### Hunk 6 — Verification (Path B)

```bash
# Confirm cost_profile schema entry exists
grep -n 'cost_profile' docs/settings.schema.json
# Expected: 1+ hits

# Confirm presets file exists
ls .planning/config/cost-profiles.yaml

# Confirm resolver consumes it
grep -n 'cost_profile' skills/cli-dispatch/SKILL.md
# Expected: 1+ hits in Part 0a
```

---

## Decision criterion

| Question | If YES → | If NO → |
|----------|----------|---------|
| Is there roadmap intent to expose a one-knob cost dial in the near term? | Path B | Path A |
| Are users currently asking for a cost preset feature? | Path B | Path A |
| Does the team prefer fewer settings keys over more granular ones? | Path B | Path A |

**Default recommendation:** Path A. Path B is only justified if cost-profile UX is a deliberate product direction, not a debt-cleanup target.

---

## Risk register

| Risk | Path | Mitigation |
|------|------|------------|
| Path A removes a feature users were already relying on (silently) | A | Pre-flight grep confirms zero readers — if any found, switch to B |
| Path B adds complexity for a feature nobody requested | B | Decision criterion table + explicit acceptance from product owner before merge |
| Path B's preset values drift from adapter mappings | B | `/legion:validate` extension to cross-check preset values against adapter `model_*` mappings |
