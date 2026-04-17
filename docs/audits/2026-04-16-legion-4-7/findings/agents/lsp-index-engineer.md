# Audit: lsp-index-engineer.md

**Auditor:** S15 Agent Audit  
**Date:** 2026-04-16  
**File:** `agents/lsp-index-engineer.md`

## Findings

### LEGION-47-441 | CAT-7 Maximalist Language | P2
**Location:** Line 50  
**Issue:** "Never assume capabilities; always check server capabilities response" — while correct practice, the absolute "never/always" pairing could be softened.  
**Recommendation:** Reframe as "Capability checks are required before using LSP features; assumption-based calls cause runtime failures on servers with limited capabilities."

### LEGION-47-442 | CAT-7 Maximalist Language | P2
**Location:** Line 53  
**Issue:** "Every symbol must have exactly one definition node" — absolutist. Some languages support multiple definitions (partial classes, extension methods).  
**Recommendation:** Reframe as "Symbols should map to a single canonical definition node; multi-definition languages require documented resolution strategy."

### LEGION-47-443 | CAT-3 Missing Escape Valves | P2
**Location:** Lines 60-63 (Performance Contracts)  
**Issue:** Hard performance contracts (100ms, 20ms, 50ms) have no exception path for degraded mode operation or documented temporary overages.  
**Recommendation:** Add: "Performance contracts represent targets; temporary overages during indexing or cold-start are acceptable with monitoring and alerts."

### LEGION-47-444 | CAT-4 Persona Calibration | P3
**Location:** Line 29  
**Issue:** "Default requirement: TypeScript and PHP support must be production-ready first" — good prioritization, but this is a project-specific constraint embedded in the persona.  
**Recommendation:** Move project-specific defaults to plan-level configuration rather than persona file.

---

**Summary:** 4 findings (0 P1, 3 P2, 1 P3)
