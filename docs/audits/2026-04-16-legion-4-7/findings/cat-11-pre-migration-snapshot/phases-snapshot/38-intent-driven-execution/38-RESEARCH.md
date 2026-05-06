# Phase 38: Intent-Driven Execution - Research

**Researched:** 2026-03-05
**Domain:** Command-line flag parsing, semantic intent mapping, agent team templating
**Confidence:** HIGH

## Summary

Phase 38 implements semantic flags for targeted operations in Legion's `/legion:build` and `/legion:review` commands. Instead of running full phase plans, users can invoke specific intent modes like `--just-harden` (security audit), `--just-document` (docs only), or `--skip-frontend` (exclude UI work). This research identifies the standard patterns for CLI flag parsing, team template registries, and validation strategies needed to implement these features effectively.

The implementation requires:
1. **Flag parsing extension** in command files (`build.md`, `review.md`)
2. **Team template registry** mapping intents to agent sets
3. **Plan filtering logic** that drops/modifies tasks based on intent
4. **Validation layer** for conflicting flag combinations
5. **Agent registry integration** for dynamic team assembly

**Primary recommendation:** Use a declarative team template approach in YAML with filtering predicates, integrated into the existing wave-executor and review-panel skills.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INTENT-01 | `/legion:build --just-harden` summons Testing + Security divisions | Team templates + authority matrix integration |
| INTENT-02 | `/legion:build --just-document` generates docs without implementation | Plan content filtering + task type detection |
| INTENT-03 | `/legion:build --skip-frontend` drops UI tasks from wave plans | Files_modified pattern matching + agent exclusion |
| INTENT-04 | `/legion:review --just-security` runs security-only audit | Review panel filtering + domain-based agent selection |
| INTENT-05 | Semantic flags map to predefined team templates in agent-registry | YAML team template registry + recommendation algorithm |
| INTENT-06 | Invalid flag combinations rejected with helpful errors | Flag validation schema + conflict detection rules |

---

## Standard Stack

### Core

| Component | Purpose | Why Standard |
|-----------|---------|--------------|
| YAML frontmatter parsing | Read plan metadata (files_modified, agents) | Already used throughout Legion for plan discovery |
| Authority matrix (authority-matrix.yaml) | Domain ownership for security/testing agents | Existing infrastructure from Phase 37 |
| Agent recommendation algorithm | Score and rank agents by task type | agent-registry/SKILL.md Section 3 |
| Wave executor | Execute plans in waves with parallel support | Core build infrastructure |
| Review panel | Multi-perspective review composition | Already supports domain filtering from Phase 37 |

### Supporting

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| Pattern matching (glob-style) | Match files_modified against exclusion patterns | --skip-frontend path filtering |
| Task type taxonomy | Categorize plans as "documentation" vs "implementation" | --just-document content detection |
| Semantic shortlist | Map natural language intent to normalized concepts | agent-registry Section 3 Step 2 |

---

## Architecture Patterns

### Pattern 1: Intent-to-Team Mapping

**What:** Declarative YAML mapping semantic flags to agent sets and filtering rules

**When to use:** For all semantic flags that need to summon specific agent combinations

**Implementation:**

```yaml
# .planning/config/intent-teams.yaml
intents:
  harden:
    description: "Security audit with Testing + Security divisions"
    agents:
      primary:
        - testing-qa-verification-specialist
        - engineering-security-engineer
      secondary:
        - testing-api-tester
        - testing-evidence-collector
    domains: ["security", "owasp", "stride", "vulnerability-assessment"]
    mode: "ad_hoc"  # Bypass phase plans, spawn directly
    
  document:
    description: "Generate documentation without implementation"
    filter:
      include_task_types: ["documentation", "readme", "api-docs", "guides"]
      exclude_task_types: ["implementation", "code", "testing"]
    mode: "filter_plans"  # Filter existing plans
    
  skip-frontend:
    description: "Exclude frontend/UI tasks"
    filter:
      exclude_agents:
        - engineering-frontend-developer
      exclude_file_patterns:
        - "src/frontend/**"
        - "*.tsx"
        - "*.jsx"
        - "*.css"
        - "*.scss"
      exclude_task_types: ["ui-components", "frontend-architecture"]
    mode: "filter_plans"
    
  security-only:
    description: "Security-only review audit"
    agents:
      primary:
        - engineering-security-engineer
      domains: ["security", "owasp", "stride"]
    mode: "ad_hoc_review"
```

### Pattern 2: Flag Validation Schema

