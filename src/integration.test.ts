import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parse, compileToRuby, compileToJavaScript, compileToSQL } from './index';

describe('Integration - Arithmetic Expressions', () => {
  it('should parse and compile simple addition', () => {
    const ast = parse('2 + 3');
    assert.strictEqual(compileToRuby(ast), '2 + 3');
    assert.strictEqual(compileToJavaScript(ast), '2 + 3');
    assert.strictEqual(compileToSQL(ast), '2 + 3');
  });

  it('should parse and compile multiplication with precedence', () => {
    const ast = parse('2 + 3 * 4');
    assert.strictEqual(compileToRuby(ast), '2 + 3 * 4');
    assert.strictEqual(compileToJavaScript(ast), '2 + 3 * 4');
    assert.strictEqual(compileToSQL(ast), '2 + 3 * 4');
  });

  it('should parse and compile power operator', () => {
    const ast = parse('2 ^ 3');
    assert.strictEqual(compileToRuby(ast), '2 ** 3');
    assert.strictEqual(compileToJavaScript(ast), 'Math.pow(2, 3)');
    assert.strictEqual(compileToSQL(ast), 'POWER(2, 3)');
  });

  it('should parse and compile power with addition', () => {
    const ast = parse('2 ^ 3 + 1');
    assert.strictEqual(compileToRuby(ast), '2 ** 3 + 1');
    assert.strictEqual(compileToJavaScript(ast), 'Math.pow(2, 3) + 1');
    assert.strictEqual(compileToSQL(ast), 'POWER(2, 3) + 1');
  });

  it('should parse and compile complex arithmetic', () => {
    const ast = parse('(x + 5) * (y - 3) / 2');
    assert.strictEqual(compileToRuby(ast), '(x + 5) * (y - 3) / 2');
    assert.strictEqual(compileToJavaScript(ast), '(x + 5) * (y - 3) / 2');
    assert.strictEqual(compileToSQL(ast), '(x + 5) * (y - 3) / 2');
  });

  it('should parse and compile unary minus', () => {
    const ast = parse('-x + 10');
    assert.strictEqual(compileToRuby(ast), '-x + 10');
    assert.strictEqual(compileToJavaScript(ast), '-x + 10');
    assert.strictEqual(compileToSQL(ast), '-x + 10');
  });

  it('should parse and compile modulo', () => {
    const ast = parse('a % b + c / d');
    assert.strictEqual(compileToRuby(ast), 'a % b + c / d');
    assert.strictEqual(compileToJavaScript(ast), 'a % b + c / d');
    assert.strictEqual(compileToSQL(ast), 'a % b + c / d');
  });
});

describe('Integration - Boolean Expressions', () => {
  it('should parse and compile boolean literals', () => {
    const ast = parse('true');
    assert.strictEqual(compileToRuby(ast), 'true');
    assert.strictEqual(compileToJavaScript(ast), 'true');
    assert.strictEqual(compileToSQL(ast), 'TRUE');
  });

  it('should parse and compile comparison', () => {
    const ast = parse('x > 10');
    assert.strictEqual(compileToRuby(ast), 'x > 10');
    assert.strictEqual(compileToJavaScript(ast), 'x > 10');
    assert.strictEqual(compileToSQL(ast), 'x > 10');
  });

  it('should parse and compile equality', () => {
    const ast = parse('age == 25');
    assert.strictEqual(compileToRuby(ast), 'age == 25');
    assert.strictEqual(compileToJavaScript(ast), 'age == 25');
    assert.strictEqual(compileToSQL(ast), 'age == 25');
  });

  it('should parse and compile logical AND', () => {
    const ast = parse('x > 0 && x < 100');
    assert.strictEqual(compileToRuby(ast), 'x > 0 && x < 100');
    assert.strictEqual(compileToJavaScript(ast), 'x > 0 && x < 100');
    assert.strictEqual(compileToSQL(ast), 'x > 0 AND x < 100');
  });

  it('should parse and compile logical OR', () => {
    const ast = parse('status == 1 || status == 2');
    assert.strictEqual(compileToRuby(ast), 'status == 1 || status == 2');
    assert.strictEqual(compileToJavaScript(ast), 'status == 1 || status == 2');
    assert.strictEqual(compileToSQL(ast), 'status == 1 OR status == 2');
  });

  it('should parse and compile NOT', () => {
    const ast = parse('!active');
    assert.strictEqual(compileToRuby(ast), '!active');
    assert.strictEqual(compileToJavaScript(ast), '!active');
    assert.strictEqual(compileToSQL(ast), 'NOT active');
  });

  it('should parse and compile complex boolean', () => {
    const ast = parse('(price > 100 && discount >= 10) || vip == true');
    assert.strictEqual(compileToRuby(ast), 'price > 100 && discount >= 10 || vip == true');
    assert.strictEqual(compileToJavaScript(ast), 'price > 100 && discount >= 10 || vip == true');
    assert.strictEqual(compileToSQL(ast), 'price > 100 AND discount >= 10 OR vip == TRUE');
  });
});

