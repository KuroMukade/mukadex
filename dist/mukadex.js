"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mukadex = void 0;
const node_fs_1 = require("node:fs");
const types_1 = require("./token/types");
const parser_1 = require("./parser/parser");
const interpreter_1 = require("./interpreter/interpreter");
const scanner_1 = require("./scanner/scanner");
class Mukadex {
    static hasError = false;
    static hadRuntimeError = false;
    static interpreter = new interpreter_1.Interpreter();
    static main(...args) {
        if (args.length > 1) {
            console.log("Usage: jmukadex [script]");
            return;
        }
        if (args.length === 1) {
            this.runFile(args[0]);
            return;
        }
    }
    static runFile(path) {
        const bytes = (0, node_fs_1.readFileSync)(path);
        this.run(bytes.toString('utf-8'));
        if (this.hasError) {
            return;
        }
        if (this.hadRuntimeError)
            return;
    }
    static run(source) {
        const scanner = new scanner_1.Scanner(source);
        const tokens = scanner.scanTokens();
        const parser = new parser_1.Parser(tokens);
        const statements = parser.parse();
        if (this.hasError)
            return;
        this.interpreter.interpret(statements);
    }
    static error(token, message) {
        if (token?.type === types_1.TokenType.EOF) {
            this.report(token?.line, ' at end', message);
        }
        else {
            this.report(token?.line, ` at "${token?.lexeme}"`, message);
        }
    }
    static runtimeError(error) {
        console.error(`{error.getMessage()}\n[line ${error.token.line}]`);
    }
    static report(line, where, message) {
        console.error("[line " + line + "] Error" + where + ": " + message);
        this.hasError = true;
    }
}
exports.Mukadex = Mukadex;
Mukadex.main('example.txt');
