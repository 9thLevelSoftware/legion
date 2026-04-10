'use strict';

/*
 * Config Agent Reference Validation Tests
 *
 * Validates that all agent IDs referenced in .planning/config/ YAML files
 * exist as actual agent files in agents/. Catches phantom references left
 * behind after agent consolidations or deletions.
 *
 * This test exists because v7.1.0 consolidated 53 agents down to 48 but
 * did not sweep all config files — leaving phantom references in
 * authority-matrix.yaml, intent-teams.yaml, and roster-gap-config.yaml
 * that caused silent failures at runtime.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AGENTS_DIR = path.join(ROOT, 'agents');
const CONFIG_DIR = path.join(ROOT, '.planning', 'config');

// Build ground-truth set of valid agent IDs from actual files
function getValidAgentIds() {
  return fs
    .readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .sort();
}

// Extract top-level keys from a YAML "agents:" mapping block
// Simple line-based parser — no YAML library needed for this structure
function extractAuthorityMatrixAgentIds(content) {
  const ids = [];
  const agentsMatch = content.match(/^agents:\s*$/m);
  if (!agentsMatch) return ids;

  const afterAgents = content.slice(agentsMatch.index + agentsMatch[0].length);
  const lines = afterAgents.split(/\r?\n/);

  for (const line of lines) {
    // Top-level keys under agents: are indented exactly 2 spaces
    const keyMatch = line.match(/^  ([a-z][a-z0-9-]+):\s*$/);
    if (keyMatch) {
      ids.push(keyMatch[1]);
    }
    // Stop at next top-level key (no indentation)
    if (/^\S/.test(line) && line.trim().length > 0) break;
  }
  return ids;
}

// Extract agent IDs from intent-teams.yaml lists (primary, secondary, exclude_agents)
function extractIntentTeamAgentIds(content) {
  const ids = new Set();
  // Match lines like "        - agent-id-here" under agents or exclude_agents sections
  const agentRefPattern = /^\s+-\s+([a-z][a-z0-9-]+(?:-[a-z0-9]+)*)\s*$/gm;
  let match;
  while ((match = agentRefPattern.exec(content)) !== null) {
    const candidate = match[1];
    // Filter out non-agent values (file patterns, task types, domains)
    if (
      candidate.includes('/') ||
      candidate.includes('.') ||
      candidate.includes('*') ||
      // Known non-agent list items in intent-teams.yaml
      ['security', 'owasp', 'stride', 'vulnerability-assessment',
       'authentication', 'authorization'].includes(candidate)
    ) continue;

    // Agent IDs follow the pattern: division-name (e.g., engineering-backend-architect)
    if (/^[a-z]+-[a-z]/.test(candidate)) {
      ids.add(candidate);
    }
  }
  return [...ids].sort();
}

// Extract agent IDs from roster-gap-config.yaml coverage lists
function extractRosterGapAgentIds(content) {
  const ids = new Set();
  // Same pattern — agent IDs in YAML lists
  const agentRefPattern = /^\s+-\s+([a-z]+-[a-z][a-z0-9-]+)\s*$/gm;
  let match;
  while ((match = agentRefPattern.exec(content)) !== null) {
    const candidate = match[1];
    // Filter out non-agent entries
    if (candidate.includes('/') || candidate.includes('.')) continue;
    ids.add(candidate);
  }
  return [...ids].sort();
}

const validIds = new Set(getValidAgentIds());

test.describe('Config agent references: authority-matrix.yaml', () => {
  const matrixPath = path.join(CONFIG_DIR, 'authority-matrix.yaml');
  if (!fs.existsSync(matrixPath)) {
    test('authority-matrix.yaml not found (skipped)', () => {
      assert.ok(true, 'File does not exist — no references to validate');
    });
    return;
  }

  const content = fs.readFileSync(matrixPath, 'utf8');
  const matrixAgentIds = extractAuthorityMatrixAgentIds(content);

  test('authority-matrix.yaml contains agent entries', () => {
    assert.ok(
      matrixAgentIds.length >= 40,
      `Expected at least 40 agents in authority matrix, found ${matrixAgentIds.length}`
    );
  });

  for (const id of matrixAgentIds) {
    test(`agent file exists for authority-matrix entry "${id}"`, () => {
      assert.ok(
        validIds.has(id),
        `authority-matrix.yaml references agent "${id}" but agents/${id}.md does not exist`
      );
    });
  }
});

test.describe('Config agent references: intent-teams.yaml', () => {
  const teamsPath = path.join(CONFIG_DIR, 'intent-teams.yaml');
  if (!fs.existsSync(teamsPath)) {
    test('intent-teams.yaml not found (skipped)', () => {
      assert.ok(true, 'File does not exist — no references to validate');
    });
    return;
  }

  const content = fs.readFileSync(teamsPath, 'utf8');
  const teamAgentIds = extractIntentTeamAgentIds(content);

  test('intent-teams.yaml contains agent references', () => {
    assert.ok(
      teamAgentIds.length >= 3,
      `Expected at least 3 agent references in intent teams, found ${teamAgentIds.length}`
    );
  });

  for (const id of teamAgentIds) {
    test(`agent file exists for intent-teams reference "${id}"`, () => {
      assert.ok(
        validIds.has(id),
        `intent-teams.yaml references agent "${id}" but agents/${id}.md does not exist`
      );
    });
  }
});

test.describe('Config agent references: roster-gap-config.yaml', () => {
  const rosterPath = path.join(CONFIG_DIR, 'roster-gap-config.yaml');
  if (!fs.existsSync(rosterPath)) {
    test('roster-gap-config.yaml not found (skipped)', () => {
      assert.ok(true, 'File does not exist — no references to validate');
    });
    return;
  }

  const content = fs.readFileSync(rosterPath, 'utf8');
  const rosterAgentIds = extractRosterGapAgentIds(content);

  test('roster-gap-config.yaml contains agent references', () => {
    assert.ok(
      rosterAgentIds.length >= 3,
      `Expected at least 3 agent references in roster gap config, found ${rosterAgentIds.length}`
    );
  });

  for (const id of rosterAgentIds) {
    test(`agent file exists for roster-gap-config reference "${id}"`, () => {
      assert.ok(
        validIds.has(id),
        `roster-gap-config.yaml references agent "${id}" but agents/${id}.md does not exist`
      );
    });
  }
});

test.describe('Config agent references: agent count consistency', () => {
  const statePath = path.join(ROOT, '.planning', 'STATE.md');
  if (!fs.existsSync(statePath)) {
    test('STATE.md not found (skipped)', () => {
      assert.ok(true, 'File does not exist — no count to validate');
    });
    return;
  }

  const actualCount = getValidAgentIds().length;
  const stateContent = fs.readFileSync(statePath, 'utf8');
  const countPattern = /(\d+)\s+agents?\s+across/g;
  let match;
  const statedCounts = [];
  while ((match = countPattern.exec(stateContent)) !== null) {
    statedCounts.push({ count: parseInt(match[1], 10), text: match[0] });
  }

  test('STATE.md contains agent count references', () => {
    assert.ok(
      statedCounts.length > 0,
      'STATE.md should contain at least one "{N} agents across" reference'
    );
  });

  for (const { count, text } of statedCounts) {
    test(`STATE.md agent count "${text}" matches actual (${actualCount})`, () => {
      assert.strictEqual(
        count,
        actualCount,
        `STATE.md says "${text}" but agents/ contains ${actualCount} files`
      );
    });
  }
});
