# Legion Contract Cleanup & `/legion:explore` Inline-Persona Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-05-04-contract-cleanup-and-explore-refactor-design.md` (commit `9991e05`)

**Goal:** Reconcile `settings.json` and plan-frontmatter schemas with their executable layers, add three executable validators (CI-authoritative + command-time soft-warn for two of them), refactor `/legion:explore` from spawned-conversation-owner to inline-persona pattern, sweep all `commands/*.md` for spawn-truthfulness defects, and add CAT-11 (Mechanical Contract Drift) to the existing 4.7 audit rubric (v1.0 → v1.1) with a mechanical re-score pass against the 64 already-audited files.

**Architecture:** Four phases, each independently shippable. Phase 1 (schema reconciliation) lays the contract foundation with no code changes. Phase 2 (validators + tests) builds the enforcement infrastructure using Ajv + gray-matter as new devDependencies; runtime imports are unchanged. Phase 3 (migration + minimal consumer updates) brings real PLAN.md state into compliance with the new schema and replaces the fragile regex YAML parser in the existing schema-conformance test. Phase 4 (Polymath/explore + spawn-truthfulness sweep + CAT-11 rubric) addresses the command-layer drift and folds findings into the existing 4.7 audit infrastructure.

**Tech Stack:** Node.js (existing — `node:test`, `node --test`); Ajv 8 (new devDependency for JSON Schema validation); gray-matter 4 (new devDependency for YAML frontmatter parsing); Bash for orchestration. No runtime dependency changes.

---

## Phase 1 — Schema Reconciliation

No code changes. Schema-only edits. Validates current `settings.json` against the expanded schema using a one-off Ajv invocation (the formal validator script lands in Phase 2).

### Task 1: Update `docs/settings.schema.json` to accept current `settings.json`

**Files:**
- Modify: `docs/settings.schema.json` (full file ≈110 lines)

- [ ] **Step 1: Read current schema and confirm starting state**

Run:
```bash
cat docs/settings.schema.json | head -120
```

Expected: schema with `additionalProperties: false` everywhere, `models` block accepting only `planning`/`execution`/`check`, `memory` block accepting only `enabled`/`project_scoped_only`, NO `dispatch` top-level block, NO `models.planning_reasoning`, NO `execution.use_worktrees`.

- [ ] **Step 2: Add `models.planning_reasoning` (deprecated)**

Edit `docs/settings.schema.json` — replace the `models` properties block:

```json
"models": {
  "type": "object",
  "additionalProperties": false,
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

- [ ] **Step 3: Add `execution.use_worktrees` (experimental)**

Replace the `execution` properties block:

```json
"execution": {
  "type": "object",
  "additionalProperties": false,
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

- [ ] **Step 4: Add memory pruning fields**

Replace the `memory` properties block:

```json
"memory": {
  "type": "object",
  "additionalProperties": false,
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

- [ ] **Step 5: Add new top-level `dispatch` block**

Insert after the `memory` block, before `integrations`:

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

Update top-level `required` array (currently `["models", "planning", "execution", "review", "memory", "integrations"]`) to add `"dispatch"`.

- [ ] **Step 6: Verify current `settings.json` validates against the new schema**

Run a one-off Ajv check (Ajv is not yet a project dependency; install it transiently into a temp dir to keep the project clean):

```bash
cd /tmp && npm init -y >/dev/null 2>&1 && npm install ajv@8 >/dev/null 2>&1
node -e "
const Ajv = require('/tmp/node_modules/ajv').default;
const fs = require('fs');
const schema = JSON.parse(fs.readFileSync('${PWD}/docs/settings.schema.json', 'utf8'));
const data = JSON.parse(fs.readFileSync('${PWD}/settings.json', 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);
const ok = validate(data);
if (ok) { console.log('VALID'); process.exit(0); }
console.log('INVALID:', JSON.stringify(validate.errors, null, 2));
process.exit(1);
"
```

Expected: `VALID`.

If INVALID: investigate the error, fix the schema (do not modify `settings.json`), re-run.

- [ ] **Step 7: Commit**

```bash
git add docs/settings.schema.json
git commit -m "fix(schema): align settings.schema.json with shipping settings.json

Adds dispatch block, models.planning_reasoning (deprecated), execution.use_worktrees
(experimental), and memory pruning fields. settings.json validates clean against
the expanded schema. No settings.json changes; expansion is strictly additive."
```

---

### Task 2: Update `docs/schemas/plan-frontmatter.schema.json` to match phase-decomposer template

**Files:**
- Modify: `docs/schemas/plan-frontmatter.schema.json` (full replacement, ≈70 lines)

- [ ] **Step 1: Read current schema to confirm starting state**

Run:
```bash
cat docs/schemas/plan-frontmatter.schema.json
```

Expected: schema requires `["phase", "plan", "wave", "agent"]` (singular agent), `plan` matches `^\d{2}-\d{2}$`, `expected_artifacts` is `array<string>`, no `must_haves` field allowed.

- [ ] **Step 2: Replace the entire schema with the canonical shape**

Write the full new content to `docs/schemas/plan-frontmatter.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Legion Plan Frontmatter",
  "description": "Schema for PLAN.md YAML frontmatter fields",
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
      "description": "Agent IDs from registry. First entry is primary executor; subsequent entries are co-executors."
    },
    "autonomous": { "type": "boolean", "default": false },
    "depends_on": {
      "type": "array",
      "items": { "type": "string", "pattern": "^\\d{2}-\\d{2}$" }
    },
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
    "type": { "type": "string" },
    "title": { "type": "string" },
    "recommendation": {
      "type": "object",
      "description": "Optional sidecar of recommendation engine output. Reserved; not required for v6.x/v7.x plans."
    }
  },
  "additionalProperties": false
}
```

Note: `type` and `title` were not in the original schema, but live PLAN files like `12-01-PLAN.md` use them (`title: "Regression Testing & Documentation Updates"`, `type: "execute"`). Including them in the schema avoids spurious migration noise.

- [ ] **Step 3: Spot-check that one real plan validates against the new schema**

Pick a representative plan: `.planning/phases/12-integration-release/12-01-PLAN.md`. Manually verify field shapes against the schema (paper check — automated check happens in Task 5):

```
phase: 12              -> integer (oneOf branch 1) ✓
plan: 1                -> WILL FAIL (must match ^\d{2}-\d{2}$). Migration in Task 9 will fix.
wave: 1                -> integer ≥ 1 ✓
agents: [...]          -> array, minItems 1 ✓
must_haves: [...]      -> WAIT. Look at file — must_haves is a list, but schema says object.
```

If `must_haves` is a list in real plans (not the structured object form), document this as a migration concern — Task 9 will normalize.

Actually read the file to confirm:
```bash
sed -n '/^must_haves:/,/^[a-z]/p' .planning/phases/12-integration-release/12-01-PLAN.md
```

Expected output: shows whether `must_haves` is a flat list or a nested `{truths, artifacts, key_links}` object. Migration logic adapts accordingly.

- [ ] **Step 4: Commit**

```bash
git add docs/schemas/plan-frontmatter.schema.json
git commit -m "fix(schema): replace plan-frontmatter schema to match generator template

Plural agents array (was singular), structured expected_artifacts objects
(was flat strings), must_haves block, type/title fields, oneOf phase form
for legacy integer + current NN-slug compatibility, optional recommendation
sidecar reservation. additionalProperties: false retained.

Existing PLANs need migration; Task 9 in the implementation plan handles it."
```

---

## Phase 2 — Validators + Tests

Add three Node validator scripts with their own test files. Wire all three into `scripts/release-check.js`. Validators 1 and 2 also wire into command-time soft-warn paths (separately, in Phase 4 for Polymath/explore and per phase 3 for `/legion:plan`).

### Task 3: Add Ajv and gray-matter as devDependencies

**Files:**
- Modify: `package.json`
- Generated: `package-lock.json`

- [ ] **Step 1: Read current devDependencies**

Run:
```bash
node -e "const p = require('./package.json'); console.log(JSON.stringify(p.devDependencies || {}, null, 2))"
```

Expected: empty `{}` or a small object. Note current contents to merge.

- [ ] **Step 2: Add the two devDependencies**

Run:
```bash
npm install --save-dev ajv@^8 gray-matter@^4
```

Expected: both packages added to `package.json` `devDependencies`. `package-lock.json` updated.

- [ ] **Step 3: Verify they install and load**

Run:
```bash
node -e "const Ajv = require('ajv').default; const gm = require('gray-matter'); console.log('OK', typeof Ajv, typeof gm)"
```

Expected output: `OK function function`.

- [ ] **Step 4: Confirm runtime imports unchanged**

Run:
```bash
grep -rn "require('ajv')" scripts/ skills/ commands/ adapters/ bin/ 2>/dev/null || true
grep -rn "require('gray-matter')" scripts/ skills/ commands/ adapters/ bin/ 2>/dev/null || true
```

Expected: zero matches (since validators don't exist yet). Re-run after Phase 2 completes; expect matches only under `scripts/` and `tests/`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add ajv@8 and gray-matter@4 as devDependencies

Used by forthcoming scripts/validate-*.js and tests/validate-*.test.js.
Runtime never imports them; dev tooling only per project constraints."
```

---

### Task 4: Implement `scripts/validate-settings.js` and its tests

**Files:**
- Create: `scripts/validate-settings.js`
- Create: `tests/validate-settings.test.js`
- Create: `tests/fixtures/settings-validation/valid.json`
- Create: `tests/fixtures/settings-validation/invalid-extra-field.json`
- Create: `tests/fixtures/settings-validation/invalid-missing-required.json`
- Create: `tests/fixtures/settings-validation/invalid-wrong-type.json`

- [ ] **Step 1: Write the failing test**

Create `tests/validate-settings.test.js`:

