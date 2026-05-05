# Phase 24: Foundation — Context

**Phase Goal:** Users of the codebase see `/legion:` as the canonical namespace in all shared constants
**Requirement:** SKL-01
**Target File:** `skills/workflow-common/SKILL.md` (single file, ~374 lines)

## Decisions

### 1. Portfolio Filesystem Path

**Decision:** Clean break — change `~/.claude/agency/portfolio.md` to `~/.claude/legion/portfolio.md`

- The constant in workflow-common updates to the new path
- No migration comment or backward-compatibility logic in this file
- Phase 26 (skill updates) is responsible for adding migration logic in `portfolio-manager` skill
- Existing users with portfolios at the old path will need to move the file manually or Phase 26 handles it

### 2. GitHub Label Constant

**Decision:** Rename from `"agency"` to `"legion"`

- All references to the GitHub label in workflow-common change to `"legion"`
- Display text in tables reads "Legion label" (capitalized L)
- Existing repos with `agency`-labeled issues won't match — clean break, consistent with out-of-scope decision ("no backward compatibility with /agency: commands")

### 3. Skill Identity Text

**Decision:** Full rebrand with specific text choices

| Element | Old Value | New Value |
|---------|-----------|-----------|
| Frontmatter name | `agency:workflow-common` | `legion:workflow-common` |
| Frontmatter description | Shared workflow patterns and conventions for The Agency plugin | Shared constants, paths, and patterns for all /legion: commands |
| Main heading | `# Agency Workflow Common` | `# Legion Workflow Common` |
| Intro line | Shared constants, paths, and patterns used across all /agency: commands. | Shared constants, paths, and patterns used across all /legion: commands. |

### 4. General Rename Rule

**Decision:** Every instance of "Agency" becomes "Legion", every `/agency:` becomes `/legion:` — zero remnants

This applies to:
- Command references (`/agency:start` → `/legion:start`, etc.)
- Brand text ("The Agency plugin" → "the Legion plugin", "Agency projects" → "Legion projects", etc.)
- Convention names ("Agency label" → "Legion label")
- Constants in code blocks
- Table entries
- Path references

**No exceptions.** Success criteria #3 requires "a developer reading workflow-common sees Legion as the identity with no Agency remnants."

## Code Context

### Target file stats
- **Path:** `skills/workflow-common/SKILL.md`
- **Size:** ~374 lines
- **`/agency:` references:** ~40 occurrences (command routing strings)
- **Case-insensitive "agency" references:** ~47 occurrences (includes brand text, labels, paths)
- **Consumers:** 119 files reference `workflow-common` — but downstream updates are Phase 25 (commands) and Phase 26 (skills)

### Key sections to update
1. **Frontmatter** (lines 1-4) — name and description
2. **Heading + intro** (lines 6-8) — title and description line
3. **State File Locations table** (lines 12-26) — portfolio path, file descriptions
4. **Agent Personality Paths** (lines 28-43) — identity text
5. **Personality Injection Pattern** (lines 44-58) — code examples
6. **Plan File Convention** (lines 60-68) — path patterns
7. **Wave Execution Pattern** (lines 70-84) — team naming examples
8. **State Update Pattern** (lines 86-98) — description text
9. **Cost Profile Convention** (lines 99-107) — command references
10. **Error Handling Pattern** (lines 109-117) — command references
11. **Division Constants** (lines 119-135) — identity text
12. **Portfolio Conventions** (lines 137-152) — path + identity text
13. **Milestone Conventions** (lines 154-177) — command references
14. **Memory Conventions** (lines 179-212) — command references
15. **GitHub Conventions** (lines 214-259) — label + command references
16. **Brownfield Conventions** (lines 261-290) — command references
17. **Marketing Workflow Conventions** (lines 292-334) — command references
18. **Design Workflow Conventions** (lines 336-374) — command references

## Scope Boundaries

**In scope:**
- All text changes within `skills/workflow-common/SKILL.md`
- Every `/agency:` → `/legion:` replacement
- Every "Agency" → "Legion" replacement
- Portfolio path constant update
- GitHub label constant update

**Out of scope (handled by later phases):**
- Command file updates (Phase 25)
- Other skill file updates (Phase 26)
- Plugin manifest updates (Phase 27)
- Documentation updates (Phase 28)
- Portfolio migration logic (Phase 26, portfolio-manager skill)
- Agent personality files (no changes needed — zero "agency" references)
- .planning/ archive files (preserve history as-is)

## Deferred Ideas

None captured during discussion.

---
*Context created: 2026-03-02*
*Decisions: 4 locked, 0 deferred*
