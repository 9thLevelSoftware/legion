# Feedback ROI Analysis: "From Prompt Pack to Orchestration Runtime"

**Date**: 2026-03-06
**Analyst**: Claude (requested by project maintainer)
**Scope**: 12 improvement proposals evaluated against Legion v5.0.0 codebase

---

## Executive Summary

The feedback correctly identifies that Legion is primarily a **prompt assembly and markdown orchestration system** — not a runtime. The 53 agent personas, 25 skills, 12 commands, and 9 adapters are all markdown files interpreted by the host LLM at execution time. There is minimal executable code: one recommendation engine (~290 lines JS), one installer, a checksum generator, a release checker, and a test suite. Everything else is structured instructions that the AI CLI reads and follows.

This is not a weakness — it's the architecture. Legion runs *inside* LLM context windows, not alongside them. It cannot spawn processes, hold sockets, track wall-clock time, or enforce contracts at a systems level. Any proposal that requires runtime enforcement, background monitoring, or process-level control is **architecturally impossible** without fundamentally changing what Legion is.

The analysis below evaluates each proposal on three axes:
- **Feasibility**: Can this actually be built given Legion's architecture?
- **ROI**: Does the benefit justify the complexity added?
- **Risk**: Does this make the system harder to maintain or more fragile?

---

## Proposal-by-Proposal Analysis

### 1. Replace "agent recommendation" with a real capability planner

**Verdict: Partial accept — enrich agent metadata; reject the "capability graph" framing**

The current recommendation engine (`scripts/recommendation-engine.js`) does keyword matching, semantic expansion, division hints, and memory boosts. The feedback proposes adding per-agent capability graphs, task archetypes, historical win-rates, pairing models, and confidence-based routing.

**What's worth doing:**
- Add structured metadata to agent `.md` frontmatter: `languages`, `frameworks`, `artifact_types`, `review_strengths`. This is a catalog improvement, not a planner rewrite. The recommendation engine can score against richer fields with minimal code changes.
- Track win-rate by task type in the existing memory system. OUTCOMES.md already records agent+task+result tuples. Adding a `task_type` field to outcome records and weighting recommendations by archetype success rate is ~50 lines of changes.

**What's not worth doing:**
- A "capability graph" or "pairing model" implies a graph database or inference engine. Legion has no runtime to traverse graphs. The LLM reading the agent catalog already does implicit capability matching — that's what the personality files are for.
- "Confidence score that decides parallel vs sequential vs escalate" — the wave structure already determines parallelism. The adapter capabilities determine whether parallel is possible. Adding a confidence-based override would create a second, competing decision pathway.

**Estimated effort**: 2-3 phases (metadata enrichment + recommendation engine updates + memory integration)
**ROI**: Medium. Better agent selection matters, but the current engine already works well enough that most users override recommendations anyway (hybrid selection is a stated convention).

---

### 2. Add a hard "execution contract" layer before any agent runs

**Verdict: Mostly already exists — formalize what's there, don't add a new layer**

The feedback proposes requiring per-plan contracts with: files allowed/forbidden, output artifacts, verification commands, rollback commands, dependency assumptions, runtime budgets, and required evidence types.

**What Legion already has:**
- Plan YAML frontmatter includes `files_modified` (the allowlist)
- Plans include `verification_commands`
- The authority matrix defines autonomous vs approval-required actions
- The wave executor validates plan structure before spawning agents
- Review findings reference specific files from `files_modified`

**What's worth doing:**
- Add `files_forbidden` to plan frontmatter schema — this is a useful negative constraint that prevents scope creep. Simple addition to the plan template.
- Add `expected_artifacts` (output files the plan must produce) — useful for review validation.
- Document these as a "plan contract" in the plan-critique skill, which already validates plans before build.

