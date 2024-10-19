import { Stmt, Visitor as StmtVisitor } from "../Stmt";
import { Expr, Visitor as ExprVisitor } from "../Expr";
import { Interpreter } from "../interpreter/interpreter";
import { Token } from "../token/token";
import { Mukadex } from "../mukadex";

type FunctionType = 'None' | 'Function' | 'FunctionExpression';

/**
 * Static analyzer
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
    private currentFunction: FunctionType = 'None';
    private isInLoop = false;

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
            if (!this.scopes[i].has(name.lexeme)) continue;

            this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        }
    }

    visitExpressionStmt(stmt: Stmt.Expression): void {
        this.resolve(stmt.expression);
    }

    visitIfStmt(stmt: Stmt.If): void {
        this.resolve(stmt.condition);
        this.resolve(stmt.thenBranch);
        
        if (stmt.elseBranch) {
            this.resolve(stmt.elseBranch)
        }
    }

    visitPrintStmt(stmt: Stmt.Print): void {
        this.resolve(stmt.expression);
    }

    visitReturnStmt(stmt: Stmt.Return): void {
        if (this.currentFunction === 'None') {
            Mukadex.error(stmt.keyword, `Can't return from top-level code.`);
        }

        if (stmt.value) {
            this.resolve(stmt.value);
        }
    }

    visitWhileStmt(stmt: Stmt.While): void {
        this.resolve(stmt.condition);
        this.resolveWhileStmt(stmt.body);
    }

    resolveWhileStmt(body: Stmt) {
        this.isInLoop = true;
        this.resolve(body);
        this.isInLoop = false;
        return;
    }

    visitBinaryExpr(expr: Expr.Binary): void {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }

    visitCallExpr(expr: Expr.Call): void {
        this.resolve(expr.callee);

        for (const arg of expr.args) {
            this.resolve(arg);
        }
    }

    visitGroupingExpr(expr: Expr.Grouping): void {
        this.resolve(expr.expression);
    }

    /**
     * A literal expression doesn’t mention any variables and doesn’t contain
     * any sub-expressions so there is no work to do.
     */
    visitLiteralExpr(expr: Expr.Literal) {
        return;
    }

    visitLogicalExpr(expr: Expr.Logical): void {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }

    visitUnaryExpr(expr: Expr.Unary): void {
        this.resolve(expr.right);
    }

    visitFunctionStmt(stmt: Stmt.Function): void {
        this.declare(stmt.name);
        this.define(stmt.name);
        this.resolveFunction(stmt, 'FunctionExpression');
    }

    visitFunctionExpr(expr: Expr.Function): void {
        this.resolveFunction(expr, 'FunctionExpression');
    }

    visitAssignExpr(expr: Expr.Assign): void {
        this.resolve(expr.value);
        this.resolveLocal(expr, expr.name);
    }

    private resolveFunction(func: Stmt.Function, type: FunctionType): void;
    private resolveFunction(func: Expr.Function, type: FunctionType): void;

    private resolveFunction(func: Stmt.Function | Expr.Function, type: FunctionType): void {
        let enclosingFunction: FunctionType = type;
        this.currentFunction = type;

        this.beginScope();

        if (func instanceof Stmt.Function) {
            for (const param of func.fn.params) {
                this.declare(param);
                this.define(param);
            }
            this.resolve(func.fn.body);
            this.endScope();
            this.currentFunction = enclosingFunction;
            return;
        }

        if (func instanceof Expr.Function) {
            for (const param of func.params) {
                this.declare(param);
                this.define(param);
            }
            this.resolve(func.body);
            this.endScope();
            this.currentFunction = enclosingFunction;
            return;
        }
    }

    visitBreakStmt(stmt: Stmt.Break): void {
        if (!this.isInLoop) {
            Mukadex.error(stmt.keyword, `Can't use "break" outside loop`);
        }
    }

    /**
     * Apply visitor pattern to the syntax tree node
     */
    resolve(stmt: Stmt): void;
    resolve(statements: Stmt[]): void;
    resolve(expr: Expr): void;

    resolve(stmtOrExpr: Stmt | Stmt[] | Expr) {
        if (Array.isArray(stmtOrExpr)) {
            for (const stmt of stmtOrExpr) {
                this.resolve(stmt);
            }
            return;
        }

        stmtOrExpr.accept(this);
    }

    private beginScope() {
        this.scopes.push(new Map<string, boolean>());
    }

    private endScope() {
        this.scopes.pop();
    }

    /**
     * The first step of binding the variable.
     * declare adds the variable in the innermost scope so that it shadows any outer one
     * It marked as "not ready yet" by binding that name to false
     */
    private declare(name: Token) {
        if (this.scopes.length === 0) return;
        const scope = this.scopes.at(-1);

        if (scope?.has(name.lexeme)) {
            Mukadex.error(name, `A variable named "${name.lexeme}" already exists in this scope.`);
        }
        scope?.set(name.lexeme, false);
    }

    /**
     * After declaring variable we resolve its initializer expression in that same scope
     * where the new variable exists but is unavailable. Once initializer expression is done, the var
     * is ready for defining.
     */
    private define(name: Token) {
        if (this.scopes.length === 0) return;
        const scope = this.scopes.at(-1);
        scope?.set(name.lexeme, true);
    }
}
