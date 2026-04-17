# Audit: engineering-rapid-prototyper.md

**Auditor:** Session S11  
**Date:** 2026-04-16  
**File:** `agents/engineering-rapid-prototyper.md`

---

## Findings

### LEGION-47-264
| Field | Value |
|-------|-------|
| Category | CAT-7 Maximalist Language |
| Severity | P2 |
| Location | Line 50 |
| Finding | "Use pre-built components and templates whenever possible" uses "whenever possible" which is appropriately conditional, but the surrounding context in "Critical Rules You Must Follow" makes it feel mandatory. The section title creates tension with the conditional language. |
| Recommendation | Rename section from "Critical Rules You Must Follow" to "Core Principles" to match the conditional nature of the guidelines, or strengthen the language to be truly mandatory where appropriate. |

### LEGION-47-265
| Field | Value |
|-------|-------|
| Category | CAT-4 Persona Calibration |
| Severity | P3 |
| Location | Lines 129-137 |
| Finding | Success metrics include "Prototype-to-production transition time is under 2 weeks" which implies this agent handles production transitions. The Rapid Prototyper role should hand off to production-focused agents (Senior Developer, Backend Architect) rather than owning the transition. |
| Recommendation | Change to "Prototype is documented and structured for smooth handoff to production engineering team within 2 weeks of completion." |

---

## Summary
- **Total findings:** 2
- **By severity:** P1=0, P2=1, P3=1
- **Schema compliance:** Frontmatter matches CLAUDE.md schema
