# Phase 13: Marketing Workflows - Research

**Researched:** 2026-03-01
**Domain:** Marketing campaign planning, content calendar generation, cross-channel coordination — implemented as a Claude Code skill orchestrating 8 marketing agents through structured workflows
**Confidence:** HIGH

---

## Summary

Phase 13 adds structured marketing workflows to The Agency: instead of only using marketing agents ad-hoc via `/agency:quick` or generic `/agency:build` plans, marketing-focused phases get domain-specific decomposition with campaign planning, content calendars, and cross-channel coordination built in.

The deliverable is a new `marketing-workflows` skill (analogous to `codebase-mapper`, `github-sync`, and other domain skills) plus integration into the planning flow so marketing phases produce structured campaign artifacts. The skill defines campaign document format, content calendar structure, cross-channel brief templates, and marketing-specific wave patterns (strategy → content creation → channel distribution → measurement).

The 8 marketing agents are already built and registered:
- **Channel Specialists** (5): Twitter Engager, Instagram Curator, TikTok Strategist, Reddit Community Builder, App Store Optimizer
- **Strategic Enablers** (2): Content Creator, Social Media Strategist
- **Growth Focus** (1): Growth Hacker

What's missing is the orchestration layer that coordinates these agents for campaign execution. Currently, marketing tasks are decomposed with the same generic phase-decomposer logic used for engineering work. Phase 13 adds marketing-aware decomposition so campaign work flows through structured stages with proper artifact generation.

**Primary recommendation:** Build one new skill (`marketing-workflows`) and update workflow-common with Marketing Workflow Conventions. Then wire marketing domain detection into the planning flow so marketing phases automatically use the new skill's templates and patterns.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MKT-01 | Campaign planning workflow — structured campaign creation with marketing agents | marketing-workflows skill Section 2 (Campaign Planning): guided campaign questioning, structured document generation, agent mapping |
| MKT-02 | Content calendar generation — time-based content planning with assignments | marketing-workflows skill Section 3 (Content Calendar): time-based scheduling, channel-agent mapping, content type distribution |
| MKT-03 | Cross-channel coordination — align messaging across social, email, web | marketing-workflows skill Section 4 (Cross-Channel Coordination): core message derivation, channel adaptation, consistency validation |
</phase_requirements>

---

## Standard Stack

### Core (all already available)

| Tool | Purpose | Why Standard |
|------|---------|--------------|
| AskUserQuestion | Campaign brief questioning (audience, objectives, channels, timeline) | Already used in questioning-flow, phase-decomposer |
| Write | Producing campaign documents and content calendars | Already used throughout all Agency skills |
| Read | Reading existing campaign artifacts for cross-campaign consistency | Already used throughout all Agency skills |
| Agent | Spawning marketing agents with personality injection for campaign execution | Already used in wave-executor |

### No New Dependencies

This phase requires zero new npm packages, external tools, or MCP servers. Campaign planning is Claude reading marketing briefs and producing structured documents — same approach as all prior phases.

### State Files Added

| File | Path | Purpose | Lifecycle |
|------|------|---------|-----------|
| Campaign documents | `.planning/campaigns/{campaign-slug}.md` | Structured campaign plans with objectives, messaging, audience, channels, calendar, and agent assignments | Created during marketing phase planning; updated during execution |

---

## Architecture Patterns

### Recommended File Layout (Phase 13 deliverables)

```
.claude/skills/agency/
  marketing-workflows.md        — NEW: marketing campaign planning engine (Sections 1-6)

.claude/skills/agency/
  workflow-common.md             — UPDATED: Marketing Workflow Conventions section + campaign paths

.claude/commands/agency/
  plan.md                        — UPDATED: marketing domain detection in decomposition step

.claude/skills/agency/
  phase-decomposer.md            — UPDATED: marketing-specific decomposition patterns

.planning/
  campaigns/                     — PRODUCED AT RUNTIME: campaign artifacts directory
    {campaign-slug}.md           — Individual campaign documents

.planning/REQUIREMENTS.md        — UPDATED: MKT-01/02/03 checked
CLAUDE.md                        — UPDATED: marketing workflows documented
```

**Total deliverables:** 1 file created (skill), 4 files updated.

### Pattern 1: Marketing Workflows Skill Structure (mirrors codebase-mapper, github-sync)

