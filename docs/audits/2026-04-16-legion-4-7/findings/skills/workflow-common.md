# Audit Findings — skills/workflow-common/SKILL.md

**Audited in session:** S06
**Rubric version:** 1.0
**File layer:** skill
**File length:** 811 lines
**Total findings:** 4 (1 P1, 3 P2)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-089 — P1, CAT-6 Implicit Preconditions (confirmed)

**Lines 13-73**

> ## CLI Detection and Adapter Loading
>
> Legion supports multiple AI CLIs through an adapter layer. Before any command executes, the active CLI must be detected and its adapter loaded.
>
> ### Detection Protocol
>
> ```
> Step 0: Check for override file
>   - Read .legion-cli in the project root (if it exists)
>   ...
> Step 4: After detection
>   - Read the full adapter file: adapters/{cli}.md
>   - Parse YAML frontmatter for capabilities and tool mappings
>   ...
> ```
>
> ### Adapter Reference Convention
>
> Throughout skills and commands, adapter fields are referenced with dot notation:
> - `adapter.spawn_agent_personality` — how to spawn an agent with personality
> ...

**Issue:** This file is explicitly labeled a "compatibility shim" at line 7 of frontmatter and line 11 of body (`New command execution should load workflow-common-core first`), yet it redeclares a full CLI Detection Protocol, Adapter Reference Convention, User Interaction Convention, Settings Resolution, Agent Path Resolution Protocol, State File Locations, etc., that exist in parallel in `workflow-common-core/SKILL.md`. A 4.7 reader following this file treats the protocols here as canonical. When they disagree with workflow-common-core (and they do — workflow-common has 9-step settings defaults while workflow-common-core has 7-step; workflow-common lists 52 agents while core's AGENTS_DIR protocol refers to 48), the reader has no rule for resolving the conflict. This is the most dangerous kind of Implicit Precondition because the file cites itself as the source of truth ("Throughout skills and commands...") while simultaneously disclaiming canonical status. Confirmed via direct byte-compare with workflow-common-core.

**Remediation sketch:** Pick one of (a) reduce workflow-common to a pure pointer (3-5 lines: "All content moved to workflow-common-core/, workflow-common-domains/, workflow-common-github/, workflow-common-memory/. Load the relevant extension for your command"); (b) annotate each divergent section with "CANONICAL: see workflow-common-core/SKILL.md §X — content below is historical"; (c) consolidate the shim by deleting this file and migrating command references. Path (a) is lowest-risk and fastest; (c) is correct long-term.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** medium

---

## LEGION-47-090 — P2, CAT-2 Ambiguous Triggers (confirmed)

**Lines 722-761, 763-803**

> ### Marketing Purpose
> Structured campaign workflows for marketing-focused phases -- campaign planning, content calendar generation, and cross-channel coordination. ...
>
> ### Marketing Integration Points
> | `/legion:plan` | Detect marketing phase, campaign questioning, generate campaign doc | During phase decomposition (if MKT-* requirements or marketing keywords) |
>
> ### Design Purpose
> ... Design Integration Points
> | `/legion:plan` | Detect design phase, design questioning, generate design docs | During phase decomposition (if DSN-* requirements or design keywords) |

**Issue:** Third occurrence of the S02a/S02c cross-cut: "marketing keywords" and "design keywords" are referenced as triggers without an enumerated keyword list. Per the S02c cross-cutting observation, `intent-teams.yaml` contains no marketing/design keyword registry. 4.7 readers instructed to "detect marketing-focused phase" must either (a) over-match on any surface keyword, or (b) under-match by inventing a list. This parity finding reinforces LEGION-47-002 (CLAUDE.md) and LEGION-47-004 (AGENTS.md) at the skill layer — more load-bearing than root markdown because this file is loaded by `/legion:plan` execution context.

**Remediation sketch:** Mirror the remediation for LEGION-47-002. Either (a) drop "or keywords" and tie triggers to the `MKT-*`/`DSN-*` prefix only, or (b) reference a concrete keyword source file (once one exists — `intent-teams.yaml` does not currently contain this data).

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---

## LEGION-47-091 — P2, CAT-5 Prohibitive Over-Reliance (suspected)

**Lines 196-200**

> **Rules:**
> - Run this protocol ONCE at the start of each command, before any personality file is read
> - Store the resolved `AGENTS_DIR` value and reuse it for all subsequent agent file reads in the same command
> - All personality reads use `{AGENTS_DIR}/{agent-id}.md` — never bare `agents/{agent-id}.md`
> - Use Bash (not Glob) for `~` paths — the Glob tool does not expand tilde

**Issue:** The third rule uses "never bare `agents/{agent-id}.md`" in a prohibitive form while the cli-dispatch skill Section 3 Part 1 contains precisely this forbidden pattern (`Read the ENTIRE agent .md file: agents/{agent-id}.md`). This is not merely a conflicting instruction — it is a constraint that cannot be satisfied given the current codebase. When 4.7 reads both files, it faces a choice between two authoritative statements. The prohibitive framing here ("never") is more likely to be honored than the positive instruction in cli-dispatch, resulting in either (a) a refusal to execute cli-dispatch verbatim, or (b) silent substitution of `{AGENTS_DIR}` into the cli-dispatch template without resolving. Both outcomes violate implicit operator expectations.

**Remediation sketch:** Either (a) fix cli-dispatch Section 3 Part 1 to use `{AGENTS_DIR}/{agent-id}.md` (see LEGION-47-121), and keep this rule intact, or (b) relax this rule to "Use `{AGENTS_DIR}/{agent-id}.md` as the canonical form; bare `agents/{agent-id}.md` is accepted in local-dev mode only". Path (a) is correct.

**Remediation cluster:** `prohibitive-to-positive`
**Effort estimate:** small

---

## LEGION-47-092 — P2, CAT-8 Unstated Acceptance Criteria (suspected)

**Lines 505-521**

> ## Division Constants
>
> ```
> DIVISIONS = [
>   "Engineering",        # 7 agents — code, architecture, DevOps
>   "Design",             # 6 agents — UI/UX, branding, visual
>   "Marketing",          # 8 agents — content, social, growth
>   "Product",            # 3 agents — sprints, feedback, trends
>   "Project Management", # 5 agents — coordination, portfolio
>   "Testing",            # 7 agents — QA, evidence, performance
>   "Support",            # 6 agents — analytics, finance, legal
>   "Spatial Computing",  # 6 agents — XR, VisionOS, Metal
>   "Specialized"         # 3 agents — orchestration, data, LSP
> ]
>
> TOTAL_AGENTS = 52
> ```

**Issue:** The division counts printed here (7+6+8+3+5+7+6+6+3 = 51 by sum, TOTAL_AGENTS stated as 52) do not match the 48-agent count stated in CLAUDE.md and the Dynamic Knowledge Index (9+6+4+4+6+6+4+6+4 = 49 listed agent files, officially documented as 48). Three parallel "ground truth" counts exist (51 sum, 52 declared total, 48 from CLAUDE.md) with no rule for which is canonical. A skill with `TOTAL_AGENTS = 52` in its injected context will cause downstream agents to assume a roster larger than reality, leading to invented agent IDs — the same defect class as LEGION-47-052 (non-existent agent ID fix-routing). Pre-existing drift between workflow-common, CLAUDE.md, and the filesystem.

**Remediation sketch:** Unify on the actual filesystem count. Delete the hardcoded "# N agents" comments and the `TOTAL_AGENTS = 52` literal; replace with "Run: `ls {AGENTS_DIR}/*.md | wc -l` for the authoritative count; divisions are read from agent frontmatter `division:` fields." Add a validator in `/legion:validate` that compares declared counts against filesystem reality (analogous to LEGION-47-086 for division header comments).

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** medium

---
