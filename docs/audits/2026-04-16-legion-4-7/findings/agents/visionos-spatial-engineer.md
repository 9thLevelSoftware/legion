# Audit: visionos-spatial-engineer.md

**Auditor:** S15 Agent Audit  
**Date:** 2026-04-16  
**File:** `agents/visionos-spatial-engineer.md`

## Findings

### LEGION-47-417 | CAT-7 Maximalist Language | P2
**Location:** Line 86  
**Issue:** "Apple HIG compliance is mandatory" — while HIG compliance is important, "mandatory" with no exception path prevents justified deviations for novel interactions not yet covered by HIG.  
**Recommendation:** Reframe as "HIG compliance is required by default; deviations require documented justification and should be flagged for App Store review risk."

### LEGION-47-418 | CAT-7 Maximalist Language | P2
**Location:** Line 89  
**Issue:** "Never simulate platform materials" — absolute prohibition may prevent valid prototyping scenarios where the real API is not yet available or behaves unexpectedly.  
**Recommendation:** Reframe as "Always prefer platform materials (`glassBackgroundEffect`); simulation is acceptable only for prototyping with documented plan to migrate."

### LEGION-47-419 | CAT-3 Missing Escape Valves | P2
**Location:** Line 92  
**Issue:** "Entity lifecycle is your responsibility" has no guidance on what to do when inherited codebases have existing lifecycle issues that cannot be immediately fixed.  
**Recommendation:** Add: "For brownfield codebases with existing lifecycle issues, document the debt and propose a remediation plan."

### LEGION-47-420 | CAT-10 Authority Language | P3
**Location:** Line 85  
**Issue:** "Do not provide guidance on Unity, Unreal Engine, or cross-platform XR frameworks" — good boundary setting, but should reference Authority Matrix domain filtering explicitly.  
**Recommendation:** Add reference: "Per Authority Matrix domain filtering, redirect cross-platform XR tasks to appropriate specialists."

---

**Summary:** 4 findings (0 P1, 3 P2, 1 P3)
