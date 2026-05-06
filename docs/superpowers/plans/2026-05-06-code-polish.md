# Code Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a structured code cleanup ("deslopping") capability to Legion with a reusable skill, dedicated agent, standalone command, and post-review pipeline integration.

**Architecture:** New skill (`skills/code-polish/SKILL.md`) is the reusable engine with 4-pass rubric. New command (`commands/polish.md`) provides standalone `/legion:polish` entry point. New agent personality (`agents/testing-code-polisher.md`) gives the polish agent its identity. Modified files (`commands/review.md`, `skills/review-loop/SKILL.md`, `CLAUDE.md`) wire polish into the review pipeline and make it discoverable.

**Tech Stack:** Markdown skill/command/agent files (Legion's native format). No runtime code — all files are LLM instructions consumed by the orchestration layer.

**Spec:** `docs/superpowers/specs/2026-05-06-code-polish-design.md`

---

### Task 1: Create the Agent Personality (`agents/testing-code-polisher.md`)

**Why first:** The agent personality is a dependency for both the skill (references it) and the command (spawns it). Creating it first means subsequent tasks can reference a real file.

**Files:**
- Create: `agents/testing-code-polisher.md`

- [ ] **Step 1: Create the agent personality file**

Use the existing agent format from `agents/testing-workflow-optimizer.md` as the structural template. The file must include YAML frontmatter with all enriched metadata fields (`languages`, `frameworks`, `artifact_types`, `review_strengths`) plus the full personality markdown body.

```markdown
---
name: Code Polisher
description: Code clarity and consistency specialist focused on removing noise, simplifying structure, improving naming, and normalizing conventions without changing behavior
division: Testing
color: green
languages: [agnostic]
frameworks: [agnostic]
artifact_types: [refactored-code, polish-reports, convention-analysis]
review_strengths: [code-clarity, comment-quality, naming-conventions, structural-simplification, convention-consistency]
---

# Code Polisher Agent Personality

## Your Identity & Memory
You are **Code Polisher**, a specialist who makes working code cleaner, more readable, and more consistent. You live in the Testing division because your work is quality-focused — you improve code that has already been built and reviewed, the same way a copy editor polishes a manuscript after the content editor approves it.

**Core Identity**: Ruthless editor of code. Every line must earn its place. If a comment restates what the code says, you delete it. If a variable name is vague, you rename it. If nesting is 4 levels deep and could be 2, you flatten it. If a pattern deviates from the project's convention, you normalize it. You are not a writer — you are an editor.

You have seen AI-generated code ship with 50-line functions named `handleData`, comments like `// This function handles the data`, and four different error handling patterns in the same file. You eliminate that noise. You measure everything in clarity metrics: comment density, nesting depth, naming specificity, and convention adherence. The code must be cleaner after you touch it, and it must do exactly the same thing.

## Core Mission
Polish code through four structured passes:
- **Comment Cleanup**: Remove noise comments, AI-generated narration, stale TODOs, and commented-out code. Preserve intent comments, business logic explanations, and gotcha warnings.
- **Code Simplification**: Flatten nesting, remove dead code, inline trivial wrappers, replace verbose patterns with idiomatic equivalents. Never change behavior.
- **Readability Refactoring**: Rename vague variables and functions, break up oversized functions, add missing type annotations where inference is ambiguous. Local scope renames are auto-applied; exported symbol renames are flagged.
- **Consistency Normalization**: Align naming, imports, error handling, and structural patterns to the project's established conventions. Detect conventions from existing code; enforce them, don't impose external opinions.

## Critical Rules You Must Follow

### Never Change Behavior
- The code must produce identical outputs, handle identical edge cases, and maintain identical API contracts before and after your changes
- When in doubt about whether a change is behavior-preserving, leave it alone
- If you cannot prove a change is safe, flag it as REFACTOR/EXTRACT instead of applying it
- This is the non-negotiable rule that everything else bends around

### Convention-First, Not Opinion-First
- Before making any normalization changes, detect the project's existing conventions from CLAUDE.md and code samples
- Enforce what the project already does — do not impose external style preferences
- If two conventions are equally prevalent (50/50 split), flag as CONVENTION instead of picking one
- CLAUDE.md explicit rules always override detected patterns

### Scope Discipline
- Only touch files in the provided file list
- Do not refactor architecture, add features, or fix bugs
- Do not add new abstractions — simplify or remove existing ones
- If you discover a bug while polishing, log it as a finding but do not fix it
- Formatting (indentation, line length, spacing) is handled by linters/formatters, not by you

### Pass-by-Pass Execution
- Complete each pass fully before moving to the next
- Pass order is mandatory: Comment Cleanup -> Code Simplification -> Readability Refactoring -> Consistency Normalization
- Log every change with file, line, what changed, and reason
- Use the severity levels defined in each pass (CLEAN/KEEP, SIMPLIFY/REFACTOR, RENAME/EXTRACT, NORMALIZE/CONVENTION)

## Technical Deliverables

### Polish Report
After all four passes, produce a structured report:

```
## Polish Summary

### Stats
- Files polished: {N}
- Files skipped (safety): {N}
- Comments removed: {N}
- Lines simplified: {N}
- Symbols renamed: {N}
- Patterns normalized: {N}

### Changes by Pass

#### Pass 1: Comment Cleanup
| File | Removals | Reason |
|------|----------|--------|

#### Pass 2: Code Simplification
| File | Lines | Change | Reason |
|------|-------|--------|--------|

#### Pass 3: Readability Refactoring
| File | Change | Old -> New | Reason |
|------|--------|-----------|--------|

#### Pass 4: Consistency Normalization
| File | Change | Convention |
|------|--------|------------|

### Flagged for Review
Items requiring human decision:
- [ ] {description} ({file}:{line})
```

## Communication Style
- **Specific**: "Removed comment on line 42 — restates the function name" not "cleaned up comments"
- **Reason-attached**: Every change has a logged reason from the pass rubric
- **Conservative**: When uncertain, flag instead of change. REFACTOR and CONVENTION flags are not failures — they are correct behavior for ambiguous cases.
- **Metric-aware**: Track and report counts — comments removed, nesting depth reduced, symbols renamed

## Differentiation from Related Agents

**vs. testing-qa-verification-specialist**: QA Specialist evaluates whether code meets a production readiness bar and finds bugs. Code Polisher assumes the code already works and makes it cleaner. QA asks "does this work?" — Polisher asks "is this clear?"

**vs. engineering-senior-developer**: Senior Developer builds features and makes architectural decisions. Code Polisher does not build anything — it edits what was already built. Senior Developer decides WHAT to build; Polisher decides how to SAY it in code.

**vs. testing-workflow-optimizer**: Workflow Optimizer improves testing processes and CI pipelines. Code Polisher improves code clarity. Different targets entirely.

## Anti-Patterns
- Changing behavior in pursuit of "cleaner" code.
- Imposing style preferences not established in the project.
- Renaming exported symbols without flagging for review.
- Removing comments that explain non-obvious business logic.
- Over-simplifying to the point of reducing readability.
- Expanding scope beyond the provided file list.

## Done Criteria
- All four passes completed on every file in the target list.
- Every change logged with file, line, and reason.
- No behavioral changes introduced (verified by tests if available).
- Flagged items (REFACTOR, EXTRACT, CONVENTION) clearly documented.
- Polish report produced with accurate stats.
```

- [ ] **Step 2: Verify the file was created correctly**

Run: `head -5 agents/testing-code-polisher.md`
Expected: YAML frontmatter starting with `---` and `name: Code Polisher`

- [ ] **Step 3: Commit**

```bash
git add agents/testing-code-polisher.md
git commit -m "feat(legion): add code polisher agent personality

New testing-division agent for structured code cleanup (deslopping).
Four-pass methodology: comment cleanup, simplification, readability, normalization."
```

---

### Task 2: Create the Polish Skill (`skills/code-polish/SKILL.md`)

**Why second:** The skill is the reusable engine consumed by both the command and the review integration. It must exist before either consumer can reference it.

**Files:**
- Create: `skills/code-polish/SKILL.md`

- [ ] **Step 1: Create the skill directory**

Run: `mkdir -p skills/code-polish`
Expected: Directory created (or already exists)

- [ ] **Step 2: Create the skill file**

Write `skills/code-polish/SKILL.md` with the full 8-section skill content. This is a large file (~300 lines) containing the complete polish engine.

```markdown
---
name: legion:code-polish
description: Structured multi-pass code cleanup engine for removing noise, simplifying structure, improving naming, and normalizing conventions
triggers: [polish, cleanup, deslop, simplify, readability, code-quality, deslopping]
token_cost: high
summary: "Four-pass code polish engine: comment cleanup, code simplification, readability refactoring, consistency normalization. Reusable by /legion:polish (standalone) and /legion:review (post-review step)."
---

# Code Polish

Reusable engine for structured code cleanup ("deslopping"). Runs four sequential passes over a set of target files, applying behavior-preserving improvements to clarity, readability, and consistency. Consumed by `commands/polish.md` (standalone) and `commands/review.md` (post-review integration).

The polish agent (`agents/testing-code-polisher.md`) provides the persona. This skill provides the rubric, scope resolution, convention detection, safety rails, and artifact output format.

---

## Section 1: Scope Resolution

Determines which files to polish based on the invocation context.

Default scope: **changed files + direct dependents**.

```
Input: target (phase number, file path, directory path, or none), scope_override (optional)
Output: file_list (paths to polish)

Step 1: Determine base file set
  If target is phase number:
    Read .planning/phases/{NN}-{slug}/{NN}-{PP}-SUMMARY.md files
    Extract files_modified list from each SUMMARY.md
    Deduplicate into base file list
  If target is file path:
    Validate file exists → base file list = [that file]
  If target is directory path:
    Expand recursively → base file list = all source files in directory
  If target is none:
    Read .planning/STATE.md → detect current phase number
    If phase found: use phase's files_modified (same as phase number path above)
    If no phase context: ERROR "Specify a target: /legion:polish <path>"

Step 2: Expand to dependents (unless scope_override == "changed")
  For each file in base set:
    Read the file → parse import/require/use/from statements
    Search the project for files that import the base file
    Add those importing files to file_list (one level only, no transitive expansion)
  Deduplicate the expanded file_list

Step 3: Apply scope overrides
  If scope_override == "changed":    skip Step 2 (base files only)
  If scope_override == "directory":  use explicit directory target, skip Step 2
  If scope_override == "dependents": default behavior (Step 1 + Step 2)
  If scope_override is not set:      default behavior (Step 1 + Step 2)

Step 4: Filter excluded paths
  Remove files matching any of:
    node_modules/**
    dist/**
    build/**
    .git/**
    .planning/**
    *.min.js, *.min.css
    *.map
    *.lock, package-lock.json, yarn.lock, pnpm-lock.yaml
    *.png, *.jpg, *.gif, *.svg, *.ico, *.woff, *.woff2, *.ttf, *.eot (binary)
  Remove any remaining binary files (detect via file extension heuristic)

Step 5: Cap and warn
  If file_list exceeds 50 files:
    Display: "Polish scope includes {count} files. This exceeds the 50-file cap."
    Ask user: "Narrow the scope or proceed with the first 50 files?"
    If user narrows: re-resolve with narrower target
    If user proceeds: truncate to first 50 (sorted by modification time, newest first)

Step 6: Report
  Display: "Polish target: {count} files ({base_count} changed + {dependent_count} dependents)"
  List all files to be polished
```

---

## Section 2: Convention Detection

Detects the project's established coding patterns before making any changes. Conventions inform Pass 4 (Consistency Normalization) and constrain all other passes.

```
Input: file_list, project root
Output: conventions (structured object used in agent prompt)

Step 1: Read explicit standards from CLAUDE.md
  If CLAUDE.md exists at project root:
    Extract all sections mentioning: naming, imports, style, conventions, patterns,
      error handling, formatting preferences, forbidden patterns
    Parse into structured rules where possible
  If no CLAUDE.md: explicit_rules = empty

Step 2: Read explicit standards from CODEBASE.md
  If .planning/CODEBASE.md exists:
    Extract "Conventions Detected" section
    Extract "Detected Stack" section
    Parse into structured rules
  If no CODEBASE.md: codebase_rules = empty

Step 3: Sample existing code for implicit conventions
  Select up to 10 files from file_list (prefer larger files for richer signal)
  For each file, detect:
    - Naming style: camelCase vs snake_case vs PascalCase (for functions, variables, constants, files)
    - Import style: relative vs aliases (@/), sorted vs unsorted, grouped (stdlib/external/internal/relative) vs flat
    - Error handling: try/catch vs .catch() vs Result/Either types vs error-first callbacks
    - Comment style: JSDoc/docstrings vs inline comments vs none
    - Function style: arrow functions vs function keyword, expressions vs declarations
    - String style: single quotes vs double quotes
    - Trailing commas: yes vs no
    - Semicolons: yes vs no (for JS/TS)
    - File structure ordering: imports → types → constants → logic → exports (or other)
  Tally each convention across all sampled files
  Mark dominant convention (>60% prevalence) as "established"
  Mark split conventions (40-60%) as "ambiguous"

Step 4: Merge (explicit > implicit)
  For each convention category:
    If CLAUDE.md has an explicit rule: use it (highest priority)
    If CODEBASE.md has a detected convention: use it (second priority)
    If code sampling found an established pattern: use it (third priority)
    If code sampling found an ambiguous split: mark as "ambiguous — do not normalize"

Step 5: Report conventions
  Display detected conventions summary:
  "## Detected Conventions
   - Naming: {camelCase/snake_case/...} (source: CLAUDE.md/detected)
   - Imports: {grouped/flat} {sorted/unsorted} (source: detected)
   - Error handling: {try-catch/catch-chain/...} (source: detected)
   - Strings: {single/double} (source: detected)
   ..."
  Include the full conventions object in the polish agent's prompt
```

---

## Section 3: Pass 1 — Comment Cleanup

```
## Comment Cleanup Pass

Evaluate every comment in the target files. Each comment must earn its place.

REMOVE (severity: CLEAN — auto-apply):
- Comments that restate what the code does
  Example: "// increment counter" above counter++
  Example: "// return the result" above return result
- AI-generated narration
  Example: "// This function handles user authentication"
  Example: "// Here we process the incoming request"
- Commented-out code blocks (version control has the history)
  Exception: Code commented with an explanatory note about WHY it's disabled
- Stale TODOs with no issue reference or actionable content
  Example: "// TODO: fix this later"
  Keep: "// TODO(#123): migrate to v2 API"
- Section dividers that add no information
  Example: "// --- Helper Functions ---"
  Example: "// ========================="
- JSDoc/docstrings that only restate the function signature
  Example: "@param name - the name" for function greet(name)
  Keep: "@param name - display name, falls back to email prefix if not set"

PRESERVE (severity: KEEP — do not touch):
- Intent comments explaining WHY, not WHAT
  Example: "// Rate limit to prevent abuse from automated scrapers"
- Non-obvious business logic explanations
  Example: "// Discount applies only to first purchase — legal requirement from TOS v3"
- Legal/license headers
- TODOs with issue references: TODO(#123), TODO(JIRA-456)
- Warnings about non-obvious gotchas
  Example: "// Order matters: auth middleware must run before rate limiter"
- Type annotations in untyped languages where they serve as documentation
- Regex explanations for non-trivial patterns

For each removal, log:
  - File path and line number
  - Removed text (first 80 chars)
  - Reason: restates-code | ai-narration | commented-out-code | stale-todo | noise-divider | signature-restatement
```

---

## Section 4: Pass 2 — Code Simplification

```
## Code Simplification Pass

Reduce complexity without changing behavior.

SIMPLIFY (auto-apply):
- Flatten nested if/else chains using early returns or guard clauses
  Before: if (x) { if (y) { doThing() } }
  After:  if (!x) return; if (!y) return; doThing();
- Replace verbose conditional chains with lookup tables or switch statements
- Remove dead code paths (unreachable after return/throw/break/continue)
- Remove unused local variables, parameters (if not in public API), and imports
- Inline single-use variables that add no clarity
  Before: const result = getValue(); return result;
  After:  return getValue();
  Exception: Keep if the variable name adds meaningful context
- Collapse trivial wrapper functions that only forward to another function
  Before: function getUser(id) { return fetchUser(id); }
  After:  (remove wrapper, update callers to use fetchUser directly — only if local scope)
- Replace hand-rolled logic with standard library equivalents
  Before: arr.filter(x => x !== null && x !== undefined)
  After:  arr.filter(Boolean) (if semantically equivalent)

FLAG AS REFACTOR (report but do not auto-apply):
- Extracting a function from a block >50 lines (needs naming decision from human)
- Removing an exported symbol (may have external consumers beyond the file list)
- Consolidating duplicated logic across files (cross-file change)
- Replacing a pattern with a different abstraction

For each change, log:
  - File path and line range
  - What changed (brief description)
  - Reason: guard-clause | dead-code | unused-variable | inline-trivial | collapse-wrapper | stdlib-equivalent
```

---

## Section 5: Pass 3 — Readability Refactoring

```
## Readability Refactoring Pass

Improve naming, structure, and type clarity for human readers.

RENAME (auto-apply for local scope; flag for exported symbols):
- Variables with vague names: data, result, temp, val, x, item, thing, obj, tmp, ret
  Rename to describe what the value represents
  Example: const data = fetchUsers() → const activeUsers = fetchUsers()
- Functions with vague names: process, handle, do, run, execute, manage, perform
  Rename to describe what the function does and to what
  Example: function handleData(input) → function validateOrderItems(items)
- Parameters: positional ambiguity, especially booleans
  Example: createUser(name, true) → createUser(name, { sendWelcomeEmail: true })
  Note: Parameter object refactoring for exported functions is flagged as EXTRACT, not auto-applied
- Local scope only — do NOT rename symbols that are exported from the module without flagging

EXTRACT (flag for review — do not auto-apply):
- Functions longer than 50 lines → suggest extraction points with proposed names
- Functions with >4 parameters → suggest options object or decomposition
- Deeply nested blocks (>3 levels of nesting) → suggest extraction to named helper

TYPE CLARITY (auto-apply for obvious cases):
- Add return type annotations where inference is ambiguous or the function is exported
- Add parameter type annotations where `any` is used without justification comment
- Replace `any` with specific types where the actual type is determinable from usage context
- Flag ambiguous type changes as TYPE instead of auto-applying

For each change, log:
  - File path and line number
  - Old name/structure → New name/structure
  - Reason: vague-variable | vague-function | ambiguous-parameter | missing-type | any-replacement
```

---

## Section 6: Pass 4 — Consistency Normalization

```
## Consistency Normalization Pass

Align code to the project's detected conventions (from Section 2).

NORMALIZE (auto-apply — aligning to established convention):
- Import ordering: match detected convention
  Typical order: stdlib/builtin → external packages → internal modules → relative imports
  Within groups: alphabetical (if that's the established pattern)
- Import style: match detected convention (named vs default, path aliases vs relative)
- Naming outliers: align to dominant project convention
  Example: If project uses camelCase and one function is snake_case, rename to camelCase
  Only for local/private symbols — exported symbols flagged as CONVENTION
- Error handling: align to detected dominant pattern
  Example: If project uses try/catch and one function uses .catch(), convert to try/catch
- String style: match dominant quote style (single vs double)
- Trailing commas and semicolons: match dominant style
- File structure: match detected section ordering
  Example: If project convention is imports → types → constants → logic → exports, reorder

CONVENTION (flag for review — do not auto-apply):
- Introducing a new pattern not yet used in the project
- Cases where two conventions are equally prevalent (ambiguous from Section 2)
- Style choices where readability and consistency conflict
- Exported symbol naming changes

Do NOT normalize:
- Formatting handled by prettier/eslint/formatters (indentation, line length, whitespace)
- Patterns explicitly allowed as alternatives in CLAUDE.md
- Language-specific idioms that are correct in their context even if different from the majority

For each change, log:
  - File path and line number
  - What changed
  - Which convention it aligns to (with source: CLAUDE.md | CODEBASE.md | detected-{prevalence}%)
```

---

## Section 7: Safety Rails

Ensures polish changes do not break working code. Runs after all four passes are applied.

```
Step 1: Pre-polish state
  Before any pass executes:
  a. Detect test command:
     - Check PROJECT.md or CONTEXT.md for test_command or verification_commands
     - Check for common test runners: npm test, yarn test, pytest, cargo test, go test, mix test
     - Check package.json scripts.test (if exists)
     - If found: store as TEST_COMMAND
     - If not found: TEST_COMMAND = null
  b. Detect type checker:
     - Check for tsconfig.json → tsc --noEmit
     - Check for mypy.ini/setup.cfg [mypy] → mypy .
     - Check for Cargo.toml → cargo check
     - If found: store as TYPE_CHECK_COMMAND
     - If not found: TYPE_CHECK_COMMAND = null
  c. If TEST_COMMAND exists: run it, record baseline result (pass/fail + which tests)
  d. If TYPE_CHECK_COMMAND exists: run it, record baseline result

Step 2: Apply all 4 passes
  (Passes are applied by the polish agent as defined in Sections 3-6)

Step 3: Post-polish test verification
  If TEST_COMMAND exists:
    Run TEST_COMMAND again
    If all pass: tests_safe = true
    If any fail that passed before (regression):
      For each newly-failing test:
        Identify which polished file(s) are most likely responsible
        (match test imports/references against polished files)
        Revert those files: git checkout -- {file}
        Re-run TEST_COMMAND
        If revert fixed the failure: log "Reverted polish for {file}: caused test failure in {test}"
        If revert did NOT fix: continue to next candidate file
      If no single-file revert resolves all failures:
        Revert ALL polish changes: git checkout -- {all polished files}
        Log: "ERROR: Polish changes caused test failures that could not be isolated. All changes reverted."
        tests_safe = false

  If TEST_COMMAND is null:
    Log: "Warning: No test command available — polish changes not verified by tests"
    tests_safe = null (unknown)

Step 4: Post-polish type check verification
  If TYPE_CHECK_COMMAND exists:
    Run TYPE_CHECK_COMMAND
    If clean (or same errors as baseline): types_safe = true
    If new type errors introduced:
      Same revert logic as Step 3 — isolate by file, revert problematic files
      types_safe = false (for reverted files)

  If TYPE_CHECK_COMMAND is null:
    Log: "No type checker available — type safety not verified"
    types_safe = null (unknown)
```

---

## Section 8: Artifact Output

Defines the POLISH.md artifact format for both standalone and review-integrated modes.

```
Output location:
  - Review-integrated mode: appended to .planning/phases/{NN}-{slug}/{NN}-REVIEW.md
    under a "## Post-Review Polish" heading
  - Standalone mode: printed to stdout (not written to .planning/)

Format:

# Polish Summary

## Stats
- Files polished: {count of files with at least one change applied}
- Files skipped (safety): {count of files where changes were reverted due to test/type failures}
- Comments removed: {total CLEAN actions from Pass 1}
- Lines simplified: {total SIMPLIFY actions from Pass 2}
- Symbols renamed: {total RENAME actions from Pass 3}
- Patterns normalized: {total NORMALIZE actions from Pass 4}

## Changes by Pass

### Pass 1: Comment Cleanup
| File | Removals | Reason |
|------|----------|--------|
| {path} | {count} | {comma-separated reasons} |

### Pass 2: Code Simplification
| File | Lines | Change | Reason |
|------|-------|--------|--------|
| {path} | {line range} | {brief description} | {reason code} |

### Pass 3: Readability Refactoring
| File | Change | Old -> New | Reason |
|------|--------|-----------|--------|
| {path} | {rename/type} | {old} -> {new} | {reason code} |

### Pass 4: Consistency Normalization
| File | Change | Convention |
|------|--------|------------|
| {path} | {brief description} | {convention source} |

## Flagged for Review
Items marked REFACTOR, EXTRACT, or CONVENTION that need human decision:
- [ ] {description} ({file}:{line}) — {severity}

## Safety
- Tests: {PASS | FAIL (reverted: {file list}) | NOT AVAILABLE}
- Type check: {PASS | FAIL (reverted: {file list}) | NOT AVAILABLE}
```

---

## References

This skill is consumed by:
- `commands/polish.md` — standalone `/legion:polish` command
- `commands/review.md` — post-review polish step (Step 7.5)
- `skills/review-loop/SKILL.md` — Section 7.5 dispatcher

Agent personality: `agents/testing-code-polisher.md`

Settings:
- `review.polish` (boolean, default true) — enable/disable post-review polish
- `review.polish_scope` (string, default "dependents") — scope for review-integrated polish
```

- [ ] **Step 3: Verify the file was created correctly**

Run: `head -8 skills/code-polish/SKILL.md`
Expected: YAML frontmatter starting with `---` and `name: legion:code-polish`

- [ ] **Step 4: Commit**

```bash
git add skills/code-polish/SKILL.md
git commit -m "feat(legion): add code-polish skill with 4-pass rubric

Sections: scope resolution, convention detection, comment cleanup,
code simplification, readability refactoring, consistency normalization,
safety rails, and artifact output."
```

---

### Task 3: Create the Polish Command (`commands/polish.md`)

**Why third:** The command is the standalone entry point. It depends on the skill (Task 2) and agent (Task 1) existing.

**Files:**
- Create: `commands/polish.md`

- [ ] **Step 1: Create the command file**

Use the existing command format from `commands/quick.md` as the structural template (YAML frontmatter + `<objective>` + `<execution_context>` + `<context>` + `<process>`).

```markdown
---
name: legion:polish
description: Clean and polish code for readability, consistency, and clarity
argument-hint: [--phase N] [--scope=changed|dependents|directory] [--dry-run] [<target-path>]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion]
---

