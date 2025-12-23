import { describe, it, before } from 'node:test';
import { Client } from 'pg';
import { parse } from './parser';
import { compileToRuby } from './compilers/ruby';
import { compileToJavaScript } from './compilers/javascript';
import { compileToSQL } from './compilers/sql';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const RUBY_URL = 'http://localhost:3011';
const NODE_URL = 'http://localhost:3002';

// PostgreSQL client
let pgClient: Client;

before(async () => {
  // Wait for services to be ready
  await waitForServices();

  // Connect to PostgreSQL
  pgClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'klang',
    password: 'klang',
    database: 'klang'
  });
  await pgClient.connect();

  // Set timezone to UTC to ensure consistent date/time handling
  await pgClient.query("SET TIME ZONE 'UTC'");
});

async function waitForServices() {
  const maxAttempts = 30;
  const delay = 1000;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Check Ruby service
      const rubyResponse = await fetch(`${RUBY_URL}/health`);
      if (!rubyResponse.ok) throw new Error('Ruby not ready');

      // Check Node service
      const nodeResponse = await fetch(`${NODE_URL}/health`);
      if (!nodeResponse.ok) throw new Error('Node not ready');

      // Check PostgreSQL
      const testClient = new Client({
        host: 'localhost',
        port: 5432,
        user: 'klang',
        password: 'klang',
        database: 'klang'
      });
      await testClient.connect();
      await testClient.end();

      console.log('All services ready');
      return;
    } catch (e) {
      if (i === maxAttempts - 1) {
        throw new Error(`Services not ready after ${maxAttempts} attempts: ${e}`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function evaluateRuby(expression: string, variables: Record<string, any> = {}): Promise<any> {
  const response = await fetch(`${RUBY_URL}/eval`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression, variables })
  });

  const result = await response.json() as { success: boolean; result?: any; error?: string };
  if (!result.success) {
    throw new Error(`Ruby evaluation failed: ${result.error}`);
  }
  return result.result;
}

async function evaluateNode(expression: string, variables: Record<string, any> = {}): Promise<any> {
  const response = await fetch(`${NODE_URL}/eval`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression, variables })
  });

  const result = await response.json() as { success: boolean; result?: any; error?: string };
  if (!result.success) {
    throw new Error(`Node evaluation failed: ${result.error}`);
  }
  return result.result;
}

async function evaluateSQL(expression: string, variables: Record<string, any> = {}): Promise<any> {
  // Build SELECT query with variable bindings
  const paramNames = Object.keys(variables);
  const paramValues = Object.values(variables);

  let query: string;
  if (paramNames.length > 0) {
    // Cast parameters to their appropriate PostgreSQL types based on JavaScript types
    const bindings = paramNames.map((name, i) => {
      const value = paramValues[i];
      let cast = '';

      if (typeof value === 'number') {
        cast = Number.isInteger(value) ? '::integer' : '::numeric';
      } else if (typeof value === 'boolean') {
        cast = '::boolean';
      } else if (typeof value === 'string') {
        cast = '::text';
      }

      return `$${i + 1}${cast} AS ${name}`;
    }).join(', ');
    query = `SELECT ${expression} AS result FROM (SELECT ${bindings}) AS vars`;
  } else {
    query = `SELECT ${expression} AS result`;
  }

  const result = await pgClient.query(query, paramValues);
  return result.rows[0].result;
}

/**
 * Test a Klang assertion expression across all three runtimes.
 * The expression should be an assert() call that will throw/raise if it fails.
 * If all three runtimes evaluate without error, the test passes!
 */
