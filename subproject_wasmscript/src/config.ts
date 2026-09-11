import path from "node:path";
import type { ResolvedOptions, WasmScriptOptions } from "./types.js";

const DEFAULT_GENERATED_DIRECTORY = "generated";
const DEFAULT_MODULE_NAME = "_wasm$globals";
const DEFAULT_WASM_FILE_NAME = "package.wasm";

export function resolveOptions(projectDirectory: string, options: WasmScriptOptions = {}): ResolvedOptions {
    return {
        generatedDirectory: path.resolve(projectDirectory, options.generatedDirectory ?? DEFAULT_GENERATED_DIRECTORY),
        moduleName: options.moduleName ?? DEFAULT_MODULE_NAME,
        wasmFileName: options.wasmFileName ?? DEFAULT_WASM_FILE_NAME,
    };
}
