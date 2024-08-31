import { Token } from 'token/token';

export interface Visitor<T> {
    visitBinaryExpr(expr: Expr.Binary): T;
    visitGroupingExpr(expr: Expr.Grouping): T;
    visitLiteralExpr(expr: Expr.Literal): T;
    visitUnaryExpr(expr: Expr.Unary): T;
}

export abstract class Expr {
  abstract accept<T>(visitor: Visitor<T>): T;
};

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
}import { Token } from 'token/token';

export interface Visitor<T> {
    visitBinaryExpr(expr: typeof Expr.Binary): T;
    visitGroupingExpr(expr: typeof Expr.Grouping): T;
    visitLiteralExpr(expr: typeof Expr.Literal): T;
    visitUnaryExpr(expr: typeof Expr.Unary): T;
}

export abstract class Expr {
    abstract accept<T>(visitor: Visitor<T>): void;

    static Binary = class Expr {
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
    static Grouping = class Expr {
      readonly expression: Expr;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitGroupingExpr(this as any);
      }
      constructor(expression: Expr) {
        this.expression = expression;
      }
    }
    static Literal = class Expr {
      readonly value: Object;

      accept<T>(visitor: Visitor<T>) {
          return visitor.visitLiteralExpr(this as any);
      }
      constructor(value: Object) {
        this.value = value;
      }
    }
    static Unary = class Expr {
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
};

