import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildProject } from "../build.js";

test("builds marked functions and redirects their call sites", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "wasmscript-test-"));
    const configPath = path.join(directory, "tsconfig.json");
    await fs.writeFile(
        configPath,
        JSON.stringify({
            compilerOptions: {
                target: "ES2022",
                module: "ESNext",
                moduleResolution: "Bundler",
                rootDir: ".",
                outDir: "dist",
                strict: true,
                lib: ["ES2022", "DOM"],
            },
            include: ["src/**/*.ts", "generated/**/*.ts"],
        }),
    );
    await fs.mkdir(path.join(directory, "src"));
    await fs.writeFile(
        path.join(directory, "src", "math.ts"),
        `/** [WASM] */
export function add(a: f64, b: f64): f64 {
  return a + b;
}

export function multiply(a: f64, b: f64): f64 {
  return a * b;
}

export class Arithmetic {
  static add(a: f64, b: f64): f64 {
    return a + b;
  }

  static squareSum(a: f64, b: f64): f64 {
    return this.add(a * a, b * b);
  }
}
/** [/WASM] */

export const result = add(2, 3) + multiply(4, 5) + Arithmetic.squareSum(2, 3);
`,
    );
    await fs.writeFile(
        path.join(directory, "src", "physics.ts"),
        `/** [WASM] */
export function add(a: f64, b: f64): f64 {
  return a - b;
}
/** [/WASM] */
`,
    );
    await fs.writeFile(
        path.join(directory, "src", "nested.ts"),
        `export class MixedMath {
  /** [WASM] */
  multiply(a: f64, b: f64): f64 {
    return a * b;
  }
  /** [/WASM] */
}

export function difficultSum(iterations: i32): f64 {
  let total: f64 = 0;
  /** [WASM] */
  for (let index: i32 = 0; index < iterations; index++) {
    total += index * index;
  }
  /** [/WASM] */
  return total;
}

export const methodResult = new MixedMath().multiply(6, 7);
export const loopResult = difficultSum(10);
`,
    );

    const result = await buildProject(configPath);
    assert.equal(result.wasmFunctions.length, 7);
    assert.ok(result.wasmFunctions.includes("multiply"));
    assert.ok(result.wasmFunctions.some((name) => name.startsWith("block@")));

    const output = await fs.readFile(path.join(directory, "dist", "src", "math.js"), "utf8");
    assert.match(output, /import \{ wasm as __wasm \}/);
    assert.match(output, /__wasm\.WASM\$[a-f0-9]{12}\(2, 3\)/);
    assert.match(output, /__wasm\.WASM\$[a-f0-9]{12}\(4, 5\)/);
    assert.match(output, /__wasm\.WASM\$[a-f0-9]{12}\(2, 3\)/);
    assert.doesNotMatch(output, /function add/);
    assert.doesNotMatch(output, /class Arithmetic/);

    const nestedOutput = await fs.readFile(path.join(directory, "dist", "src", "nested.js"), "utf8");
    assert.match(nestedOutput, /multiply = __wasm\.WASM\$[a-f0-9]{12}/);
    assert.match(nestedOutput, /total = __wasm\.WASM\$[a-f0-9]{12}\(iterations, total\)/);
    assert.doesNotMatch(nestedOutput, /for \(let index/);

    const runtime = await fs.readFile(path.join(directory, "generated", "_wasm$globals.ts"), "utf8");
    assert.doesNotMatch(runtime, /initWasm/);
    assert.match(runtime, /const result = await WebAssembly\.instantiate/);
    assert.match(runtime, /export const namedWasm/);
    assert.match(runtime, /export const memory = wasm\.memory/);
    assert.match(runtime, /export function createF64View/);
    assert.match(runtime, /export function createI32View/);
    assert.match(runtime, /multiply: wasm\.WASM\$[a-f0-9]{12}/);
    assert.doesNotMatch(runtime, /\n  add: wasm\./);

    const binary = await fs.readFile(path.join(directory, "generated", "package.wasm"));
    await fs.access(path.join(directory, "dist", "generated", "package.wasm"));
    const { instance } = await WebAssembly.instantiate(binary);
    assert.ok(instance.exports.memory instanceof WebAssembly.Memory);
    const exports = Object.entries(instance.exports)
        .filter(([name, value]) => name.startsWith("WASM$") && typeof value === "function")
        .map(([, value]) => (value as (a: number, b: number) => number)(5, 2))
        .sort((first, second) => first - second);
    assert.deepEqual(exports, [3, 7, 7, 10, 10, 29, 32]);
});

