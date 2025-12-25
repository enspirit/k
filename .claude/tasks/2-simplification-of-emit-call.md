## Problem to solve

The implementation of `emitCall` in three compilers is ugly and won't scale
if we eventually introduce a standard library with lots of reusable functions.

Also, relying on `startsWith` is not a great way to detect the kind of function
or operator the compiler is facing.

We need to refactor `emitCall` by introducing a clearner abstraction than a
pile of if/then/else.

## Idea

How about improving the `IRCall` node of the IR, along these lines :

1. Let's not have `add_int_int`, `add_float_float`, `add_duration_duration`, etc.
   Let's simply use `add` that we know exists in overloaded forms.

2. Let's add an array of argument types, e.g. `argTypes: KlangType[]`

3. Let's introduce a library abstraction that helps discovering the proper
   implementation to use for a given function call.
