import path from 'node:path';

import { buildProject } from 'wasm-script';

const PLUGIN_NAME = 'WasmScriptPlugin';

export class WasmScriptPlugin {
    constructor(configPath) {
        this.configPath = configPath;
        this.projectDirectory = path.dirname(configPath);
        this.watchBuildError = undefined;
    }

    apply(compiler) {
        const build = async () => {
            const result = await buildProject(this.configPath);
            compiler.getInfrastructureLogger(PLUGIN_NAME).info(
                `Built ${result.wasmFunctions.length} WASM function${result.wasmFunctions.length === 1 ? '' : 's'}`,
            );
            return result;
        };

        compiler.hooks.beforeRun.tapPromise(PLUGIN_NAME, build);
        compiler.hooks.watchRun.tapPromise(PLUGIN_NAME, async () => {
            try {
                const result = await build();
                this.watchBuildError = undefined;
                for (const filePath of result.emittedFiles) {
                    compiler.modifiedFiles?.add(path.resolve(filePath));
                }
            } catch (error) {
                this.watchBuildError = error instanceof Error ? error : new Error(String(error));
            }
        });
        compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
            compilation.contextDependencies.add(path.join(this.projectDirectory, 'private'));
            compilation.fileDependencies.add(this.configPath);
            if (this.watchBuildError) compilation.errors.push(this.watchBuildError);
        });
    }
}
