---
cli: kiro-cli
cli_display_name: "Kiro CLI (formerly Amazon Q Developer CLI)"
version: "1.0"
support_tier: "beta"
capabilities:
  parallel_execution: true
  agent_spawning: true
  structured_messaging: false
  native_task_tracking: false
  read_only_agents: false
detection:
  primary: ".kiro/agents/legion-orchestrator.md exists in CWD or ~/.kiro/agents/legion-orchestrator.md exists"
  secondary: ".kiro/steering/legion.md exists in CWD or ~/.kiro/steering/AGENTS.md exists"
max_prompt_size: 128000
known_quirks:
  - "no-native-slash-commands"
  - "steering-sensitive"
  - "subagent-tool-restrictions"
---

# Kiro CLI Adapter

Kiro CLI supports custom agents, steering files, hooks, and subagents. Legion uses Kiro's native custom-agent surface as the entry point and steering files as the discovery layer. Kiro does not expose native Legion `/legion:*` slash-command files, so legacy aliases are routed through the installed steering and agent prompts.

## Tool Mappings

| Generic Concept | Implementation |
|-----------------|---------------|
| `spawn_agent_personality` | Spawn a Kiro subagent or the installed `@legion-orchestrator` agent, then load the matching Legion command file from `.legion/commands/legion/`. |
| `spawn_agent_autonomous` | Run the matching Legion workflow directly through `@legion-orchestrator` without extra personality injection. |
| `spawn_agent_readonly` | Use Kiro permissions or hook policy to deny writes for that task. Legion must still instruct the agent to stay read-only because it is not a separate built-in advisory agent. |
| `coordinate_parallel` | Kiro subagents can work in parallel, but Legion coordinates through files in `.planning/` rather than direct runtime messaging. |
| `collect_results` | Each agent writes structured results to `.planning/phases/{NN}/{NN}-{PP}-RESULT.md`, and the coordinator reads those artifacts after each wave. |
| `shutdown_agents` | No-op. Kiro subagents finish naturally once the task or hook completes. |
| `cleanup_coordination` | No-op. Clear temporary task artifacts only if the workflow explicitly created them. |
| `ask_user` | Print numbered choices in plain text and wait for the user response. |
| `model_planning` | User-configured Kiro model |
| `model_execution` | User-configured Kiro model |
| `model_check` | User-configured Kiro model |
| `global_config_dir` | `~/.kiro/agents/` plus `~/.kiro/steering/` |
| `plugin_discovery_glob` | `.kiro/agents/legion-orchestrator.md` and `.kiro/steering/legion.md` for workspace installs, or `~/.kiro/agents/legion-orchestrator.md` and `~/.kiro/steering/AGENTS.md` for global installs |
| `commit_signature` | `Co-Authored-By: Kiro <noreply@kiro.dev>` |

## Interaction Protocol

Print numbered choices in plain text and wait for user response. Parse the integer from the user's message. Re-prompt on invalid input (max 2 retries).

## Execution Protocol

### Phase Initialization

Read the installed Legion command bundle from `.legion/commands/legion/` and write a wave checklist to `.planning/phases/{NN}/WAVE-CHECKLIST.md`.

### Wave Execution

**Dispatch mode:** parallel subagents when wave has multiple plans with non-overlapping `files_modified`; sequential otherwise. Coordination is filesystem-based via `.planning/` artifacts — no runtime mailboxes.

Kiro supports custom agents and subagents. Legion should:
1. Read the matching workflow file from `.legion/commands/legion/`
2. For multi-plan waves, validate that plans have non-overlapping `files_modified` (via wave-executor). If overlaps exist, run those plans sequentially.
3. Spawn Kiro subagents in a single dispatch batch for plans eligible for parallel execution
4. Pass context through `.planning/` artifacts, not runtime mailboxes
5. Write each plan result to `.planning/phases/{NN}/{NN}-{PP}-RESULT.md`
6. Poll result files every 5s; timeout at 30 min per wave. Missing results are marked Failed.
7. Re-read the result files before advancing to the next wave

### Result Collection

Read the per-plan result artifacts and summarize their Status fields into the current wave checklist or review report.

### Phase Cleanup

No team teardown is required. Remove only temporary task artifacts that the current workflow explicitly created.

## Kiro Native Integration

- The installed `@legion-orchestrator` custom agent is the primary Legion entry point
- Steering files map legacy `/legion:*` aliases to the authoritative workflow files in `.legion/commands/legion/`
- Hooks and permission policies can enforce safer Legion runs when the user wants read-only or approval-heavy behavior

## Subagent Tool Limitations

Kiro subagents have restricted tool availability compared to the main agent session:
- **Available in subagents:** `execute_bash`, `fs_read`, `fs_write`, `grep`, `glob` (core tools)
- **NOT available in subagents:** MCP tools, `web_search`, `web_fetch`
- Unavailable tools silently degrade — the subagent still runs but without those capabilities
- Plan tasks that require web research or MCP integrations should run in the main agent session, not in spawned subagents
