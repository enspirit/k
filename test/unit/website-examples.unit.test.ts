import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from '../../src/parser';

/**
 * This test ensures that all code examples on the website actually compile.
 * It extracts example-code blocks from .astro pages and tries to parse them.
 * It also validates the EXAMPLES constant in the playground controller.
 */

const webDir = path.join(process.cwd(), 'web/src');

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(webDir, relativePath), 'utf-8');
}

/**
 * Extract example code blocks from an Astro page.
 * Matches content inside <pre class="example-code">...</pre> or <code class="example-code">...</code>
 */
function extractExamples(content: string): { code: string; line: number }[] {
  const examples: { code: string; line: number }[] = [];

  // Match both <pre class="example-code"> and <code class="example-code">
  const regex = /<(?:pre|code)[^>]*class="example-code"[^>]*>([^<]+)<\/(?:pre|code)>/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    let code = match[1];
    // Calculate line number by counting newlines before this match
    const beforeMatch = content.slice(0, match.index);
    const line = (beforeMatch.match(/\n/g) || []).length + 1;

    // Strip Astro template literal wrapper {`...`} if present
    if (code.startsWith('{`') && code.endsWith('`}')) {
      code = code.slice(2, -2);
    }

    // Decode HTML entities
    const decoded = code
      .replace(/&#123;/g, '{')
      .replace(/&#125;/g, '}')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    examples.push({ code: decoded, line });
  }

  return examples;
}

/**
 * Check if an example should be skipped (e.g., contains ??? placeholders)
 */
function shouldSkip(code: string): boolean {
  // Skip exercise templates with ??? placeholders
  if (code.includes('???')) return true;
  return false;
}

/**
 * Extract EXAMPLES constant from playground_controller.ts
 * Returns a map of example name to code
 */
function extractPlaygroundExamples(content: string): Map<string, string> {
  const examples = new Map<string, string>();

  // Match the EXAMPLES constant object
  const examplesMatch = content.match(/const EXAMPLES:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\n\};/);
  if (!examplesMatch) return examples;

  const examplesContent = examplesMatch[1];

  // Match each key: `value` pair (backtick strings)
  const entryRegex = /'([^']+)':\s*`([^`]+)`/g;
  let match;

  while ((match = entryRegex.exec(examplesContent)) !== null) {
    const name = match[1];
    const code = match[2];
    examples.set(name, code);
  }

  return examples;
}

describe('Website Example Validation', () => {

  describe('learn.astro examples', () => {
    const learnContent = readFile('pages/learn.astro');
    const examples = extractExamples(learnContent);

    for (const { code, line } of examples) {
      if (shouldSkip(code)) continue;

      it(`line ${line}: ${code.slice(0, 50).replace(/\n/g, ' ')}...`, () => {
        try {
          parse(code);
        } catch (e) {
          const error = e as Error;
          assert.fail(
            `Example at line ${line} failed to parse:\n` +
            `Code: ${code}\n` +
            `Error: ${error.message}`
          );
        }
      });
    }
  });

  describe('reference.astro examples', () => {
    const referenceContent = readFile('pages/reference.astro');
    const examples = extractExamples(referenceContent);

    for (const { code, line } of examples) {
      if (shouldSkip(code)) continue;

      it(`line ${line}: ${code.slice(0, 50).replace(/\n/g, ' ')}...`, () => {
        try {
          parse(code);
        } catch (e) {
          const error = e as Error;
          assert.fail(
            `Example at line ${line} failed to parse:\n` +
            `Code: ${code}\n` +
            `Error: ${error.message}`
          );
        }
      });
    }
  });

  describe('stdlib.astro examples', () => {
    const stdlibContent = readFile('pages/stdlib.astro');
    const examples = extractExamples(stdlibContent);

    for (const { code, line } of examples) {
      if (shouldSkip(code)) continue;

      it(`line ${line}: ${code.slice(0, 50).replace(/\n/g, ' ')}...`, () => {
        try {
          parse(code);
        } catch (e) {
          const error = e as Error;
          assert.fail(
            `Example at line ${line} failed to parse:\n` +
            `Code: ${code}\n` +
            `Error: ${error.message}`
          );
        }
      });
    }
  });

  describe('index.astro examples', () => {
    const indexContent = readFile('pages/index.astro');
    const examples = extractExamples(indexContent);

    for (const { code, line } of examples) {
      if (shouldSkip(code)) continue;

      it(`line ${line}: ${code.slice(0, 50).replace(/\n/g, ' ')}...`, () => {
        try {
          parse(code);
        } catch (e) {
          const error = e as Error;
          assert.fail(
            `Example at line ${line} failed to parse:\n` +
            `Code: ${code}\n` +
            `Error: ${error.message}`
          );
        }
      });
    }
  });

  describe('playground_controller.ts examples', () => {
    const controllerContent = readFile('scripts/controllers/playground_controller.ts');
    const examples = extractPlaygroundExamples(controllerContent);

    for (const [name, code] of examples) {
      it(`example "${name}"`, () => {
        // Strip comment lines for parsing (comments start with #)
        const codeWithoutComments = code
          .split('\n')
          .filter(line => !line.trim().startsWith('#'))
          .join('\n')
          .trim();

        try {
          parse(codeWithoutComments);
        } catch (e) {
          const error = e as Error;
          assert.fail(
            `Playground example "${name}" failed to parse:\n` +
            `Code: ${code}\n` +
            `Error: ${error.message}`
          );
        }
      });
    }
  });
});
