## Problem to solve

This does not work:

```elo
let y = fn( x ~> upper(x) ) in y('hello')
```

`upper` is not properly compiled.

## Idea

Add an acceptance (non regression) test, with an assert. Make it pass.

## Discussion

Claude: The bug is clear: inside a lambda, x has unknown type so upper(x) can't be dispatched to the correct implementation.

Me: right

Claude: The issue is upper is only registered for Types.string, not Types.any. I need to add fallback registrations for string functions.

Me: Wait a minute, didn't we introduce a pre-fallback mechanism previously, precisely to avoid having to register all functions for all
types ?

## Solution

The `typeGeneralizations` mechanism in StdLib goes from specific→general (e.g., `upper(string)` → `upper(any)`), but for lambdas we need the opposite: when calling `upper(any)`, we need an implementation.

For **operators** (add, sub, mul, etc.), we use runtime helpers (`kAdd`, `kSub`) that do dynamic type dispatch at runtime. This is needed because operators have type-specific behavior (e.g., temporal arithmetic).

For **string functions** (upper, lower, trim, etc.), the native method calls (`.toUpperCase()`, `.upcase`) work via duck typing - they'll accept any value and throw at runtime if it's not string-like. So we simply register them for `Types.any` as well as `Types.string`.

JavaScript already had this pattern. Ruby did not, causing the bug.

### Changes

1. **src/bindings/ruby.ts**: Updated string function registrations to loop over `[Types.string, Types.any]` like JavaScript does.

2. **test/fixtures/lambda-invocation.elo**: Added test cases for string functions in lambdas:
   - `let toUpper = fn( s ~> upper(s) ) in assert(toUpper('hello') == 'HELLO')`
   - `let toLower = fn( s ~> lower(s) ) in assert(toLower('HELLO') == 'hello')`
   - `let strLen = fn( s ~> length(s) ) in assert(strLen('hello') == 5)`

All tests pass.

## Follow-up

It seems to me that your general fallback mechanism is actually dangerous. It makes the assumption that we can generate code that
calls ruby/js methods with names in Elo, which most of the time will fail. I would replace the fallback implementation by an error
saying 'no function ... with signature ...'.
