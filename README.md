# What is Klang?

A small expression language that compiles/translates to Ruby, Javascript and PostgreSQL.

## Aim

Having small purely functional expressions expressed in a user-friendly language,
that can be evaluated in different environments.

## Current Features

- **Arithmetic expressions** with scalars and variables
- **Boolean expressions** with comparison and logical operators
- **Infix notation** (standard mathematical notation)
- **Arithmetic operators**: `+`, `-`, `*`, `/`, `%`, `^` (power)
- **Comparison operators**: `<`, `>`, `<=`, `>=`, `==`, `!=`
- **Logical operators**: `&&`, `||`, `!`
- **Unary operators**: `-`, `+`, `!`
- **Boolean literals**: `true`, `false`
- **Parentheses** for grouping
- **Multi-target compilation**:
  - Ruby (using `**` for power, `&&`/`||`/`!` for boolean logic)
  - JavaScript (using `Math.pow()` for power, `&&`/`||`/`!` for boolean logic)
  - PostgreSQL (using `POWER()` for power, `AND`/`OR`/`NOT` for boolean logic, `TRUE`/`FALSE` for booleans)

## Installation

```bash
npm install
npm run build
```

## Testing

Klang includes a comprehensive test suite with 110+ tests covering:
- Parser and lexer functionality
- AST construction
- All three target compilers
- Integration tests
- Edge cases and error handling

Run the tests:
```bash
npm test
```

## Usage

### Parsing and Compiling Arithmetic Expressions

```typescript
import { parse, compileToRuby, compileToJavaScript, compileToSQL } from './src';

// Parse an expression
const ast = parse('x + y * 2');

// Compile to different targets
console.log(compileToRuby(ast));       // => x + y * 2
console.log(compileToJavaScript(ast)); // => x + y * 2
console.log(compileToSQL(ast));        // => x + y * 2

// Power operator example
const powerExpr = parse('2 ^ 3 + 1');
console.log(compileToRuby(powerExpr));       // => 2 ** 3 + 1
console.log(compileToJavaScript(powerExpr)); // => Math.pow(2, 3) + 1
console.log(compileToSQL(powerExpr));        // => POWER(2, 3) + 1
```

### Boolean Expressions

```typescript
// Comparison operators
const ast1 = parse('x > 10 && x < 100');
console.log(compileToRuby(ast1));       // => x > 10 && x < 100
console.log(compileToJavaScript(ast1)); // => x > 10 && x < 100
console.log(compileToSQL(ast1));        // => x > 10 AND x < 100

// Logical operators with boolean literals
const ast2 = parse('active == true || admin == true');
console.log(compileToRuby(ast2));       // => active == true || admin == true
console.log(compileToJavaScript(ast2)); // => active == true || admin == true
console.log(compileToSQL(ast2));        // => active == TRUE OR admin == TRUE

// Negation
const ast3 = parse('!disabled');
console.log(compileToRuby(ast3));       // => !disabled
console.log(compileToJavaScript(ast3)); // => !disabled
console.log(compileToSQL(ast3));        // => NOT disabled
```

### Programmatic AST Construction

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
node dist/examples/demo.js      # Quick demo
```

## Grammar

```
expr       -> logical_or
logical_or -> logical_and ('||' logical_and)*
logical_and -> equality ('&&' equality)*
equality   -> comparison (('==' | '!=') comparison)*
comparison -> addition (('<' | '>' | '<=' | '>=') addition)*
addition   -> term (('+' | '-') term)*
term       -> factor (('*' | '/' | '%') factor)*
factor     -> power
power      -> unary ('^' unary)*
unary      -> ('!' | '-' | '+') unary | primary
primary    -> NUMBER | BOOLEAN | IDENTIFIER | '(' expr ')'
```

## Project Structure

```
klang/
├── src/
│   ├── ast.ts              # AST node type definitions
│   ├── parser.ts           # Lexer and parser for infix expressions
│   ├── index.ts            # Main exports
│   └── compilers/
│       ├── ruby.ts         # Ruby code generator
│       ├── javascript.ts   # JavaScript code generator
│       └── sql.ts          # PostgreSQL code generator
├── examples/
│   ├── basic.ts            # Arithmetic expression examples
│   ├── boolean.ts          # Boolean expression examples
│   └── demo.ts             # Quick demo
├── package.json
├── tsconfig.json
└── README.md
```

## Roadmap

Future enhancements could include:
- String literals and string operations
- Conditional expressions (`if-then-else` or ternary operator)
- Function calls
- Array/list literals
- Type system
- Optimizer for constant folding

