## Problem to solve

More than once Claude Code suggested edits of .klang files that separated various
sections with a (multiline) comment.

It did not pass the parser and Claude had to remove those comments to keep going.

We should support single and multiline comment.

## Idea

Let's simply mimic Ruby here, and support comments with `#`.

## Method

- Add unit tests for the parser.
- Revisit all .klang feature files to include comments, separating examples of
  different nature.
- Don't compile those comments in any way.
