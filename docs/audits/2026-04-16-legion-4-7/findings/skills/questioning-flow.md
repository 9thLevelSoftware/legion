# Audit Findings — skills/questioning-flow/SKILL.md

**Audited in session:** S07
**Rubric version:** 1.0
**File layer:** skill
**File length:** 258 lines
**Total findings:** 6 (1 P1, 5 P2)
**Baseline commit:** audit-v47-baseline

**Context:** This is Legion's canonical closed-set-question skill, referenced by `commands/start.md` as the engine for project-initialization questioning. Whatever it says about AskUserQuestion contracts propagates to every consumer. High-density CAT-1/CAT-4/CAT-8 focus per Task 10 guidance.

---

## LEGION-47-132 — P1, Open-Set Interpretation of Closed Options (confirmed)

**Lines 28-47**

> ### Stage 1: Vision & Identity (1-3 exchanges)
>
> **Purpose**: Capture `{project_name}`, `{project_description}`, `{value_proposition}`, `{target_users}`.
>
> **Open with**:
> > "What are you building? Give me the elevator pitch."
>
> From the user's response, extract what you can. Then ask only what's still missing:
>
> | Question | Ask if... | Fills |
> |----------|-----------|-------|
> | "Who is this for? Who are the primary users?" | Not clear from pitch | `{target_users}` |
> | "What problem does this solve that isn't solved today?" | Value prop unclear | `{value_proposition}` |
> | ...
>
> **After Stage 1** — Summarize and confirm:
> > "Here's what I'm understanding: **[project_name]** is [project_description]. It's for [target_users] and the core value is [value_proposition]. Anything to correct or add?"

**Issue:** Stage 1 is entirely free-text capture routed (per Section 1 item 4, L20: "Stage 1-2 are conversational; Stage 3 uses explicit choice prompts") *without* AskUserQuestion. This is the canonical S03 CAT-1 contract defect manifesting at Legion's highest-leverage surface. CLAUDE.md mandate ("When any `/legion:` command needs to ask the user a question or present choices, you MUST use the `AskUserQuestion` tool") admits *no exceptions*. "Conversational" free-text capture violates the mandate — 4.7-literal readers face the contradiction: follow this skill (free-text prose) or follow CLAUDE.md (AskUserQuestion). The confirmation step ("Anything to correct or add?") is itself an unbounded free-text response that no AskUserQuestion schema can express. This has been the outstanding cross-cut since S03 pending `adapter.prompt_free_text` primitive decision. questioning-flow is ground zero; every consumer inherits this. Confirmed P1 (user-facing surface), not P2, because this is the first-run experience of every new Legion project.

**Remediation sketch:** (a) Resolve the `adapter.prompt_free_text` decision — either (i) add a free-text primitive to the adapter contract and rewrite CLAUDE.md mandate to exempt or require the primitive, or (ii) reframe Stage 1 as bounded questions with "Other (free-text)" escape hatches routed through a defined primitive. (b) Revise Section 1 item 4 to be self-consistent: if AskUserQuestion is mandated everywhere, "conversational" is not a valid mode and Stage 1 must be restructured as option-driven; if free-text capture is a documented exemption, cite the exemption and its mechanism. (c) Replace "Anything to correct or add?" with an AskUserQuestion offering: Proceed / Correct a specific field (enumerate) / Add missing information (free-text via primitive) / Cancel.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** large

---

## LEGION-47-133 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 76-102**

> ### Stage 3: Workflow Preferences (1-2 exchanges)
>
> **Purpose**: Capture execution mode, planning depth, and cost profile. These shape how ROADMAP.md phases are structured and how agents execute.
>
> Present three structured choices. Use clear descriptions so the user can choose quickly.
>
> **Question 1 — Execution Mode**:
> - **Guided** (Recommended): Legion recommends actions, you approve before each step. Best for first-time use or high-stakes projects.
> - **Autonomous**: Legion plans and executes, you review at checkpoints. Best for trusted workflows or time pressure.
> - **Collaborative**: Work alongside agents with high interaction. Best when you want to stay hands-on.
>
> **Question 2 — Planning Depth**: ...
> **Question 3 — Cost Profile**: ...

