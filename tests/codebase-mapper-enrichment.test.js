'use strict';

/**
 * Codebase Mapper Enrichment Tests — Dependency Risk (MAP-01)
 *
 * Validates that SKILL.md contains the Section 4.6 specification for
 * package-level dependency risk assessment, and that the CODEBASE.md
 * template includes the corresponding output sections.
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKILL_PATH = path.join(ROOT, 'skills', 'codebase-mapper', 'SKILL.md');
const FIXTURE_PATH = path.join(
  ROOT,
  'tests',
  'fixtures',
  'codebase-mapper',
  'sample-npm-outdated.json'
);

const skillContent = fs.readFileSync(SKILL_PATH, 'utf8');

// --- Dependency Risk — SKILL.md specification ---

describe('Dependency Risk — SKILL.md specification', () => {
  test('Section 4.6 exists in codebase-mapper SKILL.md', () => {
    assert.ok(
      skillContent.includes('### 4.6: Package-Level Dependency Risk (MAP-01)'),
      'Section 4.6 header must exist with MAP-01 tag'
    );
  });

  test('Section 4.6 defines ecosystem detection table with npm, pip, bundle, cargo, go', () => {
    assert.ok(
      skillContent.includes('#### 4.6.1: Ecosystem Detection'),
      'Subsection 4.6.1 must exist'
    );
    const ecosystems = ['npm', 'pip', 'bundler', 'cargo', 'go'];
    for (const eco of ecosystems) {
      assert.ok(
        skillContent.includes(`| ${eco === 'bundler' ? 'Ruby' : eco === 'npm' ? 'Node.js' : eco === 'pip' ? 'Python' : eco === 'cargo' ? 'Rust' : 'Go'} | ${eco}`),
        `Ecosystem detection table must include ${eco}`
      );
    }
  });

  test('Section 4.6 includes outdated detection protocol', () => {
    assert.ok(
      skillContent.includes('#### 4.6.2: Outdated Package Detection'),
      'Subsection 4.6.2 must exist'
    );
    assert.ok(
      skillContent.includes('npm outdated --json'),
      'Must reference npm outdated --json command'
    );
    assert.ok(
      skillContent.includes('major version behind'),
      'Must categorize by major version severity'
    );
  });

  test('Section 4.6 includes heavy dependency detection with thresholds', () => {
    assert.ok(
      skillContent.includes('#### 4.6.3: Heavy Dependency Detection'),
      'Subsection 4.6.3 must exist'
    );
    assert.ok(
      skillContent.includes('Ratio > 50'),
      'Must define HIGH threshold at ratio > 50'
    );
    assert.ok(
      skillContent.includes('Ratio 20-50'),
      'Must define MEDIUM threshold at ratio 20-50'
    );
    assert.ok(
      skillContent.includes('Ratio < 20'),
      'Must define LOW threshold at ratio < 20'
    );
  });

  test('Section 4.6 includes unmaintained package heuristic', () => {
    assert.ok(
      skillContent.includes('#### 4.6.4: Unmaintained Package Heuristic'),
      'Subsection 4.6.4 must exist'
    );
    assert.ok(
      skillContent.includes('>2 years'),
      'Must define 2-year staleness threshold'
    );
  });

  test('Section 4.6 includes graceful degradation for each subsection', () => {
    assert.ok(
      skillContent.includes('#### 4.6.6: Graceful Degradation'),
      'Subsection 4.6.6 must exist'
    );
    // Each subsection has its own skip condition
    const skipConditions = [
      'Package manager not available or no lockfile found',
      'Heavy dependency analysis requires Node.js/npm',
      'Lockfile unavailable for unmaintained package detection',
    ];
    for (const condition of skipConditions) {
      assert.ok(
        skillContent.includes(condition),
        `Must include skip condition: "${condition}"`
      );
    }
    assert.ok(
      skillContent.includes('Never error, never block analysis completion'),
      'Must state never-error guarantee'
    );
  });
});

// --- Dependency Risk — CODEBASE.md template ---

describe('Dependency Risk — CODEBASE.md template', () => {
  test('Template includes ## Dependency Risk section', () => {
    assert.ok(
      skillContent.includes('## Dependency Risk'),
      'CODEBASE.md template must include ## Dependency Risk'
    );
  });

  test('Template includes Outdated Packages table with required columns', () => {
    assert.ok(
      skillContent.includes('### Outdated Packages'),
      'Must include Outdated Packages subsection'
    );
    const requiredColumns = ['Package', 'Current', 'Latest', 'Severity'];
    for (const col of requiredColumns) {
      assert.ok(
        skillContent.includes(col),
        `Outdated Packages table must include column: ${col}`
      );
    }
  });

  test('Template includes Heavy Dependencies subsection', () => {
    assert.ok(
      skillContent.includes('### Heavy Dependencies'),
      'Must include Heavy Dependencies subsection'
    );
    assert.ok(
      skillContent.includes('Transitive count'),
      'Must include transitive count metric'
    );
  });

  test('Template includes Potentially Unmaintained subsection', () => {
    assert.ok(
      skillContent.includes('### Potentially Unmaintained'),
      'Must include Potentially Unmaintained subsection'
    );
  });

  test('Template includes Dependency Risk Summary table', () => {
    assert.ok(
      skillContent.includes('### Dependency Risk Summary'),
      'Must include Dependency Risk Summary subsection'
    );
    const summaryMetrics = [
      'Outdated packages',
      'Major version behind',
      'Heavy dependencies',
      'Potentially unmaintained',
    ];
    for (const metric of summaryMetrics) {
      assert.ok(
        skillContent.includes(metric),
        `Summary table must include metric: ${metric}`
      );
    }
  });

  test('Template includes graceful degradation placeholder for missing ecosystem', () => {
    assert.ok(
      skillContent.includes(
        'No package manifest detected (package.json, requirements.txt, Gemfile, Cargo.toml, go.mod)'
      ),
      'Must include no-manifest placeholder text'
    );
  });
});

// --- Dependency Risk — calibration logic ---

describe('Dependency Risk — calibration logic', () => {
  test('Risk calibration thresholds are relative to dependency count', () => {
    // Section 4.6.2 must state percentage-based thresholds
    assert.ok(
      skillContent.includes('50% of dependencies outdated'),
      'HIGH threshold must be percentage-based (>50%)'
    );
    assert.ok(
      skillContent.includes('20-50% outdated'),
      'MEDIUM threshold must be percentage-based (20-50%)'
    );
    assert.ok(
      skillContent.includes('Less than 20% outdated'),
      'LOW threshold must be percentage-based (<20%)'
    );
    // Section 4.6.5 must reference relative calibration
    assert.ok(
      skillContent.includes(
        'Risk levels are relative to total dependency count, not absolute numbers'
      ),
      'Must explicitly state relative calibration'
    );
  });

  test('Outdated risk levels use major/minor/patch severity categories', () => {
    assert.ok(
      skillContent.includes('major version behind (HIGH)'),
      'Must map major version behind to HIGH'
    );
    assert.ok(
      skillContent.includes('minor version behind (MEDIUM)'),
      'Must map minor version behind to MEDIUM'
    );
    assert.ok(
      skillContent.includes('patch only (LOW)'),
      'Must map patch only to LOW'
    );
  });

  test('Sample npm outdated fixture is valid JSON with expected structure', () => {
    const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
    const packages = Object.keys(fixture);
    assert.ok(packages.length > 0, 'Fixture must contain at least one package');

    for (const pkg of packages) {
      const entry = fixture[pkg];
      assert.ok('current' in entry, `${pkg} must have "current" field`);
      assert.ok('latest' in entry, `${pkg} must have "latest" field`);
      assert.ok('wanted' in entry, `${pkg} must have "wanted" field`);
    }

    // Verify fixture includes at least one major-version-behind package
    const hasMajorBehind = packages.some((pkg) => {
      const current = fixture[pkg].current.split('.')[0];
      const latest = fixture[pkg].latest.split('.')[0];
      return parseInt(latest) > parseInt(current);
    });
    assert.ok(
      hasMajorBehind,
      'Fixture must include at least one package with a major version behind'
    );
  });
});
