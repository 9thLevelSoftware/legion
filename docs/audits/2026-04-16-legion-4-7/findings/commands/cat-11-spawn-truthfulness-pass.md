# CAT-11 Spawn-Truthfulness Pass Results

**Date:** 2026-05-04
**Validator:** `scripts/validate-command-spawn-truthfulness.js`
**Scope:** All 17 `commands/*.md` files

## Result: PASS (17/17)

All command files satisfy the spawn-truthfulness contract:

| File | Status | Reason |
|------|--------|--------|
| `advise.md` | PASS | `adapter.spawn_agent_readonly` dispatch present |
| `agent.md` | EXEMPT | no spawn-flavored language |
| `board.md` | EXEMPT | no spawn-flavored language |
| `build.md` | EXEMPT | no spawn-flavored language |
| `explore.md` | PASS | `mode: inline-persona` declared |
| `learn.md` | EXEMPT | no spawn-flavored language |
| `milestone.md` | EXEMPT | no spawn-flavored language |
| `plan.md` | EXEMPT | no spawn-flavored language |
| `portfolio.md` | EXEMPT | no spawn-flavored language |
| `quick.md` | PASS | `adapter.spawn_agent_personality` dispatch present |
| `retro.md` | EXEMPT | no spawn-flavored language |
| `review.md` | EXEMPT | no spawn-flavored language |
| `ship.md` | EXEMPT | no spawn-flavored language |
| `start.md` | EXEMPT | no spawn-flavored language |
| `status.md` | EXEMPT | no spawn-flavored language |
| `update.md` | EXEMPT | no spawn-flavored language |
| `validate.md` | EXEMPT | no spawn-flavored language |

## Validator Fix Applied

The `AGENT_INVOCATION_PATTERN` regex was expanded to recognize `adapter.spawn_agent_*` as a valid dispatch mechanism (adapter-agnostic equivalent of `Agent()`). This prevents false positives for commands that correctly dispatch via the multi-CLI adapter abstraction.

## Prior Defects Resolved

- `commands/explore.md` — refactored to `mode: inline-persona` in commit `f45cf4f`
- `commands/advise.md` — correctly uses `adapter.spawn_agent_readonly` (no change needed)
- `commands/quick.md` — correctly uses `adapter.spawn_agent_personality` (no change needed)
