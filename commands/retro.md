---
name: legion:retro
description: Run a structured retrospective on completed phases or milestones
argument-hint: [--phase N] [--milestone M] [--dry-run]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion]
---

<objective>
Review completed phases/milestones, identify what worked and what didn't, surface reusable patterns, and record findings to memory for future planning.

Purpose: Structured team retrospective after build/review cycles — learn from what happened.
Output: Retrospective report with actionable findings written to .planning/memory/RETRO.md
</objective>

<execution_context>
skills/workflow-common-core/SKILL.md
skills/memory-manager/SKILL.md
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
   - In dry-run mode: display all analysis and findings but skip writing any files
   - Display: "DRY RUN — retrospective will be displayed but not saved"

1. CHECK PROJECT EXISTS
   - Attempt to read .planning/PROJECT.md
   - If not found:
     Display:
     "No Legion project found in this directory.
      Run `/legion:start` to initialize a new project."
   - Exit — do not proceed to step 2

2. PARSE ARGUMENTS
   - Read $ARGUMENTS for flags:
     - `--phase N`: retrospective scoped to phase N
     - `--milestone M`: retrospective scoped to milestone M (all phases in that milestone)
     - No flag: default to most recently completed phase from ROADMAP.md Progress table
   - If the specified phase/milestone is not yet complete:
     Display: "Phase {N} is not yet complete (status: {status}). Retrospectives run on completed work.
              Run `/legion:review` to finish the current review cycle, or specify a completed phase."
     Exit — do not proceed

3. READ PROJECT STATE
   Read these files:
   a. .planning/PROJECT.md — extract project name
   b. .planning/ROADMAP.md — extract phase list, progress, milestones
   c. .planning/STATE.md — extract current phase, completed phases

4. CONDITIONAL SKILL LOADING
   - `skills/memory-manager/SKILL.md` only if .planning/memory/ directory exists
   - If memory directory does not exist: memory features degrade gracefully (skip recording steps)

5. GATHER DATA
   For the target scope (phase or milestone phases):
   a. Read .planning/phases/phase-{N}/SUMMARY.md for each phase in scope
      - Extract: completed tasks, files modified, agent assignments, handoff context
      - Note any escalations (severity, type, resolution)
   b. Read .planning/phases/phase-{N}/REVIEW.md for each phase in scope
      - Extract: review findings, pass/fail status, review cycle count
      - Note if review required multiple cycles
   c. Read .planning/memory/OUTCOMES.md (if exists)
      - Extract outcomes related to the target phases
      - Note task_type classifications and agent performance
   d. Read plan frontmatter from .planning/phases/phase-{N}/PLAN-*.md files
      - Extract: agent assignments, verification commands, expected artifacts

6. ANALYZE
   For the gathered data, produce analysis across five categories:

   **What Went Well**
   - Phases/plans completed on schedule (SUMMARY.md exists with all tasks done)
   - Agents that excelled: high review pass rates, no escalations, clean handoffs
   - Patterns that worked: verification commands that caught issues, wave structure that enabled parallelism
   - Review cycles that passed on first attempt

   **What Didn't Work**
   - Review cycles that exceeded 2 iterations (extract from REVIEW.md cycle count)
   - Escalations that blocked progress (blocker-severity from SUMMARY.md)
   - Agent mismatches: agents assigned to tasks outside their specialty (cross-reference agent metadata with task types)
   - Plans with missing or incomplete SUMMARY.md sections
   - Verification commands that failed repeatedly

   **Patterns to Keep**
   - Recurring successful approaches across multiple plans/phases
   - Agent combinations that produced clean handoffs
   - Task decomposition strategies that led to first-pass reviews
   - Wave structures that maximized parallel execution

   **Patterns to Drop**
   - Recurring problems that appeared in multiple phases
   - Agent assignments that consistently required rework
   - Plan structures that led to scope creep or file conflicts
   - Processes that added overhead without catching real issues

   **Action Items**
   - Specific, actionable improvements for future phases
   - Agent recommendation adjustments (e.g., "prefer {agent} for {task_type}")
   - Process changes (e.g., "add integration test verification to all API plans")
   - Each action item should reference the evidence that motivated it

