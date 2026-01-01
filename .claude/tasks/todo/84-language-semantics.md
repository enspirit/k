## Problem to solve

The current implement is such that the compiled code is a function taking
`_` as parameter only if _ is actually used. Otherwise it's not a function.

It seems like accidental complexity to me.

## Idea

An Elo program should *always* be single function taking `_` as input and
returning an ouput value.

Let's refactor the compiler to have that invariant. And update the documentation
accordingly.
