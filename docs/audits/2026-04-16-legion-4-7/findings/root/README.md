# Audit Findings — README.md

**Audited in session:** S02a
**Rubric version:** 1.0
**File layer:** root
**File length:** 900 lines (heavy file: >200 lines, 25+ H2 sections, 5+ code fences)
**Total findings:** 1 (0 P0, 0 P1, 0 P2, 1 P3)
**Baseline commit:** audit-v47-baseline

**Note on scope:** README.md is a human-facing marketing / overview document. Its behavioral surface at runtime is bounded — actual command/skill/agent behavior is defined in `commands/*.md`, `skills/*/SKILL.md`, and `agents/*.md`. README findings are therefore weighted conservatively: behavioral risk rides on whether an agent, having read only this file, could be induced to act against Legion's intended behavior. Most sections describe rather than instruct, so 4.7-literalism exposure is low.

---

## LEGION-47-005 — P3, CAT-2 Ambiguous Triggers (confirmed)

**Status update (post-S02c):** Flag changed `suspected` → `confirmed`. S02c audit of `.planning/config/intent-teams.yaml` verified no `marketing_keywords` / `design_keywords` entries exist. Parity with `LEGION-47-002`/`LEGION-47-004`.

**Lines 854-855**

> | **Marketing Workflows** | MKT-* requirements or marketing keywords in phase | Campaign planning, content calendars, channel coordination |
> | **Design Workflows** | DSN-* requirements or design keywords in phase | Design systems, UX research, three-lens review (brand + accessibility + usability) |

**Issue:** Parity with `LEGION-47-002` (CLAUDE.md) and `LEGION-47-004` (AGENTS.md). The Optional Features table repeats "marketing keywords" / "design keywords" as activation triggers without enumerating them. Behavioral risk is lower here than in CLAUDE.md/AGENTS.md because this file is a user-facing README rather than a persistent root-context file, but the same language drift-point should be resolved in lockstep so all three surfaces agree.

**Remediation sketch:** Apply the same fix as `LEGION-47-002`/`LEGION-47-004` here. Either restrict to `MKT-*`/`DSN-*` prefix, or cross-reference `.planning/config/intent-teams.yaml` as the authoritative trigger list.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---

## Category Coverage Notes

- **CAT-1 (Open-Set Interpretation):** Several close calls; all assessed as below the finding threshold for this file:
  - Line 218 ("Choose review mode: **classic** ... or **panel** ..."): describes a runtime choice, but the actual implementation path lives in `commands/review.md` and `skills/review-loop/SKILL.md`. Any CAT-1 finding should attach there, not here.
  - Line 219-220 (phase-type-to-agent classic mapping: code/API/design/marketing): enumeration is complete for the domains Legion claims to handle; a phase outside these domains routes through `agent-registry` scoring (described in the Panel mode bullet below), so the open-set risk is bounded.
  - Line 228 ("offer manual fix / accept-as-is / investigate options"): describes `/legion:review`'s ESCALATE branch. Implementation authority lives in `commands/review.md`; README exposure is documentary.
  - Line 299-304 (`/legion:explore` four modes): explicit "Four modes" header with complete bullet list; closed-set via structural completeness.
- **CAT-3 (Underspecified Dispatch):** Several "spawns ... via Agent tool with `model: 'sonnet'`" descriptions (lines 197, 222, 270, 286, 308, 331). All are describing what `/legion:*` commands do when invoked — the authoritative dispatch instructions live in `commands/` and `skills/wave-executor/SKILL.md`. No finding here; audit those files for the real CAT-3 surface.
- **CAT-4 (Underspecified Intent):** Each command section is strongly front-loaded with a one-sentence intent line followed by **Key steps:** / **Skills invoked:** / **Tools:** / **Produces:** / **User interaction:** blocks. Good structure — no finding.
- **CAT-5 (Prohibitive Over-Reliance):** "No infinite retry loops" (line 622), "never rationalize" reference (line 672) both defend closed boundaries. Preserved per CAT-5 exception.
- **CAT-6 (Implicit Preconditions):** Line 596 references `scripts/generate-knowledge-index.js` (a maintainer tool, not an agent-runtime dependency). Line 596 also mentions `--patch` flag in-line. No agent-runtime precondition risks here.
- **CAT-7 (Maximalist Persona):** Not a persona file.
- **CAT-8 (Acceptance Criteria):** Not a workflow.
- **CAT-9 (Response Calibration):** Not an output-producing instruction.
- **CAT-10 (Authority Ambiguity):** Authority is explicitly scoped where it matters — e.g., "Read-only by design — advisors are spawned as Explore agents (tool-level enforcement: no Write, no Edit, no Bash)" at line 379, and cross-reference to Authority Matrix at line 672. No finding.
- **Data drift (out of audit scope):** Line 36 parity drift between CLAUDE.md (30 skills) / AGENTS.md (31) / README.md architecture block (`31 reusable workflow skills`, line 789) should be tracked separately as a maintenance follow-up.
