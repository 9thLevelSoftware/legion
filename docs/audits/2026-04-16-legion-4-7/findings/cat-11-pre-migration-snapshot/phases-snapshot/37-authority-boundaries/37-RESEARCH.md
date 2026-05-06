# Phase 37: Authority Boundaries & Two-Wave Parallelism - Research

**Researched:** 2026-03-05
**Domain:** Multi-agent orchestration, parallel execution patterns, domain ownership boundaries
**Confidence:** HIGH

## Summary

This research establishes implementation patterns for **Phase 37** covering authority boundaries (AUTH-01 to AUTH-05) and two-wave parallelism (WAVE-01 to WAVE-05) in the Legion multi-agent system. The key insight: **domain ownership prevents conflicts** in parallel execution, while **wave-based decomposition** enables maximum parallelism without sacrificing quality gates.

**Key research findings:**

1. **Multi-agent domain ownership** is an established pattern in MAS (Multi-Agent Systems) research. Agents with exclusive domains prevent the "overlapping responsibility" anti-pattern that causes conflicting advice. FIPA standards and JADE framework demonstrate this pattern in industrial applications.

2. **Two-phase execution** (build-then-validate) mirrors CI/CD pipeline patterns (GitHub Actions, GitLab CI). GitHub Actions' `needs` keyword and job dependencies provide proven patterns for wave-based execution with gates between phases.

3. **Review deduplication by location** with severity escalation is standard in static analysis tools (ESLint, SonarQube). Location-based deduplication (file:line) prevents duplicate findings, while severity prioritization (BLOCKER > WARNING > INFO) ensures critical issues aren't lost.

4. **YAML-based configuration** for authority matrices is optimal — human-readable, machine-parseable, version-controllable. This matches established patterns in Kubernetes RBAC, AWS IAM policies, and GitHub CODEOWNERS.

**Primary recommendation:** Implement authority boundaries via a YAML matrix with exclusive domain ownership, inject constraints into agent prompts at spawn time, and use file:line-based deduplication with severity escalation in review synthesis.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Authority matrix defines exclusive domains per agent | Standard Stack: YAML matrix pattern matches Kubernetes RBAC, GitHub CODEOWNERS |
| AUTH-02 | Wave executor injects authority constraints into agent prompts | Architecture: Prompt injection pattern from MAS research (Wooldridge 2002) |
| AUTH-03 | Review panel deduplicates findings by file:line, keeping highest severity | Common Pitfall prevention: Matches ESLint/SonarQube deduplication patterns |
| AUTH-04 | Review panel discards out-of-domain critiques | Architecture: Domain filtering pattern from FIPA agent standards |
| AUTH-05 | Authority matrix is human-readable YAML/JSON | Standard Stack: YAML chosen for readability + parseability |
| WAVE-01 | Two-wave pattern: Wave A (Build + Analysis), Wave B (Execution) | Architecture: Mirrors GitHub Actions job dependencies with `needs` |
| WAVE-02 | Wave A spawns dynamic agents per service/page group | Architecture: Service-group parallelism pattern from microservices |
| WAVE-03 | Wave B executes tests, audits, and reviews against Wave A outputs | Standard Stack: Artifact passing pattern from CI/CD pipelines |
| WAVE-04 | Remediation phase runs parallel to final validation | Architecture: Parallel stream pattern — execution + remediation simultaneous |
| WAVE-05 | Gates between waves: Requirements → Architecture → Production Readiness | Architecture: Quality gates pattern from DevOps (DORA research) |

</phase_requirements>

## Standard Stack

### Core

| Component | Pattern | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Authority Matrix | YAML with `exclusive_domains` | Domain ownership definition | Human-readable, machine-parseable, version-controllable |
| Prompt Injection | Template variables (`{{AUTHORITY_CONTEXT}}`) | Runtime constraint injection | Established in LLM-based MAS (CAMEL, AutoGen) |
| Location Deduplication | `file:line` string keys | Finding deduplication | Matches static analysis tools (ESLint, SonarQube) |
| Severity Levels | BLOCKER / WARNING / SUGGESTION | Issue prioritization | Industry standard (SARIF specification) |
| Wave Manifest | YAML with service groups | Cross-wave data passing | Mirrors CI/CD artifact passing |