test("builds normally without generating WASM when no regions exist", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "wasmscript-empty-test-"));
    const configPath = path.join(directory, "tsconfig.json");
    await fs.writeFile(
        configPath,
        JSON.stringify({
            compilerOptions: {
                target: "ES2022",
                module: "ESNext",
                rootDir: ".",
                outDir: "dist",
                strict: true,
            },
            include: ["src/**/*.ts"],
        }),
    );
    await fs.mkdir(path.join(directory, "src"));
    await fs.writeFile(path.join(directory, "src", "index.ts"), "export const answer: number = 42;\n");

    const result = await buildProject(configPath);
    assert.deepEqual(result.wasmFunctions, []);
    assert.match(await fs.readFile(path.join(directory, "dist", "src", "index.js"), "utf8"), /answer = 42/);
    await assert.rejects(fs.access(path.join(directory, "generated")));
});

test("adapts booleans and 64-bit integers at the WebAssembly boundary", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "wasmscript-scalars-test-"));
    const configPath = path.join(directory, "tsconfig.json");
    await fs.writeFile(
        configPath,
        JSON.stringify({
            compilerOptions: {
                target: "ES2022",
                module: "ESNext",
                moduleResolution: "Bundler",
                rootDir: ".",
                outDir: "dist",
                strict: true,
                lib: ["ES2022", "DOM"],
            },
            include: ["src/**/*.ts", "generated/**/*.ts"],
        }),
    );
    await fs.mkdir(path.join(directory, "src"));
    await fs.writeFile(
        path.join(directory, "src", "scalars.ts"),
        `/** [WASM] */
export function negate(value: bool): bool {
  return !value;
}

export function increment(value: i64): i64 {
  return value + 1;
}

export function greeting(): string {
  return "hello";
}
/** [/WASM] */

export const booleanResult: boolean = negate(true);
export const integerResult: number = increment(41);
`,
    );

    await buildProject(configPath);

    const scalarTypes = await fs.readFile(path.join(directory, "generated", "_wasm$types.d.ts"), "utf8");
    assert.match(scalarTypes, /type bool = boolean/);
    assert.match(scalarTypes, /type i64 = number/);
    assert.match(scalarTypes, /type u64 = number/);

    const runtime = await fs.readFile(path.join(directory, "generated", "_wasm$globals.ts"), "utf8");
    assert.match(runtime, /value0 \? 1 : 0/);
    assert.match(runtime, /!== 0/);
    assert.match(runtime, /BigInt\(value0\)/);
    assert.match(runtime, /Number\(rawWasm\./);
    assert.match(runtime, /liftString\(rawWasm\./);
    assert.match(runtime, /new Uint16Array\(memory\.buffer/);
});

test("keeps marked object state entirely inside WebAssembly", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "wasmscript-state-test-"));
    const configPath = path.join(directory, "tsconfig.json");
    await fs.writeFile(
        configPath,
        JSON.stringify({
            compilerOptions: {
                target: "ES2022",
                module: "ESNext",
                moduleResolution: "Bundler",
                rootDir: ".",
                outDir: "dist",
                strict: true,
                lib: ["ES2022", "DOM"],
            },
            include: ["src/**/*.ts", "generated/**/*.ts"],
        }),
    );
    await fs.mkdir(path.join(directory, "src"));
    await fs.writeFile(
        path.join(directory, "src", "player.ts"),
        `interface Player {
  mana: number;
}

/** [WASM] */
export const player: Player = {
  mana: 0,
};

export function gainMana(amount: f64): void {
  player.mana += amount;
}

export function getMana(): f64 {
  return player.mana;
}
/** [/WASM] */

gainMana(12);
export const mana = getMana();
`,
    );

    await buildProject(configPath);

    const output = await fs.readFile(path.join(directory, "dist", "src", "player.js"), "utf8");
    assert.doesNotMatch(output, /player\s*=/);
    assert.match(output, /__wasm\.WASM\$[a-f0-9]{12}\(12\)/);

    const binary = await fs.readFile(path.join(directory, "generated", "package.wasm"));
    const { instance } = await WebAssembly.instantiate(binary, {
        env: {
            abort(): never {
                throw new Error("AssemblyScript aborted");
            },
        },
    });
    const functions = Object.values(instance.exports).filter(
        (value): value is CallableFunction => typeof value === "function",
    );
    const getter = functions.find((value) => value.length === 0);
    const setter = functions.find((value) => value.length === 1);
    assert.ok(getter);
    assert.ok(setter);
    setter(12);
    assert.equal(getter(), 12);
});
