---
name: legion:validate
description: Validate .planning/ state file integrity, schema conformance, and cross-references
argument-hint: "[--fix] [--ci]"
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion]
---

<objective>
Validate the integrity, schema conformance, and cross-referential consistency of all `.planning/` state files. Produce a structured report of passes, warnings, and failures. Useful for diagnosing corrupted state, CI integration, and post-update verification.

Purpose: Single command to verify project state health.
Output: Validation report with actionable diagnostics.
</objective>

<execution_context>
skills/workflow-common-core/SKILL.md
skills/agent-registry/SKILL.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<process>
1. PARSE ARGUMENTS
   - If `$ARGUMENTS` contains `--fix`: set FIX_MODE = true. Attempt auto-fix for minor issues (missing sections, formatting).
   - If `$ARGUMENTS` contains `--ci`: set CI_MODE = true. Machine-readable output only (summary line + exit code). No interactive prompts, no emoji, no table formatting.
   - If neither flag is present: interactive validation with human-readable report.
   - `--fix` and `--ci` may be combined (auto-fix in CI mode).

   Initialize result accumulators:
   - pass_count = 0
   - warn_count = 0
   - fail_count = 0
   - results = [] (array of {check, status, details} objects)

2. CHECK PROJECT EXISTS
   - Attempt to read `.planning/` directory contents via Glob.
   - If `.planning/` does not exist or is empty:
     Display: "No Legion project found. Run `/legion:start` to initialize."
     If CI_MODE: exit with code 2.
     Stop — do not proceed to step 3.

3. VALIDATE PROJECT.MD
   - Check: `.planning/PROJECT.md` exists and is readable.
   - Check: File starts with `# ` (has a title heading).
   - Check: File contains a `## Requirements` or `## Goals` section header.
   - Check: Frontmatter block (if present) is valid YAML between `---` delimiters.
   - Scoring:
     - File missing → FAIL
     - File exists but missing title or requirements section → WARN
     - All checks pass → PASS
   - If FIX_MODE and title is missing: prepend `# Untitled Project\n\n` and re-validate.
   - If FIX_MODE and requirements section is missing: append `\n## Requirements\n\n- (none defined)\n` and re-validate.
   - Record result: {check: "PROJECT.md", status, details}.

4. VALIDATE ROADMAP.MD
   - Check: `.planning/ROADMAP.md` exists and is readable.
   - Check: File contains a markdown table (at least one line matching `|...|...|`).
   - Check: Table header row contains "Phase" and "Status" columns (case-insensitive).
   - Check: Table header row contains "Name" or "Requirements" column.
   - Check: Status values in all rows are one of: Pending, In Progress, Planned, Executed, Complete, Shipped (case-insensitive).
   - Check: Phase numbers are sequential integers starting from 1, with no gaps.
   - Scoring:
     - File missing → FAIL
     - Table missing or malformed headers → FAIL
     - Invalid status values → WARN (list which rows)
     - Non-sequential phase numbers → WARN
     - All checks pass → PASS
   - If FIX_MODE and status values are invalid: normalize to closest valid value (e.g., "done" → "Complete", "wip" → "In Progress").
   - Record result: {check: "ROADMAP.md", status, details}.

5. VALIDATE STATE.MD
   - Check: `.planning/STATE.md` exists and is readable.
   - Check: File contains "Current" (case-insensitive) within the first 10 lines (current position section).
   - Check: File contains a phase reference (e.g., "Phase: N of M" or "Phase N").
   - Check: If a phase number is referenced, it exists in ROADMAP.md's phase table.
   - Check: If progress percentages are present, they are between 0 and 100.
   - Scoring:
     - File missing → FAIL
     - Missing current position section → WARN
     - Phase reference not found in ROADMAP.md → FAIL
     - Percentage out of range → WARN
     - All checks pass → PASS
   - Record result: {check: "STATE.md", status, details}.

