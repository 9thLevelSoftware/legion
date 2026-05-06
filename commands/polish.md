---
name: legion:polish
description: Clean and polish code for readability, consistency, and clarity
argument-hint: "[--phase N] [--scope=changed|dependents|directory] [--dry-run] [<target-path>]"
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion]
---

<objective>
Execute structured code cleanup ("deslopping") with the right agent, producing polished code that is clearer, shorter, and more consistent without changing behavior.

Purpose: Standalone ad-hoc code cleanup with the right agent, no phase planning required. Also invoked as a post-review step by /legion:review.
Output: Polished code with conventional commit, polish summary report, and flagged items for human review.
</objective>

<execution_context>
skills/workflow-common-core/SKILL.md
skills/code-polish/SKILL.md
skills/agent-registry/SKILL.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
</context>

<process>
1. PARSE ARGUMENTS
   - Read $ARGUMENTS for flags and target path
   - If $ARGUMENTS is empty or missing:
     - Attempt to read STATE.md for current phase context
     - If current phase found with status "executed, pending review" or "complete":
       Use phase files as implicit scope — display: "Auto-detected scope from Phase {N}"
       Continue to Step 2
     - If no phase context available:
       Display: "Usage: `/legion:polish [--phase N] [--scope=changed|dependents|directory] [--dry-run] [<target-path>]`

                Examples:
                `/legion:polish src/api/`  — polish all source files under src/api/
                `/legion:polish --phase 3` — polish files modified in phase 3
                `/legion:polish --scope=changed` — polish only changed files (no dependents)
                `/legion:polish --scope=directory src/utils/` — polish a specific directory
                `/legion:polish --dry-run` — preview findings without making changes
                `/legion:polish src/auth/login.ts` — polish a single file

                Flags:
                `--phase N`       Target a specific phase's modified files
                `--scope=X`       Scope mode: changed (exact files), dependents (+ importers), directory (recursive)
                `--dry-run`       Report findings without applying changes
                `<target-path>`   Explicit file or directory to polish"
       Exit — do not proceed

   - Parse flags from $ARGUMENTS:
     - `--phase N`: extract PHASE_NUMBER, set scope source to phase plan files
     - `--scope=changed`: set SCOPE_MODE = "changed"
     - `--scope=dependents`: set SCOPE_MODE = "dependents" (default when not specified)
     - `--scope=directory`: set SCOPE_MODE = "directory"
     - `--dry-run`: set DRY_RUN = true
     - Remaining non-flag arguments: treat as TARGET_PATH (file or directory path)

   - Display: "Polish target: {TARGET_PATH or 'Phase ' + PHASE_NUMBER or 'auto-detected'}{' (dry run)' if DRY_RUN}"

2. LOAD PROJECT CONTEXT
   - Attempt to read .planning/PROJECT.md
     - If found: extract project name, tech stack, constraints, conventions
     - If not found: proceed without project context — polish works with or without an initialized project
   - Attempt to read CLAUDE.md at project root
     - If found: extract naming, formatting, import, comment, and error handling conventions
     - If not found: skip — conventions will be detected from codebase sampling
   - Attempt to read .planning/CODEBASE.md
     - If found: extract "Conventions" or "Patterns" sections
     - If not found: skip

   Execute convention detection per code-polish skill Section 2:
     - Read explicit standards from CLAUDE.md (highest precedence)
     - Read detected conventions from CODEBASE.md (medium precedence)
     - Sample up to 10 files from scope for implicit conventions (lowest precedence)
     - Merge conventions with precedence: explicit > detected > implicit
     - Log conflicts: "Convention conflict: {key} — explicit={value_a}, detected={value_b}. Using explicit."

   Display conventions summary:
   "## Detected Conventions
    | Convention | Value | Source |
    |------------|-------|--------|
    | {key} | {value} | {explicit/detected/implicit} |
    ..."

