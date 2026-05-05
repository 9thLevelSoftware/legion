---
name: ship-pipeline
description: Pre-ship quality gates, deployment verification, and canary monitoring for the /legion:ship command
triggers: [ship, deploy, release, pr, canary]
token_cost: medium
summary: "Ship readiness checks, PR generation, deployment verification, and post-deploy canary monitoring. Consumed by /legion:ship command."
---

# Ship Pipeline

Pre-ship quality gates, deployment verification, and canary monitoring. Ensures all work products pass mandatory checks before shipping, generates structured PR bodies from phase artifacts, and monitors post-deploy health via canary checks.

Consumed by `/legion:ship` command. Reads phase artifacts (SUMMARY.md, REVIEW.md, plan frontmatter) and produces a SHIP-REPORT.md.

---

## Section 1: Pre-Ship Gate

Six mandatory checks that must ALL pass before shipping. Any single failure blocks the ship. Checks run sequentially — first failure is reported immediately with remediation guidance.

```
Input: Phase directory (.planning/phases/{NN}/), adapter config
Output: Gate result (PASS or FAIL with details)

Check 1: Build Completeness
  How to verify:
    For each {NN}-{PP}-PLAN.md in the phase directory:
      Check that a corresponding SUMMARY.md exists at
      .planning/phases/{NN}/{NN}-{PP}-SUMMARY.md
  Pass criteria: Every plan file has a matching SUMMARY.md
  Fail criteria: One or more plans missing SUMMARY.md
  Remediation: "Run /legion:build to execute unfinished plans: {list of plans without SUMMARY.md}"

Check 2: Review Status
  How to verify:
    Check that .planning/phases/{NN}/REVIEW.md exists.
    Parse REVIEW.md for unresolved BLOCKER findings:
      Scan for findings with severity=BLOCKER and status != "resolved"
  Pass criteria: REVIEW.md exists AND zero unresolved BLOCKER findings
  Fail criteria: REVIEW.md missing OR has unresolved BLOCKER findings
  Remediation (missing): "Run /legion:review to complete the review cycle"
  Remediation (blockers): "Resolve {N} BLOCKER findings in REVIEW.md before shipping:
    {list of unresolved blocker summaries}"

Check 3: Escalation Check
  How to verify:
    Scan all SUMMARY.md files in the phase for <escalation> blocks.
    Filter for severity=blocker with no resolution noted.
  Pass criteria: Zero blocker-severity escalations pending
  Fail criteria: One or more blocker escalations unresolved
  Remediation: "Resolve {N} blocker escalations before shipping:
    {list of escalation decision summaries with source plan}"

Check 4: Verification Commands
  How to verify:
    For each plan file, parse frontmatter for verification_commands.
    Execute each command via adapter.run_command.
    Collect exit codes.
  Pass criteria: All verification commands across all plans exit with code 0
  Fail criteria: Any verification command exits non-zero
  Remediation: "Verification command failed in plan {NN}-{PP}:
    Command: {command}
    Exit code: {code}
    Output: {last 10 lines of output}
    Fix the issue and re-run /legion:ship"

Check 5: Test Suite
  How to verify:
    Run the adapter's test command (adapter.test_command from settings).
    Capture exit code and output summary.
  Pass criteria: Test command exits with code 0
  Fail criteria: Test command exits non-zero
  Remediation: "Test suite failed:
    {test output summary — last 20 lines}
    Fix failing tests and re-run /legion:ship"

Check 6: Clean Working Tree
  How to verify:
    Run `git status --porcelain` in the project root.
    Check for any output (uncommitted changes).
  Pass criteria: git status --porcelain produces no output
  Fail criteria: Uncommitted changes exist
  Remediation: "Working tree has uncommitted changes:
    {list of modified/untracked files}
    Commit or stash changes before shipping"

Gate Result:
  If all 6 checks pass:
    Log: "Pre-ship gate: PASSED (6/6 checks)"
    Proceed to Section 2 (Ship Report Generation)

  If any check fails:
    Log: "Pre-ship gate: FAILED at check {N} ({check_name})"
    Display remediation for the first failing check.
    Do NOT proceed to Section 2.
    Use AskUserQuestion:
      "Pre-ship gate failed at: {check_name}. What next?"
      - "Fix and retry" (Recommended)
      - "Show all check results" — run remaining checks and display full report
      - "Ship anyway" — skip gate (user takes responsibility)
```

---

## Section 2: Ship Report Generation

Aggregates phase artifacts into a structured ship report for audit and PR generation.

