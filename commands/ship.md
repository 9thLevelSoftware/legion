---
name: legion:ship
description: Pre-ship checklist, PR creation, deployment verification, and canary monitoring
argument-hint: "[--phase N] [--canary] [--dry-run]"
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion]
---

<objective>
Run pre-ship quality gate, create PR with structured body, verify CI/deployment, and optionally monitor for post-deploy regressions.

Purpose: Complete the plan → build → review → ship lifecycle with a structured shipping workflow.
Output: Ship readiness report, PR (if GitHub integration active), deployment verification results.
</objective>

<execution_context>
skills/workflow-common-core/SKILL.md
skills/ship-pipeline/SKILL.md
skills/execution-tracker/SKILL.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<process>
0. DRY-RUN MODE
   - Check if $ARGUMENTS contains `--dry-run`
   - If present: set DRY_RUN=true, strip flag from arguments
   - In dry-run mode: run all checks and display results but skip PR creation, pushes, and state updates
   - Display: "DRY RUN — ship checks will run but no PRs, pushes, or state changes will be made"

0.5. CONDITIONAL SKILL LOADING
   - `skills/github-sync/SKILL.md` only if `gh auth status` succeeds and a git remote exists
     If the condition is not met: set github_available=false, skip silently and continue
     If the condition is met: set github_available=true
   - `skills/ship-pipeline/SKILL.md` always loaded

1. CHECK PROJECT EXISTS
   - Attempt to read .planning/PROJECT.md
   - If not found:
     Display:
     "No Legion project found in this directory.
      Run `/legion:start` to initialize a new project."
   - Exit — do not proceed to step 2

2. DETERMINE SHIP SCOPE
   - Read $ARGUMENTS for `--phase N`
   - Read .planning/STATE.md to determine current phase and status
   - Read .planning/ROADMAP.md to extract phase list with progress

   **If `--phase N` provided**:
   - Verify phase N exists in ROADMAP.md
   - Ship scope = phase N

   **If no flag**:
   - Default to current phase from STATE.md
   - If current phase status is not "Reviewed" or "Complete":
     Display: "Phase {N} has not passed review yet (status: {status}).
              Run `/legion:review` before shipping, or specify a reviewed phase with `--phase N`."
     Exit — do not proceed

   - Check for `--canary` flag: set CANARY_MODE=true if present, strip from arguments

   Display: "Ship scope: Phase {N} — {phase_name}"

3. PRE-SHIP GATE
   Run ship-pipeline Section 1 quality gate checks. Each check must pass before proceeding:

   a. **Build completeness**: All plans in scope have SUMMARY.md files
      - Glob for .planning/phases/phase-{N}/PLAN-*.md — count plans
      - Check each plan has a corresponding entry in SUMMARY.md completed tasks
      - If incomplete: "GATE FAIL: {count} plans missing build output. Run `/legion:build` to complete."

   b. **Review status**: REVIEW.md exists with passing status or no unresolved blockers
      - Read .planning/phases/phase-{N}/REVIEW.md
      - Check for passing status (no open blockers)
      - If no REVIEW.md: "GATE FAIL: No review found. Run `/legion:review` before shipping."
      - If blockers exist: "GATE FAIL: {count} unresolved blockers in review. Resolve before shipping."

   c. **Escalation check**: No pending blocker-severity escalations in SUMMARY.md files
      - Grep SUMMARY.md for `<escalation>` blocks with `severity: blocker`
      - If found: "GATE FAIL: {count} unresolved blocker escalations. Resolve before shipping."

   d. **Verification commands**: All verification_commands from plan frontmatter pass
      - Extract verification_commands from each PLAN-*.md frontmatter
      - Run each command via Bash
      - If any fail: "GATE FAIL: Verification command failed: `{command}` — exit code {code}"
      - Display pass/fail for each command

   e. **Tests pass**: Run test command from adapter or project config
      - Check PROJECT.md or package.json/Makefile for test command
      - Run the test suite
      - If tests fail: "GATE FAIL: Test suite failed. Fix failing tests before shipping."

   f. **Clean working tree**: No uncommitted changes
      - Run `git status --short`
      - If output is non-empty: "GATE FAIL: Uncommitted changes in working tree. Commit or stash before shipping."

   **Gate summary**:
   Display:
   ## Pre-Ship Gate: Phase {N}
   | Check | Status |
   |-------|--------|
   | Build complete | Pass/FAIL |
   | Review passed | Pass/FAIL |
   | No blocker escalations | Pass/FAIL |
   | Verification commands | Pass/FAIL ({passed}/{total}) |
   | Tests pass | Pass/FAIL |
   | Clean working tree | Pass/FAIL |

   **Result**: {all_passed} of 6 gates passed

   If any gate failed:
   - Display specific remediation for each failure
   - Display: "Ship blocked — resolve the above issues and re-run `/legion:ship`."
   - Exit — do not proceed to step 4

