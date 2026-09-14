import { createDecimal, createZero } from "./break_eternity.js";

export interface Scratch {
    currencyGain: i32;
    tierOneSeconds: i32;
    tierOneProduction: i32;
    tierOneExponent: i32;
    productionModifier: i32;
    purificationRelativeIncrease: i32;
    tierOneDisplayMultiplier: i32;
    condenseGain: i32;
    gameSpeed: i32;
    effectiveGameSpeed: i32;
    manaPerSecond: i32;
    oomPerSecond: i32;
    updatesPerSecond: i32;
    enemyMaximumHealth: i32;
}

export const SCRATCH_HANDLES: Scratch = {
    currencyGain: createZero(),
    tierOneSeconds: createZero(),
    tierOneProduction: createZero(),
    tierOneExponent: createZero(),
    productionModifier: createZero(),
    purificationRelativeIncrease: createZero(),
    tierOneDisplayMultiplier: createDecimal(1, 0, 1),
    condenseGain: createZero(),
    gameSpeed: createDecimal(1, 0, 1),
    effectiveGameSpeed: createDecimal(1, 0, 1),
    manaPerSecond: createZero(),
    oomPerSecond: createZero(),
    updatesPerSecond: createZero(),
    enemyMaximumHealth: createZero(),
};

/** [WASM] */

export const scratch: Scratch = {
    currencyGain: 0,
    tierOneSeconds: 0,
    tierOneProduction: 0,
    tierOneExponent: 0,
    productionModifier: 0,
    purificationRelativeIncrease: 0,
    tierOneDisplayMultiplier: 0,
    condenseGain: 0,
    gameSpeed: 0,
    effectiveGameSpeed: 0,
    manaPerSecond: 0,
    oomPerSecond: 0,
    updatesPerSecond: 0,
    enemyMaximumHealth: 0,
};

export function initializeScratch(
    currencyGain: i32,
    tierOneSeconds: i32,
    tierOneProduction: i32,
    tierOneExponent: i32,
    productionModifier: i32,
    purificationRelativeIncrease: i32,
    tierOneDisplayMultiplier: i32,
    condenseGain: i32,
    gameSpeed: i32,
    effectiveGameSpeed: i32,
    manaPerSecond: i32,
    oomPerSecond: i32,
    updateRate: i32,
    enemyMaximumHealth: i32,
): void {
    scratch.currencyGain = currencyGain;
    scratch.tierOneSeconds = tierOneSeconds;
    scratch.tierOneProduction = tierOneProduction;
    scratch.tierOneExponent = tierOneExponent;
    scratch.productionModifier = productionModifier;
    scratch.purificationRelativeIncrease = purificationRelativeIncrease;
    scratch.tierOneDisplayMultiplier = tierOneDisplayMultiplier;
    scratch.condenseGain = condenseGain;
    scratch.gameSpeed = gameSpeed;
    scratch.effectiveGameSpeed = effectiveGameSpeed;
    scratch.manaPerSecond = manaPerSecond;
    scratch.oomPerSecond = oomPerSecond;
    scratch.updatesPerSecond = updateRate;
    scratch.enemyMaximumHealth = enemyMaximumHealth;
}

/** [/WASM] */

initializeScratch(
    SCRATCH_HANDLES.currencyGain,
    SCRATCH_HANDLES.tierOneSeconds,
    SCRATCH_HANDLES.tierOneProduction,
    SCRATCH_HANDLES.tierOneExponent,
    SCRATCH_HANDLES.productionModifier,
    SCRATCH_HANDLES.purificationRelativeIncrease,
    SCRATCH_HANDLES.tierOneDisplayMultiplier,
    SCRATCH_HANDLES.condenseGain,
    SCRATCH_HANDLES.gameSpeed,
    SCRATCH_HANDLES.effectiveGameSpeed,
    SCRATCH_HANDLES.manaPerSecond,
    SCRATCH_HANDLES.oomPerSecond,
    SCRATCH_HANDLES.updatesPerSecond,
    SCRATCH_HANDLES.enemyMaximumHealth,
);
