"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Token = void 0;
class Token {
    type;
    lexeme;
    literal;
    line;
    constructor(type, lexeme, literal, line) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
    }
    convertToString() {
        return this.type + " " + this.lexeme + " " + this.literal;
    }
}
exports.Token = Token;
