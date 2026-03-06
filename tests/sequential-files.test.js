'use strict';

/**
 * Sequential Files Convention Tests (v6.0)
 * Validates the sequential_files field format and dispatch ordering behavior.
 * Phase 2 — Wave Safety (Plan 02-02)
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

// --- Core dispatch logic ---

/**
 * Determines dispatch order for plans in the same wave based on sequential_files overlap.
 *
 * @param {Array<{ planId: string, wave: number, sequentialFiles: string[] }>} plans
 * @returns {{ parallel: boolean, sequentialOrder: string[] | null }}
 */
function resolveSequentialOrder(plans) {
  // Filter to plans that actually declare sequential_files with content
  const plansWithFiles = plans.filter(
    p => Array.isArray(p.sequentialFiles) && p.sequentialFiles.length > 0
  );

  // If no plans declare sequential_files, skip entirely
  if (plansWithFiles.length === 0) {
    return { parallel: true, sequentialOrder: null };
  }

  // Build conflict map: file -> [planIds]
  const conflictMap = new Map();
  for (const plan of plansWithFiles) {
    for (const file of plan.sequentialFiles) {
      if (!conflictMap.has(file)) {
        conflictMap.set(file, []);
      }
      conflictMap.get(file).push(plan.planId);
    }
  }

  // Check if any file has 2+ plans declaring it
  let hasOverlap = false;
  for (const [, planIds] of conflictMap) {
    if (planIds.length >= 2) {
      hasOverlap = true;
      break;
    }
  }

  if (!hasOverlap) {
    return { parallel: true, sequentialOrder: null };
  }

  // Overlap detected — entire wave falls back to fully sequential dispatch
  // Sort all plans by plan number (extract numeric suffix for ordering)
  const sorted = [...plans].sort((a, b) => {
    const numA = parseInt(a.planId.replace(/\D/g, ''), 10);
    const numB = parseInt(b.planId.replace(/\D/g, ''), 10);
    return numA - numB;
  });

  return { parallel: false, sequentialOrder: sorted.map(p => p.planId) };
}

// --- Validation helper ---

/**
 * Checks if sequential_files overlaps with files_modified (invalid).
 *
 * @param {{ sequentialFiles: string[], filesModified: string[] }} plan
 * @returns {{ valid: boolean, overlapping: string[] }}
 */
function validateNoModifiedOverlap(plan) {
  const modified = new Set(plan.filesModified || []);
  const overlapping = (plan.sequentialFiles || []).filter(f => modified.has(f));
  return { valid: overlapping.length === 0, overlapping };
}

// --- Tests ---