### Supporting

| Component | Pattern | Purpose | When to Use |
|-----------|---------|---------|-------------|
| Service Groups | Frontmatter `service_group` field | Parallelization units | When phase spans multiple architectural boundaries |
| Wave Roles | `wave_role: build/analysis/execution/remediation` | Agent categorization | In two-wave phases with 4+ plans |
| Conflict Resolution | Specificity-based rules | Domain overlap handling | When multiple agents claim related domains |
| Gates | User checkpoints between waves | Quality enforcement | Always in two-wave mode |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| YAML authority matrix | JSON | JSON is machine-friendlier but less human-readable for non-dev stakeholders |
| File:line deduplication | AST-based deduplication | AST is more accurate but overkill for Legion's markdown-based workflow |
| Two-wave pattern | Single-wave sequential | Two-wave adds complexity but enables 2x+ parallelism for large phases |
| Prompt injection | Pre-filtering agent selection | Pre-filtering loses flexibility; injection allows dynamic adaptation |

**Installation:**
No external dependencies required — all patterns implemented via:
- YAML parsing (built into Node.js/Python standard libraries)
- String template injection (Handlebars-style or simple regex)
- File system operations (built-in)

## Architecture Patterns

### Recommended Project Structure

```
.planning/
├── config/
│   └── authority-matrix.yaml     # Domain ownership definition
├── phases/{NN}/
│   ├── WAVE-A-MANIFEST.yaml      # Wave A outputs
│   └── WAVE-B-MANIFEST.yaml      # Wave B results
└── templates/
    ├── agent-prompt.md           # Prompt with authority section
    └── two-wave-manifest.md      # Wave plan template

skills/
├── authority-enforcer/
│   └── SKILL.md                  # Boundary validation functions
├── wave-executor/
│   ├── SKILL.md                  # Main execution logic
│   ├── WAVE-A.md                 # Wave A protocol
│   └── WAVE-B.md                 # Wave B protocol
└── review-panel/
    └── SKILL.md                  # Deduplication & filtering

agents/
└── {agent-id}.md                 # Personality files (unchanged)
```

### Pattern 1: Exclusive Domain Ownership

**What:** Each agent has a set of exclusive domains. When an agent is active on a panel or wave, other agents defer to them on those domains.

**When to use:** Always — this is the core conflict prevention mechanism.

**Example:**
```yaml
# authority-matrix.yaml
agents:
  engineering-security-engineer:
    exclusive_domains:
      - security
      - owasp
      - stride
      - vulnerability-assessment
    deferred_by: ["*"]  # All other agents defer

  code-reviewer:
    exclusive_domains:
      - code-style
      - readability
    deferred_by: []
```

**Algorithm:**
```javascript
function isAuthorized(agentId, topic, activeAgents) {
  const agentDomains = matrix[agentId].exclusive_domains;
  const topicOwner = findDomainOwner(topic, activeAgents);
  
  if (!topicOwner) return true; // No owner, anyone can critique
  if (topicOwner === agentId) return true; // Agent owns this domain
  return false; // Another agent owns this domain
}
```

### Pattern 2: Two-Wave Execution

**What:** Wave A (Build + Analysis) runs first and produces artifacts. Wave B (Execution + Remediation) validates those artifacts. Gates between waves enforce quality.

**When to use:** Phases with 4+ plans that span multiple service groups or include explicit analysis tasks.

**Example:**
```yaml
# Phase 38 plans

# 38-01-PLAN.md
---
phase: 38-intent-driven
plan: 01
wave: A
wave_role: build
service_group: frontend
---

# 38-03-PLAN.md
---
phase: 38-intent-driven
plan: 03
wave: A
wave_role: analysis
service_group: all
wave_a_outputs: [38-01, 38-02]
---

# 38-05-PLAN.md
---
phase: 38-intent-driven
plan: 05
wave: B
wave_role: execution
service_group: all
wave_a_outputs: [38-01, 38-02, 38-03, 38-04]
---
```

