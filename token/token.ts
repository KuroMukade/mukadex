import { TokenType } from "./types";

export class Token {
    readonly type: TokenType;
    readonly lexeme: string;
    readonly literal: null | string;
    readonly line: number;

    constructor(type: TokenType, lexeme: string, literal: string | null, line: number) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
    }

    public convertToString(): string {
        return this.type + " " + this.lexeme + " " + this.literal;
    }
}