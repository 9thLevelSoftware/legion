# Legion — Contract Cleanup & `/legion:explore` Inline-Persona Refactor

**Design document**
**Date**: 2026-05-04
**Baseline version**: Legion v7.3.3 (current `package.json`). Note: `.planning/STATE.md` independently claims v6.0.0; that is stale project-state bookkeeping unrelated to this spec, but worth tracking as a separate cleanup task.
**Target version**: Open. Two reasonable destinations: (a) **v7.3.4 patch release** if shipped quickly as a contract-hygiene fix; (b) folded into **v7.4.0** (the 4.7 literalism audit's target version) as the mechanical companion to the prose-level remediation. The implementation plan picks one. The work itself does not require either choice.
**Audit relationship**: Adds CAT-11 to `docs/audits/2026-04-16-legion-4-7/RUBRIC.md` (rubric v1.0 → v1.1)
**Status**: Draft (awaiting user review before implementation plan)

---

## 1. Problem Statement

### 1.1 The combined defect: contract drift between executable and prose layers

Legion's prompt-native architecture has four contract layers that are supposed to agree:

1. JSON instances (`settings.json`, generated `PLAN.md` frontmatter)
2. JSON Schemas (`docs/settings.schema.json`, `docs/schemas/plan-frontmatter.schema.json`)
3. Prose specs (skills, commands, validate.md)
4. Validation scripts (`scripts/release-check.js`, `tests/`)

Three layers are currently inconsistent in concrete, verifiable ways:

- **Settings.** `settings.json` ships 6 fields/blocks the schema's `additionalProperties: false` rejects: `dispatch` (whole block), `models.planning_reasoning`, `execution.use_worktrees`, `memory.auto_prune`, `memory.prune_threshold`, `memory.prune_age_days`. All 6 fields are consumed by code/skills (verified by grep across `skills/`, `adapters/`, `commands/`, `tests/`), so the schema is the wrong layer.
- **Plan frontmatter.** Schema requires singular `agent` (string). Phase-decomposer template emits plural `agents` (array), structured `expected_artifacts` (array of `{path, provides, required}` objects), and a `must_haves` block. Schema has `additionalProperties: false`, so `must_haves` is illegal. Consumers (`/legion:validate`, wave-executor) read singular. Three layers, three different shapes.
- **Command spawn pattern.** `/legion:explore` declares "Spawn agent: polymath" in prose without an enforced `Agent(...)` tool gate. The same anti-pattern surface exists across at least 9 commands (grep for `spawn`/`dispatch`/`Agent(` in `commands/`). Some commands correctly invoke `Agent(`; some don't. No mechanical check distinguishes them.

The shared root cause: **prose specs redefine contracts that have an executable source of truth, and there is no mechanical enforcement that keeps them in sync.**

### 1.2 Evidence anchors (verified during design)

| Claim | Verified by |
|---|---|
| Settings ships 6 fields the schema forbids | Read of `settings.json` and `docs/settings.schema.json` |
| All 6 fields are real (not vestigial) | Grep for each field name across `skills/`, `adapters/`, `commands/`, `tests/`. Each appears in at least one consumer. |
| `planning_reasoning` already has a deprecation proposal | `docs/audits/2026-04-16-legion-4-7/proposals/phase-d-deprecate-planning-reasoning.md` |
| Plan-frontmatter schema requires singular `agent` | Read of `docs/schemas/plan-frontmatter.schema.json` line 6 |
| `/legion:explore` execution context lacks `workflow-common-core` and `polymath-engine` | Read of `commands/explore.md` lines 11–14 |
| Map omission for `/legion:explore` | Verified per existing audit findings (CLAUDE.md finding `LEGION-47-001`, related context) |

## 2. Goals

1. Reconcile `settings.json` ↔ `settings.schema.json` with zero field loss; mark `planning_reasoning` deprecated per existing audit proposal.
2. Reconcile `plan-frontmatter.schema.json` ↔ phase-decomposer template ↔ consumers with plural `agents`, structured `expected_artifacts`, and explicit `must_haves` schema.
3. Refactor `/legion:explore` from spawned-conversation-owner to inline-persona pattern. Resolve agent path via `workflow-common-core`. Load `polymath-engine`. Add command to `workflow-common-core`'s canonical command-to-skill mapping.
4. Add three executable validators that run **CI-authoritative + command-time soft-warn**: `validate-settings.js`, `validate-plan-frontmatter.js`, `validate-command-spawn-truthfulness.js` (CI-only).
5. Audit-wide spawn check: for every command whose body contains spawn / dispatch / Agent language, assert it either invokes `Agent(` literally OR carries frontmatter `mode: inline-persona`. Commands that do not contain spawn-flavored language are exempt. Surface defects (expected: 2–5 commands beyond `explore.md`).
6. Add CAT-11 "Mechanical Contract Drift" to the 4.7 audit rubric (v1.1). Re-score the 64 already-audited files for CAT-11 only (mechanical pass, not a full re-audit). Findings feed the existing `REMEDIATION.md`.

## 3. Non-goals (explicit)

- Worktree mode hardening (separate spec)
- Recommendation engine canonicalization (separate spec)
- Memory file model clarification — settings fields added here, but the "one file vs four files" doc reconciliation is deferred
- Condensed personality mode operationalization
- Replacing `validate.sh` and other shell scripts with Node equivalents
- Live integration tests against all 9 CLI runtimes
- Changing any agent personality file
- Migrating PLAN.md files in archived milestones (frozen — `oneOf` in schema preserves legacy phase form for archive compatibility)

---

## 4. Architecture

Four mechanical changes, each independent. Designed so any one can ship without the others.

### 4.1 CAT-11 rubric — "Mechanical Contract Drift"

Added to `docs/audits/2026-04-16-legion-4-7/RUBRIC.md` as v1.1.

**Definition.** A finding under CAT-11 exists when a file makes a claim that is mechanically falsifiable against a sibling artifact, and the claim is currently false.

**Detection — structural, not prose-based.** This is what makes CAT-11 different from CAT-1–10. The existing rubric matches text patterns; CAT-11 matches by running a check.

| File class | Mechanical claim | Falsification check |
|---|---|---|
| `settings.json` | conforms to schema | Ajv against `docs/settings.schema.json` |
| `docs/settings.schema.json` | every field is consumed somewhere | grep field name across `skills/`, `adapters/`, `commands/` |
| `docs/schemas/plan-frontmatter.schema.json` | every required field is in phase-decomposer template | parse template frontmatter, diff against schema's `required` |
| `skills/phase-decomposer/SKILL.md` (template) | template emits valid frontmatter | extract template, validate against schema |
| `commands/*.md` | if "spawn agent" present, `Agent(` invoked OR `mode: inline-persona` declared | regex + frontmatter parse |
| `commands/*.md` `<execution_context>` | every listed path exists | filesystem check |
| `commands/*.md` | command appears in `workflow-common-core` canonical map | parse map, diff command list |

**Severity rubric for CAT-11.**

- **P0:** invalid contract that causes runtime failure on common path
- **P1:** invalid contract that causes silent wrong behavior
- **P2:** drift that is currently survivable due to forgiving consumers
- **P3:** documentation-level drift only

**Re-scoring policy.** All 64 already-audited files get a CAT-11-only pass (not a full re-audit). The pass is mechanical: run the checks above, record findings. Files with zero CAT-11 hits get a one-line note in their findings file. Files with CAT-11 hits get appended findings (`LEGION-47-NNN` continues from current max ID). Estimated effort: **4–6 hours** mechanical work, far less than the original 28h audit estimate because no prose interpretation is required.

### 4.2 Validators — three scripts

**`scripts/validate-settings.js`** (new)

- Reads `settings.json`, validates against `docs/settings.schema.json` using Ajv (added as devDependency).
- Exits 0 on valid; non-zero with numbered finding list on invalid.
- Wired into `release-check.js` as a hard fail.
- Wired into `workflow-common-core`'s adapter-detection startup as an advisory: prints warnings via the adapter's user channel; never blocks.

**`scripts/validate-plan-frontmatter.js`** (new)

- Reads a target file or directory of PLAN.md files. Parses frontmatter using `gray-matter` (added as devDependency — replaces the regex parser in `tests/plan-schema-conformance.test.js`).
- Validates against `docs/schemas/plan-frontmatter.schema.json` using Ajv.
- Exits 0/non-zero with finding list.
- Wired into `release-check.js` as hard fail (validates all `.planning/phases/**/PLAN.md`).
- Wired into `/legion:plan` as soft-warn advisory after each plan write. Output included in plan-critique input.

**`scripts/validate-command-spawn-truthfulness.js`** (new, CI-only)

- For every `commands/*.md`: parse frontmatter and body.
- If body contains `spawn`/`dispatch`/`Agent` language AND frontmatter does not declare `mode: inline-persona`: assert that body contains a literal `Agent(` invocation block OR a documented adapter-spawn pattern.
- Exits 0/non-zero with finding list. CI-only — does not run at command time.
- Wired into `release-check.js` as hard fail.

### 4.3 `/legion:explore` — inline-persona refactor

**New command frontmatter field:** `mode: inline-persona` declares that the command operates the conversation directly under the named persona, rather than spawning a subagent for the user-facing loop.

**Rewrite of `commands/explore.md`:**

```markdown
---
name: legion:explore
description: ...
mode: inline-persona
inline_persona: polymath
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion]
---

<execution_context>
skills/workflow-common-core/SKILL.md
skills/questioning-flow/SKILL.md
skills/polymath-engine/SKILL.md
</execution_context>
```

**Persona load procedure (in command body):**

1. Resolve `AGENTS_DIR` via workflow-common-core's Agent Path Resolution.
2. Read `{AGENTS_DIR}/polymath.md` and inject the full personality into the current command context.
3. Conduct interactive exchanges using `AskUserQuestion` (per CLAUDE.md mandate), driven by polymath-engine's structured-choice rules.
4. Optional silent research delegation: spawn read-only research scouts via `Agent()` for non-interactive lookups only. Return findings; main session continues asking choices.

**Removed language:** "Spawn agent: polymath", "Polymath takes over the conversation", "Command steps back and monitors", "Polymath conducts exploration" — all replaced with first-person inline operation.

**Map fix:** add `/legion:explore` to `skills/workflow-common-core/SKILL.md`'s canonical command-to-skill mapping (currently only listed in the deprecated `workflow-common`).

### 4.4 Spawn truthfulness — audit across 9 commands

After the validator (§4.2) lands, run it once. For each finding:

- If the command really should spawn → fix to invoke `Agent(` properly with a documented dispatch gate.
- If the command really operates inline → add `mode: inline-persona` frontmatter and rewrite spawn-flavored prose to inline-flavored prose.

Expected finding count: 2–5 commands beyond `explore.md`. Likely candidates by name match (grep result): `advise`, `quick`, `board`, `portfolio`. Fixes are individually small but each requires reading the command end-to-end to determine which side of the line it's on.

---

## 5. Concrete schema diffs and file changes

### 5.1 `docs/settings.schema.json` — additions

Add these properties (preserving existing structure, all `additionalProperties: false` retained):

```json
"models": {
  "properties": {
    "planning": { "type": "string" },
    "execution": { "type": "string" },
    "check": { "type": "string" },
    "planning_reasoning": {
      "type": "boolean",
      "default": false,
      "deprecated": true,
      "description": "DEPRECATED — see docs/audits/2026-04-16-legion-4-7/proposals/phase-d-deprecate-planning-reasoning.md. Slated for removal in v8.0."
    }
  },
  "required": ["planning", "execution", "check"]
}
```

```json
"execution": {
  "properties": {
    "auto_commit": { "type": "boolean" },
    "commit_prefix": { "type": "string", "minLength": 1 },
    "agent_personality_verbosity": { "type": "string", "enum": ["full", "condensed"] },
    "use_worktrees": {
      "type": "boolean",
      "default": false,
      "description": "EXPERIMENTAL — opt-in worktree isolation per plan. See skills/wave-executor/SKILL.md for behavior. Defaults to false; flip only after running scripts/worktree-doctor.js (forthcoming, separate spec)."
    }
  },
  "required": ["auto_commit", "commit_prefix", "agent_personality_verbosity"]
}
```

```json
"memory": {
  "properties": {
    "enabled": { "type": "boolean" },
    "project_scoped_only": { "type": "boolean", "const": true },
    "auto_prune": { "type": "boolean", "default": false },
    "prune_threshold": { "type": "integer", "minimum": 1, "default": 200 },
    "prune_age_days": { "type": "integer", "minimum": 1, "default": 90 }
  },
  "required": ["enabled", "project_scoped_only"]
}
```

New top-level block (was missing entirely):

```json
"dispatch": {
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "enabled": { "type": "boolean" },
    "fallback_to_internal": { "type": "boolean" },
    "timeout_ms": { "type": "integer", "minimum": 10000 },
    "max_retries": { "type": "integer", "minimum": 0, "maximum": 3 }
  },
  "required": ["enabled", "fallback_to_internal", "timeout_ms", "max_retries"]
}
```

Top-level `required` array: add `"dispatch"`.

**No changes to `settings.json`.** All current values are valid against the expanded schema.

### 5.2 `docs/schemas/plan-frontmatter.schema.json` — full replacement

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Legion Plan Frontmatter",
  "type": "object",
  "required": ["phase", "plan", "wave", "agents"],
  "properties": {
    "phase": {
      "oneOf": [
        { "type": "integer", "minimum": 1 },
        { "type": "string", "pattern": "^\\d{2}-[a-z0-9-]+$" }
      ],
      "description": "Phase number (legacy) or NN-slug form (current)"
    },
    "plan": { "type": "string", "pattern": "^\\d{2}-\\d{2}$" },
    "wave": { "type": "integer", "minimum": 1 },
    "agents": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1,
      "description": "Agent IDs from registry. First entry is primary executor."
    },
    "autonomous": { "type": "boolean", "default": false },
    "depends_on": { "type": "array", "items": { "type": "string", "pattern": "^\\d{2}-\\d{2}$" } },
    "files_modified": { "type": "array", "items": { "type": "string" } },
    "files_forbidden": { "type": "array", "items": { "type": "string" } },
    "sequential_files": { "type": "array", "items": { "type": "string" } },
    "requirements": { "type": "array", "items": { "type": "string" } },
    "expected_artifacts": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["path"],
        "properties": {
          "path": { "type": "string" },
          "provides": { "type": "string" },
          "required": { "type": "boolean", "default": true }
        },
        "additionalProperties": false
      }
    },
    "verification_commands": { "type": "array", "items": { "type": "string" } },
    "must_haves": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "truths": { "type": "array", "items": { "type": "string" } },
        "artifacts": { "type": "array", "items": { "type": "string" } },
        "key_links": { "type": "array", "items": { "type": "string" } }
      }
    },
    "recommendation": {
      "type": "object",
      "description": "Optional sidecar of recommendation engine output. Not required for v6.x plans."
    }
  },
  "additionalProperties": false
}
```

Key changes from current schema:

- `agent` (singular string, required) → `agents` (array of strings, required, `minItems: 1`)
- `phase` accepts both `integer` (legacy) and `NN-slug` (current) — backward compatible
- `expected_artifacts` becomes `array<object>` with structured fields
- `must_haves` block added with `truths` / `artifacts` / `key_links`
- `recommendation` block reserved for future score-export work (see §3 non-goals)

### 5.3 Consumer updates

| File | Change |
|---|---|
| `commands/validate.md` | Read `agents[0]` as primary, `agents[1..]` as co-executors. Add validation rule: `agents` is array, not string. |
| `skills/wave-executor/SKILL.md` | Update plan-frontmatter parsing: read `agents` array. Primary executor = `agents[0]`. Document multi-agent dispatch: spawn primary first; co-agents spawn in parallel only if `files_modified` permits no-conflict overlap. |
| `skills/phase-decomposer/SKILL.md` | Confirm template already emits plural `agents`; ensure schema-link comment in template references the corrected schema. |
| `tests/plan-schema-conformance.test.js` | Replace custom regex YAML parser with `gray-matter` import. Add Ajv-based schema validation. Cover: array `agents`, structured `expected_artifacts`, `must_haves` block. |
| `commands/explore.md` | Per §4.3 — new frontmatter fields, new execution_context, rewritten body. |
| `skills/workflow-common-core/SKILL.md` | Add `/legion:explore` to canonical command-to-skill mapping. |

### 5.4 New files

```
scripts/
  validate-settings.js                       ~80 LOC, depends on ajv + fs
  validate-plan-frontmatter.js               ~120 LOC, depends on ajv + gray-matter + glob
  validate-command-spawn-truthfulness.js     ~100 LOC, depends on gray-matter + fs

