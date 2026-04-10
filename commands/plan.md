---
name: legion:plan
description: Plan a specific phase with agent recommendations and wave-structured tasks
argument-hint: <phase-number> [--dry-run] [--auto] [--auto-refine] [--auto --skip-board] [--auto --skip-security]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion]
---

<objective>
Decompose a roadmap phase into wave-structured plans using `settings.planning.max_tasks_per_plan` (default 3). Recommend agents from the registry for each plan and get user confirmation. Generate plan files to `.planning/phases/{NN}-{slug}/`.
</objective>

<execution_context>
skills/workflow-common-core/SKILL.md
skills/agent-registry/SKILL.md
skills/agent-registry/CATALOG.md
skills/phase-decomposer/SKILL.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
</context>

<process>
DRY-RUN MODE (deterministic, no side effects)
   - If `$ARGUMENTS` contains `--dry-run`, DO NOT write plan files, spawn agents, modify git state, or call external side-effecting integrations.
   - Run prerequisite checks only (required inputs, target phase validity, optional integration availability).
   - Output a deterministic dry-run report artifact to stdout with sections:
     - Command: `plan`
     - Target phase and source inputs
     - Prerequisite checks: PASS/FAIL with reasons
     - Planned actions (what would happen)
     - Skills that would load (always + conditional)
   - Stop after reporting.

0. CONDITIONAL SKILL LOADING (context budget)
   Load optional skills only if their activation condition is true:
   
   - `skills/workflow-common-memory/SKILL.md` only if `.planning/memory/OUTCOMES.md` exists.
   - `.planning/memory/RETRO.md` consumed during phase decomposition (Step 3) if file exists. Retro action items from prior phases inform plan constraints and agent selection.

   - `skills/workflow-common-github/SKILL.md` only if `gh auth status` succeeds and a git remote exists.
   - `skills/codebase-mapper/SKILL.md` only if `.planning/CODEBASE.md` exists.
   - `skills/marketing-workflows/SKILL.md` only for MKT-* requirements or marketing keyword detection.
   - `skills/design-workflows/SKILL.md` only for DSN-* requirements or design keyword detection.

   - `skills/workflow-common-domains/SKILL.md` only for MKT-* or DSN-* requirements (or matching domain keywords).
   - `skills/plan-critique/SKILL.md` only when user opts into plan critique OR --auto-refine flag is set.
   - `skills/spec-pipeline/SKILL.md` only when user opts into spec creation or an existing spec is present.
   - `skills/security-review/SKILL.md` only when --auto flag includes security scan, or --security flag present, or security-sensitive files detected.
   If a condition is not met, skip that skill silently and continue.

   AUTO-PIPELINE MODE
   If `$ARGUMENTS` contains `--auto`:
   - Skip all user confirmation gates (steps 3.5b, 3.6b, 6, 8.5) — auto-select recommended defaults
   - Run the full pipeline without pausing: board quick-assess → decomposition → plan critique → design review (if applicable) → security scan (if applicable)
   - Each stage feeds structured output to the next
   - If any stage raises a BLOCKER-severity escalation: halt the pipeline and present to user
   - Supports selective skips:
     - `--auto --skip-board`: skip board quick-assessment
     - `--auto --skip-security`: skip security surface scan
   - After pipeline completes, display consolidated summary of all stages and proceed to state update

   AUTO-REFINE MODE
   If `$ARGUMENTS` contains `--auto-refine`:
   - Set AUTO_REFINE=true
   - Implies plan critique will always run (skip the "Stress-test before execution?" prompt)
   - After critique findings, automatically re-plan affected plans instead of asking user
   - Limited to MAX_REFINE_CYCLES=2 (plan → critique → re-plan → critique → stop)
   - If still REWORK after 2 cycles: halt and present to user for manual decision
   - Can be combined with --auto for fully automated pipeline

1. PARSE PHASE NUMBER
   - Read $ARGUMENTS for a phase number (e.g., "3" from `/legion:plan 3`)
   - If no phase number given: auto-detect the next unplanned phase
     - Read ROADMAP.md progress table
     - Find the first phase where Status = "Pending" and Completed = 0
     - Use that phase number
   - Validate: phase number must exist in ROADMAP.md
   - If invalid: error with "Phase {N} doesn't exist. ROADMAP.md has {count} phases."