**What's not worth doing:**
- "Rollback command or recovery note" — Legion runs inside an LLM. It cannot execute rollback procedures. Git is the rollback mechanism (`git revert`). Adding a rollback field to plans that the system can't actually execute creates false confidence.
- "Expected runtime cost/time budget" — Legion cannot measure tokens consumed or wall-clock time. These are properties of the host CLI, not Legion. This is proposal #4's territory.
- "Required evidence type" per plan — this is proposal #3's territory and belongs in the review skill, not the plan contract.

**Estimated effort**: 1 phase (add `files_forbidden` and `expected_artifacts` to plan schema + update plan-critique validation)
**ROI**: Medium-high for `files_forbidden` specifically. The authority matrix already prevents most drift, but an explicit forbidden list per plan is a cheap, effective guardrail.

---

### 3. Make verification evidence mandatory, not optional

**Verdict: Accept direction, but "evidence bundles" exceed what Legion can enforce**

The feedback wants every build to emit an evidence bundle (changed files, diff stats, command outputs, test results, screenshots, benchmarks, security findings) and every review to cite exact evidence.

**What Legion already has:**
- Review findings must reference specific files and line numbers (review-loop Section 3)
- Reviews include confidence scores (HIGH/MEDIUM/LOW with percentages)
- Fix cycles must prove findings were resolved (Section 6 re-review instructions)
- SUMMARY.md files record what was built and changed

**What's worth doing:**
- Make the existing `verification_commands` field mandatory in plans (currently optional in practice). The plan-critique skill should flag plans without verification commands.
- Add a "verification results" section to SUMMARY.md templates — require agents to record the output of running verification commands.
- Add an "unknowns / not verified" section to review output — this is cheap and valuable for transparency.

**What's not worth doing:**
- "Machine-readable evidence bundles" — Legion is markdown-native by design. Converting to structured evidence bundles requires a parser that doesn't exist and a consumer that doesn't exist. The LLM reading the review output IS the evidence consumer.
- "Screenshots for UI changes" — Legion cannot take screenshots. This depends entirely on the host CLI's capabilities.
- "Benchmark deltas for perf-sensitive work" — requires baseline measurements that Legion doesn't store.
- "Git diff stats" — the LLM can run `git diff --stat` during review. Making this a formal evidence requirement adds template complexity without adding capability.

