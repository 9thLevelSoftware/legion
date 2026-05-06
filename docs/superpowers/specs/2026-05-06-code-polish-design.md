# Code Polish — Design Specification

**Date:** 2026-05-06
**Status:** Approved
**Author:** Devil + Claude

## Summary

Add a structured code cleanup ("deslopping") capability to Legion via a reusable skill, a dedicated agent personality, a standalone command, and integration into the existing review pipeline as a post-review polish step.

## Problem

AI-generated and rapidly-written code accumulates "slop" — excessive comments, redundant abstractions, inconsistent patterns, unclear naming, and unnecessary complexity. The existing review pipeline catches bugs and architectural issues but doesn't systematically clean code for readability and consistency before it ships. The `/simplify` skill from the code-simplifier plugin provides lightweight cleanup of recently changed code, but lacks structured multi-pass analysis, convention detection, dependent-file awareness, and integration with Legion's phase workflow.

## Goals

1. **Automated post-review polish** — after review passes, clean code before marking a phase complete
2. **Standalone ad-hoc cleanup** — `/legion:polish` command for targeted cleanup of any files/directories
3. **Behavior-preserving guarantee** — never change what code does, only how it reads
4. **Convention-aware** — detect and enforce the project's existing patterns, not impose external opinions
5. **Non-blocking** — polish failures never prevent shipping; the code already passed review

## Non-Goals

