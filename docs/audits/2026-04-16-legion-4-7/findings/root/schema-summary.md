# Audit Findings — docs/schemas/summary.schema.json

**Audited in session:** S02d
**Rubric version:** 1.0
**File layer:** root
**File length:** 72 lines
**Total findings:** 1 (0 P0, 0 P1, 1 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-010 — P2, CAT-1 Open-Set Interpretation (confirmed)

**Lines 48-58**

> "escalations": {
>   "type": "array",
>   "items": {
>     "type": "object",
>     "properties": {
>       "severity": { "type": "string", "enum": ["info", "warning", "blocker"] },
>       "type": { "type": "string" },
>       "decision": { "type": "string" },
>       "context": { "type": "string" }
>     }
>   }
> },

**Issue:** The `escalations[].type` field is an un-enumerated free string, but CLAUDE.md (Authority Matrix → Escalation Protocol → "Escalation Types" table) and `.planning/config/escalation-protocol.yaml` both define `type` as a closed set of exactly 8 values: `architecture | dependency | scope | schema | api | deletion | infrastructure | quality`. CLAUDE.md's own `<escalation>` example even shows `type: architecture | dependency | scope | schema | api | deletion | infrastructure | quality` inline as a closed pipe-list. Under 4.7 literalism an agent writing SUMMARY.md looks at *this schema* first (it is the structural contract) and finds no closure; an agent reading CLAUDE.md finds closure. The schema drifts from the documented protocol. This is **confirmed** because the divergence is already observable: a schema validator will accept `"type": "random-value"` while the protocol file will not. Peer alignment issue with LEGION-47-008 (authority-matrix exclusive_domains): the schema/protocol pair diverges on a closed-set boundary.

Severity P2 rather than P1 because SUMMARY.md consumers (wave-executor handoff extraction) currently do not branch on `escalations[].type`; the risk is forward-looking (future skills that filter or dispatch on type) and documentary (contract drift). Also note `severity` is correctly enumerated here (`info|warning|blocker`), demonstrating the pattern is understood for the adjacent field.

**Remediation sketch:** Add `"enum": ["architecture", "dependency", "scope", "schema", "api", "deletion", "infrastructure", "quality"]` to `escalations[].type`. If the authoring team wants an extension hatch, include a final `"other"` value and require a companion `type_detail` string, but prefer the strict 8-value set to match the protocol. Fix alongside LEGION-47-008 and any CLAUDE.md edits so schema + protocol + root doc agree.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## Category Coverage Notes

- **Interaction surface:** `title`, root `description`, enum arrays on `outcome`, `completed_tasks[].status`, `escalations[].severity`. No per-field descriptions.
- **CAT-1 (confirmed above, P2):** `escalations[].type` drifts from CLAUDE.md and `escalation-protocol.yaml`.
- **CAT-1 close-call — `decisions_made`, `files_modified`, `handoff_context.key_outputs/conventions_established/open_questions`, `verification_results[].command`:** all free strings/arrays. These are intentionally free-form (narrative handoff context); no authoritative closed set exists. Not filed.
- **CAT-4:** Root description ("Schema for SUMMARY.md structured content") states what the schema is, not what it is for, but the purpose is directly derivable from the filename convention and the AGENTS.md "SUMMARY.md export standard" reference. Close-call; not filed since a reader in ambiguity has a 1-sentence lookup path.
- **CAT-6 close-call — `handoff_context`:** consumers (wave-executor) read specific sub-keys. Schema does not state which keys are required for downstream consumption. Not filed against the schema: the consumer contract belongs to `skills/wave-executor/SKILL.md` (S08).
- **CAT-8:** `outcome` and `completed_tasks[].status` provide closed done-state enumerations.
- **CAT-2, CAT-3, CAT-5, CAT-7, CAT-9, CAT-10:** N/A.
