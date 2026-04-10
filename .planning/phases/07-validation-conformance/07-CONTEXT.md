# Phase 7: Validation & Conformance -- Context

## Phase Goal
Add adapter schema conformance tests, cross-reference validation, lint-commands, and new adapter spec fields.

## Requirements Covered
- **VAL-01**: Adapter schema conformance tests (required fields, capability flags)
- **VAL-02**: Cross-reference validation (commands reference existing skills and agents)
- **VAL-03**: `lint-commands` test for command .md files
- **VAL-04**: `max_prompt_size` and `known_quirks` fields in ADAPTER.md spec

## What Already Exists (from prior phases)
- **Phase 1 completed**: Plan Schema Hardening -- `files_forbidden`, `expected_artifacts`, `verification_commands`
- **Phase 2 completed**: Wave Safety -- plan-critique file overlap detection, `sequential_files`
- **Phase 3 completed**: Control Modes -- 4 control mode presets in settings.json
- **Phase 4 completed**: Observability -- decision logging in SUMMARY.md, cycle delta in REVIEW.md
- **Phase 5 completed**: Agent Metadata Enrichment -- all 53 agents have enriched frontmatter
- **Phase 6 completed**: Recommendation Engine v2 -- metadata scoring, task_type validation, archetype boosts
- **ADAPTER.md spec** (`adapters/ADAPTER.md`): Defines required fields (CLI identity, capabilities, detection) and required sections (Tool Mappings, Interaction Protocol, Execution Protocol)
- **9 adapter files** in `adapters/`: claude-code, codex-cli, cursor, copilot-cli, gemini-cli, amazon-q, windsurf, opencode, aider
- **12 command files** in `commands/`: advise, agent, build, explore, milestone, plan, portfolio, quick, review, start, status, update
- **25 skill directories** in `skills/`
- **Existing test suite**: 26 test files in `tests/` using `node:test` + `node:assert/strict`, regex-based YAML parsing (no deps)

## Key Design Decisions
- **Architecture proposals**: Skipped (straightforward test creation + spec updates)
- **Wave structure**: Wave 1 splits spec updates (07-01) and test creation (07-02) for parallel execution. Wave 2 (07-03) depends on 07-01 because adapter conformance tests must validate the new fields added in 07-01.
- **Test patterns**: Follow existing project conventions -- `node:test`, `node:assert/strict`, regex-based frontmatter parsing, no external dependencies
- **Agent selection**: engineering-senior-developer for spec work (needs architectural judgment for field design), testing-qa-verification-specialist + testing-api-tester for test creation (domain expertise)
- **Adapter field values**: `max_prompt_size` and `known_quirks` require research per CLI -- agent must use accurate values, not placeholders

## Plan Structure
- **Plan 07-01 (Wave 1)**: ADAPTER.md Spec Enhancement + Adapter Updates -- add `max_prompt_size` and `known_quirks` fields to spec and all 9 adapters
- **Plan 07-02 (Wave 1)**: Cross-Reference Validation + Lint-Commands Tests -- create tests verifying command→skill/agent references and command .md structural lint
- **Plan 07-03 (Wave 2)**: Adapter Schema Conformance Test Suite -- create comprehensive test validating all 9 adapters against full ADAPTER.md spec including new fields
