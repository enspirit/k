# Claude Development Guide for Klang

This document provides instructions for AI assistants (like Claude) working on the Klang compiler project.

## Project Overview

Klang is a small expression language that compiles to three target languages:
- **Ruby**: Server-side scripting
- **JavaScript**: Client-side execution
- **PostgreSQL SQL**: Database queries

The compiler translates Klang expressions into semantically equivalent code in each target language.

## Core Principle: Test-Driven Development

**CRITICAL**: When extending Klang with new features, ALWAYS follow this three-stage test methodology:

### Stage 1: Unit Tests (Component Testing)

Write unit tests FIRST, before any implementation. Unit tests verify individual components work correctly in isolation.

**Files to modify:**
- `test/unit/parser.unit.test.ts` - Lexer and parser tests
- `test/unit/ast.unit.test.ts` - AST helper function tests
- `test/unit/compilers/ruby.unit.test.ts` - Ruby compiler tests
- `test/unit/compilers/javascript.unit.test.ts` - JavaScript compiler tests
- `test/unit/compilers/sql.unit.test.ts` - SQL compiler tests

**What to test:**
1. **Parser**: Can the new syntax be correctly parsed into an AST?
2. **AST helpers**: Do helper functions create correct AST nodes?
3. **Each compiler**: Does each compiler generate the correct target code for the new feature?

**Example workflow for adding string literals:**

```typescript
// test/unit/parser.unit.test.ts
describe('Parser - String Literals', () => {
  test('should parse double-quoted strings', () => {
    const ast = parse('"hello world"');
    assert.deepStrictEqual(ast, {
      type: 'literal',
      valueType: 'string',
      value: 'hello world'
    });
  });
});

// test/unit/compilers/ruby.unit.test.ts
describe('Ruby Compiler - String Literals', () => {
  test('should compile strings with proper escaping', () => {
    const ast = literal('hello');
    assert.strictEqual(compileToRuby(ast), '"hello"');
  });
});

// Similar tests for JavaScript and SQL compilers
```

**Run unit tests:**
```bash
npm run test:unit
```

### Stage 2: Integration Tests (Output Verification)

Add integration tests that verify the complete compilation pipeline produces correct output for all three targets.

**Files to modify:**
- `test/fixtures/*.klang` - Klang source expressions
- `test/fixtures/*.expected.ruby` - Expected Ruby output
- `test/fixtures/*.expected.js` - Expected JavaScript output
- `test/fixtures/*.expected.sql` - Expected SQL output

**What to test:**
- End-to-end compilation: Klang → Ruby/JavaScript/SQL
- Output matches expected strings exactly
- All three targets produce semantically equivalent code

**Example workflow:**

```bash
# 1. Create test fixture
echo '"hello" + " world"' > test/fixtures/string-concat.klang

# 2. Create expected outputs
echo '"hello" + " world"' > test/fixtures/string-concat.expected.ruby
echo '"hello" + " world"' > test/fixtures/string-concat.expected.js
echo "'hello' || ' world'" > test/fixtures/string-concat.expected.sql
```

The integration test framework automatically:
1. Compiles each `.klang` file to all three targets
2. Compares output with corresponding `.expected.*` files
3. Reports any mismatches

**Run integration tests:**
```bash
npm run test:integration
```

### Stage 3: Implementation

NOW implement the feature to make the tests pass:

1. **Update parser** (`src/parser.ts`):
   - Add lexer tokens for new syntax
   - Add parsing rules
   - Generate correct AST nodes

2. **Update AST types** (`src/ast.ts`):
   - Add new node types if needed
   - Add helper functions for creating nodes

3. **Update compilers** (`src/compilers/*.ts`):
   - Add compilation logic for new AST node types
   - Handle target-specific syntax differences
   - Ensure correct operator precedence and parenthesization

4. **Run tests repeatedly** until all pass:
   ```bash
   npm run test:unit
   npm run test:integration
   ```

### Stage 4: Acceptance Tests (Runtime Verification)

After unit and integration tests pass, verify the compiled code actually executes correctly in real runtimes.

**Test scripts:**
- `test/acceptance/test-ruby.sh` - Executes `.expected.ruby` files with Ruby
- `test/acceptance/test-js.sh` - Executes `.expected.js` files with Node.js
- `test/acceptance/test-sql.sh` - Executes `.expected.sql` files with PostgreSQL

