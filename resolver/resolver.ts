import { Stmt, Visitor as StmtVisitor } from "../Stmt";
import { Expr, Visitor as ExprVisitor } from "../Expr";
import { Interpreter } from "../interpreter/interpreter";
import { Token } from "token/token";

export class Resolver implements StmtVisitor<void>, ExprVisitor<void> {
    private readonly interpreter: Interpreter;
    private readonly scopes: Map<string, boolean>[] = [];

    constructor(interpreter: Interpreter) {
        this.interpreter = interpreter;
    }

    visitBlockStmt(stmt: Stmt.Block) {
        this.beginScope();
        const a = this.resolve(stmt.statements);
        this.endScope();
        return null;
    }

    visitVarStmt(stmt: Stmt.Var): void {
        this.declare(stmt.name);
        if (stmt.initializer !== null) {
            this.resolve(stmt.initializer);
        }
        this.define(stmt.name);
        return null;
    }

    private resolve(stmt: Stmt): void;
    private resolve(statements: Stmt[]): void;
    private resolve(expr: Expr): void;

    private resolve(stmtOrExpr: Stmt | Stmt[] | Expr): void {
        if (stmtOrExpr instanceof Stmt) {
            stmtOrExpr.accept(this);
        }

        if (Array.isArray(stmtOrExpr)) {
            for (const stmt of stmtOrExpr) {
                this.resolve(stmt);
            }
        }

        if (stmtOrExpr instanceof Expr) {
            stmtOrExpr.accept(this);
        }
    }

    private beginScope() {
        this.scopes.push(new Map<string, boolean>());
    }

    private endScope() {
        this.scopes.pop();
    }

    private declare(name: Token) {
        if (this.scopes.length === 0) return;
        const scopes = this.scopes.at(-1);
        scopes?.set(name.lexeme, false);
    }
}