```
## Section 1: Principles & Marketing Domain Detection
  - When marketing-specific workflows apply (vs generic decomposition)
  - Marketing phase detection heuristics (requirement IDs, task type keywords)
  - Constants (campaign paths, default channel set, content type taxonomy)
  - Graceful degradation (absent campaigns dir = skip marketing enrichment)

## Section 2: Campaign Planning Workflow (MKT-01)
  - Campaign brief questioning (5-8 key inputs)
  - Campaign document format and sections
  - Audience definition and segmentation
  - Objective-to-channel mapping
  - Agent assignment based on channel selection
  - Budget allocation guidance

## Section 3: Content Calendar Generation (MKT-02)
  - Calendar format and structure
  - Content type taxonomy (blog, social post, email, video script, etc.)
  - Time-based scheduling patterns (launch, sustain, pulse)
  - Channel-agent mapping (which agent handles which content type)
  - Frequency and cadence recommendations per channel

## Section 4: Cross-Channel Coordination (MKT-03)
  - Core message derivation from campaign objectives
  - Channel adaptation framework (same message, different format/tone)
  - Consistency validation checklist
  - Cross-channel timing alignment
  - Handoff patterns between agents (strategy → content → channel)

## Section 5: Campaign Document Format
  - Full format specification for .planning/campaigns/{slug}.md
  - Required sections: Overview, Objectives, Audience, Channels, Core Messaging,
    Content Calendar, Agent Assignments, Success Metrics, Timeline
  - Optional sections: Budget, Competitive Context, Risk Areas

## Section 6: Integration Patterns
  - How phase-decomposer detects and handles marketing phases
  - How plan.md triggers campaign-specific questioning
  - How build.md executes marketing plans with proper wave structure
  - Campaign lifecycle: planning → creation → distribution → measurement
```

### Pattern 2: Campaign Document Format

The output artifact follows the same human-readable markdown convention as all Agency state files.

```markdown
# Campaign: {Campaign Name}

**Created:** {YYYY-MM-DD}
**Status:** Planning | Active | Complete
**Timeline:** {start_date} to {end_date}
**Owner:** {primary marketing agent}

## Objectives
- Primary: {main campaign goal — e.g., "Launch product X awareness"}
- Secondary: {supporting goals — e.g., "Build email list to 5K subscribers"}
- Success Metrics:
  | Metric | Target | Measurement |
  |--------|--------|-------------|
  | Reach  | 100K impressions | Platform analytics |
  | Engagement | 5% avg rate | Platform analytics |
  | Conversions | 500 signups | Landing page tracking |

## Target Audience
- **Primary**: {demographic, psychographic, behavioral}
- **Secondary**: {adjacent audience}
- **Channels where they live**: {platform list with rationale}

## Core Messaging
- **Key Message**: {one-sentence core message}
- **Supporting Messages**: {2-3 supporting points}
- **Tone**: {brand voice for this campaign}
- **Hashtags**: {campaign-specific hashtags}
- **CTA**: {primary call-to-action}

## Channel Strategy
| Channel | Agent | Role | Content Types | Frequency |
|---------|-------|------|---------------|-----------|
| Twitter | marketing-twitter-engager | Launch buzz, real-time engagement | Threads, polls, replies | Daily |
| Instagram | marketing-instagram-curator | Visual storytelling | Posts, Stories, Reels | 3x/week |
| TikTok | marketing-tiktok-strategist | Viral awareness | Short-form video | 2x/week |
| Reddit | marketing-reddit-community-builder | Authentic community engagement | Posts, AMAs | Weekly |
| Blog/Web | marketing-content-creator | Long-form content, SEO | Articles, guides | Weekly |

## Content Calendar
| Week | Mon | Tue | Wed | Thu | Fri |
|------|-----|-----|-----|-----|-----|
| W1 (Launch) | Twitter thread (launch) | Instagram Reel (teaser) | Blog post (deep dive) | TikTok video | Reddit AMA |
| W2 (Sustain) | Twitter poll | Instagram Stories | Email newsletter | TikTok trend | Community engagement |
| ... | ... | ... | ... | ... | ... |

## Agent Assignments
| Agent | Responsibilities | Deliverables |
|-------|-----------------|--------------|
| marketing-social-media-strategist | Overall strategy, cross-channel alignment | Strategy brief, weekly coordination |
| marketing-content-creator | Core content production | Blog posts, email copy, landing page copy |
| marketing-twitter-engager | Twitter execution | Threads, polls, engagement replies |
| ... | ... | ... |

## Cross-Channel Consistency
- All channels use the same core message (adapted for platform format)
- Visual assets: consistent color palette, typography, imagery style
- Hashtag usage: campaign hashtag on all platforms
- Timing: coordinated launch across channels (staggered by 2-4 hours for optimal reach)
- Voice: consistent brand tone, adapted for platform norms (formal on LinkedIn, casual on TikTok)

## Timeline
| Phase | Dates | Activities |
|-------|-------|-----------|
| Pre-launch | W-2 to W-1 | Teasers, audience building, content creation |
| Launch | W1 | Coordinated multi-channel launch |
| Sustain | W2-W4 | Regular content, engagement, optimization |
| Measure | W5 | Performance analysis, learnings capture |
```

