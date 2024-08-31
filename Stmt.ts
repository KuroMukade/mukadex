import { Expr } from 'Expr';
import { Token } from 'token/token';

export interface Visitor<T> {
    visitExpressionStmt(stmt: typeof Expr.Expression): T;
    visitPrintStmt(stmt: typeof Expr.Print): T;
}

export abstract class Stmt {
    abstract accept<T>(visitor: Visitor<T>): void;

    static Expression = class Stmt {
      readonly expression: Expr;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitExpressionStmt(this as any);
      }
      constructor(expression: Expr) {
        this.expression = expression;
      }
    }
    static Print = class Stmt {
      readonly expression: Expr;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitPrintStmt(this as any);
      }
      constructor(expression: Expr) {
        this.expression = expression;
      }
    }
};

