import { Expr, Visitor } from "Expr";
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

export class Interpreter implements Visitor<Object | null> {
    visitGroupingExpr(expr: Expr.Grouping): Object {
        return expr.expression;
    }

    visitLiteralExpr(expr: Expr.Literal): Object {
        return expr.value;
    }
    
    visitUnaryExpr(expr: Expr.Unary) {
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
        return expr.accept<Object>(this as Visitor<Object>);
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

    interpret(expression: Expr) {
        try {
            const value = this.evaluate(expression);
            console.log(this.stringify(value));
            return this.stringify(value);
        } catch (error) {
            if (error instanceof RuntimeException) {
                return Mukadex.runtimeError(error);
            }
            throw new Error('Unhandled exception');
        }
    }
}
