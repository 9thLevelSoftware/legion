'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const { recommendAgents, parseAgentMetadata, metadataScore, archetypeBoost, detectTaskType } = require(path.join(ROOT, 'scripts', 'recommendation-engine.js'));

const cases = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'recommendation', 'cases.json'), 'utf8')
);

test('semantic-first recommendation fixtures', async (t) => {
  for (const fixture of cases) {
    await t.test(fixture.name, () => {
      const result = recommendAgents({ prompt: fixture.prompt, topN: 4 });
      const ids = result.recommendations.map((r) => r.id);

      assert.equal(result.confidence, fixture.expectedConfidence);
      assert.equal(ids[0], fixture.expectedTop);

      for (const mustInclude of fixture.mustInclude) {
        assert.ok(ids.includes(mustInclude), `${fixture.name} should include ${mustInclude}`);
      }

      if (fixture.expectedConfidence === 'low') {
        assert.ok(result.lowConfidencePrompt, 'low-confidence recommendation should include fallback guidance');
      }
    });
  }
});

test('metadata score is present in recommendation output', () => {
  const result = recommendAgents({ prompt: 'Build a React TypeScript frontend', topN: 4 });
  for (const rec of result.recommendations) {
    assert.equal(typeof rec.metadataScore, 'number', `${rec.id} should have numeric metadataScore`);
  }
});

test('technology-specific prompts produce higher confidence than generic prompts', () => {
  const specific = recommendAgents({ prompt: 'Build a Laravel PHP application with Livewire components', topN: 4 });
  const generic = recommendAgents({ prompt: 'Build an application', topN: 4 });
  const specificTop = specific.recommendations[0];
  const genericTop = generic.recommendations[0];
  assert.ok(
    specificTop.totalScore > genericTop.totalScore,
    'technology-specific prompt should produce higher total score than generic prompt'
  );
});

test('metadata scoring does not override semantic relevance', () => {
  const result = recommendAgents({ prompt: 'Build a scalable backend API and reduce latency under load', topN: 4 });
  assert.equal(result.recommendations[0].id, 'engineering-backend-architect');
  assert.ok(result.recommendations[0].semanticScore > 0, 'top recommendation should have semantic score > 0');
});

test('parseAgentMetadata returns metadata for known agents', () => {
  const metadata = parseAgentMetadata();
  assert.ok(metadata['engineering-backend-architect'], 'should have backend architect metadata');
  assert.ok(metadata['engineering-backend-architect'].languages.includes('javascript'));
  assert.ok(metadata['engineering-backend-architect'].frameworks.includes('express'));
});

test('metadataScore scores exact matches correctly', () => {
  const agent = {
    metadata: {
      languages: ['python', 'javascript'],
      frameworks: ['django', 'fastapi'],
      artifact_types: ['api-designs'],
      review_strengths: ['security'],
    },
  };
  const score = metadataScore(agent, ['python', 'django'], '');
  assert.equal(score, 6, 'exact language + framework match should score 6');
});

test('archetypeBoost is present in recommendation output', () => {
  const result = recommendAgents({ prompt: 'Build a React TypeScript frontend', topN: 4 });
  for (const rec of result.recommendations) {
    assert.equal(typeof rec.archetypeBoost, 'number', `${rec.id} should have numeric archetypeBoost`);
  }
});

test('archetype_boost_integration: archetypeScores parameter flows through to scoring', () => {
  const result = recommendAgents({
    prompt: 'Build a scalable backend API endpoint',
    topN: 4,
    archetypeScores: {
      'api-development': {
        agents: ['engineering-backend-architect'],
        successRate: 0.9,
        totalOutcomes: 10,
        avgImportance: 3.5,
        topAgent: 'engineering-backend-architect',
      },
    },
  });
  const topRec = result.recommendations.find((r) => r.id === 'engineering-backend-architect');
  assert.ok(topRec, 'backend architect should be recommended');
  assert.ok(topRec.archetypeBoost > 0, 'archetype boost should be positive for agent with history');
});

test('archetype_gating: archetype boost is zero when baseline is zero', () => {
  const result = recommendAgents({
    prompt: 'Need help improving our thing',
    topN: 4,
    archetypeScores: {
      'api-development': {
        agents: ['engineering-backend-architect'],
        successRate: 1.0,
        totalOutcomes: 20,
        avgImportance: 5.0,
        topAgent: 'engineering-backend-architect',
      },
    },
  });
  for (const rec of result.recommendations) {
    if (rec.semanticScore === 0 && rec.heuristicScore === 0) {
      assert.equal(rec.archetypeBoost, 0, `${rec.id} with zero baseline should have zero archetype boost`);
    }
  }
});

