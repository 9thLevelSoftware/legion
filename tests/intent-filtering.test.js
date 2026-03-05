/**
 * Intent Filtering Tests
 * Validates plan filtering by intent flags (agent-based, file-based, task-based, content-based)
 * Requirements: INTENT-02, INTENT-03, INTENT-04
 */

const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Test configuration
const AUTHORITY_PATH = path.join(__dirname, 'mocks', 'authority-matrix.json');

/**
 * Filter plans by agent exclusion
 * @param {Array} plans - Array of plan objects
 * @param {string} agentId - Agent ID to exclude
 * @returns {Array} Filtered plans
 */
function filterByAgentExclusion(plans, agentId) {
  return plans.filter(plan => {
    if (!plan.agents) return true;
    return !plan.agents.includes(agentId);
  });
}

/**
 * Filter plans to include only specific agent types
 * @param {Array} plans - Array of plan objects
 * @param {Array} agentTypes - Agent types to include
 * @returns {Array} Filtered plans
 */
function filterByAgentInclusion(plans, agentTypes) {
  return plans.filter(plan => {
    if (!plan.agents) return false;
    return plan.agents.some(agent => agentTypes.includes(agent));
  });
}

/**
 * Filter plans by file patterns
 * @param {Array} plans - Array of plan objects
 * @param {Array} patterns - File patterns to match
 * @param {string} mode - 'include' or 'exclude'
 * @returns {Array} Filtered plans
 */
function filterByFilePatterns(plans, patterns, mode = 'exclude') {
  const globToRegex = (pattern) => {
    let regex = '';
    let i = 0;
    while (i < pattern.length) {
      if (pattern[i] === '*' && pattern[i + 1] === '*') {
        // ** matches anything including /
        regex += '.*';
        i += 2;
        // Skip a following / since ** already includes it
        if (pattern[i] === '/') {
          i += 1;
        }
      } else if (pattern[i] === '*') {
        // * matches anything except /
        regex += '[^/]*';
        i += 1;
      } else if (pattern[i] === '?') {
        // ? matches single character
        regex += '.';
        i += 1;
      } else if (pattern[i] === '.') {
        // Escape literal dots in pattern (e.g., .js, .md)
        regex += '\\.';
        i += 1;
      } else if ('+^${}()|[]\\'.includes(pattern[i])) {
        // Escape other regex special chars
        regex += '\\' + pattern[i];
        i += 1;
      } else {
        // Regular character
        regex += pattern[i];
        i += 1;
      }
    }
    return new RegExp(regex);
  };
  
  return plans.filter(plan => {
    if (!plan.files_modified) return true;
    
    const matchesPattern = plan.files_modified.some(file => {
      return patterns.some(pattern => {
        const regex = globToRegex(pattern);
        return regex.test(file);
      });
    });
    
    return mode === 'exclude' ? !matchesPattern : matchesPattern;
  });
}

/**
 * Filter plans by task types
 * @param {Array} plans - Array of plan objects
 * @param {Object} filters - Filter configuration
 * @returns {Array} Filtered plans
 */
function filterByTaskTypes(plans, filters) {
  const { include_task_types, exclude_task_types } = filters;
  
  return plans.filter(plan => {
    if (!plan.tasks) return true;
    
    // Check if plan has any included task types
    if (include_task_types && include_task_types.length > 0) {
      const hasIncludedTask = plan.tasks.some(task => 
        include_task_types.includes(task.type)
      );
      if (!hasIncludedTask) return false;
    }
    
    // Check if plan has excluded task types
    if (exclude_task_types && exclude_task_types.length > 0) {
      const hasExcludedTask = plan.tasks.some(task =>
        exclude_task_types.includes(task.type)
      );
      if (hasExcludedTask) return false;
    }
    
    return true;
  });
}

/**
 * Detect intent from plan objective
 * @param {Object} plan - Plan object with objective
 * @returns {string} Detected intent ('documentation', 'implementation', 'testing', 'security')
 */