describe('Integration - Mixed Expressions', () => {
  it('should parse and compile mixed arithmetic and boolean', () => {
    const ast = parse('total * 1.1 > 1000');
    assert.strictEqual(compileToRuby(ast), 'total * 1.1 > 1000');
    assert.strictEqual(compileToJavaScript(ast), 'total * 1.1 > 1000');
    assert.strictEqual(compileToSQL(ast), 'total * 1.1 > 1000');
  });

  it('should parse and compile business rule', () => {
    const ast = parse('(price * quantity) - discount');
    assert.strictEqual(compileToRuby(ast), 'price * quantity - discount');
    assert.strictEqual(compileToJavaScript(ast), 'price * quantity - discount');
    assert.strictEqual(compileToSQL(ast), 'price * quantity - discount');
  });

  it('should parse and compile range check', () => {
    const ast = parse('value >= min && value <= max');
    assert.strictEqual(compileToRuby(ast), 'value >= min && value <= max');
    assert.strictEqual(compileToJavaScript(ast), 'value >= min && value <= max');
    assert.strictEqual(compileToSQL(ast), 'value >= min AND value <= max');
  });

  it('should parse and compile complex business logic', () => {
    const ast = parse('amount > 0 && (approved || amount < 1000)');
    assert.strictEqual(compileToRuby(ast), 'amount > 0 && (approved || amount < 1000)');
    assert.strictEqual(compileToJavaScript(ast), 'amount > 0 && (approved || amount < 1000)');
    assert.strictEqual(compileToSQL(ast), 'amount > 0 AND (approved OR amount < 1000)');
  });
});

describe('Integration - Real-world Examples', () => {
  it('should compile discount calculation', () => {
    const ast = parse('price * (1 - discount / 100)');
    assert.strictEqual(compileToRuby(ast), 'price * (1 - discount / 100)');
    assert.strictEqual(compileToJavaScript(ast), 'price * (1 - discount / 100)');
    assert.strictEqual(compileToSQL(ast), 'price * (1 - discount / 100)');
  });

  it('should compile tax calculation', () => {
    const ast = parse('subtotal + subtotal * tax_rate');
    assert.strictEqual(compileToRuby(ast), 'subtotal + subtotal * tax_rate');
    assert.strictEqual(compileToJavaScript(ast), 'subtotal + subtotal * tax_rate');
    assert.strictEqual(compileToSQL(ast), 'subtotal + subtotal * tax_rate');
  });

  it('should compile compound interest formula', () => {
    const ast = parse('principal * (1 + rate) ^ years');
    assert.strictEqual(compileToRuby(ast), 'principal * (1 + rate) ** years');
    assert.strictEqual(compileToJavaScript(ast), 'principal * Math.pow(1 + rate, years)');
    assert.strictEqual(compileToSQL(ast), 'principal * POWER(1 + rate, years)');
  });

  it('should compile eligibility check', () => {
    const ast = parse('age >= 18 && (income > 30000 || has_guarantor == true)');
    assert.strictEqual(compileToRuby(ast), 'age >= 18 && (income > 30000 || has_guarantor == true)');
    assert.strictEqual(compileToJavaScript(ast), 'age >= 18 && (income > 30000 || has_guarantor == true)');
    assert.strictEqual(compileToSQL(ast), 'age >= 18 AND (income > 30000 OR has_guarantor == TRUE)');
  });

  it('should compile percentage calculation', () => {
    const ast = parse('(actual / target) * 100');
    assert.strictEqual(compileToRuby(ast), 'actual / target * 100');
    assert.strictEqual(compileToJavaScript(ast), 'actual / target * 100');
    assert.strictEqual(compileToSQL(ast), 'actual / target * 100');
  });

  it('should compile BMI formula', () => {
    const ast = parse('weight / (height ^ 2)');
    assert.strictEqual(compileToRuby(ast), 'weight / height ** 2');
    assert.strictEqual(compileToJavaScript(ast), 'weight / Math.pow(height, 2)');
    assert.strictEqual(compileToSQL(ast), 'weight / POWER(height, 2)');
  });
});

