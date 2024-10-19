"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scanner = void 0;
const mukadex_1 = require("../mukadex");
const token_1 = require("../token/token");
const types_1 = require("../token/types");
const getKeywords = () => {
    const keywords = new Map();
    keywords.set("class", types_1.TokenType.CLASS);
    keywords.set("else", types_1.TokenType.ELSE);
    keywords.set("false", types_1.TokenType.FALSE);
    keywords.set("true", types_1.TokenType.TRUE);
    keywords.set("for", types_1.TokenType.FOR);
    keywords.set("fun", types_1.TokenType.FUN);
    keywords.set("if", types_1.TokenType.IF);
    keywords.set("nil", types_1.TokenType.NIL);
    keywords.set("or", types_1.TokenType.OR);
    keywords.set("and", types_1.TokenType.AND);
    keywords.set("print", types_1.TokenType.PRINT);
    keywords.set("return", types_1.TokenType.RETURN);
    keywords.set("super", types_1.TokenType.SUPER);
    keywords.set("this", types_1.TokenType.THIS);
    keywords.set("var", types_1.TokenType.VAR);
    keywords.set("while", types_1.TokenType.WHILE);
    keywords.set("break", types_1.TokenType.BREAK);
    return keywords;
};
class Scanner {
    source;
    tokens = [];
    start = 0;
    current = 0;
    line = 1;
    static keywords = getKeywords();
    constructor(source) {
        this.source = source;
    }
    /**
     * Grabs the text of the current lexeme and creates a new token for it
     */
    addToken(type, literal = null) {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push(new token_1.Token(type, text, literal, this.line));
    }
    /**
     * Consumes the current character if its equals to expected
     * @param expected
     * @returns
     */
    match(expected) {
        if (this.isAtEnd())
            return false;
        if (this.source.charAt(this.current) !== expected)
            return false;
        this.current += 1;
        return true;
    }
    /**
     * Consumes the next character in the source file
     * @returns {string} next character in source file
     */
    advance() {
        this.current += 1;
        return this.source.charAt(this.current - 1);
    }
    string() {
        while (this.peek() !== '"' && !this.isAtEnd()) {
            if (this.peek() !== '\n') {
                this.line += 1;
            }
            this.advance();
        }
        if (this.isAtEnd()) {
            mukadex_1.Mukadex.error(this.tokens?.[this.current], 'Unterminated string.');
            return;
        }
        // The closing "
        this.advance();
        // Trim the surrounding quotes
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(types_1.TokenType.STRING, value);
    }
    /**
     * Lookahead that looks to current unconsumed character
     */
    peek() {
        if (this.isAtEnd())
            return '\0';
        return this.source.charAt(this.current);
    }
    peekNext() {
        if (this.current + 1 >= this.source.length)
            return '\0';
        return this.source.charAt(this.current + 1);
    }
    /** */
    number() {
        while (this.isDigit(this.peek())) {
            this.advance();
        }
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            // consume the "."
            this.advance();
            while (this.isDigit(this.peek())) {
                this.advance();
            }
            ;
        }
        this.addToken(types_1.TokenType.NUMBER, Number(this.source.substring(this.start, this.current)));
    }
    /** */
    isDigit(character) {
        return character >= '0' && character <= '9';
    }
    isAlphaNumeric(character) {
        return this.isAlpha(character) || this.isDigit(character);
    }
    /**
     * Represents character is part of identifier
     */
    isAlpha(character) {
        return (character >= 'a' && character <= 'z') ||
            (character >= 'A' && character <= 'Z') ||
            character == '_';
    }
    isAtEnd() {
        return this.current >= this.source.length;
    }
    identifier() {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }
        const text = this.source.substring(this.start, this.current);
        let type = Scanner.keywords.get(text);
        if (!type) {
            type = types_1.TokenType.IDENTIFIER;
        }
        this.addToken(type, null);
    }
    /**
     * Consumes the next character and picks a token type for it
     */
    scanToken() {
        const character = this.advance();
        switch (character) {
            case '(':
                this.addToken(types_1.TokenType.LEFT_PAREN);
                break;
            case ')':
                this.addToken(types_1.TokenType.RIGHT_PAREN);
                break;
            case '{':
                this.addToken(types_1.TokenType.LEFT_BRACE);
                break;
            case '}':
                this.addToken(types_1.TokenType.RIGHT_BRACE);
                break;
            case ',':
                this.addToken(types_1.TokenType.COMMA);
                break;
            case '.':
                this.addToken(types_1.TokenType.DOT);
                break;
            case '-':
                this.addToken(types_1.TokenType.MINUS);
                break;
            case '+':
                this.addToken(types_1.TokenType.PLUS);
                break;
            case ';':
                this.addToken(types_1.TokenType.SEMICOLON);
                break;
            case '*':
                this.addToken(types_1.TokenType.STAR);
                break;
            case '!': {
                if (this.match('=')) {
                    this.addToken(types_1.TokenType.BANG_EQUAL);
                    break;
                }
                this.addToken(types_1.TokenType.BANG);
                break;
            }
            case '<': {
                if (this.match('=')) {
                    this.addToken(types_1.TokenType.LESS_EQUAL);
                    break;
                }
                this.addToken(types_1.TokenType.LESS);
                break;
            }
            case '>': {
                if (this.match('=')) {
                    this.addToken(types_1.TokenType.GREATER_EQUAL);
                    break;
                }
                this.addToken(types_1.TokenType.GREATER);
                break;
            }
            case '=': {
                if (this.match('=')) {
                    this.addToken(types_1.TokenType.EQUAL_EQUAL);
                    break;
                }
                this.addToken(types_1.TokenType.EQUAL);
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
                    while (this.peek() !== '\n' && !this.isAtEnd())
                        this.advance();
                }
                this.addToken(types_1.TokenType.SLASH);
                break;
            }
            case ' ':
            case '\r':
            case '\t':
                break;
            case '\n':
                this.line += 1;
                break;
            case '"':
                this.string();
                break;
            default: {
                if (this.isDigit(character)) {
                    this.number();
                    break;
                }
                if (this.isAlpha(character)) {
                    this.identifier();
                    break;
                }
                mukadex_1.Mukadex.error(this.tokens?.[this.current], `Unexpected character at line ${this.line}.`);
                break;
            }
        }
    }
    scanTokens() {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }
        this.tokens.push(new token_1.Token(types_1.TokenType.EOF, "", null, this.line));
        return this.tokens;
    }
}
exports.Scanner = Scanner;
