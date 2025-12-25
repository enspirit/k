## Problem to solve

We'vs added stlib for strings, but that's probably not enough.

Given we have Boolean, Int, Float, String, Date, Datetime, Duration.

Let's say `K` will be used in NoCode tools like Klaro Cards, that allow non-tech
users to implement business utility software. What other stdlib functions do we
need so as to really cover 80% use cases easily ?

## Idea

Let make a list of typical functions to cover, and check whether they keep the
`K` language simple, portable and safe enough. If we agree on the list, you
could then extend the stdlib and its documentation with those functions.

## Method

- Add unit tests if you change the grammar or any other abstraction that could
  require unit tested logic.
- Add necessary acceptance tests, one function at a time.
- Make sure all tests keep passing, ensuring the semantics is portable accross
  target languages.
