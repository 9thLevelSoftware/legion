# Phase 1: Plan Schema Hardening -- Context

## Phase Goal
Add `files_forbidden`, `expected_artifacts`, and mandatory `verification_commands` to the plan frontmatter schema, with plan-critique enforcement.

## Requirements Covered
- **DSC-01**: `files_forbidden` field in plan frontmatter schema — explicit "no-touch" zone declaration preventing agents from modifying files outside their assigned scope
- **DSC-02**: `expected_artifacts` field in plan frontmatter schema — contract-level declaration of what outputs a plan must produce, separate from quality checks in `must_haves.artifacts`
- **DSC-03**: Mandatory `verification_commands` in all plans — plan-critique enforced as BLOCKER severity when missing

## What Already Exists (from prior phases)
- **Phase-decomposer skill** (`skills/phase-decomposer/SKILL.md`): Section 6 defines the canonical plan file template with YAML frontmatter including `phase`, `plan`, `type`, `wave`, `depends_on`, `files_modified`, `autonomous`, `agents`, `requirements`, `user_setup`, `must_haves` (with `truths`, `artifacts`, `key_links` subsections)
- **Plan-critique skill** (`skills/plan-critique/SKILL.md`): Sections 1-4 cover pre-mortem analysis, assumption hunting, critique report/routing, and agent selection. No schema validation section exists yet.
- **Existing plan examples**: 80+ archived plan files in `.planning/milestones/` from v1.0-v5.0 using the current schema
- **Test suite**: `tests/` directory with `agent-contract.test.js`, `intent-filtering.test.js`, `authority-matrix.test.js`, and other conformance tests
- **Task-level verification**: Plans already have `> verification:` inline lines and `<verify>` blocks per task, but no plan-level `verification_commands` field

## Key Design Decisions
- **Architecture approach**: Clean Architecture — selected by user over Minimal and Pragmatic proposals
- **`expected_artifacts` is separate from `must_haves.artifacts`**: Clean separation of concerns — `expected_artifacts` declares "what this plan produces" (contract), while `must_haves.artifacts` declares "how good those outputs must be" (quality gates). This avoids mixing structural and quality concerns.
- **`files_forbidden` enables Phase 2 parallelism**: Explicit no-touch zones are a prerequisite for DSC-04 (file overlap detection in same-wave plans). Declaring what a plan MUST NOT touch allows the wave executor to detect conflicts before execution.
- **Plan-critique as formal gating mechanism**: Schema validation is enforced at planning time via plan-critique BLOCKER severity, not at execution time. This shifts quality left.
- **Wave 1 parallelism**: Plans 01-01 (decomposer update) and 01-02 (critique update) can execute in parallel since they modify different skill files with no dependency between them.
- **Wave 2 depends on both Wave 1 plans**: Tests and examples need the finalized schema (from 01-01) and validation rules (from 01-02) to be written correctly.

## Plan Structure
- **Plan 01-01 (Wave 1)**: Update phase-decomposer with new schema fields -- add `files_forbidden`, `expected_artifacts`, `verification_commands` to template and field guidance
- **Plan 01-02 (Wave 1)**: Add schema validation to plan-critique -- new Section 5 with BLOCKER enforcement for missing fields
- **Plan 01-03 (Wave 2)**: Create schema conformance tests and example retrofits -- test suite, fixtures, and retrofitted plan examples
