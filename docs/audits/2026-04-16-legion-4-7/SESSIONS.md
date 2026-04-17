# SESSIONS.md — Audit Session Log

**Audit started:** 2026-04-16
**Rubric version:** 1.0

---

## Session S01 — Setup

**Started:** 2026-04-16
**Target:** Folder, rubric, methodology, scripts, baseline tag, initial state files
**Files audited:** 0
**Findings:** 0
**Status:** completed (at commit of this file)

Notes: establishes audit infrastructure. No files audited in this session.

---

## Session S02a — Root Markdown

**Started:** 2026-04-16
**Closed:** 2026-04-16
**Target:** CLAUDE.md, AGENTS.md, README.md
**Files audited:** 3 (CLAUDE.md, AGENTS.md, README.md)
**Findings:** 5 total — 0 P0, 0 P1, 4 P2, 1 P3
**IDs assigned:** LEGION-47-001 .. LEGION-47-005
**Status:** completed

### Per-file summary
| File | Findings | Max severity | Notes |
|------|----------|--------------|-------|
| `CLAUDE.md` | 2 | P2 | `{AGENTS_DIR}` placeholder (CAT-6), unenumerated marketing/design keyword triggers (CAT-2) |
| `AGENTS.md` | 2 | P2 | Parity with CLAUDE.md; byte-identical surfaces for both findings |
| `README.md` | 1 | P3 | Documentary parity on keyword triggers; user-facing, lower behavioral risk |

### Themes surfaced this session
- **trigger-explicitness** (3 findings): `marketing keywords` / `design keywords` appear unenumerated in three root surfaces; fix should be applied in lockstep to CLAUDE.md, AGENTS.md, README.md, with `.planning/config/intent-teams.yaml` as the authoritative list.
- **precondition-verification** (2 findings): `{AGENTS_DIR}` placeholder resolution is declared via cross-reference rather than inlined; 4.7-literal readers risk treating the placeholder as literal or failing silently.

### CLAUDE.md ↔ AGENTS.md drift risk
Both files are byte-identical for the audited surfaces. Root-level remediation should treat them as a single source to prevent future drift (either generate one from the other, or add a CI check).

### Next session
S02b — reference docs under `docs/`.

---

## Session S02b — Reference Docs

**Started:** 2026-04-16
**Closed:** 2026-04-16
**Target:** docs/control-modes.md, docs/runtime-audit.md, docs/runtime-certification-checklists.md, docs/security/install-integrity.md
**Files audited:** 4 (all targets)
**Findings:** 1 total — 0 P0, 0 P1, 0 P2, 1 P3
**IDs assigned:** LEGION-47-006
**Status:** completed

### Per-file summary
| File | Findings | Max severity | Notes |
|------|----------|--------------|-------|
| `docs/control-modes.md` | 0 | — | Closed-set modes with inline fallback profile and explicit soft-vs-hard control disclaimers |
| `docs/runtime-audit.md` | 0 | — | Matrix of 8 runtimes with closed-set columns; "plain-language requests" is a documented user behavior, not an agent trigger |
| `docs/runtime-certification-checklists.md` | 1 | P3 | LEGION-47-006 (CAT-8) — file-wide missing pass criteria for verify/confirm items |
| `docs/security/install-integrity.md` | 0 | — | Brief, scoped, explicit limits |

### Themes surfaced this session
- **acceptance-criteria** (1 finding): Checklist-style docs need explicit observable pass criteria if they are ever used by agents for self-verification. Currently they target humans, so behavioral risk is bounded — but the `/legion:validate` surface is plausible future consumer.

### Script hardening during session
- `update-index.sh` per-file source resolution rewritten to parse the source path from the findings file H1 ("# Audit Findings — <source>") rather than reverse-mapping the slug convention. Added CRLF strip. Files table now shows correct max-severity for reference docs.

### Cumulative progress
- **Sessions completed:** S01 (setup), S02a (root markdown), S02b (reference docs)
- **Files audited:** 7 / 125
- **Findings so far:** 6 (0 P0, 0 P1, 4 P2, 2 P3)
- **Clusters touched:** `precondition-verification` (2), `trigger-explicitness` (3), `acceptance-criteria` (1)

### Next session
S02c — config YAMLs under `.planning/config/` (7 files).

---

## Session S02c — Config YAMLs

**Started:** 2026-04-16
**Closed:** 2026-04-16
**Target:** .planning/config/{agent-communication,authority-matrix,control-modes,directory-mappings,escalation-protocol,intent-teams,roster-gap-config}.yaml
**Total lines in scope:** 2,021 (heavy — authority-matrix 687, intent-teams 444, roster-gap-config 343, escalation-protocol 223, agent-communication 189, directory-mappings 85, control-modes 50)
**Audit focus:** `description`, `trigger`, free-prose fields per METHODOLOGY.md. Structural YAML keys are not LLM-facing behavior.
**Files audited:** 7 (all targets)
**Findings:** 2 total — 0 P0, 0 P1, 2 P2, 0 P3
**IDs assigned:** LEGION-47-007, LEGION-47-008
**Status:** completed

### Per-file summary
| File | Findings | Max severity | Notes |
|------|----------|--------------|-------|
| `.planning/config/agent-communication.yaml` | 1 | P2 | LEGION-47-007 (CAT-4) — `orchestrator_mediation.protocol` instructs "best-effort approach" with no definition; 4+ divergent 4.7 interpretations |
| `.planning/config/authority-matrix.yaml` | 1 | P2 | LEGION-47-008 (CAT-10, confirmed) — multiple agents overlap on "exclusive_domains" (data-pipelines, experimentation, resource-allocation, creative-direction); tiebreak rule does not resolve same-level ties |
| `.planning/config/control-modes.yaml` | 0 | — | Closed-set profiles and flags, explicit descriptions |
| `.planning/config/directory-mappings.yaml` | 0 | — | Closed mappings; minor comment-vs-list mismatch noted but not rubric-actionable |
| `.planning/config/escalation-protocol.yaml` | 0 | — | Closed severity/type/status sets; surgical-mode "floor is warning" lives in prose only (close-call, not finding) |
| `.planning/config/intent-teams.yaml` | 0 | — | Internally clean; cross-cutting observation below |
| `.planning/config/roster-gap-config.yaml` | 0 | — | Analysis output may be stale (e.g. `engineering-security-engineer` listed as missing but present in authority-matrix); data-freshness bug, not a 4.7-literalism finding |

### Themes surfaced this session
- **intent-front-loading** (1 finding): underspecified "best-effort" protocol step in orchestrator mediation; needs a deterministic decision tree.
- **authority-language** (1 finding): "exclusive_domains" contradicted by same-level overlaps; resolution rules do not tiebreak.

### Cross-cutting observation — keyword registry gap
`intent-teams.yaml` is the authoritative keyword/intent registry, but it contains **no "marketing keywords" or "design keywords"** entries. CLAUDE.md / AGENTS.md / README.md (LEGION-47-002, -004, -005) all reference these keyword triggers as if they were defined. This retroactively elevates the practical severity of that cluster: the referenced keywords are not merely unenumerated, they are absent from the canonical registry. Remediation for the `trigger-explicitness` cluster must either (a) add explicit keyword entries here, or (b) remove the keyword-based trigger language from the three root surfaces entirely. Tracked as a remediation-plan input; no new finding ID opened because the surface texts were already captured in S02a.

### Cumulative progress
- **Sessions completed:** S01, S02a, S02b, S02c
- **Files audited:** 14 / 125
- **Findings so far:** 8 (0 P0, 0 P1, 6 P2, 2 P3)
- **Clusters touched:** `precondition-verification` (2), `trigger-explicitness` (3), `acceptance-criteria` (1), `intent-front-loading` (1), `authority-language` (1)

### Next session
S02d — JSON schemas under `docs/schemas/` (5 files, per plan Task 5).

---

## Session S02d — JSON Schemas

