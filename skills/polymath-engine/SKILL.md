---
name: polymath-engine
description: Research-first design discovery engine for /legion:explore
triggers: [explore, clarify, brainstorm, design, discovery, pre-flight, alignment]
token_cost: medium
summary: "Inspects local context, performs bounded research, asks focused clarifying questions, compares approaches, and produces a saved exploration design document."
---

# Polymath Engine

Execution engine for `/legion:explore`. The workflow is modeled after design-before-code brainstorming: understand context first, research the ask, ask one useful question at a time, compare possible approaches, then write a design document that can later seed `/legion:start`.

This engine no longer exposes user-facing modes such as crystallize, onboard, compare, or debate. Those behaviors are now internal techniques inside a single design-discovery flow.

---

## Section 1: Context Inspection

Before asking questions, inspect available local context:

- `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`
- `.planning/CODEBASE.md`
- `.planning/codebase/index.jsonl`
- `.planning/codebase/symbols.json`
- `.planning/explorations/*.md`
- README and product/spec docs when present

If a codebase map exists, use it to understand current architecture and functionality. If it is stale or partial, mention the limitation and suggest `/legion:map --refresh` only when it materially affects the exploration.

---

## Section 2: Research Pass

Research happens before clarification:

1. **Local research** — search project docs, map artifacts, and relevant source files for similar functionality, constraints, and established patterns.
2. **External research** — when current domain, framework, API, market, or regulatory facts matter, use available web research tools or runtime-supported web-research skills.
3. **Synthesis** — separate findings into facts, inferences, assumptions, and open questions.

Keep this pass bounded. If research cannot be completed quickly, capture the gap in the design document and ask whether to proceed with assumptions, narrow the scope, or park.

---

## Section 3: Clarification Protocol

Every user-facing question after the initial idea capture uses `adapter.ask_user` / `AskUserQuestion`.

Rules:
- Ask one decision at a time.
- Each question must materially change the design.
- Use 2-5 mutually exclusive options.
- Include a scoped free-text option only when the answer space is genuinely unbounded.
- Do not end a turn with an open prose question.
- Do not ask for information already discoverable from local context.

Decision slots to resolve:
- Target users / audience.
- Primary outcome.
- MVP scope.
- Non-goals.
- Platform or channel.
- Data and integration dependencies.
- Technical constraints.
- Timeline, budget, risk tolerance, or compliance limits.

Track answers as:

```yaml
exploration:
  title: string
  raw_ask: string
  research:
    facts: []
    inferences: []
    assumptions: []
  decisions:
    - question: string
      selected: string
      rationale: string
  open_questions:
    - question: string
      status: pending|deferred|blocker
```

---

## Section 4: Approach Comparison

Before writing the design document, present 2-3 viable approaches:

| Approach | Use When | Strengths | Tradeoffs |
|----------|----------|-----------|-----------|
| Conservative | The user needs fastest validated path | Lowest risk, narrowest MVP | Less extensible |
| Balanced | The user wants useful v1 without overbuilding | Best default for most projects | Requires clear scope discipline |
| Ambitious | The long-term architecture is already clear | Extensible, future-ready | Higher build and validation cost |

Recommend one approach and state why. The recommendation must be grounded in the local context, research, and user decisions.

---

## Section 5: Design Document Output

New design documents are saved to:

`.planning/explorations/YYYY-MM-DD-<slug>-design.md`

Legacy `.planning/exploration-*.md` files may be read for continuity but should not be created by new runs.

Template:

```markdown
# Design Exploration — {title}

## Initial Ask
{raw idea or source context}

## Research Summary
- Facts:
- Inferences:
- Assumptions:

## Product Definition
- Target users:
- Primary outcome:
- Value proposition:
- Non-goals:

## Recommended Approach
{chosen approach and rationale}

## Alternatives Considered
| Approach | Strengths | Tradeoffs | Decision |
|----------|-----------|-----------|----------|

## Feature Scope
### MVP
- [ ] ...
### Later
- [ ] ...

## Experience / Workflow
{main user flow or operational workflow}

## Technical Direction
{platform, architecture, integrations, data, constraints}

## Open Questions
- {question} — {resolution path or why deferred}

## Start Input
{concise summary that /legion:start <this-file> can use to prefill project initialization}
```

---

## Section 6: Final Decision

After writing or updating the design document, ask via `AskUserQuestion`:

- **Start with this design** — route to `/legion:start <design-doc-path>`.
- **Keep discussing** — continue clarification and update the same design doc.
- **Park it** — leave the design saved and exit.

The engine must not run `/legion:start` before the user explicitly selects the start option.

---

## Section 7: Completion Gate

Exploration is complete when:

1. A design document exists under `.planning/explorations/`.
2. Research, decisions, alternatives, MVP scope, technical direction, and open questions are recorded.
3. The final user decision is explicit: start, keep discussing, or park.
4. If start is selected, the handoff command is exactly `/legion:start <design-doc-path>`.
