"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Expr = void 0;
class Expr {
}
exports.Expr = Expr;
;
(function (Expr) {
    class Binary {
        left;
        operator;
        right;
        accept(visitor) {
            return visitor.visitBinaryExpr(this);
        }
        constructor(left, operator, right) {
            this.left = left;
            this.operator = operator;
            this.right = right;
        }
    }
    Expr.Binary = Binary;
    class Grouping {
        expression;
        accept(visitor) {
            return visitor.visitGroupingExpr(this);
        }
        constructor(expression) {
            this.expression = expression;
        }
    }
    Expr.Grouping = Grouping;
    class Literal {
        value;
        accept(visitor) {
            return visitor.visitLiteralExpr(this);
        }
        constructor(value) {
            this.value = value;
        }
    }
    Expr.Literal = Literal;
    class Unary {
        operator;
        right;
        accept(visitor) {
            return visitor.visitUnaryExpr(this);
        }
        constructor(operator, right) {
            this.operator = operator;
            this.right = right;
        }
    }
    Expr.Unary = Unary;
})(Expr || (exports.Expr = Expr = {}));