describe('Integration - Whitespace Handling', () => {
  it('should handle no whitespace', () => {
    const ast = parse('2+3*4');
    assert.strictEqual(compileToRuby(ast), '2 + 3 * 4');
  });

  it('should handle extra whitespace', () => {
    const ast = parse('  2   +   3  ');
    assert.strictEqual(compileToRuby(ast), '2 + 3');
  });

  it('should handle tabs and newlines', () => {
    const ast = parse('x\n>\t10');
    assert.strictEqual(compileToRuby(ast), 'x > 10');
  });
});

describe('Integration - Variable Names', () => {
  it('should handle single-letter variables', () => {
    const ast = parse('x + y');
    assert.strictEqual(compileToRuby(ast), 'x + y');
  });

  it('should handle multi-letter variables', () => {
    const ast = parse('price + tax');
    assert.strictEqual(compileToRuby(ast), 'price + tax');
  });

  it('should handle underscored variables', () => {
    const ast = parse('user_age + account_balance');
    assert.strictEqual(compileToRuby(ast), 'user_age + account_balance');
  });

  it('should handle alphanumeric variables', () => {
    const ast = parse('var1 + var2');
    assert.strictEqual(compileToRuby(ast), 'var1 + var2');
  });
});

describe('Integration - All Operators', () => {
  it('should handle all arithmetic operators', () => {
    const expressions = [
      { expr: '1 + 2', expected: { ruby: '1 + 2', js: '1 + 2', sql: '1 + 2' } },
      { expr: '5 - 3', expected: { ruby: '5 - 3', js: '5 - 3', sql: '5 - 3' } },
      { expr: '4 * 3', expected: { ruby: '4 * 3', js: '4 * 3', sql: '4 * 3' } },
      { expr: '10 / 2', expected: { ruby: '10 / 2', js: '10 / 2', sql: '10 / 2' } },
      { expr: '10 % 3', expected: { ruby: '10 % 3', js: '10 % 3', sql: '10 % 3' } },
      { expr: '2 ^ 3', expected: { ruby: '2 ** 3', js: 'Math.pow(2, 3)', sql: 'POWER(2, 3)' } }
    ];

    expressions.forEach(({ expr, expected }) => {
      const ast = parse(expr);
      assert.strictEqual(compileToRuby(ast), expected.ruby);
      assert.strictEqual(compileToJavaScript(ast), expected.js);
      assert.strictEqual(compileToSQL(ast), expected.sql);
    });
  });

  it('should handle all comparison operators', () => {
    const expressions = [
      'x < 10',
      'x > 10',
      'x <= 10',
      'x >= 10',
      'x == 10',
      'x != 10'
    ];

    expressions.forEach(expr => {
      const ast = parse(expr);
      assert.strictEqual(compileToRuby(ast), expr);
      assert.strictEqual(compileToJavaScript(ast), expr);
      assert.strictEqual(compileToSQL(ast), expr);
    });
  });
});
