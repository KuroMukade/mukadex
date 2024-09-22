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
 * expression -> assignment;
 *
 * assignment -> IDENTIFIER "=" assignment | logic_or
 *
 * logic_or -> logic_and ( "or" logic and )* ;
 *
 * logic_and -> equality ( "and" equality )* ;
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
 * call → primary ( "(" arguments? ")" )* ;
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
        if (this.match(types_1.TokenType.FOR))
            return this.forStatement();
        if (this.match(types_1.TokenType.IF))
            return this.ifStatement();
        if (this.match(types_1.TokenType.PRINT))
            return this.printStatement();
        if (this.match(types_1.TokenType.WHILE))
            return this.whileStatement();
        if (this.match(types_1.TokenType.LEFT_BRACE)) {
            return new Stmt_1.Stmt.Block(this.block());
        }
        return this.expressionStatement();
    }
    /**
     * forStmt → "for" "(" ( varDecl | exprStmt | ";" )
     *                      expression? ";"
     *                      expression? ")" statement ;
     *
     *
     * 1st clause is the initializer. It's executed only once before anything else.
     * It's var declaration or expression.
     * If it's declaration - then the var scoped for the rest of for loop
     *
     * 2nd clause is the condition. It's evaluated once at the beginning of each iteration,
     * including the first. If the result = true, then we exit the loop.
     *
     * 3rd clause is the increment
     * The 3-rd part executes after the body in each iteration of the loop
     *
     */
    forStatement() {
        this.consume(types_1.TokenType.LEFT_PAREN, "Expect '(' after 'for'.");
        // 1
        let initializer;
        if (this.match(types_1.TokenType.SEMICOLON)) {
            initializer = null;
        }
        else if (this.match(types_1.TokenType.VAR)) {
            initializer = this.varDeclaration();
        }
        else {
            initializer = this.expressionStatement();
        }
        // 2
        let condition = null;
        if (!this.check(types_1.TokenType.SEMICOLON)) {
            condition = this.expression();
        }
        this.consume(types_1.TokenType.SEMICOLON, "Expect ';' after loop condition.");
        // 3
        let increment = null;
        if (!this.check(types_1.TokenType.RIGHT_PAREN)) {
            increment = this.expression();
        }
        this.consume(types_1.TokenType.RIGHT_PAREN, "Expect ')' at the end of for loop.");
        let body = this.statement();
        // desugaring
        if (increment !== null) {
            /**
            * Convert 3rd part of loop with incrementing to original body:
            *
            * for (var i = 0; i < 3; i++) { ...body }
            *
            * converts into:
            *
            * while (i < 3) {
            *   ...body;
            *   i++;
            * }
            */
            body = new Stmt_1.Stmt.Block([
                body,
                new Stmt_1.Stmt.Expression(increment)
            ]);
        }
        // for (; ...) -> while (true)
        if (condition === null) {
            condition = new Expr_1.Expr.Literal(true);
        }
        body = new Stmt_1.Stmt.While(condition, body);
        /**
         * Inserts initializer before while loop:
         *
         * for (var i = 0; i < 3; i++) {}
         *
         * ->
         *
         * var i = 0;
         *
         * while (i < 3) { i++; }
         *
         */
        if (initializer !== null) {
            body = new Stmt_1.Stmt.Block([initializer, body]);
        }
        return body;
    }
    whileStatement() {
        this.consume(types_1.TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
        const condition = this.expression();
        this.consume(types_1.TokenType.RIGHT_PAREN, "Expect ')' after while condition.");
        const body = this.statement();
        return new Stmt_1.Stmt.While(condition, body);
    }
    ifStatement() {
        this.consume(types_1.TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
        const condition = this.expression();
        this.consume(types_1.TokenType.RIGHT_PAREN, "Expect ')' after if condition.");
        const thenBranch = this.statement();
        let elseBranch = null;
        if (this.match(types_1.TokenType.ELSE)) {
            elseBranch = this.statement();
        }
        return new Stmt_1.Stmt.If(condition, thenBranch, elseBranch);
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
        return this.call();
    }
    call() {
        let expr = this.primary();
        while (true) {
            if (this.match(types_1.TokenType.LEFT_PAREN)) {
                expr = this.finishCall(expr);
            }
            else {
                break;
            }
        }
        return expr;
    }
    finishCall(callee) {
        const fnArguments = [];
        if (!this.check(types_1.TokenType.RIGHT_PAREN)) {
            while (this.match(types_1.TokenType.COMMA)) {
                if (fnArguments.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 arguments");
                }
                fnArguments.push(this.expression());
            }
        }
        const paren = this.consume(types_1.TokenType.RIGHT_PAREN, "Expect ')' after arguments.");
        return new Expr_1.Expr.Call(callee, paren, fnArguments);
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
    and() {
        let expr = this.equality();
        while (this.match(types_1.TokenType.AND)) {
            const operator = this.previous();
            const right = this.equality();
            expr = new Expr_1.Expr.Logical(expr, operator, right);
        }
        return expr;
    }
    or() {
        let expr = this.and();
        while (this.match(types_1.TokenType.OR)) {
            const operator = this.previous();
            const right = this.and();
            expr = new Expr_1.Expr.Logical(expr, operator, right);
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
        const expr = this.or();
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
    expression() {
        return this.assignment();
    }
}
exports.Parser = Parser;
