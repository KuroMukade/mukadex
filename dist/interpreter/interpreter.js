"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = exports.Return = exports.RuntimeException = void 0;
const mukadexFunction_1 = require("../mukadexFunction");
const environment_1 = require("../environment/environment");
const mukadex_1 = require("../mukadex");
const types_1 = require("../token/types");
class RuntimeException {
    token;
    message;
    constructor(token, message) {
        this.message = message;
        this.token = token;
    }
}
exports.RuntimeException = RuntimeException;
/**
 * Used to control the flow, not the actual error handling
 */
class Return {
    value;
    constructor(value) {
        this.value = value;
    }
}
exports.Return = Return;
;
class Interpreter {
    globals = new environment_1.Environment();
    environment = this.globals;
    locals = new Map();
    constructor() {
        this.globals.define('clock', {
            arity: () => 0,
            callFn(interpreter, args) {
                return performance.now();
            },
            toString() { return "<native fn>"; },
        });
    }
    visitFunctionStmt(stmt) {
        const fnName = stmt.name.lexeme;
        const fn = new mukadexFunction_1.MukadexFunction(fnName, stmt.fn, this.environment);
        this.environment.define(stmt.name.lexeme, fn);
        return null;
    }
    visitFunctionExpr(expr) {
        return new mukadexFunction_1.MukadexFunction(null, expr, this.environment);
    }
    executeBlock(statements, environment) {
        const previous = this.environment;
        try {
            this.environment = environment;
            for (const statement of statements) {
                this.execute(statement);
            }
        }
        finally {
            this.environment = previous;
        }
    }
    visitLogicalExpr(expr) {
        const left = this.evaluate(expr.left);
        if (expr.operator.type === types_1.TokenType.OR) {
            if (this.isTruthy(left))
                return left;
        }
        else {
            if (!this.isTruthy(left))
                return left;
        }
        return this.evaluate(expr.right);
    }
    visitIfStmt(stmt) {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
            return null;
        }
        if (stmt.elseBranch) {
            this.execute(stmt.elseBranch);
        }
        return null;
    }
    visitReturnStmt(stmt) {
        // We return null in functions by default
        let value = null;
        if (stmt.value !== null) {
            value = this.evaluate(stmt.value);
        }
        throw new Return(value);
    }
    visitCallExpr(expr) {
        const callee = this.evaluate(expr.callee);
        const args = [];
        for (const argument of expr.args) {
            args.push(this.evaluate(argument));
        }
        const fn = callee;
        if (args.length !== fn.arity()) {
            throw new RuntimeException(expr.paren, `Expected ${fn.arity} arguments but got ${args.length}.`);
        }
        return fn.callFn(this, args);
    }
    visitBlockStmt(stmt) {
        this.executeBlock(stmt.statements, new environment_1.Environment(this.environment));
        return null;
    }
    visitWhileStmt(stmt) {
        while (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.body);
        }
        return null;
    }
    visitAssignExpr(expr) {
        const value = this.evaluate(expr.value);
        const distance = this.locals.get(expr);
        if (distance) {
            this.environment.assignAt(distance, expr.name, value);
        }
        else {
            this.globals.assign(expr.name, value);
        }
        this.environment.assign(expr.name, value);
        return value;
    }
    visitVarStmt(stmt) {
        /**
         * We pass null to assign value to the variable by default
         * var a;
         * print a; // "nil"
         */
        let value = null;
        if (stmt.initializer !== null) {
            value = this.evaluate(stmt.initializer);
        }
        this.environment.define(stmt.name.lexeme, value);
    }
    visitVariableExpr(expr) {
        return this.lookupVariable(expr.name, expr);
    }
    lookupVariable(name, expr) {
        const distance = this.locals.get(expr);
        if (distance !== undefined) {
            return this.environment.getAt(distance, name.lexeme);
        }
        return this.globals.get(name);
    }
    visitGroupingExpr(expr) {
        return expr.expression;
    }
    visitExpressionStmt(stmt) {
        this.evaluate(stmt.expression);
        return;
    }
    visitPrintStmt(stmt) {
        const value = this.evaluate(stmt.expression);
        console.log(`Log: ${this.stringify(value)}`);
        return null;
    }
    visitLiteralExpr(expr) {
        return expr.value;
    }
    visitUnaryExpr(expr) {
        const right = this.evaluate(expr.right);
        switch (expr.operator.type) {
            case types_1.TokenType.BANG:
                return !this.isTruthy(right);
            case types_1.TokenType.MINUS:
                this.checkNumberOperand(expr.operator, right);
                return Number(-right);
        }
        // unreachable
        return null;
    }
    visitBinaryExpr(expr) {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);
        switch (expr.operator.type) {
            case types_1.TokenType.MINUS:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) - Number(right);
            case types_1.TokenType.SLASH:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) / Number(right);
            case types_1.TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) * Number(right);
            case types_1.TokenType.PLUS:
                if (typeof left === 'number' && typeof right === 'number') {
                    return Number(left) + Number(right);
                }
                if (typeof left === 'string' && typeof right === 'string') {
                    return String(left) + String(right);
                }
                const concatenatedValue = this.concatenate(left, right);
                if (concatenatedValue)
                    return concatenatedValue;
                throw new RuntimeException(expr.operator, "Unsupported operands for addition.");
            case types_1.TokenType.GREATER:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) > Number(right);
            case types_1.TokenType.GREATER_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) >= Number(right);
            case types_1.TokenType.LESS:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) < Number(right);
            case types_1.TokenType.LESS_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) <= Number(right);
            case types_1.TokenType.BANG_EQUAL:
                return !this.isEqual(left, right);
            case types_1.TokenType.EQUAL_EQUAL:
                return this.isEqual(left, right);
            default:
                throw new RuntimeException(expr.operator, "Unsupported operator");
        }
    }
    checkNumberOperand(operator, operand) {
        if (typeof operand === 'number')
            return;
        throw new RuntimeException(operator, "Operand must be a number");
    }
    checkNumberOperands(operator, left, right) {
        if (typeof left === 'number' && typeof right === 'number')
            return;
        if (operator.type === types_1.TokenType.SLASH && right === 0) {
            throw new RuntimeException(operator, "Attempt to divide by zero");
        }
        throw new RuntimeException(operator, "Operands must be numbers");
    }
    concatenate(left, right) {
        if (typeof left === 'string' && typeof right === 'number') {
            return left + right.toString();
        }
        if (typeof left === 'number' && typeof right === 'string') {
            return left.toString() + right;
        }
    }
    isEqual(a, b) {
        // TODO
        return a === b;
    }
    /**
    * In Mukadex all that is not null or false are true.
    * 0, '0', '' === true
    */
    isTruthy(object) {
        if (object === null)
            return false;
        if (typeof object === 'boolean')
            return Boolean(object);
        return true;
    }
    evaluate(expr) {
        return expr.accept(this);
    }
    stringify(object) {
        if (object === null)
            return "nil";
        if (typeof object === 'number') {
            let text = object.toString();
            if (text.endsWith(".0")) {
                text = text.substring(0, text.length - 2);
            }
            return text;
        }
        return object.toString();
    }
    execute(stmt) {
        stmt.accept(this);
    }
    interpret(statements) {
        try {
            for (const statement of statements) {
                this.execute(statement);
            }
        }
        catch (error) {
            if (error instanceof RuntimeException) {
                return mukadex_1.Mukadex.runtimeError(error);
            }
            throw new Error('Unhandled exception');
        }
    }
    resolve(expr, scopeDepth) {
        this.locals.set(expr, scopeDepth);
    }
}
exports.Interpreter = Interpreter;
