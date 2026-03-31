---
name: legion:agent-registry
description: Maps all 48 Legion agents by division, capability, and task type for intelligent team assembly
triggers: [agent, recommend, team, catalog, assign, match]
token_cost: low
summary: "Maps all 48 agents by division, capability, and task type. Recommendation algorithm is semantic-first with heuristic tiebreak scoring. Use when assembling teams or selecting agents for plans."
---

# Legion Agent Registry

Complete catalog of all agent personalities. Includes 48 built-in agents across 9 divisions plus any custom agents created via `/legion:agent`. Use this registry to assemble the right team for any project task.

> Agent catalog and task-type index are in `CATALOG.md` in this directory.

---

## Section 3: Recommendation Algorithm (v2 Four-Layer Scoring)

When assembling a team for a task, the engine applies four scoring layers in sequence. Each layer is additive; later layers only activate when the baseline (Layer 1 + Layer 2) is greater than zero.

```
total = semantic + heuristic + metadataBoost + memoryBoost + archetypeBoost
```

**Gating rule**: Layers 3 and 4 (metadata, memory, archetype) are only applied when `baseline = semantic + heuristic > 0`. This prevents irrelevant agents from being promoted by metadata or historical data alone.

**Custom agents:** Custom agents added via `/legion:agent` are first-class candidates in every layer.

### Layer 1: Semantic Score (Primary Ranking)
Map natural-language intent to normalized concepts before any point scoring.

Baseline concept normalization:
- `scalability`, `latency`, `throughput` -> `performance`
- `harden`, `exploit`, `vulnerability` -> `security`
- `a11y`, `wcag`, `screen reader` -> `accessibility`
- `funnel`, `conversion`, `growth loop` -> `growth`
- `refactor`, `cleanup`, `maintainability` -> `code-quality`
- `onboarding`, `activation`, `retention` -> `product`

Scoring:
- **Exact taskType match**: +4
- **Partial taskType match** (substring): +2
- **Specialty text match**: +1

Shortlist rules:
1. Prefer agents with direct semantic overlap between normalized concepts and `task_types`.
2. Include cross-division specialists when their specialty text clearly matches intent.
3. Keep shortlist to top 6-8 agents before tie-breaking.

### Layer 2: Heuristic Score (Tiebreak)
Use points only to break ties inside the semantic shortlist:
- **Exact task-type match**: +3
- **Partial task-type match**: +1
- **Partial specialty match**: +1
- **Division alignment**: +2

Notes:
- Heuristics refine ranking; they do not replace semantic intent matching.
- If no semantic shortlist forms, fall back to heuristic scoring across all agents and label low confidence.

### Layer 3: Metadata Boost (from agent frontmatter)
Scores agents based on `languages`, `frameworks`, `artifact_types`, and `review_strengths` fields in agent `.md` frontmatter.

Scoring rules:
- **Exact language match**: +3
- **Exact framework match**: +3
- **Exact artifact_type match**: +2
- **Exact review_strength match**: +2
- **Partial match** (substring in any field): +1

Only applied when `baseline > 0`.

### Layer 4: Memory and Archetype Boost (from OUTCOMES.md)

#### Memory Boost
If `.planning/memory/OUTCOMES.md` exists:
1. Recall agent scores via memory-manager (memoryScores).
2. Add memory score to shortlisted agents only (gated behind baseline > 0).

#### Archetype Boost
If archetypeScores are provided by the caller for the detected task_type:

**Task Type Detection**: Prompt concepts are mapped to task types via TASK_TYPE_MAP:
- `react`, `frontend`, `css`, `html` -> `web-development`
- `api`, `endpoint`, `rest`, `graphql` -> `api-development`
- `mobile`, `ios`, `android`, `flutter` -> `mobile-development`
- `ml`, `ai`, `model`, `training` -> `ai-ml`
- `test`, `qa`, `benchmark` -> `quality-testing`
- `campaign`, `social`, `content` -> `content-marketing`
- `visionos`, `xr`, `webxr`, `spatial` -> `spatial-computing`
- `security`, `owasp`, `stride` -> `security-audit`
- `deploy`, `ci-cd`, `infrastructure` -> `devops`
- `design`, `ui`, `ux` -> `design-ux`

**Archetype scoring formula**:
```
base_boost = successRate * 3.0
volume_modifier = min(totalOutcomes / 5, 1.0)
top_agent_bonus = 1.0 if agent is topAgent, else 0
archetype_boost = clamp(base_boost * volume_modifier + top_agent_bonus, 0, 5)
```

Constraints:
- Archetype boost is gated behind baseline > 0 (same as metadata and memory).
- Memory/archetype boosts are additive and cannot override mandatory-role constraints.
- Memory/archetype boosts cannot promote unrelated agents with zero semantic/heuristic relevance.
- archetypeScores are consumed only when available; if absent, fall back to flat memoryScores.
- If memory is unavailable, skip silently.
- Engine produces identical results when metadata fields are absent and archetypeScores is not provided (backward compatible).

### Step 3: Parse Intent and Constraints
Extract:
- Primary objective (build, review, optimize, diagnose, launch)
- Domain signals (engineering, design, marketing, testing, product, support, spatial)
- Hard constraints (platform, runtime, deadline, no-new-dependencies, etc.)

