# Changelog

All notable changes to the Legion plugin are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [7.5.0] - 2026-05-06

### Added
- **`/legion:polish`** — Standalone command for ad-hoc code cleanup. Runs a structured 4-pass rubric (Comment Cleanup → Code Simplification → Readability Refactoring → Consistency Normalization) on target files with safety rails that revert any file whose tests regress. Supports `--scope=changed|dependents|directory`, `--dry-run`, `--phase N`, and target path arguments.
- **`testing-code-polisher` agent (#49)** — New Testing-division specialist for code clarity, comment quality, naming conventions, structural simplification, and convention consistency. Includes `review_strengths` metadata for recommendation engine scoring.
- **`code-polish` skill** — Reusable 4-pass polish engine consumed by both `/legion:polish` and the review pipeline integration. Features convention detection (CLAUDE.md > CODEBASE.md > code sampling), severity split (auto-apply vs. flag-for-review), and a 50-file scope cap.
- **Review pipeline integration** — `/legion:review` now runs code polish as a post-review step (Step c4) after the QA loop passes. Non-blocking: polish failures never prevent phase completion. Controlled by `review.polish` (boolean, default `true`) and `review.polish_scope` (enum, default `"dependents"`) in settings.
- **`review-loop` Section 7.5** — Thin integration point in the review-loop skill documenting polish dispatch, activation check, and failure mode handling.

### Changed
- **Settings schema** — Added `review.polish` and `review.polish_scope` to `docs/settings.schema.json`.
- **Agent catalog** — Testing division updated from 6 to 7 agents in `skills/agent-registry/CATALOG.md`.
- **CLAUDE.md** — Updated command table (18 commands), skill index (added `|polish:{code-polish/SKILL.md}`), agent index (added `testing-code-polisher.md`), division counts (49 agents, Testing 7).
- **README.md** — Added v7.5.0 section, `/legion:polish` in commands table and workflow diagram, updated all count references.
- **Website** (`docs/index.html`) — Added v7.5.0 section with 6 feature cards, updated stats bar, commands table, workflow visual, division grid, and footer.

### Stats
- 18 commands, 33 skills, 49 agents
- Agent personality line range: 155-679
- 3 new files, 6 modified files

## [7.4.0] - 2026-05-04

### Schema reconciliation
- `docs/settings.schema.json`: added `dispatch` block, `models.planning_reasoning` (deprecated), `execution.use_worktrees` (experimental), and `memory` pruning fields. `settings.json` is unchanged and validates clean.
- `docs/schemas/plan-frontmatter.schema.json`: replaced full schema. Plural `agents` array, structured `expected_artifacts` objects, `must_haves` block, `oneOf` `phase` form for legacy/current compatibility, optional `recommendation` reservation.

### New executable validators (CI + soft-warn)
- `scripts/validate-settings.js` — runs Ajv against settings; CI hard fail; bootstrap soft-warn via workflow-common-core.
- `scripts/validate-plan-frontmatter.js` — validates each PLAN.md against the schema; CI hard fail; soft-warn after `/legion:plan` writes.
- `scripts/validate-command-spawn-truthfulness.js` — CI-only check that every command containing spawn language either invokes `Agent(` or declares `mode: inline-persona`.

### Plan migration
- All `.planning/phases/**/PLAN.md` files migrated to v2 frontmatter shape via `scripts/migrate-plans-to-v2.js` (one-shot; removed in follow-up commit).

### `/legion:explore` refactor
- `commands/explore.md`: rewritten to inline-persona pattern. Frontmatter declares `mode: inline-persona`, `inline_persona: polymath`. Execution context loads `workflow-common-core`, `questioning-flow`, `polymath-engine`. No subagent spawn for the user-facing loop.
- `skills/workflow-common-core/SKILL.md`: `/legion:explore` added to canonical command-to-skill map (was only present in the deprecated compat shim).

### 4.7 audit
- Rubric bumped to v1.1 with new category CAT-11 (Mechanical Contract Drift).
- Mechanical re-score pass against the 64 already-audited files; new findings appended to FINDINGS-DB.jsonl.

### devDependencies
- Added `ajv@^8` and `gray-matter@^4`. Both are dev-only; runtime never imports them.

## [7.3.3] - 2026-04-17

### Fixed
- **226 audit findings resolved** — Comprehensive v4.7 audit remediation across 91 files:
  - All user-facing gates now use AskUserQuestion + closure language
  - 4-field dispatch specifications (when/why/how-many/mechanism) added to all agent spawn sites
  - Vague triggers ("marketing keywords") replaced with concrete conditions (MKT-* prefix)
  - Completion Gate sections added to 12 skills
  - ALWAYS/NEVER/OBSESSED persona language replaced with calibrated alternatives
  - Invalid agent IDs corrected (testing-evidence-collector, engineering-devops-automator, marketing-content-creator)

## [7.3.2] - 2026-04-15

### Fixed
- **Audit session infrastructure** — Added audit rubric, session tracking, and findings database for systematic codebase review.

## [7.3.1] - 2026-04-10

### Fixed
- **`/legion:explore` Polymath not spawning** — Added `Agent` to `allowed-tools` frontmatter. Previously the command narrated Polymath in third person instead of actually spawning a sub-agent.
- **`/legion:plan` Invalid Tool Call** — Added `Agent` to `allowed-tools` frontmatter. Architecture proposal and plan critique steps tried to spawn Explore agents but the tool was not permitted.
- **Plan critique default agent** — Changed from deleted `testing-qa-verification-specialist` to `testing-qa-verification-specialist` (the agent that absorbed it in v7.1.0).
- **10 phantom agent references in config files** — Completed the config sweep missed during v7.1.0 consolidation (53→48). Updated `authority-matrix.yaml`, `intent-teams.yaml`, `roster-gap-config.yaml`, and `STATE.md` to reference correct consolidated agent IDs.
- **STATE.md agent count** — Corrected from "53 agents" to "48 agents" (2 occurrences).

### Added
- **`/legion:validate` Steps 7b and 8** — Config agent reference validation checks all agent IDs in `authority-matrix.yaml`, `intent-teams.yaml`, and `roster-gap-config.yaml` against actual agent files. Agent roster consistency check verifies STATE.md counts match reality.
- **`config-agent-references.test.js`** — 74-assertion regression test for config↔agent alignment. Validates authority-matrix, intent-teams, roster-gap-config, and STATE.md agent counts against the `agents/` directory.

## [7.3.0] - 2026-04-05

### Added
- **Dynamic Knowledge Index** — Compressed pipe-delimited directory index in AGENTS.md and CLAUDE.md mapping all 48 agents (by division) and 31 skills (by category). Combined with "Prefer retrieval-led reasoning over pre-training-led reasoning" directive, eliminates LLM laziness during agent spawning by making file locations always-in-context. Based on [Vercel's Context Engineering research](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals).
- **`scripts/generate-knowledge-index.js`** — Generator script that scans `agents/` and `skills/` directories to rebuild the compressed index. Supports `--patch` flag to update AGENTS.md and CLAUDE.md in-place. Reports uncategorized files as warnings.
- **Agent-creator index regeneration** — `agent-creator` skill now calls `generate-knowledge-index.js --patch` after creating new agents to keep the index current.

### Changed
- **wave-executor Step 2** — Personality file read now labeled `RETRIEVAL-LED — MANDATORY` with explicit failure mode description and reference to Dynamic Knowledge Index.
- **workflow-common-core Personality Injection** — Added retrieval-led reasoning directive as non-negotiable requirement.
- **AGENTS.md synced with CLAUDE.md** — Added 5 missing commands (board, retro, ship, learn, validate), fixed stale division counts, updated workflow section.

## [7.2.0] - 2026-03-31

### Added
- **`/legion:validate`** — State file integrity checker for `.planning/` artifacts. Validates schema conformance, cross-references between plans and state, and detects corruption. Supports `--ci` flag for pipeline integration and `--fix` for auto-remediation.
- **Hooks integration skill** (`skills/hooks-integration/`) — Claude Code hooks for lifecycle automation: pre-build plan validation, post-build notification, pre-ship security gate. All opt-in with graceful degradation.
- **Structured output schemas** (`docs/schemas/`) — JSON Schema validation for plan frontmatter, summaries, outcomes records, and review findings.
- **Git worktrees** — Opt-in filesystem isolation during parallel agent waves via `execution.use_worktrees` setting. Full lifecycle: create → spawn → merge with conflict detection → cleanup.
- **Extended thinking for planning** — `models.planning_reasoning` setting enables deeper requirement analysis and wave ordering rationale in phase-decomposer and polymath-engine.
- **Quick `--fix` flag** — Inline review + PR creation in a single `/legion:quick` command with GitHub issue linking support.
- **Plan `--auto-refine` flag** — Automatic re-planning when plan critique returns CRITICAL findings. Max 2 refinement cycles with user fallback.
- **Memory pruning** — OUTCOMES.md pruning with archive mechanism via `--prune` flag on `/legion:learn`. Configurable `auto_prune`, `prune_threshold`, and `prune_age_days` settings.
- **Post-execution boundary verification** — Authority-enforcer validates agents stayed within `files_modified` scope after execution. Guarded mode warns; surgical mode auto-reverts.
- **State file quick validation** — workflow-common-core runs lightweight state validation on every command invocation.

### Changed
- **10 agents enriched** — Thin agents (88-131 lines) expanded to 200-338 lines with domain-specific depth: code review rubrics, refactoring frameworks, spatial interaction patterns, Livewire lifecycle edge cases, growth experiment templates.
- **Agent roster consolidated (49 → 48)** — data-analytics-reporter + support-analytics-reporter merged into data-analytics-engineer.
- **Security review hardened** — Dependency vulnerability scanning (6 ecosystems), secret detection (12+ patterns), supply chain integrity checks.
- **OpenCode adapter enriched** — Model routing and troubleshooting guidance.
- **Aider adapter downgraded** — Reclassified to community-contributed tier with manual operation guide.
- **Update command enriched** — `--check` flag, changelog display, post-install verification.
- **Advise command enriched** — Memory recording for advisory sessions.
- **Retro command enriched** — Plan feedback loop via RETRO.md consumption in subsequent planning.

### Stats
- 17 commands, 31 skills, 48 agents
- Agent personality line range: 155-677
- 61 files changed, +2528/-710 lines across Tier 1+2+3

## [7.1.0] - 2026-03-30

### Added
- **`/legion:retro`** — Structured sprint retrospective command. Reviews completed phases/milestones, identifies what worked vs. didn't, surfaces reusable patterns, and writes findings to `.planning/memory/RETRO.md`. Supports `--phase N`, `--milestone M`, cross-project mode, and `--dry-run`.
- **`/legion:ship`** — Ship & deploy pipeline command. Pre-ship quality gate (6 checks), structured PR creation, deployment verification, and optional canary monitoring loop (`--canary`). Extends the plan → build → review lifecycle with a formal shipping stage.
- **`/legion:learn`** — Explicit pattern recording command. Record, recall, and list project-specific patterns, pitfalls, and preferences. Operationalizes the memory-manager's PATTERNS.md, ERRORS.md, and PREFERENCES.md files.
- **Ship pipeline skill** (`skills/ship-pipeline/`) — Pre-ship gates, ship report generation, PR body template, and canary monitoring protocol.
- **Security review skill** (`skills/security-review/`) — OWASP Top 10 structured checklist and STRIDE threat modeling. Plugs into review-evaluators as 5th evaluator type.
- **Security Evaluator** and **Completeness Evaluator** — 5th and 6th review evaluator types in review-evaluators skill.
- **Plan-stage 7-pass design review** (design-workflows Section 7) — Scores design completeness across 7 dimensions (0-10) during `/legion:plan`.
- **Design consultation workflow** (design-workflows Section 8) — Aesthetic direction proposals, safe-vs-risk framing, AI slop blacklist, font guidance, coherence validation.
- **Post-implementation design audit** (design-workflows Section 9) — 74-item audit across 10 categories with dual A-F scoring.
- **Auto-pipeline mode** (`/legion:plan --auto`) — Chains board → decomposition → critique → design review → security scan without user gates.
- **Backend-frontend parallel design waves** — Wave 2A (backend architecture) + Wave 2B (frontend design) + Wave 3 (integration design).

### Changed
- **Agent roster consolidated (53 → 49)** — 4 merges: Evidence Collector + Reality Checker → QA Verification Specialist; Instagram Curator + Twitter Engager → Social Platform Specialist; Content Creator + Social Media Strategist → Content & Social Strategist; Infrastructure Maintainer + DevOps Automator → Infrastructure & DevOps Engineer.
- **9 agents enhanced** with gstack-inspired traits: sprint-prioritizer (10-star thinking, scope modes), senior-developer (architecture lock-in, code review authority), ui-designer (7-pass scoring, AI slop detection, font expertise), ux-architect (performance-as-design), ux-researcher (3-layer competitive analysis), security-engineer (OWASP checklist, STRIDE), technical-writer (post-release doc sync).
- **Completeness checks** added to plan-critique skill.
- **Marketing division** restructured: 8 → 4 agents with clear strategy → execution hierarchy.

### Stats
- 16 commands, 30 skills, 49 agents (at time of release)

## [7.0.0] - 2026-03-19

### Added
- **Board of Directors** (`/legion:board`) — governance escalation tier with dynamic agent composition, 5-phase deliberation (assess → discuss → vote → resolve → persist), and audit trail persistence
- **Cross-CLI Dispatch** — infrastructure for routing work to external CLIs (Gemini, Codex, Copilot) via capability-based matching with file-based result handoff
- **Multi-pass review evaluators** — four specialized evaluator types (Code Quality, UI/UX, Integration, Business Logic) with domain-specific pass lists
- **Anti-sycophancy review rules** — injected into all review agent prompts to ensure rigorous, specific, actionable feedback
- **Structured review requests** — auto-populated review context from SUMMARY.md files
- Dispatch configuration sections in Gemini, Codex, and Copilot adapters
- Board and dispatch settings in settings.json with JSON Schema validation

### Changed
- `review` settings extended with `evaluator_depth` and `coverage_thresholds`
- Status dashboard shows recent board decisions and pending conditions
- Workflow-common-core skill mapping includes `/legion:board` command

## [6.0.4] - 2026-03-13

### Fixed
- **Codex CLI detection mismatch** — `detection.primary` was checking a nonexistent `CODEX_VERSION` environment variable instead of the actual `.codex/prompts/legion-start.md` file path used by workflow-common and the installer. Detection now matches across all three sources.
- **Codex CLI model names outdated** — Replaced legacy `o3`/`codex`/`o3-mini` model references with current `gpt-5.4`/`gpt-5.3-codex`/`gpt-5.1-codex-mini`. Restored verified `spawn_agents_on_csv` reference and noted `.codex/prompts/` deprecation in favor of skills.
- **Codex CLI quirk accuracy** — `sandbox-execution-only` renamed to `sandbox-by-approval-mode` (sandbox behavior depends on approval mode). `no-interactive-prompts` renamed to `no-structured-question-tool` (CLI is interactive, just lacks structured question tools).
- **Gemini CLI parallel execution outdated** — Updated `parallel_execution` from `false` to `true` (shipped Jan 2026). Rewrote wave execution section for parallel subagent dispatch. Added `experimental-agent-spawning` quirk. Corrected `max_prompt_size` from 1000000 to 1048576.
- **OpenCode capabilities overstated** — `parallel_execution` corrected from `true` to `false` (Task tool blocks synchronously). `native_task_tracking` corrected from `true` to `false` (not a built-in feature). Added `sequential-task-tool` quirk.
- **Copilot CLI context window** — `max_prompt_size` updated from 64000 to 128000. Renamed `short-context-window` quirk to `model-dependent-context-window`.
- **Kiro CLI subagent limitations undocumented** — Added `subagent-tool-restrictions` quirk and new documentation section listing tools unavailable in subagents (no MCP, no web_search, no web_fetch).

### Added
- **Detection cross-reference test** — New conformance test verifying that each adapter's `detection.primary` value is semantically consistent with the corresponding workflow-common Step 1 entry. Prevents detection mismatches like the Codex bug from going undetected.
- **Prompt size enforcement** — Wave executor Step 4.9 estimates token count before spawning and warns at 80% of `adapter.max_prompt_size`, blocks at 95%. Operationalizes the previously declared-but-unenforced `max_prompt_size` field.
- **Agent path resolution for non-Claude runtimes** — Step 1.5 in the Agent Path Resolution Protocol now checks `~/.legion/agents/` before falling through to manifest.json, matching the `storageLayout: 'legion'` used by 8 of 9 runtimes.

## [6.0.3] - 2026-03-11

### Fixed
- **Release checksum drift** — `checksums.sha256` generation now derives from the actual npm publish allowlist plus npm's always-included package metadata and `bin` entrypoints, preventing CI from regenerating a different manifest during publish.
- **Runtime metadata conformance** — Synced the Windsurf adapter frontmatter display name with the authoritative runtime metadata contract used by the conformance tests.
- **Package metadata sync** — Updated the lockfile package version to match the published package version so release metadata is internally consistent.

## [6.0.2] - 2026-03-08

### Fixed
- **AskUserQuestion enforcement (strengthened)** — Added MANDATORY rule in CLAUDE.md (top-level project instructions) requiring all `/legion:` commands to use the `AskUserQuestion` tool for user-facing questions. Reinforces the workflow-common-core instruction from 6.0.1 which alone was insufficient.

## [6.0.1] - 2026-03-08

### Fixed
- **AskUserQuestion enforcement** — Added explicit instruction in workflow-common-core requiring all `adapter.ask_user` calls to use the `AskUserQuestion` tool instead of outputting questions as raw text.

## [6.0.0] - 2026-03-07

### Added
- **Plan schema hardening** — `files_forbidden`, `expected_artifacts`, mandatory `verification_commands` in all plan frontmatter.
- **Wave safety** — File overlap detection and `sequential_files` convention to prevent parallel write conflicts.
- **Control modes** — `autonomous`/`guarded`/`advisory`/`surgical` presets in settings.json with per-mode authority enforcement.
- **Observability** — Decision logging in SUMMARY.md, cycle-over-cycle diff tracking in REVIEW.md.
- **Agent metadata enrichment** — `languages`, `frameworks`, `artifact_types`, `review_strengths` fields in all 53 agent frontmatter files.
- **Recommendation engine v2** — Metadata-aware scoring, `task_type` tracking in OUTCOMES.md, archetype-weighted boosts.
- **Validation and conformance** — Adapter conformance tests, cross-reference validation, lint-commands, `max_prompt_size`/`known_quirks` in ADAPTER.md.
- **Codebase mapper enrichment** — Dependency risk assessment and test coverage summary in CODEBASE.md output.
- **Polymath advanced modes** — Onboard, compare, and debate modes in `/legion:explore`.
- **Authority and conflict resolution** — Escalation automation protocol, structured agent-to-agent communication conventions.
- **Intent routing v2** — Natural language intent parsing and context-aware command suggestions.

### Changed
- All 53 agent personality files enriched with structured metadata for recommendation engine consumption.
- All 9 adapter files updated with conformance metadata (`max_prompt_size`, `known_quirks`).
- Control mode system integrated across build, review, and plan commands.

### Stats
- 11 phases, 22+ plans executed
- 1056 tests passing

## [5.0.0] - 2026-03-05

### Added
- **`/legion:explore` command** — Polymath-driven codebase exploration with breadth-first discovery, curiosity-driven deep dives, and structured insight reports.
- **Authority boundaries** — YAML domain matrix defining autonomous vs. human-approval-required decisions per agent division, with escalation protocol enforcement.
- **Intent-driven execution** — Flag-based task filtering (`--just-harden`, `--just-document`, `--skip-frontend`, `--just-security`) for scoped phase execution without full rebuild.
- **Two-wave parallelism** — Wave executor enhanced with parallel dispatch within dependency waves, doubling throughput for multi-plan phases.
- **Environment mapping** — Automatic detection of runtime environment with path enforcement, adapter diagnostics, and platform-specific configuration validation.
- **`engineering-security-engineer` agent** — New specialist for security hardening, threat modeling, and vulnerability assessment (Engineering division, 53 agents total).
- **`product-technical-writer` agent** — New specialist for API documentation, user guides, and technical content (Product division).

### Changed
- Agent roster refined: removed 2 niche marketing agents, added 2 critical specialists (security-engineer, technical-writer) — net count 51 → 53.
- All project state files, commands, skills, adapters, and documentation updated from 52 to 53 agent count.
- Polymath agent (`agents/polymath.md`) added as cross-division generalist for exploration workflows.

### Stats
- 5 phases, 22 plans, 32 requirements fulfilled
- 124 commits, 332 files changed, +66,764 / -3,861 lines
- 377+ tests passing

## [3.0.2] - 2026-03-04

### Fixed
- **Critical**: Fixed `plugin_discovery_glob` in all 9 adapters — agent auto-discovery was broken on every runtime.
- **Critical**: Removed circular self-dependency in `package.json`.
- **Critical**: Removed dead file path references in 3 agent personalities (`design-ux-architect`, `testing-evidence-collector`, `testing-qa-verification-specialist`).
- **Critical**: Removed orphan `</output>` XML tags from all 11 command files.
- **Critical**: Fixed `settings.schema.json` to allow `$schema` property.
- Fixed corrupted markdown headings in `engineering-mobile-app-builder`, `engineering-rapid-prototyper`, and `marketing-app-store-optimizer` (4 headings with encoding artifacts).
- Fixed `agent.md` git add target (`SKILL.md` → `CATALOG.md`) and removed dead `workflow-common.md` reference.
- Fixed hard-coded review cycle limit in `review.md` — now reads `{max_cycles}` from settings.
- Fixed hard-coded project name in `review.md` completion message.
- Fixed `portfolio.md` casing inconsistency (`PORTFOLIO.md` → `{adapter.global_config_dir}/portfolio.md`).
- Made `github-sync` conditional in `milestone.md` (only loads when `gh` is authenticated).
- Added `design-workflows` conditional load to `plan.md` for DSN-* requirements.
- Fixed `Step 4.5` → `Step 6` references in `phase-decomposer` and `review-panel` skills.
- Fixed `agent-creator` validation threshold (50 → 80 lines) and Section 4 heading format.
- Fixed `workflow-common-core` skill mapping for `/legion:start` (added `portfolio-manager`, moved `codebase-mapper` to always-loads).
- Fixed `review-loop` escalation trigger to include WARNINGs alongside BLOCKERs.
- Fixed `wave-executor` agent extraction to use frontmatter only (removed body-search fallback).
- Removed duplicated command-to-skill mapping table from `workflow-common` shim.
- Fixed Engineering division count (`7` → `8` agents) in `portfolio-manager`.
- Fixed recommendation engine agent eviction to replace lowest-ranked (last) instead of highest-ranked (first).
- Added 10-second timeout to `fetchNpmLatest` in installer to prevent hanging on unresponsive registry.
- Updated agent count from 51 to 52 across project state files.

## [3.0.1] - 2026-03-04

### Changed
- Synced package versioning with CHANGELOG and added release consistency checks.
- Added runtime support tiers and clearer installer/runtime diagnostics.
- Updated README metrics and support disclosures to match the repository state.
- Promoted minimum agent size enforcement to a hard validation failure (80-line floor).

### Added
- Installer integrity verification with `--verify` using `checksums.sha256`.
- New release guardrails (`scripts/release-check.js`) for docs/version/skill-map consistency.
- Default `settings.json` configuration and JSON schema.
- Baseline CI and smoke tests for installer workflows.
## [3.0.0] - 2026-03-02

### Changed
- **Project identity**: Rebranded from "The Agency Workflows" to "Legion" — *"My name is Legion, for we are many."*
- All 10 commands renamed from `/agency:*` to `/legion:*` namespace
- Plugin name changed from `agency-workflows` to `legion` — install via `claude plugin install legion`
- Plugin version bumped to 3.0.0 across plugin.json and marketplace.json
- All 17 skill files updated with `/legion:` command references
- workflow-common shared constants updated to Legion namespace
- README.md, CLAUDE.md, CONTRIBUTING.md rewritten with Legion branding
- Commit message prefixes updated from `feat(agency):` to `feat(legion):`

### Added
- Shoulders of Giants attribution entry crediting msitarzewski/agency-agents as origin of the 51 agent personalities

### Unchanged
- 51 agent personality files (contain zero "agency" references — no changes needed)
- All features, workflows, and capabilities remain identical

### Repository
- GitHub repository renamed from `9thLevelSoftware/agency-agents` to `9thLevelSoftware/legion`

## [2.0.0] - 2026-03-02

### Changed
- Converted from `.claude/` directory config to proper Claude Code plugin format
- Moved 9 commands from `.claude/commands/agency/` to `commands/` at plugin root
- Converted 15 skills to `skills/{name}/SKILL.md` directory structure with co-located templates
- Migrated 51 agent files from `agency-agents/{division}/` to flat `agents/` directory
- Updated all internal path references to plugin-relative format
- Agent frontmatter now includes `name`, `description`, and `division` fields

### Added
- `/agency:advise` command — read-only expert consultation (10 commands total)
- `skills/review-panel/SKILL.md` — dynamic multi-reviewer composition with domain-weighted rubrics
- `skills/plan-critique/SKILL.md` — pre-mortem analysis and assumption hunting
- Optional plan critique step in `/agency:plan` workflow (step 8.5)
- Dynamic review panel mode in `/agency:review`
- `.claude-plugin/plugin.json` — plugin manifest for Claude Code recognition
- `.claude-plugin/marketplace.json` — marketplace entry for `claude plugin marketplace add`
- `settings.json` — plugin settings file (empty — multi-agent system, not single-agent)
- Agent registry updated with plugin-relative paths for all 51 agents
- Installation via `claude plugin marketplace add 9thLevelSoftware/agency-agents` + `claude plugin install agency-workflows@agency-workflows`
- Local development testing via `claude --plugin-dir .`

### Removed
- `.claude/commands/agency/` directory (commands migrated to `commands/`)
- `.claude/skills/agency/` directory (skills migrated to `skills/`)
- `agency-agents/` directory (agents migrated to `agents/`)
- `.planning/templates/` directory (templates co-located with questioning-flow skill)

## [1.0.0] - 2026-03-01

### Added
- **9 commands**: `/agency:start`, `/agency:plan`, `/agency:build`, `/agency:review`, `/agency:status`, `/agency:quick`, `/agency:portfolio`, `/agency:milestone`, `/agency:agent`
- **15 skills** (9,196 lines): workflow-common, agent-registry, questioning-flow, phase-decomposer, wave-executor, execution-tracker, review-loop, portfolio-manager, milestone-tracker, memory-manager, agent-creator, github-sync, codebase-mapper, marketing-workflows, design-workflows
- **51 agent personalities** across 9 divisions: Engineering (7), Design (6), Marketing (8), Testing (7), Product (3), Project Management (5), Support (6), Spatial Computing (6), Specialized (3)
- Full personality injection — agents spawned with complete .md as system instructions
- Wave-based parallel execution with max 3 tasks per plan
- Hybrid agent selection — workflow recommends, user confirms
- Dev-QA review loop with max 3 cycles before escalation
- Cross-session memory with importance scoring and time-based decay
- GitHub integration (issues, PRs, milestones) — opt-in, graceful degradation
- Brownfield codebase analysis — architecture mapping before planning
- Marketing workflows — campaign planning, content calendars, channel coordination
- Design workflows — design systems, UX research, three-lens review (brand, accessibility, usability)
- Multi-project portfolio management
- Milestone tracking and archiving

