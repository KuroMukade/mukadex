import { MukadexFunction } from "../mukadexFunction";
import { Expr, Visitor as ExprVisitor } from "../Expr";
import { Stmt, Visitor as StmtVisitor } from "../Stmt";
import { Environment } from "../environment/environment";

import { Mukadex } from "../mukadex";
import { Token } from "../token/token";
import { TokenType } from "../token/types";

export class RuntimeException {
    token: Token;
    message: string;

    constructor(token: Token, message: string) {
        this.message = message;
        this.token = token;
    }
}

/**
 * Used to control the flow, not the actual error handling
 */
export class Return {
    readonly value: Object | null;

    constructor(value: Object | null) {
        this.value = value;
    }
}

export interface MukadexCallable {
    arity: () => number;
    callFn(interpreter: Interpreter, args: Object[]): Object | null;
};

export class Interpreter implements ExprVisitor<Object | null>, StmtVisitor<void> {
    public globals = new Environment();
    private environment = this.globals;
    private locals = new Map<Expr, number>();

    constructor() {
        this.globals.define('clock', {
            arity: () => 0,
            callFn(interpreter: Interpreter, args: Object[]) {
                return performance.now();
            },
            toString() { return "<native fn>" },
        } as MukadexCallable);
    }

    visitFunctionStmt(stmt: Stmt.Function): null {
        const fnName = stmt.name.lexeme;
        const fn = new MukadexFunction(fnName, stmt.fn, this.environment);
        this.environment.define(stmt.name.lexeme, fn);
        return null;
    }

    visitFunctionExpr(expr: Expr.Function): Object | null {
        return new MukadexFunction(null, expr, this.environment);
    }

    public executeBlock(statements: Stmt[], environment: Environment) {
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

    visitLogicalExpr(expr: Expr.Logical): Object | null {
        const left = this.evaluate(expr.left);

        if (expr.operator.type === TokenType.OR) {
            if (this.isTruthy(left)) return left;
        } else {
            if (!this.isTruthy(left)) return left;
        }

        return this.evaluate(expr.right);
    }

    visitIfStmt(stmt: Stmt.If): null {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
            return null;
        }

        if (stmt.elseBranch) {
            this.execute(stmt.elseBranch);
        }

        return null;
    }

    visitReturnStmt(stmt: Stmt.Return): void {
        // We return null in functions by default
        let value: Object | null = null;

        if (stmt.value !== null) {
            value = this.evaluate(stmt.value);
        }

        throw new Return(value);
    }

    visitCallExpr(expr: Expr.Call): Object | null {
        const callee = this.evaluate(expr.callee);
        const args: Object[] = [];

        for (const argument of expr.args) {
            args.push(this.evaluate(argument));
        }

        const fn = callee as MukadexCallable;

        if (args.length !== fn.arity()) {
            throw new RuntimeException(expr.paren, `Expected ${fn.arity} arguments but got ${args.length}.`);
        }

        return fn.callFn(this, args);
    }


    visitBlockStmt(stmt: Stmt.Block): null {
        this.executeBlock(stmt.statements, new Environment(this.environment));
        return null;
    }

    visitWhileStmt(stmt: Stmt.While): null {
        while (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.body);
        }

        return null;
    }

    visitAssignExpr(expr: Expr.Assign): Object | null {
        const value = this.evaluate(expr.value);
        const distance = this.locals.get(expr);

        if (distance) {
            this.environment.assignAt(distance, expr.name, value);
        } else {
            this.globals.assign(expr.name, value);
        }

        this.environment.assign(expr.name, value);
        return value;
    }

    visitVarStmt(stmt: Stmt.Var): void {
        /**
         * We pass null to assign value to the variable by default
         * var a;
         * print a; // "nil"
         */
        let value: Object | null = null;

        if (stmt.initializer !== null) {
            value = this.evaluate(stmt.initializer);
        }

        this.environment.define(stmt.name.lexeme, value);
    }

    visitVariableExpr(expr: Expr.Variable): Object | null {
        return this.lookupVariable(expr.name, expr);
    }

    private lookupVariable(name: Token, expr: Expr) {
        const distance = this.locals.get(expr);

        if (distance !== undefined) {
            return this.environment.getAt(distance, name.lexeme);
        }
        return this.globals.get(name);
    }

    visitGroupingExpr(expr: Expr.Grouping): Object {
        return expr.expression;
    }

    visitExpressionStmt(stmt: Stmt.Expression): void {
        this.evaluate(stmt.expression);
        return;
    }

    visitPrintStmt(stmt: Stmt.Print): null {
        const value = this.evaluate(stmt.expression);
        console.log(`Log: ${this.stringify(value)}`);
        return null;
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
        if (object === null) return false;
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

    resolve(expr: Expr, scopeDepth: number) {
        this.locals.set(expr, scopeDepth);
    }
}
