# Phase 19: Registry Integration — Context

## Phase Goal

The agent-registry skill correctly resolves all 51 agent paths under the new plugin structure, so agent lookup, recommendation, and team assembly work without modification after installation.

## Requirements

- **AGENT-04**: Agent registry skill updated to reference new plugin-relative paths

## Success Criteria

1. The agent-registry skill lists all 51 agents using paths relative to the plugin root (`agents/` prefix)
2. `/agency:plan` successfully recommends agents by name and the referenced files exist at the resolved paths
3. `/agency:build` can inject agent personalities by reading from the new `agents/` location — no 404-equivalent file-not-found errors

## Existing Assets

### Already Correct (from Phase 18)
- `skills/agent-registry/SKILL.md` — all 51 catalog entries use `agents/{id}.md` paths
- All commands load the registry via `<execution_context>` with `skills/agent-registry/SKILL.md`
- `skills/wave-executor/SKILL.md` — uses `agents/{agent-id}.md` for personality injection
- `skills/review-loop/SKILL.md` — uses `agents/{agent-id}.md` for reviewer loading
- All 51 agent `.md` files are present in `agents/` directory
- Zero stale `agency-agents/` or `.claude/skills/agency/` paths in active commands/skills

### Needs Attention
- Multiple skills reference registry as shorthand `agent-registry.md` in prose — functionally harmless but inconsistent with actual path `skills/agent-registry/SKILL.md`
- No verification script exists to prove the full recommend → resolve → read chain works
- REQUIREMENTS.md and ROADMAP.md status checkboxes need updating for completed phases

## Key Decisions

- Phase 19 is primarily **verification and cleanup**, not major refactoring — Phase 18 already updated all agent paths
- Verification uses bash scripts that can be run to prove correctness (no manual inspection)
- Prose shorthand `agent-registry.md` in skills is left as-is — it's documentation, not executable paths, and the registry is loaded via `<execution_context>` in commands

## Plan Structure

- **Plan 19-01** (Wave 1): Verify registry completeness, validate end-to-end path resolution, update project state
