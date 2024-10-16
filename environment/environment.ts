import { RuntimeException } from "../interpreter/interpreter";

import { Token } from "../token/token";

export class Environment {
    /**
     * Map uses bare strings for the keys instead of Tokens
     * A Token represents a unit of code at the specific place of the source text,
     * but when it comes to looking up variables, all identifier tokens with the same name
     * should refer to the same variable (ignoring scope at this point)
     */
    private readonly values = new Map<string, Object | null>();

    readonly enclosing: Environment | null;

    /**
     * The non-argument constructor is for global scope's environment
     */
    constructor(enclosing?: Environment);

    /**
     * Creates new local scope nested inside the given enclosing
     */
    constructor(enclosing: Environment);
    
    constructor(enclosing?: Environment) {
        if (enclosing) {
            this.enclosing = enclosing;
            return;
        }
        this.enclosing = null;
    }

    assignAt(distance: number, name: Token, value: Object) {
        this.ancestor(distance).values.set(name.lexeme, value);
    }

    getAt(distance: number, name: string) {
        return this.ancestor(distance).values.get(name);
    }

    ancestor(distance: number): Environment {
        let environment: Environment = this;
        for (let i = 0; i < distance; i++) {
            if (environment.enclosing) {
                environment = environment.enclosing;
            }
        }

        return environment;
    }

    /**
     * Assignment is not allowed to create new variable
     */
    assign(name: Token, value: Object | null) {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return;
        }

        if (this.enclosing !== null) {
            return this.enclosing.assign(name, value);
        }

        throw new RuntimeException(name, `Undefined variable "${name.lexeme}".`);
    }

    define(name: string, value: Object | null): void {
        this.values.set(name, value);
    }

    get(name: Token) {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme);
        }

        /**
         * If the variable isn't found in this environment, try the enclosing one.
         * That in turn does the same thing recursively,
         * so this will walk through the entire scope chain.
         * 
         * If we reach an environment with no enclosing one
         * and still don't find the variable,
         * then it throws an error.
         */
        if (this.enclosing !== null) {
            return this.enclosing.get(name);
        }

        throw new RuntimeException(name, `Undefined variable ${name.lexeme}.`);
    }
}

const a = new Environment();