---
name: polymath-engine
description: Execution engine for structured exploration workflows — research-first clarification with gap detection and decision support
triggers: [explore, clarify, crystallize, pre-flight, alignment]
token_cost: medium
summary: "Research-first exploration engine: investigates domain, detects knowledge gaps, guides structured choices, produces crystallized output. Implements Polymath agent workflow."
---

# Polymath Engine

Execution engine for pre-flight alignment workflows. Consumed by `/legion:explore` and potentially other exploration contexts. Implements the research-first, structured-choice methodology defined in `agents/polymath.md`.

---

## Section 1: Research Phase (Silent)

**Purpose:** Gather context BEFORE interacting with the user.

**When to run:** Automatically at the start of every exploration session.

**Research checklist:**

1. **Codebase scan** — Does this build on existing code?
   ```bash
   # Search for relevant files based on user's concept keywords
   grep -r "keyword" --include="*.js" --include="*.ts" --include="*.py" --include="*.md" . 2>/dev/null | head -20
   ```
   - Look for: existing implementations, similar features, reusable components
   - Document: what exists, what patterns are established

2. **Documentation scan** — What does Legion already know?
   - Read `.planning/PROJECT.md` if exists (existing project context)
   - Read `.planning/CODEBASE.md` if exists (brownfield mappings)
   - Read relevant skill files matching the domain (grep `triggers:` for keywords)
   - Check `.planning/memory/` for patterns from past projects

3. **External research** — Is this a known domain?
   - If domain-specific (e.g., "OAuth", "WebRTC", "Kubernetes"): use WebSearch or WebFetch
   - If library/framework mentioned: check for best practices
   - Document: standard approaches, common pitfalls

**Research output format:**
```markdown
## Research Findings

**Codebase:**
- Found: [files/patterns]
- Relevant to exploration: [how it relates]

**Documentation:**
- Existing project: [yes/no, summary if yes]
- Relevant skills: [list]
- Past patterns: [from memory if available]

**External:**
- Domain knowledge: [what we know about this space]
- Standard approaches: [common solutions]
- Potential pitfalls: [risks to flag]
```

**Critical rule:** Research must complete in under 2 minutes. If deeper research needed, flag as a gap to explore, don't block the conversation.

### Extended Thinking Mode

