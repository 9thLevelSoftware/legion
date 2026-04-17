---
name: legion:workflow-common-core
description: Lean core conventions and path contracts used by all /legion: commands
triggers: [common, core, paths, state, conventions]
token_cost: low
summary: "Lean always-load core for command execution: CLI adapter detection, state file paths, settings resolution, agent path resolution, and base command mapping."
---

# Legion Workflow Common Core

Always-load core conventions for every `/legion:` command. This file is intentionally compact.

## Core Responsibilities
- Detect and load the active runtime adapter before command-specific logic.
- Resolve canonical state file paths under `.planning/`.
- Resolve `settings.json` defaults safely when file is missing or invalid.
- Resolve `AGENTS_DIR` once per invocation before loading personality files.
- Provide baseline command-to-skill mapping and context budget ceilings.

## Adapter Detection (Core)

1. Check `.legion-cli` override in project root.
2. If absent, evaluate adapter primary detections from `adapters/*.md`.
3. If no primary match, evaluate adapter secondary detections.
4. If still no match, default to Claude Code adapter.
5. Read the full adapter file and use adapter-defined tool mapping/model settings.

## User Interaction (Core)

**CRITICAL**: When commands or skills reference `adapter.ask_user`, `Use adapter.ask_user`, or instruct you to ask the user a question with structured choices, you MUST use the `AskUserQuestion` tool. Do NOT output questions as raw text and wait for a reply. The `AskUserQuestion` tool provides structured selection UI (arrow keys + Enter) which is the intended interaction model for all Legion commands.

For Claude Code, `adapter.ask_user` maps to:
```
AskUserQuestion(questions: [{
  question: "Your question here",
  options: [
    {label: "option-1", description: "Description of option 1"},
    {label: "option-2", description: "Description of option 2"}
  ]
}])
```

This applies to ALL question prompts in ALL commands — confirmation gates, mode selection, workflow preferences, and any other structured choice.

## State Paths (Core)

| File | Path | Purpose |
|------|------|---------|
| PROJECT.md | `.planning/PROJECT.md` | Vision, requirements, constraints |
| ROADMAP.md | `.planning/ROADMAP.md` | Phase sequence and plan tracking |
| STATE.md | `.planning/STATE.md` | Current state and next action |
| REQUIREMENTS.md | `.planning/REQUIREMENTS.md` | Expanded requirement details |
| Phase plans | `.planning/phases/{NN-name}/` | PLAN/SUMMARY/CONTEXT files |

## Settings Resolution (Core)

Read `settings.json` from repo root if available. If missing/invalid, use defaults.

Defaults:
- `planning.max_tasks_per_plan = 3`
- `review.max_cycles = 3`
- `execution.agent_personality_verbosity = "full"`
- `integrations.github = "prompt"`
- `memory.enabled = true`
- `memory.project_scoped_only = true`
- `control_mode = "guarded"`

### Mode Profile Resolution

After resolving `control_mode` from settings (default: `"guarded"`), load the corresponding profile:

**Preconditions (MUST be verified before use):**
1. `control_mode` key lookup is CASE-SENSITIVE. Valid values: exactly `"autonomous"`, `"guarded"`, `"advisory"`, `"surgical"`. Case variants (`"Guarded"`, `"GUARDED"`) are invalid — if detected, log warning and fall back to `"guarded"`.
2. The 5-flag schema is a strict contract with downstream consumers (authority-enforcer, wave-executor). All 5 keys MUST be present in the resolved profile.
3. Partial profiles (missing 1+ flags) trigger: log WARNING `"control-mode profile '{name}' missing flags: {list}. Falling back to guarded defaults for missing flags."` and merge with hardcoded guarded defaults for only the missing flags. Do NOT fall back to guarded entirely — use the profile's provided flags where set.

**Resolution steps:**
1. Read `.planning/config/control-modes.yaml` explicitly via the Read tool. Capture raw bytes; do NOT assume content.
2. If the file does not exist at that path: do NOT silently fall back. Emit `<escalation>severity: warning, type: infrastructure, decision: control-modes.yaml missing — falling back to hardcoded guarded defaults, context: .planning/config/control-modes.yaml not found; downstream gates will use hardcoded guarded flags</escalation>` and continue with the hardcoded guarded fallback below.
3. If the file exists but cannot be parsed as YAML: emit `<escalation>severity: blocker, type: infrastructure, decision: Cannot resolve control mode, context: control-modes.yaml present but YAML parse failed</escalation>` and STOP.
4. Look up `profiles[control_mode]` to get the flag set (exact key match, case-sensitive).
5. If the mode key is not found: emit `<escalation>severity: warning, type: infrastructure, decision: control_mode '{name}' not defined in control-modes.yaml — using hardcoded guarded defaults, context: settings.json declared control_mode that is absent from profiles</escalation>` and fall back to hardcoded guarded.
6. Hardcoded guarded fallback flags:
   - `authority_enforcement: true`, `domain_filtering: true`, `human_approval_required: true`, `file_scope_restriction: false`, `read_only: false`
7. **Assert** the resolved profile contains all 5 flags before passing downstream. If assertion fails (partial profile), merge with guarded defaults for missing flags and log the merge.
8. Pass resolved profile to authority-enforcer and wave-executor integration points.

The resolved profile is a set of 5 boolean flags: `authority_enforcement`, `domain_filtering`, `human_approval_required`, `file_scope_restriction`, `read_only`. This schema is the contract with downstream skills — adding or removing flags is a breaking change.

## Agent Path Resolution (Core)

Resolve once per command invocation by **actually reading the probe file** (not assuming):

