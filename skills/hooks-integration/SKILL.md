---
name: hooks-integration
description: Claude Code hooks for automated Legion lifecycle events
triggers: [hooks, automation, lifecycle, pre-build, post-build]
token_cost: low
summary: "Defines Claude Code hook configurations that automate Legion lifecycle events. Pre-build validates plans, post-build records outcomes, pre-ship runs security scans."
---

# Hooks Integration

Defines Claude Code hook configurations for automating Legion lifecycle events. Hooks are opt-in — users configure them in their Claude Code settings. This skill documents the recommended hooks and their behavior.

---

## Section 1: Overview

Claude Code hooks execute shell commands before or after specific events (tool calls, commands, etc.). Legion leverages hooks for:

1. **Pre-build validation** — validate plan schemas before execution starts
2. **Post-build outcome recording** — auto-record outcomes to memory after builds
3. **Pre-ship security gate** — run security scan before ship pipeline
4. **Post-commit state update** — update STATE.md progress after commits

Hooks are configured in `.claude/settings.json` (project-level) or `~/.claude/settings.json` (global). Users must opt in — Legion never auto-installs hooks.

---

## Section 2: Recommended Hook Configurations

### 2.1: Pre-Build Plan Validation

Validates plan file integrity before `/legion:build` executes.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Agent",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const fs=require('fs'); const p='.planning/STATE.md'; if(!fs.existsSync(p)){process.exit(0)} const s=fs.readFileSync(p,'utf8'); if(!s.includes('Current')){console.error('STATE.md malformed'); process.exit(1)}\"",
            "description": "Legion: validate STATE.md before agent spawn"
          }
        ]
      }
    ]
  }
}
```

**When**: Before any Agent tool call (catches build agent spawns)
**What**: Checks STATE.md exists and has required structure
**On failure**: Blocks the agent spawn, displays error

### 2.2: Post-Build Outcome Notification

Notifies the user when a build phase completes.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Agent",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Legion: Agent task completed'",
            "description": "Legion: notify on agent completion"
          }
        ]
      }
    ]
  }
}
```

**When**: After any Agent tool call completes
**What**: Simple notification (can be extended to trigger memory recording)
**Note**: Full outcome recording still happens in the build command — this hook is informational

### 2.3: Pre-Ship Security Gate

Runs a lightweight security check before `/legion:ship` creates a PR.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const cmd=process.env.CLAUDE_TOOL_INPUT||''; if(cmd.includes('gh pr create')){const r=require('child_process').execSync('npm audit --audit-level=critical 2>/dev/null',{encoding:'utf8',stdio:'pipe'}); if(r.includes('critical')){console.error('CRITICAL vulnerabilities found. Run npm audit fix before shipping.'); process.exit(1)}}\"",
            "description": "Legion: security gate before PR creation"
          }
        ]
      }
    ]
  }
}
```

**When**: Before any Bash call that includes `gh pr create`
**What**: Runs `npm audit` and blocks if critical vulnerabilities found
**On failure**: Blocks PR creation with security warning

---

## Section 3: Installation Guide

### For Users

To enable Legion hooks, add the desired hook configurations to your project's `.claude/settings.json`:

1. Open or create `.claude/settings.json` in the project root
2. Add the `hooks` section with desired configurations from Section 2
3. Hooks activate immediately on the next Claude Code session

### Configuration Tips

- Start with just the pre-build validation hook — it's the lowest-risk, highest-value
- The pre-ship security gate may produce false positives on projects with known audit issues
- Hooks run synchronously — keep commands fast (under 2 seconds)
- Use `process.exit(0)` to pass silently, `process.exit(1)` to block with error

### Removing Hooks

Delete the `hooks` section from `.claude/settings.json`. Hooks deactivate immediately.

---

## Section 4: Integration with Legion Commands

| Command | Hook Point | Purpose |
|---------|-----------|---------|
| `/legion:build` | PreToolUse (Agent) | Validate plans before spawning build agents |
| `/legion:build` | PostToolUse (Agent) | Notify on agent completion |
| `/legion:ship` | PreToolUse (Bash) | Security gate before PR creation |
| `/legion:review` | PostToolUse (Agent) | Notify when review agents complete |

### What Hooks Do NOT Replace

Hooks are lightweight automation. They do NOT replace:
- The full security-review skill (hooks run simple checks; the skill runs comprehensive OWASP analysis)
- The memory-manager outcome recording (hooks notify; the skill records structured outcomes)
- The authority-enforcer boundary checks (hooks can't access plan file context)

---

## Section 5: Graceful Degradation

- If hooks are not configured: Legion operates identically to pre-hook behavior
- If a hook command fails to execute (not found, permission denied): Claude Code logs the error and continues
- Hooks are Claude Code-specific — other CLI adapters ignore this skill entirely
- Hook configurations in this skill are recommendations, not requirements
