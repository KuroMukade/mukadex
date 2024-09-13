import { Token } from "token/token"

export abstract class Expr {
  abstract accept<T>(visitor: Visitor<T>): T
};

export interface Visitor<T> {
    visitAssignExpr(expr: Expr.Assign): T;
    visitBinaryExpr(expr: Expr.Binary): T;
    visitGroupingExpr(expr: Expr.Grouping): T;
    visitLiteralExpr(expr: Expr.Literal): T;
    visitUnaryExpr(expr: Expr.Unary): T;
    visitVariableExpr(expr: Expr.Variable): T;
}

export namespace Expr {
    export class Assign implements Expr {
      readonly name: Token;
      readonly value: Expr;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitAssignExpr(this as any);
      }

      constructor(name: Token, value: Expr) {
        this.name = name;
        this.value = value;
      }
    }

    export class Binary implements Expr {
      readonly left: Expr;
      readonly operator: Token;
      readonly right: Expr;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitBinaryExpr(this as any);
      }

      constructor(left: Expr, operator: Token, right: Expr) {
        this.left = left;
        this.operator = operator;
        this.right = right;
      }
    }

    export class Grouping implements Expr {
      readonly expression: Expr;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitGroupingExpr(this as any);
      }

      constructor(expression: Expr) {
        this.expression = expression;
      }
    }

    export class Literal implements Expr {
      readonly value: Object;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitLiteralExpr(this as any);
      }

      constructor(value: Object) {
        this.value = value;
      }
    }

    export class Unary implements Expr {
      readonly operator: Token;
      readonly right: Expr;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitUnaryExpr(this as any);
      }

      constructor(operator: Token, right: Expr) {
        this.operator = operator;
        this.right = right;
      }
    }

    export class Variable implements Expr {
      readonly name: Token;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitVariableExpr(this as any);
      }

      constructor(name: Token) {
        this.name = name;
      }
    }

};

