# Audit Findings: adapters/ADAPTER.md

**File:** `adapters/ADAPTER.md`
**Auditor:** S16 CLI Adapters Session
**Date:** 2026-04-16

## Findings

### LEGION-47-450 [P2] CAT-6: Placeholder resolution instruction lacks cross-platform guidance

**Location:** Line 70, `plugin_discovery_glob` description

**Issue:** The spec instructs agents to resolve `<home>` via `echo $HOME` (bash) or `os.homedir()`, but does not address Windows environments where `$HOME` may not be set and PowerShell uses `$env:USERPROFILE` or `$HOME` depending on configuration.

**Evidence:**
```markdown
| `plugin_discovery_glob` | Glob pattern for finding installed Legion agents. Use `<home>` as a placeholder — agents MUST resolve it to an absolute path via `echo $HOME` (bash) or `os.homedir()` before passing to Glob.
```

**Impact:** On Windows hosts running Legion via PowerShell or cmd, the bash-only resolution guidance may cause glob failures or undefined behavior.

**Recommendation:** Add Windows guidance: "On Windows, use `$env:USERPROFILE` (PowerShell) or `%USERPROFILE%` (cmd)."

---

### LEGION-47-451 [P3] CAT-9: No lint_commands field in conformance metadata

**Location:** YAML frontmatter section (lines 26-34)

**Issue:** The ADAPTER.md specification requires `max_prompt_size` and `known_quirks` but does not require a `lint_commands` field. CLAUDE.md references "conformance metadata (`lint_commands`, `max_prompt_size`, `known_quirks`) validated by cross-reference checks" but the base spec omits `lint_commands`.

**Evidence:** The Required Fields table under "Limits & Quirks" lists only `max_prompt_size` and `known_quirks`.

**Impact:** Adapters may omit lint_commands, causing cross-reference validation to fail or produce inconsistent results.

**Recommendation:** Add `lint_commands` to the specification as an optional field with clear guidance on when it should be populated.

---

## Summary

| Severity | Count |
|----------|-------|
| P1       | 0     |
| P2       | 1     |
| P3       | 1     |
| **Total**| **2** |
