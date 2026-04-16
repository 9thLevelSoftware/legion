# Audit Findings — commands/start.md

**Audited in session:** S05
**Rubric version:** 1.0
**File layer:** command
**File length:** 216 lines
**Total findings:** 7 (0 P0, 2 P1, 5 P2)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-064 — P1, Open-Set Interpretation of Closed Options (confirmed)

**Lines 26-32**

> 1. PRE-FLIGHT CHECK
>    - Check if `.planning/PROJECT.md` already exists by attempting to read it
>    - If it exists: use adapter.ask_user to confirm reinitialize
>      - "A project already exists in .planning/. Reinitialize from scratch?"
>      - Option 1: "Yes, start fresh" — continue (will overwrite PROJECT.md, ROADMAP.md, STATE.md)
>      - Option 2: "No, keep existing" — abort and suggest `/legion:status` instead
>    - If it doesn't exist: proceed directly

**Issue:** Destructive 2-option gate (yes = overwrite three state files) without closure framing. Under 4.7 literalism the agent may fabricate a third option like "Archive existing, start fresh" or "Migrate only STATE.md, rewrite PROJECT.md" — both sound reasonable but have no implementation and will leave the project in an inconsistent state. The question stem "Reinitialize from scratch?" is yes/no framed, but the option labels are full phrases — mismatch that invites interpolation. Same failure class as LEGION-47-051/053/058. P1 because this is a destructive gate (three-file overwrite) that runs before any other state is captured — wrong answer = data loss.

**Remediation sketch:** Wrap in explicit AskUserQuestion. Rewrite stem: "A project already exists in .planning/. Choose exactly one of two actions." Option 1 label "Overwrite existing project with fresh start (irreversible — PROJECT.md, ROADMAP.md, STATE.md will be replaced)." Option 2 label "Keep existing project and abort /legion:start (no files modified)." Add closure: "Do not propose a third option. Do not merge or archive. Do not proceed until the user selects."

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-065 — P1, Open-Set Interpretation of Closed Options (confirmed)

**Lines 34-60**

> 2. EXPLORATION OFFER
>    ... Use adapter.ask_user with structured choice:
>    "Before we create your project plan, would you like to explore and clarify your idea first?"
>    Options:
>    - **"Yes, explore with Polymath"** (Recommended for new ideas)
>      → Display: ... → Invoke `/legion:explore` workflow
>      → After exploration completes and user selects "Proceed to planning": ...
>      → After exploration completes and user selects "Explore more" or "Park": ...
>    - **"No, jump straight to planning"** (Best if you already have a clear concept)
>      → Skip exploration → Continue directly to brownfield detection
>    Default selection: "Yes, explore with Polymath" (first option)

**Issue:** Nested bounded-option gate with four distinct problems. (1) The "Options" list is 2 but embeds a second set of 3 options from `/legion:explore` ("Proceed to planning" / "Explore more" / "Park") inline in prose, not as a separate AskUserQuestion — 4.7 may treat them as valid first-level choices. (2) "Default selection" wording is ambiguous: does it mean pre-selected in the UI, auto-selected on timeout, or the recommendation?  AskUserQuestion has no notion of a default; selecting a default silently is a CLAUDE.md violation. (3) "Recommended for new ideas" / "Best if you already have a clear concept" are open-ended characterizations — 4.7 may answer on the user's behalf by inferring from prior context. (4) The yes/no stem "would you like to explore...?" mismatches the full-phrase option labels. Same cluster as LEGION-47-058/064 but broader scope — this is the first user-facing gate of a fresh Legion project. P1.

**Remediation sketch:** Wrap in AskUserQuestion. Rewrite stem: "Choose exactly one of two planning entry paths." Remove "Default selection" — AskUserQuestion does not support defaults and auto-selecting silently violates the CLAUDE.md mandate. Move the three explore-mode options ("Proceed to planning" / "Explore more" / "Park") out of this prompt entirely — they are the exit states of `/legion:explore`, not options of the current question. Add closure: "Do not pre-select. Do not propose exploration with a different agent. Do not proceed until the user selects."

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-066 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 68-79**

