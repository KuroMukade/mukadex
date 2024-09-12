import { RuntimeException } from "interpreter/interpreter";
import { toNamespacedPath } from "path/posix";
import { Token } from "token/token";

export class Environment {
    /**
     * Map uses bare strings for the keys instead of Tokens
     * A Token represents a unit of code at the specific place of the source text,
     * but when it comes to looking up variables, all identifier tokens with the same name
     * should refer to the same variable (ignoring scope at this point)
     */
    private readonly values = new Map<string, Object | null>();

    /**
     * Assignment is not allowed to create new variable
     */
    assign(name: Token, value: Object | null) {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return;
        }

        throw new RuntimeException(name, `Undefined variable ${name.lexeme}.`);
    }

    define(name: string, value: Object | null): void {
        this.values.set(name, value);
    }

    get(name: Token) {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme);
        }

        throw new RuntimeException(name, `Undefined variable ${name.lexeme}.`);
    }
}
