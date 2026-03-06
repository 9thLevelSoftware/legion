/**
 * Control Mode Schema Validation Tests
 * Validates control mode profiles, settings schema, and cross-references
 */

const { describe, test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE_PATH = path.join(__dirname, 'mocks', 'control-modes.json');
const SCHEMA_PATH = path.join(ROOT, 'docs', 'settings.schema.json');
const SETTINGS_PATH = path.join(ROOT, 'settings.json');

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// 1. Schema Validation (4 tests)
describe('Schema Validation', () => {
  let schema;

  before(() => {
    schema = loadJSON(SCHEMA_PATH);
  });

  test('schema has control_mode property', () => {
    assert.ok(schema.properties.control_mode,
      'settings.schema.json should define control_mode property');
  });

  test('control_mode enum contains exactly the 4 modes', () => {
    const expected = ['autonomous', 'guarded', 'advisory', 'surgical'];
    assert.deepStrictEqual(schema.properties.control_mode.enum, expected);
  });

  test('control_mode enum has exactly 4 values', () => {
    assert.strictEqual(schema.properties.control_mode.enum.length, 4);
  });

  test('control_mode default is guarded', () => {
    assert.strictEqual(schema.properties.control_mode.default, 'guarded');
  });
});

// 2. Settings File (2 tests)
describe('Settings File', () => {
  let settings;

  before(() => {
    settings = loadJSON(SETTINGS_PATH);
  });

  test('settings.json has control_mode property', () => {
    assert.ok('control_mode' in settings,
      'settings.json should have control_mode');
  });

  test('settings.json control_mode is guarded', () => {
    assert.strictEqual(settings.control_mode, 'guarded');
  });
});

// 3. Profile Structure (6 tests)
describe('Profile Structure', () => {
  let fixture;
  const FLAG_NAMES = [
    'authority_enforcement',
    'domain_filtering',
    'human_approval_required',
    'file_scope_restriction',
    'read_only'
  ];

  before(() => {
    fixture = loadJSON(FIXTURE_PATH);
  });

  test('fixture loads and parses without error', () => {
    assert.ok(fixture, 'Fixture should load');
    assert.ok(fixture.profiles, 'Fixture should have profiles');
  });

  test('exactly 4 profiles exist', () => {
    const profileNames = Object.keys(fixture.profiles);
    assert.strictEqual(profileNames.length, 4);
    assert.deepStrictEqual(profileNames.sort(),
      ['advisory', 'autonomous', 'guarded', 'surgical']);
  });

  test('each profile has exactly 5 boolean flags', () => {
    for (const [name, profile] of Object.entries(fixture.profiles)) {
      for (const flag of FLAG_NAMES) {
        assert.ok(flag in profile,
          `Profile ${name} should have flag ${flag}`);
      }
    }
  });

  test('all flag values are booleans', () => {
    for (const [name, profile] of Object.entries(fixture.profiles)) {
      for (const flag of FLAG_NAMES) {
        assert.strictEqual(typeof profile[flag], 'boolean',
          `Profile ${name}.${flag} should be boolean, got ${typeof profile[flag]}`);
      }
    }
  });

  test('autonomous profile has all flags false', () => {
    const auto = fixture.profiles.autonomous;
    for (const flag of FLAG_NAMES) {
      assert.strictEqual(auto[flag], false,
        `autonomous.${flag} should be false`);
    }
  });

  test('guarded profile has correct flag values', () => {
    const g = fixture.profiles.guarded;
    assert.strictEqual(g.authority_enforcement, true);
    assert.strictEqual(g.domain_filtering, true);
    assert.strictEqual(g.human_approval_required, true);
    assert.strictEqual(g.file_scope_restriction, false);
    assert.strictEqual(g.read_only, false);
  });
});

// 4. Profile Flag Values (2 tests)
describe('Profile Flag Values', () => {
  let fixture;

  before(() => {
    fixture = loadJSON(FIXTURE_PATH);
  });

  test('advisory profile has only read_only true', () => {
    const a = fixture.profiles.advisory;
    assert.strictEqual(a.authority_enforcement, false);
    assert.strictEqual(a.domain_filtering, false);
    assert.strictEqual(a.human_approval_required, false);
    assert.strictEqual(a.file_scope_restriction, false);
    assert.strictEqual(a.read_only, true);
  });

  test('surgical profile has correct flag values', () => {
    const s = fixture.profiles.surgical;
    assert.strictEqual(s.authority_enforcement, true);
    assert.strictEqual(s.domain_filtering, true);
    assert.strictEqual(s.human_approval_required, true);
    assert.strictEqual(s.file_scope_restriction, true);
    assert.strictEqual(s.read_only, false);
  });
});

// 5. Settings Resolution (1 test)
describe('Settings Resolution', () => {
  test('workflow-common-core references control_mode', () => {
    const skillPath = path.join(ROOT, 'skills', 'workflow-common-core', 'SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf8');
    assert.ok(content.includes('control_mode'),
      'workflow-common-core SKILL.md should reference control_mode');
  });
});

// 6. Cross-Reference Validation (3 tests)
describe('Cross-Reference Validation', () => {
  test('authority-enforcer contains Mode Profile Loading section', () => {
    const skillPath = path.join(ROOT, 'skills', 'authority-enforcer', 'SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf8');
    assert.ok(content.includes('Mode Profile Loading'),
      'authority-enforcer should have Mode Profile Loading section');
  });

  test('authority-enforcer references all 5 flag names', () => {
    const skillPath = path.join(ROOT, 'skills', 'authority-enforcer', 'SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf8');
    const flags = [
      'authority_enforcement',
      'domain_filtering',
      'human_approval_required',
      'file_scope_restriction',
      'read_only'
    ];
    for (const flag of flags) {
      assert.ok(content.includes(flag),
        `authority-enforcer should reference flag ${flag}`);
    }
  });

  test('wave-executor references mode_profile', () => {
    const skillPath = path.join(ROOT, 'skills', 'wave-executor', 'SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf8');
    assert.ok(content.includes('mode_profile'),
      'wave-executor should reference mode_profile');
  });
});
