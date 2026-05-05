'use strict';

/**
 * Plan Schema Conformance Tests (v6.0)
 * Validates the three new schema fields: files_forbidden, expected_artifacts, verification_commands
 * Requirements: DSC-01, DSC-02, DSC-03
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const FIXTURES = path.join(__dirname, 'fixtures');
const PHASE1_DIR = path.join(ROOT, '.planning', 'phases', '01-plan-schema-hardening');

// --- YAML frontmatter parser (gray-matter) ---

function parsePlanFrontmatter(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  if (!text.startsWith('---')) {
    throw new Error(`No YAML frontmatter found in ${filePath}`);
  }
  const parsed = matter(text);
  if (Object.keys(parsed.data).length === 0) {
    throw new Error(`No YAML frontmatter found in ${filePath}`);
  }
  return parsed.data;
}

function listPlanFiles(dir) {
  return fs.readdirSync(dir)
    .filter(f => /^.*-PLAN\.md$/.test(f))
    .map(f => path.join(dir, f));
}

// --- Validation functions ---

function validateVerificationCommands(fm) {
  if (!fm.verification_commands) {
    return { valid: false, severity: 'BLOCKER', message: 'Missing mandatory verification_commands field' };
  }
  if (!Array.isArray(fm.verification_commands) || fm.verification_commands.length === 0) {
    return { valid: false, severity: 'BLOCKER', message: 'Empty verification_commands — must contain at least one bash command' };
  }
  for (const cmd of fm.verification_commands) {
    if (typeof cmd !== 'string' || cmd.trim() === '') {
      return { valid: false, severity: 'BLOCKER', message: 'verification_commands contains empty or non-string entry' };
    }
  }
  return { valid: true, severity: null, message: 'verification_commands valid' };
}

function validateFilesForbidden(fm) {
  if (!fm.files_forbidden) {
    // WARNING only if plan modifies code files
    const modifiesCode = (fm.files_modified || []).some(f =>
      f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.md')
    );
    if (modifiesCode) {
      return { valid: false, severity: 'WARNING', message: 'Plan modifies files but declares no files_forbidden' };
    }
    return { valid: true, severity: null, message: 'No files_forbidden needed' };
  }
  if (!Array.isArray(fm.files_forbidden)) {
    return { valid: false, severity: 'BLOCKER', message: 'files_forbidden must be an array' };
  }
  // Empty array is valid
  return { valid: true, severity: null, message: 'files_forbidden valid' };
}

function validateExpectedArtifacts(fm) {
  if (!fm.expected_artifacts) {
    return { valid: false, severity: 'WARNING', message: 'Missing expected_artifacts — consider declaring outputs' };
  }
  if (!Array.isArray(fm.expected_artifacts)) {
    return { valid: false, severity: 'WARNING', message: 'expected_artifacts must be an array' };
  }
  for (const art of fm.expected_artifacts) {
    if (!art.path || typeof art.path !== 'string') {
      return { valid: false, severity: 'WARNING', message: 'Artifact entry missing path' };
    }
    if (!art.provides || typeof art.provides !== 'string') {
      return { valid: false, severity: 'WARNING', message: `Artifact ${art.path} missing provides` };
    }
  }
  // Check required artifacts appear in files_modified
  const modified = fm.files_modified || [];
  for (const art of fm.expected_artifacts) {
    if (art.required === true && !modified.includes(art.path)) {
      return { valid: false, severity: 'WARNING', message: `Required artifact ${art.path} not in files_modified` };
    }
  }
  return { valid: true, severity: null, message: 'expected_artifacts valid' };
}

function detectFileOverlap(fm) {
  const modified = fm.files_modified || [];
  const forbidden = fm.files_forbidden || [];
  const overlapping = [];

  for (const mod of modified) {
    for (const forb of forbidden) {
      // Directory prefix match: forbidden entry ending with / matches any modified starting with it
      if (forb.endsWith('/') && mod.startsWith(forb)) {
        overlapping.push(mod);
      }
      // Exact match
      else if (mod === forb) {
        overlapping.push(mod);
      }
    }
  }

  return { hasOverlap: overlapping.length > 0, overlapping };
}

// --- Tests ---

describe('Plan Schema Conformance (v6.0)', () => {

  describe('verification_commands field', () => {
    test('valid plan has verification_commands array', () => {
      const fm = parsePlanFrontmatter(path.join(FIXTURES, 'plan-valid-v6.md'));
      const result = validateVerificationCommands(fm);
      assert.equal(result.valid, true);
      assert.ok(Array.isArray(fm.verification_commands));
      assert.ok(fm.verification_commands.length >= 1);
    });

    test('missing verification_commands triggers BLOCKER', () => {
      const fm = parsePlanFrontmatter(path.join(FIXTURES, 'plan-missing-verification.md'));
      const result = validateVerificationCommands(fm);
      assert.equal(result.valid, false);
      assert.equal(result.severity, 'BLOCKER');
    });

    test('empty verification_commands array triggers BLOCKER', () => {
      const fm = { verification_commands: [] };
      const result = validateVerificationCommands(fm);
      assert.equal(result.valid, false);
      assert.equal(result.severity, 'BLOCKER');
    });

    test('verification_commands entries are non-empty strings', () => {
      const fm = parsePlanFrontmatter(path.join(FIXTURES, 'plan-valid-v6.md'));
      for (const cmd of fm.verification_commands) {
        assert.equal(typeof cmd, 'string');
        assert.ok(cmd.trim().length > 0, `Command should not be empty: "${cmd}"`);
      }
    });
  });

  describe('files_forbidden field', () => {
    test('valid plan has files_forbidden array', () => {
      const fm = parsePlanFrontmatter(path.join(FIXTURES, 'plan-valid-v6.md'));
      const result = validateFilesForbidden(fm);
      assert.equal(result.valid, true);
      assert.ok(Array.isArray(fm.files_forbidden));
    });

    test('missing files_forbidden for code plan triggers WARNING', () => {
      const fm = { files_modified: ['src/app.js'] };
      const result = validateFilesForbidden(fm);
      assert.equal(result.valid, false);
      assert.equal(result.severity, 'WARNING');
    });

    test('files_modified and files_forbidden have no overlap — BLOCKER if overlap', () => {
      const fm = parsePlanFrontmatter(path.join(FIXTURES, 'plan-overlap-forbidden.md'));
      const overlap = detectFileOverlap(fm);
      assert.equal(overlap.hasOverlap, true);
      assert.ok(overlap.overlapping.includes('skills/other-skill/SKILL.md'));
    });

    test('empty files_forbidden array is valid', () => {
      const fm = { files_forbidden: [], files_modified: ['src/app.js'] };
      const result = validateFilesForbidden(fm);
      assert.equal(result.valid, true);
    });

    test('directory prefix in files_forbidden catches nested paths', () => {
      const fm = {
        files_modified: ['agents/engineering-senior-developer.md'],
        files_forbidden: ['agents/'],
      };
      const overlap = detectFileOverlap(fm);
      assert.equal(overlap.hasOverlap, true);
      assert.ok(overlap.overlapping.includes('agents/engineering-senior-developer.md'));
    });
  });

  describe('expected_artifacts field', () => {
    test('valid plan has expected_artifacts with path and provides', () => {
      const fm = parsePlanFrontmatter(path.join(FIXTURES, 'plan-valid-v6.md'));
      const result = validateExpectedArtifacts(fm);
      assert.equal(result.valid, true);
      for (const art of fm.expected_artifacts) {
        assert.ok(art.path, 'artifact must have path');
        assert.ok(art.provides, 'artifact must have provides');
      }
    });

    test('missing expected_artifacts triggers WARNING', () => {
      const fm = { files_modified: ['src/app.js'] };
      const result = validateExpectedArtifacts(fm);
      assert.equal(result.valid, false);
      assert.equal(result.severity, 'WARNING');
    });

    test('required artifacts appear in files_modified', () => {
      const fm = parsePlanFrontmatter(path.join(FIXTURES, 'plan-valid-v6.md'));
      const modified = fm.files_modified || [];
      for (const art of fm.expected_artifacts) {
        if (art.required === true) {
          assert.ok(modified.includes(art.path),
            `Required artifact ${art.path} must be in files_modified`);
        }
      }
    });

    test('artifact entries have required structure (path, provides)', () => {
      const fm = parsePlanFrontmatter(path.join(FIXTURES, 'plan-valid-v6.md'));
      for (const art of fm.expected_artifacts) {
        assert.equal(typeof art.path, 'string');
        assert.equal(typeof art.provides, 'string');
        assert.ok(art.path.length > 0);
        assert.ok(art.provides.length > 0);
      }
    });
  });

  describe('Phase 1 plan files conform to v6.0 schema', () => {
    const planFiles = ['01-01-PLAN.md', '01-02-PLAN.md', '01-03-PLAN.md'];

    for (const planFile of planFiles) {
      test(`${planFile} passes schema validation`, () => {
        const filePath = path.join(PHASE1_DIR, planFile);
        assert.ok(fs.existsSync(filePath), `${planFile} must exist`);

        const fm = parsePlanFrontmatter(filePath);

        // verification_commands must be present and valid
        const vcResult = validateVerificationCommands(fm);
        assert.equal(vcResult.valid, true,
          `${planFile}: ${vcResult.message}`);

        // files_forbidden must be present and valid
        const ffResult = validateFilesForbidden(fm);
        assert.equal(ffResult.valid, true,
          `${planFile}: ${ffResult.message}`);

        // expected_artifacts must be present and valid
        const eaResult = validateExpectedArtifacts(fm);
        assert.equal(eaResult.valid, true,
          `${planFile}: ${eaResult.message}`);

        // No overlap between files_modified and files_forbidden
        const overlap = detectFileOverlap(fm);
        assert.equal(overlap.hasOverlap, false,
          `${planFile}: files_modified/files_forbidden overlap: ${overlap.overlapping.join(', ')}`);
      });
    }
  });

  describe('agents field convention', () => {
    test('plan frontmatter has plural agents array (not singular agent)', () => {
      const planFiles = listPlanFiles(PHASE1_DIR);
      for (const f of planFiles) {
        const fm = parsePlanFrontmatter(f);
        assert.equal('agent' in fm, false, `${f} uses legacy singular 'agent' field`);
        assert.ok(Array.isArray(fm.agents), `${f} missing 'agents' array`);
        assert.ok(fm.agents.length >= 1, `${f} has empty agents array`);
      }
    });
  });
});
