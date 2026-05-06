---
name: legion:code-polish
description: Structured multi-pass code cleanup engine for removing noise, simplifying structure, improving naming, and normalizing conventions
triggers: [polish, cleanup, deslop, simplify, readability, code-quality, deslopping]
token_cost: high
summary: "Four-pass code polish engine: comment cleanup, code simplification, readability refactoring, consistency normalization. Reusable by /legion:polish (standalone) and /legion:review (post-review step)."
---

# Code Polish

Structured four-pass code cleanup engine. Takes files that already work and makes them clearer, shorter, and more consistent without changing behavior. Each pass has a single focus and a concrete rubric with auto-apply rules (safe, mechanical) and flag-only rules (require human judgment).

Two integration modes:
- **Standalone**: invoked via `/legion:polish` — user selects scope, engine runs all 4 passes, outputs POLISH.md
- **Review-integrated**: invoked by review-loop after fix cycles complete — scope is the files just reviewed, output appends to REVIEW.md

The engine always dispatches to the `testing-code-polisher` agent personality. Load `agents/testing-code-polisher.md` before invoking any pass.

---

## Section 1: Scope Resolution

Determines which files to polish. Runs before any pass begins.

```
Input:
  phase_id     — current phase (optional, from STATE.md)
  file_path    — explicit file or glob (optional, from CLI arg)
  directory    — explicit directory (optional, from --scope=directory:<path>)
  scope_mode   — "changed" | "directory" | "auto" (default: "auto")

Step 1: Determine base file set
  If file_path provided:
    base_files = resolve glob or literal path → file list
  Else if phase_id provided:
    Read .planning/phases/phase-{N}-plan.md
    base_files = union of all files_modified across all plans in the phase
  Else if scope_mode == "directory" AND directory provided:
    base_files = all source files under directory (recursive)
  Else:
    Read .planning/STATE.md → find current phase → extract files_modified
    If no current phase or no files found:
      FAIL: "Cannot auto-detect scope. Provide --file, --phase, or --scope=directory:<path>"

Step 2: Expand to dependents (one level)
  If scope_mode == "changed":
    Skip this step entirely — polish only the base files
  Else:
    For each file in base_files:
      Parse its exports (named exports, default export, module.exports)
      Search project source files for import/require statements referencing this file
      Add importing files to expanded_set (one level only — do not recurse further)
    base_files = base_files ∪ expanded_set

Step 3: Apply scope overrides
  If scope_mode == "changed":
    Already handled in Step 2 (skip expansion)
  If scope_mode == "directory":
    Filter base_files to only files under the specified directory

Step 4: Filter excluded paths
  Remove files matching any of:
    **/node_modules/**
    **/dist/**
    **/build/**
    **/out/**
    **/.git/**
    **/.planning/**
    **/*.lock
    **/*.min.js
    **/*.min.css
    **/*.map
    Binary files (images, fonts, compiled assets)
    Files matching patterns in .gitignore

Step 5: Cap file count
  If len(base_files) > 50:
    Log WARNING: "Scope contains {N} files — capping at 50. Use --scope=changed or --file to narrow."
    Truncate to first 50 files (sorted by modification time, most recent first)

Step 6: Report
  Log: "Polish scope: {len(base_files)} files"
  Log: "  Base: {count_base} | Dependents: {count_expanded} | Excluded: {count_filtered}"
  Return base_files as ordered list
```

---

## Section 2: Convention Detection

Detects project patterns before making any changes. Conventions discovered here govern all four passes. Higher-precedence sources override lower ones.

