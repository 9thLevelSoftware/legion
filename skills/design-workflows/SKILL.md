---
name: legion:design-workflows
description: Design system creation, UX research workflows, and three-lens design review cycles for design-focused phases
triggers: [design, ui, ux, brand, visual, component]
token_cost: high
summary: "Domain-specific workflows for design phases. Covers design system creation, UX research, three-lens review (brand, accessibility, usability). Activates when DSN-* requirements or design keywords detected."
---

# Design Workflows

Structured design workflow engine for Legion. Provides domain-specific decomposition for design-focused phases -- design system creation, UX research planning and synthesis, and three-lens design review (brand, accessibility, usability). All operations produce human-readable markdown artifacts at `.planning/designs/`.

References:
- State File Locations from `workflow-common.md` (state paths, degradation pattern)
- Design Workflow Conventions from `workflow-common.md` (lifecycle, paths, wave pattern)
- Design Sprint team assembly from `agent-registry.md` Section 4 (Research + Architecture + Visual Design + Brand Review + Feedback)
- Phase decomposition from `phase-decomposer.md` (design domain detection trigger)
- `/legion:plan` in `plan.md` (design questioning and document generation entry point)
- `/legion:build` in `build.md` (design wave execution with research-to-design handoff)

---

## Section 1: Principles & Design Domain Detection

Core rules governing design workflows and the detection heuristic that determines when design-specific decomposition activates.

### Principles

1. **Research-informed design** -- design decisions should be grounded in user research when available. Wave 1 (research) produces insights that inform Wave 2 (creation). When research is unavailable or out of scope, designers proceed using established heuristics and domain expertise.
2. **Human-readable artifacts** -- design documents follow the same structured markdown convention as all other Legion state files. No JSON, no binary, no databases. Design tokens and component specs are documented in markdown tables, not design tool files.
3. **Graceful degradation** -- every consumer checks for design phase signals before applying design patterns. Non-design phases see zero impact. Design documents are never required for non-design workflow completion.
4. **Discipline-driven team assembly** -- the project's design scope drives which agents are assigned. Not all 6 design agents are needed for every project. A brand refresh may need 2-3 agents; a full design system may need 5-6.
5. **Three-lens review** -- design review uses three specialized lenses (brand, accessibility, usability) running in parallel, not a single generic reviewer. Each lens has specific criteria and a dedicated agent.
6. **Specifications, not mockups** -- design documents specify structure, tokens, components, and guidelines. Actual visual creation happens during execution, not during planning.

### When Design Workflows Apply

Design-specific decomposition activates when ANY of these signals are present:

1. **Requirement IDs**: Phase requirements include DSN-* IDs
2. **Keywords in phase description**: "design system", "component library", "UX research", "usability testing", "accessibility audit", "brand guidelines", "design tokens", "wireframes", "prototypes", "user testing", "design review", "user persona", "user journey", "information architecture", "visual design"
3. **Agent signal**: agent-registry recommends majority design-division agents for the phase

When detected: use design-specific wave patterns (Section 6) and offer design document generation during planning.
When not detected: standard phase decomposition applies -- no impact.

### Constants

```
DESIGN_DIR = '.planning/designs'
SYSTEM_FILE_PATTERN = '{DESIGN_DIR}/{project-slug}-system.md'
RESEARCH_FILE_PATTERN = '{DESIGN_DIR}/{research-slug}-research.md'
DESIGN_DISCIPLINES = ['design-systems', 'ux-architecture', 'brand-identity',
                      'user-research', 'visual-storytelling', 'delight-polish']
TOKEN_CATEGORIES = ['color', 'typography', 'spacing', 'elevation', 'border-radius',
                    'animation', 'breakpoint', 'z-index']
```

### Discipline-Agent Mapping

| Design Discipline | Primary Agent | Supporting Agent |
|-------------------|---------------|-----------------|
| Design Systems | design-ui-designer | design-brand-guardian |
| UX Architecture | design-ux-architect | design-ux-researcher |
| Brand & Identity | design-brand-guardian | design-ui-designer |
| User Research | design-ux-researcher | design-ux-architect |
| Visual Storytelling | design-visual-storyteller | design-brand-guardian |
| Delight & Polish | design-whimsy-injector | design-ui-designer |

### Graceful Degradation

- If `.planning/designs/` directory does not exist: create it when the first design document is generated
- If no design document exists for a phase: standard decomposition, no design enrichment
- If design-workflows skill is referenced but phase is not design: skip silently
- Never error, never block, never require design documents for non-design workflow completion

---

## Section 2: Design System Workflow (DSN-01)

Structured design system creation with guided questioning, document generation, agent team assembly, token taxonomy, component architecture, and lifecycle management. This section drives the design system flow triggered by `/legion:plan` when a design phase is detected.

### 2.1: Design Brief Questioning

When a design phase is detected during `/legion:plan`, gather design parameters using AskUserQuestion. This replaces the generic decomposition questioning for design phases.

Key questions (adapt based on responses -- do not ask all if answers imply others):

```
Q1: "What type of design work does this phase focus on?"
  Options:
  - "Design system / Component library" -- full system with tokens, components, guidelines
  - "UX research / User testing" -- research-focused, insights and recommendations
  - "Brand refresh / Visual identity" -- brand-focused, identity system and guidelines
  - "UI implementation / Screen design" -- applying an existing system to new screens

Q2: "What's the scope of the design system?" (only if Q1 = design system)
  Options:
  - "Foundation only (tokens + guidelines)" -- colors, typography, spacing, principles
  - "Foundation + Core components" -- plus buttons, inputs, cards, navigation
  - "Full system (foundation + components + patterns)" -- plus layouts, flows, page templates

Q3: "Does this project have existing brand guidelines?"
  Options:
  - "Yes, established brand" -- design must align with existing identity
  - "New brand / No guidelines" -- brand development is part of the work
  - "Partial / Needs refresh" -- some guidelines exist but need updating

Q4: "What platforms need to be supported?" (multi-select)
  Options:
  - "Web (responsive)"
  - "Mobile (iOS/Android)"
  - "Desktop application"
  - "Design documentation only"

Q5: "What are the key accessibility requirements?"
  Options:
  - "WCAG AA (standard)" -- 4.5:1 contrast, keyboard nav, screen reader support
  - "WCAG AAA (enhanced)" -- 7:1 contrast, extended requirements
  - "Basic compliance" -- minimum viable accessibility
```

