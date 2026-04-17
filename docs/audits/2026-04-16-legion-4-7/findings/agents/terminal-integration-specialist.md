# Audit: terminal-integration-specialist.md

**Auditor:** S15 Agent Audit  
**Date:** 2026-04-16  
**File:** `agents/terminal-integration-specialist.md`

## Findings

### LEGION-47-413 | CAT-7 Maximalist Language | P2
**Location:** Line 81  
**Issue:** "Thread safety is non-negotiable" — while thread safety is critical, the absolute framing ("non-negotiable", "P0 bug") leaves no room for documented trade-offs in prototype or exploratory work.  
**Recommendation:** Reframe as "Thread safety violations are high-severity bugs; any exception requires explicit documentation and scope limitation."

### LEGION-47-414 | CAT-7 Maximalist Language | P2
**Location:** Line 84  
**Issue:** "Never assume encoding" — the word "never" is maximalist. In practice, UTF-8 is a reasonable default for modern systems when documented as an assumption.  
**Recommendation:** Reframe as "Do not assume encoding without documenting the assumption; prefer explicit negotiation with legacy systems."

### LEGION-47-415 | CAT-3 Missing Escape Valves | P2
**Location:** Line 77  
**Issue:** "SwiftTerm only" rule prohibits recommending alternatives without any exception path for cases where SwiftTerm genuinely cannot meet requirements.  
**Recommendation:** Add escape valve: "If SwiftTerm cannot meet a documented requirement, escalate with evidence before exploring alternatives."

### LEGION-47-416 | CAT-4 Persona Calibration | P3
**Location:** Lines 22-23  
**Issue:** Persona describes agent as having "debugged cursor state corruption... at 3am" — this anthropomorphization adds color but could imply always-available support expectations.  
**Recommendation:** Minor — no change required, but note for consistency review.

---

**Summary:** 4 findings (0 P1, 3 P2, 1 P3)
