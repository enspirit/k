/**
 * SQL (PostgreSQL) stdlib binding for Klang
 *
 * This module defines how Klang IR functions are emitted as PostgreSQL SQL code.
 */

import { IRExpr } from '../ir';
import { Types } from '../types';
import { StdLib, EmitContext, nullary, fnCall } from '../stdlib';

/**
 * Map IR function names to SQL operators
 */
export const SQL_OP_MAP: Record<string, string> = {
  'add': '+', 'sub': '-', 'mul': '*', 'div': '/', 'mod': '%',
  'lt': '<', 'gt': '>', 'lte': '<=', 'gte': '>=',
  'eq': '=', 'neq': '<>', 'and': 'AND', 'or': 'OR',
};

/**
 * Check if a call will be emitted as a native SQL binary operator
 */
export function isNativeBinaryOp(ir: IRExpr): boolean {
  if (ir.type !== 'call') return false;
  return SQL_OP_MAP[ir.fn] !== undefined && ir.argTypes.length === 2;
}

/**
 * Helper for SQL binary operators
 */
function sqlBinaryOp(op: string): (args: IRExpr[], ctx: EmitContext<string>) => string {
  return (args, ctx) => {
    const left = ctx.emitWithParens(args[0], op, 'left');
    const right = ctx.emitWithParens(args[1], op, 'right');
    return `${left} ${op} ${right}`;
  };
}

/**
 * Create the SQL standard library binding
 */
