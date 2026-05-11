'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

describe('Decision-complete planning harness', () => {
  test('workflow-common-core defines the shared execution harness contract', () => {
    const content = read('skills/workflow-common-core/SKILL.md');

    assert.match(content, /Execution Harness Contract/);
    assert.match(content, /read-before-write -> evidence-before-action -> minimal diff -> verify-before-report/);
    for (const term of [
      'Role',
      'Task',
      'Scope',
      'Allowed tools/actions',
      'Forbidden actions',
      'Stop gates',
      'Verification criteria',
      'Final result format',
    ]) {
      assert.match(content, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    assert.match(content, /BLOCKED/);
  });

  test('phase-decomposer emits markdown-only execution contract sections', () => {
    const content = read('skills/phase-decomposer/SKILL.md');

    assert.match(content, /decision-complete implementation contracts/i);
    assert.match(content, /Smallest independently verifiable plan/);
    assert.match(content, /max_tasks_per_plan` is a cap, not a compression goal/);
    for (const section of ['<execution_contract>', '<stop_gates>', '<recovery>']) {
      assert.match(content, new RegExp(section));
    }
    for (const term of [
      'read-before-write',
      'evidence-before-action',
      'minimal diff',
      'verify-before-report',
      'BLOCKED',
      'git diff',
    ]) {
      assert.match(content, new RegExp(term));
    }
  });

  test('spec-pipeline resolves design decisions before planning', () => {
    const content = read('skills/spec-pipeline/SKILL.md');

    for (const term of [
      'API/type contracts',
      'file placement',
      'data/control flow',
      'compatibility constraints',
      'failure modes',
      'acceptance checks',
      'Blocking open question halts planning',
      'default chosen by the spec',
    ]) {
      assert.match(content, new RegExp(term, 'i'));
    }
  });

  test('plan-critique requires REWORK for high-impact decision-completeness gaps', () => {
    const content = read('skills/plan-critique/SKILL.md');

    assert.match(content, /Decision Completeness Check/);
    assert.match(content, /choose architecture/);
    assert.match(content, /infer paths, APIs, schemas, types, helpers, or imports/);
    assert.match(content, /implement as appropriate/);
    assert.match(content, /verify manually/);
    assert.match(content, /Any High impact decision-completeness gap triggers REWORK/);
    assert.match(content, /AUTO_REFINE behavior/);
  });

  test('wave-executor enforces BLOCKED instead of guessing', () => {
    const content = read('skills/wave-executor/SKILL.md');

    assert.match(content, /Execution harness contract/);
    assert.match(content, /read-before-write -> evidence-before-action -> minimal diff -> verify-before-report/);
    assert.match(content, /You may only create, edit, or delete files listed in this plan's files_modified field/);
    assert.match(content, /emit BLOCKED instead of choosing the approach yourself/);
    assert.match(content, /Status\*\*: Complete \| Partial \| Complete with Warnings \| Failed \| BLOCKED/);
  });

  test('Kilo adapter documents Kimi K2.6 Turbo as strict execution guidance only', () => {
    const content = read('adapters/kilo-cli.md');

    assert.match(content, /Kimi K2\.6 Turbo Guidance/);
    assert.match(content, /high-speed execution model/);
    assert.match(content, /planner\/executor separation/);
    assert.match(content, /scope to `files_modified` and `files_forbidden`/);
    assert.match(content, /This is adapter guidance only/);
  });

  test('focused personas reference the mandatory persona contract', () => {
    const contract = read('skills/agent-registry/MANDATORY-PERSONA-CONTRACT.md');
    assert.match(contract, /Mandatory Persona Contract/);
    assert.match(contract, /Reject underspecified tasks/);

    for (const relPath of [
      'agents/project-manager-senior.md',
      'agents/agents-orchestrator.md',
      'agents/engineering-senior-developer.md',
      'agents/testing-qa-verification-specialist.md',
      'agents/product-sprint-prioritizer.md',
      'agents/product-technical-writer.md',
    ]) {
      const content = read(relPath);
      assert.match(content, /Mandatory Persona Contract/, `${relPath} missing mandatory section`);
      assert.match(content, /read-before-write -> evidence-before-action -> minimal diff -> verify-before-report/, `${relPath} missing harness`);
    }
  });
});
