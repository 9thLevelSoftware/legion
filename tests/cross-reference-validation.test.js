'use strict';

/*
 * Cross-Reference Validation Tests (Phase 7: Structural Integrity)
 *
 * Validates that all cross-references between commands, skills, and agents
 * are intact. Catches dead references, orphan entries, and broken links.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COMMANDS_DIR = path.join(ROOT, 'commands');
const AGENTS_DIR = path.join(ROOT, 'agents');
const CATALOG_PATH = path.join(ROOT, 'skills', 'agent-registry', 'CATALOG.md');
const PACKAGE_PATH = path.join(ROOT, 'package.json');
const CODEX_PLUGIN_MANIFEST_PATH = path.join(ROOT, '.codex-plugin', 'plugin.json');

function listCommandFiles() {
  return fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith('.md')).sort();
}

function listAgentFiles() {
  return fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md')).sort();
}

function extractExecutionContext(text) {
  const match = text.match(/<execution_context>([\s\S]*?)<\/execution_context>/);
  if (!match) return [];
  return match[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

test.describe('Cross-reference validation: command execution_context skill references', () => {
  const commandFiles = listCommandFiles();

  for (const file of commandFiles) {
    test(`${file} execution_context references exist on disk`, () => {
      const text = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf8');
      const refs = extractExecutionContext(text);

      assert.ok(refs.length > 0, `${file} should have at least one execution_context reference`);

      for (const ref of refs) {
        // Strip absolute path prefix if present (e.g., C:/Users/dasbl/.claude/legion/)
        let relativePath = ref.replace(/^[A-Za-z]:\/.*?\/legion\//, '');
        // Also handle backslash variant
        relativePath = relativePath.replace(/^[A-Za-z]:\\.*?\\legion\\/, '');

        const fullPath = path.join(ROOT, relativePath);
        assert.ok(
          fs.existsSync(fullPath),
          `${file} references "${ref}" but ${relativePath} does not exist on disk`
        );
      }
    });
  }
});

test.describe('Cross-reference validation: CATALOG.md agent file references', () => {
  const catalogText = fs.readFileSync(CATALOG_PATH, 'utf8');

  // Only parse Section 1 (Agent Catalog) — stop before Section 2 (Intent Routing)
  const section1End = catalogText.indexOf('## Section 2');
  const section1Text = section1End !== -1 ? catalogText.slice(0, section1End) : catalogText;

  // Extract agent IDs from Section 1 catalog tables.
  // Table rows look like: | agent-id | `agents/agent-id.md` | ... |
  const idPattern = /^\|\s*([a-z][a-z0-9-]+)\s*\|/gm;
  const catalogIds = [];
  let match;
  while ((match = idPattern.exec(section1Text)) !== null) {
    const id = match[1];
    // Skip table header separators and header labels
    if (id === 'id' || id === 'intent' || id.startsWith('--')) continue;
    catalogIds.push(id);
  }

  test('catalog contains agent IDs', () => {
    assert.ok(catalogIds.length >= 45, `Expected at least 45 agent IDs in catalog, found ${catalogIds.length}`);
  });

  for (const id of catalogIds) {
    test(`agent file exists for catalog entry "${id}"`, () => {
      const agentPath = path.join(AGENTS_DIR, `${id}.md`);
      assert.ok(
        fs.existsSync(agentPath),
        `CATALOG.md references agent "${id}" but agents/${id}.md does not exist`
      );
    });
  }
});

test.describe('Cross-reference validation: agent files back-referenced in CATALOG.md', () => {
  const catalogText = fs.readFileSync(CATALOG_PATH, 'utf8');
  const agentFiles = listAgentFiles();

  for (const file of agentFiles) {
    const id = file.replace(/\.md$/, '');
    test(`agent "${id}" appears in CATALOG.md`, () => {
      const pattern = new RegExp('\\|\\s*' + id.replace(/-/g, '\\-') + '\\s*\\|');
      assert.ok(
        pattern.test(catalogText),
        `agents/${file} exists but "${id}" is not referenced in CATALOG.md`
      );
    });
  }
});

test.describe('Cross-reference validation: repo-native Codex plugin wiring', () => {
  test('.codex-plugin/plugin.json exists and stays version-synced with package.json', () => {
    assert.ok(
      fs.existsSync(CODEX_PLUGIN_MANIFEST_PATH),
      '.codex-plugin/plugin.json should exist for the repo-native Codex plugin path'
    );

    const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
    const pluginManifest = JSON.parse(fs.readFileSync(CODEX_PLUGIN_MANIFEST_PATH, 'utf8'));

    assert.equal(
      pluginManifest.version,
      pkg.version,
      '.codex-plugin/plugin.json version should stay in sync with package.json'
    );
  });
});