3. RESOLVE TARGET FILES
   Execute scope resolution per code-polish skill Section 1:

   a. Determine base file set:
      - If TARGET_PATH provided: resolve glob or literal path to file list
      - If PHASE_NUMBER provided: read .planning/phases/ plan files, extract files_modified
      - If SCOPE_MODE == "directory" AND TARGET_PATH is a directory: recurse for all source files
      - If auto-detected from STATE.md: extract files_modified from current phase plans

   b. Expand to dependents (unless SCOPE_MODE == "changed"):
      - For each file in base set, find importing files (one level only)
      - Add importers to expanded set

   c. Apply scope overrides:
      - If SCOPE_MODE == "directory": filter to files under specified directory only

   d. Filter excluded paths:
      - Remove: node_modules, dist, build, out, .git, .planning, lock files, minified files, binary files, .gitignore matches

   e. Cap file count:
      - If >50 files: warn and truncate to 50 (sorted by modification time, most recent first)

   Display file list:
   "## Polish Scope
    Files: {count} ({count_base} base + {count_expanded} dependents, {count_filtered} excluded)
    {file list — one per line, grouped by directory}"

   f. If file count > 20:
      Use AskUserQuestion:
      Question: "Polish scope contains {count} files. Proceed?"
      Options:
      - "Yes — polish all {count} files" (Recommended)
      - "Narrow scope — only base files ({count_base})" — skip dependents, polish only directly targeted files
      - "Cancel" — exit without changes

      If user selects "Narrow scope": remove dependents from file list
      If user selects "Cancel": exit

