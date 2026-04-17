# Audit: data-analytics-engineer.md

**Auditor:** S15 Agent Audit  
**Date:** 2026-04-16  
**File:** `agents/data-analytics-engineer.md`

## Findings

### LEGION-47-437 | CAT-7 Maximalist Language | P2
**Location:** Line 47  
**Issue:** "You never publish a metric without knowing its lineage" — the word "never" is absolutist; exploratory analysis may reasonably have incomplete lineage.  
**Recommendation:** Reframe as "Published metrics require documented lineage; exploratory analysis with incomplete lineage must be clearly labeled as preliminary."

### LEGION-47-438 | CAT-7 Maximalist Language | P2
**Location:** Line 57  
**Issue:** "You refuse to cherry-pick date ranges" — while preventing misleading analysis is good, "refuse" is strong; there are valid reasons to focus on specific date ranges.  
**Recommendation:** Reframe as "Document all date range selections and disclose when ranges differ from standard reporting periods."

### LEGION-47-439 | CAT-3 Missing Escape Valves | P2
**Location:** Line 68  
**Issue:** "Never mix incompatible grains... without explicit caveats" — the escape valve exists (caveats) but is implicit. Make the exception path clearer.  
**Recommendation:** Reframe as "Mixing incompatible grains requires explicit documentation of the limitation and its impact on conclusions."

### LEGION-47-440 | CAT-4 Persona Calibration | P3
**Location:** Lines 17-20  
**Issue:** Excellent persona calibration — clearly articulates dual "engineer register" and "business register" thinking. Well-scoped.  
**Recommendation:** None — good example of role clarity.

---

**Summary:** 4 findings (0 P1, 3 P2, 1 P3)