function detectPlanIntent(plan) {
  const objective = (plan.objective || '').toLowerCase();
  
  if (objective.includes('document') || objective.includes('doc')) {
    return 'documentation';
  }
  if (objective.includes('test') || objective.includes('spec')) {
    return 'testing';
  }
  if (objective.includes('security') || objective.includes('harden') || objective.includes('audit')) {
    return 'security';
  }
  if (objective.includes('implement') || objective.includes('build') || objective.includes('create')) {
    return 'implementation';
  }
  
  return 'unknown';
}

/**
 * Filter plans with zero matching tasks
 * @param {Array} plans - Array of plan objects
 * @returns {Array} Filtered plans with at least one task
 */
function filterEmptyTaskPlans(plans) {
  return plans.filter(plan => {
    if (!plan.tasks) return true;
    return plan.tasks.length > 0;
  });
}

// Test fixtures
const samplePlans = [
  {
    id: 'plan-001',
    objective: 'Create user authentication system',
    agents: ['backend-developer', 'security-engineer'],
    files_modified: ['src/auth/login.js', 'src/auth/register.js'],
    tasks: [
      { type: 'implementation', name: 'Login endpoint' },
      { type: 'security-audit', name: 'Auth security review' }
    ]
  },
  {
    id: 'plan-002',
    objective: 'Update API documentation',
    agents: ['technical-writer', 'code-reviewer'],
    files_modified: ['docs/api.md', 'README.md'],
    tasks: [
      { type: 'documentation', name: 'Update API docs' },
      { type: 'readme-update', name: 'Update README' }
    ]
  },
  {
    id: 'plan-003',
    objective: 'Implement React components',
    agents: ['frontend-developer', 'ui-designer'],
    files_modified: ['src/components/Button.tsx', 'src/components/Form.tsx'],
    tasks: [
      { type: 'feature-implementation', name: 'Button component' },
      { type: 'ui-design', name: 'Form layout' }
    ]
  },
  {
    id: 'plan-004',
    objective: 'Add unit tests for auth module',
    agents: ['qa-automation', 'backend-developer'],
    files_modified: ['tests/auth.test.js'],
    tasks: [
      { type: 'test-implementation', name: 'Auth unit tests' },
      { type: 'test-coverage', name: 'Coverage check' }
    ]
  },
  {
    id: 'plan-005',
    objective: 'Security hardening pass',
    agents: ['security-engineer'],
    files_modified: ['src/**/*.js'],
    tasks: [
      { type: 'security-audit', name: 'OWASP scan' },
      { type: 'vulnerability-scan', name: 'Vuln check' }
    ]
  },
  {
    id: 'plan-006',
    objective: 'Documentation only',
    agents: ['technical-writer'],
    files_modified: ['docs/**/*.md'],
    tasks: []
  }
];

// Test: Agent-based filtering
describe('Agent-Based Filtering', () => {
  test('should exclude plans by agent ID (frontend-developer)', () => {
    const filtered = filterByAgentExclusion(samplePlans, 'frontend-developer');
    
    assert.strictEqual(filtered.length, 5);
    assert.ok(!filtered.some(p => p.id === 'plan-003'));
    assert.ok(filtered.some(p => p.id === 'plan-001'));
  });
  
  test('should exclude plans by agent ID (security-engineer)', () => {
    const filtered = filterByAgentExclusion(samplePlans, 'security-engineer');
    
    assert.strictEqual(filtered.length, 4);
    assert.ok(!filtered.some(p => p.id === 'plan-001'));
    assert.ok(!filtered.some(p => p.id === 'plan-005'));
  });
  
  test('should include only specific agent types (--just-document)', () => {
    const filtered = filterByAgentInclusion(samplePlans, ['technical-writer']);
    
    assert.strictEqual(filtered.length, 2);
    assert.ok(filtered.some(p => p.id === 'plan-002'));
    assert.ok(filtered.some(p => p.id === 'plan-006'));
  });
  
  test('should include multiple agent types', () => {
    const filtered = filterByAgentInclusion(samplePlans, ['security-engineer', 'qa-automation']);
    
    assert.strictEqual(filtered.length, 3);
    assert.ok(filtered.some(p => p.id === 'plan-001'));
    assert.ok(filtered.some(p => p.id === 'plan-004'));
    assert.ok(filtered.some(p => p.id === 'plan-005'));
  });
  
  test('should handle plans without agents field', () => {
    const plansWithoutAgents = [
      { id: 'plan-007', objective: 'Test' },
      { id: 'plan-008', objective: 'Test 2', agents: ['frontend-developer'] }
    ];
    const filtered = filterByAgentExclusion(plansWithoutAgents, 'frontend-developer');
    
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].id, 'plan-007');
  });
  
  test('should return empty array when no matching agents', () => {
    const filtered = filterByAgentInclusion(samplePlans, ['nonexistent-agent']);
    
    assert.strictEqual(filtered.length, 0);
  });
});

