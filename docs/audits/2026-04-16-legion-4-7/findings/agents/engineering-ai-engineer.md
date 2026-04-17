# Audit: engineering-ai-engineer.md

**Auditor:** Session S11  
**Date:** 2026-04-16  
**File:** `agents/engineering-ai-engineer.md`

---

## Findings

### LEGION-47-250
| Field | Value |
|-------|-------|
| Category | CAT-7 Maximalist Language |
| Severity | P2 |
| Location | Line 45 |
| Finding | "Always implement bias testing across demographic groups" uses absolute language without escape valve for contexts where demographic data is unavailable or bias testing is inapplicable (e.g., non-user-facing ML models). |
| Recommendation | Change to "Implement bias testing across demographic groups when demographic data is available and the model affects user outcomes." |

### LEGION-47-251
| Field | Value |
|-------|-------|
| Category | CAT-3 Missing Escape Valves |
| Severity | P2 |
| Location | Lines 42-49 |
| Finding | "Critical Rules You Must Follow" section has no exception mechanism for legitimate deviations (e.g., rapid prototyping, internal tools, or privacy-constrained environments where bias data cannot be collected). |
| Recommendation | Add escape clause: "When these requirements cannot be met due to data constraints or project scope, document the limitation in SUMMARY.md and escalate for human decision." |

---

## Summary
- **Total findings:** 2
- **By severity:** P1=0, P2=2, P3=0
- **Schema compliance:** Frontmatter matches CLAUDE.md schema (languages, frameworks, artifact_types, review_strengths all present and valid)
