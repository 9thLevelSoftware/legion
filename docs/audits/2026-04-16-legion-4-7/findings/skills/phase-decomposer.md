# Audit Findings — skills/phase-decomposer/SKILL.md

**File size:** 978 lines
**Session:** S07
**Rubric version:** 1.0

---

## LEGION-47-115 — P2, Ambiguous Triggers (confirmed)

**Lines 94-113**

> ### Marketing Domain Detection
>
> After reading phase details, check if this is a marketing-focused phase:
>
> 1. **Requirement check**: Any MKT-* requirement IDs in the phase requirements?
> 2. **Keyword check**: Phase description contains marketing keywords?
>    Keywords: "campaign", "content calendar", "social media", "cross-channel",
>    "marketing", "brand awareness", "audience", "engagement strategy",
>    "content strategy", "channel strategy"
> 3. **Agent signal**: Does agent-registry recommend majority marketing-division agents?
>
> If ANY signal is positive:
>   → Flag phase as marketing-focused

**Issue:** Two compounding defects of the S02c marketing/design keyword registry cross-cut. (1) Keywords are enumerated inline here — a 10-word list — but `.planning/config/intent-teams.yaml` has no `marketing_keywords` / `design_keywords` sections (S02c confirmed LEGION-47-011, 013, 018). This file is therefore a *de facto* authoritative source competing with the canonical domain-keyword owner (`skills/workflow-common-domains/SKILL.md`, LEGION-47-096), which does not enumerate them either. 4.7-literal readers following CLAUDE.md and workflow-common-domains hit a dead end. 4.7-literal readers following this file use a list that no other skill can validate against. Drift guaranteed. (2) "Phase description contains marketing keywords" is substring-match without word-boundary specification — "engagement strategy" inside "user engagement strategy for onboarding" matches; "marketing" inside "remarketing" matches; "audience" matches for any analytics audience ≠ marketing audience. Same CAT-2 trigger-explicitness class as LEGION-47-044 (quick.md), 057 (review.md), 018 (intent-teams.yaml). Confirmed under S02c → S04 → S06 → S07 re-inheritance rule.

**Remediation sketch:** (a) Move authoritative keyword list to `.planning/config/intent-teams.yaml` (new `domain_keywords:` top-level block), schema-declared in `.planning/config/intent-teams.schema.json`. (b) Replace inline list with: "Read `intent-teams.yaml` → `domain_keywords.marketing`. Apply word-boundary regex: `/\b(keyword1|keyword2|...)\b/i` against phase description. A match ≥ 1 triggers marketing detection." (c) Cross-reference workflow-common-domains as keyword-registry consumer. (d) Specify precedence when MKT-* IDs are absent but keywords match (currently "ANY signal" — document whether false-positive keyword match should be reconciled with agent-signal disagreement).

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** medium

---

## LEGION-47-116 — P2, Ambiguous Triggers (confirmed)

**Lines 115-134**

> ### Design Domain Detection
>
> After reading phase details (and after marketing detection), check if this is a design-focused phase:
>
> 1. **Requirement check**: Any DSN-* requirement IDs in the phase requirements?
> 2. **Keyword check**: Phase description contains design keywords?
>    Keywords: "design system", "component library", "UX research", "usability testing",
>    "accessibility audit", "brand guidelines", "design tokens", "wireframes", "prototypes",
>    "user testing", "design review", "user persona", "user journey", "information architecture",
>    "visual design"

**Issue:** Same defect class as LEGION-47-115 for the design branch. 15 keywords inline, not in the domain registry, no word-boundary specification, no precedence rule if both marketing AND design signals fire (the instruction "after marketing detection" implies ordering but does not say what happens if both flag true — flag both? flag design only? flag marketing only?). Several keywords overlap semantics across domains: "user persona", "user journey", "user testing" can equally appear in product/engineering phases. "brand guidelines" overlaps with marketing's "brand awareness". "design review" matches any code-review phase containing "design review meeting". Confirmed under S02c re-inheritance + S04/S06 peer findings.

**Remediation sketch:** Same pattern as LEGION-47-115 — relocate to `domain_keywords.design` in intent-teams.yaml, regex-word-boundary match. Additionally specify collision resolution: "If both marketing AND design signals fire, apply tie-break: (1) agent-registry majority division wins, (2) if still tied, flag phase as cross-division and skip domain-specific wave patterns (fall through to standard decomposition in Section 3)."

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** medium

