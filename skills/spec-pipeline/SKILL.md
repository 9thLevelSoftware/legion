---
name: legion:spec-pipeline
description: Pre-coding specification pipeline that produces structured spec documents through 5 stages
triggers: [spec, specification, requirements, gather, research, pre-coding]
token_cost: high
summary: "5-stage pre-coding pipeline: gather requirements, research domain, write spec, critique, assess complexity. Produces .planning/specs/ documents consumed by plan and build commands."
---

# Spec Pipeline

Pre-coding specification pipeline that produces a structured spec document before implementation begins. Adapted from Auto-Claude's multi-stage spec pipeline, adapted for Legion's personality-first agent model and human-readable state conventions.

Can be invoked standalone (before `/legion:plan`) or offered as an optional step during `/legion:plan` (step 3.6). Output is written to `.planning/specs/{NN}-{phase-slug}-spec.md`, where `{NN}` is the zero-padded phase number and `{phase-slug}` follows the phase slug convention from workflow-common-core.

The 5 stages run sequentially: gather requirements, research domain, write spec, critique spec, assess complexity. Each stage has defined inputs, process, and outputs that feed the next stage.

## Activation trigger (concrete — no "when appropriate")

Run this pipeline ONLY when at least one of the following conditions holds. Spec writing is expensive; never invoke speculatively.

