# Audit Findings: adapters/cursor.md

**File:** `adapters/cursor.md`
**Auditor:** S16 CLI Adapters Session
**Date:** 2026-04-16

## Findings

### LEGION-47-461 [P2] CAT-6: Read-only mode depends on Review mode without verification

**Location:** Tool Mappings table, `spawn_agent_readonly` row

**Issue:** The adapter says to "prefer Cursor Review mode" for read-only agents but adds "do not assume file writes are disabled unless Review mode is active." There is no guidance on how to verify Review mode is active.

**Evidence:**
```markdown
| `spawn_agent_readonly` | Prefer Cursor Review mode or explicit read-only prompts; do not assume file writes are disabled unless Review mode is active. |
```

**Impact:** Agents may believe they are in read-only mode when Review mode is not actually enabled, leading to unintended file modifications.

**Recommendation:** Add detection guidance: how to check if Review mode is active, and what to do if it cannot be verified.

---

### LEGION-47-462 [P2] CAT-3: Polling for result files lacks timeout or failure handling

**Location:** Execution Protocol > Wave Execution, step 3

**Issue:** The wave execution protocol says to "Poll for result files until all plans in the wave have written results" but provides no timeout, retry limit, or failure handling.

**Evidence:**
```markdown
3. Poll for result files until all plans in the wave have written results
```

**Impact:** If a subagent fails to write results, the coordinator may poll indefinitely.

**Recommendation:** Add timeout and failure handling: "Poll with 30-second intervals, max 10 minutes. If results are missing after timeout, mark plan as Failed and log which subagents did not complete."

---

### LEGION-47-463 [P2] CAT-9: Missing lint_commands in conformance metadata

**Location:** YAML frontmatter

**Issue:** No `lint_commands` field present.

**Impact:** Cross-reference validation incomplete.

**Recommendation:** Add `lint_commands` or document omission rationale.

---

## Summary

| Severity | Count |
|----------|-------|
| P1       | 0     |
| P2       | 3     |
| P3       | 0     |
| **Total**| **3** |
