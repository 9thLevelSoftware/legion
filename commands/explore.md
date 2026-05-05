---
name: legion:explore
description: Enter pre-flight alignment mode with Polymath — crystallize ideas, onboard to codebases, compare approaches, or debate decisions
mode: inline-persona
inline_persona: polymath
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion]
---

<objective>
Guide the user through structured exploration in one of four modes: crystallize (default — transform ideas into project concepts), onboard (guided codebase familiarization), compare (side-by-side approach evaluation), or debate (opposing viewpoint exploration). Load the Polymath persona inline and conduct research-first, choice-driven clarification directly within this command session.
</objective>

<execution_context>
skills/workflow-common-core/SKILL.md
skills/questioning-flow/SKILL.md
skills/polymath-engine/SKILL.md
</execution_context>

<context>
@.planning/PROJECT.md (if exists — check first before proceeding)
@.planning/ROADMAP.md (if exists — check first before proceeding)
@.planning/STATE.md (if exists — provides project state context)
</context>

<process>
## 1. PRE-FLIGHT CHECK

First, determine if exploration is appropriate given current state.

### Check for existing project
- Attempt to read `.planning/PROJECT.md`
- If it exists: Use AskUserQuestion to confirm continuation
  - Message: "A project already exists. Exploration will clarify your NEXT idea, not replace the existing project. Continue?"
  - Option 1: "Yes, explore a new idea" — proceed to step 2
  - Option 2: "No, cancel" — abort exploration, suggest `/legion:status` to review current project
  - Option 3: "I want to modify the existing project" — abort, suggest `/legion:plan` to add phases
- If no project exists: proceed directly to step 2

### Check for exploration notes
- Look for `.planning/exploration-*.md` files
- If found: Offer to resume from previous exploration or start fresh

## 2. MODE SELECTION

Present mode selection before entering Polymath inline mode.

- Use adapter.ask_user with structured choices:
  ```
  "Which exploration mode fits your goal?"
  → Crystallize (default): Transform a raw idea into a clear project concept
    Onboard: Get familiar with an existing codebase through guided exploration
    Compare: Evaluate multiple approaches side-by-side with decision capture
    Debate: Explore a question from opposing viewpoints with winner tracking
  ```
- Store selected mode in exploration state as `mode: crystallize|onboard|compare|debate`
- Proceed to the mode-appropriate opening prompt in step 3

## 3. OPENING PROMPT

Capture the initial input based on selected mode.

### Crystallize mode (default)
- Display: "What are you exploring? Give me the raw idea — a sentence or two."
- Wait for user's initial concept (this is the ONE open input — everything after is structured choices)
- Capture this as the exploration topic
- Validate: if concept is extremely vague (less than 5 words), ask for slightly more detail

**Example good inputs**:
- "A dashboard for tracking personal finances"
- "Redesign the checkout flow for our e-commerce app"
- "Build a CLI tool for managing AWS resources"

### Onboard mode
- If `.planning/CODEBASE.md` exists, present structured choices from the codebase analysis:
  ```
  "Which area do you want to explore?"
  → Full codebase overview: Get oriented with the entire project
    [Area 1 from CODEBASE.md]: [description]
    [Area 2 from CODEBASE.md]: [description]
    Specific file or directory: I know what I'm looking for
  ```
- If no CODEBASE.md exists: Display "Which codebase or area do you want to explore?"
- Wait for user's selection or input
- Capture as the onboard target

### Compare mode
- Display: "What alternatives are you evaluating?"
- Wait for user's input naming the concepts/approaches to compare
- Capture as the comparison topic

### Debate mode
- Display: "What question or decision are you exploring?"
- Wait for user's input describing the debate topic
- Capture as the debate question

## 4. ENTER POLYMATH INLINE MODE

This command operates the conversation directly under the Polymath personality. The current command session IS Polymath for the duration of this exchange. There is no subagent spawn for the user-facing loop.

### Persona load procedure

