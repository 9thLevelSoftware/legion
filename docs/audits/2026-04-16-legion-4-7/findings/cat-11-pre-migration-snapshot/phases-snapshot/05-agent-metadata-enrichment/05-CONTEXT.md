# Phase 5: Agent Metadata Enrichment -- Context

## Phase Goal
Add structured metadata fields (`languages`, `frameworks`, `artifact_types`, `review_strengths`) to all 53 agent frontmatter files for richer recommendation scoring in Phase 6.

## Requirements Covered
- **AGT-01**: Structured metadata in 53 agent frontmatter (`languages`, `frameworks`, `artifact_types`, `review_strengths`)

## What Already Exists (from prior phases)
- **Phase 1 completed**: Plan Schema Hardening -- `files_forbidden`, `expected_artifacts`, `verification_commands` in plan frontmatter
- **Phase 2 completed**: Wave Safety -- plan-critique file overlap detection and `sequential_files` convention
- **Phase 3 completed**: Control Modes -- `control_mode` setting with 4 presets, authority matrix mode integration
- **Phase 4 completed**: Observability -- decision logging in SUMMARY.md, cycle delta in REVIEW.md, structured decision capture
- **Agent frontmatter** currently has 4 fields: `name`, `description`, `division`, `color`
- **Agent contract tests** (`tests/agent-contract.test.js`): Validates 53 agents exist, minimum 80 lines, required sections present
- **Agent registry** (`skills/agent-registry/SKILL.md`): Recommendation algorithm uses semantic matching + heuristic scoring against `task_types` in CATALOG.md
- **CATALOG.md** (`skills/agent-registry/CATALOG.md`): Task type index per agent -- reverse mapping from project need to agents

## Key Design Decisions
- **No architecture proposals needed**: Phase adds YAML frontmatter fields to existing agent files -- enrichment only
- **Frontmatter only**: No agent personality text may be altered -- only YAML frontmatter between `---` fences
- **Accurate over generic**: Each agent's metadata must reflect their specific described capabilities, not boilerplate
- **Array fields**: All 4 new fields are YAML arrays (lists), not scalars
- **Wave parallelism**: Plans 05-02 and 05-03 touch completely different agent files -- safe for parallel execution
- **Schema first**: Define field schema and update contract tests before enrichment begins, so tests catch errors immediately
- **CATALOG.md update**: Catalog table updated to reflect new metadata availability after all agents enriched
- **Non-technical agent guidance**: Agents that don't write code use `[markdown]` or `[markdown, yaml]` for `languages` and domain-specific tools for `frameworks`. The `artifact_types` and `review_strengths` fields apply meaningfully to all agents regardless of technical depth.
- **YAML parsing strategy**: Contract tests use regex-based frontmatter extraction (split on `---` fences, parse known keys). No new npm dependency needed -- the 4 metadata fields use YAML flow sequences (`[a, b, c]`) which are trivially parseable.
- **Partial enrichment tolerance**: The new metadata contract test validates format/type for agents that HAVE the fields, and counts enriched vs total. A separate completeness assertion checks that all 53 are enriched -- this is expected to fail until both Wave 2 plans complete.
- **Pre-existing fix**: SKILL.md agent count (52 -> 53) corrected in Plan 05-03 alongside CATALOG.md update

## Actual Division Counts (verified against filesystem)
- Engineering: 9 agents
- Design: 6 agents
- Marketing: 6 agents (CLAUDE.md incorrectly says 8)
- Testing: 7 agents
- Product: 4 agents (CLAUDE.md incorrectly says 3)
- Project Management: 5 agents
- Support: 6 agents
- Spatial Computing: 6 agents (includes terminal-integration-specialist and macos-spatial-metal-engineer)
- Specialized: 4 agents (orchestrator, data-analytics, lsp-index, polymath)
- **Total: 53 agents**

## Plan Critique Results (REWORK -- mitigations applied)
Critique agents identified 6 issues:
1. Phantom agents (tiktok-strategist, reddit-community-builder) do not exist -> REMOVED from plans, Marketing corrected to 6
2. Agent count arithmetic wrong (25+28!=53) -> CORRECTED to 3+25+25=53
3. Parallel verification deadlock -> RESOLVED with partial-enrichment-tolerant test structure
4. YAML parsing dependency unspecified -> RESOLVED: regex-based extraction, no new dependency
5. SKILL.md says 52 agents -> ADDED to 05-03 scope
6. Non-technical agents + languages semantically weak -> ADDED guidance in schema

Pre-existing issues noted: CLAUDE.md division counts are stale (Marketing=8 should be 6, Product=3 should be 4, Engineering=8 should be 9, Specialized=3 should be 4). Not in Phase 5 scope but flagged for Phase 12 (Integration & Release).

## Plan Structure
- **Plan 05-01 (Wave 1)**: Schema definition + contract test update -- define field taxonomy, update agent-contract.test.js, create 3 exemplar agents as templates
- **Plan 05-02 (Wave 2)**: Enrich Engineering (8 remaining) + Design (6) + Testing (7) + Specialized (4) = 25 agents
- **Plan 05-03 (Wave 2)**: Enrich Marketing (5 remaining) + Product (4) + PM (5) + Support (6) + Spatial (5 remaining) = 25 agents + CATALOG.md + SKILL.md updates
