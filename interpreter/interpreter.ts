import { Expr, Visitor as ExprVisitor } from "Expr";
import { Stmt, Visitor as StmtVisitor } from "Stmt";
import { Environment } from "environment/environment";

import { Mukadex } from "mukadex";
import { Token } from "token/token";
import { TokenType } from "token/types";

export class RuntimeException {
    token: Token;
    message: string;

    constructor(token: Token, message: string) {
        this.message = message;
        this.token = token;
    }
}

export class Interpreter implements ExprVisitor<Object | null>, StmtVisitor<void> {
    private environment = new Environment();

    private executeBlock(statements: Stmt[], environment: Environment) {
        const previous = this.environment;

        try {
            this.environment = environment;

            for (const statement of statements) {
                this.execute(statement);
            }
        } finally {
            this.environment = previous;
        }
    }

    visitBlockStmt(stmt: Stmt.Block): null {
        this.executeBlock(stmt.statements, new Environment(this.environment));
        return null;
    }

    visitAssignExpr(expr: Expr.Assign): Object | null {
        const value = this.evaluate(expr.value);
        this.environment.assign(expr.name, value);
        return value;
    }

    visitVarStmt(stmt: Stmt.Var): void {
        let value: Object | null = null;
        if (stmt.initializer !== null) {
            value = this.evaluate(stmt.initializer);
        }

        /**
         * We pass null to assign value to he var by default
         * var a;
         * print a; // "nil"
         */
        this.environment.define(stmt.name.lexeme, value);
    }

    visitVariableExpr(expr: Expr.Variable): Object | null {
        return this.environment.get(expr.name);
    }

    visitGroupingExpr(expr: Expr.Grouping): Object {
        return expr.expression;
    }

    visitExpressionStmt(stmt: Stmt.Expression): void {
        this.evaluate(stmt.expression);
        return;
    }

    visitPrintStmt(stmt: Stmt.Print): void {
        const value = this.evaluate(stmt.expression);
        console.log(this.stringify(value));
        return;
    }

    visitLiteralExpr(expr: Expr.Literal): Object | null {
        return expr.value;
    }
    
    visitUnaryExpr(expr: Expr.Unary): Object | null {
        const right: Object = this.evaluate(expr.right);
        
        switch (expr.operator.type) {
            case TokenType.BANG:
                return !this.isTruthy(right);

            case TokenType.MINUS:
                this.checkNumberOperand(expr.operator, right);
                return Number(-right);
        }
        // unreachable
        return null;
    }

    visitBinaryExpr(expr: Expr.Binary): Object {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.MINUS:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) - Number(right);

            case TokenType.SLASH:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) / Number(right);

            case TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) * Number(right);

            case TokenType.PLUS:
                if (typeof left === 'number' && typeof right === 'number') {
                    return Number(left) + Number(right);
                }

                if (typeof left === 'string' && typeof right === 'string') {
                    return String(left) + String(right);
                }

                const concatenatedValue = this.concatenate(left, right);
                if (concatenatedValue) return concatenatedValue;

                throw new RuntimeException(expr.operator, "Unsupported operands for addition.");

            case TokenType.GREATER:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) > Number(right);

            case TokenType.GREATER_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) >= Number(right);

            case TokenType.LESS:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) < Number(right);

            case TokenType.LESS_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) <= Number(right);
            
            case TokenType.BANG_EQUAL:
                return !this.isEqual(left, right);
            
            case TokenType.EQUAL_EQUAL:
                return this.isEqual(left, right);

            default:
                throw new RuntimeException(expr.operator, "Unsupported operator");
        }
    }

    private checkNumberOperand(operator: Token, operand: Object) {
        if (typeof operand === 'number') return;
        throw new RuntimeException(operator, "Operand must be a number")
    }

    private checkNumberOperands(operator: Token, left: Object, right: Object) {
        if (typeof left === 'number' && typeof right === 'number') return;

        if (operator.type === TokenType.SLASH && right === 0) {
            throw new RuntimeException(operator, "Attempt to divide by zero");
        }

        throw new RuntimeException(operator, "Operands must be numbers");
    }

    private concatenate(left: Object, right: Object) {
        if (typeof left === 'string' && typeof right === 'number') {
            return left + right.toString();
        }

        if (typeof left === 'number' && typeof right === 'string') {
            return left.toString() + right;
        }
    }

    private isEqual(a: Object, b: Object) {
        // TODO
        return a === b;
    }

    /**
    * In Mukadex all that is not null or false are true.
    * 0, '0', '' === true 
    */
    private isTruthy(object: Object): boolean {
        if (object === null) return true;
        if (typeof object === 'boolean') return Boolean(object);
        return true;
    }

    private evaluate(expr: Expr): Object {
        return expr.accept<Object>(this as ExprVisitor<Object>);
    }

    private stringify(object: Object) {
        if (object === null) return "nil";
        if (typeof object === 'number') {
            let text = object.toString();

            if (text.endsWith(".0")) {
                text = text.substring(0, text.length - 2);
            }

            return text;
        }

        return object.toString();
    }

    private execute(stmt: Stmt): void {
        stmt.accept(this);
    }

    interpret(statements: Stmt[]) {
        try {
            for (const statement of statements) {
                this.execute(statement);
            }
        } catch (error) {
            if (error instanceof RuntimeException) {
                return Mukadex.runtimeError(error);
            }
            throw new Error('Unhandled exception');
        }
    }
}