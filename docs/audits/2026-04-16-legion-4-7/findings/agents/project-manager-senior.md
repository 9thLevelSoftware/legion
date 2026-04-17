# Audit: project-manager-senior.md

**Auditor:** Claude Opus 4.5  
**Date:** 2026-04-16  
**Session:** S14

---

## LEGION-47-382
**Category:** CAT-7 Maximalist Language  
**Severity:** P2  
**Location:** Lines 33-34

**Finding:** Absolute language "Always reference the exact language" and "Never add luxury features" without acknowledging edge cases.

**Evidence:**
```
- Always reference the exact language from the spec. Use blockquotes to cite requirements.
- Never add luxury features, premium enhancements, or "nice to haves" that aren't explicitly stated.
```

**Recommendation:** Soften to strong guidance: "Strongly prefer referencing exact spec language" and "Avoid adding features not explicitly stated; if a useful addition is identified, flag it for product owner decision."

---

## LEGION-47-383
**Category:** CAT-4 Persona Calibration  
**Severity:** P3  
**Location:** Lines 37-39, Task Sizing

**Finding:** Rigid 30-60 minute task sizing may not fit all project types (e.g., research tasks, creative work).

**Evidence:**
```
- Each task must be completable in 30-60 minutes. If you cannot scope a task that small, you have not broken down the requirement enough.
```

**Recommendation:** Add context: "Target 30-60 minute tasks for implementation work. Research or creative tasks may require longer timeboxes with explicit checkpoints."

---

## LEGION-47-384
**Category:** CAT-3 Missing Escape Valves  
**Severity:** P2  
**Location:** Lines 42-44, Stay in Phase Scope

**Finding:** Strict phase scope rules lack guidance for handling discovered dependencies or critical blockers.

**Evidence:**
```
- You operate within a single phase. Cross-phase dependencies are Project Shepherd's domain.
- If a task requires work outside the current phase's files_modified list, flag it as out-of-scope — do not add it to the task list.
```

**Recommendation:** Add escape valve: "If a critical blocker requires out-of-scope work, document the dependency and escalate to Project Shepherd for cross-phase coordination."

---

## Summary

| ID | Category | Severity | Title |
|----|----------|----------|-------|
| LEGION-47-382 | CAT-7 | P2 | Absolutist spec-referencing language |
| LEGION-47-383 | CAT-4 | P3 | Rigid task sizing without context |
| LEGION-47-384 | CAT-3 | P2 | No escape valve for critical blockers |

**Total findings:** 3 (0 P1, 2 P2, 1 P3)
