import {
    addUS,
    copyInto,
    divInto,
    floorInto,
    gt,
    gte,
    log10Into,
    lte,
    multiplyInto,
    mulUS,
    passesLayerBoundary,
    pow10Into,
    powInto,
    subInto,
    subUS,
    toNumber,
    writeDecimal,
    writeNumber,
} from "./break_eternity.js";
import { hasTierOneAchievement, unlockTierOneAchievement } from "./achievements.js";
import type { Player } from "./player.js";
import type { Scratch } from "./scratch.js";

declare const player: Player;
declare const scratch: Scratch;

/** [WASM] */

export const TIER_ONE_COUNT: i32 = 5;

// Effect = baseMultiplier * growthBase ^ ((log10(conduits) - startExponent) / exponentInterval)
// Next requirement = requirementMargin * 10 ^ (startExponent + exponentInterval * log_growthBase(currentEffect / baseMultiplier))
const BOLSTER_BASE_MULTIPLIER: i32 = 16;
const BOLSTER_GROWTH_BASE: f64 = 3.25;
const BOLSTER_START_EXPONENT: i32 = 45;
const BOLSTER_EXPONENT_INTERVAL: i32 = 10;
const BOLSTER_REQUIREMENT_MARGIN: f64 = 1.01;
const BOLSTER_MINIMUM_EFFECT: f64 = 1;

export function refreshTierOneDerivedState(): void {
    for (let index: i32 = 0; index < TIER_ONE_COUNT; index++) {
        refreshTierOneCost(index);
        refreshTierOneMultiplier(index);
        refreshEmpowermentCost(index);
    }
    refreshBolsterRequirement();
    refreshBolsterEffect();
}

export function refreshBolsterRequirement(): void {
    if (!gte(player.bolsterMultiplier, BOLSTER_BASE_MULTIPLIER)) {
        writeDecimal(player.bolsterRequirement, 1, 1, BOLSTER_START_EXPONENT);
        return;
    }
    divInto(scratch.tierOneExponent, player.bolsterMultiplier, BOLSTER_BASE_MULTIPLIER);
    log10Into(scratch.tierOneExponent, scratch.tierOneExponent);
    writeNumber(scratch.productionModifier, BOLSTER_GROWTH_BASE);
    log10Into(scratch.productionModifier, scratch.productionModifier);
    divInto(scratch.tierOneExponent, scratch.tierOneExponent, scratch.productionModifier);
    mulUS(scratch.tierOneExponent, BOLSTER_EXPONENT_INTERVAL);
    addUS(scratch.tierOneExponent, BOLSTER_START_EXPONENT);
    powInto(player.bolsterRequirement, 10, scratch.tierOneExponent);
    writeNumber(scratch.tierOneExponent, BOLSTER_REQUIREMENT_MARGIN);
    mulUS(player.bolsterRequirement, scratch.tierOneExponent);
}

export function refreshBolsterEffect(): void {
    if (!gt(player.count_manaConduit, 0)) {
        writeNumber(player.bolsterEffect, 1);
        return;
    }
    log10Into(scratch.tierOneExponent, player.count_manaConduit);
    subUS(scratch.tierOneExponent, BOLSTER_START_EXPONENT);
    divInto(scratch.tierOneExponent, scratch.tierOneExponent, BOLSTER_EXPONENT_INTERVAL);
    writeNumber(scratch.productionModifier, BOLSTER_GROWTH_BASE);
    powInto(player.bolsterEffect, scratch.productionModifier, scratch.tierOneExponent);
    mulUS(player.bolsterEffect, BOLSTER_BASE_MULTIPLIER);
    if (hasTierOneAchievement(17)) mulUS(player.bolsterEffect, 5);
    if (toNumber(player.bolsterEffect) < BOLSTER_MINIMUM_EFFECT) {
        writeNumber(player.bolsterEffect, BOLSTER_MINIMUM_EFFECT);
    }
    divInto(scratch.bolsterRelativeIncrease, player.bolsterEffect, player.bolsterMultiplier);
}

export function canBolster(): bool {
    if(!hasTierOneAchievement(7)) return false;
    refreshBolsterRequirement();
    refreshBolsterEffect();
    return gte(player.count_manaConduit, player.bolsterRequirement) && gt(player.bolsterEffect, player.bolsterMultiplier);
}

export function bolster(): bool {
    if (!canBolster()) return false;
    copyInto(player.bolsterMultiplier, player.bolsterEffect);
    for (let index: i32 = 0; index < TIER_ONE_COUNT - 1; index++) {
        writeNumber(tierOneAmountHandle(index), 0);
    }
    refreshBolsterEffect();
    refreshBolsterRequirement();
    for (let index: i32 = 0; index < TIER_ONE_COUNT; index++) {
        refreshTierOneMultiplier(index);
    }
    return true;
}

