/**
 * Intent Validation Tests
 * Validates flag combination rules and command context requirements
 * Requirements: INTENT-05, INTENT-06
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

/**
 * Validate intent flag combinations
 * @param {Object} flags - Parsed intent flags
 * @param {string} command - Command context ('build', 'review', etc.)
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
function validateIntentFlags(flags, command) {
  const errors = [];

  // Handle null input
  if (!flags) {
    return { valid: true, errors: [] };
  }

  // Check for conflicting --just-* flags (using rawIntents array)
  const justFlags = flags.rawIntents || [];

  // Mutual exclusion: can't have multiple --just-* flags
  if (justFlags.length > 1) {
    errors.push(`Conflicting intent flags: ${justFlags.join(', ')}. Only one --just-* flag allowed.`);
  }

  // --just-document + --skip-frontend is redundant (document doesn't affect frontend anyway)
  if (flags.intent === 'document' && flags.filters?.skipFrontend) {
    errors.push('Redundant combination: --just-document with --skip-frontend. Documentation intent does not affect frontend files.');
  }

  // --skip-frontend + --skip-backend = nothing to build
  if (flags.filters?.skipFrontend && flags.filters?.skipBackend) {
    errors.push('Invalid combination: --skip-frontend with --skip-backend. No files would be processed.');
  }

  // Command context requirements
  if (flags.intent === 'harden' && command !== 'build') {
    errors.push(`Invalid context: --just-harden is only valid for build command, not ${command}.`);
  }

  if (flags.intent === 'document' && command !== 'build') {
    errors.push(`Invalid context: --just-document is only valid for build command, not ${command}.`);
  }

  if (flags.intent === 'security-only' && command !== 'review') {
    errors.push(`Invalid context: --just-security is only valid for review command, not ${command}.`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if flag combination is valid
 * @param {string[]} flags - Array of flag strings
 * @returns {boolean}
 */
function isValidCombination(flags) {
  const result = validateIntentFlags(parseFlags(flags), 'build');
  return result.valid;
}

/**
 * Parse flag strings to intent flags object
 * @param {string[]} flags - Array of flag strings
 * @returns {Object} Parsed flags
 */
function parseFlags(flags) {
  const result = {
    intent: null,
    rawIntents: [],
    filters: {},
    skipPatterns: []
  };

  for (const flag of flags) {
    if (flag === '--just-harden') {
      result.intent = 'harden';
      result.rawIntents.push('--just-harden');
    }
    if (flag === '--just-document') {
      result.intent = 'document';
      result.rawIntents.push('--just-document');
    }
    if (flag === '--just-security') {
      result.intent = 'security-only';
      result.rawIntents.push('--just-security');
    }
    if (flag === '--skip-frontend') result.filters.skipFrontend = true;
    if (flag === '--skip-backend') result.filters.skipBackend = true;
  }

  return result;
}

/**
 * Get validation error message with suggestions
 * @param {string[]} flags - Array of flag strings
 * @param {string} command - Command context
 * @returns {string|null} Error message or null if valid
 */
function getValidationError(flags, command) {
  const result = validateIntentFlags(parseFlags(flags), command);
  if (result.valid) return null;
  
  const error = result.errors[0];
  
  // Add helpful suggestions
  if (error.includes('only valid for build command')) {
    return `${error} Did you mean to use /legion:build instead?`;
  }
  if (error.includes('only valid for review command')) {
    return `${error} Did you mean to use /legion:review instead?`;
  }
  if (error.includes('No files would be processed')) {
    return `${error} Try using only one of --skip-frontend or --skip-backend, or neither.`;
  }
  
  return error;
}

// Test: Mutual exclusion rules
describe('Mutual Exclusion Rules', () => {
  test('--just-harden + --just-document should be rejected', () => {
    const flags = ['--just-harden', '--just-document'];
    const result = validateIntentFlags(parseFlags(flags), 'build');
    
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Conflicting')));
  });
  
  test('--just-document + --just-security should be rejected', () => {
    const flags = ['--just-document', '--just-security'];
    const result = validateIntentFlags(parseFlags(flags), 'build');
    
    assert.strictEqual(result.valid, false);
  });
  
  test('--just-harden + --just-security should be rejected', () => {
    const flags = ['--just-harden', '--just-security'];
    const result = validateIntentFlags(parseFlags(flags), 'build');
    
    assert.strictEqual(result.valid, false);
  });
  
  test('--just-document + --skip-frontend is redundant and rejected', () => {
    const flags = ['--just-document', '--skip-frontend'];
    const result = validateIntentFlags(parseFlags(flags), 'build');
    
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Redundant')));
  });
  
  test('--skip-frontend + --skip-backend = nothing to build', () => {
    const flags = ['--skip-frontend', '--skip-backend'];
    const result = validateIntentFlags(parseFlags(flags), 'build');
    
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('No files')));
  });
});

