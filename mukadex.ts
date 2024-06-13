import {readFileSync} from 'node:fs';
import {Scanner} from './scanner/scanner';

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
        for (const token of tokens) {
            console.log(token);
        }
    }


    static error(line: number, message: string): void {
        this.report(line, '', message);
    }

    private static report(line: number, where: string, message: string): void {
        console.error("[line " + line + "] Error" + where + ": " + message);
        this.hasError = true;
    }
}

Mukadex.main();


