# Phase 9 Context — Polymath Advanced Modes

## Phase Goal

Add onboard, compare, and debate modes to the Polymath agent and `/legion:explore` workflow, extending the existing crystallize mode with three new structured exploration workflows.

## Requirements

- **POLY-07**: Onboard mode — guided codebase familiarization via structured choices
- **POLY-08**: Compare mode — structured comparison of alternatives with decision capture
- **POLY-09**: Debate mode — adversarial exploration with winner tracking

## Success Criteria

- `/legion:explore` offers mode selection: crystallize (existing), onboard, compare, debate
- Onboard mode guides structured codebase familiarization with progressive depth
- Compare mode produces structured comparison matrix with decision capture
- Debate mode supports adversarial exploration with winner tracking (DPO-inspired)
- All modes enforce structured choices (no open-ended questions)

## Existing Assets

### Core Files to Extend

| File | Current State | Phase 9 Changes |
|------|--------------|-----------------|
| `commands/explore.md` | Single-mode (crystallize) explore command with Polymath spawn | Add mode selection before spawn, mode-aware routing, mode-specific outcomes |
| `agents/polymath.md` | Crystallize-only workflow with 5 phases | Add mode-specific workflows for onboard, compare, debate |
| `skills/polymath-engine/SKILL.md` | Generic structured choice protocol + crystallize-specific patterns | Add mode-specific gap categories, exchange patterns, deliverable templates |

### Reusable Patterns

- **Structured Choice Protocol** (polymath-engine Section 2): Arrow keys + Enter, mutually exclusive options, 4-5 max per choice. Reuse as-is for all modes.
- **Research Phase** (polymath-engine Section 1): Web search + codebase analysis before questioning. Reuse for onboard (codebase) and compare (alternatives research).
- **Exchange Management** (polymath-engine Section 4): 7-exchange max with progression tracking. Extend with mode-specific exchange sequences.
- **State Management** (polymath-engine Section 7): Exploration state object. Extend with `mode` field and mode-specific state.

## Decisions

- **Architecture proposals**: Skipped — approach is clear (extend existing patterns)
- **Spec pipeline**: Skipped — requirements well-defined from ROADMAP
- **Wave structure**: 3 waves — Wave 1 builds mode selection infrastructure + onboard, Wave 2 adds compare, Wave 3 adds debate (sequential to avoid file collision)
- **Agent assignments**: agents-orchestrator (09-01), engineering-senior-developer (09-02, 09-03)
- **Critique mitigations applied**:
  - Wave 2/3 made sequential (09-02 before 09-03) to eliminate file collision risk on shared files
  - Multi-select replaced with sequential single-selects for criteria selection (fits existing structured choice protocol)
  - DPO assessment-to-scoring mapping clarified (Compelling/Reasonable → Position preferred; Weak → Opposing preferred; Mixed → Tie)
  - "Flip sides" scoped as optional stretch goal with implementation notes
  - Free-input exception acknowledged in success criteria (consistent with crystallize mode)

## Plan Structure

| Plan | Wave | Requirement | Focus |
|------|------|-------------|-------|
| 09-01 | 1 | POLY-07 | Mode selection infrastructure + onboard mode |
| 09-02 | 2 | POLY-08 | Compare mode |
| 09-03 | 3 | POLY-09 | Debate mode |

Wave 2 depends on 09-01 (mode selection infrastructure). Wave 3 depends on 09-02 (file state must include compare before debate edits).

---
*Generated: 2026-03-06*