describe('Sequential Files Convention', () => {

  describe('resolveSequentialOrder — dispatch behavior', () => {

    test('1. No sequential_files — all dispatched in parallel', () => {
      const plans = [
        { planId: '02-01', wave: 1, sequentialFiles: undefined },
        { planId: '02-02', wave: 1, sequentialFiles: undefined },
      ];
      const result = resolveSequentialOrder(plans);
      assert.equal(result.parallel, true);
      assert.equal(result.sequentialOrder, null);
    });

    test('2. Empty sequential_files — all dispatched in parallel', () => {
      const plans = [
        { planId: '02-01', wave: 1, sequentialFiles: [] },
        { planId: '02-02', wave: 1, sequentialFiles: [] },
      ];
      const result = resolveSequentialOrder(plans);
      assert.equal(result.parallel, true);
      assert.equal(result.sequentialOrder, null);
    });

    test('3. Single plan with sequential_files — dispatched normally (no conflict)', () => {
      const plans = [
        { planId: '02-01', wave: 1, sequentialFiles: ['CHANGELOG.md'] },
        { planId: '02-02', wave: 1, sequentialFiles: [] },
      ];
      const result = resolveSequentialOrder(plans);
      assert.equal(result.parallel, true);
      assert.equal(result.sequentialOrder, null);
    });

    test('4. Two plans share a sequential file — dispatched sequentially', () => {
      const plans = [
        { planId: '02-01', wave: 1, sequentialFiles: ['CHANGELOG.md'] },
        { planId: '02-02', wave: 1, sequentialFiles: ['CHANGELOG.md'] },
      ];
      const result = resolveSequentialOrder(plans);
      assert.equal(result.parallel, false);
      assert.deepEqual(result.sequentialOrder, ['02-01', '02-02']);
    });

    test('5. Two plans, no overlap — dispatched in parallel', () => {
      const plans = [
        { planId: '02-01', wave: 1, sequentialFiles: ['foo.md'] },
        { planId: '02-02', wave: 1, sequentialFiles: ['bar.md'] },
      ];
      const result = resolveSequentialOrder(plans);
      assert.equal(result.parallel, true);
      assert.equal(result.sequentialOrder, null);
    });

    test('6. Three plans, partial overlap — entire wave falls back to sequential', () => {
      const plans = [
        { planId: '02-01', wave: 1, sequentialFiles: ['shared.yaml'] },
        { planId: '02-02', wave: 1, sequentialFiles: ['shared.yaml'] },
        { planId: '02-03', wave: 1, sequentialFiles: ['unrelated.md'] },
      ];
      const result = resolveSequentialOrder(plans);
      assert.equal(result.parallel, false);
      // All three plans included in sequential order, not just the overlapping ones
      assert.deepEqual(result.sequentialOrder, ['02-01', '02-02', '02-03']);
    });

    test('7. Cross-wave irrelevance — same file in different waves causes no constraint', () => {
      // Plans in different waves are already sequential, so we test each wave independently
      const wave1Plans = [
        { planId: '02-01', wave: 1, sequentialFiles: ['CHANGELOG.md'] },
      ];
      const wave2Plans = [
        { planId: '02-02', wave: 2, sequentialFiles: ['CHANGELOG.md'] },
      ];
      // Each wave evaluated independently
      const result1 = resolveSequentialOrder(wave1Plans);
      const result2 = resolveSequentialOrder(wave2Plans);
      assert.equal(result1.parallel, true, 'Wave 1 should be parallel (single plan)');
      assert.equal(result2.parallel, true, 'Wave 2 should be parallel (single plan)');
    });

    test('sequential order respects plan number sorting', () => {
      const plans = [
        { planId: '02-03', wave: 1, sequentialFiles: ['shared.md'] },
        { planId: '02-01', wave: 1, sequentialFiles: ['shared.md'] },
        { planId: '02-02', wave: 1, sequentialFiles: [] },
      ];
      const result = resolveSequentialOrder(plans);
      assert.equal(result.parallel, false);
      assert.deepEqual(result.sequentialOrder, ['02-01', '02-02', '02-03']);
    });
  });

  describe('validateNoModifiedOverlap — field validation', () => {

    test('8. sequential_files must not overlap with files_modified', () => {
      const plan = {
        sequentialFiles: ['CHANGELOG.md', 'settings.json'],
        filesModified: ['CHANGELOG.md', 'src/app.js'],
      };
      const result = validateNoModifiedOverlap(plan);
      assert.equal(result.valid, false);
      assert.deepEqual(result.overlapping, ['CHANGELOG.md']);
    });

    test('no overlap between sequential_files and files_modified is valid', () => {
      const plan = {
        sequentialFiles: ['CHANGELOG.md'],
        filesModified: ['src/app.js'],
      };
      const result = validateNoModifiedOverlap(plan);
      assert.equal(result.valid, true);
      assert.deepEqual(result.overlapping, []);
    });

    test('empty sequential_files is valid', () => {
      const plan = {
        sequentialFiles: [],
        filesModified: ['src/app.js'],
      };
      const result = validateNoModifiedOverlap(plan);
      assert.equal(result.valid, true);
      assert.deepEqual(result.overlapping, []);
    });

    test('undefined sequential_files is valid', () => {
      const plan = {
        sequentialFiles: undefined,
        filesModified: ['src/app.js'],
      };
      const result = validateNoModifiedOverlap(plan);
      assert.equal(result.valid, true);
      assert.deepEqual(result.overlapping, []);
    });
  });
});
