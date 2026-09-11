#!/usr/bin/env node
import { buildProject } from "./build.js";

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const projectFlag = args.findIndex((argument) => argument === "-p" || argument === "--project");
    const configPath = projectFlag >= 0 ? args[projectFlag + 1] : "tsconfig.json";
    if (!configPath) throw new Error("Expected a path after --project.");

    const result = await buildProject(configPath);
    process.stdout.write(
        `Built ${result.wasmFunctions.length} WASM function${result.wasmFunctions.length === 1 ? "" : "s"}: ${result.wasmFunctions.join(", ")}\n`,
    );
}

main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
});