1. Resolve `AGENTS_DIR` via the Agent Path Resolution Protocol in `skills/workflow-common-core/SKILL.md`.
2. Read `{AGENTS_DIR}/polymath.md` and inject the full personality into the current command context. Use the Read tool, exact path. If the file is missing, emit an `<escalation>` block of severity `blocker`, type `scope`, and stop.
3. Load the structured-choice and 5-7-exchange rules from `skills/polymath-engine/SKILL.md`.
4. From this point forward, all user-facing exchanges happen via `AskUserQuestion` per CLAUDE.md mandate. The personality, mode-specific briefing, and exchange budget govern question selection.

### Optional: silent research delegation

If a structured choice depends on codebase facts the current session cannot quickly retrieve, you MAY spawn a single read-only research agent via `Agent(...)` to gather findings. Constraints:
- Only for non-interactive lookups (file searches, content reads).
- The research agent does NOT drive any user-facing exchange.
- Findings return to the inline session, which then presents structured choices to the user.

### What this section is NOT

- This command does NOT issue `Agent({ description: "...", ... })` to create a subagent for the user-facing loop. The persona runs inline, not as a child agent.
- Language implying a separate entity (e.g., "takes over", "conducts exploration" as a third party) is an anti-pattern. The Polymath persona IS the current command session.

## 5. CONDUCT THE EXPLORATION (inline)

Operating as Polymath, execute the 5-phase workflow inline:

### Phase 1: Research (silent)
Use Grep/Glob/Read to gather codebase facts relevant to the user's mode and topic. No user-facing output during this phase.

### Phase 2-4: Structured exchanges
Present 2-5 structured choices via AskUserQuestion per exchange. After each user selection, update internal understanding (knowns, unknowns) and decide whether to do brief additional research before the next exchange.

### Exchange tracking
Track exchange count internally. Hard cap at 7 exchanges before forcing the decision point in Section 6.

### Self-correction
If you catch yourself drafting an open-ended question, rewrite it as a closed-set choice before sending. Do not send open-ended questions to the user.

## 6. DECISION POINT

Present the final structured choice after 5-7 exchanges.

### Mode-specific decision options:

#### Crystallize mode (default):
> We've explored your concept. Time to decide:
>
> - [A] **Proceed to planning** — crystallized enough, ready for `/legion:start`
> - [B] **Explore more** — specific area needs deeper investigation
> - [C] **Park for now** — not ready, capture what we know and exit

#### Onboard mode:
> We've explored this area. Time to decide:
>
> - [A] **Familiarized** — I have a solid understanding, ready to work
> - [B] **Explore deeper** — want to go deeper into a specific area
> - [C] **Switch area** — want to explore a different part of the codebase

#### Compare mode:
> We've evaluated the alternatives. Time to decide:
>
> - [A] **Decision made** — I've chosen an approach, ready to proceed
> - [B] **Need more options** — want to add or evaluate more alternatives
> - [C] **Refine criteria** — the evaluation criteria need adjustment

#### Debate mode:
> We've examined the viewpoints. Time to decide:
>
> - [A] **Winner clear** — one side is convincingly stronger
> - [B] **Need more evidence** — add another round of arguments
> - [C] **Declare tie** — both sides have equal merit, capture the nuance
> - [D] **Flip sides** — re-debate with reversed positions for stress testing
> - [E] **Park** — save debate state for later

### Crystallize mode outcomes:

#### If "Proceed to planning" selected:
- Save crystallized output to `.planning/exploration-{name}.md` (automatic — never skip)
  - Use a slugified version of the concept as {name} (e.g., "finance-dashboard")
  - Follow the document structure from polymath-engine Section 5
- Display crystallized summary
- Confirm readiness: "Ready to run `/legion:start` with this concept?"
- If yes: Transition to `/legion:start` flow with pre-populated concept

#### If "Explore more" selected:
- Save current exploration progress to `.planning/exploration-{name}.md` (automatic — capture partial state)
- Ask: "Which area needs deeper exploration?"
- Present specific sub-topics as structured choices:
  - Technical approach
  - Scope boundaries
  - User/audience definition
  - Timeline/constraints
  - Dependencies
- Loop back to step 5 with narrowed scope (limit 2-3 more exchanges)
- After narrowed exploration completes, update the saved exploration file with new findings

#### If "Park for now" selected:
- Save crystallized output to `.planning/exploration-{name}.md` (automatic — always persist)
- Display summary of what was crystallized
- Exit gracefully with guidance on next steps

