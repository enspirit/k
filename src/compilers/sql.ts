import { Expr } from '../ast';

/**
 * Compiles Klang expressions to PostgreSQL SQL
 */
export function compileToSQL(expr: Expr): string {
  switch (expr.type) {
    case 'literal':
      if (typeof expr.value === 'boolean') {
        return expr.value ? 'TRUE' : 'FALSE';
      }
      return expr.value.toString();

    case 'date':
      return `DATE '${expr.value}'`;

    case 'datetime':
      // Convert ISO8601 to PostgreSQL TIMESTAMP WITH TIME ZONE in UTC
      return `TIMESTAMP WITH TIME ZONE '${expr.value}'`;

    case 'duration':
      // Convert ISO8601 duration to PostgreSQL INTERVAL
      return `INTERVAL '${expr.value}'`;

    case 'variable':
      // In SQL context, variables are typically column names
      return expr.name;

    case 'function_call': {
      const args = expr.args.map(arg => compileToSQL(arg));

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
      const operand = compileToSQL(expr.operand);
      // Add parentheses around binary expressions to preserve precedence
      const operandExpr = expr.operand.type === 'binary' ? `(${operand})` : operand;
      if (expr.operator === '!') {
        return `NOT ${operandExpr}`;
      }
      return `${expr.operator}${operandExpr}`;
    }

    case 'binary': {
      const left = compileToSQL(expr.left);
      const right = compileToSQL(expr.right);

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