**Started:** 2026-04-16
**Closed:** 2026-04-16
**Target:** docs/settings.schema.json + 4 schemas in docs/schemas/ (outcomes-record, plan-frontmatter, review-finding, summary)
**Total lines in scope:** 289 (settings 109, plan-frontmatter 69, summary 72, outcomes-record 20, review-finding 19)
**Audit focus:** `title`, `description`, `examples` fields per METHODOLOGY.md. Structural keys (`type`, `enum`, `required`, `properties`) are not LLM-facing behavior.
**Files audited:** 5 (all targets)
**Findings:** 2 total — 0 P0, 0 P1, 1 P2, 1 P3
**IDs assigned:** LEGION-47-009, LEGION-47-010
**Status:** completed

### Per-file summary
| File | Findings | Max severity | Notes |
|------|----------|--------------|-------|
| `docs/settings.schema.json` | 0 | — | All gated values use closed enums; single description (control_mode) delegates to in-repo config with exact path |
| `docs/schemas/outcomes-record.schema.json` | 0 | — | Closed enums on outcome/importance; `task_type` free-string flagged for S10 cross-check, not filed here (schema vs. consumer-contract boundary) |
| `docs/schemas/plan-frontmatter.schema.json` | 0 | — | Pattern-bounded strings, descriptive field docs; `agent` free-string accepted (registry too large to inline); "must NOT modify" on files_forbidden is a closed-boundary CAT-5 close-call, rejected per rubric |
| `docs/schemas/review-finding.schema.json` | 1 | P3 | LEGION-47-009 (CAT-1, suspected) — `category` is free string while sibling `severity`/`status` are closed enums; invites divergent category inventions across review cycles |
| `docs/schemas/summary.schema.json` | 1 | P2 | LEGION-47-010 (CAT-1, confirmed) — `escalations[].type` is free string while CLAUDE.md + escalation-protocol.yaml define a closed 8-value set; schema drifts from documented protocol |

### Themes surfaced this session
- **closed-set-enforcement** (2 findings): both findings land in the same cluster — schemas that should enumerate but don't. One is low-severity drift (`category` has no canonical list yet), the other is confirmed contract drift (`escalations[].type` has a canonical list that the schema omits).
- **Parity with LEGION-47-008:** summary.schema escalation-type drift is the schema-side mirror of authority-matrix exclusive_domains drift — both are closed-set contracts asserted in prose but not enforced structurally. Remediation should be coordinated across schema + protocol + root doc.
- **Schema-vs-consumer boundary discipline:** several close-calls (`task_type` enumeration, `handoff_context` sub-key requirements, `verification_commands` "proving success" semantics, `agent` registry resolution) were deferred to consumer-skill audits (S08, S10) rather than filed against the structural schemas. This keeps schema findings focused on structural drift rather than dispatch semantics.

### Cumulative progress
- **Sessions completed:** S01, S02a, S02b, S02c, S02d
- **Files audited:** 19 / 125
- **Findings so far:** 10 (0 P0, 0 P1, 7 P2, 3 P3)
- **Clusters touched:** `precondition-verification` (2), `trigger-explicitness` (3), `acceptance-criteria` (1), `intent-front-loading` (1), `authority-language` (1), `closed-set-enforcement` (2)

### Next session
S03 — Commands 1-6 under `commands/legion/` (per plan Task 6). Commands are prose-heavy with dispatch and AskUserQuestion gates — expect higher finding density than schemas. First 6 files per the plan's command grouping.

---

## Session S03 — Commands 1-6

**Started:** 2026-04-16
**Closed:** 2026-04-16
**Target:** commands/{advise,agent,board,build,explore,learn}.md
**Total lines in scope:** 1,871 (advise 203, agent 119, board 333, build 531, explore 436, learn 249 — build and explore are heavy files)
**Audit focus:** user-facing prompts, agent dispatch, branching logic, escalation surfaces per METHODOLOGY.md. Commands are prose-heavy with high CAT-1 / CAT-3 yield per plan's threat model.
**Files audited:** 6 (all targets)
**Findings:** 20 total — 0 P0, 3 P1, 14 P2, 3 P3
**IDs assigned:** LEGION-47-011 through LEGION-47-030
**Status:** completed

### Per-file summary
- `commands/advise.md` (203 lines): 3 findings — 1 P1 (CAT-1, confirmed), 1 P2 (CAT-1, confirmed), 1 P3 (CAT-9)
- `commands/agent.md` (119 lines): 2 findings — 1 P2 (CAT-1, confirmed), 1 P2 (CAT-2)
- `commands/board.md` (333 lines): 3 findings — 2 P2 (CAT-1, both confirmed), 1 P3 (CAT-9)
- `commands/build.md` (531 lines): 5 findings — 2 P1 (CAT-1, both confirmed), 2 P2 (CAT-1 confirmed + CAT-2), 1 P2 (CAT-3, confirmed)
- `commands/explore.md` (436 lines): 4 findings — 2 P2 (CAT-1, both confirmed), 1 P2 (CAT-2, confirmed), 1 P3 (CAT-2)
- `commands/learn.md` (249 lines): 3 findings — 1 P2 (CAT-1, confirmed), 1 P2 (CAT-2, confirmed), 1 P3 (CAT-9)

### Themes surfaced this session
- **closed-set-enforcement dominance** (10 findings, 50% of session): Every audited command has at least one CAT-1 failure at user-facing prompts. Recurring sub-patterns:
  - `adapter.ask_user` / AskUserQuestion invoked without an options array (board.md L45-51; advise.md L155-160; explore.md L59-307; learn.md L143) — the empty-options or free-text-masquerade anti-pattern.
  - Raw `[Y/n]` or natural-language confirmation prompts violating CLAUDE.md's AskUserQuestion mandate (build.md L168; advise.md L74-84; agent.md L47-49; explore.md L44-53).
  - Decorative menu formats (unicode arrows, "Option 1/2/3" prose) that 4.7 cannot interpret as tool options (explore.md L44-53, L303-307).
  - Over-listed option sets where one option is duplicative or unreachable (learn.md L82-88; advise.md L74-84; board.md L76-89).
  - **Systemic remediation**: Legion needs a single documented "adapter text-input primitive" distinct from AskUserQuestion. The CLAUDE.md mandate is currently unimplementable for any prompt that requires free-text capture, because AskUserQuestion requires a non-empty options array.
- **trigger-explicitness recurrence** (5 findings): Keyword-based classification and detection without closed registries — agent.md "already answered"; build.md analysis-plan substring match; explore.md intervention triggers; learn.md signal-keyword overlap. The learn.md finding (028) extends the S02c cross-cut: even when the keyword registry IS inlined in the file, overlap between categories breaks the classifier.
- **dispatch-specification** (1 finding, build.md L307-311): CAT-3 fan-out specification gap. Delegation to wave-executor is correct but the inlined summary in build.md omits the single-tool-call fan-out instruction and the file-overlap safety check — readers consuming only build.md miss the dispatch safety net.
- **response-calibration** (2 findings): Unbounded output shapes — advise.md "brief summary of prior advice"; learn.md tag extraction.
- **No P0 findings**, but **3 P1 findings** all concentrate in build.md (2) and advise.md (1). All three are confirmed CAT-1 on high-traffic user-facing gates (architecture review gate, intent-flag confirmation, primary advisor selection).

### Cross-cutting observation — AskUserQuestion contract ambiguity
Five separate files in this session (advise, agent, board, build, explore, learn) have findings that would be resolved by answering one question: *what is the supported contract for free-text user capture?* If the answer is "AskUserQuestion requires non-empty options," then every free-text prompt in Legion (at minimum: board.md L45 topic capture; advise.md L155 follow-up question; explore.md Compare/Debate openings; learn.md L143 next-lesson; agent.md all stage re-prompts; build.md wave-number capture) is structurally broken. Recommend that the remediation pipeline adds an `adapters/<cli>.md` section defining a `adapter.prompt_free_text` primitive alongside `adapter.ask_user`, and updates `CLAUDE.md` to scope the AskUserQuestion mandate to **bounded-choice** questions only. This single upstream fix unblocks ~8 of this session's 20 findings.

