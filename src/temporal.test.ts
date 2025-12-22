import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parse, compileToRuby, compileToJavaScript, compileToSQL } from './index';
import { dateLiteral, dateTimeLiteral, durationLiteral } from './ast';

describe('Temporal - Date Literals', () => {
  it('should parse date literal', () => {
    const ast = parse('d"2024-01-15"');
    assert.strictEqual(ast.type, 'date');
    if (ast.type === 'date') {
      assert.strictEqual(ast.value, '2024-01-15');
    }
  });

  it('should compile date to Ruby', () => {
    const ast = dateLiteral('2024-01-15');
    assert.strictEqual(compileToRuby(ast), "Date.parse('2024-01-15')");
  });

  it('should compile date to JavaScript', () => {
    const ast = dateLiteral('2024-01-15');
    assert.strictEqual(compileToJavaScript(ast), "new Date('2024-01-15')");
  });

  it('should compile date to SQL', () => {
    const ast = dateLiteral('2024-01-15');
    assert.strictEqual(compileToSQL(ast), "DATE '2024-01-15'");
  });
});

describe('Temporal - DateTime Literals', () => {
  it('should parse datetime literal', () => {
    const ast = parse('dt"2024-01-15T10:30:00Z"');
    assert.strictEqual(ast.type, 'datetime');
    if (ast.type === 'datetime') {
      assert.strictEqual(ast.value, '2024-01-15T10:30:00Z');
    }
  });

  it('should compile datetime to Ruby', () => {
    const ast = dateTimeLiteral('2024-01-15T10:30:00Z');
    assert.strictEqual(compileToRuby(ast), "DateTime.parse('2024-01-15T10:30:00Z')");
  });

  it('should compile datetime to JavaScript', () => {
    const ast = dateTimeLiteral('2024-01-15T10:30:00Z');
    assert.strictEqual(compileToJavaScript(ast), "new Date('2024-01-15T10:30:00Z')");
  });

  it('should compile datetime to SQL', () => {
    const ast = dateTimeLiteral('2024-01-15T10:30:00Z');
    assert.strictEqual(compileToSQL(ast), "TIMESTAMP '2024-01-15 10:30:00'");
  });
});

describe('Temporal - Duration Literals', () => {
  it('should parse duration - days', () => {
    const ast = parse('P1D');
    assert.strictEqual(ast.type, 'duration');
    if (ast.type === 'duration') {
      assert.strictEqual(ast.value, 'P1D');
    }
  });

  it('should parse duration - hours and minutes', () => {
    const ast = parse('PT1H30M');
    assert.strictEqual(ast.type, 'duration');
    if (ast.type === 'duration') {
      assert.strictEqual(ast.value, 'PT1H30M');
    }
  });

  it('should parse duration - years, months, days', () => {
    const ast = parse('P1Y2M3D');
    assert.strictEqual(ast.type, 'duration');
    if (ast.type === 'duration') {
      assert.strictEqual(ast.value, 'P1Y2M3D');
    }
  });

  it('should parse complex duration', () => {
    const ast = parse('P1Y2M3DT4H5M6S');
    assert.strictEqual(ast.type, 'duration');
    if (ast.type === 'duration') {
      assert.strictEqual(ast.value, 'P1Y2M3DT4H5M6S');
    }
  });

  it('should compile duration to Ruby', () => {
    const ast = durationLiteral('P1D');
    assert.strictEqual(compileToRuby(ast), "ActiveSupport::Duration.parse('P1D')");
  });

  it('should compile duration to JavaScript', () => {
    const ast = durationLiteral('P1D');
    assert.strictEqual(compileToJavaScript(ast), "Duration.parse('P1D')");
  });

  it('should compile duration to SQL', () => {
    const ast = durationLiteral('P1D');
    assert.strictEqual(compileToSQL(ast), "INTERVAL 'P1D'");
  });
});

describe('Temporal - Date Arithmetic', () => {
  it('should parse date + duration', () => {
    const ast = parse('d"2024-01-15" + P1D');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '+');
      assert.strictEqual(ast.left.type, 'date');
      assert.strictEqual(ast.right.type, 'duration');
    }
  });

  it('should compile date + duration', () => {
    const ast = parse('d"2024-01-15" + P1D');
    assert.strictEqual(
      compileToRuby(ast),
      "Date.parse('2024-01-15') + ActiveSupport::Duration.parse('P1D')"
    );
    assert.strictEqual(
      compileToJavaScript(ast),
      "new Date('2024-01-15') + Duration.parse('P1D')"
    );
    assert.strictEqual(
      compileToSQL(ast),
      "DATE '2024-01-15' + INTERVAL 'P1D'"
    );
  });

  it('should parse date - date', () => {
    const ast = parse('d"2024-12-31" - d"2024-01-01"');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '-');
      assert.strictEqual(ast.left.type, 'date');
      assert.strictEqual(ast.right.type, 'date');
    }
  });
});

describe('Temporal - Date Comparisons', () => {
  it('should parse date < date', () => {
    const ast = parse('d"2024-01-15" < d"2024-12-31"');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '<');
    }
  });

  it('should compile date comparison', () => {
    const ast = parse('d"2024-01-15" < d"2024-12-31"');
    assert.strictEqual(
      compileToRuby(ast),
      "Date.parse('2024-01-15') < Date.parse('2024-12-31')"
    );
    assert.strictEqual(
      compileToJavaScript(ast),
      "new Date('2024-01-15') < new Date('2024-12-31')"
    );
    assert.strictEqual(
      compileToSQL(ast),
      "DATE '2024-01-15' < DATE '2024-12-31'"
    );
  });
});

describe('Temporal - Complex Expressions', () => {
  it('should parse date range check', () => {
    const ast = parse('event_date >= d"2024-01-01" && event_date <= d"2024-01-01" + P30D');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '&&');
    }
  });

  it('should parse duration arithmetic', () => {
    const ast = parse('P1D + PT12H');
    assert.strictEqual(ast.type, 'binary');
    if (ast.type === 'binary') {
      assert.strictEqual(ast.operator, '+');
      assert.strictEqual(ast.left.type, 'duration');
      assert.strictEqual(ast.right.type, 'duration');
    }
  });

  it('should compile age check expression', () => {
    const ast = parse('current_date - birth_date > P18Y');
    const ruby = compileToRuby(ast);
    const js = compileToJavaScript(ast);
    const sql = compileToSQL(ast);

    assert.ok(ruby.includes('P18Y'));
    assert.ok(js.includes('P18Y'));
    assert.ok(sql.includes('P18Y'));
  });
});

describe('Temporal - Edge Cases', () => {
  it('should handle datetime with milliseconds', () => {
    const ast = parse('dt"2024-01-15T10:30:00.123Z"');
    assert.strictEqual(ast.type, 'datetime');
    if (ast.type === 'datetime') {
      assert.strictEqual(ast.value, '2024-01-15T10:30:00.123Z');
    }
  });

  it('should handle fractional durations', () => {
    const ast = parse('PT0.5H');
    assert.strictEqual(ast.type, 'duration');
    if (ast.type === 'duration') {
      assert.strictEqual(ast.value, 'PT0.5H');
    }
  });

  it('should handle week duration', () => {
    const ast = parse('P2W');
    assert.strictEqual(ast.type, 'duration');
    if (ast.type === 'duration') {
      assert.strictEqual(ast.value, 'P2W');
    }
  });
});
