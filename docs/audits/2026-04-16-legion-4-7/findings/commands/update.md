# Audit Findings — commands/update.md

**Audited in session:** S05
**Rubric version:** 1.0
**File layer:** command
**File length:** 100 lines
**Total findings:** 5 (0 P0, 0 P1, 5 P2)
**Baseline commit:** audit-v47-baseline

**Note on ID continuity:** IDs LEGION-47-076, 077, 078 were claimed during an S05-interlude session (cross-cutting model-tier configuration discovery) before this file was audited. update.md findings therefore begin at LEGION-47-079 to preserve the interlude record.

---

## LEGION-47-079 — P2, Unstated Acceptance Criteria (confirmed)

**Lines 59-63**

> 4. COMPARE VERSIONS
>    - If INSTALLED_VERSION == LATEST_VERSION:
>      Display: "Legion is up to date (v{INSTALLED_VERSION})."
>      Stop.
>    - Display: "Update available: v{INSTALLED_VERSION} -> v{LATEST_VERSION}"

**Issue:** String equality comparison on version strings is silently wrong for semver. Under lexicographic comparison, "1.0.10" < "1.0.2" and "2.0.0" > "10.0.0". Under 4.7 literalism the agent will implement `==` as string compare (the most literal interpretation of the pseudocode), which means the "up to date" branch fires for the wrong pairs in routine upgrade scenarios. Also: no explicit ordering check — if INSTALLED_VERSION > LATEST_VERSION (local install is ahead of npm, e.g., dev build), the code falls through to "Update available" and prompts the user to downgrade. No acceptance criterion that says "only prompt when LATEST is strictly newer than INSTALLED, per semver precedence."

**Remediation sketch:** Replace with explicit semver compare: "Compare INSTALLED_VERSION and LATEST_VERSION as semantic versions (major.minor.patch, with optional prerelease). Rules: (a) if INSTALLED == LATEST (semver-equal): display 'Legion is up to date (v{INSTALLED_VERSION}).' and stop. (b) if INSTALLED > LATEST (semver-greater): display 'Legion is ahead of npm (local v{INSTALLED}, npm v{LATEST}). No update available.' and stop — do not prompt downgrade. (c) if INSTALLED < LATEST: display 'Update available: v{INSTALLED} → v{LATEST}' and proceed. Use `npx semver` or parse the strings numerically per field — do not use string equality."

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-080 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 76-84**

> 5. CONFIRM AND INSTALL
>    - Use adapter.ask_user to confirm:
>      "Update Legion from v{INSTALLED_VERSION} to v{LATEST_VERSION}?"
>      - Option 1: "Yes, update now"
>      - Option 2: "No, skip this update"
>    - If user confirms:
>      Run: Bash  npx @9thlevelsoftware/legion@latest {runtime_flag} --{INSTALL_SCOPE}
>      Display the installer output
>    - Remind user to restart their CLI to pick up updated commands

**Issue:** 2-option confirmation gate for a destructive side effect (npx install overwrites the Legion installation). The yes/no framing is less risky than multi-option menus but still lacks closure language. Under 4.7 literalism the agent may interpolate a third option like "Yes, but only the commands not the agents" or "Download without installing" — both unsupported by the installer. Also the "Remind user to restart their CLI" happens regardless of user choice (L84 is a sibling of both options, not nested under "If user confirms") — the literal reading prints the restart reminder even on "No, skip this update." Peer of LEGION-47-058/064/065 closed-set-enforcement cluster.

**Remediation sketch:** Wrap in AskUserQuestion. Rewrite stem: "Update Legion from v{INSTALLED_VERSION} to v{LATEST_VERSION}? Choose exactly one of two actions." Option A: "Update now — run the installer (overwrites current installation)." Option B: "Skip this update — no changes." Closure: "Do not propose partial updates. Do not propose alternate install sources." Also move L84 ("Remind user to restart their CLI") inside the Option A branch — it is an install-completion message, not a universal suffix.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** small

---

## LEGION-47-081 — P2, Implicit Preconditions (confirmed)

**Lines 36-50**

> 2. READ INSTALLED VERSION
>    - Determine install scope and manifest location:
>      - First check for a local install in the current project:
>        - Claude Code: `.claude/legion/manifest.json`
>        - All others: `.legion/manifest.json`
>      - If no local manifest exists, fall back to the global install path:
>        - Claude Code: `~/.claude/legion/manifest.json`
>        - All others: `~/.legion/manifest.json`
>    - Store the winning scope as INSTALL_SCOPE (`local` or `global`)
>    - Run: Bash  cat "{MANIFEST_PATH}" 2>/dev/null
>    - If file not found or empty:
>      Display: "Legion is not installed. Run: npx @9thlevelsoftware/legion {runtime_flag}"
>      Stop.
>    - Parse the JSON and extract the "version" field
>    - Store as INSTALLED_VERSION

