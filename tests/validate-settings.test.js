'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { validateSettings } = require('../scripts/validate-settings.js');

const FIXTURES = path.join(__dirname, 'fixtures', 'settings-validation');
const ROOT = path.resolve(__dirname, '..');

describe('validate-settings', () => {
  test('actual settings.json is valid against schema', () => {
    const result = validateSettings(path.join(ROOT, 'settings.json'));
    assert.equal(result.valid, true, `settings.json invalid: ${JSON.stringify(result.errors)}`);
  });

  test('valid fixture passes', () => {
    const result = validateSettings(path.join(FIXTURES, 'valid.json'));
    assert.equal(result.valid, true);
  });

  test('invalid-extra-field fails with additionalProperties error', () => {
    const result = validateSettings(path.join(FIXTURES, 'invalid-extra-field.json'));
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => /additional/i.test(e.keyword) || /additional/i.test(e.message || '')));
  });

  test('invalid-missing-required fails with required error', () => {
    const result = validateSettings(path.join(FIXTURES, 'invalid-missing-required.json'));
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.keyword === 'required'));
  });

  test('invalid-wrong-type fails with type error', () => {
    const result = validateSettings(path.join(FIXTURES, 'invalid-wrong-type.json'));
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.keyword === 'type'));
  });
});