2. CHECK FOR EXISTING PLANS
   - Construct the phase directory path using workflow-common conventions:
     `.planning/phases/{NN}-{phase-slug}/`
   - Check if any {NN}-{PP}-PLAN.md files already exist in that directory
   - If plans exist: use adapter.ask_user
     - "Phase {N} already has {count} plan(s). What would you like to do?"
     - Option 1: "Re-plan from scratch" -- delete existing plans, proceed
     - Option 2: "Keep existing plans" -- abort, suggest /legion:build instead
   - If no plans exist: proceed directly

3. READ PHASE DETAILS
   Follow phase-decomposer skill Section 2 (Phase Analysis):
   - Read ROADMAP.md and extract phase goal, requirements list, success criteria
   - If .planning/REQUIREMENTS.md exists, read it and cross-reference full requirement descriptions
   - If REQUIREMENTS.md is absent (between milestones), rely on ROADMAP.md requirement summaries and note the limitation
   - Read PROJECT.md for broader context
   - Read STATE.md for current progress and completed phase outputs
   - If this phase builds on prior phases, read prior phase summaries
   - If .planning/memory/RETRO.md exists:
     - Read RETRO.md and extract action items from the most recent retrospective
     - Include HIGH-priority action items as additional constraints in the decomposition prompt
     - Include agent recommendation adjustments (e.g., "prefer {agent} for {task_type}")
     - This creates the learn/retro/plan feedback loop

   BROWNFIELD CONTEXT (optional — follows codebase-mapper Section 6.2):
   - Check if .planning/CODEBASE.md exists
   - If yes:
     a. Read .planning/CODEBASE.md
     b. Check the "Analyzed" date in the header
        - If >30 days old: warn user "CODEBASE.md was analyzed {N} days ago. Consider running /legion:start to refresh the codebase map."
        - Do NOT auto-re-analyze — let user decide. Continue with existing data.
     c. Extract these sections for use in step 4 (decomposition) and step 5 (agent recommendation):
        - Risk Areas table — flag risks that overlap with files this phase will modify
        - Agent Guidance — Preferred/Avoid/Touch-with-care patterns for task instructions
        - Conventions Detected — naming, structure, and config patterns agents should follow
        - Detected Stack — framework and test suite context for agent instructions
     d. When generating plan tasks in step 4, include codebase context:
        - Note risk areas that tasks touch in the task action instructions
        - Add "Follow codebase conventions" note referencing detected patterns
        - Include "Touch with care" warnings for flagged files
   - If no:
     Skip silently (greenfield project or user declined analysis)

   MARKETING PHASE DETECTION (optional — follows marketing-workflows Section 1):
   - Run marketing domain detection on the current phase:
     a. Check if phase requirements include MKT-* IDs
     b. Check if phase description contains marketing keywords
        ("campaign", "content calendar", "social media", "cross-channel", "marketing",
         "brand awareness", "audience", "engagement strategy")
   - If marketing phase detected:
     a. Read marketing-workflows skill for domain-specific patterns
     b. In step 4 (decomposition), use marketing-specific wave pattern:
        Wave 1: Strategy & Planning (Social Media Strategist + Growth Hacker)
        Wave 2: Content Creation (Content Creator + Channel Specialists)
        Wave 3 (optional): Distribution (all channel agents)
     c. In step 5 (agent recommendation), use marketing team assembly pattern:
        Required: Strategy Lead + Content Lead
        Per-channel: one specialist per selected channel
     d. Before generating plan files, run campaign brief questioning
        (marketing-workflows Section 2.1) and generate campaign document
        at .planning/campaigns/{campaign-slug}.md
     e. All plan files reference the campaign document in their context section
   - If not marketing phase:
     Skip silently (standard decomposition applies)

   DESIGN PHASE DETECTION (optional — follows design-workflows Section 1):
   - Run design domain detection on the current phase:
     a. Check if phase requirements include DSN-* IDs
     b. Check if phase description contains design keywords
        ("design system", "component library", "UX research", "usability testing",
         "accessibility audit", "brand guidelines", "design tokens", "wireframes",
         "user persona", "user journey", "information architecture", "visual design")
   - If design phase detected:
     a. Read design-workflows skill for domain-specific patterns
     b. In step 4 (decomposition), use design-specific wave pattern (design-workflows Section 6.1):
        Wave 1: Research & Foundation (UX Researcher + Brand Guardian)
        Wave 2A: Backend Architecture Design (Backend Architect + UX Architect) — only if backend/API in scope
        Wave 2B: Frontend Design System (UI Designer + Visual Storyteller)
        Wave 3: Integration Design (Senior Developer + UX Architect) — only if both 2A and 2B ran
        Wave 4 (optional): Polish & Validation (Whimsy Injector + review agents)
     c. In step 5 (agent recommendation), use design team assembly pattern:
        Required: Design Lead (design-ui-designer) + Research Lead (design-ux-researcher)
        Per-discipline: specialist per relevant discipline
     d. Before generating plan files, run design brief questioning
        (design-workflows Section 2.1) followed by design consultation
        (design-workflows Section 8) and generate design documents
        at .planning/designs/{project-slug}-system.md
     e. All plan files reference the design documents in their context section
   - If not design phase:
     Skip silently (standard decomposition applies)

