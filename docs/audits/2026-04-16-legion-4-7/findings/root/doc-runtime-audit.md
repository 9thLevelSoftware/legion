# Audit Findings — docs/runtime-audit.md

**Audited in session:** S02b
**Rubric version:** 1.0
**File layer:** root (reference doc)
**File length:** 80 lines
**Total findings:** 0 (clean)
**Baseline commit:** audit-v47-baseline

---

No findings. All 10 rubric categories applied; no matches crossed the finding threshold.

## Category Coverage Notes

- **CAT-1 (Open-Set Interpretation):** The runtime matrix is a closed enumeration (Codex, Cursor, Copilot, Gemini, Kiro, Windsurf, OpenCode, Aider). Columns are closed sets (Tier, Disposition, Local, Global). Vendor paths are concrete filesystem paths.
- **CAT-2 (Ambiguous Triggers):** The "Native Entry" column includes "Plain-language Legion requests" for Cursor and Windsurf. This looks open-set at first glance, but in context it documents a *user behavior* on rules-only runtimes (those CLIs do not expose slash-commands), not an *agent activation trigger*. The doc's audience is installers and adapter authors, not runtime agents deciding when to activate Legion. No behavioral surface is at risk.
- **CAT-3 (Underspecified Dispatch):** No dispatch logic. The doc declares native entry commands per runtime but does not orchestrate dispatch itself.
- **CAT-4 (Underspecified Intent):** Each row's disposition is a closed-set label (Native prompts, Rules-only, Skills and custom agent, etc.) with the entry path stated. Intent is explicit per row.
- **CAT-5 (Prohibitive Over-Reliance):** The "Resulting Policy" section (lines 76-80) states three positive rules with no load-bearing negatives that an agent would need to infer around.
- **CAT-6 (Implicit Preconditions):** Vendor documentation URLs are listed per runtime (lines 18-75), so the precondition "these paths are canonical" is cross-referenced with primary sources. The date stamp "Verified against official vendor documentation on March 11, 2026" (line 3) could go stale, but the doc is descriptive rather than instructional — an agent reading it does not depend on current accuracy for decisions.
- **CAT-7 (Maximalist Persona Language):** None.
- **CAT-8 (Unstated Acceptance Criteria):** Not a check/verify surface.
- **CAT-9 (Response Calibration Gaps):** Not applicable — static reference.
- **CAT-10 (Authority Ambiguity):** Line 5 states "Claude Code remains the control runtime." That is an explicit authority claim with a clear scope. No ambiguity.

### Close-call note

The "Verified against official vendor documentation on March 11, 2026" freshness stamp is technically a CAT-6 structural risk (implicit precondition: agent knows whether the doc is stale). It is not called out as a finding because:
1. The doc is not load-bearing for agent decisions — it informs humans choosing an installer target.
2. The Resulting Policy section (lines 76-80) states the policy in stamp-independent terms (no install of false surfaces; rules-only runtimes get plain-language entry; manual-only stays manual).

If this doc were ever ingested as runtime context for an agent deciding install behavior, the freshness stamp would matter. As audited scope is primarily human-audience, kept below finding threshold.