4. DRY-RUN CHECK
   - If DRY_RUN is true:
     a. Resolve agent path via workflow-common Agent Path Resolution Protocol (resolve AGENTS_DIR)
     b. Read agents/testing-code-polisher.md personality file
     c. Construct a dry-run prompt:
        """
        {full personality .md content}

        ---

        # Polish Task (REPORT ONLY — DRY RUN)

        **IMPORTANT: Do NOT modify any files. Report findings only.**

        ## Conventions
        {merged convention set from Step 2}

        ## Files to Analyze
        {file list from Step 3}

        ## Instructions
        Analyze each file against the four-pass rubric below. For each finding, report what
        WOULD change but do NOT apply any changes. Produce the standard POLISH.md report format
        with all findings listed.

        ### Pass Rubrics
        1. Comment Cleanup — identify restates-code, ai-narration, commented-out-code, stale-todo, noise-divider, signature-restatement
        2. Code Simplification — identify guard-clause, lookup-table, dead-code, unused-vars, unused-imports, inline-trivial, collapse-wrapper, stdlib-equivalent
        3. Readability Refactoring — identify vague-variable, vague-function, ambiguous-param, boolean-naming, negated-boolean
        4. Consistency Normalization — identify import-ordering, import-style, naming-outlier, error-handling, string-style, trailing-commas, semicolons, file-structure

        For each finding report: Pass | File:Line | Rule | Description
        """
     d. Spawn via adapter.spawn_agent_personality:
        - prompt: {dry-run prompt}
        - model: adapter.model_execution
        - name: "code-polisher-dryrun"
     e. Collect results via adapter.collect_results
     f. Display dry-run summary:
        "## Polish Dry Run — Preview

         {agent's findings report}

         **No files were modified.** Run without `--dry-run` to apply changes."
     g. Exit — do not proceed to Step 5

5. EXECUTE POLISH
   a. RESOLVE AGENT PATH: Follow workflow-common Agent Path Resolution Protocol to resolve AGENTS_DIR.
      - Use the Read tool on `~/.claude/agents/agents-orchestrator.md` (global install probe)
      - If found: set AGENTS_DIR = ~/.claude/agents
      - If not found: Use the Read tool on `agents/agents-orchestrator.md` (local dev probe)
      - If found: set AGENTS_DIR = agents
      - If neither found: fail with "Agent files not found. Run: npm install -g @anthropic/legion"

   b. Read agents/testing-code-polisher.md personality file at {AGENTS_DIR}/testing-code-polisher.md
      - If personality file is missing: fail with "testing-code-polisher.md not found at {AGENTS_DIR}. Verify Legion installation."

   c. Construct the execution prompt:
      """
      {full personality .md content}

      ---

      # Polish Task

      ## Conventions
      {merged convention set from Step 2 — full table of convention keys, values, and sources}

      ## Files to Polish
      {ordered file list from Step 3}

      ## Instructions
      Execute the four-pass polish rubric on every file in the list above. Apply changes
      directly to each file using the Edit tool.

      ### Pass 1: Comment Cleanup
      Apply REMOVE rules (restates-code, ai-narration, commented-out-code, stale-todo,
      noise-divider, signature-restatement). PRESERVE intent, business-logic, legal-header,
      todo-with-ref, gotcha-warning, type-annotation, regex-explanation comments.
      Log every removal: PASS1 | file:line | CLEAN | "text" | reason

      ### Pass 2: Code Simplification
      Apply SIMPLIFY rules (guard-clause, lookup-table, dead-code, unused-vars, unused-imports,
      inline-trivial, collapse-wrapper, stdlib-equivalent). FLAG but do NOT apply: extract-function,
      remove-export, cross-file-dedup, pattern-replacement.
      Log: PASS2 | file:lines | SIMPLIFY/FLAG | "desc" | reason

      ### Pass 3: Readability Refactoring
      Auto-apply renames in LOCAL scope (vague-variable, vague-function, ambiguous-param,
      boolean-naming, negated-boolean). FLAG renames in EXPORTED scope.
      FLAG extractions (oversized-function, excessive-params, deep-nesting).
      Log: PASS3 | file:line | RENAME/FLAG/TYPE | "change" | reason

      ### Pass 4: Consistency Normalization
      Apply NORMALIZE rules (import-ordering, import-style, naming-outlier, error-handling,
      string-style, trailing-commas, semicolons, file-structure) where convention is unambiguous
      (>70% of codebase or explicit in CLAUDE.md). FLAG new-pattern, ambiguous-split,
      readability-conflict. Do NOT touch formatter concerns (indentation, line length, braces,
      whitespace, blank lines).
      Log: PASS4 | file:line | NORMALIZE/FLAG | "change" | source

      ## Safety Reminder
      - Do NOT change behavior — only improve clarity, naming, and consistency
      - Do NOT add new dependencies or imports
      - Do NOT delete exported functions or public API surfaces
      - Do NOT modify test assertions or expected values
      - If unsure whether a change is safe, FLAG it instead of applying it
      - Produce a structured summary at the end with stats, per-pass logs, and flagged items list
      """

   d. Spawn via adapter.spawn_agent_personality:
      - prompt: {constructed prompt}
      - model: adapter.model_execution
      - name: "code-polisher"

   **Dispatch specification — Polish agent**
   | Field | Value |
   |---|---|
   | When | After scope resolution (Step 3) and convention detection (Step 2) complete. Fires exactly once per `/legion:polish` invocation. |
   | Why parallel is safe | Not parallel — `/legion:polish` is a single-agent workflow. One polisher processes all files sequentially through four passes. |
   | How many | Exactly 1 agent (single-agent contract by design). |
   | Mechanism | adapter.spawn_agent_personality. Single tool call. Model: adapter.model_execution. CLIs without agent-spawning support: inline execution with personality as context prefix. |

   e. Collect results via adapter.collect_results
      - Capture: per-pass logs, flagged items, files modified, stats summary

6. SAFETY VERIFICATION
   Execute safety rails per code-polish skill Section 7:

   a. Pre-polish baseline (should have been captured before Step 5 — if not, note limitation):
      - Detect test command (package.json scripts.test, Cargo.toml, pytest, go test, Makefile, settings)
      - Detect type checker (tsconfig.json, mypy, cargo check, settings)

   b. Post-polish test verification:
      - If test command available: run tests
        - PASS: log "Safety: tests — PASS"
        - FAIL (pre-existing): log "Safety: tests — FAIL (pre-existing, not caused by polish)"
        - FAIL (regression): log "Safety: tests — REGRESSION DETECTED"
          Run per-file isolation: revert files one by one, re-test, keep reverted files that fix the regression
          Log: "Safety: reverted polish for {file_list} due to test regression"

   c. Post-polish type check:
      - If type checker available: run type check
        - Same PASS/FAIL/regression logic as tests above

   d. Display safety results:
      "## Safety Verification
       | Check | Result |
       |-------|--------|
       | Tests | {PASS / FAIL (pre-existing) / REGRESSION (N files reverted) / NOT AVAILABLE} |
       | Type Check | {PASS / FAIL (pre-existing) / REGRESSION (N files reverted) / NOT AVAILABLE} |
       | Files reverted | {count} ({file_list or 'none'}) |"

7. REPORT AND COMMIT
   Display polish summary to stdout using the POLISH.md format from code-polish skill Section 8:

   "## Polish Complete

    | Metric | Count |
    |--------|-------|
    | Files polished | {N} |
    | Comments removed (Pass 1) | {N} |
    | Lines simplified (Pass 2) | {N} |
    | Symbols renamed (Pass 3) | {N} |
    | Patterns normalized (Pass 4) | {N} |
    | Items flagged for review | {N} |

    {Per-pass detail tables from agent's structured output}"

   - Check if any files were actually changed:
     Run `git status --short` to detect modifications

   - If no changes detected:
     Display: "Code is already clean. No changes needed."
     Skip to Step 8

   - If changes exist:
     Determine target label for commit message:
       - If TARGET_PATH provided: use TARGET_PATH
       - If PHASE_NUMBER provided: use "phase {N}"
       - Otherwise: use "project scope"
     Create commit:
       ```
       git add {only files modified by polish agent — not .planning/ files}
       git commit -m "refactor: polish {target_label}

       Polish applied {N} changes across {M} files.
       Pass 1 (comments): {count} | Pass 2 (simplify): {count}
       Pass 3 (readability): {count} | Pass 4 (consistency): {count}

       {adapter.commit_signature}"
       ```

   Note: Polish tasks do NOT update STATE.md or ROADMAP.md.
   They operate outside the phase workflow entirely (same as /legion:quick).

8. FLAGGED ITEMS
   - Collect all flagged items from the polish agent's output:
     - REFACTOR flags: extract-function, remove-export, cross-file-dedup, pattern-replacement
     - EXTRACT flags: oversized-function, excessive-params, deep-nesting
     - CONVENTION flags: new-pattern, ambiguous-split, readability-conflict
     - RENAME flags: exported-scope renames (vague-function, vague-variable on exports)

   - If no flagged items: display "No items flagged for manual review." and exit.

   - If flagged items exist:
     Display flagged items list:
     "## Flagged for Review

      These items require human judgment and were NOT auto-applied.

      | # | Category | File | Line(s) | Description | Rule |
      |---|----------|------|---------|-------------|------|
      | 1 | REFACTOR | {path} | {lines} | {description} | {rule} |
      | 2 | EXTRACT | {path} | {lines} | {description} | {rule} |
      | 3 | CONVENTION | {path} | {lines} | {description} | {rule} |
      ..."

     Use AskUserQuestion:
     Question: "There are {count} flagged items that need human judgment. Would you like to address them?"
     Options:
     - "Review one by one" — walk through each flagged item and decide to apply or skip
     - "Skip all — I will review later" — exit; flagged items are logged in the polish report
     - "Open as issues" — create GitHub issues for each flagged item (requires gh CLI)

     If user selects "Review one by one":
       For each flagged item:
         Display the item details (file, lines, description, rule, suggested change)
         Use AskUserQuestion:
         Question: "{description} ({rule})"
         Options:
         - "Apply this change" — execute the suggested refactor/rename/extraction
         - "Skip" — leave as-is
         - "Skip remaining" — stop reviewing, leave all remaining items as-is

         If "Apply this change": apply the change, add to commit
         If "Skip": continue to next item
         If "Skip remaining": break out of review loop

       If any flagged items were applied:
         Create follow-up commit:
         ```
         git add {modified files}
         git commit -m "refactor: apply flagged polish items

         Applied {N} of {total} flagged items from polish review.

         {adapter.commit_signature}"
         ```

     If user selects "Open as issues":
       - Check GitHub availability: `gh auth status`
       - If available: for each flagged item, create an issue:
         `gh issue create --title "refactor: {brief description}" --body "{full details}"`
       - If not available: display "GitHub CLI not available. Flagged items logged in polish report above."

   Exit — polish complete.
</process>