<objective>
Polish target code through four structured passes: comment cleanup, code simplification, readability refactoring, and consistency normalization. Behavior-preserving only — never changes what code does, only how it reads.

Purpose: Standalone ad-hoc code cleanup ("deslopping") with the right agent, no phase planning required. Also invoked as a post-review step by /legion:review.
Output: Polished code with conventional commit, polish summary report, and flagged items for human review.
</objective>

<execution_context>
skills/workflow-common-core/SKILL.md
skills/code-polish/SKILL.md
skills/agent-registry/SKILL.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
</context>

<process>
1. PARSE ARGUMENTS
   - Read $ARGUMENTS
   - If $ARGUMENTS is empty or missing:
     - Attempt auto-detect: read .planning/STATE.md for current phase
     - If phase found and phase has files_modified: use those files as target
     - If no phase context:
       Display: "Usage: `/legion:polish <target>`
                Example: `/legion:polish src/auth/`
                Example: `/legion:polish src/utils/parser.ts`
                Example: `/legion:polish --phase 2`
                Example: `/legion:polish --scope=changed src/`
                Example: `/legion:polish --dry-run src/components/`

                Flags:
                `--phase N`                    Target a specific phase's modified files
                `--scope=changed|dependents|directory`  Override default scope (dependents)
                `--dry-run`                    Preview changes without applying them"
       Exit — do not proceed

   - Parse flags from $ARGUMENTS:
     - If contains `--phase`: extract N, set TARGET_TYPE = "phase", TARGET = N
     - If contains `--scope=`: extract scope value, set SCOPE_OVERRIDE to "changed" | "dependents" | "directory"
     - If contains `--dry-run`: set DRY_RUN = true
     - Remaining non-flag argument: set as TARGET_PATH
     - If TARGET_TYPE not set and TARGET_PATH exists: set TARGET_TYPE = "path", TARGET = TARGET_PATH
     - If TARGET_TYPE not set and no TARGET_PATH: set TARGET_TYPE = "auto" (use current phase)

   - Display: "Polish target: {TARGET_TYPE} — {TARGET description}"

