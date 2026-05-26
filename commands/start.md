---
name: legion:start
description: Initialize a new project with guided questioning flow
argument-hint: "[design-doc-path]"
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion]
---

<objective>
Guide the user through an adaptive questioning flow to capture project vision, requirements, and constraints. Before initialization, check for a current `/legion:map` dataset when source code exists. Produce PROJECT.md, ROADMAP.md, and STATE.md with recommended agents per phase.
</objective>

<execution_context>
skills/workflow-common-core/SKILL.md
skills/agent-registry/SKILL.md
skills/questioning-flow/SKILL.md
skills/portfolio-manager/SKILL.md
skills/codebase-mapper/SKILL.md
</execution_context>

<context>
@skills/questioning-flow/templates/project-template.md
@skills/questioning-flow/templates/roadmap-template.md
@skills/questioning-flow/templates/state-template.md
@.planning/CODEBASE.md (if exists)
@.planning/codebase/index.jsonl (if exists)
@.planning/explorations/ (if exists)
</context>

<process>
1. PRE-FLIGHT CHECK
   - Check if `.planning/PROJECT.md` already exists by attempting to read it.
   - If it exists: issue AskUserQuestion.

     Question: "A project already exists in .planning/. Choose exactly one of two actions."

     **Select one option:**
     - **Overwrite existing project with fresh start** — irreversible; PROJECT.md, ROADMAP.md, and STATE.md will be replaced
     - **Keep existing project and abort /legion:start** — no files modified; run `/legion:status` instead

     Do not propose a third option. Do not merge or archive.

     → Use AskUserQuestion tool with these exact two options.
   - If it doesn't exist: proceed directly.

2. DESIGN DOCUMENT INPUT
   - Supported handoff form: `/legion:start <design-doc-path>`.
   - If `$ARGUMENTS` contains a path:
     - Resolve it relative to the current project.
     - Require it to stay inside the current project.
     - Read it as `design_context`.
     - Extract Initial Ask, Product Definition, Feature Scope, Technical Direction, Open Questions, and Start Input when present.
     - AskUserQuestion:
       - "Use this design document to initialize" — prefill Stage 1 and Stage 2 from the document.
       - "Review the document summary first" — display a concise summary, then ask again.
       - "Abort start" — exit without writing files.
   - If no `$ARGUMENTS` path is supplied:
     - Look for `.planning/explorations/*.md`.
     - If none exist, look for legacy `.planning/exploration-*.md` files.
     - If one or more new or legacy design docs exist:
       - Identify the most recent by modification time.
       - AskUserQuestion:
         - "Use latest exploration design" — load the most recent new or legacy design as `design_context`.
         - "Start without exploration design" — run normal questioning.
         - "Abort and review designs" — exit and suggest reading `.planning/explorations/` or legacy `.planning/exploration-*.md` files.
     - If no new or legacy design docs exist: do not ask the exploration-design choice; run normal questioning with `design_context` unset.
   - Legacy `.planning/exploration-*.md` files may be read if no new exploration docs exist, but do not create new legacy files.

3. SOURCE AND MAP PRE-FLIGHT
   - Follow codebase-mapper Section 1 Source Code Detection Heuristic.
   - If no source code is detected, skip map pre-flight and proceed to directory setup.
   - If source code is detected:
     - Run the equivalent of `/legion:map --check` using codebase-mapper Section 17 freshness rules.
     - Required map artifacts:
       - `.planning/CODEBASE.md`
       - `.planning/codebase/index.jsonl`
       - `.planning/codebase/symbols.json`
       - `.planning/codebase/search.md`
       - `.planning/config/directory-mappings.yaml`
     - If map status is `fresh`:
       Use AskUserQuestion:
       - **Use current map** — continue with map context.
       - **Refresh map first** — run `/legion:map --refresh`, then continue.
       - **Continue without map context** — proceed but do not inject map assumptions.
     - If map status is `absent`, `partial`, or `stale`:
       Use AskUserQuestion:
       - **Run `/legion:map` now** — generate or refresh the dataset before planning.
       - **Skip mapping for this start** — proceed without map context.
       - **Abort and map manually** — exit and suggest `/legion:map --refresh`.
   - If the user chooses any mapping option, follow `commands/map.md` and `skills/codebase-mapper/SKILL.md` rather than duplicating map logic.