**Execution flow:**
```
Wave A:
  Frontend Group: Plan 01, 02 (parallel)
  Backend Group: Plan 03, 04 (parallel)
  Analysis: Plan 05, 06 (parallel, read-only access to build outputs)

Gate: Architecture Review
  - User reviews analysis findings
  - Decision: Proceed to Wave B or fix Wave A

Wave B:
  Execution Stream: Tests, benchmarks (parallel)
  Remediation Stream: SRE chaos, data scientist (parallel)

Gate: Production Readiness
  - Verdict: PASS / NEEDS_WORK / FAIL
```

### Pattern 3: Location-Based Deduplication

**What:** Findings are grouped by file:line location. Multiple findings at the same location are merged, keeping the highest severity.

**When to use:** In review panel synthesis to prevent redundant feedback.

**Example:**
```javascript
// Input findings
const findings = [
  { file: "src/auth.ts", line: 45, severity: "WARNING", reviewer: "A", issue: "Missing auth" },
  { file: "src/auth.ts", line: 45, severity: "BLOCKER", reviewer: "B", issue: "Critical auth bug" },
  { file: "src/auth.ts", line: 50, severity: "SUGGESTION", reviewer: "C", issue: "Naming" }
];

// After deduplication
const deduped = [
  { file: "src/auth.ts", line: 45, severity: "BLOCKER", reviewers: ["A", "B"], merged: true },
  { file: "src/auth.ts", line: 50, severity: "SUGGESTION", reviewers: ["C"] }
];
```

**Algorithm:**
```javascript
function deduplicate(findings) {
  const groups = groupBy(findings, f => `${f.file}:${f.line}`);
  
  return Object.values(groups).map(group => {
    if (group.length === 1) return group[0];
    
    // Keep highest severity
    const severityOrder = { BLOCKER: 3, WARNING: 2, SUGGESTION: 1 };
    const sorted = group.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
    
    return {
      ...sorted[0],
      reviewers: group.map(f => f.reviewer),
      merged: true,
      original_severities: group.map(f => f.severity)
    };
  });
}
```

### Pattern 4: Prompt Authority Injection

**What:** Authority constraints are injected into agent prompts at spawn time, making boundaries explicit to the agent.

**When to use:** Every agent spawn in multi-agent waves.

**Example:**
```markdown
# Agent Prompt Template

{{PERSONALITY_CONTENT}}

---

## Your Authority Boundaries

You are {{AGENT_NAME}}.

**You have exclusive authority over:**
{{#each EXCLUSIVE_DOMAINS}}
- {{this}}
{{/each}}

When you are active, other agents defer to you on these topics.

**Other active agents with authority:**
{{#each OTHER_AGENTS}}
- {{name}}: {{domains}}
{{/each}}

You must NOT critique or override findings from these agents in their exclusive domains.
```

### Anti-Patterns to Avoid

- **Authority vacuum:** Don't leave domains unassigned. If no agent owns "security", everyone will critique it, causing conflicts.
- **Overly broad domains:** Avoid `exclusive_domains: ["everything"]`. Domains should be specific enough to prevent overlap.
- **Circular dependencies:** Wave B plans depending on Wave B plans (same wave) breaks the execution model.
- **Silent filtering:** Never filter findings without logging why. Transparency is critical for debugging authority issues.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML parsing | Custom parser | js-yaml / PyYAML | Edge cases in YAML spec (anchors, merges) |
| File path normalization | String manipulation | Node.js `path.normalize()` | Cross-platform path handling (Windows vs Unix) |
| Line range overlap detection | Simple equality checks | Established interval overlap algorithms | Overlapping ranges are tricky (off-by-one errors) |
| Template injection | Regex replacement | Handlebars / Mustache | Escaping, conditionals, loops |
| Parallel execution coordination | Custom queue | Adapter-native parallel (Claude Code Teams, etc.) | Lifecycle management, error handling |

