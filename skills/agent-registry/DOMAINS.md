# Agent Domain Registry

Quick reference for agent authority boundaries. For full authority rules, see `.planning/config/authority-matrix.yaml`.

---

## Overview

This document provides a quick-reference mapping of agents to their exclusive domains and vice versa. Use this when assembling teams or reviewing findings to understand who has authority over what.

---

## By Division

### Engineering Division (9 agents)

| Agent | Exclusive Domains | When Active |
|-------|-------------------|-------------|
| engineering-security-engineer | security, OWASP, STRIDE, vulnerability-assessment, pentest, threat-modeling, secure-coding | All security findings routed here |
| engineering-devops-automator | CI/CD, deployment, infrastructure-as-code, containers, orchestration, Docker, Kubernetes | Infrastructure decisions deferred |
| engineering-backend-architect | backend-architecture, database-design, API-design, microservices, system-design | Backend design authority |
| engineering-frontend-developer | frontend-architecture, UI-components, state-management, client-side-routing, React, Vue, Angular | Frontend implementation authority |
| engineering-ai-engineer | AI-integration, LLM-prompts, model-selection, AI-testing, ML-ops, data-pipelines | AI-related decisions |
| engineering-mobile-app-builder | mobile-architecture, iOS, Android, React-Native, Flutter, cross-platform | Mobile-specific concerns |
| engineering-rapid-prototyper | rapid-prototyping, spike-solutions, proof-of-concept, MVP, experimentation | Quick validation work |
| engineering-laravel-specialist | Laravel, PHP, Eloquent, Blade, Artisan, Livewire, FluxUI | Laravel-specific implementations |
| engineering-senior-developer | full-stack, refactoring, code-quality, reliability | Stack-agnostic implementation lead |

### Testing Division (7 agents)

| Agent | Exclusive Domains | When Active |
|-------|-------------------|-------------|
| testing-qa-verification-specialist | production-readiness, edge-cases, failure-modes, risk-assessment | Reality-checks all outputs |
| testing-evidence-collector | verification, test-coverage, proof-artifacts, evidence-gathering | Validates test coverage |
| testing-api-tester | API-testing, contract-testing, endpoint-validation | API contract validation |
| testing-performance-benchmarker | performance, load-testing, benchmarking, optimization | Performance decisions |
| testing-workflow-optimizer | workflow-efficiency, process-automation, execution-optimization | Process improvements |
| testing-test-results-analyzer | test-analysis, failure-diagnosis, root-cause-analysis | Interprets test failures |
| testing-tool-evaluator | tool-evaluation, dependency-assessment, technology-selection | Tool selection authority |

### Design Division (6 agents)

| Agent | Exclusive Domains | When Active |
|-------|-------------------|-------------|
| design-brand-guardian | brand-consistency, visual-identity, tone-voice, brand-strategy | Brand-related decisions |
| design-ux-architect | accessibility, WCAG, information-architecture, navigation, CSS-systems, layout-frameworks | A11y and IA authority |
| design-ux-researcher | usability-testing, user-research, heuristics, behavior-analysis | UX research findings |
| design-visual-storyteller | visual-design, illustration, motion, visual-narratives, multimedia-content | Visual design and illustration |
| design-ui-designer | UI-design, component-design, design-systems, component-libraries | Design system authority |
| design-whimsy-injector | microinteractions, delight-design, animation, creative-direction, personality | Delight and personality design |

### Marketing Division (8 agents)

| Agent | Exclusive Domains | When Active |
|-------|-------------------|-------------|
| marketing-social-media-strategist | cross-platform-strategy, platform-selection, content-mix, channel-allocation | Cross-platform strategy decisions |
| marketing-content-creator | content-strategy, copywriting, editorial-calendar, brand-storytelling | Content strategy and calendar |
| marketing-growth-hacker | growth-hacking, user-acquisition, viral-loops, conversion-funnels, experimentation | Growth and acquisition |
| marketing-twitter-engager | Twitter, real-time-engagement, thought-leadership, social-listening | Twitter-specific strategy |
| marketing-instagram-curator | Instagram, visual-content, community-building, reels, aesthetic-curation | Instagram visual content |
| marketing-tiktok-strategist | TikTok, short-form-video, viral-content, algorithm-optimization | TikTok strategy |
| marketing-reddit-community-builder | Reddit, community-engagement, authentic-marketing, subreddit-strategy | Reddit community engagement |
| marketing-app-store-optimizer | ASO, app-store, conversion-optimization, app-marketing, keyword-optimization | App store optimization |

### Product Division (3 agents)

| Agent | Exclusive Domains | When Active |
|-------|-------------------|-------------|
| product-sprint-prioritizer | sprint-planning, prioritization, backlog-grooming, resource-allocation | Sprint planning authority |
| product-feedback-synthesizer | user-feedback, sentiment-analysis, product-insights, feature-requests, feedback-triage | User feedback analysis |
| product-trend-researcher | market-research, competitive-analysis, trend-identification, opportunity-assessment | Market intelligence |

### Project Management Division (5 agents)

