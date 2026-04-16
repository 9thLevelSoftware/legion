# Audit Findings — .planning/config/intent-teams.yaml

**Audited in session:** S02c
**Rubric version:** 1.0
**File layer:** root (config YAML)
**File length:** 444 lines
**Total findings:** 0 (clean, with cross-cutting observation)
**Baseline commit:** audit-v47-baseline

---

No findings. The file internally is consistent and closed. A cross-cutting observation about coverage gaps against root-file claims is recorded below.

## Category Coverage Notes

- **CAT-1 (Open-Set Interpretation):** Five intents (`harden`, `document`, `skip-frontend`, `skip-backend`, `security-only`) are a closed set. Each has a closed `agents` list, closed `domains` list, and closed `filter` rules.
- **CAT-2 (Ambiguous Triggers):** `nl_patterns` (lines 125-204) is the authoritative keyword registry for intent triggers. Each intent has a closed keyword list with numeric weights (1.0 / 0.9 / 0.7 / ...) and a closed phrase-template list. `command_routes` (lines 210-331) mirrors this structure for the 8 Legion commands. Triggers are fully enumerated here; this is *the* file that resolves CAT-2 drift risks elsewhere.
- **CAT-3 (Underspecified Dispatch):** Each intent's dispatch (primary/secondary agents or filter rules) is fully specified. Mode field (`ad_hoc`, `filter_plans`, `filter_review`) is consumed by the intent-router skill; the skill's own audit will determine whether it documents the modes.
- **CAT-4 (Underspecified Intent):** Each intent has a description and either `agents` or `filter`, not both optional.
- **CAT-5 (Prohibitive Over-Reliance):** `mutual_exclusion` (lines 90-96) pairs every prohibition with an explicit error message; the positive path is stated via `allowed_combinations` (lines 115-119).
- **CAT-6 (Implicit Preconditions):** Line 335 explicitly declares the interpolation contract: "Placeholders `{phase}`, `{phase_name}`, `{next_phase}` are interpolated at runtime from STATE.md". The precondition (STATE.md must exist and carry those fields) is stated inline.
- **CAT-7 (Maximalist Persona Language):** None.
- **CAT-8 (Unstated Acceptance Criteria):** `validation` section (lines 89-119) encodes acceptance criteria as mutual_exclusion + requires_command + allowed_combinations. Explicit.
- **CAT-9 (Response Calibration Gaps):** N/A — machine-consumed config.
- **CAT-10 (Authority Ambiguity):** None.

### Cross-cutting observation (scope expansion against LEGION-47-002/004/005)

This file is the authoritative keyword registry. Intents with `nl_patterns` coverage: `harden`, `document`, `skip-frontend`, `skip-backend`, `security-only`. Commands with `command_routes` coverage: `start`, `plan`, `build`, `review`, `status`, `quick`, `advise`, `explore`.

`CLAUDE.md` (line 110), `AGENTS.md` (line 110), and `README.md` (line 854-855) reference "marketing keywords" and "design keywords" as workflow-activation triggers. **These keyword sets do not exist in this registry.** The root files claim activation triggers that have no canonical source.

This elevates the practical severity of `LEGION-47-002` / `LEGION-47-004` / `LEGION-47-005`: the remediation sketches ("cross-reference `.planning/config/intent-teams.yaml` as the authoritative trigger list") presumed the keywords exist here — they don't. The remediation plan now has two tracks:

1. **Either** drop the keyword-trigger language in the three root files and restrict activation to `MKT-*` / `DSN-*` requirement prefixes (simplest); or
2. **Add** `marketing` and `design` intent entries to this file's `nl_patterns` with keyword + phrase coverage matching the existing intents.

Recorded here rather than as a new finding because the defect is resolved in the remediation of `LEGION-47-002`/`004`/`005` — those findings' `remediation_sketch` fields should be updated (via REMEDIATION.md, not by re-audit) to reflect that option (1) is now the strongly preferred path.
