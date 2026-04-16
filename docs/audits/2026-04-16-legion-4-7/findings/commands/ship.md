# Audit Findings — commands/ship.md

**Audited in session:** S05
**Rubric version:** 1.0
**File layer:** command
**File length:** 309 lines
**Total findings:** 6 (0 P0, 1 P1, 5 P2)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-058 — P1, Open-Set Interpretation of Closed Options (confirmed)

**Lines 184-219**

> 6. ASK USER
>    Present via adapter.ask_user:
>    "Ship readiness confirmed. All gates passed. Proceed?"
>
>    **If github_available=true**:
>    Options:
>    - "Create PR" — "Create pull request with ship report body on GitHub"
>    - "Push without PR" — "Push branch to remote without creating a PR"
>    - "Abort — review needed" — "Go back and review before shipping"
>
>    **If github_available=false**:
>    Options:
>    - "Push to remote" — "Push current branch to remote"
>    - "Mark as shipped" — "Update state without pushing (manual deploy)"
>    - "Abort — review needed" — "Go back and review before shipping"

**Issue:** Two bounded-option ask_user gates at the single most destructive commit point in the Legion lifecycle (push to remote / create PR / mark-as-shipped). Neither branch declares "these are the only valid choices." Under 4.7 literalism, the agent may invent a fourth option (e.g., "Squash-merge and tag release", "Create draft PR") that appears reasonable but has never been validated by the ship-pipeline skill. Additionally, the question prose "Ship readiness confirmed. All gates passed. Proceed?" is a yes/no question grafted onto a 3-option menu — "Proceed?" admits no natural mapping to any of Create PR / Push without PR / Abort. Same failure class as LEGION-47-041 (quick.md reviewer choice), LEGION-47-045 (plan.md reviewer choice), LEGION-47-051 (review.md advisor swap), and LEGION-47-053 (review.md L626 escalation gate). Elevated to P1 because this gate sits at the irreversible publish boundary.

**Remediation sketch:** Wrap each branch in its own explicit AskUserQuestion tool invocation per CLAUDE.md mandate. Rewrite the stem to match a multiple-choice surface: "Ship readiness confirmed. All gates passed. How do you want to publish Phase {N}?" Add explicit closure: "Choose exactly one. Do not propose alternatives. Do not combine options. Do not proceed until the user selects." Also enumerate the exhaustive option set inline in the prompt body, not in surrounding markdown bullets.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-059 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 276-286**

> If any check fails:
>   Display:
>   "CANARY ALERT at {interval}: `{command}` failed
>    Output: {error_output}
>    Potential regression detected — investigate immediately."
>   Present via adapter.ask_user:
>   "Canary detected a regression. What would you like to do?"
>   Options:
>   - "Investigate" — "Show full error details and relevant files"
>   - "Rollback" — "Revert the shipped changes (git revert)"
>   - "Continue monitoring" — "May be transient — keep checking"

**Issue:** Third bounded-option gate in this file. Under alert pressure (regression detected in production), the open-endedness of "What would you like to do?" invites the agent to propose unvalidated recovery actions (e.g., "Disable the failing feature flag", "Restart the service") that are not in the ship-pipeline repertoire. Same defect pattern as LEGION-47-058; separated because this gate is reachable in --canary mode and has a distinct remediation surface (alert-response taxonomy).

**Remediation sketch:** Rewrite as AskUserQuestion with explicit closure and option labels typed to the ship-pipeline rollback vocabulary: "Choose one of exactly three responses to the canary alert: A Investigate (inspect error details), B Rollback (print the git revert command — execution remains manual), C Continue monitoring (re-check at next interval). Do not propose other recovery actions."

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-060 — P2, Underspecified Dispatch (suspected)

**Lines 68-100**

> 3. PRE-SHIP GATE
>    Run ship-pipeline Section 1 quality gate checks. Each check must pass before proceeding:
>
>    a. **Build completeness**: ...
>    b. **Review status**: ...
>    c. **Escalation check**: ...
>    d. **Verification commands**: All verification_commands from plan frontmatter pass
>       - Extract verification_commands from each PLAN-*.md frontmatter
>       - Run each command via Bash
>    e. **Tests pass**: ...
>    f. **Clean working tree**: ...

**Issue:** The pre-ship gate enumerates 6 checks but does not specify (1) ordering (run in listed order, or any order?), (2) short-circuit vs exhaustive behavior ("Each check must pass before proceeding" is ambiguous — "proceeding" to the next check, or proceeding past the gate?), (3) fan-out for 3.d verification_commands (run sequentially, or parallel where safe?). Under 4.7 literalism the gate may stop on first fail and never show the user the full failure set — the "Gate summary" table at L101-113 presupposes all 6 were run, but 3.a's "If incomplete: [message]" doesn't say "continue with remaining checks and accumulate failures." Mixed with the summary's "Result: {all_passed} of 6 gates passed" which requires exhaustive evaluation. Consumer of ship-pipeline Section 1 semantics, not this file alone — so suspected pending confirmation that ship-pipeline Section 1 specifies exhaustive evaluation.

