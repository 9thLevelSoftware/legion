# Audit Findings — commands/review.md

**Audited in session:** S04
**Rubric version:** 1.0
**File layer:** command
**File length:** 685 lines
**Total findings:** 7 (0 P0, 2 P1, 5 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-051 — P1, Open-Set Interpretation of Closed Options (confirmed)

**Lines 230-247**

> Present selected reviewers to user via adapter.ask_user: "## Phase {N}: {phase_name} — Review Setup ... Selected Reviewers: {table}"
> Options:
> - "{primary_agent_name} + {secondary_agent_name}" (Recommended)
> - "{primary_agent_name} only" — single reviewer, faster but less thorough
> - "{alternative_agent_name} + {primary_agent_name}" — different reviewer pair
> - "Other" — enter custom agent IDs
> e. If user selects "Other": accept custom agent IDs from user input and validate each one exists in agent-registry

**Issue:** Primary reviewer-selection gate. Multiple defects. (1) "Other" option delegates to free-text capture ("accept custom agent IDs from user input") — inherits the S03 `adapter.prompt_free_text` contract defect (parallel to LEGION-47-041 quick.md L81-93 and LEGION-47-045 plan.md L263). (2) "{alternative_agent_name}" is a template placeholder: if no alternative is scored high enough, the third option either duplicates the first or renders with an unresolved placeholder. (3) Em-dash descriptions inline in option labels. (4) No closure framing. P1 because reviewer selection determines what findings the review produces; a wrong-agent selection either misses defects or over-reports. Load-bearing decision gate.

**Remediation sketch:** (1) Remove "Other" from this AskUserQuestion; instead offer "Pick different reviewers" which opens a chained AskUserQuestion enumerating review-capable agent IDs from agent-registry (paginated by division). (2) Guard the third-option render: if `alternative_agent_name` is null, drop that option. (3) Move em-dash descriptions into the AskUserQuestion `description` field. (4) Add closure. Cross-reference S03 `adapter.prompt_free_text` decision before full remediation.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-052 — P1, Underspecified Dispatch (confirmed)

**Lines 397-406**

> For each must-fix finding, determine the fix agent by file type:
> .md skill/command/agent/planning files → autonomous (no personality)
> .ts/.js/.jsx/.tsx → engineering-frontend-developer or engineering-backend-architect
> .py/.rb/.go/.rs → engineering-backend-architect
> .css/.scss/design assets → design-ux-architect
> marketing/content .md → marketing-content-creator
> CI/CD/infrastructure configs → engineering-devops-automator
> No clear match → autonomous

**Issue:** Fix-agent routing table with multiple structural defects. (1) Classifier ambiguity: `.md skill/command/agent/planning files` has no operational predicate — is it a path prefix match (`skills/**/*.md`), a filename suffix match (`*SKILL.md`), or content-based detection? 4.7 will infer inconsistently. (2) `.ts/.js/.jsx/.tsx → engineering-frontend-developer OR engineering-backend-architect` — "or" without tiebreak; 4.7 defaults to first-listed, which may mis-route backend Node services to frontend-developer. (3) Two agent IDs don't exist in the Legion roster per CLAUDE.md Division table: `engineering-devops-automator` (correct is `engineering-infrastructure-devops`) and `marketing-content-creator` (correct is `marketing-content-social-strategist` or `marketing-social-platform-specialist`). 4.7 dispatching to non-existent agents will either trigger AGENTS_DIR file-not-found (breaking the fix cycle) or fall through to autonomous, silently losing personality injection. (4) `marketing/content .md` has no path predicate. (5) `CI/CD/infrastructure configs` has no extension predicate — is a `Dockerfile` CI/CD? A `docker-compose.yml`? P1 because this routing table is the only dispatch spec for fix cycles; every review cycle 2+ runs through it. Pre-existing issue unrelated to 4.7 literalism: the non-existent agent IDs will break the review flow regardless of reader.

**Remediation sketch:** (1) Replace each row with path-glob + fallback: `skills/**/*.md` → autonomous; `commands/**/*.md` → autonomous; etc. (2) For `.ts/.js/.jsx/.tsx`: specify disambiguation (e.g., "if path under `frontend/` or contains `*.tsx`/`*.jsx` → frontend-developer; else backend-architect"). (3) Correct agent IDs to match the Legion roster (cross-check CLAUDE.md Division table and agent-registry Section 1 before committing). (4) Concrete path globs for marketing content (e.g., `content/**/*.md`, `campaigns/**/*.md`). (5) Enumerate CI/CD paths: `.github/**`, `Dockerfile*`, `docker-compose*.yml`, `.gitlab-ci.yml`. (6) Flag the non-existent agent IDs as a pre-existing bug to be fixed in remediation separately from 4.7-literalism cluster.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** medium

---

## LEGION-47-053 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 99-116, 187-198, 626-631**

> L99-116: NL routing — HIGH: "Yes, run {result.command} instead" / "No, proceed with standard review" / "Cancel"; MEDIUM: "Yes, proceed" / "No, standard review" / "Cancel"; LOW: "pick a suggestion or proceed with standard review"
> L187-198: "How should reviewers be selected for this phase?" / "Dynamic review panel (Recommended)" / "Classic reviewer selection"
> L626-631: "How would you like to proceed?" / "Fix manually" / "Accept as-is" / "Investigate further"

**Issue:** Three user-facing ask_user gates with recurring defects: em-dash descriptions inline, no closure framing, and in the LOW-confidence NL branch (L114-115) the option list is dynamically constructed from `result.fallbackSuggestion` without bounds — "options to pick a suggestion or proceed with standard review" is a prose sketch, not an enumerable option list. The L626 escalation gate is destructive-adjacent ("Accept as-is and move to /legion:plan {N+1}" marks a phase complete despite unresolved blockers).

**Remediation sketch:** Wrap all three in explicit AskUserQuestion with structured label/description pairs and closure. For L114-115 LOW branch: require fallback suggestions to be enumerated as exactly N options (cap at 5); if fewer, drop the branch and default to "standard review". For L626: add a confirmation sub-question before "Accept as-is" commits the phase-complete state.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-054 — P2, Unstated Acceptance Criteria

**Lines 394-436**

> e. If aggregate verdict is PASS (must-fix list is empty AND all reviewers gave PASS): Break the loop — go to step 6, Path A
> f. If verdict is NEEDS WORK or FAIL and cycle_count < {max_cycles}: [re-review]
> g. If cycle_count >= {max_cycles} AND blockers remain: go to step 6, Path B (escalation)

**Issue:** The three exit conditions do not partition the state space. Edge case: must-fix list is EMPTY (no blockers, no warnings) but at least one reviewer returned NEEDS WORK verdict (e.g., for style-only SUGGESTIONs the reviewer flagged as NEEDS WORK). Step 5.e requires BOTH empty must-fix AND all-reviewer PASS — fails. Step 5.f triggers on NEEDS WORK — re-review runs with no findings to fix, producing identical output next cycle. Step 5.g requires `blockers remain` — fails because must-fix is empty. The loop runs until max_cycles with no progress, then exits via L436 LOOP END implicitly with no outcome path. Also at L432-434, Path B is only reachable if blockers remain; if only WARNINGs remain at max_cycles, neither Path A nor Path B fires.

**Remediation sketch:** Rewrite exit conditions to partition state. "At end of each cycle: if must-fix is empty → Path A (PASS); elif cycle_count >= max_cycles → Path B (ESCALATED with remaining must-fix list); else → fix cycle and re-review." Decouple the pass verdict from individual reviewer strings; the aggregate must-fix list is the authoritative gate. If a reviewer returns NEEDS WORK without contributing a must-fix finding, treat as SUGGESTION only.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-055 — P2, Unstated Acceptance Criteria

**Lines 442-449**

> 6. COMPLETE REVIEW
>    Determine outcome based on loop result:
>    If REVIEW_MODE === "full":
>       [Existing Step 6 logic unchanged]
>    If REVIEW_MODE === "security-only":
>       → Use Step 6-INTENT below

**Issue:** "[Existing Step 6 logic unchanged]" is a merge-conflict marker or editor stub, not operational instruction. The actual Path A/Path B content begins at L512. A 4.7-literal reader encountering L446 will see the bracketed placeholder and either skip the entire Step 6 body or treat the bracket note as an instruction. The intent is almost certainly "fall through to Path A/B below" but that is not stated. Same defect class as LEGION-47-050 (plan.md "existing behavior" references).

**Remediation sketch:** Delete the bracketed stub. Replace with: "If REVIEW_MODE === 'full': proceed to Path A (passed) or Path B (escalated) below based on loop exit condition (Step 5.e or 5.g)."

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-056 — P2, Implicit Preconditions

**Lines 155-173**

> DETECT MANUAL EDITS:
> 2. Run: git diff --name-only HEAD
>    This shows uncommitted changes since the last commit
> 3. Intersect: files in BOTH files_modified AND git diff output
> 4. If intersection is non-empty: Report: "Detected {count} manual edit(s) to build-modified files: {file list}"

**Issue:** The precondition is wrong. `git diff --name-only HEAD` shows uncommitted working-tree changes vs HEAD. The build command (`/legion:build`) commits its output per Legion convention; post-build the working tree is clean. If a user manually edits a build-modified file AND then commits the edit (perhaps by running another Legion command that auto-commits), those edits would NOT appear in `git diff HEAD`. The detection window is "manual edits that are uncommitted at review time" — not "all manual edits since build". The narrower window is probably intentional but isn't documented, and the comment "since the last commit" misleadingly suggests the broader window.

**Remediation sketch:** Replace the git command with one that actually captures the intended window: "Run `git log --format=%H {build-commit-sha}..HEAD -- {files_modified}` to list any commits after the build commit that touched build-modified files. Manual edits = commits in that range whose message does not match `^(feat|fix|chore|docs|test|refactor)\(legion\):`. Additionally, `git diff HEAD -- {files_modified}` catches uncommitted edits." Document the build-commit-SHA retrieval (from SUMMARY.md or phase-directory git log).

**Remediation cluster:** `precondition-verification`
**Effort estimate:** medium

---

## LEGION-47-057 — P2, Ambiguous Triggers

**Line 60**

> security-review: only if `--just-security` flag is set, or security-sensitive files detected in SUMMARY.md (auth/crypto/permission/token/session files)

**Issue:** "Security-sensitive files detected" operationalized by substring-match against `auth/crypto/permission/token/session` keywords. No word-boundary rule — `authorized_users_export.md` and `token_generator_template.md` match but are not security-sensitive; `passwd.go` would not match but is. No case rule. No path-vs-filename distinction. Recurring keyword-substring-match defect class (LEGION-47-028 learn.md, LEGION-47-044 quick.md, LEGION-47-048 plan.md).

**Remediation sketch:** Replace with precise detection: "Read each path in SUMMARY.md files_modified. Load as security-sensitive if (a) any path component matches `^(auth|crypto|security|oauth|jwt|session|secret|credential)` case-insensitive, OR (b) the filename matches `(auth|login|password|token|key|cert|tls|ssl)[-_.]`." Enumerate explicitly; reject substring match.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---