**Issue:** Stage 3 is the "structured choices" section per Section 1 philosophy, but three defects accumulate. (1) The skill says "Present three structured choices" — ambiguous: three sequential AskUserQuestion calls (one per question), OR one AskUserQuestion with three fields (AskUserQuestion supports multiple questions in one invocation per CLAUDE.md examples). A 4.7-literal reader will pick one interpretation; drift between agent instances. (2) No AskUserQuestion call is specified here, despite CLAUDE.md mandate — just prose that describes the options with "(Recommended)" labels. No explicit "wrap in AskUserQuestion" instruction; peer to LEGION-47-040, 045, 051 where this is explicitly required. (3) No "Other" or "Cancel" option in any of the three questions, and no "Default to Recommended without asking" branch. The `(Recommended)` tag creates false certainty that the default choice is bound — what if the user's terminal session is non-interactive? Sleep-timeout default? Abort? Unspecified. Confirmed CAT-1 load-bearing gate peer to LEGION-47-040 (review.md reviewer-selection).

**Remediation sketch:** (a) Pick one interpretation: "Issue 3 sequential AskUserQuestion calls, one per question; store answers in memory before Stage 3 exit" OR "Issue one AskUserQuestion with three multi-question fields using the AskUserQuestion `questions` array primitive." Make this explicit in the skill. (b) Wrap the prose in a concrete AskUserQuestion invocation: "Use adapter.ask_user with structured choice: question='Execution mode?' options=['Guided (recommended)', 'Autonomous', 'Collaborative']. Persist answer to `{decisions_table}` before asking next question." Do this for all three. (c) Non-interactive fallback: "If terminal is non-interactive or user declines to answer within a defined timeout, apply Recommended defaults (Guided / Standard / Balanced) and record rationale 'Defaulted — no user response' in `{decisions_table}`." (d) Add Cancel option: "Cancel initialization — exit /legion:start without writing .planning/ files."

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-134 — P2, Ambiguous Triggers (confirmed)

**Lines 57-65**

> **Adaptive follow-ups** — select based on project type detected in Stage 1:
>
> | Project type signal | Follow-up questions |
> |---------------------|---------------------|
> | Code/software | Stack preferences? Existing codebase? Deployment target? |
> | Content/marketing | Platforms? Voice/tone? Publishing frequency? |
> | Design | Brand guidelines? Target devices? Accessibility requirements? |
> | Research/analysis | Data sources? Deliverable format? Stakeholder audience? |
> | Mixed/unclear | Cover the most relevant subset; skip the rest |

**Issue:** "Project type detected in Stage 1" has no detection algorithm specified. Stage 1 captures free-text (LEGION-47-132); how does the agent classify that text into one of 5 signals? Substring match? Keyword list? LLM classification? Unspecified. The signals themselves are an ambiguous-triggers class peer to LEGION-47-115, 116 domain-keyword registry cross-cut: "Content/marketing" here maps to marketing; "Design" maps to design. Presumably these connect to phase-decomposer's Marketing/Design Domain Detection (L94-134), but this skill does not cross-reference the canonical registry and does not specify the mapping. A 4.7-literal reader has to invent the classification logic. "Mixed/unclear" fallthrough is itself an underspecified acceptance-criterion: "cover the most relevant subset" has no decision rule. S02c re-inheritance.

**Remediation sketch:** (a) Specify classification: "Apply word-boundary regex match of phase description (from Stage 1 elevator pitch + follow-ups) against `domain_keywords.{marketing,design,code,research}` in `intent-teams.yaml` (per LEGION-47-115 remediation). First matching domain wins; ties trigger 'Mixed/unclear'." (b) Cross-reference the canonical registry once it exists (blocked on LEGION-47-115/116 remediation landing). (c) Define "Mixed/unclear" fallthrough: "Ask all 4 rows' questions in the order shown; skip questions the user declines to answer by responding with an explicit 'Skip' or null."

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---

## LEGION-47-135 — P2, Unstated Acceptance Criteria

**Lines 21, 157-215**

