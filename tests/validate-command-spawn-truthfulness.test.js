'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { validateCommandFile, validateCommandsDir } = require('../scripts/validate-command-spawn-truthfulness.js');

const FIXTURES = path.join(__dirname, 'fixtures', 'command-spawn');

describe('validate-command-spawn-truthfulness', () => {
  test('spawn-with-agent-call passes', () => {
    const r = validateCommandFile(path.join(FIXTURES, 'spawn-with-agent-call.md'));
    assert.equal(r.valid, true, JSON.stringify(r));
  });

  test('spawn-without-agent-call fails', () => {
    const r = validateCommandFile(path.join(FIXTURES, 'spawn-without-agent-call.md'));
    assert.equal(r.valid, false);
    assert.match(r.reason, /Agent\(|inline-persona/);
  });

  test('inline-persona-mode passes', () => {
    const r = validateCommandFile(path.join(FIXTURES, 'inline-persona-mode.md'));
    assert.equal(r.valid, true, JSON.stringify(r));
  });

  test('no-spawn-no-inline passes (exempt)', () => {
    const r = validateCommandFile(path.join(FIXTURES, 'no-spawn-no-inline.md'));
    assert.equal(r.valid, true);
    assert.equal(r.exempt, true);
  });

  test('validateCommandsDir aggregates', () => {
    const r = validateCommandsDir(FIXTURES);
    assert.equal(r.totalFiles, 4);
    assert.equal(r.invalidFiles.length, 1);
  });
});
