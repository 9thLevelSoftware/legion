# Audit Findings — skills/ship-pipeline/SKILL.md

**Audited in session:** S09
**Rubric version:** 1.0
**File layer:** skill
**File length:** 356 lines
**Total findings:** 4 (4 P2)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-195 — P2, CAT-1 Open-Set Interpretation (confirmed)

**Lines 96-100**

> Use AskUserQuestion:
>   "Pre-ship gate failed at: {check_name}. What next?"
>   - "Fix and retry" (Recommended)
>   - "Show all check results" — run remaining checks and display full report
>   - "Ship anyway" — skip gate (user takes responsibility)

**Issue:** Closed three-option AskUserQuestion with "Ship anyway — skip gate (user takes responsibility)" as the third option. Two defects compound: (a) Per the AskUserQuestion free-text / closed-set pattern (peers LEGION-47-012, 016, 040, 093, 117, 120, 127, 133, 138, 150, 162), the third option bypasses the gate entirely without any escalation boundary. There is no "Ship with waiver requiring approval" path — only silent bypass. (b) The wording "user takes responsibility" is rhetorical cover for CAT-10 authority-ambiguity: `/legion:ship` is explicitly listed in the Authority Matrix's "Human Approval Required" column for deployment configuration changes — ship is a high-authority action, so the skill should at minimum log the bypass, create a git note, or write to REVIEW.md. None of that is specified. (c) No closure ("these are the only three options") — 4.7 may propose a fourth option "Defer to later" or "Open PR anyway without ship tag".

**Remediation sketch:** (a) Wrap in `AskUserQuestion` tool invocation per CLAUDE.md mandate. (b) Restrict to three explicit options, add closure: "Choose one of the three options below. Do not propose alternatives." (c) For "Ship anyway": require secondary confirmation AskUserQuestion ("Confirm gate bypass. This will be logged to .planning/phases/{NN}/SHIP-REPORT.md as `gate_bypass: true` with reason required."); capture free-text bypass reason via the adapter.prompt_free_text primitive (blocked by the S03 contract decision). (d) Log bypass event to a persistent audit file (e.g., `.planning/audit/ship-bypass.log`). Cross-reference LEGION-47-150, 162 for the closed-set cluster and LEGION-47-176 for the authority carve-out.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-196 — P2, CAT-8 Unstated Acceptance Criteria (suspected)

**Lines 77-86, 145-177**

> Check 6: Clean Working Tree
>   How to verify:
>     Run `git status --porcelain` in the project root.
>     Check for any output (uncommitted changes).
>   Pass criteria: git status --porcelain produces no output
>   ...
> Step 6: Write SHIP-REPORT.md
>   Write the aggregated report to .planning/phases/{NN}/SHIP-REPORT.md:

**Issue:** Check 6 "Clean Working Tree" passes only when `git status --porcelain` produces no output. Section 2 Step 6 then writes SHIP-REPORT.md to `.planning/phases/{NN}/SHIP-REPORT.md`. After Section 2 writes, the working tree is no longer clean — any caller running Check 6 again would fail. This matters because: (a) Section 4 Canary Monitoring may re-invoke the gate or verification_commands and the tree state drifts during the ship flow itself. (b) If ship-pipeline is re-entered after partial failure (e.g., PR creation failed after SHIP-REPORT.md was written), Check 6 will always fail until the SHIP-REPORT.md is committed. (c) No rule for whether SHIP-REPORT.md should be committed or remain as generated artifact. Exit-condition state-partition gap peer LEGION-47-054, 151, 161, 202.

**Remediation sketch:** (a) Decide SHIP-REPORT.md policy: commit as part of ship flow OR add to `.gitignore`. State the decision explicitly. (b) If commit: add Step 6b "git add + git commit SHIP-REPORT.md with message `chore(ship): phase {NN} ship report`" AFTER all other steps; treat Check 6 as applying to pre-ship state only. (c) If gitignore: add entry to project template .gitignore AND have Check 6 skip SHIP-REPORT.md from the porcelain scan. (d) Add acceptance criteria block at end of Section 1: "Pre-ship gate is complete when all 6 checks pass OR user has explicitly selected 'Ship anyway' via AskUserQuestion. Section 2 starts from a known-clean state." Cross-reference LEGION-47-054, 151 exit-condition cluster.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-197 — P2, CAT-6 Implicit Preconditions (suspected)