> 5. **Target 5-8 total exchanges** — not 20 questions. Combine related questions. Skip what's already clear.
>
> [Section 4]
> ## Section 4: Phase Decomposition Guidelines
>
> After all three stages are complete, decompose the captured requirements into phases for ROADMAP.md.
> ...
> 3. **Size each phase for 2-3 plans** (max 3 tasks per plan):
>    - Simple phase (config, setup): 1-2 plans
>    - Standard phase (feature build): 2-3 plans
>    - Complex phase (multi-system integration): 3 plans

**Issue:** Two acceptance-criteria gaps. (1) "Target 5-8 total exchanges" is a soft target with no enforcement — a 4.7 reader has no acceptance test for "when is Stage 2 done?" The stage count rules (Stage 1: 1-3 exchanges; Stage 2: 2-4 exchanges; Stage 3: 1-2 exchanges — sum 4-9, not 5-8 as L21 claims: 1+1+1=3 minimum, 3+4+2=9 maximum; the "5-8" target does not match the range arithmetic). This arithmetic inconsistency suggests the target was retrofitted after the per-stage counts and now they drift. (2) Section 4 Step 3 phase-sizing criteria overlap: "Simple: 1-2 plans" / "Standard: 2-3 plans" — 2 plans could be Simple or Standard. Peer CAT-8 class to LEGION-47-126, 131.

**Remediation sketch:** (a) Reconcile exchange count: state per-stage ranges are authoritative, delete the "5-8 total" line OR update per-stage to 1-2 / 2-3 / 1-2 (sum 4-7; or 2-3 / 2-3 / 1-2 for 5-8 match). (b) Define completion condition per stage: "Stage 2 is complete when `{requirements_list}` has ≥1 checkbox item AND `{out_of_scope}` has been explicitly acknowledged (even if empty — confirm 'nothing to exclude')." (c) Make phase sizing disjoint: "Simple: 1 plan. Standard: 2 plans. Complex: 3 plans. Phase with > 3 plans: split the phase or cite the split-exception rule."

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-136 — P2, Prohibitive Over-Reliance

**Lines 16-23**

> ## Section 1: Questioning Philosophy
>
> 1. **Vision first, technology second** — understand what the user wants to exist before asking how to build it.
> 2. **Adaptive depth** — follow the user's energy. If they go deep on a topic, explore it. If they give a terse answer, move on.
> 3. **Infer where possible, confirm where uncertain** — don't ask questions the user already answered implicitly. State your inference and let them correct it.
> 4. **Structured choices for preferences, open conversation for vision** — Stage 1-2 are conversational; Stage 3 uses explicit choice prompts.
> 5. **Target 5-8 total exchanges** — not 20 questions. Combine related questions. Skip what's already clear.
> 6. **Summarize between stages** — after each stage, reflect back what you captured and ask for corrections before moving on.

**Issue:** Six principles stated as inviolable ("**Vision first**", "**Adaptive depth**", "**Infer where possible**") but each has counter-examples in the skill body that are not explained. Principle 2 "Adaptive depth — follow the user's energy" contradicts Principle 5 "Target 5-8 exchanges" when a user wants to go deep (19 deep-exchange responses exceed target but Principle 2 says "follow the user's energy"). Principle 3 "Infer where possible, confirm where uncertain" depends on a confidence threshold for "uncertain" — unspecified; a 4.7-literal reader may infer everything (zero confirmations) or confirm everything (full question list). The principles function as guidance, not as decision rules; yet the maximalist bold-headed framing ("**Vision first, technology second**") invites them to be read as absolute. Moderate severity CAT-5 class — the over-reliance doesn't break the skill but makes it brittle under unusual inputs.

**Remediation sketch:** (a) Reframe the principles as defaults with explicit escape clauses: "Vision first — ask about identity before stack UNLESS the user opens with a stack choice, in which case capture it, confirm, and return to vision." Do this for each principle. (b) For Principle 3 "uncertain", add confidence criterion: "Inference is permitted iff confidence ≥ 0.7 — the inferred value matches the user's wording or a strong signal. If <0.7, confirm explicitly." (c) Resolve 2 vs. 5 conflict: "If user energy signals deep exploration on a topic (3+ follow-up questions on the same field), accept exceeding 5-8 target and note in decisions_table 'Extended questioning — user requested depth'."

