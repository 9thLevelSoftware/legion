'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { migratePlanText } = require('../scripts/migrate-plans-to-v2.js');

const FIXTURES = path.join(__dirname, 'fixtures', 'migration');

describe('migrate-plans-to-v2', () => {
  test('singular agent becomes agents array', () => {
    const before = fs.readFileSync(path.join(FIXTURES, 'before', 'sample-plan.md'), 'utf8');
    const expected = fs.readFileSync(path.join(FIXTURES, 'after', 'sample-plan.md'), 'utf8');
    const actual = migratePlanText(before);
    // Normalize line endings — migration script outputs LF; fixtures may be CRLF on Windows
    assert.equal(actual.trim().replace(/\r\n/g, '\n'), expected.trim().replace(/\r\n/g, '\n'));
  });

  test('plain integer plan field becomes NN-PP string', () => {
    const before = `---\nphase: 12\nplan: 1\nwave: 1\nagent: x\n---\nbody`;
    const out = migratePlanText(before);
    assert.match(out, /plan:\s*"?12-01"?/);
  });

  test('flat string expected_artifacts becomes structured', () => {
    const before = `---\nphase: 1\nplan: "01-01"\nwave: 1\nagent: x\nexpected_artifacts:\n  - path/to/file.md\n  - another.md\n---\nbody`;
    const out = migratePlanText(before);
    assert.match(out, /- path: path\/to\/file\.md/);
    assert.match(out, /- path: another\.md/);
  });

  test('idempotent: running on already-migrated text yields same text', () => {
    const after = fs.readFileSync(path.join(FIXTURES, 'after', 'sample-plan.md'), 'utf8');
    const actual = migratePlanText(after);
    // Normalize line endings — migration script outputs LF; fixtures may be CRLF on Windows
    assert.equal(actual.trim().replace(/\r\n/g, '\n'), after.trim().replace(/\r\n/g, '\n'));
  });
});
