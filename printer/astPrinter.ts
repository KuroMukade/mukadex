import { Expr, Visitor } from "Expr";

export class AstPrinter implements Visitor<string> {
    private parenthesize(name: string, ...exprs: Expr[]): string {
        let str = '';
        str += `(${name}`;
        for (const expr of exprs) {
            str+= " ";
            str += expr.accept(this);
        }
        str += ")";
        return str;
    }

    public print(expr: Expr) {
        return expr.accept<string>(this as any);
    }

    public visitBinaryExpr(expr: Expr.Binary): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }

    public visitGroupingExpr(expr: Expr.Grouping): string {
        return this.parenthesize('group', expr.expression);
    }

    public visitLiteralExpr(expr: Expr.Literal): string {
        if (expr.value == null) return "nil";
        return expr.value.toString();
    }

    public visitUnaryExpr(expr: Expr.Unary): string {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    }
}
