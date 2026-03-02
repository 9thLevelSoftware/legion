# Requirements: The Agency Workflows

**Defined:** 2026-03-01
**Core Value:** Turn 51 isolated agent personalities into a functional AI agency, now packaged as a proper Claude Code plugin

## v2.0 Requirements

Requirements for plugin conversion. Each maps to roadmap phases.

### Plugin Foundation (PLUG)

- [ ] **PLUG-01**: Plugin has `.claude-plugin/plugin.json` manifest with name, version, description, author, keywords, repository
- [ ] **PLUG-02**: Plugin has `commands/` directory at root with all 9 command `.md` files
- [ ] **PLUG-03**: Plugin has `skills/` directory at root with 15 skills in `{name}/SKILL.md` format
- [ ] **PLUG-04**: Plugin has `agents/` directory at root with all 51 agent `.md` files
- [ ] **PLUG-05**: Plugin has `settings.json` with default configuration when enabled

### Agent Migration (AGENT)

- [ ] **AGENT-01**: All 51 agent files moved to flat `agents/` directory with plugin-compatible frontmatter
- [ ] **AGENT-02**: Agent frontmatter includes `name` and `description` fields matching Claude Code plugin agent schema
- [ ] **AGENT-03**: Division grouping preserved as metadata in agent frontmatter (`division` field)
- [ ] **AGENT-04**: Agent registry skill updated to reference new plugin-relative paths

### Skill Migration (SKILL)

- [ ] **SKILL-01**: All 15 skills converted to `skills/{name}/SKILL.md` directory structure
- [ ] **SKILL-02**: Skill frontmatter includes `name` and `description` matching Claude Code skill schema
- [ ] **SKILL-03**: Templates and reference files moved alongside their SKILL.md as supporting files

### Path & Reference Updates (PATH)

- [ ] **PATH-01**: All `@` execution_context references updated to plugin-relative paths
- [ ] **PATH-02**: All cross-skill and cross-command references updated for new structure
- [ ] **PATH-03**: Agent personality file paths in wave-executor and registry updated

### Distribution (DIST)

- [ ] **DIST-01**: `marketplace.json` entry for GitHub-based installation
- [ ] **DIST-02**: README.md with installation instructions, prerequisites, and getting started guide
- [ ] **DIST-03**: CHANGELOG.md with v1.0 and v2.0 version history
- [ ] **DIST-04**: Development docs for testing with `--plugin-dir`

## Future Requirements

### Plugin Enhancements

- **ENHANCE-01**: Hooks for automatic formatting or validation
- **ENHANCE-02**: MCP server integration for agent personality querying
- **ENHANCE-03**: Official Anthropic marketplace submission
- **ENHANCE-04**: Plugin auto-update mechanism

## Out of Scope

| Feature | Reason |
|---------|--------|
| MCP servers | Agency doesn't need external tool connections — it's pure skills/commands/agents |
| LSP integration | No language server needed — Agency is workflow orchestration, not code intelligence |
| Hooks | Could add later, but v2.0 focuses on structure conversion |
| New agent capabilities | Same 51 agents, same features — just repackaged |
| Breaking changes to commands | `/agency:start` etc. must work identically after migration |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLUG-01 | — | Pending |
| PLUG-02 | — | Pending |
| PLUG-03 | — | Pending |
| PLUG-04 | — | Pending |
| PLUG-05 | — | Pending |
| AGENT-01 | — | Pending |
| AGENT-02 | — | Pending |
| AGENT-03 | — | Pending |
| AGENT-04 | — | Pending |
| SKILL-01 | — | Pending |
| SKILL-02 | — | Pending |
| SKILL-03 | — | Pending |
| PATH-01 | — | Pending |
| PATH-02 | — | Pending |
| PATH-03 | — | Pending |
| DIST-01 | — | Pending |
| DIST-02 | — | Pending |
| DIST-03 | — | Pending |
| DIST-04 | — | Pending |

**Coverage:**
- v2.0 requirements: 19 total
- Mapped to phases: 0
- Unmapped: 19 (roadmap pending)

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after initial definition*