**What:** Rules to detect and reject invalid flag combinations

**When to use:** Before executing any intent-driven command

**Implementation:**

```yaml
# Intent flag validation rules
validation:
  mutual_exclusion:
    - flags: ["just-harden", "just-document"]
      error: "Cannot use --just-harden and --just-document together. Choose one intent."
    - flags: ["skip-frontend", "just-document"]
      error: "--just-document already excludes implementation; --skip-frontend is redundant."
      
  requires_mode:
    - flag: "just-harden"
      requires_command: ["build"]
      error: "--just-harden is only valid for /legion:build"
    - flag: "just-security"
      requires_command: ["review"]
      error: "--just-security is only valid for /legion:review"
      
  combinations:
    - flags: ["skip-frontend", "skip-backend"]
      error: "Cannot skip both frontend and backend — nothing to build."
```

### Pattern 3: Ad-Hoc Team Spawning

**What:** Bypass normal phase plan discovery and spawn agents directly based on intent

**When to use:** For `--just-harden` which doesn't use existing plans

**Flow:**
```
User: /legion:build --just-harden
  ↓
Parse intent → Load intent-teams.yaml → Get harden template
  ↓
Resolve agents from template
  ↓
Spawn agents with security audit task (no plan files needed)
  ↓
Collect findings → Generate security audit report
```

### Pattern 4: Plan Filtering with Predicates

**What:** Filter existing phase plans based on intent criteria

**When to use:** For `--skip-frontend`, `--just-document` which modify existing plans

**Predicate types:**
1. **Agent-based:** Exclude plans assigned to specific agents
2. **File-based:** Exclude plans modifying files matching patterns
3. **Task-based:** Exclude plans with certain task types in objective
4. **Content-based:** Parse plan content to determine documentation vs implementation

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Agent scoring | Custom scoring algorithm | agent-registry Section 3 recommendation algorithm | Already battle-tested with semantic normalization |
| Domain ownership lookup | Manual YAML parsing | authority-matrix.yaml with existing loader | Consistent with Phase 37 authority enforcement |
| Team assembly | Hardcoded agent lists | Intent templates + agent-registry | Allows customization and extension |
| Flag parsing | Regex parsing | Extend existing $ARGUMENTS handling | Legion already parses --phase, --dry-run |
| Plan filtering | Filter in command code | Predicate-based filter in wave-executor | Reusable across commands |

---

## Common Pitfalls

### Pitfall 1: Conflicting Intent Interpretation

**What goes wrong:** Two different users expect `--just-document` to mean different things (only doc files vs any documentation task)

**Why it happens:** Natural language intent is ambiguous without explicit task type taxonomy

**How to avoid:** 
- Define clear task type taxonomy in intent-teams.yaml
- Document what each intent includes/excludes with examples
- Log filtering decisions so users can see what was excluded

### Pitfall 2: Silent Plan Elimination

**What goes wrong:** `--skip-frontend` filters out ALL plans in a phase, leaving nothing to execute

**Why it happens:** Entire phase is frontend-focused

**How to avoid:**
- After filtering, check if any plans remain
- If zero plans: error with "No plans remain after applying --skip-frontend filter"
- Suggest: "This phase is frontend-focused. Use /legion:plan to view unfiltered plans."

### Pitfall 3: Security Domain Overlap

**What goes wrong:** `--just-security` conflicts with authority matrix when testing-api-tester also has security opinions

**Why it happens:** Multiple agents may claim security domain ownership

**How to avoid:**
- Respect authority matrix from Phase 37
- For security reviews, engineering-security-engineer is primary
- testing-api-tester can audit API security but defers to security-engineer on findings

### Pitfall 4: Missing Intent Templates

**What goes wrong:** User creates custom intent flags that aren't in intent-teams.yaml

**Why it happens:** No validation of flag against known intents

**How to avoid:**
- Validate flag against intent-teams.yaml keys
- If unknown flag: "Unknown intent flag '--just-optimize'. Available intents: harden, document, skip-frontend, ..."

---

## Code Examples

### Intent Flag Parsing in build.md

```yaml
# In build.md <process> section, after Step 0 (Conditional skill loading):

0.5 INTENT DETECTION AND VALIDATION
   a. Parse intent flags from $ARGUMENTS:
      - --just-harden → intent: harden
      - --just-document → intent: document
      - --skip-frontend → intent: skip-frontend
      - --skip-backend → intent: skip-backend
      - (can combine: --skip-frontend --skip-backend)
   
   b. If any intent flags detected:
      1. Load .planning/config/intent-teams.yaml
      2. Validate flag combinations per validation rules
      3. If invalid: error with specific message and suggestions
      4. Determine execution mode:
         - "ad_hoc" → Skip plan discovery, spawn intent team directly
         - "filter_plans" → Filter existing plans then execute
```

