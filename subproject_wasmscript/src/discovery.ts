import crypto from "node:crypto";
import path from "node:path";
import ts from "typescript";
import { WasmScriptError } from "./errors.js";
import type { WasmBlock, WasmCapture, WasmFunction, WasmModule } from "./types.js";

const OPEN_MARKER = "/** [WASM] */";
const CLOSE_MARKER = "/** [/WASM] */";
const WASM_TYPES = new Set([
    "bool",
    "f32",
    "f64",
    "i8",
    "i16",
    "i32",
    "i64",
    "isize",
    "u8",
    "u16",
    "u32",
    "u64",
    "usize",
    "string",
    "void",
]);

interface WasmRegion {
    readonly start: number;
    readonly end: number;
}

export function discoverWasmModule(program: ts.Program, projectDirectory: string): WasmModule {
    const functions: WasmFunction[] = [];
    const blocks: WasmBlock[] = [];
    const nodes: ts.Node[] = [];

    for (const sourceFile of program.getSourceFiles()) {
        if (sourceFile.isDeclarationFile || sourceFile.fileName.includes("/node_modules/")) continue;

        for (const region of findWasmRegions(sourceFile)) {
            const roots = findContainedRoots(sourceFile, region);
            if (roots.length === 0) {
                throw errorAtPosition(
                    sourceFile,
                    region.start,
                    "A WASM region must contain a declaration or statement.",
                );
            }

            const statementBlock = asStatementBlock(roots, sourceFile);
            if (statementBlock) {
                nodes.push(...statementBlock.statements);
                blocks.push(
                    readBlock(program, sourceFile, projectDirectory, statementBlock.parent, statementBlock.statements),
                );
                continue;
            }

            for (const node of roots) {
                nodes.push(node);
                if (ts.isFunctionDeclaration(node)) {
                    functions.push(readFunction(node, sourceFile, projectDirectory));
                } else if (ts.isClassDeclaration(node)) {
                    functions.push(...readClass(node, sourceFile, projectDirectory));
                } else if (ts.isStatement(node)) {
                    continue;
                } else if (ts.isMethodDeclaration(node)) {
                    const owner = findContainingClass(sourceFile, node);
                    if (!owner) {
                        throw errorAt(sourceFile, node, "A marked method must belong to a class declaration.");
                    }
                    assertMethodHasNoInstanceState(node, sourceFile);
                    functions.push(readFunction(node, sourceFile, projectDirectory, owner));
                } else {
                    throw errorAt(
                        sourceFile,
                        node,
                        "Top-level WASM regions can only contain executable statements, functions, or classes.",
                    );
                }
            }
        }
    }

    return { functions, blocks, nodes };
}

export function discoverWasmFunctions(program: ts.Program, projectDirectory: string): readonly WasmFunction[] {
    return discoverWasmModule(program, projectDirectory).functions;
}

function findContainedRoots(sourceFile: ts.SourceFile, region: WasmRegion): readonly ts.Node[] {
    const roots: ts.Node[] = [];
    const visit = (node: ts.Node): void => {
        const start = node.getStart(sourceFile);
        if (start >= region.start && node.end <= region.end) {
            roots.push(node);
            return;
        }
        if (node.end < region.start || start > region.end) return;
        node.forEachChild(visit);
    };
    sourceFile.forEachChild(visit);
    return roots;
}

function asStatementBlock(
    nodes: readonly ts.Node[],
    sourceFile: ts.SourceFile,
):
    | {
          readonly parent: ts.Block;
          readonly statements: readonly ts.Statement[];
      }
    | undefined {
    if (!nodes.every(ts.isStatement)) return undefined;
    const first = nodes[0];
    if (!first) return undefined;
    const parent = findContainingBlock(sourceFile, first);
    if (!parent || !nodes.every((node) => parent.statements.includes(node as ts.Statement))) return undefined;
    return { parent, statements: nodes };
}

function findContainingBlock(sourceFile: ts.SourceFile, target: ts.Node): ts.Block | undefined {
    let result: ts.Block | undefined;
    walk(sourceFile, (node) => {
        if (ts.isBlock(node) && node.statements.includes(target as ts.Statement)) {
            result = node;
        }
    });
    return result;
}