**Lines 113-177, 351-356**

> Step 1: Collect files modified
>   For each SUMMARY.md in the phase:
>     Extract the "Files Modified" section.
>     Build a deduplicated, sorted list of all files.
> ...
> Step 4: Collect review findings
>   From REVIEW.md:
>     - Total findings by severity (BLOCKER, WARNING, INFO)
>     - Resolution status counts (resolved, deferred, accepted)
> ...
> | Verification Commands | plan-schema v6.0 frontmatter | Section 1 Check 4, Section 4 |

**Issue:** Multiple implicit preconditions: (a) Step 1 assumes SUMMARY.md has a "Files Modified" section — but the wave-handoff SUMMARY.md contract (S08) says sections are advisory with graceful degradation; if the section is missing, the Extract silently returns empty and ship proceeds with empty file list. (b) Step 4 assumes REVIEW.md has structured severity fields — but review-loop and review-panel do not emit a parsable severity schema (LEGION-47-149, 164). (c) L351 references "plan-schema v6.0 frontmatter" — plans-schema.json audit (S02d) does not confirm v6.0 frontmatter has `verification_commands`; if the plan was generated before v6.0, Check 4 has nothing to execute and silently passes. (d) Step 3 L128 "From Check 5 output (test suite), extract: Total tests, passed, failed, skipped" — but Check 5 L71 only runs adapter.test_command and captures exit code, not structured test counts; this is a format mismatch.

**Remediation sketch:** (a) Add a "Precondition verification" subsection at the start of each Step: check that required sections exist in the source files; if missing, emit <escalation severity: blocker, type: scope>. (b) Step 1: If SUMMARY.md lacks "Files Modified" section, emit escalation + stop ship — do not ship with unknown file surface. (c) Step 3: Either parse test-runner-specific output (require test_command to produce JUnit XML / TAP / structured output) or drop the Total/Passed/Failed/Skipped breakdown in favor of just the exit code. (d) L351 add exact plan-schema reference: "plan-schema.json v6.0, property `verification_commands` at line NN". If plan frontmatter missing verification_commands, emit escalation. Cross-reference LEGION-47-163 precondition-verification cluster.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** medium

---

## LEGION-47-198 — P2, CAT-3 Underspecified Dispatch (suspected)

**Lines 231-308**

> Schedule: Run health checks at 1 minute, 5 minutes, and 15 minutes after deploy.
> ...
> Step 5: Route based on status
>   If HEALTHY and interval < 15min:
>     Log: "Canary healthy at {interval}. Next check at {next_interval}."
>     Wait for next interval.
> ...
> User can exit canary monitoring early via Ctrl+C at any time.

**Issue:** Canary monitoring "Schedule: Run health checks at 1, 5, 15 minutes after deploy" requires the skill to run for ≥15 minutes with three wait-for-next-interval checkpoints. This is fundamentally incompatible with 4.7's per-turn execution model: (a) No adapter primitive is specified for scheduled re-invocation; Claude Code can Bash-sleep in a loop but that pins the turn for 15 minutes, consuming API time and blocking the user. (b) No dispatch specification for how the calling /legion:ship command returns control while canary runs. (c) L308 "User can exit canary monitoring early via Ctrl+C" — Claude Code agent loop has no Ctrl+C handler; this is prose describing a feature that does not exist in the harness. (d) No integration with scheduling/cron primitives (e.g., ScheduleWakeup in Claude Code's tool surface, or systemd timers for other adapters). Peer of LEGION-47-180 dispatch-specification cluster.

**Remediation sketch:** (a) Replace inline wait-loop with a scheduling primitive contract: "Canary monitoring MUST be dispatched via adapter.schedule_followup (new primitive). If adapter.schedule_followup is not available: emit warning 'Canary monitoring requires scheduled re-invocation; this adapter does not support it. Run /legion:ship --canary after 1/5/15 minutes manually.'" (b) Remove L308 "Ctrl+C" language; replace with "User can cancel canary monitoring by running /legion:ship --cancel-canary." (c) Document adapter.schedule_followup in adapters/*.md (add to S16 scope). (d) For Claude Code specifically, declare ScheduleWakeup primitive binding. Cross-reference wave-executor parallel contract and LEGION-47-180.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** medium

---
