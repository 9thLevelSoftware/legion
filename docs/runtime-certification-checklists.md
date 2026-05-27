# Runtime Certification Checklists

Use these checklists for manual verification when CI cannot prove runtime-native discovery behavior.

## Claude Code

- Confirm `.claude/commands/legion/` exists in the expected scope.
- Verify the Legion commands appear with their canonical `/legion:*` names.
- Run `/legion:start` and confirm Claude loads the installed Legion workflow directly.
- Verify `.claude/legion/manifest.json` reflects the installed runtime and scope.

## OpenAI Codex CLI

- Confirm `.codex/prompts/legion-start.md` exists in the expected scope.
- Restart Codex and verify `/project:legion-start` or `/prompts:legion-start` appears.
- Trigger the prompt and confirm it reads the installed `.legion/commands/legion/start.md`.
- Verify `.agents/skills/legion/SKILL.md` exists and maps legacy `/legion:*` aliases correctly.

## Cursor

- Confirm `.cursor/rules/legion.mdc` exists after local install.
- Restart or reload Cursor and verify the rule is visible in project rules.
- Ask Cursor in plain language to use Legion start and confirm it reads `.legion/commands/legion/start.md`.
- Verify Background Agent and Review mode still behave correctly with the installed rule.

## GitHub Copilot CLI

- Confirm `.github/skills/legion-start/SKILL.md` or `~/.copilot/skills/legion-start/SKILL.md` exists.
- Confirm `.github/agents/legion-orchestrator.agent.md` or `~/.config/copilot/agents/legion-orchestrator.agent.md` exists.
- Restart Copilot CLI and verify `/legion-start` is discoverable via `/skills`.
- Verify `/agent legion-orchestrator` is selectable and can route to `.legion/commands/legion/start.md`.

## Google Gemini CLI

- Confirm `.gemini/commands/legion/start.toml` or `~/.gemini/commands/legion/start.toml` exists.
- Restart Gemini CLI and run `/legion:start`.
- Verify Gemini reads the authoritative `.legion/commands/legion/start.md` file.
- Confirm nested namespace commands still resolve as `/legion:<command>`.

## Antigravity CLI

- Confirm `.agents/plugins/legion/plugin.json` or `~/.gemini/config/plugins/legion/plugin.json` exists and is valid JSON.
- Verify skills, agents, and commands directories exist inside the plugin folder.
- Restart Antigravity CLI and run `agy inspect` to verify the `legion` plugin is active.
- Verify Antigravity CLI can run `/legion:start` and execute the installed plugin commands.

## Kiro CLI (formerly Amazon Q Developer CLI)

- Confirm `.kiro/agents/legion-orchestrator.md` or `~/.kiro/agents/legion-orchestrator.md` exists.
- Confirm `.kiro/steering/legion.md` or `~/.kiro/steering/AGENTS.md` exists.
- Restart Kiro CLI and verify `@legion-orchestrator` is available.
- Confirm plain-language Legion requests or legacy `/legion:*` aliases route to the installed `.legion/commands/legion/*.md` files.

## Windsurf

- Confirm `.windsurf/rules/legion.md` exists after local install.
- Restart or reload Windsurf and verify the rule is active.
- Ask Cascade in plain language to use Legion and confirm it reads `.legion/commands/legion/start.md`.
- Verify Ask mode remains read-only with the Legion rule installed.

## OpenCode

- Confirm `.opencode/command/legion-start.md` or `~/.config/opencode/command/legion-start.md` exists.
- Confirm `.opencode/agent/legion-orchestrator.md` or `~/.config/opencode/agent/legion-orchestrator.md` exists.
- Restart OpenCode and verify `/legion-start` is available.
- Confirm the installed `legion-orchestrator` agent can execute the authoritative workflow file in `.legion/commands/legion/start.md`.

## Kilo CLI

