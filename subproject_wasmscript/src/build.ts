import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { compileAssembly } from "./assembly.js";
import { resolveOptions } from "./config.js";
import { discoverWasmModule } from "./discovery.js";
import { WasmScriptError } from "./errors.js";
import { generateRuntime, generateScalarTypes } from "./runtime.js";
import { createWasmTransformer } from "./transformer.js";
import type { BuildResult, WasmScriptOptions } from "./types.js";

interface RawConfig {
    readonly wasmscript?: WasmScriptOptions;
}

export async function buildProject(configPath = "tsconfig.json"): Promise<BuildResult> {
    const absoluteConfigPath = path.resolve(configPath);
    const projectDirectory = path.dirname(absoluteConfigPath);
    const configFile = ts.readConfigFile(absoluteConfigPath, ts.sys.readFile);
    if (configFile.error) throw new WasmScriptError(formatDiagnostics([configFile.error]));

    const rawConfig = configFile.config as RawConfig;
    const parsed = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        projectDirectory,
        undefined,
        absoluteConfigPath,
    );
    if (parsed.errors.length > 0) throw new WasmScriptError(formatDiagnostics(parsed.errors));

    const options = resolveOptions(projectDirectory, rawConfig.wasmscript);
    assertGeneratedDirectoryIsEmittable(parsed.options, projectDirectory, options.generatedDirectory);

    const scanProgram = ts.createProgram(parsed.fileNames, parsed.options);
    const wasmModule = discoverWasmModule(scanProgram, projectDirectory);
    const functions = wasmModule.functions;
    if (wasmModule.nodes.length === 0) {
        return emitWithoutWasm(scanProgram);
    }

    const wasmPath = await compileAssembly(scanProgram, wasmModule, options);
    const emittedWasmPath = await copyWasmToOutput(
        wasmPath,
        parsed.options,
        projectDirectory,
        options.generatedDirectory,
    );
    const runtimePath = await generateRuntime([...functions, ...wasmModule.blocks], options);
    const scalarTypesPath = await generateScalarTypes(options);
    const roots = [...new Set([...parsed.fileNames, runtimePath, scalarTypesPath])];
    const program = ts.createProgram(roots, parsed.options);
    const finalModule = discoverWasmModule(program, projectDirectory);
    const finalFunctions = finalModule.functions;
    const diagnostics = ts.getPreEmitDiagnostics(program).filter((diagnostic) => {
        return diagnostic.file?.fileName !== runtimePath || diagnostic.code !== 2304;
    });
    if (diagnostics.length > 0) throw new WasmScriptError(formatDiagnostics(diagnostics));

    const emittedFiles: string[] = [wasmPath, runtimePath, scalarTypesPath];
    if (emittedWasmPath !== wasmPath) emittedFiles.push(emittedWasmPath);
    const result = program.emit(
        undefined,
        (fileName, data, writeByteOrderMark) => {
            fs.mkdirSync(path.dirname(fileName), { recursive: true });
            fs.writeFileSync(fileName, writeByteOrderMark ? `\uFEFF${data}` : data, "utf8");
            emittedFiles.push(fileName);
        },
        undefined,
        false,
        { before: [createWasmTransformer(program, finalModule, runtimePath)] },
    );
    if (result.emitSkipped) throw new WasmScriptError(formatDiagnostics(result.diagnostics));

    return {
        emittedFiles,
        wasmFunctions: [...finalFunctions.map(({ name }) => name), ...finalModule.blocks.map(({ name }) => name)],
    };
}

function emitWithoutWasm(program: ts.Program): BuildResult {
    const diagnostics = ts.getPreEmitDiagnostics(program);
    if (diagnostics.length > 0) throw new WasmScriptError(formatDiagnostics(diagnostics));

    const emittedFiles: string[] = [];
    const result = program.emit(undefined, (fileName, data, writeByteOrderMark) => {
        fs.mkdirSync(path.dirname(fileName), { recursive: true });
        fs.writeFileSync(fileName, writeByteOrderMark ? `\uFEFF${data}` : data, "utf8");
        emittedFiles.push(fileName);
    });
    if (result.emitSkipped && !program.getCompilerOptions().noEmit) {
        throw new WasmScriptError(formatDiagnostics(result.diagnostics));
    }

    return { emittedFiles, wasmFunctions: [] };
}

async function copyWasmToOutput(
    wasmPath: string,
    compilerOptions: ts.CompilerOptions,
    projectDirectory: string,
    generatedDirectory: string,
): Promise<string> {
    if (!compilerOptions.outDir) return wasmPath;

    const rootDirectory = path.resolve(projectDirectory, compilerOptions.rootDir ?? ".");
    const outputDirectory = path.resolve(projectDirectory, compilerOptions.outDir);
    const emittedDirectory = path.join(outputDirectory, path.relative(rootDirectory, generatedDirectory));
    const emittedWasmPath = path.join(emittedDirectory, path.basename(wasmPath));
    await fs.promises.mkdir(emittedDirectory, { recursive: true });
    await fs.promises.copyFile(wasmPath, emittedWasmPath);
    return emittedWasmPath;
}

function assertGeneratedDirectoryIsEmittable(
    compilerOptions: ts.CompilerOptions,
    projectDirectory: string,
    generatedDirectory: string,
): void {
    const rootDirectory = path.resolve(projectDirectory, compilerOptions.rootDir ?? ".");
    const relative = path.relative(rootDirectory, generatedDirectory);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new WasmScriptError(`generatedDirectory must be inside compilerOptions.rootDir (${rootDirectory}).`);
    }
}

function formatDiagnostics(diagnostics: readonly ts.Diagnostic[]): string {
    return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => ts.sys.newLine,
    });
}
