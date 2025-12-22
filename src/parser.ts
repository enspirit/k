import { Expr, literal, variable, binary, unary, dateLiteral, dateTimeLiteral, durationLiteral } from './ast';

/**
 * Token types
 */
type TokenType =
  | 'NUMBER'
  | 'BOOLEAN'
  | 'IDENTIFIER'
  | 'DATE'
  | 'DATETIME'
  | 'DURATION'
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'PERCENT'
  | 'CARET'
  | 'LPAREN'
  | 'RPAREN'
  | 'LT'
  | 'GT'
  | 'LTE'
  | 'GTE'
  | 'EQ'
  | 'NEQ'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  position: number;
}

/**
 * Tokenizer for arithmetic expressions
 */
class Lexer {
  private input: string;
  private position: number = 0;
  private current: string;

  constructor(input: string) {
    this.input = input;
    this.current = input[0] || '';
  }

  private advance(): void {
    this.position++;
    this.current = this.position < this.input.length ? this.input[this.position] : '';
  }

  private skipWhitespace(): void {
    while (this.current && /\s/.test(this.current)) {
      this.advance();
    }
  }

  private readNumber(): string {
    let num = '';
    while (this.current && /[0-9.]/.test(this.current)) {
      num += this.current;
      this.advance();
    }
    return num;
  }

  private readIdentifier(): string {
    let id = '';
    while (this.current && /[a-zA-Z_0-9]/.test(this.current)) {
      id += this.current;
      this.advance();
    }
    return id;
  }

  private peek(): string {
    return this.position + 1 < this.input.length ? this.input[this.position + 1] : '';
  }

  private readStringContent(): string {
    let str = '';
    while (this.current && this.current !== '"') {
      str += this.current;
      this.advance();
    }
    return str;
  }

  private readDuration(): string {
    // Read ISO8601 duration: P1D, PT1H30M, P1Y2M3DT4H5M6S, P2W, etc.
    let duration = '';
    duration += this.current; // P
    this.advance();

    // Read date part (Y, M, W, D) and/or time part (T followed by H, M, S)
    while (this.current && /[0-9YMWDTHMS.]/.test(this.current)) {
      duration += this.current;
      this.advance();
    }

    return duration;
  }

