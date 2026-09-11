import fs from "node:fs/promises";
import path from "node:path";
import asc from "assemblyscript/asc";
import ts from "typescript";
import { WasmScriptError } from "./errors.js";
import type { ResolvedOptions, WasmModule } from "./types.js";

export async function compileAssembly(
    program: ts.Program,
    wasmModule: WasmModule,
    options: ResolvedOptions,
): Promise<string> {
    const source = createAssemblySource(program, wasmModule);
    const result = await asc.compileString(source, {
        optimizeLevel: 3,
        shrinkLevel: 1,
        runtime: "stub",
    });

    if (result.error || !result.binary) {
        const diagnostics = result.stderr.toString().trim();
        throw new WasmScriptError(
            diagnostics.length > 0
                ? `AssemblyScript compilation failed:\n${diagnostics}`
                : "AssemblyScript compilation failed.",
        );
    }

    await fs.mkdir(options.generatedDirectory, { recursive: true });
    const wasmPath = path.join(options.generatedDirectory, options.wasmFileName);
    await fs.writeFile(wasmPath, result.binary);
    return wasmPath;
}

export function createAssemblySource(program: ts.Program, wasmModule: WasmModule): string {
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const checker = program.getTypeChecker();
    const exportNames = new Map(
        wasmModule.functions.flatMap(({ declaration, exportName }) => {
            const symbol = declaration.name ? checker.getSymbolAtLocation(declaration.name) : undefined;
            return symbol ? [[symbol, exportName] as const] : [];
        }),
    );
    const transform: ts.TransformerFactory<ts.Node> = (context) => (rootNode) => {
        const visitor: ts.Visitor = (node) => {
            if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
                const symbol = checker.getSymbolAtLocation(node.expression.name);
                const exportName = symbol ? exportNames.get(resolveSymbol(checker, symbol)) : undefined;
                if (exportName) {
                    return ts.factory.updateCallExpression(
                        node,
                        ts.factory.createIdentifier(exportName),
                        node.typeArguments,
                        ts.visitNodes(node.arguments, visitor) as ts.NodeArray<ts.Expression>,
                    );
                }
            }
            if (ts.isIdentifier(node)) {
                const symbol = checker.getSymbolAtLocation(node);
                if (symbol) {
                    const exportName = exportNames.get(resolveSymbol(checker, symbol));
                    if (exportName) return ts.factory.createIdentifier(exportName);
                }
            }
            return ts.visitEachChild(node, visitor, context);
        };
        return ts.visitNode(rootNode, visitor) as ts.Node;
    };

    const declarations = wasmModule.nodes
        .flatMap((statement) => {
            const sourceFile = statement.getSourceFile();
            if (wasmModule.blocks.some((block) => block.statements.includes(statement as ts.Statement))) {
                return [];
            }
            if (ts.isClassDeclaration(statement)) {
                return wasmModule.functions
                    .filter(({ owner }) => owner === statement)
                    .map(({ declaration, exportName }) => {
                        if (!ts.isMethodDeclaration(declaration)) return "";
                        const clean = ts.factory.createFunctionDeclaration(
                            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                            undefined,
                            exportName,
                            declaration.typeParameters,
                            declaration.parameters,
                            declaration.type,
                            declaration.body,
                        );
                        const result = ts.transform(clean, [transform]);
                        try {
                            return printer.printNode(ts.EmitHint.Unspecified, result.transformed[0]!, sourceFile);
                        } finally {
                            result.dispose();
                        }
                    });
            }
            if (ts.isMethodDeclaration(statement)) {
                const entry = wasmModule.functions.find(({ declaration }) => declaration === statement);
                return entry ? printMethod(entry.declaration, entry.exportName, sourceFile) : "";
            }
            if (ts.isVariableStatement(statement)) {
                return printStateVariables(statement, sourceFile);
            }
            if (!ts.isFunctionDeclaration(statement)) {
                const result = ts.transform(statement, [transform]);
                try {
                    return printer.printNode(ts.EmitHint.Unspecified, result.transformed[0]!, sourceFile);
                } finally {
                    result.dispose();
                }
            }
            const declaration = statement;
            const modifiers = declaration.modifiers?.filter(
                (modifier) => modifier.kind !== ts.SyntaxKind.DeclareKeyword,
            );
            const exported = modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
                ? modifiers
                : [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword), ...(modifiers ?? [])];
            const clean = ts.factory.updateFunctionDeclaration(
                declaration,
                exported,
                declaration.asteriskToken,
                declaration.name,
                declaration.typeParameters,
                declaration.parameters,
                declaration.type,
                declaration.body,
            );
            const result = ts.transform(clean, [transform]);
            try {
                return printer.printNode(ts.EmitHint.Unspecified, result.transformed[0]!, sourceFile);
            } finally {
                result.dispose();
            }
        })
        .filter(Boolean);

    const extractedBlocks = wasmModule.blocks.map((block) => {
        const parameters = block.captures.map((capture) =>
            ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                capture.name,
                undefined,
                ts.factory.createTypeReferenceNode(capture.assemblyType),
            ),
        );
        const statements = [...block.statements];
        if (block.output) {
            statements.push(ts.factory.createReturnStatement(ts.factory.createIdentifier(block.output.name)));
        }
        const declaration = ts.factory.createFunctionDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            undefined,
            block.exportName,
            undefined,
            parameters,
            ts.factory.createTypeReferenceNode(block.output?.assemblyType ?? "void"),
            ts.factory.createBlock(statements, true),
        );
        const result = ts.transform(declaration, [transform]);
        try {
            return printer.printNode(ts.EmitHint.Unspecified, result.transformed[0]!, block.sourceFile);
        } finally {
            result.dispose();
        }
    });

    return [...declarations, ...extractedBlocks].join("\n\n");

    function printMethod(
        declaration: ts.FunctionDeclaration | ts.MethodDeclaration,
        exportName: string,
        sourceFile: ts.SourceFile,
    ): string {
        if (!ts.isMethodDeclaration(declaration)) return "";
        const clean = ts.factory.createFunctionDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            undefined,
            exportName,
            declaration.typeParameters,
            declaration.parameters,
            declaration.type,
            declaration.body,
        );
        const result = ts.transform(clean, [transform]);
        try {
            return printer.printNode(ts.EmitHint.Unspecified, result.transformed[0]!, sourceFile);
        } finally {
            result.dispose();
        }
    }

    function printStateVariables(statement: ts.VariableStatement, sourceFile: ts.SourceFile): string {
        return statement.declarationList.declarations
            .map((declaration) => {
                if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
                    throw new WasmScriptError(
                        `${sourceFile.fileName} - WASM state declarations need a simple name and initializer.`,
                    );
                }
                if (!ts.isObjectLiteralExpression(declaration.initializer)) {
                    return printer.printNode(
                        ts.EmitHint.Unspecified,
                        ts.factory.createVariableStatement(
                            undefined,
                            ts.factory.createVariableDeclarationList([declaration], statement.declarationList.flags),
                        ),
                        sourceFile,
                    );
                }

                const stateType = checker.getTypeAtLocation(declaration.name);
                const className = `WASM$State$${declaration.name.text}`;
                const fields = declaration.initializer.properties.map((property) => {
                    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) {
                        throw new WasmScriptError(
                            `${sourceFile.fileName} - WASM state object properties need explicit identifier names and values.`,
                        );
                    }
                    const field = stateType.getProperty(property.name.text);
                    const fieldDeclaration = field?.valueDeclaration ?? field?.declarations?.[0];
                    const annotatedType =
                        fieldDeclaration &&
                        (ts.isPropertySignature(fieldDeclaration) || ts.isPropertyDeclaration(fieldDeclaration))
                            ? fieldDeclaration.type
                            : undefined;
                    const fieldType =
                        annotatedType ??
                        (field
                            ? checker.typeToTypeNode(
                                  checker.getTypeOfSymbolAtLocation(field, declaration.name),
                                  undefined,
                                  ts.NodeBuilderFlags.NoTruncation,
                              )
                            : undefined);
                    if (!fieldType) {
                        throw new WasmScriptError(
                            `${sourceFile.fileName} - Cannot determine the type of WASM state property '${property.name.text}'.`,
                        );
                    }
                    return ts.factory.createPropertyDeclaration(
                        undefined,
                        property.name,
                        undefined,
                        fieldType,
                        property.initializer,
                    );
                });
                const stateClass = ts.factory.createClassDeclaration(
                    undefined,
                    className,
                    undefined,
                    undefined,
                    fields,
                );
                const stateDeclaration = ts.factory.createVariableStatement(
                    undefined,
                    ts.factory.createVariableDeclarationList(
                        [
                            ts.factory.createVariableDeclaration(
                                declaration.name,
                                undefined,
                                ts.factory.createTypeReferenceNode(className),
                                ts.factory.createNewExpression(ts.factory.createIdentifier(className), undefined, []),
                            ),
                        ],
                        statement.declarationList.flags,
                    ),
                );
                const result = ts.transform([stateClass, stateDeclaration], [transform]);
                try {
                    return result.transformed
                        .map((node) => printer.printNode(ts.EmitHint.Unspecified, node, sourceFile))
                        .join("\n");
                } finally {
                    result.dispose();
                }
            })
            .join("\n");
    }
}

function resolveSymbol(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
    return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}
