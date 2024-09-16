import {Expr} from "./Expr"
import {Token} from "./token/token"

export abstract class Stmt {
  abstract accept<T>(visitor: Visitor<T>): T
};

export interface Visitor<T> {
    visitBlockStmt(stmt: Stmt.Block): T;
    visitExpressionStmt(stmt: Stmt.Expression): T;
    visitPrintStmt(stmt: Stmt.Print): T;
    visitVarStmt(stmt: Stmt.Var): T;
}

export namespace Stmt {
    export class Block implements Stmt {
      readonly statements: Stmt[];

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitBlockStmt(this as any);
      }

      constructor(statements: Stmt[]) {
        this.statements = statements;
      }
    }

    export class Expression implements Stmt {
      readonly expression: Expr;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitExpressionStmt(this as any);
      }

      constructor(expression: Expr) {
        this.expression = expression;
      }
    }

    export class Print implements Stmt {
      readonly expression: Expr;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitPrintStmt(this as any);
      }

      constructor(expression: Expr) {
        this.expression = expression;
      }
    }

    export class Var implements Stmt {
      readonly name: Token;
      readonly initializer: Expr;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitVarStmt(this);
      }

      constructor(name: Token, initializer: Expr) {
        this.name = name;
        this.initializer = initializer;
      }
    }

};

