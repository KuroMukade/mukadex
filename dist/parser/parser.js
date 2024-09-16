"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const Expr_1 = require("../Expr");
const mukadex_1 = require("../mukadex");
const Stmt_1 = require("../Stmt");
const types_1 = require("../token/types");
/**
 * Precedence levels:
 *
 * expression -> equality
 *
 * equality -> comparison ( ( "!=" | "==" ) comparison )* ;
 *
 * comparison -> term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
 *
 * term -> factor ( ( "-" | "+" ) factor )* ;
 *
 * factor -> unary ( ( '/' | '*' ) unary )*
 *
 * unary -> ( '!' | '-' ) unary | primary
 *
 * Contains all literals and grouping expressions:
 * primary -> NUMBER STRING true false NIL | '(' expression ')' | IDENTIFIER
 *
 * each rule needs to match expressions at that precedence level or higher
 *
 * "*" or "+" while or for loop
 */
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
        /**
         * ( !== | == ) and ()* is the while loop
        */
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
            if (this.check(type)) {
                this.advance();
                return true;
            }
            ;
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
        if (this.match(types_1.TokenType.IDENTIFIER)) {
            return new Expr_1.Expr.Variable(this.previous());
        }
        throw this.error(this.peek(), "Expected expression.");
    }
    block() {
        const statements = [];
        while (!this.check(types_1.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            statements.push(this.declaration());
        }
        this.consume(types_1.TokenType.RIGHT_BRACE, "Expext '}' after block.");
        return statements;
    }
    statement() {
        if (this.match(types_1.TokenType.PRINT))
            return this.printStatement();
        if (this.match(types_1.TokenType.LEFT_BRACE)) {
            return new Stmt_1.Stmt.Block(this.block());
        }
        return this.expressionStatement();
    }
    printStatement() {
        const expr = this.expression();
        this.consume(types_1.TokenType.SEMICOLON, "Expect ';' after value.");
        return new Stmt_1.Stmt.Print(expr);
    }
    expressionStatement() {
        const expr = this.expression();
        this.consume(types_1.TokenType.SEMICOLON, "Expect ';' after expression.");
        return new Stmt_1.Stmt.Expression(expr);
    }
    parse() {
        const statements = [];
        while (!this.isAtEnd()) {
            statements.push(this.declaration());
        }
        return statements;
    }
    declaration() {
        try {
            if (this.match(types_1.TokenType.VAR))
                return this.varDeclaration();
            return this.statement();
        }
        catch (e) {
            if (e instanceof ParseError) {
                this.synchronize();
            }
            return null;
        }
    }
    varDeclaration() {
        const name = this.consume(types_1.TokenType.IDENTIFIER, "Expect variable name.");
        let initializer = null;
        if (this.match(types_1.TokenType.EQUAL)) {
            initializer = this.expression();
        }
        this.consume(types_1.TokenType.SEMICOLON, "Expect ';' after variable declaration.");
        return new Stmt_1.Stmt.Var(name, initializer);
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
     * There are l-values and r-values
     *
     * The l-value "evaluates" to a storage location that you can assign it to
     *
     * var dog = 'bobik';    --  l value
     * dog = 'rex';          --  r value
     *
     * In this example we don't know what the l-value is before we hit the "=".
     *
     * makeList().head.next = node;
     *
     * We can parse left hand side as an expression and turn it to assignment if needed
     *
     * If the left-hand side expression isn't a valid assignment target we'll fail with error:
     *
     * a + b = c;
     *
     */
    assignment() {
        const expr = this.equality();
        if (!this.match(types_1.TokenType.EQUAL))
            return expr;
        const equals = this.previous();
        const value = this.assignment();
        if (expr instanceof Expr_1.Expr.Variable) {
            const name = new Expr_1.Expr.Variable(expr.name).name;
            return new Expr_1.Expr.Assign(name, value);
        }
        return this.error(equals, "Invalid assignment target.");
    }
    /**
     * Expands to the equality rule
     * @returns
     */
    expression() {
        return this.assignment();
    }
}
exports.Parser = Parser;