1. The user passed `--spec` to `/legion:plan` or invoked the pipeline directly from `/legion:quick`.
2. The phase's CONTEXT.md YAML frontmatter declares `spec_required: true`.
3. The phase has at least 4 requirement IDs AND the phase.complexity field in ROADMAP.md is `high` — automatically offer (user confirmation required before running) but do not auto-run.
4. The phase touches a new architectural surface (no prior SUMMARY.md under `.planning/phases/` references any file in the phase's `files_modified` list) AND at least one of: requirement count ≥ 3, estimated plans ≥ 3.

If none of the above hold: SKIP this pipeline. Proceed with standard phase decomposition.

---

## Section 1: Gather Requirements

Extract and organize all requirements for the target phase into a structured summary.

```
Input:
  - .planning/ROADMAP.md — phase details (goal, requirements list, success criteria)
  - .planning/REQUIREMENTS.md — full requirement descriptions (if exists)
  - .planning/PROJECT.md — project constraints, architecture notes, value proposition

Output:
  Structured requirements summary with categorized items

Process:

Step 1: Read ROADMAP.md
  Find the Phase Details section for the target phase number.
  Extract:
  - phase_name: descriptive name
  - phase_goal: the Goal field
  - phase_requirements: list of requirement IDs
  - success_criteria: the Success Criteria list
  - dependencies: which prior phases this phase depends on

Step 2: Expand requirements
  If .planning/REQUIREMENTS.md exists:
    For each requirement ID in phase_requirements, extract the full description,
    acceptance criteria, and any notes from REQUIREMENTS.md.
  If REQUIREMENTS.md is absent (between milestones):
    Use ROADMAP.md requirement summaries. Note the limitation.

Step 3: Read project constraints
  From PROJECT.md, extract:
  - Architecture constraints (tech stack, patterns, conventions)
  - Non-functional requirements (performance, accessibility, compatibility)
  - User-facing constraints (target users, use cases)

Step 4: Categorize requirements
  Group all extracted requirements into:

  | Category | Description | Examples |
  |----------|-------------|---------|
  | Functional | What the system must do | "Spawn 2-3 agents with different philosophies" |
  | Non-functional | Quality attributes and constraints | "Max 3 tasks per plan", "Progressive disclosure" |
  | Dependencies | What must exist before this phase | "Phase 29 output (frontmatter schema)" |
  | Deliverables | Concrete files/artifacts produced | "skills/spec-pipeline/SKILL.md" |

Step 5: Identify success criteria
  For each requirement, derive a testable success criterion:
  - What file exists?
  - What string is present?
  - What command returns success?
  - What user-facing behavior changes?

  If the ROADMAP.md success criteria are vague, sharpen them into
  machine-checkable statements (same standard as phase-decomposer
  Section 6 verification lines).

Output format:

  ## Requirements Summary — Phase {N}: {phase_name}

  **Goal:** {phase_goal}
  **Dependencies:** {prior phases}

  ### Functional Requirements
  | ID | Description | Acceptance Criteria |
  |----|-------------|-------------------|
  | {REQ-ID} | {description} | {testable criterion} |

  ### Non-Functional Requirements
  | Constraint | Source | Impact |
  |-----------|--------|--------|
  | {constraint} | {PROJECT.md / ROADMAP.md} | {how it affects implementation} |

  ### Deliverables
  | Artifact | Path | Purpose |
  |----------|------|---------|
  | {name} | {file path} | {what it provides} |
```

---

## Section 2: Research Domain

Identify knowledge gaps and research the codebase and domain to fill them.

```
Input:
  - Section 1 output (structured requirements summary)
  - .planning/CODEBASE.md (if exists — brownfield context)
  - Existing skill/command files relevant to this phase

Output:
  Research brief with findings, open questions, and recommended approaches

Process:

Step 1: Identify knowledge gaps
  For each deliverable from Section 1:
  a. Does an existing file need modification? → Read it to understand current structure
  b. Does a new file follow an existing pattern? → Find and read the pattern source
  c. Does the requirement reference an unfamiliar concept? → Flag as research needed
  d. Does the requirement depend on external behavior? → Flag for verification

  Produce a gap list:
  | Gap | Type | Resolution Strategy |
  |-----|------|-------------------|
  | {what's unknown} | Pattern / Technical / Domain | {how to resolve} |

Step 2: Search existing codebase
  For each gap with resolution strategy "Pattern" or "Technical":
  a. Search for similar patterns in existing skill files
  b. Read relevant command files for workflow patterns
  c. Check prior phase outputs (.planning/phases/) for reusable approaches
  d. If .planning/CODEBASE.md exists, check its Conventions and Risk Areas sections

  Record findings:
  | Gap | Source File | Finding |
  |-----|-----------|---------|
  | {gap} | {file path} | {what was found} |

Step 3: Spawn research agents (conditional)
  Only when the phase involves unfamiliar technology, patterns outside
  the existing codebase, or complex domain knowledge:

  a. Spawn 1-2 read-only (Explore) agents with specific research questions
  b. Each agent receives:
     - The requirements summary from Section 1
     - Their specific research question(s)
     - Instructions to return structured findings
  c. Agent selection: prefer agents with domain expertise
     (e.g., engineering-senior-developer for architecture research,
      design-ux-researcher for UX domain research)

  For most Legion phases (skill/command/agent work), the orchestrator
  handles research directly. Skip agent spawning.

Step 4: Compile research brief
  Merge all findings into a structured brief:

  ## Research Brief — Phase {N}: {phase_name}

  ### Findings
  | Topic | Source | Summary |
  |-------|--------|---------|
  | {topic} | {file or agent} | {1-2 sentence finding} |

  ### Patterns to Follow
  - {pattern name}: {source file} — {how it applies}

  ### Open Questions
  - {question that could not be resolved by research}
  - {question that needs user decision}

  ### Recommended Approaches
  For each major deliverable:
  - **{deliverable}**: {recommended approach based on research}
    Rationale: {why this approach, what evidence supports it}
```

---

## Section 3: Write Spec

Produce a structured specification document from requirements and research.

```
Input:
  - Section 1 output (requirements summary)
  - Section 2 output (research brief)

Output:
  Spec document at .planning/specs/{NN}-{phase-slug}-spec.md

Process:

Step 1: Create specs directory (if needed)
  mkdir -p .planning/specs/

Step 2: Draft spec document
  Write the spec to .planning/specs/{NN}-{phase-slug}-spec.md using
  the following structure:

  ---BEGIN SPEC TEMPLATE---

  # Spec: Phase {N} — {phase_name}

  ## Overview
  {1-paragraph summary of what will be built and why. Reference the phase
  goal and connect it to the broader milestone/project context.}

  ## Requirements
  | ID | Description | Priority | Acceptance Criteria |
  |----|-------------|----------|-------------------|
  | {REQ-ID} | {description} | {Must/Should/Could} | {testable criterion} |

  ## Architecture
  {How the deliverables fit together. Key design decisions with rationale.
  File relationships and data flow between artifacts. Reference patterns
  identified in Section 2 research.}

  ### Key Decisions
  | Decision | Choice | Rationale | Alternatives Considered |
  |----------|--------|-----------|----------------------|
  | {decision} | {what was chosen} | {why} | {what else was considered} |

  ## Deliverables
  {For each deliverable:}

  ### {Deliverable Name}
  - **Path:** {file path}
  - **Purpose:** {what it provides}
  - **Key Content:** {sections, structure, or API surface}
  - **Dependencies:** {what it needs from other deliverables or prior phases}
  - **Estimated Size:** {approximate line count or complexity}

  ## Open Questions
  {Unresolved items from research. Items needing user decision.
  Each question should note its impact: "Blocking" (must resolve before
  planning) or "Deferrable" (can resolve during implementation).}

  | # | Question | Impact | Default if Unresolved |
  |---|----------|--------|---------------------|
  | 1 | {question} | Blocking / Deferrable | {what happens if not answered} |

  ## Complexity Assessment
  {Left empty — filled in by Section 5}

  ---END SPEC TEMPLATE---

Step 3: Validate spec completeness
  Before moving to Section 4, check:
  - [ ] Every requirement from Section 1 appears in the Requirements table
  - [ ] Every deliverable has a defined path and purpose
  - [ ] Architecture section explains how deliverables connect
  - [ ] Key decisions have rationale (not arbitrary choices)
  - [ ] Open questions are categorized as Blocking or Deferrable

  The spec is a draft at this stage — Section 4 will critique it.

---

Step 3.5: Validate deliverable paths against directory mappings (ENV-03)

Before finalizing the spec, validate that all deliverable paths follow the
project's established directory structure.

3.5.1: Load directory mappings

Check if `.planning/config/directory-mappings.yaml` exists:
- If yes: Load mappings and enforcement configuration
- If no: Skip path validation (greenfield or no analysis yet)

3.5.2: Validate each deliverable path

For each deliverable in the Deliverables section:

a. Determine the expected category for the file:
   - Infer from file extension and naming patterns:
     - `.test.{ext}` or `.spec.{ext}` → tests category
     - `*Route*`, `*Controller*` in routes dir → routes category
     - `*Component*`, `.tsx`, `.jsx` in components dir → components category
     - `*Service*`, business logic files → services category
     - `*util*`, `*helper*` → utils category
     - `interface`, `type` declarations → types category
     - `middleware`, `plugin` → middleware category
   - Check if the deliverable description mentions a category
   - Default to "general" if no category can be inferred

b. Look up the expected directory for the category:
   - Find the category in directory-mappings.yaml mappings section
   - Get the primary path (first path in paths list)
   - Note the priority level (explicit/inferred/default)

c. Validate the deliverable path:
   - Extract directory from the deliverable path
   - Check if it matches any of the allowed paths for the category
   - If strictness = strict: path must match exactly
   - If strictness = warn: mismatch generates warning but allows override
   - If strictness = off: skip validation

d. Generate suggestions for violations:
   - If path doesn't match category, suggest correct paths:
     ```
     Path violation detected for {deliverable}:
       Current: {current_path}
       Expected: One of {allowed_paths} for {category} category
       Suggested: {primary_path}/{filename}
     ```

3.5.3: Handle validation results

Collect all validation results:

| Deliverable | Path | Category | Valid | Issues |
|-------------|------|----------|-------|--------|
| {name} | {path} | {category} | {yes/no} | {issues} |

Action based on strictness and violations:

- strict + violations: Block spec finalization, require fixes
  "Path violations must be resolved before proceeding. Update deliverable 
   paths to match directory mappings, or add exceptions to enforcement rules."

- warn + violations: Add warnings to spec, allow proceeding
  Add "## Path Validation Warnings" section to spec with violation details

- no violations: Add "All deliverable paths validated successfully" note

3.5.4: Allow explicit overrides

Users can override path enforcement per deliverable:

In the Deliverables section, add override notation:
```markdown
### {Deliverable Name}
- **Path:** {file path}
- **Path Override:** true
- **Override Reason:** {explanation}
```

When override is present, skip validation for that deliverable and note:
"Path override accepted for {deliverable}: {reason}"

3.5.5: Add Path Validation section to spec

Insert into the spec document template in the Deliverables section:

```markdown
## Path Validation

**Status:** {All paths valid | {N} warnings | {N} violations blocked}

| Deliverable | Path | Category | Valid | Notes |
|-------------|------|----------|-------|-------|
| {name} | {path} | {category} | {yes/no} | {notes} |

{If warnings or overrides present:}
### Warnings/Overrides
- {deliverable}: {warning or override reason}
```
```

---

## Section 4: Critique Spec

Apply a critical review pass to identify gaps, weak reasoning, and implicit assumptions.

```
Input:
  - Section 3 spec document

Output:
  Critique findings with specific revision recommendations.
  Updated spec document with revisions applied.

Process:

Step 1: Review for requirement coverage
  For each requirement in the spec's Requirements table:
  a. Is there a deliverable that addresses this requirement?
  b. Is the acceptance criteria testable (can you write a bash command for it)?
  c. Are there edge cases the spec doesn't address?

  Flag gaps:
  | Requirement | Issue | Recommendation |
  |-------------|-------|---------------|
  | {REQ-ID} | {gap or issue} | {specific fix} |
  
  Additional checklist for path validation:
  - [ ] All deliverable paths validated against directory mappings (or overrides documented)

Step 2: Review architecture decisions
  For each decision in the Key Decisions table:
  a. Is the rationale specific to this phase (not generic hand-waving)?
  b. Were alternatives genuinely considered or just listed?
  c. Does the choice align with project conventions (from PROJECT.md)?
  d. Would a different choice meaningfully change the deliverables?

  Flag weak decisions:
  | Decision | Issue | Recommendation |
  |----------|-------|---------------|
  | {decision} | {why it's weak} | {how to strengthen} |

Step 3: Review deliverable specifications
  For each deliverable:
  a. Is it concrete enough for an agent to implement without guessing?
  b. Are dependencies on other deliverables explicit?
  c. Is the estimated size reasonable for the described content?
  d. Are there files the deliverable should modify that aren't listed?

Step 4: Hunt implicit assumptions
  Apply the same assumption extraction technique as plan-critique
  Section 2 (Assumption Hunting):
  a. Technical assumptions (file formats, tool behavior, path resolution)
  b. Dependency assumptions (prior phase outputs, skill availability)
  c. Scope assumptions (no other files need changes, edge cases don't apply)

  List assumptions with impact ratings:
  | Assumption | Impact | Evidence | Action |
  |-----------|--------|----------|--------|
  | {assumption} | High/Med/Low | Strong/Moderate/Weak | {verify or accept} |

Step 5: Agent-assisted critique (conditional)
  For complex phases (3+ requirements, architectural choices):
  - Optionally spawn a skeptical agent using the read-only Explore
    subagent type (same pattern as plan-critique Section 4)
  - Preferred agents: testing-qa-verification-specialist, product-sprint-prioritizer
  - Agent receives the spec document and returns structured critique

  For simple phases:
  - The orchestrator self-critiques using Steps 1-4 above

Step 6: Revise spec
  Apply critique findings to the spec document:
  a. Fill coverage gaps (add missing deliverables or acceptance criteria)
  b. Strengthen weak decisions (add real rationale or change the decision)
  c. Make deliverables more concrete (add structure details, key content)
  d. Convert high-impact/weak-evidence assumptions into Open Questions
  e. Note applied revisions at the bottom of the spec:

  ## Revision History
  | # | Section | Change | Reason |
  |---|---------|--------|--------|
  | 1 | {section} | {what changed} | {critique finding that triggered it} |
```

---

## Section 5: Assess Complexity

Estimate phase complexity to inform plan structure and recommend next steps.

```
Input:
  - Revised spec from Section 4

Output:
  Complexity rating and recommendation added to spec document's
  "Complexity Assessment" section

Process:

Step 1: Count and categorize deliverables
  From the spec's Deliverables section:
  | Category | Count | Examples |
  |----------|-------|---------|
  | New file | {N} | {files being created from scratch} |
  | Modification | {N} | {existing files being updated} |
  | Config change | {N} | {configuration or metadata updates} |

Step 2: Estimate dependency depth
  Analyze deliverable dependencies to estimate wave structure:
  - How many deliverables have no dependencies? (Wave 1 candidates)
  - How many depend on Wave 1 outputs? (Wave 2 candidates)
  - Is there a third layer? (Wave 3 — rare)

  Estimated waves: {1-3}

Step 3: Rate overall complexity

  | Rating | Criteria | Plan Estimate |
  |--------|----------|--------------|
  | Simple | 1-2 requirements, ≤3 deliverables, 1 wave | 1 plan likely |
  | Medium | 2-3 requirements, 3-5 deliverables, 1-2 waves | 2 plans |
  | Complex | 4+ requirements, 5+ deliverables, 2+ waves, architectural choices | 3+ plans |

Step 4: Recommend competing architecture proposals
  Based on complexity rating, recommend whether PLN-01 (competing
  architecture proposals in /legion:plan step 3.5) would add value:

  | Complexity | Recommendation | Rationale |
  |-----------|---------------|-----------|
  | Simple | Skip proposals | Low risk, one obvious approach |
  | Medium | Optional | Offer but default to skip |
  | Complex | Recommended | Multiple valid approaches, worth exploring trade-offs |

Step 5: Write assessment to spec
  Fill in the spec document's "Complexity Assessment" section:

  ## Complexity Assessment

  **Rating:** {Simple / Medium / Complex}

  | Metric | Value |
  |--------|-------|
  | Requirements | {count} |
  | Deliverables | {count} (new: {N}, modify: {N}, config: {N}) |
  | Estimated waves | {N} |
  | Estimated plans | {N} |
  | Competing proposals | {Recommended / Optional / Skip} |

  **Rationale:** {1-2 sentences explaining the rating}

  **Recommended next step:** {Run /legion:plan with or without proposals}
```

---

## Section 6: Integration Points

How the spec pipeline connects with other Legion workflows.

| Workflow | Integration | Direction |
|----------|------------|-----------|
| `/legion:plan` | Offers spec pipeline as optional step 3.6. Spec output feeds into phase decomposition (step 4) as additional context for deliverable identification. | Plan reads spec |
| `/legion:build` | Agents can reference the spec document for implementation guidance. Spec path included in plan `<context>` blocks. | Build reads spec |
| `plan-critique` | Spec critique (Section 4) reuses the same skeptical-agent pattern and read-only Explore spawning from plan-critique Section 4. | Shared pattern |
| `workflow-common` | Spec documents stored at `.planning/specs/{NN}-{phase-slug}-spec.md`. Registered in State File Locations table and Command-to-Skill Mapping. | Registration |
| `phase-decomposer` | If a spec exists when decomposition begins, deliverables and architecture from the spec document supplement ROADMAP.md requirements. | Decomposer reads spec |

### Spec Document Lifecycle

```
Absent → Created (Section 3) → Critiqued (Section 4) → Assessed (Section 5) → Consumed (by plan/build)
```

- **Absent**: No spec exists. All workflows function identically (standard planning from ROADMAP.md).
- **Created**: Section 3 writes the initial draft.
- **Critiqued**: Section 4 revises based on findings.
- **Assessed**: Section 5 adds complexity rating.
- **Consumed**: `/legion:plan` and `/legion:build` reference the spec for richer context.

### Graceful Degradation

Spec pipeline follows the same degradation pattern as all Legion optional features:
1. Check if `.planning/specs/{NN}-{phase-slug}-spec.md` exists
2. If yes: use spec data to enhance planning and execution context
3. If no: skip silently — plan from ROADMAP.md requirements directly
4. Never error, never block, never require a spec for workflow completion

---

## Section 7: Standalone Invocation

How to run the spec pipeline outside of `/legion:plan`.

### Invocation

The spec pipeline can be invoked on a specific phase number independently of the plan command. All 5 stages execute sequentially. The user can run this before planning to front-load specification work, or re-run it to update a spec after requirements change.

### Process

```
Step 1: Parse phase number
  Read the target phase number from user input.
  Validate: phase must exist in ROADMAP.md.

Step 2: Check for existing spec
  Look for .planning/specs/{NN}-{phase-slug}-spec.md
  If exists:
    Inform user: "Spec document already exists for Phase {N}."
    Ask: "Overwrite or keep existing?"
    - "Overwrite" — proceed with full pipeline, replace existing spec
    - "Keep existing" — abort, suggest reviewing the existing spec

Step 3: Execute all 5 stages
  Run Sections 1-5 sequentially:
  1. Gather Requirements → structured requirements summary
  2. Research Domain → research brief with findings
  3. Write Spec → draft spec at .planning/specs/{NN}-{phase-slug}-spec.md
  4. Critique Spec → revised spec with findings applied
  5. Assess Complexity → complexity rating added to spec

Step 4: Present results
  Display to user:

  ## Spec Pipeline Complete — Phase {N}: {phase_name}

  **Rating:** {Simple / Medium / Complex}
  **Deliverables identified:** {count}
  **Open questions:** {count}
  **Competing proposals recommended:** {Yes / No}

  Spec document written to: .planning/specs/{NN}-{phase-slug}-spec.md

  **Next step:** Run `/legion:plan {N}` to decompose into executable plans.
  {If competing proposals recommended:}
  The plan command will offer competing architecture proposals for this phase.
```

### Re-running After Requirement Changes

When requirements change (new REQUIREMENTS.md entries, updated ROADMAP.md phase details), re-run the spec pipeline on the same phase:
- The pipeline reads fresh requirements from ROADMAP.md and REQUIREMENTS.md
- If a spec already exists, the user is prompted to overwrite or keep
- The new spec replaces the old one — no merge, no diff
- Plans generated from the old spec are not automatically updated; re-plan with `/legion:plan {N}` after spec update

---

## Section 8: Path Enforcement Utilities (ENV-03)

Helper functions and patterns for path validation against directory mappings.

### 8.1: Category Inference

Infer the directory category from file characteristics:

```
inferCategory(filePath, fileDescription):
  # Test files
  if matches(filePath, "**/*.test.*") or matches(filePath, "**/*.spec.*"):
    return "tests"
  if contains(fileDescription, ["test", "spec", "fixture"]):
    return "tests"
  
  # Routes / API endpoints
  if matches(filePath, "**/routes/**") or contains(fileDescription, ["route", "endpoint", "api", "handler"]):
    return "routes"
  if matches(filePath, "**/pages/api/**"):
    return "routes"
  
  # Components
  if matches(filePath, "**/components/**") or matches(filePath, "**/*.tsx"):
    return "components"
  if contains(fileDescription, ["component", "UI", "widget", "view"]):
    return "components"
  
  # Services
  if matches(filePath, "**/services/**") or contains(fileDescription, ["service", "business logic", "domain"]):
    return "services"
  
  # Utils
  if matches(filePath, "**/utils/**") or matches(filePath, "**/helpers/**"):
    return "utils"
  if contains(fileDescription, ["util", "helper", "common", "shared"]):
    return "utils"
  
  # Types
  if matches(filePath, "**/types/**") or matches(filePath, "**/interfaces/**"):
    return "types"
  if matches(filePath, "**/*.d.ts") or contains(fileDescription, ["type", "interface", "model", "schema"]):
    return "types"
  
  # Config
  if matches(filePath, "**/config/**") or contains(fileDescription, ["config", "settings", "environment"]):
    return "config"
  
  # Middleware
  if matches(filePath, "**/middleware/**") or contains(fileDescription, ["middleware", "plugin", "interceptor"]):
    return "middleware"
  
  # Assets
  if matches(filePath, "**/public/**") or matches(filePath, "**/assets/**"):
    return "assets"
  if contains(fileDescription, ["asset", "static", "image", "font", "resource"]):
    return "assets"
  
  # Styles
  if matches(filePath, "**/styles/**") or matches(filePath, "**/*.css") or matches(filePath, "**/*.scss"):
    return "styles"
  if contains(fileDescription, ["style", "CSS", "theme", "stylesheet"]):
    return "styles"
  
  # Hooks / Composables
  if matches(filePath, "**/hooks/**") or matches(filePath, "**/composables/**"):
    return "hooks"
  if contains(fileDescription, ["hook", "composable", "use*"]):
    return "hooks"
  
  # Stores / State
  if matches(filePath, "**/stores/**") or matches(filePath, "**/state/**"):
    return "stores"
  if contains(fileDescription, ["store", "state", "redux", "pinia", "mobx"]):
    return "stores"
  
  # Default
  return "general"
```

### 8.2: Path Validation

Validate a path against directory mappings:

```
validatePath(filePath, category, mappings, strictness):
  # Get allowed paths for category
  categoryConfig = mappings.mappings[category]
  if not categoryConfig:
    return { valid: true, note: "No mappings for category '{category}'" }
  
  allowedPaths = categoryConfig.paths
  
  # Extract directory from filePath
  fileDir = dirname(filePath)
  
  # Check if fileDir matches any allowed path
  for allowedPath in allowedPaths:
    if fileDir.startsWith(allowedPath) or allowedPath.startsWith(fileDir):
      return { 
        valid: true, 
        matchedPath: allowedPath,
        priority: categoryConfig.priority 
      }
  
  # No match found
  suggestion = join(allowedPaths[0], basename(filePath))
  
  if strictness == "strict":
    return { 
      valid: false, 
      violation: true,
      message: "Path '{filePath}' is not in allowed directories for '{category}'",
      allowedPaths: allowedPaths,
      suggestion: suggestion,
      action: "block"
    }
  else if strictness == "warn":
    return { 
      valid: true, 
      warning: true,
      message: "Path '{filePath}' is not in recommended directories for '{category}'",
      allowedPaths: allowedPaths,
      suggestion: suggestion,
      action: "warn"
    }
  else:
    return { valid: true, note: "Validation disabled (strictness: off)" }
```

### 8.3: Integration Reference

| Function | Input | Output | Used In |
|----------|-------|--------|---------|
| `inferCategory()` | filePath, description | category string | Step 3.5.2a |
| `validatePath()` | filePath, category, mappings, strictness | validation result | Step 3.5.2c |
| `generateSuggestion()` | filePath, allowedPaths | suggested path | Step 3.5.2d |

### 8.4: Example Validation Flow

```
Deliverable: User API Route
Path: src/utils/user-api.ts
Description: "API endpoint for user operations"

Step 1: inferCategory("src/utils/user-api.ts", "API endpoint for user operations")
→ Returns: "routes" (description contains "API endpoint")

Step 2: Look up mappings for "routes"
→ Found: paths = ["app/routes", "src/routes"], priority = 10

Step 3: validatePath("src/utils/user-api.ts", "routes", mappings, "warn")
→ File dir: "src/utils"
→ Allowed: ["app/routes", "src/routes"]
→ Match: None ("src/utils" != "src/routes")
→ Returns: { valid: true, warning: true, suggestion: "src/routes/user-api.ts" }

Step 4: Generate warning
→ "Warning: src/utils/user-api.ts is in 'utils' but appears to be a route.
     Consider: src/routes/user-api.ts"
```

---

## References

| Pattern | Source | Used In |
|---------|--------|---------|
| 5-stage pipeline structure | Auto-Claude (spec pipeline with gather/research/write/critique/assess) | All 5 sections |
| Requirement extraction | phase-decomposer Section 2 (Phase Analysis) | Section 1 |
| Read-only agent spawning | plan-critique Section 4 (Explore subagent type) | Sections 2, 4 |
| Assumption hunting | plan-critique Section 2 (Assumption Hunting) | Section 4 |
| Complexity assessment | phase-decomposer Section 3 (dependency layer analysis) | Section 5 |
| Graceful degradation | workflow-common conventions (check → use → skip → never block) | Section 6 |
| Spec document template | Adapted from Auto-Claude's output format for Legion's markdown conventions | Section 3 |

## Completion Gate

This skill completes when ALL conditions are met:
1. All 5 pipeline stages have been executed in order: gather → research → write → critique → assess (no stage skipped unless explicitly listed as optional in Section 6)
2. Spec document written to `.planning/phases/{NN}/SPEC.md` (or configured path) with all required sections present: Requirements, Architecture, Deliverables, Key Decisions, Open Questions, Assessment
3. Section 5 acceptance checklist is machine-checkable: each of the 5 checklist items has produced an observable PASS/FAIL result (not a free-text judgment), written into the Assessment section
4. `Open Questions` section either lists concrete questions with owner+due-date, or is explicitly written as `None — all decisions resolved`
5. Critique stage (Stage 4) has emitted a verdict and any REWORK findings have been addressed before SPEC.md is marked final

If ANY condition is unmet, the skill is NOT complete — continue working or escalate via `<escalation>` block.
