---
cli: opencode
cli_display_name: "OpenCode"
version: "1.0"
support_tier: "beta"
capabilities:
  parallel_execution: false
  agent_spawning: true
  structured_messaging: false
  native_task_tracking: false
  read_only_agents: true
detection:
  primary: ".opencode/command/legion-start.md exists in CWD or ~/.config/opencode/command/legion-start.md exists"
  secondary: ".opencode/agent/legion-orchestrator.md exists in CWD or ~/.config/opencode/agent/legion-orchestrator.md exists"
max_prompt_size: 128000
known_quirks:
  - "terminal-ui-only"
  - "sequential-task-tool"
---

# OpenCode Adapter

OpenCode supports native custom commands, custom agents, and read-only exploration. Subagent spawning via the Task tool is available but executes synchronously (blocking) — multiple Task calls in one LLM response run sequentially, not concurrently. Legion installs flat command entry points such as `/legion-start` plus a `legion-orchestrator` subagent. Coordination still happens through `.planning/` artifacts rather than runtime mailboxes.

## Tool Mappings

| Generic Concept | Implementation |
|-----------------|---------------|
| `spawn_agent_personality` | Invoke the installed `legion-orchestrator` agent and load the matching Legion workflow from `.legion/commands/legion/`. |
| `spawn_agent_autonomous` | Run the matching installed OpenCode command directly. |
| `spawn_agent_readonly` | Use the built-in Explore agent (`@explore`) — cannot modify files, enforced at the platform level. Provide personality + task in the prompt. |
| `coordinate_parallel` | Not available natively — Task tool executes subagents sequentially (blocking). Execute plans one at a time within each wave. |
| `collect_results` | Each agent writes its structured result to `.planning/phases/{NN}/{NN}-{PP}-RESULT.md`. The coordinator reads these files after each wave. |
| `shutdown_agents` | No-op — subagents complete and return naturally. |
| `cleanup_coordination` | No-op — no team infrastructure to clean up. |
| `ask_user` | Print numbered choices in plain text and wait for user input. |
| `model_planning` | User-configured model (e.g., `claude-opus-4-6`, `o3`) |
| `model_execution` | User-configured model (e.g., `claude-sonnet-4-6`, `gpt-5.3-codex`) |
| `model_check` | User-configured model (e.g., `claude-haiku-4-5`, `o3-mini`) |
| `global_config_dir` | `~/.config/opencode/command/` plus `~/.config/opencode/agent/` |
| `plugin_discovery_glob` | `.opencode/command/legion-start.md` and `.opencode/agent/legion-orchestrator.md`, or the matching paths under `~/.config/opencode/` |
| `commit_signature` | `Co-Authored-By: OpenCode <noreply@opencode.ai>` |

## Interaction Protocol

Print numbered choices in plain text and wait for user response:

```
Please choose:
1) Option A — description
2) Option B — description

Enter a number:
```

Parse the integer from the user's response. Re-prompt on invalid input (max 2 retries).

## Execution Protocol

### Phase Initialization

Write a wave checklist to `.planning/phases/{NN}/WAVE-CHECKLIST.md` for tracking. OpenCode's native task tracking can also be used for visibility.

### Wave Execution

**Dispatch mode:** sequential subagent spawn via blocking Task tool — one subagent at a time, awaited to completion. OpenCode's Task tool does not support concurrent invocation.

Plans execute sequentially (Task tool is blocking):
1. For each plan in the wave, spawn a subagent via the Task tool
2. Wait for subagent completion before spawning the next
3. Each subagent writes its result to `.planning/phases/{NN}/{NN}-{PP}-RESULT.md`
4. If a Task invocation fails or times out, mark the plan Failed in WAVE-CHECKLIST.md and continue with the next plan
5. After all plans in the wave complete, parse results and build wave summary

### Read-Only Agents

The built-in Explore agent (`@explore`) enforces read-only at the platform level — it cannot modify files. Use this for `/legion:advise` advisory sessions and plan critique.

### Custom Agent Integration

Legion installs a native `legion-orchestrator` OpenCode agent in `~/.config/opencode/agent/` or `.opencode/agent/`, and flat commands such as `/legion-start` in the matching command directory.

### Result Collection

Read `.planning/phases/{NN}/{NN}-{PP}-RESULT.md` for each plan. Parse Status field. Build wave summary.

### Phase Cleanup

No cleanup needed — subagents complete naturally. Update WAVE-CHECKLIST.md to mark phase as Finalized.

