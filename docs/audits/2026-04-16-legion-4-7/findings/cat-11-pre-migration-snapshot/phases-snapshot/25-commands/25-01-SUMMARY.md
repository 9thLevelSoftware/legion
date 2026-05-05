---
phase: 25-commands
plan: 01
status: complete
completed: "2026-03-02"
---

# Plan 25-01: Commands Namespace Rebrand — Summary

## Status: Complete

All 10 command files rebranded from `/agency:` to `/legion:` namespace.

## What Was Done

Applied 107 text substitutions across 10 command files in `commands/`:

| File | Occurrences | Patterns |
|------|-------------|----------|
| advise.md | 7 | A(1), B(5), C(1) |
| agent.md | 3 | A(1), B(1), C+B(1) |
| build.md | 15 | A(1), B(8), C(2), D(3), E(1) |
| milestone.md | 8 | A(1), B(4), C(1), D(2) |
| plan.md | 8 | A(1), B(5), E(2) |
| portfolio.md | 13 | A(1), B(4), C(3), E(5) |
| quick.md | 11 | A(1), B(4), D(6) |
| review.md | 15 | A(1), B(10), C(1), D(2) |
| start.md | 11 | A(1), B(2), C(2), E(5) + E(1 implicit via B) |
| status.md | 16 | A(1), B(13), C(1) |
| **Total** | **107** | A(10), B(68), C(12), D(12), E(15) |

## Substitution Patterns

- **Pattern A**: 10 frontmatter `name:` declarations (`agency:{cmd}` → `legion:{cmd}`)
- **Pattern B**: 68 command references (`/agency:X` → `/legion:X`)
- **Pattern C**: 12 brand prose instances ("Agency" → "Legion")
- **Pattern D**: 12 commit message prefixes (`feat(agency):` → `feat(legion):`)
- **Pattern E**: 15 filesystem paths, GitHub labels, branch names

## Verification Results

| Check | Result |
|-------|--------|
| Zero "agency" remnants (case-insensitive) | PASS — 0 hits |
| Legion counts match baseline | PASS — all 10 files ≥ expected |
| Frontmatter names correct | PASS — all 10 declare `legion:{cmd}` |
| Commit prefixes clean | PASS — 0 `agency)` hits |
| Article correction (portfolio.md:228) | PASS — "a Legion" (not "an") |
| GitHub label (plan.md:206,213) | PASS — `"legion"` |
| Branch pattern (build.md:273) | PASS — `legion/phase-{NN}-{slug}` |
| Filesystem paths (portfolio+start) | PASS — 10 `~/.claude/legion/` hits |

## Files Modified

- `commands/advise.md`
- `commands/agent.md`
- `commands/build.md`
- `commands/milestone.md`
- `commands/plan.md`
- `commands/portfolio.md`
- `commands/quick.md`
- `commands/review.md`
- `commands/start.md`
- `commands/status.md`

## Requirements Covered

- CMD-01: All 10 command files use `/legion:` namespace
- CMD-02: Cross-command references point to `/legion:` equivalents
- CMD-03: Commit message prefixes updated to `feat(legion):` / `chore(legion):`
