/**
 * Klang runtime helpers for JavaScript execution.
 * These are used by compiled K expressions at runtime.
 *
 * This module provides:
 * 1. A factory function for creating the runtime (used by web frontend)
 * 2. String snippets for embedding in preludes (used by CLI)
 */

export interface DayjsLike {
  isDayjs(value: any): boolean;
  isDuration(value: any): boolean;
}

export interface KlangRuntime {
  add(left: any, right: any): any;
  sub(left: any, right: any): any;
  mul(left: any, right: any): any;
  div(left: any, right: any): any;
  mod(left: any, right: any): any;
  pow(left: any, right: any): any;
}

/**
 * Creates the klang runtime helpers using the provided dayjs instance.
 * Used by the web frontend where dayjs is already loaded.
 */
export function createKlangRuntime(dayjs: DayjsLike): KlangRuntime {
  return {
    add(left: any, right: any): any {
      if (dayjs.isDayjs(left) && dayjs.isDuration(right)) return left.add(right);
      if (dayjs.isDuration(left) && dayjs.isDayjs(right)) return right.add(left);
      return left + right;
    },
    sub(left: any, right: any): any {
      if (dayjs.isDayjs(left) && dayjs.isDuration(right)) return left.subtract(right);
      return left - right;
    },
    mul(left: any, right: any): any {
      return left * right;
    },
    div(left: any, right: any): any {
      return left / right;
    },
    mod(left: any, right: any): any {
      return left % right;
    },
    pow(left: any, right: any): any {
      return Math.pow(left, right);
    }
  };
}

/**
 * JavaScript source code for the arithmetic helpers.
 * This is embedded in preludes to avoid code duplication.
 */
export const KLANG_ARITHMETIC_HELPERS = `
  add(left, right) {
    if (dayjs.isDayjs(left) && dayjs.isDuration(right)) return left.add(right);
    if (dayjs.isDuration(left) && dayjs.isDayjs(right)) return right.add(left);
    return left + right;
  },
  sub(left, right) {
    if (dayjs.isDayjs(left) && dayjs.isDuration(right)) return left.subtract(right);
    return left - right;
  },
  mul(left, right) {
    return left * right;
  },
  div(left, right) {
    return left / right;
  },
  mod(left, right) {
    return left % right;
  },
  pow(left, right) {
    return Math.pow(left, right);
  }`;
