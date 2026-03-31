---
cli: aider
cli_display_name: "Aider"
version: "1.0"
support_tier: "community-contributed"
capabilities:
  parallel_execution: false
  agent_spawning: false
  structured_messaging: false
  native_task_tracking: false
  read_only_agents: true
detection:
  primary: ".aider.conf.yml exists in CWD or HOME"
  secondary: "AGENTS.md or CONVENTIONS.md exists in CWD"
max_prompt_size: 128000
known_quirks:
  - "no-agent-spawning"
  - "no-parallel-execution"
  - "single-session-only"
  - "no-mcp-support"
---

# Aider Adapter

Aider is a single-agent pair-programming tool with `/ask`, `/architect`, and convention files. Legion treats Aider as manual-only because there is no official native Legion command, agent, or plugin discovery surface to install into. This adapter documents the fallback behavior, but the automated installer does not register native Legion artifacts for Aider.

## Tool Mappings

| Generic Concept | Implementation |
|-----------------|---------------|
| `spawn_agent_personality` | No subagent spawning. Prepend the personality content to the current session context, then execute the plan tasks inline using `/code` mode. |
| `spawn_agent_autonomous` | Execute the plan tasks directly in `/code` mode. |
| `spawn_agent_readonly` | Switch to `/ask` mode — Aider's ask mode does not modify files. Provide personality + task in the prompt. |
| `coordinate_parallel` | Not available. All plans execute sequentially. |
| `collect_results` | After each plan, write a structured result to `.planning/phases/{NN}/{NN}-{PP}-RESULT.md`. |
| `shutdown_agents` | No-op. |
| `cleanup_coordination` | No-op. |
| `ask_user` | Print numbered choices in plain text and wait for user input. |
| `model_planning` | User-configured architect model (e.g., `claude-opus-4-6`, `o1`) |
| `model_execution` | User-configured editor model (e.g., `claude-sonnet-4-6`, `deepseek-v3`) |
| `model_check` | User-configured lightweight model (e.g., `claude-haiku-4-5`, `o1-mini`) |
| `global_config_dir` | `~/.aider.conf.yml` plus repo-level `AGENTS.md` or `CONVENTIONS.md` |
| `plugin_discovery_glob` | Manual-only — no native Legion discovery surface; use `AGENTS.md`, `CONVENTIONS.md`, and the Legion manual checklist instead |
| `commit_signature` | `Co-Authored-By: Aider <noreply@aider.chat>` |

## Interaction Protocol

Print numbered choices in plain text and wait for user response. Parse the integer from the user's message. Re-prompt on invalid input (max 2 retries).

## Execution Protocol

### Phase Initialization

Manual setup only. If the user chooses to run Legion conventions in Aider, write a wave checklist to `.planning/phases/{NN}/WAVE-CHECKLIST.md` after loading the relevant Legion workflow file by hand.

### Wave Execution

All plans execute sequentially in the current session:
1. For each plan in the wave:
   a. Read the plan file
   b. If assigned agent: read personality file, adopt as behavioral context
   c. Use `/code` mode to execute the plan's implementation tasks
   d. After each task, verify using the plan's verification commands
   e. Write result to `.planning/phases/{NN}/{NN}-{PP}-RESULT.md`
2. Update WAVE-CHECKLIST.md

### Architect Mode Integration

Aider's architect mode (a reasoning model plans, then an editor model implements) aligns naturally with Legion's planning/execution split:
- `/architect` mode can be used for `/legion:plan` phases — the reasoning model generates plans
- `/code` mode handles `/legion:build` execution

### Limitations

- **No file context injection**: Files must be added manually via `/add`
- **No shell execution**: Aider cannot run verification commands directly — the user must run them
- **No native Legion installer surface**: Legion cannot register commands or agents automatically in Aider
- **No MCP support**: Cannot extend with external tool servers
- **Weakest personality isolation**: Single session with no context separation between plans

### Result Collection

Read result files after each plan. Parse Status field.

### Phase Cleanup

No cleanup needed. Update checklist.

## Manual Operation Guide

Aider cannot automate Legion workflows. This guide walks through using Legion conventions manually inside Aider sessions.

### Prerequisites

