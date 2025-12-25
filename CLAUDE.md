# Claude Development Guide for Klang

This document provides instructions for AI assistants (like Claude) working on the Klang compiler project.

## Project Overview

Klang is a small expression language that compiles to three target languages:
- **Ruby**: Server-side scripting
- **JavaScript**: Client-side execution
- **PostgreSQL SQL**: Database queries

The compiler translates Klang expressions into semantically equivalent code in each target language.

## Architecture

KLang currently has the following components :

* A parser (`src/parser.ts`)
* AST types and factory (`src/ast.ts`)
* Type system (`src/types.ts`)
* Intermediate Representation with type inference (`src/ir.ts`, `src/transform.ts`)
* Standard library abstraction for type-based dispatch (`src/stdlib.ts`)
* One compiler per target language (`src/compilers/*.ts`)
* A binary command (`bin/kc` and `src/cli.ts`)
* A try-k website to demonstrate K (`web/`)

### Compilation Pipeline

1. **Parse**: Source → AST (`parser.ts`)
2. **Transform**: AST → Typed IR (`transform.ts`) - infers types and rewrites operators as function calls
3. **Emit**: IR → Target code (`compilers/*.ts`) - uses `StdLib` for type-based dispatch

## Test-Driven Development

Klang is developped in TDD. We have three levels of testing :

* `npm run test:unit` : checks the behavior of core and utility functions
* `npm run test:integration` : checks expected compilation output from sources
* `npm run test:acceptance` : checks expected semantics against `ruby`, `node` and `psql`

**CRITICAL** : the three levels of tests MUST be maintained ; all tests MUST PASS at all times.

The tests are organized as follows :

* `test/unit/**/*.ts` are unit tests without dependencies
* `test/fixtures/*` are klang expression files and their expected compilation in the target languages
* `test/integration/**/*.ts` check the compiler and cli, using fixtures
* `test/acceptance/**/*.ts` check the actual execution of generated code, using fixtures
