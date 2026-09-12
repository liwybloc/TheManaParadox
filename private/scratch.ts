import { createDecimal } from "./break_eternity.js";

export interface Scratch {
    currencyGain: i32;
    tierOneSeconds: i32;
    tierOneProduction: i32;
    tierOneExponent: i32;
    productionModifier: i32;
    bolsterRelativeIncrease: i32;
    tierOneDisplayMultiplier: i32;
}

export const SCRATCH_HANDLES: Scratch = {
    currencyGain: createDecimal(0, 0, 0),
    tierOneSeconds: createDecimal(0, 0, 0),
    tierOneProduction: createDecimal(0, 0, 0),
    tierOneExponent: createDecimal(0, 0, 0),
    productionModifier: createDecimal(0, 0, 0),
    bolsterRelativeIncrease: createDecimal(0, 0, 0),
    tierOneDisplayMultiplier: createDecimal(1, 0, 1),
};

/** [WASM] */

export const scratch: Scratch = {
    currencyGain: 0,
    tierOneSeconds: 0,
    tierOneProduction: 0,
    tierOneExponent: 0,
    productionModifier: 0,
    bolsterRelativeIncrease: 0,
    tierOneDisplayMultiplier: 0,
};

export function initializeScratch(
    currencyGain: i32,
    tierOneSeconds: i32,
    tierOneProduction: i32,
    tierOneExponent: i32,
    productionModifier: i32,
    bolsterRelativeIncrease: i32,
    tierOneDisplayMultiplier: i32,
): void {
    scratch.currencyGain = currencyGain;
    scratch.tierOneSeconds = tierOneSeconds;
    scratch.tierOneProduction = tierOneProduction;
    scratch.tierOneExponent = tierOneExponent;
    scratch.productionModifier = productionModifier;
    scratch.bolsterRelativeIncrease = bolsterRelativeIncrease;
    scratch.tierOneDisplayMultiplier = tierOneDisplayMultiplier;
}

/** [/WASM] */

initializeScratch(
    SCRATCH_HANDLES.currencyGain,
    SCRATCH_HANDLES.tierOneSeconds,
    SCRATCH_HANDLES.tierOneProduction,
    SCRATCH_HANDLES.tierOneExponent,
    SCRATCH_HANDLES.productionModifier,
    SCRATCH_HANDLES.bolsterRelativeIncrease,
    SCRATCH_HANDLES.tierOneDisplayMultiplier,
);
