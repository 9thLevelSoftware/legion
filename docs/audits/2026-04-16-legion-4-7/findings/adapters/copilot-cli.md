# Audit Findings: adapters/copilot-cli.md

**File:** `adapters/copilot-cli.md`
**Auditor:** S16 CLI Adapters Session
**Date:** 2026-04-16

## Findings

### LEGION-47-458 [P2] CAT-3: No fallback for background delegation coordination

**Location:** Tool Mappings table, `coordinate_parallel` row

**Issue:** The adapter mentions background delegation (`&`) can run plans in the cloud but "without coordination." There is no escape valve or guidance for handling results from uncoordinated background tasks.

**Evidence:**
```markdown
| `coordinate_parallel` | Not available natively. Execute plans sequentially. Background delegation (`&`) can run plans in the cloud but without coordination. |
```

**Impact:** Users may attempt background delegation expecting coordination, leading to orphaned results or missed artifacts.

**Recommendation:** Either document how to collect results from background-delegated tasks, or explicitly warn against using `&` for Legion workflows.

---

### LEGION-47-459 [P2] CAT-9: Missing lint_commands in conformance metadata

**Location:** YAML frontmatter

**Issue:** No `lint_commands` field present despite CLAUDE.md referencing it as conformance metadata.

**Impact:** Cross-reference validation incomplete.

**Recommendation:** Add `lint_commands` or document omission rationale.

---

### LEGION-47-460 [P3] CAT-9: Inconsistent model tier naming across adapters

**Location:** Tool Mappings table, model_* rows

**Issue:** Copilot CLI uses `claude-opus-4-6` and `gpt-5.3-codex` as planning models, but other adapters use different version strings (e.g., `gpt-5.4` in Codex CLI). Model naming is inconsistent.

**Evidence:**
```markdown
| `model_planning` | `claude-opus-4-6` or `gpt-5.3-codex` (user-configured) |
```

**Impact:** Model name mismatches may cause confusion or selection failures when switching between CLIs.

**Recommendation:** Standardize model tier naming conventions or document that model names are CLI-specific.

---

## Summary

| Severity | Count |
|----------|-------|
| P1       | 0     |
| P2       | 2     |
| P3       | 1     |
| **Total**| **3** |
