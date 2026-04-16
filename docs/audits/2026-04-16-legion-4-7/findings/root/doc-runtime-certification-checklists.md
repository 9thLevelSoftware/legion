# Audit Findings — docs/runtime-certification-checklists.md

**Audited in session:** S02b
**Rubric version:** 1.0
**File layer:** root (reference doc)
**File length:** 66 lines
**Total findings:** 1 (0 P0, 0 P1, 0 P2, 1 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-006 — P3, CAT-8 Unstated Acceptance Criteria (suspected)

**Lines 1-66 (file-wide pattern)**

> `Use these checklists for manual verification when CI cannot prove runtime-native discovery behavior.`
>
> _(examples from the body)_
> - Line 8: "Verify the Legion commands appear with their canonical `/legion:*` names."
> - Line 16: "Trigger the prompt and confirm it reads the installed `.legion/commands/legion/start.md`."
> - Line 23: "Ask Cursor in plain language to use Legion start and confirm it reads `.legion/commands/legion/start.md`."
> - Line 30: "Restart Copilot CLI and verify `/legion-start` is discoverable via `/skills`."
> - Line 45: "Confirm plain-language Legion requests or legacy `/legion:*` aliases route to the installed `.legion/commands/legion/*.md` files."
> - Line 51: "Ask Cascade in plain language to use Legion and confirm it reads `.legion/commands/legion/start.md`."

**Issue:** Every checklist item uses a "verify/confirm/trigger" verb but none states the positive pass criterion an agent can check against. For a human operator the verbs are readable; for a 4.7 literal agent auditing install integrity (e.g., if this file is loaded as context by `/legion:validate` or a certification subagent), "appear with their canonical `/legion:*` names" depends on an enumerated list that is not present, and "reads the installed ... start.md" has no observable success signal other than self-report. Several items also carry implicit preconditions:
- "Ask ... in plain language" (CAT-2 close call): the exact prompt is not specified. A 4.7 agent will either generate a too-generic prompt or a too-specific one that doesn't match the runtime's router.
- "Discoverable via `/skills`" (CAT-8): no explicit check that the skill is *invocable*, only listed.
- "Route to the installed ... files" (CAT-8): no explicit method for verifying the route — is output inspection sufficient, or is file-access telemetry required?

Behavioral risk is P3 here because the file explicitly declares a *manual* audience ("for manual verification"), so 4.7 misreading is blast-radius-limited. It becomes P2 if a future command or skill (e.g., `/legion:validate`) begins dispatching this file as an agent checklist.

**Remediation sketch:** Add a "Pass criteria" sub-bullet under each item with an explicit observable signal. Example for line 8:

```markdown
- Verify the Legion commands appear with their canonical `/legion:*` names.
  - Pass if: running `/help` in Claude Code lists every name in
    [the canonical command set](../commands/README.md#legion-commands).
```

For "plain-language" prompts, either (a) include the exact prompt string to use, or (b) reference an accepted prompt fixture file. For agents that will be dispatched against this file, the doc should link a canonical invocation harness. Alternatively, add a header disclaimer: "This checklist is for human operators; `/legion:validate` uses a separate programmatic harness."

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** medium

---

## Category Coverage Notes

- **CAT-1 (Open-Set Interpretation):** Each runtime section has a bounded list of bullets. No open-set patterns.
- **CAT-2 (Ambiguous Triggers):** "Plain-language Legion requests" appears at lines 23, 45, 51 as a verification trigger. Consolidated into `LEGION-47-006` because the underlying defect is the same (unstated acceptance for the prompt content) rather than split into a separate CAT-2 finding.
- **CAT-3 (Underspecified Dispatch):** No dispatch.
- **CAT-4 (Underspecified Intent):** Intent per item is clear (verify file X exists / prompt Y resolves); it's the acceptance criterion that is under-specified, hence CAT-8.
- **CAT-5 (Prohibitive Over-Reliance):** None.
- **CAT-6 (Implicit Preconditions):** Each "Restart <CLI>" step has an implicit precondition that the CLI is running and the installer has completed. Low risk because the checklist order encodes the precondition sequence.
- **CAT-7 (Maximalist Persona Language):** None.
- **CAT-8 (Unstated Acceptance Criteria):** Primary finding above.
- **CAT-9 (Response Calibration Gaps):** Not applicable — checklist doc.
- **CAT-10 (Authority Ambiguity):** None — doc is advisory, not authority-declaring.
