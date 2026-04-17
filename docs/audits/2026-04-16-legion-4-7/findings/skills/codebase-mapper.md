# Audit Findings — skills/codebase-mapper/SKILL.md

**Audited in session:** S09
**Rubric version:** 1.0
**File layer:** skill
**File length:** 1899 lines
**Total findings:** 6 (6 P2)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-206 — P2, CAT-2 Ambiguous Triggers (suspected)

**Lines 53-68**

> 1. Any source files outside .planning/ and .claude/?
>    Glob("*.{ts,js,py,rb,go,rs,java,swift,kt,c,cpp,cs}")
>    Glob("src/**", "app/**", "lib/**", "components/**")
> ...
> **Decision logic:**
> - If ANY of the above are found: existing codebase detected. Proceed to AskUserQuestion.
> - If NONE found: pure greenfield. Skip brownfield flow silently.
> - If ONLY .md files found: content project, not a codebase. Skip brownfield flow silently.

**Issue:** Three triggers with three-state decision logic, but the state classification is ambiguous: (a) L55 top-level Glob includes 12 extensions — the list is closed but excludes Dart, Elixir, Erlang, Haskell, OCaml, PHP (though Ruby is present), Scala, Clojure, Zig, Nim. A Zig project falls into state 2 "pure greenfield" even though it has source code. (b) L68 "If ONLY .md files found: content project, not a codebase" — but what if a project has .md files AND a single package.json (case from L58)? State 2 conditions fire (manifest present), not state 3. Decision ambiguity: "ONLY .md files" doesn't distinguish "only .md source + manifests" from "only .md". (c) L44 "Can be re-triggered manually if the codebase has changed significantly" — "significantly" is unenumerated.

**Remediation sketch:** (a) Expand or parameterize the extension list; move to `.planning/config/codebase-extensions.yaml` as the single authoritative source. Default list stays in this file but marked "extend via config". (b) Resolve state precedence: "Order: first check for .md-only (state 3), then check for manifests (state 2), then check for source files (state 1). Last matched wins the state." Document which state takes priority on overlap. (c) L44 replace "changed significantly" with explicit triggers: "re-analysis offered when (a) >50 files added since last analysis, (b) any new manifest (package.json, go.mod, etc.) introduced, (c) primary language shift detected (>20% file count change by extension), OR (d) user explicitly runs /legion:quick analyze codebase."

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---

## LEGION-47-207 — P2, CAT-6 Implicit Preconditions (confirmed)

**Lines 539-569**

> ```bash
> npm ls --all --json 2>/dev/null | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); const count=(o)=>o.dependencies?Object.keys(o.dependencies).reduce((s,k)=>s+1+count(o.dependencies[k]),0):0; console.log(count(d))"
> ```
> ...
> For each direct dependency in package.json:
>   Run: npm view {package} time --json 2>/dev/null
>   Extract the "modified" timestamp (last publish date)

**Issue:** L539-540 requires both `node` and `npm` binaries present AND project dependencies already installed (`npm ls` with `--all` fails on missing `node_modules`). The embedded node one-liner uses `require('fs').readFileSync(0,'utf8')` — file descriptor 0 is stdin, which works cross-platform, but requires `node --experimental-something` disabled (it is by default, so ok) AND the CommonJS `require()` — will fail on Node.js projects where `"type": "module"` is set in package.json unless `.cjs` extension is used (stdin execution bypasses this but creates confusion). L556-562 `npm view {package} time --json` requires network access and npm-registry connectivity. The `2>/dev/null` silently swallows all failures — the skill cannot distinguish "npm not installed" from "network down" from "package doesn't exist in registry" from "project has no dependencies". All four failure modes produce the same "command failed" output, leading to downstream "unmaintained: unknown" entries.

**Remediation sketch:** (a) Add precondition-check step before L539: "Verify `command -v node && command -v npm && [ -d node_modules ]` — if any missing, skip 4.6.3 and report exact missing precondition in CODEBASE.md under 'Dependency analysis skipped: {reason}'." (b) Replace `2>/dev/null` with explicit error classification: capture stderr, check for "ENOENT" (binary missing) / "ENOTFOUND" (network) / "ELSPROBLEMS" (dependency integrity) / etc. Report skip reason precisely per failure class. (c) L558 `npm view` network dependency: add "Network required" precondition check via `npm ping`. If offline, fall back to L565 "Alternative (no network)" which is correctly specified. (d) Cross-reference LEGION-47-163 precondition-verification cluster.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-208 — P2, CAT-3 Underspecified Dispatch (suspected)

**Lines 7-11, 950-962**

