# Audit Findings — skills/review-panel/SKILL.md

**Audited in session:** S08
**Rubric version:** 1.0
**File layer:** skill
**File length:** 625 lines
**Total findings:** 8 (0 P0, 0 P1, 8 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-159 — P2, Underspecified Dispatch (confirmed)

**Lines 11, 67-87, 198-204, 293-298, 470-481, 597**

> Composes context-aware multi-perspective review teams from the 52-agent pool.
> ...
> Testing division (all 7):
>   - testing-qa-verification-specialist, testing-evidence-collector, testing-api-tester
>   - testing-workflow-optimizer, testing-performance-benchmarker
>   - testing-test-results-analyzer, testing-tool-evaluator
> ...
> Engineering division (review-capable):
>   - engineering-senior-developer, engineering-backend-architect
>   - engineering-frontend-developer, engineering-devops-automator
> ...
> **testing-evidence-collector** — Verification Completeness
> ...
> **engineering-devops-automator** — Operational Readiness
> ...
> Panel: [security-engineer, code-reviewer, ux-architect]
> ...
> | code-reviewer | src/auth.ts:45 | "Auth logic" | security-engineer is domain owner |

**Issue:** Five separate agent-ID errors in a canonical registry:
(1) L11 claims "52-agent pool" — actual is 48 (per CLAUDE.md).
(2) L67 claims Testing division has 7 — actual is 6 (per CLAUDE.md breakdown: api-tester, performance-benchmarker, qa-verification-specialist, test-results-analyzer, tool-evaluator, workflow-optimizer).
(3) `testing-evidence-collector` (L68, 198) does not exist — full rubric defined for a non-existent agent.
(4) `engineering-devops-automator` (L77, 293) does not exist — actual is `engineering-infrastructure-devops`.
(5) Example at L470-481, 597 uses short IDs `security-engineer`, `code-reviewer`, `ux-architect` — actual are `engineering-security-engineer`, `design-ux-architect`, and `code-reviewer` does not exist at all. This is CAT-3 at the canonical panel-composition spec — every `/legion:review --panel` invocation computes domain ownership and rubric dispatch against these IDs. 4.7 reader following Section 2 (Domain Rubric Registry) will Read non-existent rubrics or assign rubrics keyed to dead IDs; Section 3 authority filtering will compute domain ownership against dead IDs and silently mis-filter. P1-worthy — keeping P2 because review-panel has fallback paths and review-loop shares this bug. Peer to LEGION-47-149 (review-loop), LEGION-47-052 (spec-pipeline), LEGION-47-119 (authority-matrix). Inheriting `confirmed: true` per rules.

**Remediation sketch:** (a) Update L11 count to 48 and ensure it's computed from agent directory file count, not hardcoded. (b) Remove `testing-evidence-collector` throughout (L68, 198-204 rubric block) — replace with `testing-test-results-analyzer` (closer match for "Verification Completeness" semantics) or delete that rubric row. (c) Replace `engineering-devops-automator` (L77, 293-298) with `engineering-infrastructure-devops`. (d) Replace example IDs: `security-engineer` → `engineering-security-engineer`; `ux-architect` → `design-ux-architect`; delete `code-reviewer` example or replace with `engineering-senior-developer`. (e) Update L67 to "Testing division (all 6)". (f) Add an adapter-conformance-style check: every agent-ID in review-panel.md must resolve to `agents/<id>.md`.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** small

---

## LEGION-47-160 — P2, Ambiguous Triggers (confirmed)

**Lines 21-43, 437-442, 486-516**

> ### 1.2 Intent-Based Panel Filtering
> When review command specifies intent (e.g., --just-security):
> 1. **Load Intent Domains**
>    - From intent-teams.yaml security-only template
>    - Domains: security, owasp, stride, authentication, authorization
> ...
> 3. Detect domain for each finding:
>    - From finding.criterion tag (e.g., "security", "performance")
>    - From finding description keywords:
>      - Security keywords: "auth", "encrypt", "sanitize", "injection", "xss", "csrf"
>      - Performance keywords: "slow", "cache", "optimize", "memory", "cpu"
>      - API keywords: "endpoint", "route", "request", "response", "status code"
>      - Accessibility keywords: "aria", "screen reader", "contrast", "keyboard"
>    - Default: "general" (no domain owner)
> ...
> ## Step 2.5: INTENT FILTERING (conditional)
> If REVIEW_MODE === "security-only":
> 1. **Filter Findings by Domain**
>    - For each finding from all agents:
>      - Check finding.category or finding.domain
>      - Include only if matches security domains:
>        - security, owasp, stride, authentication, authorization
>        - vulnerability, injection, xss, csrf, etc.

**Issue:** Three separate keyword registries drift out of sync:
(1) L27 "security, owasp, stride, authentication, authorization" (intent-teams.yaml sourced);
(2) L439 "auth, encrypt, sanitize, injection, xss, csrf" (hardcoded in panel's detect_domain);
(3) L494-495 "security, owasp, stride, authentication, authorization / vulnerability, injection, xss, csrf, etc." (hardcoded in Step 2.5 intent filtering).
These three lists MUST agree but the file has three different sources with different members. Worse, intent-teams.yaml itself has the S02c-confirmed schema drift defect (LEGION-47-084, LEGION-47-140) — the "source of truth" is already broken. Also "etc." at L495 is CAT-4 response-calibration gap: open-ended closed set. 4.7 literal reader routing a finding about "XXE" (XML External Entities — OWASP Top 10 #4) finds no keyword match across any of the three lists and mis-classifies as "general". Same trigger-drift class as marketing/design keyword registries (S02c); inheriting confirmed: true as peer of LEGION-47-084, LEGION-47-140.

**Remediation sketch:** (a) Single source of truth — move ALL domain-keyword mappings to intent-teams.yaml under `domain_keywords:` section (fix schema drift per LEGION-47-084 remediation first). (b) Replace L437-442 and L493-495 with "Load domain_keywords from intent-teams.yaml per schema version N.M. If schema missing/invalid, emit <escalation severity=warning type=quality>." (c) Remove "etc." at L495 — the list must be exhaustive or generated. (d) Add domains for full OWASP coverage: XXE, deserialization, supply-chain, logging, cryptography. (e) Cross-reference LEGION-47-084, LEGION-47-140 remediation: trust restoration blocked on intent-teams.yaml schema fix.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** medium

---

## LEGION-47-161 — P2, Unstated Acceptance Criteria (suspected)

**Lines 547-551**

> Step 6: Compute aggregate verdict
>   - PASS: No BLOCKERs, no WARNINGs, all reviewers gave PASS
>   - NEEDS WORK: Has BLOCKERs or WARNINGs, at least one reviewer gave NEEDS WORK
>   - FAIL: Any reviewer gave FAIL, or 3+ BLOCKERs across reviewers

**Issue:** State-partition gap same class as LEGION-47-054 and LEGION-47-151. Edge cases:
(1) Has BLOCKERs but all reviewers gave PASS (reviewer scored BLOCKER finding but didn't match verdict to it): no rule matches — PASS requires zero BLOCKERs, NEEDS WORK requires "at least one reviewer gave NEEDS WORK" (fails), FAIL requires a reviewer gave FAIL (fails) OR 3+ BLOCKERs (fails if 1-2).
(2) Zero BLOCKERs, zero WARNINGs, but one reviewer gave NEEDS WORK (for SUGGESTION-only): PASS requires all-PASS-verdict (fails), NEEDS WORK requires BLOCKER-or-WARNING (fails).
(3) Exactly 3 BLOCKERs from ONE reviewer: FAIL rule is "3+ across reviewers" — unclear if within-reviewer-3 triggers FAIL or just NEEDS WORK. 4.7 reader hits an unmatched state and either (a) defaults to PASS unsafely, (b) crashes verdict computation, (c) picks arbitrary rule. Peer of LEGION-47-054, LEGION-47-151.

**Remediation sketch:** Rewrite as explicit partition: "Compute must-fix-count = BLOCKERs + WARNINGs. If must-fix-count == 0 → PASS. Elif any reviewer returned FAIL OR total BLOCKERs >= 3 (across ANY reviewers) → FAIL. Else → NEEDS WORK." Remove dependency on individual reviewer verdict strings — they become informational, not gate-determining. Align with review-loop Section 7/8 predicates per LEGION-47-151 remediation.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-162 — P2, Open-Set Interpretation (suspected)

**Lines 123-131**

> Options:
>   - "Use this panel" (Recommended)
>   - "Add a reviewer" — add one more agent from the ranked list (up to max 4)
>   - "Replace a reviewer" — swap one reviewer for an alternative
>   - "Other" — enter custom agent IDs
> 
>   If user selects "Add a reviewer": show next-ranked eligible agent, confirm
>   If user selects "Replace a reviewer": show which reviewer to replace and alternatives
>   If user selects "Other": accept custom agent IDs, validate each exists, assign default rubric

**Issue:** The "Other — enter custom agent IDs" branch opens a free-text entry without structuring via AskUserQuestion's contract. "Validate each exists" is a good predicate but "accept custom agent IDs" leaves the collection mechanism unspecified — same AskUserQuestion free-text primitive gap blocking S03/S04/S06/S07 findings. Also "Add a reviewer" and "Replace a reviewer" are parameterized actions (which reviewer? which alternative?) without specified follow-up question structure. 4.7 reader will either (a) collect free-text in raw prompt violating CLAUDE.md mandate, (b) call AskUserQuestion with a malformed options array (LEGION-47-016 class), (c) skip the interaction and proceed with defaults. Peer of LEGION-47-150, LEGION-47-040.

**Remediation sketch:** (a) Replace "Other — enter custom agent IDs" with: "If user selects Other: dispatch to adapter.prompt_free_text with validator 'ID must match agents/<id>.md file'. Re-prompt on validation failure up to 3 times, then cancel with <escalation>." (b) For "Add a reviewer" and "Replace a reviewer": emit follow-up AskUserQuestion with the top-5 next-ranked eligible agents as closed options, plus "Pick different agent" which dispatches adapter.prompt_free_text. (c) Resolve via same adapter.prompt_free_text primitive blocking LEGION-47-016, 040, 093, 117, 120, 122, 127, 132, 133, 138, 150.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-163 — P2, Implicit Preconditions (suspected)

**Lines 56-61, 98-101**

> Step 2: Score agents using agent-registry Section 3
>   Pass the composite task description to the agent-registry recommendation algorithm:
>   - Step 1: Parse extracted keywords as task terms
>   - Step 2: Match agents — exact (3 pts), partial (1 pt), division (2 pts)
>   - Step 3: Rank by score, break ties by specificity
>   - Step 6: Apply memory boost if OUTCOMES.md exists
> ...
>   Mandatory: at least one Testing division agent on every panel.
>   This inherits from agent-registry Step 5 (Mandatory Roles) and from
>   the existing review-loop principle that testing-qa-verification-specialist is
>   always included.

**Issue:** Section 1 composition depends on four preconditions that are never verified: (1) agent-registry.md Section 3 exists and has Step 1/2/3/5/6, (2) OUTCOMES.md schema is parseable if present, (3) every agent in the ranked list has `division` metadata, (4) "specialty includes evaluation, review, quality, testing, or validation capabilities" (L64-65) requires agent frontmatter to have a `specialty` or `capabilities` field — no verification. 4.7 reader whose agent-registry.md has lost Step 6 (memory boost) crashes at L61 with no fallback. CAT-6 precondition-verification cluster, similar to LEGION-47-117 (review-panel's consumers).

**Remediation sketch:** (a) Add Section 1.0 "Preconditions Verification": read agent-registry.md, verify Steps 1-6 exist in Section 3; if Step 6 missing, skip memory boost with a WARN log. (b) Verify OUTCOMES.md exists and conforms to memory-manager schema before applying Step 6. (c) Define "review-capable" declaratively: every agent with `review_strengths` field in frontmatter is eligible; delete the implicit "specialty includes evaluation|review|quality|testing|validation" parse. (d) Cross-reference agent-registry Step 5 explicitly (hardcoded mandatory Testing inclusion) with a named precondition.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-164 — P2, Intent Front-Loading (suspected)

**Lines 136-148**

> ## Review Conduct Rules
> These rules are injected into every review agent's prompt to ensure rigorous, actionable feedback.
> ### Mandatory Conduct
> 1. **Verify before implementing** — Confirm feedback is technically correct for THIS codebase before acting on it. Grep for the function, read the file, check the dependency.
> 2. **Pushback is expected** — Reviewers MUST challenge when: suggestion would break existing functionality, reviewer lacks context for the change, recommendation violates YAGNI, feedback is technically incorrect for the runtime/framework in use, or suggestion conflicts with prior architectural decisions.
> 3. **No performative agreement** — Do NOT use phrases like "great point!", "you're absolutely right!", "excellent suggestion!". State agreement factually: "Confirmed: the null check is missing."
> 4. **Specificity required** — Every finding MUST include: file path and line number, what is wrong, why it matters, and how to fix it. Findings without all four elements are rejected.
> 5. **Severity accuracy** — Do NOT mark nitpicks (formatting, naming preferences) as BLOCKER. BLOCKER is reserved for: crashes, data loss, security vulnerabilities, broken builds. WARNING is for logic errors, missing edge cases, performance issues. INFO is for style, conventions, suggestions.
> 6. **Clear verdict mandatory** — Every review MUST end with an explicit verdict: "Ready to merge? Yes / No / With fixes". No ambiguous conclusions.

**Issue:** Section title says these are "injected into every review agent's prompt" but (a) no injection point is defined in Section 1 or Section 2 — review-loop Section 3 (the prompt-construction canonical owner) does not reference these conduct rules, (b) Section 2 rubric injection at L159-184 is the only documented prompt-injection template and does not include these, (c) Rule 6 "Ready to merge? Yes / No / With fixes" contradicts review-loop Section 3 verdict format "PASS / NEEDS WORK / FAIL" (L262-267) — 4.7 reader receives both and cannot reconcile. CAT-4 intent front-loading defect: the rules are stated but never delivered to the agent; CAT-8 acceptance-criteria gap: conflicting verdict formats.

**Remediation sketch:** (a) State the injection mechanism explicitly: "These rules are prepended to the review prompt constructed in review-loop Section 3 Step 3, after PERSONALITY_CONTENT and before the review task description." (b) Reconcile Rule 6 verdict with review-loop Section 3: replace "Ready to merge? Yes / No / With fixes" with "PASS / NEEDS WORK / FAIL (per review-loop Section 3)". (c) Move conduct rules into review-loop's prompt template directly, or have review-loop reference this section by exact line range. (d) Remove duplication — if these rules belong in review-loop, this section duplicates.

**Remediation cluster:** `intent-front-loading`
**Effort estimate:** small

---

## LEGION-47-165 — P2, Response Calibration Gap (suspected)

**Lines 336-342**

> #### Division Default Rubrics
> For agents not listed above, use the default rubric for their division:
> | Division | Default Rubric | Criteria |
> |----------|---------------|----------|
> | Testing | General QA | Correctness, completeness, consistency |
> | Design | General Design Review | Visual quality, usability, accessibility |
> | Engineering | General Code Review | Correctness, patterns, maintainability |
> | Product | General Product Review | Value delivery, scope, alignment |
> | Project Management | General Delivery Review | Completeness, documentation, handoff |

**Issue:** Division default rubrics are listed but (a) no rubric prompt template for them — rubric injection at L159-184 requires `name` + `description` columns, these defaults have only comma-separated keywords, (b) missing divisions: Marketing, Support, Spatial Computing, Specialized (per CLAUDE.md 9 divisions). An agent in one of the missing divisions scoring high will fall through Step 5 rubric assignment with no default available. 4.7 reader either (a) crashes at missing key lookup, (b) skips rubric injection entirely — the agent reviews without a rubric prompt. CAT-9 bounded-response defect: the "default" promise doesn't cover the advertised surface.

**Remediation sketch:** (a) Expand the Division Default Rubrics table to cover all 9 divisions per CLAUDE.md (add Marketing, Support, Spatial Computing, Specialized). (b) For each default, provide a Name + 3-5 Criterion rows matching the format at L166-184 (not just keywords). (c) Add a fallback: "If an agent's division has no default rubric, inject Testing → General QA rubric as last resort and log a WARN." (d) Alternately: require every agent frontmatter to declare `review_rubric: <name>` linking to a canonical rubric file, eliminating the division-default table.

**Remediation cluster:** `response-calibration`
**Effort estimate:** medium

---

## LEGION-47-166 — P2, Prohibitive Over-Reliance (suspected)

**Lines 142-147**

> 3. **No performative agreement** — Do NOT use phrases like "great point!", "you're absolutely right!", "excellent suggestion!". State agreement factually: "Confirmed: the null check is missing."
> 5. **Severity accuracy** — Do NOT mark nitpicks (formatting, naming preferences) as BLOCKER. BLOCKER is reserved for: crashes, data loss, security vulnerabilities, broken builds.

**Issue:** Rule 3 mixes a prohibition ("Do NOT use phrases like...") with a positive replacement ("State agreement factually: ..."). Cleanly convertible to pure positive. Rule 5 has the structure right (prohibition + positive definition of BLOCKER). Across Section rules 3 and 5, the Do-NOT scaffolding could be inverted cleanly to rule-as-assertion form without loss of meaning — reducing cognitive load for the 4.7 reader who otherwise has to maintain a mental blocklist while reviewing. Lower severity than LEGION-47-157 because the positive replacements are already co-located, but worth clustering into the prohibitive-to-positive remediation pass.

**Remediation sketch:** Rule 3: "Express agreement factually — cite evidence: 'Confirmed: the null check is missing.' Do not use phrasal affirmations (great point / absolutely right / excellent)." Rule 5: "BLOCKER is reserved for correctness-breaking findings: crashes, data loss, security vulnerabilities, broken builds. Style and naming concerns are INFO, not BLOCKER." Pattern: positive definition first, prohibition as reinforcing footnote.

**Remediation cluster:** `prohibitive-to-positive`
**Effort estimate:** small

---