- Bug fixing (that's review's job)
- Architecture refactoring (that's a build task)
- Formatting/linting (that's tool-level — prettier, eslint)
- Adding new functionality

---

## Architecture

### New Files

| File | Type | Purpose |
|------|------|---------|
| `skills/code-polish/SKILL.md` | Skill | Reusable polish engine with 4-pass rubric |
| `commands/polish.md` | Command | Standalone `/legion:polish` entry point |
| `agents/testing-code-polisher.md` | Agent | Dedicated polish specialist personality |

### Modified Files

| File | Change |
|------|--------|
| `commands/review.md` | Add Step 7.5: Post-Review Polish |
| `skills/review-loop/SKILL.md` | Add Section 7.5 between Review Passed and Escalation |
| `CLAUDE.md` | Add `/legion:polish` to command table |

---

## Component 1: Polish Skill (`skills/code-polish/SKILL.md`)

### Scope Resolution (Section 1)

Default scope: **changed files + direct dependents**.

```
Input: target (phase number, file path, directory path, or none)
Output: file_list (absolute paths to polish)

Step 1: Determine base file set
  If target is phase number:
    Read phase SUMMARY.md → extract files_modified list
  If target is file/directory path:
    Expand to file list (recursive for directories)
  If target is none:
    Detect current phase from STATE.md → use files_modified
    If no phase context: error "Specify a target: /legion:polish <path>"

Step 2: Expand to dependents (unless --scope=changed)
  For each file in base set:
    Parse import/require/use statements
    Find files in the project that import the base file
    Add those files to the file_list (one level only, no transitive)

Step 3: Apply scope overrides
  --scope=changed    → skip Step 2
  --scope=directory  → use explicit directory, skip Step 2
  --scope=dependents → default behavior (Step 1 + Step 2)

Step 4: Filter
  Remove files matching: node_modules/**, dist/**, build/**, .git/**,
    *.min.js, *.min.css, *.map, *.lock, package-lock.json, yarn.lock
  Remove binary files
  Cap at 50 files; if exceeded, warn user and ask to narrow scope
```

### Convention Detection (Section 2)

Before making changes, detect the project's established patterns:

```
Input: file_list, project root
Output: conventions object

Step 1: Read CLAUDE.md (if exists) for explicit standards
  Extract: naming conventions, import style, error handling patterns,
    preferred patterns, forbidden patterns

Step 2: Sample existing code (up to 10 files from file_list)
  Detect:
  - Naming style: camelCase vs snake_case vs PascalCase (functions, variables, files)
  - Import style: relative vs aliases, sorted vs unsorted, grouped vs flat
  - Error handling: try/catch vs .catch() vs Result types
  - Comment style: JSDoc vs inline vs none
  - Function style: arrow vs function keyword, expression vs declaration
  - Indentation: tabs vs spaces, indent width

Step 3: Merge (CLAUDE.md explicit > detected implicit)
  CLAUDE.md rules override detected patterns when they conflict

Step 4: Report conventions
  Log detected conventions for transparency
  Include in agent prompt so polish agent knows what to enforce
```

### Pass 1: Comment Cleanup (Section 3)

```
## Comment Cleanup Pass

Evaluate every comment in the target files. Each comment must earn its place.

REMOVE:
- Comments that restate what the code does ("// increment counter" above counter++)
- AI-generated narration ("// This function handles user authentication")
- Commented-out code blocks (version control has the history)
- Stale TODOs with no issue reference or actionable content
- Section dividers that add no information ("// --- Helper Functions ---")
- JSDoc/docstrings that only restate the function signature with no added insight

PRESERVE:
- Intent comments explaining WHY, not WHAT ("// Rate limit to prevent abuse")
- Non-obvious business logic explanations
- Legal/license headers
- TODOs with issue references (TODO(#123): ...)
- Warnings about non-obvious gotchas ("// Order matters: auth middleware must run before rate limiter")
- Type annotations in untyped languages where they serve as documentation
- Regex explanations for non-trivial patterns

Severity:
- CLEAN: Auto-remove. The comment is clearly noise.
- KEEP: Preserve. The comment adds value.

For each removal, log: file, line, removed text, reason (one of: restates-code,
  ai-narration, commented-out-code, stale-todo, noise-divider, signature-restatement)
```

### Pass 2: Code Simplification (Section 4)

```
## Code Simplification Pass

Reduce complexity without changing behavior.

SIMPLIFY (apply directly):
- Flatten nested if/else chains using early returns or guard clauses
- Replace verbose conditional chains with lookup tables or switch statements
- Remove dead code paths (unreachable after return/throw/break)
- Remove unused local variables, parameters, and imports
- Inline single-use variables that add no clarity
- Collapse trivial wrapper functions that only forward to another function
- Replace hand-rolled logic with standard library equivalents

FLAG AS REFACTOR (report but don't auto-apply):
- Extracting a function from a block >50 lines (needs naming decision)
- Removing an exported symbol (may have external consumers)
- Consolidating duplicated logic across files (cross-file change)
- Replacing a pattern with a different abstraction

Severity:
- SIMPLIFY: Auto-apply. The simplification is safe and obviously better.
- REFACTOR: Flag for human review. The improvement requires a judgment call.

For each change, log: file, lines affected, what changed, reason
```

### Pass 3: Readability Refactoring (Section 5)

```
## Readability Refactoring Pass

Improve naming, structure, and type clarity for human readers.

RENAME (apply directly when scope is local):
- Variables: vague names (data, result, temp, val, x) → descriptive names
  reflecting what the value represents
- Functions: vague names (process, handle, do, run) → names reflecting
  what the function does and to what
- Parameters: positional ambiguity → named clarity (especially booleans)
- Local scope only — do not rename exports without flagging

EXTRACT (flag for review):
- Functions longer than 50 lines → suggest extraction points with proposed names
- Functions with >4 parameters → suggest options object or decomposition
- Deeply nested blocks (>3 levels) → suggest extraction to named helper

TYPE CLARITY (apply directly):
- Add return type annotations where inference is ambiguous or the function
  is exported
- Add parameter type annotations where `any` is used without justification
- Replace `any` with specific types where the actual type is determinable
  from usage

Severity:
- RENAME: Auto-apply for local scope. Flag for exported symbols.
- EXTRACT: Always flag for review (naming decisions needed).
- TYPE: Auto-apply for obvious types. Flag for ambiguous cases.

For each change, log: file, line, old name/structure, new name/structure, reason
```

### Pass 4: Consistency Normalization (Section 6)

```
## Consistency Normalization Pass

Align code to the project's detected conventions (from Section 2).

NORMALIZE (apply directly):
- Import ordering: match detected convention (stdlib → external → internal → relative)
- Import style: match detected convention (named vs default, path style)
- Naming: align outliers to dominant project convention
- Error handling: align to detected dominant pattern
- String style: match dominant quote style (single vs double)
- Trailing commas, semicolons: match dominant style
- File structure: match detected section ordering (imports → types → constants → logic → exports)

CONVENTION (flag for review):
- Introducing a new pattern not yet used in the project
- Cases where two conventions are equally prevalent (50/50 split)
- Style choices that affect readability vs. consistency tradeoff

Do NOT normalize:
- Formatting handled by prettier/eslint/formatters (indentation, line length, spacing)
- Patterns explicitly allowed as alternatives in CLAUDE.md

Severity:
- NORMALIZE: Auto-apply. Aligning to established convention.
- CONVENTION: Flag for human review. Ambiguous convention.

For each change, log: file, line, what changed, which convention it aligns to
```

### Safety Rails (Section 7)

```
Step 1: Pre-polish snapshot
  Record: test command (from PROJECT.md, CONTEXT.md, or detection)
  If test command exists: run tests, record pass/fail baseline
  If no test command: skip test verification, log warning

Step 2: Apply all 4 passes

Step 3: Post-polish verification
  If test command exists:
    Run tests again
    If all pass: proceed
    If any fail:
      For each failing test:
        Identify which polished file(s) likely caused the failure
        Revert those files (git checkout -- <file>)
        Re-run tests to confirm revert fixed it
        Log: "Reverted polish for {file}: caused test failure in {test}"
      If revert doesn't fix: revert ALL polish changes, log error

  If no test command:
    Log: "No test command available — polish changes not verified by tests"
    Proceed (user accepted this risk by not having tests)

Step 4: Type checking (if available)
  If tsc/mypy/cargo check/etc. exists in project:
    Run type checker
    Same revert logic as test failures
```

### Artifact Output (Section 8)

```
Output: POLISH.md (or stdout in standalone mode)

# Polish Summary

## Stats
- Files polished: {N}
- Files skipped (safety): {N}
- Comments removed: {N}
- Lines simplified: {N}
- Symbols renamed: {N}
- Patterns normalized: {N}

## Changes by Pass

### Pass 1: Comment Cleanup
| File | Removals | Reason |
|------|----------|--------|
| ... | ... | ... |

### Pass 2: Code Simplification
| File | Lines | Change | Reason |
|------|-------|--------|--------|
| ... | ... | ... | ... |

### Pass 3: Readability Refactoring
| File | Change | Old → New | Reason |
|------|--------|-----------|--------|
| ... | ... | ... | ... |

### Pass 4: Consistency Normalization
| File | Change | Convention |
|------|--------|------------|
| ... | ... | ... |

## Flagged for Review
Items marked REFACTOR, EXTRACT, or CONVENTION that need human decision:
- [ ] {description} ({file}:{line})

## Safety
- Tests: PASS / FAIL (reverted: {files})
- Type check: PASS / FAIL / NOT AVAILABLE
```

---

## Component 2: Polish Command (`commands/polish.md`)

### Frontmatter

```yaml
---
name: legion:polish
description: Clean and polish code for readability, consistency, and clarity
argument-hint: [--phase N] [--scope=changed|dependents|directory] [--dry-run] [<target-path>]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion]
---
```

### Execution Context

```
skills/workflow-common-core/SKILL.md
skills/code-polish/SKILL.md
skills/agent-registry/SKILL.md
```

### Process

```
1. PARSE ARGUMENTS
   - Read $ARGUMENTS
   - If empty: attempt auto-detect from current phase (STATE.md)
   - If no phase context and no arguments: show usage help and exit
   - Parse flags:
     --phase N        → set target to phase N's files_modified
     --scope=X        → override scope resolution (changed|dependents|directory)
     --dry-run        → preview mode, no changes applied
     <path>           → explicit file or directory target
   - Display: "Polish target: {description of resolved scope}"

2. LOAD CONTEXT
   - Read PROJECT.md (if exists) for tech stack and test commands
   - Read CLAUDE.md for explicit coding conventions
   - Execute convention detection (skill Section 2)
   - Display detected conventions summary

3. RESOLVE TARGET FILES
   - Execute scope resolution (skill Section 1)
   - Display file list with count
   - If >20 files: ask user to confirm before proceeding

4. DRY-RUN CHECK
   - If --dry-run:
     - Spawn polish agent with rubric
     - Collect findings WITHOUT applying changes
     - Display findings summary (what would change)
     - Exit

5. EXECUTE POLISH
   - Read agent personality: agents/testing-code-polisher.md
   - Spawn agent with:
     - Full personality injection
     - Convention context from Step 2
     - File list from Step 3
     - Polish skill rubric (all 4 passes)
   - Agent executes passes, applies changes

6. SAFETY VERIFICATION
   - Execute safety rails (skill Section 7)
   - If reverts occur: display reverted files and reasons

7. REPORT AND COMMIT
   - Display polish summary to stdout
   - If files were changed and not in review-integrated mode:
     - Commit: "refactor: polish {target description}"
   - If no changes needed: display "Code is already clean — no changes made"

8. FLAGGED ITEMS
   - If any REFACTOR/EXTRACT/CONVENTION items were flagged:
     - Display flagged items list
     - Ask: "Want to address any of these flagged items?"
     - If yes: spawn follow-up agent for selected items
     - If no: done
```

---

## Component 3: Agent Personality (`agents/testing-code-polisher.md`)

### Frontmatter

```yaml
---
name: Code Polisher
id: testing-code-polisher
division: testing
role: Code clarity and consistency specialist
languages: [agnostic]
frameworks: [agnostic]
artifact_types: [refactored_code, polish_report]
review_strengths: [code_clarity, comment_quality, naming_conventions, structural_simplification]
triggers: [polish, cleanup, deslop, simplify, readability, code-quality]
capabilities: [code_review, refactoring]
cost_tier: execution
---
```

### Personality

The agent personality file will include:

- **Identity:** You are a code polish specialist — a ruthless editor, not a writer. Your job is to make working code cleaner, not to add features or fix bugs.
- **Core principle:** Every line must earn its place. If a comment restates the code, delete it. If a name is vague, rename it. If nesting is deep, flatten it. If a pattern deviates from the project's convention, normalize it.
- **Non-negotiable constraint:** Never change behavior. The code must produce identical outputs, handle identical edge cases, and maintain identical API contracts before and after your changes. When in doubt, leave it alone.
- **Working style:** Methodical, pass-by-pass. Complete each pass fully before moving to the next. Log every change with a reason. Don't chase perfection — chase clarity.
- **What you are NOT:** You are not a reviewer (you don't find bugs). You are not an architect (you don't redesign systems). You are not a formatter (that's what prettier/eslint do). You are the editor who takes a working draft and makes it publishable.

---

## Component 4: Review Pipeline Integration

### Changes to `commands/review.md`

Add after the current Step 7 (Review Passed) section:

```
Step 7.5: POST-REVIEW POLISH

If settings.review.polish != false (default: true):
  1. Load skills/code-polish/SKILL.md
  2. Resolve scope: phase's files_modified + direct dependents
     (override with settings.review.polish_scope if set)
  3. Read agent personality: agents/testing-code-polisher.md
  4. Spawn testing-code-polisher agent with:
     - Full personality injection
     - Detected conventions from project
     - File list from scope resolution
     - Polish skill rubric (all 4 passes)
  5. Agent executes 4 passes
  6. Safety check: run verification_commands from phase plan
  7. If safe:
     - Commit: "refactor: polish phase {N} code"
     - Append polish summary to {NN}-REVIEW.md under "## Post-Review Polish" heading
  8. If unsafe:
     - Revert all changes
     - Log in REVIEW.md: "Polish skipped — changes caused test failures"
     - Proceed to phase completion (non-blocking)
  9. If agent errors or times out:
     - Log warning in REVIEW.md
     - Proceed to phase completion (non-blocking)

If settings.review.polish == false:
  Skip silently. Log: "Post-review polish: disabled"
```

### Changes to `skills/review-loop/SKILL.md`

Add Section 7.5 between current Section 7 (Review Passed) and Section 8 (Escalation). This section is a thin dispatcher that invokes the polish skill — the full logic lives in `skills/code-polish/SKILL.md`.

### Settings Surface

```json
{
  "review": {
    "polish": true,
    "polish_scope": "dependents"
  }
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `review.polish` | boolean | `true` | Enable/disable post-review polish step |
| `review.polish_scope` | string | `"dependents"` | Scope for review-integrated polish: `"changed"`, `"dependents"`, `"directory"` |

---

## File Inventory

| File | Action | Estimated Size |
|------|--------|---------------|
| `skills/code-polish/SKILL.md` | Create | ~300 lines |
| `commands/polish.md` | Create | ~120 lines |
| `agents/testing-code-polisher.md` | Create | ~60 lines |
| `commands/review.md` | Modify | +30 lines (Step 7.5) |
| `skills/review-loop/SKILL.md` | Modify | +20 lines (Section 7.5) |
| `CLAUDE.md` | Modify | +1 line (command table) |

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Polish changes break tests | Safety rails: pre/post test run with per-file revert |
| Polish renames break external consumers | Exported symbol renames are flagged, not auto-applied |
| Convention detection picks wrong pattern | CLAUDE.md explicit rules override detected patterns |
| Token cost of polish pass is high | Single agent invocation for all 4 passes; 50-file cap |
| Polish and review disagree | Polish runs post-review; review findings are already resolved |

## Success Criteria

1. `/legion:polish src/` produces cleaner code with no behavioral changes
2. `/legion:review` automatically polishes code after review passes (when enabled)
3. Test suite passes identically before and after polishing
4. POLISH.md artifact documents every change with attribution and reasoning
5. Flagged items (REFACTOR/EXTRACT/CONVENTION) surface for human decision
