# What is Klang?

[![CI](https://github.com/enspirit/k/actions/workflows/ci.yml/badge.svg)](https://github.com/enspirit/k/actions/workflows/ci.yml)

A small expression language that compiles/translates to Ruby, Javascript and PostgreSQL.

## Aim

Having small purely functional expressions expressed in a user-friendly language,
that can be evaluated in different environments.

## Current Features

- **Arithmetic expressions** with scalars and variables
- **Boolean expressions** with comparison and logical operators
- **Temporal types** with dates, datetimes, and ISO8601 durations
- **Infix notation** (standard mathematical notation)
- **Arithmetic operators**: `+`, `-`, `*`, `/`, `%`, `^` (power)
- **Comparison operators**: `<`, `>`, `<=`, `>=`, `==`, `!=`
- **Logical operators**: `&&`, `||`, `!`
- **Unary operators**: `-`, `+`, `!`
- **Literals**:
  - Numbers: `42`, `3.14`
  - Booleans: `true`, `false`
  - Dates: `D2024-01-15`
  - DateTimes: `D2024-01-15T10:30:00Z`
  - Durations: `P1D`, `PT1H30M`, `P1Y2M3D` (ISO8601)
- **Parentheses** for grouping
- **Multi-target compilation**:
  - Ruby (using `**` for power, `&&`/`||`/`!` for boolean logic, `Date.parse()`, `DateTime.parse()`, `ActiveSupport::Duration.parse()`)
  - JavaScript (using `Math.pow()` for power, `&&`/`||`/`!` for boolean logic, `new Date()`, `Duration.parse()`)
  - PostgreSQL (using `POWER()` for power, `AND`/`OR`/`NOT` for boolean logic, `DATE`, `TIMESTAMP`, `INTERVAL` for temporals)

## Installation

```bash
npm install
npm run build
```

## Testing

Klang uses a comprehensive test suite that verifies:
- **Unit tests**: Parser, AST, and compiler components
- **Integration tests**: End-to-end compilation output
- **Acceptance tests**: Compiled code execution in real runtimes (Ruby, Node.js, PostgreSQL)

```bash
npm run test:unit
npm run test:integration
npm run test:acceptance
```

## Parsing and Compiling Expressions

```typescript
import { parse, compileToRuby, compileToJavaScript, compileToSQL } from './src';

// Parse an expression
const ast = parse(`
  let
    x = TODAY,
    y = 3
  in
    assert(x + y * P1D == TODAY + P3D)
`);

// Compile to different targets
console.log(compileToRuby(ast));
console.log(compileToJavaScript(ast));
console.log(compileToSQL(ast));
```

## Programmatic AST Construction

```typescript
import { binary, variable, literal } from './src';

// Build: (price * quantity) - discount
const ast = binary(
  '-',
  binary('*', variable('price'), variable('quantity')),
  variable('discount')
);
```

## Examples

Run the examples:

```bash
npm run build
node dist/examples/basic.js     # Arithmetic expressions
node dist/examples/boolean.js   # Boolean expressions
node dist/examples/temporal.js  # Temporal expressions (dates, durations)
node dist/examples/demo.js      # Quick demo
```

## Project Structure

```
klang/
├── src/              # Compiler source code
│   ├── parser.ts     # Lexer and parser
│   ├── ast.ts        # AST definitions
│   ├── types.ts      # Type system
│   ├── ir.ts         # Intermediate representation
│   ├── transform.ts  # AST → IR transformation with type inference
│   ├── stdlib.ts     # Standard library abstraction
│   ├── compilers/    # Code generators (Ruby, JavaScript, SQL)
│   └── preludes/     # Runtime support libraries
├── test/             # Test suite
│   ├── fixtures/     # Test cases
│   ├── unit/         # Component tests
│   ├── integration/  # Compilation tests
│   └── acceptance/   # Runtime execution tests
├── examples/         # Usage examples
├── bin/kc            # CLI tool
└── CLAUDE.md         # Developer guide
```

For detailed architecture documentation, see [CLAUDE.md](CLAUDE.md).

## Roadmap

Future enhancements could include:
- **String literals and operations**: String concatenation, pattern matching, substring operations
- **Conditional expressions**: Ternary operator (`condition ? then : else`) or if-then-else syntax
- **Function calls**: Built-in and user-defined functions (e.g., `abs(x)`, `round(price, 2)`)
- **Array/list literals**: Support for arrays and collection operations
- **Null handling**: Null literals and null-safe operations
- **Type system**: Optional static type checking and type inference
- **Optimization**: Constant folding, expression simplification, dead code elimination
- **Additional targets**: Python, Go, Rust code generation
- **Timezone support**: Explicit timezone handling for datetime operations

## Contributing

Klang follows a strict test-driven development methodology to ensure semantic equivalence across all three target languages (Ruby, JavaScript, SQL).

**For developers and AI assistants**: See [CLAUDE.md](CLAUDE.md) for:
- Test-driven development workflow
- Three-stage test methodology (unit → integration → acceptance)
- How to add new features and operators
- Architecture documentation
- Troubleshooting guide

