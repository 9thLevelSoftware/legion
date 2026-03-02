# Phase 10: Custom Agents — Research

**Researched:** 2026-03-01
**Domain:** Agent file authoring, schema validation, registry integration
**Confidence:** HIGH

---

## Summary

Phase 10 adds a user-facing workflow for creating new agent personalities. Users will run a guided conversation (similar in spirit to `/agency:start`'s questioning flow), producing a valid agent `.md` file with proper YAML frontmatter, and the new agent will automatically appear in the agent-registry for future planning recommendations.

The implementation is entirely within the existing Agency plugin primitives — no external libraries, no new state stores, no binary formats. Everything follows the patterns established in Phases 1-9: a new skill (`agent-creator.md`) implements the creation logic, a new command (`agent.md`) wires the skill, and the agent-registry skill receives a targeted update to include custom agents. The workflow-common.md state file table gets a new Custom Agents path entry.

There is no CONTEXT.md for this phase, so all decisions in this research document are open to the planner's judgment.

**Primary recommendation:** Build a 2-plan phase — Wave 1 creates the `agent-creator` skill and the path conventions; Wave 2 creates the `/agency:agent` command and updates agent-registry to load and recommend custom agents.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CUSTOM-01 | Agent creation workflow — guided flow to define new agent personalities | Questioning-flow and phase-decomposer patterns show how to build adaptive conversation engines; Section "Architecture Patterns" details the guided creation flow |
| CUSTOM-02 | Agent schema and validation — enforce frontmatter structure, required fields | Existing agent files reveal the de facto schema; Section "Standard Stack" documents all required and optional frontmatter fields with validation rules |
| CUSTOM-03 | Registry auto-update — new agents automatically registered in agent-registry | Agent-registry Section 3 recommendation algorithm shows where custom agents must be injected; Section "Don't Hand-Roll" explains the append-to-catalog pattern |
</phase_requirements>

---

## Standard Stack

### Core

All implementation uses existing Agency plugin primitives — no new dependencies are introduced.

| Artifact | Location | Purpose | Why Standard |
|----------|----------|---------|--------------|
| New skill: `agent-creator.md` | `.claude/skills/agency/agent-creator.md` | Guided conversation engine + schema validation + file generation for new agents | Follows the established skill pattern (questioning-flow, phase-decomposer, memory-manager); reference documents consumed by commands |
| New command: `agent.md` | `.claude/commands/agency/agent.md` | Entry point — `/agency:agent` — wires agent-creator skill | Follows existing command structure (YAML frontmatter, objective, execution_context, context, process) |
| Updated: `agent-registry.md` | `.claude/skills/agency/agent-registry.md` | Load and surface custom agents in Section 1 catalog and Section 3 recommendation algorithm | Custom agents must appear in the registry to satisfy CUSTOM-03 |
| Updated: `workflow-common.md` | `.claude/skills/agency/workflow-common.md` | Add Custom Agents path to State File Locations table | Consistent with Memory Outcomes, Milestone paths, Portfolio path additions in prior phases |

### Agent File Schema (the deliverable format)

Derived from reading all 51 existing agent `.md` files across 9 divisions.

#### Required Frontmatter Fields

| Field | Format | Example | Rule |
|-------|--------|---------|------|
| `name` | kebab-case string | `engineering-senior-developer` | Must match filename without `.md`. Must be globally unique within `agency-agents/` |
| `description` | Free text string (one line) | `Expert UI designer specializing in visual design systems` | Must be non-empty. Used verbatim in agent-registry catalog and recommendation matching |
| `color` | CSS color name | `green` | Must be one of: `red`, `green`, `blue`, `purple`, `cyan`, `orange`, `yellow`, `pink`. Used for visual identification in Claude Code UI |

#### Optional Frontmatter Fields

| Field | Format | When to Include |
|-------|--------|-----------------|
| `tools` | Comma-separated list | When agent needs specific tools (e.g., `WebFetch, WebSearch, Read, Write`) |

#### Required Body Sections (minimum viable agent)

| Section | Purpose | Example heading |
|---------|---------|-----------------|
| Role/identity heading | `# {AgentName} Agent Personality` | `# UI Designer Agent Personality` |
| Identity block | Who the agent is, personality, experience | `## Your Identity & Memory` or equivalent |
| Core mission | What the agent does | `## Your Core Mission` or `## Core Capabilities` |
| Success criteria | How the agent knows it succeeded | `## Your Success Criteria` or `## Decision Framework` |

Note: The body format is not rigidly enforced across existing agents — some use emoji headers, some do not. The minimum bar is: frontmatter with required fields + some substantive personality content (~50 lines minimum).

#### Custom Agent File Location

Custom agents must be placed in a division subdirectory under `agency-agents/`:

```
agency-agents/{division}/{agent-id}.md
```

Division options: `engineering`, `design`, `marketing`, `product`, `project-management`, `testing`, `support`, `spatial-computing`, `specialized`

Alternatively, a new division can be created (e.g., `agency-agents/custom/`) if the agent does not fit any existing division. The registry update must handle both cases.

### Installation

No `npm install` — pure markdown files written with `Write` tool.

---

## Architecture Patterns

### Recommended Project Structure

```
.claude/
  commands/agency/
    agent.md             # new command: /agency:agent
  skills/agency/
    agent-creator.md     # new skill: guided creation + validation + generation

agency-agents/
  {division}/            # existing division directories
    {new-agent-id}.md    # generated agent file lands here
  custom/                # optional new division for agents that don't fit
    {new-agent-id}.md
```

### Pattern 1: Guided Creation Conversation (modeled on questioning-flow.md)

**What:** A 3-stage adaptive conversation that captures everything needed to write a valid agent `.md` file, then validates and generates the file.

**When to use:** Always — this is the core CUSTOM-01 workflow.

**Stage structure:**

```
Stage 1: Agent Identity (1-2 exchanges)
  - "What does this agent do? Give me the one-liner."
  - Infer: name, division, specialty
  - Confirm: "I'll create agent '{name}' in the {division} division.
              Specialty: '{description}'. Correct?"

Stage 2: Capabilities & Personality (2-3 exchanges)
  - "What are the top 3-5 things this agent can do that others can't?"
  - "How does this agent think? What makes it distinctive?"
  - "What are 2-3 hard rules it always follows?"
  - Confirm summary before proceeding

Stage 3: Registry Integration (1 exchange)
  - Present generated agent-registry row (ID, file path, specialty, task types)
  - Use AskUserQuestion: "Does this registry entry look right?"
  - Allow user to adjust task type tags (critical for recommendation matching)
```

**Example (following questioning-flow.md pattern):**

```markdown
# Agent Creator — Stage 1

Open with:
> "What kind of specialist do you want to add to your team?
>  Give me the one-liner — what does this agent do?"

From the response, extract:
  - specialty domain (maps to a division)
  - primary capability
  - what makes it different from existing agents

Confirm:
> "I'll create a {division} agent called '{agent-id}' — {description}.
>  Does that capture it?"
```

### Pattern 2: Schema Validation (CUSTOM-02)

**What:** Before writing the agent file, validate all required fields are present and correctly formatted.

**When to use:** Always — runs after conversation, before file write.

**Validation checklist:**

```
Validation Rules:

1. name field
   - Non-empty string
   - Kebab-case only (regex: ^[a-z][a-z0-9-]+$)
   - No spaces, no uppercase, no underscores
   - Unique: grep agency-agents/**/*.md for existing name values — no duplicates allowed

2. description field
   - Non-empty string
   - Single line (no newlines in value)
   - At least 10 characters

3. color field
   - Must be one of: red, green, blue, purple, cyan, orange, yellow, pink
   - Default to a division-appropriate color if user doesn't specify

4. division placement
   - Must be an existing division name OR "custom" (new division)
   - File path: agency-agents/{division}/{name}.md

5. Body content
   - Minimum 50 lines
   - Must contain at least one heading (# or ##)
   - Must include the agent name somewhere in the body

6. Registry task types
   - At least 2 task type tags
   - Tags must be lowercase, hyphenated (kebab-case)
   - Tags must relate to the agent's stated capabilities
```

### Pattern 3: Registry Auto-Update (CUSTOM-03)

**What:** After the agent file is written, update `agent-registry.md` Section 1 catalog to include the new agent so it appears in recommendations.

**When to use:** Always — runs after validation passes and file is written.

**The agent-registry.md Section 1 catalog is a markdown table per division.** The update appends a new row to the appropriate division table (or creates a new division table for `custom`).

Row format (matching existing pattern):

```markdown
| {agent-id} | `agency-agents/{division}/{agent-id}.md` | {specialty description} | {tag1}, {tag2}, {tag3} |
```

**Important:** The registry also has a `TOTAL_AGENTS` constant in workflow-common.md Division Constants section. This does NOT need updating — it counts the 51 built-in agents and custom agents are tracked separately.

**Where custom agents appear in the recommendation algorithm:** Section 3, Step 1 (Parse Task Description) and Step 2 (Match Agents to Task Types) — these operate on the full catalog, so adding rows to Section 1 makes custom agents automatically eligible for recommendations. No algorithm changes needed.

### Pattern 4: Command Structure (modeled on start.md, plan.md)

**What:** The `/agency:agent` command entry point.

**Structure:**

```yaml
---
name: agency:agent
description: Create a new agent personality through a guided workflow
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion]
---

<objective>
Guide the user through an adaptive conversation to define a new agent personality.
Validate the schema, generate the agent .md file, and register the new agent
in the agent-registry so it appears in future planning recommendations.
</objective>

<execution_context>
@./.claude/skills/agency/workflow-common.md
@./.claude/skills/agency/agent-registry.md
@./.claude/skills/agency/agent-creator.md
</execution_context>

<context>
[list existing agent examples for reference]
</context>

<process>
[step-by-step process wiring the agent-creator skill]
</process>
```

### Anti-Patterns to Avoid

- **Don't create a separate "custom registry" file.** Custom agents must live in agent-registry.md Section 1 alongside built-in agents. A separate file would be ignored by the recommendation algorithm.
- **Don't require the user to write YAML manually.** The guided conversation generates the frontmatter. Users who are not familiar with YAML should not need to touch it.
- **Don't skip validation before file write.** Invalid frontmatter causes agent files to be ignored by Claude Code. Validate first, write after validation passes.
- **Don't use a fixed-question form.** Model the creation flow on questioning-flow.md — adaptive, 5-8 exchanges, infer where possible.
- **Don't add a new `/agency:` command for listing agents.** The registry already provides this. `/agency:quick list agents` covers ad-hoc needs.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Agent name uniqueness check | Custom deduplication logic | `Grep` tool across `agency-agents/**/*.md` for existing `name:` values | One grep catches all 51 built-in agents and any previously created custom agents |
| Division directory discovery | Directory traversal code | `Bash ls agency-agents/` | Direct filesystem listing is simpler and always current |
| Validation error formatting | Custom error display format | Follow the existing AskUserQuestion error pattern from plan.md | Consistent user experience |
| Registry row formatting | Custom template engine | Inline string formatting matching the existing table pattern in agent-registry.md | The table format is simple enough to construct directly |
| Agent file template | External template files | Inline template in agent-creator.md, similar to how phase-decomposer.md embeds the plan file template | Avoids a new template file dependency; keeps the skill self-contained |

**Key insight:** The agent file format is simple markdown with YAML frontmatter — the same format Claude Code already handles natively. There is no complex serialization or deserialization needed.

---

## Common Pitfalls

### Pitfall 1: Name Collision with Built-in Agents

**What goes wrong:** A user creates an agent with the same `name` as a built-in agent (e.g., `name: engineering-senior-developer`). The agent-registry now has two rows with the same ID, causing unpredictable recommendation behavior.

**Why it happens:** The `name` field in frontmatter is not automatically enforced for uniqueness.

**How to avoid:** Before writing the agent file, grep for the proposed name across all existing agent files. If a match is found, prompt the user to choose a different name.

**Warning signs:** Registry Section 1 has duplicate rows after an agent creation run.

**Verification bash command:**
```bash
grep -r "^name: ${proposed_name}$" agency-agents/
```

### Pitfall 2: Agent Placed Outside `agency-agents/` Directory

**What goes wrong:** User or skill puts the new agent file in a project-local directory or the wrong path. The agent-registry row points to the wrong file. Agent spawn fails because the file doesn't exist at the expected path.

**Why it happens:** The personality injection pattern in workflow-common.md reads from `agency-agents/{division}/{agent-id}.md`. If the file is elsewhere, the read fails silently (or the agent spawns without a personality).

**How to avoid:** Always construct the output path from the division choice, not from free-form user input. Verify the file exists after writing.

**Warning signs:** After creation, `test -f agency-agents/{division}/{agent-id}.md` returns non-zero.

### Pitfall 3: Task Type Tags Don't Match Registry Taxonomy

**What goes wrong:** The user provides tags like `"writing"`, `"creative"`, `"thinking"` that don't appear in the existing agent-registry task type taxonomy. The recommendation algorithm scores the agent zero for relevant tasks.

**Why it happens:** The recommendation algorithm in Section 3 matches against existing task type tags from the catalog. Novel tags that don't appear elsewhere in the registry never match.

**How to avoid:** During Stage 3 of the guided conversation, present the user with existing task type tags from the registry as examples. Encourage use of existing tags where applicable, with the option to add new tags for genuinely novel capabilities.

**Warning signs:** New agent never appears in `/agency:plan` recommendations despite relevant phases.

### Pitfall 4: Body Content Too Thin

**What goes wrong:** The generated agent `.md` body is a skeletal template with placeholder text. When spawned, the agent lacks a real personality and behaves generically.

**Why it happens:** The creation conversation captures structured data but doesn't generate rich prose for the agent body.

**How to avoid:** The agent-creator skill must generate a substantive body from the conversation responses — not just fill in a template with one-liners. Use the user's stated capabilities, personality traits, and hard rules to produce detailed sections (identity, mission, critical rules, process, success criteria). Minimum 50 lines.

### Pitfall 5: Registry Update Written to Wrong Section

**What goes wrong:** The new agent row is appended at the end of agent-registry.md rather than inside the correct division table. This breaks the table structure and may corrupt the markdown.

**Why it happens:** Appending to a markdown table requires finding the right table and inserting before its closing delimiter.

**How to avoid:** Use `Grep` to locate the division table heading (e.g., `### Engineering Division`), then use `Edit` to insert the new row at the correct position within that table. If the division is new (e.g., `custom`), append a new complete table section after the last existing division.

---

## Code Examples

Verified patterns from reading existing project files.

### Frontmatter Schema (verified from existing agents)

```yaml
---
name: custom-example-agent
description: Expert specialist in [domain] focusing on [primary capability] and [secondary capability]
color: blue
---
```

For agents that need specific tools:
```yaml
---
name: custom-research-agent
description: Expert research specialist for [domain] analysis
tools: WebFetch, WebSearch, Read, Write
color: purple
---
```

Source: reading `agency-agents/` across all 9 divisions.

### Registry Catalog Row Format (verified from agent-registry.md Section 1)

```markdown
| custom-example-agent | `agency-agents/custom/custom-example-agent.md` | Expert specialist in [domain] with primary focus on [capability] | tag-one, tag-two, tag-three |
```

Source: `agent-registry.md` Section 1 — all 51 rows follow this exact pattern.

### Uniqueness Check Pattern

```bash
# Check if proposed agent name already exists
grep -rl "^name: custom-example-agent" C:/Users/dasbl/Documents/agency-agents/agency-agents/
# If output is non-empty, name is taken — prompt for a new one
```

Source: derived from the `grep` verification patterns established in phase 9 plan files.

### Registry Section Insert via Edit

When inserting a new row into an existing division table in `agent-registry.md`, use the `Edit` tool's search-and-replace to insert before the closing blank line of the table section:

```
Find the last row of the target division table.
Use Edit to append the new row immediately after it.
```

Source: the `Edit` tool pattern established across all prior plan files.

### Guided Flow for Agent Creation (conversation template)

```markdown
## Stage 1: Identity

"What kind of specialist do you want to add?
 Give me the one-liner — what does this agent do?"

→ Extract: specialty, domain, differentiator
→ Infer: division (engineering/design/marketing/etc.), suggested name

Confirm:
"I'll create a {division} agent — '{suggested-name}'.
 Specialty: {description}
 Correct, or would you like to adjust?"

## Stage 2: Capabilities

"What are the top 3-5 things this agent can do that others can't?"
"How does this agent think and communicate? What's its personality?"
"Are there any hard rules it always follows?"

→ Capture: capability list, personality traits, critical rules

Summary confirm:
"Here's the agent I'll create:
 - Division: {division}
 - Name: {name}
 - Capabilities: {list}
 - Personality: {traits}
 - Hard rules: {rules}
 Anything to adjust?"

## Stage 3: Registry Tags

"For recommendations to work, I need 3-5 task type tags.
 Based on your agent's capabilities, I suggest: {tag1}, {tag2}, {tag3}
 These match existing registry tags. Add or remove any?"

→ Confirm tags
→ Generate and show agent file + registry row
→ Write files
```

Source: modeled on `questioning-flow.md` Sections 2-3 and `phase-decomposer.md` Section 5.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manually writing agent `.md` files | Guided workflow with schema validation | Phase 10 (this phase) | Removes friction for non-technical users; catches invalid frontmatter before it causes silent failures |
| Agent recommendations limited to 51 built-in agents | Registry dynamically includes custom agents | Phase 10 (this phase) | Users can extend Agency for domain-specific work |

**Deprecated/outdated:**
- Manually editing agent-registry.md to add custom agents: error-prone, no validation. Replaced by the `agent-creator` skill workflow.

---

## Open Questions

1. **Where do custom agents live — project-local vs. global?**
   - What we know: All 51 built-in agents are in `agency-agents/` in the project repo. The portfolio registry lives globally at `~/.claude/agency/`. Memory lives in `.planning/memory/`.
   - What's unclear: Should custom agents be project-scoped (`agency-agents/custom/`) or global (`~/.claude/agency/custom-agents/`)? Project-scoped agents won't appear in other Agency projects. Global agents won't be version-controlled with the project.
   - Recommendation: Default to project-scoped (`agency-agents/custom/` or within an existing division). This is consistent with how all built-in agents work. Users wanting to share agents across projects can copy them manually. The planner should decide, but project-scoped is the safer default.

2. **How does the registry handle custom agents when the agent-registry.md file is large?**
   - What we know: `agent-registry.md` is already 300 lines. Adding more rows is fine — the file is read in full by command execution contexts.
   - What's unclear: Is there a practical limit? At what point does a 600-line agent-registry.md affect context window budget?
   - Recommendation: For Phase 10, there's no issue — custom agents are added one at a time and the total count will remain manageable. No special handling needed.

3. **Should `/agency:agent` support editing or deleting existing agents?**
   - What we know: CUSTOM-01 through CUSTOM-03 only mention creation, validation, and registry integration. No CRUD requirement beyond creation.
   - What's unclear: Users will eventually want to update or retire custom agents.
   - Recommendation: Phase 10 scope is creation only, consistent with the REQUIREMENTS.md checklist. Edit/delete can be a future requirement (CUSTOM-04 etc.). Keep the command focused.

4. **How should the command name be structured — `/agency:agent` or `/agency:create-agent`?**
   - What we know: Existing commands are `/agency:start`, `/agency:plan`, `/agency:build`, `/agency:review`, `/agency:status`, `/agency:quick`, `/agency:portfolio`, `/agency:milestone`. All are single-word nouns or verbs.
   - Recommendation: `/agency:agent` as the command, with an implied "create" action. This is consistent with the single-word command style. The help text makes the purpose clear.

---

## Sources

### Primary (HIGH confidence)

- Project source: `agency-agents/` directory — all 51 agent files read for schema analysis (confirmed frontmatter fields, body patterns, division organization)
- Project source: `.claude/skills/agency/agent-registry.md` — catalog format, recommendation algorithm, task type taxonomy (confirmed row format, scoring rules)
- Project source: `.claude/skills/agency/workflow-common.md` — state file locations, personality injection pattern, plan file conventions (confirmed all state paths)
- Project source: `.claude/skills/agency/questioning-flow.md` — adaptive conversation engine pattern (confirmed 3-stage structure, AskUserQuestion usage)
- Project source: `.claude/skills/agency/phase-decomposer.md` — skill authoring patterns, plan file template, validation patterns (confirmed section structure, verification bash commands)
- Project source: `.claude/skills/agency/memory-manager.md` — most recent new skill for structural reference (confirmed skill file format, section organization)
- Project source: `.claude/commands/agency/start.md` and `plan.md` — command file structure (confirmed frontmatter, execution_context, process step format)

### Secondary (MEDIUM confidence)

- Project source: `.planning/phases/09-cross-session-learning/09-CONTEXT.md` — established "What Already Exists" baseline for the Phase 10 context file
- Project source: `.planning/STATE.md`, `REQUIREMENTS.md`, `ROADMAP.md` — Phase 10 requirements and project decisions

### Tertiary (LOW confidence)

- None — all findings are based on direct project source reading.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all conventions derived from reading existing project files directly
- Architecture: HIGH — patterns for skill creation, command wiring, and registry updates are well-established across 9 prior phases
- Pitfalls: HIGH — derived from reading the actual agent files and registry; the uniqueness and path pitfalls are directly observable in the codebase
- Schema validation rules: HIGH — derived from reading all 51 agent files

**Research date:** 2026-03-01
**Valid until:** Stable — this research is based on the project's own source files, not external libraries. Valid as long as the existing skill/command patterns don't change.
