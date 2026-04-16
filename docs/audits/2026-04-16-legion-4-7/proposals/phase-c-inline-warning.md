# Phase C — Inline-Command Model-Mismatch Warning

**Status:** Draft
**Resolves:** LEGION-47-078 (UX layer)
**Depends on:** Phase B (commands must declare `model:` and `execution_mode:`)
**Sequencing:** Land after Phase B
**Backward compat:** Full — warning is informational, never blocks execution

---

## Problem

Inline-executing commands (`start`, `explore`, `plan`, `status`, etc.) declare a `model:` tier in frontmatter (Phase B), but Claude Code does not permit programmatic model swap mid-session. So the declared field is **advisory only** for inline commands. Without a warning, users will assume `model: planning` actually forces opus when running `/legion:plan` on a sonnet session — and silently get sonnet.

Phase C adds a one-shot warning at command entry that surfaces the mismatch and tells the user how to resolve it.

---

## Hunk 1 — Inline-warning skill

### Hunk 1a — New file: `skills/inline-model-warning/SKILL.md`

```markdown
---
name: inline-model-warning
description: Warn when an inline-executing command's declared model tier mismatches the active session model
trigger: command-entry
applies-to: commands with execution_mode = inline
---

# Inline Model Warning Skill

## Purpose

Inline-executing commands inherit the active Claude Code session model. They cannot programmatically swap models. When such a command declares `model: <tier>` in frontmatter and the resolved model differs from the session model, this skill surfaces a one-line warning so the user can choose whether to proceed, swap models, or update settings.

## Trigger

Invoked by `cli-dispatch` immediately after Part 0 (Model resolution), but only when:
- `command.frontmatter.execution_mode == "inline"`
- `RESOLVED_MODEL != session_model`
- `settings.json models.suppress_inline_warning != true`

## Resolution Algorithm

```
1. Detect session model:
   - For Claude Code adapter: read CLAUDE_CODE_SESSION_MODEL env var
     (fallback: invoke `claude --version` or assume sonnet if undetectable)
   - For other adapters: skip — warning only fires on adapters that report session model

2. Compare:
   - If RESOLVED_MODEL == session_model → no warning
   - If RESOLVED_MODEL != session_model → emit warning

3. Emit warning (single block, no blocking):
   ⚠ /legion:{command} declared model: {tier} ({resolved_model}) but session is on {session_model}.
     This command runs inline — model selection cannot be overridden mid-session.
     Options:
       1. Switch session model: /model {resolved_model} (then re-run /legion:{command})
       2. Pin session model in settings.json: {"models":{"{tier}":"{session_model}"}}
       3. Suppress this warning: {"models":{"suppress_inline_warning":true}} in settings.json
     Proceeding on {session_model}...

4. Log to .planning/observability/decisions.log:
   {timestamp} inline-model-warning command={command} declared={resolved_model} actual={session_model}
```

## Suppression

Three suppression levels:

- **Per-invocation:** Pass `--no-model-warning` flag to the command (Phase C2)
- **Per-project:** Set `models.suppress_inline_warning: true` in settings.json
- **Per-command:** Set `model: same-as-session` in command frontmatter (overrides declared tier)

## Adapter capability gate

Only fires for adapters with `reports_session_model: true` in capability frontmatter.
Adapters without session-model introspection (Codex CLI, Cursor, Aider) skip the warning entirely.
```

### Hunk 1b — `cli-dispatch` integration

In `skills/cli-dispatch/SKILL.md` Section 3, after Part 0 (Model resolution), add:

```
Part 0.5: Inline mismatch warning (Phase C)
  - If command.frontmatter.execution_mode != "inline": skip
  - If adapter.reports_session_model != true: skip
  - If settings.json models.suppress_inline_warning == true: skip
  - Invoke skills/inline-model-warning/SKILL.md with:
      command_name, RESOLVED_MODEL, session_model
  - Skill emits warning if mismatch; never blocks execution
  - Continue to Part 1 regardless
```

---

## Hunk 2 — Adapter capability extension

### Hunk 2a — `adapters/ADAPTER.md`

Add to "Capabilities (YAML frontmatter)" table:

```
| `reports_session_model` | boolean | Whether the adapter can detect the active session's model at runtime (e.g., Claude Code via env var, Codex CLI does not currently expose this). When false, Phase C inline-warning skill skips this adapter. |
```

### Hunk 2b — `adapters/claude-code.md`

Add to frontmatter:

```yaml
reports_session_model: true
```

Add to "Tool Mappings" table:

```
| `detect_session_model` | Read `CLAUDE_CODE_SESSION_MODEL` env var; fallback to assuming `sonnet` and emitting a `model-detection-failed` log entry. |
```

### Hunk 2c — Other adapters

| Adapter | `reports_session_model` | Notes |
|---------|--------------------------|-------|
| `claude-code` | `true` | Env var available |
| `codex-cli` | `false` | No session-model introspection in current Codex CLI |
| `copilot-cli` | `false` | TBD — investigate `gh copilot --version` output |
| `cursor` | `false` | Cursor model picker is UI-only, not introspectable from a command |
| `gemini-cli` | `true` | Gemini CLI exposes model via `--show-config` |
| `kiro-cli` | `false` | TBD |
| `opencode` | `false` | TBD |
| `windsurf` | `false` | Same as Cursor |
| `aider` | `true` | Aider config is file-based (`.aider.conf.yml`), readable |

---

## Hunk 3 — Settings schema extension

### Hunk 3a — `docs/settings.schema.json`

Add to `models` object properties:

```json
"suppress_inline_warning": {
  "type": "boolean",
  "default": false,
  "description": "Suppress the Phase C warning that fires when an inline-executing command's declared model tier mismatches the active session model."
}
```

---

## Hunk 4 — Command-level suppression token (optional)

For users who want to mark a command as "always honor the session model":

### Hunk 4a — Frontmatter token: `same-as-session`

In Phase B's frontmatter spec, document that `model:` accepts the special value `same-as-session`:

```yaml
model: same-as-session    # Honor whatever the session is on; suppress warning
```

In `cli-dispatch` Part 0:

```
- If command.frontmatter.model == "same-as-session":
    RESOLVED_MODEL = session_model (if reports_session_model) OR adapter.model_execution
    Skip Phase C warning
```

---

## Hunk 5 — Verification

```bash
# 1. Confirm inline-warning skill exists
ls skills/inline-model-warning/SKILL.md

# 2. Confirm cli-dispatch integration
grep -n 'inline-model-warning\|Part 0.5' skills/cli-dispatch/SKILL.md
# Expected: 2+ hits

# 3. Confirm reports_session_model on adapters
grep -n 'reports_session_model' adapters/*.md
# Expected: 9 hits

# 4. Confirm settings schema
grep -n 'suppress_inline_warning' docs/settings.schema.json
# Expected: 1 hit

# 5. Smoke test
#   Setup: settings.json models.planning_tier_resolves_to opus, session model = sonnet
#   Run: /legion:plan 1
#   Expected: warning fires before decomposition starts, command proceeds on sonnet
#   Set: models.suppress_inline_warning = true
#   Re-run: /legion:plan 1
#   Expected: no warning, command proceeds on sonnet

# 6. Decision log
tail -20 .planning/observability/decisions.log | grep inline-model-warning
# Expected: entries from the smoke test above
```

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Warning fires too often, user fatigue | Three suppression levels (per-invocation flag, project setting, frontmatter token); decision log captures actual trigger frequency for tuning |
| Session-model detection unreliable on some adapters | `reports_session_model: false` opt-out per adapter; warning silently skipped |
| User dismisses the warning and forgets which model they're on | Decision log retains the actual model used; `/legion:status` could surface a "current effective model" line |
| Warning misclassifies session model (e.g., env var stale) | Add fallback log entry `model-detection-failed`; warning prefixed with "(detection uncertain)" in fallback path |

---

## Out of scope for Phase C

- Auto-prompting the user to run `/model` mid-flow (would block execution; out of scope for an advisory warning)
- Per-agent inline warnings (agents are spawned, not inline — N/A)
- Cost telemetry for mismatch frequency → Phase F+