3.5. ARCHITECTURE PROPOSALS (optional)
   Follow phase-decomposer skill Section 2.5 (Competing Architecture Proposals):

   a. Run complexity check:
      - If phase has ≤2 requirements AND only modifies existing markdown files: skip to step 3.6
      - Otherwise: offer proposals

   b. Use adapter.ask_user:
      "Phase {N} has enough complexity to benefit from competing architecture proposals. Generate them?"
      Options:
      - "Yes, generate 2-3 proposals (Recommended for complex phases)"
        Description: "Spawn agents with Minimal, Clean, and Pragmatic philosophies to present trade-offs"
      - "Skip, I know the approach I want"
        Description: "Proceed directly to plan decomposition"

   c. If user selects "Yes":
      - CONTEXT BUDGET NOTE: Proposal agents are spawned as Explore sub-agents
        with their own context windows. The orchestrator passes phase context
        to them and receives only structured proposal summaries back (~200 tokens
        each). This does NOT consume the orchestrator's context budget.
      - Spawn 2-3 read-only (Explore) agents per phase-decomposer Section 2.5
      - Include CODEBASE.md context in agent prompts if it exists (brownfield support)
      - If a spec document exists at .planning/specs/{NN}-{phase-slug}-spec.md,
        include it as additional context for richer proposals
      - Collect and present proposals side-by-side
      - User selects an approach (or requests hybrid)
      - Record selection in CONTEXT.md
      - Pass selected approach to step 4 as architectural direction

   d. If user selects "Skip":
      - Proceed to step 3.6 with no architectural constraint
      - Note in CONTEXT.md: "Architecture proposals: skipped by user"

3.6. SPEC PIPELINE (optional)
   Offer the spec creation pipeline for phases that would benefit from
   pre-coding specification. Follows spec-pipeline skill.

   a. Check if a spec already exists:
      - Look for `.planning/specs/{NN}-{phase-slug}-spec.md`
      - If exists: inform user "Spec document already exists for Phase {N}."
        Use adapter.ask_user:
        "Use existing spec or regenerate?"
        - "Use existing" — read spec, pass to step 4 as additional context
        - "Regenerate" — run spec pipeline, overwrite existing
      - If not exists: continue to step b

   b. Offer spec pipeline:
      Use adapter.ask_user:
      "Run spec pipeline before planning Phase {N}?"
      Options:
      - "Yes, create a spec first"
        Description: "5-stage pipeline: gather, research, write, critique, assess. Produces a structured spec document."
      - "No, proceed to planning (Recommended for straightforward phases)"
        Description: "Skip spec creation, decompose directly from ROADMAP requirements"

   c. If user selects "Yes":
      - Read spec-pipeline skill
      - Execute all 5 stages sequentially
      - Write output to `.planning/specs/{NN}-{phase-slug}-spec.md`
      - Pass spec document as additional context to step 4

   d. If user selects "No":
      - Proceed to step 4 with no spec document

4. DECOMPOSE INTO PLANS
   Follow phase-decomposer skill Section 3 (Task Decomposition):
   - List all deliverables from phase requirements
   - If a spec document was generated in step 3.6 or already existed, use it as the
     primary source for deliverable identification alongside ROADMAP.md requirements
   - If an architecture approach was selected in step 3.5, use it as the architectural
     direction for decomposition decisions
   - Identify dependency layers
   - Map layers to waves
   - Group deliverables into plans (max tasks from `settings.planning.max_tasks_per_plan`, default 3)
   - Validate: every requirement covered, no circular dependencies