**What acceptance tests verify:**
- Compiled Ruby code runs without errors in Ruby interpreter
- Compiled JavaScript code runs without errors in Node.js
- Compiled SQL code runs without errors in PostgreSQL
- Runtime behavior matches expected semantics

**Important notes:**
- Ruby tests require `src/preludes/prelude.rb` (loaded via `ruby -r`)
- JavaScript tests require `src/preludes/prelude.js` (prepended to each test)
- SQL tests require PostgreSQL running (gracefully skipped if unavailable)

**Fixture format for acceptance tests:**

Acceptance test fixtures should be **executable assertions**:

```ruby
# test/fixtures/string-concat.expected.ruby
raise "Failed" unless "hello" + " world" == "hello world"
```

```javascript
// test/fixtures/string-concat.expected.js
(function() {
  if (!("hello" + " world" == "hello world"))
    throw new Error("Failed");
  return true;
})()
```

```sql
-- test/fixtures/string-concat.expected.sql
'hello' || ' world'
```

**Run acceptance tests:**
```bash
npm run test:acceptance

# Or run individual language tests:
./test/acceptance/test-ruby.sh
./test/acceptance/test-js.sh
./test/acceptance/test-sql.sh
```

## Test Execution Order

Always run tests in this order:

```bash
npm test  # Runs: unit → integration → acceptance
```

Or manually:
```bash
npm run test:unit         # Fast: ~1s
npm run test:integration  # Fast: ~1s
npm run test:acceptance   # Fast: ~100ms (direct runtime execution)
```

## Common Patterns

### Adding a New Operator

1. **Unit tests** - Test parsing and compilation:
```typescript
// Parser
test('should parse ternary operator', () => {
  const ast = parse('x > 0 ? 1 : -1');
  // assert AST structure
});

// Ruby compiler
test('should compile ternary to Ruby', () => {
  assert.strictEqual(
    compileToRuby(ternaryNode),
    'x > 0 ? 1 : -1'
  );
});

// JavaScript compiler (same)
// SQL compiler (CASE WHEN)
test('should compile ternary to SQL CASE', () => {
  assert.strictEqual(
    compileToSQL(ternaryNode),
    'CASE WHEN x > 0 THEN 1 ELSE -1 END'
  );
});
```

2. **Integration tests** - Create fixtures:
```bash
echo 'x > 0 ? 1 : -1' > test/fixtures/ternary.klang
echo 'x > 0 ? 1 : -1' > test/fixtures/ternary.expected.ruby
echo 'x > 0 ? 1 : -1' > test/fixtures/ternary.expected.js
echo 'CASE WHEN x > 0 THEN 1 ELSE -1 END' > test/fixtures/ternary.expected.sql
```

3. **Implement** - Update parser and compilers

4. **Acceptance tests** - Add executable assertions to fixtures

### Adding a New Type (e.g., Strings)

1. **Unit tests** for:
   - Lexer tokenization of string literals
   - Parser handling of string syntax
   - Each compiler's string representation

2. **Integration tests** with:
   - String literals: `"hello"`
   - String concatenation: `"hello" + " world"`
   - String comparisons: `name == "Alice"`

3. **Implementation**:
   - Add `STRING` token type to lexer
   - Add string parsing rules
   - Update AST types
   - Implement string compilation for each target

4. **Acceptance tests** - Verify strings work at runtime

### Handling Target Language Differences

When target languages have different syntax, the compilers must adapt:

**Example: Power operator**
- Klang: `2 ^ 3`
- Ruby: `2 ** 3`
- JavaScript: `Math.pow(2, 3)`
- SQL: `POWER(2, 3)`

Each compiler handles this differently:
```typescript
// src/compilers/ruby.ts
if (node.operator === '^') {
  return `${left} ** ${right}`;
}

// src/compilers/javascript.ts
if (node.operator === '^') {
  return `Math.pow(${left}, ${right})`;
}

// src/compilers/sql.ts
if (node.operator === '^') {
  return `POWER(${left}, ${right})`;
}
```

## Prelude Files

Some features require runtime support libraries:

- `src/preludes/prelude.rb` - Ruby prelude (requires, includes)
- `src/preludes/prelude.js` - JavaScript prelude (helper classes like `Duration`)
- `src/preludes/prelude.sql` - SQL prelude (custom functions if needed)

