## Problem to solve

Claude Code says 'K supports variables' but that's not exactly true. For instance

- `x * 2` compiles to `klang.mul(x, 2)` in Javascript, which evaluates to `x is not defined`
- Acceptance tests involving variables are currently skipped, showing we have a problem.

In addition, Klaro Cards, Bmg, Finitio, all require compiling expressions with free variables.
The compilation should be seen as generating a function binding those free variables to
parameters.

For instance, in Klaro Cards, an expression like `_.budget * 1.21` is actually compiled
(with another mechanism than K) to a function like this :

```javascript
function(_) {
  return _.budget * 1.21;
}
```

This kind of use case should be supported in a clean way in K.

## Idea

Either :

- Introduce a compilation schema that encloses all compilation expressions to a function
  taking free variables as parameters.
- Or introduce an explicit function construct in the K language itself.

Let's see the pros and cons of each, and plan a solution.
