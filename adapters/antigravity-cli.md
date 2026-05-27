---
cli: antigravity-cli
cli_display_name: "Antigravity CLI"
version: "1.0"
support_tier: "certified"
capabilities:
  parallel_execution: true
  agent_spawning: true
  structured_messaging: false
  native_task_tracking: true
  read_only_agents: true
  supports_extended_thinking: true
detection:
  primary: "plugin.json exists in .agents/plugins/legion or ~/.gemini/config/plugins/legion"
  secondary: "AGENTS.md exists in CWD or ~/.gemini/antigravity-cli/settings.json exists"
max_prompt_size: 2097152
known_quirks:
  - "no-structured-messaging"
---

# Antigravity CLI Adapter

Antigravity CLI (`agy`) is the certified successor to Google's Gemini CLI. It supports native plugins staged under `.agents/plugins/legion` (local) or `~/.gemini/config/plugins/legion` (global). Legion installs as a compliant Antigravity plugin with a `plugin.json` manifest, bringing its full suite of 49 agents, skills, and slash commands.

## Tool Mappings

| Generic Concept | Implementation |
|-----------------|---------------|
| `spawn_agent_personality` | Spawn a background agent with the specified personality and task using the Antigravity agent system (`agy subagent spawn`). |
| `spawn_agent_autonomous` | Spawn an autonomous background agent task (`agy task spawn`). |
| `spawn_agent_readonly` | Spawn a background agent with explicit read-only instruction sets. Read-only is enforced by blocking write/edit tools. |
| `coordinate_parallel` | Concurrent dispatch of multiple subagents inside the Antigravity plugin harness. Each agent writes results to its respective file. |
| `collect_results` | Each agent writes its outcome to `.planning/phases/{NN}/{NN}-{PP}-RESULT.md`. |
| `shutdown_agents` | Terminate active background agents using the `/tasks kill` slash command or direct API call. |
| `cleanup_coordination` | Clean up temporary workspace plugin directories. |
| `ask_user` | Structured question prompts via the Antigravity CLI prompt overlay (similar to `AskUserQuestion`). |
| `model_planning` | `gemini-2.5-pro` (default planning model) |
| `model_execution` | `gemini-2.5-flash` (default execution model) |
| `model_check` | `gemini-2.5-flash` |
| `global_config_dir` | `~/.gemini/antigravity-cli/` |
| `plugin_discovery_glob` | `<home>/.gemini/config/plugins/legion/plugin.json` — **resolve `<home>` first** using `os.homedir()` or `echo $HOME` to get the absolute path. Do NOT pass `~` or environment variables directly to the Glob tool. |
| `commit_signature` | `Co-Authored-By: Antigravity <noreply@google.com>` |

## Interaction Protocol

Antigravity CLI supports high-fidelity interactive user prompts. The `ask_user` tool utilizes the CLI's native prompt overlay to present multiple-choice list selections. If unavailable, it falls back to a numbered plain-text menu prompt that parses numerical choices from standard input.

## Execution Protocol

### Phase Initialization

Write the wave checklist and plan artifacts to `.planning/phases/{NN}/WAVE-CHECKLIST.md`.

### Wave Execution

**Dispatch mode:** parallel plugin-based execution via native subagent spawning + filesystem polling.

Antigravity CLI natively coordinates parallel background agents using its agent system:
1. For each plan in the active wave, resolve its assigned agent personality from the `agents/` directory in the Legion plugin.
2. Initialize parallel background processes using the `/tasks` scheduler.
3. Plans that share file workspaces are protected from concurrent edits by verifying that their `files_modified` arrays do not overlap.
4. Each background subagent writes its final plan outcome and task outputs directly to `.planning/phases/{NN}/{NN}-{PP}-RESULT.md`.
5. The orchestrator polls the designated result paths every 5 seconds until all tasks in the current wave complete or a 30-minute timeout is reached.

### Result Collection

After each wave, read and parse the generated plan result files. Update the phase execution checklist with status and outcome metrics.

### Phase Cleanup

No special cleanup needed. Stale background task logs are closed and archived.