---

## LEGION-47-117 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 229-239**

> Step 4: User selection
>   Use AskUserQuestion:
>
>   "Which architecture approach for Phase {N}?"
>   Options:
>   - "Proposal A: Minimal" — {1-line summary}
>   - "Proposal B: Clean Architecture" — {1-line summary}
>   - "Proposal C: Pragmatic" — {1-line summary}
>   - "Hybrid" — "I want to combine elements from multiple proposals"
>
>   If "Hybrid": ask user which elements from which proposals to combine,
>   then synthesize a merged approach.

**Issue:** Closed-set discipline violated twice. (1) "Hybrid" branch opens an unbounded free-text capture ("ask user which elements from which proposals to combine"), inheriting the S03 AskUserQuestion contract defect — AskUserQuestion requires non-empty options but "which elements from which proposals" is free-text, so the follow-up must either bypass AskUserQuestion (violates CLAUDE.md mandate) or enumerate a Cartesian product of proposal×element bullets (impractical and still bounded, contradicting the stated intent). Blocked on outstanding `adapter.prompt_free_text` primitive (S03/S04/S05/S06 cross-cut). (2) The four options do not cover the "reject all three proposals" case: a user whose stance is "none of these; regenerate with new archetypes" has no listed path. Same class as LEGION-47-019, 020, 040, 045, 093 peers.

**Remediation sketch:** (a) Replace with a 5th explicit option: "None of these — regenerate proposals with different philosophy archetypes". (b) For the Hybrid sub-question, define the free-text capture route per S03 remediation OR enumerate: "Elements from Proposal A: [bulleted list of A's components]. Select any; same for B and C." — binds the space to the concrete proposal files. (c) Specify "No response" default — whether to time-out to A (the first-listed option) or abort.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-118 — P2, Implicit Preconditions (confirmed)

**Lines 419-422**

> For each recommended agent-id:
>   - Confirm it appears in agent-registry CATALOG.md Section 1 (Agent Catalog table)
>   - Confirm {AGENTS_DIR}/{agent-id}.md exists (use Bash `ls` for tilde paths, Glob for absolute paths)

**Issue:** S04 non-existent agent-ID class (LEGION-47-052) is mitigated here by requiring dual verification (CATALOG.md table + filesystem existence) — this is the correct pattern and cross-references the S05 LEGION-47-085 "dual ground-truth" observation. However the precondition text has two ambiguities that re-open the gap 4.7-literal readers will not close. (1) "Bash `ls` for tilde paths, Glob for absolute paths" contradicts workflow-common-core AGENTS_DIR Resolution Protocol — the protocol already resolves AGENTS_DIR to a concrete absolute or tilde-expanded path per invocation, meaning the file-existence check is a single primitive regardless of path form. The tilde-vs-absolute branch here invites a tool-selection mistake (Glob in Claude Code errors on `~/.claude/agents/foo.md`; Bash `ls` on a Windows absolute path needs forward slashes per project convention). (2) No failure path: what happens when CATALOG.md lists the ID but the file is missing, or vice versa? The Section 5 Handling Agent Swaps flow (L543-567) assumes recommendation phase already validated IDs; this contradiction is silent. Confirmed: same dual-ground-truth class as LEGION-47-085.

**Remediation sketch:** (a) Replace tool-selection prose with: "After AGENTS_DIR is resolved (workflow-common-core Protocol), verify `{AGENTS_DIR}/{agent-id}.md` exists using the single file-existence primitive per `adapter.file_exists`. CATALOG.md is the first ground truth (authoritative roster); filesystem is the second (deployment truth). Both must pass." (b) Specify failure mode: "If CATALOG lists but file missing → deployment drift, abort with INSTALL-DRIFT error. If file exists but not in CATALOG → catalog drift, warn but allow. Record outcome per agent in plan generation log." (c) Cross-link to LEGION-47-085 remediation plan.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-119 — P2, Underspecified Dispatch (confirmed)

**Lines 305-355**

