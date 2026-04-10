# Inspiration Audit & Adoption Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Audit Legion against 10 inspiration sources, identify patterns to adopt and anti-patterns to purge, then implement the highest-value changes.

**Architecture:** Cherry-pick proven patterns from the best orchestration tools in the Claude Code ecosystem while maintaining Legion's core identity (personality-first agents, wave execution, human-readable state).

**Tech Stack:** Claude Code plugin (markdown commands/skills/agents), no runtime dependencies

---

## Part 1: Research Synthesis — Keep/Purge Analysis

### Existing Inspirations (All 6 Re-Reviewed)

#### agency-agents (msitarzewski) — The Foundation
**What Legion took:** The 51 specialist personalities (80-350 line character sheets with deep expertise, communication styles, hard rules, personality quirks across 9 divisions).

| KEEP | WHY |
|------|-----|
| Personality-first agent design | These are not role labels — they are full character sheets. This is Legion's differentiator |
| 9-division structure | Engineering, Design, Marketing, Testing, Product, PM, Support, Spatial, Specialized — broad coverage |
| Agent frontmatter contract (YAML metadata) | Enables programmatic cataloging and recommendation by agent-registry |
| Deep expertise per agent | 80-350 lines gives enough context for genuine specialist behavior |

| PURGE | WHY |
|-------|-----|
| Original Agency branding/namespace | Already done in v3.0 rebrand |
| No orchestration layer | agency-agents had personalities but no workflow — Legion provides this |

**Verdict: Core foundation preserved. No changes needed.**

#### GSD (Get Shit Done)
| KEEP | WHY |
|------|-----|
| Fresh sub-agent contexts (context rot mitigation) | Claude degrades at 40-50% context utilization — fresh contexts per task maintains quality |
| Structured plans with explicit verification criteria | Every task must have testable `<verify>` and `<done>` definitions |
| Thin orchestrator pattern (30-40% context) | Heavy work delegated to sub-agents, orchestrator stays lean |
| Codebase mapping for brownfield | Legion already has `codebase-mapper` — validated pattern |
| STATE.md for session continuity | Legion already has this — validated |
| Wave-based parallel execution | Legion already has `wave-executor` — validated |
| Quick mode for ad-hoc tasks | Legion already has `/legion:quick` — validated |

| PURGE | WHY |
|-------|-----|
| Context rot as central architecture | Temporary workaround for current LLM limitations — will become unnecessary overhead |
| No agent personalities | GSD spawns generic instances — Legion's personality-first approach is superior |
| 4 parallel researchers for every phase | Wasteful when domain is well-understood |
| Manual-only UAT verification | No automated test execution or quality gate |

#### Conductor Orchestrator
| KEEP | WHY |
|------|-----|
| Evaluate-loop pattern (build → evaluate → fix) | Better than build-then-hope; catches different failure classes |
| Progressive disclosure for skills | ~100 tokens metadata at startup, full instructions only when activated — **Legion should adopt this** |
| Knowledge/retrospective layer | Structured `errors.json` mapping error patterns to fixes |
| Authority matrix | Explicit decision boundaries prevent agent overreach |
| Board of Directors for strategic decisions | Multiple perspectives (security, UX, architecture) for big decisions — maps to Legion's advisory model |

| PURGE | WHY |
|-------|-----|
| 42 skills + 16 agents + 22 commands | Bloated — most users use 5-6 commands |
| 3-5x API cost for quality gates | Marginal quality improvement doesn't justify cost on routine tasks |
| Full automation with `/go` (no checkpoints) | Risky and expensive runaway sessions |
| Bundled third-party skill libraries | Version coupling and maintenance burden |
| Theatrical Board voting | One model generating 5 slightly different perspectives — simulated diversity, not real |

#### Shipyard
**What Legion took:** Wave-based execution, max-3-tasks-per-plan constraint, atomic commits per completed plan.

| KEEP | WHY |
|------|-----|
| Wave model (parallel within, sequential between) | Maximum parallelism without dependency conflicts — in `wave-executor` |
| Max 3 tasks per plan | Keeps work focused and reviewable — enforced in `phase-decomposer` |
| Atomic commits per completed plan | Independently revertable units of work |
| Agent role boundaries | Clear separation of who does what |

| PURGE | WHY |
|-------|-----|
| 29 commands | Full project management platform — too much |
| Checkpoint/rollback system | Over-engineered for our use case |
| Complex hook infrastructure | Unnecessary complexity |

