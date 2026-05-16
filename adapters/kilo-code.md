---
cli: kilo-code
cli_display_name: "Kilo Code Plugin"
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
  primary: ".kilocodemodes contains slug: legion, or ~/.kilocode/globalStorage/kilo code.kilo-code/settings/custom_modes.yaml contains slug: legion"
  secondary: ".kilocode/workflows/legion-start.md, ~/.kilocode/workflows/legion-start.md, .kilocode/skills/board-of-directors/SKILL.md, ~/.kilocode/skills/board-of-directors/SKILL.md, .kilo/commands/legion-start.md, ~/.config/kilo/commands/legion-start.md, .kilo/skills/board-of-directors/SKILL.md, or ~/.kilo/skills/board-of-directors/SKILL.md exists"
max_prompt_size: 180000
known_quirks:
  - "plugin-mode-selection"
  - "sticky-models"
  - "skill-metadata-discovery"
  - "no-native-legion-slash-commands"
---

# Kilo Code Plugin Adapter

Kilo Code plugin support is distinct from the Kilo CLI adapter. Legion installs a single Kilo Code custom mode named `Legion`, plugin workflow files such as `/legion-start.md` and `/legion-board.md`, CLI-backed workflow files such as `/legion-start` and `/legion-board`, and the Legion Agent Skills collection in both plugin and CLI-backed skill directories. It does not create one mode per Legion command or personality, and it does not claim native `/legion:*` slash-command discovery inside the IDE plugin.

## Tool Mappings

| Generic Concept | Implementation |
|-----------------|----------------|
| `spawn_agent_personality` | Select the `Legion` mode, then route through the installed `/legion-*.md` or `/legion-*` workflow or matching command markdown under `.legion/commands/legion/`. |
| `spawn_agent_autonomous` | Execute the matching native Kilo workflow file from `.kilocode/workflows/`, `~/.kilocode/workflows/`, `.kilo/commands/`, or `~/.config/kilo/commands/`. |
| `spawn_agent_readonly` | Use Kilo Code's read-only mode or an explicit read-only custom mode when the workflow is advisory. |
| `coordinate_parallel` | Not guaranteed by the plugin surface; coordinate through `.planning/` artifacts and prefer sequential execution unless Kilo Code exposes safe subtask delegation. |
| `collect_results` | Read structured plan `SUMMARY.md` / `RESULT.md` artifacts from `.planning/phases/{NN}/`. |
| `shutdown_agents` | No-op; IDE sessions complete naturally. |
| `cleanup_coordination` | No-op; coordination state is file-backed. |
| `ask_user` | Use Kilo Code's normal user interaction UI; keep choices closed-set when a Legion workflow asks for a decision. |
| `model_planning` | User-selected or sticky Kilo Code model for the Legion mode. |
| `model_execution` | User-selected or sticky Kilo Code model for the Legion mode. |
| `model_check` | User-selected or sticky Kilo Code model for the Legion mode. |
| `global_config_dir` | `~/.kilocode/workflows/`, `~/.kilocode/skills/`, `~/.config/kilo/commands/`, `~/.kilo/skills/`, plus `~/.kilocode/globalStorage/kilo code.kilo-code/settings/custom_modes.yaml`. |
| `plugin_discovery_glob` | `.kilocode/workflows/legion-*.md`, `.kilocode/skills/<name>/SKILL.md`, `.kilo/commands/legion-*.md`, `.kilo/skills/<name>/SKILL.md`, `.kilocodemodes`, `~/.kilocode/workflows/legion-*.md`, `~/.kilocode/skills/<name>/SKILL.md`, `~/.config/kilo/commands/legion-*.md`, `~/.kilo/skills/<name>/SKILL.md`, or `~/.kilocode/globalStorage/kilo code.kilo-code/settings/custom_modes.yaml`. |
| `commit_signature` | `Co-Authored-By: Kilo Code <noreply@kilo.ai>` |

## Interaction Protocol

Kilo Code plugin sessions use the IDE chat UI. When a Legion workflow requires a decision, present a short closed-set choice and wait for the user's response before crossing any human-approval boundary. Legacy `/legion:*` text is an intent cue, not a native command dispatch.

## Execution Protocol

1. When a user asks for Legion or a `/legion:*` workflow, use the installed `/legion-*.md` or `/legion-*` workflow, the `Legion` custom mode, or the `legion` bridge skill.
2. Read the install manifest first if paths are uncertain.
3. Read the matching workflow file under `.legion/commands/legion/` and treat it as authoritative.
4. Load only the files named in the workflow's `<execution_context>` and `<context>`.
5. Use `.planning/` files for state, handoffs, and result collection.

## Model Routing

The installer intentionally does not write a `model` field into the Kilo Code mode. Kilo Code sticky models and the user's IDE settings remain the source of truth. If the user wants different planning, execution, and check models, configure those in Kilo Code rather than in Legion's installer.

## Known Quirks

| Quirk | Impact | Workaround |
|-------|--------|------------|
| `plugin-mode-selection` | Users may select the `Legion` mode directly or run native `/legion-*.md` or `/legion-*` workflow files, depending on the Kilo Code generation. | Keep the generated mode description and workflow metadata clear. |
| `sticky-models` | Model choice can persist per mode outside the installed files. | Do not pin models in generated Legion mode files. |
| `skill-metadata-discovery` | Skills are discovered by metadata and may require a new session or IDE reload. | Restart Kilo Code or reload the IDE window after installation. |
| `no-native-legion-slash-commands` | `/legion:*` text is treated as an intent, not a native command. | Route to the matching installed Legion command markdown. |