**Issue:** Three underspecified preconditions. (1) "All others: `.legion/manifest.json`" — the "all others" pattern is the fallback install layout per the update.md repo contract, but start.md L65 and codebase-mapper exclude `.legion/` from brownfield detection with no mention — drift risk. (2) No JSON validation — `cat | parse JSON | extract version`: if the manifest is valid JSON but has no `version` field, or if `version` is null/non-string, behavior is undefined. 4.7 will likely proceed with INSTALLED_VERSION=null, cascading to L60 string compare `null == LATEST_VERSION` (always false), triggering an unnecessary update. (3) Concurrent-install ambiguity: if both a local `.claude/legion/manifest.json` AND a global `~/.claude/legion/manifest.json` exist with different versions, only local is read — but update then runs `--local` and the global install drifts silently.

**Remediation sketch:** (1) State the canonical install layout explicitly — ".legion/ (all-runtimes local install), ~/.legion/ (all-runtimes global install), .claude/legion/ (claude-code local override), ~/.claude/legion/ (claude-code global override). Document per adapter." (2) Validate parse: "After parsing JSON, verify `version` field exists and is a non-empty string. If missing/invalid: display 'Manifest at {path} is malformed (version field missing or non-string). Re-install via npx to recover.' and stop." (3) Detect concurrent installs: "After resolving INSTALL_SCOPE, check the other scope. If both local and global manifests exist with different versions: display a warning noting the discrepancy and ask the user which scope to update."

**Remediation cluster:** `precondition-verification`
**Effort estimate:** medium

---

## LEGION-47-082 — P2, Response Calibration Gaps (confirmed)

**Lines 70-74**

> 4.7. DISPLAY CHANGELOG (if update available)
>    - Run: Bash  npm show @9thlevelsoftware/legion --json 2>/dev/null
>    - Extract the "description" field for a quick summary
>    - If the package has a "homepage" field: display link "Full changelog: {homepage}"
>    - Display: "What's new in v{LATEST_VERSION}: {description or 'See changelog for details'}"

**Issue:** Two response-shape defects. (1) npm package.json `description` is conventionally a package tagline (e.g., "Multi-CLI plugin for orchestrating AI specialists"), not a changelog. Labeling it "What's new in v{LATEST_VERSION}: ..." misrepresents the content — every version will show the same package tagline. Under 4.7 literalism the agent renders the label literally, and the user sees "What's new in v7.4.0: Multi-CLI plugin for orchestrating..." which is misleading. (2) No size/truncation bound on the description. Some npm descriptions are 300+ chars; no rule to wrap, truncate, or elide. Peer CAT-9 finding class; response calibration cluster.

**Remediation sketch:** Replace with npm version-specific changelog fetch: "Query npm for version metadata: `npm view @9thlevelsoftware/legion@{LATEST_VERSION} --json`. If the response has a `repository.url` field pointing to GitHub, attempt to fetch `CHANGELOG.md` from the main branch at that repo and extract the section for v{LATEST_VERSION}. If successful display it (truncated to 10 lines max). Otherwise: 'Changelog: see {homepage}/blob/main/CHANGELOG.md' — do not label the package `description` as 'What's new'." Alternatively: relabel the display as 'Package description:' (accurate) and separately offer the changelog link.

**Remediation cluster:** `response-calibration`
**Effort estimate:** medium

---

## LEGION-47-083 — P2, Unstated Acceptance Criteria (suspected)

**Lines 86-92**

> 6. POST-INSTALL VERIFICATION
>    - After install completes, verify the update was successful:
>      - Re-read manifest.json and confirm version matches LATEST_VERSION
>      - If version mismatch: warn "Update may not have completed successfully. Installed: {actual}, Expected: {LATEST_VERSION}"
>    - Run checksum verification if available:
>      - If checksums.sha256 exists in the install directory: verify file integrity
>      - If verification fails: warn "Checksum verification failed. Consider reinstalling."

**Issue:** Post-install "verification" surfaces warnings but never defines when the command is done. Under 4.7 literalism: if the version mismatch warning fires, is the install successful or failed? The command proceeds to implicit completion with no explicit DONE/FAIL predicate. A user following the command's prose sees "warning" and may interpret it as advisory — but a version mismatch after install is a hard failure (the installer did not do what was requested). Compare ship.md's explicit "GATE FAIL" language — this file lacks parallel gating. Also: "if checksums.sha256 exists" — the file location (install directory) is not defined relative to INSTALL_SCOPE; if INSTALL_SCOPE = local but the checksum file is only in the global install, the check silently skips.

**Remediation sketch:** Add explicit DONE predicate: "Command is complete when: (a) post-install re-read confirms manifest.version == LATEST_VERSION (exact string match after parse), AND (b) if checksums.sha256 exists in {MANIFEST_PATH parent directory}, integrity check passes. If (a) fails: display 'Update FAILED — installed version {actual} does not match expected v{LATEST_VERSION}. Re-run `npx @9thlevelsoftware/legion@{LATEST_VERSION} {runtime_flag} --{INSTALL_SCOPE}` to retry.' and exit non-zero. If (b) fails: display integrity failure and DO NOT claim success." Define checksum path: "checksums.sha256 is read from `{dirname of MANIFEST_PATH}/checksums.sha256` — same scope as the manifest."

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---
