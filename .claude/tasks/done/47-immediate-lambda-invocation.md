## Problem solved

Lambda expressions could not be invoked immediately - they had to be bound to a variable first:

```elo
let f = fn( ~> 42 ) in f()   -- worked
fn( ~> 42 )()                 -- did not work
```

## Solution

Extended the parser and compiler to support immediate lambda invocation:

- `fn( ~> 42 )()` - invoke parameterless lambda
- `fn( x ~> x * 2 )(5)` - invoke lambda with argument
- `(fn( ~> 42 ))()` - parenthesized form

## Changes

- Added `Apply` AST node for function application on expressions
- Extended parser's `postfix()` to handle `(args)` after any expression
- Handle `apply` in transform to create `IRApply` nodes
- Wrap JS lambda in parens when called: `(() => 42)()` not `() => 42()`