// Test: File-based filtering
describe('File-Based Filtering', () => {
  test('should exclude plans with .tsx files (--skip-frontend)', () => {
    const patterns = ['*.tsx', '*.jsx', '*.css'];
    const filtered = filterByFilePatterns(samplePlans, patterns, 'exclude');
    
    assert.strictEqual(filtered.length, 5);
    assert.ok(!filtered.some(p => p.id === 'plan-003'));
  });
  
  test('should exclude plans with Python files (--skip-backend)', () => {
    const plansWithPython = [
      ...samplePlans,
      {
        id: 'plan-py',
        files_modified: ['api/main.py', 'server/app.py']
      }
    ];
    const patterns = ['*.py', 'api/**', 'server/**'];
    const filtered = filterByFilePatterns(plansWithPython, patterns, 'exclude');
    
    assert.ok(!filtered.some(p => p.id === 'plan-py'));
  });
  
  test('should match glob-style patterns correctly', () => {
    const patterns = ['tests/**/*.js'];
    const filtered = filterByFilePatterns(samplePlans, patterns, 'include');
    
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].id, 'plan-004');
  });
  
  test('should match double-star patterns for any depth', () => {
    const patterns = ['src/**/*.js'];
    const filtered = filterByFilePatterns(samplePlans, patterns, 'include');
    
    assert.ok(filtered.some(p => p.id === 'plan-001'));
    assert.ok(!filtered.some(p => p.id === 'plan-002'));
  });
  
  test('should combine multiple patterns with OR logic', () => {
    const patterns = ['*.tsx', '*.md'];
    const filtered = filterByFilePatterns(samplePlans, patterns, 'include');
    
    assert.ok(filtered.some(p => p.id === 'plan-002')); // has .md
    assert.ok(filtered.some(p => p.id === 'plan-003')); // has .tsx
  });
  
  test('should handle plans without files_modified field', () => {
    const plans = [
      { id: 'plan-009', objective: 'Test' },
      { id: 'plan-010', files_modified: ['test.tsx'] }
    ];
    const patterns = ['*.tsx'];
    const filtered = filterByFilePatterns(plans, patterns, 'exclude');
    
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].id, 'plan-009');
  });
  
  test('should include mode work correctly', () => {
    const patterns = ['docs/**/*.md'];
    const filtered = filterByFilePatterns(samplePlans, patterns, 'include');
    
    assert.ok(filtered.some(p => p.id === 'plan-002'));
    assert.ok(filtered.some(p => p.id === 'plan-006'));
    assert.ok(!filtered.some(p => p.id === 'plan-001'));
  });
});

