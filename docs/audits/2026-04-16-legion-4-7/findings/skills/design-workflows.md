# Audit Findings — skills/design-workflows/SKILL.md

**Audited in session:** S09
**Rubric version:** 1.0
**File layer:** skill
**File length:** 1123 lines
**Total findings:** 5 (5 P2)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-181 — P2, CAT-2 Ambiguous Triggers (confirmed)

**Lines 38-43**

> Design-specific decomposition activates when ANY of these signals are present:
> 1. **Requirement IDs**: Phase requirements include DSN-* IDs
> 2. **Keywords in phase description**: "design system", "component library", "UX research", "usability testing", "accessibility audit", "brand guidelines", "design tokens", "wireframes", "prototypes", "user testing", "design review", "user persona", "user journey", "information architecture", "visual design"
> 3. **Agent signal**: agent-registry recommends majority design-division agents for the phase

**Issue:** This is the canonical enumeration promised in CLAUDE.md L110-112 and README L854-855 ("design keywords") — but it does NOT appear in `.planning/config/intent-teams.yaml`, the file cited by S02c/S05/S07 as the authoritative trigger registry (peers LEGION-47-084, 140, 160, 174). Seven consuming sites now exist (CLAUDE.md, AGENTS.md, README, intent-teams.yaml, authority-enforcer detect_domain, review-panel detect_domain, this file), each with a different subset. 4.7 reading this prose list vs. YAML-backed lists will reach different activation decisions for the same phase description. Same registry-drift defect class surfaced three times in S08; this is the fourth independent registry for design domains.

**Remediation sketch:** Move the canonical keyword list into `.planning/config/intent-teams.yaml` under `teams.design.keywords` (matching existing schema). This file references the YAML by path; other consumers (CLAUDE.md, README, authority-enforcer, review-panel, phase-decomposer) all reference the same YAML. Schema contract for design/marketing teams: `name`, `keywords[]`, `requirement_prefix`, `agents[]`. Cross-reference LEGION-47-002/004/005/084/140/160/174.

**Remediation cluster:** `keyword-registry-consolidation`
**Effort estimate:** medium

---

## LEGION-47-182 — P2, CAT-3 Underspecified Dispatch (suspected)

**Lines 613-646**

> Wave 2A: Backend Architecture Design (parallel with 2B)
> Agents: engineering-backend-architect + design-ux-architect
> ...
> Wave 2B: Frontend Design System (parallel with 2A)
> Agents: design-ui-designer + design-visual-storyteller
> ...
> Wave 3: Integration Design (only if both 2A and 2B ran)
> Wave 4 (optional -- only if phase scope includes polish/validation):
> Agents: design-whimsy-injector + review agents

**Issue:** Four-wave dispatch plan with parallel "2A and 2B" branches, but: (a) no statement that wave-executor can actually dispatch 2A/2B in parallel — Claude Code supports it, but Codex CLI `parallel_execution: false` would serialize them with no advertisement; (b) "review agents" (L637) is unspecified — how many, which, via review-loop or ad-hoc; (c) no `model_tier` specification for any wave (boardfor-directors Section 8 sets the precedent that each phase specifies tier); (d) no fan-out count — "Wave 2B: design-ui-designer + design-visual-storyteller" but 2.3 optional roles can expand Wave 2B to 6 agents. Peer of LEGION-47-101/102/112/125/128/141/155/180 dispatch-specification cluster.

**Remediation sketch:** (a) Add dispatch specification block after each wave: "Parallel-safe: yes if adapter.parallel_execution; serialize otherwise. Fan-out: exactly {N} agents spawned in a single tool call. Model tier: {model_planning|model_execution}." (b) L637 "review agents" → reference review-loop's three-lens dispatch with specific agents by ID. (c) Declare file-overlap: 2A writes `.planning/designs/{slug}-api-contracts.md`, 2B writes `.planning/designs/{slug}-system.md` — no overlap, parallel-safe. (d) Cross-reference wave-executor Section 4 contract (LEGION-47-101).

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** small

---

## LEGION-47-183 — P2, CAT-8 Unstated Acceptance Criteria (suspected)

**Lines 729-825**

> Each pass is rated 0-10. Scores below 7 trigger remediation (the plan is edited to fill gaps). Scores 8+ receive a quick acknowledgment.
> ...
> For each pass scoring < 7:
>   Edit the plan to address gaps
>   Re-score the pass
> Append review summary to CONTEXT.md
> If average score < 5: warn user that design specifications are weak
> Proceed to step 2f with enriched plan

**Issue:** The 7-pass review's completion criteria are underspecified: (a) no bound on remediation iterations — "Re-score the pass" implies loop but no max; if a pass repeatedly scores < 7, does planning stall? (b) scores 7.0-7.9 fall in a gap between "< 7" (remediate) and "8+" (acknowledge); (c) "average score < 5: warn user" — warn is non-blocking; the skill proceeds to plan finalization with < 5/10 design specs, but no "BLOCK design phase" state exists. Compare to ship-pipeline Section 1 which has explicit PASS/FAIL per check. Peer of exit-condition state-partition cluster (LEGION-47-054, 151, 161).