test('archetype_top_agent_bonus: top agent gets +1.0 bonus', () => {
  const boostTop = archetypeBoost('agent-a', 'api-development', {
    'api-development': {
      agents: ['agent-a', 'agent-b'],
      successRate: 0.8,
      totalOutcomes: 10,
      topAgent: 'agent-a',
    },
  });
  const boostOther = archetypeBoost('agent-b', 'api-development', {
    'api-development': {
      agents: ['agent-a', 'agent-b'],
      successRate: 0.8,
      totalOutcomes: 10,
      topAgent: 'agent-a',
    },
  });
  assert.ok(boostTop > boostOther, 'top agent should have higher boost than non-top agent');
  assert.equal(boostTop - boostOther, 1.0, 'difference should be exactly 1.0 (top agent bonus)');
});

test('archetype_volume_modifier: fewer outcomes produce proportionally lower boost', () => {
  const boostHigh = archetypeBoost('agent-a', 'web-development', {
    'web-development': {
      agents: ['agent-a'],
      successRate: 0.8,
      totalOutcomes: 10,
      topAgent: 'agent-a',
    },
  });
  const boostLow = archetypeBoost('agent-a', 'web-development', {
    'web-development': {
      agents: ['agent-a'],
      successRate: 0.8,
      totalOutcomes: 2,
      topAgent: 'agent-a',
    },
  });
  assert.ok(boostHigh > boostLow, 'higher outcome count should produce higher boost');
});

test('archetype_clamping: boost never exceeds 5.0', () => {
  const boost = archetypeBoost('agent-a', 'web-development', {
    'web-development': {
      agents: ['agent-a'],
      successRate: 1.0,
      totalOutcomes: 100,
      topAgent: 'agent-a',
    },
  });
  assert.ok(boost <= 5.0, `archetype boost ${boost} should not exceed 5.0`);
});

test('no_archetype_data: engine works identically when archetypeScores is not provided', () => {
  const withoutArchetype = recommendAgents({ prompt: 'Build a React TypeScript frontend', topN: 4 });
  const withEmptyArchetype = recommendAgents({ prompt: 'Build a React TypeScript frontend', topN: 4, archetypeScores: {} });
  assert.deepEqual(
    withoutArchetype.recommendations.map((r) => r.id),
    withEmptyArchetype.recommendations.map((r) => r.id),
    'results should be identical with no archetype data'
  );
});

test('detectTaskType_mapping: maps concepts to correct task types', () => {
  assert.equal(detectTaskType(['react', 'frontend'], ''), 'web-development');
  assert.equal(detectTaskType(['api', 'endpoint'], ''), 'api-development');
  assert.equal(detectTaskType(['ml', 'training'], ''), 'ai-ml');
  assert.equal(detectTaskType(['visionos', 'spatial'], ''), 'spatial-computing');
  assert.equal(detectTaskType(['security', 'owasp'], ''), 'security-audit');
  assert.equal(detectTaskType(['deploy', 'infrastructure'], ''), 'devops');
  assert.equal(detectTaskType(['campaign', 'social'], ''), 'content-marketing');
  assert.equal(detectTaskType(['design', 'ui'], ''), 'design-ux');
  assert.equal(detectTaskType(['mobile', 'ios'], ''), 'mobile-development');
  assert.equal(detectTaskType(['test', 'qa'], ''), 'quality-testing');
  assert.equal(detectTaskType(['unrelated'], ''), null, 'unknown concepts should return null');
});

test('archetypeBoost returns 0 for agent not in archetype list', () => {
  const boost = archetypeBoost('unknown-agent', 'web-development', {
    'web-development': {
      agents: ['agent-a'],
      successRate: 0.9,
      totalOutcomes: 10,
      topAgent: 'agent-a',
    },
  });
  assert.equal(boost, 0, 'agent not in archetype list should get zero boost');
});

test('archetypeBoost returns 0 for null taskType', () => {
  const boost = archetypeBoost('agent-a', null, {
    'web-development': {
      agents: ['agent-a'],
      successRate: 0.9,
      totalOutcomes: 10,
      topAgent: 'agent-a',
    },
  });
  assert.equal(boost, 0, 'null task type should produce zero boost');
});

test('memory boost is additive and does not remove mandatory testing role', () => {
  const result = recommendAgents({
    prompt: 'Implement a new backend feature and deploy API changes',
    topN: 4,
    memoryScores: {
      'marketing-growth-hacker': 5,
      'marketing-content-creator': 5,
    },
  });

  const hasTesting = result.recommendations.some((r) => r.division === 'testing');
  assert.ok(hasTesting, 'execution recommendations must include at least one testing agent');
});
