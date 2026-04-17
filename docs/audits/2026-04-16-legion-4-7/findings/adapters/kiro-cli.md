# Audit Findings: adapters/kiro-cli.md

**File:** `adapters/kiro-cli.md`
**Auditor:** S16 CLI Adapters Session
**Date:** 2026-04-16

## Findings

### LEGION-47-468 [P2] CAT-3: Subagent tool limitations degrade silently

**Location:** Subagent Tool Limitations section

**Issue:** The adapter documents that unavailable tools "silently degrade" in subagents, but there is no mechanism to detect this degradation or warn the user.

**Evidence:**
```markdown
- Unavailable tools silently degrade — the subagent still runs but without those capabilities
- Plan tasks that require web research or MCP integrations should run in the main agent session, not in spawned subagents
```

**Impact:** Users may not realize a plan requiring web_search or MCP tools will fail silently when delegated to a subagent.

**Recommendation:** Add pre-dispatch validation that checks plan requirements against subagent tool availability and warns or blocks delegation when incompatible tools are required.

---

### LEGION-47-469 [P2] CAT-6: Model tiers completely user-configured with no defaults

**Location:** Tool Mappings table, model_* rows

**Issue:** All three model tiers are listed as "User-configured Kiro model" with no defaults or fallback behavior.

**Evidence:**
```markdown
| `model_planning` | User-configured Kiro model |
| `model_execution` | User-configured Kiro model |
| `model_check` | User-configured Kiro model |
```

**Impact:** If users have not configured models, the runtime behavior is undefined.

**Recommendation:** Document Kiro's default model selection behavior, or specify that Legion should use Kiro's session default when model tiers are not explicitly configured.

---

### LEGION-47-470 [P2] CAT-6: Read-only mode enforcement is instruction-based only

**Location:** Tool Mappings table, `spawn_agent_readonly` row

**Issue:** Read-only relies on "Kiro permissions or hook policy" plus instructions, but specific configuration is not documented.

**Evidence:**
```markdown
| `spawn_agent_readonly` | Use Kiro permissions or hook policy to deny writes for that task. Legion must still instruct the agent to stay read-only because it is not a separate built-in advisory agent. |
```

**Impact:** Users may not know how to configure Kiro permissions or hooks to enforce read-only mode.

**Recommendation:** Add specific configuration examples for Kiro permissions/hooks that enforce read-only behavior.

---

### LEGION-47-471 [P2] CAT-9: Missing lint_commands in conformance metadata

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
