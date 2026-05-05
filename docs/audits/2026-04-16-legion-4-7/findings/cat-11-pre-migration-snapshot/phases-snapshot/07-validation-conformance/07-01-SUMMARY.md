# Plan 07-01 Summary: ADAPTER.md Spec Enhancement + Adapter Updates

## Status: Complete

## Agent
engineering-senior-developer

## Files Modified
- `adapters/ADAPTER.md` — Added "Limits & Quirks" subsection with `max_prompt_size` and `known_quirks` field definitions; updated "Adding a New CLI Adapter" steps
- `adapters/claude-code.md` — max_prompt_size: 180000, known_quirks: []
- `adapters/codex-cli.md` — max_prompt_size: 128000, quirks: sandbox-execution-only, no-interactive-prompts
- `adapters/cursor.md` — max_prompt_size: 128000, quirks: ide-embedded-agent, tab-completion-conflicts
- `adapters/copilot-cli.md` — max_prompt_size: 64000, quirks: no-agent-spawning, prompt-prefix-only, short-context-window
- `adapters/gemini-cli.md` — max_prompt_size: 1000000, quirks: no-structured-messaging
- `adapters/amazon-q.md` — max_prompt_size: 128000, quirks: no-agent-spawning, aws-scoped-context
- `adapters/windsurf.md` — max_prompt_size: 128000, quirks: ide-embedded-agent, cascade-flow-model
- `adapters/opencode.md` — max_prompt_size: 128000, quirks: no-agent-spawning, terminal-ui-only
- `adapters/aider.md` — max_prompt_size: 128000, quirks: no-agent-spawning, no-parallel-execution, single-session-only, no-mcp-support

## Verification
- 8/8 verification commands passed
- All 9 adapters have max_prompt_size and known_quirks in frontmatter
- All quirk values are lowercase-hyphenated strings
- No existing fields or body content modified

## Decisions
- New fields placed after `detection:` block, before closing `---`
- Renumbered "Adding a New CLI Adapter" steps to include new step 3

## Issues
None