**Verdict: Core patterns preserved in wave-executor and phase-decomposer. No changes needed.**

#### Best Practice Config
**What Legion took:** Plugin architecture (.claude/ directory structure), agent frontmatter schema (YAML with name, description, color, division).

| KEEP | WHY |
|------|-----|
| commands → skills → agents structure | Canonical Claude Code plugin pattern — clean separation of concerns |
| Agent frontmatter YAML schema | Enables programmatic cataloging in agent-registry |
| Permission patterns | Standard plugin distribution model |

| PURGE | WHY |
|-------|-----|
| RPI workflow | Too domain-specific |
| Custom hooks infrastructure | Unnecessary complexity |

**Verdict: Architecture pattern fully adopted. No changes needed.**

#### Daem0n-MCP
**What Legion took:** Semantic memory architecture — store/recall/decay primitives, importance scoring, time-based decay computed at recall time (not destructive aging).

| KEEP | WHY |
|------|-----|
| Outcome tracking with importance scoring | After each build/review, outcomes recorded with agent ID, task type, success/failure |
| 4-bracket decay curve (1.0 → 0.1) | System improves over time without getting stuck in historical patterns |
| Compute decay at recall, not storage | Full history preserved for audit; relevance adapts naturally |
| Graceful degradation | Memory layer optional — works identically without it |

| PURGE | WHY |
|-------|-----|
| Hook-driven architecture | Memory ops triggered on every tool call — too chatty |
| MCP server dependency | Requires running server process |
| Background sync | Unnecessary complexity |

**Verdict: Core memory primitives preserved in memory-manager. Consider adopting structured PATTERNS.md and ERRORS.md (see Tier 2, Task 7) to complement OUTCOMES.md.**

#### Feature-dev (Anthropic Official)
| KEEP | WHY |
|------|-----|
| 7-phase guided workflow | Cleanest workflow design in the landscape — each phase has one job |
| Human checkpoints at critical moments | Discovery + architecture decisions need human judgment |
| Competing architecture designs (2-3 approaches) | Different trade-offs (minimal, clean, pragmatic) — let user choose |
| Confidence-based review filtering (80%+) | Only surfaces actionable issues, prevents noise |
| Three agents is the right number | Explorer, Architect, Reviewer — no inflation |

| PURGE | WHY |
|-------|-----|
| No state persistence across sessions | Progress lost if session ends — Legion's .planning/ approach is better |
| No memory or learning | Each invocation starts from scratch |
| No quick mode | Every feature goes through all 7 phases even for trivial changes |

---

### New Inspirations

#### code-foundations (ryanthedev) — Stars: 101
**What it is:** Claude Code plugin that injects engineering discipline from *Code Complete* and *A Philosophy of Software Design* via 614 checklist items across 27 skills.

| KEEP | WHY |
|------|-----|
| Skills-as-personas pattern | Complete engineering discipline loaded as agent personality, not just instructions |
| Anti-rationalization tables | Pre-empt common excuses — counters LLM sycophantic agreement |
| Evidence-backed checklists with `hard-data.md` | Empirical citations (Card 1986, Basili 1984) give calibrated confidence |
| Shell scripts as schema enforcement gates | Forces agent output conformance without relying on LLM JSON reliability |
| Consensus distillation | 7 agents vote on 99 checks → 14 core — solid methodology for curation |
| Scope discipline ("pseudocode equals scope") | Prevents AI scope creep during execution |
| Cost-tiered model assignment | Haiku for extraction, Sonnet for reasoning — transparent and configurable |

| PURGE | WHY |
|-------|-----|
| 614-check PR review pipeline | Overkill for daily use — spawning 10+ agents across 5 phases for 3 files is excessive |
| All prompts, no runtime code | Can't test prompts deterministically — fragile to LLM behavior changes |
| Heavy token consumption from full skill loading | Loading 10 skills for PR review consumes massive context |
| No feedback loop / learning | Every review starts from scratch with static checklists |

#### beads (steveyegge) — Stars: 17,877
**What it is:** Go-based Git-backed issue tracker and persistent memory system for AI agents. The `bd ready` command and dependency DAG are the standout features.

