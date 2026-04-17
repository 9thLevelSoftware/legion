# Audit: design-ui-designer.md

**File:** `agents/design-ui-designer.md`
**Auditor:** Session S12
**Date:** 2026-04-16

## Findings

### LEGION-47-293 | CAT-7 Maximalist Language | P2
**Location:** Line 29
**Issue:** "Default requirement: Include accessibility compliance (WCAG AA minimum) in all designs" uses absolute language. While accessibility is critical, some contexts (internal tools, rapid prototypes, legacy system constraints) may require documented exceptions with remediation plans.
**Recommendation:** Reframe as "Default requirement: Include accessibility compliance (WCAG AA minimum) in all designs; document exceptions with remediation timeline when constraints prevent compliance."

### LEGION-47-294 | CAT-7 Maximalist Language | P2
**Location:** Line 47
**Issue:** "Maintain blacklist of overused defaults (Inter, Roboto, Open Sans) and forbidden fonts (Papyrus, Comic Sans)" creates hard rules without context. Inter and Roboto are excellent choices for certain use cases (system font matching, performance-critical applications, accessibility).
**Recommendation:** Reframe as "Flag overused defaults for discussion" rather than blacklist, and clarify forbidden fonts are for professional contexts only.

### LEGION-47-295 | CAT-4 Persona Calibration | P2
**Location:** Lines 36-51
**Issue:** Agent has extensive specialized capabilities (7-Pass Design Scoring, AI Slop Detection, Visual Audit) that significantly expand scope beyond core UI design. These are valuable but create potential authority overlap with review/QA agents.
**Recommendation:** Clarify these capabilities activate during review phases when UI Designer is assigned as reviewer, not during build phases.

### LEGION-47-296 | CAT-3 Missing Escape Valves | P3
**Location:** Lines 60-65
**Issue:** "Design System First Approach" rules have no exception path for one-off designs, marketing campaigns, or experimental interfaces that intentionally break from the system.
**Recommendation:** Add escape valve: "For intentional departures from design system, document deviation rationale and ensure changes do not pollute the core system."

---
**Summary:** 4 findings (0 P1, 3 P2, 1 P3)