6. VALIDATE PHASE FILES
   - List all directories in `.planning/phases/`.
   - For each phase directory:
     a. Check: CONTEXT.md exists.
     b. For each PLAN-*.md file:
        - Check: File has YAML frontmatter between `---` delimiters.
        - Check: Frontmatter contains `phase`, `plan`, `wave`, and `agents` fields.
        - Check: `agents` field is a non-empty array. `agents[0]` is the primary executor; any subsequent entries are co-executors.
        - Check: Every entry in the `agents` array is a valid agent ID (exists in the agent catalog via agent-registry).
        - Check: `wave` is a positive integer.
        - Check: `expected_artifacts` field exists and is a non-empty array. Each entry has a `path` (string) and `provides` (string) property.
        - Check: `verification_commands` field exists and is a non-empty array of strings (bash commands).
        - Check: `must_haves` field exists and is an object containing at least a `truths` array.
     c. For plans with "Complete" status: check that a corresponding SUMMARY-*.md exists.
   - Scoring:
     - Missing CONTEXT.md → WARN
     - Plan missing frontmatter or required fields → FAIL
     - Missing or empty `expected_artifacts` → FAIL
     - Missing or empty `verification_commands` → FAIL
     - Missing `must_haves` or missing `must_haves.truths` → FAIL
     - Any agent ID in the `agents` array not found in catalog → FAIL (record which agent ID and which plan file)
     - Missing SUMMARY for completed plan → WARN
     - All checks pass → PASS
   - If no phase directories exist: PASS with details "No phase files to validate".
   - Record result: {check: "Phase files", status, details}.

7. VALIDATE CROSS-REFERENCES
   - Agent IDs referenced in any plan file must exist in the agent catalog.
     (Already checked in step 6 — aggregate failures here.)
   - Phase numbers in STATE.md must have corresponding entries in ROADMAP.md.
     (Already checked in step 5 — aggregate failures here.)
   - If `.planning/memory/OUTCOMES.md` exists:
     - Check: File has at least one outcome record (non-empty beyond headers).
     - Check: Agent IDs referenced in outcomes exist in the agent catalog.
   - If `.planning/config/` directory exists:
     - Check: Any YAML files are parseable (no syntax errors).
   - Scoring:
     - Any dangling reference → FAIL
     - All cross-references resolve → PASS
   - Record result: {check: "Cross-references", status, details}.

7b. VALIDATE CONFIG AGENT REFERENCES
   Config YAML files reference agents by ID. After agent consolidations or deletions,
   these references can become dangling. This check catches phantom agent references
   that step 6 misses (step 6 only validates plan frontmatter, not config files).

   Build the ground-truth agent set:
   - List all `.md` files in the `agents/` directory.
   - Extract agent IDs by stripping the `.md` extension (e.g., `testing-qa-verification-specialist.md` → `testing-qa-verification-specialist`).
   - Store as VALID_AGENT_IDS set.

   Check authority-matrix.yaml:
   - If `.planning/config/authority-matrix.yaml` exists:
     - Parse the YAML. Extract all top-level keys under the `agents:` mapping.
     - For each key: check if it exists in VALID_AGENT_IDS.
     - Any missing → record as FAIL with: "authority-matrix.yaml references agent '{id}' which does not exist in agents/"
   - If file does not exist: skip silently.

   Check intent-teams.yaml:
   - If `.planning/config/intent-teams.yaml` exists:
     - Parse the YAML. For each intent under the `intents:` mapping:
       - Extract agent IDs from `agents.primary` list (if present).
       - Extract agent IDs from `agents.secondary` list (if present).
       - Extract agent IDs from `filter.exclude_agents` list (if present).
     - For each extracted ID: check if it exists in VALID_AGENT_IDS.
     - Any missing → record as FAIL with: "intent-teams.yaml intent '{intent_name}' references agent '{id}' which does not exist in agents/"
   - If file does not exist: skip silently.

   Check roster-gap-config.yaml:
   - If `.planning/config/roster-gap-config.yaml` exists:
     - Parse the YAML. Search all `coverage_indicators`, `covering_agents`, and `required_agents` lists recursively.
     - For each agent ID found: check if it exists in VALID_AGENT_IDS.
     - Any missing → record as WARN with: "roster-gap-config.yaml references agent '{id}' which does not exist in agents/"
       (WARN not FAIL because roster-gap-config is analytical — it documents gaps, including agents that may have been removed intentionally.)
   - If file does not exist: skip silently.

   If FIX_MODE:
     - Do NOT auto-fix dangling agent references. Agent consolidation requires human judgment
       about which replacement agent should inherit the old agent's domains and team positions.
     - Instead: append fix guidance to the report:
       "To fix: check git log for the agent file deletion commit to identify which agent absorbed the removed agent's responsibilities. Update the config file to reference the consolidated agent ID."

   Scoring:
     - Any FAIL-level dangling reference → FAIL
     - Only WARN-level references (roster-gap-config) → WARN
     - All references resolve → PASS
   - Record result: {check: "Config agent references", status, details}.