> ### Marketing-Specific Wave Pattern
> ...
> - **Wave 1: Strategy & Planning**
>   Agents: marketing-social-media-strategist (lead), marketing-growth-hacker
> ...
> - **Wave 2: Content Creation**
>   Agents: marketing-content-creator + channel specialists based on campaign channels
> ...
> ### Design-Specific Wave Pattern
> ...
>   Agents: design-ux-researcher (research lead), design-brand-guardian (brand audit)
> ...
>   Agents: design-ui-designer (design lead) + design-ux-architect + design-visual-storyteller
> ...
>   Optional: growth-hacker (if acquisition/conversion focus), design-visual-storyteller (if visual-heavy)

**Issue:** Non-existent-agent-ID bug-class risk (S04 LEGION-47-052). The agent IDs cited here do not match the canonical division-prefixed pattern (`{division}-{role}`) enforced in L696 ("**MUST be exact filenames from agent-registry CATALOG.md Section 1**") or in CLAUDE.md Agent Divisions table. Specifically: `marketing-social-media-strategist` — CLAUDE.md lists `marketing-social-platform-specialist` and `marketing-content-social-strategist`; `marketing-content-creator` — not in the canonical roster (closest: `marketing-content-social-strategist`); `design-ux-architect` — matches `design-ux-architect.md`; `design-brand-guardian` — matches; `design-whimsy-injector` — matches (cited at L353, not excerpted above); but the Optional line L489 uses bare `growth-hacker` without the `marketing-` prefix — L696 rule violated. Wave Pattern is dispatch-authoritative (agents listed here are spawned by wave-executor). If any ID is wrong or prefix-stripped, dispatch fails at runtime per S04 LEGION-47-052 pre-existing-bug class. Confirmed CAT-3 dispatch-specification; tagged as peer to LEGION-47-052.

**Remediation sketch:** (a) Cross-check every agent ID cited in Marketing Wave Pattern and Design Wave Pattern against CLAUDE.md Agent Divisions table and agent-registry CATALOG.md Section 1. (b) Replace non-canonical IDs with the canonical `{division}-{role}` form. Specifically resolve: `marketing-social-media-strategist` → likely `marketing-social-platform-specialist`; `marketing-content-creator` → likely `marketing-content-social-strategist`; `growth-hacker` → `marketing-growth-hacker`. (c) Add a verification step before plan file generation: "For every agent-id referenced in Wave Pattern sections, run the Section 4 Per-Plan Selection validation (L419-422) — if any ID fails CATALOG+filesystem check, abort wave pattern generation and fall through to standard decomposition with a recorded warning." (d) Flag as P1 if cross-check confirms 2+ non-existent IDs (parity with LEGION-47-052).

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** medium

---

## LEGION-47-120 — P2, Unstated Acceptance Criteria

**Lines 537-545**

> Use AskUserQuestion to get user approval:
>
> ```
> Question: "Does this plan breakdown and agent assignment look right?"
> Options:
>   - "Looks good, generate the plans" -- proceed to plan file generation
>   - "Swap an agent" -- ask which plan and which replacement agent
>   - "Adjust the plan structure" -- discuss and revise before generating
> ```

**Issue:** This is the load-bearing confirmation gate for the whole skill (everything before it is planning; everything after is file generation). Yet it has the same CAT-1 defect pattern as LEGION-47-117: option 2 "Swap an agent — ask which plan and which replacement agent" is unbounded free-text for a compound question (which plan × which agent) and inherits the S03 AskUserQuestion contract defect. Option 3 "Adjust the plan structure — discuss and revise" is even more open-ended — "discuss" does not specify whether the user types free prose or the agent re-asks questions; if the latter, no follow-up AskUserQuestion schema is specified. There is also no "Cancel" / "Abort" option — the user is forced to either approve, swap, or discuss. Peer to LEGION-47-050/055 bracketed-stub class and LEGION-47-093 free-text inheritance.

**Remediation sketch:** (a) Restructure as nested AskUserQuestion: outer question has 4 options — Proceed / Swap agent / Adjust structure / Cancel. (b) "Swap an agent" follow-up: enumerate "Which plan?" with one option per plan NN-PP (bounded). Then second AskUserQuestion: "Replace {agent-id} with?" with options being the top-3 runner-up candidates from the Section 4 score_export plus "Other (restart recommendation with manual input)". (c) "Adjust structure" follow-up: same enumerate-the-plans pattern, then options "Merge with...", "Split into...", "Delete", "Change wave". (d) Cancel option: persist nothing, return to caller.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-121 — P2, Authority Ambiguity