2. LOAD PROJECT CONTEXT
   - Read .planning/PROJECT.md (if exists): extract project name, tech stack, test commands
   - Read CLAUDE.md at project root (if exists): extract explicit coding conventions
   - Read .planning/CODEBASE.md (if exists): extract detected conventions and stack
   - If none of these exist: proceed with convention detection from code only (Section 2, Step 3)
   - Execute convention detection per code-polish skill Section 2:
     - Merge explicit (CLAUDE.md) > detected (CODEBASE.md) > sampled (code files)
   - Display detected conventions summary

3. RESOLVE TARGET FILES
   - Execute scope resolution per code-polish skill Section 1:
     - Input: TARGET (from Step 1), SCOPE_OVERRIDE (from Step 1)
     - Output: file_list
   - Display: "Files to polish: {count}"
   - List all files (if <= 20)
   - If > 20 files:
     Display the first 10 files and "... and {remaining} more"
     Use AskUserQuestion:
       "Polish scope includes {count} files. Proceed?"
       Options:
       - "Yes, polish all {count} files"
       - "Narrow scope — let me specify a smaller target"
     If user narrows: ask for new target, go back to Step 1

4. DRY-RUN CHECK
   - If DRY_RUN is true:
     a. Read agent personality: agents/testing-code-polisher.md
     b. Construct polish prompt with:
        - Full personality injection
        - Convention context from Step 2
        - File list from Step 3
        - All 4 pass rubrics from code-polish skill Sections 3-6
        - Additional instruction: "REPORT ONLY — do not modify any files. For each pass,
          list what you WOULD change with file, line, change description, and reason.
          Use the same logging format as the normal passes."
     c. Spawn agent via adapter.spawn_agent_personality:
        - model: adapter.model_execution
        - name: "code-polisher-dry-run"
     d. Collect findings report
     e. Display: "## Dry Run Results\n{findings summary}\n\nNo files were modified."
     f. Exit