> summary: "Comprehensive codebase analysis producing structured CODEBASE.md. Maps architecture, frameworks, patterns, risks, dependency graphs, test coverage, API surface, config/environment, and pattern library. Supports monorepo detection and standalone re-analysis. Consumed by /start, /plan, /build, /review, and /status."
> ...
> Step 4: Execute analysis
>   Run Section 2 (Map Generation), Section 3 (Pattern Detection),
>   Section 4 (Risk Assessment), Section 4.6 (Package-Level Dependency Risk) in sequence.
>   If Sections 8-14 are available in this SKILL.md, also run:
>   - Section 8 (Dependency Graph)
>   - Section 9 (Test Coverage Map)
>   - Section 9.4 (Coverage Tool Integration)
>   - Section 9.5 (Critical File Coverage Correlation)
>   - Section 10 (API Surface Detection)
>   - Section 11 (Config & Environment Surface)
>   - Section 13 (Pattern Library Extraction)
>   - Section 14 (Monorepo Support) — only if monorepo detected in Section 2.4

**Issue:** 12+ independent analyses (Sections 2, 3, 4, 4.6, 8, 9, 9.4, 9.5, 10, 11, 13, 14) dispatched "in sequence" with no justification for serial execution. Many of these are independent (Framework Detection in Section 3 reads different files than Risk Assessment in Section 4 — no shared writes); they are prime parallel-dispatch candidates. Additionally: (a) No model_tier specified; standalone re-analysis runs under whatever default the caller sets. (b) No fan-out count or parallel-safety claim. (c) No guidance on what to do if partial analysis: if Section 5 (CODEBASE.md Format) writes happen and Section 8 fails mid-way, CODEBASE.md is in inconsistent state. Peer dispatch-specification cluster (LEGION-47-101, 102, 112, 125, 128, 141, 155, 180).

**Remediation sketch:** (a) Group sections by dependency: "Independent (parallel-safe): Section 2, Section 3, Section 4, Section 11. Dependent on Section 3 output: Section 4.6, Section 10. Dependent on Section 8 output: Section 9.5, Section 12. Must run last: Section 5 (format aggregation), Section 15 (YAML generation)." (b) Add dispatch block: "If adapter.parallel_execution: spawn the independent group as a single parallel call. Otherwise: run serially in declared order." (c) Add model_tier: `model_tier: model_execution` for analysis steps; `model_tier: model_check` for simple file-presence checks. (d) Add atomic-write rule for Section 5: "Write CODEBASE.md to a tempfile first, then atomic rename on successful completion of all selected sections. If any section failed: append '## Partial Analysis' section to CODEBASE.md with list of failed sections." Cross-reference LEGION-47-180 and wave-executor parallel contract.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** medium

---

## LEGION-47-209 — P2, CAT-8 Unstated Acceptance Criteria (suspected)

**Lines 1785-1839**

> updateMappings(changes, currentMappings, significance):
>   Step 1: Create backup
>     backupPath = `.planning/config/directory-mappings-backup-{timestamp}.yaml`
>     copy(currentMappings, backupPath)
>   ...
>   Step 5: Report updates
>     return {
>       updated: true,
>       backupPath: backupPath,
>       changes: changes,
>       significance: significance
>     }

**Issue:** Section 16 "Auto-Update Protocol" defines change detection + significance assessment + update application, but has no acceptance-criteria / state-transition spec for when auto-update is "complete": (a) What happens when the returned object's `updated: true` is consumed by the caller? (b) Is the user notified via AskUserQuestion (with the `mode: prompt` setting L1890), and if so under what closure? (c) L1885-1898 autoUpdate config has three modes — prompt, auto, disabled — but L1850 "Post-execution: After wave completion — Auto-detect if enabled" doesn't state what happens when mode=prompt and the user says no: does the skill re-prompt next run, mark as "user-rejected", or silently accept the stale state? (d) No rollback path if `updateMappings` Step 4 (write) succeeds but downstream consumer fails to read the new file — the backup exists but no procedure uses it. Exit-condition state-partition cluster peer LEGION-47-054, 151, 161, 196, 202.

**Remediation sketch:** (a) Add acceptance criteria block to Section 16: "Auto-update is complete when one of: (1) changes applied + YAML written + backup created + user notified (mode=auto); (2) changes applied + YAML written + backup created (mode=prompt, user approved); (3) changes detected + user declined + 'user_declined_update' marker written to .planning/config/directory-mappings.yaml under `autoUpdate.lastDeclined` with timestamp (mode=prompt, user declined); (4) mode=disabled — changes detected but no YAML write; log at INFO." (b) Add rollback procedure: "If a downstream consumer (next /legion:plan run) fails to parse updated directory-mappings.yaml: auto-restore from the latest backup and emit <escalation severity: warning, type: infrastructure>." (c) Define user re-prompt cadence for mode=prompt after decline. Cross-reference LEGION-47-202 acceptance-criteria cluster.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-210 — P2, CAT-5 Prohibitive Over-Reliance (suspected)