**Remediation sketch:** Add explicit acceptance-criteria block at end of Section 7: "7-pass review is complete when: (1) each pass has been scored, (2) passes with score < 7 have been remediated up to max 2 iterations; if a pass stays < 7 after 2 iterations, emit <escalation severity: blocker, type: quality>. (3) Passes scoring 7.0-7.9 are marked ACCEPTABLE (no remediation). (4) If average < 5, block plan finalization — require user override via AskUserQuestion." Define score-bucket boundaries unambiguously: `< 7` → remediate; `[7, 8)` → acceptable; `[8, 10]` → pass.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-184 — P2, CAT-6 Implicit Preconditions (suspected)

**Lines 817, 953-959**

> If design phase detected AND settings.review.evaluator_depth == "multi-pass":
>   Run 7-pass design review (Section 7.2)
> ...
> Runs during `/legion:review` when ALL of these conditions are met:
> 1. Design phase detected (Section 1 heuristic)
> 2. Design documents exist at `.planning/designs/`
> 3. Implementation has been completed (SUMMARY.md files exist for build plans)
> 4. `settings.review.evaluator_depth == "multi-pass"` (standard review mode uses three-lens only)

**Issue:** Preconditions `settings.review.evaluator_depth == "multi-pass"` gate both Section 7 plan-stage review and Section 9 post-implementation audit. But: (a) the `review` block in `settings.json` is not documented in this file or cross-referenced to a schema; settings-schema.json (audited S02d) may not declare it. (b) L956 "SUMMARY.md files exist for build plans" — no path given, no count check (what if 3 plans and only 2 SUMMARY.md files?). (c) L954 "Design phase detected (Section 1 heuristic)" — but Section 1 defines three OR conditions; which passes at review time (no phase description available at review)? Implicit precondition without verification path.

**Remediation sketch:** (a) Add explicit settings precondition at top of Sections 7/9: "Read settings.review.evaluator_depth from settings.json. If the key is missing: default to 'standard' and skip this section. If the value is anything other than 'multi-pass' or 'standard': emit <escalation severity: warning, type: infrastructure>." (b) L956 add exact-path verification: "For each plan file in .planning/phases/{NN}/plans/, verify corresponding SUMMARY.md exists at .planning/phases/{NN}/summaries/{plan-id}-SUMMARY.md. If any is missing: skip Section 9 and note in review output." (c) Cross-reference settings-schema.json for `review` block. Peer of LEGION-47-163 precondition-verification cluster.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-185 — P2, CAT-5 Prohibitive Over-Reliance (suspected)

**Lines 871-900**

> **Blacklisted patterns** (never use without explicit user override):
> - Purple-to-blue gradient backgrounds
> - 3-column icon-in-colored-circle feature grids
> - Centered-everything layouts with no intentional alignment
> - Uniform border-radius on all elements (use a radius scale instead)
> - Decorative gradient blobs with no information purpose
> - Generic hero sections with stock photography
> - Emoji used as design elements (use proper iconography)
> - Cookie-cutter alternating left-right section rhythm
> - Gradient buttons as the only call-to-action style
> - Colored left-border accent cards
> ...
> **Blacklisted fonts** (never use):
> Papyrus, Comic Sans, Impact, Copperplate, Brush Script

**Issue:** Two "Blacklisted ... (never use)" headers, 15 items total. 4.7 literally reading a design agent's prompt with "NEVER use purple-to-blue gradient" + "NEVER use Papyrus/Comic Sans/Impact/Copperplate/Brush Script" as absolute constraints may refuse to describe/review an existing design that uses any of these — even when the user explicitly asked for analysis of a legacy page. L871 hedge "without explicit user override" does not appear on L899. Compare to RUBRIC.md CAT-5 pattern: clusters of DO-NOT/NEVER convertible to positive framing.

**Remediation sketch:** (a) L871 replace "Blacklisted patterns (never use without explicit user override)" with "Anti-slop pattern catalog — when generating new design specs, prefer product-specific alternatives from the right column of Section 7.2 Pass 4. When reviewing existing designs, note occurrences as CAT-4 findings but do not refuse to describe them." (b) L899 replace "Blacklisted fonts (never use): Papyrus, Comic Sans, Impact, Copperplate, Brush Script" with "Fonts to avoid in new designs: Papyrus, Comic Sans, Impact, Copperplate, Brush Script. If a user explicitly requests one of these (e.g., for a specific ironic or legacy context), acknowledge the constraint and proceed." (c) Remove "never" verbatim from the two headers; retain the pattern catalog as guidance.

**Remediation cluster:** `prohibitive-to-positive`
**Effort estimate:** small

---
