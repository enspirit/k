import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from 'pg';
import { parse } from './parser';
import { compileToRuby } from './compilers/ruby';
import { compileToJavaScript } from './compilers/javascript';
import { compileToSQL } from './compilers/sql';

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
      throw new Error(`SQL assertion failed for "${assertExpr}": ${error}`);
    }
  }
}

describe('Acceptance Tests - Arithmetic', () => {
  it('should evaluate simple addition', async () => {
    await testAssertion('assert(2 + 3 == 5)');
  });

  it('should evaluate complex arithmetic', async () => {
    await testAssertion('assert(2 + 3 * 4 == 14)');
  });

  it('should evaluate with parentheses', async () => {
    await testAssertion('assert((2 + 3) * 4 == 20)');
  });

  it('should evaluate power operator', async () => {
    await testAssertion('assert(2 ^ 3 == 8)');
  });

  it('should evaluate modulo', async () => {
    await testAssertion('assert(10 % 3 == 1)');
  });

  it('should evaluate with variables', async () => {
    await testAssertion('assert(x + y * 2 == 11)', { x: 5, y: 3 });
  });

  it('should evaluate negative numbers', async () => {
    await testAssertion('assert(-5 + 3 == -2)');
  });
});

describe('Acceptance Tests - Boolean', () => {
  it('should evaluate boolean literals', async () => {
    await testAssertion('assert(true)');
    await testAssertion('assert(!false)');
  });

  it('should evaluate comparisons', async () => {
    await testAssertion('assert(5 > 3)');
    await testAssertion('assert(!(5 < 3))');
    await testAssertion('assert(5 >= 5)');
    await testAssertion('assert(!(5 <= 4))');
  });

  it('should evaluate equality', async () => {
    await testAssertion('assert(5 == 5)');
    await testAssertion('assert(5 != 3)');
  });

  it('should evaluate logical AND', async () => {
    await testAssertion('assert(true && true)');
    await testAssertion('assert(!(true && false))');
  });

  it('should evaluate logical OR', async () => {
    await testAssertion('assert(false || true)');
    await testAssertion('assert(!(false || false))');
  });

  it('should evaluate logical NOT', async () => {
    await testAssertion('assert(!true == false)');
    await testAssertion('assert(!false == true)');
  });

  it('should evaluate complex boolean expressions', async () => {
    await testAssertion('assert((5 > 3) && (2 < 4))');
    await testAssertion('assert((5 < 3) || (2 == 2))');
  });
});

describe('Acceptance Tests - Temporal', () => {
  it('should compare dates', async () => {
    await testAssertion('assert(d"2024-01-15" > d"2024-01-10")');
    await testAssertion('assert(!(d"2024-01-15" < d"2024-01-10"))');
    await testAssertion('assert(d"2024-01-15" >= d"2024-01-15")');
    await testAssertion('assert(d"2024-01-15" <= d"2024-01-15")');
  });

  it('should compare datetimes', async () => {
    await testAssertion('assert(dt"2024-01-15T10:30:00Z" > dt"2024-01-15T09:00:00Z")');
    await testAssertion('assert(dt"2024-01-15T10:30:00Z" < dt"2024-01-15T11:00:00Z")');
    await testAssertion('assert(dt"2024-01-15T10:30:00Z" >= dt"2024-01-15T10:30:00Z")');
  });

  it('should add duration to date', async () => {
    await testAssertion('assert(d"2024-01-15" + P1D > d"2024-01-15")', {}, { skipSQL: true });
    await testAssertion('assert(d"2024-01-15" + P1D < d"2024-01-17")', {}, { skipSQL: true });
  });

  it('should subtract duration from date', async () => {
    await testAssertion('assert(d"2024-01-15" - P1D < d"2024-01-15")', {}, { skipSQL: true });
    await testAssertion('assert(d"2024-01-15" - P1D > d"2024-01-13")', {}, { skipSQL: true });
  });
});

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
