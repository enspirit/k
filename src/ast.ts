/**
 * AST node types for Klang expressions
 */

export type Expr = Literal | Variable | BinaryOp | UnaryOp | DateLiteral | DateTimeLiteral | DurationLiteral;

/**
 * Literal value (number or boolean)
 */
export interface Literal {
  type: 'literal';
  value: number | boolean;
}

/**
 * Date literal (ISO8601 date string)
 */
export interface DateLiteral {
  type: 'date';
  value: string; // YYYY-MM-DD
}

/**
 * DateTime literal (ISO8601 datetime string)
 */
export interface DateTimeLiteral {
  type: 'datetime';
  value: string; // ISO8601 format
}

/**
 * Duration literal (ISO8601 duration)
 */
export interface DurationLiteral {
  type: 'duration';
  value: string; // ISO8601 duration like P1D, PT1H30M
}

/**
 * Variable reference
 */
export interface Variable {
  type: 'variable';
  name: string;
}

/**
 * Binary operation
 */
export interface BinaryOp {
  type: 'binary';
  operator:
    // Arithmetic
    | '+' | '-' | '*' | '/' | '%' | '^'
    // Comparison
    | '<' | '>' | '<=' | '>=' | '==' | '!='
    // Logical
    | '&&' | '||';
  left: Expr;
  right: Expr;
}

/**
 * Unary operation
 */
export interface UnaryOp {
  type: 'unary';
  operator: '-' | '+' | '!';
  operand: Expr;
}

/**
 * Helper functions to create AST nodes
 */
export function literal(value: number | boolean): Literal {
  return { type: 'literal', value };
}

export function dateLiteral(value: string): DateLiteral {
  return { type: 'date', value };
}

export function dateTimeLiteral(value: string): DateTimeLiteral {
  return { type: 'datetime', value };
}

export function durationLiteral(value: string): DurationLiteral {
  return { type: 'duration', value };
}

export function variable(name: string): Variable {
  return { type: 'variable', name };
}

export function binary(operator: BinaryOp['operator'], left: Expr, right: Expr): BinaryOp {
  return { type: 'binary', operator, left, right };
}

export function unary(operator: UnaryOp['operator'], operand: Expr): UnaryOp {
  return { type: 'unary', operator, operand };
}
