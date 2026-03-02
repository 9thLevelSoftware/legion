# Phase 14: Design Workflows — Research

## Domain Analysis

### Design Division Agents (6 total)

| Agent | Specialty | Key Capabilities |
|-------|-----------|-----------------|
| design-brand-guardian | Brand strategy & identity | Brand foundation, visual identity systems, brand voice, compliance monitoring |
| design-ui-designer | Visual design systems | Component libraries, design tokens, accessibility (WCAG AA), dark mode, developer handoff |
| design-ux-architect | Technical architecture & UX | CSS systems, layout frameworks, responsive breakpoints, theme toggles, design-to-code bridge |
| design-ux-researcher | User behavior analysis | Research methodology, usability testing, personas, journey mapping, A/B testing |
| design-visual-storyteller | Visual narrative & multimedia | Story arcs, storyboarding, infographics, data visualization, cross-platform adaptation |
| design-whimsy-injector | Delight design & personality | Micro-interactions, playful copy, Easter eggs, gamification, accessible animations |

### Existing Design Infrastructure

1. **agent-registry.md Section 4** — "Design Sprint" team assembly pattern exists:
   - Research: design-ux-researcher
   - Architecture: design-ux-architect
   - Visual Design: design-ui-designer
   - Brand Review: design-brand-guardian
   - Feedback: product-feedback-synthesizer

2. **review-loop.md Section 2** — "design" phase type already mapped:
   - Primary Reviewer: design-brand-guardian
   - Secondary Reviewer: testing-reality-checker

3. **phase-decomposer.md** — No design domain detection (only marketing)

### Requirements Breakdown

**DSN-01: Design System Creation**
- Component library structure (atomic design: tokens → atoms → molecules → organisms)
- Design token taxonomy (colors, typography, spacing, elevation, animation)
- Visual style specification format
- Developer handoff documentation
- Primary agents: design-ui-designer (lead), design-brand-guardian (brand alignment), design-ux-architect (technical foundation)

**DSN-02: UX Research Workflow**
- Research planning (goals, methodology selection, participant recruitment)
- Data collection protocols (interviews, surveys, usability tests, analytics)
- Analysis and synthesis (affinity mapping, thematic analysis, journey maps)
- Deliverable templates (research report, persona, journey map)
- Primary agents: design-ux-researcher (lead), design-ux-architect (IA validation)