tests/
  validate-settings.test.js                  fixtures: valid + each invalid mutation
  validate-plan-frontmatter.test.js          fixtures: valid + missing-required + wrong-type
  validate-command-spawn-truthfulness.test.js  fixtures: spawn-with-Agent, spawn-without-Agent, inline-persona-mode

docs/audits/2026-04-16-legion-4-7/
  RUBRIC.md                                  bumped to v1.1; CAT-11 section added
  cat-11-rescore-pass.md                     (new) records per-file CAT-11 results
```

### 5.5 `package.json` additions

```json
"devDependencies": {
  "ajv": "^8.x",
  "gray-matter": "^4.x"
}
```

Both are dev-only. Runtime never imports them.

---

## 6. Test surface and migration

### 6.1 New tests

Three new test files (Node `node:test`, no new test framework):

**`tests/validate-settings.test.js`**

- Fixture `tests/fixtures/settings-validation/valid.json` — current `settings.json` should pass after schema update
- Fixture `invalid-extra-field.json` — adds `unknown_field`, expects fail
- Fixture `invalid-missing-required.json` — drops `models`, expects fail
- Fixture `invalid-wrong-type.json` — `auto_commit: "yes"`, expects fail
- Live check: load actual `settings.json`, assert valid (regression guard)

**`tests/validate-plan-frontmatter.test.js`**

- Fixture `valid-current.md` — modeled on real Phase 12 plan
- Fixture `invalid-singular-agent.md` — uses `agent:` not `agents:`, expects fail
- Fixture `invalid-flat-artifacts.md` — `expected_artifacts: ["a", "b"]`, expects fail
- Fixture `invalid-extra-field.md` — adds `unknown_block:`, expects fail
- Fixture `valid-multi-agent.md` — `agents: [a, b]`, expects pass
- Live check: every `.planning/phases/**/PLAN.md` validates clean (after migration)

**`tests/validate-command-spawn-truthfulness.test.js`**

- Fixture `spawn-with-agent-call.md` — body says "spawn" + contains `Agent(`, expects pass
- Fixture `spawn-without-agent-call.md` — body says "spawn", no `Agent(`, no `mode: inline-persona`, expects fail
- Fixture `inline-persona-mode.md` — `mode: inline-persona` in frontmatter, body says "inline" not "spawn", expects pass
- Fixture `no-spawn-no-inline.md` — neither pattern, expects pass (e.g. `/legion:status`)
- Live check: every `commands/*.md` validates clean (after §4.4 fixes)

### 6.2 Existing test updates

| Test file | Change |
|---|---|
| `tests/plan-schema-conformance.test.js` | Delete custom regex YAML parser. Replace with `gray-matter` import. Add `agents` array assertions. Keep DSC-01/02/03 coverage. |
| `tests/cross-reference-validation.test.js` | Add: every command in `commands/*.md` appears in `workflow-common-core` canonical map. |
| `tests/lint-commands.test.js` | Add: every path in `<execution_context>` blocks resolves on disk. |
| `tests/dispatch-conformance.test.js` | Verify it passes after schema update — no test changes expected, schema fix alone unblocks it. |

### 6.3 Migration

**Settings migration: none.** Schema expansion accepts current `settings.json` unmodified.

**Plan frontmatter migration:** existing PLANs in `.planning/phases/01-*/` through `12-*/` were written under the old schema.

| Approach | Description | Recommendation |
|---|---|---|
| **A. Migrate in this spec** | `scripts/migrate-plans-to-v2.js` converts `agent: foo` → `agents: [foo]` and flat `expected_artifacts` → structured form. Runs once, committed, deleted in follow-up commit. | **Recommended.** ~30 PLAN.md files; mechanical migration; needed to make `validate-plan-frontmatter` pass on real state. |
| B. Defer | Loosen schema with `oneOf` to accept legacy form indefinitely. | Rejected — perpetuates drift. |

Migration script is small (~50 LOC). Test fixture: copy a representative pre-migration PLAN to `tests/fixtures/migration/`, run script, assert post-migration form.

**Command spawn-truthfulness fixes:** per §4.4, run validator once, address each finding individually. Track in `docs/audits/2026-04-16-legion-4-7/cat-11-rescore-pass.md`.

**`/legion:explore` rewrite:** single-file refactor per §4.3. Snapshot current `commands/explore.md` as `docs/audits/.../findings/commands/explore-pre-refactor.snapshot.md` for audit traceability before editing.

### 6.4 Rollout sequence

Four implementation phases. Each is independently shippable; later phases assume earlier ones merged.

| Phase | Scope | Verification | Reversible? |
|---|---|---|---|
| **1. Schema reconciliation** | Update `settings.schema.json` and `plan-frontmatter.schema.json`. No code changes. | Settings validation passes against real `settings.json`; existing tests still pass. | Trivially — revert one commit. |
| **2. Validators + tests** | Add three `scripts/validate-*.js`, three `tests/validate-*.test.js`, fixtures. Wire into `release-check.js`. | `release-check` runs clean; new tests pass. | Yes — revert script wiring. |
| **3. Migration + consumer updates** | Run plan migration script; update wave-executor + validate.md to read `agents` array; update plan-schema-conformance.test.js to use gray-matter. | All `.planning/phases/**/PLAN.md` validate; full test suite passes. | Partially — migration is reversible from git. |
| **4. Polymath/explore + spawn-truthfulness** | Rewrite `explore.md`; add `mode: inline-persona` field; run spawn-truthfulness validator across 9 commands; fix findings; add to workflow-common-core map. CAT-11 rescore pass. | spawn-truthfulness validator passes; cross-reference test passes; manual smoke-test of `/legion:explore`. | Yes — each command fix is independent. |

CAT-11 rubric bump (RUBRIC.md → v1.1) lands in Phase 4 alongside the rescore pass.

---

## 7. Risks and mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Adding Ajv + gray-matter as devDependencies violates "zero runtime dependencies" stance | Low | Medium | Both are dev-only; runtime never imports them. README/CONTRIBUTING note clarifies dev vs runtime dep policy. |
| 2 | Plan migration corrupts existing `.planning/phases/**/PLAN.md` | Medium | High | Migration script writes to staging dir first; diff reviewed; commit after manual verification. Pre-migration snapshot in audit findings dir. Revertable from git. |
| 3 | CAT-11 rubric bump invalidates 4.7 audit's "frozen rubric" promise | Certain | Low | Documented as v1.1 with explicit re-scoring policy. CAT-11 re-score is mechanical (4–6h). The 10 prose categories are NOT revisited. |
| 4 | Spawn-truthfulness validator produces false positives | Medium | Medium | Validator combines regex + frontmatter check + simple AST scan; fixture suite covers each pattern. Manual review of every flagged command before fix. |
| 5 | `/legion:explore` rewrite changes user-facing behavior | Low | High | Inline-persona mode preserves all flows (mode selection, structured choices, save-to-exploration-file). Only the internal "who drives the loop" changes. Smoke-test all four modes before merge. |
| 6 | `agents: [...]` plural breaks downstream tools that read `agent` (singular) | Medium | High | Migration script converts; consumer updates land in same phase; full test suite must pass. plan-schema-conformance.test.js extended for both required-field shape and consumer parsing. |
| 7 | Validators at command-time slow down `/legion:plan` | Low | Low | Soft-warn implementation: validation runs async/post-write, never blocks. ≤100ms per PLAN.md. |
| 8 | Existing 4.7 audit findings overlap with CAT-11 (e.g., `LEGION-47-001` flagged `{AGENTS_DIR}` placeholder as CAT-6) | Certain | Low | Re-score policy: when CAT-11 finding overlaps existing CAT-N, both stay. Different rubric lenses, not duplicates. |
| 9 | Worktree mode added to schema while underlying feature remains experimental | Certain | Low | Schema description explicitly notes experimental status and points to forthcoming `worktree-doctor.js`. Adding the field does not change runtime behavior. |
| 10 | Releasing schema changes mid-v6.0 breaks a v6.0 user mid-flight | Low | Medium | Schema expansion is strictly additive (no field removed, no validation tightened on existing fields). Plan migration is one-shot for the maintainer's own state. |

**Risk #1 deserves a sharper note.** The user diagnosis explicitly recommended Ajv and gray-matter as dev-only tooling. The CLAUDE.md states "no new JS executables beyond recommendation engine updates" — but that's about runtime, not test infrastructure. `scripts/release-check.js` already runs Node and reads files; adding Ajv to it is in line with what's there. Hand-rolled validators would mirror the fragility of the current regex YAML parser, which is exactly what the diagnosis flagged. Ajv was chosen.

---

## 8. Success criteria

This work is done when all of the following are true:

1. `scripts/validate-settings.js` exists, passes against current `settings.json`, fails on each of the four fixture mutations. Wired into `release-check.js`.
2. `scripts/validate-plan-frontmatter.js` exists, passes against every migrated `.planning/phases/**/PLAN.md`, fails on each of the four fixture mutations. Wired into `release-check.js` and into `/legion:plan` as soft-warn advisory.
3. `scripts/validate-command-spawn-truthfulness.js` exists, passes against every `commands/*.md` after §4.4 fixes, fails on each of the three fixture mutations. Wired into `release-check.js` only.
4. `docs/settings.schema.json` accepts current `settings.json` unmodified. All six previously-drifted fields/blocks have schema entries with appropriate types and descriptions. `planning_reasoning` carries `deprecated: true`.
5. `docs/schemas/plan-frontmatter.schema.json` matches phase-decomposer template shape. Plural `agents` array, structured `expected_artifacts` objects, `must_haves` block, optional `recommendation` reservation. `additionalProperties: false` retained.
6. All consumer files updated: `commands/validate.md` reads `agents` array; `skills/wave-executor/SKILL.md` documents multi-agent dispatch with `agents[0]` as primary; `skills/phase-decomposer/SKILL.md` template comment references corrected schema.
7. `tests/plan-schema-conformance.test.js` no longer contains the custom regex YAML parser. Uses `gray-matter`. All previous DSC-01/02/03 coverage retained plus new `agents`/`expected_artifacts`/`must_haves` coverage.
8. `tests/cross-reference-validation.test.js` asserts every command appears in `workflow-common-core` canonical map. `/legion:explore` is in the map.
9. `tests/lint-commands.test.js` asserts every `<execution_context>` path resolves on disk.
10. `commands/explore.md` carries `mode: inline-persona` and `inline_persona: polymath` frontmatter. Execution context loads `workflow-common-core`, `questioning-flow`, `polymath-engine`. Body resolves agent path via canonical loader, no narrative-spawn language.
11. Spawn-truthfulness validator surfaces zero findings across all `commands/*.md`. Each previously-flagged command either invokes `Agent(` or carries `mode: inline-persona`.
12. CAT-11 added to `RUBRIC.md` v1.1. Re-score pass executed against all 64 audited files; results recorded in `cat-11-rescore-pass.md`. New CAT-11 findings appended to `FINDINGS-DB.jsonl` continuing `LEGION-47-NNN` ID sequence. Existing 10-category findings unchanged.
13. `release-check.js` runs clean with all three validators wired in.
14. `package.json` declares `ajv` and `gray-matter` as `devDependencies`. Runtime imports unchanged.
15. CHANGELOG entry records: schema reconciliation, plan-frontmatter shape change with migration note, `/legion:explore` inline-persona refactor, CAT-11 rubric addition.

---

## 9. Out of scope (explicit)

- **Worktree mode hardening** — `scripts/worktree-doctor.js`, conflict retention policy, branch collision tests. Schema description references the forthcoming work but no code lands here.
- **Recommendation engine canonicalization** — `recommendation` block in plan frontmatter is reserved by schema but not populated. Score export, archetype boost docs alignment, "script as canonical scoring source" are a separate spec.
- **Memory file model clarification** — settings fields are added (`auto_prune`, `prune_threshold`, `prune_age_days`), but the broader question of "is memory one file or four?" is not resolved here. Memory-manager skill prose stays as-is.
- **Condensed personality mode** — schema already supports `agent_personality_verbosity: condensed`; making it real is a separate spec.
- **Replacing `validate.sh` and other shell scripts with Node equivalents** — only new validators here use Node.
- **Migrating PLAN.md files in archived milestones** — frozen. Schema accepts legacy `phase: <integer>` form via `oneOf` for archive compatibility; we don't rewrite archive content.
- **Live integration tests against all 9 CLI runtimes** — explicit non-goal per diagnosis Phase 2 ordering.
- **Changing any agent personality file** — zero `agents/*.md` modifications.

---

## 10. Handoff to implementation plan

This design document terminates here. The next step is generating an executable implementation plan via the `superpowers:writing-plans` skill, keyed to the four phases in §6.4 with per-phase acceptance criteria and verification commands.