### Cumulative progress
- **Sessions completed:** S01, S02a, S02b, S02c, S02d, S03
- **Files audited:** 25 / 125
- **Findings so far:** 30 (0 P0, 3 P1, 22 P2, 5 P3)
- **Clusters touched:** `precondition-verification` (2), `trigger-explicitness` (8), `acceptance-criteria` (1), `intent-front-loading` (1), `authority-language` (1), `closed-set-enforcement` (12), `dispatch-specification` (1), `response-calibration` (4)

### Next session
S04 — Commands 7-12 under `commands/legion/` (per plan Task 7). Remaining command files. Continue expected CAT-1 / CAT-3 density. The AskUserQuestion contract question flagged above should be resolved (or explicitly deferred with a tracking issue) before remediation begins on the closed-set-enforcement cluster; S04 should surface any additional evidence to sharpen that upstream decision.

---

## Session S04 — Commands 7-12

**Started:** 2026-04-16
**Closed:** 2026-04-16
**Target:** commands/{milestone,plan,portfolio,quick,retro,review}.md
**Files audited:** 6 (all targets)
**Findings:** 27 total — 0 P0, 4 P1, 23 P2, 0 P3
**IDs assigned:** LEGION-47-031 .. LEGION-47-057
**Status:** completed

### Per-file summary
| File | Findings | Max severity | Notes |
|------|----------|--------------|-------|
| `commands/milestone.md` | 4 | P2 | CAT-1 closed-set gaps on mode / archive / scope-detection prompts |
| `commands/plan.md` | 6 | P1 | 1 P1 (CAT-1, confirmed); bracketed "existing behavior" stubs (CAT-8); marketing keyword trigger (CAT-2, confirmed) |
| `commands/portfolio.md` | 3 | P2 | Multiple CAT-1 mode-select gates without closure |
| `commands/quick.md` | 4 | P1 | 1 P1 free-text AskUserQuestion (CAT-1, confirmed) inherits S03 `adapter.prompt_free_text` defect; keyword-substring match (CAT-2) |
| `commands/retro.md` | 3 | P2 | CAT-1 scope-and-format gates; keyword-substring match on retro-type detection |
| `commands/review.md` | 7 | P1 | 2 P1 (reviewer-selection gate CAT-1 confirmed; fix-agent dispatch table CAT-3 confirmed with 2 non-existent agent IDs — pre-existing bug); 5 P2 covering loop-exit partitioning, bracketed stubs, git-diff precondition, substring triggers |

### Themes surfaced this session
- **closed-set-enforcement dominant** (14 of 27 findings, all CAT-1). Reviewer-selection (L230-247 review.md) and phase-agent-swap (L263 plan.md) are the most load-bearing.
- **dispatch-specification pre-existing bug** (LEGION-47-052): `commands/review.md` fix-agent routing table references `engineering-devops-automator` and `marketing-content-creator` — neither exists in Legion's roster. This is a bug regardless of 4.7 literalism. Fix in Phase 2 cluster, flagged for roster cross-check in REMEDIATION.md.
- **Bracketed-stub pattern** (LEGION-47-050, 055): `[Existing Step 6 logic unchanged]` and `(existing behavior)` — editor placeholders that 4.7-literal readers will either skip or treat as instructions. Recurring class across commands.
- **Keyword-substring matching** (LEGION-47-044, 048, 057, peer 028): recurring trigger pattern using bare substring match instead of word-boundary or path-component regex. Upgrades to `confirmed` where CAT-2 peers exist (044 quick.md, 057 review.md security-file detection).
- **AskUserQuestion free-text inheritance**: LEGION-47-041 (quick.md), 045 (plan.md), 051 (review.md `Other` option) all exhibit the upstream defect first surfaced in S03. `adapter.prompt_free_text` primitive decision still outstanding — blocks full remediation of the closed-set-enforcement cluster.

### Cross-cutting observation — load-bearing gates in orchestration commands
Of the 4 P1 findings this session, 3 are user-facing decision gates (advisor swap, reviewer selection, review-mode select) and 1 is a dispatch table with non-existent agent IDs. REMEDIATION.md should sequence these before any of the lower-severity closed-set findings — they are the highest-leverage wins for 4.7 correctness.

### Cumulative progress
- **Sessions completed:** S01, S02a, S02b, S02c, S02d, S03, S04
- **Files audited:** 31 / 125
- **Findings so far:** 57 (0 P0, 7 P1, 43 P2, 7 P3)
- **Clusters touched:** `precondition-verification` (3), `trigger-explicitness` (9), `acceptance-criteria` (4), `intent-front-loading` (1), `authority-language` (1), `closed-set-enforcement` (22), `dispatch-specification` (2), `response-calibration` (4)

### Next session
S05 — Commands 13-17 (per plan Task 8). Remaining commands: ship.md, start.md, status.md, update.md, validate.md. start.md = CAT-1 user-interaction hotspot; ship.md = CAT-3 dispatch hotspot.

---

## Session S05 — Commands 13-17

**Started:** 2026-04-16
**Closed:** 2026-04-16
**Target:** commands/{ship,start,status,update,validate}.md
**Files audited:** 5 (all targets)
**Findings:** 29 total (0 P0, 3 P1, 25 P2, 1 P3)
**IDs assigned:** LEGION-47-058 through LEGION-47-088 with gaps at 077 and 078 (deleted — see Deferred cross-cuts below)
**Status:** completed

### Per-file summary
| File | Findings | Max severity | Notes |
|------|----------|--------------|-------|
| `commands/ship.md` | 6 | P1 | 1 P1 CAT-1 confirmed (ship-action gate L184-198 with 3 unbounded options); CAT-3 dispatch for verification commands; CAT-6 post-ship verification twice without drift definition |
| `commands/start.md` | 8 | P1 | 2 P1 CAT-1 confirmed (pre-flight reinit + exploration offer); 3 P2 CAT-1 (brownfield, Stage-3 workflow prefs, integration question L87); CAT-2 confirmed (marketing/design keyword inheritance); LEGION-47-076 orphan config reference (cost_profile unused) |
| `commands/status.md` | 5 | P2 | CAT-1 confirmed status-emoji set L147-151; CAT-2 confirmed milestone-keyword substring; CAT-6 STATE.md regex preconditions; CAT-4 intent-front-loading on dashboard format; CAT-5 prohibitive cluster on graceful-degradation |
| `commands/update.md` | 5 | P2 | CAT-8 confirmed (no restart step after install); CAT-1 confirmed yes/no install; CAT-6 confirmed manifest precondition (concurrent-install ambiguity); CAT-9 confirmed changelog length; CAT-8 post-install verification scope |
| `commands/validate.md` | 5 | P2 | 2 P2 CAT-6 confirmed: LEGION-47-084 intent-teams.yaml schema mismatch (pre-existing bug, parity with LEGION-47-052) + LEGION-47-085 dual agent-source ground-truth; CAT-2 division-count regex-by-example; CAT-8 FIX_MODE re-run unbounded; CAT-5 prohibitive tail |

### Deferred cross-cuts (IDs 077, 078 — removed from DB)

Mid-session the subagent filed 3 findings under a `session: "S05.1"` label. Two of them targeted files owned by later sessions and were removed from FINDINGS-DB.jsonl to prevent duplication / session-label schema violations (METHODOLOGY regex `^S[0-9]+[a-e]?$` rejects `S05.1`). The third (LEGION-47-076, commands/start.md) was in-scope for S05 and has been relabeled `session: "S05"`, cluster `precondition-verification`.

The deleted findings' analysis is preserved below for the S06 and S16 subagents to consume and re-file in the correct session:

- **Target: `skills/cli-dispatch/SKILL.md` (owned by S06) — CAT-3 P2 confirmed, cluster `dispatch-specification`.** `model_tier` is declared in `agent-registry:147`, passed by `phase-decomposer:459`, set to `execution` by `review-evaluators:1259` — but `skills/cli-dispatch/SKILL.md` never reads it. Section 3 constructs the prompt from PERSONALITY_CONTENT + TASK_DESCRIPTION + RESULT_INSTRUCTION + CONTROL_SCOPE + HANDOFF_CONTEXT with no `model_tier` lookup. The Claude-Code adapter's `spawn_agent_personality` row hardcodes `model: {model_execution}` for every spawn. Net effect: all tiers collapse to `model_execution` (sonnet). Maintainers adding `model_tier` to new agents accumulate dead metadata. Path A: wire `model_tier` through cli-dispatch Section 3 (resolve from agent frontmatter, map to `adapter.model_{tier}`, substitute in spawn call); update each adapter's spawn row. Path B: delete `model_tier` declarations. See `proposals/per-command-model-override.md` if present. S06 subagent: re-file as appropriate finding ID within S06 range.

- **Target: `adapters/claude-code.md` (owned by S16) — CAT-3 P2 confirmed, cluster `dispatch-specification`.** Users have three model knobs (`models.planning`, `models.execution`, `models.check`) and an adapter that hardcodes the tier→model mapping. No mechanism to declare per-command model selection. Inline-executing commands (`start`, `explore`, `plan`) inherit session model — Legion has no override. Spawned-subagent commands bind to `model_execution` (because cli-dispatch ignores `model_tier`). User assumption that setting `models.planning: opus` affects `/legion:plan` is false — inline command uses session model; only the decomposer subagent honors `planning_reasoning: true`. Remediation: add `model:` key to command frontmatter parsed by adapter dispatch (planning|execution|check|explicit-model-name); document inline-vs-spawned distinction in `adapters/ADAPTER.md`. S16 subagent: re-file as appropriate finding ID within S16 range.

### Script-infrastructure fix applied during cleanup
`scripts/audit/update-index.sh` was undercounting severity aggregates: its grep patterns required compact JSON (`"severity":"P2"`), but some findings had been serialized with `"severity": "P2"` (space after colon). Python parsing saw all 88 lines correctly; grep missed 4 P2 and 1 P3 line. Patched the severity-count and category-count greps to accept optional whitespace via `"severity":[[:space:]]*"P2"`. Simultaneously normalized the 5 drifted DB lines to canonical compact format. INDEX.md now matches Python authoritative count.

### Themes surfaced this session
- **closed-set-enforcement remains dominant** — 9 of 26 core S05 findings are CAT-1, consistent with S03 and S04 distributions. Highest-stakes gates: ship.md L184-198 (3 options, no closure), start.md L28-31 (reinit prompt), start.md L37-60 (exploration offer with free-text sub-states).
- **Pre-existing bug parity with LEGION-47-052** — validate.md LEGION-47-084 is S05's second confirmed pre-existing bug in `precondition-verification`: the intent-teams.yaml parser expects `intents:` / `agents.primary` / `filter.exclude_agents` schema that does not exist (actual keys: `command_routes:`, `natural_language:`, `context_rules:`). Validator silently passes or throws an un-mapped parse error. Same defect class as S04's fix-agent routing table referencing non-existent agent IDs — both are schema drift between command instructions and current config reality.
- **Dual ground-truth sources** — validate.md LEGION-47-085 documents a pattern where two adjacent steps need "the valid agent IDs" but use different sources (agent-registry skill vs. direct filesystem listing) with no priority rule. First instance of this sub-class; likely recurs in other skills pre-dating agent-registry extraction.
- **Regex-by-example** — validate.md L186 ("e.g., `# TESTING DIVISION (6 agents)`") joins the keyword-substring pattern family (peer LEGION-47-028, 044, 048, 057, 072, 086). Regex-by-example is a consistent defect class across the audit.
- **AskUserQuestion free-text cross-cut persists** — S03 first flagged it; S04 added 3 inheriting findings; S05 adds more (LEGION-47-065 start.md exploration offer with free-text "Explore more"/"Park"; LEGION-47-067 Stage-1 questioning is fully free-text). `adapter.prompt_free_text` primitive decision still outstanding.
- **Fix-mode acceptance criteria** — validate.md LEGION-47-087 and update.md LEGION-47-083 both document unbounded post-action verification. Emerging sub-cluster within `acceptance-criteria`.

### Cross-cutting observation — validate.md audits the audit instrument
`commands/validate.md` is Legion's self-validation command. Its own defects (intent-teams.yaml schema mismatch, dual agent-source inconsistency) mean silent-pass false negatives in `/legion:validate` have been masking real drift in config YAMLs. LEGION-47-084 and S02c's cross-cutting observation (intent-teams.yaml has no marketing/design keyword registry, yet three root surfaces claim it does) are the same underlying defect viewed from different angles: validate.md can't detect the drift because validate.md expects a schema that doesn't exist. Remediation for LEGION-47-084 must be sequenced before trust-by-validator is restored.

### Cumulative progress
- **Files audited:** 37 / 125 (29.6%)
- **Findings:** 86 total (0 P0, 10 P1, 68 P2, 8 P3) per FINDINGS-DB.jsonl authoritative count
- **Sessions completed:** S01, S02a-d, S03, S04, S05

### Next session
S06 — Core orchestration skills (Task 9 per plan): `skills/workflow-common*` (5 files), `skills/wave-executor/SKILL.md`, `skills/cli-dispatch/SKILL.md`. Expect heavy CAT-3/CAT-4/CAT-6/CAT-8 density. Cross-cuts to carry forward: (a) `adapter.prompt_free_text` architectural decision still open; (b) intent-teams.yaml schema drift remediation (LEGION-47-084) must precede validator trust restoration; (c) dual-ground-truth agent-ID pattern — check whether agent-registry skill itself exhibits the inverse problem; (d) deferred cross-cut against `skills/cli-dispatch/SKILL.md` (model_tier dead metadata) — re-file as proper S06 finding.

---

## Session S06 — Core Orchestration Skills

**Started:** 2026-04-16 19:18
**Closed:** 2026-04-16 19:32
**Target:** skills/workflow-common* (5) + wave-executor + cli-dispatch
**Files audited:** 7
**Findings:** 26 (0 P0, 2 P1, 23 P2, 1 P3) — IDs LEGION-47-089 through LEGION-47-114
**Status:** completed

### Per-file summary
| File | Findings | Max severity | Notes |
|------|----------|--------------|-------|
| `skills/workflow-common/SKILL.md` | 4 | P1 | LEGION-47-089 P1 CAT-6 confirmed: "compatibility shim" label vs. 518-line skill still referenced by CLAUDE.md Dynamic Knowledge Index — shim status is aspirational; CAT-2 marketing/design keyword re-inheritance (S02c cross-cut); CAT-8 acceptance ambiguity on AGENTS_DIR scaffolding; CAT-4 intent-late on authority-matrix invocation |
| `skills/workflow-common-core/SKILL.md` | 3 | P2 | LEGION-47-093 P2 CAT-1 confirmed: free-text capture routed through AskUserQuestion despite S03 contract defect (prompt_free_text primitive still outstanding); CAT-6 {AGENTS_DIR} Resolution Protocol present but race ordering unclear when skill loaded mid-execution; CAT-10 contract doc under-specifies failure mode when all 4 resolution paths miss |
| `skills/workflow-common-domains/SKILL.md` | 1 | P2 | LEGION-47-096 P2 CAT-2 confirmed: marketing/design keyword registry again absent — domain skill references keywords it does not enumerate (S02c cross-cut); domains skill is the canonical place this registry belongs |
| `skills/workflow-common-github/SKILL.md` | 2 | P2 | CAT-6 precondition-verification on `gh` auth state (silent-pass on missing auth); CAT-8 acceptance-criteria on opt-in detection (multiple remotes, non-origin remotes) |
| `skills/workflow-common-memory/SKILL.md` | 2 | P2 | CAT-6 precondition-verification on `.planning/memory/OUTCOMES.md` shape before append (schema drift not detected); CAT-8 acceptance-criteria on graceful-degradation completion signal when memory layer absent |
| `skills/wave-executor/SKILL.md` | 9 | P1 | LEGION-47-101 P1 CAT-3 confirmed: "Issue ALL agent spawn calls simultaneously" does not specify same-response Bash fan-out mechanism — dispatch authority silently serializes; LEGION-47-102 CAT-3 parallel-mechanism repeat; LEGION-47-103 CAT-2 confirmed trigger-explicitness; LEGION-47-104 CAT-8 confirmed acceptance-criteria for wave completion; LEGION-47-109 P3 CAT-9 response-calibration on "agent appears idle" with no threshold |
| `skills/cli-dispatch/SKILL.md` | 5 | P2 | LEGION-47-110 P2 CAT-3 confirmed: **S05 deferred model_tier cross-cut re-filed** — model_tier declared by agent-registry/phase-decomposer/review-evaluators, never read by cli-dispatch Section 3; Claude-Code adapter hardcodes model_execution; all tiers collapse; LEGION-47-111 CAT-6 bare `agents/{agent-id}.md` contradicts Path Resolution Protocol (paired with LEGION-47-091); LEGION-47-112 CAT-3 fan-out again; LEGION-47-113 CAT-8 surgical fallback done-state undefined; LEGION-47-114 CAT-2 Design division absent from affinity table |