function findContainingClass(sourceFile: ts.SourceFile, target: ts.MethodDeclaration): ts.ClassDeclaration | undefined {
    let result: ts.ClassDeclaration | undefined;
    walk(sourceFile, (node) => {
        if (ts.isClassDeclaration(node) && node.members.includes(target)) result = node;
    });
    return result;
}

function readBlock(
    program: ts.Program,
    sourceFile: ts.SourceFile,
    projectDirectory: string,
    parent: ts.Block,
    statements: readonly ts.Statement[],
): WasmBlock {
    const checker = program.getTypeChecker();
    const declared = new Set<ts.Symbol>();
    const captures = new Map<ts.Symbol, WasmCapture>();
    const mutated = new Set<ts.Symbol>();
    const first = statements[0]!;

    for (const statement of statements) {
        walk(statement, (node) => {
            if (
                ts.isFunctionDeclaration(node) ||
                ts.isClassDeclaration(node) ||
                ts.isArrowFunction(node) ||
                ts.isFunctionExpression(node)
            ) {
                if (node !== statement) {
                    throw errorAt(
                        sourceFile,
                        node,
                        "Nested functions and classes are not supported in statement-level WASM regions.",
                    );
                }
            }
            if (node.kind === ts.SyntaxKind.ThisKeyword || ts.isAwaitExpression(node) || ts.isYieldExpression(node)) {
                throw errorAt(sourceFile, node, "Statement-level WASM regions cannot capture this, await, or yield.");
            }
            if (isDeclarationName(node)) {
                const symbol = checker.getSymbolAtLocation(node);
                if (symbol) declared.add(symbol);
            }
        });
    }

    for (const statement of statements) {
        walk(statement, (node) => {
            if (!ts.isIdentifier(node) || isNonValueIdentifier(node)) return;
            const symbol = checker.getSymbolAtLocation(node);
            if (
                !symbol ||
                !(symbol.flags & ts.SymbolFlags.Variable) ||
                declared.has(symbol) ||
                isWasmGlobal(symbol, statements)
            )
                return;
            const capture = captures.get(symbol) ?? readCapture(checker, symbol, node, sourceFile);
            captures.set(symbol, capture);
            if (isMutation(node)) mutated.add(symbol);
        });
    }

    if (mutated.size > 1) {
        throw errorAt(sourceFile, first, "A statement-level WASM region can mutate at most one captured scalar value.");
    }
    const outputSymbol = mutated.values().next().value as ts.Symbol | undefined;
    const output = outputSymbol ? captures.get(outputSymbol) : undefined;
    const captureList = [...captures.values()];
    const returnType = output?.javascriptType ?? "void";
    const signature = `(${captureList
        .map(({ name, javascriptType }) => `${name}: ${javascriptType}`)
        .join(", ")}) => ${returnType}`;
    const line = sourceFile.getLineAndCharacterOfPosition(first.getStart(sourceFile)).line + 1;

    return {
        sourceFile,
        statements,
        parent,
        name: `block@${line}`,
        exportName: createHashedName(sourceFile, projectDirectory, `block:${first.getStart(sourceFile)}`),
        signature,
        parameterTypes: captureList.map(({ assemblyType }) => assemblyType),
        returnType: output?.assemblyType ?? "void",
        captures: captureList,
        ...(output ? { output } : {}),
    };
}

function readCapture(
    checker: ts.TypeChecker,
    symbol: ts.Symbol,
    identifier: ts.Identifier,
    sourceFile: ts.SourceFile,
): WasmCapture {
    const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
    const typeNode =
        declaration && (ts.isVariableDeclaration(declaration) || ts.isParameter(declaration))
            ? declaration.type
            : undefined;
    const annotatedType = typeNode?.getText(sourceFile);
    const inferred = checker.getTypeAtLocation(identifier);
    const assemblyType =
        annotatedType && WASM_TYPES.has(annotatedType)
            ? annotatedType
            : inferAssemblyType(checker, inferred, sourceFile, identifier);
    return {
        symbol,
        name: identifier.text,
        assemblyType,
        javascriptType: abiTypeText(assemblyType),
    };
}