4. GENERATE SHIP REPORT
   Produce a structured summary of what's shipping:

   # Ship Report: Phase {N} — {phase_name}

   ## Summary
   {phase goal from ROADMAP.md}

   ## Files Modified
   {aggregated file list from all SUMMARY.md files, deduplicated}

   ## Plans Included
   | Plan | Agent | Status |
   |------|-------|--------|
   | {plan_name} | {agent_id} | Complete |
   ...

   ## Test Results
   {test suite output summary — pass count, fail count, skip count}

   ## Review Status
   {review outcome from REVIEW.md — cycles completed, findings resolved}

   ## Escalation Status
   {list of escalations and their resolutions, or "No escalations"}

   ## Verification Results
   | Command | Result |
   |---------|--------|
   | `{command}` | Pass/Fail |
   ...

5. PR CREATION (if GitHub integration active)
   - If github_available=false:
     Display: "No GitHub integration detected. Push to remote when ready."
     Skip to Step 6

   - If github_available=true:
     a. Determine branch name:
        - If on a feature branch: use current branch
        - If on main/master: create branch `legion/phase-{N}-ship`
     b. Determine base branch from git config or default (main/master)
     c. Construct PR body from ship report:
        ```
        ## Summary
        Phase {N}: {phase_name} — {phase_goal}

        ## Changes
        {file list from ship report}

        ## Quality Gates
        - Build: Complete ({plan_count} plans)
        - Review: Passed (cycle {cycle_count})
        - Tests: Passed ({test_count} passing)
        - Verification: All commands passed

        ## Plans
        {plan table from ship report}

        ## Escalations
        {escalation summary or "None"}
        ```
     d. PR title: "Phase {N}: {phase_name}"

6. ASK USER

   Branch on `github_available`, then issue AskUserQuestion with the matching exhaustive option set.

   **If github_available=true**: issue AskUserQuestion.

   Question: "How do you want to publish Phase {N}?"

   **Select one option:**
   - **Create PR** — push branch and create pull request with ship report body on GitHub
   - **Push without PR** — push branch to remote without creating a pull request
   - **Abort — review needed** — stop; do not push or publish

   Choose exactly one. Do not propose alternatives. Do not combine options.

   → Use AskUserQuestion tool with these exact three options.

   **If github_available=false**: issue AskUserQuestion.

   Question: "How do you want to publish Phase {N}?"

   **Select one option:**
   - **Push to remote** — push current branch to remote (no PR; no GitHub integration available)
   - **Mark as shipped** — update state without pushing (manual deploy handled elsewhere)
   - **Abort — review needed** — stop; do not push or update state

   Choose exactly one. Do not propose alternatives. Do not combine options.

   → Use AskUserQuestion tool with these exact three options.

   If DRY_RUN=true: skip this step, display "DRY RUN — skipping ship actions" and exit

   **Path A: Create PR**
   - Push branch to remote: `git push -u origin {branch}`
   - Create PR via gh:
     `gh pr create --title "{pr_title}" --body "{pr_body}"`
   - Display: "PR created: {pr_url}"
   - Proceed to Step 7

   **Path B: Push without PR / Push to remote**
   - Push branch to remote: `git push -u origin {branch}`
   - Display: "Branch pushed to origin/{branch}"
   - Proceed to Step 7

   **Path C: Mark as shipped**
   - Skip push, proceed to Step 7

   **Path D: Abort**
   - Display: "Ship aborted. Run `/legion:review` to address remaining concerns."
   - Exit

