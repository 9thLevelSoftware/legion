# Audit Findings — skills/security-review/SKILL.md

**Audited in session:** S09
**Rubric version:** 1.0
**File layer:** skill
**File length:** 536 lines
**Total findings:** 5 (5 P2)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-190 — P2, CAT-2 Ambiguous Triggers (confirmed)

**Lines 25-36**

> ### Automatic Activation
> - Files modified in the current phase include security-sensitive patterns:
>   - `*auth*`, `*login*`, `*session*`, `*token*`, `*jwt*`
>   - `*password*`, `*credential*`, `*secret*`, `*encrypt*`, `*crypto*`
>   - `*permission*`, `*rbac*`, `*acl*`, `*role*`
>   - `*middleware*` (often contains auth middleware)
>   - API route files with authentication decorators
>   - Configuration files with secrets or keys

**Issue:** Fourth-and-fifth-and-sixth independent security-keyword registry (peers LEGION-47-084, 140, 160, 174). Three distinct registries in review-panel alone (L27, L439, L494-495); this file adds a fourth with a different membership: `jwt` appears here but not in authority-enforcer's detect_domain; `middleware` is here but excluded from review-panel. The closed list also leaks: "API route files with authentication decorators" (L31) and "Configuration files with secrets or keys" (L32) are unstructured prose matches that 4.7 will resolve differently across agents — no grep pattern, no decorator name list, no file-glob. The S08 cross-cut observation "keyword-registry drift is now a crisis" applies: this is the canonical security activation surface and it still drifts from every other canonical-owner claimant.

**Remediation sketch:** (a) Move the glob list (`*auth*`, `*login*`, etc.) to a single authoritative source — either `.planning/config/intent-teams.yaml` under `teams.security.file_patterns[]` or a new `.planning/config/security-patterns.yaml`. authority-enforcer detect_domain, review-panel L27/439/494-495, and this file all reference the same YAML. (b) L31 "API route files with authentication decorators" — enumerate the decorator names by framework (Flask: `@login_required`, Django: `@permission_required`, FastAPI: `Depends(get_current_user)`, Express: `passport.authenticate(`). (c) L32 "Configuration files with secrets or keys" — anchor to file extensions + content-grep against Section 6.1 regex catalog. (d) Cross-reference LEGION-47-084, 140, 160, 174 for systemic remediation.

**Remediation cluster:** `keyword-registry-consolidation`
**Effort estimate:** medium

---

## LEGION-47-191 — P2, CAT-3 Underspecified Dispatch (suspected)

**Lines 451-478**

> Evaluator: Security Evaluator
> Phase Types: security, api, full-stack
> Dispatch Target: Internal (engineering-security-engineer agent)
> Pass Count: 13 (10 OWASP categories + dependency scan + secret detection + supply chain checks)
> Activation: Section 1 triggers (explicit or automatic)
> ...
> 1. Run OWASP Top 10 Checklist (Section 2)
> 2. Run STRIDE Threat Model (Section 3) on identified boundaries
> 3. Run Attack Surface Mapping (Section 4) if CODEBASE.md available
> 4. Run Dependency Vulnerability Scan (Section 5)
> 5. Run Secret Detection Scan (Section 6)
> 6. Run Supply Chain Security Checks (Section 7)

**Issue:** Six-step security analysis with "Dispatch Target: Internal (engineering-security-engineer agent)" but: (a) "Internal" dispatch is ambiguous — is this a spawn of one agent executing all six steps, six parallel agent spawns, or six serial tool calls by the orchestrator? (b) No model_tier — review-evaluators L1259 sets `model_tier: "execution"` (LEGION-47-168 canonical dead-metadata setter), this file does not set one; if the caller respects model_tier, Security Evaluator collapses to whatever adapter.model_execution is. (c) 4.7 reading "Run OWASP..." + "Run STRIDE..." as six sequential bullets will default to serial single-agent execution — but Sections 2-7 are independent analyses, prime parallel-dispatch candidates. (d) "Phase Types: security, api, full-stack" — these classifications are not defined in any config schema.

