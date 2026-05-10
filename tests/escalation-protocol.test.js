/**
 * Escalation Protocol Validation Tests
 * Validates escalation format, severity levels, type taxonomy, and control mode behaviors
 */

const { describe, test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PROTOCOL_PATH = path.join(ROOT, '.planning', 'config', 'escalation-protocol.yaml');
const WAVE_EXECUTOR_PATH = path.join(ROOT, 'skills', 'wave-executor', 'SKILL.md');
const AUTHORITY_ENFORCER_PATH = path.join(ROOT, 'skills', 'authority-enforcer', 'SKILL.md');
const REVIEW_LOOP_PATH = path.join(ROOT, 'skills', 'review-loop', 'SKILL.md');
const CLAUDE_MD_PATH = path.join(ROOT, 'CLAUDE.md');

function loadFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// 1. Protocol File Structure (5 tests)
describe('Protocol File Structure', () => {
  let content;

  before(() => {
    content = loadFile(PROTOCOL_PATH);
  });

  test('escalation-protocol.yaml exists and is non-empty', () => {
    assert.ok(content.length > 0, 'File should be non-empty');
  });

  test('defines escalation_format with required_fields', () => {
    assert.ok(content.includes('escalation_format:'), 'Should define escalation_format');
    assert.ok(content.includes('required_fields:'), 'Should define required_fields');
  });

  test('has all 4 required fields', () => {
    const requiredFields = ['severity', 'type', 'decision', 'context'];
    for (const field of requiredFields) {
      assert.ok(content.includes(`- ${field}`),
        `Should list required field: ${field}`);
    }
  });

  test('defines optional fields', () => {
    assert.ok(content.includes('optional_fields:'), 'Should define optional_fields');
    assert.ok(content.includes('alternatives'), 'Should list alternatives');
    assert.ok(content.includes('affected_files'), 'Should list affected_files');
    assert.ok(content.includes('related_domain'), 'Should list related_domain');
  });

  test('defines block_tag as escalation', () => {
    assert.ok(content.includes('block_tag: "escalation"'),
      'Block tag should be "escalation"');
  });
});

// 2. Severity Levels (4 tests)
describe('Severity Levels', () => {
  let content;

  before(() => {
    content = loadFile(PROTOCOL_PATH);
  });

  test('defines severity_levels section', () => {
    assert.ok(content.includes('severity_levels:'), 'Should define severity_levels');
  });

  test('defines all 3 severity levels', () => {
    const levels = ['info:', 'warning:', 'blocker:'];
    for (const level of levels) {
      assert.ok(content.includes(level),
        `Should define severity level: ${level}`);
    }
  });

  test('each severity has routing rules', () => {
    const routingCount = (content.match(/routing:/g) || []).length;
    assert.ok(routingCount >= 3,
      `Should have routing rules for each severity (found ${routingCount})`);
  });

  test('blocker severity halts execution', () => {
    assert.ok(content.includes('Halt current task'),
      'Blocker severity should halt current task');
  });
});

// 3. Escalation Type Taxonomy (3 tests)
describe('Escalation Type Taxonomy', () => {
  let content;
  const EXPECTED_TYPES = [
    'architecture', 'dependency', 'scope', 'schema',
    'api', 'deletion', 'infrastructure', 'quality'
  ];

  before(() => {
    content = loadFile(PROTOCOL_PATH);
  });

  test('defines escalation_types section', () => {
    assert.ok(content.includes('escalation_types:'), 'Should define escalation_types');
  });

  test('defines all 8 escalation types', () => {
    for (const type of EXPECTED_TYPES) {
      assert.ok(content.includes(`${type}:`),
        `Should define escalation type: ${type}`);
    }
  });

  test('each type has description and examples', () => {
    for (const type of EXPECTED_TYPES) {
      const typeIndex = content.indexOf(`  ${type}:`);
      assert.ok(typeIndex >= 0, `Should find type ${type}`);
      const section = content.substring(typeIndex, typeIndex + 300);
      assert.ok(section.includes('description:'),
        `Type ${type} should have description`);
      assert.ok(section.includes('examples:'),
        `Type ${type} should have examples`);
    }
  });
});

// 4. Control Mode Behaviors (5 tests)
describe('Control Mode Behaviors', () => {
  let content;
  const MODES = ['autonomous', 'guarded', 'advisory', 'surgical'];

  before(() => {
    content = loadFile(PROTOCOL_PATH);
  });

  test('defines control_mode_behaviors section', () => {
    assert.ok(content.includes('control_mode_behaviors:'),
      'Should define control_mode_behaviors');
  });

  test('defines all 4 control modes', () => {
    for (const mode of MODES) {
      assert.ok(content.includes(`  ${mode}:`),
        `Should define control mode: ${mode}`);
    }
  });

  test('each mode has description and behavior', () => {
    for (const mode of MODES) {
      const modeIndex = content.indexOf(`  ${mode}:`);
      const section = content.substring(modeIndex, modeIndex + 400);
      assert.ok(section.includes('description:'),
        `Mode ${mode} should have description`);
      assert.ok(section.includes('behavior:'),
        `Mode ${mode} should have behavior list`);
    }
  });

  test('autonomous mode overrides severity to info', () => {
    const autoIndex = content.indexOf('  autonomous:');
    const nextModeIndex = content.indexOf('  guarded:');
    const section = content.substring(autoIndex, nextModeIndex);
    assert.ok(section.includes('override_severity: info'),
      'Autonomous mode should override severity to info');
  });

  test('surgical mode has auto_escalate_file_scope', () => {
    assert.ok(content.includes('auto_escalate_file_scope: true'),
      'Surgical mode should enable auto_escalate_file_scope');
  });
});

// 5. Resolution Tracking (3 tests)
describe('Resolution Tracking', () => {
  let content;

  before(() => {
    content = loadFile(PROTOCOL_PATH);
  });

  test('defines resolution section', () => {
    assert.ok(content.includes('resolution:'), 'Should define resolution');
  });

  test('defines all 4 resolution statuses', () => {
    const statuses = ['pending', 'approved', 'rejected', 'deferred'];
    for (const status of statuses) {
      assert.ok(content.includes(`- ${status}`),
        `Should define resolution status: ${status}`);
    }
  });

  test('deferred resolution is user-selected only', () => {
    assert.match(content, /Defer is valid only as an explicit user-selected resolution/);
    assert.match(content, /agents never self-defer planned work/);
    assert.match(content, /Agents may not write a deferred\s+resolution directly/);
  });

  test('resolution tracking location is SUMMARY.md', () => {
    assert.ok(content.includes('location: "SUMMARY.md"'),
      'Resolution tracking should be in SUMMARY.md');
  });
});

// 6. Cross-Reference Validation (5 tests)
describe('Cross-Reference Validation', () => {
  test('wave-executor references escalation detection', () => {
    const content = loadFile(WAVE_EXECUTOR_PATH);
    assert.ok(content.includes('escalation'),
      'Wave executor should reference escalation');
    assert.ok(content.includes('escalation_block') || content.includes('<escalation>'),
      'Wave executor should reference escalation block format');
  });

  test('authority-enforcer injects escalation format', () => {
    const content = loadFile(AUTHORITY_ENFORCER_PATH);
    const count = (content.match(/escalation/gi) || []).length;
    assert.ok(count >= 8,
      `Authority enforcer should reference escalation at least 8 times (found ${count})`);
  });

  test('review-loop uses structured escalation blocks', () => {
    const content = loadFile(REVIEW_LOOP_PATH);
    assert.ok(content.includes('<escalation>'),
      'Review loop should use structured <escalation> blocks');
  });

  test('CLAUDE.md documents escalation protocol', () => {
    const content = loadFile(CLAUDE_MD_PATH);
    assert.ok(content.includes('Escalation Protocol'),
      'CLAUDE.md should have Escalation Protocol section');
    assert.ok(content.includes('escalation-protocol.yaml'),
      'CLAUDE.md should reference escalation-protocol.yaml');
  });

  test('CLAUDE.md escalation types match protocol types', () => {
    const claudeContent = loadFile(CLAUDE_MD_PATH);
    const types = ['architecture', 'dependency', 'scope', 'schema',
                   'api', 'deletion', 'infrastructure', 'quality'];
    for (const type of types) {
      assert.ok(claudeContent.includes(`\`${type}\``),
        `CLAUDE.md should reference escalation type: ${type}`);
    }
  });
});
