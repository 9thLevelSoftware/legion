# Phase 25: Commands — Context

**Phase Goal:** Every command the user can type is a `/legion:` command — the `/agency:` namespace is gone
**Requirements:** CMD-01, CMD-02, CMD-03
**Target Files:** All 10 files in `commands/` (2,300 total lines)

## Decisions

### 1. Single Plan, Three Tasks

**Decision:** One plan (25-01) with 3 tasks following the max-3-tasks convention

- Task 1: Baseline verification (confirm 107 occurrences)
- Task 2: Transform all 10 files (atomic Write per file, immediate per-file verify)
- Task 3: Final cross-file verification + spot-checks

Rationale: All 10 files are independent (no inter-file dependencies), the substitution map is exhaustive, and the work is mechanical. Splitting into multiple plans adds overhead without benefit.

### 2. Atomic Write Per File

**Decision:** Read each file fully, apply ALL substitutions in memory, Write the complete file back

- Same pattern as Phase 24 (atomic Write prevents partial state)
- Each file verified with `grep -in "agency"` immediately after writing
- No incremental Edit calls — a file with 16 occurrences needs all 16 changed atomically

### 3. Article Change Handling

**Decision:** portfolio.md line 228 changes "an Agency" to "a Legion" (article correction for consonant sound)

- Only one article change exists across all 10 files
- Explicitly noted in the substitution map — not a blanket rule

### 4. Description Field Handling

**Decision:** Only advise.md has "Agency" in its frontmatter description — the other 9 are clean

- Do NOT apply blanket description changes
- Only transform lines explicitly listed in the substitution map

### 5. Processing Order

**Decision:** Process by density for easier context management (highest-density first), but order doesn't affect correctness

- Wave 1 (high density): status.md (16), build.md (15), review.md (15)
- Wave 2 (medium density): portfolio.md (13), start.md (11), quick.md (11)
- Wave 3 (low density): plan.md (8), milestone.md (8), advise.md (7), agent.md (3)

## Scope Boundaries

**In scope:**
- All text changes within the 10 `commands/*.md` files
- Every `/agency:` → `/legion:` replacement
- Every "Agency" → "Legion" replacement in prose
- Commit prefix updates (`feat(agency):` → `feat(legion):`)
- Filesystem path updates (`~/.claude/agency/` → `~/.claude/legion/`)
- GitHub label updates (`"agency"` → `"legion"`)
- Branch name pattern update (`agency/phase-` → `legion/phase-`)

**Out of scope (handled by later phases):**
- Skill file updates (Phase 26)
- Plugin manifest updates (Phase 27)
- Documentation updates (Phase 28)

## Deferred Ideas

None captured.

---
*Context created: 2026-03-02*
*Decisions: 5 locked, 0 deferred*
