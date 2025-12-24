import { Expr } from '../ast';

/**
 * SQL compilation options
 */
export interface SQLCompileOptions {
  /**
   * Temporal mode controls how temporal expressions are compiled:
   * - 'production': Uses native SQL constants (CURRENT_TIMESTAMP, CURRENT_DATE)
   * - 'testable': Uses klang_now()/klang_today() functions that can be overridden
   */
  temporalMode?: 'production' | 'testable';
}

/**
 * Temporal provider abstraction - returns SQL expressions for current time/date
 */
interface TemporalProvider {
  now(): string;
  today(): string;
}

const productionProvider: TemporalProvider = {
  now: () => 'CURRENT_TIMESTAMP',
  today: () => 'CURRENT_DATE',
};

const testableProvider: TemporalProvider = {
  now: () => 'klang_now()',
  today: () => 'klang_today()',
};

function getTemporalProvider(options?: SQLCompileOptions): TemporalProvider {
  const mode = options?.temporalMode ?? 'production';
  return mode === 'testable' ? testableProvider : productionProvider;
}

/**
 * Compiles Klang expressions to PostgreSQL SQL
 */
export function compileToSQL(expr: Expr, options?: SQLCompileOptions): string {
  const temporal = getTemporalProvider(options);
  switch (expr.type) {
    case 'literal':
      if (typeof expr.value === 'boolean') {
        return expr.value ? 'TRUE' : 'FALSE';
      }
      return expr.value.toString();

    case 'date':
      return `DATE '${expr.value}'`;

    case 'datetime':
      // Convert ISO8601 to PostgreSQL TIMESTAMP format
      // '2024-01-15T10:30:00Z' -> '2024-01-15 10:30:00'
      const formatted = expr.value.replace('T', ' ').replace('Z', '').split('.')[0];
      return `TIMESTAMP '${formatted}'`;

    case 'duration':
      // Convert ISO8601 duration to PostgreSQL INTERVAL
      return `INTERVAL '${expr.value}'`;

    case 'temporal_keyword':
      switch (expr.keyword) {
        case 'NOW':
          return temporal.now();
        case 'TODAY':
          return temporal.today();
        case 'TOMORROW':
          return `${temporal.today()} + INTERVAL '1 day'`;
        case 'YESTERDAY':
          return `${temporal.today()} - INTERVAL '1 day'`;
        case 'SOD':
          return `date_trunc('day', ${temporal.now()})`;
        case 'EOD':
          return `date_trunc('day', ${temporal.now()}) + INTERVAL '1 day' - INTERVAL '1 second'`;
        case 'SOW':
          return `date_trunc('week', ${temporal.today()})`;
        case 'EOW':
          return `date_trunc('week', ${temporal.today()}) + INTERVAL '6 days'`;
        case 'SOM':
          return `date_trunc('month', ${temporal.today()})`;
        case 'EOM':
          return `date_trunc('month', ${temporal.today()}) + INTERVAL '1 month' - INTERVAL '1 day'`;
        case 'SOQ':
          return `date_trunc('quarter', ${temporal.today()})`;
        case 'EOQ':
          return `date_trunc('quarter', ${temporal.today()}) + INTERVAL '3 months' - INTERVAL '1 day'`;
        case 'SOY':
          return `date_trunc('year', ${temporal.today()})`;
        case 'EOY':
          return `date_trunc('year', ${temporal.today()}) + INTERVAL '1 year' - INTERVAL '1 day'`;
      }

    case 'variable':
      // In SQL context, variables are typically column names
      return expr.name;

    case 'member_access': {
      const object = compileToSQL(expr.object, options);
      // Add parentheses around complex expressions to ensure proper precedence
      const objectExpr = (expr.object.type === 'binary' || expr.object.type === 'unary')
        ? `(${object})`
        : object;
      return `${objectExpr}.${expr.property}`;
    }

    case 'function_call': {
      const args = expr.args.map(arg => compileToSQL(arg, options));

      // Built-in assert function
      if (expr.name === 'assert') {
        if (args.length < 1 || args.length > 2) {
          throw new Error('assert requires 1 or 2 arguments: assert(condition, message?)');
        }
        const condition = args[0];
        const message = args.length === 2 ? args[1] : "'Assertion failed'";
        // Use CASE to check condition and return TRUE or raise error
        return `CASE WHEN ${condition} THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END`;
      }

      // Generic function call (uppercase function name for SQL)
      return `${expr.name.toUpperCase()}(${args.join(', ')})`;
    }

    case 'unary': {
      const operand = compileToSQL(expr.operand, options);
      // Add parentheses around binary expressions to preserve precedence
      const operandExpr = expr.operand.type === 'binary' ? `(${operand})` : operand;
      if (expr.operator === '!') {
        return `NOT ${operandExpr}`;
      }
      return `${expr.operator}${operandExpr}`;
    }

    case 'binary': {
      const left = compileToSQL(expr.left, options);
      const right = compileToSQL(expr.right, options);

      // Handle power operator - PostgreSQL uses POWER() function
      if (expr.operator === '^') {
        return `POWER(${left}, ${right})`;
      }

      // Convert operators to SQL syntax
      let sqlOp: string = expr.operator;
      if (expr.operator === '&&') {
        sqlOp = 'AND';
      } else if (expr.operator === '||') {
        sqlOp = 'OR';
      } else if (expr.operator === '==') {
        sqlOp = '=';
      } else if (expr.operator === '!=') {
        sqlOp = '<>';
      }

      // Add parentheses for nested expressions to preserve precedence
      const leftExpr = needsParens(expr.left, expr.operator, 'left')
        ? `(${left})`
        : left;
      const rightExpr = needsParens(expr.right, expr.operator, 'right')
        ? `(${right})`
        : right;

      return `${leftExpr} ${sqlOp} ${rightExpr}`;
    }

    case 'let': {
      const bindingCols = expr.bindings
        .map(b => `${compileToSQL(b.value, options)} AS ${b.name}`)
        .join(', ');
      const body = compileToSQL(expr.body, options);
      return `(SELECT ${body} FROM (SELECT ${bindingCols}) AS _let)`;
    }
  }
}

function needsParens(expr: Expr, parentOp: string, side: 'left' | 'right'): boolean {
  if (expr.type !== 'binary') return false;

  const precedence: Record<string, number> = {
    '||': 0,
    '&&': 1,
    '==': 2, '!=': 2,
    '<': 3, '>': 3, '<=': 3, '>=': 3,
    '+': 4, '-': 4,
    '*': 5, '/': 5, '%': 5,
    '^': 6
  };

  const parentPrec = precedence[parentOp] || 0;
  const childPrec = precedence[expr.operator] || 0;

  // Lower precedence always needs parens
  if (childPrec < parentPrec) return true;

  // Right side of certain operators needs parens if same precedence
  if (childPrec === parentPrec && side === 'right' && (parentOp === '-' || parentOp === '/')) {
    return true;
  }

  return false;
}
