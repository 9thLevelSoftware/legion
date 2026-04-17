# Audit Findings — skills/hooks-integration/SKILL.md

**Audited in session:** S10
**Rubric version:** 1.0
**File layer:** skill
**File length:** 160 lines
**Total findings:** 4 (0 P0, 1 P1, 3 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-243 — P1, Unverified Environment Variable (confirmed)

**Lines 96-98**

> "command": "node -e \"const cmd=process.env.CLAUDE_TOOL_INPUT||''; if(cmd.includes('gh pr create')){const r=require('child_process').execSync('npm audit --audit-level=critical 2>/dev/null',{encoding:'utf8',stdio:'pipe'}); if(r.includes('critical')){console.error('CRITICAL vulnerabilities found. Run npm audit fix before shipping.'); process.exit(1)}}\"",

**Issue:** The hook relies on `process.env.CLAUDE_TOOL_INPUT` to detect when a Bash call contains `gh pr create`. This environment variable is NOT documented in Claude Code's hooks specification. Claude Code hooks receive context via different mechanisms: (a) PreToolUse hooks receive tool name and parameters via `matcher` filtering, not env vars. (b) The `command` field runs in a shell subprocess — it does not automatically receive tool input as an environment variable. If `CLAUDE_TOOL_INPUT` is undefined (highly likely), `process.env.CLAUDE_TOOL_INPUT||''` returns empty string, `''.includes('gh pr create')` returns false, and the entire security gate NEVER TRIGGERS. This makes the documented "Pre-Ship Security Gate" dead code — it appears to exist but provides zero protection. Users who configure this hook believe they have a security gate when they do not.

**Remediation sketch:** (a) Verify Claude Code hooks API: check if any env var or stdin mechanism exposes tool input to hook commands. If not, this hook pattern is fundamentally broken. (b) Alternative implementation: instead of filtering on tool input, use a PostToolUse hook that runs `npm audit` unconditionally after every Bash call, with a flag file to track whether audit has run this session. (c) Alternative: abandon the "gate before PR" pattern and document that security scans should be run explicitly via `/legion:ship` security-review skill integration, not via hooks. (d) If the hook pattern cannot work, DELETE this section — a documented-but-broken security feature is worse than no feature. (e) Cross-reference Claude Code hooks documentation and update Section 2.3 with actually-supported patterns. This is a P1 because it creates false security confidence.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** medium

---

## LEGION-47-244 — P2, Technology Stack Assumption (confirmed)

**Lines 96-98**

> const r=require('child_process').execSync('npm audit --audit-level=critical 2>/dev/null'

**Issue:** The security gate runs `npm audit` unconditionally, assuming the project is a Node.js project with a `package.json`. For non-Node projects (Python/pip, Go/mod, Rust/cargo, Ruby/bundler, etc.), `npm audit` fails silently (`2>/dev/null` suppresses errors) and the gate always passes — no security check occurs. The skill is documented as "Legion hooks" (generic) but the implementation is Node.js-specific. (a) Python projects with known vulnerabilities in requirements.txt: no check. (b) Go projects with vulnerable dependencies in go.mod: no check. (c) Polyglot projects: only Node deps checked.

**Remediation sketch:** (a) Detect project type before running audit: `test -f package.json && npm audit ...`, `test -f requirements.txt && pip-audit ...`, `test -f go.mod && govulncheck ...`. (b) Document the limitation: "This hook currently supports Node.js projects only. For other stacks, configure stack-specific audit commands." (c) Add a stack-detection preamble: check for package.json, requirements.txt, go.mod, Cargo.toml, Gemfile and run the appropriate audit tool. (d) If no recognized project file: skip silently (no project to audit). Cross-reference security-review skill which has stack-agnostic OWASP scanning.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** medium

---

## LEGION-47-245 — P2, Loose State Validation Pattern (confirmed)

**Lines 42-44**

> "command": "node -e \"const fs=require('fs'); const p='.planning/STATE.md'; if(!fs.existsSync(p)){process.exit(0)} const s=fs.readFileSync(p,'utf8'); if(!s.includes('Current')){console.error('STATE.md malformed'); process.exit(1)}\"",

**Issue:** STATE.md validation checks `s.includes('Current')` — any occurrence of the substring "Current" anywhere in the file passes validation. False positives: (a) Phase name "Improve Current Architecture" contains "Current" — passes even if structure is wrong. (b) Comment "# TODO: fix Current state tracking" — passes. (c) Any mention of "Current" in prose — passes. False negatives: (d) STATE.md with "## current phase" (lowercase) — fails incorrectly. The check is too loose to validate STATE.md structure. Per workflow-common.md, STATE.md has a specific format with `## Current Phase` heading — the validation should check for that exact structure.

**Remediation sketch:** (a) Use line-anchored regex: `if(!/^## Current Phase/m.test(s))` to require the exact heading at line start. (b) Better: validate multiple required headings: `['## Current Phase', '## Phase History', '## Next Action'].every(h => s.includes(h))`. (c) Best: call the actual validate command from /legion:validate rather than reimplementing partial validation in a one-liner. (d) Document validation scope: "This hook performs lightweight structural check, not full schema validation. Run /legion:validate for comprehensive checks."

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-246 — P2, Undefined Timeout Behavior (suspected)

**Lines 127-128**

> - Hooks run synchronously — keep commands fast (under 2 seconds)

**Issue:** The skill advises "keep commands fast (under 2 seconds)" but does not document what happens if a hook exceeds this threshold. (a) Does Claude Code enforce a timeout? If so, what is it? (b) If no timeout, a slow hook (e.g., `npm audit` on a large project, network latency) blocks the entire Claude Code session. (c) The L97 security gate runs `npm audit` which can take 5-30 seconds on large projects with many dependencies — violating the "under 2 seconds" guidance in the same skill. (d) Users following this skill may configure hooks that hang Claude Code. No defensive guidance for slow commands.

**Remediation sketch:** (a) Research and document Claude Code's actual hook timeout behavior. If there is a hard timeout, state it. If there is no timeout, warn users. (b) Add timeout wrapper to slow commands: `timeout 5s npm audit ... || echo 'Audit timed out, skipping'`. (c) Flag the Section 2.3 security gate as potentially slow: "Note: npm audit may exceed 2 seconds on large projects. Consider running security scans via /legion:ship instead of hooks for comprehensive but slower analysis." (d) Add a "Slow Hook Mitigation" subsection with patterns for background execution if supported.

**Remediation cluster:** `graceful-degradation`
**Effort estimate:** small

---
