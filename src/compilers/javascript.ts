import { Expr } from '../ast';
import { IRExpr, IRCall } from '../ir';
import { transform } from '../transform';

/**
 * JavaScript compilation options
 */
export interface JavaScriptCompileOptions {
  // Reserved for future options
}

/**
 * Compiles Klang expressions to JavaScript code
 * Uses dayjs for temporal operations
 *
 * This compiler works in two phases:
 * 1. Transform AST to typed IR
 * 2. Emit JavaScript from IR
 */
export function compileToJavaScript(expr: Expr, options?: JavaScriptCompileOptions): string {
  const ir = transform(expr);
  return emitJS(ir);
}

/**
 * JavaScript operator precedence (higher = binds tighter)
 */
const JS_PRECEDENCE: Record<string, number> = {
  '||': 1,
  '&&': 2,
  '==': 3, '!=': 3,
  '<': 4, '>': 4, '<=': 4, '>=': 4,
  '+': 5, '-': 5,
  '*': 6, '/': 6, '%': 6,
  // Power uses Math.pow() so doesn't need precedence handling
};

/**
 * Get the JavaScript operator for an IR function name
 */
function getJSOperator(fn: string): string | null {
  if (fn.startsWith('add_')) return '+';
  if (fn.startsWith('sub_')) return '-';
  if (fn.startsWith('mul_')) return '*';
  if (fn.startsWith('div_')) return '/';
  if (fn.startsWith('mod_')) return '%';
  if (fn.startsWith('lt_')) return '<';
  if (fn.startsWith('gt_')) return '>';
  if (fn.startsWith('lte_')) return '<=';
  if (fn.startsWith('gte_')) return '>=';
  if (fn.startsWith('eq_')) return '==';
  if (fn.startsWith('neq_')) return '!=';
  if (fn.startsWith('and_')) return '&&';
  if (fn.startsWith('or_')) return '||';
  return null;
}

/**
 * Check if a call will be emitted as a native JS binary operator
 */
function isNativeArithmetic(fn: string): boolean {
  const numericFns = [
    'add_int_int', 'add_float_float', 'add_int_float', 'add_float_int', 'add_string_string',
    'sub_int_int', 'sub_float_float', 'sub_int_float', 'sub_float_int',
    'mul_int_int', 'mul_float_float', 'mul_int_float', 'mul_float_int',
    'div_int_int', 'div_float_float', 'div_int_float', 'div_float_int',
    'mod_int_int', 'mod_float_float', 'mod_int_float', 'mod_float_int',
  ];
  return numericFns.includes(fn);
}

/**
 * Check if a call will be emitted as any native JS binary operator
 */
function isNativeBinaryOp(fn: string): boolean {
  // Arithmetic
  if (isNativeArithmetic(fn)) return true;
  // Comparisons
  if (fn.startsWith('lt_') || fn.startsWith('gt_') ||
      fn.startsWith('lte_') || fn.startsWith('gte_') ||
      fn.startsWith('eq_') || fn.startsWith('neq_')) return true;
  // Logical
  if (fn.startsWith('and_') || fn.startsWith('or_')) return true;
  return false;
}

/**
 * Check if an IR expression needs parentheses when used as child of a binary op
 */
function needsParens(child: IRExpr, parentOp: string, side: 'left' | 'right'): boolean {
  if (child.type !== 'call') return false;

  const childOp = getJSOperator(child.fn);
  if (!childOp) return false;

  // Check if this child will be emitted as native JS
  if (!isNativeArithmetic(child.fn) &&
      !child.fn.startsWith('lt_') && !child.fn.startsWith('gt_') &&
      !child.fn.startsWith('lte_') && !child.fn.startsWith('gte_') &&
      !child.fn.startsWith('eq_') && !child.fn.startsWith('neq_') &&
      !child.fn.startsWith('and_') && !child.fn.startsWith('or_')) {
    return false;
  }

  const parentPrec = JS_PRECEDENCE[parentOp] || 0;
  const childPrec = JS_PRECEDENCE[childOp] || 0;

  // Lower precedence child needs parens
  if (childPrec < parentPrec) return true;

  // Same precedence on right side needs parens for left-associative ops
  // (to preserve evaluation order)
  if (childPrec === parentPrec && side === 'right') {
    // Most operators are left-associative
    return true;
  }

  return false;
}

/**
 * Emit JavaScript code from IR
 */
function emitJS(ir: IRExpr): string {
  switch (ir.type) {
    case 'int_literal':
    case 'float_literal':
      return ir.value.toString();

    case 'bool_literal':
      return ir.value.toString();

    case 'string_literal':
      return JSON.stringify(ir.value);

    case 'date_literal':
      return `dayjs('${ir.value}')`;

    case 'datetime_literal':
      return `dayjs('${ir.value}')`;

    case 'duration_literal':
      return `dayjs.duration('${ir.value}')`;

    case 'variable':
      return ir.name;

    case 'member_access': {
      const object = emitJS(ir.object);
      const needsParensForMember = ir.object.type === 'call';
      const objectExpr = needsParensForMember ? `(${object})` : object;
      return `${objectExpr}.${ir.property}`;
    }

    case 'let': {
      const params = ir.bindings.map(b => b.name).join(', ');
      const args = ir.bindings.map(b => emitJS(b.value)).join(', ');
      const body = emitJS(ir.body);
      return `((${params}) => ${body})(${args})`;
    }

    case 'call':
      return emitCall(ir.fn, ir.args, ir);
  }
}