5. RECOMMEND AGENTS
   Follow phase-decomposer skill Section 4 (Agent Recommendation):
   - For each plan, analyze task types and match against agent-registry
   - Score and rank candidates
   - Select 1-2 agents per plan (or mark as autonomous)
   - Apply mandatory roles (testing for code, coordinator for cross-division)

6. PRESENT TO USER FOR CONFIRMATION
   Follow phase-decomposer skill Section 5 (User Confirmation Gate):
   - Display the complete plan breakdown with wave structure
   - Show agent recommendations with rationale per plan
   - Show agent summary table
   - Use adapter.ask_user: "Does this plan breakdown look right?"
     - "Looks good, generate the plans" -- proceed
     - "Swap an agent" -- ask which plan, present alternatives, update
     - "Adjust the plan structure" -- discuss changes, revise decomposition
   - Loop until user confirms

7. GENERATE CONTEXT FILE
   Follow phase-decomposer skill Section 7 (Context File Generation):
   - Create `.planning/phases/{NN}-{phase-slug}/` directory
   - Write `{NN}-CONTEXT.md` with phase goal, requirements, existing assets, decisions, plan structure

8. GENERATE PLAN FILES
   Follow phase-decomposer skill Section 6 (Plan File Template):
   - For each plan, generate a `{NN}-{PP}-PLAN.md` file
   - Include complete YAML frontmatter (phase, plan, wave, depends_on, must_haves, etc.)
   - Include all XML sections (objective, context, tasks, verification, success_criteria, output)
   - Each task has detailed action instructions, verify commands, and done sentence
   - Context references include prior plan summaries for wave 2+ plans

8.5. PLAN CRITIQUE (optional)
   After plan files are generated, offer the user a chance to stress-test:

   Use adapter.ask_user:
   "Plans generated. Stress-test before execution?"
   Options:
   - "Run plan critique (Recommended for complex phases)" — run pre-mortem + assumption hunting
     Description: "Two skeptical agents analyze the plan for failure modes and unexamined assumptions"
   - "Skip critique, proceed to execution" — skip directly to state update
     Description: "Plans look straightforward, no need for extra validation"

   If user selects "Run plan critique":
   a. Select critique agents using plan-critique Section 4 (Agent Selection):
      - Compose a task description from phase goal + requirements
      - Run agent-registry recommendation with skeptical bias terms
      - Default: testing-qa-verification-specialist (pre-mortem) + product-sprint-prioritizer (assumptions)
      - Present selection to user for confirmation (same pattern as review panel)

   b. Spawn critique agents (read-only):
      - Use adapter.spawn_agent_readonly (no file modifications)
      - Agent 1 runs plan-critique Section 1 (Pre-Mortem Analysis)
      - Agent 2 runs plan-critique Section 2 (Assumption Hunting)
      - For quick critique (1 agent): single agent runs both sections sequentially

   c. Collect findings and synthesize (plan-critique Section 3):
      - Merge pre-mortem risks and assumption findings
      - Compute critique verdict (PASS / CAUTION / REWORK)
      - Present consolidated report to user

   d. Route based on verdict (plan-critique Section 3, Step 4):
      - PASS: proceed to Step 8.6 (or 8.7/9 depending on pipeline)
      - CAUTION:
        - If AUTO_REFINE=true: treat CAUTION same as REWORK (auto-refine critical findings)
        - If AUTO_REFINE=false: user chooses to apply mitigations or proceed (existing behavior)
      - REWORK:
        - If AUTO_REFINE=true AND refine_cycle < MAX_REFINE_CYCLES:
          i. Extract CRITICAL-severity findings from critique report
          ii. For each plan that has CRITICAL findings:
              - Re-run phase-decomposer Section 3 for ONLY the affected plan
              - Pass critique findings as additional constraints:
                "The following risks were identified. The revised plan MUST address them:
                 {list of CRITICAL findings with file references}"
              - Generate revised {NN}-{PP}-PLAN.md (overwrite the original)
          iii. Increment refine_cycle
          iv. Re-run plan critique (Step 8.5b-c) on the revised plans
          v. Return to Step 8.5d (check verdict again)
        - If AUTO_REFINE=true AND refine_cycle >= MAX_REFINE_CYCLES:
          Display: "Auto-refine limit reached ({MAX_REFINE_CYCLES} cycles). Remaining findings:"
          {display outstanding CRITICAL/CAUTION findings}
          Use adapter.ask_user:
          "Plans refined {refine_cycle} times but critique still reports issues. How to proceed?"
          Options:
          - "Accept current plans" — "Proceed with remaining risks acknowledged"
          - "Manual revision" — "Stop here, I'll revise the plans manually"
        - If AUTO_REFINE=false: user chooses to revise plans or proceed anyway (existing behavior)

   If user selects "Skip critique": proceed directly to Step 8.7