### Plan Filtering Logic

```typescript
// Pseudocode for plan filtering
function filterPlansByIntent(plans, intent, intentConfig) {
  const filter = intentConfig[intent].filter;
  
  return plans.filter(plan => {
    // Agent-based filter
    if (filter.exclude_agents) {
      const planAgent = extractAgentFromPlan(plan);
      if (filter.exclude_agents.includes(planAgent)) {
        return false;
      }
    }
    
    // File-based filter
    if (filter.exclude_file_patterns) {
      const filesModified = plan.frontmatter.files_modified || [];
      const hasExcludedFile = filesModified.some(file => 
        filter.exclude_file_patterns.some(pattern => 
          globMatch(file, pattern)
        )
      );
      if (hasExcludedFile) {
        return false;
      }
    }
    
    // Task-based filter (requires parsing plan content)
    if (filter.include_task_types || filter.exclude_task_types) {
      const planTaskTypes = detectTaskTypesFromPlanContent(plan);
      
      if (filter.include_task_types) {
        const hasIncluded = planTaskTypes.some(t => 
          filter.include_task_types.includes(t)
        );
        if (!hasIncluded) return false;
      }
      
      if (filter.exclude_task_types) {
        const hasExcluded = planTaskTypes.some(t => 
          filter.exclude_task_types.includes(t)
        );
        if (hasExcluded) return false;
      }
    }
    
    return true;
  });
}
```

### Ad-Hoc Team Spawning