**Remediation sketch:** (a) Replace L456 "Dispatch Target: Internal (engineering-security-engineer agent)" with: "Dispatch: engineering-security-engineer spawned once; agent internally runs Sections 2, 3, 4 serially (narrative analysis) and Sections 5, 6, 7 via adapter.run_command in a single tool-call batch (independent scans, parallel-safe)." (b) Add `model_tier: model_execution` in the Section 9.1 registration block. (c) Define phase_type enum in a shared config with settings-schema.json. (d) Cross-reference wave-executor Section 4 parallel contract and LEGION-47-180 dispatch-specification cluster.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** small

---

## LEGION-47-192 — P2, CAT-10 Authority Ambiguity (suspected)

**Lines 513-520**

> 1. If security-review skill is referenced but no security-sensitive files detected: skip silently
> 2. If CODEBASE.md doesn't exist: perform security review without attack surface mapping context
> 3. If engineering-security-engineer agent personality file is missing: fall back to engineering-senior-developer
> 4. Never error, never block non-security workflows
> 5. Security findings are always advisory unless severity is CRITICAL (which blocks ship)

**Issue:** Step 3 — silent fallback from a specialized security agent to a generalist — violates authority-matrix domain ownership. engineering-security-engineer is the declared domain owner for `security` in authority-matrix.yaml (S02c) and review-panel's BLOCKER override rule depends on this (LEGION-47-179). Falling back to engineering-senior-developer without emitting an escalation means: (a) the Security Evaluator runs with a non-security-specialist agent but still produces findings tagged as "security domain"; (b) authority-enforcer Section 4 filterFindings (LEGION-47-180) will accept senior-developer's out-of-domain findings as if they were from the domain owner; (c) review-panel BLOCKER-override rule (LEGION-47-179) depends on "domain owner confirmed" — but the actual runner is not the owner. Silent agent swap at a security boundary is a CAT-10 authority-ambiguity defect.

**Remediation sketch:** (a) Replace L515 "fall back to engineering-senior-developer" with: "emit <escalation severity: blocker, type: dependency>. Display to user: 'Security review requires engineering-security-engineer; agent file missing at agents/engineering-security-engineer.md. Resolve before running security review.' Do not fall back silently." (b) If fallback is desired for degraded environments, require opt-in: `settings.security.allow_generalist_fallback` (default: false), AND tag findings with `domain_owner_substituted: true` so authority-enforcer Section 4 can apply reduced-trust filtering. (c) Cross-reference authority-enforcer LEGION-47-176/177/179 for the domain-owner trust model.

**Remediation cluster:** `authority-language`
**Effort estimate:** small

---

## LEGION-47-193 — P2, CAT-8 Unstated Acceptance Criteria (suspected)

**Lines 488-505**

> | Source | Condition | Override |
> |--------|-----------|----------|
> | Dependency Vulnerability Scan (Section 5) | Any CRITICAL CVE in dependencies | FAIL (blocker) |
> | Dependency Vulnerability Scan (Section 5) | 3+ HIGH CVEs in dependencies | FAIL (blocker) |
> | Secret Detection Scan (Section 6) | Any CRITICAL secret finding (committed key, token, or credential) | FAIL (blocker) |
> | Supply Chain Checks (Section 7) | Suspected malicious or typosquatted package | FAIL (blocker) |
>
> These overrides are non-negotiable. Even if all OWASP categories pass, a committed secret or a critical dependency vulnerability makes the build unshippable.