```
Input: base_files (from Section 1)

Step 1: Read explicit standards
  If CLAUDE.md exists at project root:
    Extract any sections about: naming, formatting, imports, comments, error handling
    Store as explicit_conventions (highest precedence)

Step 2: Read detected conventions
  If .planning/CODEBASE.md exists:
    Extract "Conventions" or "Patterns" sections
    Store as detected_conventions (medium precedence)

Step 3: Sample codebase for implicit conventions
  Select up to 10 files from base_files (prefer largest files by line count)
  For each sampled file, detect:
    naming_style:
      variables → camelCase | snake_case | PascalCase | SCREAMING_SNAKE
      functions → camelCase | snake_case | PascalCase
      files     → kebab-case | camelCase | snake_case | PascalCase
      constants → SCREAMING_SNAKE | camelCase | PascalCase
    import_style:
      ordering  → stdlib-first | third-party-first | grouped-by-type | unordered
      syntax    → named-only | default-preferred | mixed
      paths     → absolute | relative | aliases
    error_handling:
      pattern   → try-catch | Result-type | error-first-callback | .catch() | mix
      granularity → per-call | per-function | boundary-only
    comment_style:
      doc_format → JSDoc | TSDoc | docstring | Javadoc | XML-doc | none
      inline     → above-line | end-of-line | mixed | none
    function_style:
      declaration → function-keyword | arrow | mixed
      max_length  → median function length in lines
    string_style:
      quotes      → single | double | backtick-preferred
    trailing_commas: always | never | multiline-only
    semicolons:     always | never | asi
    file_structure:
      ordering    → imports-types-constants-functions-exports |
                     imports-constants-functions-exports |
                     unstructured
  Store as implicit_conventions (lowest precedence)

Step 4: Merge conventions
  Final convention set = explicit_conventions ⊕ detected_conventions ⊕ implicit_conventions
  Where ⊕ means: for each convention key, use the highest-precedence source that defines it
  If a convention is contradictory between sources, explicit wins. Log the conflict:
    "Convention conflict: {key} — explicit={value_a}, detected={value_b}. Using explicit."

Step 5: Report
  Log: "Detected conventions:"
  For each convention key with a resolved value:
    Log: "  {key}: {value} (source: {explicit|detected|implicit})"
  Return merged convention set
```

---

## Section 3: Pass 1 — Comment Cleanup

Remove comments that add no information. Preserve comments that explain non-obvious intent. This is a deletion pass — it adds nothing.

### 3.1 REMOVE Rules (severity: CLEAN)

Apply these removals automatically. Every removal is logged.

| Rule | Description | Example |
|------|-------------|---------|
| `restates-code` | Comment restates what the next line does | `// increment counter` above `counter++` |
| `ai-narration` | AI-generated narration or step-by-step commentary | `// Now we need to fetch the user data from the API` |
| `commented-out-code` | Code in comments with no explanation of why it is kept | `// const oldHandler = () => { ... }` |
| `stale-todo` | TODO/FIXME/HACK with no issue reference and no date, older than the current sprint | `// TODO: fix this later` |
| `noise-divider` | Decorative dividers or section banners that separate obvious blocks | `// =====================` or `// --- helpers ---` |
| `signature-restatement` | Comment restates function name, parameters, or return type already visible in the signature | `/** Gets user by ID */` above `function getUserById(id: string): User` |

**Detailed examples:**

```
REMOVE — restates-code:
  BEFORE:
    // Set the user's name
    user.name = newName;
  AFTER:
    user.name = newName;

REMOVE — ai-narration:
  BEFORE:
    // First, we need to validate the input parameters to ensure they meet
    // the expected format before proceeding with the database query
    validateInput(params);
  AFTER:
    validateInput(params);

REMOVE — commented-out-code:
  BEFORE:
    // function oldApproach(data) {
    //   return data.map(x => x * 2);
    // }
    function newApproach(data) {
  AFTER:
    function newApproach(data) {

REMOVE — stale-todo:
  BEFORE:
    // TODO fix this later
    const result = fetchData();
  AFTER:
    const result = fetchData();

REMOVE — noise-divider:
  BEFORE:
    // ========================
    // Helper Functions
    // ========================
    function helper() {
  AFTER:
    function helper() {

REMOVE — signature-restatement:
  BEFORE:
    /**
     * Calculates the total price.
     * @param items - The items array
     * @returns The total price
     */
    function calculateTotalPrice(items: Item[]): number {
  AFTER:
    function calculateTotalPrice(items: Item[]): number {
```

