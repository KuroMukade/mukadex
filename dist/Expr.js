"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Expr = void 0;
class Expr {
}
exports.Expr = Expr;
;
(function (Expr) {
    class Assign {
        name;
        value;
        accept(visitor) {
            return visitor.visitAssignExpr(this);
        }
        constructor(name, value) {
            this.name = name;
            this.value = value;
        }
    }
    Expr.Assign = Assign;
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
    class Logical {
        left;
        operator;
        right;
        accept(visitor) {
            return visitor.visitLogicalExpr(this);
        }
        constructor(left, operator, right) {
            this.left = left;
            this.operator = operator;
            this.right = right;
        }
    }
    Expr.Logical = Logical;
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
    class Call {
        callee;
        paren;
        args;
        accept(visitor) {
            return visitor.visitCallExpr(this);
        }
        constructor(callee, paren, args) {
            this.callee = callee;
            this.paren = paren;
            this.args = args;
        }
    }
    Expr.Call = Call;
    class Variable {
        name;
        accept(visitor) {
            return visitor.visitVariableExpr(this);
        }
        constructor(name) {
            this.name = name;
        }
    }
    Expr.Variable = Variable;
})(Expr || (exports.Expr = Expr = {}));
;