  nextToken(): Token {
    this.skipWhitespace();

    if (!this.current) {
      return { type: 'EOF', value: '', position: this.position };
    }

    const pos = this.position;

    // Numbers
    if (/[0-9]/.test(this.current)) {
      return { type: 'NUMBER', value: this.readNumber(), position: pos };
    }

    // Date/DateTime literals: d"..." or dt"..."
    if (this.current === 'd') {
      const nextChar = this.peek();
      if (nextChar === '"') {
        // Date literal: d"YYYY-MM-DD"
        this.advance(); // skip 'd'
        this.advance(); // skip '"'
        const dateStr = this.readStringContent();
        this.advance(); // skip closing '"'
        return { type: 'DATE', value: dateStr, position: pos };
      } else if (nextChar === 't') {
        // Check for dt"..."
        const afterDt = this.position + 2 < this.input.length ? this.input[this.position + 2] : '';
        if (afterDt === '"') {
          // DateTime literal: dt"ISO8601"
          this.advance(); // skip 'd'
          this.advance(); // skip 't'
          this.advance(); // skip '"'
          const datetimeStr = this.readStringContent();
          this.advance(); // skip closing '"'
          return { type: 'DATETIME', value: datetimeStr, position: pos };
        }
      }
    }

    // ISO8601 Duration: P1D, PT1H30M, P1Y2M3D, etc.
    if (this.current === 'P') {
      const durationStr = this.readDuration();
      if (durationStr.length > 1) {
        return { type: 'DURATION', value: durationStr, position: pos };
      }
    }

    // Identifiers and keywords (true, false)
    if (/[a-zA-Z_]/.test(this.current)) {
      const id = this.readIdentifier();
      if (id === 'true' || id === 'false') {
        return { type: 'BOOLEAN', value: id, position: pos };
      }
      return { type: 'IDENTIFIER', value: id, position: pos };
    }

    // Multi-character operators
    const char = this.current;
    const next = this.peek();

    // Two-character operators
    if (char === '<' && next === '=') {
      this.advance();
      this.advance();
      return { type: 'LTE', value: '<=', position: pos };
    }
    if (char === '>' && next === '=') {
      this.advance();
      this.advance();
      return { type: 'GTE', value: '>=', position: pos };
    }
    if (char === '=' && next === '=') {
      this.advance();
      this.advance();
      return { type: 'EQ', value: '==', position: pos };
    }
    if (char === '!' && next === '=') {
      this.advance();
      this.advance();
      return { type: 'NEQ', value: '!=', position: pos };
    }
    if (char === '&' && next === '&') {
      this.advance();
      this.advance();
      return { type: 'AND', value: '&&', position: pos };
    }
    if (char === '|' && next === '|') {
      this.advance();
      this.advance();
      return { type: 'OR', value: '||', position: pos };
    }

    // Single-character operators
    this.advance();

    switch (char) {
      case '+': return { type: 'PLUS', value: char, position: pos };
      case '-': return { type: 'MINUS', value: char, position: pos };
      case '*': return { type: 'STAR', value: char, position: pos };
      case '/': return { type: 'SLASH', value: char, position: pos };
      case '%': return { type: 'PERCENT', value: char, position: pos };
      case '^': return { type: 'CARET', value: char, position: pos };
      case '(': return { type: 'LPAREN', value: char, position: pos };
      case ')': return { type: 'RPAREN', value: char, position: pos };
      case '<': return { type: 'LT', value: char, position: pos };
      case '>': return { type: 'GT', value: char, position: pos };
      case '!': return { type: 'NOT', value: char, position: pos };
      default:
        throw new Error(`Unexpected character '${char}' at position ${pos}`);
    }
  }
}

/**
 * Recursive descent parser for expressions
 *
 * Grammar:
 *   expr       -> logical_or
 *   logical_or -> logical_and ('||' logical_and)*
 *   logical_and -> equality ('&&' equality)*
 *   equality   -> comparison (('==' | '!=') comparison)*
 *   comparison -> addition (('<' | '>' | '<=' | '>=') addition)*
 *   addition   -> term (('+' | '-') term)*
 *   term       -> factor (('*' | '/' | '%') factor)*
 *   factor     -> power
 *   power      -> unary ('^' unary)*
 *   unary      -> ('!' | '-' | '+') unary | primary
 *   primary    -> NUMBER | BOOLEAN | DATE | DATETIME | DURATION | IDENTIFIER | '(' expr ')'
 */
export class Parser {
  private lexer: Lexer;
  private currentToken: Token;

  constructor(input: string) {
    this.lexer = new Lexer(input);
    this.currentToken = this.lexer.nextToken();
  }

  private eat(tokenType: TokenType): void {
    if (this.currentToken.type === tokenType) {
      this.currentToken = this.lexer.nextToken();
    } else {
      throw new Error(
        `Expected ${tokenType} but got ${this.currentToken.type} at position ${this.currentToken.position}`
      );
    }
  }

  private primary(): Expr {
    const token = this.currentToken;

    if (token.type === 'NUMBER') {
      this.eat('NUMBER');
      return literal(parseFloat(token.value));
    }

    if (token.type === 'BOOLEAN') {
      this.eat('BOOLEAN');
      return literal(token.value === 'true');
    }

    if (token.type === 'DATE') {
      this.eat('DATE');
      return dateLiteral(token.value);
    }

    if (token.type === 'DATETIME') {
      this.eat('DATETIME');
      return dateTimeLiteral(token.value);
    }

    if (token.type === 'DURATION') {
      this.eat('DURATION');
      return durationLiteral(token.value);
    }

    if (token.type === 'IDENTIFIER') {
      this.eat('IDENTIFIER');
      return variable(token.value);
    }

    if (token.type === 'LPAREN') {
      this.eat('LPAREN');
      const expr = this.expr();
      this.eat('RPAREN');
      return expr;
    }

    throw new Error(`Unexpected token ${token.type} at position ${token.position}`);
  }