If `settings.json` `models.planning_reasoning` is `true` AND the active adapter's `supports_extended_thinking` is `true`:
- Use `adapter.model_planning` (e.g., `opus`) for the research synthesis and crystallization phases
- Extended thinking provides deeper analysis of:
  - Cross-source pattern recognition (connecting codebase findings with external research)
  - Gap detection accuracy (identifying implicit unknowns the user hasn't surfaced)
  - Crystallization quality (sharper summaries with better-justified recommendations)
- The exploration output format is identical; only the reasoning depth changes

If `models.planning_reasoning` is `false`: use `adapter.model_execution` as normal

---

## Section 2: Structured Choice Protocol

**Purpose:** Every user interaction is a selection, not composition. Every prompt MUST be an `adapter.ask_user` invocation (AskUserQuestion on Claude Code) — never free prose, never a decorative arrow-prefixed menu rendered as text.

**Choice format — REQUIRED schema:**

Every user-facing question is issued via `adapter.ask_user` with an options array. Each option is a structured object — not a line of free text.

```yaml
adapter.ask_user:
  question: "[One concrete question derived from research — no filler]"
  context: "[Optional: 1-2 sentence research grounding, rendered above the options]"
  multiple: false                # true only when the primitive supports multi-select
  options:
    - id: "option-a"             # kebab-case, stable, unique per question
      label: "[Short label — ≤60 chars]"
      description: "[Clear description — what choosing this means, ≤140 chars]"
    - id: "option-b"
      label: "[Short label]"
      description: "[Clear description]"
    - id: "option-c"
      label: "[Short label]"
      description: "[Clear description]"
    # Bounded space (greenfield/brownfield detection, binary decisions): stop here.
    # Unbounded space (concept exploration, approach comparison): include exactly one
    # escape option — id MUST be "other":
    - id: "other"
      label: "None of these / Not sure"
      description: "Opens adapter.prompt_free_text for an alternative description"
```

**Formatting rules (binding):**

- Do NOT prefix any option with `→`, `*`, `-`, `•`, or any other decorative character. The adapter primitive handles rendering — typing arrows into labels causes them to render as literal characters inside the option text.
- Do NOT indent options under the question. `adapter.ask_user` is a structured call, not a bullet list.
- Do NOT use placeholders like `[Option A]` or `[Option X]` in the final emitted call — these are template markers only. Every option MUST have a concrete label and description derived from research findings before the call is issued.
- Do NOT append free-text capture to the question itself. If the concept space is unbounded, add an `id: "other"` option whose description notes it opens `adapter.prompt_free_text` — do NOT print a prose "or describe your own" prompt alongside the options.

**Principles (resolved — no internal conflict):**

1. **Mutually exclusive** — Options MUST NOT overlap in meaning. If two options could both describe the same situation, merge or re-scope them.
2. **Collectively exhaustive** — Guaranteed by construction:
   - For BOUNDED concept spaces (e.g., greenfield vs brownfield, yes/no/defer): enumerate every case; do NOT include `id: "other"`.
   - For UNBOUNDED concept spaces (e.g., approach selection, architecture choice): include exactly one `id: "other"` option.
   - Rule 1 and Rule 2 do not conflict: exhaustiveness is achieved either by total enumeration (bounded) or by the `other` escape (unbounded).
3. **Concrete** — Every label and description references a specific situation. Reject vague filler like "It depends" or "Something else."
4. **Actionable** — Each choice MUST map to a clear next step Polymath takes after selection — no dead-end options.
5. **Research-informed** — Use the `context` field to reference the research finding that shaped the options (e.g., "Your repo uses Next.js App Router, which rules out Pages-Router patterns.").

**Adapter primitive registration:**

- `adapter.ask_user` MUST be registered in every adapter's conformance metadata under `primitives.ask_user`. On Claude Code this maps to the `AskUserQuestion` tool. Adapters without a structured question surface (e.g., certain CLI adapters) MUST emit a deterministic numbered-list fallback — Polymath never emits raw prose.
- `adapter.prompt_free_text` is a SEPARATE primitive invoked ONLY when the user selects an `id: "other"` option. Polymath never invokes it as the default entry point for a question.

**Anti-patterns — reject on sight:**

- Decorative arrow prefixes (`→ Option A:`) or bullet menus printed as literal text
- Free-text capture as the default prompt (violates CLAUDE.md AskUserQuestion mandate)
- Template placeholders (`[Option A]`) emitted in final calls
- "Tell me more" prompts or unbounded "What do you think?" questions
- Vague options like "Something else" without an `id: "other"` escape primitive
- Questions requiring user research (that's Polymath's job — research before asking)

---

## Section 3: Knowledge Gap Detection

**Purpose:** Identify and categorize what's still unknown.

**Gap categories:**

| Category | Description | Example |
|----------|-------------|---------|
| Technical | Stack/technology unknowns | "Which database?" |
| Scope | Feature boundary unclear | "MVP vs full feature?" |
| Constraint | Limitations undefined | "Timeline? Budget?" |
| Dependency | External requirements | "Need API access?" |
| Risk | Potential blockers | "Compliance requirements?" |

**Onboard gap categories:**

| Category | Description | Example |
|----------|-------------|---------|
| Architecture | Structural patterns unclear | "How do modules communicate?" |
| Convention | Coding standards undefined | "What naming convention is used?" |
| Dependency | Package purposes unknown | "Why is this library included?" |
| Setup | Environment configuration unclear | "How to run this locally?" |
| History | Design decision rationale missing | "Why was this pattern chosen?" |

**Compare gap categories:**

| Category | Description | Example |
|----------|-------------|---------|
| Criteria | Evaluation dimensions unclear | "What metrics matter most?" |
| Trade-off | Hidden costs or conflicts unknown | "What do you lose by choosing X?" |
| Validation | Claims unverified by evidence | "Is that benchmark accurate?" |
| Cost | Total cost of ownership unclear | "What are the long-term maintenance costs?" |
| Experience | Team/user familiarity unknown | "Has anyone used this in production?" |

**Debate gap categories:**

| Category | Description | Example |
|----------|-------------|---------|
| Position | Framing of a side is unclear or incomplete | "What exactly does Position A claim?" |
| Evidence | Supporting data is missing or unverified | "Is there research backing this argument?" |
| Assumption | Unstated premises underlying an argument | "What assumption makes this argument work?" |
| Precedent | Historical examples or case studies missing | "Has this approach been tried before?" |
| Blind spot | Risks or consequences not yet considered | "What could go wrong that neither side addressed?" |

**Gap detection workflow:**

1. **Track stated vs implied**
   - User stated: captured in choices selected
   - User implied: inferred from context
   - What's missing: gaps = (what's needed) - (stated + implied)

