## Problem to solve

Some acceptance tests are currently skipped, for various reasons, namely:

⊘ lambda.expected.ruby (skipped - requires variables)
⊘ member-access.expected.ruby (skipped - requires variables)
⊘ variables.expected.ruby (skipped - requires variables)
⊘ lambda.expected.js (skipped - requires variables)
⊘ member-access.expected.js (skipped - requires variables)
⊘ variables.expected.js (skipped - requires variables)
⊘ member-access.expected.sql (skipped)
⊘ variables.expected.sql (skipped)

They are skipped for different reasons, some seem legit others not. We should
clean that.

## Idea

Check why a given test is skipped and :

- Either keep it as such (valid reason)
- Remove the test completely (invalid reason)