> - If existing source code detected:
>   Use adapter.ask_user:
>     "I see an existing codebase here. Should I map it before we plan?"
>     Option 1: "Yes, analyze the codebase first" → Run codebase-mapper Sections 2-4 ...
>     Option 2: "No, skip the analysis" → Proceed directly to step 4 (greenfield mode)
>     Option 3: "I'll run /legion:plan directly" → Abort start, let user plan manually

**Issue:** 3-option gate where Option 3 is not an analysis choice but a cancel-and-redirect. Under 4.7 literalism this is a type confusion: Options 1 and 2 answer the question "should I map it", Option 3 answers a different question ("should /legion:start be running at all?"). The agent may merge Options 2 and 3 semantically (both skip mapping) or fabricate a fourth option like "Map only the src/ directory". Also "greenfield mode" appears at L77 but is defined nowhere in the file — precondition violation layered onto the closed-set problem.

**Remediation sketch:** Split into two AskUserQuestions. First (exit-gate): "Existing codebase detected. Continue with /legion:start, or exit and run /legion:plan directly? A Continue — proceed to codebase mapping question. B Exit — run /legion:plan to plan against existing code manually." Second (only if A): "Map the codebase before planning? A Yes analyze (run codebase-mapper Sections 2-4, write .planning/CODEBASE.md). B No skip (proceed as if greenfield — plan against requirements only, no CODEBASE.md generated)." Define "greenfield mode" inline: "greenfield mode = plan without consulting .planning/CODEBASE.md."

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-067 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 127-133**

> 7. QUESTIONING STAGE 3: WORKFLOW PREFERENCES
>    Follow the questioning-flow skill's Stage 3 exactly:
>    - Use adapter.ask_user with 3 structured choice questions:
>      - Execution mode: Guided (Recommended) / Autonomous / Collaborative
>      - Planning depth: Standard (Recommended) / Quick Sketch / Deep Analysis
>      - Cost profile: Balanced (Recommended) / Economy / Premium
>    - Record choices as decisions

**Issue:** Three 3-option gates rendered inline as a single bullet each. No closure, no stem, no definitions. Under 4.7 literalism: (a) "Guided / Autonomous / Collaborative" labels are not defined in this file — agent may infer wrong semantics or invent a hybrid; (b) "(Recommended)" markers have no implementation rule — are they pre-selected? fallback-on-no-answer? just advisory?; (c) the three questions are listed but not wrapped in three separate AskUserQuestion invocations — 4.7 may render them as a single multi-select prompt (invalid in Claude Code) or skip them by assuming the recommended defaults. CLAUDE.md mandates AskUserQuestion for each; this file delegates with "Follow the questioning-flow skill's Stage 3 exactly" but the delegation is a pointer, not an instruction — 4.7 should have the concrete prompts here.

**Remediation sketch:** Replace the bullet list with three explicit AskUserQuestion specifications, each with stem, 3 enumerated options with 1-sentence definitions, and closure. E.g., "Execution mode — choose exactly one: A Guided (Legion pauses for user confirmation at each phase gate); B Autonomous (Legion runs to completion without intermediate confirmation); C Collaborative (Legion pauses for user confirmation at each plan, finer-grained than Guided). Do not combine. Do not propose hybrids." Remove "(Recommended)" unless AskUserQuestion supports a preselect hint — if not, put the recommendation in the option description instead.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-068 — P2, Ambiguous Triggers (confirmed)

**Lines 62-67**

> 3. BROWNFIELD DETECTION
>    Follow codebase-mapper skill Section 1 (Source Code Detection Heuristic):
>    - Check for non-Legion source files in the current directory:
>      - Any source files outside .planning/, .claude/, .codex/, .cursor/, .windsurf/, .gemini/, .opencode/, and .aider/?
>      - Any package.json, Gemfile, pyproject.toml, requirements.txt, go.mod at root?
>      - Any src/, app/, lib/, components/ directories?

