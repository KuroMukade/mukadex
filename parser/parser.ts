import { Expr } from "Expr";
import { Mukadex } from "mukadex";
import { Stmt } from "Stmt";
import { Token } from "token/token";
import { TokenType } from "token/types";

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

export class Parser { 
    private readonly tokens: Token[];
    private current: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    /**
     * equality → comparison ( ( "!=" | "==" ) comparison )* ;
     * @returns 
     */
    private equality() {
        let expr: Expr = this.comparison();

        /**
         * ( !== | == ) and ()* is the while loop
        */
        while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
            const operator: Token = this.previous();
            const right: Expr = this.comparison();
            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            // check if current token has any of the given types
            if (!this.check(type)) return false;
            this.advance();
            return true;
        }

        return false;
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private error(token: Token, message: string): ParseError {
        Mukadex.error(token, message);
        return new ParseError();
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) {
            return this.advance();
        }

        throw this.error(this.peek(), message);

    }

    /** 
     * It discards tokens until it thinks it found a statement boundary
     */
    private synchronize(): void {
        this.advance();

        while (!this.isAtEnd()) {
            if (this.previous().type === TokenType.SEMICOLON) return;
            switch (this.peek().type) {
                case TokenType.CLASS:
                case TokenType.FUN:
                case TokenType.VAR:
                case TokenType.FOR:
                case TokenType.IF:
                case TokenType.WHILE:
                case TokenType.PRINT:
                case TokenType.RETURN:
                return;
            }
            this.advance();
        }
    }

    private primary(): Expr {
        if (this.match(TokenType.FALSE)) return new Expr.Literal(false);
        if (this.match(TokenType.TRUE)) return new Expr.Literal(true);
        if (this.match(TokenType.NIL)) return new Expr.Literal(null);

        if (this.match(TokenType.NUMBER, TokenType.STRING)) {
            return new Expr.Literal(this.previous().literal);
        }

        if (this.match(TokenType.LEFT_PAREN)) {
            const expr: Expr = this.expression();
            this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
            return new Expr.Grouping(expr);
        }

        if (this.match(TokenType.IDENTIFIER)) {
            
        }

        throw this.error(this.peek(), "Expected expression.");
    }

    statement(): Stmt {
        if (this.match(TokenType.PRINT)) return this.printStatement();

        return this.expressionStatement();
    }

    printStatement(): Stmt {
        const expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
        return new Stmt.Print(expr);
    }

    expressionStatement(): Stmt {
        const expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ':' after expression.");
        return new Stmt.Expression(expr);
    }

    parse(): Stmt[] {
        const statements: Stmt[] = [];
        while (!this.isAtEnd()) {
            statements.push(this.statement());
        }

        return statements;
    }

    private unary(): Expr {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            const operator: Token = this.previous();
            const right: Expr = this.unary();
            return new Expr.Unary(operator, right);
        }
        return this.primary();
    }

    private factor(): Expr {
        let expr: Expr = this.unary();

        while (this.match(TokenType.SLASH, TokenType.STAR)) {
            const operator: Token = this.previous();
            const right: Expr = this.unary();
            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }

    private term(): Expr {
        let expr: Expr = this.factor();
        
        while (this.match(TokenType.MINUS, TokenType.PLUS)) {
            const operator: Token = this.previous();
            const right: Expr = this.factor();
            expr = new Expr.Binary(expr, operator, right);
        }
        return expr;
    }

    /**
     * comparison → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
     */
    private comparison() {
        let expr: Expr = this.term();
        while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
            const operator = this.previous();
            const right: Expr = this.term();
            expr = new Expr.Binary(expr, operator, right);
        }
        return expr;
    }

    /**
     * Expands to the equality rule
     * @returns 
     */
    private expression() {
        return this.equality();
    }
}
