import path from "node:path";
import ts from "typescript";
import type { WasmModule } from "./types.js";

export function createWasmTransformer(
    program: ts.Program,
    wasmModule: WasmModule,
    runtimePath: string,
): ts.TransformerFactory<ts.SourceFile> {
    const checker = program.getTypeChecker();
    const wasmSymbols = new Map(
        wasmModule.functions.flatMap(({ declaration, exportName }) => {
            const symbol = declaration.name ? checker.getSymbolAtLocation(declaration.name) : undefined;
            return symbol ? [[symbol, exportName] as const] : [];
        }),
    );
    const wasmClasses = new Set(
        wasmModule.functions.flatMap(({ owner }) => {
            const symbol = owner?.name ? checker.getSymbolAtLocation(owner.name) : undefined;
            return symbol ? [symbol] : [];
        }),
    );

    return (context) => (sourceFile) => {
        if (sourceFile.isDeclarationFile || sourceFile.fileName === runtimePath) return sourceFile;

        const localNodes = new Set(
            wasmModule.nodes.filter((node) => node.getSourceFile().fileName === sourceFile.fileName),
        );
        const localBlocks = wasmModule.blocks.filter((block) => block.sourceFile.fileName === sourceFile.fileName);
        const blocksByFirstStatement = new Map(localBlocks.map((block) => [block.statements[0], block] as const));
        const blockStatements = new Set(localBlocks.flatMap((block) => block.statements));
        const alias = uniqueAlias(sourceFile, "__wasm");
        let used = false;

        const visitor: ts.Visitor = (node) => {
            if (ts.isBlock(node)) return rewriteBlock(node);

            if (ts.isMethodDeclaration(node) && localNodes.has(node)) {
                const entry = wasmModule.functions.find(({ declaration }) => declaration === node);
                if (!entry) return undefined;
                used = true;
                return ts.factory.createPropertyDeclaration(
                    node.modifiers,
                    node.name,
                    node.questionToken,
                    undefined,
                    wasmReference(entry.exportName),
                );
            }

            if (ts.isStatement(node) && localNodes.has(node) && !blockStatements.has(node)) return undefined;

            if (ts.isImportDeclaration(node)) {
                return rewriteImport(node);
            }

            if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
                const exportName = wasmExportName(node.expression);
                if (!exportName) return ts.visitEachChild(node, visitor, context);
                used = true;
                return ts.factory.updateCallExpression(
                    node,
                    ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(alias), exportName),
                    node.typeArguments,
                    ts.visitNodes(node.arguments, visitor) as ts.NodeArray<ts.Expression>,
                );
            }

            if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
                if (!ts.isIdentifier(node.expression.name)) {
                    return ts.visitEachChild(node, visitor, context);
                }
                const exportName = wasmExportName(node.expression.name);
                if (!exportName) return ts.visitEachChild(node, visitor, context);
                used = true;
                return ts.factory.updateCallExpression(
                    node,
                    ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(alias), exportName),
                    node.typeArguments,
                    ts.visitNodes(node.arguments, visitor) as ts.NodeArray<ts.Expression>,
                );
            }

            if (ts.isIdentifier(node) && isValueReference(node)) {
                const exportName = wasmExportName(node);
                if (exportName) {
                    used = true;
                    return wasmReference(exportName);
                }
            }

            return ts.visitEachChild(node, visitor, context);
        };

        function rewriteBlock(node: ts.Block): ts.Block {
            const statements: ts.Statement[] = [];
            for (let index = 0; index < node.statements.length; index++) {
                const statement = node.statements[index]!;
                const block = blocksByFirstStatement.get(statement);
                if (!block) {
                    const visited = ts.visitNode(statement, visitor);
                    if (visited) statements.push(visited as ts.Statement);
                    continue;
                }

                used = true;
                const call = ts.factory.createCallExpression(
                    wasmReference(block.exportName),
                    undefined,
                    block.captures.map(({ name }) => ts.factory.createIdentifier(name)),
                );
                const expression = block.output
                    ? ts.factory.createBinaryExpression(
                          ts.factory.createIdentifier(block.output.name),
                          ts.factory.createToken(ts.SyntaxKind.EqualsToken),
                          call,
                      )
                    : call;
                statements.push(ts.factory.createExpressionStatement(expression));
                index += block.statements.length - 1;
            }
            return ts.factory.updateBlock(node, statements);
        }

        function wasmReference(exportName: string): ts.PropertyAccessExpression {
            return ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(alias), exportName);
        }

        function wasmExportName(identifier: ts.Identifier): string | undefined {
            const symbol = checker.getSymbolAtLocation(identifier);
            if (!symbol) return undefined;
            const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
            return wasmSymbols.get(target);
        }

        function isWasmClass(identifier: ts.Identifier): boolean {
            const symbol = checker.getSymbolAtLocation(identifier);
            if (!symbol) return false;
            const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
            return wasmClasses.has(target);
        }

        function isValueReference(identifier: ts.Identifier): boolean {
            const parent = identifier.parent;
            if (ts.isCallExpression(parent) && parent.expression === identifier) return false;
            if (ts.isPropertyAccessExpression(parent) && parent.name === identifier) return false;
            if (
                ts.isImportSpecifier(parent) ||
                ts.isExportSpecifier(parent) ||
                ts.isFunctionDeclaration(parent) ||
                ts.isMethodDeclaration(parent)
            )
                return false;
            return true;
        }

        function rewriteImport(node: ts.ImportDeclaration): ts.ImportDeclaration {
            const bindings = node.importClause?.namedBindings;
            if (!bindings || !ts.isNamedImports(bindings)) {
                return ts.visitEachChild(node, visitor, context) as ts.ImportDeclaration;
            }

            const elements = bindings.elements.filter(
                (element) => !wasmExportName(element.name) && !isWasmClass(element.name),
            );
            if (elements.length === bindings.elements.length) return node;

            const defaultImport = node.importClause?.name;
            if (elements.length === 0 && !defaultImport) {
                return ts.factory.updateImportDeclaration(
                    node,
                    node.modifiers,
                    undefined,
                    node.moduleSpecifier,
                    node.attributes,
                );
            }

            const clause = ts.factory.updateImportClause(
                node.importClause!,
                node.importClause!.isTypeOnly,
                defaultImport,
                elements.length > 0 ? ts.factory.updateNamedImports(bindings, elements) : undefined,
            );
            return ts.factory.updateImportDeclaration(
                node,
                node.modifiers,
                clause,
                node.moduleSpecifier,
                node.attributes,
            );
        }

        const visited = ts.visitEachChild(sourceFile, visitor, context);
        if (!used) return visited;

        const moduleSpecifier = relativeModulePath(sourceFile.fileName, runtimePath);
        const wasmImport = ts.factory.createImportDeclaration(
            undefined,
            ts.factory.createImportClause(
                false,
                undefined,
                ts.factory.createNamedImports([
                    ts.factory.createImportSpecifier(
                        false,
                        ts.factory.createIdentifier("wasm"),
                        ts.factory.createIdentifier(alias),
                    ),
                ]),
            ),
            ts.factory.createStringLiteral(moduleSpecifier),
        );
        return ts.factory.updateSourceFile(visited, [wasmImport, ...visited.statements]);
    };
}

function relativeModulePath(sourcePath: string, targetPath: string): string {
    let relative = path.relative(path.dirname(sourcePath), targetPath).replaceAll(path.sep, "/");
    relative = relative.replace(/\.tsx?$/, ".js");
    return relative.startsWith(".") ? relative : `./${relative}`;
}

function uniqueAlias(sourceFile: ts.SourceFile, requested: string): string {
    const identifiers = new Set<string>();
    const collect = (node: ts.Node): void => {
        if (ts.isIdentifier(node)) identifiers.add(node.text);
        ts.forEachChild(node, collect);
    };
    collect(sourceFile);

    let alias = requested;
    let suffix = 2;
    while (identifiers.has(alias)) alias = `${requested}${suffix++}`;
    return alias;
}
