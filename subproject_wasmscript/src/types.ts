import type ts from "typescript";

export interface WasmScriptOptions {
    readonly generatedDirectory?: string;
    readonly moduleName?: string;
    readonly wasmFileName?: string;
}

export interface ResolvedOptions {
    readonly generatedDirectory: string;
    readonly moduleName: string;
    readonly wasmFileName: string;
}

export interface WasmFunction {
    readonly declaration: ts.FunctionDeclaration | ts.MethodDeclaration;
    readonly owner?: ts.ClassDeclaration;
    readonly sourceFile: ts.SourceFile;
    readonly name: string;
    readonly exportName: string;
    readonly signature: string;
    readonly parameterTypes: readonly string[];
    readonly returnType: string;
    readonly exposedName?: string;
}

export interface WasmCapture {
    readonly symbol: ts.Symbol;
    readonly name: string;
    readonly assemblyType: string;
    readonly javascriptType: string;
}

export interface WasmBlock {
    readonly sourceFile: ts.SourceFile;
    readonly statements: readonly ts.Statement[];
    readonly parent: ts.Block;
    readonly name: string;
    readonly exportName: string;
    readonly signature: string;
    readonly parameterTypes: readonly string[];
    readonly returnType: string;
    readonly captures: readonly WasmCapture[];
    readonly output?: WasmCapture;
}

export interface WasmModule {
    readonly functions: readonly WasmFunction[];
    readonly blocks: readonly WasmBlock[];
    readonly nodes: readonly ts.Node[];
}

export interface BuildResult {
    readonly emittedFiles: readonly string[];
    readonly wasmFunctions: readonly string[];
}
