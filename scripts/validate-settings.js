'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv').default || require('ajv');

const SCHEMA_PATH = path.join(__dirname, '..', 'docs', 'settings.schema.json');

function validateSettings(settingsPath) {
  let schemaText;
  let dataText;
  try {
    schemaText = fs.readFileSync(SCHEMA_PATH, 'utf8');
  } catch (e) {
    return { valid: false, errors: [{ message: `Cannot read schema at ${SCHEMA_PATH}: ${e.message}` }] };
  }
  try {
    dataText = fs.readFileSync(settingsPath, 'utf8');
  } catch (e) {
    return { valid: false, errors: [{ message: `Cannot read settings at ${settingsPath}: ${e.message}` }] };
  }

  let schema, data;
  try { schema = JSON.parse(schemaText); } catch (e) {
    return { valid: false, errors: [{ message: `Schema is not valid JSON: ${e.message}` }] };
  }
  try { data = JSON.parse(dataText); } catch (e) {
    return { valid: false, errors: [{ message: `Settings is not valid JSON: ${e.message}` }] };
  }

  const ajv = new Ajv({ allErrors: true, strict: false });
  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (e) {
    return { valid: false, errors: [{ message: `Schema failed to compile: ${e.message}` }] };
  }
  const valid = validate(data);
  return { valid, errors: validate.errors || [] };
}

function main() {
  const target = process.argv[2] || path.join(__dirname, '..', 'settings.json');
  const result = validateSettings(target);
  if (result.valid) {
    console.log(`OK: ${target} validates against schema`);
    process.exit(0);
  }
  console.error(`FAIL: ${target} does not validate against schema`);
  for (const err of result.errors) {
    const loc = err.instancePath || err.dataPath || '(root)';
    console.error(`  ${loc} ${err.keyword || ''} - ${err.message || JSON.stringify(err)}`);
  }
  process.exit(1);
}

if (require.main === module) main();

module.exports = { validateSettings };
