import {createWriteStream} from "fs";

interface Writer {
    write: (text: string) => void;
}

export class GenerateAst {
    constructor(args: string[]) {
        if (args.length !== 1) {
            throw new Error("Usage: generate_ast <output directory>");
        }
        const outputDir: string = args[0];

        this.defineAst(outputDir, "Expr", [
            "Assign : Token name, Expr value",
            "Binary : Expr left, Token operator, Expr right",
            "Grouping : Expr expression",
            "Literal : Object|null value",
            "Logical: Expr left, Token operator, Expr right",
            "Unary : Token operator, Expr right",
            "Call: Expr callee, Token paren, Expr[] args",
            "Function : Token[] params, Stmt[] body",
            "Variable : Token name",
        ], [{from: './token/token', what: 'Token'}, {from: './Stmt', what: 'Stmt'}]);

        this.defineAst(outputDir, "Stmt", [
            "Block : Stmt[] statements",
            "Expression : Expr expression",
            "Function : Token name, Expr.Function fn",
            "Return: Token keyword, Expr|null value",
            "If : Expr condition, Stmt thenBranch, Stmt|null elseBranch",
            "Print : Expr expression",
            "Var : Token name, Expr initializer",
            "While : Expr condition, Stmt body",
            "Break : Token keyword"
        ], [
            {from: './Expr', what: 'Expr'},
            {from: './token/token', what: 'Token'},
        ]);
        }

    private defineVisitor(writer: Writer, baseName: string, types: string[]) {
        writer.write("export interface Visitor<T> {\n");
        for (const type of types) {
            const typeName = type.split(':')[0].trim();
            writer.write(`    visit${typeName}${baseName}(${baseName.toLowerCase()}: ${baseName}.${typeName}): T;\n`);
        }

        writer.write("}\n")
    }

    private defineType(writer: Writer, baseName: string, className: string, fieldList: string) {
        writer.write(`    export class ${className} implements ${baseName} {\n`);

        // Store parameters in fields
        const fields: string[] = fieldList.split(', ');
        const formattedFields: string[] = [];

        fields.forEach((field) => {
            formattedFields.push(field.split(' ').reverse().join(': '));
        });

        for (const field of fields) {
            const currentField = field.split(' ');
            const type = currentField[0];
            const name = currentField[1];
            writer.write(`      readonly ${name}: ${type};\n`);
        }

        writer.write('\n');

        writer.write(`      accept<T>(visitor: Visitor<T>) {\n`);
        writer.write(`          return visitor.visit${className}${baseName}(this);\n`);
        writer.write(`      }\n`);
        writer.write('\n');
        writer.write(`      constructor(${formattedFields.join(', ')}) {\n`);

        for (const field of fields) {
            const name = field.split(' ')[1];
            writer.write(`        this.${name} = ${name};\n`);
        }
        writer.write('      }\n');
        writer.write('    }\n');
        writer.write('\n');
    }

    private defineAst(outputDir: string, baseName: string, types: string[], imports?: Array<{from: string, what: string, isDefault?: boolean}>) {
        const path = `${outputDir}/${baseName}.ts`;

        // 'w' flag stands for overriding
        const writer = createWriteStream(path, {flags: 'w'});

        if (imports) {
            for (const {from, isDefault, what} of imports) {
                let importName = `{${what}}`;
                if (isDefault) importName = what;

                writer.write(`import ${importName} from "${from}"\n`);
            }
        }

        writer.write("\n");
        writer.write(`export abstract class ${baseName} {\n`);
        writer.write(`  abstract accept<T>(visitor: Visitor<T>): T`);
        writer.write("\n");
        writer.write(`};`);
        writer.write("\n");
        writer.write("\n");

        this.defineVisitor(writer, baseName, types);
        writer.write("\n");

        writer.write(`export namespace ${baseName} {\n`);
        // The AST classes
        for (const type of types) {
            const className = type.split(":")[0].trim();
            const fields = type.split(":")[1].trim();
            this.defineType(writer, baseName, className, fields);
        }
    
        writer.write("};\n");

        writer.write("\n");
    
        writer.close();
    };
}

const tool = new GenerateAst(['./']);