### 3.2 PRESERVE Rules (severity: KEEP)

Never remove comments matching these patterns. If uncertain, preserve.

| Rule | Description | Example |
|------|-------------|---------|
| `intent` | Explains WHY, not what — reasoning, tradeoff, workaround | `// Using setTimeout because requestAnimationFrame skips background tabs` |
| `business-logic` | Encodes domain rules not obvious from code | `// Tax-exempt if order originated from EU VAT-registered entity` |
| `legal-header` | License, copyright, attribution | `// SPDX-License-Identifier: MIT` |
| `todo-with-ref` | TODO/FIXME with issue tracker reference | `// TODO(PROJ-123): migrate to v2 API after deprecation deadline` |
| `gotcha-warning` | Warns about non-obvious side effects or constraints | `// WARNING: this mutates the input array — caller must clone if needed` |
| `type-annotation` | Type hints in dynamically typed languages | `# type: Dict[str, List[int]]` in Python 2-style code |
| `regex-explanation` | Explains complex regex patterns | `// Matches ISO-8601 dates with optional timezone offset` |

### 3.3 Logging Format

```
For each removed comment, log:
  PASS1 | {file_path}:{line_number} | CLEAN | "{removed_text (first 80 chars)}" | {reason_code}

Example:
  PASS1 | src/auth/login.ts:42 | CLEAN | "// Set the username to the new value" | restates-code
  PASS1 | src/api/handler.ts:17 | CLEAN | "// Now we need to validate the request body befor..." | ai-narration
```

---

## Section 4: Pass 2 — Code Simplification

Reduce code volume and complexity without changing behavior. This pass targets structural waste — code that does more work than necessary to express its intent.

### 4.1 SIMPLIFY Rules (auto-apply)

Apply these transformations automatically. Each must be provably behavior-preserving.

| Rule | Description |
|------|-------------|
| `guard-clause` | Replace nested if/else with early returns |
| `lookup-table` | Replace if/else chains or switch on value with object/map lookup |
| `dead-code` | Remove unreachable code after return/throw/break/continue |
| `unused-vars` | Remove declared but never-referenced variables |
| `unused-imports` | Remove imported but never-referenced symbols |
| `inline-trivial` | Inline variables used exactly once on the next line |
| `collapse-wrapper` | Remove functions that only call another function with same args |
| `stdlib-equivalent` | Replace hand-rolled logic with standard library calls |

**Detailed examples:**

```
SIMPLIFY — guard-clause:
  BEFORE:
    function process(user) {
      if (user) {
        if (user.isActive) {
          return doWork(user);
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
  AFTER:
    function process(user) {
      if (!user || !user.isActive) return null;
      return doWork(user);
    }

SIMPLIFY — lookup-table:
  BEFORE:
    function getStatusLabel(status) {
      if (status === 'active') return 'Active';
      if (status === 'pending') return 'Pending';
      if (status === 'closed') return 'Closed';
      return 'Unknown';
    }
  AFTER:
    const STATUS_LABELS = { active: 'Active', pending: 'Pending', closed: 'Closed' };
    function getStatusLabel(status) {
      return STATUS_LABELS[status] ?? 'Unknown';
    }

SIMPLIFY — dead-code:
  BEFORE:
    function validate(input) {
      if (!input) throw new Error('missing input');
      return input.trim();
      console.log('validated');  // unreachable
    }
  AFTER:
    function validate(input) {
      if (!input) throw new Error('missing input');
      return input.trim();
    }

SIMPLIFY — collapse-wrapper:
  BEFORE:
    function formatName(first, last) {
      return buildFullName(first, last);
    }
  AFTER:
    // Remove formatName entirely; replace call sites with buildFullName

SIMPLIFY — stdlib-equivalent:
  BEFORE:
    function includes(arr, item) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] === item) return true;
      }
      return false;
    }
  AFTER:
    // Remove includes entirely; replace call sites with arr.includes(item)
```