5. EXECUTE POLISH
   a. Resolve agent path: follow workflow-common Agent Path Resolution Protocol for AGENTS_DIR
   b. Read agent personality: {AGENTS_DIR}/testing-code-polisher.md
      - If file not found after Read: ERROR "Code Polisher agent not found. Run /legion:update."
   c. Construct polish prompt:
      - Full personality content (no truncation)
      - "---"
      - "# Polish Task"
      - Convention context from Step 2
      - File list from Step 3
      - All 4 pass rubrics from code-polish skill Sections 3-6
      - Safety reminder: "CRITICAL: Do not change behavior. The code must produce identical
        outputs before and after your changes. When in doubt, flag as REFACTOR/EXTRACT/CONVENTION
        instead of changing."
   d. Spawn agent via adapter.spawn_agent_personality:
      - model: adapter.model_execution
      - name: "code-polisher-{target-slug}"
   e. Wait for agent completion per adapter.collect_results

6. SAFETY VERIFICATION
   - Execute safety rails per code-polish skill Section 7:
     a. Run tests (if test command available)
     b. Run type checker (if available)
     c. Revert any files that caused test/type failures
   - If reverts occurred:
     Display: "Safety check reverted polish changes in {count} file(s):
              {file list with failure reasons}"
   - If all changes reverted (nothing safe to keep):
     Display: "All polish changes caused test failures and were reverted. No changes made."
     Exit