7. POST-SHIP
   After merge/push:
   a. Run verification commands again against current state
      - If any fail: Display warning "Post-ship verification failure: `{command}`" but do not block
   b. Update STATE.md:
      - Set phase status to "Shipped"
      - Add ship date
      - Reference PR URL if created
   c. Update ROADMAP.md:
      - Mark phase as "Shipped" in Progress table
   d. Record outcome to memory (if .planning/memory/ exists):
      - Append to .planning/memory/OUTCOMES.md:
        ```
        ## Phase {N} — Shipped {date}
        task_type: ship
        agent: ship-pipeline
        result: success
        pr: {pr_url or "N/A"}
        verification: {pass_count}/{total} passed
        ```
   e. Create git commit for state updates:
      ```
      git add .planning/STATE.md .planning/ROADMAP.md
      git commit -m "chore(legion): ship phase {N} — {phase_name}

      All quality gates passed. {plan_count} plans shipped.
      PR: {pr_url or 'N/A'}

      {adapter.commit_signature}"
      ```
   f. Display:
      "Phase {N}: {phase_name} — Shipped!
       Run `/legion:status` to see updated project state."

8. CANARY MODE (--canary flag)
   If CANARY_MODE=true:
   a. Display:
      "Entering canary monitoring mode.
       Will run health checks at 1min, 5min, and 15min intervals.
       Press Ctrl+C to exit early."

   b. Define health checks:
      - All verification_commands from plan frontmatter
      - Test suite (if configured)
      - Custom canary commands from PROJECT.md or ship-pipeline config (if defined)

   c. Run check cycle at each interval (1min, 5min, 15min):
      For each check:
      - Run command via Bash
      - Record pass/fail and output
      - If any check fails:
        Display:
        "CANARY ALERT at {interval}: `{command}` failed
         Output: {error_output}
         Potential regression detected — investigate immediately."
        Present via adapter.ask_user:
        "Canary detected a regression. What would you like to do?"
        Options:
        - "Investigate" — "Show full error details and relevant files"
        - "Rollback" — "Revert the shipped changes (git revert)"
        - "Continue monitoring" — "May be transient — keep checking"

        If "Rollback":
        - Display the git revert command but do NOT execute automatically
        - Display: "Run `git revert {commit_hash}` to roll back. Automatic rollback disabled for safety."
        - Exit canary mode

      - If all checks pass at current interval:
        Display: "Canary check at {interval}: All {check_count} checks passed"

   d. After 15min check passes:
      Display:
      "Canary monitoring complete — all checks passed at 1min, 5min, and 15min intervals.
       Phase {N} ship is stable. Exiting canary mode."

   e. Record canary results to memory (if active):
      - Append canary outcome to OUTCOMES.md

IMPORTANT:
- The pre-ship gate is strict — ALL checks must pass before proceeding. No partial ships.
- Verification commands are run twice: once in the gate (Step 3) and once post-ship (Step 7) for drift detection
- PR body is structured and machine-readable, with clear sections for automated review tools
- Canary mode never auto-rollbacks — it alerts and suggests, but the human decides
- Git commits use execution-tracker Section 6 conventions
- The command never force-pushes or modifies git history
- All user-facing questions use adapter.ask_user (AskUserQuestion tool)
- If github_available is false, all GitHub-dependent features skip silently
- Dry-run mode produces the full ship report and gate results without any side effects
</process>