**Lines 29-47**

> ## Section 1.5: Settings Input
>
> ### Extended Thinking Mode
>
> If `settings.json` `models.planning_reasoning` is `true` AND the active adapter's `supports_extended_thinking` is `true`:
> - Use `adapter.model_planning` (e.g., `opus`) for the decomposition agent
> - Extended thinking provides deeper analysis of:
>   - Requirement dependencies and implicit constraints
>   - Wave ordering rationale (why plan A must precede plan B)
> ...
> If `models.planning_reasoning` is `false`: use `adapter.model_execution` as normal

**Issue:** The same `model_tier` collapse class documented in LEGION-47-110 (cli-dispatch) — but at the other end of the dispatch chain. This skill tells agents to "use `adapter.model_planning`" but per LEGION-47-110 S06 findings, cli-dispatch Section 3's prompt template never reads model_tier and the Claude-Code adapter hardcodes `model_execution` regardless. Net effect: `planning_reasoning: true` changes nothing. Writer authority of this skill is asserting a capability that dispatch authority does not honor. CAT-10 authority-ambiguity: which authority wins — this skill's model-selection declaration, or cli-dispatch's hardcoded adapter mapping? The skill provides no guidance on what to do when dispatch does not implement the declared contract.

**Remediation sketch:** (a) Link this section to the LEGION-47-110 remediation plan (Path A: add Part 6 to cli-dispatch reading model_tier). (b) Until that lands, mark this section with: "NOTE: model_planning selection is currently nominal — cli-dispatch does not route by model_tier as of v7.4.0. See LEGION-47-110." (c) Add a verification probe: before relying on extended thinking, check the SUMMARY.md of a recent planning-phase agent and confirm `adapter_model_used: opus` was recorded. If always `sonnet`, the contract is not honored. (d) Long term: delete this section or make it live by landing Path A in cli-dispatch.

**Remediation cluster:** `authority-language`
**Effort estimate:** small

---

## Category Coverage Notes

- **CAT-1** (Open-Set Interpretation): 2 findings (LEGION-47-117, 120). Both confirmed CAT-1 inheriting S03 free-text capture defect. Architectural-proposal selection and final approval gate are the two load-bearing closed-set gates in this skill; both have unbounded follow-up branches.
- **CAT-2** (Ambiguous Triggers): 2 findings (LEGION-47-115, 116). Marketing + design keyword lists inline here, not in the canonical domain-keyword registry. S02c → S04 → S06 → S07 re-inheritance.
- **CAT-3** (Underspecified Dispatch): 1 finding (LEGION-47-119). Wave Pattern agent IDs include at least 2 non-canonical forms (`marketing-content-creator`, `growth-hacker`). S04 LEGION-47-052 pre-existing-bug peer.
- **CAT-4** (Underspecified Intent): 0 findings. Intent is front-loaded adequately (Section 1 Decomposition Principles + Section 2 Phase Analysis establish intent before any action).
- **CAT-5** (Prohibitive Over-Reliance): 0 findings. No "MUST never" cluster that dominates interpretation.
- **CAT-6** (Implicit Preconditions): 1 finding (LEGION-47-118). Agent-ID validation precondition is correct in spirit but ambiguous in tool selection and failure mode.
- **CAT-7** (Maximalist Persona Language): 0 findings. Engine skill, not persona.
- **CAT-8** (Unstated Acceptance Criteria): 1 finding (LEGION-47-120). Final confirmation gate has unbounded follow-up branches.
- **CAT-9** (Response Calibration Gaps): 0 findings.
- **CAT-10** (Authority Ambiguity): 1 finding (LEGION-47-121). model_planning declaration contradicts cli-dispatch's hardcoded model_execution (LEGION-47-110 peer).

**Severity summary:** 7 findings total — 0 P0, 0 P1, 7 P2, 0 P3.
**Confirmed count:** 5 of 7 (LEGION-47-115, 116, 117, 118, 119). LEGION-47-120 and 121 marked unconfirmed (single-instance in this session; 120 is design-variant of the approval-gate CAT-1 class covered elsewhere; 121 is authority rather than correctness ambiguity).
