---
cli: kilo-cli
cli_display_name: "Kilo CLI"
version: "1.0"
support_tier: "beta"
capabilities:
  parallel_execution: false
  agent_spawning: true
  structured_messaging: false
  native_task_tracking: false
  read_only_agents: true
  supports_extended_thinking: false
detection:
  primary: ".kilo/commands/legion-start.md exists in CWD or ~/.config/kilo/commands/legion-start.md exists"
  secondary: ".kilo/agents/legion-orchestrator.md exists in CWD or ~/.config/kilo/agents/legion-orchestrator.md exists"
  tertiary: ".kilo/skills/code-polish/SKILL.md exists in CWD or ~/.kilo/skills/code-polish/SKILL.md exists"
max_prompt_size: 180000
known_quirks:
  - "no-parallel-subagents"
  - "task-tool-pauses-parent"
  - "file-based-coordination"
  - "question-tool-suggest-tags"
---

# Kilo CLI Adapter

Kilo Code (the VS Code extension and the Kilo CLI, which is a fork of [OpenCode](https://opencode.ai/)) supports native workflows at `.kilo/commands/*.md`, custom modes/agents at `.kilo/agents/*.md` (or `.kilo/agent/*.md`), and [Agent Skills](https://agentskills.io/) at `.kilo/skills/<name>/SKILL.md`. Configuration lives in `kilo.jsonc` (or `opencode.jsonc`). Subagent spawning via the `task` tool is available but executes synchronously — the parent session pauses entirely while a subagent runs. There is no native parallel execution, no team/task queue, and no structured messaging between agents. Legion installs flat command entry points such as `/legion-start`, a `legion-orchestrator` subagent, and copies of every Legion skill into `.kilo/skills/<name>/` so Kilo's hardwired Skills loader discovers them on session start. Coordination still happens through `.planning/` artifacts rather than runtime mailboxes.

Because Kilo CLI is an OpenCode fork, it also loads agents and config from `.opencode/`. Avoid installing both `--opencode` and `--kilo` at the same local scope — `.opencode/` is a Kilo compatibility directory and the two installs would shadow each other.

## Tool Mappings

| Generic Concept | Implementation |
|-----------------|---------------|
| `spawn_agent_personality` | Invoke the installed `legion-orchestrator` agent and load the matching Legion workflow from `.legion/commands/legion/`. |
| `spawn_agent_autonomous` | Run the matching installed Kilo command directly. |
| `spawn_agent_readonly` | Use the built-in `ask` or `explore` agents — cannot modify files, enforced at the platform level. Provide personality + task in the prompt. |
| `coordinate_parallel` | Not available natively — `task` tool executes subagents sequentially (blocking). Execute plans one at a time within each wave. |
| `collect_results` | Each agent writes its structured result to `.planning/phases/{NN}/{NN}-{PP}-RESULT.md`. The coordinator reads these files after each wave. |
| `shutdown_agents` | No-op — subagents complete and return naturally. |
| `cleanup_coordination` | No-op — no team infrastructure to clean up. |
| `ask_user` | Use the `question` tool with XML `<suggest>` tags for structured choices. |
| `model_planning` | User-configured model (e.g., `anthropic/claude-sonnet-4`, `gpt-5.3-codex`) |
| `model_execution` | User-configured model (e.g., `anthropic/claude-sonnet-4`, `gpt-5.3-codex`) |
| `model_check` | User-configured model (e.g., `anthropic/claude-haiku-4`, `o3-mini`) |
| `global_config_dir` | `~/.config/kilo/commands/` plus `~/.config/kilo/agents/` (and `~/.kilo/skills/` for skills) |
| `plugin_discovery_glob` | `.kilo/commands/legion-*.md` and `.kilo/agents/legion-orchestrator.md`, or the matching paths under `~/.config/kilo/` |
| `agent_skills_dir` | `.kilo/skills/<name>/SKILL.md` (project) or `~/.kilo/skills/<name>/SKILL.md` (global). Each `SKILL.md` `name:` field is normalized to match its parent directory (lowercase letters/digits/hyphens only). |
| `commit_signature` | `Co-Authored-By: Kilo <noreply@kilo.ai>` |

## Interaction Protocol

Use the `question` tool with XML `<suggest>` tags for structured user interaction:

```xml
<question>
Which option?
<follow_up>
<suggest>Option A</suggest>
<suggest>Option B</suggest>
</follow_up>
</question>
```

Parse the user's response against the provided suggestions. Re-prompt on invalid input (max 2 retries).

## Execution Protocol

### Phase Initialization

Write a wave checklist to `.planning/phases/{NN}/WAVE-CHECKLIST.md` for tracking. Kilo's native task tracking can also be used for visibility.

### Wave Execution

**Dispatch mode:** sequential subagent spawn via blocking `task` tool — one subagent at a time, awaited to completion. Kilo's `task` tool does not support concurrent invocation.

Plans execute sequentially (`task` tool is blocking):
1. For each plan in the wave, spawn a subagent via the `task` tool
2. Wait for subagent completion before spawning the next
3. Each subagent writes its result to `.planning/phases/{NN}/{NN}-{PP}-RESULT.md`
4. If a `task` invocation fails or times out, mark the plan Failed in WAVE-CHECKLIST.md and continue with the next plan
5. After all plans in the wave complete, parse results and build wave summary

### Read-Only Agents

The built-in `ask` and `explore` agents enforce read-only at the platform level — they cannot modify files. Use these for `/legion:advise` advisory sessions and plan critique.

### Custom Agent Integration

Legion installs a native `legion-orchestrator` Kilo agent in `~/.config/kilo/agent/` or `.kilo/agent/`, and flat commands such as `/legion-start` in the matching command directory.

### Result Collection

Read `.planning/phases/{NN}/{NN}-{PP}-RESULT.md` for each plan. Parse Status field. Build wave summary.

### Phase Cleanup

No cleanup needed — subagents complete naturally. Update WAVE-CHECKLIST.md to mark phase as Finalized.

## Model Routing

Kilo supports user-configured models across providers. Recommended tier assignments for Legion workflows:

| Tier | Purpose | Recommended Models | Notes |
|------|---------|-------------------|-------|
| `model_planning` | Phase decomposition, architecture proposals, plan critique | `claude-opus-4-6`, `o3`, `gemini-2.5-pro` | Use the strongest reasoning model available. Planning quality directly impacts execution success. |
| `model_execution` | Plan implementation, code generation, file edits | `claude-sonnet-4-6`, `gpt-5.3-codex`, `gemini-2.5-flash` | Balance speed and capability. Execution agents run frequently — cost scales linearly with plan count. |
| `model_check` | Verification, review summaries, lightweight analysis | `claude-haiku-4-5`, `o3-mini`, `gemini-2.0-flash-lite` | Cheapest viable model. Used for verification commands, status checks, and result parsing. |

Model configuration is set in Kilo's configuration file. Legion reads whatever model the user has configured — the above are recommendations, not requirements.

### Kimi K2.6 Turbo Guidance

Kimi K2.6 Turbo should be treated as a high-speed execution model, not as a
planner substitute. When Kilo users configure Kimi for `model_execution`, Legion
must lean harder on planner/executor separation:

- Planning produces decision-complete implementation contracts before execution.
- Execution prompts lock scope to `files_modified` and `files_forbidden`.
- Stop gates use literal `BLOCKED` when read targets, APIs, helpers, validation
  rules, or verification commands are missing.
- Result artifacts are persisted to `.planning/phases/{NN}/{NN}-{PP}-RESULT.md`
  before the coordinator advances.
- Ambiguity is reduced in the prompt: clear role, task, scope, allowed
  tools/actions, forbidden actions, verification criteria, and final result
  format.
- The execution harness is mandatory:
  `read-before-write -> evidence-before-action -> minimal diff -> verify-before-report`.

This is adapter guidance only. It does not add a Kimi runtime dependency or
change Kilo's user-configured model selection.

### Model Selection Guidelines

- **Budget-conscious**: Use the same mid-tier model (e.g., `claude-sonnet-4-6`) for all three tiers. Acceptable quality loss on planning, significant cost savings.
- **Quality-first**: Use `claude-opus-4-6` or `o3` for planning, `claude-sonnet-4-6` for execution, `claude-haiku-4-5` for checks. Best results, highest cost.
- **Local models**: Kilo supports local models via Ollama or similar. Local models work for `model_check` tier but are not recommended for `model_planning` or `model_execution` due to quality requirements.

## Troubleshooting

### API Key Issues

- **Symptom**: Kilo returns authentication errors when spawning subagents.
- **Fix**: Verify your API key is set in Kilo's config or environment variables. Run `kilo` interactively to confirm the model responds before using Legion commands.
- **Multiple providers**: If using models from different providers, ensure all relevant API keys are configured.

### Model Availability

- **Symptom**: `task` tool returns "model not found" or similar errors.
- **Fix**: Check that the configured model name matches the provider's current model catalog. Model names change across versions.
- **Fallback**: If a model becomes unavailable mid-session, Kilo may fall back to its default model. Check output for model mismatch warnings.

### Timeout Handling

- **Symptom**: Long-running plans (complex code generation, large file edits) time out.
- **Fix**: Kilo's `task` tool has default timeout behavior. For complex plans:
  - Break plans into smaller tasks (use `settings.planning.max_tasks_per_plan: 2`)
  - Ensure verification commands are lightweight — heavy test suites can trigger timeouts
  - If timeouts persist, check Kilo's configuration for timeout settings

### Sequential Execution Bottlenecks

- **Symptom**: Wave execution is slow because plans run one-at-a-time.
- **Context**: Kilo's `task` tool is blocking — this is a platform limitation, not a bug.
- **Mitigation**: Minimize wave depth by structuring plans with fewer dependency layers. Prefer wide waves (many independent plans) over deep chains (many sequential waves).

### Subagent Context Limits

- **Symptom**: Subagent outputs are truncated or incomplete.
- **Fix**: Kilo has a `max_prompt_size` of 180k tokens. For plans with large context (brownfield codebases, long personality files), reduce injected context:
  - Use condensed personality summaries instead of full personality files for execution agents
  - Limit CODEBASE.md injection to relevant sections only

## Known Quirks (Expanded)

| Quirk | Impact | Workaround |
|-------|--------|------------|
| `no-parallel-subagents` | Only one subagent can run at a time. Wave parallelism is not possible. | Structure plans to maximize within-wave independence so manual parallel sessions (multiple terminals) can be used if needed. |
| `task-tool-pauses-parent` | The parent session blocks entirely during `task` execution. Coordinator cannot do other work while a subagent runs. | Keep coordinator context light; offload all work to the subagent prompt so the parent has nothing to do but wait. |
| `file-based-coordination` | No runtime mailboxes or structured messaging. All coordination happens through files. | Use WAVE-CHECKLIST.md and RESULT.md consistently. Never assume inter-agent messaging exists. |
| `question-tool-suggest-tags` | Kilo's `question` tool uses XML `<suggest>` tags, not JSON structured questions. | Ensure prompts generate well-formed XML with `<follow_up>` and `<suggest>` children. |