**Key insight:** The hard parts are edge cases and cross-platform consistency. Established libraries handle Windows paths, YAML merge keys, and HTML escaping. Custom implementations will fail in production.

## Common Pitfalls

### Pitfall 1: Domain Overlap Conflicts

**What goes wrong:** Two agents both claim "security" as an exclusive domain. Both are active. They give conflicting advice on the same security issue.

**Why it happens:** Authority matrix author didn't notice the overlap during setup.

**How to avoid:** 
1. Validate matrix at load time: check for duplicate exclusive domains
2. Log warnings when overlapping agents are spawned together
3. Use specificity rules: `security-owasp` beats `security-general`

**Warning signs:** "Agent A says fix it this way, Agent B says fix it that way" in review synthesis.

### Pitfall 2: False Authority Violations

**What goes wrong:** Code-reviewer flags a SQL injection issue, but security-engineer is also on the panel. The finding is filtered as "out-of-domain", but code-reviewer was actually right.

**Why it happens:** Domain detection from finding text is imprecise (keyword matching).

**How to avoid:**
1. Domain detection should use both criterion tags AND description keywords
2. Uncertain domains (confidence < 70%) should keep the finding and flag it
3. Provide override mechanism for user to un-filter findings

**Warning signs:** User complaints that valid findings disappeared.

### Pitfall 3: Wave A Output Loss

**What goes wrong:** Wave B starts but can't find Wave A artifacts. Wave A manifest is missing or corrupted.

**Why it happens:** Wave A failed partially, or manifest wasn't written atomically.

**How to avoid:**
1. Write manifest only after ALL Wave A plans complete successfully
2. Include checksums or file lists in manifest for validation
3. Validate manifest before starting Wave B

**Warning signs:** "File not found" errors in Wave B execution.

### Pitfall 4: Gate Fatigue

**What goes wrong:** Two-wave execution has too many gates, slowing down development. Users start using `--skip-gates` always.

**Why it happens:** Gates are too conservative, requiring user input for minor issues.

**How to avoid:**
1. Architecture Gate only appears if analysis findings exist
2. Auto-proceed if no BLOCKER findings in Wave A
3. Production Readiness Gate offers "accept risks" option

**Warning signs:** Users consistently bypassing gates.

## Code Examples

### Example 1: Authority Matrix Loading

```javascript
// Source: Pattern from Kubernetes RBAC loading
const yaml = require('js-yaml');
const fs = require('fs');

function loadAuthorityMatrix(path) {
  const content = fs.readFileSync(path, 'utf8');
  const matrix = yaml.load(content);
  
  // Validation
  validateMatrix(matrix);
  
  // Build reverse index: domain -> agent
  const domainOwners = {};
  for (const [agentId, config] of Object.entries(matrix.agents)) {
    for (const domain of config.exclusive_domains) {
      if (domainOwners[domain]) {
        console.warn(`Domain overlap: ${domain} claimed by ${domainOwners[domain]} and ${agentId}`);
      }
      domainOwners[domain] = agentId;
    }
  }
  
  return { matrix, domainOwners };
}

function validateMatrix(matrix) {
  // Check required fields
  if (!matrix.version) throw new Error('Matrix missing version');
  if (!matrix.agents) throw new Error('Matrix missing agents');
  
  // Check each agent
  for (const [agentId, config] of Object.entries(matrix.agents)) {
    if (!config.exclusive_domains) {
      throw new Error(`Agent ${agentId} missing exclusive_domains`);
    }
  }
}
```

### Example 2: Out-of-Domain Filtering