```javascript
'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { validateSettings } = require('../scripts/validate-settings.js');

const FIXTURES = path.join(__dirname, 'fixtures', 'settings-validation');
const ROOT = path.resolve(__dirname, '..');

describe('validate-settings', () => {
  test('actual settings.json is valid against schema', () => {
    const result = validateSettings(path.join(ROOT, 'settings.json'));
    assert.equal(result.valid, true, `settings.json invalid: ${JSON.stringify(result.errors)}`);
  });

  test('valid fixture passes', () => {
    const result = validateSettings(path.join(FIXTURES, 'valid.json'));
    assert.equal(result.valid, true);
  });

  test('invalid-extra-field fails with additionalProperties error', () => {
    const result = validateSettings(path.join(FIXTURES, 'invalid-extra-field.json'));
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => /additional/i.test(e.keyword) || /additional/i.test(e.message || '')));
  });

  test('invalid-missing-required fails with required error', () => {
    const result = validateSettings(path.join(FIXTURES, 'invalid-missing-required.json'));
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.keyword === 'required'));
  });

  test('invalid-wrong-type fails with type error', () => {
    const result = validateSettings(path.join(FIXTURES, 'invalid-wrong-type.json'));
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.keyword === 'type'));
  });
});
```

- [ ] **Step 2: Create fixture files**

`tests/fixtures/settings-validation/valid.json` — copy current `settings.json` content. Run:
```bash
mkdir -p tests/fixtures/settings-validation
cp settings.json tests/fixtures/settings-validation/valid.json
```

`tests/fixtures/settings-validation/invalid-extra-field.json` — same as valid but with an extra top-level field:
```json
{
  "$schema": "../../../docs/settings.schema.json",
  "control_mode": "guarded",
  "models": { "planning": "x", "execution": "y", "check": "z" },
  "planning": { "max_tasks_per_plan": 3, "architecture_proposals_default": "prompt", "spec_pipeline_default": "prompt" },
  "execution": { "auto_commit": true, "commit_prefix": "legion", "agent_personality_verbosity": "full" },
  "review": { "default_mode": "panel", "max_cycles": 3 },
  "dispatch": { "enabled": true, "fallback_to_internal": true, "timeout_ms": 30000, "max_retries": 1 },
  "memory": { "enabled": true, "project_scoped_only": true },
  "integrations": { "github": "prompt" },
  "unknown_field": "should fail"
}
```

`tests/fixtures/settings-validation/invalid-missing-required.json` — drops `models`:
```json
{
  "$schema": "../../../docs/settings.schema.json",
  "control_mode": "guarded",
  "planning": { "max_tasks_per_plan": 3, "architecture_proposals_default": "prompt", "spec_pipeline_default": "prompt" },
  "execution": { "auto_commit": true, "commit_prefix": "legion", "agent_personality_verbosity": "full" },
  "review": { "default_mode": "panel", "max_cycles": 3 },
  "dispatch": { "enabled": true, "fallback_to_internal": true, "timeout_ms": 30000, "max_retries": 1 },
  "memory": { "enabled": true, "project_scoped_only": true },
  "integrations": { "github": "prompt" }
}
```

`tests/fixtures/settings-validation/invalid-wrong-type.json` — `auto_commit: "yes"` instead of boolean:
```json
{
  "$schema": "../../../docs/settings.schema.json",
  "control_mode": "guarded",
  "models": { "planning": "x", "execution": "y", "check": "z" },
  "planning": { "max_tasks_per_plan": 3, "architecture_proposals_default": "prompt", "spec_pipeline_default": "prompt" },
  "execution": { "auto_commit": "yes", "commit_prefix": "legion", "agent_personality_verbosity": "full" },
  "review": { "default_mode": "panel", "max_cycles": 3 },
  "dispatch": { "enabled": true, "fallback_to_internal": true, "timeout_ms": 30000, "max_retries": 1 },
  "memory": { "enabled": true, "project_scoped_only": true },
  "integrations": { "github": "prompt" }
}
```

- [ ] **Step 3: Run test to verify it fails (validator not yet implemented)**

Run:
```bash
node --test tests/validate-settings.test.js
```

Expected: ALL tests fail with "Cannot find module '../scripts/validate-settings.js'".

- [ ] **Step 4: Implement `scripts/validate-settings.js`**

Create `scripts/validate-settings.js`:

```javascript
'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv').default || require('ajv');

const SCHEMA_PATH = path.join(__dirname, '..', 'docs', 'settings.schema.json');

function validateSettings(settingsPath) {
  let schemaText;
  let dataText;
  try {
    schemaText = fs.readFileSync(SCHEMA_PATH, 'utf8');
  } catch (e) {
    return { valid: false, errors: [{ message: `Cannot read schema at ${SCHEMA_PATH}: ${e.message}` }] };
  }
  try {
    dataText = fs.readFileSync(settingsPath, 'utf8');
  } catch (e) {
    return { valid: false, errors: [{ message: `Cannot read settings at ${settingsPath}: ${e.message}` }] };
  }

  let schema, data;
  try { schema = JSON.parse(schemaText); } catch (e) {
    return { valid: false, errors: [{ message: `Schema is not valid JSON: ${e.message}` }] };
  }
  try { data = JSON.parse(dataText); } catch (e) {
    return { valid: false, errors: [{ message: `Settings is not valid JSON: ${e.message}` }] };
  }

  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const valid = validate(data);
  return { valid, errors: validate.errors || [] };
}

function main() {
  const target = process.argv[2] || path.join(__dirname, '..', 'settings.json');
  const result = validateSettings(target);
  if (result.valid) {
    console.log(`OK: ${target} validates against schema`);
    process.exit(0);
  }
  console.error(`FAIL: ${target} does not validate against schema`);
  for (const err of result.errors) {
    const loc = err.instancePath || err.dataPath || '(root)';
    console.error(`  ${loc} ${err.keyword || ''} - ${err.message || JSON.stringify(err)}`);
  }
  process.exit(1);
}

if (require.main === module) main();

module.exports = { validateSettings };
```

- [ ] **Step 5: Run tests to verify they pass**

Run:
```bash
node --test tests/validate-settings.test.js
```

Expected: 5 tests pass.

- [ ] **Step 6: Run validator on real settings.json from CLI**

Run:
```bash
node scripts/validate-settings.js
```

Expected: `OK: .../settings.json validates against schema`. Exit code 0.

- [ ] **Step 7: Commit**

```bash
git add scripts/validate-settings.js tests/validate-settings.test.js tests/fixtures/settings-validation/
git commit -m "feat(validators): add validate-settings.js with Ajv-based schema validation

Validates settings.json against docs/settings.schema.json. Five test cases:
real settings.json, valid fixture, invalid-extra-field, invalid-missing-required,
invalid-wrong-type. Exits 0 on valid, 1 on invalid."
```

---

### Task 5: Implement `scripts/validate-plan-frontmatter.js` and its tests

**Files:**
- Create: `scripts/validate-plan-frontmatter.js`
- Create: `tests/validate-plan-frontmatter.test.js`
- Create: `tests/fixtures/plan-validation/valid-current.md`
- Create: `tests/fixtures/plan-validation/valid-multi-agent.md`
- Create: `tests/fixtures/plan-validation/invalid-singular-agent.md`
- Create: `tests/fixtures/plan-validation/invalid-flat-artifacts.md`
- Create: `tests/fixtures/plan-validation/invalid-extra-field.md`

- [ ] **Step 1: Write the failing test**

Create `tests/validate-plan-frontmatter.test.js`:

```javascript
'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { validatePlanFile, validatePlanDir } = require('../scripts/validate-plan-frontmatter.js');

const FIXTURES = path.join(__dirname, 'fixtures', 'plan-validation');
const ROOT = path.resolve(__dirname, '..');

describe('validate-plan-frontmatter', () => {
  test('valid-current passes', () => {
    const r = validatePlanFile(path.join(FIXTURES, 'valid-current.md'));
    assert.equal(r.valid, true, JSON.stringify(r.errors));
  });

  test('valid-multi-agent passes', () => {
    const r = validatePlanFile(path.join(FIXTURES, 'valid-multi-agent.md'));
    assert.equal(r.valid, true, JSON.stringify(r.errors));
  });

  test('invalid-singular-agent fails (uses agent: not agents:)', () => {
    const r = validatePlanFile(path.join(FIXTURES, 'invalid-singular-agent.md'));
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => /agents/i.test(JSON.stringify(e))));
  });

  test('invalid-flat-artifacts fails (expected_artifacts as strings)', () => {
    const r = validatePlanFile(path.join(FIXTURES, 'invalid-flat-artifacts.md'));
    assert.equal(r.valid, false);
  });

  test('invalid-extra-field fails (additionalProperties)', () => {
    const r = validatePlanFile(path.join(FIXTURES, 'invalid-extra-field.md'));
    assert.equal(r.valid, false);
  });

  test('validatePlanDir aggregates results', () => {
    const r = validatePlanDir(FIXTURES);
    // 5 fixtures: 2 valid, 3 invalid
    assert.equal(r.totalFiles, 5);
    assert.equal(r.invalidFiles.length, 3);
  });

  // Note: live-state check (validating real .planning/phases/**/PLAN.md) is
  // gated on the migration in Task 9. Until then, real plans are non-conforming
  // by design. After migration, this test will be enabled.
  test.skip('all real .planning/phases/**/PLAN.md validate (enabled post-migration)', () => {
    const phasesDir = path.join(ROOT, '.planning', 'phases');
    if (!fs.existsSync(phasesDir)) return;
    const r = validatePlanDir(phasesDir);
    assert.equal(r.invalidFiles.length, 0, `Invalid plans: ${JSON.stringify(r.invalidFiles)}`);
  });
});
```

- [ ] **Step 2: Create fixture files**

`tests/fixtures/plan-validation/valid-current.md`:

```markdown
---
phase: 12
plan: "12-01"
wave: 1
agents:
  - testing-qa-verification-specialist
  - engineering-senior-developer
files_modified:
  - CLAUDE.md
files_forbidden:
  - agents/
expected_artifacts:
  - path: CLAUDE.md
    provides: Updated v6.0 feature documentation
    required: true
verification_commands:
  - "node --test"
must_haves:
  truths:
    - "All existing tests pass"
---

Plan body here.
```

`tests/fixtures/plan-validation/valid-multi-agent.md`:

```markdown
---
phase: "01-plan-schema-hardening"
plan: "01-01"
wave: 1
agents:
  - engineering-senior-developer
  - testing-qa-verification-specialist
  - project-management-project-shepherd
files_modified:
  - docs/schemas/plan-frontmatter.schema.json
expected_artifacts:
  - path: docs/schemas/plan-frontmatter.schema.json
    provides: Updated schema
verification_commands:
  - "node --test tests/plan-schema-conformance.test.js"
---

Body.
```

`tests/fixtures/plan-validation/invalid-singular-agent.md` — uses `agent:` not `agents:`:

```markdown
---
phase: 1
plan: "01-01"
wave: 1
agent: "engineering-senior-developer"
files_modified: []
verification_commands: []
---

Body.
```

`tests/fixtures/plan-validation/invalid-flat-artifacts.md` — `expected_artifacts` as strings:

```markdown
---
phase: 1
plan: "01-01"
wave: 1
agents:
  - engineering-senior-developer
expected_artifacts:
  - "some/file.md"
  - "another/file.md"
verification_commands: []
---

Body.
```

`tests/fixtures/plan-validation/invalid-extra-field.md` — extra top-level field:

```markdown
---
phase: 1
plan: "01-01"
wave: 1
agents:
  - engineering-senior-developer
unknown_block:
  some: thing
verification_commands: []
---

Body.
```

- [ ] **Step 3: Run test to verify it fails (validator not yet implemented)**

Run:
```bash
node --test tests/validate-plan-frontmatter.test.js
```

Expected: tests fail with module-not-found.

- [ ] **Step 4: Implement `scripts/validate-plan-frontmatter.js`**

Create `scripts/validate-plan-frontmatter.js`:

```javascript
'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const Ajv = require('ajv').default || require('ajv');

const SCHEMA_PATH = path.join(__dirname, '..', 'docs', 'schemas', 'plan-frontmatter.schema.json');

let _validator = null;
function getValidator() {
  if (_validator) return _validator;
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  _validator = ajv.compile(schema);
  return _validator;
}

function validatePlanFile(filePath) {
  let text;
  try { text = fs.readFileSync(filePath, 'utf8'); } catch (e) {
    return { valid: false, errors: [{ message: `Cannot read ${filePath}: ${e.message}` }] };
  }
  let parsed;
  try { parsed = matter(text); } catch (e) {
    return { valid: false, errors: [{ message: `gray-matter parse failed for ${filePath}: ${e.message}` }] };
  }
  const fm = parsed.data || {};
  const validate = getValidator();
  const valid = validate(fm);
  return { valid, errors: validate.errors || [], file: filePath };
}

function findPlanFiles(dir) {
  const out = [];
  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && /-PLAN\.md$|valid-.*\.md$|invalid-.*\.md$/.test(e.name)) out.push(full);
    }
  }
  walk(dir);
  return out;
}

function validatePlanDir(dir) {
  const files = findPlanFiles(dir);
  const invalid = [];
  for (const f of files) {
    const r = validatePlanFile(f);
    if (!r.valid) invalid.push({ file: f, errors: r.errors });
  }
  return { totalFiles: files.length, invalidFiles: invalid };
}

function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node validate-plan-frontmatter.js <file-or-dir>');
    process.exit(2);
  }
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    const r = validatePlanDir(target);
    if (r.invalidFiles.length === 0) {
      console.log(`OK: ${r.totalFiles} plan files validate`);
      process.exit(0);
    }
    console.error(`FAIL: ${r.invalidFiles.length} of ${r.totalFiles} plan files invalid`);
    for (const f of r.invalidFiles) {
      console.error(`  ${f.file}`);
      for (const err of f.errors) {
        console.error(`    ${err.instancePath || '(root)'} ${err.keyword || ''} - ${err.message || ''}`);
      }
    }
    process.exit(1);
  } else {
    const r = validatePlanFile(target);
    if (r.valid) { console.log(`OK: ${target}`); process.exit(0); }
    console.error(`FAIL: ${target}`);
    for (const err of r.errors) {
      console.error(`  ${err.instancePath || '(root)'} ${err.keyword || ''} - ${err.message || ''}`);
    }
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { validatePlanFile, validatePlanDir, findPlanFiles };
```

- [ ] **Step 5: Run tests to verify they pass**

Run:
```bash
node --test tests/validate-plan-frontmatter.test.js
```

Expected: 6 tests pass; 1 skipped (the live-state test, gated until Task 9).

- [ ] **Step 6: Run validator against fixtures from CLI**

Run:
```bash
node scripts/validate-plan-frontmatter.js tests/fixtures/plan-validation
```

Expected: `FAIL: 3 of 5 plan files invalid` listing the three invalid fixtures.

- [ ] **Step 7: Commit**

```bash
git add scripts/validate-plan-frontmatter.js tests/validate-plan-frontmatter.test.js tests/fixtures/plan-validation/
git commit -m "feat(validators): add validate-plan-frontmatter.js with gray-matter + Ajv

Validates a single PLAN.md or recurses through a directory. Five fixture
cases plus a real-state check (skipped until migration in Task 9 lands).
Exits 0/1; reports per-error instancePath + keyword + message."
```

---

### Task 6: Implement `scripts/validate-command-spawn-truthfulness.js` and its tests

**Files:**
- Create: `scripts/validate-command-spawn-truthfulness.js`
- Create: `tests/validate-command-spawn-truthfulness.test.js`
- Create: `tests/fixtures/command-spawn/spawn-with-agent-call.md`
- Create: `tests/fixtures/command-spawn/spawn-without-agent-call.md`
- Create: `tests/fixtures/command-spawn/inline-persona-mode.md`
- Create: `tests/fixtures/command-spawn/no-spawn-no-inline.md`

- [ ] **Step 1: Write the failing test**

Create `tests/validate-command-spawn-truthfulness.test.js`:

```javascript
'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { validateCommandFile, validateCommandsDir } = require('../scripts/validate-command-spawn-truthfulness.js');

const FIXTURES = path.join(__dirname, 'fixtures', 'command-spawn');

describe('validate-command-spawn-truthfulness', () => {
  test('spawn-with-agent-call passes', () => {
    const r = validateCommandFile(path.join(FIXTURES, 'spawn-with-agent-call.md'));
    assert.equal(r.valid, true, JSON.stringify(r));
  });

  test('spawn-without-agent-call fails', () => {
    const r = validateCommandFile(path.join(FIXTURES, 'spawn-without-agent-call.md'));
    assert.equal(r.valid, false);
    assert.match(r.reason, /Agent\(|inline-persona/);
  });

  test('inline-persona-mode passes', () => {
    const r = validateCommandFile(path.join(FIXTURES, 'inline-persona-mode.md'));
    assert.equal(r.valid, true, JSON.stringify(r));
  });

  test('no-spawn-no-inline passes (exempt)', () => {
    const r = validateCommandFile(path.join(FIXTURES, 'no-spawn-no-inline.md'));
    assert.equal(r.valid, true);
    assert.equal(r.exempt, true);
  });

  test('validateCommandsDir aggregates', () => {
    const r = validateCommandsDir(FIXTURES);
    assert.equal(r.totalFiles, 4);
    assert.equal(r.invalidFiles.length, 1);
  });
});
```

- [ ] **Step 2: Create fixture files**

`tests/fixtures/command-spawn/spawn-with-agent-call.md`:

````markdown
---
name: legion:fixture-spawn-correct
description: fixture for spawn-truthfulness validator
---

<process>
Spawn the testing-qa agent to verify results.

```
Agent({
  description: "QA verification",
  prompt: "..."
})
```
</process>
````

`tests/fixtures/command-spawn/spawn-without-agent-call.md`:

```markdown
---
name: legion:fixture-spawn-defective
description: fixture for spawn-truthfulness validator
---

<process>
Spawn the polymath agent. Polymath takes over the conversation.

[no actual Agent() invocation anywhere]
</process>
```

`tests/fixtures/command-spawn/inline-persona-mode.md`:

```markdown
---
name: legion:fixture-inline
description: fixture for spawn-truthfulness validator
mode: inline-persona
inline_persona: polymath
---

<process>
Enter Polymath inline mode. The current command operates the conversation
under the Polymath personality. Do not claim Polymath has been spawned.
</process>
```

`tests/fixtures/command-spawn/no-spawn-no-inline.md`:

```markdown
---
name: legion:fixture-status
description: fixture for spawn-truthfulness validator
---

<process>
Read state files. Display dashboard. No agent spawning needed.
</process>
```

- [ ] **Step 3: Run test to verify it fails**

Run:
```bash
node --test tests/validate-command-spawn-truthfulness.test.js
```

Expected: module-not-found failure.

- [ ] **Step 4: Implement `scripts/validate-command-spawn-truthfulness.js`**

Create `scripts/validate-command-spawn-truthfulness.js`:

```javascript
'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Spawn-flavored language patterns.
const SPAWN_PATTERN = /\b(spawn|dispatch)\s+(the\s+)?(\w[\w-]*\s+)?(agent|polymath|specialist)\b|spawn agent:|Polymath takes over|takes over the conversation/i;

// Literal Agent invocation patterns. Matches Agent({...}), Agent(...) with prompt,
// or fenced code blocks containing Agent(.
const AGENT_INVOCATION_PATTERN = /\bAgent\s*\(\s*[\{"']/;

function validateCommandFile(filePath) {
  let text;
  try { text = fs.readFileSync(filePath, 'utf8'); } catch (e) {
    return { valid: false, reason: `Cannot read: ${e.message}`, file: filePath };
  }
  let parsed;
  try { parsed = matter(text); } catch (e) {
    return { valid: false, reason: `gray-matter parse failed: ${e.message}`, file: filePath };
  }
  const fm = parsed.data || {};
  const body = parsed.content || '';

  const declaredInline = fm.mode === 'inline-persona';
  const hasSpawnLang = SPAWN_PATTERN.test(body);
  const hasAgentInvoke = AGENT_INVOCATION_PATTERN.test(body);

  if (!hasSpawnLang) {
    return { valid: true, exempt: true, reason: 'no spawn-flavored language', file: filePath };
  }

  if (declaredInline) {
    // If inline-persona is declared AND body still uses spawn language, that's a contradiction.
    return {
      valid: false,
      reason: `Frontmatter declares mode: inline-persona but body contains spawn-flavored language. Rewrite body to inline-flavored prose.`,
      file: filePath
    };
  }

  if (hasAgentInvoke) {
    return { valid: true, reason: 'spawn language present and Agent() invocation present', file: filePath };
  }

  return {
    valid: false,
    reason: `Body contains spawn-flavored language but neither Agent() invocation nor mode: inline-persona declaration. Add Agent(...) call OR set mode: inline-persona.`,
    file: filePath
  };
}

function findCommandFiles(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith('.md')) out.push(path.join(dir, name));
  }
  return out;
}

function validateCommandsDir(dir) {
  const files = findCommandFiles(dir);
  const invalid = [];
  for (const f of files) {
    const r = validateCommandFile(f);
    if (!r.valid) invalid.push(r);
  }
  return { totalFiles: files.length, invalidFiles: invalid };
}

function main() {
  const target = process.argv[2] || path.join(__dirname, '..', 'commands');
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    const r = validateCommandsDir(target);
    if (r.invalidFiles.length === 0) {
      console.log(`OK: ${r.totalFiles} command files pass spawn-truthfulness check`);
      process.exit(0);
    }
    console.error(`FAIL: ${r.invalidFiles.length} of ${r.totalFiles} command files invalid`);
    for (const f of r.invalidFiles) {
      console.error(`  ${f.file}`);
      console.error(`    ${f.reason}`);
    }
    process.exit(1);
  } else {
    const r = validateCommandFile(target);
    if (r.valid) { console.log(`OK: ${target}`); process.exit(0); }
    console.error(`FAIL: ${target} - ${r.reason}`);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { validateCommandFile, validateCommandsDir, findCommandFiles, SPAWN_PATTERN, AGENT_INVOCATION_PATTERN };
```