**Issue:** Triple-heuristic trigger without aggregation rule. Under 4.7 literalism: do all three must match, any one, or a weighted score? "Source files" is undefined — any file not in the excluded directories, or files with specific extensions? The excluded-directory list omits .kiro/ (Kiro CLI runtime dir, present in AGENTS.md) and .legion/ (fallback install directory cited in update.md L41). "Any package.json ... at root" — what about monorepos with package.json at root and no src/? L66 "src/, app/, lib/, components/" silently excludes `internal/`, `cmd/`, `pkg/` (Go), `tests/`, `spec/` (Ruby) — but codebase-mapper may match them, creating a behavioral discrepancy between this file and the skill it delegates to. Trigger-explicitness cluster — peer of LEGION-47-002, 004, 048.

**Remediation sketch:** Replace with delegation: "Run codebase-mapper skill Section 1 Source Code Detection Heuristic. If the skill returns `detected: true`: proceed with brownfield flow. If `detected: false`: skip brownfield — proceed to step 4. Do not duplicate the heuristic inline — codebase-mapper is authoritative to prevent drift." If delegation is not feasible, enumerate exhaustively: state extension list, directory-match rule (any one of set X OR any one of set Y), case rule, and aggregation (logical OR across the three bullets).

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---

## LEGION-47-069 — P2, Implicit Preconditions (suspected)

**Lines 97-109**

> **First: Check for saved exploration files (even if explore wasn't run this session)**
> - Look for `.planning/exploration-*.md` files
> - If found: read the most recent one (by filename or modification time)
> - Extract: Crystallized Summary, Knowns, Unknowns, Decisions Made
> - Set exploration_context = extracted data

**Issue:** Two underspecified preconditions. (1) "by filename or modification time" — which? The L53 write rule uses `exploration-{timestamp}.md` so filename sort = mtime sort when the timestamp format is sortable — but "timestamp" format is unspecified (ISO8601? unix epoch? HH:MM date?). Under 4.7 literalism: if a filename has a non-sortable format, agent may tie-break to mtime silently; if filenames differ in format between sessions, results are non-deterministic. (2) "Extract: Crystallized Summary, Knowns, Unknowns, Decisions Made" — these are section titles but the exploration file schema is not specified in this command and not listed in the `<context>` block. If /legion:explore produces a different schema, extraction silently fails and `exploration_context` may be partial — but the code path at L106 assumes it is well-formed. Peer of LEGION-47-042 (quick.md) and LEGION-47-056 (review.md) precondition-verification findings.

**Remediation sketch:** Specify timestamp format: "Exploration files are named `.planning/exploration-YYYY-MM-DDTHH-MM-SSZ.md` (ISO8601 UTC with colons replaced by hyphens for filesystem safety). Sort alphabetically descending — equivalent to mtime descending when format is honored." Add explicit section-presence check: "Open the chosen file. Verify it contains exactly these H2 headings: `## Crystallized Summary`, `## Knowns`, `## Unknowns`, `## Decisions Made`. If any heading is missing: set exploration_context = null and log 'Exploration file schema mismatch — ignoring.'"

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-070 — P2, Underspecified Intent (suspected)

**Lines 7-9, 25**

> <objective>
> Guide the user through an adaptive questioning flow to capture project vision, requirements, and constraints. Produce PROJECT.md, ROADMAP.md, and STATE.md with recommended agents per phase.
> </objective>
>
> <process>
> 1. PRE-FLIGHT CHECK

**Issue:** The objective describes outputs (three files) but omits the acceptance predicate that ties the 12-step process together. No "the command is done when ..." statement. Under 4.7 literalism a step may silently no-op if the loading process fails (e.g., Step 3 brownfield detection heuristic returns ambiguous; Step 5-7 questioning goes off-rails because the user provides a one-word answer). Steps do not state "I cannot proceed to N+1 until N produces [artifact X]." Peer of LEGION-47-013 (plan.md intent-front-loading) and the rubric's CAT-4 anti-pattern example.

**Remediation sketch:** Add to <objective>: "DONE WHEN all three of: (a) .planning/PROJECT.md exists with non-empty Requirements section; (b) .planning/ROADMAP.md exists with at least 1 phase and each phase has 2-4 recommended agents; (c) .planning/STATE.md exists and references Phase 1 as current. If any step raises an escalation blocking completion, stop before Step 12 and surface the escalation — do not write partial state." Also: for each numbered step, add a one-line purpose statement at the top.

**Remediation cluster:** `intent-front-loading`
**Effort estimate:** small

---
