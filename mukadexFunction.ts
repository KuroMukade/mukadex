import { Environment } from "./environment/environment";
import { Stmt } from "./Stmt";
import { Interpreter, MukadexCallable, RuntimeException } from "./interpreter/interpreter";

export class MukadexFunction implements MukadexCallable {
    private readonly declaration: Stmt.Function; 

    constructor(declrataion: Stmt.Function) {
        this.declaration = declrataion;
    }

    callFn(interpreter: Interpreter, args: Object[]) {
        const environment = new Environment(interpreter.globals);
        for (let i = 0; i < this.declaration.params.length; i++) {
            const name = this.declaration.params[i].lexeme;
            const value = args[i];

            environment.define(name, value);
        }

        interpreter.executeBlock(this.declaration.body, environment);
        return null;
    }

    arity(): number {
        return this.declaration.params.length;
    }
}