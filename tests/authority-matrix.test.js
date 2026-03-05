/**
 * Authority Matrix Validation Tests
 * Validates agent domain ownership and overlap detection
 * Requirements: AUTH-01, AUTH-05
 */

const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Test configuration
const FIXTURE_PATH = path.join(__dirname, 'mocks', 'authority-matrix.json');

// Load and parse the JSON fixture
function loadFixture() {
  const content = fs.readFileSync(FIXTURE_PATH, 'utf8');
  return JSON.parse(content);
}

// Test: Load and parse authority matrix
describe('Authority Matrix Loading', () => {
  let matrix;
  
  before(() => {
    matrix = loadFixture();
  });
  
  test('should load JSON fixture without errors', () => {
    assert.ok(matrix, 'Matrix should be loaded');
  });
  
  test('should contain agents section', () => {
    assert.ok(matrix.agents, 'Matrix should have agents');
    assert.strictEqual(typeof matrix.agents, 'object', 'Agents should be an object');
  });
  
  test('should have at least 4 agents defined', () => {
    const agentCount = Object.keys(matrix.agents).length;
    assert.ok(agentCount >= 4, `Expected at least 4 agents, got ${agentCount}`);
  });
});

// Test: Validate agent exclusive domains
describe('Agent Domain Validation', () => {
  let matrix;
  
  before(() => {
    matrix = loadFixture();
  });
  
  test('all agents have exclusive_domains defined', () => {
    for (const [agentName, agent] of Object.entries(matrix.agents)) {
      assert.ok(agent.exclusive_domains, 
        `Agent ${agentName} should have exclusive_domains`);
      assert.ok(Array.isArray(agent.exclusive_domains),
        `Agent ${agentName} exclusive_domains should be an array`);
      assert.ok(agent.exclusive_domains.length > 0,
        `Agent ${agentName} should have at least one domain`);
    }
  });
  
  test('all domains are kebab-case format', () => {
    const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    
    for (const [agentName, agent] of Object.entries(matrix.agents)) {
      for (const domain of agent.exclusive_domains) {
        assert.ok(kebabCaseRegex.test(domain),
          `Domain "${domain}" for agent ${agentName} should be kebab-case`);
      }
    }
  });
  
  test('all agents have agent_file reference', () => {
    for (const [agentName, agent] of Object.entries(matrix.agents)) {
      assert.ok(agent.agent_file,
        `Agent ${agentName} should reference an agent file`);
      assert.ok(agent.agent_file.endsWith('.md'),
        `Agent ${agentName} file reference should be .md`);
    }
  });
  
  test('security-engineer has OWASP and STRIDE domains', () => {
    const securityEngineer = matrix.agents['security-engineer'];
    assert.ok(securityEngineer, 'Security engineer should exist');
    assert.ok(securityEngineer.exclusive_domains.includes('owasp-top-10'),
      'Security engineer should have owasp-top-10 domain');
    assert.ok(securityEngineer.exclusive_domains.includes('stride-model'),
      'Security engineer should have stride-model domain');
  });
  
  test('frontend-developer has UI/UX and accessibility domains', () => {
    const frontendDev = matrix.agents['frontend-developer'];
    assert.ok(frontendDev, 'Frontend developer should exist');
    assert.ok(frontendDev.exclusive_domains.includes('user-interface'),
      'Frontend developer should have user-interface domain');
    assert.ok(frontendDev.exclusive_domains.includes('accessibility'),
      'Frontend developer should have accessibility domain');
  });
  
  test('sre-chaos has SLO and chaos engineering domains', () => {
    const sreChaos = matrix.agents['sre-chaos'];
    assert.ok(sreChaos, 'SRE Chaos should exist');
    assert.ok(sreChaos.exclusive_domains.includes('service-level-objectives'),
      'SRE Chaos should have service-level-objectives domain');
    assert.ok(sreChaos.exclusive_domains.includes('chaos-engineering'),
      'SRE Chaos should have chaos-engineering domain');
  });
  
  test('code-reviewer has style and patterns domains', () => {
    const codeReviewer = matrix.agents['code-reviewer'];
    assert.ok(codeReviewer, 'Code reviewer should exist');
    assert.ok(codeReviewer.exclusive_domains.includes('code-style'),
      'Code reviewer should have code-style domain');
    assert.ok(codeReviewer.exclusive_domains.includes('design-patterns'),
      'Code reviewer should have design-patterns domain');
  });
  
  test('qa-automation has testing domains', () => {
    const qaAuto = matrix.agents['qa-automation'];
    assert.ok(qaAuto, 'QA Automation should exist');
    assert.ok(qaAuto.exclusive_domains.includes('test-strategy'),
      'QA Automation should have test-strategy domain');
    assert.ok(qaAuto.exclusive_domains.includes('test-automation'),
      'QA Automation should have test-automation domain');
  });
});

