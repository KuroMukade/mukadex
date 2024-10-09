import { Stmt, Visitor as StmtVisitor } from "../Stmt";
import { Expr, Visitor as ExprVisitor } from "../Expr";
import { Interpreter } from "../interpreter/interpreter";
import { Token } from "token/token";
import { Mukadex } from "mukadex";

/**
 * Static analyzator
 * Used for single syntax tree walking before the interpreter start executing it.
 * It visits each node, but static analysis is different from the interpreter's dynamic execution:
 * 
 * 1) The are no side effects. When it visits print statement it doesn't actually print anything.
 *      Calls to native functions or other operations that reach out to the outside world
 *      are stubbed out and have no effect.
 * 
 * 2) There is not control flow. Loops are visited only once. Both branches are visited in "if" statements
 */
export class Resolver implements StmtVisitor<void>, ExprVisitor<void> {
    private readonly interpreter: Interpreter;

    /**
     * Each element in the stack represents single block scope
     * 
     * ------------------
     * Key: Variable name
     * 
     * Value: booleans
     * ------------------
     * 
     * Booleans for values used for resolving declarations
     * It marked as "Not ready yet" by biding its name to "false". The boolean flag represents
     * whether or not we have finished resolving that variable's initializer
     * 
     * This used only for local block scopes.
     * Variables stored in global scopes are not tracked by resolver
     */
    private readonly scopes: Map<string, boolean>[] = [];

    constructor(interpreter: Interpreter) {
        this.interpreter = interpreter;
    }

    visitBlockStmt(stmt: Stmt.Block) {
        this.beginScope();
        this.resolve(stmt.statements);
        this.endScope();
        return null;
    }

    visitVarStmt(stmt: Stmt.Var) {
        this.declare(stmt.name);
        if (stmt.initializer !== null) {
            this.resolve(stmt.initializer);
        }
        this.define(stmt.name);
        return null;
    }

    visitVariableExpr(expr: Expr.Variable): void {
        if (this.scopes.length === 0 && this.scopes.at(-1)?.get(expr.name.lexeme) === false) {
            Mukadex.error(expr.name, "Can't read local variable in its own initializer");
        }

        this.resolveLocal(expr, expr.name);
        return;
    }

    private resolveLocal(expr: Expr, name: Token) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (!this.scopes[i].has(name.lexeme)) return;

            this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        }
    }

    visitAssignExpr(expr: Expr.Assign): void {
        this.resolve(expr.value);
        this.resolveLocal(expr, expr.name);
    }

    

    /**
     * Needed for Stmt's
     * 
     * Apply visitor pattern to the syntax tree node
     */
    private resolve(stmt: Stmt): void;
    private resolve(statements: Stmt[]): void;

    /**
     * Needed for expression resolving
     */
    private resolve(expr: Expr): void;

    private resolve(stmtOrExpr: Stmt | Stmt[] | Expr): void {
        if (stmtOrExpr instanceof Stmt) {
            stmtOrExpr.accept(this);
            return;
        }

        if (Array.isArray(stmtOrExpr)) {
            for (const stmt of stmtOrExpr) {
                this.resolve(stmt);
            }
            return;
        }

        if (stmtOrExpr instanceof Expr) {
            stmtOrExpr.accept(this);
            return;
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
        const scope = this.scopes.at(-1);
        scope?.set(name.lexeme, false);
    }

    private define(name: Token) {
        if (this.scopes.length === 0) return;
        const scope = this.scopes.at(-1);
        scope?.set(name.lexeme, true);
    }
}
