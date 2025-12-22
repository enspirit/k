/**
 * AST node types for Klang expressions
 */

export type Expr = Literal | Variable | BinaryOp | UnaryOp;

/**
 * Literal value (number or boolean)
 */
export interface Literal {
  type: 'literal';
  value: number | boolean;
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

export function variable(name: string): Variable {
  return { type: 'variable', name };
}

export function binary(operator: BinaryOp['operator'], left: Expr, right: Expr): BinaryOp {
  return { type: 'binary', operator, left, right };
}

export function unary(operator: UnaryOp['operator'], operand: Expr): UnaryOp {
  return { type: 'unary', operator, operand };
}
