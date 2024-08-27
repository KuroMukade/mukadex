import {readFileSync} from 'node:fs';
import {Scanner} from './scanner/scanner';
import { Token } from 'token/token';
import { TokenType } from 'token/types';
import { Parser } from 'parser/parser';
import { AstPrinter } from 'printer/astPrinter';

export class Mukadex {
    static hasError: boolean = false;

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
        if (this.hasError) {
            return;
        }
    }

    private static run(source: string): void {
        const scanner = new Scanner(source);
        const tokens = scanner.scanTokens();

        const parser = new Parser(tokens);
        const expression = parser.parse();

        if (this.hasError || !expression) return;

        console.log(new AstPrinter().print(expression));
    }


    static error(token: Token, message: string): void {
        if (token.type === TokenType.EOF) {
            this.report(token.line, ' at end', message);
        } else {
            this.report(token.line, ` at "${token.lexeme}"`, message);
        }
    }

    private static report(line: number, where: string, message: string): void {
        console.error("[line " + line + "] Error" + where + ": " + message);
        this.hasError = true;
    }
}

Mukadex.main();