function inferAssemblyType(checker: ts.TypeChecker, type: ts.Type, sourceFile: ts.SourceFile, node: ts.Node): string {
    if (type.flags & ts.TypeFlags.NumberLike) return "f64";
    if (type.flags & ts.TypeFlags.BigIntLike) return "i64";
    if (type.flags & ts.TypeFlags.BooleanLike) return "bool";
    throw errorAt(
        sourceFile,
        node,
        `Cannot capture '${checker.typeToString(type)}' in a WASM statement block; use a scalar value.`,
    );
}

function isWasmGlobal(symbol: ts.Symbol, statements: readonly ts.Statement[]): boolean {
    const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
    if (!declaration) return true;
    return statements.some(
        (statement) => declaration.getStart() >= statement.getStart() && declaration.end <= statement.end,
    );
}

function isDeclarationName(node: ts.Node): node is ts.Identifier {
    return (
        ts.isIdentifier(node) &&
        ((ts.isVariableDeclaration(node.parent) && node.parent.name === node) ||
            (ts.isParameter(node.parent) && node.parent.name === node))
    );
}

function isNonValueIdentifier(node: ts.Identifier): boolean {
    const parent = node.parent;
    return (
        isDeclarationName(node) ||
        (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        (ts.isPropertyAssignment(parent) && parent.name === node) ||
        (ts.isTypeReferenceNode(parent) && parent.typeName === node)
    );
}

function isMutation(node: ts.Identifier): boolean {
    const parent = node.parent;
    if (ts.isPrefixUnaryExpression(parent) || ts.isPostfixUnaryExpression(parent)) {
        return parent.operator === ts.SyntaxKind.PlusPlusToken || parent.operator === ts.SyntaxKind.MinusMinusToken;
    }
    if (!ts.isBinaryExpression(parent) || parent.left !== node) return false;
    return (
        parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment
    );
}

function walk(node: ts.Node, callback: (node: ts.Node) => void): void {
    callback(node);
    node.forEachChild((child) => walk(child, callback));
}

function findWasmRegions(sourceFile: ts.SourceFile): readonly WasmRegion[] {
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, sourceFile.languageVariant, sourceFile.text);
    const regions: WasmRegion[] = [];
    let openPosition: number | undefined;

    for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
        if (token !== ts.SyntaxKind.MultiLineCommentTrivia) continue;
        const marker = scanner.getTokenText();
        if (marker === OPEN_MARKER) {
            if (openPosition !== undefined) {
                throw errorAtPosition(sourceFile, scanner.getTokenPos(), "WASM regions cannot be nested.");
            }
            openPosition = scanner.getTextPos();
        } else if (marker === CLOSE_MARKER) {
            if (openPosition === undefined) {
                throw errorAtPosition(sourceFile, scanner.getTokenPos(), `Unexpected '${CLOSE_MARKER}'.`);
            }
            regions.push({ start: openPosition, end: scanner.getTokenPos() });
            openPosition = undefined;
        }
    }
    if (openPosition !== undefined) {
        throw errorAtPosition(sourceFile, openPosition, `Missing '${CLOSE_MARKER}' for WASM region.`);
    }
    return regions;
}

