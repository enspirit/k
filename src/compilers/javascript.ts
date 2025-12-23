import { Expr } from '../ast';

/**
 * Compiles Klang expressions to JavaScript code
 */
export function compileToJavaScript(expr: Expr): string {
  switch (expr.type) {
    case 'literal':
      return expr.value.toString();

    case 'date':
      return `new Date('${expr.value}')`;

    case 'datetime':
      return `new Date('${expr.value}')`;

    case 'duration':
      // Duration as ISO8601 string - requires a library like dayjs or moment
      return `Duration.parse('${expr.value}')`;

    case 'variable':
      return expr.name;

    case 'function_call': {
      const args = expr.args.map(arg => compileToJavaScript(arg));

      // Built-in assert function
      if (expr.name === 'assert') {
        if (args.length < 1 || args.length > 2) {
          throw new Error('assert requires 1 or 2 arguments: assert(condition, message?)');
        }
        const condition = args[0];
        const message = args.length === 2 ? args[1] : '"Assertion failed"';
        return `(function() { if (!(${condition})) throw new Error(${message}); return true; })()`;
      }

      // Generic function call
      return `${expr.name}(${args.join(', ')})`;
    }

    case 'unary':
      return `${expr.operator}${compileToJavaScript(expr.operand)}`;

    case 'binary': {
      const left = compileToJavaScript(expr.left);
      const right = compileToJavaScript(expr.right);

      // Handle power operator specially
      if (expr.operator === '^') {
        return `Math.pow(${left}, ${right})`;
      }

      // Handle date + duration and date - duration
      if ((expr.operator === '+' || expr.operator === '-') &&
          (expr.left.type === 'date' || expr.left.type === 'datetime') &&
          expr.right.type === 'duration') {
        const method = expr.operator === '+' ? 'addTo' : 'subtractFrom';
        return `${right}.${method}(${left})`;
      }

      // Handle duration + date (commutative addition)
      if (expr.operator === '+' &&
          expr.left.type === 'duration' &&
          (expr.right.type === 'date' || expr.right.type === 'datetime')) {
        return `${left}.addTo(${right})`;
      }

      // Add parentheses for nested expressions to preserve precedence
      const leftExpr = needsParens(expr.left, expr.operator, 'left')
        ? `(${left})`
        : left;
      const rightExpr = needsParens(expr.right, expr.operator, 'right')
        ? `(${right})`
        : right;

      return `${leftExpr} ${expr.operator} ${rightExpr}`;
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
