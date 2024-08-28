import { Expr, Visitor } from "Expr";
import { Mukadex } from "mukadex";
import { Token } from "token/token";
import { TokenType } from "token/types";

class RuntimeException {
    token: Token;
    message: string;

    constructor(token: Token, message: string) {
        this.message = message;
        this.token = token;
    }
}

export class Interpreter implements Visitor<Object> {
    visitGroupingExpr(expr: Expr.Grouping): Object {
        return expr.expression;
    }

    visitLiteralExpr(expr: Expr.Literal): Object {
        return expr.value;
    }
    
    visitUnaryExpr(expr: Expr.Unary): Object {
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
                if (left instanceof Number && right instanceof Number) {
                    return Number(left) + Number(right);
                }

                if (left instanceof String && right instanceof String) {
                    return String(left) + String(right);
                }
                
                throw new RuntimeException(expr.operator, "Operands must be two numbers or two strings.");

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
        }
    }

    private checkNumberOperand(operator: Token, operand: Object) {
        if (operand instanceof Number) return;
        throw new RuntimeException(operator, "Operand must be a number")
    }

    private checkNumberOperands(operator: Token, left: Object, right: object) {
        if (left instanceof Number && right instanceof Number) return;
        throw new RuntimeException(operator, "Operands must be numbers");
    };
    

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
        if (object instanceof Boolean) return Boolean(object);
        return true;
    }

    private evaluate(expr: Expr): Object {
        return expr.accept(this);
    }

    private stringify(object: Object) {
        if (object === null) return "nil";
        if (object instanceof Number) {
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
        } catch (error) {
            Mukadex.runtimeError(error);
        }
    }
}
