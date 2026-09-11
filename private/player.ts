import {
    addUS,
    addInto,
    createDecimal,
    divInto,
    floorInto,
    gte,
    gt,
    log10Into,
    lte,
    multiplyInto,
    mulUS,
    powInto,
    powUS,
    subUS,
    subInto,
    writeNumber,
} from "./break_eternity.js";

interface PlayerHandles {
    mana: i32;

    count_manaConduit: i32;
    count_conduitConjugation: i32;
    count_conjugationCreation: i32;
    count_creationManufactory: i32;
    count_manufactureStaff: i32;
}

interface Player extends PlayerHandles {}

interface PlayerHandles {
    bought_manaConduit: i32;
    bought_conduitConjugation: i32;
    bought_conjugationCreation: i32;
    bought_creationManufactory: i32;
    bought_manufactureStaff: i32;

    cost_manaConduit: i32;
    cost_conduitConjugation: i32;
    cost_conjugationCreation: i32;
    cost_creationManufactory: i32;
    cost_manufactureStaff: i32;

    multiplier_manaConduit: i32;
    multiplier_conduitConjugation: i32;
    multiplier_conjugationCreation: i32;
    multiplier_creationManufactory: i32;
    multiplier_manufactureStaff: i32;

    scratch_tierOneSeconds: i32;
    scratch_tierOneProduction: i32;
    scratch_tierOneExponent: i32;
    scratch_productionModifier: i32;

    castSpeedTimer: i32;
    castSpeedMagnitude: i32;
    castSpeedCost: i32;

    masteryOwned: i32;
    masteryLevel: i32;
    masteryCost: i32;
    masterySpeedEffect: i32;
}

export const HANDLES: PlayerHandles = {
    mana: createDecimal(1, 0, 10),

    // tier 1
    count_manaConduit: createDecimal(0, 0, 0),
    count_conduitConjugation: createDecimal(0, 0, 0),
    count_conjugationCreation: createDecimal(0, 0, 0),
    count_creationManufactory: createDecimal(0, 0, 0),
    count_manufactureStaff: createDecimal(0, 0, 0),

    bought_manaConduit: createDecimal(0, 0, 0),
    bought_conduitConjugation: createDecimal(0, 0, 0),
    bought_conjugationCreation: createDecimal(0, 0, 0),
    bought_creationManufactory: createDecimal(0, 0, 0),
    bought_manufactureStaff: createDecimal(0, 0, 0),

    cost_manaConduit: createDecimal(0, 0, 0),
    cost_conduitConjugation: createDecimal(0, 0, 0),
    cost_conjugationCreation: createDecimal(0, 0, 0),
    cost_creationManufactory: createDecimal(0, 0, 0),
    cost_manufactureStaff: createDecimal(0, 0, 0),

    multiplier_manaConduit: createDecimal(0, 0, 0),
    multiplier_conduitConjugation: createDecimal(0, 0, 0),
    multiplier_conjugationCreation: createDecimal(0, 0, 0),
    multiplier_creationManufactory: createDecimal(0, 0, 0),
    multiplier_manufactureStaff: createDecimal(0, 0, 0),

    scratch_tierOneSeconds: createDecimal(0, 0, 0),
    scratch_tierOneProduction: createDecimal(0, 0, 0),
    scratch_tierOneExponent: createDecimal(0, 0, 0),
    scratch_productionModifier: createDecimal(0, 0, 0),

    castSpeedTimer: createDecimal(0, 0, 0),
    castSpeedMagnitude: createDecimal(1, 0, 1),
    castSpeedCost: createDecimal(1, 0, 1000),

    masteryOwned: createDecimal(0, 0, 0),
    masteryLevel: createDecimal(1, 0, 1),
    masteryCost: createDecimal(1, 0, 1),
    masterySpeedEffect: createDecimal(1, 0, 1),
};

/** [WASM] */