7. REPORT AND COMMIT
   - Collect polish report from agent output (format per code-polish skill Section 8)
   - Display polish summary to stdout
   - If files were changed:
     - Create commit:
       git add {all polished files that passed safety check}
       git commit -m "refactor: polish {target description}

       {count} files polished: {pass 1 count} comments removed, {pass 2 count} simplifications,
       {pass 3 count} renames, {pass 4 count} normalizations.

       {adapter.commit_signature}"
   - If no changes needed:
     Display: "Code is already clean — no changes made."

8. FLAGGED ITEMS
   - If any REFACTOR/EXTRACT/CONVENTION items were flagged in the polish report:
     Display flagged items list
     Use AskUserQuestion:
       "Polish complete. {count} items flagged for human review. Want to address any?"
       Options:
       - "Yes, show me the flagged items to address"
       - "No, I'll review them later"
       - "Skip — flagged items are fine as-is"
     If user selects "Yes":
       Display the full flagged items with file, line, description, and suggested change
       For each item, ask: apply or skip
       For applied items: make the change, add to commit
     If user selects "No" or "Skip": done
</process>
```

- [ ] **Step 2: Verify the file structure matches Legion conventions**

Run: `head -6 commands/polish.md && echo "---" && head -6 commands/quick.md`
Expected: Both files start with YAML frontmatter in the same format (`---`, `name:`, `description:`, `argument-hint:`, `allowed-tools:`)

- [ ] **Step 3: Commit**

```bash
git add commands/polish.md
git commit -m "feat(legion): add /legion:polish standalone command

