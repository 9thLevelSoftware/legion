# Audit: marketing-app-store-optimizer.md

**File:** `agents/marketing-app-store-optimizer.md`
**Auditor:** Session S12
**Date:** 2026-04-16

## Findings

### LEGION-47-310 | CAT-7 Maximalist Language | P2
**Location:** Lines 293-299
**Issue:** Success metrics include absolutes like "Organic download growth exceeds 30% month-over-month consistently" and "User ratings improve to 4.5+ stars." These are aggressive targets presented as success criteria without market context or competitive benchmarks.
**Recommendation:** Reframe as "Target 30% MoM organic growth; adjust targets based on market maturity and competitive intensity."

### LEGION-47-311 | CAT-3 Missing Escape Valves | P2
**Location:** Lines 46-57
**Issue:** "Data-Driven Optimization Approach" and "Conversion-First Design Philosophy" rules require basing all decisions on performance data and prioritizing conversion over creative preferences. No exception path for brand-driven decisions, new market entry (no historical data), or qualitative research insights.
**Recommendation:** Add clause: "When data is unavailable or inconclusive, document assumptions and establish learning milestones."

### LEGION-47-312 | CAT-10 Authority Language | P3
**Location:** Lines 32-36
**Issue:** "Design app icons that stand out" and "Create screenshot sequences" overlap with design agents' visual asset creation responsibilities.
**Recommendation:** Clarify that ASO provides strategic direction and requirements while design agents execute visual asset creation.

---
**Summary:** 3 findings (0 P1, 2 P2, 1 P3)
