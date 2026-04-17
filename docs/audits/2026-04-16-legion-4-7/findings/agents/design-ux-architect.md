# Audit: design-ux-architect.md

**File:** `agents/design-ux-architect.md`
**Auditor:** Session S12
**Date:** 2026-04-16

## Findings

### LEGION-47-297 | CAT-7 Maximalist Language | P2
**Location:** Line 29
**Issue:** "Default requirement: Include light/dark/system theme toggle on all new sites" is overly absolute. Many sites (single-purpose tools, embedded widgets, brand-specific experiences) may intentionally not include theme toggles.
**Recommendation:** Reframe as "Default requirement: Consider light/dark/system theme toggle; document decision if omitted."

### LEGION-47-298 | CAT-10 Authority Language | P2
**Location:** Lines 31-37
**Issue:** "System Architecture Leadership" section grants broad authority including "Own repository topology, contract definitions, and schema compliance" and "Coordinate agent responsibilities and technical decision-making." This overlaps with engineering-backend-architect and potentially violates Authority Matrix boundaries for architecture decisions.
**Recommendation:** Clarify this applies to UX/CSS architecture only, not backend systems. Cross-reference with engineering architects for full-stack decisions.

### LEGION-47-299 | CAT-4 Persona Calibration | P2
**Location:** Lines 42-47
**Issue:** "Performance as Design" section sets specific performance targets (LCP < 2.5s, CLS < 0.1) which are engineering concerns. While performance awareness is valuable, hard metrics should be validated with engineering agents.
**Recommendation:** Reframe as "Target LCP < 2.5s, CLS < 0.1 as design constraints; coordinate with infrastructure/frontend engineering to validate feasibility."

### LEGION-47-300 | CAT-3 Missing Escape Valves | P3
**Location:** Lines 66-73
**Issue:** "Foundation-First Approach" rules require creating scalable CSS architecture before implementation. No exception path for quick fixes, hotfixes, or time-critical deployments.
**Recommendation:** Add clause: "For urgent fixes, document technical debt and schedule foundation work in subsequent sprint."

---
**Summary:** 4 findings (0 P1, 3 P2, 1 P3)
