# Audit Findings — skills/spec-pipeline/SKILL.md

**Audited in session:** S07
**Rubric version:** 1.0
**File layer:** skill
**File length:** 786 lines
**Total findings:** 5 (5 P2)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-127 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 564-578**

> Step 2: Check for existing spec
>   Look for .planning/specs/{NN}-{phase-slug}-spec.md
>   If exists:
>     Inform user: "Spec document already exists for Phase {N}."
>     Ask: "Overwrite or keep existing?"
>     - "Overwrite" — proceed with full pipeline, replace existing spec
>     - "Keep existing" — abort, suggest reviewing the existing spec

**Issue:** The standalone invocation entry gate has only 2 options. Missing: "Update in place" (re-run Sections 4-5 only, preserving Section 3 draft), "Diff and merge" (compare existing to newly-generated), "Cancel" (exit without action). More critically, the surrounding Section 7 (L602-610) explicitly states "The new spec replaces the old one — no merge, no diff" — an acceptance-criteria choice that conflicts with the "Keep existing" option's implicit assumption that the existing spec is still consistent with current REQUIREMENTS.md. A 4.7-literal reader who selects "Keep existing" when REQUIREMENTS.md has since changed will hold a stale spec that downstream `/legion:plan` consumes without warning. Peer CAT-1 class to LEGION-47-122, 117, 120.

**Remediation sketch:** (a) Add 4 options: Overwrite / Update (re-run Sections 4-5) / Keep existing (warn if stale) / Cancel. (b) Add staleness check: before offering "Keep existing", compute a fingerprint (hash of phase_requirements + success_criteria from ROADMAP.md). Compare to the fingerprint recorded in the spec's frontmatter (add a `requirements_fingerprint` field to the spec template in Section 3 Step 2). If fingerprint differs: mark "Keep existing" option as "(WARNING: spec may be stale relative to current requirements)" and require user acknowledgment. (c) Document the trade-off between "no merge" policy (stated L605) and "Update" option; if Update is not desired, explicitly mark it "Not supported in v7.4.0 — planned for future".

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-128 — P2, Underspecified Dispatch (confirmed)

**Lines 140-158**

> Step 3: Spawn research agents (conditional)
>   Only when the phase involves unfamiliar technology, patterns outside
>   the existing codebase, or complex domain knowledge:
>
>   a. Spawn 1-2 read-only (Explore) agents with specific research questions
>   b. Each agent receives:
>      - The requirements summary from Section 1
>      - Their specific research question(s)
>      - Instructions to return structured findings
>   c. Agent selection: prefer agents with domain expertise
>      (e.g., engineering-senior-developer for architecture research,
>       design-ux-researcher for UX domain research)

**Issue:** Dispatch specification under-specified at multiple levels. (1) "Spawn 1-2 agents" with no fan-out mechanism for the 2-agent case — same CAT-3 class as S06 LEGION-47-101, 102, 112, S07 LEGION-47-125. (2) "Prefer agents with domain expertise" is heuristic guidance, not a decision rule — same as workflow-common Division → Capability Affinity table gaps (LEGION-47-114 S06). What if two agents are equally preferred? What if no agent has the needed expertise? (3) Trigger condition "unfamiliar technology, patterns outside the existing codebase, or complex domain knowledge" is an unbounded OR-clause — every non-trivial phase satisfies at least one (CAT-4 intent-late peer). (4) "Explore subagent type" assumes adapter.spawn_agent_readonly primitive — referenced but not required-to-exist; if adapter lacks it (Aider, OpenCode in some modes), behavior is undefined. Dual-defect class: CAT-3 (dispatch) + CAT-6 (precondition).

**Remediation sketch:** (a) Add fan-out spec: "For 2-agent dispatch, issue both adapter.spawn_agent_readonly calls in same response block." (b) Replace heuristic agent selection with Section 4 (plan-critique pattern) scoring — cross-reference agent-registry Section 3 Recommendation Algorithm. (c) Specify trigger threshold concretely: "Spawn research agents iff ANY of: (i) phase requirements reference technology not in `.planning/CODEBASE.md` detected-stack list, (ii) phase goal mentions domain keywords from `domain_keywords.design` or `domain_keywords.marketing` registry (LEGION-47-115/116 remediation), (iii) phase estimated_plans ≥ 3 in ROADMAP.md." (d) Require adapter.spawn_agent_readonly precondition check: "If adapter.spawn_agent_readonly is unavailable, skip research agent spawning; run orchestrator-self-research with a note in the research brief."

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** medium

