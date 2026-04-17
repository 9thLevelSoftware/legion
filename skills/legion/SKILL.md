---
name: legion
description: Bridge Codex requests to the Legion workflows in this repository when the user references Legion or legacy /legion:* commands.
triggers: [legion, /legion:, codex, plugin, bridge]
token_cost: low
summary: "Routes plain-language Legion requests and legacy /legion:* aliases to the matching command markdown in this repository."
---

# Legion for Codex

This repository can be loaded as a Codex plugin bundle. Use this bridge when the user asks Codex to use Legion directly from the repo instead of through the npm installer.

## Workflow Mapping

- `/legion:start` -> `commands/start.md`
- `/legion:plan` -> `commands/plan.md`
- `/legion:build` -> `commands/build.md`
- `/legion:review` -> `commands/review.md`
- `/legion:status` -> `commands/status.md`
- `/legion:quick` -> `commands/quick.md`
- `/legion:advise` -> `commands/advise.md`
- `/legion:portfolio` -> `commands/portfolio.md`
- `/legion:milestone` -> `commands/milestone.md`
- `/legion:agent` -> `commands/agent.md`
- `/legion:explore` -> `commands/explore.md`
- `/legion:board` -> `commands/board.md`
- `/legion:retro` -> `commands/retro.md`
- `/legion:ship` -> `commands/ship.md`
- `/legion:learn` -> `commands/learn.md`
- `/legion:update` -> `commands/update.md`
- `/legion:validate` -> `commands/validate.md`

## How To Use

1. If the user references Legion in plain language, treat that as intent to use the matching Legion workflow from `commands/`.
2. If the user types a legacy `/legion:*` alias, follow the matching command file even when Codex does not expose repo-local slash commands natively.
3. Read only the matching command markdown and the files it names in `<execution_context>` and `<context>`.
4. Use the current project's `.planning/PROJECT.md`, `.planning/ROADMAP.md`, and `.planning/STATE.md` when the workflow expects project state.
5. Prefer `adapters/codex-cli.md` when Legion behavior depends on Codex runtime capabilities.

## Guardrails

- Do not claim that loading this repository as a plugin creates native `/project:legion-*` or `/prompts:legion-*` prompt commands. Those prompt files are created only by `npx @9thlevelsoftware/legion --codex`.
- Keep command execution retrieval-led: command markdown and referenced skill files are the source of truth.
- Do not bulk-load all Legion skills. Follow the selected command's execution context and keep context narrow.
