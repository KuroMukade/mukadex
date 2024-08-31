"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const Expr_1 = require("Expr");
const mukadex_1 = require("mukadex");
const types_1 = require("token/types");
class ParseError extends Error {
}
class Parser {
    tokens;
    current = 0;
    constructor(tokens) {
        this.tokens = tokens;
    }
    /**
     * equality → comparison ( ( "!=" | "==" ) comparison )* ;
     * @returns
     */
    equality() {
        let expr = this.comparison();
        /** ( !== | == ) and ()* is the while loop
         * */
        while (this.match(types_1.TokenType.BANG_EQUAL, types_1.TokenType.EQUAL_EQUAL)) {
            const operator = this.previous();
            const right = this.comparison();
            expr = new Expr_1.Expr.Binary(expr, operator, right);
        }
        return expr;
    }
    match(...types) {
        for (const type of types) {
            // check if current token has any of the given types
            if (!this.check(type))
                return false;
            this.advance();
            return true;
        }
        return false;
    }
    check(type) {
        if (this.isAtEnd())
            return false;
        return this.peek().type === type;
    }
    advance() {
        if (!this.isAtEnd())
            this.current++;
        return this.previous();
    }
    isAtEnd() {
        return this.peek().type === types_1.TokenType.EOF;
    }
    peek() {
        return this.tokens[this.current];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    error(token, message) {
        mukadex_1.Mukadex.error(token, message);
        return new ParseError();
    }
    consume(type, message) {
        if (this.check(type)) {
            return this.advance();
        }
        throw this.error(this.peek(), message);
    }
    /**
     * It discards tokens until it thinks it found a statement boundary
     */
    synchronize() {
        this.advance();
        while (!this.isAtEnd()) {
            if (this.previous().type === types_1.TokenType.SEMICOLON)
                return;
            switch (this.peek().type) {
                case types_1.TokenType.CLASS:
                case types_1.TokenType.FUN:
                case types_1.TokenType.VAR:
                case types_1.TokenType.FOR:
                case types_1.TokenType.IF:
                case types_1.TokenType.WHILE:
                case types_1.TokenType.PRINT:
                case types_1.TokenType.RETURN:
                    return;
            }
            this.advance();
        }
    }
    primary() {
        if (this.match(types_1.TokenType.FALSE))
            return new Expr_1.Expr.Literal(false);
        if (this.match(types_1.TokenType.TRUE))
            return new Expr_1.Expr.Literal(true);
        if (this.match(types_1.TokenType.NIL))
            return new Expr_1.Expr.Literal(null);
        if (this.match(types_1.TokenType.NUMBER, types_1.TokenType.STRING)) {
            return new Expr_1.Expr.Literal(this.previous().literal);
        }
        if (this.match(types_1.TokenType.LEFT_PAREN)) {
            const expr = this.expression();
            this.consume(types_1.TokenType.RIGHT_PAREN, "Expect ')' after expression.");
            return new Expr_1.Expr.Grouping(expr);
        }
        throw this.error(this.peek(), "Expected expression.");
    }
    parse() {
        try {
            return this.expression();
        }
        catch (error) {
            return null;
        }
    }
    unary() {
        if (this.match(types_1.TokenType.BANG, types_1.TokenType.MINUS)) {
            const operator = this.previous();
            const right = this.unary();
            return new Expr_1.Expr.Unary(operator, right);
        }
        return this.primary();
    }
    factor() {
        let expr = this.unary();
        while (this.match(types_1.TokenType.SLASH, types_1.TokenType.STAR)) {
            const operator = this.previous();
            const right = this.unary();
            expr = new Expr_1.Expr.Binary(expr, operator, right);
        }
        return expr;
    }
    term() {
        let expr = this.factor();
        while (this.match(types_1.TokenType.MINUS, types_1.TokenType.PLUS)) {
            const operator = this.previous();
            const right = this.factor();
            expr = new Expr_1.Expr.Binary(expr, operator, right);
        }
        return expr;
    }
    /**
     * comparison → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
     */
    comparison() {
        let expr = this.term();
        while (this.match(types_1.TokenType.GREATER, types_1.TokenType.GREATER_EQUAL, types_1.TokenType.LESS, types_1.TokenType.LESS_EQUAL)) {
            const operator = this.previous();
            const right = this.term();
            expr = new Expr_1.Expr.Binary(expr, operator, right);
        }
        return expr;
    }
    /**
     * Expands to the equality rule
     * @returns
     */
    expression() {
        return this.equality();
    }
}
exports.Parser = Parser;
