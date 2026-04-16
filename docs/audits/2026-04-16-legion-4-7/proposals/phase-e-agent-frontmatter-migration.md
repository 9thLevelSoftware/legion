# Phase E — Agent Frontmatter Migration (Optional Consolidation)

**Status:** Draft (Optional)
**Resolves:** Architectural consolidation, not a specific finding
**Depends on:** Phase A (table-based mechanism must be stable first)
**Sequencing:** Optional — only justified if other agent metadata also needs per-file lookup
**Backward compat:** Full — table fallback retained; frontmatter overrides table when present

---

## Background

Phase A introduced a centralized `Agent Model Tier Defaults` table in `agent-registry/SKILL.md`. This table works fine for `model_tier`, but the same agents already declare a richer metadata set elsewhere:

- `languages` (e.g., `[python, rust]`)
- `frameworks` (e.g., `[react, fastapi]`)
- `artifact_types` (e.g., `[code, tests, docs]`)
- `review_strengths` (e.g., `[security, performance]`)

Per `CLAUDE.md`, this metadata enables "metadata-aware agent selection by the recommendation engine." Today, where these fields live is unclear (likely a separate registry artifact, not the agent file itself, since agent files are bare markdown bodies).

Phase E proposes a one-time migration: move all per-agent metadata (including `model_tier` from Phase A's table) into YAML frontmatter on the agent files themselves. Single source of truth per agent.

---

## Decision criterion

Phase E is **only justified** if at least one of these holds:

1. The recommendation engine performs frequent per-agent lookups and the indirection through registry tables is a measured perf hit
2. New per-agent metadata is being added regularly and the maintenance burden of keeping a centralized table in sync with 48 agent files is high
3. External tooling (e.g., docs site, agent browser UI) needs to consume agent metadata and per-file YAML is more accessible than parsing markdown tables

If none of these apply, **defer Phase E indefinitely**. The Phase A table is sufficient.

---

## Migration scope

### Hunk 1 — Per-agent frontmatter schema

Each `agents/*.md` file gains a YAML frontmatter block at the top:

```yaml
---
agent_id: engineering-senior-developer
display_name: Senior Developer
division: engineering
model_tier: execution
languages: [python, javascript, typescript, go, rust, java]
frameworks: [react, fastapi, express, django, spring]
artifact_types: [code, tests, refactors, code-reviews]
review_strengths: [maintainability, correctness, scope-discipline]
authority_domains: [implementation, refactoring, code-review]
spawn_kind: spawn_agent_personality
---
```

The body below the frontmatter remains unchanged (the personality content).

### Hunk 2 — Migration script

A one-time script (`scripts/migrate-agent-frontmatter.js` or equivalent) that:

1. Reads the existing centralized registry (whatever location holds `languages` / `frameworks` / `review_strengths` today)
2. Reads `agent-registry/SKILL.md` Agent Model Tier Defaults table
3. For each agent file:
   - Builds the frontmatter from the two sources
   - Prepends to the agent's `.md` file
4. Verifies round-trip: re-reads each file, confirms frontmatter parses as valid YAML, confirms all fields from sources are preserved
5. Generates a diff report at `.planning/migrations/agent-frontmatter-{timestamp}.diff.md`

### Hunk 3 — `agent-registry/SKILL.md` consumer update

Replace lookups against the centralized table with per-file frontmatter parses:

**Before (Phase A):**
```
Look up model_tier for agent {agent-id}:
  Read agent-registry "Agent Model Tier Defaults" table
  Find row where agent_id matches
  Return model_tier value (or "execution" default)
```

**After (Phase E):**
```
Look up model_tier for agent {agent-id}:
  Read agents/{agent-id}.md
  Parse YAML frontmatter
  Return frontmatter.model_tier (or "execution" default if absent)
```

Cache parsed frontmatter per session to avoid repeated reads.

### Hunk 4 — Backward compat — keep the table as fallback

For one minor version after the migration, keep the table in `agent-registry/SKILL.md` synchronized via a generation script:

```bash
# scripts/regenerate-agent-tier-table.js
# Reads all agents/*.md frontmatter, writes the Agent Model Tier Defaults table
# Run as a pre-commit hook or CI step
```

Resolver chain (post-migration):

1. agents/{id}.md frontmatter (if present)
2. agent-registry table (fallback during transition)
3. "execution" (final default)

After full validation, remove the table and the fallback step.

### Hunk 5 — `/legion:validate` extension

Add validation:

```
For each agents/*.md:
  Confirm YAML frontmatter parses
  Confirm required fields present: agent_id, display_name, division, model_tier
  Confirm agent_id matches filename (engineering-senior-developer.md → agent_id: engineering-senior-developer)
  Confirm division matches the directory grouping in CLAUDE.md
  Confirm model_tier ∈ {planning, execution, check}
```

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Migration script corrupts agent personality content | Round-trip verification (read → parse → re-render → byte-compare body); commit migration in a separate PR with full diff for review |
| Agent files become harder for new contributors to scan-read | Mitigated by frontmatter being at the top with clear field names; `--no-frontmatter` view mode in `/legion:agent` for users who prefer the body-only view |
| Two sources of truth during transition (frontmatter + table) drift | CI step regenerates table from frontmatter on every commit; `/legion:validate` flags drift |
| External tools (e.g., recommendation engine) break on parse failure | Frontmatter parser must be lenient (skip agent, log warning, continue); never crash a workflow because of a single bad agent file |
| Spec creep — frontmatter expands to include implementation details | Hard cap on frontmatter fields; new fields require RFC + agreement that they belong on the agent (not in plan files or settings) |

---

## Acceptance criteria

- [ ] All 48 `agents/*.md` files have valid YAML frontmatter
- [ ] All required fields present per spec
- [ ] `/legion:validate` passes on the migrated agent inventory
- [ ] Recommendation engine functionally identical pre- and post-migration (regression suite)
- [ ] Centralized `Agent Model Tier Defaults` table either removed OR auto-regenerated and labeled "GENERATED — do not edit"
- [ ] Migration script committed at `scripts/migrate-agent-frontmatter.js` and documented in `docs/contributing.md`

---

## Decision recommendation

**Defer Phase E** unless one of the three justification criteria above is actively true. The Phase A table is operational, validated, and inexpensive to maintain at 48 entries. Migration adds risk without clear benefit at current scale.

Revisit if the agent inventory grows past ~75, or if external tooling integration becomes a roadmap item.

---

## Out of scope for Phase E

- Migrating skill metadata to per-skill frontmatter (separate proposal if needed)
- Migrating command metadata beyond Phase B's `model:` and `execution_mode:` fields (already covered)
- Adding a runtime API to query agent metadata (UI/IDE integration; separate proposal)