- [ ] **Step 5: Run tests to verify they pass**

Run:
```bash
node --test tests/validate-command-spawn-truthfulness.test.js
```

Expected: 5 tests pass.

- [ ] **Step 6: Run validator against real `commands/` to characterize current state**

Run:
```bash
node scripts/validate-command-spawn-truthfulness.js commands
```

Expected: FAIL with at least `commands/explore.md` flagged. Likely 2-5 commands flagged total. Record output to a temp file for use in Task 16:
```bash
node scripts/validate-command-spawn-truthfulness.js commands > /tmp/spawn-truthfulness-baseline.txt 2>&1 || true
cat /tmp/spawn-truthfulness-baseline.txt
```

- [ ] **Step 7: Commit**

```bash
git add scripts/validate-command-spawn-truthfulness.js tests/validate-command-spawn-truthfulness.test.js tests/fixtures/command-spawn/
git commit -m "feat(validators): add validate-command-spawn-truthfulness.js

CI-only validator. For each commands/*.md, if body contains spawn/dispatch
language, asserts either an Agent() invocation OR mode: inline-persona
frontmatter. Commands without spawn language are exempt. Five test cases."
```

---

### Task 7: Wire all three validators into `scripts/release-check.js`

**Files:**
- Modify: `scripts/release-check.js`

- [ ] **Step 1: Read current release-check.js to find the right insertion point**

Run:
```bash
wc -l scripts/release-check.js
sed -n '1,30p' scripts/release-check.js
grep -n "function\|module.exports\|main\|process.exit" scripts/release-check.js | head -20
```

Note the file structure — find where check functions are defined and where the main runner orchestrates them.

- [ ] **Step 2: Add the three validator integrations**

At the top of `scripts/release-check.js`, add the imports near the existing requires:

```javascript
const { validateSettings } = require('./validate-settings.js');
const { validatePlanDir } = require('./validate-plan-frontmatter.js');
const { validateCommandsDir } = require('./validate-command-spawn-truthfulness.js');
```

In the section where checks are run (use the existing pattern in release-check.js — likely a function-call list or an array of check functions), add three calls:

```javascript
function checkSettingsSchema() {
  const r = validateSettings(path.join(ROOT, 'settings.json'));
  if (r.valid) return { name: 'settings schema', ok: true };
  return { name: 'settings schema', ok: false, errors: r.errors };
}

function checkPlanFrontmatter() {
  const dir = path.join(ROOT, '.planning', 'phases');
  if (!fs.existsSync(dir)) return { name: 'plan frontmatter', ok: true, skipped: 'no .planning/phases' };
  const r = validatePlanDir(dir);
  if (r.invalidFiles.length === 0) return { name: 'plan frontmatter', ok: true };
  return { name: 'plan frontmatter', ok: false, errors: r.invalidFiles };
}

function checkCommandSpawnTruthfulness() {
  const r = validateCommandsDir(path.join(ROOT, 'commands'));
  if (r.invalidFiles.length === 0) return { name: 'command spawn-truthfulness', ok: true };
  return { name: 'command spawn-truthfulness', ok: false, errors: r.invalidFiles };
}
```

Wire each check into the main runner flow alongside existing checks. Failures should set the same exit-code path the existing release-check uses on failure.

- [ ] **Step 3: Run release-check to characterize current state**

Run:
```bash
node scripts/release-check.js
```