8. VALIDATE AGENT ROSTER CONSISTENCY
   Verify that agent counts and division breakdowns cited in documentation match reality.

   Count actual agents:
   - Count `.md` files in `agents/` directory → ACTUAL_COUNT.

   Check STATE.md agent count:
   - Search STATE.md for patterns like "{N} agents across" (regex: `(\d+)\s+agents?\s+across`).
   - If found: extract the number as STATED_COUNT.
     - If STATED_COUNT != ACTUAL_COUNT → FAIL with: "STATE.md claims {STATED_COUNT} agents but agents/ contains {ACTUAL_COUNT}"
   - If no agent count pattern found: skip (not all projects track agent counts in STATE.md).

   Check division alignment:
   - For each `.md` file in `agents/`: read the YAML frontmatter and extract the `division` field.
   - Group agents by division and count per division.
   - If `.planning/config/authority-matrix.yaml` exists:
     - Check that each division comment header count (e.g., "# TESTING DIVISION (6 agents)") matches the actual agent count for that division.
     - Any mismatch → WARN with: "authority-matrix.yaml says {division} has {stated} agents but agents/ contains {actual}"

   If FIX_MODE and STATE.md count is wrong:
     - Update the agent count number in STATE.md (all occurrences of the pattern).
     - Note: only updates the numeric count, not surrounding prose.

   Scoring:
     - STATED_COUNT mismatch → FAIL
     - Division count mismatch → WARN
     - All counts match → PASS
   - Record result: {check: "Agent roster consistency", status, details}.

9. VALIDATE CONFIGURATION
   - If `settings.json` exists in repo root:
     - Check: File is valid JSON (parseable without errors).
     - Check: If `control_mode` field exists, its value is one of: autonomous, guarded, advisory, surgical.
     - Check: If `planning.max_tasks_per_plan` exists, it is a positive integer.
     - Check: If `review.max_cycles` exists, it is a positive integer.
   - If `settings.json` does not exist: PASS with details "No settings.json (using defaults)".
   - If `.planning/config/control-modes.yaml` exists:
     - Check: File is parseable YAML.
   - Scoring:
     - Invalid JSON → FAIL
     - Invalid control_mode → WARN
     - Invalid field values → WARN
     - All checks pass → PASS
   - Record result: {check: "Configuration", status, details}.

10. REPORT
   Count results:
   - pass_count = number of results with status PASS
   - warn_count = number of results with status WARN
   - fail_count = number of results with status FAIL

   If CI_MODE:
     Output only:
     ```
     validate: {pass_count} passed, {warn_count} warnings, {fail_count} failures
     ```
     Exit code: 0 if fail_count == 0 and warn_count == 0, 1 if warn_count > 0 and fail_count == 0, 2 if fail_count > 0.

   If NOT CI_MODE:
     Display the full report:
     ```
     ## Validation Report

     | Check | Status | Details |
     |-------|--------|---------|
     | PROJECT.md | {status_icon} {STATUS} | {details} |
     | ROADMAP.md | {status_icon} {STATUS} | {details} |
     | STATE.md | {status_icon} {STATUS} | {details} |
     | Phase files | {status_icon} {STATUS} | {details} |
     | Cross-references | {status_icon} {STATUS} | {details} |
     | Config agent refs | {status_icon} {STATUS} | {details} |
     | Agent roster | {status_icon} {STATUS} | {details} |
     | Configuration | {status_icon} {STATUS} | {details} |

     **Summary**: {pass_count} passed, {warn_count} warnings, {fail_count} failures
     ```

     Status icons:
     - PASS: checkmark
     - WARN: warning indicator
     - FAIL: failure indicator

   If FIX_MODE was active and fixes were applied:
     Append:
     ```
     ## Fixes Applied
     - {description of each fix applied}
     ```
     Then re-run validation on fixed files and show updated results.

11. DONE
    Exit. Validate never modifies phase state (STATE.md, ROADMAP.md progress fields) unless --fix is used for formatting corrections only. Validate never changes phase status, plan assignments, or roadmap progression.
</process>

<error_handling>
- If `.planning/` directory is missing: direct user to `/legion:start`.
- If agent catalog cannot be loaded: skip agent ID validation checks with WARN "Agent catalog unavailable — skipping agent ID validation".
- If a file cannot be read (permissions, encoding): record as FAIL with the specific error message.
- If `--ci` and `--fix` are combined: apply fixes silently, then output CI-format summary.
</error_handling>
