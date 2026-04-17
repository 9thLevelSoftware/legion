# Audit Findings — skills/authority-enforcer/SKILL.md

**Audited in session:** S08
**Rubric version:** 1.0
**File layer:** skill
**File length:** 753 lines
**Total findings:** 7 (0 P0, 1 P1, 6 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-174 — P1, Ambiguous Triggers (confirmed)

**Lines 381-408**

> def detect_domain(criterion, message):
>     """
>     Detect domain from criterion text and message content.
>     Uses keyword matching against authority matrix domains.
>     """
>     text = f"{criterion} {message}".lower()
>     
>     # Direct keyword matching
>     domain_keywords = {
>         "security": ["security", "vulnerability", "pentest", "owasp"],
>         "performance": ["performance", "optimization", "latency", "throughput"],
>         "accessibility": ["accessibility", "a11y", "wcag", "screen reader"],
>         "api-design": ["api", "endpoint", "rest", "graphql"],
>         # ... etc
>     }
>     
>     scores = {}
>     for domain, keywords in domain_keywords.items():
>         score = sum(1 for kw in keywords if kw in text)
>         if score > 0:
>             scores[domain] = score
>     
>     # Return highest scoring domain, or "general" if none match
>     if scores:
>         return max(scores, key=scores.get)
>     return "general"

**Issue:** authority-enforcer is the CANONICAL OWNER of domain-detection per S08 scope, and this is the canonical `detect_domain()` function. Multiple fatal CAT-2 defects: (1) `# ... etc` (L395) — THE canonical keyword registry is truncated with etc; 4.7 reader sees only 4 domains (security, performance, accessibility, api-design) but authority-matrix.yaml has many more (design, ui, database, frontend, backend, infrastructure, testing, marketing, etc.). Every finding outside these 4 domains falls to "general" silently. (2) The keyword lists themselves are minimal and brittle: security domain misses `auth`, `encrypt`, `sanitize`, `injection`, `xss`, `csrf`, `token`, `session` — all listed by consumer review-panel L439 (LEGION-47-160). Review-panel's list and authority-enforcer's list MUST match because review-panel's detect_domain (L437-442) is supposed to inherit from this canonical one. (3) No link between this function and `authority-matrix.yaml` — the docstring says "against authority matrix domains" but code does not load the matrix; domains are hardcoded. P1 elevation: every authority-filtering decision (Section 4) flows through this function; silent "general" classification means out-of-domain filtering fails open — 4.7 reader keeps all findings even when a domain owner is present. Confirmed as canonical owner with inherited defect class (LEGION-47-084 intent-teams schema drift, LEGION-47-160 review-panel drift). Inheriting `confirmed: true`.

**Remediation sketch:** (a) Remove hardcoded `domain_keywords` from detect_domain entirely. Load from `.planning/config/authority-matrix.yaml` under a new `domain_keywords` map (coordinate with authority-matrix.yaml schema per S02c). (b) Schema entry: `domains: <name>: keywords: [...]` — keyword list is authoritative for all keyword-based domain detection. (c) Update detect_domain to iterate `matrix.domains` and match keywords. (d) Update review-panel L437-442 and L493-495 to delegate to authority-enforcer detect_domain (not reimplement). (e) Delete `# ... etc` — every domain must be explicit in the config. (f) Cross-reference LEGION-47-084, LEGION-47-140, LEGION-47-160 remediation; all three are resolved by the single schema fix.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** medium

---

## LEGION-47-175 — P2, Implicit Preconditions (confirmed)

**Lines 19-30, 524**

> ### Step 1: Load Authority Matrix
> ```yaml
> Input: None (uses hardcoded path)
> Output: AuthorityMatrix object
> 
> Procedure:
> 1. Read `.planning/config/authority-matrix.yaml`
> 2. Parse YAML into structured object
> 3. Store in memory: agent_id → AgentConfig mapping
> 4. Build reverse index: domain → primary_agent_id
> ```
> ...
> | Missing authority-matrix.yaml | File deleted or moved | Regenerate from template |

**Issue:** Step 1 at L25-30 describes the happy path only. No error handling for: (a) file missing (ENOENT) — Section 7 L524 says "Regenerate from template" but does not specify template path or regeneration procedure, (b) YAML parse error, (c) schema mismatch (validate_matrix at Step 2 runs AFTER load; if load fails no validate runs), (d) empty file. 4.7 literal reader following Step 1 with a missing file crashes at step 1.1 `Read .planning/config/authority-matrix.yaml`. Same-class as LEGION-47-140 (intent-router loadIntentTeams missing error handling). Since authority-matrix.yaml has its own S02c schema-drift defect (LEGION-47-084) and validate_matrix at L47-67 checks schema, the load-first-then-validate ordering masks the failure mode. CONFIRMED: peer to LEGION-47-140 (intent-router load), same schema-drift class.

**Remediation sketch:** (a) Wrap Read in try/catch: on ENOENT, emit `<escalation severity=blocker type=infrastructure decision="Cannot enforce authority — authority-matrix.yaml missing" context="...">` and return an empty matrix with `valid: false`. On YAML parse error, same shape with logged location. (b) Run validate_matrix (Step 2) INSIDE Step 1 as a precondition — load-then-validate atomic. (c) Specify template path: `.planning/config/authority-matrix.template.yaml` with regeneration procedure (copy + manual fill). (d) Cross-reference LEGION-47-084, LEGION-47-140 remediation. (e) Empty-file case: return empty matrix with `valid: false`, log warning.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-176 — P2, Authority Ambiguity (suspected)

**Lines 294-295, 651-659, 737-744**

> **Note:** Constraint injection is the first line of defense. Post-execution boundary verification (Section 11) is the second line. Both are required for full authority enforcement.
> ...
> | Control Mode | Detection | Action on Violation |
> |-------------|-----------|-------------------|
> | `autonomous` | Skip verification entirely | None |
> | `guarded` | Detect out-of-scope file modifications | Warn in SUMMARY.md, add escalation block, continue |
> | `advisory` | Not applicable (read-only agents) | None |
> | `surgical` | Detect out-of-scope file modifications | Revert out-of-scope changes, log violation, continue with in-scope work only |
> ...
> Wave Execution Flow (updated):
>   1. Inject agent personality (existing)
>   2. Inject authority constraints (existing Section 3)
>   3. Execute agent task (existing)
>   4. >>> NEW: Run Post-Execution Boundary Check <<<
>   5. Record execution results (existing)
>   6. Store outcome to memory (existing)

**Issue:** authority-enforcer is the CANONICAL OWNER of the authority matrix per S08 scope. Here it defines itself as "first line" (injection) + "second line" (post-execution check) — but does not declare which files are exempt from the `files_modified` boundary. Every Legion skill that writes project state (execution-tracker writes STATE.md/ROADMAP.md per LEGION-47-146; review-loop writes REVIEW.md; memory-manager writes OUTCOMES.md) will be flagged by Section 11 surgical-mode as a violator. The table at L654-659 says "surgical: Revert out-of-scope changes" with no carve-out for legitimate skill writes. 4.7 reader running an agent that updates SUMMARY.md (required by every plan per CLAUDE.md Wave Handoff Conventions) gets the write reverted under surgical mode. CAT-10 because authority-enforcer is the skill that must solve this and doesn't. Cross-reference LEGION-47-146.

**Remediation sketch:** (a) Add Section 11.5 "Allowed System Paths" with explicit write-exempt paths: `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/phases/*/SUMMARY.md`, `.planning/phases/*/REVIEW.md`, `.planning/memory/*.md`, git history. These never count as violations regardless of files_modified. (b) Cross-reference execution-tracker Section 1 (Tracking Principles per LEGION-47-146 remediation). (c) For surgical mode specifically, allow reverting only user-code-file violations, not .planning/ state-file writes. (d) Document the exemption in authority-matrix.yaml schema under `system_paths_exempt_from_scope: [...]`.

**Remediation cluster:** `authority-language`
**Effort estimate:** small

---

## LEGION-47-177 — P2, Dead Metadata / Maximalist Persona Language (suspected)

**Lines 197, 244-246, 295**

> + "\\n\\nDO NOT critique or override their findings in these domains."
> ...
> "- `blocker` — you MUST stop the blocked action and work on other in-scope tasks\n\n"
> "**Do not skip this.** Ad-hoc text descriptions of out-of-scope issues are not "
> "sufficient. The wave-executor parses `<escalation>` blocks for automated routing.\n\n"
> ...
> **Note:** Constraint injection is the first line of defense. Post-execution boundary verification (Section 11) is the second line. Both are required for full authority enforcement.

**Issue:** The injected constraints use the maximalist "DO NOT critique or override" (L197), "MUST stop" (L244), "Do not skip this" (L245), "Ad-hoc text descriptions ... are not sufficient" (L245-246). For a skill whose output is itself prepended to every agent prompt, this rhetorical density compounds. 4.7 literal reader receiving an injected prompt that chains "DO NOT" + "MUST" + "Do not skip" + "are not sufficient" within 50 lines will adopt an over-defensive posture. The "first line / second line of defense" metaphor (L294) is military rhetoric unrelated to the contract. Peer of LEGION-47-152, LEGION-47-157, LEGION-47-158, LEGION-47-172 — maximalist-language cluster across S08.

**Remediation sketch:** (a) Replace "DO NOT critique or override their findings in these domains" (L197) with "Defer to {agent_name} ({other_agent}) on findings in these domains — record your observation as INFO if relevant, but do not BLOCKER/WARNING them." (b) Replace "Do not skip this. Ad-hoc text descriptions ... are not sufficient" (L245-246) with positive: "Use the `<escalation>` block format for all out-of-scope decisions; wave-executor's routing requires it." (c) Remove "first line / second line of defense" metaphor (L294); replace with "Section 3 and Section 11 are both required — pre-execution prompt injection and post-execution boundary verification." (d) Cross-reference the prohibitive-to-positive remediation cluster.

**Remediation cluster:** `persona-calibration`
**Effort estimate:** small

---

## LEGION-47-178 — P2, Implicit Preconditions (suspected)

**Lines 251-257, 620-624**

> # Step 3c: Add control mode context line
> control_mode_name = profile.control_mode_name if hasattr(profile, 'control_mode_name') else "guarded"
> constraints.append(
>     f"\n## Active Control Mode: {control_mode_name}\n\n"
>     f"Escalation behavior follows the `{control_mode_name}` profile. "
>     "See `.planning/config/escalation-protocol.yaml` for severity routing rules."
> )
> ...
> ### Resolution Fallback
> If no profile is provided (caller does not pass it), default to the `guarded` profile:
> - `authority_enforcement: true`, `domain_filtering: true`, `human_approval_required: true`
> - `file_scope_restriction: false`, `read_only: false`
> 
> This ensures backward compatibility — existing callers (including review-panel) that do not yet pass a profile get the same behavior as before.

**Issue:** Two related defects: (1) L252 `hasattr(profile, 'control_mode_name') else "guarded"` — pseudo-Python code implies runtime attribute check, but if the profile dict lacks `control_mode_name`, the skill silently falls back to "guarded" without warning. 4.7 reader running under `surgical` mode that passes a profile dict without `control_mode_name` field gets advertised as "guarded" in the injected prompt — confusing for the agent downstream, and a bug shape where agents think they are in a more permissive mode than they are. (2) L620-624 resolution fallback defaults silently to guarded — same shape. The fallback itself is defensible ("backward compatibility") but the combination means two different "silently default to guarded" paths, both hard to detect. Same CAT-6 class as LEGION-47-142 intent-router error swallowing.

**Remediation sketch:** (a) Fail-loud on missing control_mode_name: raise or emit `<escalation severity=warning type=infrastructure>` rather than silently defaulting. (b) If defaulting is required for backward compat, log at INFO level: "Authority enforcer: no control_mode_name provided, defaulting to guarded". (c) Have a single "resolve profile" helper that handles both missing-profile and missing-field cases with uniform logging. (d) Cross-reference LEGION-47-142 (intent-router swallow pattern).

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-179 — P2, Unstated Acceptance Criteria (suspected)

**Lines 355-376**

> # Step 4: Check severity override rule
> if finding.severity == "BLOCKER":
>     # BLOCKER from any agent overrides domain ownership
>     filtered.append(finding)
>     finding.notes = (
>         f"[OVERRIDE] Out-of-domain BLOCKER kept per severity rule "
>         f"(domain owner: {owner})"
>     )
> else:
>     # Filter out non-BLOCKER findings from non-owners
>     removed.append({
>         **finding,
>         removal_reason: (
>             f"Out-of-domain critique filtered — "
>             f"{owner} is domain authority for '{finding_domain}'"
>         )
>     })

**Issue:** Severity override rule "BLOCKER from any agent overrides domain ownership" — 4.7 literal reader sees unlimited cascade: any agent can emit a BLOCKER on any domain and it's kept. This creates a veto-by-BLOCKER-escalation anti-pattern: if an agent's critique is about to be filtered as out-of-domain, it can re-rank the severity to BLOCKER to survive the filter. No guardrail in the skill prevents this. The criterion "BLOCKER from any agent" does not distinguish (a) "this is a genuine correctness-breaking finding regardless of domain" from (b) "I want my finding to survive filtering". Per review-panel L146 BLOCKER definition ("crashes, data loss, security vulnerabilities, broken builds") — these ARE within security-engineer's domain by construction; a non-owner claiming BLOCKER-level security issue is precisely the case authority filtering should catch. Acceptance criterion for when BLOCKER-override is legitimate vs. abuse is undefined.

**Remediation sketch:** (a) Require BLOCKER override to pass a second check: "The BLOCKER must describe evidence (file:line reference + concrete failure mode + reproducer or citation). If evidence check fails, filter normally." (b) Tag BLOCKER overrides distinctly: "[OVERRIDE-PENDING-REVIEW] — domain owner must confirm before marking as must-fix." (c) Auto-escalate any out-of-domain BLOCKER to a cross-check: "domain_owner reviews the critique, agrees to WARN/BLOCKER or demotes to INFO". (d) Add anti-abuse counter: if a non-owner emits >2 out-of-domain BLOCKERs in one cycle, flag the agent for review-panel diversity adjustment. Peer of LEGION-47-157 on prohibitive-to-positive language balancing.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-180 — P2, Underspecified Dispatch (suspected)

**Lines 452-475, 541-579**

> ### With Review Panel
> ```yaml
> Integration Point: Finding synthesis
> When: After all reviewers submit findings
> Action:
>   1. Collect all findings from reviewers
>   2. Get list of agents on review panel
>   3. Call filterFindings() to remove out-of-domain critiques
>   4. Log removed findings for transparency
>   5. Synthesize remaining findings into final report
> ```
> ...
> ```javascript
> // 3. Inject constraints into prompts (with mode profile)
> const modeProfile = resolvedSettings.modeProfile; // from workflow-common-core
> for (const agentId of activeAgents) {
>     const basePrompt = loadAgentPersonality(agentId);
>     const enhancedPrompt = injectAuthorityConstraints(
>         agentId,
>         basePrompt,
>         activeAgents,
>         modeProfile  // NEW: pass resolved mode profile
>     );
>     // Spawn agent with enhancedPrompt
> }
> ```

**Issue:** Integration Points section tells consumers (wave-executor, review-panel, agent-registry) what to CALL but does not specify (a) fan-out: authority-enforcer is called N times per wave (once per active agent per Section 3, plus once per finding per Section 4) — no guidance on whether these calls can run in parallel or must be serialized; (b) state sharing: does each call load the matrix freshly or does the caller cache it? Multiple loads per wave are wasteful; no caching contract defined; (c) the example at L541-579 shows a loop `for (const agentId of activeAgents)` serializing the Section 3 injection — but wave-executor parallel dispatch (per LEGION-47-101, S06) would want parallel injection. Peer of LEGION-47-101/102/112/125/128/141/155 dispatch-specification cluster.

**Remediation sketch:** (a) State caching contract: "Callers MUST call loadAuthorityMatrix() once per wave and pass the cached matrix to injectAuthorityConstraints() and filterFindings(). Re-loading per-call is a performance bug." (b) State parallel-safety: "injectAuthorityConstraints is pure (no shared state mutation). Parallel invocation across agent IDs is safe." (c) State filterFindings serialization: "filterFindings is called once per review cycle after all findings collected — not per finding." (d) Cross-reference wave-executor Section 4 parallel-dispatch contract so the two skills align.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** small

---