1. **Use the Read tool** on `~/.claude/agents/agents-orchestrator.md` (global install — preferred path)
   - If Read succeeds: set `AGENTS_DIR = ~/.claude/agents` and STOP resolution. This is the standard installed location and should work for all npm-installed Legion users.
2. Only if step 1 returns a file-not-found error: **Use the Read tool** on `agents/agents-orchestrator.md` (local dev mode)
   - If Read succeeds: set `AGENTS_DIR = agents` (relative to project root)
3. Only if both fail: check manifests `~/.claude/legion/manifest.json` then `~/.legion/manifest.json` for an `agents_dir` key
4. If none found: fail fast with: "Agent files not found. Run: npm install -g @anthropic/legion"

**CRITICAL**: Do NOT skip the Read probe. Do NOT assume a path doesn't exist without trying it. Do NOT claim "agent files aren't on disk" without a real file-not-found error from the Read tool. The global install path (`~/.claude/agents/`) contains all 48 agent files for any npm-installed Legion instance.

Use resolved path for all personality reads:
`{AGENTS_DIR}/{agent-id}.md`

## Personality Injection (Core)

- **Retrieval-led reasoning**: ALWAYS read the agent personality file before spawning. Do NOT substitute pre-trained knowledge for the personality file contents. The Dynamic Knowledge Index in AGENTS.md provides the complete file map — use it to locate agent files by division, then Read the full file. This is non-negotiable.
- Load full personality markdown for assigned agent.
- Inject personality content + task instructions into adapter spawn prompt.
- Use `adapter.model_execution` for execution agents unless command overrides it.

## Command-to-Skill Mapping (Core)

| Command | Always Loads | Conditionally Loads |
|---------|-------------|-------------------|
| `/legion:start` | workflow-common-core, questioning-flow, agent-registry, portfolio-manager, codebase-mapper | workflow-common-domains |
| `/legion:plan` | workflow-common-core, agent-registry, phase-decomposer | memory-manager, github-sync, codebase-mapper, plan-critique, spec-pipeline, workflow-common-memory, workflow-common-github, workflow-common-domains |
| `/legion:build` | workflow-common-core, agent-registry, wave-executor, execution-tracker | memory-manager, github-sync, codebase-mapper, workflow-common-memory, workflow-common-github |
| `/legion:review` | workflow-common-core, agent-registry, review-loop, review-panel, execution-tracker | memory-manager, github-sync, design-workflows, workflow-common-memory, workflow-common-github, workflow-common-domains |
| `/legion:status` | workflow-common-core, execution-tracker, milestone-tracker | memory-manager, github-sync, codebase-mapper, workflow-common-memory, workflow-common-github |
| `/legion:quick` | workflow-common-core, agent-registry | workflow-common-domains |
| `/legion:portfolio` | workflow-common-core, portfolio-manager | workflow-common-github |
| `/legion:milestone` | workflow-common-core, milestone-tracker, execution-tracker | github-sync, workflow-common-github |
| `/legion:agent` | workflow-common-core, agent-registry, agent-creator | workflow-common-domains |
| `/legion:advise` | workflow-common-core, agent-registry | workflow-common-domains |
| `/legion:board`     | workflow-common-core, agent-registry, board-of-directors, cli-dispatch | workflow-common-memory, workflow-common-github |
| `/legion:retro` | workflow-common-core, memory-manager, execution-tracker | workflow-common-memory |
| `/legion:ship` | workflow-common-core, ship-pipeline, execution-tracker | github-sync, workflow-common-github |
| `/legion:learn` | workflow-common-core, memory-manager | workflow-common-memory |
| `/legion:update` | workflow-common-core | workflow-common-github |
| `/legion:validate` | workflow-common-core, agent-registry | (none) |

## Context Budget Ceiling (Core)

Execution-context budgets (always-load skills only):
- `build`: soft 180 KB, hard 225 KB
- `plan`: soft 180 KB, hard 225 KB
- `review`: soft 180 KB, hard 225 KB
- `status`: soft 120 KB, hard 150 KB

Release checks enforce hard ceilings and print telemetry for every command. Agent line-count remains telemetry, not a gate.

## State File Quick Validation

Lightweight validation that runs at the start of every command that loads project context. Fast enough to not add noticeable latency (pattern matching only, no full parse).

### Trigger
Runs automatically after loading PROJECT.md, ROADMAP.md, and STATE.md in the standard context loading step. Only runs for commands that load these files (i.e., commands with `@.planning/PROJECT.md`, `@.planning/ROADMAP.md`, or `@.planning/STATE.md` in their `<context>` block). Commands that do not load project state (e.g., `/legion:update`) skip this entirely.

### Checks

1. **PROJECT.md format check**
   - Verify file starts with `# ` (has a title)
   - Verify file contains `## Requirements` or `## Goals` section header
   - If missing: warn "PROJECT.md may be malformed — missing title or requirements section"

2. **ROADMAP.md format check**
   - Verify file contains a markdown table with at least one `|` row
   - Verify table has "Phase" and "Status" columns (case-insensitive header match)
   - If missing: warn "ROADMAP.md may be malformed — missing phase table"

3. **STATE.md format check**
   - Verify file contains "Current" (case-insensitive) somewhere in first 10 lines
   - If missing: warn "STATE.md may be malformed — missing current position section"

### Behavior on Failure
- Warnings are displayed once per session
- Warnings do NOT block command execution (graceful degradation)
- For full validation: direct user to `/legion:validate`
- Message format: "State file warning: {message}. Run `/legion:validate` for full diagnostics."
- If a state file does not exist at all, skip its check silently (file-not-found is handled by the command's own project existence check, not by quick validation)