### 4.2 REFACTOR Rules (flag only — do not auto-apply)

These require human judgment. Log them as flagged items for review.

| Rule | Trigger | Why flag |
|------|---------|----------|
| `extract-function` | Function body exceeds 50 lines | Naming and boundary decisions need human input |
| `remove-export` | Exported symbol has zero external consumers | Removing exports is a public API change |
| `cross-file-dedup` | Near-identical logic in 2+ files (>10 lines, >80% similarity) | Choosing where to put shared code is an architecture decision |
| `pattern-replacement` | Hand-rolled pattern has a well-known library equivalent (e.g., retry logic, debounce) | Adding dependencies requires human approval |

### 4.3 Logging Format

```
For each simplification, log:
  PASS2 | {file_path}:{start_line}-{end_line} | SIMPLIFY | "{description}" | {reason_code}

For each flagged refactor, log:
  PASS2 | {file_path}:{start_line}-{end_line} | FLAG | "{description}" | {reason_code}

Examples:
  PASS2 | src/utils/auth.ts:22-35 | SIMPLIFY | "Collapsed nested if/else to guard clause" | guard-clause
  PASS2 | src/services/order.ts:10 | SIMPLIFY | "Removed unused import: lodash.merge" | unused-imports
  PASS2 | src/api/handler.ts:44-112 | FLAG | "Function handleRequest is 68 lines — consider extraction" | extract-function
```

---

## Section 5: Pass 3 — Readability Refactoring

Improve how code communicates intent through naming and structure. This pass does not change logic — it changes vocabulary.

### 5.1 RENAME Rules

**Auto-apply for local scope** (variables, parameters, internal functions not in exports). **Flag for exported scope** (public API names, exported functions, class names).

| Rule | Trigger | Examples |
|------|---------|----------|
| `vague-variable` | Name is `data`, `result`, `temp`, `info`, `item`, `val`, `obj`, `x` in non-trivial scope (>3 lines from declaration to last use) | `data` -> `userRecords`, `result` -> `validationOutcome` |
| `vague-function` | Name is `handle`, `process`, `do`, `run`, `execute`, `manage` without domain qualifier | `handleData` -> `normalizeUserInput`, `processItem` -> `applyDiscount` |
| `ambiguous-param` | Parameter name does not hint at type or purpose | `fn(a, b, flag)` -> `fn(userId, orderId, includeArchived)` |
| `boolean-naming` | Boolean variable/param lacks is/has/should/can prefix | `active` -> `isActive`, `permission` -> `hasPermission` |
| `negated-boolean` | Boolean named with negation, causing double-negative reads | `isNotDisabled` -> `isEnabled`, `!isInvalid` -> `isValid` |

**Detailed examples:**

```
RENAME — vague-variable (auto, local):
  BEFORE:
    const data = await fetchUsers(orgId);
    const result = data.filter(u => u.isActive);
    return result;
  AFTER:
    const users = await fetchUsers(orgId);
    const activeUsers = users.filter(u => u.isActive);
    return activeUsers;

RENAME — vague-function (flag, exported):
  BEFORE:
    export function processItem(item: CartItem): CartItem { ... }
  FLAG: "Rename processItem to a domain-specific name like applyCartDiscounts or normalizeCartItem"

RENAME — boolean-naming (auto, local):
  BEFORE:
    const verified = user.emailVerifiedAt !== null;
    if (verified) { ... }
  AFTER:
    const isVerified = user.emailVerifiedAt !== null;
    if (isVerified) { ... }
```

### 5.2 EXTRACT Rules (always flag — never auto-apply)

These require human judgment on naming and boundaries.

| Rule | Trigger |
|------|---------|
| `oversized-function` | Function body exceeds 50 lines |
| `excessive-params` | Function accepts more than 4 parameters |
| `deep-nesting` | Code block exceeds 3 levels of nesting (if/for/while/try) |

**Example flag:**