| Agent | Exclusive Domains | When Active |
|-------|-------------------|-------------|
| project-manager-senior | task-breakdown, spec-to-tasks, scope-management, sprint-execution, implementation-planning | Task-level planning |
| project-management-project-shepherd | project-coordination, timeline-management, stakeholder-alignment, risk-management, cross-functional | Cross-functional coordination |
| project-management-studio-producer | portfolio-management, creative-direction, resource-allocation, strategic-planning, executive-oversight | Portfolio management |
| project-management-studio-operations | studio-ops, process-optimization, resource-coordination, productivity, operational-excellence | Studio operations |
| project-management-experiment-tracker | experiment-design, A/B-testing, hypothesis-validation, data-driven-decisions | Experiment design |

### Support Division (5 agents)

| Agent | Exclusive Domains | When Active |
|-------|-------------------|-------------|
| *(support-analytics-reporter consolidated into data-analytics-engineer in Specialized division)* | | |
| support-finance-tracker | financial-planning, budget-management, cash-flow, investment-analysis, financial-risk | Financial planning |
| support-infrastructure-maintainer | infrastructure, system-reliability, monitoring, cloud-management, cost-optimization | Infrastructure operations |
| support-legal-compliance-checker | legal-compliance, risk-assessment, policy-development, regulatory, GDPR-privacy | Legal compliance |
| support-executive-summary-generator | executive-summaries, strategy-consulting, C-suite-reporting, business-communication | Executive reporting |
| support-support-responder | customer-support, ticket-management, issue-resolution, user-onboarding | Customer support |

### Spatial Computing Division (6 agents)

| Agent | Exclusive Domains | When Active |
|-------|-------------------|-------------|
| visionos-spatial-engineer | visionOS, spatial-computing, SwiftUI-volumetric, liquid-glass, RealityKit | Native visionOS development |
| macos-spatial-metal-engineer | Metal, Swift, 3D-rendering, macOS, Vision-Pro | Metal and 3D rendering |
| xr-interface-architect | spatial-UX, XR-interfaces, comfort-design, 3D-navigation, presence-optimization | Spatial interaction design |
| xr-immersive-developer | WebXR, AR-VR, browser-3D, immersive-apps, cross-platform-XR | WebXR development |
| xr-cockpit-interaction-specialist | XR-cockpit, spatial-controls, immersive-UI, cockpit-design, high-presence | XR cockpit systems |
| terminal-integration-specialist | terminal-emulation, SwiftTerm, text-rendering, Swift-UI, VT100 | Terminal emulation |

### Specialized Division (4 agents)

| Agent | Exclusive Domains | When Active |
|-------|-------------------|-------------|
| agents-orchestrator | orchestration, pipeline-management, workflow-automation, agent-coordination, dev-qa-loops | Agent coordination |
| data-analytics-engineer | data-pipelines, ETL, data-quality, data-warehouse, data-engineering, dashboards, kpi-reporting, business-intelligence | Full-stack data analytics |
| lsp-index-engineer | LSP, code-intelligence, semantic-indexing, language-servers, developer-tooling | LSP and code intelligence |
| polymath | exploration, clarification, research-first, structured-questions, gap-detection | Pre-flight alignment |

---

## By Domain (Reverse Index)

### Security Domain
- **Owner**: engineering-security-engineer
- **Scope**: OWASP Top 10, STRIDE analysis, vulnerability assessment, penetration testing, secure coding
- **Deferred by**: All other agents

### Performance Domain
- **Owner**: testing-performance-benchmarker
- **Scope**: Load testing, benchmarks, optimization recommendations, latency analysis
- **Deferred by**: Engineering divisions, other testing agents

### Accessibility Domain
- **Owner**: design-ux-architect
- **Scope**: WCAG compliance, screen readers, keyboard navigation, CSS systems
- **Deferred by**: engineering-frontend-developer, design-ui-designer

### API Design Domain
- **Owner**: engineering-backend-architect
- **Scope**: REST/GraphQL design, endpoint architecture, API contracts
- **Deferred by**: engineering-frontend-developer, testing-api-tester

### Database Design Domain
- **Owner**: engineering-backend-architect
- **Scope**: Schema design, data modeling, query optimization
- **Deferred by**: All other engineering agents

### AI Integration Domain
- **Owner**: engineering-ai-engineer
- **Scope**: LLM integration, model selection, prompt engineering, ML ops
- **Deferred by**: All other agents

### Brand Domain
- **Owner**: design-brand-guardian
- **Scope**: Visual identity, brand consistency, tone and voice
- **Deferred by**: design-ui-designer, marketing-content-creator, marketing-social-media-strategist

### UI Design Domain
- **Owner**: design-ui-designer
- **Scope**: Component design, design systems, visual interface
- **Deferred by**: engineering-frontend-developer

### Content Strategy Domain
- **Owner**: marketing-content-creator
- **Scope**: Editorial calendar, copywriting, brand storytelling
- **Deferred by**: marketing-social-media-strategist, design-brand-guardian

### Growth Domain
- **Owner**: marketing-growth-hacker
- **Scope**: User acquisition, viral loops, conversion funnels, experimentation
- **Deferred by**: marketing-social-media-strategist