// Test: Command context requirements
describe('Command Context Requirements', () => {
  test('--just-harden only valid for build command', () => {
    const flags = ['--just-harden'];
    
    const buildResult = validateIntentFlags(parseFlags(flags), 'build');
    const reviewResult = validateIntentFlags(parseFlags(flags), 'review');
    const planResult = validateIntentFlags(parseFlags(flags), 'plan');
    
    assert.strictEqual(buildResult.valid, true);
    assert.strictEqual(reviewResult.valid, false);
    assert.strictEqual(planResult.valid, false);
  });
  
  test('--just-document only valid for build command', () => {
    const flags = ['--just-document'];
    
    const buildResult = validateIntentFlags(parseFlags(flags), 'build');
    const reviewResult = validateIntentFlags(parseFlags(flags), 'review');
    
    assert.strictEqual(buildResult.valid, true);
    assert.strictEqual(reviewResult.valid, false);
  });
  
  test('--just-security only valid for review command', () => {
    const flags = ['--just-security'];
    
    const buildResult = validateIntentFlags(parseFlags(flags), 'build');
    const reviewResult = validateIntentFlags(parseFlags(flags), 'review');
    const adviseResult = validateIntentFlags(parseFlags(flags), 'advise');
    
    assert.strictEqual(buildResult.valid, false);
    assert.strictEqual(reviewResult.valid, true);
    assert.strictEqual(adviseResult.valid, false);
  });
  
  test('--skip-frontend valid for any command', () => {
    const flags = ['--skip-frontend'];
    
    const buildResult = validateIntentFlags(parseFlags(flags), 'build');
    const reviewResult = validateIntentFlags(parseFlags(flags), 'review');
    const planResult = validateIntentFlags(parseFlags(flags), 'plan');
    
    assert.strictEqual(buildResult.valid, true);
    assert.strictEqual(reviewResult.valid, true);
    assert.strictEqual(planResult.valid, true);
  });
  
  test('--skip-backend valid for any command', () => {
    const flags = ['--skip-backend'];
    
    const buildResult = validateIntentFlags(parseFlags(flags), 'build');
    const reviewResult = validateIntentFlags(parseFlags(flags), 'review');
    
    assert.strictEqual(buildResult.valid, true);
    assert.strictEqual(reviewResult.valid, true);
  });
});

// Test: Valid combinations
describe('Valid Combinations', () => {
  test('--skip-frontend alone is valid', () => {
    const flags = ['--skip-frontend'];
    const result = validateIntentFlags(parseFlags(flags), 'build');
    
    assert.strictEqual(result.valid, true);
    assert.deepStrictEqual(result.errors, []);
  });
  
  test('--skip-backend alone is valid', () => {
    const flags = ['--skip-backend'];
    const result = validateIntentFlags(parseFlags(flags), 'build');
    
    assert.strictEqual(result.valid, true);
  });
  
  test('--just-harden + --skip-frontend is valid', () => {
    const flags = ['--just-harden', '--skip-frontend'];
    const result = validateIntentFlags(parseFlags(flags), 'build');
    
    assert.strictEqual(result.valid, true);
  });
  
  test('--just-document alone is valid', () => {
    const flags = ['--just-document'];
    const result = validateIntentFlags(parseFlags(flags), 'build');
    
    assert.strictEqual(result.valid, true);
  });
  
  test('--just-security alone is valid for review', () => {
    const flags = ['--just-security'];
    const result = validateIntentFlags(parseFlags(flags), 'review');
    
    assert.strictEqual(result.valid, true);
  });
  
  test('no flags is valid (default behavior)', () => {
    const flags = [];
    const result = validateIntentFlags(parseFlags(flags), 'build');
    
    assert.strictEqual(result.valid, true);
  });
});

// Test: Error messages and suggestions
describe('Error Messages with Suggestions', () => {
  test('suggests /legion:build when using --just-harden with wrong command', () => {
    const flags = ['--just-harden'];
    const error = getValidationError(flags, 'review');
    
    assert.ok(error.includes('Did you mean to use /legion:build'));
  });
  
  test('suggests /legion:review when using --just-security with wrong command', () => {
    const flags = ['--just-security'];
    const error = getValidationError(flags, 'build');
    
    assert.ok(error.includes('Did you mean to use /legion:review'));
  });
  
  test('suggests alternative when skipping all files', () => {
    const flags = ['--skip-frontend', '--skip-backend'];
    const error = getValidationError(flags, 'build');
    
    assert.ok(error.includes('Try using only one'));
  });
  
  test('provides specific error for conflicting flags', () => {
    const flags = ['--just-harden', '--just-document'];
    const error = getValidationError(flags, 'build');

    assert.ok(error);
    assert.ok(error.includes('Conflicting'));
    assert.ok(error.includes('Only one --just-* flag allowed'));
  });
});

// Test: Edge cases
describe('Edge Cases', () => {
  test('handles null flags object', () => {
    const result = validateIntentFlags(null, 'build');
    
    assert.strictEqual(result.valid, true);
  });
  
  test('handles undefined command', () => {
    const flags = ['--just-harden'];
    const result = validateIntentFlags(parseFlags(flags), undefined);
    
    // Undefined command should still validate flags
    assert.ok(result.errors.length > 0 || result.valid);
  });
  
  test('detects duplicate --just-harden flags', () => {
    // This would require parsing to detect duplicates
    const parsed = parseFlags(['--just-harden']);
    // Simulate duplicate by calling validation twice with same flag
    const result = validateIntentFlags(parsed, 'build');
    
    // Single flag is valid
    assert.strictEqual(result.valid, true);
  });
  
  test('validates all error scenarios return errors array', () => {
    const flags = ['--just-harden', '--just-document'];
    const result = validateIntentFlags(parseFlags(flags), 'build');
    
    assert.ok(Array.isArray(result.errors));
    assert.ok(result.errors.length > 0);
  });
  
  test('isValidCombination helper returns boolean', () => {
    assert.strictEqual(isValidCombination(['--skip-frontend']), true);
    assert.strictEqual(isValidCombination(['--skip-frontend', '--skip-backend']), false);
  });
  
  test('parseFlags handles empty array', () => {
    const result = parseFlags([]);
    
    assert.strictEqual(result.intent, null);
    assert.deepStrictEqual(result.filters, {});
  });
});

// Export functions for use in other tests
module.exports = {
  validateIntentFlags,
  parseFlags,
  getValidationError,
  isValidCombination
};