export function canEmpowerTierOne(index: i32): bool {
    return index >= 0 && index < TIER_ONE_COUNT - 1
        && gte(tierOneAmountHandle(index), tierOneEmpowermentCostHandle(index));
}

export function empowerTierOne(index: i32): bool {
    if (!canEmpowerTierOne(index)) return false;
    writeNumber(tierOneAmountHandle(index), 0);
    addUS(tierOneEmpowermentHandle(index), 1);
    if (gte(tierOneEmpowermentHandle(index), 2)) unlockTierOneAchievement(19);
    refreshEmpowermentCost(index);
    refreshTierOneMultiplier(index);
    return true;
}

export function tierOneEmpowermentCostHandle(index: i32): i32 {
    switch (index) {
        case 0: return player.cost_empowerment_manaConduit;
        case 1: return player.cost_empowerment_conduitConjugation;
        case 2: return player.cost_empowerment_conjugationCreation;
        case 3: return player.cost_empowerment_creationManufactory;
        case 4: return player.cost_empowerment_manufactureStaff;
        default: return 0;
    }
}

export function tierOneEmpowermentHandle(index: i32): i32 {
    switch (index) {
        case 0: return player.empowerment_manaConduit;
        case 1: return player.empowerment_conduitConjugation;
        case 2: return player.empowerment_conjugationCreation;
        case 3: return player.empowerment_creationManufactory;
        case 4: return player.legacy_000;
        default: return 0;
    }
}

function refreshEmpowermentCost(index: i32): void {
    powInto(scratch.tierOneExponent, 2, tierOneEmpowermentHandle(index));
    mulUS(scratch.tierOneExponent, tierOneEmpowermentBaseExponent(index));
    powInto(tierOneEmpowermentCostHandle(index), 10, scratch.tierOneExponent);
}

function tierOneEmpowermentBaseExponent(index: i32): i32 {
    switch (index) {
        case 0: return 50;
        case 1: return 35;
        case 2: return 20;
        case 3: return 10;
        default: return 0;
    }
}

export function resetTierOneAmounts(): void {
    for (let index: i32 = 0; index < TIER_ONE_COUNT; index++) {
        writeNumber(tierOneAmountHandle(index), 0);
        writeNumber(tierOneBoughtHandle(index), 0);
    }
    refreshTierOneDerivedState();
}

export function resetBolster(): void {
    writeNumber(player.bolsterMultiplier, 1);
    refreshBolsterRequirement();
    refreshBolsterEffect();
    for (let index: i32 = 0; index < TIER_ONE_COUNT; index++) {
        refreshTierOneMultiplier(index);
    }
}

export function buyTierOne(index: i32): bool {
    if (index < 0 || index >= TIER_ONE_COUNT || !isTierOneVisible(index)) return false;
    const cost = tierOneCostHandle(index);
    if (!gte(player.mana, cost)) return false;
    subUS(player.mana, cost);
    addUS(tierOneAmountHandle(index), 1);
    addUS(tierOneBoughtHandle(index), 1);
    unlockTierOneAchievement(index);
    refreshTierOneCost(index);
    refreshTierOneMultiplier(index);
    return true;
}

export function buyAllTierOne(): void {
    for (let index: i32 = TIER_ONE_COUNT - 1; index >= 0; index--) buyTierOne(index);
}

export function buyMaxTierOne(index: i32): bool {
    if (index < 0 || index >= TIER_ONE_COUNT || !isTierOneVisible(index)) return false;
    const cost = tierOneCostHandle(index);
    if (!gte(player.mana, cost)) return false;

    const scalingExponent = index + 1;
    powInto(scratch.tierOneSeconds, 10, scalingExponent);
    subInto(scratch.productionModifier, scratch.tierOneSeconds, 1);
    multiplyInto(scratch.tierOneProduction, player.mana, scratch.productionModifier);
    divInto(scratch.tierOneProduction, scratch.tierOneProduction, cost);
    addUS(scratch.tierOneProduction, 1);
    log10Into(scratch.tierOneProduction, scratch.tierOneProduction);
    divInto(scratch.tierOneProduction, scratch.tierOneProduction, scalingExponent);
    floorInto(scratch.tierOneExponent, scratch.tierOneProduction);

    calculateTierOneBulkCost(cost);
    while (!lte(scratch.tierOneProduction, player.mana)) {
        subUS(scratch.tierOneExponent, 1);
        calculateTierOneBulkCost(cost);
    }
    subUS(player.mana, scratch.tierOneProduction);
    addUS(tierOneAmountHandle(index), scratch.tierOneExponent);
    addUS(tierOneBoughtHandle(index), scratch.tierOneExponent);
    unlockTierOneAchievement(index);
    refreshTierOneCost(index);
    refreshTierOneMultiplier(index);
    return true;
}

export function buyMaxAllTierOne(): void {
    for (let index: i32 = TIER_ONE_COUNT - 1; index >= 0; index--) buyMaxTierOne(index);
}