**Estimated effort**: 1 phase (mandatory verification commands + verification results in summaries)
**ROI**: High for the mandatory verification commands change. Low for the full evidence bundle vision (it's aspirational beyond what the architecture supports).

---

### 4. Add budget, timeout, and token governance to settings

**Verdict: Reject — Legion cannot measure or enforce any of these**

The feedback proposes per-command budgets, per-phase budgets, max agent spawns, max wall-clock per wave, retry policies, fallback model policies, stop conditions, and cost profiles.

**Why this doesn't work:**
- Legion runs as markdown instructions inside an LLM context window. It has no access to token counters, billing APIs, or wall-clock timers.
- "Max agent spawns" — the wave executor already limits this to what the plan specifies. Adding a global cap requires a counter that persists across tool calls, which Legion doesn't have.
- "Max wall-clock per wave" — Legion cannot measure time. The host CLI manages timeouts.
- "Retry policy" — the error handling sections in wave-executor and review-loop already define retry behavior (e.g., agent spawn failure fallbacks, stale loop detection).
- "Fallback model policy" — model selection is adapter-defined. Overriding it from settings would conflict with the adapter abstraction.

**What might be worth doing (minimal version):**
- Add `max_agent_spawns_per_wave` to settings as an advisory limit that the wave executor checks when constructing wave plans. This is the only budget-like constraint Legion can actually enforce, since it controls plan structure.

**Estimated effort**: N/A for the full proposal. Half a phase for the advisory spawn limit.
**ROI**: Very low. The feedback frames this as critical for "a tool orchestrating many agents across 9 runtimes," but Legion doesn't orchestrate runtimes — it runs inside one runtime at a time. The host CLI already manages its own resource constraints.

---

### 5. Add adapter capability negotiation and conformance tests

**Verdict: Partial accept — conformance tests yes, capability negotiation already exists**

The feedback proposes explicit capability flags per adapter and a conformance test suite.

**What Legion already has:**
- Adapter frontmatter already declares capabilities: `parallel_execution`, `agent_spawning`, `structured_messaging`, `native_task_tracking`, `read_only_agents` (ADAPTER.md spec)
- The workflow-common CLI Detection Protocol already reads these capabilities
- The wave executor already branches on `parallel_execution` and `structured_messaging`

**What's worth doing:**
- Add conformance tests. The test suite currently has `agent-contract.test.js`, `installer-smoke.test.js`, `recommendation-engine.test.js`, and several intent/routing tests. Adding adapter-specific validation tests is valuable:
  - Does every adapter define all required fields from ADAPTER.md?
  - Do tool mapping tables reference valid generic concepts?
  - Are detection methods syntactically valid?
  - Do capability flags match the execution protocol described in the adapter body?
- Add `max_prompt_size` and `known_quirks` fields to ADAPTER.md spec. These are genuinely useful for adapters where prompt size matters (e.g., Copilot CLI has smaller context windows).

**What's not worth doing:**
- "Agent spawn test," "review loop test," "GitHub sync test," "failure recovery test" — these are integration tests that require actually running each CLI. Legion is a plugin that runs *inside* CLIs, not a test harness that runs CLIs. This would be a separate project.
- "Capability negotiation" as a runtime protocol — the adapters are already read at startup. There's no negotiation needed; the adapter file IS the capability declaration.

**Estimated effort**: 1-2 phases (adapter schema validation tests + new adapter fields)
**ROI**: High for schema validation tests (prevents the adapter breakage pattern seen in the changelog). Low for integration test suite (requires infrastructure Legion doesn't control).

---

### 6. Move from prompt-heavy markdown commands to a typed orchestration core

**Verdict: Reject — this proposes rebuilding Legion as a different kind of tool**

The feedback proposes compiling markdown into typed internal objects (command schema, step graph, required skills, allowed tools, user-approval checkpoints, artifact inputs/outputs, failure branches), with markdown as source format and JSON/TS objects as execution format.

**Why this contradicts Legion's architecture:**
- Legion's entire value proposition is that it works as a plugin across 9 CLIs with zero runtime dependencies. It's a set of markdown files that any LLM can read.
- A "typed orchestration core" means a TypeScript/JS runtime that parses markdown into objects, validates schemas, manages step graphs, and executes workflows. That's a completely different product — an orchestration framework, not a CLI plugin.
- The "fragility" the feedback cites (dead references, orphan tags, wrong mappings) was addressed by the existing test suite and validation scripts. Those are authoring bugs, not architectural flaws.
- The recent critical fixes were concentrated in a v5.0 release (phase 38-40), which is normal for a major version. The fix pattern doesn't indicate structural fragility.

**What's worth doing instead:**
- Expand the existing validation scripts (`validate.sh`, `release-check.js`) to catch more cross-reference errors at publish time. This addresses the same failure mode without architectural changes.
- Add a `lint-commands` test that validates all command .md files reference existing skills and agents.

**Estimated effort**: 1 phase for expanded validation. The full typed core would be 10+ phases and would break all existing adapters.
**ROI**: Negative for the full proposal (massive effort, breaks existing architecture). High for expanded validation (cheap, prevents the exact bugs cited).

---

### 7. Introduce file ownership, locks, and merge policy during parallel waves

**Verdict: Accept in principle — wave-executor already has conflict detection; add explicit ownership**

The feedback proposes exclusive file ownership, shared read-only zones, handoff markers, conflict resolution by file type, and "hot files" flagged for sequential execution.

**What Legion already has:**
- Wave structure inherently separates concerns — plans within a wave should not touch overlapping files
- Plan frontmatter `files_modified` declares what each plan will change
- The plan-critique skill can (and should) detect file overlaps between plans in the same wave

**What's worth doing:**
- Add file conflict detection to plan-critique: if two plans in the same wave list the same file in `files_modified`, flag it as a BLOCKER before build starts. This is the highest-leverage version of "file ownership."
- Add a `sequential_files` list to wave metadata — files that should only be touched by one agent at a time (e.g., `package.json`, `settings.json`, shared config). Simple, cheap, effective.

**What's not worth doing:**
- Runtime file locks — Legion cannot hold locks. The LLM has no filesystem lock primitive.
- "Handoff markers between waves" — wave sequencing already handles this. Wave 2 doesn't start until Wave 1 completes.
- "Conflict resolution policy by file type" — over-engineering. The simpler rule is: if two plans touch the same file, put them in different waves. This is a planning-time constraint, not a runtime policy.

**Estimated effort**: 1 phase (plan-critique file overlap detection + sequential_files convention)
**ROI**: High. Prevents the most common parallel execution failure mode with minimal complexity.

---

### 8. Improve memory from "outcomes" to "organizational learning"

**Verdict: Partial accept — expand outcome tracking; reject "three memory layers"**

The feedback proposes project memory (conventions, architecture choices), agent performance memory (success by archetype, failure modes, collaboration fit), and user preference memory (plan style, risk tolerance, verbosity, autonomy).

**What Legion already has:**
- OUTCOMES.md tracks agent+task+result with importance scoring and time-based decay
- Memory boosts agent recommendations (recommendation engine integrates memory scores)
- `.planning/CODEBASE.md` already captures conventions and architecture (brownfield analysis)
- `settings.json` already captures user preferences (review mode, max cycles, auto-commit, verbosity, etc.)
- `.planning/PROJECT.md` captures project-level decisions

**What's worth doing:**
- Add `task_type` to outcome records so memory can boost by archetype, not just by agent. This is the feedback's best idea for memory and requires minimal changes.
- Add a "convention violations" counter to outcomes — when reviews find convention violations, record which conventions were violated. This feeds back into future plan instructions.

**What's not worth doing:**
- Three separate memory layers — this triples the memory surface area and the complexity of recall queries. The current single-file approach (OUTCOMES.md) is intentionally simple and degrades gracefully.
- "User preference memory" — this is what `settings.json` is for. Duplicating preferences into a memory layer creates two sources of truth.
- Proactive recall ("this repo tends to reject broad refactors") — requires inference capabilities that depend on the host LLM's ability to synthesize patterns from memory entries. This already happens implicitly when the memory is injected into planning prompts. Making it explicit adds prompt complexity without adding capability.

**Estimated effort**: 1 phase (task_type in outcomes + convention violation tracking)
**ROI**: Medium. Better than the current memory, but the current memory already works. Diminishing returns on memory sophistication in a system that degrades gracefully without it.

---

### 9. Expand /legion:explore into a discovery-first brownfield workflow

**Verdict: Partial accept — enrich codebase-mapper; don't expand explore**

The feedback proposes turning explore into a subsystem with: architecture map, dependency risk map, test coverage heatmap, config/env inventory, dead code finder, migration risk scanner, recommendations, and confidence-ranked opportunities.

**The confusion here:** `/legion:explore` is the pre-planning idea crystallization flow (Polymath agent + structured choices). It's not the brownfield analysis tool. The brownfield analysis is the `codebase-mapper` skill, triggered by `/legion:start` when an existing codebase is detected. The output lives at `.planning/CODEBASE.md`.

**What's worth doing:**
- Enrich the `codebase-mapper` skill output. Currently it produces conventions, stack detection, and patterns. Adding dependency risk assessment and test coverage summary is valuable and fits naturally into the existing analysis flow.
- Make codebase analysis re-runnable standalone via `/legion:quick analyze codebase` (this is already documented as supported).

**What's not worth doing:**
- "Dead code / stale docs finder" — this requires static analysis tools that are language-specific. Legion is language-agnostic. The host LLM can do this during review, but it's not a reliable automated feature.
- "Migration risk scanner" — requires deep knowledge of the specific frameworks in use. Too specialized for a generic orchestration tool.
- "Confidence-ranked opportunities" — this is what the planning flow already does when it decomposes requirements into phases.
- Making brownfield analysis happen "before planning by default" — it already does. The start command detects existing codebases and offers analysis before proceeding to planning.

**Estimated effort**: 1 phase (codebase-mapper enrichment)
**ROI**: Medium. Useful for brownfield projects, but the current analysis is already consumed by 5 commands. Richer output means more tokens consumed per planning prompt.

---

### 10. Add stronger human-control modes instead of just "ask when needed"

**Verdict: Accept — add mode presets to settings**

The feedback proposes five explicit modes: Autonomous, Guarded, Advisory, Surgical, Recovery.

**What Legion already has:**
- The authority matrix defines autonomous vs approval-required decisions
- `settings.json` has review mode (`classic`/`panel`), auto-commit, and GitHub integration settings
- The review loop escalates to users when cycles are exhausted

**What's worth doing:**
- Add a `control_mode` setting with presets that adjust multiple settings simultaneously:
  - `autonomous`: current default behavior
  - `guarded`: require approval for schema changes, auth, secrets, infra (maps to expanding the authority matrix approval list)
  - `advisory`: plans and recommendations only, no file writes (maps to read-only agent spawning)
  - `surgical`: only touch files declared in plan `files_modified` (maps to stricter authority enforcement)
- This is a thin layer over existing mechanisms. Each mode adjusts which authority matrix rules are active.

**What's not worth doing:**
- "Recovery mode" — this is a workflow, not a mode. If something breaks, the user should run `/legion:review` or fix manually. Adding a special mode for this adds complexity without adding capability.

**Estimated effort**: 1-2 phases (settings schema update + authority matrix mode integration + documentation)
**ROI**: High. Enterprise users and cautious adopters get explicit safety guarantees. The implementation is cheap because it's settings-driven, not architecture-driven.

---

### 11. Add observability and replay

**Verdict: Accept observability, reject replay**

The feedback proposes run logs (decisions, agent choices, adapter paths, evidence, cost, failure reasons) and replay (rerun failed plans, different agents, different models, side-by-side comparison).

**What Legion already has:**
- STATE.md tracks current status and last activity
- SUMMARY.md files record what each plan produced
- REVIEW.md files record all findings, fixes, and verdicts
- ROADMAP.md tracks phase-level progress
- OUTCOMES.md records agent performance

**What's worth doing:**
- Add a structured decision log to SUMMARY.md: why specific agents were selected (scores from recommendation engine), which adapter was active, and what the confidence level was. This is cheap — the recommendation engine already produces this data; it just needs to be written to the summary.
- Add cycle-over-cycle diff to REVIEW.md: what changed between cycle 1 and cycle 2. The review loop already tracks this internally (Section 6 delta detection); surfacing it in the review file is a template change.

**What's not worth doing:**
- Full replay — Legion has no execution runtime. It can't "rerun" a plan because there's nothing to rerun; the plan is instructions that an LLM follows. "Rerun with different agents" means "run `/legion:build` again with different agent assignments," which the user can already do by editing the plan.
- "Compare two execution runs side-by-side" — requires storing full execution traces, which would be enormous (full LLM conversation logs). The SUMMARY.md files already provide the comparison basis.
- Token/cost tracking — depends on the host CLI exposing usage metrics, which most don't.

**Estimated effort**: 1 phase (decision log in summaries + cycle diff in reviews)
**ROI**: High for decision logging. It directly improves trust and debuggability. Low for replay (it reimagines Legion as a workflow engine it isn't).

---

### 12. Clean up packaging and repo hygiene

**Verdict: Mostly already addressed — minor cleanup only**

The feedback claims `node_modules` is in source control.

**Actual state:** `node_modules/` contains only `.bin/` and `.package-lock.json` — this is the npm-installed state, not checked-in dependencies. The `package.json` `files` field explicitly lists what gets published: `bin/`, `agents/`, `commands/`, `skills/`, `adapters/`, `settings.json`, `checksums.sha256`, `docs/security/`, `docs/settings.schema.json`. The repo has `checksums.sha256` for integrity verification, `scripts/release-check.js` for release validation, and `scripts/validate.sh` for pre-publish checks.

**What's worth doing:**
- Add `node_modules/` to `.gitignore` if not already there (standard hygiene).
- Verify the `files` field in `package.json` doesn't accidentally include test fixtures or planning files.

**What's not worth doing:**
- "Reproducible build checks" — Legion doesn't have a build step. It's a set of markdown files.
- "Adapter fixture snapshots" — see proposal #5 (conformance tests are better).
- "Security scanning and dependency audit gates" — Legion has zero runtime dependencies. There's nothing to audit.

**Estimated effort**: Less than 1 phase (gitignore + files audit)
**ROI**: Low. The repo is already clean. The feedback's concern is based on seeing `node_modules` in the repo listing, which is misleading.

---

## Prioritized Recommendations

Based on feasibility, ROI, and alignment with Legion's actual architecture:

### Tier 1: High ROI, Low Effort (do first)

| # | Change | Effort | Source |
|---|--------|--------|--------|
| 1 | Add `files_forbidden` and `expected_artifacts` to plan schema | 1 phase | Proposals 2, 7 |
| 2 | Add file overlap detection in plan-critique for same-wave plans | 1 phase | Proposal 7 |
| 3 | Make `verification_commands` mandatory in plans | 0.5 phase | Proposal 3 |
| 4 | Add `control_mode` presets to settings (autonomous/guarded/advisory/surgical) | 1 phase | Proposal 10 |
| 5 | Add decision logging to SUMMARY.md (agent scores, adapter, confidence) | 0.5 phase | Proposal 11 |

### Tier 2: Medium ROI, Medium Effort (do next)

| # | Change | Effort | Source |
|---|--------|--------|--------|
| 6 | Enrich agent frontmatter with structured metadata (languages, frameworks, artifact types) | 1-2 phases | Proposal 1 |
| 7 | Add adapter conformance tests (schema validation, required field checks) | 1 phase | Proposal 5 |
| 8 | Add `task_type` to outcome records + archetype-weighted recommendations | 1 phase | Proposal 8 |
| 9 | Expand validation scripts to catch cross-reference errors | 1 phase | Proposal 6 |

### Tier 3: Worth considering later

| # | Change | Effort | Source |
|---|--------|--------|--------|
| 10 | Enrich codebase-mapper with dependency risk + test coverage | 1 phase | Proposal 9 |
| 11 | Add `max_prompt_size` and `known_quirks` to adapter spec | 0.5 phase | Proposal 5 |
| 12 | Cycle-over-cycle diff in REVIEW.md | 0.5 phase | Proposal 11 |

### Rejected

| Proposal | Reason |
|----------|--------|
| Token/budget governance (#4) | Legion cannot measure tokens or wall-clock time |
| Typed orchestration core (#6) | Requires rebuilding Legion as a different product |
| Full replay system (#11) | No execution runtime to replay against |
| Three memory layers (#8) | Triples complexity for marginal improvement |
| Integration test suite per adapter (#5) | Requires infrastructure Legion doesn't control |
| Recovery mode (#10) | A workflow, not a mode; already covered by existing commands |

---

## The One-Sentence Reframe

The feedback's core thesis — "turn Legion into a strict, testable, budgeted, evidence-backed orchestration engine" — misunderstands what Legion is. Legion is a **prompt-based orchestration protocol**, not a runtime. The right version of this thesis is: **make Legion's prompt-based orchestration more disciplined by adding constraints at planning time, richer metadata for agent selection, and better post-execution observability** — all within the existing markdown-native, zero-runtime-dependency architecture.