async function testAssertion(
  assertExpr: string,
  variables: Record<string, any> = {},
  options: { skipSQL?: boolean } = {}
) {
  const ast = parse(assertExpr);

  const rubyCode = compileToRuby(ast);
  const jsCode = compileToJavaScript(ast);
  const sqlCode = compileToSQL(ast);

  // Evaluate in all three runtimes - if no error is thrown, test passes
  try {
    await evaluateRuby(rubyCode, variables);
  } catch (error) {
    throw new Error(`Ruby assertion failed for "${assertExpr}": ${error}`);
  }

  try {
    await evaluateNode(jsCode, variables);
  } catch (error) {
    throw new Error(`Node assertion failed for "${assertExpr}": ${error}`);
  }

  if (!options.skipSQL) {
    try {
      await evaluateSQL(sqlCode, variables);
    } catch (error) {
      console.error(sqlCode, error);
      throw new Error(`SQL assertion failed for "${assertExpr}": ${error}`);
    }
  }
}

// Load test suites from the test directory
const TEST_DIR = join(__dirname, '../../test');

interface TestSuite {
  name: string;
  assertions: string[];
}

function loadTestSuites(): TestSuite[] {
  const suites: TestSuite[] = [];
  const files = readdirSync(TEST_DIR);
  const klangFiles = files.filter(f => f.endsWith('.klang'));

  for (const klangFile of klangFiles) {
    const name = klangFile.replace('.klang', '');
    const klangPath = join(TEST_DIR, klangFile);

    const klangContent = readFileSync(klangPath, 'utf-8');
    const assertions = klangContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    suites.push({ name, assertions });
  }

  return suites;
}

// Generate test suites dynamically from files
const testSuites = loadTestSuites();

// Tests that need variables or special handling - skip for now
const SKIP_SUITES = new Set(['variables', 'member-access']);

// Suites that need to skip SQL evaluation (e.g., duration arithmetic not supported in SQL)
const SKIP_SQL_SUITES = new Set(['temporal-duration']);

for (const suite of testSuites) {
  if (SKIP_SUITES.has(suite.name)) {
    continue;
  }

  const skipSQL = SKIP_SQL_SUITES.has(suite.name);

  describe(`Acceptance - ${suite.name}`, () => {
    for (let i = 0; i < suite.assertions.length; i++) {
      const assertion = suite.assertions[i];
      it(`should evaluate line ${i + 1}: ${assertion}`, async () => {
        await testAssertion(assertion, {}, skipSQL ? { skipSQL: true } : {});
      });
    }
  });
}

// Keep only tests that truly need variables passed in

describe('Acceptance Tests - Variables', () => {
  it('should handle numeric variables', async () => {
    await testAssertion('assert(x * 2 + y == 13)', { x: 5, y: 3 });
  });

  it('should handle boolean variables', async () => {
    await testAssertion('assert(isActive && hasPermission)', { isActive: true, hasPermission: true });
  });

  it('should handle mixed variable types', async () => {
    await testAssertion('assert(age >= 18 && isActive)', { age: 25, isActive: true });
  });
});

describe('Acceptance Tests - Member Access', () => {
  it('should access object property', async () => {
    await testAssertion('assert(person.age == 25)', {
      person: { age: 25, name: 'Alice' }
    }, { skipSQL: true });
  });

  it('should access nested property', async () => {
    await testAssertion('assert(user.profile.score == 100)', {
      user: { profile: { score: 100 } }
    }, { skipSQL: true });
  });

  it('should use member access in comparison', async () => {
    await testAssertion('assert(person.age > 18)', {
      person: { age: 25 }
    }, { skipSQL: true });
  });

  it('should use member access in arithmetic', async () => {
    await testAssertion('assert(person.age + 5 == 30)', {
      person: { age: 25 }
    }, { skipSQL: true });
  });

  it('should use multiple member accesses', async () => {
    await testAssertion('assert(person1.age > person2.age)', {
      person1: { age: 30 },
      person2: { age: 25 }
    }, { skipSQL: true });
  });

  it('should use member access with boolean property', async () => {
    await testAssertion('assert(user.active)', {
      user: { active: true }
    }, { skipSQL: true });
  });

  it('should use member access in complex expression', async () => {
    await testAssertion('assert(person.age >= 18 && person.active)', {
      person: { age: 25, active: true }
    }, { skipSQL: true });
  });
});
