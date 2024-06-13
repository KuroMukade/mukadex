import {createWriteStream} from "fs";

interface Writer {
    write: (text: string) => void;
}

export class GenerateAst {
    private defineVisitor(writer: Writer, baseName: string, types: string[]) {
        writer.write("export interface Visitor<T> {\n");
    
        for (const type of types) {
            const typeName = type.split(':')[0].trim();
            console.log(type);
            writer.write(`    visit${typeName}${baseName}(${baseName.toLowerCase()}: typeof Expr.${typeName}): T;\n`);
        }

        writer.write("}\n")
    }

    private defineType(writer: Writer, baseName: string, className: string, fieldList: string) {
        writer.write(`    static ${className} = class ${baseName} {\n`);

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
        writer.write(`          return visitor.visit${className}${baseName}(this as any);\n`);
        writer.write(`      }`);

        writer.write('\n');
        writer.write(`      constructor(${formattedFields.join(', ')}) {\n`);

        for (const field of fields) {
            const name = field.split(' ')[1];
            writer.write(`        this.${name} = ${name};\n`);
        }
        writer.write('      }\n');
        writer.write('    }\n');
    }

    private defineAst(outputDir: string, baseName: string, types: string[]) {
        const path = `${outputDir}/${baseName}.ts`;

        const writer = createWriteStream(path, {flags: 'a'});
    
        writer.write("import { Token } from 'token/token';\n");

        writer.write('\n');

        this.defineVisitor(writer, baseName, types);
        writer.write('\n');

        writer.write(`export abstract class ${baseName} {\n`);
        
        writer.write('    abstract accept<T>(visitor: Visitor<T>): void;\n');
        writer.write('\n');
        
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

    public constructor(args: string[]) {
        if (args.length !== 1) {
            throw new Error("Usage: generate_ast <output directory>");
        }
        const outputDir: string = args[0];
        this.defineAst(outputDir, "Expr", [
            "Binary : Expr left, Token operator, Expr right",
            "Grouping : Expr expression",
            "Literal : Object value",
            "Unary : Token operator, Expr right"
        ]);
    }
}

const tool = new GenerateAst(['./']);