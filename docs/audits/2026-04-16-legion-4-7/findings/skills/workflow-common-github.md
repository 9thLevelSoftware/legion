# Audit Findings — skills/workflow-common-github/SKILL.md

**Audited in session:** S06
**Rubric version:** 1.0
**File layer:** skill
**File length:** 18 lines
**Total findings:** 2 (2 P2)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-097 — P2, CAT-6 Implicit Preconditions (suspected)

**Lines 13-17**

> ## Rules
> - Treat GitHub as optional integration; never fail core workflow if unavailable.
> - Require both: `gh auth status` success and a valid git remote.
> - Prefer idempotent updates (comment/edit) over duplicate issue creation.
> - Always reflect GitHub updates in local state files when relevant.

**Issue:** Rule 2 ("Require both: `gh auth status` success and a valid git remote") is the precondition gate, but it is underspecified relative to the extensive GitHub precondition protocol documented in `workflow-common/SKILL.md` lines 649-655 (which additionally requires `which gh` passing and `git remote get-url origin` returning a GitHub-hosted remote). A 4.7 reader loading only this extension skill (the intended usage per `/legion:plan`, `/legion:build`, `/legion:status` conditional-load tables in workflow-common-core) misses the `which gh` check and the GitHub-host verification — `git remote get-url origin` passes for any remote, including GitLab or Bitbucket. The result is attempted `gh` calls against non-GitHub remotes, which silently fail with confusing errors.

**Remediation sketch:** Expand rule 2 to match the parent skill's three-part check: `which gh` AND `gh auth status` AND remote URL matches `github.com` or `ghe.<org>` hostname. Prefer a single cited source — reference `github-sync` skill Section 1 as the canonical precondition verifier and do not duplicate here.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-098 — P2, CAT-2 Ambiguous Triggers (suspected)

**Line 17**

> - Always reflect GitHub updates in local state files when relevant.

**Issue:** "when relevant" is a textbook CAT-2 ambiguous trigger from the rubric's detection examples. No enumeration of relevance criteria. Which state files? Which GitHub events qualify? Does closing a PR count? Does a comment count? 4.7 either (a) updates state on every GitHub call (noisy, may corrupt state), or (b) never updates (defeats the rule). No escalation path if the local state is read-only (e.g., during dry-run mode).

**Remediation sketch:** Replace with explicit rule: "After any GitHub write operation (create issue, update issue, create PR, close PR, close milestone), mirror the operation's result into `.planning/STATE.md` under `## GitHub` section within the same command invocation. Read-only operations (list issues, read PR) do NOT trigger state updates."

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---
