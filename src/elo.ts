#!/usr/bin/env node

import { readFileSync } from 'fs';
import { parse } from './parser';
import { compileToJavaScriptWithMeta } from './compilers/javascript';
import { DateTime, Duration } from 'luxon';

interface Options {
  expression?: string;
  inputFile?: string;
  /** JSON input data to pass as _ (can be JSON string or @file path) */
  inputData?: string;
  /** Read input data from stdin */
  stdinData?: boolean;
}

function parseArgs(args: string[]): Options {
  const options: Options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-e':
      case '--expression':
        options.expression = args[++i];
        break;

      case '-d':
      case '--data':
        options.inputData = args[++i];
        break;

      case '--stdin':
        options.stdinData = true;
        break;

      case '-h':
      case '--help':
        printHelp();
        process.exit(0);
        break;

      case '-':
        // Read expression from stdin
        options.inputFile = '-';
        break;

      default:
        // If it doesn't start with -, treat it as input file
        if (!arg.startsWith('-') && !options.inputFile && !options.expression) {
          options.inputFile = arg;
        } else if (!arg.startsWith('-')) {
          console.error(`Unknown argument: ${arg}`);
          printHelp();
          process.exit(1);
        }
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Elo Evaluator (elo) - Evaluate Elo expressions

Usage:
  elo [options] [input-file]

Options:
  -e, --expression <expr>   Expression to evaluate (like ruby -e)
  -d, --data <json>         JSON input data for _ variable (or @file to read from file)
  --stdin                   Read input data as JSON from stdin
  -h, --help                Show this help message

Examples:
  # Evaluate a simple expression
  elo -e "2 + 3 * 4"

  # Evaluate with input data
  elo -e "_.x + _.y" -d '{"x": 1, "y": 2}'

  # Evaluate with input data from file
  elo -e "_.name" -d @data.json

  # Evaluate from .elo file
  elo expressions.elo

  # Pipe data through stdin
  echo '{"x": 10}' | elo -e "_.x * 2" --stdin

  # Read expression from stdin
  echo "2 + 3" | elo -
`);
}

/**
 * Parse input data from CLI option (JSON string or @file path)
 */
function parseInputData(inputData: string): unknown {
  let jsonString = inputData;

  // If starts with @, read from file
  if (inputData.startsWith('@')) {
    const filePath = inputData.slice(1);
    try {
      jsonString = readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.error(`Error reading input file ${filePath}: ${error}`);
      process.exit(1);
    }
  }

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error(`Error parsing input JSON: ${error}`);
    process.exit(1);
  }
}

/**
 * Compile and evaluate a single Elo expression
 */
function evaluate(source: string, inputValue: unknown): unknown {
  const ast = parse(source);
  const result = compileToJavaScriptWithMeta(ast);

  // Create function with luxon DateTime and Duration in scope
  // The compiled code is always a function that takes _ as input
  const execFn = new Function('DateTime', 'Duration', `return ${result.code}`);
  const fn = execFn(DateTime, Duration);

  return fn(inputValue);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const options = parseArgs(args);

  // Get the source expression(s)
  let sources: string[];
  if (options.expression) {
    sources = [options.expression];
  } else if (options.inputFile) {
    try {
      // Use file descriptor 0 for stdin when input is '-'
      const content = options.inputFile === '-'
        ? readFileSync(0, 'utf-8')
        : readFileSync(options.inputFile, 'utf-8');
      // Split into lines - keep all lines but mark empty/comment lines as null
      sources = content.split('\n').map(line => {
        const trimmed = line.trim();
        return (trimmed === '' || trimmed.startsWith('#')) ? '' : line;
      });
    } catch (error) {
      console.error(`Error reading ${options.inputFile === '-' ? 'stdin' : `file ${options.inputFile}`}: ${error}`);
      process.exit(1);
    }
  } else {
    console.error('Error: Must provide either -e <expression>, an input file, or - for stdin');
    printHelp();
    process.exit(1);
  }

  // Get input data
  let inputValue: unknown = null;

  if (options.stdinData) {
    try {
      const stdinContent = readFileSync(0, 'utf-8');
      inputValue = JSON.parse(stdinContent);
    } catch (error) {
      console.error(`Error reading/parsing stdin: ${error}`);
      process.exit(1);
    }
  } else if (options.inputData) {
    inputValue = parseInputData(options.inputData);
  }

  // Evaluate each expression
  const outputs: string[] = [];
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const trimmed = source.trim();

    // Skip empty lines and comments
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    try {
      const result = evaluate(trimmed, inputValue);
      outputs.push(JSON.stringify(result));
    } catch (error) {
      console.error(`Error on line ${i + 1}: ${error}`);
      process.exit(1);
    }
  }

  // Output results
  console.log(outputs.join('\n'));
}

main();
