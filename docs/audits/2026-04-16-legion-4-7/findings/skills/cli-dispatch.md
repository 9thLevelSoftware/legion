# Audit Findings — skills/cli-dispatch/SKILL.md

**Audited in session:** S06
**Rubric version:** 1.0
**File layer:** skill
**File length:** 434 lines
**Total findings:** 5 (5 P2)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-110 — P2, CAT-3 Underspecified Dispatch (confirmed, re-filed from S05 deferred cross-cut)

**Lines 126-172** (Section 3: Prompt Construction Template)

> Part 1: Agent personality
>   - Identify the assigned agent from the plan or task
>   - Read the ENTIRE agent .md file: agents/{agent-id}.md
>   - Capture as PERSONALITY_CONTENT
> ...
> Assemble the final prompt using this exact template:
>
> ---
> {PERSONALITY_CONTENT}
>
> ---
>
> # Dispatch Task
>
> {HANDOFF_CONTEXT}
> {CONTROL_SCOPE}
>
> ## Task
>
> {TASK_DESCRIPTION}
>
> {RESULT_INSTRUCTION}
> ---

**Issue:** Re-filing S05 deferred cross-cut (original content preserved from SESSIONS.md S05 deferred-cross-cuts block). `model_tier` is declared in `agent-registry:147`, passed by `phase-decomposer:459`, and set to `execution` by `review-evaluators:1259` — but this file (cli-dispatch Section 3) never reads it. Section 3 constructs the prompt from PERSONALITY_CONTENT + TASK_DESCRIPTION + RESULT_INSTRUCTION + CONTROL_SCOPE + HANDOFF_CONTEXT with no `model_tier` lookup. The Claude-Code adapter's `spawn_agent_personality` row hardcodes `model: {model_execution}` for every spawn. Net effect: all declared model tiers collapse to `model_execution` (sonnet), regardless of what agents or plans declare. Maintainers adding `model_tier` to new agents accumulate dead metadata. This is the CAT-3 defect because model selection is a dispatch-time decision that this skill silently drops. Confirmed via upstream evidence.

**Remediation sketch:** Two paths. Path A (wire it through): add a Part 6 to Section 3: "Part 6: Model tier — read `model_tier` from agent frontmatter (default: `execution`); map to `adapter.model_{tier}`; substitute `{model}` into the adapter's spawn row". Update each adapter's `spawn_agent_personality` row to use `model: {model}` instead of hardcoded `{model_execution}`. Path B (delete dead metadata): remove `model_tier` declarations from `agent-registry:147`, `phase-decomposer:459`, `review-evaluators:1259`. See `proposals/per-command-model-override.md` if present. Path A is correct long-term.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** medium

---

## LEGION-47-111 — P2, CAT-6 Implicit Preconditions (confirmed)

**Line 134**

> Part 1: Agent personality
>   - Identify the assigned agent from the plan or task
>   - Read the ENTIRE agent .md file: agents/{agent-id}.md
>   - Capture as PERSONALITY_CONTENT

**Issue:** Bare `agents/{agent-id}.md` path. This directly contradicts `skills/workflow-common/SKILL.md` line 199 ("All personality reads use `{AGENTS_DIR}/{agent-id}.md` — never bare `agents/{agent-id}.md`") and `skills/workflow-common-core/SKILL.md` lines 80-94 (AGENTS_DIR Resolution Protocol). A 4.7 reader following this file in isolation will attempt to read `agents/{agent-id}.md` relative to CWD, which succeeds only in local-dev mode and fails in all npm-installed-Legion deployments where agents live under `~/.claude/agents/`. Pre-existing defect; paired with LEGION-47-091.

**Remediation sketch:** Replace bare path with resolution protocol: "Read the ENTIRE agent .md file at `{AGENTS_DIR}/{agent-id}.md`, where AGENTS_DIR is resolved per workflow-common-core Agent Path Resolution Protocol (run once per command invocation before any personality file read)."

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-112 — P2, CAT-3 Underspecified Dispatch (confirmed)

**Lines 242-248**

> Step 4: Execute the command
>   - Run the command via the Bash tool
>   - Set timeout to the adapter's timeout_ms value
>   - For parallel dispatches (multiple tasks in the same wave):
>     Use run_in_background: true on the Bash tool call
>     Do NOT use run_in_background for single-task dispatches
>   - Capture stdout and stderr for fallback use

