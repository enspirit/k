import { describe, it } from 'node:test';
import assert from 'node:assert';
import { compile } from '../../src/compile';
import { DateTime, Duration } from 'luxon';

const runtime = { DateTime, Duration };

describe('compile - basic lambdas', () => {
  it('compiles identity lambda', () => {
    const fn = compile<(x: number) => number>('fn(x ~> x)', { runtime });
    assert.strictEqual(fn(42), 42);
  });

  it('compiles arithmetic lambda', () => {
    const fn = compile<(x: number) => number>('fn(x ~> x * 2)', { runtime });
    assert.strictEqual(fn(21), 42);
  });

  it('compiles multi-parameter lambda', () => {
    const fn = compile<(x: number, y: number) => number>('fn(x, y ~> x + y)', { runtime });
    assert.strictEqual(fn(10, 32), 42);
  });

  it('compiles lambda with let binding', () => {
    const fn = compile<(x: number) => number>('fn(x ~> let doubled = x * 2 in doubled + 1)', { runtime });
    assert.strictEqual(fn(5), 11);
  });

  it('compiles lambda with conditional', () => {
    const fn = compile<(x: number) => number>('fn(x ~> if x > 0 then x else 0 - x)', { runtime });
    assert.strictEqual(fn(5), 5);
    assert.strictEqual(fn(-5), 5);
  });
});

describe('compile - temporal lambdas', () => {
  it('compiles lambda checking date in range', () => {
    const fn = compile<(x: unknown) => boolean>('fn(x ~> x in SOW ... EOW)', { runtime });
    // The function should be callable and return a boolean
    const result = fn(DateTime.now());
    assert.strictEqual(typeof result, 'boolean');
  });

  it('compiles lambda with date comparison', () => {
    const fn = compile<(x: unknown) => boolean>('fn(x ~> x >= TODAY)', { runtime });
    const tomorrow = DateTime.now().plus({ days: 1 });
    assert.strictEqual(fn(tomorrow), true);
    const yesterday = DateTime.now().minus({ days: 1 });
    assert.strictEqual(fn(yesterday), false);
  });
});

describe('compile - lambdas returning boolean', () => {
  it('compiles lambda returning boolean', () => {
    const fn = compile<(x: number) => boolean>('fn(x ~> x > 10)', { runtime });
    assert.strictEqual(fn(5), false);
    assert.strictEqual(fn(15), true);
  });
});
