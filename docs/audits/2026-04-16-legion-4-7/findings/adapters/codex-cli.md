# Audit Findings: adapters/codex-cli.md

**File:** `adapters/codex-cli.md`
**Auditor:** S16 CLI Adapters Session
**Date:** 2026-04-16

## Findings

### LEGION-47-456 [P2] CAT-6: Read-only agent enforcement is instruction-only

**Location:** Tool Mappings table, `spawn_agent_readonly` row

**Issue:** The adapter states read-only mode is enforced via explicit instruction only, not at the platform level. This is documented but lacks an escape valve for when the instruction is ignored.

**Evidence:**
```markdown
| `spawn_agent_readonly` | Spawn a subagent with the personality + task and instruct it explicitly: "You are in READ-ONLY mode. Do not create, modify, or delete any files." Codex CLI does not enforce this at the platform level. |
```

**Impact:** Advisory agents may inadvertently modify files if they ignore the instruction, with no platform safeguard.

**Recommendation:** Add guidance to verify no files were modified after read-only agent completion, or suggest using `--approval-mode` flags to require human approval for writes.

---

### LEGION-47-457 [P2] CAT-9: Missing lint_commands in conformance metadata

**Location:** YAML frontmatter

**Issue:** The adapter includes `max_prompt_size` and `known_quirks` but no `lint_commands` field, despite CLAUDE.md referencing it as part of conformance metadata.

**Evidence:** The frontmatter contains:
```yaml
max_prompt_size: 200000
known_quirks:
  - "no-parallel-agents"
  - "prompt-prefix-only"
```
But no `lint_commands` field.

**Impact:** Cross-reference validation for conformance metadata may fail or be incomplete.

**Recommendation:** Add `lint_commands` field specifying how to lint/validate Codex CLI configurations, or document why it is omitted.

---

## Summary

| Severity | Count |
|----------|-------|
| P1       | 0     |
| P2       | 2     |
| P3       | 0     |
| **Total**| **2** |