If the user has already provided design details in the phase description or CONTEXT.md, extract answers from existing context rather than re-asking. Only ask for missing parameters.

### 2.2: Design System Document Generation

After brief questioning, generate the design system document at:
  `{DESIGN_DIR}/{project-slug}-system.md`

The slug is derived from the project name: lowercase, spaces to hyphens, strip non-alphanumeric (except hyphens), max 40 characters.
Example: "Dashboard Redesign" becomes `dashboard-redesign`

Use the format from Section 5.1. Populate all sections from the brief answers:
- **Design Principles**: from project context + brand guidelines
- **Token Taxonomy**: from Q2 scope + Q5 accessibility + Q4 platforms
- **Component Architecture**: from Q2 scope level (foundation only, core components, or full system)
- **Platform Targets**: from Q4
- **Accessibility Standard**: from Q5
- **Agent Assignments**: from discipline selection + agent-registry Section 4 Design Sprint team

### 2.3: Design Team Assembly

For design projects, use the agent-registry Section 4 Design Sprint team assembly pattern:

**Required roles (always included):**

| Role | Agent | Responsibilities |
|------|-------|-----------------|
| Design Lead | design-ui-designer | Component library, visual system, design tokens, accessibility compliance, developer handoff |
| Research Lead | design-ux-researcher | User research, usability testing, persona development, journey mapping, design validation |

**Discipline-specific roles (based on project scope from Q1-Q3):**
- Map each relevant discipline to its primary agent using the Discipline-Agent Mapping table (Section 1)
- If a discipline's primary agent is already assigned as Design Lead or Research Lead, no duplicate -- the agent covers both roles
- Each discipline specialist owns deliverables for their area

**Optional roles (add based on project needs):**

| Condition | Role | Agent | Division |
|-----------|------|-------|----------|
| Project has established brand (Q3 = "Yes") | Brand Alignment | design-brand-guardian | design |
| Project needs CSS/layout foundation | Technical Foundation | design-ux-architect | design |
| Project is visually intensive | Visual Design | design-visual-storyteller | design |
| Project needs micro-interactions (Q1 includes polish) | Delight Design | design-whimsy-injector | design |
| Design-to-code handoff required (Q4 includes web/mobile) | Frontend Dev | engineering-frontend-developer | engineering |
| User feedback integration needed | Feedback Synthesis | product-feedback-synthesizer | product |

### 2.4: Token Taxonomy

Design tokens follow a three-tier hierarchy: Global --> Semantic --> Component.

```
### Token Structure

| Category | Global Token | Semantic Token | Component Token |
|----------|-------------|----------------|-----------------|
| Color | color-blue-500 | color-primary | button-color-bg |
| Typography | font-size-16 | font-size-body | input-font-size |
| Spacing | spacing-16 | spacing-md | card-padding |
| Elevation | shadow-md | shadow-card | dialog-shadow |
| Border Radius | radius-8 | radius-md | button-radius |
| Animation | duration-200 | duration-fast | tooltip-duration |
| Breakpoint | breakpoint-768 | breakpoint-tablet | -- |
| Z-index | z-50 | z-overlay | modal-z-index |

Naming convention: {category}-{modifier} for global, {category}-{semantic-name} for semantic, {component}-{property} for component.
```

### 2.5: Component Architecture (Atomic Design)

Components follow atomic design hierarchy: Tokens --> Atoms --> Molecules --> Organisms --> Templates.

| Level | Examples | Defined By |
|-------|---------|-----------|
| Tokens | Colors, fonts, spacing, shadows | design-ui-designer |
| Atoms | Button, Input, Label, Icon, Badge | design-ui-designer |
| Molecules | Form Field (label + input + error), Search Bar, Nav Item | design-ui-designer |
| Organisms | Header, Sidebar, Form, Card Grid, Data Table | design-ux-architect |
| Templates | Page layouts, Dashboard layout, Settings page | design-ux-architect |

Each component specification includes:
- **States**: default, hover, active, focus, disabled, loading, error
- **Variants**: size (sm/md/lg), intent (primary/secondary/danger/ghost)
- **Accessibility**: ARIA attributes, keyboard interaction, focus management
- **Responsive**: behavior at each breakpoint
- **Dark mode**: token overrides for dark theme

### 2.6: Design Project Lifecycle

```
Unplanned --> Research --> Designing --> Review --> Complete
```

- **Unplanned**: Phase not yet planned. Standard decomposition applies.
- **Research**: UX research underway, brand audit in progress (Wave 1). Status in design doc: `Research`
- **Designing**: Design system creation, component development (Wave 2). Status: `Designing`
- **Review**: Brand/accessibility/usability review cycle (Wave 3 or /legion:review). Status: `Review`
- **Complete**: Design system documented, handoff ready, outcomes recorded to memory (if active). Status: `Complete`

Design project status is tracked in the design document header, not in STATE.md.

---

## Section 3: UX Research Workflow (DSN-02)

User research planning, data collection methodology, synthesis into actionable deliverables, and handoff to design agents. This section drives the research flow for design phases that include UX research scope.

### 3.1: Research Planning

When UX research is part of the design phase (Q1 = "UX research" or when research is part of Wave 1), the Research Lead (design-ux-researcher) produces a research plan.

Research plan components:
```
1. Research Goals -- what questions need answering
2. Methodology Selection -- which methods to use (see Section 3.2)
3. Participant Profile -- who to recruit, how many
4. Data Collection Protocol -- interview guide, test script, survey design
5. Analysis Approach -- how data will be synthesized
6. Timeline -- research phases with milestones
```

### 3.2: Methodology Selection

| Method | When to Use | Produces | Agent |
|--------|------------|---------|-------|
| User Interviews | Understanding motivations, mental models, pain points | Interview transcripts, thematic analysis | design-ux-researcher |
| Usability Testing | Validating existing designs or prototypes | Task completion rates, error analysis, recommendations | design-ux-researcher |
| Competitive Analysis | Understanding market landscape, identifying opportunities | Competitive matrix, feature gap analysis | design-ux-researcher |
| Card Sorting | Defining information architecture | Category structure, navigation hierarchy | design-ux-researcher |
| Heuristic Evaluation | Quick expert review of existing interfaces | Heuristic findings, severity ratings | design-ux-researcher + design-ux-architect |
| Survey / Questionnaire | Quantitative validation, preference testing | Statistical analysis, preference rankings | design-ux-researcher |
| Analytics Review | Understanding current user behavior | Behavior flows, drop-off analysis, feature usage | design-ux-researcher |
| A/B Testing | Comparing design alternatives | Statistical significance, conversion impact | design-ux-researcher |