---

## LEGION-47-129 — P2, Implicit Preconditions

**Lines 325-358**

> 3.5: Validate deliverable paths against directory mappings (ENV-03)
>
> Before finalizing the spec, validate that all deliverable paths follow the
> project's established directory structure.
>
> 3.5.1: Load directory mappings
>
> Check if `.planning/config/directory-mappings.yaml` exists:
> - If yes: Load mappings and enforcement configuration
> ...
> When override is present, skip validation for that deliverable and note:
> "Path override accepted for {deliverable}: {reason}"

**Issue:** `directory-mappings.yaml` is a config file referenced for the first time in this skill. It has no documented home in the S02c config-YAMLs session — this is a precondition-verification ambiguity class peer to LEGION-47-084 (validate.md's intent-teams.yaml schema drift). Three concrete ambiguities: (1) The schema of directory-mappings.yaml is implicit from the Section 8 Path Enforcement Utilities code (L612-758), but no JSON schema file is cross-referenced (parity gap with intent-teams.schema.json which DOES exist). (2) "If no: ..." is not specified — Section 3.5.1 branches "yes" but no "else" fallthrough is shown in this excerpt's context. (Examined L330-345: the else case says "skip path validation" but the transition from "skip" to the Path Validation section (L344-356) is unclear — does the table still render with "Validation disabled" status, or is the section omitted entirely?). (3) "Override is present" — where is the override? Section 3.5.4 (not excerpted but present) describes override fields but the data shape (frontmatter field name, YAML structure) is spec'd for spec documents, not for ROADMAP.md or REQUIREMENTS.md, so overrides can only attach to the spec file itself after creation — chicken-and-egg problem during initial spec generation.

**Remediation sketch:** (a) Create `.planning/config/directory-mappings.schema.json` per S02d convention; cross-reference from Section 8. (b) Explicitly specify fallback: "If `directory-mappings.yaml` absent: include a `## Path Validation` section in the spec with Status: 'Validation disabled (no directory-mappings.yaml)' — do not omit the section, so consumers can detect the gap." (c) Resolve override chicken-and-egg: allow overrides to be specified inline in requirements (new REQUIREMENTS.md field) OR via post-generation user intervention with a new AskUserQuestion prompt. Document the chosen path.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** medium

---

## LEGION-47-130 — P2, Unstated Acceptance Criteria

**Lines 250-260**

> Step 3: Validate spec completeness
>   Before moving to Section 4, check:
>   - [ ] Every requirement from Section 1 appears in the Requirements table
>   - [ ] Every deliverable has a defined path and purpose
>   - [ ] Architecture section explains how deliverables connect
>   - [ ] Key decisions have rationale (not arbitrary choices)
>   - [ ] Open questions are categorized as Blocking or Deferrable
>
>   The spec is a draft at this stage — Section 4 will critique it.

**Issue:** Completeness gate for Section 3 is a 5-item checklist, but none of the items are machine-checkable — they are author-judgment checkboxes. "Architecture section explains how deliverables connect" has no test; "Key decisions have rationale (not arbitrary choices)" has no arbitrariness test; "Open questions are categorized as Blocking or Deferrable" has no verification of the category assignments. A 4.7-literal reader running this check will self-certify PASS 100% of the time with no false-negative signal. The gate exists nominally but does not gate. Same CAT-8 acceptance-criteria class as LEGION-47-126.

**Remediation sketch:** Replace each soft check with a concrete verification: (a) "Every requirement appears in Requirements table" → count: "Requirements table row count == Section 1 categorized-requirements count; report difference if mismatch." (b) "Every deliverable has defined path and purpose" → "Each Deliverables entry has non-empty `Path:` and non-empty description. Missing field: FAIL." (c) "Architecture section explains how deliverables connect" → "Architecture section contains ≥ N-1 pairwise relationship statements where N = deliverable count, OR an explicit note 'Deliverables are independent' if N=1 or genuinely unlinked." (d) "Key decisions have rationale" → "Every Key Decision row has non-empty `Rationale` and non-empty `Alternatives Considered`." (e) "Open questions categorized" → "Every Open Question row has Status ∈ {Blocking, Deferrable}." If any check fails: re-run Section 3 Step 2 with the gap identified; do not proceed to Section 4.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-131 — P2, Response Calibration Gaps

**Lines 485-497**

> Step 3: Rate overall complexity
>
>   | Rating | Criteria | Plan Estimate |
>   |--------|----------|--------------|
>   | Simple | 1-2 requirements, ≤3 deliverables, 1 wave | 1 plan likely |
>   | Medium | 2-3 requirements, 3-5 deliverables, 1-2 waves | 2 plans |
>   | Complex | 4+ requirements, 5+ deliverables, 2+ waves, architectural choices | 3+ plans |
>
> Step 4: Recommend competing architecture proposals
>   Based on complexity rating, recommend whether PLN-01 (competing
>   architecture proposals in /legion:plan step 3.5) would add value:
>
>   | Complexity | Recommendation | Rationale |
>   |-----------|---------------|-----------|
>   | Simple | Skip proposals | Low risk, one obvious approach |
>   | Medium | Optional | Offer but default to skip |
>   | Complex | Recommended | Multiple valid approaches, worth exploring trade-offs |

**Issue:** Rating thresholds overlap at the boundaries — "2-3 requirements" appears in both Simple (1-2) and Medium (2-3). A phase with exactly 2 requirements, 3 deliverables, 1 wave can be classified Simple OR Medium with equal justification. The "architectural choices" criterion under Complex is qualitative with no definition. This is not a safety-critical miscalibration, but it is a response-calibration gap: the same input produces different outputs across agent instances, undermining downstream "Medium → Optional" gate (which shows the AskUserQuestion; Simple auto-skips proposals). Peer to S05 LEGION-47-086 changelog-length calibration and S06 LEGION-47-109 "appears idle" calibration.

**Remediation sketch:** (a) Make thresholds disjoint with first-match-wins: "Simple: 1 requirement AND ≤3 deliverables AND 1 wave. Medium: 2-3 requirements OR 4-5 deliverables OR 2 waves. Complex: ≥4 requirements OR ≥6 deliverables OR ≥3 waves OR ≥1 architectural choice." (b) Define "architectural choice": "A choice is architectural iff it determines directory structure, module boundaries, state management pattern, or data schema — not merely implementation detail." (c) Add tie-breaker: "If multiple tiers could apply (boundary case), select the higher tier. Rationale: over-estimating complexity surfaces proposals; under-estimating skips them silently."

**Remediation cluster:** `response-calibration`
**Effort estimate:** small

---

## Category Coverage Notes

- **CAT-1** (Open-Set Interpretation): 1 finding (LEGION-47-127). Standalone-invocation overwrite/keep gate only 2 options, no Update/Cancel, no staleness check. Confirmed CAT-1 peer.
- **CAT-2** (Ambiguous Triggers): 0 findings. This skill does not own keyword-trigger detection (cross-references phase-decomposer's marketing/design detection via "domain keywords from registry").
- **CAT-3** (Underspecified Dispatch): 1 finding (LEGION-47-128). Research agent spawning — fan-out, selection rule, trigger threshold, primitive precondition all under-specified. Confirmed CAT-3 peer.
- **CAT-4** (Underspecified Intent): 0 findings — intent is adequately front-loaded (Section 1 preamble, each subsequent section states Input/Output/Process contract).
- **CAT-5** (Prohibitive Over-Reliance): 0 findings. The Graceful Degradation bullets (L547-551: "Never error, never block, never require") are prohibitions but are framed as contract properties, not behavior-shaping blanket rules.
- **CAT-6** (Implicit Preconditions): 1 finding (LEGION-47-129). directory-mappings.yaml with no schema, no absent-file fallback spec, override chicken-and-egg.
- **CAT-7** (Maximalist Persona Language): 0 findings. Orchestration skill, not persona.
- **CAT-8** (Unstated Acceptance Criteria): 1 finding (LEGION-47-130). Section 3 Step 3 completeness gate has 5 soft checks with no verification primitives. Peer to LEGION-47-126.
- **CAT-9** (Response Calibration Gaps): 1 finding (LEGION-47-131). Complexity rating thresholds overlap at boundaries; "architectural choice" undefined.
- **CAT-10** (Authority Ambiguity): 0 findings. The skill correctly defers to plan-critique for critique (L528), agent-registry for recommendation (cross-refs in research agent selection), codebase-mapper for CODEBASE.md reads.

**Severity summary:** 5 findings total — 0 P0, 0 P1, 5 P2, 0 P3.
**Confirmed count:** 2 of 5 (LEGION-47-127 closed-set peer class; LEGION-47-128 dispatch-specification peer to S06/S07 fan-out cluster). Others single-instance or calibration-class.
