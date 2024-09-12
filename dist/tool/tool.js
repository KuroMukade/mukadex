"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateAst = void 0;
const fs_1 = require("fs");
class GenerateAst {
    constructor(args) {
        if (args.length !== 1) {
            throw new Error("Usage: generate_ast <output directory>");
        }
        const outputDir = args[0];
        this.defineAst(outputDir, "Expr", [
            "Assign : Token name, Expr value",
            "Binary : Expr left, Token operator, Expr right",
            "Grouping : Expr expression",
            "Literal : Object value",
            "Unary : Token operator, Expr right",
            "Variable : Token name",
        ], [{ from: 'token/token', what: 'Token' }]);
        this.defineAst(outputDir, "Stmt", [
            "Expression : Expr expression",
            "Print : Expr expression",
            "Var : Token name, Expr initializer",
        ], [
            { from: 'Expr', what: 'Expr' },
            { from: 'token/token', what: 'Token' },
        ]);
    }
    defineVisitor(writer, baseName, types) {
        writer.write("export interface Visitor<T> {\n");
        for (const type of types) {
            const typeName = type.split(':')[0].trim();
            console.log(type);
            writer.write(`    visit${typeName}${baseName}(${baseName.toLowerCase()}: ${baseName}.${typeName}): T;\n`);
        }
        writer.write("}\n");
    }
    defineType(writer, baseName, className, fieldList) {
        writer.write(`    export class ${className} implements ${baseName} {\n`);
        // Store parameters in fields
        const fields = fieldList.split(', ');
        const formattedFields = [];
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
    defineAst(outputDir, baseName, types, imports) {
        const path = `${outputDir}/${baseName}.ts`;
        const writer = (0, fs_1.createWriteStream)(path, { flags: 'a' });
        if (imports) {
            for (const { from, isDefault, what } of imports) {
                let importName = `{${what}}`;
                if (isDefault)
                    importName = what;
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
    }
    ;
}
exports.GenerateAst = GenerateAst;
const tool = new GenerateAst(['./']);
