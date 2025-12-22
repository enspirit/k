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

    case 'variable':
      // In SQL context, variables are typically column names
      return expr.name;

    case 'unary': {
      const operand = compileToSQL(expr.operand);
      if (expr.operator === '!') {
        return `NOT ${operand}`;
      }
      return `${expr.operator}${operand}`;
    }

    case 'binary': {
      const left = compileToSQL(expr.left);
      const right = compileToSQL(expr.right);

      // Handle power operator - PostgreSQL uses POWER() function
      if (expr.operator === '^') {
        return `POWER(${left}, ${right})`;
      }

      // Convert logical operators to SQL syntax
      let sqlOp: string = expr.operator;
      if (expr.operator === '&&') {
        sqlOp = 'AND';
      } else if (expr.operator === '||') {
        sqlOp = 'OR';
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