**Issue:** "For parallel dispatches ... Use run_in_background: true" does not address the fan-out mechanism. `run_in_background: true` allows ONE Bash call to return immediately, but the section does not specify that the caller must issue multiple Bash calls in a single LLM response to achieve true parallelism. Same CAT-3 family as LEGION-47-101 (wave-executor Section 4) — Bash tool calls across turns serialize execution. Also, "Do NOT use run_in_background for single-task dispatches" contradicts the output-redirection convention in `workflow-common/SKILL.md` L481-503 which does not restrict `run_in_background` by task count. Authority conflict between dispatch skill and common conventions.

**Remediation sketch:** Specify: "For N parallel dispatches, issue N Bash tool calls in the SAME LLM response block, each with `run_in_background: true`. The CLI harness executes same-response Bash calls concurrently. In a subsequent response, issue a single Bash call to `wait` on all background PIDs OR poll the result files with a bounded timeout. Do not split the N background spawns across turns — this serializes."

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** small

---

## LEGION-47-113 — P2, CAT-8 Unstated Acceptance Criteria (suspected)

**Lines 303-339**

> ## Section 6: Control Mode Behavior
>
> How the current control_mode setting affects dispatch behavior.
>
> | Control Mode | Dispatch Behavior |
> |-------------|-------------------|
> | `autonomous` | Full dispatch permitted. Prompt includes task scope but no file restrictions. CONTROL_SCOPE is omitted from the prompt. |
> ...
> | `surgical` | Dispatch restricted to read-only assessments only. Implementation tasks (capabilities: code_implementation, refactoring, bug_fixing) fall back to internal agent. CONTROL_SCOPE instructs the CLI to produce recommendations only. |

**Issue:** `surgical` mode's "fall back to internal agent" has no defined completion criterion. When is the fallback "done"? Does the internal agent inherit the task type (which was surgical), or does it reset to guarded? If the internal agent itself produces a result, does that result go through Section 5 Result Collection (which expects a result file written by the external CLI) or a different path? These are unspecified. Additionally, the table's `guarded` row says "CONTROL_SCOPE advises the CLI to stay within listed files but does not hard-block" — "hard-block" is undefined: what would hard-blocking even look like in dispatch, given the CLI is an opaque subprocess? A 4.7 reader has no completeness gate.

**Remediation sketch:** Add a done-state block: "Section 6 is complete when (1) CONTROL_SCOPE has been assembled per the mode's template (L320-338), OR (2) for surgical+implementation combinations: the task is handed off to internal agent execution via wave-executor Section 4 (single plan), AND the SUMMARY.md for the plan is written by the internal agent. Internal-agent fallback inherits `guarded` mode for the fallback execution — record the mode switch in SUMMARY.md ## Mode Transitions."

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-114 — P2, CAT-2 Ambiguous Triggers (suspected)

**Lines 75-123** (Section 2: Capability Matching Algorithm)

> Priority 2: Category match
>   - Use the division → capability affinity table below to map task division to related capabilities
>   - If no exact match was found, check if any CLI's capabilities include an affinity capability for the task's division
>   - If a match is found: select it (with a note that this is a category match, not exact)
>
>   Division → Capability Affinity:
>   | Division          | Affinity Capabilities                              |
>   |-------------------|----------------------------------------------------|
>   | Engineering  …
>   | Testing           | testing, code_review, performance_analysis         |
>   | Marketing         | documentation, web_search                          |
>   | Product           | documentation, ux_research                         |
>   | Project Management| documentation, large_analysis                      |
>   | Support           | large_analysis, security_audit, documentation      |
>   | Spatial Computing | code_implementation, ui_design                     |
>   | Specialized       | large_analysis, code_review                        |

**Issue:** Division values in this table (Engineering, Testing, Marketing, Product, Project Management, Support, Spatial Computing, Specialized — 8 divisions) mismatch `workflow-common/SKILL.md` L508-518 Division Constants which declares 9 divisions including Design. The Design division is absent from this affinity table. Any task in division=Design falls through Priority 2 and goes to "Priority 3: Internal fallback" — silently, with no log that explains why. Additionally, the "Specialized" affinity row only lists `large_analysis, code_review` but the Specialized division contains Polymath (exploration), agents-orchestrator (orchestration), data-analytics-engineer, lsp-index-engineer — none matches `large_analysis, code_review` well. Ambiguous trigger because the affinity-match condition ("CLI's capabilities include an affinity capability") is not testable without a division-to-affinity registry that is complete.

**Remediation sketch:** (a) Add Design division row with explicit affinity capabilities (e.g., `ui_design, documentation`). (b) Audit each division's affinity list against actual agent roster to ensure affinity captures the division's work. (c) Add a fallthrough log: "Priority 2 no match for division={D} — no affinity capabilities in table. Routing to Priority 3 internal fallback." This makes the silent fallthrough observable.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---