```javascript
// Source: Pattern inspired by SARIF filtering
function filterFindings(findings, activeAgents, domainOwners) {
  const filtered = [];
  const filterLog = [];
  
  for (const finding of findings) {
    const domain = detectDomain(finding);
    const owner = domainOwners[domain];
    
    if (owner && activeAgents.includes(owner) && finding.reviewer !== owner) {
      // Domain owner is present, but this finding is from someone else
      filterLog.push({
        finding: finding.id,
        reviewer: finding.reviewer,
        domain,
        owner,
        reason: 'Out-of-domain critique filtered'
      });
      continue; // Skip this finding
    }
    
    filtered.push(finding);
  }
  
  return { filtered, filterLog };
}

function detectDomain(finding) {
  // Priority 1: Explicit criterion tag
  if (finding.criterion) {
    return mapCriterionToDomain(finding.criterion);
  }
  
  // Priority 2: Keyword matching in description
  const desc = finding.description.toLowerCase();
  if (desc.match(/\b(auth|encrypt|sanitize|injection|xss|csrf)\b/)) {
    return 'security';
  }
  if (desc.match(/\b(slow|cache|optimize|memory|cpu|performance)\b/)) {
    return 'performance';
  }
  if (desc.match(/\b(aria|screen reader|contrast|keyboard|wcag)\b/)) {
    return 'accessibility';
  }
  
  return 'general';
}
```

### Example 3: Two-Wave Plan Detection