function readFunction(
    declaration: ts.FunctionDeclaration | ts.MethodDeclaration,
    sourceFile: ts.SourceFile,
    projectDirectory: string,
    owner?: ts.ClassDeclaration,
): WasmFunction {
    if (!declaration.name || !ts.isIdentifier(declaration.name) || !declaration.body || !declaration.type) {
        throw errorAt(sourceFile, declaration, "WASM functions need a name, body, and explicit return type.");
    }
    if (declaration.asteriskToken) throw errorAt(sourceFile, declaration, "WASM functions cannot be generators.");
    if (declaration.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)) {
        throw errorAt(sourceFile, declaration, "WASM functions cannot be async.");
    }
    for (const parameter of declaration.parameters) {
        if (!ts.isIdentifier(parameter.name) || !parameter.type) {
            throw errorAt(sourceFile, parameter, "WASM parameters need simple names and explicit scalar types.");
        }
        assertAbiType(parameter.type, sourceFile);
        if (parameter.type.getText(sourceFile) === "string") {
            throw errorAt(sourceFile, parameter.type, "WASM string parameters are not supported yet.");
        }
    }
    assertAbiType(declaration.type, sourceFile);
    const signature = `(${declaration.parameters
        .map((parameter) => `${parameter.name.getText(sourceFile)}: ${abiType(parameter.type!, sourceFile)}`)
        .join(", ")}) => ${abiType(declaration.type, sourceFile)}`;
    return {
        declaration,
        sourceFile,
        name: declaration.name.text,
        exportName: createHashedName(
            sourceFile,
            projectDirectory,
            `${owner?.name?.text ?? "module"}:${declaration.name.text}:${declaration.getStart(sourceFile)}`,
        ),
        signature,
        parameterTypes: declaration.parameters.map((parameter) => parameter.type!.getText(sourceFile)),
        returnType: declaration.type.getText(sourceFile),
        ...(declaration.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
            ? { exposedName: declaration.name.text }
            : {}),
        ...(owner ? { owner } : {}),
    };
}

function readClass(
    declaration: ts.ClassDeclaration,
    sourceFile: ts.SourceFile,
    projectDirectory: string,
): readonly WasmFunction[] {
    if (!declaration.name) throw errorAt(sourceFile, declaration, "WASM classes must have a name.");
    if (declaration.heritageClauses?.length) {
        throw errorAt(sourceFile, declaration, "WASM namespace classes cannot use inheritance.");
    }
    return declaration.members.map((member) => {
        if (!ts.isMethodDeclaration(member)) {
            throw errorAt(sourceFile, member, "WASM namespace classes can only contain methods.");
        }
        if (!member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword)) {
            throw errorAt(sourceFile, member, "Methods in a wholly marked WASM class must be static.");
        }
        return readFunction(member, sourceFile, projectDirectory, declaration);
    });
}

function assertMethodHasNoInstanceState(declaration: ts.MethodDeclaration, sourceFile: ts.SourceFile): void {
    walk(declaration.body!, (node) => {
        if (node.kind === ts.SyntaxKind.ThisKeyword) {
            throw errorAt(
                sourceFile,
                node,
                "An individually marked method cannot access instance state through 'this'.",
            );
        }
    });
}

function createHashedName(sourceFile: ts.SourceFile, projectDirectory: string, identity: string): string {
    const relativePath = path.relative(projectDirectory, sourceFile.fileName).replaceAll(path.sep, "/");
    return `WASM$${crypto.createHash("sha256").update(`${relativePath}:${identity}`).digest("hex").slice(0, 12)}`;
}

function assertAbiType(type: ts.TypeNode, sourceFile: ts.SourceFile): void {
    const text = type.getText(sourceFile);
    if (!WASM_TYPES.has(text)) {
        throw errorAt(sourceFile, type, `Unsupported WASM ABI type '${text}'. Use an AssemblyScript scalar type.`);
    }
}

function abiType(type: ts.TypeNode, sourceFile: ts.SourceFile): string {
    return abiTypeText(type.getText(sourceFile));
}

function abiTypeText(type: string): string {
    if (type === "bool") return "boolean";
    if (type === "string") return "string";
    if (type === "void") return "void";
    return "number";
}

function errorAt(sourceFile: ts.SourceFile, node: ts.Node, message: string): WasmScriptError {
    return errorAtPosition(sourceFile, node.getStart(sourceFile), message);
}

function errorAtPosition(sourceFile: ts.SourceFile, offset: number, message: string): WasmScriptError {
    const position = sourceFile.getLineAndCharacterOfPosition(offset);
    return new WasmScriptError(`${sourceFile.fileName}:${position.line + 1}:${position.character + 1} - ${message}`);
}
