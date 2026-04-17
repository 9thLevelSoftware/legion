# Audit Findings: adapters/aider.md

**File:** `adapters/aider.md`
**Auditor:** S16 CLI Adapters Session
**Date:** 2026-04-16

## Findings

### LEGION-47-452 [P2] CAT-3: No escape valve for shell verification commands

**Location:** Limitations table, "No shell execution" row

**Issue:** Aider cannot run verification commands directly, but there is no documented fallback or degradation path for plans that include mandatory `verification_commands`.

**Evidence:**
```markdown
| **No shell execution** | Aider cannot run tests, linters, or build scripts. All verification must be done manually by the user in a separate terminal. | High |
```

**Impact:** Plans with `verification_commands` will appear incomplete even when implementation is correct. Users may not realize they need to run verification manually.

**Recommendation:** Add a "Verification Fallback" section that instructs the agent to: (1) output verification commands prominently, (2) mark result status as "Pending Manual Verification", (3) include a checklist for the user.

---

### LEGION-47-453 [P2] CAT-3: Weak personality isolation warning lacks mitigation

**Location:** Limitations table, "Weak personality isolation" row

**Issue:** The adapter warns about personality bleed-through between sequential plans but provides no mitigation strategy.

**Evidence:**
```markdown
| **Weak personality isolation** | Single session with no context boundary between plans. If executing multiple plans sequentially, personality bleed-through can occur — the agent from Plan 1 may influence Plan 2. | Medium |
```

**Impact:** Multi-plan phases may produce inconsistent outputs as agent personalities contaminate each other.

**Recommendation:** Add mitigation guidance: "Between plans, explicitly instruct the agent to discard prior personality context and adopt the new personality cleanly."

---

### LEGION-47-454 [P2] CAT-6: Model tier mappings are underspecified

**Location:** Tool Mappings table, lines for `model_planning`, `model_execution`, `model_check`

**Issue:** All three model tiers are described as "User-configured" with example models, but there is no default or fallback when the user has not configured models.

**Evidence:**
```markdown
| `model_planning` | User-configured architect model (e.g., `claude-opus-4-6`, `o1`) |
| `model_execution` | User-configured editor model (e.g., `claude-sonnet-4-6`, `deepseek-v3`) |
| `model_check` | User-configured lightweight model (e.g., `claude-haiku-4-5`, `o1-mini`) |
```

**Impact:** If user has not configured models, the runtime has no defined behavior for model selection.

**Recommendation:** Either specify sensible defaults or document that Aider uses its own default model selection when Legion model tiers are not configured.

---

## Summary

| Severity | Count |
|----------|-------|
| P1       | 0     |
| P2       | 3     |
| P3       | 0     |
| **Total**| **3** |
