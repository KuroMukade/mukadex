import { Expr } from 'Expr';

export interface Visitor<T> {
    visitExpressionStmt(stmt: Stmt.Expression): T;
    visitPrintStmt(stmt: Stmt.Print): T;
}

export abstract class Stmt {
    abstract accept<T>(visitor: Visitor<T>): void;
}

export namespace Stmt {
  export class Expression {
    readonly expression: Expr;

    accept<T>(visitor: Visitor<T>) {
        return visitor.visitExpressionStmt(this as any);
    }
    constructor(expression: Expr) {
      this.expression = expression;
    }
  }

  export class Print {
    readonly expression: Expr;

    accept<T>(visitor: Visitor<T>) {
        return visitor.visitPrintStmt(this as any);
    }
    constructor(expression: Expr) {
      this.expression = expression;
    }
  }
};