// Test: Overlap detection
describe('Domain Overlap Detection', () => {
  let matrix;
  
  before(() => {
    matrix = loadFixture();
  });
  
  function findOverlappingDomains(agent1, agent2) {
    const domains1 = agent1.exclusive_domains || [];
    const domains2 = agent2.exclusive_domains || [];
    return domains1.filter(d => domains2.includes(d));
  }
  
  test('no overlapping domains between different agents', () => {
    const agentNames = Object.keys(matrix.agents);
    
    for (let i = 0; i < agentNames.length; i++) {
      for (let j = i + 1; j < agentNames.length; j++) {
        const agent1 = matrix.agents[agentNames[i]];
        const agent2 = matrix.agents[agentNames[j]];
        const overlaps = findOverlappingDomains(agent1, agent2);
        
        assert.strictEqual(overlaps.length, 0,
          `Agents ${agentNames[i]} and ${agentNames[j]} should not share domains. ` +
          `Overlaps: ${overlaps.join(', ')}`);
      }
    }
  });
  
  test('overlap detection function works correctly', () => {
    const agent1 = { exclusive_domains: ['domain-a', 'domain-b'] };
    const agent2 = { exclusive_domains: ['domain-b', 'domain-c'] };
    const overlaps = findOverlappingDomains(agent1, agent2);
    
    assert.deepStrictEqual(overlaps, ['domain-b']);
  });
  
  test('no overlap detected for completely different domains', () => {
    const agent1 = { exclusive_domains: ['domain-a'] };
    const agent2 = { exclusive_domains: ['domain-b'] };
    const overlaps = findOverlappingDomains(agent1, agent2);
    
    assert.deepStrictEqual(overlaps, []);
  });
  
  test('security and frontend domains do not overlap', () => {
    const securityEng = matrix.agents['security-engineer'];
    const frontendDev = matrix.agents['frontend-developer'];
    const overlaps = findOverlappingDomains(securityEng, frontendDev);
    
    assert.strictEqual(overlaps.length, 0,
      'Security and Frontend should have no overlapping domains');
  });
});

// Test: Authority lookup
describe('Authority Lookup', () => {
  let matrix;
  
  before(() => {
    matrix = loadFixture();
  });
  
  function findAgentByDomain(domain) {
    for (const [agentName, agent] of Object.entries(matrix.agents)) {
      if (agent.exclusive_domains && agent.exclusive_domains.includes(domain)) {
        return agentName;
      }
    }
    return null;
  }
  
  test('lookup finds correct agent for known domains', () => {
    assert.strictEqual(findAgentByDomain('owasp-top-10'), 'security-engineer');
    assert.strictEqual(findAgentByDomain('accessibility'), 'frontend-developer');
    assert.strictEqual(findAgentByDomain('test-coverage'), 'qa-automation');
    assert.strictEqual(findAgentByDomain('chaos-engineering'), 'sre-chaos');
    assert.strictEqual(findAgentByDomain('code-style'), 'code-reviewer');
  });
  
  test('lookup returns null for unknown domains', () => {
    assert.strictEqual(findAgentByDomain('unknown-domain'), null);
    assert.strictEqual(findAgentByDomain('nonexistent'), null);
    assert.strictEqual(findAgentByDomain(''), null);
  });
  
  test('each domain is owned by exactly one agent', () => {
    const domainOwners = {};
    
    for (const [agentName, agent] of Object.entries(matrix.agents)) {
      for (const domain of agent.exclusive_domains || []) {
        if (domainOwners[domain]) {
          assert.fail(`Domain "${domain}" is claimed by both ${domainOwners[domain]} and ${agentName}`);
        }
        domainOwners[domain] = agentName;
      }
    }
    
    assert.ok(Object.keys(domainOwners).length > 0, 'Should have tracked domains');
    console.log(`  Validated ${Object.keys(domainOwners).length} unique domains`);
  });
});

