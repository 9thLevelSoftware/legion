# Agent Roster Analysis — v6.0 Post-Ship Review

*Date: 2026-03-07 | Context: v6.0.0 shipped with 53 agents across 9 divisions*

## Redundancies & Overlaps

### Social Media Agents (Low Priority — Intentional)
- **Agents**: marketing-instagram-curator, marketing-twitter-engager, marketing-tiktok-strategist, marketing-reddit-community-builder
- **Overlap with**: marketing-social-media-strategist (cross-platform coordinator)
- **Assessment**: Intentional design. Each platform has genuinely different content formats, algorithms, and engagement patterns. The strategist sits above as coordinator. However, if marketing workflows are underused, these add roster weight.
- **Potential action**: Consolidate to 2 agents (social-media-strategist + platform-content-specialist) if marketing usage stays low.

### Project Management (Low Priority — Vertical Split)
- **Agents**: project-manager-senior, project-management-project-shepherd, project-management-studio-producer
- **Assessment**: Not horizontal overlap — these serve different vertical scopes: task-level (senior PM), cross-functional coordination (shepherd), portfolio/strategic (producer). Naming doesn't make this obvious.
- **Potential action**: Rename to clarify scope hierarchy, or consolidate shepherd + senior PM if portfolio-level planning is rare.

### Analytics (Medium Priority — Build vs. Consume)
- **Agents**: data-analytics-reporter, support-analytics-reporter
- **Assessment**: data-analytics-reporter focuses on infrastructure (ETL, pipelines, warehouses); support-analytics-reporter focuses on dashboards and KPI reporting. The split is build-vs-consume. A single strong data agent could cover both.
- **Potential action**: Merge into one "Data Analyst" with both pipeline-building and reporting capabilities.

### XR / Spatial Computing (Medium Priority — Niche Density)
- **Agents**: visionos-spatial-engineer, macos-spatial-metal-engineer, xr-interface-architect, xr-immersive-developer, xr-cockpit-interaction-specialist, terminal-integration-specialist (6 agents)
- **Assessment**: Purpose-built for spatial computing workflows. If not building visionOS/WebXR apps, these are dead weight.
- **Potential action**: Consolidate to 2-3 agents (platform engineer, interface architect, immersive developer). Roll cockpit specialist into interface architect. Move terminal-integration-specialist to engineering division.

## Gaps & Missing Roles

### DBA / Data Engineer (Partial Coverage)
- **Current coverage**: engineering-backend-architect (database-design, data-modeling domains), data-analytics-reporter (pipelines, ETL)
- **Gap**: Dedicated schema migration expertise, database performance tuning, index optimization, replication/sharding strategy
- **Priority**: Medium — covered partially but not deeply

### SRE / Cloud Architect (Partial Coverage)
- **Current coverage**: engineering-devops-automator (infra-as-code, containers), support-infrastructure-maintainer (system reliability, monitoring)
- **Gap**: Incident response runbooks, high-availability architecture design, chaos engineering, cloud topology design (AWS/GCP/Azure specific)
- **Priority**: Medium — covered partially but incident response is a genuine gap

### Accessibility Specialist (Covered but Not Dedicated)
- **Current coverage**: design-ux-architect has `accessibility` and `wcag` as exclusive domains
- **Gap**: No dedicated a11y agent. Screen reader testing, ARIA patterns, cognitive accessibility, and inclusive design are folded into a broader UX role.
- **Priority**: Low — functionally covered, dedicated agent only needed for accessibility-heavy projects

### Localization / i18n (Not Covered)
- **Current coverage**: None
- **Gap**: Translation workflows, locale-specific content adaptation, i18n engineering standards (ICU message format, RTL support, pluralization), regional marketing adaptation
- **Priority**: Low until internationalization becomes a project requirement

### Sales / Customer Success (Not Covered)
- **Current coverage**: Marketing covers top-of-funnel, support-support-responder covers post-sale
- **Gap**: Mid-funnel: lead generation, outreach sequences, demo preparation, onboarding flows, retention strategy, account management, churn analysis
- **Priority**: Low — Legion is developer-focused; sales workflows are an unlikely near-term need

## Structural Inconsistencies

### Framework-Specific Anomaly
- **Agent**: engineering-laravel-specialist (only framework-specific agent in roster)
- **Assessment**: Reflects the primary user's tech stack. High-frequency frameworks warrant dedicated agents. Not an inconsistency per se — but if the pattern were expanded, React/Vue/Django specialists would follow.
- **Recommendation**: Document as intentional. Add framework specialists only when a specific stack is used daily.

### Task-Like Agents (Capability vs. Persona)
- **Agents**: support-executive-summary-generator, product-feedback-synthesizer
- **Assessment**: These read more like specific capabilities than fully-fledged personas. An "Executive Assistant" or "Product Manager" agent could invoke these as skills.
- **Recommendation**: Consider restructuring as skills invoked by broader agents in a future version. Low priority — they work fine as standalone agents.

## Summary

| Category | Count | Priority | Recommended Action |
|----------|-------|----------|--------------------|
| Social media consolidation | 4 → 2 | Low | Consolidate if marketing underused |
| PM naming/consolidation | 3 → 2-3 | Low | Rename for clarity |
| Analytics merge | 2 → 1 | Medium | Merge build + consume |
| XR consolidation | 6 → 2-3 | Medium | Consolidate if XR unused |
| DBA/Data Engineer gap | 0 → 1 | Medium | New agent if DB work grows |
| SRE/Cloud Architect gap | 0 → 1 | Medium | New agent if infra work grows |
| a11y specialist gap | 0 → 1 | Low | Covered by UX Architect |
| i18n gap | 0 → 1 | Low | New agent when needed |
| Sales/CS gap | 0 → 1-2 | Low | New agents when needed |
| Task-like agents | 2 | Low | Restructure as skills |
| Laravel anomaly | 1 | Low | Document as intentional |

**Net recommendation**: The roster is strong. No urgent changes needed for v6.0. For v7.0, the highest-value changes would be analytics merge, XR consolidation (if unused), and adding DBA + SRE agents if infrastructure work increases. The social media and PM structures are defensible as-is.
