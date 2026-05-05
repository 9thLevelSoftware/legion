'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function migrateFm(fm, fileHint = '') {
  const out = { ...fm };

  // 1. agent (singular string) -> agents (array)
  if (out.agent && !out.agents) {
    out.agents = Array.isArray(out.agent) ? out.agent : [out.agent];
    delete out.agent;
  }

  // 2. plan: <integer> -> "NN-PP" string. Need phase number to derive NN.
  if (typeof out.plan === 'number') {
    let phaseNum;
    if (typeof out.phase === 'number') phaseNum = out.phase;
    else if (typeof out.phase === 'string') {
      const m = out.phase.match(/^(\d{2})-/);
      if (m) phaseNum = parseInt(m[1], 10);
      else if (/^\d+$/.test(out.phase)) phaseNum = parseInt(out.phase, 10);
    }
    if (typeof phaseNum === 'number') {
      out.plan = `${String(phaseNum).padStart(2, '0')}-${String(out.plan).padStart(2, '0')}`;
    }
  } else if (typeof out.plan === 'string' && /^\d+$/.test(out.plan)) {
    // Numeric string like "01" without phase prefix
    let phaseNum;
    if (typeof out.phase === 'number') phaseNum = out.phase;
    else if (typeof out.phase === 'string') {
      const m = out.phase.match(/^(\d{2})-/);
      if (m) phaseNum = parseInt(m[1], 10);
      else if (/^\d+$/.test(out.phase)) phaseNum = parseInt(out.phase, 10);
    }
    if (typeof phaseNum === 'number') {
      out.plan = `${String(phaseNum).padStart(2, '0')}-${String(parseInt(out.plan, 10)).padStart(2, '0')}`;
    }
  }

  // 3. expected_artifacts: ["str", ...] -> [{path, provides, required}, ...]
  if (Array.isArray(out.expected_artifacts)) {
    const allStrings = out.expected_artifacts.every(a => typeof a === 'string');
    if (allStrings && out.expected_artifacts.length > 0) {
      out.expected_artifacts = out.expected_artifacts.map(s => ({
        path: s,
        provides: 'migrated artifact',
        required: true
      }));
    }
  }

  // 4. must_haves: leave structured form alone. If it's a flat array of strings,
  //    wrap into truths.
  if (Array.isArray(out.must_haves)) {
    out.must_haves = { truths: out.must_haves };
  }

  return out;
}

function migratePlanText(text) {
  const parsed = matter(text);
  const newFm = migrateFm(parsed.data || {}, '<text>');
  return matter.stringify(parsed.content || '', newFm);
}

function migratePlanFile(filePath, { dryRun } = {}) {
  const text = fs.readFileSync(filePath, 'utf8');
  const out = migratePlanText(text);
  if (text === out) return { changed: false, file: filePath };
  if (!dryRun) fs.writeFileSync(filePath, out, 'utf8');
  return { changed: true, file: filePath };
}

function migrateDir(dir, { dryRun } = {}) {
  const out = { changed: [], unchanged: [], errors: [] };
  function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (/-PLAN\.md$/.test(e.name)) {
        try {
          const r = migratePlanFile(full, { dryRun });
          (r.changed ? out.changed : out.unchanged).push(full);
        } catch (err) {
          out.errors.push({ file: full, error: err.message });
        }
      }
    }
  }
  walk(dir);
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const target = args.find(a => !a.startsWith('--'));
  if (!target) {
    console.error('Usage: node migrate-plans-to-v2.js <dir> [--dry-run]');
    process.exit(2);
  }
  const r = migrateDir(target, { dryRun });
  console.log(`Changed: ${r.changed.length}`);
  console.log(`Unchanged: ${r.unchanged.length}`);
  console.log(`Errors: ${r.errors.length}`);
  for (const f of r.changed) console.log(`  + ${f}`);
  for (const e of r.errors) console.log(`  ! ${e.file}: ${e.error}`);
  process.exit(r.errors.length > 0 ? 1 : 0);
}

if (require.main === module) main();

module.exports = { migrateFm, migratePlanText, migratePlanFile, migrateDir };
