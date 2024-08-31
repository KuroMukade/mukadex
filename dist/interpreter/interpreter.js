"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = exports.RuntimeException = void 0;
const mukadex_1 = require("mukadex");
const types_1 = require("token/types");
class RuntimeException {
    token;
    message;
    constructor(token, message) {
        this.message = message;
        this.token = token;
    }
}
exports.RuntimeException = RuntimeException;
class Interpreter {
    visitGroupingExpr(expr) {
        return expr.expression;
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
            return true;
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
    interpret(expression) {
        try {
            const value = this.evaluate(expression);
            console.log(this.stringify(value));
            return this.stringify(value);
        }
        catch (error) {
            if (error instanceof RuntimeException) {
                return mukadex_1.Mukadex.runtimeError(error);
            }
            throw new Error('Unhandled exception');
        }
    }
}
exports.Interpreter = Interpreter;