- Confirm `.kilo/commands/legion-start.md` or `~/.config/kilo/commands/legion-start.md` exists.
- Confirm `.kilo/agents/legion-orchestrator.md` or `~/.config/kilo/agents/legion-orchestrator.md` exists.
- Confirm `.kilo/skills/code-polish/SKILL.md` (or `~/.kilo/skills/code-polish/SKILL.md`) exists and its frontmatter `name:` field reads exactly `code-polish` (the spec-invalid `legion:code-polish` source name must be normalized at install time).
- Confirm at least three other skill folders exist under `.kilo/skills/` (e.g., `workflow-common`, `phase-decomposer`, `review-loop`).
- Restart Kilo CLI and verify `/legion-start` is available in the slash-command picker.
- Confirm the installed `legion-orchestrator` agent can execute the authoritative workflow file in `.legion/commands/legion/start.md`.

## Kilo Code Plugin

- Confirm `.kilocode/workflows/legion-start.md`, `.kilocode/workflows/legion-board.md`, `~/.kilocode/workflows/legion-start.md`, or `~/.kilocode/workflows/legion-board.md` exists for the plugin workflow surface.
- Confirm `.kilo/commands/legion-start.md`, `.kilo/commands/legion-board.md`, `~/.config/kilo/commands/legion-start.md`, or `~/.config/kilo/commands/legion-board.md` exists for the CLI-backed workflow surface.
- Confirm `.kilocode/skills/board-of-directors/SKILL.md` or `~/.kilocode/skills/board-of-directors/SKILL.md` exists, and representative skill frontmatter names match their directory names.
- Confirm `.kilo/skills/board-of-directors/SKILL.md` or `~/.kilo/skills/board-of-directors/SKILL.md` exists, and representative skill frontmatter names match their directory names.
- Confirm `.kilocode/skills/legion/SKILL.md` or `~/.kilocode/skills/legion/SKILL.md` exists as the bridge/index skill.
- Confirm `.kilocodemodes` or `~/.kilocode/globalStorage/kilo code.kilo-code/settings/custom_modes.yaml` contains `slug: legion`.
- Restart Kilo Code or reload the IDE window and verify the `Legion` custom mode, `/legion-start.md` or `/legion-start` workflow, and Legion skills are available.
- Run `/legion-start.md`, `/legion-start`, `/legion-board.md`, or `/legion-board` and confirm the workflow routes through the single `Legion` mode and reads the authoritative command file in `.legion/commands/legion/`.

## Aider

- Confirm Legion does not offer an automated native install for Aider.
- If you choose the manual path, verify `AGENTS.md`, `CONVENTIONS.md`, or `.aider.conf.yml` contains the intended Legion guidance.
- Use `/ask` for read-only Legion advisory sessions.
- Use `/architect` and `/code` manually after loading the relevant Legion workflow file by hand.

## Scope and Operator

This checklist is for human operators only. Each item uses verbs like "verify", "confirm", and "trigger" without a machine-checkable pass predicate. Programmatic validation of Legion adapter installations lives in a separate harness (see `/legion:validate` and adapter conformance tests). Do not dispatch an agent to "run the checklist" — use `/legion:validate` instead.

## Completion Gate (for human operators)

The certification run is complete when ALL of the following hold for the CLI under test:
1. Every `/legion:*` command listed in `CLAUDE.md` Dynamic Knowledge Index appears in the CLI's command listing (exact string match, no renames)
2. Invoking a representative command (e.g., `/legion:start`) loads the installed file at the path documented for that CLI in `adapters/{cli}.md`
3. A plain-language prompt containing the phrase "use Legion start" causes the CLI to load the same installed file as the slash-command path
4. No command prints an error or "not found" message for any Legion command on the canonical list
5. The operator has recorded PASS/FAIL per item for the CLI under test; partial runs are marked `incomplete` and are NOT certifications

If ANY condition is unmet, the CLI is NOT certified — file the failing item(s) as an issue and re-run after fix.