export const player: Player = {
    mana: 0,
    
    count_manaConduit: 0,
    count_conduitConjugation: 0,
    count_conjugationCreation: 0,
    count_creationManufactory: 0,
    count_manufactureStaff: 0,

    bought_manaConduit: 0,
    bought_conduitConjugation: 0,
    bought_conjugationCreation: 0,
    bought_creationManufactory: 0,
    bought_manufactureStaff: 0,

    cost_manaConduit: 0,
    cost_conduitConjugation: 0,
    cost_conjugationCreation: 0,
    cost_creationManufactory: 0,
    cost_manufactureStaff: 0,

    multiplier_manaConduit: 0,
    multiplier_conduitConjugation: 0,
    multiplier_conjugationCreation: 0,
    multiplier_creationManufactory: 0,
    multiplier_manufactureStaff: 0,

    scratch_tierOneSeconds: 0,
    scratch_tierOneProduction: 0,
    scratch_tierOneExponent: 0,
    scratch_productionModifier: 0,

    castSpeedTimer: 0,
    castSpeedMagnitude: 0,
    castSpeedCost: 0,

    masteryOwned: 0,
    masteryLevel: 0,
    masteryCost: 0,
    masterySpeedEffect: 0,
};

const TIER_ONE_COUNT: i32 = 5;

export function addMana(handle: i32): void {
    addUS(player.mana, handle);
}

export function initializeHandles(manaHandle: i32, count_manaConduit: i32, count_conduitConjugation: i32,
                                  count_conjugationCreation: i32, count_creationManufactory: i32, count_manufactureStaff: i32,
                                  bought_manaConduit: i32, bought_conduitConjugation: i32, bought_conjugationCreation: i32,
                                  bought_creationManufactory: i32, bought_manufactureStaff: i32,
                                  cost_manaConduit: i32, cost_conduitConjugation: i32, cost_conjugationCreation: i32,
                                  cost_creationManufactory: i32, cost_manufactureStaff: i32,
                                  multiplier_manaConduit: i32, multiplier_conduitConjugation: i32,
                                  multiplier_conjugationCreation: i32, multiplier_creationManufactory: i32,
                                  multiplier_manufactureStaff: i32, scratch_tierOneSeconds: i32,
                                  scratch_tierOneProduction: i32, scratch_tierOneExponent: i32,
                                  scratch_productionModifier: i32): void {
    player.mana = manaHandle;

    player.count_manaConduit = count_manaConduit;
    player.count_conduitConjugation = count_conduitConjugation;
    player.count_conjugationCreation = count_conjugationCreation;
    player.count_creationManufactory = count_creationManufactory;
    player.count_manufactureStaff = count_manufactureStaff;
    player.bought_manaConduit = bought_manaConduit;
    player.bought_conduitConjugation = bought_conduitConjugation;
    player.bought_conjugationCreation = bought_conjugationCreation;
    player.bought_creationManufactory = bought_creationManufactory;
    player.bought_manufactureStaff = bought_manufactureStaff;
    player.cost_manaConduit = cost_manaConduit;
    player.cost_conduitConjugation = cost_conduitConjugation;
    player.cost_conjugationCreation = cost_conjugationCreation;
    player.cost_creationManufactory = cost_creationManufactory;
    player.cost_manufactureStaff = cost_manufactureStaff;
    player.multiplier_manaConduit = multiplier_manaConduit;
    player.multiplier_conduitConjugation = multiplier_conduitConjugation;
    player.multiplier_conjugationCreation = multiplier_conjugationCreation;
    player.multiplier_creationManufactory = multiplier_creationManufactory;
    player.multiplier_manufactureStaff = multiplier_manufactureStaff;
    player.scratch_tierOneSeconds = scratch_tierOneSeconds;
    player.scratch_tierOneProduction = scratch_tierOneProduction;
    player.scratch_tierOneExponent = scratch_tierOneExponent;
    player.scratch_productionModifier = scratch_productionModifier;

    refreshTierOneDerivedState();
}

export function refreshTierOneDerivedState(): void {
    for (let index: i32 = 0; index < TIER_ONE_COUNT; index++) {
        refreshTierOneCost(index);
        refreshTierOneMultiplier(index);
    }
}

export function initializeCastSpeed(timer: i32, magnitude: i32, cost: i32): void {
    player.castSpeedTimer = timer;
    player.castSpeedMagnitude = magnitude;
    player.castSpeedCost = cost;
}

export function initializeMastery(owned: i32, level: i32, cost: i32, speedEffect: i32): void {
    player.masteryOwned = owned;
    player.masteryLevel = level;
    player.masteryCost = cost;
    player.masterySpeedEffect = speedEffect;
    refreshMasteryDerivedState();
}

