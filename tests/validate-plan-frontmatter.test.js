'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { validatePlanFile, validatePlanDir } = require('../scripts/validate-plan-frontmatter.js');

const FIXTURES = path.join(__dirname, 'fixtures', 'plan-validation');
const ROOT = path.resolve(__dirname, '..');

describe('validate-plan-frontmatter', () => {
  test('valid-current passes', () => {
    const r = validatePlanFile(path.join(FIXTURES, 'valid-current.md'));
    assert.equal(r.valid, true, JSON.stringify(r.errors));
  });

  test('valid-multi-agent passes', () => {
    const r = validatePlanFile(path.join(FIXTURES, 'valid-multi-agent.md'));
    assert.equal(r.valid, true, JSON.stringify(r.errors));
  });

  test('invalid-singular-agent fails (uses agent: not agents:)', () => {
    const r = validatePlanFile(path.join(FIXTURES, 'invalid-singular-agent.md'));
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.keyword === 'required' || e.keyword === 'additionalProperties'),
      `expected required or additionalProperties error, got: ${JSON.stringify(r.errors)}`);
  });

  test('invalid-flat-artifacts fails (expected_artifacts as strings)', () => {
    const r = validatePlanFile(path.join(FIXTURES, 'invalid-flat-artifacts.md'));
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.keyword === 'type'),
      `expected type error, got: ${JSON.stringify(r.errors)}`);
  });

  test('invalid-extra-field fails (additionalProperties)', () => {
    const r = validatePlanFile(path.join(FIXTURES, 'invalid-extra-field.md'));
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.keyword === 'additionalProperties'),
      `expected additionalProperties error, got: ${JSON.stringify(r.errors)}`);
  });

  test('validatePlanDir aggregates results', () => {
    const r = validatePlanDir(FIXTURES);
    // 5 fixtures: 2 valid, 3 invalid
    assert.equal(r.totalFiles, 5);
    assert.equal(r.invalidFiles.length, 3);
  });

  // Live-state check skipped until Task 9 migration. Real plans currently
  // use legacy schema (agent singular, plan as integer, flat must_haves).
  test('all real .planning/phases/**/PLAN.md validate (enabled post-migration)', () => {
    const phasesDir = path.join(ROOT, '.planning', 'phases');
    if (!fs.existsSync(phasesDir)) return;
    const r = validatePlanDir(phasesDir);
    assert.equal(r.invalidFiles.length, 0, `Invalid plans: ${JSON.stringify(r.invalidFiles)}`);
  });
});
