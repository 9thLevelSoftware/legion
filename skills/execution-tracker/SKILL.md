---
name: legion:execution-tracker
description: Tracks execution progress with STATE.md updates, ROADMAP.md progress, and atomic git commits per plan
triggers: [track, progress, execution, status, state]
token_cost: low
summary: "Tracks phase execution progress and updates STATE.md. Records plan completions, failures, and wave advancement. Use during /legion:build to maintain execution state."
---

# Legion Execution Tracker

Progress tracking and git commit engine for /legion:build. This skill governs how state files are updated, how progress is calculated, and how atomic commits are created after each plan completes.

References:
- State Update Pattern from `workflow-common.md` (Read → Update → Write STATE.md)
- Plan File Convention from `workflow-common.md` (.planning/phases/{NN-name}/)
- Cost Profile Convention from `workflow-common.md` (Opus/Sonnet/Haiku model selection)
- `.planning/STATE.md` — reads and updates project state after each plan completion
- `.planning/ROADMAP.md` — updates progress table after wave completion
- `memory-manager.md` — optional memory recording after plan completion (Section 3)

---

## Section 1: Tracking Principles

Core rules that govern all execution tracking:

- STATE.md is updated after EVERY plan completion — whether the plan succeeded, partially completed, or failed
- ROADMAP.md progress table is updated after each wave completes, not after individual plans
- One git commit per completed plan — not per task, not per wave
- Commit messages use Conventional Commits: `feat(legion): execute plan {NN}-{PP} — {plan_name}`
- Progress percentage counts completed plans across ALL phases, not just the current phase
- Failed plans are tracked in state files but do NOT increment the completed count
- The tracker never modifies plan output files — it only touches STATE.md, ROADMAP.md, and git history

---

## Section 2: Plan Completion Tracking

After receiving each agent's completion (via adapter.collect_results — e.g., SendMessage on Claude Code, result file on other CLIs), follow these steps to update state and create the atomic commit.

```
After receiving each agent's completion (per adapter.collect_results):

Step 1: Determine plan result
  - Success: agent completed all tasks, verification passed
  - Partial: agent completed some tasks, or verification had warnings
  - Failed: agent encountered errors or verification failed

Step 1.5: Verify or initialize STATE.md structure (precondition for Step 2)

  Before writing to STATE.md, verify the required section structure exists.
  Missing sections are the canonical failure mode for the first plan of a new phase.

  a) Read `.planning/STATE.md` explicitly via the Read tool. Do NOT assume contents.
     If STATE.md is absent: **FAIL FAST** — emit:
     ```
     <escalation>
     severity: blocker
     type: scope
     decision: Cannot record plan result — STATE.md missing
     context: .planning/STATE.md not found. Run /legion:start or /legion:validate to initialize.
     </escalation>
     ```
     and STOP. Do NOT create STATE.md from scratch here — that is `/legion:start`'s responsibility.
     If STATE.md exists but is empty or cannot be read (permission error): emit the same escalation with context describing the read failure and STOP.

  b) Verify required top-level sections exist (in this canonical order):
     1. `## Status`
     2. `## Last Activity`
     3. `## Phase {N} Results` — one per phase seen in ROADMAP.md (load-bearing for progress parse)
     4. `## Progress`

  c) For any missing section, **append it at the canonical position** with an empty placeholder:
     - `## Phase {N} Results` — placeholder body: `_No plans completed yet._`
     - `## Progress` — placeholder body: `[........] 0% — 0/{total} plans complete`
     - `## Status` / `## Last Activity` — placeholder body: `_Not set._`

  d) Write the updated STATE.md back before proceeding to Step 2.

  **Load-bearing headings for parsing:** `## Phase {N} Results` (exact pattern, integer N).
  Step 2 progress recalculation relies on this heading to count completed plans. Do not rename
  or change case.