### Step 4: Confidence Classification
Classify confidence from top-candidate quality:
- **High confidence**: strong semantic alignment (>= 6) or (semantic >= 4 and heuristic >= 8). Metadata boost >= 6 can elevate effective semantic to 4.
- **Medium confidence**: partial semantic alignment (>= 2) or heuristic >= 5
- **Low confidence**: weak semantic evidence

If confidence is low:
1. Label recommendation explicitly as low confidence.
2. Offer 2-3 alternatives from different divisions.
3. Ask for user guidance before locking assignment.

### Score Export

After scoring, produce a structured score breakdown for each recommended agent:

```
score_export:
  task_type_detected: "{extracted task type from TASK_TYPE_MAP}"
  candidates:
    - agent_id: "{agent-id}"
      semantic_score: {numeric from Layer 1}
      heuristic_score: {numeric from Layer 2}
      metadata_score: {numeric from Layer 3}
      memory_boost: {numeric from OUTCOMES.md or 0}
      archetype_boost: {numeric from archetype formula or 0}
      total_score: {semantic + heuristic + metadata + memory + archetype}
      confidence: "{HIGH|MEDIUM|LOW}"
    - agent_id: "{agent-id-2}"
      ...
  adapter: "{adapter name from current CLI}"
  model_tier: "{planning|execution|check}"
  recommendation_source: "{semantic|heuristic|memory|archetype|override}"
```

This score breakdown is:
- **Produced** by agent-registry during recommendation
- **Consumed** by wave-executor when writing SUMMARY.md (see OBS-01)
- **Optional** — if recommendation was skipped (autonomous task), no export is generated

### Step 5: Team Size and Composition Guardrails
- **2 agents** for single-domain tasks.
- **3 agents** for standard feature work.
- **4 agents** for cross-domain work.
- Never exceed 4 agents for one discrete task; split larger efforts.

### Step 6: Enforce Mandatory Roles
- **Execution teams** (code-writing/deployment) MUST include at least one Testing-division agent.
- **Cross-division teams** MUST include a coordinator: `project-manager-senior`, `project-management-project-shepherd`, or `agents-orchestrator`.
- **User-facing change teams** SHOULD include a Design-division reviewer.

Mandatory role additions should be reflected in the score_export with `recommendation_source: "mandatory"`.

### Step 7: Conflict Resolution
- If two agents remain tied in one division, prefer broader production reliability for delivery tasks.
- For exploratory work, prefer rapid-learning profiles (`engineering-rapid-prototyper`, `project-management-experiment-tracker`).
---

## Section 4: Team Assembly Patterns

Pre-configured team compositions for common project scenarios.

### Feature Build (Web)
> Standard web feature from design through deployment.

| Role | Agent | Division |
|------|-------|----------|
| Lead Developer | engineering-frontend-developer | engineering |
| Backend | engineering-backend-architect | engineering |
| UI/UX | design-ui-designer | design |
| QA | testing-qa-verification-specialist | testing |

### API Development
> Backend service, API endpoint, or integration work.

| Role | Agent | Division |
|------|-------|----------|
| Architect | engineering-backend-architect | engineering |
| Integration Testing | testing-api-tester | testing |
| Performance | testing-performance-benchmarker | testing |

### Design Sprint
> User research through high-fidelity design delivery.

| Role | Agent | Division |
|------|-------|----------|
| Research | design-ux-researcher | design |
| Architecture | design-ux-architect | design |
| Visual Design | design-ui-designer | design |
| Brand Review | design-brand-guardian | design |
| Feedback | product-feedback-synthesizer | product |

### Marketing Campaign
> Multi-platform content campaign from strategy to execution.

| Role | Agent | Division |
|------|-------|----------|
| Strategy | marketing-content-social-strategist | marketing |
| Content | marketing-content-social-strategist | marketing |
| Visual | design-visual-storyteller | design |
| Analytics | data-analytics-engineer | specialized |
| Platform Lead (pick 1-2) | marketing-social-platform-specialist / marketing-app-store-optimizer / marketing-growth-hacker | marketing |

### Full Launch
> End-to-end product launch spanning all divisions. Split into sub-tasks and coordinate.

| Role | Agent | Division |
|------|-------|----------|
| Orchestrator | agents-orchestrator | specialized |
| Producer | project-management-studio-producer | project-management |
| Frontend | engineering-frontend-developer | engineering |
| Backend | engineering-backend-architect | engineering |
| UI/UX | design-ui-designer | design |
| QA Lead | testing-qa-verification-specialist | testing |
| Marketing | marketing-growth-hacker | marketing |
| Analytics | data-analytics-engineer | specialized |

### Quick Fix / Bug Patch
> Targeted bug fix or hotfix with minimal team.

| Role | Agent | Division |
|------|-------|----------|
| Developer | engineering-senior-developer / engineering-laravel-specialist (Laravel stacks) | engineering |
| QA Verification | testing-qa-verification-specialist | testing |

### XR / Spatial Computing Build
> Immersive experience development for visionOS, WebXR, or spatial platforms.

| Role | Agent | Division |
|------|-------|----------|
| Platform Engineer | visionos-spatial-engineer / macos-spatial-metal-engineer | spatial-computing |
| Interaction Design | xr-interface-architect | spatial-computing |
| Immersive Dev | xr-immersive-developer | spatial-computing |
| QA | testing-performance-benchmarker | testing |