7. PRESENT FINDINGS
   Display the formatted retrospective report:

   # Retrospective: {scope_description}
   **Project**: {project_name}
   **Scope**: Phase {N} | Milestone {M} ({name}) — Phases {start}-{end}
   **Date**: {current_date}

   ## What Went Well
   {bulleted findings with evidence references}

   ## What Didn't Work
   {bulleted findings with evidence references}

   ## Patterns to Keep
   {bulleted patterns with examples}

   ## Patterns to Drop
   {bulleted patterns with examples}

   ## Action Items
   | # | Action | Priority | Evidence |
   |---|--------|----------|----------|
   | 1 | {action} | High/Medium/Low | {which phase/plan revealed this} |
   ...

   ## Metrics
   - Plans completed: {count}
   - Review pass rate: {first_pass_count}/{total} ({pct}%)
   - Escalations: {count} ({blocker_count} blockers)
   - Agents used: {count} ({list})
   - Files modified: {count}

8. ASK USER
   Present via adapter.ask_user:
   "Save retrospective findings to memory?"
   Options:
   - "Save to memory" — "Record findings to .planning/memory/RETRO.md for future planning context"
   - "View only (don't save)" — "Retrospective displayed but not persisted"
   - "Edit before saving" — "Make adjustments to findings before recording"

   If DRY_RUN=true: skip this step, display "DRY RUN — skipping save" and exit

9. HANDLE SAVE CHOICE

   **Path A: Save to memory**
   - If .planning/memory/ does not exist: create the directory
   - If .planning/memory/RETRO.md does not exist: create with header:
     ```
     # Retrospective Log

     Retrospective findings from completed phases and milestones.
     Referenced by `/legion:plan` for continuous improvement.
     ```
   - Append the retrospective entry:
     ```
     ## {scope_description} — {current_date}

     ### Key Findings
     {condensed what went well / what didn't}

     ### Action Items
     {action items table}

     ### Metrics
     {metrics summary}

     ---
     ```
   - Display: "Retrospective saved to .planning/memory/RETRO.md"
   - After recording: output reminder
     "Retro findings are automatically available to `/legion:plan` during decomposition.
      Action items from this retro will appear as constraints in future phase planning."

   **Path B: View only**
   - Display: "Retrospective not saved. Run `/legion:retro` again to revisit."
   - Exit

   **Path C: Edit before saving**
   - Present the condensed findings via adapter.ask_user:
     "Which sections need changes?"
     Options: "What Went Well" / "What Didn't Work" / "Patterns" / "Action Items" / "Looks good — save as-is"
   - For each selected section: accept user corrections and update findings
   - After edits: proceed to Path A (save)

10. CROSS-PROJECT MODE
    If invoked from `/legion:portfolio` context (detected via portfolio state or $ARGUMENTS containing `--portfolio`):
    - Iterate across all projects in the portfolio
    - Gather retro data from each project's .planning/memory/RETRO.md
    - Produce an aggregated retrospective:
      - Common patterns across projects
      - Shared action items
      - Cross-project agent performance trends
    - Display aggregated findings
    - Offer to save to the portfolio-level .planning/memory/RETRO.md

IMPORTANT:
- Retrospectives are read-only analysis of completed work — they never modify phase files or plans
- The command degrades gracefully: missing SUMMARY.md, REVIEW.md, or OUTCOMES.md files produce warnings but don't block the retrospective
- Evidence references tie every finding back to a specific phase/plan/file — no unsupported claims
- Action items are concrete and specific, not vague suggestions
- Memory recording follows memory-manager conventions for format and structure
- All user-facing questions use adapter.ask_user (AskUserQuestion tool)
</process>
