## Problem to solve

The current implementation of `let` in javascript and ruby relies on lamda
calls. White it seems semantically correct, it's extremely difficult to debug
generated code by inspection.

How can we fix that ?

## Idea

Find another way, more imperative, to compiler `let` constructs.