### 3.3: Research Deliverables

After research is complete, synthesize findings into:

**User Personas:**
```
| Attribute | Description |
|-----------|-------------|
| Name | {fictional representative name} |
| Role/Context | {who they are, what they do} |
| Goals | {what they want to achieve} |
| Frustrations | {pain points and barriers} |
| Behaviors | {how they currently approach tasks} |
| Quote | {representative verbatim from research} |
```

**User Journey Map:**
```
| Stage | Actions | Thoughts | Emotions | Pain Points | Opportunities |
|-------|---------|----------|----------|-------------|---------------|
| {stage} | {what user does} | {what user thinks} | {emoji: positive/neutral/negative} | {friction} | {design opportunity} |
```

**Research Recommendations:**

Each recommendation links back to specific findings and maps to design actions:
```
| Finding | Impact | Recommendation | Design Action | Priority |
|---------|--------|---------------|--------------|----------|
| {observed behavior/insight} | {who/what it affects} | {what to do about it} | {specific design change} | High/Medium/Low |
```

### 3.4: UX Research Report Generation

After research synthesis, generate the research report at:
  `{DESIGN_DIR}/{research-slug}-research.md`

Use the format from Section 5.2. The Research Lead populates all sections from research activities.

### 3.5: Research-to-Design Handoff

Research findings feed directly into design decisions:

1. **Personas** --> inform component states and user flows
2. **Journey maps** --> identify screens/pages needed, key interactions
3. **Pain points** --> prioritize design improvements
4. **Recommendations** --> map to specific components or patterns
5. **Usability findings** --> validate or invalidate existing design decisions

During Wave 2, design agents receive the research report as context:
  @.planning/designs/{research-slug}-research.md

---

## Section 4: Design Review Cycle (DSN-03)

Three-lens design-specific quality gates that replace single-reviewer design review when design documents exist. Each lens runs in parallel with dedicated criteria and a specialist reviewer agent.

### 4.1: Three-Lens Review

Design phases use three specialized review lenses running in parallel (not sequentially). Each lens has a dedicated reviewer agent and specific criteria.

| Lens | Reviewer | Focus Areas |
|------|----------|-------------|
| Brand | design-brand-guardian | Visual identity compliance, brand voice consistency, color/typography adherence, logo usage, brand personality expression |
| Accessibility | design-ux-architect | WCAG compliance level (AA or AAA per Q5), color contrast ratios, keyboard navigation, screen reader support, focus management, responsive behavior, reduced motion support |
| Usability | design-ux-researcher | Nielsen's 10 heuristics, information architecture clarity, user flow completeness, error prevention and recovery, learnability, consistency with established patterns |

### 4.2: Design Finding Categories

Design review findings use these categories (extending the standard review-loop finding format):

| Category | Severity | Description |
|----------|----------|-------------|
| Brand Violation | BLOCKER | Design contradicts established brand guidelines |
| Accessibility Failure | BLOCKER | WCAG compliance violation at the required level |
| Usability Critical | BLOCKER | User cannot complete a primary task |
| Brand Inconsistency | WARNING | Minor brand deviation (e.g., color shade, font weight) |
| Accessibility Gap | WARNING | Accessibility best practice not followed (not a violation) |
| Usability Issue | WARNING | Friction point that degrades but doesn't block user experience |
| Enhancement | INFO | Suggested improvement that would elevate the design |

### 4.3: Review Criteria Checklists

**Brand Review Checklist (design-brand-guardian):**
- [ ] Color palette matches brand token definitions
- [ ] Typography follows brand type scale
- [ ] Logo usage follows brand guidelines (clear space, minimum size)
- [ ] Imagery style is consistent with brand personality
- [ ] Voice and tone in UI copy matches brand voice guidelines
- [ ] Design patterns are consistent across all documented screens/components

**Accessibility Review Checklist (design-ux-architect):**
- [ ] Color contrast meets required WCAG level (AA: 4.5:1 text, 3:1 UI; AAA: 7:1 text)
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and follow a logical tab order
- [ ] ARIA labels and roles are specified for custom components
- [ ] Touch targets meet minimum 44x44px (mobile) / 24x24px (web)
- [ ] Content reflows at all defined breakpoints without horizontal scroll
- [ ] Animations respect prefers-reduced-motion
- [ ] Text can be resized to 200% without loss of content

**Usability Review Checklist (design-ux-researcher):**
- [ ] System status is visible (loading states, progress indicators, confirmations)
- [ ] Terminology matches user mental models (not internal jargon)
- [ ] Users can undo/recover from errors easily
- [ ] Consistent patterns are used for similar actions across the system
- [ ] Primary actions are visually prominent; destructive actions require confirmation
- [ ] Help and documentation are accessible from context
- [ ] Navigation structure matches information architecture
- [ ] Empty states guide users toward productive actions

### 4.4: Integration with review-loop.md

When `/legion:review` runs for a design phase:

