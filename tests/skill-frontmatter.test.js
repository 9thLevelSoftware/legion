'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const SKILLS_DIR = path.resolve(__dirname, '..', 'skills');

test('every SKILL.md frontmatter is valid YAML with name and description', () => {
  for (const dir of fs.readdirSync(SKILLS_DIR)) {
    const file = path.join(SKILLS_DIR, dir, 'SKILL.md');
    if (!fs.existsSync(file)) continue;
    const match = fs.readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
    assert.ok(match, `${dir}/SKILL.md has no frontmatter`);
    let data;
    assert.doesNotThrow(() => { data = YAML.parse(match[1]); }, `${dir}/SKILL.md frontmatter is not valid YAML`);
    assert.equal(typeof data.name, 'string', `${dir}/SKILL.md name`);
    assert.equal(typeof data.description, 'string', `${dir}/SKILL.md description`);
  }
});