// Test: Matrix serialization/deserialization
describe('Matrix Serialization', () => {
  test('fixture file exists and is readable', () => {
    assert.ok(fs.existsSync(FIXTURE_PATH), 'Fixture file should exist');
    
    const stats = fs.statSync(FIXTURE_PATH);
    assert.ok(stats.size > 0, 'Fixture file should not be empty');
    assert.ok(stats.size > 1000, 'Fixture file should be substantial (>1KB)');
  });
  
  test('matrix has version metadata', () => {
    const matrix = loadFixture();
    assert.ok(matrix.matrix_version, 'Matrix should have version metadata');
    assert.strictEqual(matrix.matrix_version, '1.0.0');
  });
  
  test('matrix validates required requirements', () => {
    const matrix = loadFixture();
    assert.ok(matrix.requirements_validated, 'Matrix should have requirements_validated');
    assert.ok(matrix.requirements_validated.includes('AUTH-01'),
      'Matrix should reference AUTH-01 requirement');
    assert.ok(matrix.requirements_validated.includes('AUTH-05'),
      'Matrix should reference AUTH-05 requirement');
  });
  
  test('fixture has overlap test scenarios', () => {
    const matrix = loadFixture();
    assert.ok(matrix.overlap_tests, 'Matrix should have overlap test scenarios');
    assert.ok(matrix.overlap_tests.valid_no_overlap,
      'Matrix should have valid no-overlap test');
  });
  
  test('fixture has domain validation rules', () => {
    const matrix = loadFixture();
    assert.ok(matrix.domain_rules, 'Matrix should have domain validation rules');
    assert.strictEqual(matrix.domain_rules.format, 'kebab-case',
      'Matrix should specify kebab-case format');
  });
  
  test('fixture has authority lookup examples', () => {
    const matrix = loadFixture();
    assert.ok(matrix.authority_lookups, 'Matrix should have authority lookup examples');
    assert.ok(Array.isArray(matrix.authority_lookups),
      'authority_lookups should be an array');
  });
});

// Test: Edge cases and error handling
describe('Edge Cases and Error Handling', () => {
  test('handles missing fixture gracefully', () => {
    const badPath = path.join(__dirname, 'mocks', 'nonexistent.json');
    
    assert.throws(() => {
      fs.readFileSync(badPath, 'utf8');
    }, /ENOENT/);
  });
  
  test('validates agent domain count', () => {
    const matrix = loadFixture();
    
    for (const [agentName, agent] of Object.entries(matrix.agents)) {
      assert.ok(agent.exclusive_domains.length >= 3,
        `Agent ${agentName} should have at least 3 domains`);
      assert.ok(agent.exclusive_domains.length <= 10,
        `Agent ${agentName} should have at most 10 domains`);
    }
  });
  
  test('no duplicate domains within same agent', () => {
    const matrix = loadFixture();
    
    for (const [agentName, agent] of Object.entries(matrix.agents)) {
      const domains = agent.exclusive_domains;
      const uniqueDomains = [...new Set(domains)];
      assert.deepStrictEqual(domains, uniqueDomains,
        `Agent ${agentName} should not have duplicate domains`);
    }
  });
  
  test('validates domain rules', () => {
    const matrix = loadFixture();
    assert.ok(matrix.domain_rules, 'Should have domain rules');
    assert.ok(matrix.domain_rules.min_length >= 3,
      'Min length should be at least 3');
    assert.ok(matrix.domain_rules.max_length <= 100,
      'Max length should be reasonable');
    assert.ok(matrix.domain_rules.reserved_domains.length > 0,
      'Should have reserved domains');
  });
});

// Export functions for use in other tests
module.exports = {
  loadFixture
};