```
Input: All SUMMARY.md and REVIEW.md files from the phase
Output: .planning/phases/{NN}/SHIP-REPORT.md

Step 1: Collect files modified
  For each SUMMARY.md in the phase:
    Extract the "Files Modified" section.
    Build a deduplicated, sorted list of all files.
  Format: one file per line, grouped by directory.

Step 2: Collect agent assignments and outcomes
  For each SUMMARY.md:
    Extract the plan ID, assigned agent, and completion status.
  Format as table:
    | Plan | Agent | Status | Files Modified |
    |------|-------|--------|---------------|
    | {NN}-{PP} | {agent-id} | {Completed/Partial} | {count} |

Step 3: Collect test results
  From Check 5 output (test suite), extract:
    - Total tests, passed, failed, skipped
    - Duration
  If test output unavailable: note "Test results not captured"

Step 4: Collect review findings
  From REVIEW.md:
    - Total findings by severity (BLOCKER, WARNING, INFO)
    - Resolution status counts (resolved, deferred, accepted)
    - List of resolved findings (one-line summaries)

Step 5: Collect escalation log
  From all SUMMARY.md files:
    - Extract all <escalation> blocks
    - Group by status: resolved, deferred, pending
    - Include resolution notes where available

Step 6: Write SHIP-REPORT.md
  Write the aggregated report to .planning/phases/{NN}/SHIP-REPORT.md:

  ---
  phase: {NN}
  phase_name: {phase_name}
  ship_date: {ISO 8601 timestamp}
  gate_result: PASSED
  files_modified_count: {N}
  agents_used: {N}
  review_verdict: {PASSED/PASSED WITH NOTES}
  ---

  # Ship Report — Phase {NN}: {phase_name}

  ## Files Modified ({N} files)
  {deduplicated file list}

  ## Agent Assignments
  {agent table from Step 2}

  ## Test Results
  {test summary from Step 3}

  ## Review Findings
  {review summary from Step 4}

  ## Escalation Log
  {escalation summary from Step 5}

  ## Verification Results
  {verification command results from Check 4}
```

---

## Section 3: PR Body Template

Structured markdown template for GitHub PR creation. Populated from SHIP-REPORT.md data.

```
PR Title: "Phase {NN}: {phase_name}"

PR Body:

## Summary
- Phase {NN}: {phase_name}
- {plan_count} plans executed, {file_count} files modified
- Review: {PASSED | PASSED WITH NOTES}

## Changes
{aggregated file list from SUMMARY.md files, grouped by directory}

### Agent Contributions
| Plan | Agent | Status |
|------|-------|--------|
| {NN}-{PP} | {agent-id} | {status} |

## Test Results
- **Total**: {total} | **Passed**: {passed} | **Failed**: {failed} | **Skipped**: {skipped}
- **Duration**: {duration}

## Review Status
- **Findings**: {blocker_count} BLOCKER, {warning_count} WARNING, {info_count} INFO
- **Resolved**: {resolved_count}/{total_count}
{list of resolved findings — one line each}

## Verification
{verification command results — command and pass/fail status for each}

---

Notes:
- PR is created via github-sync skill (if available) or adapter.create_pr
- PR labels: add "legion-ship" label and phase label "phase-{NN}"
- PR assignee: set to the user (from git config)
- If github-sync skill is unavailable: display the PR body to the user
  for manual creation
```

---

## Section 4: Canary Monitoring

Post-deploy health check loop that monitors for regressions after shipping.