8.6. DESIGN REVIEW GATE (auto-pipeline or explicit)
   Only if design phase was detected in step 3:

   a. If `--auto` flag is set OR user explicitly requests:
      - Run 7-pass plan-stage design review (design-workflows Section 7)
      - Score each dimension 0-10
      - For scores below 7: auto-remediate by editing plan files
      - Append design review summary to CONTEXT.md
      - If average score < 5: WARN user (halt auto-pipeline for confirmation)

   b. If NOT auto and NOT explicitly requested:
      - Skip design review gate (standard planning flow)
      - Design review will run during /legion:review instead

8.7. SECURITY SURFACE SCAN (auto-pipeline or explicit)
   Only if security-review skill is loaded (step 0 condition met):

   a. If `--auto` flag is set (and --skip-security is NOT present) OR --security flag present:
      - Run security-review skill attack surface mapping on plan deliverables
      - For each planned file that touches auth/crypto/API routes:
        Flag security-relevant changes and ensure plan includes security considerations
      - Append security scan summary to CONTEXT.md
      - If CRITICAL security findings: HALT pipeline, present to user

   b. If NOT auto and NOT explicitly requested:
      - Skip security scan (will run during /legion:review if evaluator is active)

8.8. AUTO-PIPELINE SUMMARY (only if --auto)
   If `--auto` flag was set, display consolidated pipeline summary:

   ```
   ## Auto-Pipeline Complete — Phase {N}

   | Stage | Status | Key Findings |
   |-------|--------|-------------|
   | Board Assessment | {RAN/SKIPPED} | {summary or "N/A"} |
   | Decomposition | COMPLETE | {plan_count} plans, {wave_count} waves |
   | Plan Critique | {PASS/CAUTION/REWORK} | {finding count} findings{if auto-refine: ", refined {refine_cycle}x"} |
   | Design Review | {RAN/SKIPPED} | {avg_score}/10 |
   | Security Scan | {RAN/SKIPPED} | {finding count} findings |
   ```

   If any stage returned BLOCKER/REWORK: pipeline already halted at that stage.
   Otherwise: proceed to step 9.

9. GITHUB ISSUE CREATION (optional)
   Follow github-sync Section 8 (Graceful Degradation) caller pattern:
   - Check GitHub availability: gh auth status && git remote get-url origin
   - If github_available is false: skip to step 10

   If github_available is true:
   a. Ensure "legion" label exists (github-sync Section 2.1)
   b. If ROADMAP.md has milestones and the current phase falls within a milestone range:
      - Check if the GitHub milestone exists (github-sync Section 4.1)
      - If not: create it
   c. Create a GitHub issue for the phase (github-sync Section 2.2):
      - Title: "Phase {N}: {phase_name}"
      - Body: phase goal, plans checklist, requirements, success criteria
      - Label: "legion"
      - Milestone: GitHub milestone title (if available)
   d. Store the issue number in STATE.md ## GitHub section (github-sync Section 6)
   e. Confirm to user: "Created GitHub issue #{number} for Phase {N}: {phase_name}"

10. UPDATE STATE
   - Read current .planning/STATE.md
   - Update:
     - Phase: {N} of {total} (planned)
     - Status: Phase {N} planned -- {plan_count} plans across {wave_count} waves
     - Last Activity: Phase {N} planning ({date})
     - Next Action: Run `/legion:build` to execute Phase {N}: {phase_name}
   - Write updated STATE.md

11. DISPLAY SUMMARY
    - Show the user a concise summary:
      - Phase: {N} -- {phase_name}
      - Plans: {count} plans across {wave_count} waves
      - For each plan: name, wave, assigned agent(s)
      - Files to be created: list the plan file paths
    - End with: "Run `/legion:build` to execute Phase {N}: {phase_name}"
    - Do NOT dump full plan file contents -- summary only
</process>
