# Audit Findings — .planning/config/directory-mappings.yaml

**Audited in session:** S02c
**Rubric version:** 1.0
**File layer:** root (config YAML)
**File length:** 85 lines
**Total findings:** 0 (clean)
**Baseline commit:** audit-v47-baseline

---

No findings. Prose fields (`description`, `examples`) are short, scoped, and closed.

## Category Coverage Notes

- **CAT-1 (Open-Set Interpretation):** Mappings are a closed set (commands, skills, agents, adapters, tests, bin, planning). Each has an explicit `paths`, `pattern`, `description`, and `examples` list.
- **CAT-2 (Ambiguous Triggers):** No triggers — file is a directory taxonomy.
- **CAT-3 (Underspecified Dispatch):** No dispatch.
- **CAT-4 (Underspecified Intent):** Each mapping states its purpose in one line.
- **CAT-5 (Prohibitive Over-Reliance):** `enforcement.strictness: warn` (line 81) is a positive declaration.
- **CAT-6 (Implicit Preconditions):** The `generated: 2026-03-05` stamp and `source: CODEBASE.md` header make the precondition explicit — this file is auto-generated and may drift from source.
- **CAT-7 (Maximalist Persona Language):** None.
- **CAT-8 (Unstated Acceptance Criteria):** Not a check surface.
- **CAT-9 (Response Calibration Gaps):** N/A.
- **CAT-10 (Authority Ambiguity):** None.

### Close-call note

Line 84: `"CLAUDE.md"     # Root config files exempt`. The trailing comment calls out "root config files" (plural) but the exception list only enumerates `CLAUDE.md`. Under strict 4.7 literalism, an agent applying the exception would include `CLAUDE.md` only and treat `AGENTS.md` / `README.md` as subject to enforcement.

This is below finding threshold because:
1. Enforcement strictness is `warn`, not `error` — a false positive is a warning, not a block.
2. The `AGENTS.md` / `README.md` files happen to live at the repo root where no mapping rule would classify them anyway.
3. The comment could be read as documenting *rationale* ("CLAUDE.md is an example of a root config file") rather than extensibility.

If enforcement is ever tightened, this comment/list mismatch should be flipped: either the exception list should include all root config files (CLAUDE.md, AGENTS.md, README.md), or the comment should be rewritten to describe what is actually listed.
