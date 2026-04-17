# Audit Findings: adapters/opencode.md

**File:** `adapters/opencode.md`
**Auditor:** S16 CLI Adapters Session
**Date:** 2026-04-16

## Findings

### LEGION-47-472 [P2] CAT-3: Model availability fallback is vague

**Location:** Troubleshooting section, "Model Availability" subsection

**Issue:** The adapter mentions OpenCode "may fall back to its default model" when a configured model becomes unavailable, but does not specify what that default is or how to detect the fallback occurred.

**Evidence:**
```markdown
- **Fallback**: If a model becomes unavailable mid-session, OpenCode may fall back to its default model. Check output for model mismatch warnings.
```

**Impact:** Users may unknowingly continue with an inappropriate model for their task tier (e.g., using a check-tier model for planning).

**Recommendation:** Document what the default fallback model is, and add guidance on how to detect and handle model fallback (e.g., check response headers or log output).

---

### LEGION-47-473 [P2] CAT-3: Timeout handling lacks specific guidance

**Location:** Troubleshooting section, "Timeout Handling" subsection

**Issue:** The adapter mentions timeout behavior but the guidance is truncated/incomplete.

**Evidence:**
```markdown
- **Fix**: OpenCode's Task tool has default timeout behavior. For comple...
```

**Impact:** Users have no actionable guidance for handling timeouts on complex plans.

**Recommendation:** Complete the timeout handling guidance with specific timeout values and mitigation strategies.

---

### LEGION-47-474 [P2] CAT-6: Model tiers fully user-configured

**Location:** Tool Mappings table, model_* rows

**Issue:** All model tiers are "User-configured model" with examples but no defaults.

**Evidence:**
```markdown
| `model_planning` | User-configured model (e.g., `claude-opus-4-6`, `o3`) |
| `model_execution` | User-configured model (e.g., `claude-sonnet-4-6`, `gpt-5.3-codex`) |
| `model_check` | User-configured model (e.g., `claude-haiku-4-5`, `o3-mini`) |
```

**Impact:** Undefined behavior when user has not configured models.

**Recommendation:** Document OpenCode's default model or specify Legion should use session defaults.

---

### LEGION-47-475 [P2] CAT-9: Missing lint_commands in conformance metadata

**Location:** YAML frontmatter

**Issue:** No `lint_commands` field present.

**Impact:** Cross-reference validation incomplete.

**Recommendation:** Add `lint_commands` or document omission rationale.

---

## Summary

| Severity | Count |
|----------|-------|
| P1       | 0     |
| P2       | 4     |
| P3       | 0     |
| **Total**| **4** |
