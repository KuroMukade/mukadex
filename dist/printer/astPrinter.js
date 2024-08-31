"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstPrinter = void 0;
class AstPrinter {
    parenthesize(name, ...exprs) {
        let str = '';
        str += `(${name}`;
        for (const expr of exprs) {
            str += " ";
            str += expr.accept(this);
        }
        str += ")";
        return str;
    }
    print(expr) {
        return expr.accept(this);
    }
    visitBinaryExpr(expr) {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }
    visitGroupingExpr(expr) {
        return this.parenthesize('group', expr.expression);
    }
    visitLiteralExpr(expr) {
        if (expr.value == null)
            return "nil";
        return expr.value.toString();
    }
    visitUnaryExpr(expr) {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    }
}
exports.AstPrinter = AstPrinter;