| KEEP | WHY |
|------|-----|
| Git-native state (agent context branches with code) | Agent memory branches and merges with codebase — elegant |
| `ready` primitive (dependency-aware task selection) | Agents query what's unblocked instead of parsing lists — eliminates whole class of mistakes |
| Hash-based collision-resistant IDs | 30 agents on 10 branches can create tasks without coordination |
| Semantic compaction | AI-summarized completed work preserves reasoning while freeing context |
| Actor-based audit trails | Every mutation attributed to specific agent — essential for debugging |
| GUPP (crash-recoverable hooks) | Agents check persistent hooks and resume interrupted work |
| Comprehensive testing and benchmarks | 323 test files, performance targets, dogfooding |

| PURGE | WHY |
|-------|-----|
| Massive scope creep | Custom query language, workflow engine, 4 tracker integrations — bloat |
| MEOW stack naming | Molecules, protomolecules, wisps, convoys — confusing metaphor overload |
| Single-giant-package (229 files in cmd/bd/) | Structural anti-pattern |
| $100+/hour cost barrier | Only for people who "never think about where money comes from" |
| "Stage 7-8 developers only" | Gatekeeping limits audience |

#### Auto-Claude (AndyMik90) — Stars: 12,900
**What it is:** Autonomous multi-agent desktop app (Python + Electron) wrapping Claude Code with spec pipeline, worktree isolation, semantic merge, and QA loops.

| KEEP | WHY |
|------|-----|
| Git worktree isolation for parallel agents | True filesystem isolation without container overhead |
| Multi-stage spec pipeline (5 agents) | Gather → Research → Write → Critique → Assess complexity before coding |
| Dynamic security profiles from stack detection | Tailored command allowlist based on detected tech stack |
| Recovery/resilience (retries, backoff, rollback) | Graceful degradation instead of crashing |
| Semantic merge (deterministic first, AI fallback) | Minimizes AI token usage for merge operations |
| CLAUDE.md as architecture documentation | Same file serves humans and AI agents |

| PURGE | WHY |
|-------|-----|
| 1,751 files for orchestrating Claude sessions | Massive over-engineering |
| Python-Electron split architecture | Awkward pairing, whole class of integration bugs |
| 50-iteration QA loop | If 3-5 iterations don't fix it, the problem is systemic |
| Graphiti integration (60+ files) | Heavyweight for an optional feature |
| File-based IPC | Race conditions, fragility |
| Backup files in repo | Hygiene issue |

#### frink-loop (wilpel) — Stars: 27
**What it is:** TypeScript autonomous loop that uses a reasoning LLM (OpenAI/Anthropic) to orchestrate Claude Code CLI with tool-based control.

| KEEP | WHY |
|------|-----|
| LLM-as-loop-controller pattern | LLM decides when to send work, reset sessions, add tasks — more sophisticated than bash loops |
| Tools-as-capabilities with Zod validation | LLM discovers capabilities through tool definitions |
| Agent-controlled session reset | LLM itself decides "I'm going in circles" — leverages contextual awareness |
| Separation of reasoning and execution models | Cheap model thinks, expensive model acts |
| Minimal 8-tool control surface | Exactly the capabilities needed, no more |
| Completion gate with user confirmation | Safety against premature completion |

| PURGE | WHY |
|-------|-----|
| In-memory-only state | Process crash loses all progress |
| No error recovery/retry logic | Single failure can kill the whole run |
| No tests (12 commits total) | Prototype-quality |
| No cost tracking/spending limits | Runaway loops burn API credits invisibly |

#### bjarne (Dekadinious) — Stars: 13
**What it is:** Single 2,521-line Bash script implementing PLAN → EXECUTE → REVIEW → FIX loop with outcome verification.

| KEEP | WHY |
|------|-----|
| `>` verification point format | Machine-checkable outcomes per task — "did the button appear? Does the endpoint return 200?" |
| Environment issue auto-remediation | Auto-creates setup tasks instead of blocking |
| Stale loop detection | After 3 iterations with no change, abort with actionable info — prevents token burn |
| Verbose output redirection rules | Redirect `npm install` etc. to temp files, check exit codes — saves context tokens |
| Phase output feed-forward | Previous iteration's outputs injected into next PLAN — primitive cross-iteration memory |
| BLOCKER vs ENVIRONMENT ISSUE distinction | Teaches agents that missing deps are solvable, not architectural failures |

| PURGE | WHY |
|-------|-----|
| 2,500 lines of Bash | Wrong language for this complexity — fragile, unmaintainable |
| Zero tests | Ironic for a tool demanding tests from agents |
| `--dangerously-skip-permissions` unconditional | Full permissions bypassed with no middle ground |
| No cost control or visibility | Burns through API costs invisibly |
| No state persistence between invocations | Claude rediscovers codebase every phase — up to 100 cold starts per project |