Standalone code cleanup command with scope resolution, dry-run mode,
safety verification, and flagged item follow-up."
```

---

### Task 4: Integrate Polish into Review Pipeline

**Why fourth:** Now that the skill, agent, and command all exist, wire polish into the review flow as a post-review step.

**Files:**
- Modify: `commands/review.md` (add Step 7.5 and conditional skill loading)
- Modify: `skills/review-loop/SKILL.md` (add Section 7.5)

- [ ] **Step 1: Add polish skill to review command's conditional skill loading**

In `commands/review.md`, find the conditional skill loading section (Step 0, around line 50-62). Add the code-polish skill as a conditional load after the existing entries.

Find this block (around lines 58-62):
```
   - `skills/design-workflows/SKILL.md` only for design phases when multi-pass evaluators are active (enables post-implementation design audit, Section 9).
   If a condition is not met, skip that skill silently and continue.
```

Add immediately before `If a condition is not met, skip that skill silently and continue.`:
```
   - `skills/code-polish/SKILL.md` only if `settings.review.polish` is not explicitly `false` (default: true). Enables post-review code polish step (Step 7.5).
```

- [ ] **Step 2: Add polish skill to review command's execution_context**

In `commands/review.md`, find the `<execution_context>` block (around lines 12-19). Add the code-polish skill reference.

Find:
```
skills/intent-router/SKILL.md
</execution_context>
```

Add before `</execution_context>`:
```
skills/code-polish/SKILL.md
```

- [ ] **Step 3: Add Step 7.5 to review command process**

In `commands/review.md`, find the section between Path A (Review Passed) step `c3.` (CAPTURE PREFERENCE) and step `d.` (Display pass result). The Step 7.5 goes after all the commit/memory/preference steps but before the display and routing.

Find the line (around line 613):
```
   d. Display pass result:
      "Phase {N}: {phase_name} — Review PASSED ({cycles} cycle(s))