### Themes surfaced this session

1. **Dispatch specification is the load-bearing gap.** Four CAT-3 findings clustered on `dispatch-specification` (LEGION-47-101, 102, 110, 112) — the orchestration spine tells agents to "spawn in parallel" without specifying the same-response Bash fan-out mechanism that makes parallelism real. Model tier collapse (LEGION-47-110) and bare agent path (LEGION-47-111) compound: when dispatch executes, it dispatches to the wrong model reading from the wrong location. `dispatch-specification` is now the largest cluster in S06 (4 findings) tied with `precondition-verification` and `trigger-explicitness` (6 each).

2. **Precondition verification is systematically under-specified in orchestration.** Six CAT-6 findings on preconditions across the 7 files — AGENTS_DIR resolution timing, gh auth state, OUTCOMES.md schema, agent file location. Orchestration skills describe what to do but not what to verify before doing it. Pattern matches S04/S05 density.

3. **Acceptance criteria vague in dispatch-flow skills.** Four CAT-8 findings — wave completion, surgical fallback, gh opt-in detection, memory degradation. Skills define entry but not exit.

4. **Marketing/design keyword registry still orphaned (S02c re-inheritance).** LEGION-47-090 (workflow-common) and LEGION-47-096 (workflow-common-domains) both cite keywords that no registry defines. Domains skill is the canonical owner but does not enumerate them. This is now a 3-session cross-cut (S02c → S04 → S06) with no remediation.

5. **AskUserQuestion contract defect (S03) persists in free-text capture.** LEGION-47-093 (workflow-common-core CAT-1 confirmed) — skill routes free-text through a bounded-options primitive. `adapter.prompt_free_text` architectural decision still not made.

6. **"Compatibility shim" label contradicts reality.** LEGION-47-089 P1 — `skills/workflow-common/SKILL.md` self-identifies as a shim but is 518 lines, still referenced from CLAUDE.md Dynamic Knowledge Index, and contains authoritative content for AGENTS_DIR scaffolding and user interaction conventions. Misleading labels create trust debt.

### Cross-cutting observation — orchestration spine fragility

Five of the seven S06 files form the dispatch chain: `workflow-common` (shim/entry) → `workflow-common-core` (path resolution) → `wave-executor` (orchestration) → `cli-dispatch` (adapter translation) → back to `workflow-common-core` for any agent read. Failures are compounded, not isolated: the bare agent path in cli-dispatch (LEGION-47-111) and the model tier collapse (LEGION-47-110) both ride on top of dispatch mechanism ambiguity (LEGION-47-101/102/112). A reader of any single skill gets a plausible-looking dispatch flow. A reader tracing the full chain finds four simultaneous under-specifications stacked. Remediation must be sequenced: (a) specify same-response Bash fan-out in wave-executor, (b) add model_tier read to cli-dispatch Part 6, (c) normalize `{AGENTS_DIR}/{agent-id}.md` substitution everywhere, (d) promote workflow-common from "shim" to either deleted or properly authoritative. Doing any one in isolation leaves the other three masking.

### S05 deferred cross-cut resolved
LEGION-47-110 re-files the S05 `model_tier` dead-metadata finding against `skills/cli-dispatch/SKILL.md` as a proper S06 P2 CAT-3 confirmed finding in cluster `dispatch-specification`. Content matches the S05 deferral specification exactly (agent-registry:147 / phase-decomposer:459 / review-evaluators:1259 declare and pass; cli-dispatch Section 3 never reads; Claude-Code adapter hardcodes `model_execution`; net all tiers collapse to sonnet).

### Cumulative progress
- **Files audited:** 44 / 125 (35.2%)
- **Findings:** 112 total (0 P0, 12 P1, 91 P2, 9 P3) per FINDINGS-DB.jsonl authoritative count
- **Sessions completed:** S01, S02a-d, S03, S04, S05, S06

### Next session
S07 — candidate scope: next batch of skills (agent registry, phase-decomposer, review-evaluators, plan-critique, spec-pipeline, authority-enforcer). Expect the dual-ground-truth agent-ID pattern inversion check on `agent-registry` specifically (deferred from S05 next-session note). `adapter.prompt_free_text` architectural decision still outstanding and blocks remediation of LEGION-47-093 plus S03 inherited findings. `dispatch-specification` cluster (now 4 findings in S06) may grow further when reviewing phase-decomposer's dispatch contract with cli-dispatch.

---

## Session S07 — Planning Skills

**Started:** 2026-04-16 19:35
**Closed:** 2026-04-16 19:57
**Target:** skills/{phase-decomposer,plan-critique,spec-pipeline,questioning-flow,intent-router}/SKILL.md
**Files audited:** 5
**Findings:** 30 (0 P0, 1 P1, 29 P2, 0 P3) — IDs LEGION-47-115 through LEGION-47-144
**Status:** completed

