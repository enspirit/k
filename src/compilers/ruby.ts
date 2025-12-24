import { Expr } from '../ast';

/**
 * Ruby compilation options
 */
export interface RubyCompileOptions {
  /**
   * Temporal mode controls how temporal expressions are compiled:
   * - 'production': Uses native Ruby methods (DateTime.now, Date.today)
   * - 'testable': Uses Klang.now/Klang.today methods that can be overridden
   */
  temporalMode?: 'production' | 'testable';
}

/**
 * Temporal provider abstraction - returns Ruby expressions for current time/date
 */
interface TemporalProvider {
  now(): string;
  today(): string;
}

const productionProvider: TemporalProvider = {
  now: () => 'DateTime.now',
  today: () => 'Date.today',
};

const testableProvider: TemporalProvider = {
  now: () => 'Klang.now',
  today: () => 'Klang.today',
};

function getTemporalProvider(options?: RubyCompileOptions): TemporalProvider {
  const mode = options?.temporalMode ?? 'production';
  return mode === 'testable' ? testableProvider : productionProvider;
}

/**
 * Compiles Klang expressions to Ruby code
 */
export function compileToRuby(expr: Expr, options?: RubyCompileOptions): string {
  const temporal = getTemporalProvider(options);
  switch (expr.type) {
    case 'literal':
      return expr.value.toString();

    case 'string':
      // Ruby double-quoted strings: escape backslash and double quote
      const escaped = expr.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `"${escaped}"`;

    case 'date':
      return `Date.parse('${expr.value}')`;

    case 'datetime':
      return `DateTime.parse('${expr.value}')`;

    case 'duration':
      return `ActiveSupport::Duration.parse('${expr.value}')`;

    case 'temporal_keyword': {
      const mode = options?.temporalMode ?? 'production';
      switch (expr.keyword) {
        case 'NOW':
          return temporal.now();
        case 'TODAY':
          return temporal.today();
        case 'TOMORROW':
          return `${temporal.today()} + 1`;
        case 'YESTERDAY':
          return `${temporal.today()} - 1`;
        case 'SOD':
          return mode === 'testable' ? `${temporal.today()}.beginning_of_day` : 'Date.today.beginning_of_day';
        case 'EOD':
          return mode === 'testable' ? `${temporal.today()}.end_of_day` : 'Date.today.end_of_day';
        case 'SOW':
          return mode === 'testable' ? `${temporal.today()}.beginning_of_week` : 'Date.today.beginning_of_week';
        case 'EOW':
          return mode === 'testable' ? `${temporal.today()}.end_of_week` : 'Date.today.end_of_week';
        case 'SOM':
          return mode === 'testable' ? `${temporal.today()}.beginning_of_month` : 'Date.today.beginning_of_month';
        case 'EOM':
          return mode === 'testable' ? `${temporal.today()}.end_of_month` : 'Date.today.end_of_month';
        case 'SOQ':
          return mode === 'testable' ? `${temporal.today()}.beginning_of_quarter` : 'Date.today.beginning_of_quarter';
        case 'EOQ':
          return mode === 'testable' ? `${temporal.today()}.end_of_quarter` : 'Date.today.end_of_quarter';
        case 'SOY':
          return mode === 'testable' ? `${temporal.today()}.beginning_of_year` : 'Date.today.beginning_of_year';
        case 'EOY':
          return mode === 'testable' ? `${temporal.today()}.end_of_year` : 'Date.today.end_of_year';
      }
    }

    case 'variable':
      return expr.name;

    case 'member_access': {
      const object = compileToRuby(expr.object, options);
      // Add parentheses around complex expressions to ensure proper precedence
      const objectExpr = (expr.object.type === 'binary' || expr.object.type === 'unary')
        ? `(${object})`
        : object;
      return `${objectExpr}[:${expr.property}]`;
    }

    case 'function_call': {
      const args = expr.args.map(arg => compileToRuby(arg, options));

      // Built-in assert function
      if (expr.name === 'assert') {
        if (args.length < 1 || args.length > 2) {
          throw new Error('assert requires 1 or 2 arguments: assert(condition, message?)');
        }
        const condition = args[0];
        const message = args.length === 2 ? args[1] : '"Assertion failed"';
        return `(raise ${message} unless ${condition}; true)`;
      }

      // Generic function call
      return `${expr.name}(${args.join(', ')})`;
    }

    case 'unary': {
      const operand = compileToRuby(expr.operand, options);
      // Add parentheses around binary expressions to preserve precedence
      const operandExpr = expr.operand.type === 'binary' ? `(${operand})` : operand;
      return `${expr.operator}${operandExpr}`;
    }

    case 'binary': {
      const left = compileToRuby(expr.left, options);
      const right = compileToRuby(expr.right, options);
      const op = expr.operator === '^' ? '**' : expr.operator;

      // Add parentheses for nested expressions to preserve precedence
      const leftExpr = needsParens(expr.left, expr.operator, 'left')
        ? `(${left})`
        : left;
      const rightExpr = needsParens(expr.right, expr.operator, 'right')
        ? `(${right})`
        : right;

      return `${leftExpr} ${op} ${rightExpr}`;
    }

    case 'let': {
      const params = expr.bindings.map(b => b.name).join(', ');
      const args = expr.bindings.map(b => compileToRuby(b.value, options)).join(', ');
      const body = compileToRuby(expr.body, options);
      return `->(${params}) { ${body} }.call(${args})`;
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
    '^': 6, '**': 6
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
