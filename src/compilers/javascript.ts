import { Expr } from '../ast';

/**
 * JavaScript compilation options
 */
export interface JavaScriptCompileOptions {
  // Reserved for future options
}

/**
 * Compiles Klang expressions to JavaScript code
 * Uses dayjs for temporal operations
 */
export function compileToJavaScript(expr: Expr, options?: JavaScriptCompileOptions): string {
  switch (expr.type) {
    case 'literal':
      return expr.value.toString();

    case 'string':
      // Use JSON.stringify to handle escaping properly
      return JSON.stringify(expr.value);

    case 'date':
      return `dayjs('${expr.value}')`;

    case 'datetime':
      return `dayjs('${expr.value}')`;

    case 'duration':
      return `dayjs.duration('${expr.value}')`;

    case 'temporal_keyword': {
      switch (expr.keyword) {
        case 'NOW':
          return 'dayjs()';
        case 'TODAY':
          return "dayjs().startOf('day')";
        case 'TOMORROW':
          return "dayjs().startOf('day').add(1, 'day')";
        case 'YESTERDAY':
          return "dayjs().startOf('day').subtract(1, 'day')";
        case 'SOD':
          return "dayjs().startOf('day')";
        case 'EOD':
          return "dayjs().endOf('day')";
        case 'SOW':
          return "dayjs().startOf('isoWeek')";
        case 'EOW':
          return "dayjs().endOf('isoWeek')";
        case 'SOM':
          return "dayjs().startOf('month')";
        case 'EOM':
          return "dayjs().endOf('month')";
        case 'SOQ':
          return "dayjs().startOf('quarter')";
        case 'EOQ':
          return "dayjs().endOf('quarter')";
        case 'SOY':
          return "dayjs().startOf('year')";
        case 'EOY':
          return "dayjs().endOf('year')";
      }
    }

    case 'variable':
      return expr.name;

    case 'member_access': {
      const object = compileToJavaScript(expr.object, options);
      // Add parentheses around complex expressions to ensure proper precedence
      const objectExpr = (expr.object.type === 'binary' || expr.object.type === 'unary')
        ? `(${object})`
        : object;
      return `${objectExpr}.${expr.property}`;
    }

    case 'function_call': {
      const args = expr.args.map(arg => compileToJavaScript(arg, options));

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

    case 'unary': {
      const operand = compileToJavaScript(expr.operand, options);
      // Add parentheses around binary expressions to preserve precedence
      const operandExpr = expr.operand.type === 'binary' ? `(${operand})` : operand;
      return `${expr.operator}${operandExpr}`;
    }

    case 'binary': {
      const left = compileToJavaScript(expr.left, options);
      const right = compileToJavaScript(expr.right, options);

      // Use klang runtime helpers for arithmetic operators
      // This ensures correctness for all operand types and keeps K extensible
      // Type inference can optimize this later when we're 100% sure of operand types
      switch (expr.operator) {
        case '+':
          return `klang.add(${left}, ${right})`;
        case '-':
          return `klang.subtract(${left}, ${right})`;
        case '*':
          return `klang.multiply(${left}, ${right})`;
        case '/':
          return `klang.divide(${left}, ${right})`;
        case '%':
          return `klang.modulo(${left}, ${right})`;
        case '^':
          return `klang.power(${left}, ${right})`;
      }

      // Handle date/temporal equality/inequality comparisons using valueOf()
      // dayjs objects need valueOf() for proper comparison
      const isTemporalType = (type: string) =>
        type === 'date' || type === 'datetime' || type === 'temporal_keyword';
      if ((expr.operator === '==' || expr.operator === '!=') &&
          (isTemporalType(expr.left.type) || isTemporalType(expr.right.type))) {
        const op = expr.operator === '==' ? '===' : '!==';
        return `+${left} ${op} +${right}`;
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

    case 'let': {
      const params = expr.bindings.map(b => b.name).join(', ');
      const args = expr.bindings.map(b => compileToJavaScript(b.value, options)).join(', ');
      const body = compileToJavaScript(expr.body, options);
      return `((${params}) => ${body})(${args})`;
    }
  }
}

function needsParens(expr: Expr, parentOp: string, side: 'left' | 'right'): boolean {
  if (expr.type !== 'binary') return false;

  // Arithmetic operators are compiled as function calls (klang.add, klang.multiply, etc.)
  // Function calls don't need parentheses for precedence
  const arithmeticOps = ['+', '-', '*', '/', '%', '^'];
  if (arithmeticOps.includes(expr.operator)) {
    return false;
  }

  const precedence: Record<string, number> = {
    '||': 0,
    '&&': 1,
    '==': 2, '!=': 2,
    '<': 3, '>': 3, '<=': 3, '>=': 3,
  };

  const parentPrec = precedence[parentOp] || 0;
  const childPrec = precedence[expr.operator] || 0;

  // Lower precedence always needs parens
  if (childPrec < parentPrec) return true;

  return false;
}