### Onboard mode outcomes:

#### If "Familiarized" selected:
- Save onboard summary to `.planning/exploration-{name}.md` using onboard deliverable template
- Display codebase overview, key files, architecture patterns, conventions discovered
- Suggest next action: "Ready to work on this area, or explore a related part?"

#### If "Explore deeper" selected:
- Save current onboard progress to `.planning/exploration-{name}.md`
- Present specific sub-areas as structured choices based on what was discovered
- Loop back to step 5 with narrowed scope (limit 2-3 more exchanges)

#### If "Switch area" selected:
- Save current onboard progress to `.planning/exploration-{name}.md`
- Return to step 3 (opening prompt) with onboard mode pre-selected
- Previous exploration context is preserved for cross-reference

### Compare mode outcomes:

#### If "Decision made" selected:
- Save comparison summary with winner and rationale to `.planning/exploration-{name}.md`
- Display decision matrix and recommendation
- Suggest next action: "Ready to proceed with the chosen approach?"

#### If "Need more options" selected:
- Save current comparison state
- Return to evaluation with space for new alternatives

#### If "Refine criteria" selected:
- Save current comparison state
- Present criteria adjustment choices, then re-evaluate

### Debate mode outcomes:

#### If "Winner clear" selected:
- Save debate summary with winner, scoring breakdown, and evidence to `.planning/exploration-{name}.md`
- Display final verdict with DPO-inspired scoring breakdown and confidence level
- Suggest next action based on winner: "Ready to proceed with the winning position?"

#### If "Need more evidence" selected:
- Save current debate state
- Continue with targeted research on weak points identified during counter-arguments
- Add another evidence round (limit 2 additional rounds max)

#### If "Declare tie" selected:
- Save nuanced summary capturing both positions with full scoring breakdown
- Present: "How do you want to handle the tie?"
  - Hybrid approach — combine the strongest arguments from both positions
  - Defer decision — gather external input before deciding
  - Accept ambiguity — document both positions as valid and move on

#### If "Flip sides" selected:
- Save current debate state as "round 1"
- Re-run debate phases 2-4 with positions reversed (advocate who argued A now argues B and vice versa)
- Compare scoring across both rounds to stress-test the conclusion
- Note: If full flip implementation is not feasible within the session, present as a suggestion in the deliverable: "Consider re-debating with reversed positions to stress-test this conclusion"

#### If "Park" selected:
- Save full debate state including positions, evidence, counter-arguments, and partial scoring
- Display summary of debate progress so far
- Exit with: "Debate saved. Resume with `/legion:explore` when ready."

## 7. HANDLE DECISION OUTCOME (all modes)

### Outcome: Proceed to planning (crystallize) / Familiarized (onboard) / Decision made (compare) / Winner clear (debate)

1. **Save exploration (automatic)**:
   - Write to `.planning/exploration-{name}.md` using polymath-engine Section 5 format
   - {name} is a slugified version of the concept (e.g., "finance-dashboard", "checkout-redesign")
   - This is NOT optional — exploration context must persist across sessions
   - Display: "Exploration saved to `.planning/exploration-{name}.md`"

2. Display deliverables:
   - Crystallized Summary (1-2 paragraphs)
   - Knowns List
   - Unknowns List
   - Decision Recommendation

3. Confirm transition:
   - "Ready to run `/legion:start` with this crystallized concept?"
   - Option 1: "Yes, start planning" → Transition to `/legion:start`
   - Option 2: "Review the summary first" → Display again
   - Option 3: "Explore a different idea" → Return to step 2

4. If proceeding to `/legion:start`:
   - Pre-populate the "What are you building?" question with crystallized summary
   - Skip to brownfield detection or questioning stages as appropriate
   - Note: "Concept crystallized via `/legion:explore`"

### Outcome: Explore more (crystallize) / Explore deeper (onboard) / Need more options (compare) / Need more evidence (debate)

1. Identify specific area:
   - "Which area needs deeper exploration?"
   - Present structured choices for sub-topics (mode-appropriate)

2. Set scope:
   - "2-3 more exchanges on this topic, then decision"

3. Loop back to step 5:
   - Continue with narrowed focus
   - Track additional exchanges
   - Force decision after 2-3 more exchanges (total max 10)

