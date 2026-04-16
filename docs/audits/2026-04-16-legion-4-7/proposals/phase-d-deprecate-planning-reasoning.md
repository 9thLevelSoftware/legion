# Phase D — Deprecate `models.planning_reasoning`

**Status:** Draft
**Resolves:** Cleanup debt left after Phase B
**Depends on:** Phase B (per-command `model:` field is the replacement mechanism)
**Sequencing:** Land after Phase B
**Backward compat:** Full in v7.x — flag continues to work but emits deprecation warning. Removal scheduled for v8.0.

---

## Background

`settings.json` `models.planning_reasoning: true` was added as a one-off mechanism to boost the **decomposer subagent** to `model_planning` (opus) when set. Two limitations:

1. It only affects the decomposer — every other agent and command ignores it.
2. The mechanism is opaque — users see "planning_reasoning" and reasonably assume it controls all planning-tier work, not a single subagent.

After Phase B, `commands/plan.md` declares `model: planning` in its frontmatter and the resolver honors it for every agent the plan command spawns. The flag becomes redundant for the decomposer case, and its narrow scope was always misleading for the general case.

Phase D deprecates the flag and routes its semantics through the new mechanism.

---

## Deprecation timeline

| Version | State | Behavior |
|---------|-------|----------|
| v7.x (current) | Active | Flag works as today |
| v7.{next} | **Deprecated** (this phase) | Flag still works; emits warning on every use; docs point to replacement |
| v8.0 | **Removed** | Flag rejected at settings load; load fails with migration instructions |

---

## Hunk 1 — `phase-decomposer/SKILL.md` deprecation guard

### Hunk 1a — Lines 38-47

**Before:**
```
If `settings.json` `models.planning_reasoning` is `true` AND the active adapter's `supports_extended_thinking` is `true`:
- Use `adapter.model_planning` (e.g., `opus`) for the decomposition agent
- Extended thinking provides deeper analysis of:
  - Requirement dependencies and implicit constraints
  - Wave ordering rationale (why plan A must precede plan B)

If `models.planning_reasoning` is `false`: use `adapter.model_execution` as normal
```

**After:**
```
[DEPRECATED in v7.{next}; removed in v8.0]

The decomposer subagent's model is now resolved via cli-dispatch Part 0:
- commands/plan.md declares model: planning in its frontmatter
- This propagates to subagents spawned by /legion:plan via the standard resolver
- Net effect: decomposer runs on adapter.model_planning when active

Legacy behavior (v7.x backward compat):
- If settings.json models.planning_reasoning is true:
    Emit deprecation warning: "models.planning_reasoning is deprecated; use commands/plan.md frontmatter model: planning instead"
    Continue with the original behavior: force decomposer to adapter.model_planning
- If settings.json models.planning_reasoning is false or absent:
    No deprecation warning; resolver chain handles model selection naturally

Migration path for users:
1. Remove models.planning_reasoning from settings.json
2. Confirm commands/plan.md has model: planning in frontmatter (default after Phase B)
3. No further action needed — same effective model selection
```

---

## Hunk 2 — `docs/settings.schema.json` deprecation marker

### Hunk 2a — `models.planning_reasoning` field

**Before:**
```json
"planning_reasoning": {
  "type": "boolean",
  "default": false
}
```

**After:**
```json
"planning_reasoning": {
  "type": "boolean",
  "default": false,
  "deprecated": true,
  "description": "DEPRECATED in v7.{next}; will be removed in v8.0. Use commands/plan.md frontmatter `model: planning` instead. Setting this to true emits a deprecation warning at every /legion:plan invocation."
}
```

---

## Hunk 3 — Settings loader deprecation warning

### Hunk 3a — Wherever settings.json is parsed

Identify the settings loader (likely `skills/workflow-common-core/SKILL.md` or a settings-load helper). Add post-load check:

```
After loading settings.json:
  If models.planning_reasoning is set (true OR false explicitly, not absent):
    Emit one-time per-session warning to stderr:
      "⚠ settings.json key models.planning_reasoning is deprecated and will be removed in v8.0.
        See docs/migration/v7-to-v8.md for the replacement mechanism."
    Log to .planning/observability/deprecations.log:
      {timestamp} models.planning_reasoning value={value} caller={command_or_skill}
```

The warning fires once per session (track in process state) to avoid noise.

---

## Hunk 4 — Migration documentation

### Hunk 4a — New file: `docs/migration/v7-to-v8.md`

```markdown
# Migration Guide — v7.x to v8.0

## Removed settings keys

### `models.planning_reasoning`

**Removed in:** v8.0
**Replacement:** Per-command `model:` frontmatter (added in v7.{next}, Phase B)

#### Old behavior (v7.x)

```json
{"models": {"planning_reasoning": true}}
```

This boosted only the decomposer subagent invoked by `/legion:plan` to `model_planning` (typically opus).

#### New behavior (v7.{next}+)

`commands/plan.md` declares `model: planning` in its YAML frontmatter. The cli-dispatch resolver honors this for every agent spawned by `/legion:plan`, including the decomposer. The behavior is broader (entire plan command tier-locked, not just the decomposer) and consistent with how every other command declares its tier.

#### Migration steps

1. Remove `models.planning_reasoning` from your `settings.json`
2. Confirm `commands/plan.md` frontmatter contains `model: planning` (default after Phase B; if missing, add it)
3. Optional: if you want a finer-grained override for ONLY the decomposer (not the rest of the plan command), set `model:` on the decomposer subagent's invocation OR override at the agent level via `agent-registry` table
4. No data migration required — the change is purely behavioral
```

### Hunk 4b — `README.md` deprecation note

Add a one-line note in the "Workflow" or "Settings" section:

```markdown
> **Deprecated in v7.{next}:** `models.planning_reasoning` — use `commands/plan.md` frontmatter `model: planning` instead. See `docs/migration/v7-to-v8.md`.
```

---

## Hunk 5 — Verification

```bash
# 1. Confirm deprecation marker in schema
grep -A2 'planning_reasoning' docs/settings.schema.json
# Expected: "deprecated": true present

# 2. Confirm phase-decomposer documents the legacy behavior
grep -n 'DEPRECATED' skills/phase-decomposer/SKILL.md
# Expected: 1+ hits

# 3. Confirm migration doc exists
ls docs/migration/v7-to-v8.md

# 4. Confirm warning fires
#   Setup: settings.json with models.planning_reasoning: true
#   Run: any legion command (warning fires once at settings load)
#   Expected: stderr contains the deprecation warning

# 5. Confirm warning suppressed when key absent
#   Setup: settings.json without models.planning_reasoning
#   Run: any legion command
#   Expected: no warning

# 6. Confirm log entry written
cat .planning/observability/deprecations.log
# Expected: entries when flag is set
```

---

## Hunk 6 — `/legion:validate` extension

### Hunk 6a — Add deprecation check to validation

In `commands/validate.md`, add a check:

```
Step N: Deprecation audit
  - Read settings.json
  - For each deprecated key (currently: models.planning_reasoning):
    If present: emit "DEPRECATED" finding with migration link
  - Reference: docs/migration/v7-to-v8.md
```

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Users who depend on the flag's narrow decomposer-only behavior get broader tier scope | Migration doc explicitly notes the scope expansion; per-agent override table available for users who want decomposer-only boost |
| Deprecation warning becomes noise | One-shot per session; suppressed when key is absent; can be silenced by removing the key (which is the intended user action) |
| v8.0 removal breaks projects that didn't migrate | Migration doc + 1+ minor version of warnings + `/legion:validate` flag → ample notice |
| Phase D ships without Phase B | Add prerequisite check in this proposal (already in dependency table); CI: refuse to merge Phase D before Phase B is in `main` |

---

## Out of scope for Phase D

- Removing the flag entirely (v8.0 work, separate proposal)
- Migrating other deprecated keys (this proposal targets `planning_reasoning` only — extend pattern in future deprecations)
