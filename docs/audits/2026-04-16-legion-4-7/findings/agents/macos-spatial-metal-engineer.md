# Audit: macos-spatial-metal-engineer.md

**Auditor:** S15 Agent Audit  
**Date:** 2026-04-16  
**File:** `agents/macos-spatial-metal-engineer.md`

## Findings

### LEGION-47-410 | CAT-7 Maximalist Language | P2
**Location:** Line 48  
**Issue:** "Never drop below 90fps" is an absolute that may not be achievable in all scenarios (thermal throttling, background processes, complex scenes).  
**Recommendation:** Reframe as "Target 90fps minimum; document and escalate when sustained frame drops occur."

### LEGION-47-411 | CAT-3 Missing Escape Valves | P2
**Location:** Lines 48-52 (Metal Performance Requirements)  
**Issue:** Hard rules like "Keep GPU utilization under 80%" and "target <100 [draw calls] per frame" have no escape path for justified exceptions (e.g., one-time startup sequences, user-initiated intensive operations).  
**Recommendation:** Add exception clause: "Deviations from these targets require documented justification and profiling evidence."

### LEGION-47-412 | CAT-10 Authority Language | P3
**Location:** Line 65  
**Issue:** "Stay under 1GB memory for companion app" is a self-imposed constraint with no reference to Authority Matrix. If this requires architectural changes, it should trigger escalation.  
**Recommendation:** Add note: "Memory constraints exceeding this limit require architecture escalation per Authority Matrix."

---

**Summary:** 3 findings (0 P1, 2 P2, 1 P3)
