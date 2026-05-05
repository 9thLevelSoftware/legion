'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Spawn-flavored language patterns.
const SPAWN_PATTERN = /\b(spawn|dispatch)\s+(the\s+)?(\w[\w-]*\s+)?(agent|polymath|specialist)\b|spawn agent:|Polymath takes over|takes over the conversation/i;

// Literal Agent invocation patterns. Matches Agent({...}), Agent(...) with prompt,
// or fenced code blocks containing Agent(.
const AGENT_INVOCATION_PATTERN = /\bAgent\s*\(\s*[\{"']/;

function validateCommandFile(filePath) {
  let text;
  try { text = fs.readFileSync(filePath, 'utf8'); } catch (e) {
    return { valid: false, reason: `Cannot read: ${e.message}`, file: filePath };
  }
  let parsed;
  try { parsed = matter(text); } catch (e) {
    return { valid: false, reason: `gray-matter parse failed: ${e.message}`, file: filePath };
  }
  const fm = parsed.data || {};
  const body = parsed.content || '';

  const declaredInline = fm.mode === 'inline-persona';
  const hasSpawnLang = SPAWN_PATTERN.test(body);
  const hasAgentInvoke = AGENT_INVOCATION_PATTERN.test(body);

  if (!hasSpawnLang) {
    return { valid: true, exempt: true, reason: 'no spawn-flavored language', file: filePath };
  }

  if (declaredInline) {
    // If inline-persona is declared AND body still uses spawn language, that's a contradiction.
    return {
      valid: false,
      reason: `Frontmatter declares mode: inline-persona but body contains spawn-flavored language. Rewrite body to inline-flavored prose.`,
      file: filePath
    };
  }

  if (hasAgentInvoke) {
    return { valid: true, reason: 'spawn language present and Agent() invocation present', file: filePath };
  }

  return {
    valid: false,
    reason: `Body contains spawn-flavored language but neither Agent() invocation nor mode: inline-persona declaration. Add Agent(...) call OR set mode: inline-persona.`,
    file: filePath
  };
}

function findCommandFiles(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith('.md')) out.push(path.join(dir, name));
  }
  return out;
}

function validateCommandsDir(dir) {
  const files = findCommandFiles(dir);
  const invalid = [];
  for (const f of files) {
    const r = validateCommandFile(f);
    if (!r.valid) invalid.push(r);
  }
  return { totalFiles: files.length, invalidFiles: invalid };
}

function main() {
  const target = process.argv[2] || path.join(__dirname, '..', 'commands');
  // Correction A: Guard fs.statSync
  let stat;
  try { stat = fs.statSync(target); } catch (e) {
    console.error(`Cannot stat target '${target}': ${e.message}`);
    process.exit(2);
  }
  if (stat.isDirectory()) {
    const r = validateCommandsDir(target);
    if (r.invalidFiles.length === 0) {
      console.log(`OK: ${r.totalFiles} command files pass spawn-truthfulness check`);
      process.exit(0);
    }
    console.error(`FAIL: ${r.invalidFiles.length} of ${r.totalFiles} command files invalid`);
    for (const f of r.invalidFiles) {
      console.error(`  ${f.file}`);
      console.error(`    ${f.reason}`);
    }
    process.exit(1);
  } else {
    const r = validateCommandFile(target);
    if (r.valid) { console.log(`OK: ${target}`); process.exit(0); }
    console.error(`FAIL: ${target} - ${r.reason}`);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { validateCommandFile, validateCommandsDir, findCommandFiles, SPAWN_PATTERN, AGENT_INVOCATION_PATTERN };
