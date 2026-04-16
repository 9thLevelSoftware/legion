# Audit Findings — docs/control-modes.md

**Audited in session:** S02b
**Rubric version:** 1.0
**File layer:** root (reference doc)
**File length:** 107 lines
**Total findings:** 0 (clean)
**Baseline commit:** audit-v47-baseline

---

No findings. All 10 rubric categories applied; no matches crossed the finding threshold.

## Category Coverage Notes

- **CAT-1 (Open-Set Interpretation):** Modes are a closed enumeration (`autonomous`, `guarded`, `advisory`, `surgical`) with every flag spelled out in a quick-reference table. The schema at `docs/settings.schema.json` validates the value (line 66). Closed.
- **CAT-2 (Ambiguous Triggers):** Mode selection is driven by a `control_mode` key in `settings.json`, not by keyword triggers. "Use when" guidance is human-facing prose, not agent-activation logic.
- **CAT-3 (Underspecified Dispatch):** No agent dispatch logic. The doc describes runtime flag consumption by `authority-enforcer` and `wave-executor` but does not dispatch agents itself.
- **CAT-4 (Underspecified Intent):** The "Choosing the Right Mode" section (lines 99-107) is explicitly addressed to a human operator and is not a machine-consumable decision rule.
- **CAT-5 (Prohibitive Over-Reliance):** Prohibitions like "use only when you can review all changes yourself" (line 26) are framed as policy for human readers. The enforcement of `read_only` comes from flags, not from prose, so prohibitive language is not load-bearing.
- **CAT-6 (Implicit Preconditions):** The doc explicitly discloses its soft-control preconditions:
    - Line 42 flags that `read_only` is a prompt-injection constraint, not a filesystem sandbox.
    - Line 50 names the two-layer (preventive + detective) model for file-scope enforcement.
    - Lines 72-82 specify the fallback profile if `.planning/config/control-modes.yaml` is missing.
    - Line 66 specifies the default when `control_mode` is omitted.
  Preconditions for enforcement are all stated inline with explicit fallbacks.
- **CAT-7 (Maximalist Persona Language):** Doc contains no persona language.
- **CAT-8 (Unstated Acceptance Criteria):** Doc is not a check/verify surface; it is a reference.
- **CAT-9 (Response Calibration Gaps):** Not applicable to a static reference doc.
- **CAT-10 (Authority Ambiguity):** Authority flows from the YAML config file and the flag names; authority language is structural rather than prose-declarative.

### Close-call note

The "workflow-common-core settings resolution step" reference (line 70) is a cross-reference rather than an inlined rule. Compared with `LEGION-47-001` / `LEGION-47-003` (`{AGENTS_DIR}` placeholder in root files), this reference is stronger because:
1. The authoritative path is named explicitly: `.planning/config/control-modes.yaml`.
2. A complete fallback profile is stated inline.
3. The default when the key is omitted is also stated inline.

The cross-reference is therefore informational (where the code lives) rather than load-bearing (how to resolve it). No finding.
