# Audit Findings: adapters/gemini-cli.md

**File:** `adapters/gemini-cli.md`
**Auditor:** S16 CLI Adapters Session
**Date:** 2026-04-16

## Findings

### LEGION-47-464 [P1] CAT-3: Parallel execution file conflict warning lacks enforcement

**Location:** Tool Mappings table, `coordinate_parallel` row

**Issue:** The adapter warns that "v1 parallel does not handle agents modifying the same files" but provides no mechanism to detect or prevent this at runtime.

**Evidence:**
```markdown
| `coordinate_parallel` | Spawn multiple subagents in parallel via Gemini's greedy tool scheduler (shipped Jan 2026). Each writes results to a file. Note: v1 parallel does not handle agents modifying the same files. |
```

**Impact:** Parallel agents may corrupt files by writing concurrently, causing data loss or merge conflicts with no warning until after damage occurs.

**Recommendation:** Either integrate with Legion's wave safety file overlap detection, or add pre-spawn validation that checks `files_modified` for overlaps and falls back to sequential execution.

---

### LEGION-47-465 [P2] CAT-6: Agent spawning requires opt-in but detection is not documented

**Location:** Wave Execution section, Note paragraph

**Issue:** Agent spawning requires opt-in via `{"experimental": {"enableAgents": true}}` in settings.json, but there is no guidance on how to detect if this is enabled before attempting to spawn.

**Evidence:**
```markdown
**Note:** Agent spawning requires opt-in via `{"experimental": {"enableAgents": true}}` in Gemini CLI's `settings.json`. Subagents cannot call other subagents (no recursion).
```

**Impact:** Workflows may fail silently or with unclear errors if agent spawning is attempted without the opt-in.

**Recommendation:** Add detection guidance: check for the experimental flag before spawning, and document the fallback behavior (sequential execution) if disabled.

---

### LEGION-47-466 [P2] CAT-6: Read-only agents not enforced at platform level

**Location:** Tool Mappings table, `spawn_agent_readonly` row

**Issue:** Read-only mode relies on "explicit read-only instructions" only; Gemini CLI does not enforce read-only at the platform level.

**Evidence:**
```markdown
| `spawn_agent_readonly` | Spawn a subagent with explicit read-only instructions. Gemini CLI does not enforce read-only at the platform level. |
```

**Impact:** Advisory agents may modify files if they ignore instructions.

**Recommendation:** Document post-execution verification or suggest using sandbox mode (`--sandbox` flag) for read-only tasks.

---

### LEGION-47-467 [P2] CAT-9: Missing lint_commands in conformance metadata

**Location:** YAML frontmatter

**Issue:** No `lint_commands` field present.

**Impact:** Cross-reference validation incomplete.

**Recommendation:** Add `lint_commands` or document omission rationale.

---

## Summary

| Severity | Count |
|----------|-------|
| P1       | 1     |
| P2       | 3     |
| P3       | 0     |
| **Total**| **4** |