### Outcome: Park for now (crystallize) / Switch area (onboard) / Refine criteria (compare) / Declare tie (debate)

1. **Save exploration (automatic)**:
   - Write to `.planning/exploration-{name}.md` using polymath-engine Section 5 format
   - This is NOT optional — exploration context must persist across sessions
   - Display: "Exploration saved to `.planning/exploration-{name}.md`"

2. Display what was learned:
   - Crystallized Summary so far
   - Knowns (what's clear)
   - Unknowns (what remains unclear)

3. Exit message:
   - "Exploration parked. When you're ready, run `/legion:explore` again or go directly to `/legion:start` if clarity emerges."

## 8. COMPLETION

Display exploration summary:

```
## Exploration Complete

**Concept**: [crystallized summary]

**Decision**: [Proceed | Explore more | Park]

**Knowns**:
- [known 1]
- [known 2]

**Unknowns**:
- [unknown 1] — [resolution path]

**Next Action**:
[Proceed → Run `/legion:start`]
[Explore more → Continue with sub-topic]
[Park → Resume later via `/legion:explore`]
```

### Success indicators
- [ ] User made clear decision
- [ ] Zero open-ended questions sent to user
- [ ] Research informed significant choices
- [ ] User feels clearer than at start
- [ ] Clear next action defined
</process>

<decision_matrix>
| Situation | Action |
|-----------|--------|
| User provides vague initial concept | Force prioritization with structured choices; validate input has minimum detail |
| Research reveals existing similar code | Ask: build on it or start fresh? Monitor for scope alignment |
| User keeps expanding scope | Force selection: "Pick ONE most important outcome" |
| 7 exchanges reached without clarity | Force decision: proceed, narrow scope, or park — confirm final choice |
| User wants to exit mid-exploration | Offer: save progress, discard, or continue — handle persistence |
| Open-ended question drafted | Self-correct: rewrite as structured choices before sending |
| User asks clarifying question | Answer briefly, then return to structured choices quickly |
</decision_matrix>

<anti_patterns>
- **Do NOT skip the opening prompt** — user must provide initial concept (the only open input)
- **Do NOT let exploration continue indefinitely** — max 7 exchanges (10 if "explore more" selected once)
- **Do NOT ask open-ended questions** — verify structured choices format before every exchange
- **Do NOT automatically proceed to planning** — explicit user decision required at step 5
- **Do NOT skip saving exploration output** — always write to `.planning/exploration-{name}.md` regardless of outcome (Proceed, Explore more, Park). Context loss across sessions is the #1 user complaint.
- **Do NOT break out of Polymath persona mid-exploration** — maintain consistent personality throughout
</anti_patterns>

<example_flow>
**User**: `/legion:explore`

**Command**: "What are you exploring? Give me the raw idea — a sentence or two."

**User**: "A tool to convert markdown to PDF with custom styling"

**[Research phase: gathering codebase context silently]**

**Polymath**: "I found several markdown-processing libraries in your codebase. Which describes your situation?
- [A] New standalone tool
- [B] Add to existing documentation system
- [C] Replace current PDF generation
- [D] Not sure yet"

**[User selects with arrow keys + Enter, exchanges continue...]**

**Polymath (Exchange 6)**: "Final decision time. Which best describes your readiness?
- [A] **Proceed** — I have clarity, ready for `/legion:start`
- [B] **Explore more** — need to investigate styling options deeper
- [C] **Park** — capturing what we know, will revisit later"

**[User selects, command handles outcome]**
</example_flow>

---

**Integration Notes**:
- This command operates as Polymath inline — persona loaded via Read, exploration conducted directly
- Persona source: `agents/polymath.md` (loaded at runtime via agent path resolution)
- Command handles entry/exit, state transitions, persistence, and persona-driven exchanges
- **Structured choices are the key pattern** — every user interaction after step 2 is selection, not composition
- **Arrow keys + Enter** is the interaction model enforced throughout

**Related Commands**:
- `/legion:start` — Formal planning (destination after exploration)
- `/legion:status` — Check existing project state (if exploration aborted)
- `/legion:plan` — Direct planning without exploration

**Version**: 1.0.0
**Created**: Phase 36 — Polymath Integration
