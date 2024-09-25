import { Environment } from "./environment/environment";
import { Interpreter, MukadexCallable, Return } from "./interpreter/interpreter";
import { Expr } from "./Expr";

export class MukadexFunction implements MukadexCallable {
    private readonly declaration: Expr.Function; 
    private closure: Environment;
    private readonly name: string | null;

    constructor(name: string | null, declaration: Expr.Function, closure: Environment) {
        this.declaration = declaration;
        this.closure = closure;
        this.name = name;
    }

    callFn(interpreter: Interpreter, args: Object[]) {
        const environment = new Environment(this.closure);
        for (let i = 0; i < this.declaration.params.length; i++) {
            const name = this.declaration.params[i].lexeme;
            const value = args[i];

            environment.define(name, value);
        }

        try {
            interpreter.executeBlock(this.declaration.body, environment);
        } catch (e) {
            // check if we throw to return, not the error one
            if (e instanceof Return) {
                const returnValue = e;
                return returnValue.value;
            }
        }
        return null;
    }

    arity(): number {
        return this.declaration.params.length;
    }

    toString(): string {
        if (this.name === null) {
            return '<fn anonymous>'
        }
        return `<fn ${this.name}>`
    }
}