  private unary(): Expr {
    if (this.currentToken.type === 'NOT') {
      this.eat('NOT');
      return unary('!', this.unary());
    }

    if (this.currentToken.type === 'PLUS') {
      this.eat('PLUS');
      return unary('+', this.unary());
    }

    if (this.currentToken.type === 'MINUS') {
      this.eat('MINUS');
      return unary('-', this.unary());
    }

    return this.primary();
  }

  private power(): Expr {
    let node = this.unary();

    // Right-associative
    if (this.currentToken.type === 'CARET') {
      this.eat('CARET');
      node = binary('^', node, this.power());
    }

    return node;
  }

  private factor(): Expr {
    let node = this.power();

    while (['STAR', 'SLASH', 'PERCENT'].includes(this.currentToken.type)) {
      const token = this.currentToken;

      if (token.type === 'STAR') {
        this.eat('STAR');
        node = binary('*', node, this.power());
      } else if (token.type === 'SLASH') {
        this.eat('SLASH');
        node = binary('/', node, this.power());
      } else if (token.type === 'PERCENT') {
        this.eat('PERCENT');
        node = binary('%', node, this.power());
      }
    }

    return node;
  }

  private term(): Expr {
    return this.factor();
  }

  private addition(): Expr {
    let node = this.term();

    while (['PLUS', 'MINUS'].includes(this.currentToken.type)) {
      const token = this.currentToken;

      if (token.type === 'PLUS') {
        this.eat('PLUS');
        node = binary('+', node, this.term());
      } else if (token.type === 'MINUS') {
        this.eat('MINUS');
        node = binary('-', node, this.term());
      }
    }

    return node;
  }

  private comparison(): Expr {
    let node = this.addition();

    while (['LT', 'GT', 'LTE', 'GTE'].includes(this.currentToken.type)) {
      const token = this.currentToken;

      if (token.type === 'LT') {
        this.eat('LT');
        node = binary('<', node, this.addition());
      } else if (token.type === 'GT') {
        this.eat('GT');
        node = binary('>', node, this.addition());
      } else if (token.type === 'LTE') {
        this.eat('LTE');
        node = binary('<=', node, this.addition());
      } else if (token.type === 'GTE') {
        this.eat('GTE');
        node = binary('>=', node, this.addition());
      }
    }

    return node;
  }

  private equality(): Expr {
    let node = this.comparison();

    while (['EQ', 'NEQ'].includes(this.currentToken.type)) {
      const token = this.currentToken;

      if (token.type === 'EQ') {
        this.eat('EQ');
        node = binary('==', node, this.comparison());
      } else if (token.type === 'NEQ') {
        this.eat('NEQ');
        node = binary('!=', node, this.comparison());
      }
    }

    return node;
  }

  private logical_and(): Expr {
    let node = this.equality();

    while (this.currentToken.type === 'AND') {
      this.eat('AND');
      node = binary('&&', node, this.equality());
    }

    return node;
  }

  private logical_or(): Expr {
    let node = this.logical_and();

    while (this.currentToken.type === 'OR') {
      this.eat('OR');
      node = binary('||', node, this.logical_and());
    }

    return node;
  }

  private expr(): Expr {
    return this.logical_or();
  }

  parse(): Expr {
    const result = this.expr();
    this.eat('EOF');
    return result;
  }
}

/**
 * Parse an arithmetic expression string into an AST
 */
export function parse(input: string): Expr {
  const parser = new Parser(input);
  return parser.parse();
}
