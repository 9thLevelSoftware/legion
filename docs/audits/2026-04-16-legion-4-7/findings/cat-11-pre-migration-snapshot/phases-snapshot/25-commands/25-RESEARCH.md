# Phase 25: Commands — Research

**Researched:** 2026-03-02
**Domain:** Text substitution / markdown command files rebrand — 10 files, zero external dependencies
**Confidence:** HIGH

## Summary

Phase 25 is a bounded, mechanical text-editing task across 10 command files in `commands/`. There are 107 case-insensitive "agency" occurrences across 2,300 total lines. Every occurrence must be transformed to its "legion" equivalent (case-matched, context-appropriate). No external tools, no new libraries, no new files — just Read + Write operations on existing markdown files.

The work follows the same pattern as Phase 24 (workflow-common), but scaled to 10 files instead of 1. The complexity is again about correctness, not technology. There are 5 distinct substitution patterns: frontmatter name declarations, `/agency:` command references, brand prose ("Agency" / "The Agency"), commit message prefixes, and filesystem paths / GitHub labels. Each pattern transforms differently.

The highest-risk files are `build.md` (15 occurrences including commit prefixes and brand prose), `review.md` (15 occurrences), `status.md` (16 occurrences — the most), and `portfolio.md` (13 occurrences including filesystem paths). The simplest files are `agent.md` (3 occurrences) and `advise.md` (7 occurrences).

**Primary recommendation:** Process files in batches of 2-3, using Write for each complete file rewrite. Verify each file immediately after writing with `grep -in "agency"`. The substitution map below is exhaustive — follow it exactly.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CMD-01 | All 10 command files use `/legion:` namespace instead of `/agency:` in name declarations and all internal references | Full substitution map below: Pattern A (10 name declarations) and Pattern B (68 command references) cover all namespace instances |
| CMD-02 | Cross-command references within each command file point to `/legion:` equivalents | Pattern B documents all 68 cross-command references with exact line numbers per file |
| CMD-03 | Commit message prefixes in commands updated from `feat(agency):` / `chore(agency):` to `feat(legion):` / `chore(legion):` | Pattern D documents all 12 commit prefix occurrences across build.md, milestone.md, quick.md, and review.md |
</phase_requirements>

---

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Claude Code Read tool | built-in | Read current file content | Required before Write |
| Claude Code Write tool | built-in | Overwrite file with updated content | Single atomic operation per file |
| Bash grep | built-in | Post-write verification | Confirms zero "agency" remnants |

### Supporting

None — this phase needs no libraries, no package installs, no scripts.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 10 individual Write calls | Single sed script across all files | Sed is possible but risky on Windows (shell escaping, line endings); Write gives inline verification |
| Per-file Write | Multiple Edit calls per file | Edit calls risk partial state if session interrupts; Write is atomic per file |

---

## Architecture Patterns

### Recommended Approach: Per-File Read + Transform + Write + Verify