### Sprint Planning Domain
- **Owner**: product-sprint-prioritizer
- **Scope**: Backlog prioritization, sprint execution, resource allocation
- **Deferred by**: project-manager-senior, project-management-project-shepherd

### Project Coordination Domain
- **Owner**: project-management-project-shepherd
- **Scope**: Timeline management, stakeholder alignment, cross-functional coordination
- **Deferred by**: project-manager-senior

### Infrastructure Domain
- **Owner**: engineering-devops-automator (primary), support-infrastructure-maintainer (secondary)
- **Scope**: CI/CD, deployment, orchestration, system reliability
- **Deferred by**: All other agents
- **Note**: DevOps owns implementation; Infrastructure Maintainer owns operations

### Testing Domain
- **Owner**: testing-qa-verification-specialist (general), testing-api-tester (API-specific), testing-performance-benchmarker (perf-specific)
- **Scope**: Verification, coverage, quality assurance
- **Deferred by**: All non-testing agents
- **Note**: Testing agents defer to each other based on specificity

### Analytics Domain
- **Owner**: data-analytics-engineer
- **Scope**: Dashboards, KPI reporting, data pipelines, ETL, data quality, statistical analysis, executive reporting
- **Deferred by**: Product and marketing agents
- **Note**: Full-stack analytics — infrastructure through delivery

### Legal/Compliance Domain
- **Owner**: support-legal-compliance-checker
- **Scope**: Regulatory compliance, policy development, GDPR, risk assessment
- **Deferred by**: All other agents

### Spatial/VR Domain
- **Owner**: visionos-spatial-engineer (visionOS), xr-interface-architect (general XR), xr-immersive-developer (WebXR)
- **Scope**: Spatial computing, immersive interfaces, 3D navigation
- **Deferred by**: Standard engineering agents
- **Note**: Choose based on platform specificity

### Orchestration Domain
- **Owner**: agents-orchestrator
- **Scope**: Multi-agent coordination, pipeline management, dev-qa loops
- **Deferred by**: All other agents during multi-agent execution

### LSP/Code Intelligence Domain
- **Owner**: lsp-index-engineer
- **Scope**: Language servers, semantic indexing, developer tooling
- **Deferred by**: All other engineering agents

### Exploration Domain
- **Owner**: polymath
- **Scope**: Idea crystallization, structured questioning, gap detection
- **Deferred by**: All other agents during pre-flight alignment

---

## Conflict Resolution Quick Reference

| Scenario | Rule |
|----------|------|
| Same domain, multiple agents | Higher specificity wins (see hierarchy below) |
| Overlapping domains | Both active, findings merged |
| Out-of-domain critique | Filtered when domain owner present |
| Severity disagreement | BLOCKER from any agent overrides WARNING |
| Implementation vs Operations | DevOps owns impl, Infrastructure Maintainer owns ops |

### Specificity Hierarchy

1. **Level 1** (Highest): Specific tool/framework (e.g., "laravel", "visionos")
2. **Level 2**: Domain subcategory (e.g., "api-design", "accessibility")
3. **Level 3**: Broad domain (e.g., "security", "performance")
4. **Level 4** (Lowest): General concerns (e.g., "full-stack", "code-quality")

---

## Team Assembly Guidelines

### When Multiple Agents Claim a Domain

1. Check specificity hierarchy — more specific beats general
2. Check task context — implementation vs review vs operations
3. When in doubt, include both and let authority-enforcer handle conflicts

### Example Conflict Resolutions

| Situation | Resolution |
|-----------|------------|
| Both security-engineer and backend-architect on panel | security-engineer owns security findings; backend-architect defers on security domain |
| Both testing-performance-benchmarker and testing-api-tester on panel | API performance → API tester defers to performance benchmarker; General performance → performance benchmarker leads |
| Both devops-automator and infrastructure-maintainer on panel | DevOps owns CI/CD pipeline design; Infrastructure Maintainer owns production operations |
| Both polymath and trend-researcher on panel | Polymath leads exploration phase; Trend Researcher provides market context |

---

## Usage in Plans

When assigning agents in a plan, reference this registry:

```markdown
<task type="auto">
  <name>Security Audit</name>
  <assigned_agent>engineering-security-engineer</assigned_agent>
  <rationale>Security domain authority per DOMAINS.md</rationale>
</task>
```

When reviewing findings, check against this registry to ensure domain owners weren't overridden:

```markdown
<review>
  <finding>
    <reviewer>testing-qa-verification-specialist</reviewer>
    <criterion>Security vulnerability in auth flow</criterion>
    <action>DEFERRED — routed to security-engineer per domain ownership</action>
  </finding>
</review>
```

---

## Related Documents

- **Full Authority Matrix**: `.planning/config/authority-matrix.yaml` — Complete YAML with all domains and rules
- **Authority Enforcer Skill**: `skills/authority-enforcer/SKILL.md` — Implementation details for boundary validation
- **Agent Catalog**: `skills/agent-registry/CATALOG.md` — Full agent listings with specialties and task types

---

## Maintenance

Update this document when:
- New agents are added
- Agent domains change
- New domain categories emerge
- Conflict patterns are identified

Last updated: 2026-03-05
