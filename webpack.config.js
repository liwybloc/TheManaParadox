import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VueLoaderPlugin } from 'vue-loader';
import webpack from 'webpack';

import { WasmScriptPlugin } from './wasm-script-webpack-plugin.js';

const projectDir = path.dirname(fileURLToPath(import.meta.url));
const { DefinePlugin } = webpack;

export default {
    cache: false,
    entry: path.resolve(projectDir, '.wasmscript/private/index.js'),
    mode: 'development',
    output: {
        clean: true,
        filename: 'bundle.js',
        path: path.resolve(projectDir, 'public/js'),
        publicPath: './',
    },
    module: {
        rules: [{ test: /\.vue$/, loader: 'vue-loader' }],
    },
    resolve: {
        alias: {
            '@game': path.resolve(projectDir, '.wasmscript/private'),
            '@generated': path.resolve(projectDir, '.wasmscript/generated'),
            '@ui': path.resolve(projectDir, 'private/ui'),
        },
        extensions: ['.js', '.vue'],
    },
    plugins: [
        new DefinePlugin({
            __VUE_OPTIONS_API__: false,
            __VUE_PROD_DEVTOOLS__: false,
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
        }),
        new VueLoaderPlugin(),
        new WasmScriptPlugin(path.resolve(projectDir, 'tsconfig.json')),
    ],
    watchOptions: {
        aggregateTimeout: 300,
        ignored: /(?:node_modules|\.wasmscript|generated)/,
    },
};