### Pattern 3: Marketing Phase Detection Heuristic

```
How phase-decomposer detects marketing phases:

1. Check phase requirements:
   - Any MKT-* requirement IDs → marketing phase
2. Check phase description keywords:
   - "campaign", "content calendar", "social media", "cross-channel",
     "marketing", "brand", "audience", "engagement" → marketing phase
3. Check recommended agents from agent-registry:
   - If majority of recommended agents are from marketing division → marketing phase

If marketing phase detected:
  → Read marketing-workflows skill for domain-specific decomposition
  → Offer campaign-specific questioning (Section 2)
  → Generate campaign document alongside plan files
  → Use marketing wave pattern (strategy → creation → distribution)
```

### Pattern 4: Marketing-Specific Wave Structure

```
Standard marketing campaign waves:

Wave 1: Strategy & Planning
  - Social Media Strategist: overall campaign strategy document
  - Growth Hacker: audience analysis, funnel design, metrics framework
  → Produces: campaign strategy brief, success metrics, audience segments

Wave 2: Content Creation
  - Content Creator: core content (blog posts, email copy, landing pages)
  - Channel specialists (in parallel): platform-specific content
  → Produces: content assets, channel-adapted messaging, visual briefs

Wave 3: Distribution & Engagement (if campaign extends to execution)
  - All channel agents in parallel: execute on their platforms
  → Produces: published content, engagement reports
```

### Anti-Patterns to Avoid

- **Do not create a new command**: Marketing workflows integrate into the existing `/agency:plan` and `/agency:build` flow. Adding `/agency:campaign` would fragment the user experience and violate the principle of minimal commands.
- **Do not generate fake analytics**: Campaign documents include metrics targets but never fabricate actual performance data. Measurement is the user's responsibility via their actual platforms.
- **Do not hardcode channel lists**: Different campaigns use different channels. The skill provides a channel taxonomy but lets the user select which channels to activate.
- **Do not require all 8 marketing agents**: A campaign might only need 3-4 agents. The skill should recommend based on channel selection, not mandate all agents.
- **Do not over-structure content calendars**: Calendars should be flexible templates, not rigid schedules. Content types and frequencies are suggestions the user confirms, not mandates.
- **Do not block non-marketing phases**: All marketing workflow features degrade gracefully. Non-marketing phases see zero impact.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Campaign brief gathering | Custom questioning engine | AskUserQuestion (existing primitive) + structured prompts from marketing-workflows skill | Already proven in questioning-flow skill |
| Agent selection for channels | Custom matching algorithm | agent-registry recommendation algorithm (Section 3) with marketing task types | Already works for marketing agents |
| Content scheduling | Calendar generation code | Markdown table templates in the skill | Claude can fill templates directly; no code needed |
| Cross-channel consistency | Validation engine | Checklist in the skill + review-loop for verification | QA agents already review for consistency |

---

## Common Pitfalls

### Pitfall 1: Over-Specifying Campaign Details in Plans
**What goes wrong:** Plan files try to include the full campaign document, making plans 500+ lines and hard to review.
**Why it happens:** Conflating the campaign document (output) with the plan (instructions).
**How to avoid:** Plans instruct agents to PRODUCE campaign documents. The campaign document lives at `.planning/campaigns/{slug}.md`, referenced by but not embedded in plans.
**Warning signs:** Plan files with embedded content calendars or full messaging frameworks.

### Pitfall 2: Treating Marketing Like Engineering
**What goes wrong:** Marketing phases decomposed into technical waves (build → test → deploy) rather than marketing waves (strategy → create → distribute).
**Why it happens:** phase-decomposer defaults to engineering patterns.
**How to avoid:** Marketing domain detection triggers marketing-specific wave patterns from the marketing-workflows skill.
**Warning signs:** Marketing plans with "test suite" or "deployment" tasks.

### Pitfall 3: Ignoring Cross-Channel Coordination
**What goes wrong:** Each channel agent works independently, producing inconsistent messaging.
**Why it happens:** Parallel execution without shared context.
**How to avoid:** Wave 1 produces a strategy brief with core messaging. All Wave 2 agents receive this brief as context. Section 4 of the skill defines the handoff pattern.
**Warning signs:** Channel-specific content that contradicts the core campaign message.

