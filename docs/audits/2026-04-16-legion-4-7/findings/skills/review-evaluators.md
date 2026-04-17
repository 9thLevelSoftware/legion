# Audit Findings — skills/review-evaluators/SKILL.md

**Audited in session:** S08
**Rubric version:** 1.0
**File layer:** skill
**File length:** 1342 lines
**Total findings:** 7 (0 P0, 0 P1, 7 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-167 — P2, Unstated Acceptance Criteria (confirmed)

**Lines 954, 1031-1035, 1223-1227**

> ## Section 7: Completeness Evaluator ("Boil the Lake")
> ...
> ## Section 8: Execution Model
> How evaluators run and how cost is managed.
> ### 6.1 Single Invocation Per Evaluator
> ...
> ## Section 10: Dispatch Integration
> How evaluators use `cli-dispatch` (from the wave-executor and review-loop dispatch patterns) for external CLI routing.
> ### 8.1 Dispatch Targets

**Issue:** Section numbering is broken across the file. "Section 8: Execution Model" (L1031) uses subsection numbers `6.1`, `6.2`, `6.3`, `6.4`, `6.5` (L1035, 1053, 1070, 1082, 1095). "Section 10: Dispatch Integration" (L1223) — where is Section 9? — uses subsection numbers `8.1`, `8.2`, `8.3`, `8.4`, `8.5` (L1227, 1236, 1272, 1292, 1311). Section 5 is not listed (jumps from Section 4 at L184-ish to Section 6 at L894 — let me verify). Cross-references like "Sections 2-5" (L98, 1253) and "Section 6.4" (L1083, 1249, 1283) land on wrong sections if a 4.7 reader counts section headers literally. Same-class as LEGION-47-154 (review-loop dual Section 8) but worse — this file has both broken section-numbering AND broken subsection-numbering. Confirmed: same defect class as LEGION-47-154 at sibling file in same session. Inheriting confirmed: true.

**Remediation sketch:** (a) Audit all section/subsection numbers sequentially from L1 and renumber to a single consistent scheme. (b) Update all internal cross-references: "Section 6.4" at L1083, 1249, 1283 → actual personality-assignment section number; "Sections 2-5" → the evaluator rubric sections; "Section 7" → dedup section; "Section 8" → execution model. (c) Add a canonical Section Index at the top of the file for navigation. (d) Add a CI check: every `## Section N` header in skills/*.md must be sequential from 1, every subsection header must match its parent section number.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** medium

---

## LEGION-47-168 — P2, Dead Metadata (confirmed)

**Lines 1257-1259**

> Step 3: Dispatch to target CLI
>   Use wave-executor dispatch pattern for the active adapter
>   model_tier: "execution" (this is a substantive review, not a planning call)

**Issue:** LEGION-47-110 documented `model_tier` as dead metadata — the Cost Profile Convention consumers read `adapter.model_execution` directly and no downstream consumer parses a `model_tier` field. review-evaluators is the SETTER location that LEGION-47-110 flagged. 4.7 reader sees "model_tier: execution" in the dispatch spec and (a) passes it as a parameter to wave-executor that ignores it, (b) writes it into the dispatch artifact where no consumer reads it, (c) treats it as load-bearing and blocks when missing. Confirmed: this is the canonical setter that LEGION-47-110 called out; S08 owns the remediation. Inheriting confirmed: true.

**Remediation sketch:** (a) Delete `model_tier: "execution"` from L1259. Replace with "Model: use adapter.model_execution — see Cost Profile Convention in workflow-common.md." (b) Grep-clean: remove `model_tier` references in skills/agent-registry/SKILL.md L147 and skills/phase-decomposer/SKILL.md L459 (per LEGION-47-110 scope). (c) If a cost-tier signal is genuinely needed at dispatch time, propose an explicit parameter in the dispatch protocol (e.g., `purpose: "review"` vs `purpose: "planning"`) and make it consumed by a real routing rule — otherwise remove entirely. (d) Cross-reference LEGION-47-110 in the remediation thread.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** small

---

## LEGION-47-169 — P2, Ambiguous Triggers (suspected)

**Lines 48-54**

> Step 2: Augment from files_modified signals
>   For each file in files_modified:
>     If file matches *.ts | *.js | *.py | *.go | *.rs → add Code Quality Evaluator (if absent)
>     If file matches *.css | *.scss | *.vue | *.jsx | *.tsx → add UI/UX Evaluator (if absent)
>     If file matches *api* | *route* | *controller* | *endpoint* → add Integration Evaluator (if absent)
>     If file matches *service* | *domain* | *use-case* | *business* → add Business Logic Evaluator (if absent)
>     If file matches *auth* | *security* | *permission* | *token* | *session* | *middleware* → add Security Evaluator (if absent)

**Issue:** File-matching is ambiguous on three axes: (a) `*.jsx | *.tsx` trigger ONLY UI/UX but not Code Quality — 4.7 literal reader skips Code Quality for React/TS components, losing type-safety pass. Actually L50 Code Quality list excludes .jsx/.tsx which is clearly wrong. (b) `*api*` as glob is overly broad — a file named `rapi-tools.ts` triggers Integration; a file under `src/apis/` (plural) does too. No anchoring (`**/api/**` vs `*api*`). (c) `*service*`, `*domain*`, `*business*` globs pick up filename substrings that have nothing to do with business logic (`services-worker.ts`, `domain-parser.ts` for DNS work). (d) Globs overlap silently — `src/api/auth-service.ts` matches Integration, Business, Security all — 4.7 runs 3 evaluators for one file; cost mismatch documented at L1072-1078 assumes 1-2 evaluators typical. Peer to the CAT-2 keyword-registry cluster (LEGION-47-156 in this session, LEGION-47-084 in S02c).

**Remediation sketch:** (a) Add .jsx, .tsx to Code Quality list. (b) Replace substring globs with path-anchored patterns: `**/api/**` not `*api*`; `**/services/**` not `*service*`. (c) Define overlap resolution: "When a file triggers multiple evaluators, keep all; cap at 3 evaluators per phase and log the cost warning." (d) Move mappings to a YAML config (e.g., `.planning/config/evaluator-triggers.yaml`) so changes don't require editing the skill. (e) Cover additional file types: .sql → Integration; .yaml/.json → depends on path; .md in specific dirs → Completeness only.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** medium

---

## LEGION-47-170 — P2, Implicit Preconditions (suspected)

**Lines 1229-1249**

> ### 8.1 Dispatch Targets
> | Evaluator | Dispatch Target | Capability Required | Fallback |
> |-----------|-----------------|--------------------|---------|
> | Code Quality | Codex | `code_review` | Internal (engineering-senior-developer) |
> | UI/UX | Gemini | `ui_design` | Internal (design-ux-architect) |
> | Integration | Internal | N/A | N/A (always internal) |
> | Business Logic | Internal | N/A | N/A (always internal) |
> 
> ### 8.2 Dispatch Protocol
> For evaluators with an external dispatch target:
> ```
> Step 1: Check adapter availability
>   Load adapter for target CLI (e.g., codex-cli.md, gemini-cli.md)
>   Check adapter.capabilities list for required capability
> 
>   If capability present AND CLI configured:
>     Proceed with external dispatch (Step 2)
>   Else:
>     Log: "Dispatch target {CLI} not available for {capability} — running internally"
>     Use fallback personality (Section 6.4) and run internally

**Issue:** Preconditions "adapter.capabilities list for required capability" and "CLI configured" are unverified in specification: (a) which file declares `adapter.capabilities`? (adapters/codex-cli.md / adapters/gemini-cli.md are not loaded earlier), (b) what does "CLI configured" mean — present in `settings.json`? Installed on PATH? Authenticated? No definition. (c) "Use fallback personality (Section 6.4)" — but per LEGION-47-167, Section 6.4 is a broken cross-reference; actual personality table is at L1086-1091 under "Section 8: Execution Model / 6.4". 4.7 reader tracking "Section 6.4" hits no such section. (d) Security Evaluator at L85 "Internal (engineering-security-engineer)" is listed in 1.4 Summary Table but absent from the 8.1 Dispatch Targets table — inconsistent. (e) Completeness Evaluator also missing from 8.1 table. Peer of LEGION-47-125, 128 adapter-precondition cluster.

**Remediation sketch:** (a) Add precondition verification: "Before Step 1, verify adapters/ directory exists and target adapter file is present. Parse capabilities from frontmatter. If file missing, log and use fallback." (b) Define "CLI configured": "Configured = settings.json adapter section has an entry for target CLI with non-null binary_path and authentication_configured=true; else treat as unavailable." (c) Fix Section 6.4 reference per LEGION-47-167 renumbering. (d) Add Security and Completeness rows to the 8.1 Dispatch Targets table for consistency with 1.4. (e) Cross-reference cli-dispatch skill for dispatch-protocol contract.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-171 — P2, Authority Ambiguity (suspected)

**Lines 87-88, 894-950**

> | Security | security, api, full-stack | Internal (engineering-security-engineer) | 10 (OWASP) |
> | Completeness | all types | Internal | 6 |
> ...
> ## Section 6: Security Evaluator
> Evaluates security posture using OWASP Top 10 checklist and STRIDE threat modeling. Uses `engineering-security-engineer` agent. Full methodology defined in `skills/security-review/SKILL.md`.
> ### Activation
> Activates when:
> - Phase type is `security` or `api`
> - Files modified include auth/security/permission/token/session/middleware patterns
> - `--just-security` intent flag is set

**Issue:** Security Evaluator spawns `engineering-security-engineer` but (a) does not inject authority-enforcer constraints (Section 3 injection) — per authority-enforcer L174-182, security-domain ownership means the agent should receive explicit "YOU OWN security domain" instructions; (b) does not cross-reference authority-matrix.yaml (the canonical source per authority-enforcer L19-30); (c) "Full methodology defined in skills/security-review/SKILL.md" defers to a non-audited skill — if that skill has CAT-10 defects, they propagate silently; (d) the Completeness Evaluator is marked "Internal" with no personality — per L1091 it uses product-feedback-synthesizer which is not a security specialty. Authority scope undefined. Peer to the authority-enforcer canonical-owner session findings.

**Remediation sketch:** (a) State explicitly: "Before dispatching Security Evaluator, call authority-enforcer Section 3 (Prompt Injection) with `agent_id=engineering-security-engineer` and active_agents=[] (solo dispatch). The injected prompt includes YOUR AUTHORITY over security/owasp/stride domains." (b) Cross-reference authority-matrix.yaml by path: ".planning/config/authority-matrix.yaml". (c) Audit skills/security-review/SKILL.md as a dependency — this skill should block on that skill's conformance. (d) Define Completeness Evaluator's authority posture: it is a generalist, no domain ownership, findings deferred to any domain owner on the panel.

**Remediation cluster:** `authority-language`
**Effort estimate:** small

---

## LEGION-47-172 — P2, Maximalist Persona Language (suspected)

**Lines 954-958**

> ## Section 7: Completeness Evaluator ("Boil the Lake")
> Evaluates whether implementation covers error handling, edge cases, and state management comprehensively. Runs for ALL phase types. Inspired by the principle that when AI makes implementation cheap, completeness should be the default — not a stretch goal.

**Issue:** "Boil the Lake" framing + "completeness should be the default — not a stretch goal" is maximalist rhetoric embedded in a skill spec. 4.7 literal reader will interpret "completeness should be the default" as license to flag every gap, every edge case, every absent state — saturating the must-fix list. Pass 1 "Error Handling Coverage" at L960-965 asks "Are error paths specified and tested for each code path?" — under maximalist interpretation, any untested error path is a BLOCKER. Pass 2 "Edge Case Identification" similarly expansive. The skill's own Pass-rating at L965 partially counters ("PASS (all major paths covered), NEEDS WORK (gaps in non-happy paths), FAIL (error handling missing)") but "gaps in non-happy paths" is itself maximalist. Same class as LEGION-47-152.

**Remediation sketch:** (a) Replace "completeness should be the default — not a stretch goal" with a bounded criterion: "Completeness Evaluator checks for error/edge-case/state COVERAGE against a threshold. Default threshold: documented error path OR documented rationale for its absence for each public-interface code path." (b) Rename section — "Boil the Lake" is a slogan, not a rubric name. (c) For each pass, state the PASS threshold concretely: "PASS = N% of code paths have explicit error handling, where N is settings.review.completeness_threshold.error_handling (default 80%)." (d) Cross-reference LEGION-47-152 on maximalist language pattern.

**Remediation cluster:** `persona-calibration`
**Effort estimate:** medium

---

## LEGION-47-173 — P2, Unstated Acceptance Criteria (suspected)

**Lines 1003-1014, 988-994**

> ### Completeness Score
> ```
> completeness_score = (passes_passed / 6) × 100
>   (N/A passes count as PASS for scoring)
> 
> Score interpretation:
>   90-100: Excellent completeness — ready to ship
>   70-89:  Good completeness — minor gaps to address
>   50-69:  Moderate completeness — significant gaps
>   0-49:   Poor completeness — substantial work needed
> ```
> ...
> **Pass 5: Test Coverage vs. Business Logic**
> - Does test coverage meet the `settings.review.coverage_thresholds.business_logic` threshold (default 90%)?
> ...
>  - Rating: PASS (meets thresholds), NEEDS WORK (below threshold but close), FAIL (significantly below)

**Issue:** Score interpretation has no consequence — "ready to ship" at 90+ is aspirational; "significant work needed" at 50-69 is prose, not an action. 4.7 reader computes a score and does not know (a) what verdict it maps to (PASS/NEEDS WORK/FAIL), (b) whether a 60 score blocks merge, (c) whether "N/A passes count as PASS" means a frontend-less backend phase (Pass 3 N/A, Pass 4 N/A) with PASS for Passes 1-2-5-6 scores 100 even with major gaps. "Below threshold but close" at L994 is fuzzy — how close is close? Same acceptance-criteria gap as LEGION-47-054, 151, 161. Also: the threshold path "settings.review.coverage_thresholds.business_logic" is not documented in settings schema per S02d audit findings.

**Remediation sketch:** (a) Map score ranges to explicit verdicts: "90-100 → PASS; 70-89 → NEEDS WORK; 0-69 → FAIL". Remove narrative "ready to ship" phrasing. (b) Define N/A behavior precisely: "N/A passes are excluded from denominator AND numerator; score = passes_passed / passes_applicable × 100." This prevents the backend-phase inflation. (c) Quantify "close" at L994: "NEEDS WORK = within 10% of threshold; FAIL = more than 10% below." (d) Validate settings.review.coverage_thresholds schema exists; if not, flag as dead reference (same-class as LEGION-47-168 dead metadata).

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---
