# Phase 2: Wave Safety -- Context

## Phase Goal
Add file overlap detection in plan-critique for same-wave plans and establish `sequential_files` convention in wave metadata.

## Requirements Covered
- **DSC-04**: Plan-critique file overlap detection for same-wave plans — when two plans in the same wave list overlapping `files_modified`, plan-critique flags this as a BLOCKER before execution begins
- **DSC-05**: `sequential_files` convention in wave metadata — declares files that require single-agent sequential access within a wave, with wave-executor respecting the constraint during dispatch

## What Already Exists (from prior phases)
- **Phase 1 completed**: Plan Schema Hardening — added `files_forbidden`, `expected_artifacts`, `verification_commands` to plan frontmatter schema
- **Plan-critique skill** (`skills/plan-critique/SKILL.md`): Sections 1-4 (pre-mortem, assumption hunting, critique report, agent selection) plus Section 5 (schema conformance for v6.0 fields). Section 5 validates individual plan frontmatter but does NOT cross-check between plans in the same wave.
- **Wave-executor skill** (`skills/wave-executor/SKILL.md`): Section 1 Principle 8 states "plans within the same wave must not share files_modified entries" and Section 2 Step 5d checks for disjoint files_modified within each wave (warning only, not blocker). No `sequential_files` concept exists yet.
- **Phase-decomposer skill** (`skills/phase-decomposer/SKILL.md`): Section 6 defines the canonical plan file template. No `sequential_files` field exists in the template.
- **Test suite** (`tests/`): `plan-schema-conformance.test.js` (16 tests) validates v6.0 schema fields. No cross-plan overlap tests exist.

## Key Design Decisions
- **Both plans in Wave 1**: Plan 02-01 (plan-critique overlap detection) and Plan 02-02 (sequential_files convention) modify different files with no dependency between them. They can execute in parallel.
- **Plan-critique as the enforcement point for overlap detection**: The existing wave-executor check (Section 2 Step 5d) is a runtime warning. DSC-04 shifts this to a BLOCKER at planning time via plan-critique, catching conflicts before execution.
- **sequential_files as a new frontmatter field**: Rather than restructuring wave dependencies, `sequential_files` is a lightweight declaration that the wave-executor consults during dispatch to order file writes within a wave.
- **Tests bundled with implementation**: Each plan includes its own test creation to keep the work self-contained and avoid a separate test-only wave.
- **Simplified dispatch model**: Wave-executor falls back to fully sequential dispatch when any sequential_files overlap exists (no mixed parallel+sequential complexity). This is the safe, simple model.
- **Wave-executor Step 5d kept as defense-in-depth**: Plan-critique's BLOCKER supplements (not replaces) the wave-executor runtime warning. Both checks coexist.

## Known Gaps (from plan critique)
- **Cross-field validation**: Plan 02-01's overlap detection checks `files_modified` vs `files_modified` across plans. It does NOT cross-check `sequential_files` in Plan A against `files_modified` in Plan B. This gap should be addressed in Phase 7 (Validation & Conformance) when plan-critique gets additional schema rules.
- **No plan-critique schema rule for sequential_files**: The `sequential_files` field has no Section 5 conformance rule (unlike `files_forbidden`, `expected_artifacts`, `verification_commands`). A validation rule should be added in Phase 7 to catch malformed `sequential_files` entries at planning time.

## Plan Structure
- **Plan 02-01 (Wave 1)**: Plan-Critique File Overlap Detection -- add cross-plan overlap validation rule to plan-critique skill with test coverage
- **Plan 02-02 (Wave 1)**: Sequential Files Convention -- add `sequential_files` field to phase-decomposer template and wave-executor dispatch logic with test coverage