```javascript
// Source: Pattern from GitHub Actions workflow analysis
function detectTwoWaveMode(phaseDir) {
  const plans = loadPlans(phaseDir);
  
  // Criteria 1: At least 4 plans
  if (plans.length < 4) {
    return { mode: 'single-wave', reason: 'Too few plans' };
  }
  
  // Criteria 2: Multiple service groups OR analysis plans
  const serviceGroups = new Set(plans.map(p => p.service_group || 'default'));
  const analysisPlans = plans.filter(p => p.wave_role === 'analysis');
  
  const hasMultipleServices = serviceGroups.size >= 2;
  const hasAnalysis = analysisPlans.length > 0;
  
  if (!hasMultipleServices && !hasAnalysis) {
    return { mode: 'single-wave', reason: 'No parallelization benefit' };
  }
  
  // Criteria 3: Check for override in CONTEXT.md
  const context = loadContext(phaseDir);
  if (context.two_wave === false) {
    return { mode: 'single-wave', reason: 'Override in CONTEXT.md' };
  }
  if (context.two_wave === true) {
    return { mode: 'two-wave', reason: 'Override in CONTEXT.md' };
  }
  
  return { 
    mode: 'two-wave', 
    reason: `Multiple services (${serviceGroups.size}) + analysis plans (${analysisPlans.length})`,
    serviceGroups: Array.from(serviceGroups),
    analysisPlans: analysisPlans.map(p => p.id)
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static review panel assignment | Dynamic composition based on detected domains | Phase 35 | Better coverage, fewer irrelevant reviewers |
| Single-wave sequential execution | Two-wave parallel (build-then-validate) | Phase 37 (this phase) | 2x+ speedup for large phases |
| No authority boundaries | Exclusive domain ownership | Phase 37 (this phase) | Eliminates conflicting agent advice |
| Manual finding consolidation | Automated deduplication with severity escalation | Phase 37 (this phase) | Faster review, clearer priorities |
| File-level review scope | Line-level precision | Phase 37 (this phase) | Exact issue location, better fix targeting |

**Deprecated/outdated:**
- Fixed "board of directors" review panel (replaced by dynamic composition in Phase 35)
- Sequential plan execution within waves (replaced by parallel execution where CLI supports it)

## Open Questions

1. **How to handle domain expertise gaps?**
   - What we know: Panel may lack expertise for certain findings (e.g., mobile finding without mobile-developer)
   - What's unclear: Should we flag for adding agent, or allow generalist critique?
   - Recommendation: Flag as "outside panel expertise" and suggest adding specialist agent

2. **What if Wave A analysis finds fundamental architectural issues?**
   - What we know: Architecture Gate pauses for user decision
   - What's unclear: Should we offer auto-remediation, or require manual fix?
   - Recommendation: Require manual fix — architectural changes need human judgment

3. **How to measure authority boundary effectiveness?**
   - What we know: We can track filtered findings count
   - What's unclear: What's the target metric? Zero conflicts? Or <5% conflict rate?
   - Recommendation: Track conflicts per phase, aim for <5% of findings requiring conflict resolution

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `assert` + custom test runner |
| Config file | `.planning/config/authority-matrix.yaml` |
| Quick run command | `node tests/authority-matrix.test.js` |
| Full suite command | `npm test` (if package.json exists) |
| Estimated runtime | ~5 seconds |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Matrix loads without errors | unit | `node tests/authority-matrix.test.js` | ❌ Wave 0 gap |
| AUTH-01 | All 53 agents have domains | unit | `grep -c "exclusive_domains" .planning/config/authority-matrix.yaml` | ❌ Wave 0 gap |
| AUTH-02 | Prompt injection includes authority section | integration | Check for `AUTHORITY_CONTEXT` in wave-executor output | ❌ Wave 0 gap |
| AUTH-03 | Duplicates at same file:line are merged | unit | `node tests/deduplication.test.js` | ❌ Wave 0 gap |
| AUTH-04 | Out-of-domain findings are filtered | integration | Mock review panel run | ❌ Wave 0 gap |
| WAVE-01 | Two-wave detection activates for 4+ plans | unit | `node tests/two-wave-detection.test.js` | ❌ Wave 0 gap |
| WAVE-02 | Wave A spawns agents per service group | integration | Check WAVE-A-MANIFEST.yaml | ❌ Wave 0 gap |
| WAVE-03 | Wave B validates against Wave A outputs | integration | Check Wave B input loading | ❌ Wave 0 gap |

### Wave 0 Gaps (must be created before implementation)

- [ ] `tests/authority-matrix.test.js` — validates AUTH-01, AUTH-05
- [ ] `tests/deduplication.test.js` — validates AUTH-03
- [ ] `tests/two-wave-detection.test.js` — validates WAVE-01
- [ ] `tests/mocks/authority-matrix.yaml` — test fixture with sample agents
- [ ] `tests/mocks/sample-findings.json` — test data for deduplication

## Sources

### Primary (HIGH confidence)

- **Wikipedia: Multi-agent system** — Domain ownership patterns, autonomy principles
  - Wooldridge, Michael (2002). *An Introduction to MultiAgent Systems*
  - Shoham & Leyton-Brown (2008). *Multiagent Systems: Algorithmic, Game-Theoretic, and Logical Foundations*
  
- **GitHub Actions Documentation** — Job dependency patterns (`needs` keyword)
  - https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow
  
- **FIPA Standards** — Agent communication and coordination standards
  - Foundation for Intelligent Physical Agents
  - Agent Communication Language (ACL) patterns

### Secondary (MEDIUM confidence)

- **CAMEL Framework** (2023) — LLM-based multi-agent system with role-playing
  - Li et al. "Camel: Communicative agents for mind exploration"
  - https://github.com/camel-ai/camel

- **AutoGen** (Microsoft Research) — Multi-agent conversation framework
  - Conversation programming patterns
  - Agent orchestration approaches

- **SARIF Specification** — Static Analysis Results Interchange Format
  - Severity levels (error, warning, note)
  - Location-based result identification

### Tertiary (LOW confidence — marked for validation)

- **MALLM Framework** (2025) — Multi-Agent Large Language Models evaluation
  - May provide additional patterns for agent coordination
  - Not yet verified against Legion requirements

- **JADE Framework** — Java Agent Development Framework
  - Industrial MAS implementation patterns
  - Overkill for Legion's use case but validates architecture

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — YAML + prompt injection are established patterns
- Architecture: HIGH — Two-wave pattern mirrors proven CI/CD practices
- Pitfalls: MEDIUM-HIGH — Based on MAS research and static analysis tool patterns

**Research date:** 2026-03-05
**Valid until:** 2026-06-05 (90 days for stable architecture patterns)

---

*Research produced by gsd-phase-researcher for Phase 37 planning*