Expected current behavior (before migration in Task 9, before explore refactor in Task 13):
- `settings schema`: PASS
- `plan frontmatter`: FAIL (real plans don't yet conform)
- `command spawn-truthfulness`: FAIL (explore.md and possibly others)

This is the EXPECTED transient state. The plan ships these failures intentionally because the migration and refactor land in Phase 3 and Phase 4 respectively.

Document this expectation in the commit message.

- [ ] **Step 4: Commit**

```bash
git add scripts/release-check.js
git commit -m "feat(release-check): wire three new contract validators

Adds settings schema, plan-frontmatter, and command spawn-truthfulness
checks to release-check. Two will currently FAIL until migrations land:
- plan frontmatter (real plans use legacy schema; fixed by Task 9 migration)
- command spawn-truthfulness (commands/explore.md uses narrative spawn;
  fixed by Task 13 refactor + Task 16 sweep)

The settings-schema check passes immediately because settings.json was
already valid against the expanded schema (Task 1)."
```

---

## Phase 3 — Migration & Consumer Updates

Bring real PLAN.md state into compliance with the new schema. Update the one inconsistent consumer (`commands/validate.md` — wave-executor was already plural per pre-flight grep). Replace the regex YAML parser in the existing schema-conformance test with `gray-matter`.

### Task 8: Implement plan-frontmatter migration script

**Files:**
- Create: `scripts/migrate-plans-to-v2.js`
- Create: `tests/migrate-plans.test.js`
- Create: `tests/fixtures/migration/before/sample-plan.md`
- Create: `tests/fixtures/migration/after/sample-plan.md`

- [ ] **Step 1: Write the failing test**

Create `tests/migrate-plans.test.js`:

```javascript
'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { migratePlanText } = require('../scripts/migrate-plans-to-v2.js');

const FIXTURES = path.join(__dirname, 'fixtures', 'migration');

describe('migrate-plans-to-v2', () => {
  test('singular agent becomes agents array', () => {
    const before = fs.readFileSync(path.join(FIXTURES, 'before', 'sample-plan.md'), 'utf8');
    const expected = fs.readFileSync(path.join(FIXTURES, 'after', 'sample-plan.md'), 'utf8');
    const actual = migratePlanText(before);
    assert.equal(actual.trim(), expected.trim());
  });

  test('plain integer plan field becomes NN-PP string', () => {
    const before = `---\nphase: 12\nplan: 1\nwave: 1\nagent: x\n---\nbody`;
    const out = migratePlanText(before);
    assert.match(out, /plan:\s*"12-01"/);
  });

  test('flat string expected_artifacts becomes structured', () => {
    const before = `---\nphase: 1\nplan: "01-01"\nwave: 1\nagent: x\nexpected_artifacts:\n  - path/to/file.md\n  - another.md\n---\nbody`;
    const out = migratePlanText(before);
    assert.match(out, /- path: path\/to\/file\.md/);
    assert.match(out, /- path: another\.md/);
  });

  test('idempotent: running on already-migrated text yields same text', () => {
    const after = fs.readFileSync(path.join(FIXTURES, 'after', 'sample-plan.md'), 'utf8');
    const actual = migratePlanText(after);
    assert.equal(actual.trim(), after.trim());
  });
});
```

- [ ] **Step 2: Create fixture files**

`tests/fixtures/migration/before/sample-plan.md`:

```markdown
---
phase: 7
plan: 2
wave: 1
agent: testing-qa-verification-specialist
files_modified:
  - tests/foo.js
expected_artifacts:
  - tests/foo.js
verification_commands:
  - "node --test"
---

Pre-migration body.
```

`tests/fixtures/migration/after/sample-plan.md`:

```markdown
---
phase: 7
plan: "07-02"
wave: 1
agents:
  - testing-qa-verification-specialist
files_modified:
  - tests/foo.js
expected_artifacts:
  - path: tests/foo.js
    provides: migrated artifact
    required: true
verification_commands:
  - "node --test"
---

Pre-migration body.
```

- [ ] **Step 3: Run test (it will fail)**

Run:
```bash
node --test tests/migrate-plans.test.js
```

Expected: module-not-found.

- [ ] **Step 4: Implement `scripts/migrate-plans-to-v2.js`**

Create `scripts/migrate-plans-to-v2.js`:

```javascript
'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function migrateFm(fm, fileHint = '') {
  const out = { ...fm };

  // 1. agent (singular string) -> agents (array)
  if (out.agent && !out.agents) {
    out.agents = Array.isArray(out.agent) ? out.agent : [out.agent];
    delete out.agent;
  }

  // 2. plan: <integer> -> "NN-PP" string. Need phase number to derive NN.
  if (typeof out.plan === 'number') {
    let phaseNum;
    if (typeof out.phase === 'number') phaseNum = out.phase;
    else if (typeof out.phase === 'string') {
      const m = out.phase.match(/^(\d{2})-/);
      if (m) phaseNum = parseInt(m[1], 10);
    }
    if (typeof phaseNum === 'number') {
      out.plan = `${String(phaseNum).padStart(2, '0')}-${String(out.plan).padStart(2, '0')}`;
    }
  } else if (typeof out.plan === 'string' && /^\d+$/.test(out.plan)) {
    // Numeric string like "01" without phase prefix
    let phaseNum;
    if (typeof out.phase === 'number') phaseNum = out.phase;
    else if (typeof out.phase === 'string') {
      const m = out.phase.match(/^(\d{2})-/);
      if (m) phaseNum = parseInt(m[1], 10);
    }
    if (typeof phaseNum === 'number') {
      out.plan = `${String(phaseNum).padStart(2, '0')}-${String(parseInt(out.plan, 10)).padStart(2, '0')}`;
    }
  }

  // 3. expected_artifacts: ["str", ...] -> [{path, provides, required}, ...]
  if (Array.isArray(out.expected_artifacts)) {
    const allStrings = out.expected_artifacts.every(a => typeof a === 'string');
    if (allStrings && out.expected_artifacts.length > 0) {
      out.expected_artifacts = out.expected_artifacts.map(s => ({
        path: s,
        provides: 'migrated artifact',
        required: true
      }));
    }
  }

  // 4. must_haves: leave structured form alone. If it's a flat array of strings,
  //    wrap into truths.
  if (Array.isArray(out.must_haves)) {
    out.must_haves = { truths: out.must_haves };
  }

  return out;
}

function migratePlanText(text) {
  const parsed = matter(text);
  const newFm = migrateFm(parsed.data || {}, '<text>');
  return matter.stringify(parsed.content || '', newFm);
}

function migratePlanFile(filePath, { dryRun } = {}) {
  const text = fs.readFileSync(filePath, 'utf8');
  const out = migratePlanText(text);
  if (text === out) return { changed: false, file: filePath };
  if (!dryRun) fs.writeFileSync(filePath, out, 'utf8');
  return { changed: true, file: filePath };
}

function migrateDir(dir, { dryRun } = {}) {
  const out = { changed: [], unchanged: [], errors: [] };
  function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (/-PLAN\.md$/.test(e.name)) {
        try {
          const r = migratePlanFile(full, { dryRun });
          (r.changed ? out.changed : out.unchanged).push(full);
        } catch (err) {
          out.errors.push({ file: full, error: err.message });
        }
      }
    }
  }
  walk(dir);
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const target = args.find(a => !a.startsWith('--'));
  if (!target) {
    console.error('Usage: node migrate-plans-to-v2.js <dir> [--dry-run]');
    process.exit(2);
  }
  const r = migrateDir(target, { dryRun });
  console.log(`Changed: ${r.changed.length}`);
  console.log(`Unchanged: ${r.unchanged.length}`);
  console.log(`Errors: ${r.errors.length}`);
  for (const f of r.changed) console.log(`  + ${f}`);
  for (const e of r.errors) console.log(`  ! ${e.file}: ${e.error}`);
  process.exit(r.errors.length > 0 ? 1 : 0);
}

if (require.main === module) main();

module.exports = { migrateFm, migratePlanText, migratePlanFile, migrateDir };
```

- [ ] **Step 5: Run tests to verify they pass**

Run:
```bash
node --test tests/migrate-plans.test.js
```

Expected: 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/migrate-plans-to-v2.js tests/migrate-plans.test.js tests/fixtures/migration/
git commit -m "feat(migration): add scripts/migrate-plans-to-v2.js

Converts legacy plan frontmatter to v2 shape:
- agent (string) -> agents (array)
- plan (integer or 'NN' string) -> 'NN-PP' (using phase number)
- flat string expected_artifacts -> structured {path, provides, required}
- list-form must_haves -> {truths: [...]} object

Idempotent. Includes --dry-run for preview. Tested with before/after fixtures."
```

---

### Task 9: Run the migration against real plans

**Files:**
- Modify: All `.planning/phases/**/PLAN.md` files (≈30 files)
- Create: `docs/audits/2026-04-16-legion-4-7/findings/cat-11-pre-migration-snapshot/` (snapshots for traceability)

- [ ] **Step 1: Snapshot pre-migration state**

```bash
mkdir -p docs/audits/2026-04-16-legion-4-7/findings/cat-11-pre-migration-snapshot
cp -r .planning/phases docs/audits/2026-04-16-legion-4-7/findings/cat-11-pre-migration-snapshot/phases-snapshot
```

- [ ] **Step 2: Dry-run the migration**

```bash
node scripts/migrate-plans-to-v2.js .planning/phases --dry-run
```

Expected: prints a list of files that WOULD change. Approximately 30 entries.

- [ ] **Step 3: Run the migration**

```bash
node scripts/migrate-plans-to-v2.js .planning/phases
```

Expected: prints the actual changes. Errors must be 0.

- [ ] **Step 4: Verify with the validator**

```bash
node scripts/validate-plan-frontmatter.js .planning/phases
```

Expected: `OK: <N> plan files validate`. If FAIL, inspect the errors — there may be edge cases the migration missed (e.g., must_haves nested differently, type/title fields). Fix the migration script and re-run.

- [ ] **Step 5: Enable the live-state test**

Edit `tests/validate-plan-frontmatter.test.js` and remove the `.skip` from the `'all real .planning/phases/**/PLAN.md validate'` test.

- [ ] **Step 6: Run the test to confirm**

```bash
node --test tests/validate-plan-frontmatter.test.js
```

Expected: 7 tests pass (no skips).

- [ ] **Step 7: Spot-check one migrated file**

```bash
head -25 .planning/phases/01-plan-schema-hardening/01-01-PLAN.md
head -25 .planning/phases/12-integration-release/12-01-PLAN.md
```

Expected: both show `agents:` (plural array), `plan: "NN-PP"` (string), `expected_artifacts:` as structured objects.

- [ ] **Step 8: Commit migration + snapshot in two separate commits**

```bash
git add docs/audits/2026-04-16-legion-4-7/findings/cat-11-pre-migration-snapshot/
git commit -m "audit: snapshot .planning/phases before plan-frontmatter migration

Pre-migration snapshot for CAT-11 audit traceability. Used to compare
post-migration state and verify no semantic content was lost."

git add .planning/phases/
git add tests/validate-plan-frontmatter.test.js
git commit -m "fix(plans): migrate plan frontmatter to v2 shape

Apply scripts/migrate-plans-to-v2.js across all .planning/phases. Plural
agents, structured expected_artifacts, NN-PP plan IDs, must_haves wrapping.
Validator now passes against live state. Pre-migration snapshot retained
under docs/audits/.../cat-11-pre-migration-snapshot/."
```

- [ ] **Step 9: Schedule migration script removal as a follow-up commit**

The migration script is one-shot. After the migration commit lands and is verified, schedule a follow-up commit to remove `scripts/migrate-plans-to-v2.js` and its tests:

```bash
# Run AFTER the migration is verified and reviewed:
git rm scripts/migrate-plans-to-v2.js tests/migrate-plans.test.js
git rm -r tests/fixtures/migration/
git commit -m "chore: remove one-shot plan migration script

Migration applied in <COMMIT_HASH_FROM_STEP_8>. Snapshot retained under
docs/audits/.../cat-11-pre-migration-snapshot/ for traceability."
```

(Do not run this step until after Task 9 is verified end-to-end.)

---

### Task 10: Update `commands/validate.md` to read plural `agents`

**Files:**
- Modify: `commands/validate.md`

- [ ] **Step 1: Locate the singular-agent reference**

Run:
```bash
grep -n "'agent'\|\bagent\b" commands/validate.md | head -20
```

Find the step that says: "Frontmatter contains `phase`, `plan`, `wave`, and `agent` fields."

- [ ] **Step 2: Update the validation rule**

Edit `commands/validate.md`. Replace:

> "Frontmatter contains `phase`, `plan`, `wave`, and `agent` fields."

With:

> "Frontmatter contains `phase`, `plan`, `wave`, and `agents` fields. The `agents` field is an array; the first element is the primary executor and any subsequent elements are co-executors."

Replace any subsequent reference like:

> "Check: `agent` field value is a valid agent ID..."

With:

> "Check: every entry in the `agents` array is a valid agent ID (exists in the agent catalog via agent-registry)."

- [ ] **Step 3: Run a smoke test by re-running /legion:validate mentally**

There is no automated test for `commands/validate.md` (it's a prompt). Verify by reading the relevant section end-to-end and confirming the `agent` → `agents` substitution preserves all surrounding logic.

- [ ] **Step 4: Commit**

```bash
git add commands/validate.md
git commit -m "fix(commands): update /legion:validate to read plural agents array

Aligns the command's frontmatter validation rules with the v2 plan-frontmatter
schema (Task 2) and the migrated plan files (Task 9). Reads agents[0] as
primary executor; validates each entry as a known agent ID."
```

---

### Task 11: Replace the regex YAML parser in `tests/plan-schema-conformance.test.js`

**Files:**
- Modify: `tests/plan-schema-conformance.test.js`

- [ ] **Step 1: Identify the parser function and its line range**

Run:
```bash
grep -n "function parsePlanFrontmatter\|^}" tests/plan-schema-conformance.test.js | head -10
```

The custom parser spans roughly lines 18–137 per pre-flight inspection. Identify the exact opening and closing line numbers in the current file.

- [ ] **Step 2: Replace the parser with gray-matter**

Edit `tests/plan-schema-conformance.test.js`:

Remove the entire `parsePlanFrontmatter` function (lines ≈18–137). Replace with:

```javascript
const matter = require('gray-matter');

function parsePlanFrontmatter(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(text);
  if (!parsed.matter || parsed.matter.length === 0) {
    throw new Error(`No YAML frontmatter found in ${filePath}`);
  }
  return parsed.data;
}
```

The validation functions (`validateVerificationCommands`, `validateFilesForbidden`, `validateExpectedArtifacts`, etc.) below this point already work with parsed frontmatter objects and need no changes.

- [ ] **Step 3: Add coverage for plural `agents` array**

In the same file, find or create a test that asserts the schema requires plural `agents`. Add (in the appropriate `describe` block):

```javascript
test('plan frontmatter has plural agents array (not singular agent)', () => {
  const planFiles = listPlanFiles(PHASE1_DIR);
  for (const f of planFiles) {
    const fm = parsePlanFrontmatter(f);
    assert.equal('agent' in fm, false, `${f} uses legacy singular 'agent' field`);
    assert.ok(Array.isArray(fm.agents), `${f} missing 'agents' array`);
    assert.ok(fm.agents.length >= 1, `${f} has empty agents array`);
  }
});
```

(`listPlanFiles` may need to be added if it doesn't already exist — pattern `fs.readdirSync(dir).filter(f => /-PLAN\.md$/.test(f))`.)

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test tests/plan-schema-conformance.test.js
```

Expected: all tests pass against the migrated plans (Task 9).

- [ ] **Step 5: Commit**

```bash
git add tests/plan-schema-conformance.test.js
git commit -m "test: replace custom regex YAML parser with gray-matter

Eliminates the ~120-line regex parser in plan-schema-conformance.test.js.
Adds explicit assertion that plans use plural agents array, not singular
agent. All existing DSC-01/02/03 coverage retained."
```

---

## Phase 4 — Polymath/Explore Refactor + CAT-11

Snapshot the current `commands/explore.md` for audit traceability, refactor to inline-persona, fix the canonical-map omission, run the spawn-truthfulness validator on real commands, fix every finding, then add CAT-11 to RUBRIC.md and run a mechanical re-score pass.

### Task 12: Snapshot current `commands/explore.md` for audit traceability

**Files:**
- Create: `docs/audits/2026-04-16-legion-4-7/findings/commands/explore-pre-refactor.snapshot.md`

- [ ] **Step 1: Snapshot the current file**

```bash
mkdir -p docs/audits/2026-04-16-legion-4-7/findings/commands
cp commands/explore.md docs/audits/2026-04-16-legion-4-7/findings/commands/explore-pre-refactor.snapshot.md
```

- [ ] **Step 2: Add a header note at the top of the snapshot**

Edit `docs/audits/2026-04-16-legion-4-7/findings/commands/explore-pre-refactor.snapshot.md` and prepend:

```markdown
<!--
SNAPSHOT — pre-refactor of commands/explore.md
Date: 2026-05-04
Reason: spawn-truthfulness defect (CAT-3 + CAT-6 + CAT-11)
Refactor commit: <to be filled in by Task 13>
Original file lives at: commands/explore.md
-->

```

- [ ] **Step 3: Commit**

```bash
git add docs/audits/2026-04-16-legion-4-7/findings/commands/explore-pre-refactor.snapshot.md
git commit -m "audit: snapshot commands/explore.md before inline-persona refactor

Preservation copy for CAT-11 audit traceability. The forthcoming refactor
in Task 13 will rewrite the command to inline-persona pattern; this
snapshot captures the pre-refactor 'spawn agent: polymath' anti-pattern
exactly as shipped."
```

---

### Task 13: Rewrite `commands/explore.md` as inline-persona

**Files:**
- Modify: `commands/explore.md` (full rewrite)

- [ ] **Step 1: Read current file once more for any details not in the spec**

```bash
sed -n '1,40p' commands/explore.md
```

Note frontmatter fields (`name`, `description`, `allowed-tools`) and confirm the body sections (PRE-FLIGHT CHECK, MODE SELECTION, OPENING PROMPT, etc.) — these stay; only the SPAWN POLYMATH AGENT section and downstream "Polymath takes over" language change.

- [ ] **Step 2: Update the frontmatter**

Replace the existing frontmatter at the top of `commands/explore.md`:

```markdown
---
name: legion:explore
description: Enter pre-flight alignment mode with Polymath — crystallize ideas, onboard to codebases, compare approaches, or debate decisions
mode: inline-persona
inline_persona: polymath
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion]
---
```

- [ ] **Step 3: Update the `<execution_context>` block**

Replace the existing `<execution_context>` block with:

```
<execution_context>
skills/workflow-common-core/SKILL.md
skills/questioning-flow/SKILL.md
skills/polymath-engine/SKILL.md
</execution_context>
```

- [ ] **Step 4: Rewrite Section 4 (was "SPAWN POLYMATH AGENT")**

Replace the entire `## 4. SPAWN POLYMATH AGENT` section with:

```markdown
## 4. ENTER POLYMATH INLINE MODE

This command operates the conversation directly under the Polymath personality. The current command session IS Polymath for the duration of this exchange. There is no subagent spawn for the user-facing loop.

### Persona load procedure

1. Resolve `AGENTS_DIR` via the Agent Path Resolution Protocol in `skills/workflow-common-core/SKILL.md`.
2. Read `{AGENTS_DIR}/polymath.md` and inject the full personality into the current command context. Use the Read tool, exact path. If the file is missing, emit an `<escalation>` block of severity `blocker`, type `scope`, and stop.
3. Load the structured-choice and 5-7-exchange rules from `skills/polymath-engine/SKILL.md`.
4. From this point forward, all user-facing exchanges happen via `AskUserQuestion` per CLAUDE.md mandate. The personality, mode-specific briefing, and exchange budget govern question selection.

### Optional: silent research delegation

If a structured choice depends on codebase facts the current session cannot quickly retrieve, you MAY spawn a single read-only research agent via `Agent(...)` to gather findings. Constraints:
- Only for non-interactive lookups (file searches, content reads).
- The research agent does NOT drive any user-facing exchange.
- Findings return to the inline session, which then presents structured choices to the user.

### What this section is NOT

- This command does NOT issue `Agent({ description: "Spawn Polymath", ... })` for the user-facing loop. Polymath does not run as a subagent here.
- The phrases "Spawn Polymath", "Polymath takes over the conversation", and "Polymath conducts exploration" are anti-patterns and must not appear. The Polymath persona IS the current command session.
```

- [ ] **Step 5: Update Section 5 (was "POLYMATH CONDUCTS EXPLORATION")**

Replace `## 5. POLYMATH CONDUCTS EXPLORATION` with:

```markdown
## 5. CONDUCT THE EXPLORATION (inline)

Operating as Polymath, execute the 5-phase workflow inline:

### Phase 1: Research (silent)
Use Grep/Glob/Read to gather codebase facts relevant to the user's mode and topic. No user-facing output during this phase.

### Phase 2-4: Structured exchanges
Present 2-5 structured choices via AskUserQuestion per exchange. After each user selection, update internal understanding (knowns, unknowns) and decide whether to do brief additional research before the next exchange.

### Exchange tracking
Track exchange count internally. Hard cap at 7 exchanges before forcing the decision point in Section 6.

### Self-correction
If you catch yourself drafting an open-ended question, rewrite it as a closed-set choice before sending. Do not send open-ended questions to the user.
```

- [ ] **Step 6: Audit downstream language**

Run:
```bash
grep -n "Polymath takes over\|Polymath conducts\|Spawn agent: polymath\|spawn polymath\|Polymath spawns" commands/explore.md
```

Expected: zero matches. Any matches must be rewritten to inline language. Common patterns: "[Polymath spawns, conducts research silently]" → "[Research phase: gathering codebase context silently]".

- [ ] **Step 7: Run the spawn-truthfulness validator on this single file**

```bash
node scripts/validate-command-spawn-truthfulness.js commands/explore.md
```

Expected: `OK: commands/explore.md`.

If FAIL: investigate the reason. Likely a leftover spawn-flavored phrase. Rewrite, re-run.

- [ ] **Step 8: Commit**

```bash
git add commands/explore.md
git commit -m "refactor(commands/explore): inline-persona mode, no subagent spawn for user loop

Frontmatter now declares mode: inline-persona and inline_persona: polymath.
Execution context loads workflow-common-core (for agent path resolution),
questioning-flow, and polymath-engine. Body resolves Polymath via canonical
path and operates inline; subagent spawning reserved for non-interactive
research only. Spawn-truthfulness validator passes on this file."
```

- [ ] **Step 9: Update the snapshot's refactor-commit field**

Run:
```bash
git log -1 --format=%H -- commands/explore.md
```

Edit `docs/audits/2026-04-16-legion-4-7/findings/commands/explore-pre-refactor.snapshot.md` — fill in the `Refactor commit:` field in the header note with the hash from the previous command. Commit:

```bash
git add docs/audits/2026-04-16-legion-4-7/findings/commands/explore-pre-refactor.snapshot.md
git commit -m "audit: link explore.md snapshot to refactor commit"
```

---

### Task 14: Add `/legion:explore` to the canonical command-to-skill mapping in `workflow-common-core`

**Files:**
- Modify: `skills/workflow-common-core/SKILL.md`

- [ ] **Step 1: Locate the canonical map**

Run:
```bash
grep -n "command-to-skill\|/legion:plan\|/legion:status" skills/workflow-common-core/SKILL.md | head -20
```

Find the canonical command-to-skill mapping section.

- [ ] **Step 2: Verify `/legion:explore` is missing**

Run:
```bash
grep -n "/legion:explore" skills/workflow-common-core/SKILL.md
```

Expected: zero matches (this is the bug). If matches exist, document where and why a no-op may suffice.

- [ ] **Step 3: Add the entry**

Edit `skills/workflow-common-core/SKILL.md`. In the canonical command-to-skill map, add `/legion:explore` with its skill dependencies. Use the existing entry format. The dependencies are: `workflow-common-core`, `questioning-flow`, `polymath-engine`.

- [ ] **Step 4: Verify with a cross-reference test**

Run:
```bash
grep -n "/legion:explore" skills/workflow-common-core/SKILL.md
```

Expected: at least 1 match showing the new entry.

If `tests/cross-reference-validation.test.js` already asserts every command appears in the canonical map (it should, per spec §6.2), run:

```bash
node --test tests/cross-reference-validation.test.js
```

Expected: pass. If it doesn't already cover this, leave it for now — the spec calls for adding that assertion in a follow-up; not a blocker for this task.

- [ ] **Step 5: Commit**

```bash
git add skills/workflow-common-core/SKILL.md
git commit -m "fix(skills): add /legion:explore to canonical command-to-skill map

Phase 36 added the entry only to the deprecated workflow-common compat
shim, not to workflow-common-core (the canonical map). This corrects
the omission. Cross-reference validation now covers explore."
```

---

### Task 15: Add CAT-11 to `RUBRIC.md` (v1.0 → v1.1)

**Files:**
- Modify: `docs/audits/2026-04-16-legion-4-7/RUBRIC.md`

- [ ] **Step 1: Read the current rubric to confirm version**

```bash
head -20 docs/audits/2026-04-16-legion-4-7/RUBRIC.md
```

Expected: `Rubric version: 1.0` or similar in the header. Note current structure (CAT-1 through CAT-10 sections).

- [ ] **Step 2: Bump the rubric version**

Edit `docs/audits/2026-04-16-legion-4-7/RUBRIC.md`. Update the version header from `1.0` to `1.1`. Add a changelog entry at the top of the file (or wherever the audit's convention places it) noting:

```markdown
## Changelog

- **v1.1 (2026-05-04)**: Added CAT-11 (Mechanical Contract Drift). Mechanical re-score pass against all 64 already-audited files; existing 10 prose categories not revisited.
```

- [ ] **Step 3: Add the CAT-11 section**

Append the following after the CAT-10 section:

```markdown
### CAT-11: Mechanical Contract Drift

A finding under CAT-11 exists when a file makes a claim that is mechanically falsifiable against a sibling artifact, and the claim is currently false.

This category differs from CAT-1 through CAT-10: detection is by running a check, not by matching prose patterns.

**Detection table:**

| File class | Mechanical claim | Falsification check |
|---|---|---|
| `settings.json` | conforms to schema | Ajv against `docs/settings.schema.json` |
| `docs/settings.schema.json` | every field is consumed somewhere | grep field name across `skills/`, `adapters/`, `commands/`, `tests/` |
| `docs/schemas/plan-frontmatter.schema.json` | every required field is in phase-decomposer template | parse template frontmatter, diff against schema's `required` |
| `skills/phase-decomposer/SKILL.md` (template section) | template emits valid frontmatter | extract template, validate against schema with Ajv |
| `commands/*.md` | if "spawn agent" present, `Agent(` invoked OR `mode: inline-persona` declared | regex + frontmatter parse |
| `commands/*.md` `<execution_context>` | every listed path exists | filesystem check |
| `commands/*.md` | command appears in `workflow-common-core` canonical map | parse map, diff command list |

**Severity rubric:**

- **P0:** invalid contract that causes runtime failure on common path (e.g., bad PLAN.md crashes wave-executor; explore.md fails to dispatch Polymath).
- **P1:** invalid contract that causes silent wrong behavior (e.g., schema accepts garbage because `additionalProperties: true`).
- **P2:** drift that is currently survivable due to forgiving consumers (e.g., consumer reads a field with a fallback).
- **P3:** documentation-level drift only.

**Re-scoring policy:**

When CAT-11 is added mid-audit, all already-audited files get a CAT-11-only pass — not a full re-audit. The pass is mechanical: run the checks above, record findings. Files with zero CAT-11 hits get a one-line note in their findings file. Files with CAT-11 hits get appended findings (LEGION-47-NNN ID continues from current max). Existing 10-category findings are NOT revisited.

**Overlap policy:**

When a CAT-11 finding overlaps an existing CAT-N finding (e.g., a missing skill load is both CAT-6 implicit precondition and CAT-11 missing-loader), both findings stay. Different rubric lenses, not duplicates.
```

- [ ] **Step 4: Commit**

```bash
git add docs/audits/2026-04-16-legion-4-7/RUBRIC.md
git commit -m "audit: add CAT-11 (Mechanical Contract Drift) to rubric v1.1

Mechanical category for findings detectable by running a check rather than
matching prose patterns. Documents detection table, severity rubric,
re-scoring policy (CAT-11-only pass against already-audited files), and
overlap policy with existing CAT-1..10 findings."
```

---

### Task 16: Run spawn-truthfulness validator across `commands/` and address each finding

**Files:**
- Modify: 0-5 files in `commands/` (depends on validator output)
- Create: `docs/audits/2026-04-16-legion-4-7/findings/cat-11-spawn-truthfulness-pass.md`

- [ ] **Step 1: Run the validator and capture output**

```bash
node scripts/validate-command-spawn-truthfulness.js commands > /tmp/spawn-truthfulness-pass.txt 2>&1 || true
cat /tmp/spawn-truthfulness-pass.txt
```

Expected: explore.md is now PASS (Task 13). Possibly 0-4 other commands flagged. Likely candidates by name pattern: `advise`, `quick`, `board`, `portfolio`.

- [ ] **Step 2: Categorize each flagged command**

For each flagged file, read it end-to-end and categorize:

- **Should-spawn:** the command genuinely delegates to a subagent (e.g., review panels, advise) and should invoke `Agent(`. Fix: replace narrative spawn prose with an actual `Agent(...)` invocation block, or document the existing dispatch and verify the validator catches it correctly.
- **Should-be-inline:** the command should operate the conversation directly. Fix: add `mode: inline-persona` and `inline_persona: <agent-id>` frontmatter; rewrite spawn-flavored prose to inline-flavored prose.
- **False positive:** the validator's regex caught language that isn't truly a spawn claim. Fix: tighten the validator's `SPAWN_PATTERN` regex if recurring, OR rewrite the prose to avoid the false-positive trigger phrasing.

- [ ] **Step 3: Apply fixes one command at a time**

For each flagged command:
1. Read the file.
2. Decide category from Step 2.
3. Make the edit.
4. Re-run validator on that single file: `node scripts/validate-command-spawn-truthfulness.js commands/<name>.md`. Expect OK.
5. Commit individually with a descriptive message: `fix(commands/<name>): <category>`.

- [ ] **Step 4: Re-run the validator on the whole directory**

```bash
node scripts/validate-command-spawn-truthfulness.js commands
```

Expected: `OK: <N> command files pass spawn-truthfulness check`. If any FAIL remain, repeat Step 3.

- [ ] **Step 5: Record the pass results**

Create `docs/audits/2026-04-16-legion-4-7/findings/cat-11-spawn-truthfulness-pass.md`:

```markdown
# CAT-11 — Spawn Truthfulness Pass Results

**Date:** 2026-05-04
**Validator:** `scripts/validate-command-spawn-truthfulness.js`
**Rubric version:** 1.1

## Per-command verdicts

| Command | Pre-fix verdict | Category | Fix commit | Post-fix verdict |
|---|---|---|---|---|
| commands/explore.md | FAIL | should-be-inline | <hash from Task 13> | PASS |
| commands/<other>.md | <FAIL/PASS> | <category> | <hash> | PASS |
| ... | ... | ... | ... | ... |

## Summary

- Total commands: <N>
- Pre-fix FAIL: <K>
- All commands now PASS spawn-truthfulness check.
```

Fill in the table from Step 3 commit hashes. Run `git log --oneline -20 commands/` to find them.

- [ ] **Step 6: Commit the pass results document**

```bash
git add docs/audits/2026-04-16-legion-4-7/findings/cat-11-spawn-truthfulness-pass.md
git commit -m "audit: record CAT-11 spawn-truthfulness sweep results

Per-command verdicts and fix commit hashes. All commands now pass the
spawn-truthfulness validator after the explore.md refactor and the
sweep across the remaining flagged commands."
```

---

### Task 17: Run CAT-11 mechanical re-score against the 64 already-audited files

**Files:**
- Modify: `docs/audits/2026-04-16-legion-4-7/INDEX.md`
- Modify: `docs/audits/2026-04-16-legion-4-7/FINDINGS-DB.jsonl` (append)
- Create: `docs/audits/2026-04-16-legion-4-7/cat-11-rescore-pass.md`
- Modify (per file with hits): `docs/audits/2026-04-16-legion-4-7/findings/<layer>/<file>.md`

- [ ] **Step 1: Identify the next available `LEGION-47-NNN` ID**

Run:
```bash
tail -5 docs/audits/2026-04-16-legion-4-7/FINDINGS-DB.jsonl
grep -oE "LEGION-47-[0-9]+" docs/audits/2026-04-16-legion-4-7/FINDINGS-DB.jsonl | sort -u | tail -5
```

Note the highest ID. New CAT-11 findings start at `LEGION-47-<max+1>`.

- [ ] **Step 2: List the 64 audited files**

Run:
```bash
grep -E '^\| `' docs/audits/2026-04-16-legion-4-7/INDEX.md | wc -l
grep -E '^\| `' docs/audits/2026-04-16-legion-4-7/INDEX.md | awk -F'`' '{print $2}'
```

Expected: 64 file paths.

- [ ] **Step 3: For each file, run the appropriate mechanical check**

Walk the list. For each file, decide the applicable check from CAT-11's detection table:

- `settings.json` → `node scripts/validate-settings.js` (already passes per Task 1)
- `docs/settings.schema.json` → grep each schema property name across the codebase to confirm consumption
- `docs/schemas/plan-frontmatter.schema.json` → parse `skills/phase-decomposer/SKILL.md`'s template section and diff required fields
- `skills/phase-decomposer/SKILL.md` → extract template, validate against plan-frontmatter schema using `validate-plan-frontmatter` style logic
- `commands/*.md` → run `validate-command-spawn-truthfulness` (already done in Task 16)
- All other files (config YAMLs, root markdown, agent personalities, adapters) → CAT-11 N/A (no mechanical contract claim); record one-line "no CAT-11 surface" note in findings file.

For files with hits, append to `FINDINGS-DB.jsonl` one line per finding using the existing finding record format. Example:

```json
{"id":"LEGION-47-227","file":"docs/schemas/plan-frontmatter.schema.json","line_range":"6","category":"CAT-11","severity":"P1","confirmed":true,"excerpt":"\"required\": [\"phase\", \"plan\", \"wave\", \"agent\"]","issue":"Schema's required field includes singular 'agent' but phase-decomposer template emits plural 'agents' array. Three layers (schema, template, consumers) historically inconsistent.","remediation_sketch":"Resolved in 2026-05-04 contract-cleanup spec, Task 2.","remediation_cluster":"contract-drift","remediation_effort":"resolved","status":"resolved","rubric_version":"1.1"}
```

- [ ] **Step 4: Update each affected per-file findings document**

For each file that gets a new CAT-11 finding, append a section to its `findings/<layer>/<slug>.md` file. Example for the schema:

```markdown
## LEGION-47-227 — P1, CAT-11 Mechanical Contract Drift (resolved)

**Lines 6**

> "required": ["phase", "plan", "wave", "agent"]

**Issue:** Schema's required field included singular `agent` but phase-decomposer template emits plural `agents`. Three-layer drift between schema, template, and consumers (`/legion:validate`, wave-executor).

**Remediation:** Resolved by 2026-05-04 contract-cleanup spec, Task 2 (full schema replacement). Plural `agents`, structured `expected_artifacts`, `must_haves` block. additionalProperties: false retained.

**Status:** resolved

---
```

For files with NO CAT-11 hits, append a one-line note:

```markdown
## CAT-11 Pass Note (rubric v1.1, 2026-05-04)

No CAT-11 findings. <one-line reason: e.g., "no mechanical contract surface — pure persona prose">.
```

- [ ] **Step 5: Update INDEX.md**

Edit `docs/audits/2026-04-16-legion-4-7/INDEX.md`. For files with new CAT-11 findings, increment the per-file finding count and update max severity if applicable. Update the per-category rollup at the top to add CAT-11 with its count.

- [ ] **Step 6: Create the rescore-pass summary document**

Create `docs/audits/2026-04-16-legion-4-7/cat-11-rescore-pass.md`:

```markdown
# CAT-11 Mechanical Rescore Pass

**Date:** 2026-05-04
**Rubric:** v1.1
**Files re-scored:** 64 (all previously audited)
**Pre-existing findings revisited:** 0 (CAT-1..10 untouched per re-scoring policy)

## Summary

- New CAT-11 findings: <N>
- Files with CAT-11 hits: <K>
- Files clean under CAT-11: <64-K>

## Per-file CAT-11 verdicts

(Table or list of every file and either its CAT-11 finding ID(s) or "no surface".)

## Resolved at landing

Most CAT-11 findings opened during this rescore pass were resolved by the
2026-05-04 contract-cleanup spec (commit `9991e05`) and its implementation
(Phase 1-4 of this plan). Each resolved finding's `status` field is set
to `resolved` with a pointer to the resolving commit/task.
```

Fill in the values from Steps 3-5.

- [ ] **Step 7: Commit the rescore pass**

```bash
git add docs/audits/2026-04-16-legion-4-7/cat-11-rescore-pass.md
git add docs/audits/2026-04-16-legion-4-7/INDEX.md
git add docs/audits/2026-04-16-legion-4-7/FINDINGS-DB.jsonl
git add docs/audits/2026-04-16-legion-4-7/findings/
git commit -m "audit: CAT-11 mechanical rescore pass against 64 audited files

Adds <N> new CAT-11 findings to FINDINGS-DB.jsonl. Updates INDEX.md
counts and per-file findings docs. Most findings already resolved by
the 2026-05-04 contract-cleanup spec (9991e05) and its implementation."
```

---

## Wrap-up

### Task 18: Add CHANGELOG entry

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Read the current CHANGELOG format**

```bash
head -40 CHANGELOG.md
```

Note the version-heading style (e.g., `## [7.3.3] - 2026-04-XX`).

- [ ] **Step 2: Add an entry for the next version**

Per spec §1 header, the target version is open between v7.3.4 (patch) and v7.4.0 (folded into 4.7 audit). Use the version chosen at release time. Add at the top of CHANGELOG.md:

```markdown
## [Unreleased — contract cleanup]

### Schema reconciliation
- `docs/settings.schema.json`: added `dispatch` block, `models.planning_reasoning` (deprecated), `execution.use_worktrees` (experimental), and `memory` pruning fields. `settings.json` is unchanged and validates clean.
- `docs/schemas/plan-frontmatter.schema.json`: replaced full schema. Plural `agents` array, structured `expected_artifacts` objects, `must_haves` block, `oneOf` `phase` form for legacy/current compatibility, optional `recommendation` reservation.

### New executable validators (CI + soft-warn)
- `scripts/validate-settings.js` — runs Ajv against settings; CI hard fail; bootstrap soft-warn via workflow-common-core.
- `scripts/validate-plan-frontmatter.js` — validates each PLAN.md against the schema; CI hard fail; soft-warn after `/legion:plan` writes.
- `scripts/validate-command-spawn-truthfulness.js` — CI-only check that every command containing spawn language either invokes `Agent(` or declares `mode: inline-persona`.

### Plan migration
- All `.planning/phases/**/PLAN.md` files migrated to v2 frontmatter shape via `scripts/migrate-plans-to-v2.js` (one-shot; removed in follow-up commit).

### `/legion:explore` refactor
- `commands/explore.md`: rewritten to inline-persona pattern. Frontmatter declares `mode: inline-persona`, `inline_persona: polymath`. Execution context loads `workflow-common-core`, `questioning-flow`, `polymath-engine`. No subagent spawn for the user-facing loop.
- `skills/workflow-common-core/SKILL.md`: `/legion:explore` added to canonical command-to-skill map (was only present in the deprecated compat shim).

### 4.7 audit
- Rubric bumped to v1.1 with new category CAT-11 (Mechanical Contract Drift).
- Mechanical re-score pass against the 64 already-audited files; new findings appended to FINDINGS-DB.jsonl.

### devDependencies
- Added `ajv@^8` and `gray-matter@^4`. Both are dev-only; runtime never imports them.
```

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: CHANGELOG entry for contract cleanup + explore refactor"
```

---

### Task 19: Run full release-check; verify all green

**Files:** none

- [ ] **Step 1: Run the entire release-check pipeline**

```bash
node scripts/release-check.js
```

Expected: every check PASS, including:
- settings schema (passed since Task 1)
- plan frontmatter (passes since Task 9 migration)
- command spawn-truthfulness (passes since Task 16 sweep)
- All other pre-existing release-check phases

If any check FAILs, investigate. Common failure modes:
- A migrated plan file ended up with an unexpected field shape — re-run the migration on that single file with the validator's error pointing to the field.
- A command flagged by spawn-truthfulness was missed in Task 16 — re-run Task 16 step 2-3 on that file.
- Existing release-check assertions broke because of a schema field change — likely fix is in the assertion, not in the new code.

- [ ] **Step 2: Run the full test suite**

```bash
node --test tests/
```

Expected: every test passes. No skips except documented ones.

- [ ] **Step 3: Final commit (if any fix-up edits were made in Steps 1-2)**

If everything was already green, no commit needed. If fix-ups happened:

```bash
git add -A
git commit -m "fix: address release-check / test failures from contract cleanup

<specific issues addressed>"
```

- [ ] **Step 4: Schedule migration script removal**

Per Task 9 Step 9, remove the one-shot migration script and its tests. This is a follow-up commit, separate from the wrap-up:

```bash
git rm scripts/migrate-plans-to-v2.js tests/migrate-plans.test.js
git rm -r tests/fixtures/migration/
git commit -m "chore: remove one-shot plan migration script

Migration applied in <commit hash from Task 9 Step 8>. Snapshot retained
under docs/audits/.../cat-11-pre-migration-snapshot/."
```

---

## Self-Review

Run after writing the plan, before declaring it complete.

**1. Spec coverage** — confirm every Goal/Success Criterion in the spec maps to at least one task.

| Spec Goal | Task(s) |
|---|---|
| Goal 1: Reconcile settings.json ↔ schema; deprecate planning_reasoning | Task 1 |
| Goal 2: Reconcile plan-frontmatter schema | Task 2 |
| Goal 3: Refactor /legion:explore inline | Task 12, 13, 14 |
| Goal 4: Three executable validators (CI + soft-warn) | Tasks 4, 5, 6, 7 |
| Goal 5: Audit-wide spawn-truthfulness check | Task 16 |
| Goal 6: Add CAT-11 to RUBRIC; mechanical rescore | Tasks 15, 17 |

| Success Criterion (§8) | Task(s) |
|---|---|
| SC-1: validate-settings.js exists, fixtures cover mutations, wired to release-check | Tasks 4, 7 |
| SC-2: validate-plan-frontmatter.js wired to release-check + soft-warn | Tasks 5, 7. Soft-warn in `/legion:plan` is a smaller follow-up wired into `commands/plan.md` — see Note A below. |
| SC-3: validate-command-spawn-truthfulness.js wired to release-check | Tasks 6, 7 |
| SC-4: settings.schema.json accepts current settings.json | Task 1 |
| SC-5: plan-frontmatter.schema.json matches template | Task 2 |
| SC-6: consumer files updated (validate.md, wave-executor, phase-decomposer) | Task 10 (validate.md). Wave-executor already plural (pre-flight verified). Phase-decomposer schema-link comment update is Task 2 Step 2 final note (template comment) — see Note B below. |
| SC-7: plan-schema-conformance.test.js uses gray-matter | Task 11 |
| SC-8: cross-reference test asserts every command in canonical map | Spec §6.2 calls for this update. Not a separate task in this plan; folded into Task 14 verification. See Note C below. |
| SC-9: lint-commands asserts execution_context paths exist | Spec §6.2 calls for this. Note D — not in this plan; recommend adding as a 5-line follow-up commit at end of Phase 4. |
| SC-10: explore.md inline-persona refactor | Task 13 |
| SC-11: spawn-truthfulness clean across all commands | Task 16 |
| SC-12: CAT-11 in rubric v1.1; rescore pass; findings appended | Tasks 15, 17 |
| SC-13: release-check green | Task 19 |
| SC-14: ajv + gray-matter in devDependencies | Task 3 |
| SC-15: CHANGELOG entry | Task 18 |

**Notes:**

- **Note A (SC-2 soft-warn in `/legion:plan`):** The soft-warn wiring into `commands/plan.md` is a small follow-up edit. Add to Task 11 as a final step OR ship separately. To avoid bloating Task 11, I'm flagging it as a small post-Phase-3 patch: edit `commands/plan.md` to invoke the validator after writing each PLAN.md and surface non-blocking warnings.
- **Note B (SC-6 phase-decomposer template comment):** Task 2 updates the schema. The phase-decomposer template comment that points to the schema should mention "v2 shape" or be a no-op if it's already neutral. Verify in Task 2 Step 6 (after the existing steps); add a one-line edit if needed.
- **Note C (SC-8 cross-reference test):** Spec §6.2 says add the assertion to `tests/cross-reference-validation.test.js`. Task 14's Step 4 mentions running the test but doesn't explicitly add the assertion. If the assertion is missing, add it as a 5-step task in Phase 4 (test-driven: write failing assertion, fix, commit).
- **Note D (SC-9 lint-commands assertion):** Same shape as Note C. Add as a small follow-up commit.

Adding two micro-tasks to address Notes C and D would make the plan strictly complete against §8. Including them as inline notes here keeps task count at 19 plus a follow-up cleanup; the implementer can choose to add them as Tasks 20-21 or roll into Task 14/19.

**2. Placeholder scan** — searched for "TBD", "TODO", "implement later", "fill in details", "Add appropriate error handling", "similar to Task N", "(without actual code)" — none found in this plan body. The phrase "<commit hash from Task X Step Y>" appears in commit messages and the snapshot header by design — these are runtime references the implementer fills in from `git log` output, not unbounded placeholders.

**3. Type consistency** — function and method names used across tasks:
- `validateSettings` (Tasks 4, 7) — consistent
- `validatePlanFile`, `validatePlanDir`, `findPlanFiles` (Tasks 5, 7) — consistent
- `validateCommandFile`, `validateCommandsDir`, `findCommandFiles`, `SPAWN_PATTERN`, `AGENT_INVOCATION_PATTERN` (Tasks 6, 7) — consistent
- `migrateFm`, `migratePlanText`, `migratePlanFile`, `migrateDir` (Tasks 8, 9) — consistent
- Schema field names: `agents` (plural array), `expected_artifacts` (structured), `must_haves` (object), `mode: inline-persona` (frontmatter) — used consistently across tasks.

No inconsistencies.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-04-contract-cleanup-and-explore-refactor.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`.

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints for review.

**Which approach?**
