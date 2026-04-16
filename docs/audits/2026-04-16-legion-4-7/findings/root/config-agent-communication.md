# Audit Findings — .planning/config/agent-communication.yaml

**Audited in session:** S02c
**Rubric version:** 1.0
**File layer:** root (config YAML)
**File length:** 189 lines
**Total findings:** 1 (0 P0, 0 P1, 1 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-007 — P2, CAT-4 Underspecified Intent (suspected)

**Lines 151-161 (`orchestrator_mediation.protocol`)**

> ```yaml
>   orchestrator_mediation:
>     description: "When a Wave 2+ agent finds missing context, it documents gaps as open_questions"
>     rationale: >
>       Rather than blocking on missing information, agents document what they
>       need. The orchestrator or human reviews these gaps between builds.
>     protocol:
>       - "Agent checks handoff context for expected inputs"
>       - "If input is missing or ambiguous, agent documents an open_question"
>       - "Agent proceeds with best-effort approach using available context"
>       - "Open questions are surfaced in SUMMARY.md for resolution"
> ```

**Issue:** The third protocol step instructs the agent to "proceed with best-effort approach using available context" without defining what "best-effort" means. Under 4.7 literalism this phrase supports at least four divergent interpretations:

1. **Stall:** "I have no input, so best-effort is to do nothing and log an open_question." (Defensible but underproductive.)
2. **Speculate:** "Best-effort means simulating the missing input using plausible values." (Risky — fabricates work.)
3. **Conservative default:** "Best-effort means applying a conservative default where one exists and halting where none does." (Reasonable but not stated.)
4. **Escalate:** "Best-effort means raising an escalation (per sibling `escalation-protocol.yaml`) rather than proceeding." (Contradicts the protocol's explicit "rather than blocking".)

None of these is named; the rationale explicitly rules out (4). Different Wave-2+ agents running under 4.7 will land in different buckets, producing inconsistent cross-wave behavior on the exact orchestration failure mode the protocol is designed to handle.

**Remediation sketch:** Replace the single "best-effort" bullet with a small decision tree, for example:

```yaml
    protocol:
      - "Agent checks handoff context for expected inputs"
      - "If input is missing or ambiguous, agent documents an open_question"
      - "If a conservative default exists for the missing input, agent applies it and documents the default choice in the open_question"
      - "If no conservative default exists, agent halts the specific task, continues with other in-scope tasks, and escalates severity=warning per escalation-protocol.yaml"
      - "Open questions are surfaced in SUMMARY.md for resolution"
```

This keeps the non-blocking spirit of the original while giving 4.7 a deterministic rule for each missing-input case.

**Remediation cluster:** `intent-front-loading`
**Effort estimate:** small

---

## Category Coverage Notes

- **CAT-1 (Open-Set Interpretation):** Three message types (`handoff_context`, `dependency_request`, `status_update`), four required sections for SUMMARY.md, four statuses. All closed.
- **CAT-2 (Ambiguous Triggers):** No keyword triggers. The `<escalation>` block tag is literal.
- **CAT-3 (Underspecified Dispatch):** Wave-executor dispatch is explicit per message type. The `orchestrator_mediation` rule is where the under-specification lives — captured in `LEGION-47-007` under CAT-4 because the failure is intent (what to do) not dispatch (who does it).
- **CAT-4 (Underspecified Intent):** Primary finding above.
- **CAT-5 (Prohibitive Over-Reliance):** `no_runtime_messaging` (line 143) pairs prohibition with explicit replacement ("artifact-based communication (SUMMARY.md)").
- **CAT-6 (Implicit Preconditions):** Cross-references to `escalation-protocol.yaml` and plan frontmatter schema are named but not inlined. Acceptable because maintenance note at line 188 names the dependency.
- **CAT-7 (Maximalist Persona Language):** None.
- **CAT-8 (Unstated Acceptance Criteria):** SUMMARY.md template has required_sections explicitly.
- **CAT-9 (Response Calibration Gaps):** N/A.
- **CAT-10 (Authority Ambiguity):** None.