1. Phase type classification detects "design" (existing review-loop Section 2 mapping)
2. If design-workflows skill is active (design documents exist at `.planning/designs/`):
   a. Use three-lens review instead of the default single-reviewer design mapping
   b. Spawn three reviewers in parallel:
      - design-brand-guardian (brand lens)
      - design-ux-architect (accessibility lens)
      - design-ux-researcher (usability lens)
   c. Each reviewer uses their specific checklist (Section 4.3) as review criteria
   d. Findings use design-specific categories (Section 4.2)
   e. Max 3 review agents (within review-loop's existing limit)
3. If design-workflows is NOT active (no design documents):
   Fall back to default: design-brand-guardian primary, testing-qa-verification-specialist secondary

### 4.5: Cross-Discipline Consistency

Before Wave 2 (design creation) begins, the Design Lead verifies:

- [ ] All design agents have received the design principles and token definitions
- [ ] Brand guidelines are shared with all agents creating visual assets
- [ ] Accessibility requirements are documented and included in each agent's context
- [ ] Component naming conventions are defined and consistent
- [ ] Platform-specific requirements are documented per target platform
- [ ] Research findings (if available) are included in each agent's execution context

During `/legion:review` for design phases, the review agents check this list against produced artifacts.

---

## Section 5: Design Document Formats

Full format specifications for design documents produced at `.planning/designs/`. These are the canonical output artifacts of design workflows.

### 5.1: Design System Document Template

```markdown
# Design System: {Project Name}

**Created:** {YYYY-MM-DD}
**Status:** Research | Designing | Review | Complete
**Scope:** {Foundation | Foundation + Core | Full System}
**Platforms:** {Web, Mobile, Desktop, Documentation}
**Accessibility:** {WCAG AA | WCAG AAA | Basic}
**Owner:** {primary design agent -- typically design-ui-designer}

## Design Principles

1. {Principle name} -- {description and rationale}
2. {Principle name} -- {description and rationale}
3. {Principle name} -- {description and rationale}

## Token Taxonomy

### Color Tokens
| Token | Value | Usage |
|-------|-------|-------|
| color-primary | {value} | Primary actions, links, active states |
| color-secondary | {value} | Secondary actions, accents |
| color-surface | {value} | Background surfaces |
| color-on-surface | {value} | Text on surfaces |
| color-error | {value} | Error states, destructive actions |
| color-success | {value} | Success states, confirmations |

### Typography Tokens
| Token | Value | Usage |
|-------|-------|-------|
| font-family-primary | {value} | Body text, UI elements |
| font-family-heading | {value} | Headings, display text |
| font-size-xs | {value} | Captions, helper text |
| font-size-sm | {value} | Secondary text |
| font-size-md | {value} | Body text |
| font-size-lg | {value} | Subheadings |
| font-size-xl | {value} | Page headings |

### Spacing Tokens
| Token | Value | Usage |
|-------|-------|-------|
| spacing-xs | {value} | Tight spacing (inline elements) |
| spacing-sm | {value} | Compact spacing (form fields) |
| spacing-md | {value} | Standard spacing (sections) |
| spacing-lg | {value} | Generous spacing (page sections) |
| spacing-xl | {value} | Maximum spacing (page margins) |

### Additional Tokens
| Category | Tokens Defined |
|----------|---------------|
| Elevation | {shadow tokens for cards, modals, dropdowns} |
| Border Radius | {radius tokens from sharp to pill} |
| Animation | {duration and easing tokens} |
| Breakpoints | {responsive breakpoint values} |
| Z-index | {layering scale for overlays, modals, tooltips} |

## Component Architecture

### Atoms
| Component | States | Variants | Accessibility |
|-----------|--------|----------|--------------|
| {component} | {states} | {variants} | {ARIA, keyboard} |

### Molecules
| Component | Composed Of | States | Accessibility |
|-----------|------------|--------|--------------|
| {component} | {atom list} | {states} | {ARIA, keyboard} |

### Organisms (if scope includes)
| Component | Composed Of | Responsive Behavior |
|-----------|------------|-------------------|
| {component} | {molecule list} | {breakpoint behavior} |

## Agent Assignments

| Agent | Role | Responsibilities | Deliverables |
|-------|------|-----------------|--------------|
| {agent-id} | {role} | {what they do} | {what they produce} |

## Platform Guidelines

| Platform | Considerations |
|----------|---------------|
| {platform} | {platform-specific notes} |

## Timeline

| Phase | Activities |
|-------|-----------|
| Research | {research activities from Wave 1} |
| Design | {design activities from Wave 2} |
| Review | {review activities} |
| Handoff | {developer handoff} |
```

### 5.2: UX Research Report Template

```markdown
# UX Research: {Research Title}

**Created:** {YYYY-MM-DD}
**Status:** Planning | In Progress | Complete
**Methodology:** {methods used}
**Participants:** {count and profile}
**Owner:** {design-ux-researcher}

## Research Goals

1. {Research question 1}
2. {Research question 2}
3. {Research question 3}

## Methodology

| Method | Purpose | Participants | Duration |
|--------|---------|-------------|----------|
| {method} | {what it answers} | {count} | {time} |

## Key Findings

### Finding 1: {title}
- **Observation**: {what was observed}
- **Impact**: {who/what it affects}
- **Evidence**: {supporting data points}
- **Severity**: High | Medium | Low

### Finding 2: {title}
...

## User Personas

### Persona: {Name}
| Attribute | Description |
|-----------|-------------|
| Role/Context | {who they are} |
| Goals | {what they want} |
| Frustrations | {pain points} |
| Behaviors | {how they act} |
| Quote | "{representative quote}" |

## User Journey Map

| Stage | Actions | Thoughts | Emotions | Pain Points | Opportunities |
|-------|---------|----------|----------|-------------|---------------|
| {stage} | {actions} | {thoughts} | {emoji} | {pain} | {opportunity} |

## Recommendations

| Finding | Recommendation | Design Action | Priority |
|---------|---------------|--------------|----------|
| {finding ref} | {what to do} | {specific change} | High/Medium/Low |

## Next Steps

- {action item 1}
- {action item 2}
```

### 5.3: Status Values

**Design system statuses:**

| Status | Meaning | Set When |
|--------|---------|----------|
| Research | UX research and brand audit underway | During Wave 1 execution |
| Designing | Design system creation in progress | During Wave 2 execution |
| Review | Three-lens review cycle active | During /legion:review |
| Complete | Design system documented, handoff ready | After review passes and outcomes recorded |

**Research report statuses:**

| Status | Meaning | Set When |
|--------|---------|----------|
| Planning | Research plan being defined | During /legion:plan research scoping |
| In Progress | Data collection and analysis underway | During Wave 1 execution |
| Complete | Findings synthesized, recommendations produced | After research synthesis |

### 5.4: Multiple Documents

A single phase may produce multiple design documents. Each gets its own file:
- `.planning/designs/dashboard-redesign-system.md`
- `.planning/designs/dashboard-user-research.md`
- `.planning/designs/mobile-app-system.md`

The phase plan references all design documents in its `@context` block.

---

## Section 6: Integration Patterns

How callers consume this skill. Each integration point follows the same contract: detect design phase, use design patterns if detected, skip silently if not.

### 6.1: /legion:plan Integration (Design Phase Detection)

In phase-decomposer, after reading ROADMAP phase details:

```
1. Run Design Domain Detection (Section 1 heuristic)
   - Check for DSN-* requirement IDs in the phase
   - Check for design keywords in the phase description
   - Check if agent-registry recommends majority design agents

2. If design phase detected:
   a. Read design-workflows skill for domain-specific patterns
   b. Run Design Brief Questioning (Section 2.1) via AskUserQuestion
   c. Generate design system document (Section 2.2) at .planning/designs/{slug}-system.md
   d. If research is in scope: generate research report template at .planning/designs/{slug}-research.md
   e. Use design-specific wave pattern for plan decomposition:

      Wave 1: Research & Foundation
        Agents: design-ux-researcher (research lead) + design-brand-guardian (brand audit)
        Produces: Research brief, user insights, brand foundation, design principles

      Wave 2A: Backend Architecture Design (parallel with 2B)
        Agents: engineering-backend-architect + design-ux-architect
        Input: Wave 1 research + project constraints
        Produces: API contract design, data model specifications, error response standards, authentication flows
        Note: Only activates if phase scope includes backend/API work. Skip for frontend-only design phases.

      Wave 2B: Frontend Design System (parallel with 2A)
        Agents: design-ui-designer (design lead) + design-visual-storyteller
        Input: Wave 1 research + brand guidelines as context
        Produces: Design system document, component specs, visual language, interaction patterns

      Wave 3: Integration Design (only if both 2A and 2B ran)
        Agents: engineering-senior-developer + design-ux-architect
        Input: Wave 2A API contracts + Wave 2B design system
        Produces: Frontend-backend contract alignment, state management patterns, API-to-UI data mapping, error state mapping
        Note: Skip if only frontend (2B) or only backend (2A) ran. This wave ensures API responses map cleanly to UI states.

      Wave 4 (optional -- only if phase scope includes polish/validation):
        Agents: design-whimsy-injector + review agents
        Input: Wave 2B design system + Wave 3 integration contracts (if present)
        Produces: Enhanced specs with delight, audit reports

   f. Generate plan files with design-aware task descriptions
   g. Reference design documents in plan context: @.planning/designs/{slug}-system.md

3. If not design phase:
   Standard decomposition proceeds (no impact from this skill)
```

### 6.2: /legion:build Integration (Design Execution)

During wave-executor for design phases:

```
1. Wave 1 agents receive design system document as context
   - Design doc path: .planning/designs/{slug}-system.md
   - Agent personality is injected per standard personality injection pattern

2. Wave 1 output includes:
   - Research findings (if UX research was conducted)
   - Brand audit results and design principles
   - Token definitions and component requirements
   - This is the key handoff artifact between Waves 2A/2B

3. Wave 2A agents (backend architecture) receive:
   - Wave 1 SUMMARY.md (research findings, project constraints)
   - .planning/CODEBASE.md (if exists -- brownfield API surface)
   - Existing API contracts or schema files from project
   Only dispatched when phase scope includes backend/API work.

4. Wave 2B agents (frontend design) receive:
   - Design system document (from .planning/designs/)
   - Wave 1 SUMMARY.md (contains research findings and brand guidelines)
   - Their discipline-specific assignments from the design document
   - Platform-specific requirements for their target platforms

5. Wave 3 agents (integration) receive:
   - Wave 2A SUMMARY.md (API contracts, data models, error responses)
   - Wave 2B SUMMARY.md (component specs, interaction patterns, UI states)
   - Focus: align API responses to UI states, map error codes to user-facing messages,
     define state management patterns for data flow
   Only dispatched when both 2A and 2B ran.

6. If Wave 4 exists:
   - Polish/validation agents receive all prior summaries
   - Focus is on enhancement and validation, not creation
```

### 6.3: /legion:review Integration (Three-Lens Design Review)

During review-loop for design phases:

1. Phase type classification detects "design"
2. If design documents exist at `.planning/designs/`:
   Use three-lens review (Section 4.1):
   - **Brand lens** (design-brand-guardian): check brand consistency per Section 4.3 brand checklist
   - **Accessibility lens** (design-ux-architect): check WCAG compliance per Section 4.3 accessibility checklist
   - **Usability lens** (design-ux-researcher): check Nielsen's heuristics per Section 4.3 usability checklist
3. If no design documents: fall back to default review-loop design mapping
4. Design findings use categories from Section 4.2 (Brand Violation, Accessibility Failure, Usability Critical, etc.)
5. Max 3 reviewers (within review-loop's limit)
6. Standard 3-cycle fix loop applies

### 6.4: Caller Contract

Every command that integrates with design workflows MUST follow this contract:

```
1. Check if phase is design (Section 1 heuristic)
2. If yes: use design-specific patterns for that operation
3. If no: standard behavior, skip silently
4. Never error, never block, never require design workflows for non-design phases
5. If a design operation fails mid-way: log the error, continue the workflow
6. Design documents are supplementary artifacts -- workflow completion does not depend on them
```

This is identical to the Marketing, GitHub, Memory, and Brownfield degradation pattern -- all optional integrations follow the same contract.

---

## Section 7: Plan-Stage Design Review (7-Pass Method)

Structured design completeness gate that runs during `/legion:plan` to score design dimensions and remediate gaps before implementation. Inspired by multi-pass design audit methodologies. Only activates when design phase is detected (Section 1 heuristic).

### 7.1: When to Run

Run the 7-pass review after phase decomposition (Section 6.1 steps 2a-2e) and before plan finalization (step 2f). The review evaluates the plan's design specifications, not implemented code.

If design-workflows is not active (non-design phase): skip this section entirely.

### 7.2: The 7 Passes

Each pass is rated 0-10. Scores below 7 trigger remediation (the plan is edited to fill gaps). Scores 8+ receive a quick acknowledgment. Agent: `design-ui-designer` performs the review.

**Pass 1: Information Architecture**
- Is visual hierarchy defined (primary, secondary, tertiary elements)?
- Is navigation flow specified (user paths between screens/sections)?
- Is content prioritization documented (what appears first, what's progressive)?
- Rating criteria: 10 = every screen has explicit hierarchy and flow documented

**Pass 2: Interaction State Coverage**
- Are loading states specified for async operations?
- Are empty states defined (first-use, no-data, search-no-results)?
- Are error states specific (not just "error occurred" but contextual messages)?
- Are success/confirmation states defined?
- Are partial/degraded states covered (offline, slow connection, partial data)?
- Rating criteria: 10 = every interactive element has all 5 state types documented

**Pass 3: User Journey & Emotional Arc**
- Visceral (first 5 seconds): What is the user's immediate impression?
- Behavioral (first 5 minutes): Is the core task completable without confusion?
- Reflective (long-term): Does the design build trust and encourage return?
- Rating criteria: 10 = explicit consideration of all three time horizons

**Pass 4: AI Slop Detection**
Flag generic AI-generated patterns that signal lazy design:

| Anti-Pattern | Why It's Slop | Better Alternative |
|---|---|---|
| Purple/blue gradient backgrounds | Default AI aesthetic, no brand connection | Brand-derived color with intentional use |
| 3-column icon-in-circle feature grid | Most copied AI layout pattern | Layout that matches content hierarchy |
| Centered-everything layout | Avoids layout decisions | Intentional alignment based on reading flow |
| Uniform border-radius on all elements | Ignores component hierarchy | Radius scale (sharp for data, rounded for CTAs) |
| Decorative gradient blobs | Visual filler with no information | Purposeful illustration or whitespace |
| Generic hero with stock photo | No brand differentiation | Product-specific imagery or typography-led hero |
| Emoji as design elements | Substitutes for real iconography | Custom or curated icon set |

Rating criteria: 10 = zero AI slop patterns detected; each pattern found drops 1 point

**Pass 5: Design System Alignment**
- Does the plan reference existing design documents at `.planning/designs/`?
- Are component names consistent with established design system vocabulary?
- Are new components specified using existing tokens (colors, spacing, typography)?
- Are deviations from the system documented with rationale?
- Rating criteria: 10 = full alignment with existing system, deviations justified

**Pass 6: Responsive & Accessibility**
- Are mobile/tablet layouts specified (not just "stacked on mobile")?
- Is keyboard navigation documented for interactive elements?
- Are touch targets specified (minimum 44x44px for mobile)?
- Are color contrast requirements stated (WCAG AA: 4.5:1 text, 3:1 UI)?
- Is screen reader support specified (ARIA labels, roles, landmarks)?
- Is reduced-motion behavior documented for animations?
- Rating criteria: 10 = all 6 criteria explicitly addressed

**Pass 7: Unresolved Design Decisions**
- Surface ambiguities that would force implementers into ad-hoc choices
- Examples: "What happens when the user's name is 47 characters?", "How does the modal behave on mobile?", "What's the maximum items in this list before pagination?"
- Each unresolved decision is presented to the user via AskUserQuestion for resolution or explicit deferral
- Rating criteria: 10 = zero unresolved decisions remaining

### 7.3: Review Output

After all 7 passes, produce a completion summary:

```markdown
## Design Review Summary

| Pass | Dimension | Pre-Score | Post-Score | Status |
|------|-----------|-----------|------------|--------|
| 1 | Information Architecture | {N}/10 | {N}/10 | {PASS/REMEDIATED} |
| 2 | Interaction State Coverage | {N}/10 | {N}/10 | {PASS/REMEDIATED} |
| 3 | User Journey & Emotional Arc | {N}/10 | {N}/10 | {PASS/REMEDIATED} |
| 4 | AI Slop Detection | {N}/10 | {N}/10 | {PASS/REMEDIATED} |
| 5 | Design System Alignment | {N}/10 | {N}/10 | {PASS/REMEDIATED} |
| 6 | Responsive & Accessibility | {N}/10 | {N}/10 | {PASS/REMEDIATED} |
| 7 | Unresolved Decisions | {N}/10 | {N}/10 | {PASS/DEFERRED} |

**Overall Design Readiness:** {average score}/10
```

Append this summary to the plan's CONTEXT.md for downstream consumption by build and review agents.

### 7.4: Integration with /legion:plan

In the plan command, after step 2e (wave pattern) and before step 2f (plan file generation):

```
If design phase detected AND settings.review.evaluator_depth == "multi-pass":
  Run 7-pass design review (Section 7.2)
  For each pass scoring < 7:
    Edit the plan to address gaps
    Re-score the pass
  Append review summary to CONTEXT.md
  If average score < 5: warn user that design specifications are weak
  Proceed to step 2f with enriched plan
```

---

## Section 8: Design Consultation

Enhanced design brief methodology that goes beyond questioning to provide opinionated design direction proposals. Extends Section 2.1 (Design Brief Questioning) with aesthetic direction, safe-vs-risk framing, and coherence validation. Agent: `design-ui-designer` with `design-brand-guardian` for brand alignment.

### 8.1: Aesthetic Direction Proposals

After the initial design brief questions (Section 2.1, Q1-Q5), propose 3-5 coherent aesthetic directions. Each direction includes rationale tied to the product's users and positioning.

**Built-in direction catalog** (select 3-5 most relevant to the product type):

| Direction | Character | Best For | Risk Level |
|---|---|---|---|
| Brutally Minimal | Stark, high-contrast, typography-led | Developer tools, productivity apps | Medium -- can feel cold |
| Refined / Luxury | Generous whitespace, serif accents, muted palette | Premium products, financial services | Low -- safe but potentially generic |
| Playful / Friendly | Rounded forms, warm colors, illustrated elements | Consumer apps, onboarding flows | Medium -- can feel unserious |
| Editorial / Content-First | Strong type hierarchy, reading-optimized layouts | Publishing, documentation, blogs | Low -- proven but distinctive |
| Data-Dense / Dashboard | Compact spacing, monospace accents, information-rich | Analytics, admin panels, monitoring | Medium -- can feel overwhelming |
| Bold / Expressive | Large type, strong color, unconventional layout | Marketing sites, creative portfolios | High -- memorable but polarizing |

Present directions via AskUserQuestion:
```
"Which aesthetic direction best fits your product?"
Options: [3-5 selected directions with descriptions]
```

### 8.2: Safe Choice vs. Creative Risk Framing

For each major design decision (typography, color, layout, motion), frame options as:

**SAFE CHOICE**: The category baseline -- what users expect from this type of product.
- Example: "Inter/system font for a SaaS dashboard" (every competitor uses it, zero friction)

**CREATIVE RISK**: A deliberate departure from convention with explicit tradeoff.
- Example: "Instrument Serif for headings in a SaaS dashboard" (distinctive, memorable, but users may find it unexpected)
- Each risk must articulate: what you gain, what you risk, why it works for THIS product

Present each decision via AskUserQuestion with safe and risk options clearly labeled.

### 8.3: Anti-Slop Pattern Blacklist

Injected into all design creation and review contexts. These patterns signal generic AI-generated design:

**Blacklisted patterns** (never use without explicit user override):
- Purple-to-blue gradient backgrounds
- 3-column icon-in-colored-circle feature grids
- Centered-everything layouts with no intentional alignment
- Uniform border-radius on all elements (use a radius scale instead)
- Decorative gradient blobs with no information purpose
- Generic hero sections with stock photography
- Emoji used as design elements (use proper iconography)
- Cookie-cutter alternating left-right section rhythm
- Gradient buttons as the only call-to-action style
- Colored left-border accent cards

When generating or reviewing design specifications, flag any of these patterns and suggest product-specific alternatives.

### 8.4: Font Guidance

**Contemporary recommendations by role:**

| Role | Recommended | Why |
|---|---|---|
| Display / Headings | Satoshi, General Sans, Instrument Serif, Fraunces | Distinctive, well-crafted, underused |
| Body text | DM Sans, Geist, Outfit, Plus Jakarta Sans | Excellent readability, modern, not overused |
| Monospace / Code | JetBrains Mono, Geist Mono, Berkeley Mono | Purpose-built for code, ligature support |
| System fallback | system-ui stack | Zero loading cost, platform-native |

**Overused defaults to avoid** (not blacklisted, but recommend alternatives):
Inter, Roboto, Open Sans, Lato, Montserrat, Poppins

**Blacklisted fonts** (never use):
Papyrus, Comic Sans, Impact, Copperplate, Brush Script

Include font loading strategy in design specifications: prefer `font-display: swap` with subset preloading for custom fonts.

### 8.5: Coherence Validation

After all design decisions are made, validate that choices reinforce each other:

```
Check 1: Aesthetic × Typography
  Brutalist direction + decorative serif → WARN: "Mismatch -- brutalist typically uses geometric sans or monospace"
  Playful direction + condensed grotesque → WARN: "Mismatch -- playful typically uses rounded, open typefaces"

Check 2: Aesthetic × Motion
  Minimal direction + expressive animations → WARN: "Mismatch -- minimal design uses purposeful, restrained motion"
  Bold direction + no motion → WARN: "Missed opportunity -- bold direction benefits from intentional motion"

Check 3: Aesthetic × Color
  Data-dense direction + limited palette → WARN: "Data visualization may need a wider color range"
  Luxury direction + saturated primary colors → WARN: "Luxury typically uses muted, desaturated tones"

Check 4: Spacing × Content Density
  Dashboard direction + generous spacing → WARN: "Dashboard users need information density -- consider tighter spacing"
  Editorial direction + tight spacing → WARN: "Reading-focused layouts need generous line-height and margins"
```

Present warnings as gentle suggestions, not blockers. The user has final say on all design decisions.

### 8.6: Integration with Design Brief

Design Consultation (Section 8) extends, not replaces, Design Brief Questioning (Section 2.1):

```
1. Run Design Brief Questions (Section 2.1, Q1-Q5) — gather scope and constraints
2. Run Design Consultation (Section 8) — propose directions and refine choices:
   a. Aesthetic Direction Proposals (8.1) — user picks a direction
   b. For each major decision: Safe vs. Risk framing (8.2)
   c. Apply Anti-Slop Blacklist (8.3) — flag any generic patterns in proposals
   d. Font Guidance (8.4) — recommend fonts aligned with chosen direction
   e. Coherence Validation (8.5) — check all choices work together
3. Generate Design System Document (Section 2.2) — enriched with consultation outputs
```

If the user wants a quick design phase without consultation, they can answer Q1 with "UI implementation / Screen design" which signals an existing design system and skips consultation (proceeds directly to Section 2.2).

---

## Section 9: Post-Implementation Design Audit

Design audit pass for `/legion:review` that evaluates implemented code against design specifications. Complements the three-lens review (Section 4) by checking what was actually built versus what was specified. Agent: `design-ui-designer` (visual audit) + `design-ux-architect` (technical audit).

### 9.1: Activation

Runs during `/legion:review` when ALL of these conditions are met:
1. Design phase detected (Section 1 heuristic)
2. Design documents exist at `.planning/designs/`
3. Implementation has been completed (SUMMARY.md files exist for build plans)
4. `settings.review.evaluator_depth == "multi-pass"` (standard review mode uses three-lens only)

When not all conditions are met: skip silently. Never block review for non-design phases.

### 9.2: Audit Categories (10 categories)

Each category contains specific check items. Findings are classified as HIGH (affects usability/accessibility), MEDIUM (visual inconsistency), or LOW (polish opportunity).

**Category 1: Visual Hierarchy & Composition** (8 items)
- [ ] Clear focal point on each screen/section
- [ ] Eye flow follows intended reading pattern (F-pattern for text, Z-pattern for marketing)
- [ ] Visual noise minimized (no competing elements at same prominence)
- [ ] Information density appropriate for content type
- [ ] Above-fold content communicates primary value proposition
- [ ] White space is intentional, not just "leftover"
- [ ] Squint test passes (hierarchy visible at 25% zoom)
- [ ] Z-index layering is correct (no overlapping elements that shouldn't overlap)

**Category 2: Typography** (10 items)
- [ ] Font count ≤ 3 (including weights as "fonts")
- [ ] Type scale follows consistent ratios (not arbitrary sizes)
- [ ] Line-height appropriate for font size (1.4-1.6 for body, 1.1-1.3 for headings)
- [ ] Measure (line length) between 45-75 characters for body text
- [ ] Heading hierarchy is clear and consistent (h1 > h2 > h3 visually distinct)
- [ ] Weight contrast creates clear distinction (not just 400 vs 500)
- [ ] No blacklisted fonts used (Section 8.4)
- [ ] Curly quotes used where appropriate (not straight quotes in prose)
- [ ] Text wrapping handled gracefully (no orphans, widows managed)
- [ ] Font loading doesn't cause layout shift (FOUT/FOIT managed)

**Category 3: Color & Contrast** (8 items)
- [ ] Color palette matches design system tokens
- [ ] WCAG AA contrast met for all text (4.5:1 normal, 3:1 large)
- [ ] Semantic colors used consistently (error = red, success = green across all contexts)
- [ ] Dark mode handled (if specified in design system)
- [ ] Color not used as only indicator (colorblind-safe patterns)
- [ ] Interactive element colors distinct from decorative colors
- [ ] Hover/focus state colors maintain contrast
- [ ] Brand colors applied per design system guidelines

**Category 4: Spacing & Layout** (8 items)
- [ ] Spacing follows design token scale (not arbitrary pixel values)
- [ ] Grid system applied consistently
- [ ] Alignment is intentional (elements on shared baselines/edges)
- [ ] Vertical rhythm maintained (consistent spacing between sections)
- [ ] Border-radius follows component hierarchy (not uniform across all elements)
- [ ] Padding consistent within component types
- [ ] Margin collapse handled correctly
- [ ] Content containers respect max-width constraints

**Category 5: Interaction States** (8 items)
- [ ] Hover states on all interactive elements
- [ ] Focus indicators visible and meet WCAG requirements
- [ ] Active/pressed states provide feedback
- [ ] Disabled states clearly communicate non-interactivity
- [ ] Loading states show progress (spinner, skeleton, or progress bar)
- [ ] Empty states are warm and guide user toward action
- [ ] Error messages are specific and suggest resolution
- [ ] Touch targets ≥ 44x44px on mobile

**Category 6: Responsive Design** (6 items)
- [ ] Mobile layout is designed (not just "stacked desktop")
- [ ] Touch targets adequate on all breakpoints
- [ ] No horizontal scroll on any viewport
- [ ] Images responsive (srcset or CSS-based)
- [ ] Text readable without zoom on mobile
- [ ] Navigation adapts appropriately (hamburger, bottom nav, etc.)

**Category 7: Motion & Animation** (5 items)
- [ ] Easing follows consistent convention (not linear for UI transitions)
- [ ] Duration appropriate (50-300ms for micro-interactions, 300-700ms for page transitions)
- [ ] Animation has clear purpose (not decorative without function)
- [ ] `prefers-reduced-motion` respected
- [ ] Transition properties are explicit (not `all`)

**Category 8: Content & Microcopy** (6 items)
- [ ] Empty states have warm, helpful copy (not "No data")
- [ ] Error messages are specific (not "Something went wrong")
- [ ] Active voice used for actions ("Save changes" not "Changes will be saved")
- [ ] No placeholder text (lorem ipsum) in production
- [ ] Long text truncated with ellipsis and full text accessible
- [ ] Confirmation messages acknowledge what happened ("Project saved" not "Success")

**Category 9: AI Slop Detection** (10 items)
- [ ] No purple/blue gradient backgrounds without brand rationale
- [ ] No 3-column icon-in-circle feature grids
- [ ] No centered-everything layout without intentional alignment
- [ ] No uniform border-radius across all element types
- [ ] No decorative gradient blobs
- [ ] No generic hero sections with stock photography
- [ ] No emoji used as design elements
- [ ] No cookie-cutter alternating left-right sections
- [ ] No gradient buttons as only CTA style
- [ ] No colored left-border accent cards without system rationale

**Category 10: Performance as Design** (5 items)
- [ ] Largest Contentful Paint < 2.5s (perceived load speed)
- [ ] Cumulative Layout Shift < 0.1 (visual stability)
- [ ] Skeleton screens match final layout structure
- [ ] Images optimized (WebP/AVIF, appropriate dimensions)
- [ ] Font loading strategy prevents FOUT flash

### 9.3: Scoring

**Design Score (A-F):** Weighted average across all 10 categories.
- Each HIGH finding: -1 letter grade
- Each MEDIUM finding: -0.5 letter grade
- LOW findings noted but don't affect grade
- Starting grade: A (no findings)

**AI Slop Score (A-F):** Standalone grade from Category 9 only.
- Each slop pattern found: -1 letter grade
- A = zero patterns, F = 5+ patterns

### 9.4: Integration with /legion:review

When review command runs for a design phase with multi-pass evaluators active:

```
1. Three-lens review runs first (Section 4 -- brand, accessibility, usability)
2. If multi-pass active: Post-Implementation Design Audit runs as additional pass
   a. design-ui-designer performs Categories 1-4, 7-9 (visual audit)
   b. design-ux-architect performs Categories 5-6, 10 (technical audit)
   c. Findings merged and deduplicated with three-lens findings
   d. Scoring computed (Section 9.3)
   e. Results appended to REVIEW.md with both scores
3. Findings with severity HIGH are added to the fix cycle (same as review-loop)
4. MEDIUM findings are reported but do not block phase completion
5. LOW findings are logged for future improvement
```

### 9.5: Relationship to Three-Lens Review

The design audit (Section 9) and three-lens review (Section 4) are complementary:

| Aspect | Three-Lens (Section 4) | Design Audit (Section 9) |
|---|---|---|
| **When** | Always on design phases | Only with multi-pass evaluators |
| **What** | Brand compliance, accessibility compliance, usability heuristics | Implementation fidelity to specs |
| **Who** | brand-guardian, ux-architect, ux-researcher | ui-designer, ux-architect |
| **Depth** | Checklist-based (6-8 items per lens) | Deep audit (74 items across 10 categories) |
| **Output** | Pass/fail findings | Scored letter grades + itemized findings |

Both run in parallel when conditions are met. Findings are merged in the final review output.

---

## References

This skill is consumed by:

| Consumer | Operation | Section |
|----------|-----------|---------|
| `phase-decomposer.md` | Design domain detection, design-aware decomposition | Sections 1, 6.1 |
| `plan.md` | Design brief questioning, consultation, document generation | Sections 2, 6.1, 7, 8 |
| `build.md` | Design wave execution, research-to-design handoff, backend-frontend integration | Sections 3.5, 6.2 |
| `review.md` | Three-lens design review, post-implementation audit | Sections 4, 6.3, 9 |
| `workflow-common.md` | Design Workflow Conventions, design paths | Section 1 (constants) |
| `agent-registry.md` | Design Sprint team assembly pattern | Section 2.3 (team assembly) |

Design document format is defined in Section 5.
Design domain detection is defined in Section 1 and must be checked before applying design patterns.
Plan-stage design review (Section 7) runs during planning when multi-pass evaluators are active.
Design consultation (Section 8) extends the design brief with aesthetic direction and coherence validation.
Post-implementation audit (Section 9) runs during review when multi-pass evaluators are active.
All consumers should handle non-design phases silently per Section 6.4 caller contract.