export function castSpeed(): bool {
    if (!canCastSpeed()) return false;
    subUS(player.mana, player.castSpeedCost);
    if (!gt(player.castSpeedTimer, 0)) {
        multiplyInto(player.castSpeedMagnitude, player.masterySpeedEffect, 2);
    } else {
        mulUS(player.castSpeedMagnitude, 2);
    }
    addUS(player.castSpeedTimer, 15);
    powUS(player.castSpeedCost, 2);
    return true;
}

export function canCastSpeed(): bool {
    return gte(player.mana, player.castSpeedCost);
}

export function increaseMastery(): bool {
    if (!canIncreaseMastery()) return false;
    const speedIsActive = gt(player.castSpeedTimer, 0);
    addUS(player.masteryOwned, 1);
    refreshMasteryDerivedState();
    if (speedIsActive) mulUS(player.castSpeedMagnitude, 2);
    resetTierOne();
    return true;
}

export function canIncreaseMastery(): bool {
    return gte(player.count_manufactureStaff, player.masteryCost);
}

export function isMasteryVisible(): bool {
    return gt(player.masteryOwned, 0) || gt(player.bought_manufactureStaff, 0);
}

export function refreshMasteryDerivedState(): void {
    addInto(player.masteryLevel, player.masteryOwned, 1);
    powInto(player.masteryCost, 3, player.masteryOwned);
    powInto(player.masterySpeedEffect, 2, player.masteryOwned);
}

function resetTierOne(): void {
    writeNumber(player.mana, 10);
    for (let index: i32 = 0; index < TIER_ONE_COUNT; index++) {
        writeNumber(tierOneAmountHandle(index), 0);
        writeNumber(tierOneBoughtHandle(index), 0);
    }
    refreshTierOneDerivedState();
}

export function buyTierOne(index: i32): bool {
    if (index < 0 || index >= TIER_ONE_COUNT) return false;
    if (!isTierOneVisible(index)) return false;
    const cost = tierOneCostHandle(index);
    if (!gte(player.mana, cost)) return false;
    subUS(player.mana, cost);
    addUS(tierOneAmountHandle(index), 1);
    addUS(tierOneBoughtHandle(index), 1);
    refreshTierOneCost(index);
    refreshTierOneMultiplier(index);
    return true;
}

export function buyAllTierOne(): void {
    for (let index: i32 = TIER_ONE_COUNT - 1; index >= 0; index--) {
        buyTierOne(index);
    }
}

export function buyMaxTierOne(index: i32): bool {
    if (index < 0 || index >= TIER_ONE_COUNT) return false;
    if (!isTierOneVisible(index)) return false;
    const cost = tierOneCostHandle(index);
    if (!gte(player.mana, cost)) return false;

    const scalingExponent = index + 1;
    powInto(player.scratch_tierOneSeconds, 10, scalingExponent);
    subInto(player.scratch_productionModifier, player.scratch_tierOneSeconds, 1);
    multiplyInto(player.scratch_tierOneProduction, player.mana, player.scratch_productionModifier);
    divInto(player.scratch_tierOneProduction, player.scratch_tierOneProduction, cost);
    addUS(player.scratch_tierOneProduction, 1);
    log10Into(player.scratch_tierOneProduction, player.scratch_tierOneProduction);
    divInto(player.scratch_tierOneProduction, player.scratch_tierOneProduction, scalingExponent);
    floorInto(player.scratch_tierOneExponent, player.scratch_tierOneProduction);

    calculateTierOneBulkCost(cost);
    while (!lte(player.scratch_tierOneProduction, player.mana)) {
        subUS(player.scratch_tierOneExponent, 1);
        calculateTierOneBulkCost(cost);
    }
    subUS(player.mana, player.scratch_tierOneProduction);
    addUS(tierOneAmountHandle(index), player.scratch_tierOneExponent);
    addUS(tierOneBoughtHandle(index), player.scratch_tierOneExponent);
    refreshTierOneCost(index);
    refreshTierOneMultiplier(index);
    return true;
}

export function buyMaxAllTierOne(): void {
    for (let index = TIER_ONE_COUNT - 1; index >= 0; index--) {
        buyMaxTierOne(index);
    }
}