**Lines 79-84, 887-899**

> ### Graceful Degradation
> - If CODEBASE.md does not exist: all consumers skip brownfield context silently
> - If CODEBASE.md is stale (>30 days): consumers warn but do not block
> - Never error, never block, never require brownfield analysis for workflow completion
> - All workflows function identically to their pre-brownfield behavior when CODEBASE.md is absent
> ...
> 1. Check if .planning/CODEBASE.md exists
> 2. If yes: use codebase data to enrich the operation
> 3. If no: skip silently, proceed with default behavior
> 4. Never error on missing CODEBASE.md
> 5. Never block workflow completion on CODEBASE.md
> 6. Never require brownfield analysis for any operation
> 7. Never auto-trigger analysis without user consent

**Issue:** Two "Never ..." clusters: L82 "Never error, never block, never require" (3 Nevers in one line), and L896-899 "Never error / Never block / Never require / Never auto-trigger" (4 Nevers, each a separate bullet). 4.7 reading 7 "Never" instructions in close proximity for a single skill may adopt an over-defensive posture — refusing to surface any CODEBASE.md-related warning even when genuinely helpful (e.g., a >180-day stale CODEBASE.md with detected structural changes is worth warning about with elevated prominence, but L82 "never block" + L897 "Never require" conflict with any elevated signal). CAT-5 pattern: cluster of prohibitive convertible to positive framing.

**Remediation sketch:** (a) L82 replace "Never error, never block, never require brownfield analysis for workflow completion" with positive statement: "Workflow completion is independent of brownfield analysis. Missing or stale CODEBASE.md surfaces as an advisory in /legion:status but does not change command exit status." (b) L896-899 replace the four "Never" bullets with: "Caller contract: (1) Check if CODEBASE.md exists before referencing it. (2) If absent, proceed with greenfield behavior silently. (3) Surface stale-CODEBASE.md only when user-visible (status, advise); other commands degrade silently. (4) Auto-analysis requires explicit user opt-in via AskUserQuestion; no background triggering." (c) Keep the intent (optional integration, graceful degradation) but state it declaratively. Cross-reference LEGION-47-166 prohibitive-to-positive cluster.

**Remediation cluster:** `prohibitive-to-positive`
**Effort estimate:** small

---

## LEGION-47-211 — P2, CAT-10 Authority Ambiguity (suspected)

**Lines 1607-1664, 1883-1898**

> ## Section 15: Machine-Readable Mappings Output (ENV-01)
> In addition to the human-readable CODEBASE.md, generate a machine-readable
> YAML file for programmatic access: `.planning/config/directory-mappings.yaml`
> ...
> Step 3: Write to .planning/config/directory-mappings.yaml
> ...
> autoUpdate:
>   enabled: true              # Enable/disable auto-detection
>   mode: "prompt"             # prompt | auto | disabled
> ...
>   backup:
>     enabled: true
>     keepCount: 5             # Number of backups to retain

**Issue:** Two authority-boundary defects: (a) Section 15 writes to `.planning/config/directory-mappings.yaml` — `config/` is a privileged path containing user-editable settings (intent-teams.yaml, escalation-protocol.yaml, control-modes.yaml, authority-matrix.yaml all live there per S02c/S08). Writing a config file automatically, without authority-enforcer opt-in, blurs the boundary between user-managed config and auto-generated state. Compare to MEETING.md / OUTCOMES.md which are state, not config. (b) L1890 `mode: "auto"` enables silent auto-write of a config file without user consent — this contradicts L898 "Never auto-trigger analysis without user consent" in the caller contract; auto-update of the mapping file IS an auto-trigger of analysis output. (c) No cross-reference to authority-matrix system-paths carve-out (LEGION-47-176); the file is neither declared as state (exempt path) nor config (user-owned).

**Remediation sketch:** (a) Move `.planning/config/directory-mappings.yaml` to `.planning/state/directory-mappings.yaml` (or similar non-config path) to disambiguate auto-generated artifact from user-edited config. Update Section 15 path and all consumers. (b) If the `config/` path is preserved: declare it explicitly in authority-matrix.yaml system_paths_exempt_from_scope AND require `mode: "auto"` to be disabled by default; L1889 change `enabled: true` to `enabled: false`. (c) L1890 `mode: "auto"` — gate behind an explicit user opt-in during /legion:start ("Do you want directory-mappings.yaml to auto-update when structure changes? [Yes, prompt each time / Yes, auto-update silently / No, manual re-analysis only]"). (d) Cross-reference LEGION-47-146, 176, 203 authority-language cluster.

**Remediation cluster:** `authority-language`
**Effort estimate:** medium

---
