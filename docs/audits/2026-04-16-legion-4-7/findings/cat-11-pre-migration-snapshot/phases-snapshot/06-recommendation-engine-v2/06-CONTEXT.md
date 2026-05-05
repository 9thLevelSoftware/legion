# Phase 6: Recommendation Engine v2 -- Context

## Phase Goal
Update recommendation engine to score against enriched metadata fields, ensure `task_type` in outcome records, and implement archetype-weighted recommendation boosts from task_type history.

## Requirements Covered
- **AGT-02**: Recommendation engine scoring against enriched metadata fields (`languages`, `frameworks`, `artifact_types`)
- **AGT-03**: `task_type` field in OUTCOMES.md records
- **AGT-04**: Archetype-weighted recommendation boosts from task_type history

## What Already Exists (from prior phases)
- **Phase 1 completed**: Plan Schema Hardening -- `files_forbidden`, `expected_artifacts`, `verification_commands` in plan frontmatter
- **Phase 2 completed**: Wave Safety -- plan-critique file overlap detection and `sequential_files` convention
- **Phase 3 completed**: Control Modes -- `control_mode` setting with 4 presets, authority matrix mode integration
- **Phase 4 completed**: Observability -- decision logging in SUMMARY.md, cycle delta in REVIEW.md, structured decision capture
- **Phase 5 completed**: Agent Metadata Enrichment -- all 53 agent .md files include `languages`, `frameworks`, `artifact_types`, `review_strengths` in YAML frontmatter
- **Recommendation engine** (`scripts/recommendation-engine.js`): Three-layer scoring (semantic + heuristic + memory boost), mandatory role enforcement (testing for execution, coordinator for cross-division), confidence classification (high/medium/low)
- **Engine reads CATALOG.md only**: `parseCatalog()` extracts `id`, `division`, `specialty`, `taskTypes` from catalog tables. Does NOT read agent .md files or enriched metadata.
- **Memory manager** (`skills/memory-manager/SKILL.md`): OUTCOMES.md schema already includes `Task Type` column. Memory boost scoring uses `success_rate * 3.0 + avg_importance * 0.5`, weighted by recency decay. Minimum 2 outcomes for eligibility.
- **Test suite** (`tests/recommendation-engine.test.js`): 3 fixture-based test cases + 1 memory boost test. Fixtures in `tests/fixtures/recommendation/cases.json`.

## Key Design Decisions
- **Read agent .md frontmatter directly**: Engine will parse agent .md files for enriched metadata fields (`languages`, `frameworks`, `artifact_types`, `review_strengths`). These are the canonical source from Phase 5. CATALOG.md remains the source for `taskTypes`, `specialty`, `division`.
- **Additive scoring dimension**: Metadata scoring adds a new layer alongside semantic/heuristic -- does not replace existing scoring. Exact language/framework match boosts relevance for prompts mentioning specific technologies.
- **Archetype boosts are additive**: Same principle as memory boosts -- cannot override semantic relevance. Agents must have baseline relevance (semantic > 0) before archetype history applies.
- **task_type validation**: OUTCOMES.md already has the `Task Type` column. AGT-03 ensures the memory-manager store operation populates it consistently and the recall operation exposes task_type groupings for archetype scoring.
- **No new dependencies**: All parsing uses regex-based frontmatter extraction (same approach as Phase 5 contract tests). No YAML parser dependency.
- **>90% test coverage**: New scoring paths must have dedicated test fixtures. Archetype scoring needs test fixtures with mock OUTCOMES.md data.

## Plan Critique Results (CAUTION -- mitigations applied)
Critique agents identified 6 issues (1 blocker, 2 high, 3 medium):
1. **C-01 BLOCKER**: Plan 06-02 wrote executable tests for markdown spec (SKILL.md has no JS module) -> FIXED: Rewrote Task 3 as spec validation tests parsing SKILL.md structure
2. **C-02 HIGH**: archetypeScores framed as "from memory recall" but engine receives it as parameter -> FIXED: Clarified in 06-03 context that archetypeScores is an optional parameter (same pattern as memoryScores)
3. **C-03 HIGH**: data-analytics-reporter assigned to JS implementation work (06-03) -> FIXED: Reassigned to engineering-backend-architect
4. **C-04 MEDIUM**: Gating says "baseline > 0" but shortlist filter uses "semantic > 0" -> FIXED: Added clarifying note in 06-01 and 06-03
5. **C-05 MEDIUM**: Test fixture review-security-audit needs validated agent metadata -> FIXED: Added specific taskType/review_strengths values to fixture description
6. **C-06 MEDIUM**: metadataScore/parseAgentMetadata not exported for unit testing -> FIXED: Added export instruction to 06-01 Task 2

Wave 1 file separation: CLEAN (verified by critique agents)

## Plan Structure
- **Plan 06-01 (Wave 1)**: Enhanced metadata scoring in recommendation-engine.js -- read agent frontmatter, add metadata scoring layer, test fixtures
- **Plan 06-02 (Wave 1)**: Task type validation in outcomes + memory-manager spec updates -- validate store/recall for task_type, spec validation tests
- **Plan 06-03 (Wave 2)**: Archetype-weighted recommendation boosts -- aggregate task_type success rates, integrate into scoring, comprehensive test coverage
