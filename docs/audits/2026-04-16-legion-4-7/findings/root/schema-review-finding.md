# Audit Findings — docs/schemas/review-finding.schema.json

**Audited in session:** S02d
**Rubric version:** 1.0
**File layer:** root
**File length:** 19 lines
**Total findings:** 1 (0 P0, 0 P1, 0 P2, 1 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-009 — P3, CAT-1 Open-Set Interpretation (suspected)

**Lines 10-11**

> "category": { "type": "string" },
> "description": { "type": "string" },

**Issue:** `category` is a free-form string with no enum, no pattern, and no field description. Review findings are authored by QA/review agents at dispatch time (`skills/review-evaluators`, `skills/review-loop`, `skills/review-panel`), and under 4.7 literalism the absence of an enumerated category set invites divergent category inventions across agents and cycles — one agent may write `"security"`, another `"security-issue"`, another `"sec"`. This undermines downstream aggregation (`skills/review-loop` cycle-over-cycle diff tracking, REVIEW.md analytics). Severity P3 rather than P1 because (a) the structural contract is otherwise explicit (`severity` has a closed 5-value enum, `status` has a closed 4-value enum) and (b) no external artifact was observed relying on category normalization yet. Flagged for cross-check against review skills in S08.

**Remediation sketch:** Either (a) add an `enum` to `category` listing the canonical finding categories (e.g. `correctness`, `security`, `performance`, `style`, `testing`, `docs`, `other`), or (b) add a `description` field that names the authoritative enumeration location (e.g. `skills/review-evaluators/SKILL.md`) and defines the "other" escape hatch. Option (a) preferred; matches the closed-set pattern already used for `severity` and `status`.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## Category Coverage Notes

- **Interaction surface:** `title`, root `description`, and enum arrays on `severity` and `status`. No per-field descriptions.
- **CAT-1 (confirmed above, P3):** `category` free-string.
- **CAT-1 close-call — `agent` (line 15):** also free-string. Not filed: same rationale as `plan-frontmatter.schema.json` — agent ID registry is large, delegation to AGENTS.md is acceptable.
- **CAT-4:** Root description states purpose ("a single review finding in REVIEW.md"). Adequate.
- **CAT-8:** `status` enum includes `open|fixed|accepted|deferred` — closed and meaningful.
- **CAT-2, CAT-3, CAT-5, CAT-6, CAT-7, CAT-9, CAT-10:** N/A for structural schemas.
