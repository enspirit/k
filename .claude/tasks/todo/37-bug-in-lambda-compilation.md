## Problem to solve

This does not work:

```elo
let y = fn( x ~> upper(x) ) in y('hello')
```

`upper` is not properly compiled.

## Idea

Add an acceptance (non regression) test, with an assert. Make it pass.
