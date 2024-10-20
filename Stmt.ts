import {Expr} from "./Expr"
import {Token} from "./token/token"

export abstract class Stmt {
  abstract accept<T>(visitor: Visitor<T>): T
};

export interface Visitor<T> {
    visitBlockStmt(stmt: Stmt.Block): T;
    visitExpressionStmt(stmt: Stmt.Expression): T;
    visitFunctionStmt(stmt: Stmt.Function): T;
    visitReturnStmt(stmt: Stmt.Return): T;
    visitIfStmt(stmt: Stmt.If): T;
    visitPrintStmt(stmt: Stmt.Print): T;
    visitVarStmt(stmt: Stmt.Var): T;
    visitWhileStmt(stmt: Stmt.While): T;
    visitBreakStmt(stmt: Stmt.Break): T;
}

export namespace Stmt {
    export class Block implements Stmt {
      readonly statements: Stmt[];

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitBlockStmt(this);
      }

      constructor(statements: Stmt[]) {
        this.statements = statements;
      }
    }

    export class Expression implements Stmt {
      readonly expression: Expr;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitExpressionStmt(this);
      }

      constructor(expression: Expr) {
        this.expression = expression;
      }
    }

    export class Function implements Stmt {
      readonly name: Token;
      readonly fn: Expr.Function;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitFunctionStmt(this);
      }

      constructor(name: Token, fn: Expr.Function) {
        this.name = name;
        this.fn = fn;
      }
    }

    export class Return implements Stmt {
      readonly keyword: Token;
      readonly value: Expr|null;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitReturnStmt(this);
      }

      constructor(keyword: Token, value: Expr|null) {
        this.keyword = keyword;
        this.value = value;
      }
    }

    export class If implements Stmt {
      readonly condition: Expr;
      readonly thenBranch: Stmt;
      readonly elseBranch: Stmt|null;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitIfStmt(this);
      }

      constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt|null) {
        this.condition = condition;
        this.thenBranch = thenBranch;
        this.elseBranch = elseBranch;
      }
    }

    export class Print implements Stmt {
      readonly expression: Expr;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitPrintStmt(this);
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

    export class While implements Stmt {
      readonly condition: Expr;
      readonly body: Stmt;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitWhileStmt(this);
      }

      constructor(condition: Expr, body: Stmt) {
        this.condition = condition;
        this.body = body;
      }
    }

    export class Break implements Stmt {
      readonly keyword: Token;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitBreakStmt(this);
      }

      constructor(keyword: Token) {
        this.keyword = keyword;
      }
    }

};

