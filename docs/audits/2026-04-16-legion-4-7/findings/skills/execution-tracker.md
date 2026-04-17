# Audit Findings — skills/execution-tracker/SKILL.md

**Audited in session:** S08
**Rubric version:** 1.0
**File layer:** skill
**File length:** 301 lines
**Total findings:** 4 (0 P0, 0 P1, 4 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-145 — P2, Implicit Preconditions (suspected)

**Lines 49-60**

> Step 2: Update STATE.md
>   Read current .planning/STATE.md, then update:
>   - Status: "Phase {N} executing — Plan {NN}-{PP} {complete|failed}"
>   - Last Activity: "Plan {NN}-{PP} execution ({date})"
>   - Add to Phase {N} Results section:
>     - Plan {NN}-{PP} (Wave {W}): {plan_name} — {brief result description}
>   - Recalculate Progress:
>     - Count all completed plans across all phases (from Phase Results sections)

**Issue:** Step 2 writes to structured sections of STATE.md ("Status", "Last Activity", "Phase {N} Results", progress bar line) but does not define create-if-missing semantics for any of them. 4.7 literal reader hitting a STATE.md where "Phase {N} Results" heading does not yet exist (first plan of a new phase) will either (a) fail the update silently, (b) append to an arbitrary position, or (c) create a malformed structure. "Count all completed plans across all phases (from Phase Results sections)" implies parseable structure that Step 2 does not enforce or verify. Peer to the S07 state-write precondition cluster; distinguishes itself by owning the canonical Plan-completion write path that every wave routes through.

**Remediation sketch:** Add a Step 1.5 "Verify or initialize STATE.md structure" that (a) reads STATE.md, (b) checks for required sections (Status, Last Activity, Phase {N} Results — one per known phase, Progress), (c) creates missing sections in canonical order with empty placeholders, (d) fails fast with a named error if STATE.md is absent. Cross-reference a STATE.md schema doc (or inline the expected layout) so Step 2 writes have a deterministic target. Document which section headings are load-bearing for the "Count all completed plans" parse in Step 2.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** medium

---

## LEGION-47-146 — P2, Authority Ambiguity (suspected)

**Lines 33, 291-293**

> The tracker never modifies plan output files — it only touches STATE.md, ROADMAP.md, and git history
> ...
> 4. Never lose data
>    - Always read before writing state files (follows State Update Pattern from workflow-common.md)
>    - Append results, never overwrite existing phase results
>    - If STATE.md write fails: output the intended update to the user as text so no information is lost

**Issue:** execution-tracker writes to STATE.md, ROADMAP.md, and creates atomic commits on every plan. These are shared state-file writes AND git history mutations — both listed under CLAUDE.md Authority Matrix as autonomous only when the change is within the plan's `files_modified`. The skill writes to global project state files that by definition are not listed in any individual plan's `files_modified`. No reference to the Authority Matrix, no escalation protocol hook for failed writes (L293 "output the intended update to the user as text" is not a structured <escalation>). A 4.7 reader under guarded control mode may either (a) refuse to write STATE.md because it's out-of-scope for the plan, or (b) write without awareness of boundary verification — both violate the matrix. Peer to authority-enforcer Section 11 domain (S08 sibling file) which verifies file scope; execution-tracker does not acknowledge being a legitimate scope-expansion case.

**Remediation sketch:** (a) Add a Section 0 or Section 1.1 "Authority Context" declaring execution-tracker as an authorized state-file writer exempt from plan-level `files_modified` scope, with explicit list of writable paths (STATE.md, ROADMAP.md, {NN}-SUMMARY.md outputs, memory files). (b) Cross-reference authority-enforcer Section 11 edge cases so boundary verification does not flag STATE.md/ROADMAP.md as violations. (c) Replace L293 "output ... as text" with structured `<escalation>` block per escalation-protocol.yaml (severity: warning, type: infrastructure). (d) State write-failure handling per escalation-protocol.yaml rather than ad-hoc text.

**Remediation cluster:** `authority-language`
**Effort estimate:** small

---

## LEGION-47-147 — P2, Trigger Ambiguity (suspected)

**Lines 68-81**

> Step 2.5: Record outcome in memory (optional)
>   Follow memory-manager Section 6 (Graceful Degradation) caller pattern:
>   - Check if .planning/memory/OUTCOMES.md exists OR if .planning/memory/ directory exists
>   - If memory is available or can be created:
>     Follow memory-manager Section 3 (Store Outcome):
>     ...
>   - If memory is not available: skip silently, proceed to Step 3
>   - If memory write fails: output the intended record as text, continue to Step 3

**Issue:** Three conflated conditions: "(a) OUTCOMES.md exists", "(b) memory/ directory exists", "(c) can be created" — no precedence. 4.7 reader sees OR branching with no tie-break. Case: neither file nor directory exists. Rule (c) "can be created" has no definition of permission check. If the agent creates the directory on best effort and writes fail downstream, the Step 2.5 state is now polluted without a consistent rollback. "Memory is available" and "can be created" bundle together — under permissive reading the agent creates directories liberally; under strict reading it never creates them. Same-class issue as CAT-8 stale triggers in memory-manager (future S10 session), surfaced here at first consumer. Also: "Importance: calculated per memory-manager Section 2 importance scoring" defers acceptance criteria to a subsection of a different skill — if that section has its own CAT-8 defect, it propagates.

**Remediation sketch:** (a) Replace three-condition OR with explicit precedence: "Check OUTCOMES.md → if exists, proceed. Else check .planning/memory/ directory → if exists, create OUTCOMES.md with header and proceed. Else skip Step 2.5 entirely — do NOT create the directory from here." (b) Define "memory write fails" as a concrete file-system ENOENT/EACCES/EEXIST handling table. (c) Replace L80 "output the intended record as text" with a structured `<escalation>` block or write to a fallback path (`.planning/memory/OUTCOMES-unflushed.log`). (d) Cross-link the importance-scoring citation so memory-manager Section 2 is explicitly the canonical owner; any CAT-8 defect there blocks this trigger.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---

## LEGION-47-148 — P2, Unstated Acceptance Criteria (suspected)

**Lines 155-165**

> Step 3.5: Suggest semantic compaction (optional)
>   If all plans passed (phase is complete, not partial):
>   - Check if any previous completed phases have uncompacted summaries:
>     For each completed phase in ROADMAP.md:
>       Check if .planning/phases/{NN-name}/{NN}-COMPACTED.md exists
>       If not: count it as uncompacted
>   - If uncompacted phases exist:
>     Include in the output: "💡 {count} completed phase(s) have uncompacted summaries. Run compaction to free context for future planning."
>   - This is informational only — never auto-compact, never block on compaction

**Issue:** Trigger "For each completed phase in ROADMAP.md" depends on ROADMAP.md having a parseable "completed" marker — but Section 3 (L114-120) only writes "Status: Complete" on the current phase, leaving previous phases' status undefined by this skill's contract. 4.7 reader may (a) parse no phases as completed because ROADMAP.md format is not specified here, (b) count the current just-completed phase which has no COMPACTED.md by design, (c) surface false positives. Acceptance criterion "informational only — never auto-compact" is clean but the detection side is not — the suggestion's value depends on accurate counting that the skill does not enforce. Similar to acceptance-criteria defects logged in S06/S07.

**Remediation sketch:** (a) Define the "completed phase" predicate precisely: "a phase whose ROADMAP.md Status column is 'Complete' AND whose {NN}-REVIEW.md exists with Result: PASSED". (b) Exclude the just-completed current phase from the uncompacted scan — compaction is a deferred action, not an immediate one. (c) Cross-reference a compaction skill or section (if one exists) for the canonical "compacted" predicate; otherwise mark Step 3.5 as TODO until the contract exists. (d) Specify counter bounds — if the count is zero, omit the suggestion entirely (do not print "💡 0 completed phase(s)").

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---