4. ENSURE DIRECTORY STRUCTURE
   - Create `.planning/` directory if it doesn't exist.
   - Create `.planning/phases/` directory if it doesn't exist.
   - Verify `skills/questioning-flow/templates/` exists. If missing, fail with a clear error.

5. QUESTIONING STAGE 1: VISION & IDENTITY
   Follow questioning-flow Section 2 Stage 1, with design document integration:
   - If `design_context` exists:
     - Open with a summary of the design doc and ask bounded confirmation.
     - Pre-populate project_name, project_description, value_proposition, target_users, and architecture_notes where the document provides them.
     - Ask only for missing or ambiguous fields.
     - Record the design document path in PROJECT.md decisions.
   - If no `design_context` exists:
     - Run the standard Stage 1 flow from questioning-flow.

6. QUESTIONING STAGE 2: REQUIREMENTS & CONSTRAINTS
   Follow questioning-flow Section 2 Stage 2:
   - If `design_context` includes MVP scope, non-goals, technical direction, or open questions, use them as prefilled requirements/constraints and ask for confirmation.
   - If map context is fresh and enabled, use CODEBASE.md and `.planning/codebase/` to ground existing-code constraints and architecture.
   - Keep the confirmation bounded via AskUserQuestion.

7. QUESTIONING STAGE 3: WORKFLOW PREFERENCES
   Follow questioning-flow Section 2 Stage 3 exactly:
   - Execution mode: Guided / Autonomous / Collaborative.
   - Planning depth: Standard / Quick Sketch / Deep Analysis.
   - Cost profile: Balanced / Economy / Premium.
   - Record choices as decisions.

8. GENERATE PROJECT.MD
   - Read `skills/questioning-flow/templates/project-template.md`.
   - Fill placeholders using questioning-flow Section 3.
   - Include design source and map source in decisions when used:
     - `Design source`: `{design_doc_path}`
     - `Codebase map`: `.planning/CODEBASE.md` with map age/status.
   - Omit sections with no content.
   - Write `.planning/PROJECT.md`.

9. GENERATE ROADMAP.MD
   - Analyze requirements captured in Stage 2.
   - Follow questioning-flow Section 4 phase decomposition:
     - Group requirements by dependency and domain.
     - Order phases foundation → core features → user-facing → polish.
     - Estimate plan count from dependency, ownership, verification, and traceability boundaries.
     - Treat estimates as estimates, not phase-level caps.
   - Recommend 2-4 agents per phase using agent-registry Section 3.
   - If a fresh map is available, use it to avoid contradicting existing architecture and to identify existing-code constraints.
   - Read `skills/questioning-flow/templates/roadmap-template.md`, fill placeholders, and write `.planning/ROADMAP.md`.

10. GENERATE STATE.MD
    - Read `skills/questioning-flow/templates/state-template.md`.
    - Fill placeholders:
      - total_phases: count from roadmap.
      - total_plans: sum of estimated plans across all phases.
      - progress_bar / progress_percent: initialized to 0.
      - recent_decisions: workflow preferences, design source, map source.
      - first_phase_name: name of Phase 1.
      - date: current date.
    - Write `.planning/STATE.md`.

11. REGISTER IN PORTFOLIO
    Follow portfolio-manager Section 2 (Register Project):
    - Create/update `{adapter.global_config_dir}/portfolio.md`.
    - Register the current absolute path, project name, status, date, and one-line description.
    - Preserve existing portfolio entries.

12. DISPLAY SUMMARY
    - Show:
      - Project: `{project_name}` — one-line description.
      - Source: design document path if used, otherwise "guided questioning".
      - Codebase map: fresh/used, refreshed, skipped, or unavailable.
      - Phases planned and first phase.
      - Workflow choices.
      - Files created.
      - Portfolio path.
    - End with: "Run `/legion:plan 1` to begin Phase 1: {first_phase_name}"
    - Do not dump full file contents.

<decision_matrix>
| Situation | Action | Notes |
|-----------|--------|-------|
| Exploration design path supplied | Read and use it as prefilled start context | Requires explicit confirmation before writing project files |
| New exploration docs exist but no path supplied | Offer latest design, start without design, or abort | New docs live under `.planning/explorations/` |
| Source code exists and map is absent/partial/stale | Ask whether to run `/legion:map`, skip, or abort | Mapping is user-approved, not silent |
| Fresh map exists | Ask whether to use, refresh, or continue without it | Use map only when user allows |
| User wants exploration first | Exit and suggest `/legion:explore` | Start no longer launches explore proactively |
</decision_matrix>
</process>