Step 2: Update STATE.md
  Read current .planning/STATE.md, then update:
  - Status: "Phase {N} executing — Plan {NN}-{PP} {complete|failed}"
  - Last Activity: "Plan {NN}-{PP} execution ({date})"
  - Add to Phase {N} Results section:
    - Plan {NN}-{PP} (Wave {W}): {plan_name} — {brief result description}
  - Recalculate Progress:
    - Count all completed plans across all phases (from Phase Results sections)
    - Total plans = sum of Plans column from ROADMAP.md progress table
    - Percentage = (completed / total) * 100, rounded to nearest integer
    - Update the progress bar: [####...] {pct}% — {completed}/{total} plans complete
  Write updated STATE.md

Schema reference: docs/schemas/summary.schema.json defines the structured format.
  When generating summaries, agents SHOULD produce data conforming to this schema
  before rendering to markdown. This enables downstream tooling to parse summaries
  programmatically. The markdown rendering is the canonical format; the schema
  documents the expected structure.

Step 2.5: Record outcome in memory (optional)
  Follow memory-manager Section 6 (Graceful Degradation) caller pattern:
  - Check if .planning/memory/OUTCOMES.md exists OR if .planning/memory/ directory exists
  - If memory is available or can be created:
    Follow memory-manager Section 3 (Store Outcome):
    - Agent: the agent that executed the plan (from the plan's agent assignment, or "autonomous")
    - Task Type: inferred from the plan's primary task types (match against agent-registry tags)
    - Outcome: "success" if plan passed, "failed" if plan failed, "partial" if plan had warnings
    - Importance: calculated per memory-manager Section 2 importance scoring
    - Tags: phase slug, agent division, primary file types modified
    - Summary: one-line from the agent's completion report (per adapter.collect_results)
  - If memory is not available: skip silently, proceed to Step 3
  - If memory write fails: output the intended record as text, continue to Step 3
  NOTE: The git add -A in Step 3 will include any memory file changes automatically.

Step 3: Create atomic git commit (success only)
  Only commit if the plan succeeded:
  git add -A
  git commit -m "feat(legion): execute plan {NN}-{PP} — {plan_name}

  Phase {N}: {phase_name}
  Wave: {W}
  Requirements: {comma-separated requirement IDs}

  {adapter.commit_signature}"

  If the plan failed: do NOT commit — leave changes unstaged for diagnosis

Step 4: Verify commit
  - Run `git log --oneline -1` to confirm the commit was created
  - If commit failed (e.g., nothing to commit): log a warning, continue
```

---

## Section 3: Wave Completion Tracking

After all plans in a wave have been processed (success or failure), update the ROADMAP.md progress table and report wave status to the orchestrator.

```
After all plans in a wave have been processed:

Step 1: Summarize wave results
  - Count: plans succeeded, plans failed, plans total in wave
  - List files modified across all plans in the wave

Step 2: Update ROADMAP.md progress table
  Read current .planning/ROADMAP.md, find the progress table:
  | Phase | Plans | Completed | Status |
  Update the row for the current phase:
  - Completed: {total completed plans so far in this phase}
  - Status: "In Progress" if more waves remain, "Complete" if this was the last wave
  Write updated ROADMAP.md

Step 3: Report wave status
  Output for the orchestrator:
  ## Wave {W} Complete
  - Plans: {succeeded}/{total} succeeded
  - Files modified: {list}
  - {If any failures: "BLOCKED — {count} plan(s) failed. See summaries for details."}
  - {If all passed: "Ready for Wave {W+1}" or "All waves complete"}
```

---

## Section 4: Phase Completion Tracking

After all waves in a phase have executed, update state to reflect the full phase outcome and prompt the user toward the review step.

```
After all waves have been executed:

Step 1: Calculate final phase status
  - All plans succeeded: phase is complete
  - Some plans failed: phase is partial (needs review)

Step 2: Update STATE.md
  - Phase: {N} of {total} (executed, pending review) | (partial — {count} plan(s) failed)
  - Status: "Phase {N} complete — all plans executed successfully"
    OR: "Phase {N} partial — {count} plan(s) failed, review needed"
  - Last Activity: "Phase {N} execution ({date})"
  - Next Action:
    - If all passed: "Run `/legion:review` to verify Phase {N}: {phase_name}"
    - If some failed: "Run `/legion:review` to diagnose failures in Phase {N}"
  Write updated STATE.md

Step 3: Update ROADMAP.md progress table
  - Status: "Complete" if all plans passed, "Partial" if some failed

Step 3.5: Suggest semantic compaction (optional)
  If all plans passed (phase is complete, not partial):
  - Check if any previous completed phases have uncompacted summaries:
    For each completed phase in ROADMAP.md:
      Check if .planning/phases/{NN-name}/{NN}-COMPACTED.md exists
      If not: count it as uncompacted
  - If uncompacted phases exist:
    Include in the output: "💡 {count} completed phase(s) have uncompacted summaries. Run compaction to free context for future planning."
  - This is informational only — never auto-compact, never block on compaction

Step 4: Final progress display
  Output for the user:
  ## Phase {N}: {phase_name} — Execution Complete
  [##########          ] {pct}% — {completed}/{total} plans complete

  | Plan | Wave | Status | Summary |
  |------|------|--------|---------|
  | {NN}-{PP} | {W} | Pass/Fail | {one-line summary} |
  ...

  Next: Run `/legion:review` to verify Phase {N}
```

---

## Section 5: Progress Calculation

Exact formula for computing and rendering the overall project progress bar. The percentage is calculated from ROADMAP.md, which is the single source of truth for plan counts.

```
To calculate overall project progress:

1. Read .planning/ROADMAP.md progress table
2. For each phase row:
   - Get "Plans" count (total plans in phase)
   - Get "Completed" count
3. Sum all "Plans" values = total_plans
4. Sum all "Completed" values = completed_plans
5. Percentage = floor((completed_plans / total_plans) * 100)
6. Progress bar:
   - 20 characters wide
   - filled = floor(percentage / 5)
   - empty = 20 - filled
   - Format: [{"#" * filled}{"." * empty}] {percentage}% — {completed}/{total} plans complete

Example:
  Phase 1: 2/2, Phase 2: 2/2, Phase 3: 2/2, Phase 4: 1/3
  Total: 7/13 = 53%
  [##########..........] 53% — 7/13 plans complete
```

Failed plans do not count toward completed_plans. Only plans whose agent returned a success result and whose atomic git commit was created are counted.

---

## Section 6: Commit Message Convention

Exact format for all git commits produced by the execution tracker. Three commit types cover the full execution lifecycle.

```
Plan completion commit (one per successful plan):
  feat(legion): execute plan {NN}-{PP} — {brief plan name}

  Phase {N}: {phase_name}
  Wave: {W}
  Requirements: {REQ-XX, REQ-YY}

  {adapter.commit_signature}

Wave completion state update (one per wave):
  chore(legion): update state after wave {W} of phase {N}

  {succeeded}/{total} plans completed
  Progress: {completed}/{total_plans} ({pct}%)

  {adapter.commit_signature}

Phase completion state update (one per phase):
  chore(legion): complete phase {N} execution — {phase_name}

  All plans executed. {succeeded}/{total} passed.
  Overall progress: {completed}/{total_plans} ({pct}%)

  {adapter.commit_signature}

Milestone completion commit (one per completed milestone):
  chore(legion): complete milestone {N} — {milestone_name}

  Phases {start}-{end}: {phase_count} phases, {plans_completed} plans
  Requirements: {requirement_count} satisfied
  Summary: .planning/milestones/MILESTONE-{N}.md

  {adapter.commit_signature}

Milestone archive commit (one per archived milestone):
  chore(legion): archive milestone {N} — {milestone_name}

  Phases moved to .planning/archive/milestone-{N}/
  STATE.md and ROADMAP.md updated

  {adapter.commit_signature}

PR creation state update (one per phase PR):
  chore(legion): create PR for phase {N} — {phase_name}

  PR #{pr_number}: {pr_url}
  Branch: {branch_name}
  Issues: #{issue_number}

  {adapter.commit_signature}
```

Scope `(legion)` is always used — never use plan-specific scopes in state commits. The brief plan name in plan completion commits comes from the `name` field in the plan's YAML frontmatter.

---

## Section 7: Error State Tracking

How to record failures in STATE.md and ROADMAP.md without corrupting existing progress data. The goal is: never lose data, never inflate the completed count, always leave a recovery path.

```
1. Failed plan in STATE.md
   Add to Phase {N} Results:
   - Plan {NN}-{PP} (Wave {W}): {plan_name} — FAILED: {brief error}

2. Failed plan in ROADMAP.md
   Do NOT increment the Completed count for failed plans
   Set Status to "Partial" if any plans in the phase have failed

3. Recovery guidance
   After recording a failure, include in Next Action:
   "Review {NN}-{PP}-SUMMARY.md for error details, then re-run /legion:build --plan {PP}"

4. Never lose data
   - Always read before writing state files (follows State Update Pattern from workflow-common.md)
   - Append results, never overwrite existing phase results
   - If STATE.md write fails: output the intended update to the user as text so no information is lost

5. Wave halting on failure
   If a plan fails in Wave {W} and subsequent waves depend on it:
   - Complete the current wave (all parallel plans in Wave {W} still run)
   - After Wave {W} settles: evaluate whether Wave {W+1} is safe to proceed
   - If the failed plan is a dependency: STOP, report blockage, do not attempt Wave {W+1}
   - Record in STATE.md: "Wave {W+1} blocked — Plan {NN}-{PP} failed (required dependency)"
```