function calculateTierOneBulkCost(cost: i32): void {
    powInto(scratch.tierOneProduction, scratch.tierOneSeconds, scratch.tierOneExponent);
    subUS(scratch.tierOneProduction, 1);
    multiplyInto(scratch.tierOneProduction, scratch.tierOneProduction, cost);
    divInto(scratch.tierOneProduction, scratch.tierOneProduction, scratch.productionModifier);
}

export function canBuyTierOne(index: i32): bool {
    return isTierOneVisible(index) && gte(player.mana, tierOneCostHandle(index));
}

export function tierOneAffordabilityProgress(index: i32): f64 {
    if (index < 0 || index >= TIER_ONE_COUNT) return 0;
    const cost = tierOneCostHandle(index);
    if (gte(player.mana, cost)) return 1;
    if (!gt(player.mana, 1)) return 0;
    const infinityBoundary = <i32>toNumber(player.infinity_break_index);
    if (passesLayerBoundary(cost, infinityBoundary)) return 0;

    const scalingExponent = index + 1;
    multiplyInto(scratch.tierOneExponent, tierOneBoughtHandle(index), scalingExponent);
    addUS(scratch.tierOneExponent, 1 << index);
    if (gt(tierOneBoughtHandle(index), 0)) {
        subInto(scratch.productionModifier, scratch.tierOneExponent, scalingExponent);
    } else {
        writeNumber(scratch.productionModifier, 0);
    }

    log10Into(scratch.tierOneProduction, player.mana);
    subUS(scratch.tierOneProduction, scratch.productionModifier);
    subUS(scratch.tierOneExponent, scratch.productionModifier);
    divInto(scratch.tierOneProduction, scratch.tierOneProduction, scratch.tierOneExponent);
    const progress = toNumber(scratch.tierOneProduction);
    return Math.max(0, Math.min(1, progress));
}

export function isTierOneVisible(index: i32): bool {
    return index === 0 || (index > 0 && index < TIER_ONE_COUNT && gt(tierOneBoughtHandle(index - 1), 0));
}

export function tierOneCostHandle(index: i32): i32 {
    switch (index) {
        case 0: return player.cost_manaConduit;
        case 1: return player.cost_conduitConjugation;
        case 2: return player.cost_conjugationCreation;
        case 3: return player.cost_creationManufactory;
        case 4: return player.cost_manufactureStaff;
        default: return 0;
    }
}

export function tierOneMultiplierHandle(index: i32): i32 {
    switch (index) {
        case 0: return player.multiplier_manaConduit;
        case 1: return player.multiplier_conduitConjugation;
        case 2: return player.multiplier_conjugationCreation;
        case 3: return player.multiplier_creationManufactory;
        case 4: return player.multiplier_manufactureStaff;
        default: return 0;
    }
}

export function tierOneDisplayMultiplierHandle(index: i32): i32 {
    multiplyInto(
        scratch.tierOneDisplayMultiplier,
        tierOneMultiplierHandle(index),
        player.castSpeedMagnitude,
    );
    return scratch.tierOneDisplayMultiplier;
}

export function tierOneBoughtHandle(index: i32): i32 {
    switch (index) {
        case 0: return player.bought_manaConduit;
        case 1: return player.bought_conduitConjugation;
        case 2: return player.bought_conjugationCreation;
        case 3: return player.bought_creationManufactory;
        case 4: return player.bought_manufactureStaff;
        default: return 0;
    }
}

function tierOneAmountHandle(index: i32): i32 {
    switch (index) {
        case 0: return player.count_manaConduit;
        case 1: return player.count_conduitConjugation;
        case 2: return player.count_conjugationCreation;
        case 3: return player.count_creationManufactory;
        case 4: return player.count_manufactureStaff;
        default: return 0;
    }
}

function refreshTierOneCost(index: i32): void {
    const baseExponent = 1 << index;
    const scalingExponent = index + 1;
    multiplyInto(scratch.tierOneExponent, tierOneBoughtHandle(index), scalingExponent);
    addUS(scratch.tierOneExponent, baseExponent);
    powInto(tierOneCostHandle(index), 10, scratch.tierOneExponent);
}

function refreshTierOneMultiplier(index: i32): void {
    powInto(tierOneMultiplierHandle(index), player.multiplier_tierOnePerPurchase, tierOneBoughtHandle(index));
    if (index < TIER_ONE_COUNT - 1) {
        powInto(scratch.tierOneExponent, 10, tierOneEmpowermentHandle(index));
        mulUS(tierOneMultiplierHandle(index), scratch.tierOneExponent);
    }
    mulUS(tierOneMultiplierHandle(index), player.bolsterMultiplier);
    if (hasTierOneAchievement(15)) {
        writeNumber(scratch.tierOneExponent, 1 + <f64>(index + 1) / 100);
        mulUS(tierOneMultiplierHandle(index), scratch.tierOneExponent);
    }
}

/** [/WASM] */

refreshTierOneDerivedState();