**Issue:** Four verdict-overrides declared "non-negotiable" — but the acceptance criteria for how this interacts with review-loop's cycle-based verdict synthesis (LEGION-47-151) and authority-enforcer's domain filter (LEGION-47-179) are unspecified. Specifically: (a) If a CRITICAL secret finding is reported in Cycle 1, review-loop runs up to max_cycles fix cycles — what verdict does this skill display during intermediate cycles? (b) review-panel's filter-by-domain (LEGION-47-179) routes BLOCKER from any agent through the override rule; a CRITICAL secret finding from, say, testing-api-tester (not the domain owner) bypasses filtering and becomes a non-negotiable blocker. (c) Section 5.3 severity mapping also emits FAIL for "3+ HIGH vulnerabilities" but the override table L495 says the same thing — redundant; which is authoritative? (d) L505 "logged in REVIEW.md with the prefix `[VERDICT-OVERRIDE]`" — but review-loop / review-panel do not parse this prefix, so downstream consumers have no programmatic way to distinguish override-driven FAIL from consensus FAIL. Exit-condition state-partition cluster.

**Remediation sketch:** (a) Add explicit state spec: "Overrides apply at REVIEW.md synthesis (review-panel Section 3), not during per-cycle review-loop iteration. Intermediate cycles treat override conditions as BLOCKER findings like any other." (b) Declare a schema for [VERDICT-OVERRIDE] lines: `[VERDICT-OVERRIDE] source={Section X} condition={condition-id} severity=blocker reason={...}` so review-panel / ship-pipeline can parse. (c) Resolve redundancy between Section 5.3 L243-245 and Section 9.4 L494-495 — pick one authoritative source. (d) Cross-reference LEGION-47-151 (review-loop exit-conditions) and LEGION-47-161 (review-panel aggregate-verdict partition).

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** medium

---

## LEGION-47-194 — P2, CAT-6 Implicit Preconditions (suspected)

**Lines 29-32, 258-313**

> - `*middleware*` (often contains auth middleware)
> - API route files with authentication decorators
> - Configuration files with secrets or keys
> ...
> Step 2: For each file in scope
>   - Skip binary files
>   - Skip files matching: *.min.js, *.map, node_modules/*, vendor/*, .git/*
>   - Skip files named: .env.example, .env.template, .env.sample
>   - Apply each pattern regex
>   - For each match: record file path, line number, pattern name,
>     matched text (REDACTED — show only first 8 and last 4 characters)

**Issue:** The `*middleware*` glob (L29) is a broad substring matcher — it matches Node.js `node_modules/express-middleware/`, user test fixtures named `not-auth-middleware-test.js`, and design system files like `card-middle-divider.scss`. No path-anchoring ("src/**/middleware/*.{ts,js}"). L30 "API route files with authentication decorators" has no detection protocol — there's no Glob or Grep specification. L31 "Configuration files with secrets or keys" is circular — the skill searches for configuration files containing secrets, but secret-detection (Section 6) is the thing that tells us which configuration files have secrets. Implicit precondition that the caller knows what "configuration file" means without a canonical file-type list. Combined with Section 6.2 Skip list (L297-299) that excludes `.env.example` but not `config.example.*` or `settings.example.*`.

**Remediation sketch:** (a) Replace L27-32 globs with path-anchored alternatives: `**/middleware/*.{ts,js,py,rb}`, `**/auth/**/*.{ts,js,py,rb}`, `config/**/*.{yaml,yml,json,toml,ini,env}`, etc. (b) L30 "API route files with authentication decorators" → enumerate per-framework: Flask `@login_required` / `@permission_required`, FastAPI `Depends(...)`, Django `@method_decorator`, Express `router.use(authMiddleware)` — supply grep expressions. (c) L31 "Configuration files with secrets or keys" → declare "configuration file" as {file matches config-glob AND file contains any pattern from Section 6.1}; use Section 6.1 as the single source. (d) Expand Section 6.2 skip list (L299) to include `*.example.*`, `*.sample.*`, `*.template.*` across all extensions. Cross-reference LEGION-47-169 file-glob precondition cluster.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---