2. **Surface gaps explicitly**
   ```markdown
   I've captured:
   - [what we know]
   
   Still unclear:
   - [Gap 1]: [category] — [specific question]
   
   Which describes [Gap 1]?
   → [Option A]
     [Option B]
     [Option C]
   ```

3. **Force resolution or acceptance**
   - Every gap must be either: answered, explicitly deferred, or flagged as blocker
   - No "we'll figure it out later" — that's a deferral decision

**Gap resolution patterns:**
- **Answered:** User selects specific option → documented
- **Deferred:** User selects "Decide later" → added to "Deferred Decisions" list
- **Blocker:** User selects "Don't know yet" → may trigger "Park" recommendation

---

## Section 4: Exchange Management

**Purpose:** Keep exploration bounded and purposeful.

**Exchange limit:** Maximum 7 exchanges (research doesn't count as exchange).

**Exchange tracking:**
```yaml
exchange: 3/7
topic: scope-prioritization
previous_choices:
  - exchange-1: greenfield-vs-brownfield → greenfield
  - exchange-2: domain-type → web-application
  - exchange-3: scope-level → [current]
```

**Exchange types:**

| Exchange # | Purpose | Typical Choices |
|------------|---------|-----------------|
| 1 | Orient | Greenfield/brownfield, domain type |
| 2-3 | Clarify | Scope level, key features, constraints |
| 4-5 | Gap fill | Technical stack, timeline, dependencies |
| 6 | Confirm | Verify understanding, surface any final gaps |
| 7 | Decide | Proceed / Explore more / Park |

**Onboard exchange pattern:**

| Exchange # | Purpose | Typical Choices |
|------------|---------|-----------------|
| 1 | Depth selection | Overview / Architecture / Code walkthrough |
| 2-3 | Area exploration | Directory focus, pattern investigation |
| 4-5 | Deep dive | Specific files, data flow, dependency chains |
| 6 | Knowledge check | Validate understanding of key concepts |
| 7 | Decide | Familiarized / Explore deeper / Switch area |

**Compare exchange pattern:**

| Exchange # | Purpose | Typical Choices |
|------------|---------|-----------------|
| 1 | Alternative identification | Confirm/add alternatives from research |
| 2 | Criteria definition | Select relevant comparison criteria |
| 3 | Criteria weighting | Weight each criterion: critical/important/nice-to-have |
| 4 | Structured comparison | Review scores, request deeper evidence |
| 5 | Trade-offs & constraints | Identify deal-breakers, hidden costs |
| 6 | Recommendation review | Accept/reject recommendation, challenge scores |
| 7 | Decision & capture | Commit to choice, capture rationale |

**Debate exchange pattern:**

| Exchange # | Purpose | Typical Choices |
|------------|---------|-----------------|
| 1 | Position setup | Confirm/adjust opposing positions |
| 2 | Evidence for Position A | Assess strength: Compelling/Reasonable/Weak/Mixed |
| 3 | Evidence for Position B | Assess strength: Compelling/Reasonable/Weak/Mixed |
| 4 | Counter-arguments | Which side countered more effectively |
| 5 | Blind spots (optional) | Which position has more hidden risk |
| 6 | Scoring & winner | Review scores, accept or challenge |
| 7 | Decision & next steps | Winner clear / Need more evidence / Declare tie / Flip sides |

**DPO-inspired scoring mechanism:**

The debate mode uses a scoring system inspired by Direct Preference Optimization (DPO). Instead of the LLM judging which side is "better," the system collects human preference signals at each exchange and tallies them into a score.

**Preference signals** — Binary per exchange. Each exchange produces a signal favoring one position or a tie.

**Assessment-to-signal mapping:**
- Evidence exchanges (Phases 2 & 3):
  - Compelling/Reasonable → that position preferred (+1)
  - Weak → opposing position preferred (+1)
  - Mixed → Tie (+0.5 each)
- Counter-argument exchange (Phase 4):
  - "Position X countered more effectively" → Position X preferred (+1)
  - Neither/Both weak → Tie (+0.5 each)
- Blind spots exchange (Phase 5, optional):
  - "Reveals more risk for Position X" → opposing position preferred (+1)
  - Equal → Tie (+0.5 each)

**Scoring** — Simple tally of preference signals per position.

**Win probability** — P(A) = score_A / (score_A + score_B)

**Confidence thresholds:**
- **High**: Winner has >70% win probability
- **Medium**: Winner has 50-70% win probability
- **Low**: Winner has <50% win probability (effective tie)

**Why DPO-inspired** — Uses human preference signals to determine the winner rather than relying on LLM judgment. The LLM presents balanced evidence; the human evaluates it. This prevents the LLM from biasing the outcome toward its own training preferences.

**Early exit conditions:**
- User explicitly requests exit (save progress option)
- Crystallization achieved early (offer early decision)
- Blocker discovered (recommend park)

---

## Section 5: Crystallization Output

**Purpose:** Produce clear, actionable summary of exploration.

**Output format:** Exploration Summary Document

**Document structure** (saved to `.planning/exploration-{timestamp}.md`):

```markdown
# Exploration Summary — {timestamp}

## Raw Concept
{User's original input}

## Crystallized Summary
{2-3 sentence clear description of what this project actually is}

## Knowns
- [Confirmed fact 1]
- [Confirmed fact 2]
- ...

## Unknowns / Deferred
- [Gap 1]: [category] — [current status: deferred/pending/blocker]
- ...

## Decisions Made
| Choice | Selection | Rationale |
|--------|-----------|-----------|
| [question] | [answer] | [why] |

## Research Applied
- [What was checked]: [what was found]
- ...

## Recommendation
{Polymath's recommendation: proceed, narrow scope, or park}

## Next Action
{Specific next step based on decision}
```

**Onboard deliverable template** (saved to `.planning/exploration-{name}.md`):

```markdown
# Onboard Summary — {name}

## Onboard Target
{Codebase area or project that was explored during onboard session}

## Codebase Overview
{2-3 paragraph high-level description of what this project/area is and how it works — the core onboard output}

## Key Files & Directories
| Path | Purpose | Importance |
|------|---------|------------|
| [path] | [what it does] | Critical / Important / Reference |

## Architecture Patterns
- Pattern: [name] — [how it's used in this codebase]
- Data flow: [how data moves through the system]
- Key abstractions: [interfaces, base classes, extension points]

## Conventions
- Naming: [file, function, variable conventions]
- Structure: [code organization patterns]
- Style: [formatting, documentation patterns]

## Dependencies
| Package | Role | Critical? |
|---------|------|-----------|
| [name] | [why it's used] | Yes/No |

## Knowledge Gaps
- [Gap]: [category] — [what's unclear] — [suggested investigation]

## Next Steps
- [Immediate action items]
- [Recommended files to read next]
- [Related areas to explore]

## Onboard Exploration Log
| Exchange | Topic | Key Finding |
|----------|-------|-------------|
| [#] | [what was explored during onboard] | [what was learned] |
```

**Compare deliverable template** (produces a comparison matrix with weighted scoring — saved to `.planning/exploration-{name}.md`):

```markdown
# Comparison Summary — {name}

## Comparison Topic
{What was being compared and why}

## Alternatives Evaluated
| Alternative | Description | Source |
|-------------|-------------|--------|
| [name] | [what it is] | [research/user-provided] |

## Comparison Criteria
| Criterion | Weight | Description |
|-----------|--------|-------------|
| [criterion] | Critical / Important / Nice-to-have | [what this measures] |

## Comparison Matrix
| Criterion (Weight) | Alternative 1 | Alternative 2 | Alternative 3 |
|---------------------|---------------|---------------|---------------|
| [criterion] ([weight]) | [score]: [evidence] | [score]: [evidence] | [score]: [evidence] |

Scoring: Strong / Adequate / Weak / Unknown

## Pros & Cons
### Alternative 1: {name}
- **Pros**: [advantages]
- **Cons**: [disadvantages]

### Alternative 2: {name}
- **Pros**: [advantages]
- **Cons**: [disadvantages]

## Trade-offs
| Alternative | Gains | Loses |
|-------------|-------|-------|
| [name] | [what you get] | [what you give up] |

## Risk Assessment
| Alternative | Risk Level | Key Risks |
|-------------|------------|-----------|
| [name] | High / Medium / Low | [specific risks] |

## Recommendation
**Recommended**: {Alternative X}
**Confidence**: High / Medium / Low
**Rationale**: {Why this alternative wins on weighted criteria}

## Decision
**Chosen**: {Alternative selected by user}
**Justification**: {Why this was chosen — may differ from recommendation}
**Rejected alternatives**: {What was not chosen and why}

## Comparison Exploration Log
| Exchange | Topic | Key Finding |
|----------|-------|-------------|
| [#] | [what was compared] | [what was learned] |
```

**Debate deliverable template** (produces a verdict with supporting arguments — saved to `.planning/exploration-{name}.md`):

```markdown
# Debate Summary — {name}

## Debate Question
{The question or decision that was debated}

## Position A: {label}
**Framing**: {How Position A is defined}
**Key Arguments**:
1. {Argument 1} — {evidence}
2. {Argument 2} — {evidence}
3. {Argument 3} — {evidence}

## Position B: {label}
**Framing**: {How Position B is defined}
**Key Arguments**:
1. {Argument 1} — {evidence}
2. {Argument 2} — {evidence}
3. {Argument 3} — {evidence}

## Counter-Arguments
### Position A responds to Position B
- {Counter to B's argument 1}
- {Counter to B's argument 2}

### Position B responds to Position A
- {Counter to A's argument 1}
- {Counter to A's argument 2}

## Scoring Breakdown
| Exchange | Position A | Position B | Signal Source |
|----------|-----------|-----------|--------------|
| Evidence A assessment | {score} | {score} | User rated A's evidence as {assessment} |
| Evidence B assessment | {score} | {score} | User rated B's evidence as {assessment} |
| Counter-arguments | {score} | {score} | User judged {winner} countered better |
| **Total** | **{score_A}** | **{score_B}** | |

## Winner
**Winner**: Position {X} — {label}
**Win Probability**: {percentage}%
**Confidence**: High / Medium / Low

## Remaining Uncertainties
- {What evidence was unavailable}
- {What assumptions were made}
- {What could change the outcome}

## Recommended Next Actions
- {Based on outcome: implement winner, gather evidence, explore hybrid}

## Debate Exploration Log
| Exchange | Topic | Key Finding |
|----------|-------|-------------|
| [#] | [what was debated] | [what was learned] |
```

**Decision outcomes:**

| Outcome | Trigger | Next Action |
|---------|---------|-------------|
| **Proceed** | Clear concept, minimal gaps | Transition to `/legion:start` with crystallized input |
| **Explore More** | Specific area needs deeper dive | Start new exploration with narrowed scope |
| **Park** | Too many unknowns, blockers identified | Save summary, suggest prerequisites |

---

## Section 6: Integration Points

**Consumed by:**
- `/legion:explore` command — primary entry point
- Potentially: `/legion:start` (optional pre-start exploration)

**Consumes:**
- `agents/polymath.md` — personality and voice
- `skills/questioning-flow` — choice structure patterns
- `skills/agent-registry` — for domain-specific agent recommendations

**Produces:**
- `.planning/exploration-{timestamp}.md` — exploration artifacts
- Input to `/legion:start` — crystallized project concept

---

## Section 7: State Management

**Exploration state** (maintained in conversation):

```yaml
exploration:
  started_at: timestamp
  mode: crystallize|onboard|compare|debate
  raw_concept: string
  exchange_count: number
  exchanges:
    - number: 1
      topic: string
      choices: [options]
      selected: option_id
  knowns: [list]
  gaps:
    - category: string
      question: string
      status: open|answered|deferred|blocker
  research_findings: string
  decision: pending|proceed|explore_more|park
```

**Onboard-specific state extensions:**

```yaml
exploration:
  mode: onboard
  onboard:
    target_area: string            # codebase area being explored
    depth: overview|architecture|code_walkthrough
    areas_explored: [list]         # directories/files already covered
    areas_remaining: [list]        # directories/files not yet explored
    patterns_found: [list]         # architecture patterns discovered
    conventions_found: [list]      # coding conventions identified
    validation_results:            # knowledge check outcomes
      - topic: string
        correct: boolean
        correction: string|null
```

**Compare-specific state extensions:**

```yaml
exploration:
  mode: compare
  compare:
    topic: string                    # what is being compared
    alternatives:                    # 2-4 alternatives under evaluation
      - name: string
        description: string
        source: research|user        # where this alternative came from
    criteria:                        # comparison criteria with weights
      - name: string
        weight: critical|important|nice_to_have
        description: string
    scores:                          # evaluation scores per alternative per criterion
      - alternative: string
        criterion: string
        score: strong|adequate|weak|unknown
        evidence: string             # research backing for this score
    trade_offs:                      # identified trade-offs
      - alternative: string
        gains: string
        loses: string
    deal_breakers: [string]          # alternatives eliminated by hard constraints
    recommendation:
      alternative: string
      confidence: high|medium|low
      rationale: string
    decision:
      chosen: string                 # final user choice
      justification: string          # why (may differ from recommendation)
```

**Debate-specific state extensions:**

```yaml
exploration:
  mode: debate
  debate:
    question: string                   # the debate topic/question
    position_a:                        # first position
      label: string
      framing: string
      arguments: [string]             # 3-5 arguments with evidence
    position_b:                        # second position
      label: string
      framing: string
      arguments: [string]             # 3-5 arguments with evidence
    evidence:                          # evidence gathered per position
      position_a: [string]
      position_b: [string]
    counter_arguments:                 # counter-arguments per position
      a_counters_b: [string]
      b_counters_a: [string]
    preference_signals:                # DPO-inspired preference signals per exchange
      - exchange: string               # which exchange produced this signal
        preferred: position_a|position_b|tie
        signal_a: number               # score awarded to position A
        signal_b: number               # score awarded to position B
    scores:                            # tallied scores
      position_a: number
      position_b: number
      win_probability: number          # P(A) = score_A / (score_A + score_B)
    winner:
      position: position_a|position_b|tie
      confidence: high|medium|low
      rationale: string
```

---

**Usage:**
This skill is not invoked directly. The `/legion:explore` command instantiates this engine and the Polymath agent together.