```yaml
# For intents with mode: "ad_hoc" (like --just-harden)

4-ADHOC. SPAWN INTENT-SPECIFIC TEAM
   a. Load intent template from intent-teams.yaml
   b. Resolve agent paths per workflow-common Agent Path Resolution
   c. For each agent in template.agents.primary + .secondary:
      1. Read personality file: {AGENTS_DIR}/{agent-id}.md
      2. Construct task prompt:
         """
         {PERSONALITY_CONTENT}
         
         ---
         
         # Security Audit Task
         
         You are part of a hardening team summoned via `/legion:build --just-harden`.
         
         ## Your Role
         {agent-specific role description from template}
         
         ## Audit Scope
         Review the entire codebase for security vulnerabilities:
         - OWASP Top 10 vulnerabilities
         - STRIDE threat modeling
         - Input sanitization issues
         - Authentication/authorization gaps
         
         ## Deliverable
         Provide findings in the standard Finding block format:
         - File: {path}
         - Severity: BLOCKER | WARNING | SUGGESTION
         - Issue: {description}
         - Fix: {suggested remediation}
         
         ## Authority Boundaries
         {AUTHORITY_CONTEXT from security-engineer domains}
         """
      3. Spawn agent via adapter.spawn_agent_personality
   
   d. Collect results per adapter.collect_results
   e. Synthesize findings into security audit report
   f. Write to .planning/security-audit-{timestamp}.md
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual team selection | Intent-driven team templates | Phase 38 | Faster execution for common scenarios |
| Full phase execution | Filtered/ad-hoc execution | Phase 38 | Reduced time for targeted operations |
| Static agent assignment | Dynamic intent-based assembly | Phase 38 | More flexible team composition |

**Deprecated/outdated:**
- No prior patterns deprecated — this is new functionality

---

## Open Questions

1. **Task type taxonomy completeness**
   - What we know: Need categories for "documentation" vs "implementation" vs "testing"
   - What's unclear: Full taxonomy needed for all 52 agent task types
   - Recommendation: Start with 8-10 high-level types, expand based on usage

2. **Intent flag discoverability**
   - What we know: Users need to know available flags
   - What's unclear: How to document without cluttering help text
   - Recommendation: Add `/legion:build --list-intents` and document in ROADMAP

3. **Multi-intent combination rules**
   - What we know: Some flags can combine (--skip-frontend --skip-backend)
   - What's unclear: Exhaustive combination matrix
   - Recommendation: Start with explicit validation rules, relax as patterns emerge

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js test runner (tests/*.test.js pattern from Phase 37-00) |
| Config file | None — see Wave 0 in Phase 37 |
| Quick run command | `node --test tests/intent-*.test.js` |
| Full suite command | `node --test tests/*.test.js` |
| Estimated runtime | ~5-10 seconds |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| INTENT-01 | --just-harden spawns testing + security agents | unit | `node --test tests/intent-flag-parsing.test.js` | ❌ Wave 0 gap |
| INTENT-02 | --just-document filters to doc-only tasks | unit | `node --test tests/intent-filtering.test.js` | ❌ Wave 0 gap |
| INTENT-03 | --skip-frontend excludes frontend agents/files | unit | `node --test tests/intent-filtering.test.js` | ❌ Wave 0 gap |
| INTENT-04 | --just-security filters review panel | unit | `node --test tests/intent-review.test.js` | ❌ Wave 0 gap |
| INTENT-05 | Intent flags map to team templates | unit | `node --test tests/intent-teams.test.js` | ❌ Wave 0 gap |
| INTENT-06 | Invalid combinations rejected | unit | `node --test tests/intent-validation.test.js` | ❌ Wave 0 gap |

### Wave 0 Gaps (must be created before implementation)

- [ ] `tests/intent-flag-parsing.test.js` — covers INTENT-01 flag detection
- [ ] `tests/intent-filtering.test.js` — covers INTENT-02, INTENT-03 plan filtering
- [ ] `tests/intent-review.test.js` — covers INTENT-04 review filtering
- [ ] `tests/intent-teams.test.js` — covers INTENT-05 team template loading
- [ ] `tests/intent-validation.test.js` — covers INTENT-06 validation rules
- [ ] `.planning/config/intent-teams.yaml` — Team template registry

---

## Sources

### Primary (HIGH confidence)
- `commands/build.md` — Existing build command structure and wave execution (verified)
- `commands/review.md` — Existing review command and panel composition (verified)
- `skills/wave-executor/SKILL.md` — Plan discovery and wave execution (verified)
- `skills/review-panel/SKILL.md` — Panel composition and domain filtering (verified)
- `skills/agent-registry/SKILL.md` — Recommendation algorithm for team assembly (verified)
- `.planning/config/authority-matrix.yaml` — Domain ownership for security agents (verified)

### Secondary (MEDIUM confidence)
- Phase 37 test scaffolding pattern — 37-00-PLAN.md established test conventions
- Agent registry CATALOG.md — Task type mappings for filtering

### Tertiary (LOW confidence)
- Intent flag taxonomy from research — needs validation with actual usage

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All components exist from Phases 36-37 |
| Architecture | HIGH | Clear extension points in existing commands |
| Pitfalls | MEDIUM | Some edge cases (task taxonomy) need usage validation |

**Research date:** 2026-03-05
**Valid until:** 30 days (stable patterns, low churn expected)

---

## Implementation Notes for Planner

### Key Implementation Files

1. **commands/build.md** — Add intent flag parsing (Step 0.5), ad-hoc spawning (Step 4-ADHOC), plan filtering
2. **commands/review.md** — Add `--just-security` flag handling, review panel filtering
3. **.planning/config/intent-teams.yaml** — Create team template registry (new file)
4. **skills/wave-executor/SKILL.md** — Add plan filtering predicates (new section)
5. **skills/review-panel/SKILL.md** — Add intent-based panel filtering (enhance Section 1)

### Critical Dependencies

- Authority matrix (Phase 37) must be present for `--just-harden` domain ownership
- Agent registry CATALOG.md must have task type mappings for filtering
- Wave executor must support filtered plan execution

### Extension Points

- Intent templates can be extended by users (custom intent flags)
- Filtering predicates can be enhanced with more criteria
- Validation rules can be relaxed/extended for new combinations

---

## RESEARCH COMPLETE

**Phase:** 38 - Intent-Driven Execution
**Confidence:** HIGH

### Key Findings

1. **Intent flags require three execution modes:** ad_hoc (spawn directly), filter_plans (modify existing), and filter_review (narrow review scope)
2. **Team templates should be declarative YAML** mapping intents to agent sets, not hardcoded in command logic
3. **Plan filtering needs multiple predicate types:** agent-based, file-based, task-based, content-based
4. **Validation prevents common errors:** mutual exclusion rules, required command context, combination checking
5. **Integration with existing infrastructure:** authority matrix, agent recommendation algorithm, wave executor — all have clear extension points

### File Created
`.planning/phases/38-intent-driven-execution/38-RESEARCH.md`

### Ready for Planning

Research complete. The planner can now create PLAN.md files with confidence:
- Standard patterns are well-understood
- Extension points in existing code are identified
- Test scaffolding requirements are clear
- No blocking open questions
