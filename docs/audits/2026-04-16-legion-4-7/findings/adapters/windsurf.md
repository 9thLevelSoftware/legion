# Audit Findings: adapters/windsurf.md

**File:** `adapters/windsurf.md`
**Auditor:** S16 CLI Adapters Session
**Date:** 2026-04-16

## Findings

### LEGION-47-476 [P2] CAT-3: Turbo Mode auto-proceed lacks detection or mitigation

**Location:** Interaction Protocol section, Turbo Mode warning

**Issue:** The adapter warns that Turbo Mode may auto-proceed without user input, but provides no way to detect if Turbo Mode is enabled or disable it programmatically.

**Evidence:**
```markdown
**Turbo Mode warning**: If Windsurf's Turbo Mode is enabled, the AI may attempt to auto-proceed without waiting for input. Ensure that all choice prompts include an explicit "waiting for your response" instruction.
```

**Impact:** User choice gates may be bypassed entirely in Turbo Mode, leading to unintended autonomous execution.

**Recommendation:** Add guidance on how to detect Turbo Mode, and consider adding a "Turbo Mode detected - pausing for explicit confirmation" pattern.

---

### LEGION-47-477 [P2] CAT-6: Weak personality isolation warning lacks mitigation

**Location:** Execution Protocol > Wave Execution, step 2

**Issue:** The adapter notes "Personality injection is weaker without subagent isolation" but provides no mitigation strategy.

**Evidence:**
```markdown
2. Personality injection is weaker without subagent isolation — the session retains memory
```

**Impact:** Multi-plan phases may have personality bleed-through, affecting output quality and consistency.

**Recommendation:** Add explicit personality reset instructions between plans: "Before each plan, instruct the session to discard prior personality context."

---

### LEGION-47-478 [P2] CAT-6: Model tiers fully user-configured

**Location:** Tool Mappings table, model_* rows

**Issue:** All model tiers reference "User-configured model" or "Cascade default" with no specification of what the default is.

**Evidence:**
```markdown
| `model_planning` | User-configured model (Cascade default) |
| `model_execution` | User-configured model (Cascade default) |
| `model_check` | User-configured model |
```

**Impact:** Undefined behavior when Cascade defaults are not known to Legion.

**Recommendation:** Document what Cascade's default model is, or specify that Legion cannot control model selection in Windsurf.

---

### LEGION-47-479 [P2] CAT-6: Global config limited to workspace installs only

**Location:** Tool Mappings table, `global_config_dir` row

**Issue:** The global config directory is listed as workspace-only, which contradicts the concept of "global" configuration.

**Evidence:**
```markdown
| `global_config_dir` | `.windsurf/rules/` (workspace installs only) |
```

**Impact:** Portfolio features requiring global configuration may not work in Windsurf.

**Recommendation:** Either document Windsurf's actual global config location, or explicitly state that global Legion features (portfolio registry, cross-project memory) are not supported in Windsurf.

---

### LEGION-47-480 [P2] CAT-9: Missing lint_commands in conformance metadata

**Location:** YAML frontmatter

**Issue:** No `lint_commands` field present.

**Impact:** Cross-reference validation incomplete.

**Recommendation:** Add `lint_commands` or document omission rationale.

---

## Summary

| Severity | Count |
|----------|-------|
| P1       | 0     |
| P2       | 5     |
| P3       | 0     |
| **Total**| **5** |
