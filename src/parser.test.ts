import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parse } from './parser';
import { Expr } from './ast';

describe('Parser - Numeric Literals', () => {
  it('should parse integer literals', () => {
    const ast = parse('42');
    assert.deepStrictEqual(ast, {
      type: 'literal',
      value: 42
    });
  });

  it('should parse floating point literals', () => {
    const ast = parse('3.14');
    assert.deepStrictEqual(ast, {
      type: 'literal',
      value: 3.14
    });
  });

  it('should parse zero', () => {
    const ast = parse('0');
    assert.deepStrictEqual(ast, {
      type: 'literal',
      value: 0
    });
  });
});

describe('Parser - Boolean Literals', () => {
  it('should parse true', () => {
    const ast = parse('true');
    assert.deepStrictEqual(ast, {
      type: 'literal',
      value: true
    });
  });

  it('should parse false', () => {
    const ast = parse('false');
    assert.deepStrictEqual(ast, {
      type: 'literal',
      value: false
    });
  });
});

describe('Parser - Variables', () => {
  it('should parse single letter variables', () => {
    const ast = parse('x');
    assert.deepStrictEqual(ast, {
      type: 'variable',
      name: 'x'
    });
  });

  it('should parse multi-letter variables', () => {
    const ast = parse('price');
    assert.deepStrictEqual(ast, {
      type: 'variable',
      name: 'price'
    });
  });

  it('should parse variables with underscores', () => {
    const ast = parse('user_name');
    assert.deepStrictEqual(ast, {
      type: 'variable',
      name: 'user_name'
    });
  });

  it('should parse variables with numbers', () => {
    const ast = parse('var123');
    assert.deepStrictEqual(ast, {
      type: 'variable',
      name: 'var123'
    });
  });
});

describe('Parser - Arithmetic Operators', () => {
  it('should parse addition', () => {
    const ast = parse('1 + 2');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '+');
    }
  });

  it('should parse subtraction', () => {
    const ast = parse('5 - 3');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '-');
    }
  });

  it('should parse multiplication', () => {
    const ast = parse('4 * 3');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '*');
    }
  });

  it('should parse division', () => {
    const ast = parse('10 / 2');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '/');
    }
  });

  it('should parse modulo', () => {
    const ast = parse('10 % 3');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '%');
    }
  });

  it('should parse power', () => {
    const ast = parse('2 ^ 3');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '^');
    }
  });
});

describe('Parser - Comparison Operators', () => {
  it('should parse less than', () => {
    const ast = parse('x < 10');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '<');
    }
  });

  it('should parse greater than', () => {
    const ast = parse('x > 10');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '>');
    }
  });

  it('should parse less than or equal', () => {
    const ast = parse('x <= 10');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '<=');
    }
  });

  it('should parse greater than or equal', () => {
    const ast = parse('x >= 10');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '>=');
    }
  });

  it('should parse equality', () => {
    const ast = parse('x == 10');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '==');
    }
  });

  it('should parse inequality', () => {
    const ast = parse('x != 10');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '!=');
    }
  });
});

describe('Parser - Logical Operators', () => {
  it('should parse AND', () => {
    const ast = parse('true && false');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '&&');
    }
  });

  it('should parse OR', () => {
    const ast = parse('true || false');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '||');
    }
  });

  it('should parse NOT', () => {
    const ast = parse('!x');
    assert.strictEqual(ast.type, 'unary');
    if (ast.type === 'unary') {
      assert.strictEqual(ast.operator, '!');
    }
  });
});

describe('Parser - Unary Operators', () => {
  it('should parse unary minus', () => {
    const ast = parse('-5');
    assert.strictEqual(ast.type, 'unary');
    if (ast.type === 'unary') {
      assert.strictEqual(ast.operator, '-');
    }
  });

  it('should parse unary plus', () => {
    const ast = parse('+5');
    assert.strictEqual(ast.type, 'unary');
    if (ast.type === 'unary') {
      assert.strictEqual(ast.operator, '+');
    }
  });

  it('should parse double negation', () => {
    const ast = parse('!!x');
    assert.strictEqual(ast.type, 'unary');
    if (ast.type === 'unary') {
      assert.strictEqual(ast.operator, '!');
      assert.strictEqual(ast.operand.type, 'unary');
    }
  });
});

describe('Parser - Operator Precedence', () => {
  it('should handle multiplication before addition', () => {
    const ast = parse('2 + 3 * 4');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '+');
      assert.strictEqual(ast.right.type, 'binary');
      if (ast.right.type === 'binary') {
        assert.strictEqual(ast.right.operator, '*');
      }
    }
  });

  it('should handle power before multiplication', () => {
    const ast = parse('2 * 3 ^ 4');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '*');
      assert.strictEqual(ast.right.type, 'binary');
      if (ast.right.type === 'binary') {
        assert.strictEqual(ast.right.operator, '^');
      }
    }
  });

  it('should handle comparison before logical AND', () => {
    const ast = parse('x > 5 && y < 10');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '&&');
      assert.strictEqual(ast.left.type, 'binary');
      assert.strictEqual(ast.right.type, 'binary');
    }
  });

  it('should handle AND before OR', () => {
    const ast = parse('a || b && c');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '||');
      assert.strictEqual(ast.right.type, 'binary');
      if (ast.right.type === 'binary') {
        assert.strictEqual(ast.right.operator, '&&');
      }
    }
  });
});

