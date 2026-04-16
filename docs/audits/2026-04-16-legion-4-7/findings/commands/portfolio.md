# Audit Findings — commands/portfolio.md

**Audited in session:** S04
**Rubric version:** 1.0
**File layer:** command
**File length:** 248 lines
**Total findings:** 3 (0 P0, 0 P1, 3 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-038 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 148-156**

> Based on the portfolio state, present options via adapter.ask_user:
> "What would you like to do?"
> Options:
> - "View project details" — "Deep dive into one project's phase history and state"
> - "Add dependency" — "Link phases across projects (e.g., Project A Phase 3 blocks Project B Phase 1)"
> - "Studio Producer analysis" — "Invoke Studio Producer agent for cross-project strategy (uses Opus)"
> - "Done" — "Return to normal operation"

**Issue:** Closed 4-option set formatted as em-dash prose pairs, not structured AskUserQuestion items. No explicit "only valid choices" framing. Identical failure pattern to LEGION-47-031 (retro.md), LEGION-47-034 (milestone.md), and the S03 cluster across board/advise/build.

**Remediation sketch:** Wrap in explicit AskUserQuestion tool invocation with four items. Descriptions go in the `description` field. Add closure: "Exactly four valid responses. Do not propose a fifth."

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-039 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 170-175**

> - Ask user via adapter.ask_user: "Which project is the source (blocker)?" Present registered project names as options
> - Ask: "Which phase in {source_project} must complete first?"
> - Ask: "Which project depends on this?"
> - Ask: "Which phase in {target_project} is blocked?"
> - Ask: "Dependency type?" — Options: "blocks (hard)" / "informs (soft)"

**Issue:** Five sequential "Ask" steps with inconsistent contracts. The two project-selection asks have bounded options (registered project names). The two phase-selection asks ("Which phase must complete first?", "Which phase is blocked?") are free-text — they inherit the S03 `adapter.prompt_free_text` contract defect (AskUserQuestion requires non-empty options; phase numbers must be enumerated from the ROADMAP.md progress table, not accepted as free input). The final ask uses slash-separated inline options, the decorative-menu anti-pattern (cf. LEGION-47-035 milestone.md L181). Cross-reference this finding with S03's architectural observation (LEGION-47-029 learn.md L143 and all related free-text captures) and with LEGION-47-036 (milestone.md L233) — same upstream defect.

**Remediation sketch:** Three fixes. (1) For phase asks: enumerate phase numbers from source/target project's ROADMAP.md Progress table and pass as AskUserQuestion options. (2) For dependency-type ask: wrap in AskUserQuestion with two items plus closure. (3) Alternatively, wait for the documented `adapter.prompt_free_text` primitive and use it only for genuinely-unbounded fields.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-040 — P2, Ambiguous Triggers

**Lines 51-54**

> Assess health using portfolio-manager Section 3 rules:
> - Green `[OK]`: on track, no blockers, recent activity
> - Yellow `[!!]`: "escalated"/"failed"/"blocked" in status, or 7+ days inactive
> - Red `[XX]`: directory missing (Stale), or unresolved blockers 3+ phases

**Issue:** Three health classifications with ambiguous predicates. (1) "on track" is not operationalized — 4.7 must infer. (2) "recent activity" contradicts "7+ days inactive" — is 6 days "recent"? The timestamp source is not specified (STATE.md's "last activity" date field format is referenced but not named). (3) "unresolved blockers 3+ phases" is ambiguous: 3+ phases affected, or blocker present for 3+ consecutive phases, or blocker on a phase 3+ positions back? (4) Rule delegation to "portfolio-manager Section 3" is correct pattern but the inline summary here introduces imprecisions the skill file may not share; drift risk between this summary and the authoritative skill.

**Remediation sketch:** Replace with a deterministic classifier referencing exact fields: "Read STATE.md `last_activity` timestamp. If (now - last_activity) > 7 days, Yellow. If STATE.md `status` field is in {escalated, failed, blocked}, Yellow. If directory missing OR ROADMAP.md has 3+ phases with status=blocked, Red. Else Green." Keep portfolio-manager Section 3 as authoritative; delete the inline summary or assert parity via a CI check.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---
