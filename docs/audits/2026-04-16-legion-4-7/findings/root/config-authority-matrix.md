# Audit Findings — .planning/config/authority-matrix.yaml

**Audited in session:** S02c
**Rubric version:** 1.0
**File layer:** root (config YAML)
**File length:** 687 lines
**Total findings:** 1 (0 P0, 0 P1, 1 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-008 — P2, CAT-10 Authority Ambiguity (confirmed)

**Lines 10-624 (agent entries) + 630-645 (`conflict_resolution`)**

Multiple agents declare overlapping values in their `exclusive_domains` lists, despite the field name and the file's opening description ("Exclusive domain ownership — when an agent with a domain is active, other agents defer on that domain"). Concrete overlaps against the baseline commit:

| Domain | Agent A | Agent B | Context |
|--------|---------|---------|---------|
| `data-pipelines` | `engineering-ai-engineer` (line 80) | `data-analytics-engineer` (line 590) | AI pipelines vs analytics pipelines |
| `experimentation` | `engineering-rapid-prototyper` (line 105) | `marketing-growth-hacker` (line 305) | Spike experiments vs growth A/B tests |
| `resource-allocation` | `product-sprint-prioritizer` (line 348) | `project-management-studio-producer` (line 410) | Sprint-scope vs portfolio-scope |
| `risk-assessment` | `support-legal-compliance-checker` (line 463) | `project-management-project-shepherd` (line 399) implicit via domain strings | Legal risk vs project risk |
| `creative-direction` | `design-whimsy-injector` (line 273) | `project-management-studio-producer` (line 409) | Design creative vs producer creative |

The `conflict_resolution` section (lines 630-645) nominally handles ties:
- `same_domain_multiple_agents`: "Use agent with higher specificity (more specific domain beats general)"
- `overlapping_domains`: "Both agents active — findings merged, severity escalation applies"

But the specificity hierarchy (lines 651-670) classifies domains by surface pattern, not by agent context. `data-pipelines` is a domain-subcategory (level 2) regardless of which agent owns it. Same-level ties have no deterministic tiebreaker.

Under 4.7 literalism, a review-loop agent deciding which agent is the "domain owner" for a finding tagged `data-pipelines` will pick whichever agent it encountered first in prompt order — nondeterministic across runs, CLIs, and wave orderings. This undermines the central guarantee the file advertises ("exclusive domain ownership ... other agents defer").

**Remediation sketch:** Pick one of three paths, in order of effort:

1. **Disambiguate domain names per agent.** Rename overlapping domains to carry agent context: e.g., `ai-data-pipelines` on `engineering-ai-engineer` and `analytics-data-pipelines` on `data-analytics-engineer`. This is the most literal fix — makes the field name "exclusive" honest.
2. **Declare shared-ownership explicitly.** Add a new top-level section `shared_domains:` listing domains that are intentionally co-owned, with a deterministic primary/secondary ordering. Remove those domains from the individual `exclusive_domains` lists.
3. **Extend `conflict_resolution`.** Add a tie-break rule that runs before "higher specificity": "If two agents share an exact domain string, agent with the lexicographically earlier `id` is the primary owner, the other is secondary." This is the smallest change but is a purely mechanical tiebreaker with no semantic merit.

Option (1) is preferred because it restores the invariant the field advertises. Option (2) is best if shared ownership is intentional. Option (3) is a stopgap.

Confirmed status: This is `confirmed: true` rather than suspected because the failure class is structural — exclusive by field name, non-exclusive by contents. The 4.7-literal failure is a logical consequence, not a hypothesis.

**Remediation cluster:** `authority-language`
**Effort estimate:** medium

---

## Category Coverage Notes

- **CAT-1 (Open-Set Interpretation):** Division labels (engineering, testing, design, marketing, product, project-management, support, spatial-computing, specialized) are enumerated via section-comment banners. Each agent's `division` field is closed to these values.
- **CAT-2 (Ambiguous Triggers):** Domain strings are triggers for review-loop routing. See `LEGION-47-008` — the tag is fine, the exclusivity is not.
- **CAT-3 (Underspecified Dispatch):** Dispatch per domain is the subject of `LEGION-47-008`. For singly-owned domains it is fully specified.
- **CAT-4 (Underspecified Intent):** Each agent has a one-line `description`. Some descriptions are terse ("Stack-agnostic implementation lead for production-grade delivery" on `engineering-senior-developer`, line 132) but scope is carried by the `exclusive_domains` list rather than by prose.
- **CAT-5 (Prohibitive Over-Reliance):** `deferred_by: ["*"]` is a structural encoding, not a prohibition in prose.
- **CAT-6 (Implicit Preconditions):** `deferred_by: ["*"]` implicitly assumes every other agent exists in the same roster. No external preconditions.
- **CAT-7 (Maximalist Persona Language):** Descriptions are short and operational ("Stack-agnostic implementation lead" is borderline but falls short of maximalist persona language). This file is a registry, not a persona surface.
- **CAT-8 (Unstated Acceptance Criteria):** `conflict_resolution.severity_override` is explicit: "BLOCKER from any agent overrides WARNING from domain owner".
- **CAT-9 (Response Calibration Gaps):** N/A.
- **CAT-10 (Authority Ambiguity):** Primary finding above.

### Close-call note

Line 444 contains a consolidation comment: `# support-analytics-reporter: CONSOLIDATED into data-analytics-engineer (Specialized division)`. This is bookkeeping, not defect. If a future consumer reads the comment as a pointer rather than historical note, no harm — `data-analytics-engineer` is present.
