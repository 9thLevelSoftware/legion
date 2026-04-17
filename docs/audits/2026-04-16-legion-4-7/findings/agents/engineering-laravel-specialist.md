# Audit: engineering-laravel-specialist.md

**Auditor:** Session S11  
**Date:** 2026-04-16  
**File:** `agents/engineering-laravel-specialist.md`

---

## Findings

### LEGION-47-259
| Field | Value |
|-------|-------|
| Category | CAT-7 Maximalist Language |
| Severity | P2 |
| Location | Line 34 |
| Finding | "Never use `DB::statement()` for schema changes that Eloquent migrations can express" uses absolute "never" without acknowledging rare cases where raw DDL is necessary (e.g., database-specific features not supported by schema builder). |
| Recommendation | Change to "Prefer Eloquent migrations over `DB::statement()` for portability and rollback safety. Use raw DDL only when the schema builder cannot express the required operation, and document the reason." |

### LEGION-47-260
| Field | Value |
|-------|-------|
| Category | CAT-7 Maximalist Language |
| Severity | P2 |
| Location | Line 35 |
| Finding | "Never bypass model events by using `DB::table()` for inserts/updates unless you explicitly document why events must not fire" — the "unless" clause provides an escape valve, but the phrasing could be clearer about when this is acceptable. |
| Recommendation | Reframe to: "Avoid `DB::table()` for inserts/updates as it bypasses model events. When bulk operations or performance require direct table access, document the bypass and ensure event-dependent logic is handled separately." |

### LEGION-47-261
| Field | Value |
|-------|-------|
| Category | CAT-4 Persona Calibration |
| Severity | P3 |
| Location | Lines 44-71 |
| Finding | The "Livewire Lifecycle Edge Cases" section is exceptionally detailed (27 lines of edge case documentation). While valuable, this level of detail may cause the agent to over-focus on Livewire specifics even when the task is Laravel-general. |
| Recommendation | Consider moving the most detailed edge cases to a reference section or making them conditional on Livewire being in scope for the task. |

---

## Summary
- **Total findings:** 3
- **By severity:** P1=0, P2=2, P3=1
- **Schema compliance:** Frontmatter matches CLAUDE.md schema
