import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Fixture validation tests.
 *
 * Ensures that all .elo fixture files follow the required format:
 * - Every line must be an assert() call (for effective acceptance testing)
 * - Empty lines and comments are allowed
 */

const TEST_DIR = join(__dirname, '../../../test/fixtures');

// Files that are exempt from the assert requirement
// (e.g., testing functions that always throw)
const EXEMPT_FILES = ['fail.elo'];

describe('Fixture validation', () => {
  const files = readdirSync(TEST_DIR).filter(f => f.endsWith('.elo'));

  for (const file of files) {
    if (EXEMPT_FILES.includes(file)) {
      continue;
    }

    it(`${file} should have assert() on every line`, () => {
      const content = readFileSync(join(TEST_DIR, file), 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines and comments
        if (line === '' || line.startsWith('#')) {
          continue;
        }

        // Every non-empty, non-comment line must start with assert( or assertFails(
        assert.ok(
          line.startsWith('assert(') || line.startsWith('assertFails('),
          `Line ${i + 1} in ${file} must be an assert() or assertFails() call, got: "${line.substring(0, 50)}..."`
        );
      }
    });
  }
});
