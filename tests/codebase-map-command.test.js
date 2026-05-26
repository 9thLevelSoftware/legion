'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

test('map command declares supported modes and required artifacts', () => {
  const command = read('commands/map.md');

  assert.match(command, /^name:\s+legion:map$/m);
  for (const flag of ['--check', '--refresh', '--scope <path>', '--query <text>']) {
    assert.ok(command.includes(flag), `map command should document ${flag}`);
  }
  for (const artifact of [
    '.planning/CODEBASE.md',
    '.planning/codebase/index.jsonl',
    '.planning/codebase/symbols.json',
    '.planning/codebase/search.md',
    '.planning/config/directory-mappings.yaml',
  ]) {
    assert.ok(command.includes(artifact), `map command should require ${artifact}`);
  }
  assert.ok(
    command.includes('In `--query`: continue to Query Mode'),
    'query mode should bypass the no-source early exit'
  );
});

test('codebase mapper specifies map metadata, index schemas, and search protocol', () => {
  const skill = read('skills/codebase-mapper/SKILL.md');

  for (const marker of [
    'MAP_SCHEMA_VERSION',
    'map_schema_version',
    'generated_at',
    'analyzed_commit',
    'source_file_count',
    'source_fingerprint',
    '## Section 17: Map Dataset Artifacts (MAP-03)',
    '## Section 18: Semantic Search Protocol (MAP-04)',
    'index.jsonl',
    'symbols.json',
    'No embeddings or external services',
  ]) {
    assert.ok(skill.includes(marker), `codebase-mapper should include ${marker}`);
  }
});

test('consumer commands point stale or ad-hoc analysis users to legion:map', () => {
  const plan = read('commands/plan.md');
  const status = read('commands/status.md');
  const quick = read('commands/quick.md');
  const build = read('commands/build.md');
  const reviewLoop = read('skills/review-loop/SKILL.md');
  const waveExecutor = read('skills/wave-executor/SKILL.md');

  assert.ok(plan.includes('/legion:map --refresh'), 'plan should suggest map refresh');
  assert.ok(status.includes('/legion:map --refresh'), 'status should suggest map refresh');
  assert.ok(
    status.includes('Else if any other map artifact exists'),
    'status should classify incomplete map artifact sets as partial'
  );
  assert.ok(quick.includes('/legion:map'), 'quick should route analysis to map');
  assert.ok(build.includes('CODEBASE MAP CONTEXT'), 'build should name map context');
  assert.ok(reviewLoop.includes('Retrieved Map Chunks'), 'review-loop should include retrieved map chunks');
  assert.ok(
    reviewLoop.includes('Always read the original source files'),
    'review-loop should require source verification for retrieved map summaries'
  );
  assert.ok(waveExecutor.includes('Retrieved Map Chunks'), 'wave-executor should include retrieved map chunks');
  assert.ok(
    waveExecutor.includes('Always read the original source files'),
    'wave-executor should require source verification for retrieved map summaries'
  );
});

test('explore and start are decoupled through saved design documents', () => {
  const explore = read('commands/explore.md');
  const start = read('commands/start.md');
  const polymath = read('skills/polymath-engine/SKILL.md');

  assert.ok(explore.includes('.planning/explorations/YYYY-MM-DD-<slug>-design.md'));
  assert.ok(explore.includes('Do not automatically run `/legion:start`'));
  assert.ok(start.includes('/legion:start <design-doc-path>'));
  assert.ok(start.includes('.planning/exploration-*.md'));
  assert.ok(
    start.includes('If no new or legacy design docs exist: do not ask the exploration-design choice'),
    'start should not offer the latest-design prompt when no design docs exist'
  );
  assert.ok(start.includes('Run `/legion:map` now'));
  assert.ok(polymath.includes('no longer exposes user-facing modes'));
  assert.doesNotMatch(explore, /MODE SELECTION|Crystallize mode|Onboard mode|Compare mode|Debate mode/);
});

test('intent router maps codebase analysis separately from design exploration', () => {
  const intentRouter = read('skills/intent-router/SKILL.md');

  assert.ok(intentRouter.includes('| Map/codebase analysis |'));
  assert.ok(intentRouter.includes('`/legion:map`'));
  assert.ok(intentRouter.includes('| Explore/design research |'));
  assert.ok(intentRouter.includes('`/legion:explore`'));
});