### Pitfall 4: Rigid Content Calendars
**What goes wrong:** Calendar specifies exact content for every slot, which doesn't match real marketing workflows where content evolves.
**Why it happens:** Over-specifying during planning instead of providing a framework.
**How to avoid:** Calendars specify content types, themes, and responsible agents — not word-for-word content. Content creation happens during execution (Wave 2), not planning.
**Warning signs:** Content calendar cells containing full post text or article drafts.

### Pitfall 5: Single Agent Per Campaign
**What goes wrong:** Only the Social Media Strategist is assigned, missing channel-specific expertise.
**Why it happens:** Generic agent recommendation picks the most "marketing-like" agent rather than building a team.
**How to avoid:** Marketing phases use team assembly pattern from agent-registry Section 4 — Strategy lead + Content creator + Channel specialists based on selected channels.
**Warning signs:** Campaign with 4+ channels but only 1-2 agents assigned.

---

## Integration Design: Two Plans

Based on the pattern established by prior phases, marketing workflows maps cleanly to a 2-plan structure:

**Plan 13-01 (Wave 1): marketing-workflows skill**
- Build `.claude/skills/agency/marketing-workflows.md` with 6 sections
- Add Marketing Workflow Conventions to `workflow-common.md`
- Add campaign path to workflow-common State File Locations table
- Deliverables: 1 skill created, 1 skill updated

**Plan 13-02 (Wave 2): Workflow integration**
- Update `phase-decomposer.md` — marketing domain detection + marketing wave patterns
- Update `plan.md` — marketing phase awareness (campaign questioning)
- Update `REQUIREMENTS.md` — check MKT-01/02/03
- Update `CLAUDE.md` — document marketing workflows feature
- Deliverables: 4 files updated

This matches the established model exactly (skill first, integration second).

---

## Agent Selection

| Plan | Recommended Agent | Rationale |
|------|------------------|-----------|
| 13-01 (marketing-workflows skill) | `marketing-social-media-strategist` | Cross-platform marketing strategy is this agent's core expertise; understands campaign planning, content calendars, and cross-channel coordination from the strategist perspective |
| 13-02 (workflow integration) | `agents-orchestrator` | Wiring a new skill into multiple existing commands is orchestration work — proven in Phases 11 and 12 |

Alternative for Plan 13-01: `marketing-content-creator` also has strong content calendar and campaign planning expertise. The Social Media Strategist is preferred because MKT-03 (cross-channel coordination) requires strategic overview that spans all channels, not just content creation.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Generic phase decomposition for marketing | Marketing-aware decomposition with campaign templates | Plans produce proper campaign artifacts, not just task lists |
| Ad-hoc marketing agent selection | Channel-based team assembly | Each campaign gets the right specialists for its channel mix |
| No cross-channel coordination | Shared core messaging brief | All channel agents work from the same strategic foundation |
| No content calendar structure | Templated calendar with agent assignments | Content planning has time-based structure, not just "create content" tasks |

---

## Open Questions

1. **Campaign artifact location**
   - Recommendation: `.planning/campaigns/{campaign-slug}.md` — parallel to phases directory, keeps marketing artifacts separate from phase plans
   - Alternative: embedded in phase directory — simpler but mixes marketing artifacts with plan files

2. **Multiple campaigns per phase**
   - Recommendation: Support multiple campaigns in a phase (e.g., Phase 13 might have both a launch campaign and a sustain campaign)
   - Each gets its own `.planning/campaigns/{slug}.md`

3. **Non-marketing phases with marketing tasks**
   - Recommendation: Only trigger marketing workflows for phases with MKT-* requirements or majority marketing agents
   - Mixed phases (e.g., feature launch with marketing) use standard decomposition with marketing agents assigned normally

---

## Sources

### Primary (HIGH confidence)
- Direct inspection of all 8 marketing agent personality files — capabilities, task types, and specializations mapped
- Direct inspection of existing skills (phase-decomposer, wave-executor, workflow-common) — established patterns and conventions confirmed
- Direct reading of ROADMAP.md Phase 13 definition and REQUIREMENTS.md MKT-01/02/03

### Secondary (MEDIUM confidence)
- Agent-registry Section 4 team assembly pattern for marketing campaigns — confirmed recommended team structure
- Prior phase research documents (Phase 11, 12) — confirmed 2-plan structure and integration patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all tools already available
- Architecture patterns: HIGH — directly derived from codebase-mapper/github-sync which established the structural model
- Campaign document format: MEDIUM — based on marketing best practices adapted to Agency's markdown-first convention; user may want to customize
- Agent selection: MEDIUM — based on task type matching; user confirmation gate will allow override

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable — no external dependencies)
