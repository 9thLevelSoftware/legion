---
name: legion:quick
description: Run a single ad-hoc task with intelligent agent selection
argument-hint: "[--fix] <task-description>"
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion]
---

<objective>
Execute a single task outside the normal phase workflow. Select the best agent from the registry for the task, spawn it with full personality injection, and return results.

Purpose: Lightweight way to run any task with the right agent — no phase planning required.
Output: Task results with agent summary and optional commit. With `--fix`: includes inline review and PR creation.
</objective>

<execution_context>
skills/workflow-common-core/SKILL.md
skills/agent-registry/SKILL.md
skills/agent-registry/CATALOG.md
skills/review-loop/SKILL.md
skills/workflow-common-github/SKILL.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
</context>

<process>
1. PARSE TASK DESCRIPTION
   - Read $ARGUMENTS for the task description
   - If $ARGUMENTS is empty or missing:
     Display: "Usage: `/legion:quick <task-description>`
              Example: `/legion:quick write unit tests for the auth module`
              Example: `/legion:quick create a content calendar for Q2`
              Example: `/legion:quick review the API rate limiting code`
              Example: `/legion:quick --fix resolve the auth token expiry bug`
              Example: `/legion:quick --fix #42`

              Flags:
              `--fix`  Fix mode — adds inline review + PR creation after execution"
     Exit — do not proceed
   - Detect `--fix` flag:
     - If $ARGUMENTS starts with `--fix`: set FIX_MODE=true, strip `--fix` from task description
     - Otherwise: set FIX_MODE=false
   - Detect GitHub issue reference:
     - If task description matches `#\d+`: extract ISSUE_NUMBER, keep the rest as task description
     - If task description is ONLY `#\d+` (no other text):
       - Fetch issue title and body via `gh issue view {number} --json title,body`
       - Use issue title as task description, body as additional context
       - If `gh` not available or fails: ask user for a task description instead
   - Store the full task description for use in subsequent steps
   - Display: "Quick task{' (fix mode)' if FIX_MODE}: {task_description}"