// Test: Task-based filtering
describe('Task-Based Filtering', () => {
  test('should filter by include_task_types', () => {
    const filters = { include_task_types: ['security-audit'] };
    const filtered = filterByTaskTypes(samplePlans, filters);
    
    assert.ok(filtered.some(p => p.id === 'plan-001'));
    assert.ok(filtered.some(p => p.id === 'plan-005'));
    assert.ok(!filtered.some(p => p.id === 'plan-002'));
  });
  
  test('should filter by exclude_task_types', () => {
    const filters = { exclude_task_types: ['feature-implementation'] };
    const filtered = filterByTaskTypes(samplePlans, filters);
    
    assert.ok(!filtered.some(p => p.id === 'plan-003'));
    assert.ok(filtered.some(p => p.id === 'plan-001'));
  });
  
  test('should combine include and exclude filters', () => {
    const filters = {
      include_task_types: ['documentation', 'readme-update'],
      exclude_task_types: ['implementation']
    };
    const filtered = filterByTaskTypes(samplePlans, filters);
    
    assert.ok(filtered.some(p => p.id === 'plan-002'));
    assert.ok(!filtered.some(p => p.id === 'plan-001')); // has implementation
  });
  
  test('should handle plans without tasks field', () => {
    const plans = [
      { id: 'plan-011', objective: 'Test' },
      { id: 'plan-012', tasks: [{ type: 'implementation' }] }
    ];
    const filters = { include_task_types: ['implementation'] };
    const filtered = filterByTaskTypes(plans, filters);
    
    assert.strictEqual(filtered.length, 2); // plan-011 passes (no tasks), plan-012 matches
  });
  
  test('should handle empty task types array', () => {
    const filters = { include_task_types: [] };
    const filtered = filterByTaskTypes(samplePlans, filters);
    
    assert.strictEqual(filtered.length, samplePlans.length);
  });
});

// Test: Content-based filtering
describe('Content-Based Filtering', () => {
  test('should detect documentation intent', () => {
    const plan = { objective: 'Update API documentation' };
    const intent = detectPlanIntent(plan);
    
    assert.strictEqual(intent, 'documentation');
  });
  
  test('should detect testing intent', () => {
    const plan = { objective: 'Add unit tests' };
    const intent = detectPlanIntent(plan);
    
    assert.strictEqual(intent, 'testing');
  });
  
  test('should detect security intent', () => {
    const plan = { objective: 'Security hardening pass' };
    const intent = detectPlanIntent(plan);
    
    assert.strictEqual(intent, 'security');
  });
  
  test('should detect implementation intent', () => {
    const plan = { objective: 'Implement user authentication' };
    const intent = detectPlanIntent(plan);
    
    assert.strictEqual(intent, 'implementation');
  });
  
  test('should return unknown for ambiguous objectives', () => {
    const plan = { objective: 'Fix stuff' };
    const intent = detectPlanIntent(plan);
    
    assert.strictEqual(intent, 'unknown');
  });
  
  test('should handle missing objective', () => {
    const plan = {};
    const intent = detectPlanIntent(plan);
    
    assert.strictEqual(intent, 'unknown');
  });
});

// Test: Empty plan filtering
describe('Empty Plan Filtering', () => {
  test('should filter plans with zero tasks', () => {
    const filtered = filterEmptyTaskPlans(samplePlans);
    
    assert.ok(!filtered.some(p => p.id === 'plan-006'));
    assert.strictEqual(filtered.length, 5);
  });
  
  test('should keep plans with tasks field as undefined', () => {
    const plans = [
      { id: 'plan-013' },
      { id: 'plan-014', tasks: [] }
    ];
    const filtered = filterEmptyTaskPlans(plans);
    
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].id, 'plan-013');
  });
  
  test('should keep plans with non-empty tasks', () => {
    const filtered = filterEmptyTaskPlans([samplePlans[0]]);
    
    assert.strictEqual(filtered.length, 1);
  });
});

// Export functions for use in other tests
module.exports = {
  filterByAgentExclusion,
  filterByAgentInclusion,
  filterByFilePatterns,
  filterByTaskTypes,
  detectPlanIntent,
  filterEmptyTaskPlans
};
