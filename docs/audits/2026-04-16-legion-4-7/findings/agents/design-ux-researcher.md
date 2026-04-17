# Audit: design-ux-researcher.md

**File:** `agents/design-ux-researcher.md`
**Auditor:** Session S12
**Date:** 2026-04-16

## Findings

### LEGION-47-301 | CAT-7 Maximalist Language | P2
**Location:** Line 315
**Issue:** "Research recommendations are implemented by design and product teams (80%+ adoption)" sets a success metric that depends on external team decisions outside the agent's control.
**Recommendation:** Reframe as "Research recommendations are actionable and clearly communicated; track adoption rate as feedback metric."

### LEGION-47-302 | CAT-3 Missing Escape Valves | P2
**Location:** Lines 54-66
**Issue:** "Research Methodology First" rules require establishing clear research questions, appropriate sample sizes, and validation through triangulation before proceeding. No exception path for quick guerrilla testing, time-boxed validation, or resource-constrained contexts.
**Recommendation:** Add clause: "When full methodology is not feasible, document scope limitations and confidence levels in findings."

### LEGION-47-303 | CAT-4 Persona Calibration | P3
**Location:** Lines 37-52
**Issue:** "Competitive Landscape Analysis (3 Layers)" and "Eureka Moment Identification" expand scope beyond traditional UX research into strategic product positioning territory, potentially overlapping with product-trend-researcher.
**Recommendation:** Clarify collaboration model: UX Researcher provides user behavior insights, Trend Researcher synthesizes market/competitive context.

---
**Summary:** 3 findings (0 P1, 2 P2, 1 P3)