### Per-file summary
| File | Findings | Max severity | Notes |
|------|----------|--------------|-------|
| `skills/phase-decomposer/SKILL.md` | 7 | P2 | LEGION-47-115/116 CAT-2 confirmed: marketing/design keyword lists inline here compete with canonical owner (workflow-common-domains LEGION-47-096 absent-registry), intent-teams.yaml has no domain_keywords block (S02c → S04 → S06 → S07 re-inheritance); LEGION-47-117 CAT-1 confirmed: architecture-proposal AskUserQuestion 'Hybrid' branch unbounded free-text (S03 inheritance); LEGION-47-118 CAT-6 confirmed: agent-ID dual-ground-truth pattern (S05 LEGION-47-085 peer) with ambiguous tool-selection; LEGION-47-119 CAT-3 confirmed: Wave Pattern agent IDs include ≥2 non-canonical (`marketing-content-creator`, `growth-hacker`) — S04 LEGION-47-052 bug-class peer; LEGION-47-120 CAT-8 final confirmation gate asymmetry; LEGION-47-121 CAT-10 authority ambiguity on model_planning declaration (LEGION-47-110 peer) |
| `skills/plan-critique/SKILL.md` | 5 | P2 | LEGION-47-122 CAT-1 confirmed: verdict-routing PASS path has only 2 options (no Cancel/Revise-anyway); LEGION-47-123 CAT-4 pre-mortem stance stated but not carried through Section 4 dispatch; LEGION-47-124 CAT-6 plan file glob / CONTEXT.md path / Risk Areas schema-drift; LEGION-47-125 CAT-3 Panel-size 2 fan-out unspecified + silent-degradation on missing personality (masks LEGION-47-052); LEGION-47-126 CAT-8 confirmed: verdict computation boundary-overlap ("2 items one unmitigated" dual-match), "clear mitigation" undefined |
| `skills/spec-pipeline/SKILL.md` | 5 | P2 | LEGION-47-127 CAT-1 confirmed: standalone-invocation Overwrite/Keep-only gate, no staleness check; LEGION-47-128 CAT-3 confirmed: research-agent fan-out + trigger-threshold + selection-rule + adapter.spawn_agent_readonly precondition all under-specified; LEGION-47-129 CAT-6 directory-mappings.yaml first reference here with no schema file (parity gap vs intent-teams.schema.json), no absent-file fallback, override chicken-and-egg; LEGION-47-130 CAT-8 Section 3 Step 3 completeness gate 5 soft checks; LEGION-47-131 CAT-9 complexity thresholds overlap, "architectural choices" undefined |
| `skills/questioning-flow/SKILL.md` | 6 | P1 | **LEGION-47-132 P1 CAT-1 confirmed — Stage 1 free-text capture at canonical surface violates CLAUDE.md AskUserQuestion mandate (S03 cross-cut at Legion's highest-leverage ground-zero skill — every new project passes through this)**; LEGION-47-133 P2 CAT-1 confirmed: Stage 3 structured choices described in prose without AskUserQuestion wrapping; LEGION-47-134 CAT-2 confirmed: project-type classification from free-text has no algorithm (S02c re-inheritance); LEGION-47-135 CAT-8 exchange-count arithmetic inconsistent (1-3+2-4+1-2=4-9 ≠ "5-8 target") and phase-sizing overlap; LEGION-47-136 CAT-5 six principles stated absolutely with internal conflicts; LEGION-47-137 CAT-6 start.md delegation without handoff contract |
| `skills/intent-router/SKILL.md` | 7 | P2 | LEGION-47-138 CAT-1 confirmed: LOW-confidence fallback uses console.log (not a user-interaction primitive) and unbounded free-text continuation; LEGION-47-139 CAT-2 confirmed: scoring formula calibration makes HIGH tier practically unreachable for realistic inputs ("start" hits 0.23 LOW for /legion:start); LEGION-47-140 CAT-6 confirmed: loadIntentTeams reads .yaml with unguarded fs.readFileSync, "graceful degradation" claim not implemented (S05 LEGION-47-084 peer); LEGION-47-141 CAT-3 filter_plans `parallel: false` contradicts wave-executor parallelism; LEGION-47-142 CAT-8 getContextSuggestions catch swallows all errors uniformly, no errorClass; LEGION-47-143 CAT-7 "never throw / always returns / never null-check" maximalist invariants exceed implementation; LEGION-47-144 CAT-2 Rule 4 permissive unknown-flag parsing creates typo-silent-drop |

### Themes surfaced this session

1. **S03 AskUserQuestion contract defect now hits canonical ground-zero.** LEGION-47-132 (P1) is the most severe instance of this cross-cut found so far — questioning-flow is Legion's canonical closed-set-question skill and Stage 1 is the first interaction every new Legion project has. Stage 1's free-text "conversational" capture directly violates CLAUDE.md's mandatory AskUserQuestion rule. This is the sixth session in which the `adapter.prompt_free_text` primitive decision has been the blocking prerequisite; remediation must land before questioning-flow can be fixed, and questioning-flow's fix is the highest-leverage closed-set-enforcement win in the audit.

2. **S02c domain-keyword registry cross-cut has now inherited across six sessions** (S02c → S03 → S04 → S06 → S07 double — LEGION-47-115, 116, 134). phase-decomposer enumerates the canonical marketing and design keyword lists inline; workflow-common-domains (canonical owner per LEGION-47-096) does not enumerate them; questioning-flow references them by name without specifying classification; intent-teams.yaml still has no `domain_keywords` schema block. This is now a 4-file cross-cut with concrete inline lists competing against one empty canonical location.

3. **S04 non-existent-agent-ID bug-class confirmed in dispatch-authoritative surface.** LEGION-47-119 finds ≥2 non-canonical agent IDs in phase-decomposer's Wave Pattern sections (`marketing-content-creator`, `growth-hacker`). Same pre-existing-bug class as LEGION-47-052; this time at an even more load-bearing surface because Wave Patterns are the authoritative agent selection for entire marketing/design phases.

4. **Dual-ground-truth pattern propagates but with fresh gaps.** LEGION-47-118 (phase-decomposer) confirms agent-ID validation requires both CATALOG.md lookup AND filesystem existence check (correct pattern per S05 LEGION-47-085), but the surrounding prose has tool-selection ambiguity ("Bash ls for tilde, Glob for absolute") and no failure-path specification. LEGION-47-140 (intent-router) finds the same class at intent-teams.yaml — file read is unguarded against ENOENT/parse errors despite "graceful degradation" claim.

5. **Calibration-cluster emerging.** LEGION-47-131 (spec-pipeline complexity thresholds), LEGION-47-135 (questioning-flow exchange count), LEGION-47-139 (intent-router scoring formula) all show quantitative calibration gaps — ranges overlap at boundaries, arithmetic inconsistencies, or practically-unreachable tiers. This is a new theme relative to earlier sessions' qualitative ambiguities.

6. **Maximalist claim-reality drift.** LEGION-47-143 (intent-router: "never throw, always returns, never null-check") is a fresh instance of the S06 LEGION-47-089 "compatibility shim" mislabel class. Documented guarantees exceed implementation; 4.7 readers will trust the claim and skip defensive programming.

### Cross-cutting observation — planning-skill composition

Three of the five S07 skills are consumed by `/legion:plan` (phase-decomposer, plan-critique, spec-pipeline); one is consumed by `/legion:start` (questioning-flow); one is a cross-cutting dependency of `/legion:build`, `/legion:review`, and `/legion:status` (intent-router). All five form the "pre-execution" spine of Legion. Across this spine, the top themes compound rather than isolate: a 4.7-literal reader running the happy path through `/legion:start → /legion:plan → /legion:build` encounters (a) questioning-flow P1 at the entry, (b) phase-decomposer non-canonical agent IDs mid-pipeline, (c) intent-router scoring practically-unreachable HIGH tier at NL parsing, and (d) plan-critique verdict-routing CAT-1 right before dispatch. Remediation must be sequenced: (1) resolve `adapter.prompt_free_text` primitive decision (blocks LEGION-47-132 and 12+ inherited closed-set-enforcement findings across all sessions); (2) land domain_keywords schema in intent-teams.yaml (blocks LEGION-47-115/116/134 and S02c→S04→S06→S07 chain); (3) cross-check Wave Pattern agent IDs against CATALOG.md (unblocks LEGION-47-119 and parity-fixes LEGION-47-052).

### Cumulative progress
- **Files audited:** 49 / 125 (39.2%)
- **Findings:** 142 total (0 P0, 13 P1, 120 P2, 9 P3) per FINDINGS-DB.jsonl authoritative count
- **Sessions completed:** S01, S02a-d, S03, S04, S05, S06, S07

### Next session
S08 — Execution & Review Skills (5 files): candidate scope includes `wave-executor`-adjacent flow (execution-tracker), the review subsystem (review-evaluators, review-loop, review-panel, security-review). Expect (a) the dispatch-specification cluster to grow further as execution-tracker interacts with wave-executor's fan-out mechanism (LEGION-47-101/102/112/125/128/141); (b) the CAT-1 reviewer-selection gate (LEGION-47-040 in commands/review.md) to resurface in review-panel or review-loop if these files restate it; (c) the S05 dual-ground-truth agent-ID pattern inversion check on review fix-agent routing (continuing LEGION-47-052 pre-existing-bug investigation); (d) the `adapter.prompt_free_text` primitive decision remains outstanding and blocks remediation of LEGION-47-093, 117, 120, 122, 127, 132, 133, 138 plus inherited S03/S04/S05/S06 findings.

---

## Session S08 — Execution & Review Skills

**Started:** 2026-04-16 19:59
**Closed:** 2026-04-16
**Target:** skills/{execution-tracker,review-loop,review-panel,review-evaluators,authority-enforcer}/SKILL.md
**Files audited:** 5 (execution-tracker, review-loop, review-panel, review-evaluators, authority-enforcer)
**Findings:** 36 total — 0 P0, 2 P1, 34 P2, 0 P3
**IDs assigned:** LEGION-47-145 .. LEGION-47-180
**Status:** completed

### Per-file summary

**execution-tracker/SKILL.md — 4 findings (4 P2)**
- LEGION-47-145 (CAT-6 P2): Step 2 STATE.md writes assume structural sections exist — no create-if-missing for "Phase {N} Results", Progress, etc. Canonical Plan-completion write path.
- LEGION-47-146 (CAT-10 P2): Writes STATE.md/ROADMAP.md/git — shared-state writes outside any plan's `files_modified`. No Authority Matrix reference; authority-enforcer Section 11 will flag as violations under surgical mode. Cross-cut with LEGION-47-176.
- LEGION-47-147 (CAT-2 P2): Step 2.5 memory-recording has three conflated conditions (OUTCOMES.md exists OR memory/ exists OR can be created) with no precedence; "output as text" fallback not a structured escalation.
- LEGION-47-148 (CAT-8 P2): Step 3.5 compaction suggestion depends on "completed phase" predicate never defined; may false-positive on just-completed current phase.

**review-loop/SKILL.md — 10 findings (1 P1, 9 P2)**
- LEGION-47-149 (CAT-3 P1, confirmed): Three non-existent agent IDs in canonical review-routing table — `testing-evidence-collector` (L76, 95, 362, 1154), `marketing-content-creator` (L397), `engineering-devops-automator` (L399). Actual IDs: no evidence-collector exists; marketing-content-social-strategist; engineering-infrastructure-devops. Peer of LEGION-47-052, 119. Every `code` phase silently loses its secondary reviewer.
- LEGION-47-150 (CAT-1 P2, confirmed): "Proceed with this reviewer team? (or name a replacement)" is free-text without AskUserQuestion contract. Blocked on `adapter.prompt_free_text` primitive. Peer of LEGION-47-040.
- LEGION-47-151 (CAT-8 P2, confirmed): Exit-conditions don't partition state space. Canonical owner of the LEGION-47-054 defect class.
- LEGION-47-152 (CAT-7 P2): "Skeptical by default", "default to NEEDS WORK", "first reviews almost always surface issues" biases reviewer against PASS.
- LEGION-47-153 (CAT-6 P2): adapter.* references (parallel_execution, spawn_agent_personality, collect_results, model_execution, commit_signature) with no resolution protocol or missing-key handling.
- LEGION-47-154 (CAT-8 P2): Two Section 8 headings (L784 Escalation, L1045 Authority Conflict Resolution) — "go to Section 8" ambiguous.
- LEGION-47-155 (CAT-3 P2): Fix-cycle parallel dispatch asserts non-overlap without verifying; two BLOCKERs in same file can race.
- LEGION-47-156 (CAT-2 P2): File-type → fix-agent mapping closed-set missing .vue/.svelte/.swift/.kt/.cs/.java; L391-392 OR between two agents without disambiguation.
- LEGION-47-157 (CAT-5 P2): Do-NOT scaffolding overused in Section 3 "IMPORTANT" block.
- LEGION-47-158 (CAT-7 P2): "This is almost always a model error" accusation encoded as skill content, necessitated by LEGION-47-149 bug.

**review-panel/SKILL.md — 8 findings (3 confirmed, 8 P2)**
- LEGION-47-159 (CAT-3 P2, confirmed): Five agent-ID errors — "52-agent pool" (actual 48), "Testing division (all 7)" (actual 6), testing-evidence-collector (rubric defined for non-existent agent), engineering-devops-automator, short-form security-engineer/code-reviewer/ux-architect in examples. Peer of LEGION-47-149, 052, 119.
- LEGION-47-160 (CAT-2 P2, confirmed): Three separate security-keyword registries drift out of sync (L27, L439, L494-495); "etc." at L495. Peer of LEGION-47-084, 140.
- LEGION-47-161 (CAT-8 P2): Aggregate verdict state-partition gap (edge: BLOCKERs with all-PASS verdicts; zero must-fix with NEEDS WORK on SUGGESTIONs). Peer of LEGION-47-054, 151.
- LEGION-47-162 (CAT-1 P2, confirmed): "Other — enter custom agent IDs" free-text. Peer of LEGION-47-150, 040.
- LEGION-47-163 (CAT-6 P2): agent-registry.md Section 3 dependencies (Steps 1-6) unverified; OUTCOMES.md schema not checked; "review-capable" based on implicit specialty field.
- LEGION-47-164 (CAT-4 P2): "Review Conduct Rules" claim to be injected but no injection point; Rule 6 verdict "Ready to merge? Yes/No/With fixes" contradicts review-loop Section 3 "PASS/NEEDS WORK/FAIL".
- LEGION-47-165 (CAT-9 P2): Division default rubrics missing Marketing/Support/Spatial Computing/Specialized (per CLAUDE.md 9 divisions); existing defaults have no prompt-injection format.
- LEGION-47-166 (CAT-5 P2): Rules 3/5 Do-NOT constructions convertible to pure positive.

**review-evaluators/SKILL.md — 7 findings (2 confirmed, 7 P2)**
- LEGION-47-167 (CAT-8 P2, confirmed): Section numbering broken — "Section 8" uses 6.1-6.5 subsections, "Section 10" uses 8.1-8.5. Cross-references "Section 6.4" land on wrong sections. Peer of LEGION-47-154.
- LEGION-47-168 (CAT-3 P2, confirmed): `model_tier: "execution"` at L1259 — canonical setter for LEGION-47-110 dead metadata.
- LEGION-47-169 (CAT-2 P2): File-glob evaluator triggers use substring matches not path-anchored patterns; .jsx/.tsx excluded from Code Quality (bug); overlaps silently.
- LEGION-47-170 (CAT-6 P2): adapter.capabilities precondition unverified; "CLI configured" undefined; Section 6.4 broken reference; Security/Completeness missing from 8.1 Dispatch Targets table.
- LEGION-47-171 (CAT-10 P2): Security Evaluator spawns engineering-security-engineer without calling authority-enforcer Section 3; defers to non-audited skills/security-review/SKILL.md.
- LEGION-47-172 (CAT-7 P2): "Boil the Lake" + "completeness should be the default — not a stretch goal" maximalist.
- LEGION-47-173 (CAT-8 P2): Completeness Score has no PASS/NEEDS WORK/FAIL mapping; "N/A passes count as PASS" inflates backend-phase scores to 100 with major gaps.

**authority-enforcer/SKILL.md — 7 findings (3 confirmed, 1 P1, 6 P2)**
- LEGION-47-174 (CAT-2 P1, confirmed): THE canonical `detect_domain()` function has `# ... etc` truncation — only 4 domains (security, performance, accessibility, api-design) of authority-matrix.yaml's full set; silent "general" classification makes filtering fail-open. Peer of LEGION-47-084, 140, 160.
- LEGION-47-175 (CAT-6 P2, confirmed): authority-matrix.yaml load has no error handling; template path for "regenerate" undefined; validate runs after load (masks failure). Peer of LEGION-47-140.
- LEGION-47-176 (CAT-10 P2): Section 11 post-execution boundary check has no carve-out for legitimate system-path writes (STATE.md, ROADMAP.md, SUMMARY.md) — under surgical mode, execution-tracker's writes get reverted. Cross-cut with LEGION-47-146.
- LEGION-47-177 (CAT-7 P2): Injected constraints use stacked "DO NOT" + "MUST" + "Do not skip" + military "first line of defense" rhetoric. Compounds across every agent prompt.
- LEGION-47-178 (CAT-6 P2): Two silently-default-to-guarded paths (missing control_mode_name field, missing profile entirely); agents may think they are in more permissive mode than they are.
- LEGION-47-179 (CAT-8 P2): "BLOCKER from any agent overrides domain ownership" creates veto-by-severity-escalation anti-pattern with no evidence-check guardrail.
- LEGION-47-180 (CAT-3 P2): Integration Points specify what to call but not fan-out parallel-safety, matrix caching contract, or serialization. Peer of LEGION-47-101/102/112/125/128/141/155.

### Themes surfaced this session

1. **Non-existent agent-ID bug class extends further.** S08 added 3 new sites to the pre-existing-bug catalog (LEGION-47-149 with 3 distinct IDs, LEGION-47-159 with 5 distinct errors across a single file including a stale agent-count claim). The bug class now spans spec-pipeline (LEGION-47-052), authority-matrix (LEGION-47-119), review-loop (LEGION-47-149), review-panel (LEGION-47-159). Remediation requires: (a) a CI grep/validator that every agent-ID string in skills/*.md, commands/*.md, config/*.yaml must match an existing agents/<id>.md file, and (b) a canonical agent-ID registry (possibly CATALOG.md) that all other files reference by cross-link rather than hardcoding.
2. **Keyword-registry drift is now a crisis.** Three independent keyword registries for security/domain detection exist with different members: authority-enforcer detect_domain (L390-395 truncated), review-panel detect_domain (L437-442), review-panel intent-filtering (L493-495), plus intent-teams.yaml (S02c schema drift per LEGION-47-084). All four MUST agree but do not. LEGION-47-174 promotes authority-enforcer to canonical owner as the S08 scope requires; resolution means deleting hardcoded lists in review-panel and loading from authority-matrix.yaml's new `domain_keywords` map.
3. **Section-numbering integrity.** Two files in this session have broken structural navigation: review-loop has two "Section 8" headings; review-evaluators uses subsection numbers that don't match their parent sections (6.1-6.5 under "Section 8"; 8.1-8.5 under "Section 10"). Every cross-reference to these sections can resolve incorrectly under 4.7 literal reading.
4. **Exit-condition state partitioning (canonical resolution).** LEGION-47-054 (commands/review.md S05), LEGION-47-151 (review-loop canonical owner), LEGION-47-161 (review-panel aggregate verdict), LEGION-47-173 (review-evaluators completeness score) — same defect class. All rooted in non-partitioning boolean conditions that let certain states fall through without an exit path. Remediation is a single pattern: "compute a scalar gate (must-fix-count, score), then partition with `if X == 0 → PASS; elif escalation_trigger → FAIL; else → NEEDS WORK`". Apply uniformly to all four canonical decision points.
5. **`adapter.prompt_free_text` primitive continues to block free-text AskUserQuestion gates.** S08 added LEGION-47-150 (reviewer confirmation), LEGION-47-162 (review-panel Other option). The primitive decision has now outstanding 7 sessions and blocks remediation of LEGION-47-016, 040, 093, 117, 120, 122, 127, 132, 133, 138, 150, 162 — 12 findings across 11 files.
6. **Maximalist-language cluster is now a systemic issue.** S08 added LEGION-47-152 (skeptical by default), LEGION-47-158 (almost-always-a-model-error), LEGION-47-172 (boil the lake), LEGION-47-177 (first line of defense rhetoric). Combined with prior sessions' findings, the `persona-calibration` cluster now spans both command and skill files. A cross-cut pattern has emerged where emphatic rhetoric accumulates across injection points and amplifies under 4.7 literal reading.
7. **Authority-enforcer cross-cut with execution-tracker.** LEGION-47-146 (execution-tracker writes STATE.md/ROADMAP.md without Authority Matrix reference) + LEGION-47-176 (authority-enforcer Section 11 post-execution check has no carve-out for system-path writes) are the same defect viewed from two ends. Under surgical control mode, execution-tracker's legitimate writes get reverted because authority-enforcer cannot distinguish them from rogue file modifications. Remediation: authority-matrix.yaml schema adds `system_paths_exempt_from_scope: [...]` consumed by both skills.

### Cross-cutting observation — review subsystem integrity

S08 audited four of the five files that constitute the review subsystem (review-loop, review-panel, review-evaluators, authority-enforcer; security-review deferred to S09 per scope). The subsystem as a whole has structural issues that no single file can resolve:

(a) **Three independent keyword registries** (LEGION-47-174, 160, the intent-teams.yaml source) for domain detection. authority-enforcer claims ownership at L381-408 but truncates with `# ... etc`. review-panel duplicates at L437-442 and L493-495 with different members. intent-teams.yaml is the config version but has its own schema drift (LEGION-47-084). 4.7 reader routing a finding through Section 4 filterFindings computes `detect_domain()` against at least two different authoritative-sounding lists depending on code path; results differ silently.

(b) **Non-existent agent IDs proliferate through the review-selection chain.** review-loop routes to testing-evidence-collector; review-panel composes panels including testing-evidence-collector, engineering-devops-automator, code-reviewer; review-evaluators spawns engineering-security-engineer (correct) and product-feedback-synthesizer as Completeness Evaluator (unusual role). Every /legion:review invocation under default settings hits at least one silent fallback.

(c) **Section-numbering drift** in review-loop (two Section 8s) and review-evaluators (6.1-6.5 / 8.1-8.5 under mis-numbered sections). Cross-references break under literal reading. The review subsystem's own files cannot reliably navigate to one another's anchors.

(d) **Exit-condition state partitioning** broken in both review-loop (L349-352, L789) and review-panel (L547-551) and review-evaluators (completeness score L1003-1014). Four canonical decision points with the same defect pattern.

(e) **Authority enforcement carve-outs missing.** authority-enforcer Section 11 will flag legitimate state-file writes by execution-tracker, review-loop (REVIEW.md), memory-manager (OUTCOMES.md) under surgical mode. The review subsystem writes state files as a matter of course; no schema exists to declare them safe.

Systemic remediation: the review subsystem should be treated as a single unit in S18 (REMEDIATION.md) with a phased plan that (1) fixes agent-ID errors (CI check), (2) consolidates keyword registries into authority-matrix.yaml, (3) repairs section numbering, (4) applies the partition-gate pattern uniformly, (5) adds system-path carve-outs. Incremental fixing of individual findings will leave the subsystem in an inconsistent intermediate state.

### Cumulative progress

- **Files audited:** 54 / 125 (43.2%)
- **Findings:** 178 total (0 P0, 15 P1, 154 P2, 9 P3) per FINDINGS-DB.jsonl authoritative count
- **Sessions completed:** S01, S02a-d, S03, S04, S05, S06, S07, S08

### Next session
S09 — Domain & Integration Skills (6 files): candidate scope includes `security-review/SKILL.md` (deferred from S08 due to scope cut — this skill is the "Full methodology defined in" target for review-evaluators Security Evaluator per LEGION-47-171, and inherits pending audit risk), `design-workflows/SKILL.md`, `marketing-workflows/SKILL.md`, `github-sync/SKILL.md`, `hooks-integration/SKILL.md`, and one more domain/integration skill per the skills index. Expect (a) the marketing/design keyword-registry cluster (intent-teams.yaml schema drift LEGION-47-084, 140, 160, 174) to recur directly at the workflow sources; (b) the dispatch-specification cluster (LEGION-47-101/102/112/125/128/141/155/180) to extend as integration skills dispatch to external services (GitHub, hooks); (c) the CAT-10 authority carve-out issue (LEGION-47-146, 176) to recur if integration skills write to project state. The `adapter.prompt_free_text` primitive decision remains outstanding and blocks remediation of LEGION-47-016, 040, 093, 117, 120, 122, 127, 132, 133, 138, 150, 162 plus inherited S03/S04/S05/S06/S07 findings. The agent-ID validation CI check proposed above must land before S11 (engineering agent audits) to avoid compounding non-existent-ID findings.

