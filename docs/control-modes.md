# Control Modes

## Overview

Control modes adjust how strictly Legion's authority matrix rules are enforced during agent execution. Set the mode in `settings.json` to match your workflow's trust level.

Each mode maps to a profile of five boolean flags defined in `.planning/config/control-modes.yaml`. These flags are consumed by the authority-enforcer and wave-executor skills at runtime.

## Quick Reference

| Mode | authority_enforcement | domain_filtering | human_approval_required | file_scope_restriction | read_only | Use When |
|------|----------------------|-------------------|------------------------|------------------------|-----------|----------|
| autonomous | false | false | false | false | false | Solo dev, rapid prototyping |
| guarded | true | true | true | false | false | Team workflows (default) |
| advisory | false | false | false | false | true | Code review, exploration |
| surgical | true | true | true | true | false | Production hotfixes, compliance |

## Mode Details

### autonomous

All enforcement is disabled. Agents operate with full autonomy -- no domain boundary checks, no approval gates, no file restrictions. Every agent can act on any finding and modify any file.

Use this mode for trusted solo workflows, rapid prototyping, or when speed matters more than guardrails. It is appropriate when you are the only person working on the codebase and you trust the agent recommendations fully.

Risk: without authority enforcement, agents may act outside their domain expertise. Without human approval gates, out-of-scope decisions proceed silently. Use only when you can review all changes yourself.

### guarded

The default mode. Authority boundaries are active: agents are validated against their domain ownership before acting. Domain filtering ensures review findings only include items within each agent's expertise. Human approval is required for out-of-scope decisions per the authority matrix escalation protocol.

This mode balances agent productivity with human oversight. Agents still operate independently within their domains, but cross-domain actions are caught and escalated. File scope is not restricted -- agents can modify files beyond the plan's `files_modified` list if the work falls within their domain.

Guarded is the recommended starting point for team workflows. It provides meaningful safety rails while keeping agents productive. Most projects should use this mode unless they have a specific reason to change.

### advisory

Read-only mode. Agents analyze the codebase and suggest changes but do not execute them. Auto-commit is suppressed. All findings are shown unfiltered since there is no risk of unauthorized action.

Use advisory mode for code review, architecture exploration, or learning a new codebase. It is also useful when you want agent analysis without any file modifications -- for example, running `/legion:review` to get feedback without automatic fixes.

Important: advisory mode relies on prompt-level instructions, not hard enforcement. The `read_only: true` flag injects constraints into agent prompts telling them not to modify files. There is no filesystem sandbox preventing writes. This is a soft control that depends on agent compliance.

### surgical

Maximum restriction. All enforcement flags are active plus file-scope restriction. Agents can only modify files explicitly listed in the plan's `files_modified` field. All changes require human confirmation. Domain filtering and authority enforcement are fully active.

Use surgical mode for production hotfixes, sensitive codebases, and compliance-critical changes where you need maximum control over what agents touch. Every modification is scoped and auditable.

File-scope enforcement is two-layered: (1) preventive via prompt injection, where agents are instructed to only touch listed files, and (2) detective via post-execution check, where the wave-executor verifies that no unlisted files were modified. The preventive layer is a soft control; the detective layer catches violations after the fact.

## Configuration

### Setting the Mode

Edit `settings.json` at the project root:

```json
{
  "control_mode": "guarded"
}
```

Valid values: `"autonomous"`, `"guarded"`, `"advisory"`, `"surgical"`.

The schema in `docs/settings.schema.json` validates the value. If `control_mode` is omitted, it defaults to `"guarded"`.

### Mode Profiles

Profiles are defined in `.planning/config/control-modes.yaml`. Each profile maps a mode name to its five boolean flags. The YAML file is the source of truth; the flags are loaded at runtime by the workflow-common-core settings resolution step.

### Fallback Behavior

If `.planning/config/control-modes.yaml` is missing or the specified mode is not found in the file, the system falls back to the guarded profile hardcoded as:

- `authority_enforcement: true`
- `domain_filtering: true`
- `human_approval_required: true`
- `file_scope_restriction: false`
- `read_only: false`

This ensures that a missing or corrupt configuration file results in safe defaults, not open access.

## How Modes Affect Commands

| Command | autonomous | guarded | advisory | surgical |
|---------|-----------|---------|----------|----------|
| `/legion:build` | Agents execute freely, no domain checks | Domain-validated execution, escalation for out-of-scope | Agents suggest only, no file writes | File-scoped execution, all changes confirmed |
| `/legion:review` | All findings unfiltered, no domain gates | Findings filtered by domain ownership | All findings shown (read-only, no risk) | Findings filtered, file scope checked |
| `/legion:quick` | Full autonomy on ad-hoc task | Authority checks applied | Read-only suggestions | Strict file scope + approval |

## Known Limitations

- Advisory mode is a soft control -- prompt instructions, not a filesystem sandbox
- Surgical mode's post-execution check detects but cannot prevent unauthorized file writes
- No partial overrides -- presets are all-or-nothing; you cannot set `authority_enforcement: true` with `domain_filtering: false` without editing the YAML directly
- Control modes do not affect planning commands (`/legion:plan`, `/legion:start`) -- only execution and review

## Choosing the Right Mode

Start with **guarded** (the default). It provides meaningful safety for team workflows without slowing agents down significantly.

Switch to **autonomous** when you are working solo and want maximum speed. You trust the agents and will review changes yourself.

Use **advisory** when you want analysis without action. Code review, architecture exploration, onboarding to a new codebase -- any scenario where understanding matters more than modification.

Choose **surgical** for high-stakes changes. Production hotfixes, regulated codebases, or any situation where an unauthorized file modification could cause real damage. The overhead is worth it when the cost of mistakes is high.
