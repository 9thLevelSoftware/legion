# Review Guide

This document defines how every pull request to this repository is reviewed. It
is the source of truth for review expectations; review agents and humans
should follow it on every PR, with no exceptions.

The goal is to keep the codebase correct, secure, maintainable, and as small as
possible. Prefer the laziest solution that actually works: fewer files, fewer
dependencies, fewer abstractions, fewer branches, fewer concepts.

## Review order

Every PR review follows this order. Do not skip steps.

### 1. Understand intent

Read the title, description, linked issue, and changed files. Identify what
behavior is supposed to change. Do not propose simplifications before the real
requirement is clear.

### 2. Correctness and safety first

Look for bugs, broken edge cases, security issues, data-loss risks, race
conditions, missing validation, bad error handling, broken tests, and
regressions. Correctness findings block the PR; the Ponytail pass below must
not remove necessary safety, validation, accessibility, observability, tests,
or explicit user-requested behavior.

### 3. Ponytail pass

After correctness is satisfied, run a dedicated Ponytail pass over the diff.
The Ponytail pass is mandatory on every PR, even when the only conclusion is
"Ponytail: Lean already. Ship."

Optimize for deletion. Search the diff specifically for unnecessary
complexity:

- Prefer deletion over addition.
- Prefer the language standard library over hand-rolled logic.
- Prefer platform or native framework features over new dependencies.
- Prefer existing project patterns over new abstractions.
- Prefer one direct implementation over factories, registries, service
  layers, interfaces, adapters, or config that has only one use.
- Challenge speculative future-proofing.
- Flag code that exists "just in case."
- Flag abstractions with only one implementation.
- Flag wrappers around simple APIs.
- Flag dependencies used for trivial behavior.
- Flag duplicated helpers that the language, framework, or repo already
  provides.
- Flag generated boilerplate or broad scaffolding that the PR does not
  require.
- Flag tests that mostly test mocks, framework behavior, or implementation
  details rather than useful behavior.
- Flag documentation or comments that explain obvious code or defend
  unnecessary complexity.

### Ponytail tags

Use these tags in Ponytail findings:

| Tag           | Meaning                                                       |
|---------------|---------------------------------------------------------------|
| `delete`      | Dead code, unused flexibility, speculative feature, unnecessary branch, unused config, or scaffolding. |
| `stdlib`      | Hand-rolled logic that the language standard library already provides. |
| `native`      | Dependency or custom code doing what the platform or framework already does. |
| `yagni`       | Abstraction, config, or extension point with no current need. |
| `shrink`      | Same behavior expressible with materially less code.          |
| `reuse`       | New helper duplicates an existing project helper or pattern.  |
| `test-shrink` | Test can be simpler while preserving meaningful coverage.     |

If there are no Ponytail findings, the section must still appear and state
exactly:

> Ponytail: Lean already. Ship.

Do not invent Ponytail findings. If the code is already simple, say so.

### Important boundaries for the Ponytail pass

Do not suggest removing:

- Required input validation.
- Security checks.
- Error handling that prevents data loss or silent failure.
- Accessibility basics.
- Tests that protect non-trivial behavior.
- Logging or metrics that are operationally necessary.
- Behavior that the PR or linked issue explicitly requires.

Do not replace readable code with a clever one-liner when the readable version
prevents mistakes. Do not block a PR solely because the code could be shorter.
Only block on correctness, security, data-loss, or maintainability risk.

## Review output format

Return every review in this structure.

### Verdict

Exactly one of:

- **Approve**
- **Request changes**
- **Comment only**

Followed by one short sentence explaining why.

### Correctness / Safety Findings

List only real correctness, safety, security, regression, or test issues.
Format each finding as:

```
<severity>: <file>:L<line>: <issue>. <required fix>.
```

Severities:

- **critical** — bug, security, or data-loss risk; must fix before merge.
- **important** — likely defect or maintainability hazard; should fix before merge.
- **minor** — small issue, typo, naming, or clarity problem.

If there are no findings, say:

> No correctness or safety findings.

### Ponytail Review

Always include this section. List Ponytail findings using exactly:

```
<file>:L<line>: <tag> <what to cut>. <what replaces it>.
```

If there are no findings, say:

> Ponytail: Lean already. Ship.

End the Ponytail section with:

> Ponytail net: -<estimated removable lines> lines.

If no lines are removable:

> Ponytail net: 0 lines.

### Suggested Minimal Patch

If there are actionable findings, describe the smallest safe patch set.
Prefer the fewest files changed, prefer deleting code, do not introduce new
dependencies, and do not propose a broad refactor when a local fix solves the
issue. Keep this section short.

If no patch is needed, say:

> No patch needed.

### Final Merge Guidance

State clearly whether the PR can merge, for example:

- Can merge after the critical finding is fixed.
- Can merge; Ponytail suggestions are optional cleanup.
- Do not merge until tests cover the changed behavior.
- Can merge as-is.

## Behavioral rules

- Be direct and specific. Do not write long essays.
- Do not praise boilerplate.
- Do not ask the author to "consider" vague changes.
- Every finding must identify exactly what should change.
- Mark optional simplifications as optional. Only require a simplification
  when the complexity creates real risk; explain that risk in one sentence.
- Never trust a tool, test, or CI self-report if the diff itself contradicts it.
- Prefer the smallest root-cause fix over patches scattered across callers.

## Mandatory per-PR checklist

Before posting a review, confirm every box:

- Did I review correctness and security first?
- Did I run a separate Ponytail pass?
- Did I look for code to delete?
- Did I look for stdlib and native replacements?
- Did I look for one-implementation interfaces, factories, or adapters?
- Did I look for speculative config or extensibility?
- Did I avoid removing required validation, security, or tests?
- Did I include either Ponytail findings or "Ponytail: Lean already. Ship."?
