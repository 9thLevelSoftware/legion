# Phase 16: Agent Migration — Context

## Phase Goal
All 51 agent personalities live in the plugin `agents/` directory with schema-compliant frontmatter, so Claude Code can discover and inject them.

## Requirements Covered
- PLUG-04: Plugin has `agents/` directory at root with all 51 agent `.md` files
- AGENT-01: All 51 agent files moved to flat `agents/` directory with plugin-compatible frontmatter
- AGENT-02: Agent frontmatter includes `name` and `description` fields matching Claude Code plugin agent schema
- AGENT-03: Division grouping preserved as metadata in agent frontmatter (`division` field)

## What Already Exists

### Current Agent Location
- `agency-agents/{division}/{agent}.md` — 51 agent files across 9 subdirectories
- `agency-agents/README.md` and `agency-agents/CONTRIBUTING.md` — documentation files

### Division Breakdown (51 agents)
| Division | Directory | Count |
|----------|-----------|-------|
| Design | `agency-agents/design/` | 6 |
| Engineering | `agency-agents/engineering/` | 7 |
| Marketing | `agency-agents/marketing/` | 8 |
| Product | `agency-agents/product/` | 3 |
| Project Management | `agency-agents/project-management/` | 5 |
| Spatial Computing | `agency-agents/spatial-computing/` | 6 |
| Specialized | `agency-agents/specialized/` | 3 |
| Support | `agency-agents/support/` | 6 |
| Testing | `agency-agents/testing/` | 7 |

### Plugin Target
- `agents/` directory exists at plugin root (created in Phase 15) with `.gitkeep` placeholder
- `.gitkeep` will be removed once real agent files are migrated in

### Current Frontmatter Format
```yaml
---
name: <varies — see inconsistencies below>
description: <one-sentence specialty description>
color: <display color>
---
```

## Key Findings: Frontmatter Inconsistencies

### Name Field Issues
19 of 51 agents use kebab-case IDs instead of human-readable names:

| File | Current `name` | Normalized `name` |
|------|---------------|-------------------|
| engineering-senior-developer.md | `engineering-senior-developer` | Senior Developer |
| engineering-ai-engineer.md | `engineering-ai-engineer` | AI Engineer |
| marketing-instagram-curator.md | `marketing-instagram-curator` | Instagram Curator |
| marketing-twitter-engager.md | `marketing-twitter-engager` | Twitter Engager |
| marketing-growth-hacker.md | `marketing-growth-hacker` | Growth Hacker |
| marketing-tiktok-strategist.md | `marketing-tiktok-strategist` | TikTok Strategist |
| marketing-content-creator.md | `marketing-content-creator` | Content Creator |
| marketing-social-media-strategist.md | `marketing-social-media-strategist` | Social Media Strategist |
| marketing-reddit-community-builder.md | `marketing-reddit-community-builder` | Reddit Community Builder |
| product-trend-researcher.md | `product-trend-researcher` | Trend Researcher |
| product-sprint-prioritizer.md | `product-sprint-prioritizer` | Sprint Prioritizer |
| product-feedback-synthesizer.md | `product-feedback-synthesizer` | Feedback Synthesizer |
| project-manager-senior.md | `project-manager-senior` | Senior Project Manager |
| specialized/agents-orchestrator.md | `agents-orchestrator` | Agents Orchestrator |
| specialized/data-analytics-reporter.md | `data-analytics-reporter` | Data Analytics Reporter |
| testing-qa-verification-specialist.md | `testing-qa-verification-specialist` | Reality Checker |
| design-visual-storyteller.md | `design-visual-storyteller` | Visual Storyteller |

2 agents use non-standard compressed names:

| File | Current `name` | Normalized `name` |
|------|---------------|-------------------|
| testing-evidence-collector.md | `EvidenceQA` | Evidence Collector |
| design-ux-architect.md | `ArchitectUX` | UX Architect |

### Description Field Issues
4 agents have escaped newlines (`\n`) in descriptions that need cleanup:
- `engineering-senior-developer.md`
- `project-manager-senior.md`
- `testing-qa-verification-specialist.md`
- `testing-evidence-collector.md`

### Target Frontmatter Schema
```yaml
---
name: <Human-readable display name>
description: <Single-line specialty description, no escaped newlines>
division: <Capitalized division name: Engineering, Design, Marketing, etc.>
color: <Preserved from original>
---
```

## Key Design Decisions

- **Flat directory**: All 51 files go directly in `agents/`, no subdirectories. Division is preserved in frontmatter `division` field.
- **Filename preserved**: Agent filenames stay as-is (e.g., `engineering-senior-developer.md`). The filename IS the agent ID used by the registry.
- **`name` normalized to human-readable**: Consistent with how Claude Code displays agent names. Kebab-case IDs are not user-friendly.
- **`description` cleaned**: No escaped newlines or multi-line values. Single sentence.
- **`division` field added**: Maps directory name to capitalized label (e.g., `project-management` → `Project Management`).
- **`color` preserved**: Existing metadata, benign to keep.
- **Old directory fully removed**: `agency-agents/` subdirectory deleted after migration (including README.md and CONTRIBUTING.md — those describe the old structure).
- **Agent registry NOT updated here**: Phase 19 handles path updates in agent-registry. Phase 16 only moves files.

## Plan Structure
- **Plan 16-01 (Wave 1)**: Migrate all 51 agents, validate, clean up — 3 tasks
