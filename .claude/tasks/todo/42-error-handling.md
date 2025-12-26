## Problem to solve

In task #39 (hold on, information contracts) we identified that some error
handling might be needed. For instance because a Selector like Date may fail
(invalid iso8601).

So we probably need to add basic error support to the language.

## Idea

- I'm ok with a general error, such as ArgumentError
- I'm ok that stdlib raise this kind of error
- Possibly we need a user-facing `fail` function too, but I don't want to
  add an explicit try/catch mechanism

## Alternative

The real need is to offer a way to do something like

```
try `Date<iso8601>`, if it fails fallbacks to `Date<other representation>`,
if it fails, fail with an error message.
```

Instead of error handling, this could be seen as a chain of function calls
where the first one that returns a non `NoVal` type wins. We could have a
special construct for this.

## Brainstorming

What clean constructs exist in other languages for this kind of need ?
