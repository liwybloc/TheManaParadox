import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import webpack from 'webpack';

import webpackConfig from './webpack.config.js';

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.join(projectDirectory, 'public');
const port = Number.parseInt(process.env.PORT ?? '8092', 10);

const contentTypes = new Map([
    ['.css', 'text/css; charset=utf-8'],
    ['.html', 'text/html; charset=utf-8'],
    ['.ico', 'image/x-icon'],
    ['.js', 'text/javascript; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.png', 'image/png'],
    ['.svg', 'image/svg+xml'],
    ['.wasm', 'application/wasm'],
]);
let buildVersion = 0;

const compiler = webpack(webpackConfig);

const watcher = compiler.watch(webpackConfig.watchOptions ?? {}, (error, stats) => {
    if (error) {
        console.error('Webpack fatal error:', error);
        return;
    }

    if (!stats) {
        return;
    }

    console.log(stats.toString({
        chunks: false,
        colors: true,
        modules: false,
    }));

    if (!stats.hasErrors()) {
        buildVersion++;
        console.log('Webpack rebuild complete');
    }
});

const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

    if (requestUrl.pathname === '/__build-version') {
        response.writeHead(200, {
            'Cache-Control': 'no-store',
            'Content-Type': 'text/plain; charset=utf-8',
        });
        response.end(String(buildVersion));
        return;
    }

    const relativePath = requestUrl.pathname === '/' ? 'index.html' : decodeURIComponent(requestUrl.pathname.slice(1));
    const filePath = path.resolve(publicDirectory, relativePath);

    if (filePath !== publicDirectory && !filePath.startsWith(`${publicDirectory}${path.sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
    }

    fs.stat(filePath, (error, stats) => {
        if (error || !stats.isFile()) {
            response.writeHead(404).end('Not found');
            return;
        }

        response.writeHead(200, {
            'Cache-Control': 'no-store',
            'Content-Type': contentTypes.get(path.extname(filePath)) ?? 'application/octet-stream',
        });
        fs.createReadStream(filePath).pipe(response);
    });
});

server.listen(port, '127.0.0.1', () => {
    console.log(`The Mana Paradox is available at http://localhost:${port}`);
});

const closeWatcher = () => {
    server.close((serverError) => {
        watcher.close((watcherError) => {
            const error = serverError ?? watcherError;
            if (error) {
                console.error('Unable to stop cleanly:', error);
                process.exitCode = 1;
            }
        });
    });
};

process.once('SIGINT', closeWatcher);
process.once('SIGTERM', closeWatcher);
