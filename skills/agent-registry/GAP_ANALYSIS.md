# Gap Analysis Engine

A comprehensive skill for analyzing agent roster coverage gaps against production-grade role requirements.

---

## Section 1: Overview

### Purpose
The Gap Analysis Engine identifies coverage gaps between the current agent roster and production-grade role requirements. It analyzes agent capabilities, validates intent team references, scores production role coverage, and generates actionable gap reports.

### When to Use
- **Quarterly roster reviews**: Run gap analysis every 3 months to track coverage evolution
- **Before adding new agents**: Validate that new agents fill actual gaps, not create redundancy
- **Production readiness assessments**: Identify blocking gaps before production deployment
- **Intent team changes**: Re-analyze when intent-teams.yaml is modified
- **Post-roster changes**: After adding, removing, or consolidating agents

### Input Sources
1. **roster-gap-config.yaml**: Configuration with role definitions, scoring weights, and severity thresholds
2. **CATALOG.md**: Agent registry with divisions and task types
3. **intent-teams.yaml**: Intent-to-agent mappings for validation
4. **agents/*.md**: Individual agent personality files for capability extraction

### Output
- **Gap report**: Markdown document with severity-classified gaps and recommendations
- **Coverage matrix**: Mapping of agents to production roles with scores
- **Limit compliance status**: 52-agent limit analysis
- **Actionable recommendations**: Prioritized agent creation/removal suggestions

---

## Section 2: Gap Analysis Algorithm

The gap analysis follows a 7-step algorithm:

### Step 1: Load Configuration
```
parseRosterGapConfig() → Config
```

1. Read `.planning/config/roster-gap-config.yaml`
2. Extract configuration sections:
   - `agent_limit`: Maximum allowed agents (52)
   - `role_categories`: Production role definitions by category
   - `scoring`: Coverage strength weights
   - `severity`: Gap severity thresholds
   - `intent_teams_to_check`: Intents requiring validation
   - `replacement_candidates`: Agents for potential removal
3. Validate configuration schema
4. Return structured config object

**Validation Rules:**
- `agent_limit` must be positive integer
- Each role must have required_capabilities list
- Severity thresholds must be ordered (critical > high > medium > low)

### Step 2: Parse Agent Registry
```
parseAgentCatalog(catalogPath) → Agent[]
```

1. Read `skills/agent-registry/CATALOG.md`
2. Extract agent entries from division tables
3. For each agent, extract:
   - `agent_id`: kebab-case identifier
   - `division`: Primary division assignment
   - `specialty`: Brief capability description
   - `task_types`: Array of task type strings
4. Count total agents
5. Build agent capability index (task_type → agents[])

**Agent Count Verification:**
```
if current_count > agent_limit:
  flag limit_exceeded violation
  suggest replacement candidates
```

### Step 3: Validate Intent Teams
```
validateIntentTeams(agents, intentTeams) → ValidationResult
```

1. Read `.planning/config/intent-teams.yaml`
2. For each intent in `intent_teams_to_check`:
   - Extract all referenced agent IDs
   - Check each against parsed agent list
   - Record orphaned references (agents not in roster)
3. Build validation report:
   - Valid intents: All agents exist
   - Invalid intents: Missing agents listed
   - Impact assessment for each missing agent

**Orphaned Reference Detection:**
```javascript
const orphaned = intentAgents.filter(
  agentId => !rosterAgents.includes(agentId)
);
```

### Step 4: Map Agents to Production Roles
```
calculateCoverage(agents, productionRoles) → CoverageMatrix
```

For each production role in config:
1. Identify potential covering agents:
   - Match agent task_types to role coverage_indicators
   - Check agent specialty descriptions for keywords
   - Cross-reference with division alignment
   
2. Score coverage strength:
   - **FULL (1.0)**: Agent directly implements role capabilities
   - **PARTIAL (0.5)**: Agent covers subset of role capabilities
   - **MINIMAL (0.2)**: Agent tangentially related to role
   - **NONE (0.0)**: No relevant coverage

3. Calculate composite coverage:
   ```
   coverage_score = sum(covering_agents.strength * weight)
   coverage_percentage = min(coverage_score * 100, 100)
   ```

4. Record gaps:
   - List uncovered capabilities
   - Note coverage strength for each covering agent

### Step 5: Identify Gaps
```
identifyGaps(coverageMatrix, config) → Gap[]
```

For each under-covered role:
1. Calculate gap_score:
   ```
   gap_score = 1.0 - coverage_percentage
   ```

2. Determine severity:
   - Match gap_score to severity thresholds
   - Adjust based on role priority:
     - Critical priority roles: Severity +1 level
     - Nice-to-have roles: Severity -1 level (min: low)

3. Build gap record:
   ```yaml
   gap:
     role: role_id
     role_priority: critical|important|nice_to_have
     current_coverage: coverage_percentage
     gap_score: float
     severity: critical|high|medium|low
     covering_agents: [agent_ids]
     missing_capabilities: [capability_strings]
     recommendation: create_agent|enhance_existing|accept_gap
   ```

### Step 6: Check 52-Agent Limit
```
checkAgentLimit(currentCount, limit, candidates) → LimitStatus
```

1. Compare current_count vs agent_limit
2. Calculate overage: `overage = max(0, current_count - limit)`
3. Determine status:
   - **COMPLIANT**: current_count ≤ limit
   - **EXCEEDED**: current_count > limit

4. If exceeded:
   - Sort replacement_candidates by removal_difficulty
   - Suggest candidates for consolidation/removal
   - Calculate agents to remove: `remove_count = overage`

5. Build limit status report:
   ```yaml
   limit_status:
     current: 53
     limit: 52
     status: EXCEEDED
     overage: 1
     suggestions:
       - consolidate: [support-analytics-reporter, data-analytics-reporter]
       - remove: [marketing-tiktok-strategist]
   ```

### Step 7: Generate Report
```
generateGapReport(gaps, limitStatus, config) → Report
```

1. Group gaps by severity
2. Sort within severity by gap_score (descending)
3. Generate executive summary:
   - Total gaps by severity
   - Critical issues count
   - Limit compliance status
   
4. Build detailed findings:
   - Missing referenced agents
   - Coverage gaps by requirement
   - Recommendations with priority

5. Output formatted report to `.planning/phases/40-roster-gap-analysis/`

---

## Section 3: Production Role Coverage Mapping

This section documents the specific coverage analysis for ROSTER requirements.

### ROSTER-01: Gap Identification ✓

**Status**: Engine operational

The gap analysis engine successfully identifies coverage gaps through:
- Agent catalog parsing
- Intent team validation
- Production role coverage scoring
- Severity classification

### ROSTER-02: SRE-Equivalent Coverage ⚠️ PARTIAL

**Current Coverage Analysis:**

| Role | Covering Agents | Coverage Strength | Gaps |
|------|-----------------|-------------------|------|
| sre_reliability_engineer | support-infrastructure-maintainer | PARTIAL (0.5) | Formal SLOs, error budgets, incident response playbooks |
| sre_reliability_engineer | engineering-devops-automator | PARTIAL (0.5) | Reliability focus, SRE practices |
| chaos_engineer | testing-performance-benchmarker | MINIMAL (0.2) | Failure injection, game days |
| platform_engineer | engineering-devops-automator | PARTIAL (0.5) | Developer platforms, self-service |
| observability_engineer | support-infrastructure-maintainer | PARTIAL (0.5) | Distributed tracing, advanced metrics |
| observability_engineer | data-analytics-reporter | MINIMAL (0.2) | Data-focused, not observability-focused |

**Composite Coverage:**
- sre_reliability_engineer: **50%** (PARTIAL)
- chaos_engineer: **20%** (MINIMAL)
- platform_engineer: **50%** (PARTIAL)
- observability_engineer: **35%** (PARTIAL)

**Category Score**: 38.75% coverage

**Gap Assessment:**
```yaml
severity: MEDIUM
impact: "Infrastructure covered, formal SRE practices incomplete"
missing_capabilities:
  - SLO definition and management
  - Error budget tracking
  - Chaos engineering capabilities
  - Runbook automation
  - Formal incident response playbooks
  - Distributed tracing expertise
```

**Recommendation:**
- Short-term: Enhance support-infrastructure-maintainer with SRE capabilities
- Long-term: Consider dedicated SRE agent or rename/expand existing agent

### ROSTER-03: Security-Auditor Coverage ⚠️ HIGH GAP

**Current Coverage Analysis:**

| Role | Covering Agents | Coverage Strength | Gaps |
|------|-----------------|-------------------|------|
| security_engineer | *NONE* | NONE (0.0) | **AGENT MISSING** |
| security_engineer | testing-api-tester | MINIMAL (0.2) | Only API security testing |
| compliance_auditor | support-legal-compliance-checker | PARTIAL (0.5) | Legal focus, not security |
| penetration_tester | testing-api-tester | MINIMAL (0.2) | Limited to API pen testing |
| pii_specialist | support-legal-compliance-checker | PARTIAL (0.5) | GDPR/privacy covered |

**Composite Coverage:**
- security_engineer: **20%** (MINIMAL - CRITICAL GAP)
- compliance_auditor: **50%** (PARTIAL)
- penetration_tester: **20%** (MINIMAL)
- pii_specialist: **50%** (PARTIAL)

**Category Score**: 35% coverage

**Gap Assessment:**
```yaml
severity: HIGH
impact: "No dedicated security engineer - referenced agent missing"
missing_capabilities:
  - OWASP Top 10 comprehensive audit
  - STRIDE threat modeling
  - Secure code review
  - Vulnerability assessment
  - Security architecture review
  - Security testing beyond APIs
```

**Critical Finding:**
The `engineering-security-engineer` is referenced in:
- `harden` intent (primary agent)
- `security-only` intent (primary agent)
- CATALOG.md Section 2 (Intent Routing)

But this agent **does not exist** in the agents/ directory.

**Recommendation:**
- **CRITICAL**: Create engineering-security-engineer immediately
- Blocks `harden` intent functionality
- Required for production security audits

### ROSTER-04: Data-Scientist Coverage ⚠️ PARTIAL

**Current Coverage Analysis:**

| Role | Covering Agents | Coverage Strength | Gaps |
|------|-----------------|-------------------|------|
| data_scientist | data-analytics-reporter | PARTIAL (0.5) | Pipelines/ETL covered, not modeling |
| data_scientist | engineering-ai-engineer | MINIMAL (0.2) | ML focus, not data science |
| ml_engineer | engineering-ai-engineer | FULL (1.0) | ML model development covered |
| data_engineer | data-analytics-reporter | FULL (1.0) | Data pipelines covered |

**Composite Coverage:**
- data_scientist: **35%** (PARTIAL)
- ml_engineer: **100%** (FULL ✓)
- data_engineer: **100%** (FULL ✓)

**Category Score**: 78.33% coverage

**Gap Assessment:**
```yaml
severity: MEDIUM
impact: "Analytics and ML covered, formal data science missing"
missing_capabilities:
  - Statistical modeling
  - Hypothesis testing
  - Experimental design
  - Data visualization storytelling
  - A/B test analysis
  - Predictive analytics
```

**Recommendation:**
- Medium-term: Consider splitting data-analytics-reporter into:
  - data-engineer (pipelines, ETL) - already covered
  - data-scientist (modeling, statistics) - needs creation
- Or: Enhance data-analytics-reporter with data science capabilities

### ROSTER-05: Agent Creation Workflow

**Status**: ✓ READY

The `/legion:agent` workflow is functional and documented in:
- `commands/agent.md`: Command entry point
- `skills/agent-creator/SKILL.md`: Creation skill

**Constraint:** Cannot create new agents while over 52-agent limit.

### ROSTER-06: 52-Agent Limit

**Current Status:** ❌ EXCEEDED

```yaml
limit_analysis:
  current_count: 53
  agent_limit: 52
  status: EXCEEDED
  overage: 1
  
  root_cause: |
    Polymath agent (agents/polymath.md) was added in Phase 36
    without removing another agent to maintain limit.
    
  compliance_options:
    - option: accept_53
      description: "Update roadmap to accept 53-agent roster"
      effort: low
      impact: "Violates original constraint, requires documentation update"
      
    - option: consolidate_analytics
      description: "Merge support-analytics-reporter + data-analytics-reporter"
      effort: medium
      impact: "Maintains analytics coverage, reduces count by 1"
      recommendation: preferred
      
    - option: remove_niche
      description: "Remove 1 niche agent (marketing-tiktok-strategist)"
      effort: low
      impact: "Loses niche capability, maintains core coverage"
      
    - option: increase_limit
      description: "Increase limit to 54 (requires roadmap change)"
      effort: medium
      impact: "Permanent increase, sets precedent"
```

**Recommended Action:**
Consolidate support-analytics-reporter and data-analytics-reporter into a single data-analytics-specialist agent.

---

## Section 4: Intent Teams Gap Analysis

This section documents specific findings from intent team validation.

### harden Intent

**Purpose:** Security audit with Testing + Security divisions

**Referenced Agents:**
| Agent | Exists | Impact |
|-------|--------|--------|
| testing-reality-checker | ✓ YES | Available |
| **engineering-security-engineer** | ✗ **NO** | **CRITICAL GAP** |
| testing-api-tester | ✓ YES | Available |
| testing-evidence-collector | ✓ YES | Available |

**Impact Analysis:**
The `harden` intent references `engineering-security-engineer` as a **primary agent**. Without this agent:
- Intent cannot function as designed
- Falls back to partial team (testing agents only)
- Security expertise missing from security audit
- Violates intent's core purpose

**Gap Classification:** CRITICAL

### document Intent

**Purpose:** Generate documentation without implementation

**Referenced Agents:**
| Agent | Exists | Impact |
|-------|--------|--------|
| **product-technical-writer** | ✗ **NO** | **HIGH GAP** |
| engineering-frontend-developer | ✓ YES | Available (fallback) |

**Impact Analysis:**
The `document` intent references `product-technical-writer` as the **primary agent**. Without this agent:
- Intent falls back to frontend-developer
- Suboptimal documentation quality
- Developer-focused docs, not user-focused
- Violates intent separation of concerns

**Gap Classification:** HIGH

### security-only Intent

**Purpose:** Security-only review audit

**Referenced Agents:**
| Agent | Exists | Impact |
|-------|--------|--------|
| **engineering-security-engineer** | ✗ **NO** | **CRITICAL GAP** |
| testing-api-tester | ✓ YES | Available |

**Impact Analysis:**
The `security-only` intent is designed for security-focused reviews. Without the security engineer:
- Cannot perform comprehensive security audits
- Limited to API security testing only
- Missing threat modeling capabilities

**Gap Classification:** CRITICAL

---

## Section 5: 52-Agent Limit Analysis

### Current Roster State

**Agent Count by Division:**

| Division | Count | Agents |
|----------|-------|--------|
| Engineering | 8 | ai-engineer, backend-architect, devops-automator, frontend-developer, mobile-app-builder, rapid-prototyper, senior-developer, laravel-specialist |
| Design | 6 | brand-guardian, ui-designer, ux-architect, ux-researcher, visual-storyteller, whimsy-injector |
| Marketing | 8 | app-store-optimizer, content-creator, growth-hacker, instagram-curator, reddit-community-builder, social-media-strategist, tiktok-strategist, twitter-engager |
| Product | 3 | feedback-synthesizer, sprint-prioritizer, trend-researcher |
| Project Management | 5 | experiment-tracker, project-shepherd, studio-operations, studio-producer, senior-project-manager |
| Spatial Computing | 6 | metal-engineer, terminal-specialist, visionos-spatial-engineer, cockpit-specialist, immersive-developer, interface-architect |
| Specialized | 4 | orchestrator, analytics-reporter, lsp-engineer, **polymath** |
| Support | 6 | support-responder, legal-compliance, infrastructure-maintainer, finance-tracker, executive-summary, **analytics-reporter** |
| Testing | 7 | api-tester, evidence-collector, performance-benchmarker, reality-checker, results-analyzer, tool-evaluator, workflow-optimizer |
| **TOTAL** | **53** | — |

### Limit Violation Details

```
┌─────────────────────────────────────────────────────────┐
│              52-AGENT LIMIT STATUS                       │
├─────────────────────────────────────────────────────────┤
│  Current: 53 agents                                      │
│  Limit:   52 agents                                      │
│  Status:  ❌ EXCEEDED by 1                               │
└─────────────────────────────────────────────────────────┘
```

### Compliance Options Analysis

**Option 1: Accept 53-Agent Roster**
- **Effort**: Low
- **Pros**: Simplest solution, no agent changes
- **Cons**: Violates original constraint, sets precedent for future increases
- **Recommendation**: Not preferred

**Option 2: Consolidate Overlapping Agents** ⭐ RECOMMENDED
- **Action**: Merge support-analytics-reporter + data-analytics-reporter
- **Effort**: Medium
- **Pros**: 
  - Maintains full analytics capability
  - Eliminates redundancy
  - Single agent owns full analytics lifecycle
- **Cons**: 
  - Requires agent personality merge
  - May lose some specialization
- **New Agent**: data-analytics-specialist

**Option 3: Remove Niche Agent**
- **Candidate**: marketing-tiktok-strategist
- **Effort**: Low
- **Pros**: Quick fix, minimal impact on core functionality
- **Cons**: Loses TikTok-specific marketing capability
- **Recommendation**: Acceptable short-term fix

**Option 4: Increase Limit**
- **New Limit**: 54
- **Effort**: Medium (requires roadmap update)
- **Pros**: Accommodates current roster
- **Cons**: Permanent increase, harder to justify later
- **Recommendation**: Not preferred

### Recommended Path Forward

1. **Immediate**: Consolidate analytics agents (support-analytics-reporter + data-analytics-reporter → data-analytics-specialist)
2. **Phase 40-02**: Create missing agents (engineering-security-engineer, product-technical-writer)
3. **v5.1**: Re-analyze roster and consider removing niche agents if count approaches limit again

---

## Section 6: Implementation Functions

This section provides implementation guidance for the gap analysis functions.

### Function: parseAgentCatalog()

**Purpose**: Parse CATALOG.md and extract agent information

**Signature**:
```typescript
function parseAgentCatalog(catalogPath: string): Agent[]
```

**Returns**:
```typescript
interface Agent {
  id: string;                    // kebab-case identifier
  file: string;                  // Path to personality file
  division: string;              // Division assignment
  specialty: string;             // Capability description
  taskTypes: string[];           // Array of task types
}
```

**Algorithm**:
1. Read CATALOG.md content
2. Extract frontmatter intent_mappings (store separately)
3. Parse division tables using regex:
   ```regex
   \| ([\w-]+) \| `agents/([\w-]+)\.md` \| (.+?) \| (.+?) \|
   ```
4. Build Agent objects from matches
5. Return array

**Example**:
```javascript
const agents = parseAgentCatalog('skills/agent-registry/CATALOG.md');
// Returns: [{id: 'testing-api-tester', division: 'Testing', ...}, ...]
```

---

### Function: validateIntentTeams()

**Purpose**: Validate that all intent-referenced agents exist

**Signature**:
```typescript
function validateIntentTeams(
  agents: Agent[],
  intentTeamsPath: string
): ValidationResult
```

**Returns**:
```typescript
interface ValidationResult {
  validIntents: string[];           // Intents with all agents present
  invalidIntents: InvalidIntent[];  // Intents with missing agents
  orphanedReferences: string[];     // All missing agent IDs
}

interface InvalidIntent {
  intent: string;
  missingAgents: string[];
  impact: string;
}
```

**Algorithm**:
1. Read intent-teams.yaml
2. Extract agents list from each intent
3. Check each agent against roster
4. Build validation result

**Example**:
```javascript
const result = validateIntentTeams(agents, '.planning/config/intent-teams.yaml');
// Returns:
// {
//   validIntents: ['skip-frontend', 'skip-backend'],
//   invalidIntents: [
//     {intent: 'harden', missingAgents: ['engineering-security-engineer'], ...}
//   ],
//   orphanedReferences: ['engineering-security-engineer', 'product-technical-writer']
// }
```

---

### Function: calculateCoverage()

**Purpose**: Calculate production role coverage from agent capabilities

**Signature**:
```typescript
function calculateCoverage(
  agents: Agent[],
  config: GapConfig
): CoverageMatrix
```

**Returns**:
```typescript
interface CoverageMatrix {
  roles: RoleCoverage[];
  categoryScores: CategoryScore[];
}

interface RoleCoverage {
  roleId: string;
  category: string;
  priority: 'critical' | 'important' | 'nice_to_have';
  coverageScore: number;           // 0.0 - 1.0
  coveragePercentage: number;      // 0% - 100%
  coveringAgents: CoveringAgent[];
  missingCapabilities: string[];
}

interface CoveringAgent {
  agentId: string;
  strength: 'full' | 'partial' | 'minimal';
  strengthValue: number;           // 1.0, 0.5, 0.2
  coveredCapabilities: string[];
}
```

**Algorithm**:
1. For each role in config.role_categories:
   a. Find matching agents using coverage_indicators
   b. Score each agent's coverage strength
   c. Calculate composite score
   d. Identify missing capabilities
2. Aggregate by category
3. Return matrix

**Example**:
```javascript
const matrix = calculateCoverage(agents, config);
// Returns coverage scores for all production roles
```

---

### Function: identifyGaps()

**Purpose**: Identify and classify coverage gaps

**Signature**:
```typescript
function identifyGaps(
  coverageMatrix: CoverageMatrix,
  config: GapConfig
): Gap[]
```

**Returns**:
```typescript
interface Gap {
  roleId: string;
  category: string;
  priority: string;
  currentCoverage: number;         // Percentage
  gapScore: number;                // 1.0 - coverage
  severity: 'critical' | 'high' | 'medium' | 'low';
  coveringAgents: string[];
  missingCapabilities: string[];
  recommendation: string;
}
```

**Algorithm**:
1. For each role with coverage < 100%:
   a. Calculate gap_score = 1.0 - coverage
   b. Match to severity threshold
   c. Adjust for role priority
2. Sort by severity, then gap_score
3. Return gap array

**Example**:
```javascript
const gaps = identifyGaps(matrix, config);
// Returns: [{roleId: 'security_engineer', severity: 'critical', ...}, ...]
```

---

### Function: checkAgentLimit()

**Purpose**: Check 52-agent limit compliance

**Signature**:
```typescript
function checkAgentLimit(
  currentCount: number,
  limit: number,
  candidates: ReplacementCandidate[]
): LimitStatus
```

**Returns**:
```typescript
interface LimitStatus {
  current: number;
  limit: number;
  status: 'COMPLIANT' | 'EXCEEDED';
  overage: number;
  suggestions: Suggestion[];
}

interface Suggestion {
  type: 'consolidate' | 'remove' | 'accept';
  description: string;
  effort: 'low' | 'medium' | 'high';
  agents?: string[];
}
```

**Algorithm**:
1. Compare counts
2. If exceeded:
   a. Sort candidates by difficulty
   b. Generate suggestions
3. Return status

---

### Function: generateGapReport()

**Purpose**: Generate formatted gap report

**Signature**:
```typescript
function generateGapReport(
  gaps: Gap[],
  limitStatus: LimitStatus,
  validationResult: ValidationResult,
  config: GapConfig
): string  // Markdown
```

**Returns**: Complete gap report as markdown string

**Report Sections**:
1. Executive Summary
2. Critical Findings
3. Coverage Analysis by Requirement
4. Gap Severity Summary
5. Recommendations
6. Appendix: Agent Inventory

---

## Section 7: Integration Points

### Called By

**`/legion:status` - Roster Health Check**
- Integration: Status command runs gap analysis as part of health checks
- Purpose: Alert users to coverage gaps before they become blockers
- Frequency: Every status invocation
- Output: Dashboard display of gap summary

**`/legion:plan` - Team Recommendations**
- Integration: Planning suggests agents based on gap analysis
- Purpose: Recommend creating missing agents for identified gaps
- Trigger: When plan requirements align with gap categories
- Output: Agent creation recommendations in plan output

**`/legion:agent` - Creation Validation**
- Integration: Agent creation checks limit before proceeding
- Purpose: Prevent creating agents when over limit
- Validation: Block creation if 53+ agents exist
- Output: Error message with consolidation suggestions

### Updates

**No Direct File Writes**

The gap analysis engine is **read-only** with respect to production files:
- Does NOT modify CATALOG.md
- Does NOT modify intent-teams.yaml
- Does NOT modify agent files
- Does NOT modify configuration

**Produces Reports For Human Review**

Output is informational only:
- Gap reports in `.planning/phases/40-roster-gap-analysis/`
- Console output during analysis
- Recommendations for manual action

### Related Components

| Component | Relationship | Data Flow |
|-----------|--------------|-----------|
| CATALOG.md | Input | Agent registry parsing |
| intent-teams.yaml | Input | Validation target |
| roster-gap-config.yaml | Input | Configuration and role definitions |
| agents/*.md | Input | Capability extraction (optional) |
| 40-01-gap-report.md | Output | Generated report |
| agent-creator skill | Consumer | Reads recommendations |
| /legion:agent command | Consumer | Limit validation |

### Example Gap Report Output

```markdown
---
phase: 40-roster-gap-analysis
date: 2026-03-05
agent_count: 53
agent_limit: 52
limit_status: EXCEEDED
---

# Roster Gap Analysis Report

## Executive Summary

**Current Roster:** 53 agents across 9 divisions
**Agent Limit:** 52 (EXCEEDED by 1)
**Critical Gaps:** 2
**High Priority Gaps:** 2
**Medium Priority Gaps:** 3

[Additional sections...]
```

---

## Usage Example

```bash
# Run full gap analysis
/legion:analyze gaps

# Check specific category
/legion:analyze gaps --category=security

# Validate intent teams
/legion:analyze gaps --validate-intents

# Generate report
/legion:analyze gaps --output=.planning/phases/40-roster-gap-analysis/report.md
```

---

**Last Updated**: 2026-03-05
**Version**: 1.0
**Requirements**: ROSTER-01, ROSTER-02, ROSTER-03, ROSTER-04, ROSTER-05, ROSTER-06