1. Legion must be installed via another CLI (e.g., Claude Code) to generate `.planning/` artifacts.
2. Aider must be configured with a capable model (e.g., `claude-sonnet-4-6` or `gpt-4.1`).
3. The project repository must contain `.planning/` state files from a prior `/legion:plan` run.

### Step-by-Step: Executing a Legion Plan in Aider

1. **Open the plan file**: Start an Aider session and run `/read .planning/phases/{NN}-{slug}/{NN}-{PP}-PLAN.md` to load the plan as context.
2. **Load the agent personality**: Run `/read .legion/agents/{agent-id}.md` (or the equivalent path) to adopt the assigned agent's behavioral context.
3. **Add target files**: Run `/add {file1} {file2} ...` for each file listed in the plan's `files_modified` section. Aider requires explicit file addition — it cannot discover files automatically.
4. **Switch to code mode**: Run `/code` to enable file editing.
5. **Execute tasks sequentially**: For each task in the plan:
   - Paste or describe the task's action instructions from the plan file
   - Let Aider generate the implementation
   - Review the diff before accepting
6. **Run verification manually**: After each task, open a separate terminal and run the plan's `verification_commands`. Aider cannot execute shell commands.
7. **Write the result file**: After completing all tasks, create `.planning/phases/{NN}/{NN}-{PP}-RESULT.md` with:
   ```
   Status: complete
   Files Modified: {list}
   Verification: {pass/fail for each command}
   Notes: {any deviations from plan}
   ```
8. **Repeat for next plan**: If the wave has additional plans, repeat from step 1.

### Step-by-Step: Advisory Session in Aider

1. Run `/ask` to enter read-only mode.
2. Paste the agent personality content as context.
3. Describe your topic and ask for structured advice.
4. Aider will respond without modifying files — `/ask` mode is read-only.

### What Works Well in Aider

- **Single-plan execution**: Loading one plan and one personality works reliably in `/code` mode.
- **Advisory via /ask mode**: Read-only consultation matches `/legion:advise` behavior.
- **Architect mode for planning**: `/architect` mode aligns with Legion's planning tier — a reasoning model plans, then an editor model implements.
- **Git integration**: Aider's built-in git commit support means plan results are committed automatically.

## Limitations (Comprehensive)

| Limitation | Impact | Severity |
|-----------|--------|----------|
| **No agent spawning** | Cannot spawn subagents. Every plan must be executed manually in the current session. Multi-agent coordination is not possible. | Critical |
| **No parallel execution** | All plans execute sequentially in a single session. Wave parallelism requires manually opening multiple Aider sessions in separate terminals. | Critical |
| **No structured messaging** | No `ask_user` mechanism — prompts are plain text. User interaction patterns from other adapters (numbered choices, confirmation gates) must be done conversationally. | High |
| **No shell execution** | Aider cannot run verification commands, test suites, or build scripts. All verification must be done manually by the user in a separate terminal. | High |
| **No native installer surface** | Legion's `npx @9thlevelsoftware/legion --aider` installs convention files but cannot register native commands. There is no `/legion-start` equivalent — users must invoke workflows manually. | High |
| **No MCP support** | Cannot extend with external tool servers. Features that depend on MCP integrations are unavailable. | Medium |
| **Weak personality isolation** | Single session with no context boundary between plans. If executing multiple plans sequentially, personality bleed-through can occur — the agent from Plan 1 may influence Plan 2. | Medium |
| **No file context injection** | Files must be added manually via `/add`. Forgetting to add a file means Aider cannot read or edit it. | Medium |
| **No automatic wave handoff** | SUMMARY.md handoff context from Wave 1 agents is not automatically injected into Wave 2 prompts. Users must manually paste relevant handoff sections. | Medium |
| **No state tracking** | Aider does not track Legion workflow state. Users must manually update STATE.md and WAVE-CHECKLIST.md after completing plans. | Low |

### What This Means in Practice

Aider is best suited for:
- Executing individual plans from an already-decomposed phase (planned via another CLI)
- Read-only advisory sessions via `/ask` mode
- Single-agent, single-plan workflows where automation overhead is low

Aider is **not suited** for:
- Full Legion workflow automation (`/legion:start` through `/legion:ship`)
- Multi-agent coordination or wave-parallel execution
- Workflows requiring structured user interaction (confirmation gates, choice menus)
- Automated review cycles (`/legion:review` expects shell execution for verification)