/**
 * Emit a child expression, adding parens if needed for precedence
 */
function emitChildWithParens(child: IRExpr, parentOp: string, side: 'left' | 'right'): string {
  const emitted = emitJS(child);
  if (needsParens(child, parentOp, side)) {
    return `(${emitted})`;
  }
  return emitted;
}

/**
 * Emit a function call
 * Maps IR function names to JavaScript implementations
 */
function emitCall(fn: string, args: IRExpr[], _ir: IRCall): string {
  // Handle built-in assert
  if (fn === 'assert') {
    const emittedArgs = args.map(emitJS);
    if (emittedArgs.length < 1 || emittedArgs.length > 2) {
      throw new Error('assert requires 1 or 2 arguments: assert(condition, message?)');
    }
    const condition = emittedArgs[0];
    const message = emittedArgs.length === 2 ? emittedArgs[1] : '"Assertion failed"';
    return `(function() { if (!(${condition})) throw new Error(${message}); return true; })()`;
  }

  // Temporal nullary functions
  if (fn === 'today') {
    return "dayjs().startOf('day')";
  }
  if (fn === 'now') {
    return 'dayjs()';
  }

  // Temporal period boundary functions
  const periodBoundaryMap: Record<string, string> = {
    'start_of_day': "startOf('day')",
    'end_of_day': "endOf('day')",
    'start_of_week': "startOf('isoWeek')",
    'end_of_week': "endOf('isoWeek')",
    'start_of_month': "startOf('month')",
    'end_of_month': "endOf('month')",
    'start_of_quarter': "startOf('quarter')",
    'end_of_quarter': "endOf('quarter')",
    'start_of_year': "startOf('year')",
    'end_of_year': "endOf('year')",
  };
  if (fn in periodBoundaryMap) {
    return `${emitJS(args[0])}.${periodBoundaryMap[fn]}`;
  }

  // Binary arithmetic operators
  // Check for typed versions first, then fall back to runtime helpers

  // Addition
  if (fn.startsWith('add_')) {
    // Native JS addition for int/float/string combinations
    if (fn === 'add_int_int' || fn === 'add_float_float' ||
        fn === 'add_int_float' || fn === 'add_float_int' ||
        fn === 'add_string_string') {
      const left = emitChildWithParens(args[0], '+', 'left');
      const right = emitChildWithParens(args[1], '+', 'right');
      return `${left} + ${right}`;
    }
    // dayjs addition for temporal types
    if (fn === 'add_date_duration' || fn === 'add_datetime_duration') {
      return `${emitJS(args[0])}.add(${emitJS(args[1])})`;
    }
    if (fn === 'add_duration_date' || fn === 'add_duration_datetime') {
      return `${emitJS(args[1])}.add(${emitJS(args[0])})`;
    }
    if (fn === 'add_duration_duration') {
      return `${emitJS(args[0])}.add(${emitJS(args[1])})`;
    }
    // Fallback to runtime helper
    return `klang.add(${emitJS(args[0])}, ${emitJS(args[1])})`;
  }

  // Subtraction
  if (fn.startsWith('sub_')) {
    if (fn === 'sub_int_int' || fn === 'sub_float_float' ||
        fn === 'sub_int_float' || fn === 'sub_float_int') {
      const left = emitChildWithParens(args[0], '-', 'left');
      const right = emitChildWithParens(args[1], '-', 'right');
      return `${left} - ${right}`;
    }
    if (fn === 'sub_date_duration' || fn === 'sub_datetime_duration') {
      return `${emitJS(args[0])}.subtract(${emitJS(args[1])})`;
    }
    return `klang.subtract(${emitJS(args[0])}, ${emitJS(args[1])})`;
  }

  // Multiplication
  if (fn.startsWith('mul_')) {
    if (fn === 'mul_int_int' || fn === 'mul_float_float' ||
        fn === 'mul_int_float' || fn === 'mul_float_int') {
      const left = emitChildWithParens(args[0], '*', 'left');
      const right = emitChildWithParens(args[1], '*', 'right');
      return `${left} * ${right}`;
    }
    // Duration scaling: n * duration or duration * n
    if (fn === 'mul_int_duration' || fn === 'mul_float_duration') {
      const scalar = emitJS(args[0]);
      const dur = emitJS(args[1]);
      return `dayjs.duration(${dur}.asMilliseconds() * ${scalar})`;
    }
    if (fn === 'mul_duration_int' || fn === 'mul_duration_float') {
      const dur = emitJS(args[0]);
      const scalar = emitJS(args[1]);
      return `dayjs.duration(${dur}.asMilliseconds() * ${scalar})`;
    }
    return `klang.multiply(${emitJS(args[0])}, ${emitJS(args[1])})`;
  }

  // Division
  if (fn.startsWith('div_')) {
    if (fn === 'div_int_int' || fn === 'div_float_float' ||
        fn === 'div_int_float' || fn === 'div_float_int') {
      const left = emitChildWithParens(args[0], '/', 'left');
      const right = emitChildWithParens(args[1], '/', 'right');
      return `${left} / ${right}`;
    }
    // Duration division: duration / n
    if (fn === 'div_duration_int' || fn === 'div_duration_float') {
      const dur = emitJS(args[0]);
      const scalar = emitJS(args[1]);
      return `dayjs.duration(${dur}.asMilliseconds() / ${scalar})`;
    }
    return `klang.divide(${emitJS(args[0])}, ${emitJS(args[1])})`;
  }

  // Modulo
  if (fn.startsWith('mod_')) {
    if (fn === 'mod_int_int' || fn === 'mod_float_float' ||
        fn === 'mod_int_float' || fn === 'mod_float_int') {
      const left = emitChildWithParens(args[0], '%', 'left');
      const right = emitChildWithParens(args[1], '%', 'right');
      return `${left} % ${right}`;
    }
    return `klang.modulo(${emitJS(args[0])}, ${emitJS(args[1])})`;
  }

  // Power - uses Math.pow which is a function call, no precedence issues
  if (fn.startsWith('pow_')) {
    if (fn === 'pow_int_int' || fn === 'pow_float_float' ||
        fn === 'pow_int_float' || fn === 'pow_float_int') {
      return `Math.pow(${emitJS(args[0])}, ${emitJS(args[1])})`;
    }
    return `klang.power(${emitJS(args[0])}, ${emitJS(args[1])})`;
  }

  // Comparison operators - all emit native JS
  if (fn.startsWith('lt_')) {
    const left = emitChildWithParens(args[0], '<', 'left');
    const right = emitChildWithParens(args[1], '<', 'right');
    return `${left} < ${right}`;
  }
  if (fn.startsWith('gt_')) {
    const left = emitChildWithParens(args[0], '>', 'left');
    const right = emitChildWithParens(args[1], '>', 'right');
    return `${left} > ${right}`;
  }
  if (fn.startsWith('lte_')) {
    const left = emitChildWithParens(args[0], '<=', 'left');
    const right = emitChildWithParens(args[1], '<=', 'right');
    return `${left} <= ${right}`;
  }
  if (fn.startsWith('gte_')) {
    const left = emitChildWithParens(args[0], '>=', 'left');
    const right = emitChildWithParens(args[1], '>=', 'right');
    return `${left} >= ${right}`;
  }

  // Equality - needs special handling for temporal types
  if (fn.startsWith('eq_')) {
    // Temporal equality needs valueOf() comparison
    if (fn === 'eq_date_date' || fn === 'eq_datetime_datetime' ||
        fn === 'eq_date_datetime' || fn === 'eq_datetime_date') {
      return `+${emitJS(args[0])} === +${emitJS(args[1])}`;
    }
    const left = emitChildWithParens(args[0], '==', 'left');
    const right = emitChildWithParens(args[1], '==', 'right');
    return `${left} == ${right}`;
  }
  if (fn.startsWith('neq_')) {
    if (fn === 'neq_date_date' || fn === 'neq_datetime_datetime' ||
        fn === 'neq_date_datetime' || fn === 'neq_datetime_date') {
      return `+${emitJS(args[0])} !== +${emitJS(args[1])}`;
    }
    const left = emitChildWithParens(args[0], '!=', 'left');
    const right = emitChildWithParens(args[1], '!=', 'right');
    return `${left} != ${right}`;
  }

  // Logical operators
  if (fn.startsWith('and_')) {
    const left = emitChildWithParens(args[0], '&&', 'left');
    const right = emitChildWithParens(args[1], '&&', 'right');
    return `${left} && ${right}`;
  }
  if (fn.startsWith('or_')) {
    const left = emitChildWithParens(args[0], '||', 'left');
    const right = emitChildWithParens(args[1], '||', 'right');
    return `${left} || ${right}`;
  }

  // Unary operators
  if (fn.startsWith('neg_')) {
    const operand = emitJS(args[0]);
    // Wrap binary operations in parens
    if (args[0].type === 'call' && isNativeBinaryOp(args[0].fn)) {
      return `-(${operand})`;
    }
    return `-${operand}`;
  }
  if (fn.startsWith('pos_')) {
    const operand = emitJS(args[0]);
    if (args[0].type === 'call' && isNativeBinaryOp(args[0].fn)) {
      return `+(${operand})`;
    }
    return `+${operand}`;
  }
  if (fn.startsWith('not_')) {
    const operand = emitJS(args[0]);
    // Wrap binary operations in parens for correct precedence
    if (args[0].type === 'call' && isNativeBinaryOp(args[0].fn)) {
      return `!(${operand})`;
    }
    return `!${operand}`;
  }

  // Unknown function - emit as generic function call
  return `${fn}(${args.map(emitJS).join(', ')})`;
}
