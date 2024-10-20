import { readFileSync } from 'node:fs';

import { Token } from './token/token';
import { TokenType } from './token/types';

import { Parser } from './parser/parser';

import { Interpreter, RuntimeException } from './interpreter/interpreter';

import { Scanner } from './scanner/scanner';
import { Resolver } from './resolver/resolver';

export class Mukadex {
    static hasError: boolean = false;
    static hadRuntimeError = false;
    private static interpreter = new Interpreter();

    public static main(...args: string[]): void {
        if (args.length > 1) {
            console.log("Usage: jmukadex [script]");
            return;
        }
        if (args.length === 1) {
            this.runFile(args[0]);
            return;
        }
    }

    private static runFile(path: string): void {
        const bytes = readFileSync(path);

        this.run(bytes.toString('utf-8'));

        if (this.hasError) return;
        if (this.hadRuntimeError) return;
    }

    private static run(source: string): void {
        const scanner = new Scanner(source);
        const tokens = scanner.scanTokens();

        const parser = new Parser(tokens);
        const statements = parser.parse();

        if (this.hasError) return;

        const resolver = new Resolver(this.interpreter);
        resolver.resolve(statements);

        if (this.hasError) return;

        this.interpreter.interpret(statements);
    }


    static error(token: Token, message: string): void {
        if (token?.type === TokenType.EOF) {
            this.report(token?.line, ' at end', message);
        } else {
            this.report(token?.line, ` at "${token?.lexeme}"`, message);
        }
    }

    static runtimeError(error: RuntimeException) {
        console.error(`${error.message}\n[line ${error.token.line}]`);
    }

    private static report(line: number, where: string, message: string): void {
        console.error("[line " + line + "] Error" + where + ": " + message);
        this.hasError = true;
    }
}

Mukadex.main('unused-local-variables.txt');
