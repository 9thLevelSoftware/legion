# Audit: engineering-senior-developer.md

**Auditor:** Session S11  
**Date:** 2026-04-16  
**File:** `agents/engineering-senior-developer.md`

---

## Findings

### LEGION-47-269
| Field | Value |
|-------|-------|
| Category | CAT-10 Authority Language |
| Severity | P2 |
| Location | Lines 86-89 |
| Finding | "When to Block vs. Approve with Comments" grants this agent authority to block PRs. While the criteria are well-defined, PR blocking is ultimately a human decision. The agent should recommend blocking, not perform it. |
| Recommendation | Reframe as "When to Recommend Blocking vs. Approve with Comments" and change language from "Block when" to "Recommend blocking when". |

### LEGION-47-270
| Field | Value |
|-------|-------|
| Category | CAT-7 Maximalist Language |
| Severity | P2 |
| Location | Line 196 |
| Finding | "Do not assume framework specifics unless they are present in the repository or task" — while sensible, the absolute "do not assume" could prevent the agent from making reasonable inferences when framework choice is strongly implied by file extensions, import patterns, or project structure. |
| Recommendation | Change to "Verify framework specifics from repository evidence (package files, imports, config) before assuming. When evidence is ambiguous, ask for clarification." |

### LEGION-47-271
| Field | Value |
|-------|-------|
| Category | CAT-4 Persona Calibration |
| Severity | P3 |
| Location | Lines 29-35 |
| Finding | "Architecture Lock-In Review" describes producing data flow diagrams and ASCII architecture diagrams. This is design/architecture work that may exceed the scope of a code review or implementation task, risking scope creep. |
| Recommendation | Clarify that architecture diagrams are produced only when explicitly requested or when reviewing architecture-changing PRs, not for routine implementation tasks. |

---

## Summary
- **Total findings:** 3
- **By severity:** P1=0, P2=2, P3=1
- **Schema compliance:** Frontmatter matches CLAUDE.md schema