**Remediation sketch:** State explicitly: "Run all 6 checks in the listed order. Accumulate failures into a `gate_failures` list. Do not stop on first failure — run every check so the user sees the complete failure set in one pass. For 3.d, run verification commands sequentially (not in parallel — build caches and environment variables may collide). After all 6 checks complete, if `gate_failures` is non-empty: display the summary table AND per-failure remediation, then exit. Otherwise proceed to Step 4."

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** small

---

## LEGION-47-061 — P2, Unstated Acceptance Criteria (suspected)

**Lines 120-150**

> 4. GENERATE SHIP REPORT
>    Produce a structured summary of what's shipping:
>
>    # Ship Report: Phase {N} — {phase_name}
>
>    ## Summary
>    {phase goal from ROADMAP.md}
>
>    ## Files Modified
>    {aggregated file list from all SUMMARY.md files, deduplicated}
>    ...
>    ## Escalation Status
>    {list of escalations and their resolutions, or "No escalations"}
>    ## Verification Results
>    | Command | Result |
>    |---------|--------|
>    | `{command}` | Pass/Fail |

**Issue:** The ship report template has 7 sections (Summary, Files Modified, Plans Included, Test Results, Review Status, Escalation Status, Verification Results) but only one section (Escalation Status, L144) specifies empty-state rendering ("or 'No escalations'"). The other 6 sections have no empty-state rule. Under 4.7 literalism: if a phase has zero files modified (documentation-only phase), should the Files Modified heading render with an empty body, render as "(none)", or be omitted? The template shape implies mandatory rendering, but Step 5c later writes this body into a PR and an empty heading looks broken. Unstated acceptance criteria also at the report level: no "the report is complete when..." predicate. Peer of LEGION-47-011 (build.md) and LEGION-47-054 (review.md) acceptance-criteria findings.

**Remediation sketch:** Add explicit empty-state rules per section: "Files Modified — if the aggregated list is empty, render 'No files modified (documentation-only phase).' Do not omit the heading." Repeat for Plans Included, Test Results, Review Status, Verification Results. Add a report-level done predicate: "The ship report is complete when all 7 sections are rendered with either content OR the specified empty-state string. Never render an empty heading with no body."

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-062 — P2, Implicit Preconditions (suspected)

**Lines 283-285**

> If "Rollback":
> - Display the git revert command but do NOT execute automatically
> - Display: "Run `git revert {commit_hash}` to roll back. Automatic rollback disabled for safety."

**Issue:** `{commit_hash}` is a placeholder with no stated source. Under 4.7 literalism the agent does not know which commit to revert: the PR merge commit (if Path A was taken), the branch-push commit (if Path B), the state-update commit from Step 7e (wrong — reverts only STATE.md/ROADMAP.md), or the original feature commits (multiple). Step 7e's commit is the most recent in the working tree, but reverting it does NOT roll back the ship. Silent ambiguity: the agent will display a literal `{commit_hash}` or guess HEAD, both of which are wrong. Precondition: the command needs to capture and persist the ship-commit SHA at the moment of push/PR creation and refer to it by a named variable.

**Remediation sketch:** Add a new Step 5.e/Path A/B substep: "After push (Path A: after gh pr create returns the PR URL; Path B: after git push returns), capture SHIP_COMMIT_SHA = output of `git rev-parse HEAD` (or for Path A, the merge commit SHA if the PR is auto-merged). Persist to STATE.md under Phase {N} > ship_commit_sha." Then in Step 8 rollback: "Display: `git revert {SHIP_COMMIT_SHA}` where SHIP_COMMIT_SHA is read from STATE.md Phase {N} ship_commit_sha. If no SHA is persisted (Path C Mark as shipped), display: 'No ship commit recorded. Manual rollback requires identifying the commit range for Phase {N}.'"

**Remediation cluster:** `precondition-verification`
**Effort estimate:** medium

---

## LEGION-47-063 — P2, Response Calibration Gaps (suspected)

**Lines 92-95**

> e. **Tests pass**: Run test command from adapter or project config
>    - Check PROJECT.md or package.json/Makefile for test command
>    - Run the test suite
>    - If tests fail: "GATE FAIL: Test suite failed. Fix failing tests before shipping."

**Issue:** "Check PROJECT.md or package.json/Makefile for test command" leaves the precedence order, search procedure, and fallback behavior unspecified. Under 4.7 literalism the agent may (1) pick any of the three arbitrarily, (2) run none if PROJECT.md has no explicit "Test command:" field, (3) invoke npm test when a Makefile `test` target is the authoritative one, or (4) conflate `npm test` (which runs configured test script) with `pytest`/`go test` when project is polyglot. Also "Fix failing tests" response shape is unbounded — no pointer to which test, what file, which line of stderr.

**Remediation sketch:** Replace with explicit precedence chain: "Determine test command in this exact priority order — stop at first hit: (1) PROJECT.md section `## Test Command` fenced block; (2) package.json `scripts.test` (run via `npm test`); (3) Makefile `test` target (run via `make test`); (4) pyproject.toml `tool.pytest` section (run via `pytest`); (5) go.mod present (run via `go test ./...`). If none found: set tests_check=SKIP with details 'No test command resolvable — configure in PROJECT.md ## Test Command.' On failure: display `{command}` (exit code {code}) and the last 20 lines of stderr. Do not summarize — show raw output."

**Remediation cluster:** `response-calibration`
**Effort estimate:** medium

---
