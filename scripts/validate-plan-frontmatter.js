'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
// CRITICAL: plan-frontmatter schema uses 2020-12 draft. Default Ajv import
// does NOT support 2020-12 — it must be the /dist/2020 entry point.
const Ajv = require('ajv/dist/2020');

const SCHEMA_PATH = path.join(__dirname, '..', 'docs', 'schemas', 'plan-frontmatter.schema.json');

let _validator = null;
function getValidator() {
  if (_validator) return _validator;
  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  } catch (e) {
    throw new Error(`Schema not loadable at ${SCHEMA_PATH}: ${e.message}`);
  }
  const ajv = new Ajv({ allErrors: true, strict: false });
  try {
    _validator = ajv.compile(schema);
  } catch (e) {
    throw new Error(`Schema failed to compile: ${e.message}`);
  }
  return _validator;
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function hasNamedFileOrPattern(line) {
  return /`[^`]+`/.test(line)
    || /\b(?:from|in|at)\s+[\w./*{}-]+\.(?:js|jsx|ts|tsx|mjs|cjs|py|rb|go|rs|java|kt|swift|md|json|ya?ml|toml|sh|ps1)\b/i.test(line);
}

function extractActionBlocks(text) {
  const blocks = [];
  const re = /<action>([\s\S]*?)<\/action>/gi;
  let match;
  while ((match = re.exec(text)) !== null) {
    blocks.push({
      text: match[1],
      start: match.index,
    });
  }
  return blocks;
}

function validatePlanBodyContract(text) {
  const errors = [];
  const actionBlocks = extractActionBlocks(text);

  for (const block of actionBlocks) {
    const blockHasVerification = /^>\s*verification:/im.test(block.text);
    const lines = block.text.split(/\r?\n/);
    let offset = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      const absoluteIndex = block.start + offset;
      const lineNumber = lineNumberAt(text, absoluteIndex);

      if (trimmed.startsWith('|')) {
        offset += line.length + 1;
        continue;
      }

      if (/\bimplement as appropriate\b/i.test(line)) {
        errors.push({
          instancePath: '/body',
          keyword: 'decisionComplete',
          message: `line ${lineNumber}: vague action phrase "implement as appropriate" is forbidden`,
        });
      }

      if (/\bverify manually\b/i.test(line)) {
        errors.push({
          instancePath: '/body',
          keyword: 'decisionComplete',
          message: `line ${lineNumber}: "verify manually" is not a deterministic verification command`,
        });
      }

      if (/\buse existing helpers\b/i.test(line) && !hasNamedFileOrPattern(line)) {
        errors.push({
          instancePath: '/body',
          keyword: 'decisionComplete',
          message: `line ${lineNumber}: "use existing helpers" must name the helper file, symbol, or grep-able pattern`,
        });
      }

      if (/\badd tests\b/i.test(line) && (!hasNamedFileOrPattern(line) || !blockHasVerification)) {
        errors.push({
          instancePath: '/body',
          keyword: 'decisionComplete',
          message: `line ${lineNumber}: "add tests" must name test path(s) and include verification command expectations`,
        });
      }

      offset += line.length + 1;
    }
  }

  return errors;
}

function validatePlanFile(filePath) {
  let text;
  try { text = fs.readFileSync(filePath, 'utf8'); } catch (e) {
    return { valid: false, errors: [{ message: `Cannot read ${filePath}: ${e.message}` }] };
  }
  let parsed;
  try { parsed = matter(text); } catch (e) {
    return { valid: false, errors: [{ message: `gray-matter parse failed for ${filePath}: ${e.message}` }] };
  }
  const fm = parsed.data || {};
  let validate;
  try {
    validate = getValidator();
  } catch (e) {
    return { valid: false, errors: [{ message: e.message }] };
  }
  const schemaValid = validate(fm);
  const errors = [...(validate.errors || []), ...validatePlanBodyContract(text)];
  return { valid: schemaValid && errors.length === 0, errors, file: filePath };
}

function findPlanFiles(dir) {
  const out = [];
  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && /^valid-.*\.md$|^invalid-.*\.md$|-PLAN\.md$/.test(e.name)) out.push(full);
    }
  }
  walk(dir);
  return out;
}

function validatePlanDir(dir) {
  const files = findPlanFiles(dir);
  const invalid = [];
  for (const f of files) {
    const r = validatePlanFile(f);
    if (!r.valid) invalid.push({ file: f, errors: r.errors });
  }
  return { totalFiles: files.length, invalidFiles: invalid };
}

function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node validate-plan-frontmatter.js <file-or-dir>');
    process.exit(2);
  }
  let stat;
  try { stat = fs.statSync(target); } catch (e) {
    console.error(`Cannot stat target '${target}': ${e.message}`);
    process.exit(2);
  }
  if (stat.isDirectory()) {
    const r = validatePlanDir(target);
    if (r.invalidFiles.length === 0) {
      console.log(`OK: ${r.totalFiles} plan files validate`);
      process.exit(0);
    }
    console.error(`FAIL: ${r.invalidFiles.length} of ${r.totalFiles} plan files invalid`);
    for (const f of r.invalidFiles) {
      console.error(`  ${f.file}`);
      for (const err of f.errors) {
        console.error(`    ${err.instancePath || err.dataPath || '(root)'} ${err.keyword || ''} - ${err.message || ''}`);
      }
    }
    process.exit(1);
  } else {
    const r = validatePlanFile(target);
    if (r.valid) { console.log(`OK: ${target}`); process.exit(0); }
    console.error(`FAIL: ${target}`);
    for (const err of r.errors) {
      console.error(`  ${err.instancePath || err.dataPath || '(root)'} ${err.keyword || ''} - ${err.message || ''}`);
    }
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { validatePlanFile, validatePlanDir, findPlanFiles, validatePlanBodyContract };
