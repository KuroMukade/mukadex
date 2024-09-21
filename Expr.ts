import {Token} from "./token/token"

export abstract class Expr {
  abstract accept<T>(visitor: Visitor<T>): T
};

export interface Visitor<T> {
    visitAssignExpr(expr: Expr.Assign): T;
    visitBinaryExpr(expr: Expr.Binary): T;
    visitGroupingExpr(expr: Expr.Grouping): T;
    visitLiteralExpr(expr: Expr.Literal): T;
    visitLogicalExpr(expr: Expr.Logical): T;
    visitUnaryExpr(expr: Expr.Unary): T;
    visitCallExpr(expr: Expr.Call): T;
    visitVariableExpr(expr: Expr.Variable): T;
}

export namespace Expr {
    export class Assign implements Expr {
      readonly name: Token;
      readonly value: Expr;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitAssignExpr(this);
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
          return visitor.visitBinaryExpr(this);
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
          return visitor.visitGroupingExpr(this);
      }

      constructor(expression: Expr) {
        this.expression = expression;
      }
    }

    export class Literal implements Expr {
      readonly value: Object;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitLiteralExpr(this);
      }

      constructor(value: Object) {
        this.value = value;
      }
    }

    export class Logical implements Expr {
      readonly left: Expr;
      readonly operator: Token;
      readonly right: Expr;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitLogicalExpr(this);
      }

      constructor(left: Expr, operator: Token, right: Expr) {
        this.left = left;
        this.operator = operator;
        this.right = right;
      }
    }

    export class Unary implements Expr {
      readonly operator: Token;
      readonly right: Expr;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitUnaryExpr(this);
      }

      constructor(operator: Token, right: Expr) {
        this.operator = operator;
        this.right = right;
      }
    }

    export class Call implements Expr {
      readonly callee: Expr;
      readonly paren: Token;
      readonly args: Expr[];

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitCallExpr(this);
      }

      constructor(callee: Expr, paren: Token, args: Expr[]) {
        this.callee = callee;
        this.paren = paren;
        this.args = args;
      }
    }

    export class Variable implements Expr {
      readonly name: Token;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitVariableExpr(this);
      }

      constructor(name: Token) {
        this.name = name;
      }
    }

};