## Model Routing

OpenCode supports user-configured models across providers. Recommended tier assignments for Legion workflows:

| Tier | Purpose | Recommended Models | Notes |
|------|---------|-------------------|-------|
| `model_planning` | Phase decomposition, architecture proposals, plan critique | `claude-opus-4-6`, `o3`, `gemini-2.5-pro` | Use the strongest reasoning model available. Planning quality directly impacts execution success. |
| `model_execution` | Plan implementation, code generation, file edits | `claude-sonnet-4-6`, `gpt-5.3-codex`, `gemini-2.5-flash` | Balance speed and capability. Execution agents run frequently — cost scales linearly with plan count. |
| `model_check` | Verification, review summaries, lightweight analysis | `claude-haiku-4-5`, `o3-mini`, `gemini-2.0-flash-lite` | Cheapest viable model. Used for verification commands, status checks, and result parsing. |

Model configuration is set in OpenCode's configuration file. Legion reads whatever model the user has configured — the above are recommendations, not requirements.

### Model Selection Guidelines

- **Budget-conscious**: Use the same mid-tier model (e.g., `claude-sonnet-4-6`) for all three tiers. Acceptable quality loss on planning, significant cost savings.
- **Quality-first**: Use `claude-opus-4-6` or `o3` for planning, `claude-sonnet-4-6` for execution, `claude-haiku-4-5` for checks. Best results, highest cost.
- **Local models**: OpenCode supports local models via Ollama or similar. Local models work for `model_check` tier but are not recommended for `model_planning` or `model_execution` due to quality requirements.

## Troubleshooting

### API Key Issues

- **Symptom**: OpenCode returns authentication errors when spawning subagents.
- **Fix**: Verify your API key is set in OpenCode's config or environment variables. Run `opencode` interactively to confirm the model responds before using Legion commands.
- **Multiple providers**: If using models from different providers (e.g., Anthropic for planning, OpenAI for execution), ensure all relevant API keys are configured.

### Model Availability

- **Symptom**: Task tool returns "model not found" or similar errors.
- **Fix**: Check that the configured model name matches the provider's current model catalog. Model names change across versions — e.g., `claude-3-opus` vs `claude-opus-4-6`.
- **Fallback**: If a model becomes unavailable mid-session, OpenCode may fall back to its default model. Check output for model mismatch warnings.

### Timeout Handling

- **Symptom**: Long-running plans (complex code generation, large file edits) time out.
- **Fix**: OpenCode's Task tool has default timeout behavior. For complex plans:
  - Break plans into smaller tasks (use `settings.planning.max_tasks_per_plan: 2`)
  - Ensure verification commands are lightweight — heavy test suites can trigger timeouts
  - If timeouts persist, check OpenCode's configuration for timeout settings

### Sequential Execution Bottlenecks

- **Symptom**: Wave execution is slow because plans run one-at-a-time.
- **Context**: OpenCode's Task tool is blocking — this is a platform limitation, not a bug.
- **Mitigation**: Minimize wave depth by structuring plans with fewer dependency layers. Prefer wide waves (many independent plans) over deep chains (many sequential waves).

### Subagent Context Limits

- **Symptom**: Subagent outputs are truncated or incomplete.
- **Fix**: OpenCode has a `max_prompt_size` of 128k tokens. For plans with large context (brownfield codebases, long personality files), reduce injected context:
  - Use condensed personality summaries instead of full personality files for execution agents
  - Limit CODEBASE.md injection to relevant sections only

## Known Quirks (Expanded)

| Quirk | Impact | Workaround |
|-------|--------|------------|
| `terminal-ui-only` | No web UI or IDE integration — all interaction is in the terminal. Copy/paste of large outputs may be unreliable. | Use file-based output (RESULT.md, SUMMARY.md) for large content rather than relying on terminal display. |
| `sequential-task-tool` | Task tool calls execute one-at-a-time, even if multiple are issued in one response. Wave parallelism is not possible. | Structure plans to maximize within-wave independence so manual parallel sessions (multiple terminals) can be used if needed. |
| No native `ask_user` | OpenCode does not have a structured prompt/response mechanism. Numbered choices are printed as plain text. | Ensure choices are clearly numbered and descriptions are concise. Users may respond with the number or the option text. |
| Explore agent scope | The `@explore` agent enforces read-only at the platform level but has the same context window as the main agent. | Suitable for `/legion:advise` and plan critique. Not suitable for large-scale codebase analysis — use targeted file reads instead. |

