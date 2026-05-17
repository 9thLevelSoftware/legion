'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

const ACTIVE_SURFACES = [
  'AGENTS.md',
  'CLAUDE.md',
  'CONTRIBUTING.md',
  'README.md',
  'commands/plan.md',
  'commands/start.md',
  'commands/milestone.md',
  'skills/phase-decomposer/SKILL.md',
  'skills/questioning-flow/SKILL.md',
  'skills/milestone-tracker/SKILL.md',
  'skills/spec-pipeline/SKILL.md',
  'skills/workflow-common/SKILL.md',
  'skills/workflow-common-core/SKILL.md',
  'docs/settings.schema.json',
  'docs/index.html',
];

const FORBIDDEN_ACTIVE_CAPS = [
  /Size each phase for 2-3 plans/i,
  /2-3 plans\/phase/i,
  /complex phase[^.\n]*3 plans/i,
  /more phases, not more plans per phase/i,
  /proposes? 2-4 milestones/i,
  /Aim for 2-4 milestones with 3-7 phases each/i,
  /3-7 phases per milestone/i,
];

describe('Planning count cap contract', () => {
  test('active workflow surfaces do not cap plans per phase or phases per milestone', () => {
    for (const relPath of ACTIVE_SURFACES) {
      const content = read(relPath);

      for (const pattern of FORBIDDEN_ACTIVE_CAPS) {
        assert.doesNotMatch(
          content,
          pattern,
          `${relPath} must not reintroduce active count-cap language matching ${pattern}`
        );
      }
    }
  });

  test('/legion:plan explicitly allows unlimited phase plans', () => {
    const command = read('commands/plan.md');
    const decomposer = read('skills/phase-decomposer/SKILL.md');

    assert.match(command, /as many wave-structured plans as needed/i);
    assert.match(command, /only as the per-plan task cap/i);
    assert.match(decomposer, /does not limit how many plans a phase may contain/i);
    assert.match(decomposer, /no maximum plan count exists for a phase/i);
    assert.match(decomposer, /ROADMAP\.md plan counts are estimates, not caps/i);
  });

  test('/legion:start roadmap guidance treats plan counts as estimates', () => {
    const command = read('commands/start.md');
    const questioningFlow = read('skills/questioning-flow/SKILL.md');

    assert.match(command, /Estimate plan count from dependency, ownership, verification, and traceability boundaries/i);
    assert.match(questioningFlow, /complex phases may need many plans/i);
    assert.match(questioningFlow, /plan counts are estimates, not caps/i);
  });

  test('/legion:milestone has no fixed phase-count limit', () => {
    const command = read('commands/milestone.md');
    const milestoneTracker = read('skills/milestone-tracker/SKILL.md');

    assert.match(command, /no fixed phase-count limit per milestone/i);
    assert.match(milestoneTracker, /no fixed phase-count limit/i);
    assert.match(milestoneTracker, /Propose the milestone set the roadmap needs/i);
  });

  test('settings schema scopes max_tasks_per_plan to tasks inside one plan', () => {
    const schema = JSON.parse(read('docs/settings.schema.json'));
    const description = schema.properties.planning.properties.max_tasks_per_plan.description;

    assert.match(description, /Per-plan task cap only/i);
    assert.match(description, /Does not limit how many plans a phase may contain/i);
  });
});
