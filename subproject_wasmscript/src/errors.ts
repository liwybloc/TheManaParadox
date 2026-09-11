export class WasmScriptError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = "WasmScriptError";
    }
}