#### Puzld.ai (MedChaouch) — Stars: 253
**What it is:** Multi-LLM terminal orchestrator wrapping Claude, Gemini, Codex, Ollama CLIs with 11 execution modes, debate, consensus, and DPO training data generation.

| KEEP | WHY |
|------|-----|
| DPO preference extraction | Converting accepted/rejected/edited file proposals into training pairs — genuinely novel |
| Tool name aliasing across LLMs | Maps different LLMs' tool naming to unified set — real interop problem solved |
| Context window management with automatic compaction | Graceful model switching with auto-summarization |
| Debate-with-winner-tracking | Detect which agent's position user adopted, store for future routing |
| Clean adapter pattern | Simple interface (name, run, isAvailable) — easy to extend |

| PURGE | WHY |
|-------|-----|
| Near-zero test coverage (1 test file) | Inadequate for 11 execution modes |
| 95 releases in 3 months | Over-shipping without stabilization |
| 11 execution modes | 3-4 well-tested modes would serve better |
| Heavy native dependencies | node-pty, better-sqlite3, etc. create installation friction |
| Crude token estimation (length/4) | Should use proper tokenizer for compaction decisions |

---

## Part 2: Prioritized Adoption Plan

### Tier 1 — High Impact, Low Effort (Adopt in v4.0)

#### Task 1: Add progressive disclosure to skills

**Files:**
- Modify: `skills/workflow-common/SKILL.md`
- Modify: All 17 `skills/*/SKILL.md` files (add metadata header)

**Step 1: Define metadata header format**

Add a YAML frontmatter block to each SKILL.md with ~100 token summary:

```yaml
---
name: wave-executor
triggers: [build, parallel, execution, wave, dispatch]
token_cost: low|medium|high
summary: "Dispatches agent teams in parallel waves. Parallel within waves, sequential between. Max 3 tasks per plan."
---
```

**Step 2: Update workflow-common to document the pattern**

Add a "Skill Loading Protocol" section: load metadata only at orchestrator startup, inject full skill content only when the skill is activated by a command.

**Step 3: Add metadata to all 17 skills**

**Step 4: Commit**
```bash
git add skills/
git commit -m "feat: add progressive disclosure metadata to all 17 skills"
```

---

#### Task 2: Add confidence-based review filtering

**Files:**
- Modify: `skills/review-loop/SKILL.md`
- Modify: `skills/review-panel/SKILL.md`

**Step 1: Add confidence threshold to review-loop**

Add instruction: "Only surface issues at 80%+ confidence. For each finding, rate confidence as HIGH (80-100%), MEDIUM (50-79%), or LOW (<50%). Only report HIGH confidence findings to the user. Mention MEDIUM findings only if specifically asked."

**Step 2: Add confidence instruction to review-panel**

Same pattern for the dynamic review panel skill.

**Step 3: Commit**
```bash
git add skills/review-loop/ skills/review-panel/
git commit -m "feat: add confidence-based review filtering (80%+ threshold)"
```

---

#### Task 3: Add verification points to phase plans

**Files:**
- Modify: `skills/phase-decomposer/SKILL.md`

**Step 1: Add `> verification:` format to task template**

Adopt bjarne's verification point pattern. Each task in a phase plan must include machine-checkable verification:

```markdown
### Task 1: Add user authentication endpoint
> verification: curl -s localhost:3000/api/auth/login | jq .status == "ok"
> verification: grep -r "authMiddleware" src/routes/ | wc -l > 0
```

**Step 2: Update wave-executor to check verifications**

After each task execution, the wave-executor should run the verification commands before marking the task complete.

**Step 3: Commit**
```bash
git add skills/phase-decomposer/ skills/wave-executor/
git commit -m "feat: add machine-checkable verification points to phase plans"
```

---

#### Task 4: Add stale loop detection to review loop

**Files:**
- Modify: `skills/review-loop/SKILL.md`

**Step 1: Add iteration tracking and stale detection**

"Track review iterations. If the same issues persist after 3 review cycles with no measurable progress, STOP the loop and report: which issues remain, what was attempted, and recommend manual intervention or architectural change. Do not burn tokens repeating the same fixes."

**Step 2: Commit**
```bash
git add skills/review-loop/
git commit -m "feat: add stale loop detection to review cycle (max 3 iterations)"
```

