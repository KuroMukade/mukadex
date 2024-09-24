import { Environment } from "./environment/environment";
import { Stmt } from "./Stmt";
import { Interpreter, MukadexCallable, Return } from "./interpreter/interpreter";

export class MukadexFunction implements MukadexCallable {
    private readonly declaration: Stmt.Function; 

    constructor(declaration: Stmt.Function) {
        this.declaration = declaration;
    }

    callFn(interpreter: Interpreter, args: Object[]) {
        const environment = new Environment(interpreter.globals);
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
        return `<fn ${this.declaration.name.lexeme}>`
    }
}