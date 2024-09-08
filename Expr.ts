import { Token } from 'token/token';

export abstract class Expr {
  abstract accept<T>(visitor: Visitor<T>): T;
};

export interface Visitor<T> {
  visitBinaryExpr(expr: Expr.Binary): T;
  visitGroupingExpr(expr: Expr.Grouping): T;
  visitLiteralExpr(expr: Expr.Literal): T;
  visitUnaryExpr(expr: Expr.Unary): T;
}

export namespace Expr {
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
        return visitor.visitGroupingExpr(this);
    }
    constructor(expression: Expr) {
      this.expression = expression;
    }
  }

  export class Literal implements Expr {
    readonly value: Object | null;

    accept<T>(visitor: Visitor<T>) {
        return visitor.visitLiteralExpr(this);
    }
    constructor(value: Object | null) {
      this.value = value;
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
}
