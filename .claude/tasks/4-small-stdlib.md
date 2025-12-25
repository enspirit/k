## Problem to solve

K needs at least common functions to manipulate scalar types (boolean numbers,
string, date/times), a small stdlib.

We also want to make sure our compiler will support generating code for those
functions of the stdlib.

## Idea

Let's propose a few usual functions to maniputate strings, and compilation
patterns for Ruby, SQL, and Javascript.

It's important that the proposal provides idiomatic names, and a stable
semantics across target languages. Add acceptance tests that check that.