---

#### Task 5: Add anti-rationalization guidance to agent personalities

**Files:**
- Modify: `agents/testing-qa-verification-specialist.md`
- Modify: `agents/engineering-senior-developer.md`

**Step 1: Add anti-rationalization table to testing-qa-verification-specialist**

Adopt code-foundations' pattern. Add a "Common Rationalizations I Reject" section:

| Rationalization | My Response |
|-----------------|-------------|
| "Tests are too slow" | Slow tests indicate design problems. Fix the design, don't skip the tests. |
| "It works on my machine" | If it doesn't have a test proving it works, it doesn't work. |
| "We'll add tests later" | Later never comes. Tests are written now or not at all. |
| "The code is too simple to test" | Simple code is the easiest to test. No excuse. |
| "Mocking is too complex" | If it's hard to mock, the dependency graph is wrong. Refactor. |

**Step 2: Add similar table to senior-developer for common code quality rationalizations**

**Step 3: Commit**
```bash
git add agents/testing-qa-verification-specialist.md agents/engineering-senior-developer.md
git commit -m "feat: add anti-rationalization tables to key agent personalities"
```

---

### Tier 2 — High Impact, Medium Effort (Plan for v4.0)

#### Task 6: Add competing architecture proposals to /legion:plan

**Files:**
- Modify: `commands/plan.md`
- Modify: `skills/phase-decomposer/SKILL.md`

Adopt Feature-dev's pattern: when planning a phase, spawn 2-3 agents with different philosophies (minimal changes, clean architecture, pragmatic balance) and present the user with competing approaches before selecting one.

---

#### Task 7: Add structured error/pattern knowledge base

**Files:**
- Modify: `skills/memory-manager/SKILL.md`
- Create: `.planning/memory/PATTERNS.md` template
- Create: `.planning/memory/ERRORS.md` template

Beyond OUTCOMES.md, maintain structured files mapping error patterns to known fixes and successful patterns to reuse criteria. Adopt Conductor's knowledge layer approach.

---

#### Task 8: Add authority matrix to CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

Document explicit decision boundaries: what agents can decide autonomously (file edits within task scope, test writing, dependency installation) vs. what requires human confirmation (architecture changes, new dependencies, API design, database schema changes).

---

### Tier 3 — Research / Future Consideration

These are valuable patterns to consider but require deeper design work:

1. **Git-native branching of agent context** (beads) — Agent memory that branches with code
2. **DPO preference extraction** (Puzld.ai) — Learning from accepted/rejected outputs
3. **Semantic compaction of completed work** (beads) — AI-summarized closed tasks
4. **Spec creation pipeline** (Auto-Claude) — 5-agent pipeline before coding begins
5. **Environment issue auto-remediation** (bjarne) — Auto-create setup tasks for missing deps
6. **Verbose output redirection rules** (bjarne) — Token savings for noisy commands

---

## Part 3: Anti-Patterns to Explicitly Avoid

These are documented here as guardrails for future Legion development:

| Anti-Pattern | Source | Why It's Bad |
|--------------|--------|--------------|
| Agent count inflation (60+, 112+) | Ruflo, wshobson | Diminishing returns, maintenance burden — 51 is already upper bound |
| Full automation without checkpoints | Conductor `/go` | Expensive runaway sessions, no human judgment at critical moments |
| Byzantine fault tolerance for sub-agents | Ruflo | These aren't distributed systems with adversarial nodes |
| Over-engineered review pipelines (614 checks) | code-foundations | Overkill for daily use, massive token consumption |
| 50-iteration QA loops | Auto-Claude | If 3-5 iterations don't fix it, problem is systemic |
| All-bash complex orchestration | bjarne | Wrong language for 2,500+ lines of complexity |
| In-memory-only state | frink-loop | Process crash loses everything |
| Bundled third-party skill libraries | Conductor | Version coupling, dependency creep |
| Marketing-driven feature counts | Multiple | Focus on the 6-8 things that matter |
| "Context rot" as central architecture | GSD | Temporary workaround, not permanent design principle |
| $100+/hour cost model | beads/Gas Town | Only accessible to small audience |
| Single-giant-package anti-pattern | beads cmd/bd/ | 229 files in one package is unmaintainable |

---

## Execution Handoff

**Plan complete and saved to `docs/plans/2026-03-02-inspiration-audit-and-adoption.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
