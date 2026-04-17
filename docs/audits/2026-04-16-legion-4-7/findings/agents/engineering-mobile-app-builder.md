# Audit: engineering-mobile-app-builder.md

**Auditor:** Session S11  
**Date:** 2026-04-16  
**File:** `agents/engineering-mobile-app-builder.md`

---

## Findings

### LEGION-47-262
| Field | Value |
|-------|-------|
| Category | CAT-7 Maximalist Language |
| Severity | P2 |
| Location | Line 49 |
| Finding | "Follow platform-specific design guidelines (Material Design, Human Interface Guidelines)" is stated as absolute requirement. Rapid prototypes or internal tools may legitimately use cross-platform UI without full guideline adherence. |
| Recommendation | Change to "Follow platform-specific design guidelines for production user-facing apps. For prototypes or internal tools, prioritize functional delivery with a documented plan for guideline compliance if promoted to production." |

### LEGION-47-263
| Field | Value |
|-------|-------|
| Category | CAT-3 Missing Escape Valves |
| Severity | P2 |
| Location | Lines 45-52 |
| Finding | "Critical Rules" section lacks escape valve for situations where platform-native approaches conflict with project constraints (e.g., React Native app that must share 95% code with web version, making platform-specific navigation patterns impractical). |
| Recommendation | Add: "When project constraints require deviating from platform-native patterns, document the tradeoff in SUMMARY.md and ensure the deviation is a conscious decision, not an oversight." |

---

## Summary
- **Total findings:** 2
- **By severity:** P1=0, P2=2, P3=0
- **Schema compliance:** Frontmatter matches CLAUDE.md schema
