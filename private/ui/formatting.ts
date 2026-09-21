import { namedWasm } from "../../generated/_wasm$globals.js";

export function formatDecimal(handle: number, decimals = 2, boundaryLabel = "Unknown"): string {
    if (namedWasm.isAtInfinityBoundary(handle)) return boundaryLabel;
    const value = namedWasm.readString(handle);

    if (value === "Infinity" || value === "-Infinity" || value === "NaN") return "Unknown";
    if (value.includes("e")) return formatScientificDecimal(value);

    const number = Number(value);
    if (Math.abs(number) >= 1e9) return number.toExponential(2).replace("+", "");

    return number
        .toFixed(decimals)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatDecimalCompact(handle: number): string {
    return formatDecimal(handle).replace(/(\.\d*?[1-9])0+(?=e|$)|\.0+(?=e|$)/, "$1");
}

export function formatCrystalGoal(handle: number | undefined): string {
    return handle === undefined ? "Placeholder" : `Reach ${formatDecimal(handle)} Mana`;
}

export function formatCompletionTime(seconds: number, decimals = 2): string {
    if (seconds < 60) return `${seconds.toFixed(decimals)}s`;
    const minutes = Math.floor(seconds / 60);
    const secondWidth = decimals > 0 ? decimals + 3 : 2;
    const remainingSeconds = (seconds % 60).toFixed(decimals).padStart(secondWidth, "0");
    return `${minutes}:${remainingSeconds}`;
}

function formatScientificDecimal(value: string): string {
    const match = value.match(/^(-?)(e*)(\d+(?:\.\d+)?)e(-?\d+)$/);
    if (!match) return value;
    const [, sign, layerPrefix] = match;
    let mantissa = Number(match[3]);
    let exponent = Number(match[4]);
    const decimals = 2;
    const roundingScale = 10 ** decimals;
    mantissa = Math.round(mantissa * roundingScale) / roundingScale;
    if (mantissa >= 10) {
        mantissa /= 10;
        exponent++;
    }
    return `${sign}${layerPrefix}${mantissa.toFixed(decimals)}e${exponent}`;
}