```
Input: Verification commands from plan frontmatter, deploy timestamp
Output: Canary result (ALL CLEAR or REGRESSION)

Schedule: Run health checks at 1 minute, 5 minutes, and 15 minutes after deploy.

At each interval:

Step 1: Run verification commands
  Execute all verification_commands from all plans in the phase.
  Record pass/fail status for each command.
  Compare results against the pre-ship baseline (Check 4 results).

Step 2: Check for new errors
  If adapter supports error monitoring:
    Query error logs since deploy timestamp.
    Filter for new error signatures (not present in pre-deploy baseline).
  If adapter does not support error monitoring:
    Skip this step — rely on verification commands only.

Step 3: Evaluate canary health
  HEALTHY: All verification commands pass AND no new errors detected.
  DEGRADED: Some verification commands pass but others fail,
            OR new non-critical errors detected.
  REGRESSION: Previously passing verification commands now fail,
              OR new critical errors detected.

Step 4: Report interval result
  Display to user:

  ## Canary Check — {interval} after deploy

  **Status**: {HEALTHY | DEGRADED | REGRESSION}
  **Verification**: {passed}/{total} commands passed
  **New Errors**: {count} ({0 if none})

  {If DEGRADED or REGRESSION: list failing commands and new errors}

Step 5: Route based on status
  If HEALTHY and interval < 15min:
    Log: "Canary healthy at {interval}. Next check at {next_interval}."
    Wait for next interval.

  If HEALTHY and interval == 15min:
    Log: "Canary monitoring complete. All checks passed across 1min, 5min, 15min."
    Display:
      ## Canary Monitoring — ALL CLEAR
      Deploy is healthy. No regressions detected over 15 minutes.
    Exit monitoring.

  If DEGRADED:
    Use AskUserQuestion:
      "Canary detected degradation at {interval}. What next?"
      - "Continue monitoring" — proceed to next interval
      - "Investigate" — show full error details
      - "Rollback" — suggest rollback steps

  If REGRESSION:
    STOP monitoring immediately.
    Display:
      ## Canary Monitoring — REGRESSION DETECTED
      **Time**: {interval} after deploy
      **Failing checks**: {list}
      **New errors**: {list}

      ### Suggested Rollback
      ```
      git revert HEAD~{commit_count}  # Revert phase commits
      ```
      Or: redeploy previous version via adapter.deploy_command

    Use AskUserQuestion:
      "Regression detected at {interval}. What next?"
      - "Rollback" (Recommended)
      - "Investigate first" — keep deployed, examine errors
      - "Ignore" — accept the regression (user takes responsibility)

User can exit canary monitoring early via Ctrl+C at any time.
When interrupted: display current status and log partial monitoring results.
```

---

## Section 5: Integration Points

```
Consumed by:
  - commands/ship.md (primary consumer — orchestrates the full ship flow)

Reads:
  - .planning/phases/{NN}/{NN}-{PP}-PLAN.md (plan frontmatter: verification_commands, files_modified)
  - .planning/phases/{NN}/{NN}-{PP}-SUMMARY.md (agent outputs, files modified, handoff context)
  - .planning/phases/{NN}/REVIEW.md (review findings, verdicts)
  - .planning/CONTEXT.md (phase name and metadata)
  - settings.json (adapter config, test commands)

Writes:
  - .planning/phases/{NN}/SHIP-REPORT.md (aggregated ship report)

Optional integrations:
  - skills/github-sync: PR creation (if GitHub remote exists)
  - skills/review-panel: Review verdict consumption
  - skills/review-loop: Review fix cycle status
  - Adapter test_command: Test suite execution
  - Adapter deploy_command: Deployment trigger (for canary monitoring)

Flow:
  /legion:ship
    → Section 1: Pre-Ship Gate (6 checks)
    → Section 2: Ship Report Generation
    → Section 3: PR Body Template (if GitHub remote exists)
    → Section 4: Canary Monitoring (if deploy_command configured)
```

---

## References

| Pattern | Source | Used In |
|---------|--------|---------|
| Verification Commands | plan-schema v6.0 frontmatter | Section 1 Check 4, Section 4 |
| SUMMARY.md Structure | wave-handoff conventions | Section 2 |
| Review Findings | skills/review-panel/SKILL.md | Section 1 Check 2, Section 2 |
| Escalation Protocol | .planning/config/escalation-protocol.yaml | Section 1 Check 3 |
| GitHub PR Creation | skills/github-sync | Section 3 |
| Adapter Config | adapters/*.md | Section 1 Check 5, Section 4 |

## Completion Gate

This skill completes when ALL conditions are met:
1. Pre-ship gate (Section 1) ran all 6 checks to PASS or FAIL — no check skipped silently; any FAIL blocks the pipeline and is reported to the caller
2. `.planning/phases/{NN}/SHIP-REPORT.md` exists with all 7 required sections rendered: Summary, Files Modified, Tests, Reviews, Escalation Status, Deployment, Follow-ups (empty sections render the configured `_none_` placeholder, never an empty heading)
3. If a GitHub remote exists: PR created or updated with body populated from the ship report template (Section 3); PR URL captured in SHIP-REPORT.md
4. If `deploy_command` is configured and deploy was invoked: canary monitoring (Section 4) ran to completion with a recorded outcome (healthy / degraded / rollback) — no orphaned in-flight monitors
5. All verification commands from in-scope plans exited zero and their output lines are captured in the SHIP-REPORT.md Tests section
6. Escalations (pending or deferred) from prior waves surfaced in the SHIP-REPORT.md Escalation Status section, not silently dropped

If ANY condition is unmet, the skill is NOT complete — continue working or escalate via `<escalation>` block.
