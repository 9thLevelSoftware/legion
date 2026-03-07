# Phase 3: Control Modes -- Context

## Phase Goal
Add `control_mode` setting with `autonomous`/`guarded`/`advisory`/`surgical` presets that adjust which authority matrix rules are active.

## Requirements Covered
- **CTL-01**: `control_mode` setting with `autonomous`/`guarded`/`advisory`/`surgical` preset values
- **CTL-02**: Authority matrix mode integration — each preset adjusts active rules via a structured flag profile
- **CTL-03**: Settings schema and documentation updates for control modes

## What Already Exists (from prior phases)
- **Phase 1 completed**: Plan Schema Hardening — added `files_forbidden`, `expected_artifacts`, `verification_commands` to plan frontmatter schema
- **Phase 2 completed**: Wave Safety — added plan-critique file overlap detection and `sequential_files` convention
- **Settings infrastructure** (`settings.json`): Top-level sections for `models`, `planning`, `execution`, `review`, `memory`, `integrations`
- **Settings schema** (`docs/settings.schema.json`): JSON Schema draft-07 with `additionalProperties: false` — new properties require schema updates
- **Settings Resolution Protocol** (`skills/workflow-common-core/SKILL.md`): Resolves `settings.json` with defaults for missing/invalid values
- **Authority matrix** (`.planning/config/authority-matrix.yaml`): Exclusive domain ownership for 53 agents, consumed by authority-enforcer
- **Authority enforcer** (`skills/authority-enforcer/SKILL.md`): 9 sections covering loading, boundary validation, prompt injection, finding filtering, integration points, conflict resolution, error handling, usage, maintenance
- **Wave executor** (`skills/wave-executor/SKILL.md`): Reads authority matrix at agent spawn time, calls authority-enforcer for constraint injection
- **Test suite** (`tests/`): `authority-matrix.test.js`, `plan-schema-conformance.test.js`, `plan-critique-overlap.test.js`, `sequential-files.test.js`

## Key Design Decisions
- **Architecture approach**: Clean Architecture — selected by user over Minimal and Pragmatic proposals
- **Mode profiles as a separate YAML file**: `.planning/config/control-modes.yaml` declares each preset as a set of boolean flags. This follows the existing pattern where `authority-matrix.yaml` lives in `.planning/config/`. Keeping mode-to-rule mappings declarative means adding a fifth mode requires zero skill changes.
- **Five boolean flags per profile**: `authority_enforcement`, `domain_filtering`, `human_approval_required`, `file_scope_restriction`, `read_only`. Skills check individual flags, not mode names, enabling future custom mode composition.
- **Single resolution point**: workflow-common-core resolves `control_mode` string → profile object at invocation start. All consumer skills receive the same resolved profile.
- **Default is `guarded`**: Preserves current behavior — zero breaking change for existing users. The field is optional in settings.json.
- **Wave 1 establishes the data contract**: Config file + schema + resolution protocol. Wave 2 wires consumers to the contract.

## Plan Structure
- **Plan 03-01 (Wave 1)**: Control mode profiles and settings schema -- create control-modes.yaml, update settings.json/schema, extend Settings Resolution Protocol
- **Plan 03-02 (Wave 2)**: Authority matrix mode-aware integration -- wire flag profiles into authority-enforcer and wave-executor, update CLAUDE.md
- **Plan 03-03 (Wave 3)**: Control mode tests and documentation -- JSON fixture, test suite for schema/profile/mapping validation, reference documentation (depends on both 03-01 and 03-02 because tests cross-reference outputs from both)