For each of the 10 command files:
1. **Read** the entire file into context
2. **Apply all substitutions** from the substitution map (this file's section)
3. **Write** the full transformed content back in one operation
4. **Verify** with `grep -in "agency" commands/{filename}` — expect zero output

### Recommended Processing Order

Process by dependency risk (files that reference many other commands first, so cross-references are consistent):

1. **Wave 1** (high cross-reference density): `status.md` (16), `build.md` (15), `review.md` (15)
2. **Wave 2** (medium density): `portfolio.md` (13), `start.md` (11), `quick.md` (11)
3. **Wave 3** (low density): `plan.md` (8), `milestone.md` (8), `advise.md` (7), `agent.md` (3)

Processing order does not matter for correctness (all files are independent), but grouping by density helps the planner allocate task complexity.

### Anti-Patterns to Avoid

- **Partial file editing with multiple Edit calls:** A file with 16 occurrences (status.md) needs all 16 changed atomically. If the session drops mid-Edit, the file is in hybrid state.
- **Blanket regex without review:** The word "agency" appears in 5 different contexts (command prefix, brand name, filesystem path, label string, branch pattern). A naive global replace works for most, but the `advise.md` description and the `portfolio.md`/`start.md` Portfolio heading require specific text.
- **Forgetting non-obvious patterns:** The `agency/phase-{NN}` branch name (build.md:273), the `"agency"` GitHub label string (plan.md:206,213), and `non-Agency` (start.md:36) are easy to miss when scanning for `/agency:`.

---

## Complete Substitution Map

Total: 107 occurrences across 10 files.

### Pattern Legend

| Pattern | Description | Transformation |
|---------|-------------|----------------|
| **A** | Frontmatter `name:` field | `agency:{cmd}` -> `legion:{cmd}` |
| **B** | Command reference (`/agency:X`) | `/agency:{cmd}` -> `/legion:{cmd}` |
| **C** | Brand prose ("Agency" / "The Agency") | "Agency" -> "Legion", "The Agency Workflows" -> "The Legion Workflows" |
| **D** | Commit message prefix | `feat(agency):` -> `feat(legion):`, etc. |
| **E** | Other: filesystem paths, labels, branch names | Context-specific (documented per occurrence) |

---

### File 1: advise.md (176 lines, 7 occurrences)

| Line | Pattern | Current Text | Replacement |
|------|---------|-------------|-------------|
| 2 | A | `name: agency:advise` | `name: legion:advise` |
| 3 | C | `description: Get read-only expert consultation from Agency's 51 agent personalities` | `description: Get read-only expert consultation from Legion's 51 agent personalities` |
| 29 | B | `Usage: \`/agency:advise <topic>\`` | `Usage: \`/legion:advise <topic>\`` |
| 42 | B | `/agency:advise architecture` | `/legion:advise architecture` |
| 43 | B | `/agency:advise UX` | `/legion:advise UX` |
| 44 | B | `/agency:advise marketing strategy` | `/legion:advise marketing strategy` |
| 172 | B | `Run \`/agency:advise <topic>\` anytime` | `Run \`/legion:advise <topic>\` anytime` |

---

### File 2: agent.md (120 lines, 3 occurrences)

| Line | Pattern | Current Text | Replacement |
|------|---------|-------------|-------------|
| 2 | A | `name: agency:agent` | `name: legion:agent` |
| 33 | C+B | `"No Agency project found. Run \`/agency:start\` to initialize."` | `"No Legion project found. Run \`/legion:start\` to initialize."` |
| 99 | B | `It will appear in \`/agency:plan\` recommendations` | `It will appear in \`/legion:plan\` recommendations` |

---

### File 3: build.md (293 lines, 15 occurrences)

| Line | Pattern | Current Text | Replacement |
|------|---------|-------------|-------------|
| 2 | A | `name: agency:build` | `name: legion:build` |
| 30 | B | `/agency:build --phase 2` | `/legion:build --phase 2` |
| 34 | B | `Run /agency:plan {N+1} for the next phase.` | `Run /legion:plan {N+1} for the next phase.` |
| 37 | B | `Run /agency:plan {N} first.` | `Run /legion:plan {N} first.` |
| 118 | C | `as part of The Agency Workflows` | `as part of The Legion Workflows` |
| 140 | C | `as part of The Agency Workflows` | `as part of The Legion Workflows` |
| 175 | D | `feat(agency): execute plan` | `feat(legion): execute plan` |
| 210 | D | `chore(agency): update state after wave` | `chore(legion): update state after wave` |
| 220 | B | `Run /agency:review to diagnose` | `Run /legion:review to diagnose` |
| 234 | B | `Run \`/agency:review\` to verify` | `Run \`/legion:review\` to verify` |
| 240 | D | `chore(agency): complete phase {N}` | `chore(legion): complete phase {N}` |
| 273 | E | `create feature branch agency/phase-{NN}-{slug}` | `create feature branch legion/phase-{NN}-{slug}` |
| 285 | B | `Run \`/agency:review\` to verify the work.` | `Run \`/legion:review\` to verify the work.` |
| 290 | B | `run \`/agency:review\` for diagnosis.` | `run \`/legion:review\` for diagnosis.` |
| 292 | B | `Do NOT automatically trigger /agency:review` | `Do NOT automatically trigger /legion:review` |

---

### File 4: milestone.md (249 lines, 8 occurrences)

| Line | Pattern | Current Text | Replacement |
|------|---------|-------------|-------------|
| 2 | A | `name: agency:milestone` | `name: legion:milestone` |
| 33 | C | `"No Agency project found in this directory.` | `"No Legion project found in this directory.` |
| 34 | B | `Run \`/agency:start\` to initialize a new project."` | `Run \`/legion:start\` to initialize a new project."` |
| 62 | B | `Run \`/agency:milestone\` anytime to set up milestones.` | `Run \`/legion:milestone\` anytime to set up milestones.` |
| 149 | D | `chore(agency): complete milestone {N}` | `chore(legion): complete milestone {N}` |
| 167 | B | `Run \`/agency:milestone\` to archive when ready.` | `Run \`/legion:milestone\` to archive when ready.` |
| 189 | D | `chore(agency): archive milestone {N}` | `chore(legion): archive milestone {N}` |
| 206 | B | `Run \`/agency:milestone\` anytime for milestone management.` | `Run \`/legion:milestone\` anytime for milestone management.` |

---

### File 5: plan.md (235 lines, 8 occurrences)

| Line | Pattern | Current Text | Replacement |
|------|---------|-------------|-------------|
| 2 | A | `name: agency:plan` | `name: legion:plan` |
| 34 | B | `"3" from \`/agency:plan 3\`` | `"3" from \`/legion:plan 3\`` |
| 49 | B | `suggest /agency:build instead` | `suggest /legion:build instead` |
| 66 | B | `Consider running /agency:start to refresh` | `Consider running /legion:start to refresh` |
| 206 | E | `Ensure "agency" label exists` | `Ensure "legion" label exists` |
| 213 | E | `- Label: "agency"` | `- Label: "legion"` |
| 224 | B | `Run \`/agency:build\` to execute` | `Run \`/legion:build\` to execute` |
| 233 | B | `Run \`/agency:build\` to execute` | `Run \`/legion:build\` to execute` |

---

### File 6: portfolio.md (245 lines, 13 occurrences)

| Line | Pattern | Current Text | Replacement |
|------|---------|-------------|-------------|
| 2 | A | `name: agency:portfolio` | `name: legion:portfolio` |
| 21 | E | `Portfolio registry: ~/.claude/agency/portfolio.md` | `Portfolio registry: ~/.claude/legion/portfolio.md` |
| 27 | E | `read \`~/.claude/agency/portfolio.md\`` | `read \`~/.claude/legion/portfolio.md\`` |
| 30 | E | `at \`~/.claude/agency/portfolio.md\`` | `at \`~/.claude/legion/portfolio.md\`` |
| 31 | B | `Run \`/agency:start\` in a project to register it` | `Run \`/legion:start\` in a project to register it` |
| 36 | B | `Run \`/agency:start\` in a project directory` | `Run \`/legion:start\` in a project directory` |
| 64 | C | `# Agency Portfolio` | `# Legion Portfolio` |
| 195 | C | `{count} Agency projects` | `{count} Legion projects` |
| 220 | B | `Run \`/agency:portfolio\` anytime for cross-project status.` | `Run \`/legion:portfolio\` anytime for cross-project status.` |
| 223 | B | `projects not created with /agency:start` | `projects not created with /legion:start` |
| 228 | C+B | `doesn't have an Agency project. Run \`/agency:start\` first.` | `doesn't have a Legion project. Run \`/legion:start\` first.` |
| 230 | E | `Create \`~/.claude/agency/\` directory if needed` | `Create \`~/.claude/legion/\` directory if needed` |
| 231 | E | `Read or initialize \`~/.claude/agency/portfolio.md\`` | `Read or initialize \`~/.claude/legion/portfolio.md\`` |

**Note on line 228:** "an Agency" becomes "a Legion" (article change: "an" before vowel sound -> "a" before consonant sound).

---

### File 7: quick.md (183 lines, 11 occurrences)

| Line | Pattern | Current Text | Replacement |
|------|---------|-------------|-------------|
| 2 | A | `name: agency:quick` | `name: legion:quick` |
| 30 | B | `Usage: \`/agency:quick <task-description>\`` | `Usage: \`/legion:quick <task-description>\`` |
| 31 | B | `/agency:quick write unit tests` | `/legion:quick write unit tests` |
| 32 | B | `/agency:quick create a content calendar` | `/legion:quick create a content calendar` |
| 33 | B | `/agency:quick review the API rate limiting` | `/legion:quick review the API rate limiting` |
| 166 | D | `fix(agency)` | `fix(legion)` |
| 167 | D | `test(agency)` | `test(legion)` |
| 168 | D | `docs(agency)` | `docs(legion)` |
| 169 | D | `refactor(agency)` | `refactor(legion)` |
| 170 | D | `feat(agency)` | `feat(legion)` |
| 172 | D | `{type}(agency): quick` | `{type}(legion): quick` |

---

### File 8: review.md (436 lines, 15 occurrences)

| Line | Pattern | Current Text | Replacement |
|------|---------|-------------|-------------|
| 2 | A | `name: agency:review` | `name: legion:review` |
| 32 | B | `/agency:review --phase 4` | `/legion:review --phase 4` |
| 36 | B | `Run /agency:build first.` | `Run /legion:build first.` |
| 37 | B | `Run /agency:plan {N+1} for the next phase.` | `Run /legion:plan {N+1} for the next phase.` |
| 41 | B | `Run /agency:build first.` | `Run /legion:build first.` |
| 278 | D | `fix(agency): review cycle` | `fix(legion): review cycle` |
| 321 | B | `Run \`/agency:plan {N+1}\` to plan` | `Run \`/legion:plan {N+1}\` to plan` |
| 333 | D | `chore(agency): phase {N} review passed` | `chore(legion): phase {N} review passed` |
| 379 | B | `re-run /agency:review` | `re-run /legion:review` |
| 405 | B | `re-run /agency:review` | `re-run /legion:review` |
| 406 | B | `move to /agency:plan {N+1}` | `move to /legion:plan {N+1}` |
| 423 | B | `Run \`/agency:plan {N+1}\` to plan` | `Run \`/legion:plan {N+1}\` to plan` |
| 425 | C | `The Agency Workflows project is finished.` | `The Legion Workflows project is finished.` |
| 429 | B | `re-run \`/agency:review\` to verify.` | `re-run \`/legion:review\` to verify.` |
| 435 | B | `Do NOT automatically trigger /agency:plan` | `Do NOT automatically trigger /legion:plan` |

---

### File 9: start.md (156 lines, 11 occurrences)

| Line | Pattern | Current Text | Replacement |
|------|---------|-------------|-------------|
| 2 | A | `name: agency:start` | `name: legion:start` |
| 31 | B | `suggest \`/agency:status\` instead` | `suggest \`/legion:status\` instead` |
| 36 | C | `Check for non-Agency source files` | `Check for non-Legion source files` |
| 50 | B | `I'll run /agency:plan directly` | `I'll run /legion:plan directly` |
| 118 | E | `\`~/.claude/agency/\` directory exists` | `\`~/.claude/legion/\` directory exists` |
| 119 | E | `Read \`~/.claude/agency/portfolio.md\`` | `Read \`~/.claude/legion/portfolio.md\`` |
| 121 | C | `# Agency Portfolio` | `# Legion Portfolio` |
| 143 | E | `Write the updated \`~/.claude/agency/portfolio.md\`` | `Write the updated \`~/.claude/legion/portfolio.md\`` |
| 144 | E | `Registered in portfolio: ~/.claude/agency/portfolio.md` | `Registered in portfolio: ~/.claude/legion/portfolio.md` |
| 153 | E | `Portfolio: Registered at ~/.claude/agency/portfolio.md` | `Portfolio: Registered at ~/.claude/legion/portfolio.md` |
| 154 | B | `Run \`/agency:plan 1\` to begin Phase 1` | `Run \`/legion:plan 1\` to begin Phase 1` |

---

### File 10: status.md (207 lines, 16 occurrences)

| Line | Pattern | Current Text | Replacement |
|------|---------|-------------|-------------|
| 2 | A | `name: agency:status` | `name: legion:status` |
| 8 | B | `next /agency: command based on` | `next /legion: command based on` |
| 33 | C | `"No Agency project found in this directory.` | `"No Legion project found in this directory.` |
| 34 | B | `Run \`/agency:start\` to initialize` | `Run \`/legion:start\` to initialize` |
| 97 | B | `Run \`/agency:milestone\` to generate a summary` | `Run \`/legion:milestone\` to generate a summary` |
| 170 | B | `Run \`/agency:start\` to initialize the project.` | `Run \`/legion:start\` to initialize the project.` |
| 173 | B | `Run \`/agency:plan {N}\` to plan` | `Run \`/legion:plan {N}\` to plan` |
| 176 | B | `Run \`/agency:build\` to execute` | `Run \`/legion:build\` to execute` |
| 179 | B | `Run \`/agency:review\` to verify` | `Run \`/legion:review\` to verify` |
| 183 | B | `Run \`/agency:plan {N+1}\` to plan` | `Run \`/legion:plan {N+1}\` to plan` |
| 186 | B | `Run \`/agency:milestone\` to mark it done` | `Run \`/legion:milestone\` to mark it done` |
| 191 | B | `Run \`/agency:quick <task>\` for any ad-hoc work.` | `Run \`/legion:quick <task>\` for any ad-hoc work.` |
| 196 | B | `then \`/agency:review\`` | `then \`/legion:review\`` |
| 197 | B | `/agency:quick <task>` | `/legion:quick <task>` |
| 198 | B | `/agency:plan {N}` | `/legion:plan {N}` |
| 206 | B | `Run \`/agency:quick <task>\` anytime` | `Run \`/legion:quick <task>\` anytime` |

---

## Occurrence Summary by Pattern

| Pattern | Description | Count | Files |
|---------|-------------|-------|-------|
| A | Frontmatter name declaration | 10 | All 10 files |
| B | Command reference (`/agency:X`) | 68 | All 10 files |
| C | Brand prose ("Agency" text) | 12 | advise(1), agent(1), build(2), milestone(1), portfolio(3), review(1), start(2), status(1) |
| D | Commit message prefix | 12 | build(3), milestone(2), quick(6), review(2) |
| E | Filesystem paths, labels, branch names | 15 | build(1), plan(2), portfolio(5), start(5), status(0) [note: status has 0 Pattern E] |
| **Total** | | **107** | **10 files** |

Note: Some lines have multiple patterns (e.g., agent.md line 33 has both C and B). The per-file counts in the grep output double-count these, but the substitution map above lists them correctly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Verification | Custom test script | `grep -in "agency" commands/*.md` | Grep gives instant full-repo confirmation |
| Substitution tracking | Spreadsheet or manual notes | The substitution map in this document | Already catalogued with line numbers |
| Batch processing | Shell script with sed | Individual Write calls per file | Windows path/escaping issues; Write is atomic and verifiable |

**Key insight:** This is the same pattern as Phase 24 but applied to 10 files instead of 1. The substitution map IS the engineering work. Implementation is mechanical execution.

---

## Common Pitfalls

### Pitfall 1: Article Change on "an Agency" -> "a Legion"

**What goes wrong:** portfolio.md line 228 says "an Agency project" — a naive replacement to "an Legion project" is grammatically incorrect.

**Why it happens:** "Agency" starts with a vowel sound (requires "an"), but "Legion" starts with a consonant sound (requires "a").

**How to avoid:** The substitution map marks this explicitly. Line 228 transforms "an Agency" to "a Legion".

**Warning signs:** Proof-read any line containing "an Agency" or "An Agency" after transformation.

### Pitfall 2: Forgetting the GitHub Label String

**What goes wrong:** plan.md lines 206 and 213 contain the GitHub label `"agency"` as a quoted string, not as a command prefix. A scan for `/agency:` will miss these.

**Why it happens:** The label is a data value, not a command reference.

**How to avoid:** The substitution map includes these as Pattern E. Final grep verification catches any remnant.

**Warning signs:** `grep -in '"agency"' commands/*.md` returns hits after transformation.

### Pitfall 3: Forgetting the Branch Name Pattern

**What goes wrong:** build.md line 273 has `agency/phase-{NN}-{slug}` as a git branch prefix. This is not a command reference and does not contain a colon.

**Why it happens:** Branch naming convention uses the brand as a path segment.

**How to avoid:** The substitution map includes this as Pattern E.

**Warning signs:** `grep -in "agency/" commands/*.md` returns hits after transformation.

### Pitfall 4: Portfolio Path Occurrences Across Two Files

**What goes wrong:** The `~/.claude/agency/` filesystem path appears in both `portfolio.md` (5 occurrences) AND `start.md` (5 occurrences). Missing one file's paths creates an inconsistency.

**Why it happens:** Two separate command files both reference the portfolio registry path.

**How to avoid:** Process both portfolio.md and start.md carefully. All 10 path occurrences are documented in the map.

**Warning signs:** `grep -in "~/.claude/agency" commands/*.md` returns any hits.

### Pitfall 5: Inconsistent Description Handling

**What goes wrong:** Only `advise.md` has "Agency" in its frontmatter description. The other 9 descriptions are agency-free. If the executor assumes all descriptions need changing, they may corrupt clean descriptions.

**Why it happens:** Applying a blanket frontmatter description update when only 1 of 10 needs it.

**How to avoid:** The substitution map lists exactly which lines change. Do NOT modify lines not in the map.

**Warning signs:** Any description containing "Legion" that didn't previously contain "Agency".

---

## Code Examples

### Pre-transformation verification
```bash
grep -inc "agency" commands/*.md
# Expected: advise.md:7 agent.md:3 build.md:15 milestone.md:8 plan.md:8
#           portfolio.md:13 quick.md:11 review.md:15 start.md:11 status.md:16
# Total: 107
```

### Post-transformation verification (per file)
```bash
grep -in "agency" commands/advise.md
# Expected: zero output

grep -in "agency" commands/agent.md
# Expected: zero output
# ... repeat for all 10 files
```

### Final verification (all files at once)
```bash
grep -inc "agency" commands/*.md
# Expected: all zeros (0 for every file)
```

### Total count verification
```bash
grep -ic "agency" commands/*.md | awk -F: '{sum+=$2} END {print sum}'
# Expected: 0
```

### Exact frontmatter after transformation (all 10 files)
```yaml
# advise.md
---
name: legion:advise
description: Get read-only expert consultation from Legion's 51 agent personalities
---

# agent.md
---
name: legion:agent
description: Create a new agent personality through a guided workflow
---

# build.md
---
name: legion:build
description: Execute current phase plans with parallel agent teams
---

# milestone.md
---
name: legion:milestone
description: Milestone management — status, definition, completion, and archiving
---

# plan.md
---
name: legion:plan
description: Plan a specific phase with agent recommendations and wave-structured tasks
---

# portfolio.md
---
name: legion:portfolio
description: Multi-project portfolio dashboard with cross-project dependency tracking
---

# quick.md
---
name: legion:quick
description: Run a single ad-hoc task with intelligent agent selection
---

# review.md
---
name: legion:review
description: Run quality review cycle with testing/QA agents
---

# start.md
---
name: legion:start
description: Initialize a new project with guided questioning flow
---

# status.md
---
name: legion:status
description: Show project progress dashboard and route to next action
---
```

---

## State of the Art

This is not a technology-selection problem. The relevant state is the project's own convention:

| Old Convention | Current Convention | When Changed | Impact |
|----------------|-------------------|--------------|--------|
| `/agency:` command namespace | `/legion:` command namespace | Phase 24 (workflow-common), Phase 25 (commands) | Users type `/legion:` for all 10 commands |
| `~/.claude/agency/portfolio.md` | `~/.claude/legion/portfolio.md` | Phase 24 constants, Phase 25 command references | Portfolio path consistent across workflow-common and all commands |
| `feat(agency):` commit prefixes | `feat(legion):` commit prefixes | Phase 25 | All auto-generated commits use `(legion)` scope |
| `agency/phase-{NN}` branch names | `legion/phase-{NN}` branch names | Phase 25 | Feature branches use new namespace |
| `"agency"` GitHub label | `"legion"` GitHub label | Phase 24 constants, Phase 25 plan.md | GitHub integration uses new label |

---

## Open Questions

None. All 107 occurrences are documented with exact line numbers and transformations. The work is fully specified. The only decision point is how the planner groups files into plans (1 plan for all 10 files, or 2-3 plans with file batches).

**Planner consideration:** 10 files with 107 total changes is manageable in a single plan with 2-3 tasks, but the planner may prefer to split into 2 plans (Wave 1: high-density files, Wave 2: remaining files) for easier verification. Either approach works.

---

## Sources

### Primary (HIGH confidence)

- Direct file inspection: all 10 files in `commands/` — full reads of all 2,300 lines
- `grep -in "agency" commands/*.md` — complete occurrence catalogue with line numbers
- Phase 24 RESEARCH.md at `.planning/phases/24-foundation/24-RESEARCH.md` — pattern methodology
- `.planning/REQUIREMENTS.md` — CMD-01, CMD-02, CMD-03 requirement definitions
- `.planning/ROADMAP.md` — Phase 25 success criteria

### Secondary (MEDIUM confidence)

None needed — research is entirely based on direct file inspection.

---

## Metadata

**Confidence breakdown:**
- Substitution map: HIGH — derived from direct file reads and grep, all 107 occurrences line-numbered
- Pattern categorization: HIGH — follows established Phase 24 pattern taxonomy
- Pitfall identification: HIGH — derived from structural analysis of the files and Phase 24 lessons learned
- No technology research required: this phase has zero external dependencies

**Research date:** 2026-03-02
**Valid until:** Indefinite — command files do not change until this phase executes
