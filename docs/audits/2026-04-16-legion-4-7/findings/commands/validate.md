# Audit Findings — commands/validate.md

**Audited in session:** S05
**Rubric version:** 1.0
**File layer:** command
**File length:** 270 lines
**Total findings:** 5 (0 P0, 0 P1, 4 P2, 1 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-084 — P2, Implicit Preconditions (confirmed) — pre-existing bug

**Lines 140-148**

> Check intent-teams.yaml:
>    - If `.planning/config/intent-teams.yaml` exists:
>      - Parse the YAML. For each intent under the `intents:` mapping:
>        - Extract agent IDs from `agents.primary` list (if present).
>        - Extract agent IDs from `agents.secondary` list (if present).
>        - Extract agent IDs from `filter.exclude_agents` list (if present).
>      - For each extracted ID: check if it exists in VALID_AGENT_IDS.
>      - Any missing → record as FAIL with: "intent-teams.yaml intent '{intent_name}' references agent '{id}' which does not exist in agents/"

**Issue:** The parser contract does not match the actual schema of `.planning/config/intent-teams.yaml`. Per S02c session context (cross-cutting observation on intent-teams.yaml), the file's top-level keys are `command_routes:`, `natural_language:`, `context_rules:`, etc. There is no `intents:` mapping, no `agents.primary`/`agents.secondary` lists, and no `filter.exclude_agents` list. A literal 4.7 reader following these instructions will either (a) iterate zero intents and silently PASS (false negative — misses all dangling references in the file), or (b) throw a parse error that the Scoring block (L164-167) does not enumerate, which is not mapped to PASS/WARN/FAIL. This is a pre-existing bug regardless of 4.7 literalism — analogous to LEGION-47-052 (fix-agent routing table references non-existent agent IDs). The `intents:` schema may have been an earlier design for intent-teams.yaml that was replaced without updating validate.md. Confirmed because: (1) it is an externally verifiable defect independent of LLM interpretation, (2) peers exist in FINDINGS-DB (LEGION-47-052 cluster).

**Remediation sketch:** (1) Re-read `.planning/config/intent-teams.yaml` and identify every field that holds an agent ID reference (e.g., `directory_mappings:` agent lists, `keyword_triggers:` agent fields — whatever the actual schema contains). (2) Rewrite the parser contract to match the real schema, using path expressions like `natural_language.command_routes.<command>.agents[].id` — the exact traversal must reflect the current YAML. (3) Enumerate each traversal step as a separate bullet so 4.7 does not infer structure. (4) Add a defensive PARSE_ERROR → WARN rule to the Scoring block in case the schema changes again. (5) Flag as a pre-existing bug in REMEDIATION.md alongside LEGION-47-052.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** medium

---

## LEGION-47-085 — P2, Implicit Preconditions (confirmed)

**Lines 93-102, 128-131**

> b. For each PLAN-*.md file:
>    - Check: File has YAML frontmatter between `---` delimiters.
>    - Check: Frontmatter contains `phase`, `plan`, `wave`, and `agent` fields.
>    - Check: `agent` field value is a valid agent ID (exists in the agent catalog via agent-registry).
>    ...
>    - Agent ID not found in catalog → FAIL (record which agent ID and which plan file)
> ...
>    Build the ground-truth agent set:
>    - List all `.md` files in the `agents/` directory.
>    - Extract agent IDs by stripping the `.md` extension (e.g., `testing-qa-verification-specialist.md` → `testing-qa-verification-specialist`).
>    - Store as VALID_AGENT_IDS set.

**Issue:** Two different ground-truth sources for the same concept (valid agent IDs), used in two adjacent steps, with no documented priority or consistency check. Step 6 (L96) validates plan-file agent IDs against "the agent catalog via agent-registry" — an abstract reference that presumes the agent-registry skill's in-memory catalog matches the `agents/` directory. Step 7b (L128-131) bypasses agent-registry entirely and builds VALID_AGENT_IDS directly from the filesystem. If these diverge (e.g., agent-registry excludes deprecated agents that still have .md files, or vice versa), step 6 and step 7b will report inconsistent results for the same agent ID. 4.7 cannot infer which is authoritative. Confirmed because the pattern is reproducible across the file (two sources cited, no precedence rule) and affects the PASS/FAIL verdict for real agent IDs.

**Remediation sketch:** Unify the ground-truth source. (1) State at the start of the process: "VALID_AGENT_IDS is defined as the set of filenames (without `.md` extension) in the `agents/` directory. All agent-ID validity checks in this command use VALID_AGENT_IDS. The agent-registry skill is not consulted for validation." (2) Move the VALID_AGENT_IDS construction block (currently L128-131) to step 1 or step 2 so it is built before any check consumes it. (3) Update step 6 L96 to reference VALID_AGENT_IDS instead of "the agent catalog via agent-registry". (4) If divergence between agent-registry and filesystem is a real concern, add a dedicated check (new step) that compares the two sources and reports WARN on mismatch — but do not use agent-registry for primary validation.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-086 — P2, Ambiguous Triggers

**Line 186**

> - Check that each division comment header count (e.g., "# TESTING DIVISION (6 agents)") matches the actual agent count for that division.

**Issue:** The parse rule is specified by example only, not by regex or structural contract. "Division comment header count" is ambiguous: is the pattern `^# [A-Z ]+ DIVISION \((\d+) agents?\)`? Is the count word-boundaried? Is whitespace normalized? What if the comment says "TESTING DIVISION (6)" without "agents"? What about "Testing Division" in mixed case? 4.7 has to guess the regex, and different runs may extract different counts from the same file. Peer pattern: LEGION-47-057 (security-file keyword-substring detection), LEGION-47-044 (quick.md keyword match), LEGION-47-048 (plan.md), LEGION-47-028 (learn.md), LEGION-47-072 (status.md milestone keyword) — consistent keyword-or-pattern-substring defect class across the audit.

**Remediation sketch:** Replace the example with a precise regex: "Parse each comment header in authority-matrix.yaml matching `^\s*#\s+([A-Za-z][A-Za-z ]*?)\s+DIVISION\s*\((\d+)\s+agents?\)\s*$` (case-insensitive). Capture group 1 = division name (normalize to lowercase), capture group 2 = stated agent count. Compare stated count to the count of agents in `agents/` whose frontmatter `division` field (normalized lowercase) matches the division name. WARN on mismatch with both values cited." State the division-name normalization explicitly.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---

## LEGION-47-087 — P2, Unstated Acceptance Criteria

**Lines 252-258**

> If FIX_MODE was active and fixes were applied:
>      Append:
>      ```
>      ## Fixes Applied
>      - {description of each fix applied}
>      ```
>      Then re-run validation on fixed files and show updated results.

**Issue:** The re-run contract has no termination bound and no definition of "done". (1) "Re-run validation on fixed files" — does this mean only the files that were touched by fixes, or the full pipeline? If a fix to ROADMAP.md changes phase numbers, step 5 STATE.md cross-reference checks may now fail — are those re-run? (2) If the second run produces new FAILs (e.g., title prefix was missing, fix added `# Untitled Project`, now cross-references fail), is a third run triggered? Unbounded recursion possible. (3) "Show updated results" — in the same report structure? Replace original table? Append a second table? 4.7 will guess. Acceptance criteria for "re-run complete" are undefined.

**Remediation sketch:** "After FIX_MODE fixes are applied: (a) Re-run steps 3-9 exactly once against the full `.planning/` tree (not just fixed files). (b) Compare the second-run results to the first-run results. (c) In the final report, render two sub-tables: 'Before Fixes' (first-run results) and 'After Fixes' (second-run results). (d) If any check newly FAILs in the second run that was PASS in the first run: record as a regression WARN with note 'fix introduced new issue'. (e) Do not run a third iteration under any circumstance — if fixes chain, require the user to re-invoke `/legion:validate --fix`."

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-088 — P3, Prohibitive Over-Reliance

**Line 261**

> Exit. Validate never modifies phase state (STATE.md, ROADMAP.md progress fields) unless --fix is used for formatting corrections only. Validate never changes phase status, plan assignments, or roadmap progression.

**Issue:** Prohibitive cluster tail with two "never" statements. The first "never" is useful (defends the non-mutation invariant) but is immediately weakened by "unless --fix" — the closed decision-boundary defense is already handled elsewhere (step 7b L158-162 explicitly disables auto-fix for dangling agent refs; steps 3-5 FIX_MODE blocks enumerate allowed mutations). The second "never" sentence is redundant given the first plus the FIX_MODE enumerations. 4.7 may read the second "never" as a stricter constraint than intended and refuse legitimate FIX_MODE operations that indirectly touch status fields (e.g., normalizing "wip" → "In Progress" per L72). P3 because this is the tail of the file with low runtime impact, but still sharpens the closed-set boundary.

**Remediation sketch:** Rewrite positively: "Exit. Validate's write surface is restricted to the formatting and normalization fixes enumerated in steps 3, 4, and 8 under FIX_MODE blocks. No other files or fields are written. Dangling agent references are surfaced as findings only; remediation is human-authored (per step 7b guidance)." Drop both "never" sentences in favor of the positive enumeration.

**Remediation cluster:** `prohibitive-to-positive`
**Effort estimate:** small

---