**Remediation cluster:** `authority-language`
**Effort estimate:** small

---

## LEGION-47-137 — P2, Implicit Preconditions

**Lines 237-240**

> ### Existing .planning/ directory detected
> The `start.md` command handles the overwrite warning. If the user confirms reinitialize, proceed with a clean questioning flow. Do not attempt to merge with existing state — it's a fresh start.

**Issue:** "start.md command handles the overwrite warning" is a delegation declaration without the handoff contract. start.md (audited in S05 per LEGION-47-076) does handle a pre-flight check at L27-32 ("A project already exists in .planning/. Reinitialize from scratch?"). But this skill's "proceed with a clean questioning flow" assumes the file state is clean after user confirms — no explicit check that PROJECT.md/ROADMAP.md/STATE.md are deleted or reset. If start.md's cleanup is incomplete or if the user invokes questioning-flow directly (not via start.md, which is an architectural possibility in some adapters), the skill writes into a partially-populated .planning/ state. Dual-authority boundary gap peer to LEGION-47-085 ground-truth class.

**Remediation sketch:** (a) Add explicit precondition: "Before Stage 1, verify .planning/PROJECT.md does NOT exist. If it does, abort with PREEXISTING-STATE error and direct user to /legion:start which handles the overwrite flow. Do not attempt to clean up from within questioning-flow — that is start.md's responsibility." (b) Document the contract: start.md guarantees a clean slate before invoking questioning-flow. (c) Add a verification line at Section 3 Output Structure time: "After writing PROJECT.md, confirm the file was created fresh (mtime == now, not a merged version)."

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## Category Coverage Notes

- **CAT-1** (Open-Set Interpretation): 2 findings (LEGION-47-132 P1 confirmed, 133 P2 confirmed). Stage 1 free-text capture violates CLAUDE.md AskUserQuestion mandate (inherited S03 defect); Stage 3 structured choices described in prose without wrapping in AskUserQuestion. These are the highest-leverage CAT-1 findings in the audit so far — questioning-flow is the engine every new Legion project passes through. P1 escalation on LEGION-47-132 is justified by: user-facing surface, first-run failure class, canonical-skill propagation to every consumer, S03 cross-cut visibility.
- **CAT-2** (Ambiguous Triggers): 1 finding (LEGION-47-134). Project-type classification from free-text Stage 1 has no algorithm; cross-cuts with LEGION-47-115/116 domain-keyword registry gap.
- **CAT-3** (Underspecified Dispatch): 0 findings. This skill does not dispatch agents — it captures user input and writes templates. Dispatch happens in Section 4 Step 5 by delegation to agent-registry Section 3, correctly referenced.
- **CAT-4** (Underspecified Intent): 0 findings. Intent is adequately front-loaded — Section 1 Questioning Philosophy precedes all actions; each Stage declares Purpose at its start.
- **CAT-5** (Prohibitive Over-Reliance): 1 finding (LEGION-47-136). Six bold-headed principles stated absolutely with internal conflicts unresolved. Moderate-severity; doesn't break the skill but adds brittleness.
- **CAT-6** (Implicit Preconditions): 1 finding (LEGION-47-137). "start.md handles overwrite" delegation without contract verification.
- **CAT-7** (Maximalist Persona Language): 0 findings. Engine skill, not persona.
- **CAT-8** (Unstated Acceptance Criteria): 1 finding (LEGION-47-135). Exchange-count arithmetic inconsistent; phase-sizing overlap.
- **CAT-9** (Response Calibration Gaps): 0 findings. Stage exchange-count ranges are bounded; phase-sizing has boundary issues (moved to CAT-8).
- **CAT-10** (Authority Ambiguity): 0 findings. Delegation is clearly declared (Section 4 Step 5 defers to agent-registry; Section 5 Existing-directory defers to start.md).

**Severity summary:** 6 findings total — 0 P0, 1 P1, 5 P2, 0 P3.
**Confirmed count:** 3 of 6 (LEGION-47-132 P1 confirmed S03 cross-cut at canonical surface; 133 confirmed CAT-1 load-bearing gate; 134 confirmed S02c trigger registry cross-cut). Others single-instance or reframing-class.