describe('Parser - Parentheses', () => {
  it('should handle simple parentheses', () => {
    const ast = parse('(5)');
    assert.deepStrictEqual(ast, {
      type: 'literal',
      value: 5
    });
  });

  it('should override precedence with parentheses', () => {
    const ast = parse('(2 + 3) * 4');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '*');
      assert.strictEqual(ast.left.type, 'binary');
      if (ast.left.type === 'binary') {
        assert.strictEqual(ast.left.operator, '+');
      }
    }
  });

  it('should handle nested parentheses', () => {
    const ast = parse('((1 + 2) * 3)');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '*');
    }
  });

  it('should handle complex parenthesized expressions', () => {
    const ast = parse('(a || b) && (c || d)');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '&&');
      assert.strictEqual(ast.left.type, 'binary');
      assert.strictEqual(ast.right.type, 'binary');
    }
  });
});

describe('Parser - Complex Expressions', () => {
  it('should parse mixed arithmetic expression', () => {
    const ast = parse('2 + 3 * 4 - 5 / 2');
    assert.strictEqual(ast.type, 'binary');
  });

  it('should parse complex boolean expression', () => {
    const ast = parse('(x > 10 && x < 100) || y == 0');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '||');
    }
  });

  it('should parse mixed arithmetic and boolean', () => {
    const ast = parse('price * quantity > 1000');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '>');
      assert.strictEqual(ast.left.type, 'binary');
    }
  });
});

describe('Parser - Whitespace', () => {
  it('should handle expressions without whitespace', () => {
    const ast = parse('2+3*4');
    assert.strictEqual(ast.type, 'binary');
  });

  it('should handle expressions with extra whitespace', () => {
    const ast = parse('  2   +   3  ');
    assert.strictEqual(ast.type, 'binary');
  });

  it('should handle newlines and tabs', () => {
    const ast = parse('2\n+\t3');
    assert.strictEqual(ast.type, 'binary');
  });
});

describe('Parser - Error Handling', () => {
  it('should throw on unexpected character', () => {
    assert.throws(() => parse('2 $ 3'), /Unexpected character/);
  });

  it('should throw on unmatched opening parenthesis', () => {
    assert.throws(() => parse('(2 + 3'), /Expected RPAREN/);
  });

  it('should throw on unexpected closing parenthesis', () => {
    assert.throws(() => parse('2 + 3)'), /Expected EOF/);
  });

  it('should throw on empty expression', () => {
    assert.throws(() => parse(''), /Unexpected token/);
  });

  it('should throw on incomplete expression', () => {
    assert.throws(() => parse('2 +'), /Unexpected token/);
  });

  it('should throw on invalid token sequence', () => {
    assert.throws(() => parse('2 3'), /Expected EOF/);
  });
});

describe('Parser - Function Calls', () => {
  it('should parse function call with no arguments', () => {
    const ast = parse('foo()');
    assert.deepStrictEqual(ast, {
      type: 'function_call',
      name: 'foo',
      args: []
    });
  });

  it('should parse function call with one argument', () => {
    const ast = parse('assert(true)');
    assert.deepStrictEqual(ast, {
      type: 'function_call',
      name: 'assert',
      args: [{ type: 'literal', value: true }]
    });
  });

  it('should parse function call with multiple arguments', () => {
    const ast = parse('max(5, 3)');
    assert.strictEqual(ast.type, 'function_call');
    const funcCall = ast as any;
    assert.strictEqual(funcCall.name, 'max');
    assert.strictEqual(funcCall.args.length, 2);
    assert.strictEqual(funcCall.args[0].type, 'literal');
    assert.strictEqual(funcCall.args[1].type, 'literal');
  });

  it('should parse nested function calls', () => {
    const ast = parse('foo(bar(5))');
    assert.strictEqual(ast.type, 'function_call');
    const funcCall = ast as any;
    assert.strictEqual(funcCall.name, 'foo');
    assert.strictEqual(funcCall.args[0].type, 'function_call');
    assert.strictEqual(funcCall.args[0].name, 'bar');
  });

  it('should parse function call with complex expression argument', () => {
    const ast = parse('assert(2 + 3 == 5)');
    assert.strictEqual(ast.type, 'function_call');
    const funcCall = ast as any;
    assert.strictEqual(funcCall.name, 'assert');
    assert.strictEqual(funcCall.args[0].type, 'binary');
  });
});