```
FLAG — oversized-function:
  src/services/billing.ts:calculateInvoice (87 lines)
  Suggestion: Extract tax calculation (lines 34-58) and discount application (lines 60-79) into named helpers
```

### 5.3 TYPE CLARITY Rules (auto for obvious cases)

Apply when the type is unambiguous from context and the language supports type annotations.

| Rule | Trigger |
|------|---------|
| `missing-return-type` | Function has no return type annotation but return value is obvious from body |
| `missing-param-type` | Parameter has no type annotation but usage makes type clear |
| `replace-any` | `any` type used where a specific type is inferrable from usage |

**Example:**

```
TYPE CLARITY — replace-any (auto):
  BEFORE:
    function getUser(id: any): any {
      return db.users.findOne({ _id: id });
    }
  AFTER:
    function getUser(id: string): User | null {
      return db.users.findOne({ _id: id });
    }
```

### 5.4 Logging Format

```
For each rename, log:
  PASS3 | {file_path}:{line} | RENAME | "{old_name}" → "{new_name}" | {reason_code}

For each flag, log:
  PASS3 | {file_path}:{line} | FLAG | "{description}" | {reason_code}

For each type clarification, log:
  PASS3 | {file_path}:{line} | TYPE | "{old_signature}" → "{new_signature}" | {reason_code}

Examples:
  PASS3 | src/api/handler.ts:23 | RENAME | "data" → "requestPayload" | vague-variable
  PASS3 | src/services/billing.ts:10 | FLAG | "calculateInvoice has 87 lines — extract tax and discount sub-functions" | oversized-function
  PASS3 | src/utils/parse.ts:5 | TYPE | "parse(input: any)" → "parse(input: string)" | replace-any
```

---

## Section 6: Pass 4 — Consistency Normalization

Align code with project conventions detected in Section 2. This pass does not invent new conventions — it enforces what already exists in the majority of the codebase.

### 6.1 NORMALIZE Rules (auto-apply)

Apply when the detected convention is unambiguous (present in >70% of sampled files or explicitly stated in CLAUDE.md).

| Rule | Description |
|------|-------------|
| `import-ordering` | Reorder imports to match detected ordering convention (e.g., stdlib, third-party, local) |
| `import-style` | Normalize import syntax (named vs default) to match project majority |
| `naming-outlier` | Rename local symbols that violate the dominant naming convention (e.g., a `snake_case` variable in a `camelCase` codebase) |
| `error-handling` | Normalize error handling to match project pattern (e.g., convert bare try/catch to Result type if that is the project convention) |
| `string-style` | Normalize quote style to match project majority (single, double, or backtick-preferred) |
| `trailing-commas` | Add or remove trailing commas to match project style |
| `semicolons` | Add or remove semicolons to match project style |
| `file-structure` | Reorder top-level declarations to match detected file structure ordering |

**Detailed examples:**

```
NORMALIZE — import-ordering:
  Convention detected: stdlib → third-party → local (with blank line separators)
  BEFORE:
    import { UserService } from './services/user';
    import express from 'express';
    import { readFile } from 'fs';
  AFTER:
    import { readFile } from 'fs';

    import express from 'express';

    import { UserService } from './services/user';

NORMALIZE — naming-outlier:
  Convention detected: camelCase for variables
  BEFORE:
    const user_count = users.length;
    const activeUsers = users.filter(u => u.isActive);
  AFTER:
    const userCount = users.length;
    const activeUsers = users.filter(u => u.isActive);

NORMALIZE — error-handling:
  Convention detected: Result-type pattern (project uses { ok, error } returns)
  BEFORE:
    try {
      const user = await getUser(id);
      return user;
    } catch (e) {
      return null;
    }
  AFTER:
    const result = await getUser(id);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, data: result.data };
```

### 6.2 CONVENTION Rules (flag only — do not auto-apply)

These involve judgment calls where auto-applying could be wrong.

