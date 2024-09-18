import { Mukadex } from "../mukadex";
import { Token } from "../token/token";
import { TokenType } from "../token/types";

const getKeywords = () => {
    const keywords = new Map<string, TokenType>();
    keywords.set("class", TokenType.CLASS);
    keywords.set("else", TokenType.ELSE);
    keywords.set("false", TokenType.FALSE);
    keywords.set("true", TokenType.TRUE);
    keywords.set("for", TokenType.FOR);
    keywords.set("function", TokenType.FUNCTION);
    keywords.set("if", TokenType.IF);
    keywords.set("nil", TokenType.NIL);
    keywords.set("or", TokenType.OR);
    keywords.set("and", TokenType.AND);
    keywords.set("print", TokenType.PRINT);
    keywords.set("return", TokenType.RETURN);
    keywords.set("super", TokenType.SUPER);
    keywords.set("this", TokenType.THIS);
    keywords.set("var", TokenType.VAR);
    keywords.set("while", TokenType.WHILE);
    return keywords;
}

export interface IScanner {
    scanTokens(): Token[];
}

export class Scanner implements IScanner {
    private readonly source: string;
    private readonly tokens: Token[] = [];
    private start: number = 0;
    private current: number = 0;
    private line: number = 1;

    static keywords = getKeywords();

    constructor(source: string) {
        this.source = source;
    }

    /**
     * Grabs the text of the current lexeme and creates a new token for it
     */
    private addToken(type: TokenType, literal: null | string = null): void {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push(new Token(type, text, literal, this.line));
    }

    /**
     * Consumes the current character if its equals to expected
     * @param expected
     * @returns 
     */
    private match(expected: string): boolean {
        if (this.isAtEnd()) return false;
        if (this.source.charAt(this.current) !== expected) return false;

        this.current += 1;
        return true;
    }

    /**
     * Consumes the next character in the source file
     * @returns {string} next character in source file
     */
    private advance(): string {
        this.current += 1;
        return this.source.charAt(this.current - 1);
    }

    private string(): void {
        while (this.peek() !== '"' && !this.isAtEnd()) {
            if (this.peek() !== '\n') {
                this.line += 1;
            }
            this.advance();
        }

        if (this.isAtEnd()) {
            Mukadex.error(this.tokens?.[this.current], 'Unterminated string.');
            return;
        }
        // The closing "
        this.advance();
        // Trim the surrounding quotes
        const value = this.source.substring(this.start + 1, this.current - 1);

        this.addToken(TokenType.STRING, value);
    }

    /**
     * Lookahead that looks to current unconsumed character
     */
    private peek(): string {
        if (this.isAtEnd()) return '\0';
        return this.source.charAt(this.current);
    }

    private peekNext(): string {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source.charAt(this.current + 1);
    }

    /** */
    private number() {
        while(this.isDigit(this.peek())) {
            this.advance();
        }
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            // consume the "."
            this.advance();
            while(this.isDigit(this.peek())) {
                this.advance();
            };
        }
        this.addToken(
            TokenType.NUMBER,
            this.source.substring(this.start, this.current),
        );
    }

    /** */
    private isDigit(character: string) {
        return character >= '0' && character <= '9';
    }
    

    private isAlphaNumeric(character: string): boolean {
        return this.isAlpha(character) || this.isDigit(character);
    }

    /**
     * Represents character is part of identifier
     */
    private isAlpha(character: string): boolean {
        return (character >= 'a' && character <= 'z') ||
        (character >= 'A' && character <= 'Z') ||
        character == '_';
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    private identifier(): void {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }
        const text = this.source.substring(this.start, this.current);
        let type = Scanner.keywords.get(text);
        if (!type) {
            type = TokenType.IDENTIFIER;
        }

        this.addToken(type, null);
    }

    /**
     * Consumes the next character and picks a token type for it
     */
    scanToken() {
        const character = this.advance();

        switch (character) {
            case '(': this.addToken(TokenType.LEFT_PAREN); break;
            case ')': this.addToken(TokenType.RIGHT_PAREN); break;
            case '{': this.addToken(TokenType.LEFT_BRACE); break;
            case '}': this.addToken(TokenType.RIGHT_BRACE); break;
            case ',': this.addToken(TokenType.COMMA); break;
            case '.': this.addToken(TokenType.DOT); break;
            case '-': this.addToken(TokenType.MINUS); break;
            case '+': this.addToken(TokenType.PLUS); break;
            case ';': this.addToken(TokenType.SEMICOLON); break;
            case '*': this.addToken(TokenType.STAR); break;
            case '!': {
                if (this.match('=')) {
                    this.addToken(TokenType.BANG_EQUAL);
                    break;
                }
                this.addToken(TokenType.BANG);
                break;
            }
            case '<': {
                if (this.match('=')) {
                    this.addToken(TokenType.LESS_EQUAL);
                    break;
                }
                this.addToken(TokenType.LESS);
                break;
            }
            case '>': {
                if (this.match('=')) {
                    this.addToken(TokenType.GREATER_EQUAL);
                    break;
                }
                this.addToken(TokenType.GREATER);
                break;
            }
            case '=': {
                if (this.match('=')) {
                    this.addToken(TokenType.EQUAL_EQUAL);
                    break;
                }
                this.addToken(TokenType.EQUAL);
                break;
            }
            case '/': {
                if (this.match('*') && this.match('*')) {
                    while (this.peek() !== '*' && this.peekNext() !== '/') {
                        this.advance();
                    }
                }
                if (this.match('/')) {
                    // A comment goes until EOL
                    while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
                }
                this.addToken(TokenType.SLASH);
                break;
            }
            case ' ':
            case '\r':
            case '\t':
                break;
            case '\n':
                this.line += 1;
                break;
            case '"': this.string(); break;
            default: {
                if (this.isDigit(character)) {
                    this.number();
                    break;
                }
                if (this.isAlpha(character)) {
                    this.identifier();
                    break;
                }

                Mukadex.error(this.tokens?.[this.current], `Unexpected character at line ${this.line}.`);
                break;
            }
        }
    }

    scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }
        this.tokens.push(new Token(TokenType.EOF, "", null, this.line));
        return this.tokens;
    }
}