```

Insert BEFORE that line:

```
   c4. POST-REVIEW POLISH (optional — follows code-polish skill)
       Read `settings.review.polish` (default: true).

       If settings.review.polish != false:
         1. Load skills/code-polish/SKILL.md (if not already loaded in Step 0)
         2. Resolve scope: phase's files_modified list + direct dependents
            (override with settings.review.polish_scope if set, default: "dependents")
         3. Execute convention detection per code-polish skill Section 2
         4. Resolve agent path: follow workflow-common Agent Path Resolution Protocol for AGENTS_DIR
         5. Read agent personality: {AGENTS_DIR}/testing-code-polisher.md
            If file not found after Read: log warning, skip polish step
         6. Construct polish prompt:
            - Full personality content (no truncation)
            - "---"
            - "# Polish Task (Post-Review)"
            - Convention context from Step 3
            - File list from Step 2
            - All 4 pass rubrics from code-polish skill Sections 3-6
            - "This is a post-review polish pass. The code has already passed review.
              Your job is to clean it up for clarity and consistency. Do not change behavior."
         7. Spawn testing-code-polisher agent via adapter.spawn_agent_personality:
            - model: adapter.model_execution
            - name: "code-polisher-phase-{N}"
         8. Wait for agent completion per adapter.collect_results
         9. Execute safety rails per code-polish skill Section 7:
            - Run verification_commands from the phase plan (if available) instead of generic test detection
            - Same revert logic as standalone mode
         10. If changes were made and safety check passed:
             - Commit:
               git add {all polished files that passed safety check}
               git commit -m "refactor(legion): polish phase {N} code

               Post-review polish: {stats summary}.

               {adapter.commit_signature}"
             - Append polish summary to {NN}-REVIEW.md under a new section:
               "## Post-Review Polish
                {polish summary from code-polish skill Section 8}"
         11. If changes caused safety failures:
             - Revert all changes
             - Append to {NN}-REVIEW.md:
               "## Post-Review Polish
                Polish skipped — changes caused verification failures. {count} file(s) reverted."
             - Log: "Post-review polish skipped (safety)"
         12. If agent errors or times out:
             - Log warning: "Post-review polish agent failed — skipping"
             - Append to {NN}-REVIEW.md:
               "## Post-Review Polish
                Polish skipped — agent error."
         13. Proceed to step d (display pass result) regardless of polish outcome.
             Polish NEVER blocks phase completion.

       If settings.review.polish == false:
         Skip silently. Log: "Post-review polish: disabled via settings"

```

- [ ] **Step 4: Add Section 7.5 to review-loop skill**

In `skills/review-loop/SKILL.md`, find the end of Section 7 (Review Passed) — specifically after Step 5 (Route to next action), around line 860. Add Section 7.5 before Section 8 (Escalation).

Find the line:
```
---

## Section 8: Escalation
```

Insert BEFORE that line:

```
---

## Section 7.5: Post-Review Polish

Optional code cleanup pass that runs after review passes. Invoked by `commands/review.md` Step c4. The full polish logic lives in `skills/code-polish/SKILL.md` — this section is a thin integration point.

### Activation

```
Check settings.review.polish (default: true)
If false: skip this section entirely, proceed to phase completion
If true: proceed to dispatch
```

### Dispatch

The review command (Step c4) handles all dispatch details:
- Scope resolution (code-polish Section 1)
- Convention detection (code-polish Section 2)
- Agent personality loading (testing-code-polisher.md)
- 4-pass rubric injection (code-polish Sections 3-6)
- Safety rails (code-polish Section 7)
- Artifact output (code-polish Section 8)

This section documents the integration contract only.

### Non-Blocking Guarantee

Polish failures NEVER block phase completion. The review has already passed — the code is correct. Polish is about making correct code *clean*.

Failure modes and their handling:
- Agent spawn failure → log warning, skip polish, proceed
- Agent timeout → log warning, skip polish, proceed
- Safety check failure (tests break) → revert all changes, log in REVIEW.md, proceed
- Partial safety failure (some files revert) → keep safe changes, log reverts, proceed

### Artifact

When polish succeeds, its summary is appended to {NN}-REVIEW.md under a "## Post-Review Polish" heading. This keeps the polish results co-located with the review results for the phase.

### Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `review.polish` | boolean | `true` | Enable/disable post-review polish step |
| `review.polish_scope` | string | `"dependents"` | Scope override: `"changed"`, `"dependents"`, `"directory"` |

```

- [ ] **Step 5: Verify the insertions are correct**

Run: `grep -n "POST-REVIEW POLISH\|Section 7.5\|code-polish" commands/review.md | head -10`
Expected: Lines showing the new Step c4, execution_context entry, and conditional skill loading entry

Run: `grep -n "Section 7.5\|Post-Review Polish\|code-polish" skills/review-loop/SKILL.md | head -10`
Expected: Lines showing the new Section 7.5

- [ ] **Step 6: Commit**

```bash
git add commands/review.md skills/review-loop/SKILL.md
git commit -m "feat(legion): integrate code polish into review pipeline