export function createSQLBinding(): StdLib<string> {
  const sqlLib = new StdLib<string>();

  // Temporal nullary functions
  sqlLib.register('today', [], nullary('CURRENT_DATE'));
  sqlLib.register('now', [], nullary('CURRENT_TIMESTAMP'));

  // Period boundary functions using date_trunc
  const periodBoundarySQL: Record<string, { truncate: string; end?: string }> = {
    'start_of_day': { truncate: 'day' },
    'end_of_day': { truncate: 'day', end: "+ INTERVAL '1 day' - INTERVAL '1 second'" },
    'start_of_week': { truncate: 'week' },
    'end_of_week': { truncate: 'week', end: "+ INTERVAL '6 days'" },
    'start_of_month': { truncate: 'month' },
    'end_of_month': { truncate: 'month', end: "+ INTERVAL '1 month' - INTERVAL '1 day'" },
    'start_of_quarter': { truncate: 'quarter' },
    'end_of_quarter': { truncate: 'quarter', end: "+ INTERVAL '3 months' - INTERVAL '1 day'" },
    'start_of_year': { truncate: 'year' },
    'end_of_year': { truncate: 'year', end: "+ INTERVAL '1 year' - INTERVAL '1 day'" },
  };

  for (const [fn, { truncate, end }] of Object.entries(periodBoundarySQL)) {
    sqlLib.register(fn, [Types.datetime], (args, ctx) => {
      const arg = args[0];
      let baseExpr: string;
      if (arg.type === 'call' && arg.fn === 'now') {
        baseExpr = fn.includes('_day') ? 'CURRENT_TIMESTAMP' : 'CURRENT_DATE';
      } else {
        baseExpr = ctx.emit(arg);
      }
      const truncated = `date_trunc('${truncate}', ${baseExpr})`;
      return end ? `${truncated} ${end}` : truncated;
    });
  }

  // String concatenation uses || in SQL
  sqlLib.register('add', [Types.string, Types.string], sqlBinaryOp('||'));

  // SQL uses native operators for all types - type generalization handles all combinations
  sqlLib.register('add', [Types.any, Types.any], sqlBinaryOp('+'));
  sqlLib.register('sub', [Types.any, Types.any], sqlBinaryOp('-'));
  sqlLib.register('mul', [Types.any, Types.any], sqlBinaryOp('*'));
  sqlLib.register('div', [Types.any, Types.any], sqlBinaryOp('/'));
  sqlLib.register('mod', [Types.any, Types.any], sqlBinaryOp('%'));
  sqlLib.register('pow', [Types.any, Types.any], fnCall('POWER'));

  // Temporal arithmetic
  // Special case: today() + duration('P1D') -> CURRENT_DATE + INTERVAL '1 day' (for TOMORROW)
  sqlLib.register('add', [Types.date, Types.duration], (args, ctx) => {
    const leftArg = args[0];
    const rightArg = args[1];
    if (leftArg.type === 'call' && leftArg.fn === 'today' &&
        rightArg.type === 'duration_literal' && rightArg.value === 'P1D') {
      return "CURRENT_DATE + INTERVAL '1 day'";
    }
    const left = ctx.emitWithParens(args[0], '+', 'left');
    const right = ctx.emitWithParens(args[1], '+', 'right');
    return `${left} + ${right}`;
  });

  // Other temporal additions are covered by any,any registration

  // Special case: today() - duration('P1D') -> CURRENT_DATE - INTERVAL '1 day' (for YESTERDAY)
  sqlLib.register('sub', [Types.date, Types.duration], (args, ctx) => {
    const leftArg = args[0];
    const rightArg = args[1];
    if (leftArg.type === 'call' && leftArg.fn === 'today' &&
        rightArg.type === 'duration_literal' && rightArg.value === 'P1D') {
      return "CURRENT_DATE - INTERVAL '1 day'";
    }
    const left = ctx.emitWithParens(args[0], '-', 'left');
    const right = ctx.emitWithParens(args[1], '-', 'right');
    return `${left} - ${right}`;
  });

  // Other temporal subtractions and duration scaling are covered by any,any registrations

  // Comparison operators - SQL handles all types, type generalization applies
  sqlLib.register('lt', [Types.any, Types.any], sqlBinaryOp('<'));
  sqlLib.register('gt', [Types.any, Types.any], sqlBinaryOp('>'));
  sqlLib.register('lte', [Types.any, Types.any], sqlBinaryOp('<='));
  sqlLib.register('gte', [Types.any, Types.any], sqlBinaryOp('>='));
  sqlLib.register('eq', [Types.any, Types.any], sqlBinaryOp('='));
  sqlLib.register('neq', [Types.any, Types.any], sqlBinaryOp('<>'));

  // Logical operators
  sqlLib.register('and', [Types.any, Types.any], sqlBinaryOp('AND'));
  sqlLib.register('or', [Types.any, Types.any], sqlBinaryOp('OR'));

  // Unary operators - type generalization handles int, float, and any
  sqlLib.register('neg', [Types.any], (args, ctx) => {
    const operand = ctx.emit(args[0]);
    if (isNativeBinaryOp(args[0])) return `-(${operand})`;
    return `-${operand}`;
  });
  sqlLib.register('pos', [Types.any], (args, ctx) => {
    const operand = ctx.emit(args[0]);
    if (isNativeBinaryOp(args[0])) return `+(${operand})`;
    return `+${operand}`;
  });
  sqlLib.register('not', [Types.any], (args, ctx) => {
    const operand = ctx.emit(args[0]);
    if (isNativeBinaryOp(args[0])) return `NOT (${operand})`;
    return `NOT ${operand}`;
  });

  // Assert function - type generalization handles bool and any
  sqlLib.register('assert', [Types.any], (args, ctx) => {
    const condition = ctx.emit(args[0]);
    return `CASE WHEN ${condition} THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END`;
  });
  sqlLib.register('assert', [Types.any, Types.string], (args, ctx) => {
    const condition = ctx.emit(args[0]);
    return `CASE WHEN ${condition} THEN TRUE ELSE (SELECT pg_terminate_backend(pg_backend_pid())) END`;
  });

  // String functions
  sqlLib.register('length', [Types.string], (args, ctx) => `LENGTH(${ctx.emit(args[0])})`);
  sqlLib.register('upper', [Types.string], (args, ctx) => `UPPER(${ctx.emit(args[0])})`);
  sqlLib.register('lower', [Types.string], (args, ctx) => `LOWER(${ctx.emit(args[0])})`);
  sqlLib.register('trim', [Types.string], (args, ctx) => `TRIM(${ctx.emit(args[0])})`);
  sqlLib.register('startsWith', [Types.string, Types.string], (args, ctx) =>
    `starts_with(${ctx.emit(args[0])}, ${ctx.emit(args[1])})`);
  sqlLib.register('endsWith', [Types.string, Types.string], (args, ctx) =>
    `(${ctx.emit(args[0])} LIKE '%' || ${ctx.emit(args[1])})`);
  sqlLib.register('contains', [Types.string, Types.string], (args, ctx) =>
    `(POSITION(${ctx.emit(args[1])} IN ${ctx.emit(args[0])}) > 0)`);
  // PostgreSQL SUBSTRING is 1-based, Klang is 0-based
  sqlLib.register('substring', [Types.string, Types.int, Types.int], (args, ctx) =>
    `SUBSTRING(${ctx.emit(args[0])} FROM ${ctx.emit(args[1])} + 1 FOR ${ctx.emit(args[2])})`);
  sqlLib.register('concat', [Types.string, Types.string], (args, ctx) =>
    `CONCAT(${ctx.emit(args[0])}, ${ctx.emit(args[1])})`);
  // PostgreSQL POSITION is 1-based, return 0-based index (-1 if not found)
  sqlLib.register('indexOf', [Types.string, Types.string], (args, ctx) =>
    `(POSITION(${ctx.emit(args[1])} IN ${ctx.emit(args[0])}) - 1)`);
  sqlLib.register('replace', [Types.string, Types.string, Types.string], (args, ctx) =>
    `REGEXP_REPLACE(${ctx.emit(args[0])}, ${ctx.emit(args[1])}, ${ctx.emit(args[2])})`);
  sqlLib.register('replaceAll', [Types.string, Types.string, Types.string], (args, ctx) =>
    `REGEXP_REPLACE(${ctx.emit(args[0])}, ${ctx.emit(args[1])}, ${ctx.emit(args[2])}, 'g')`);
  sqlLib.register('isEmpty', [Types.string], (args, ctx) =>
    `(LENGTH(${ctx.emit(args[0])}) = 0)`);
  sqlLib.register('padStart', [Types.string, Types.int, Types.string], (args, ctx) =>
    `LPAD(${ctx.emit(args[0])}, ${ctx.emit(args[1])}, ${ctx.emit(args[2])})`);
  sqlLib.register('padEnd', [Types.string, Types.int, Types.string], (args, ctx) =>
    `RPAD(${ctx.emit(args[0])}, ${ctx.emit(args[1])}, ${ctx.emit(args[2])})`);

  // Fallback for unknown functions - uppercase for SQL
  sqlLib.registerFallback((name, args, _argTypes, ctx) => {
    const emittedArgs = args.map(a => ctx.emit(a)).join(', ');
    return `${name.toUpperCase()}(${emittedArgs})`;
  });

  return sqlLib;
}
