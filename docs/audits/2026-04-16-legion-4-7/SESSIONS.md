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
- **Findings so far:** 57 (0 P0, 7 P1, 45 P2, 5 P3)
- **Clusters touched:** `precondition-verification` (3), `trigger-explicitness` (9), `acceptance-criteria` (4), `intent-front-loading` (1), `authority-language` (1), `closed-set-enforcement` (22), `dispatch-specification` (2), `response-calibration` (4)

### Next session
S05 — Commands 13-17 (per plan Task 8). Remaining commands: ship.md, start.md, status.md, update.md, validate.md. start.md = CAT-1 user-interaction hotspot; ship.md = CAT-3 dispatch hotspot.

---