**When to update preludes:**
- Adding temporal/date operations (already uses `Duration` class in JS)
- Adding complex helper functions
- Providing polyfills for missing target language features

## File Organization

```
klang/
├── src/
│   ├── ast.ts                    # AST type definitions
│   ├── parser.ts                 # Lexer and parser
│   ├── index.ts                  # Public API exports
│   ├── preludes/                 # Runtime support libraries
│   │   ├── prelude.rb
│   │   ├── prelude.js
│   │   └── prelude.sql
│   └── compilers/
│       ├── ruby.ts               # Ruby code generator
│       ├── javascript.ts         # JavaScript code generator
│       └── sql.ts                # SQL code generator
├── test/
│   ├── fixtures/                 # Test cases (all test tiers use these)
│   │   ├── *.klang              # Klang source
│   │   ├── *.expected.ruby      # Expected Ruby output
│   │   ├── *.expected.js        # Expected JavaScript output
│   │   └── *.expected.sql       # Expected SQL output
│   ├── unit/                     # Component tests
│   │   ├── ast.unit.test.ts
│   │   ├── parser.unit.test.ts
│   │   └── compilers/
│   │       ├── ruby.unit.test.ts
│   │       ├── javascript.unit.test.ts
│   │       └── sql.unit.test.ts
│   ├── integration/              # End-to-end compilation tests
│   │   └── compiler.integration.test.ts
│   └── acceptance/               # Runtime execution tests
│       ├── test-all.sh          # Orchestrator
│       ├── test-ruby.sh         # Ruby runtime tests
│       ├── test-js.sh           # Node.js runtime tests
│       └── test-sql.sh          # PostgreSQL runtime tests
└── examples/                     # Usage examples
    ├── basic.ts
    ├── boolean.ts
    └── temporal.ts
```

## Workflow Summary

For any new feature:

1. ✅ **Write unit tests** - Parser + all three compilers
2. ✅ **Create integration fixtures** - `.klang` + `.expected.*` files
3. ✅ **Run tests** - They should FAIL (red)
4. ✅ **Implement feature** - Parser → AST → Compilers
5. ✅ **Run tests** - Keep iterating until GREEN
6. ✅ **Verify acceptance tests** - Compiled code runs in real runtimes
7. ✅ **Update documentation** - README.md examples if needed

**Never skip the tests-first approach.** This ensures:
- Feature works across all three targets
- No regressions in existing functionality
- Clear specification of expected behavior
- Confidence in semantic equivalence

## Current Test Coverage

- **Unit tests**: 125 tests (parser, AST, compilers)
- **Integration tests**: 65 tests (compilation output verification)
- **Acceptance tests**: 27 passing, 6 skipped (runtime execution)
  - Ruby: 9 passed, 2 skipped
  - JavaScript: 9 passed, 2 skipped
  - SQL: 9 passed, 2 skipped
  - Skipped: `member-access` and `variables` (require variable injection)

**Total: 190 tests passing**

## Tips for Claude

- **Don't guess syntax** - Read existing tests to understand patterns
- **Test incrementally** - Add one small feature at a time
- **Check all three targets** - Ruby, JavaScript, AND SQL must work
- **Use existing fixtures as templates** - Copy patterns from working tests
- **Run tests frequently** - Catch issues early
- **Prelude for runtime support** - Add to prelude files when needed
- **Follow TDD strictly** - Tests first, implementation second

## Common Issues

**Integration tests fail but unit tests pass:**
- Check fixture file paths and naming
- Ensure `.expected.*` files have correct syntax for target language
- Verify TEST_DIR paths in integration test

**Acceptance tests fail but integration tests pass:**
- Missing prelude loading (JavaScript Duration, Ruby ActiveSupport)
- Runtime errors in generated code (check with manual execution)
- PostgreSQL not running (SQL tests are gracefully skipped)

**All tests fail after changes:**
- Parser changes may have broken existing functionality
- Run git diff to see what changed
- Revert and make smaller incremental changes

## Getting Help

If stuck:
1. Read existing test files for patterns
2. Check `README.md` for feature documentation
3. Look at git history: `git log --oneline`
4. Examine similar features in the codebase
5. Run tests with verbose output to see failure details