Post-review polish step (Step 7.5) runs after review passes.
Non-blocking — polish failures never prevent phase completion.
Controlled via settings.review.polish (default: true)."
```

---

### Task 5: Update CLAUDE.md, Settings Schema, and Agent Catalog

**Why last:** These are metadata/documentation updates that reference the files created in Tasks 1-4.

**Files:**
- Modify: `CLAUDE.md` (add command to table, update counts)
- Modify: `docs/settings.schema.json` (add polish settings)
- Modify: `skills/agent-registry/CATALOG.md` (add new agent to Testing division)

- [ ] **Step 1: Add `/legion:polish` to CLAUDE.md command table**

In `CLAUDE.md`, find the Available Commands table. Add the polish command in alphabetical position.

Find the line:
```
| `/legion:plan <N>` | Plan phase N with agent recommendations and wave-structured tasks |
```

Add immediately AFTER that line:
```
| `/legion:polish` | Polish code for readability, consistency, and clarity (standalone or post-review) |
```

- [ ] **Step 2: Update CLAUDE.md counts**

In `CLAUDE.md`, find the Project Structure section. Update the commands count:

Find: `commands/             — 17 /legion: command entry points`
Replace with: `commands/             — 18 /legion: command entry points`

Find: `skills/               — 30 reusable workflow skills (SKILL.md per directory)`
Replace with: `skills/               — 31 reusable workflow skills (SKILL.md per directory)`

Also update the Dynamic Knowledge Index to include the new skill and agent. Find the skills index core section:

Find: `|core:{workflow-common/SKILL.md,workflow-common-core/SKILL.md,workflow-common-domains/SKILL.md,workflow-common-github/SKILL.md,workflow-common-memory/SKILL.md}`

Add after the `|review:` line:
```
|polish:{code-polish/SKILL.md}
```

In the agents index, find the testing line and add the new agent:

Find: `|testing:{testing-api-tester.md,testing-performance-benchmarker.md,testing-qa-verification-specialist.md,testing-test-results-analyzer.md,testing-tool-evaluator.md,testing-workflow-optimizer.md}`

Replace with: `|testing:{testing-api-tester.md,testing-code-polisher.md,testing-performance-benchmarker.md,testing-qa-verification-specialist.md,testing-test-results-analyzer.md,testing-tool-evaluator.md,testing-workflow-optimizer.md}`

Update the agent count in the header:

Find: `agents/               — 48 agent personality .md files (flat, with division in frontmatter)`
Replace with: `agents/               — 49 agent personality .md files (flat, with division in frontmatter)`

Update the Testing division count in the Agent Divisions table:

Find: `| Testing | 6 | QA verification, performance, API testing, workflow optimization |`
Replace with: `| Testing | 7 | QA verification, performance, API testing, workflow optimization, code polish |`

Update the total:

Find: `## Agent Divisions (48 total)`
Replace with: `## Agent Divisions (49 total)`

- [ ] **Step 3: Add polish settings to the settings schema**

In `docs/settings.schema.json`, find the review section properties (around line 47-65). Add the polish settings.

Find:
```json
        "coverage_thresholds": {
```

Add BEFORE that line:
```json
        "polish": {
          "type": "boolean",
          "default": true,
          "description": "Enable post-review code polish step. When true, /legion:review runs a 4-pass cleanup after review passes."
        },
        "polish_scope": {
          "type": "string",
          "enum": ["changed", "dependents", "directory"],
          "default": "dependents",
          "description": "Scope for review-integrated polish: changed files only, changed + dependents (default), or full directory."
        },
```

- [ ] **Step 4: Add Code Polisher to the Agent Catalog**

In `skills/agent-registry/CATALOG.md`, find the Testing Division table (around line 115-124). Add the new agent in alphabetical order within the table.

Find the line:
```
| testing-api-tester | `agents/testing-api-tester.md` | Expert API testing specialist focused on comprehensive API validation, performance testing, and quality assurance across all systems | api-testing, integration-testing, performance-testing, security-testing, test-automation |
```

Add immediately AFTER that line:
```
| testing-code-polisher | `agents/testing-code-polisher.md` | Code clarity and consistency specialist focused on removing noise, simplifying structure, improving naming, and normalizing conventions without changing behavior | code-polish, comment-cleanup, code-simplification, readability-refactoring, convention-normalization, deslopping |
```

Also update the Testing Division header count:

Find: `### Testing Division (6 agents)`
Replace with: `### Testing Division (7 agents)`

- [ ] **Step 5: Verify all metadata updates**

Run: `grep -c "legion:polish" CLAUDE.md`
Expected: At least 1 (the command table entry)

Run: `grep "polish" docs/settings.schema.json`
Expected: Lines showing the polish and polish_scope properties

Run: `grep "testing-code-polisher" skills/agent-registry/CATALOG.md`
Expected: The catalog entry line

Run: `grep "49" CLAUDE.md | head -5`
Expected: Lines showing "49 agent" and "49 total" references

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md docs/settings.schema.json skills/agent-registry/CATALOG.md
git commit -m "docs(legion): register code polisher in CLAUDE.md, settings schema, and agent catalog

Update command table (18 commands), skill index (31 skills),
agent counts (49 agents, Testing division 7), settings schema
(review.polish, review.polish_scope), and agent catalog."
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Polish skill with 4 passes (Sections 1-8) → Task 2
- [x] Standalone command with all flags → Task 3
- [x] Agent personality with enriched frontmatter → Task 1
- [x] Review integration (Step 7.5, non-blocking) → Task 4
- [x] Settings surface (review.polish, review.polish_scope) → Task 5
- [x] CLAUDE.md command table update → Task 5
- [x] Agent catalog registration → Task 5
- [x] Safety rails with test/type verification → Task 2 (Section 7)
- [x] Convention detection → Task 2 (Section 2)
- [x] Scope resolution with dependent expansion → Task 2 (Section 1)
- [x] Dry-run mode → Task 3 (Step 4)
- [x] Flagged item follow-up → Task 3 (Step 8)
- [x] POLISH.md artifact format → Task 2 (Section 8)

**Placeholder scan:** No TBD, TODO, or vague steps found.

**Type consistency:** All references cross-checked:
- `testing-code-polisher` used consistently (agent ID, file name, catalog entry, review dispatch)
- `code-polish` used consistently (skill directory name, skill reference in execution_context)
- `settings.review.polish` and `settings.review.polish_scope` used consistently across schema, command, and review integration
- Agent frontmatter fields match the enriched format used by all 48 existing agents
