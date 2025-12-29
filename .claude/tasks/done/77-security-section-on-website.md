## Problem to solve

We'd like to announce our security posture, and invite hackers to find bugs.

## Idea

Add a Security page one the website.

Explain that Elo aims at being a secure portable language, to be embedded in
No-Code/Low-Code tools and pipeline data processors (e.g. n8n, make, zapier).

We envision that end-users and AI will write Elo code and submit for execution
somewhere else. It's like Alice is writing some Elo code that will be executed
by Bob, even if Bob does not necessarily trust Alice.

So, we try to keep Elo secure by design: it's a pure expression evaluation
language, like a big calculator only. In terms of language design :

- No (infinite) loop, recursion, regular expressions
- No `eval` or similar constructs
- No access to i/o, web, async calls and the like.
- No access to the environment of the host language (e.g. window in javascript,
  constants and globals in Ruby, etc.)

(the environment that executes Elo code is expected to provide those layers,
somehow)

Then add a bug bounty section :

- We offer 50€ for middle severity issues, 100€ for high severity (final
  assessment made by our security team).
- We may reject an issue.
- Any security issue must be demonstrated with a correct .elo program, and
  an explanation of the target execution environment where the security issues
  arises.
- We double the price if a fix is provided.
- We have up to 90 days to fix the issue, and ask ethical hackers to keep it
  private at least that amount of time.
- Issues to be sent privately by email at security@enspirit.dev
- TO be paid, hackers must provide sufficient details about themselves, no purely
  anonymous submissions.