2. LOAD PROJECT CONTEXT (optional)
   - Attempt to read .planning/PROJECT.md
   - If found: extract project name, tech stack, constraints
     - This context helps inform agent selection and task execution
   - If not found: proceed without project context
     - Quick tasks work with or without an initialized project
   - Attempt to read .planning/STATE.md
   - If found: note current phase for awareness (but quick tasks don't modify phase state)

3. SELECT AGENT
   Follow agent-registry Section 3 (Recommendation Algorithm) at single-task scope:

   a. Parse Task Description (Section 3, Step 1):
      - Extract key terms from the task description
      - Match terms against task_types tags in the Agent Catalog

   b. Match Agents (Section 3, Step 2):
      - Score agents using the weighting system:
        - Exact match on task type tag: 3 points
        - Partial match (substring in specialty): 1 point
        - Division alignment: 2 points

   c. Rank and Select (Section 3, Steps 3-4):
      - Rank by score, break ties by specificity
      - For quick tasks: select top 1-2 candidates (not full team assembly)
      - Cap at 1 agent for execution (quick = single agent)

   d. Present recommendation to user via AskUserQuestion:
      Question: "Which agent should handle this task?"

      **Select one option:**
      - **{top_agent_id} — {specialty}** (Recommended) — {brief rationale based on task match}
      - **{second_agent_id} — {specialty}** — {brief rationale for alternative}
      - **No agent — run autonomously** — execute without personality injection (faster, generic)
      - **Other — pick a different agent** — choose from the full agent registry

      Choose one of the four options above. Do not propose alternatives.

      → Use AskUserQuestion tool with these exact four options.

   e. If user selects "Other — pick a different agent": issue a second AskUserQuestion
      enumerating valid agent IDs from agent-registry Section 1, paginated by division
      if the list exceeds 10 entries. Do not accept free-text input.
      - Validate the ID exists in agent-registry Section 1
      - If invalid: re-issue the AskUserQuestion with the correct division's agent IDs

4. CONSTRUCT TASK PROMPT
   Based on selection from Step 3:

   **Path A: Personality-injected agent**
   a. RESOLVE AGENT PATH: Follow workflow-common Agent Path Resolution Protocol to resolve AGENTS_DIR.
      Look up the agent ID from agent-registry Section 1.
   b. Read the agent's full personality .md file at {AGENTS_DIR}/{agent-id}.md
      If personality file is missing: fall back to Path B (autonomous execution), log the warning
   c. Construct the execution prompt:
      """
      {full personality .md content}

      ---

      # Task

      {task_description from Step 1}

      ## Project Context
      {project name, tech stack, constraints from Step 2 — or "No project context available" if PROJECT.md not found}

      ## Instructions
      - Execute this task to completion
      - Use your specialist expertise to produce the best possible result
      - Create or modify files as needed
      - If the task is ambiguous, make reasonable decisions and note your assumptions
      - When done, provide a summary of:
        - What you did
        - Files created or modified (with paths)
        - Any decisions or assumptions you made
        - Any follow-up actions the user should consider
      """

   **Path B: Autonomous (no personality)**
   a. Construct a simpler prompt:
      """
      # Task

      {task_description from Step 1}

      ## Project Context
      {project context or "No project context available"}

      ## Instructions
      - Execute this task to completion
      - Create or modify files as needed
      - When done, provide a summary of what you did and any files changed
      """

5. SPAWN AGENT AND EXECUTE
   - Use adapter.spawn_agent_personality (or adapter.spawn_agent_autonomous for Path B):
     - prompt: {constructed prompt from Step 4}
     - model: adapter.model_execution
     - name: "{agent-id}-quick" or "quick-task" if autonomous
   - On CLIs without agent spawning: execute the task inline with personality as context prefix
   - Wait for completion and capture results

   **Dispatch specification — Quick task agent**
   | Field | Value |
   |---|---|
   | When | After agent selection (Step 3.d) and prompt construction (Step 4) complete. Fires exactly once per `/legion:quick` invocation. |
   | Why parallel is safe | Not parallel — `/legion:quick` is defined as a single-agent workflow (see Step 3.c: "Cap at 1 agent for execution"). No parallel dispatch applies here. |
   | How many | Exactly 1 agent (single-agent contract by design). |
   | Mechanism | adapter.spawn_agent_personality for Path A (personality-injected); adapter.spawn_agent_autonomous for Path B (no-agent / autonomous). Single tool call. Model: adapter.model_execution. CLIs without agent-spawning support: inline execution with personality as context prefix — document this fallback in SUMMARY.md. |

6. DISPLAY RESULTS
   Output the results to the user:

   ## Quick Task Complete

   **Agent**: {agent_id} ({specialty}) — or "Autonomous" if no personality
   **Task**: {task_description}

   ### Summary
   {agent's summary of what was done}

   ### Files Changed
   {list of files created or modified, from agent's report}

   If the agent reported errors or could not complete:
   ### Issues
   {description of what went wrong}
   Suggestion: Try a different agent or break the task into smaller pieces.

7. OFFER COMMIT (if files changed)
   - Check if the agent created or modified any files:
     Run `git status --short` to detect changes
   - If no changes detected:
     Display: "No file changes detected — nothing to commit."
     Skip to Step 10 (or exit if not FIX_MODE)
   - If changes exist AND FIX_MODE is false:
     Use adapter.ask_user:
     "Commit the changes from this quick task?"
     Options:
     - "Yes — commit with conventional message" (Recommended)
       Description: "Creates a feat/fix/chore commit for the work done"
     - "No — leave uncommitted"
       Description: "Keep changes in working directory for further review"
   - If changes exist AND FIX_MODE is true:
     Always commit (fix mode requires a commit for the review + PR steps).
     Display: "Fix mode: committing changes for review."
   - Commit format:
     - Determine commit type from task description:
       - FIX_MODE or task mentions "fix", "bug", "repair" -> fix(legion)
       - Task mentions "test", "spec" -> test(legion)
       - Task mentions "doc", "readme", "comment" -> docs(legion)
       - Task mentions "refactor", "clean", "reorganize" -> refactor(legion)
       - Default -> feat(legion)
     - Create the commit:
       {type}(legion): quick — {brief task summary}

       Task: {task_description}
       Agent: {agent_id}

       {adapter.commit_signature}

   Note: Quick tasks do NOT update STATE.md or ROADMAP.md.
   They operate outside the phase workflow entirely.

   - If FIX_MODE is false: exit after commit/skip decision
   - If FIX_MODE is true: continue to Step 8

8. INLINE REVIEW (fix mode only)
   Run a lightweight review cycle on the fix. This catches obvious issues
   before creating a PR — one reviewer, one cycle, no iteration.

   a. Select reviewer agent:
      - Use agent-registry Section 3 to find the best review agent for this task type
      - Prefer agents with review_strengths matching the task domain
      - For code fixes: prefer `testing-qa-verification-specialist` or `engineering-senior-developer`
      - Cap at 1 reviewer (this is a quick fix, not a full panel)

   b. Construct review prompt:
      """
      {reviewer personality .md content}

      ---

      # Quick Fix Review

      **Task**: {task_description}
      **Agent**: {agent_id}

      ## Changes to Review
      {output of `git diff HEAD~1` — the commit from Step 7}

      ## Review Instructions
      - This is a quick fix, not a full feature. Scope your review accordingly.
      - Focus on: correctness, obvious regressions, missing error handling
      - Do NOT flag style nits or suggest refactoring — that is not the goal of a hotfix
      - Produce findings using the standard review format:

        | File | Lines | Severity | Finding |
        |------|-------|----------|---------|
        | ... | ... | blocker/concern/nit | ... |

      - Verdict: PASS (ship it) or FAIL (needs changes before PR)
      - If FAIL: list the specific blocking issues
      """

   c. Spawn reviewer agent:
      - model: adapter.model_check (lightweight — this is a quick review)
      - Wait for completion

      **Dispatch specification — Quick review agent**
      | Field | Value |
      |---|---|
      | When | After the original quick-task agent completes (Step 5) AND --review or `/legion:quick --fix` flag is set. Fires at most once per review attempt; max 1 retry permitted per Step 7.d. |
      | Why parallel is safe | Not parallel — quick review uses a single reviewer by design (lightweight verification, not full review panel). |
      | How many | Exactly 1 reviewer agent per review attempt. |
      | Mechanism | adapter.spawn_agent_personality with the reviewer personality loaded in Step 7.b. Single tool call. Model: adapter.model_check (intentionally lighter than model_execution for cost efficiency on quick verification). |

   d. Process review result:
      - If verdict is PASS: continue to Step 9
      - If verdict is FAIL:
        Display the findings to the user via adapter.ask_user:
        "Review found blocking issues. How to proceed?"
        Options:
        - "Fix and retry" — "Apply reviewer's suggestions, then re-review"
          → Re-spawn the original agent with the review findings as additional context
          → Commit the fix
          → Re-run review (max 1 retry — if it fails again, proceed to user decision)
        - "Proceed anyway" — "Create PR with known issues noted"
          → Continue to Step 9 with review findings included in PR body
        - "Abort" — "Stop here, I'll fix manually"
          → Display: "Fix committed locally. Run `/legion:quick --fix` again after manual changes."
          → Exit

9. CREATE PR (fix mode only)
   Create a pull request for the fix using GitHub integration.

   a. Check GitHub availability:
      - Run `gh auth status` to verify CLI is authenticated
      - If not available: Display "GitHub CLI not available. Changes committed locally at {commit_hash}." → Exit

   b. Create branch (if on main/master):
      - If current branch is main or master:
        - Branch name: `fix/{sanitized_task_summary}` (max 50 chars, lowercase, hyphens)
        - Run: `git checkout -b {branch_name}`
        - If ISSUE_NUMBER exists: `fix/{issue_number}-{brief_slug}`

   c. Push branch:
      - Run: `git push -u origin {branch_name}`

   d. Create PR:
      - Title: `fix: {brief task summary}` (max 70 chars)
      - Body:
        ```
        ## Quick Fix

        **Task**: {task_description}
        **Agent**: {agent_id} ({specialty})
        **Review**: {PASS/FAIL with notes}

        ## Changes
        {brief summary of what changed and why}

        ## Review Findings
        {reviewer findings table — or "Clean review, no issues found" if PASS}

        {if ISSUE_NUMBER: "Fixes #{ISSUE_NUMBER}"}

        ---
        🤖 Generated with [Legion](https://github.com/9thLevelSoftware/legion) quick fix mode
        ```
      - Run: `gh pr create --title "{title}" --body "{body}"`
      - If ISSUE_NUMBER: the "Fixes #N" line auto-links the PR to the issue

   e. Display result:
      "PR created: {pr_url}
       Branch: {branch_name}
       Review: {verdict}
       {if ISSUE_NUMBER: 'Linked to issue #' + ISSUE_NUMBER}"

10. DONE
    Exit. Quick tasks (including fix mode) do not modify STATE.md or ROADMAP.md.
</process>