| Rule | Trigger | Why flag |
|------|---------|----------|
| `new-pattern` | File introduces a pattern not seen elsewhere in the project | New patterns may be intentional innovation, not drift |
| `ambiguous-split` | Convention detection found a ~50/50 split — no clear majority | Human must decide which convention wins |
| `readability-conflict` | Consistency would make code less readable in a specific case | Sometimes the outlier is more readable |

### 6.3 DO NOT Normalize

Do not touch these — they are the formatter's job, not the polisher's:

- Indentation (tabs vs spaces, indent width)
- Line length / wrapping
- Brace placement (same-line vs next-line)
- Whitespace around operators
- Blank line count between blocks
- Any rule already enforced by a project formatter (prettier, black, gofmt, rustfmt, etc.)
- Alternatives explicitly allowed in CLAUDE.md (e.g., "either single or double quotes is fine")

### 6.4 Logging Format

```
For each normalization, log:
  PASS4 | {file_path}:{line} | NORMALIZE | "{what_changed}" | {convention_source}

For each flagged convention, log:
  PASS4 | {file_path}:{line} | FLAG | "{description}" | {reason_code}

Examples:
  PASS4 | src/api/handler.ts:1-8 | NORMALIZE | "Reordered imports: stdlib → third-party → local" | detected
  PASS4 | src/utils/helpers.ts:15 | NORMALIZE | "Renamed user_count → userCount" | explicit (CLAUDE.md)
  PASS4 | src/services/new-pattern.ts:22 | FLAG | "Introduces Observer pattern not used elsewhere" | new-pattern
```

---

## Section 7: Safety Rails

Post-polish verification ensures no pass introduced behavioral regressions. Safety runs after all four passes complete.

### 7.1 Pre-Polish Setup

```
Step 1: Detect test command
  Check in order (use first match):
    1. package.json → scripts.test         → use "npm test"
    2. Cargo.toml exists                   → use "cargo test"
    3. pytest.ini or pyproject.toml [tool.pytest] → use "pytest"
    4. go.mod exists                       → use "go test ./..."
    5. Makefile contains "test:" target    → use "make test"
    6. settings.polish.test_command        → use configured value
    7. None detected                       → set test_command = null

Step 2: Detect type checker
  Check in order (use first match):
    1. tsconfig.json exists               → use "npx tsc --noEmit"
    2. mypy.ini or pyproject.toml [tool.mypy] → use "mypy ."
    3. Cargo.toml exists                  → use "cargo check"
    4. settings.polish.type_check_command  → use configured value
    5. None detected                      → set type_check_command = null

Step 3: Run pre-polish baseline
  If test_command is not null:
    Run test_command → store result as baseline_tests
    If baseline_tests FAIL:
      Log WARNING: "Tests already failing before polish — regressions cannot be isolated"
  If type_check_command is not null:
    Run type_check_command → store result as baseline_types
    If baseline_types FAIL:
      Log WARNING: "Type check already failing before polish — regressions cannot be isolated"
```

### 7.2 Apply All Passes

```
Run Pass 1 (Comment Cleanup)    → commit changes per file
Run Pass 2 (Code Simplification) → commit changes per file
Run Pass 3 (Readability Refactoring) → commit changes per file
Run Pass 4 (Consistency Normalization) → commit changes per file

Each pass tracks which files it modified, enabling per-file revert in 7.3/7.4.
```

### 7.3 Post-Polish Test Verification

```
If test_command is null:
  Log: "Safety: tests — NOT AVAILABLE (no test command detected)"
  Skip to Section 7.4

Run test_command → post_tests

If post_tests PASS:
  Log: "Safety: tests — PASS"
  Skip to Section 7.4

If post_tests FAIL AND baseline_tests also FAILED:
  Log: "Safety: tests — FAIL (pre-existing, not caused by polish)"
  Skip to Section 7.4

If post_tests FAIL AND baseline_tests PASSED:
  Log: "Safety: tests — REGRESSION DETECTED — isolating by file"
  Begin per-file isolation:
    all_modified_files = union of files modified across all 4 passes
    For each file in all_modified_files:
      Revert this file to pre-polish state
      Run test_command
      If tests PASS:
        Log: "Regression source: {file} — reverting polish for this file"
        Keep file reverted
        Break (re-test with remaining polished files)
      Else:
        Restore polish for this file (regression is elsewhere)
        Continue to next file
    After isolation loop:
      Run test_command one final time
      If PASS: Log: "Safety: tests — PASS (after reverting {N} files)"
      If FAIL: Log: "Safety: tests — FAIL (could not isolate — reverting all polish)"
              Revert all files to pre-polish state
```