function calculateTierOneBulkCost(cost: i32): void {
    powInto(player.scratch_tierOneProduction, player.scratch_tierOneSeconds, player.scratch_tierOneExponent);
    subUS(player.scratch_tierOneProduction, 1);
    multiplyInto(player.scratch_tierOneProduction, player.scratch_tierOneProduction, cost);
    divInto(player.scratch_tierOneProduction, player.scratch_tierOneProduction, player.scratch_productionModifier);
}

export function canBuyTierOne(index: i32): bool {
    return isTierOneVisible(index) && gte(player.mana, tierOneCostHandle(index));
}

export function isTierOneVisible(index: i32): bool {
    return index === 0 || (index > 0 && index < TIER_ONE_COUNT && gt(tierOneBoughtHandle(index - 1), 0));
}

export function tierOneCostHandle(index: i32): i32 {
    switch (index) {
        case 0:  return player.cost_manaConduit;
        case 1:  return player.cost_conduitConjugation;
        case 2:  return player.cost_conjugationCreation;
        case 3:  return player.cost_creationManufactory;
        case 4:  return player.cost_manufactureStaff;
        default: return 0;
    }
}

export function tierOneMultiplierHandle(index: i32): i32 {
    switch (index) {
        case 0:  return player.multiplier_manaConduit;
        case 1:  return player.multiplier_conduitConjugation;
        case 2:  return player.multiplier_conjugationCreation;
        case 3:  return player.multiplier_creationManufactory;
        case 4:  return player.multiplier_manufactureStaff;
        default: return 0;
    }
}

function refreshTierOneCost(index: i32): void {
    const baseExponent = 1 << index;
    const scalingExponent = index + 1;
    multiplyInto(player.scratch_tierOneExponent, tierOneBoughtHandle(index), scalingExponent);
    addUS(player.scratch_tierOneExponent, baseExponent);
    powInto(tierOneCostHandle(index), 10, player.scratch_tierOneExponent);
}

function refreshTierOneMultiplier(index: i32): void {
    powInto(tierOneMultiplierHandle(index), 2, tierOneBoughtHandle(index));
}

export function tierOneBoughtHandle(index: i32): i32 {
    switch (index) {
        case 0 : return player.bought_manaConduit;
        case 1:  return player.bought_conduitConjugation;
        case 2:  return player.bought_conjugationCreation;
        case 3:  return player.bought_creationManufactory;
        case 4:  return player.bought_manufactureStaff;
        default: return 0;
    }
}

function tierOneAmountHandle(index: i32): i32 {
    switch (index) {
        case 0:  return player.count_manaConduit;
        case 1:  return player.count_conduitConjugation;
        case 2:  return player.count_conjugationCreation;
        case 3:  return player.count_creationManufactory;
        case 4:  return player.count_manufactureStaff;
        default: return 0;
    }
}

/** [/WASM] */

initializeHandles(
    HANDLES.mana,
    HANDLES.count_manaConduit,
    HANDLES.count_conduitConjugation,
    HANDLES.count_conjugationCreation,
    HANDLES.count_creationManufactory,
    HANDLES.count_manufactureStaff,
    HANDLES.bought_manaConduit,
    HANDLES.bought_conduitConjugation,
    HANDLES.bought_conjugationCreation,
    HANDLES.bought_creationManufactory,
    HANDLES.bought_manufactureStaff,
    HANDLES.cost_manaConduit,
    HANDLES.cost_conduitConjugation,
    HANDLES.cost_conjugationCreation,
    HANDLES.cost_creationManufactory,
    HANDLES.cost_manufactureStaff,
    HANDLES.multiplier_manaConduit,
    HANDLES.multiplier_conduitConjugation,
    HANDLES.multiplier_conjugationCreation,
    HANDLES.multiplier_creationManufactory,
    HANDLES.multiplier_manufactureStaff,
    HANDLES.scratch_tierOneSeconds,
    HANDLES.scratch_tierOneProduction,
    HANDLES.scratch_tierOneExponent,
    HANDLES.scratch_productionModifier,
);
initializeCastSpeed(HANDLES.castSpeedTimer, HANDLES.castSpeedMagnitude, HANDLES.castSpeedCost);
initializeMastery(HANDLES.masteryOwned, HANDLES.masteryLevel, HANDLES.masteryCost, HANDLES.masterySpeedEffect);