**DSN-03: Design Review Cycle**
- Three review lenses beyond the existing generic design review:
  1. **Brand review** — design-brand-guardian: visual identity compliance, voice consistency, brand guidelines adherence
  2. **Accessibility review** — design-ux-architect: WCAG compliance, responsive behavior, keyboard/screen-reader, color contrast
  3. **Usability review** — design-ux-researcher: information architecture, user flow analysis, heuristic evaluation (Nielsen's 10)
- Integration with existing review-loop.md review cycle
- Design-specific finding categories (brand violation, accessibility failure, usability issue)

## Pattern Analysis

### Marketing Workflows Parallel

Phase 13 (marketing) provides the exact template:

| Marketing Concept | Design Equivalent |
|-------------------|-------------------|
| Campaign document | Design system document |
| Channel-Agent Mapping | Discipline-Agent Mapping |
| Campaign brief questioning | Design brief questioning |
| Marketing domain detection | Design domain detection |
| Marketing wave pattern | Design wave pattern |
| Content calendar | Design deliverables timeline |
| Cross-channel coordination | Cross-discipline coordination |
| Campaign lifecycle | Design project lifecycle |

### Design Domain Detection Signals

1. **Requirement IDs**: Phase requirements include DSN-* IDs
2. **Keywords**: "design system", "component library", "UX research", "usability testing", "accessibility audit", "brand guidelines", "design tokens", "wireframes", "prototypes", "user testing", "design review", "user persona", "user journey", "information architecture", "visual design"
3. **Agent signal**: agent-registry recommends majority design-division agents for the phase

### Design-Specific Wave Pattern

- **Wave 1: Research & Foundation**
  Agents: design-ux-researcher (research lead), design-brand-guardian (brand audit)
  Produces: Research brief, user insights, brand foundation, design principles

- **Wave 2: Design System & Creation**
  Agents: design-ui-designer (design lead) + design-ux-architect + design-visual-storyteller
  Input: Wave 1 research + brand guidelines
  Produces: Design system document, component specs, visual language

- **Wave 3 (optional — only if phase scope includes polish/validation)**:
  Agents: design-whimsy-injector + review agents
  Input: Wave 2 design system + components
  Produces: Enhanced specs with delight, audit reports

### Discipline-Agent Mapping

| Design Discipline | Primary Agent | Supporting Agent |
|-------------------|---------------|-----------------|
| Design Systems | design-ui-designer | design-brand-guardian |
| UX Architecture | design-ux-architect | design-ux-researcher |
| Brand & Identity | design-brand-guardian | design-ui-designer |
| User Research | design-ux-researcher | design-ux-architect |
| Visual Storytelling | design-visual-storyteller | design-brand-guardian |
| Delight & Polish | design-whimsy-injector | design-ui-designer |

### Design Team Assembly

**Required roles (always included):**

| Role | Agent | Responsibilities |
|------|-------|-----------------|
| Design Lead | design-ui-designer | Component library, visual system, design tokens, developer handoff |
| Research Lead | design-ux-researcher | User research, usability testing, persona development, journey mapping |

**Discipline-specific roles (based on project scope):**
- Map each design discipline to its primary agent using the Discipline-Agent Mapping
- If a discipline's primary agent is already assigned as Design Lead or Research Lead, no duplicate

**Optional roles (add based on project needs):**

| Condition | Role | Agent | Division |
|-----------|------|-------|----------|
| Project has established brand identity | Brand Alignment | design-brand-guardian | design |
| Project needs technical CSS/layout foundation | Technical Foundation | design-ux-architect | design |
| Project is visually intensive | Visual Design | design-visual-storyteller | design |
| Project needs micro-interactions/delight | Delight Design | design-whimsy-injector | design |
| Design-to-code handoff needed | Frontend Dev | engineering-frontend-developer | engineering |
| User feedback integration needed | Feedback | product-feedback-synthesizer | product |

### Design Document Artifacts

Output directory: `.planning/designs/`

Two primary document types:

1. **Design System Document** — `{DESIGN_DIR}/{project-slug}-system.md`
   Component library, tokens, visual language, developer handoff

2. **UX Research Report** — `{DESIGN_DIR}/{research-slug}-research.md`
   Research plan, findings, personas, journey maps, recommendations

### Design Project Lifecycle

```
Unplanned → Research → Designing → Review → Complete
```

- **Unplanned**: Phase not yet planned
- **Research**: User research underway, brand audit in progress (Wave 1)
- **Designing**: Design system creation, component development (Wave 2)
- **Review**: Brand/accessibility/usability review cycle (Wave 3 or /agency:review)
- **Complete**: Design system documented, handoff ready

### Design Review Enhancement (DSN-03)

Current review-loop.md for "design" type: design-brand-guardian (primary) + testing-reality-checker (secondary).

Enhanced design review uses **three specialized lenses**:

| Lens | Reviewer | Checks |
|------|----------|--------|
| Brand | design-brand-guardian | Visual identity compliance, brand voice, color/typography adherence, logo usage |
| Accessibility | design-ux-architect | WCAG AA compliance, color contrast (4.5:1), keyboard navigation, screen reader support, responsive breakpoints |
| Usability | design-ux-researcher | Nielsen's 10 heuristics, information architecture, user flow completeness, error recovery, learnability |

This maps to review-loop.md's existing structure — when phase type includes "design" AND design-workflows skill is active, use the three-lens review instead of the single design-brand-guardian default.

### Anti-Patterns to Avoid

1. **Don't duplicate agent personalities** — design-workflows should reference agent capabilities, not redefine them
2. **Don't create a /agency:design command** — design workflows integrate into existing /agency:plan and /agency:build, same as marketing
3. **Don't make research mandatory** — some design phases skip research (e.g., applying an existing design system to new screens)
4. **Don't prescribe design tools** — the skill defines deliverable formats, not tools (Figma, Sketch, etc.)
5. **Don't create rigid templates** — design projects vary more than marketing campaigns; keep structure flexible
6. **Don't overload the review cycle** — three lenses run in parallel, not sequentially; max 3 review cycles still applies

### Skill Structure (6 Sections)

Following the marketing-workflows pattern:

1. **Section 1: Principles & Design Domain Detection** — When and how design workflows apply, constants, discipline-agent mapping, graceful degradation
2. **Section 2: Design System Workflow (DSN-01)** — Design brief questioning, system document generation, token taxonomy, component architecture, team assembly
3. **Section 3: UX Research Workflow (DSN-02)** — Research planning, methodology selection, data collection, synthesis, deliverable templates
4. **Section 4: Design Review Cycle (DSN-03)** — Three-lens review (brand, accessibility, usability), finding categories, review criteria, integration with review-loop
5. **Section 5: Design Document Formats** — Design system document template, UX research report template, status values
6. **Section 6: Integration Patterns** — plan.md (design detection + questioning), build.md (design wave execution), review.md (three-lens review), caller contract
