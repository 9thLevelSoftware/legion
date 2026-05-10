'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

describe('No agent self-deferrals contract', () => {
  test('phase-decomposer requires planned work to complete, block, or escalate', () => {
    const content = read('skills/phase-decomposer/SKILL.md');

    assert.match(content, /No planned-work deferrals/);
    assert.match(content, /Prohibited Deferral Language/);
    assert.match(content, /completed, blocked with evidence, or escalated/);
    assert.match(content, /blocker `<escalation>` block rather than self-deferring/);
  });

  test('wave-executor injects no-deferral rules into both execution prompts', () => {
    const content = read('skills/wave-executor/SKILL.md');
    const promptRuleCount = (content.match(/No Agent Deferrals/g) || []).length;

    assert.match(content, /No agent self-deferrals/);
    assert.equal(promptRuleCount, 2, 'personality and autonomous prompts both need the rule');
    assert.match(content, /Do not mark planned\s+work as deferred, parked, future-phase work, or complete/i);
    assert.match(content, /emit a blocker <escalation> block and mark the plan\s+Failed or Partial/i);
  });

  test('wave-executor makes deferred a user-only escalation resolution', () => {
    const content = read('skills/wave-executor/SKILL.md');

    assert.match(content, /`deferred` may appear only after the user explicitly selects Defer/);
    assert.match(content, /Agent-authored output never sets an escalation to `deferred`/);
    assert.match(content, /never "Complete" or\s+"Complete with Warnings"/);
    assert.match(content, /stop dependent waves because planned work remains incomplete/i);
  });

  test('authority-enforcer uses domain ownership wording instead of defer-to wording', () => {
    const content = read('skills/authority-enforcer/SKILL.md');

    assert.match(content, /Domain Ownership Required/);
    assert.match(content, /respect domain owner/);
    assert.doesNotMatch(content, /defer to domain owner/i);
    assert.doesNotMatch(content, /Deference Required/);
    assert.doesNotMatch(content, /defer to your judgment/i);
  });

  test('cli-dispatch cannot silently skip or defer failed dispatch work', () => {
    const content = read('skills/cli-dispatch/SKILL.md');

    assert.match(content, /explicitly skip this task and record the plan as Partial or Failed/);
    assert.match(content, /must never silently skip, defer, or mark the task complete/);
  });

  test('escalation protocol records deferred only after user choice', () => {
    const content = read('.planning/config/escalation-protocol.yaml');

    assert.match(content, /agents never self-defer planned work/);
    assert.match(content, /all agent-authored escalations start here/);
    assert.match(content, /Agents may not write a deferred\s+resolution directly/);
    assert.match(content, /User explicitly deferred/);
  });
});