### 7.4 Post-Polish Type Check

```
If type_check_command is null:
  Log: "Safety: type check — NOT AVAILABLE (no type checker detected)"
  Proceed to Section 8

Run type_check_command → post_types

If post_types PASS:
  Log: "Safety: type check — PASS"
  Proceed to Section 8

If post_types FAIL AND baseline_types also FAILED:
  Log: "Safety: type check — FAIL (pre-existing, not caused by polish)"
  Proceed to Section 8

If post_types FAIL AND baseline_types PASSED:
  Log: "Safety: type check — REGRESSION DETECTED — isolating by file"
  Run same per-file isolation logic as Section 7.3 but using type_check_command
  Proceed to Section 8
```

---

## Section 8: Artifact Output

Produces a structured POLISH.md report. Output location depends on integration mode.

### 8.1 Output Location

```
If invoked by review-loop (review-integrated mode):
  Append polish report to .planning/phases/phase-{N}-REVIEW.md under a "## Polish Pass" heading
If invoked standalone via /legion:polish:
  Print report to stdout (user-facing output)
  If --save flag provided, also write to .planning/phases/phase-{N}-POLISH.md
```

### 8.2 POLISH.md Format

```markdown
# Polish Report

## Stats

| Metric | Count |
|--------|-------|
| Files polished | {N} |
| Files skipped (excluded/capped) | {N} |
| Comments removed (Pass 1) | {N} |
| Lines simplified (Pass 2) | {N} |
| Symbols renamed (Pass 3) | {N} |
| Patterns normalized (Pass 4) | {N} |

## Pass 1: Comment Cleanup

| File | Line | Removed Text | Reason |
|------|------|-------------|--------|
| {path} | {line} | {text, 80 chars} | {reason_code} |

## Pass 2: Code Simplification

| File | Lines | Description | Reason |
|------|-------|-------------|--------|
| {path} | {start}-{end} | {description} | {reason_code} |

## Pass 3: Readability Refactoring

| File | Line | Change | Reason |
|------|------|--------|--------|
| {path} | {line} | {old} -> {new} | {reason_code} |

## Pass 4: Consistency Normalization

| File | Line | Change | Convention Source |
|------|------|--------|-----------------|
| {path} | {line} | {what_changed} | {explicit/detected/implicit} |

## Flagged for Review

Items requiring human judgment before applying. These were NOT auto-applied.

| Pass | File | Line(s) | Description | Rule |
|------|------|---------|-------------|------|
| 2 | {path} | {lines} | {description} | {reason_code} |
| 3 | {path} | {lines} | {description} | {reason_code} |
| 4 | {path} | {lines} | {description} | {reason_code} |

## Safety

| Check | Result |
|-------|--------|
| Tests | PASS / FAIL / FAIL (pre-existing) / NOT AVAILABLE |
| Type Check | PASS / FAIL / FAIL (pre-existing) / NOT AVAILABLE |
| Files reverted due to regression | {N} ({file_list or "none"}) |
```

---

## References

- Command entry point: `commands/polish.md`
- Review integration: `commands/review.md`
- Review loop skill: `skills/review-loop/SKILL.md`
- Agent personality: `agents/testing-code-polisher.md`
- Settings: `review.polish` (boolean, default: true) — enable/disable post-review polish step
- Settings: `review.polish_scope` (string, default: "dependents") — scope for review-integrated polish: "changed", "dependents", "directory"
