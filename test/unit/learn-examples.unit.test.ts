import { describe, it } from 'node:test';
import assert from 'node:assert';
import { compile } from '../../src/compile';

// Configure dayjs with required plugins
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import utc from 'dayjs/plugin/utc';
dayjs.extend(duration);
dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);
dayjs.extend(utc);

const runtime = { dayjs };

/**
 * This test file validates that all examples shown on the Learn page
 * are valid Elo code that compiles and evaluates successfully.
 *
 * Each example from the Learn page should be listed here.
 * If a test fails, the Learn page must be updated.
 */

describe('Learn Page Examples - Lesson 1: Numbers', () => {
  it('should evaluate basic arithmetic', () => {
    assert.strictEqual(compile('2 + 3', { runtime }), 5);
    assert.strictEqual(compile('10 - 4', { runtime }), 6);
    assert.strictEqual(compile('6 * 7', { runtime }), 42);
    assert.strictEqual(compile('20 / 4', { runtime }), 5);
  });

  it('should evaluate precedence examples', () => {
    assert.strictEqual(compile('2 + 3 * 4', { runtime }), 14);
    assert.strictEqual(compile('(2 + 3) * 4', { runtime }), 20);
  });
});

describe('Learn Page Examples - Lesson 2: Strings', () => {
  it('should evaluate string literals', () => {
    assert.strictEqual(compile("'Hello, World!'", { runtime }), 'Hello, World!');
    assert.strictEqual(compile("'Elo is fun'", { runtime }), 'Elo is fun');
  });

  it('should evaluate string concatenation', () => {
    assert.strictEqual(compile("'Hello, ' + 'World!'", { runtime }), 'Hello, World!');
    assert.strictEqual(compile("'Elo' + ' ' + 'rocks'", { runtime }), 'Elo rocks');
  });

  it('should evaluate string functions', () => {
    assert.strictEqual(compile("upper('hello')", { runtime }), 'HELLO');
    assert.strictEqual(compile("lower('SHOUT')", { runtime }), 'shout');
    assert.strictEqual(compile("length('Elo')", { runtime }), 3);
    assert.strictEqual(compile("trim('  space  ')", { runtime }), 'space');
  });
});

describe('Learn Page Examples - Lesson 3: Booleans', () => {
  it('should evaluate comparisons', () => {
    assert.strictEqual(compile('5 > 3', { runtime }), true);
    assert.strictEqual(compile('2 == 2', { runtime }), true);
    assert.strictEqual(compile("'a' == 'b'", { runtime }), false);
    assert.strictEqual(compile('10 <= 10', { runtime }), true);
  });

  it('should evaluate logical operators', () => {
    assert.strictEqual(compile('true and false', { runtime }), false);
    assert.strictEqual(compile('true or false', { runtime }), true);
    assert.strictEqual(compile('not true', { runtime }), false);
  });
});

describe('Learn Page Examples - Lesson 4: Decisions', () => {
  it('should evaluate if expressions', () => {
    assert.strictEqual(compile("if 5 > 3 then 'yes' else 'no'", { runtime }), 'yes');
    assert.strictEqual(compile("let age = 18 in if age >= 18 then 'Welcome!' else 'Sorry, adults only'", { runtime }), 'Welcome!');
  });
});

describe('Learn Page Examples - Lesson 5: Variables', () => {
  it('should evaluate let expressions', () => {
    assert.strictEqual(compile('let price = 100 in price * 1.21', { runtime }), 121);
    assert.strictEqual(compile("let name = 'World' in 'Hello, ' + name + '!'", { runtime }), 'Hello, World!');
  });

  it('should evaluate multiple bindings', () => {
    assert.strictEqual(compile('let width = 10, height = 5 in width * height', { runtime }), 50);
  });
});

describe('Learn Page Examples - Lesson 6: Dates', () => {
  it('should evaluate date literals', () => {
    const christmas = compile('D2024-12-25', { runtime });
    assert.ok(dayjs.isDayjs(christmas));

    const newYearsEve = compile('D2024-12-31T23:59:59Z', { runtime });
    assert.ok(dayjs.isDayjs(newYearsEve));

    const today = compile('TODAY', { runtime });
    assert.ok(dayjs.isDayjs(today));

    const now = compile('NOW', { runtime });
    assert.ok(dayjs.isDayjs(now));
  });

  it('should evaluate duration arithmetic', () => {
    const result1 = compile('TODAY + P30D', { runtime });
    assert.ok(dayjs.isDayjs(result1));

    const result2 = compile('D2024-01-01 + P1Y', { runtime });
    assert.ok(dayjs.isDayjs(result2));
    // Date is shifted by 1 year (dayjs adds 365 days for P1Y)

    const result3 = compile('NOW + PT2H30M', { runtime });
    assert.ok(dayjs.isDayjs(result3));
  });

  it('should evaluate date extraction functions', () => {
    const year = compile<number>('year(TODAY)', { runtime });
    assert.strictEqual(typeof year, 'number');
    assert.ok(year >= 2024);

    const month = compile<number>('month(TODAY)', { runtime });
    assert.ok(month >= 1 && month <= 12);

    const day = compile<number>('day(TODAY)', { runtime });
    assert.ok(day >= 1 && day <= 31);
  });
});

describe('Learn Page Examples - Lesson 7: Objects', () => {
  it('should evaluate object literals', () => {
    const obj = compile("{ name: 'Alice', age: 30, city: 'Brussels' }", { runtime }) as Record<string, unknown>;
    assert.strictEqual(obj.name, 'Alice');
    assert.strictEqual(obj.age, 30);
    assert.strictEqual(obj.city, 'Brussels');
  });

  it('should evaluate member access', () => {
    assert.strictEqual(compile("let person = { name: 'Alice', age: 30 } in person.name", { runtime }), 'Alice');
    assert.strictEqual(compile("let person = { name: 'Bob', age: 25 } in person.age >= 18", { runtime }), true);
  });
});

describe('Learn Page Examples - Lesson 8: Functions', () => {
  it('should evaluate lambda definitions', () => {
    assert.strictEqual(compile('let double = fn( x ~> x * 2 ) in double(5)', { runtime }), 10);
    assert.strictEqual(compile("let greet = fn( name ~> 'Hello, ' + name + '!' ) in greet('Elo')", { runtime }), 'Hello, Elo!');
  });

  it('should evaluate multi-parameter lambdas', () => {
    assert.strictEqual(compile('let add = fn( a, b ~> a + b ) in add(3, 4)', { runtime }), 7);
    assert.strictEqual(compile("let fullName = fn( first, last ~> first + ' ' + last ) in fullName('Ada', 'Lovelace')", { runtime }), 'Ada Lovelace');
  });
});

describe('Learn Page Examples - Lesson 9: Pipes', () => {
  it('should evaluate nested function calls', () => {
    assert.strictEqual(compile("upper(trim('  hello  '))", { runtime }), 'HELLO');
  });

  it('should evaluate pipe operator', () => {
    assert.strictEqual(compile("'  hello  ' |> trim |> upper", { runtime }), 'HELLO');
  });

  it('should evaluate multi-line pipe', () => {
    assert.strictEqual(compile("'  elo is fun  ' |> trim |> upper |> length", { runtime }), 10);
  });
});
