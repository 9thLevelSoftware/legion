---
name: agency:status
description: Show project progress dashboard and route to next action
allowed-tools: [Read, Grep, Glob]
---

<objective>
Read project state and display a clear progress dashboard with session resume context. Route the user to the appropriate next /agency: command based on current project state.

Purpose: Single command to understand where the project is and what to do next.
Output: Dashboard display with next-action routing.
</objective>

<execution_context>
@./.claude/skills/agency/workflow-common.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<process>
1. CHECK PROJECT EXISTS
   - Attempt to read .planning/PROJECT.md
   - If not found:
     Display:
     "No Agency project found in this directory.
      Run `/agency:start` to initialize a new project."
   - Exit — do not proceed to step 2

2. READ PROJECT STATE
   Read these files (all required for full dashboard):
   a. .planning/PROJECT.md — extract project name from the "# {name}" heading
   b. .planning/STATE.md — extract:
      - Current phase number and total phases (from "Phase: N of M")
      - Phase status (from "Status:" field)
      - Last activity (from "Last Activity:" field)
      - Next action (from "Next Action:" field)
      - Recent decisions (from "Recent Decisions" section, last 3)
      - Pre-existing issues (from "Pre-existing Issues" section, if any)
      - Phase results for the current phase (from "Phase {N} Results" section)
   c. .planning/ROADMAP.md — extract:
      - Phase list with names, goals, and completion status
      - Progress table: phase name, plans count, completed count, status per phase
   d. .planning/REQUIREMENTS.md — if exists, count checked vs unchecked requirements

3. CALCULATE PROGRESS
   Follow execution-tracker Section 5 (Progress Calculation):
   a. Read the ROADMAP.md progress table
   b. Sum all "Plans" values = total_plans
   c. Sum all "Completed" values = completed_plans
   d. Percentage = floor((completed_plans / total_plans) * 100)
   e. Progress bar: 20 characters wide
      - filled = floor(percentage / 5)
      - empty = 20 - filled
      - Format: [{"#" * filled}{"." * empty}] {pct}% — {completed}/{total} plans complete

4. DISPLAY DASHBOARD
   Output the dashboard in this exact format:

   # {project_name} — Status

   {progress_bar}

   ## Current Phase
   **Phase {N}: {phase_name}** — {status}
   Plans: {completed_in_phase}/{total_in_phase}
   Goal: {phase_goal from ROADMAP.md}

   ## Phase History
   | Phase | Status | Plans |
   |-------|--------|-------|
   | 1. {name} | {status_emoji} {status} | {completed}/{total} |
   | 2. {name} | {status_emoji} {status} | {completed}/{total} |
   ...

   Status emojis (use only these):
   - Complete: [x]
   - Executed (pending review): [~]
   - Planned (not yet executed): [-]
   - Pending (not yet planned): [ ]

   ## Recent Activity
   - {Last Activity from STATE.md}
   - {Phase results for current phase, last 3 entries}

   ## Requirements Progress
   {checked_count}/{total_count} requirements complete
   {List unchecked requirements from current phase, if any}

   If there are pre-existing issues in STATE.md:
   ## Known Issues
   {list pre-existing issues}

5. DETERMINE NEXT ACTION
   Apply this decision tree in order (first match wins):

   a. No ROADMAP.md exists:
      Next: "Run `/agency:start` to initialize the project."

   b. Current phase status contains "pending" or "Pending" in ROADMAP.md:
      Next: "Run `/agency:plan {N}` to plan Phase {N}: {phase_name}."

   c. Current phase status contains "Planned" in ROADMAP.md:
      Next: "Run `/agency:build` to execute Phase {N}: {phase_name}."

   d. Current phase status contains "Executed" or STATE.md says "pending review":
      Next: "Run `/agency:review` to verify Phase {N}: {phase_name}."

   e. Current phase is "Complete" AND there are more phases:
      - Find the next incomplete phase number (N+1)
      Next: "Run `/agency:plan {N+1}` to plan Phase {N+1}: {next_phase_name}."

   f. All phases are "Complete":
      Next: "All phases complete! Project is finished.
             Run `/agency:quick <task>` for any ad-hoc work."

   g. STATE.md says "escalated" or "failed":
      Next: "Phase {N} needs attention. Review the issues in STATE.md.
             Options:
             - Fix issues manually, then `/agency:review`
             - `/agency:quick <task>` to address specific issues
             - `/agency:plan {N}` to re-plan the phase"

6. DISPLAY NEXT ACTION
   Output:

   ## Next Action
   {next_action_text from step 5}

   Tip: Run `/agency:quick <task>` anytime for ad-hoc tasks outside the phase workflow.
</process>
