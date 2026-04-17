# Audit Findings — skills/github-sync/SKILL.md

**Audited in session:** S10
**Rubric version:** 1.0
**File layer:** skill
**File length:** 682 lines
**Total findings:** 4 (0 P0, 0 P1, 3 P2, 1 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-239 — P2, Race Condition in Issue Number Fallback (confirmed)

**Lines 125-128**

> Capture issue number:
>   Parse the URL returned by gh issue create — the last path segment is the issue number.
>   Example: https://github.com/user/repo/issues/42 → issue_number = 42
>   Fallback: gh issue list --label legion --state open --json number,title -q '.[0].number'

**Issue:** Primary+fallback pattern has race condition. If primary URL parsing fails (e.g., gh output format change, stderr contamination), the fallback queries `gh issue list --label legion --state open ... '.[0].number'` — which returns the FIRST open legion-labeled issue, not necessarily the one just created. In concurrent builds (parallel agents creating issues for different phases), this fallback returns the wrong issue number. Agent A creates Phase 3 issue, URL parse fails, fallback returns Phase 2 issue (first in list by creation order). The phase-to-issue link in STATE.md is now wrong. Downstream Section 2.4 checklist updates and Section 2.3 issue close will target the wrong issue.

**Remediation sketch:** (a) Make the fallback query specific: `gh issue list --label legion --state open --search "Phase {phase_number}:" --json number -q '.[0].number'` — search for the specific phase title. (b) Alternatively, capture both stdout and stderr separately: `issue_url=$(gh issue create ... 2>gh_err.tmp)` and only use fallback if stderr contains a known non-fatal warning (not a creation failure). (c) If fallback is used, emit `<escalation severity=info>` "Issue number resolved via fallback query — verify Phase {N} links to correct issue in STATE.md." Cross-reference LEGION-47-085 (dual ground truth pattern).

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-240 — P2, Inconsistent Silent/Suggest Messaging Policy (confirmed)

**Lines 489-495, 503-506**

> ### e1: gh CLI not installed
> ...
> Action: Skip all GitHub operations. No warning, no suggestion to install.
> Rationale: The user may be in an environment where gh cannot be installed.
>          Do not nag about optional tooling.
> ...
> ### e2: gh not authenticated
> ...
> Action: Skip all operations.
>   Suggest ONCE per session: "Run `gh auth login` to enable GitHub integration."
> Note: Only suggest ONCE — not on every skipped operation.

**Issue:** Inconsistent user experience between two closely-related error conditions. e1 (gh not installed) is fully silent per L493-495 "No warning, no suggestion to install" with rationale "Do not nag about optional tooling." e2 (gh not authenticated) suggests once per session per L505 "Suggest ONCE per session: 'Run `gh auth login`'". Both are "missing prerequisite" errors — user lacks GitHub CLI capability in both cases. The asymmetry is arbitrary: why is "install gh" nagging but "run gh auth login" helpful? Either both should be silent (consistent with L495 rationale) or both should suggest once (consistent with L505 approach). Current behavior: user with no gh sees nothing; user with gh but logged out gets a suggestion. The distinction is invisible to users who don't know which state they're in.

**Remediation sketch:** Align on ONE policy. Recommended: both silent (matches the L493-495 rationale and the Section 8 philosophy "never error, never block, never require GitHub for workflow completion"). Alternative: both suggest once, but change e1 to "GitHub CLI (`gh`) not found. Install from https://cli.github.com to enable GitHub integration." Document the chosen policy in Section 8 Graceful Degradation with explicit rationale.

**Remediation cluster:** `graceful-degradation`
**Effort estimate:** small

---

## LEGION-47-241 — P2, Placeholder Syntax in Conditional Flag (suspected)

**Lines 103-105**

> Command:
>   gh issue create \
>     --title "Phase {phase_number}: {phase_name}" \
>     --body "{ISSUE_BODY}" \
>     --label "legion" \
>     {--milestone "MILESTONE_TITLE" if a GitHub milestone exists for the current ROADMAP milestone}

**Issue:** L104 shows `{--milestone "MILESTONE_TITLE" if a GitHub milestone exists ...}` as a conditional inclusion pattern. This syntax is pseudo-code inside a fenced code block that 4.7 will treat as a shell command template. Three problems: (a) The brace-wrapped conditional is not valid shell or template syntax — 4.7 may interpret it literally as `{--milestone` followed by the rest. (b) `MILESTONE_TITLE` is a placeholder but inconsistent with other placeholders in the same block (`{phase_number}`, `{phase_name}`, `{ISSUE_BODY}`) which use lowercase with underscores. (c) The "if" clause is prose embedded in code — 4.7 cannot parse prose conditions. L130 explains the condition in prose, but the code block itself is malformed.

**Remediation sketch:** Rewrite as two code blocks with prose selector: (a) "When a GitHub milestone exists for this phase:" followed by the full command WITH `--milestone "{milestone_name}"`. (b) "When no GitHub milestone exists:" followed by the command WITHOUT the flag. Alternatively, use a shell-valid pattern: show the flag separately with a comment `# Include only if milestone exists: --milestone "{milestone_name}"` outside the main command block. Cross-reference LEGION-47-019 (conditional inclusion syntax).

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** small

---

## LEGION-47-242 — P3, Output Format Dependency (suspected)

**Lines 125-128, 254-256**

> Parse the URL returned by gh issue create — the last path segment is the issue number.
> Example: https://github.com/user/repo/issues/42 → issue_number = 42
> ...
> Parse from the gh pr create output URL.
> Example: https://github.com/user/repo/pull/15 → pr_number = 15

**Issue:** Both issue and PR number extraction rely on parsing the URL format returned by `gh issue create` and `gh pr create`. This assumes GitHub's URL structure (`/issues/{N}`, `/pull/{N}`) and gh CLI's output format (returning URL to stdout) remain stable. While unlikely to change, this is an external dependency with no in-skill validation. If gh changes its output format (e.g., returns JSON, or adds a prefix), the regex/parse fails silently. The fallback in L127 mitigates for issues but not for PRs (no PR fallback documented).

**Remediation sketch:** (a) Add PR fallback similar to issue fallback: `gh pr list --head {branch} --json number -q '.[0].number'` to find PR by branch name. (b) Document the assumption: "Parsing assumes gh CLI returns a GitHub URL to stdout. If gh output format changes, update the parsing logic or use `gh issue view --json number` after creation." (c) Add defensive regex with format check: if parsed URL doesn't match `^https://github.com/.+/(issues|pull)/\d+$`, emit warning and use fallback.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---
