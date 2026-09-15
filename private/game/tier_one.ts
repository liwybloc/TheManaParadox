import {
    addUS,
    copyInto,
    divInto,
    divUS,
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
    powUS,
    subInto,
    subUS,
    toNumber,
    writeDecimal,
    writeNumber,
} from "../core/break_eternity.js";
import { hasTierOneAchievement, unlockTierOneAchievement } from "./achievements.js";
import { hasCondensedUpgrade } from "./condensed.js";
import { applyManaGainModifiers } from "./currencies.js";
import type { Player } from "../core/player.js";
import type { Scratch } from "../core/scratch.js";

declare const player: Player;
declare const scratch: Scratch;

/** [WASM] */

export const TIER_ONE_COUNT: i32 = 5;

// Effect = baseMultiplier * growthBase ^ ((log10(conduits) - startExponent) / exponentInterval)
// Next requirement = requirementMargin * 10 ^ (startExponent + exponentInterval * log_growthBase(currentEffect / baseMultiplier))
const PURIFICATION_BASE_MULTIPLIER: i32 = 16;
const PURIFICATION_GROWTH_BASE: f64 = 2.75;
const PURIFICATION_START_EXPONENT: i32 = 45;
const PURIFICATION_EXPONENT_INTERVAL: i32 = 10;
const PURIFICATION_REQUIREMENT_MARGIN: f64 = 1.01;
const PURIFICATION_MINIMUM_EFFECT: f64 = 1;
const PURIFICATION_SOFTCAP_MULTIPLIER: i32 = 350000;
const PURIFICATION_SOFTCAP_POWER: f64 = 0.5;
const CONDENSED_PRODUCER_MULTIPLIER: i32 = 2;
const CONDENSED_STAFF_MULTIPLIER: i32 = 5;

export function refreshTierOneDerivedState(): void {
    for (let index: i32 = 0; index < TIER_ONE_COUNT; index++) {
        refreshTierOneCost(index);
        refreshTierOneMultiplier(index);
        refreshEmpowermentCost(index);
    }
    refreshMeridianPurificationRequirement();
    refreshMeridianPurificationEffect();
}

export function refreshMeridianPurificationRequirement(): void {
    if (!gte(player.purifiedMeridiansMultiplier, PURIFICATION_BASE_MULTIPLIER)) {
        writeDecimal(player.meridianPurificationRequirement, 1, 1, PURIFICATION_START_EXPONENT);
        return;
    }
    divInto(scratch.tierOneExponent, player.purifiedMeridiansMultiplier, PURIFICATION_BASE_MULTIPLIER);
    if (hasTierOneAchievement(17)) divUS(scratch.tierOneExponent, 5);
    log10Into(scratch.tierOneExponent, scratch.tierOneExponent);
    writeNumber(scratch.productionModifier, PURIFICATION_GROWTH_BASE);
    log10Into(scratch.productionModifier, scratch.productionModifier);
    divUS(scratch.tierOneExponent, scratch.productionModifier);
    undoPurificationExponentSoftcap(scratch.tierOneExponent);
    addUS(
        mulUS(scratch.tierOneExponent, PURIFICATION_EXPONENT_INTERVAL),
        PURIFICATION_START_EXPONENT,
    );
    powInto(player.meridianPurificationRequirement, 10, scratch.tierOneExponent);
    writeNumber(scratch.tierOneExponent, PURIFICATION_REQUIREMENT_MARGIN);
    mulUS(player.meridianPurificationRequirement, scratch.tierOneExponent);
}

export function refreshMeridianPurificationEffect(): void {
    if (!gt(player.count_manaConduit, 0)) {
        writeNumber(player.meridianPurificationEffect, 1);
        return;
    }
    log10Into(scratch.tierOneExponent, player.count_manaConduit);
    divUS(subUS(scratch.tierOneExponent, PURIFICATION_START_EXPONENT), PURIFICATION_EXPONENT_INTERVAL);
    applyPurificationExponentSoftcap(scratch.tierOneExponent);
    writeNumber(scratch.productionModifier, PURIFICATION_GROWTH_BASE);
    powInto(player.meridianPurificationEffect, scratch.productionModifier, scratch.tierOneExponent);
    mulUS(player.meridianPurificationEffect, PURIFICATION_BASE_MULTIPLIER);
    if (hasTierOneAchievement(17)) mulUS(player.meridianPurificationEffect, 5);
    if (toNumber(player.meridianPurificationEffect) < PURIFICATION_MINIMUM_EFFECT) {
        writeNumber(player.meridianPurificationEffect, PURIFICATION_MINIMUM_EFFECT);
    }
    divInto(scratch.purificationRelativeIncrease, player.meridianPurificationEffect, player.purifiedMeridiansMultiplier);
}

// Above ×350,000 total effect, exponent x follows threshold * (x / threshold)^0.5.
// The curve never decreases, but each additional exponent contributes progressively less.
function applyPurificationExponentSoftcap(exponent: i32): void {
    calculatePurificationSoftcapExponent(scratch.tierOneProduction);
    if (!gt(exponent, scratch.tierOneProduction)) return;
    divUS(exponent, scratch.tierOneProduction);
    writeNumber(scratch.productionModifier, PURIFICATION_SOFTCAP_POWER);
    powUS(exponent, scratch.productionModifier);
    mulUS(exponent, scratch.tierOneProduction);
}

function undoPurificationExponentSoftcap(exponent: i32): void {
    calculatePurificationSoftcapExponent(scratch.tierOneProduction);
    if (!gt(exponent, scratch.tierOneProduction)) return;
    divUS(exponent, scratch.tierOneProduction);
    powUS(exponent, 2);
    mulUS(exponent, scratch.tierOneProduction);
}

function calculatePurificationSoftcapExponent(result: i32): void {
    writeNumber(result, PURIFICATION_SOFTCAP_MULTIPLIER);
    divUS(result, PURIFICATION_BASE_MULTIPLIER);
    if (hasTierOneAchievement(17)) divUS(result, 5);
    log10Into(result, result);
    writeNumber(scratch.productionModifier, PURIFICATION_GROWTH_BASE);
    log10Into(scratch.productionModifier, scratch.productionModifier);
    divUS(result, scratch.productionModifier);
}

export function canPurifyMeridians(): bool {
    if(!hasTierOneAchievement(7)) return false;
    refreshMeridianPurificationRequirement();
    refreshMeridianPurificationEffect();
    return gte(player.count_manaConduit, player.meridianPurificationRequirement) && gt(player.meridianPurificationEffect, player.purifiedMeridiansMultiplier);
}

export function canPurifyMeridiansAtRelativeMultiplier(minimum: f64): bool {
    if (!canPurifyMeridians()) return false;
    writeNumber(scratch.tierOneSeconds, Math.max(1, minimum));
    return gte(scratch.purificationRelativeIncrease, scratch.tierOneSeconds);
}

export function purifyMeridians(): bool {
    if (!canPurifyMeridians()) return false;
    copyInto(player.purifiedMeridiansMultiplier, player.meridianPurificationEffect);
    for (let index: i32 = 0; index < TIER_ONE_COUNT - 1; index++) {
        writeNumber(tierOneAmountHandle(index), 0);
    }
    refreshMeridianPurificationEffect();
    refreshMeridianPurificationRequirement();
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
    writeNumber(scratch.productionModifier, hasCondensedUpgrade(9) ? 1.9 : 2);
    powInto(scratch.tierOneExponent, scratch.productionModifier, tierOneEmpowermentHandle(index));
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

export function resetMeridianPurification(): void {
    writeNumber(player.purifiedMeridiansMultiplier, 1);
    refreshMeridianPurificationRequirement();
    refreshMeridianPurificationEffect();
    for (let index: i32 = 0; index < TIER_ONE_COUNT; index++) {
        refreshTierOneMultiplier(index);
    }
}

export function buyTierOne(index: i32): bool {
    if (index < 0 || index >= TIER_ONE_COUNT || !isTierOneVisible(index)) return false;
    const cost = tierOneCostHandle(index);
    if (!gte(player.mana, cost)) return false;
    recordProducerBoost(index);
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
    recordProducerBoost(index);

    const scalingExponent = index + 1;
    powInto(scratch.tierOneSeconds, 10, scalingExponent);
    subInto(scratch.productionModifier, scratch.tierOneSeconds, 1);
    multiplyInto(scratch.tierOneProduction, player.mana, scratch.productionModifier);
    addUS(divUS(scratch.tierOneProduction, cost), 1);
    log10Into(scratch.tierOneProduction, scratch.tierOneProduction);
    divUS(scratch.tierOneProduction, scalingExponent);
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

function recordProducerBoost(index: i32): void {
    if (index < TIER_ONE_COUNT - 1 && gt(tierOneBoughtHandle(index + 1), 0)) {
        player.boostedProducerThisCondense = true;
    }
}

export function buyMaxAllTierOne(): void {
    for (let index: i32 = TIER_ONE_COUNT - 1; index >= 0; index--) buyMaxTierOne(index);
}

function calculateTierOneBulkCost(cost: i32): void {
    powInto(scratch.tierOneProduction, scratch.tierOneSeconds, scratch.tierOneExponent);
    divUS(mulUS(subUS(scratch.tierOneProduction, 1), cost), scratch.productionModifier);
}

export function canBuyTierOne(index: i32): bool {
    return isTierOneVisible(index) && gte(player.mana, tierOneCostHandle(index));
}

export function tierOneAffordabilityProgress(index: i32): f64 {
    if (index < 0 || index >= TIER_ONE_COUNT) return 0;
    const cost = tierOneCostHandle(index);
    if (gte(player.mana, cost)) return 1;
    if (!gt(player.mana, 1)) return 0;
    const infinityBoundary = <i32>toNumber(player.mana_circle_tier);
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
    divUS(scratch.tierOneProduction, scratch.tierOneExponent);
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
    if (index === 0) applyManaGainModifiers(scratch.tierOneDisplayMultiplier);
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
    writeNumber(scratch.productionModifier, 0);
    addUS(scratch.productionModifier, player.multiplier_tierOnePerPurchase);
    if (index === 0 && hasCondensedUpgrade(0)) {
        writeNumber(scratch.tierOneExponent, 0.1);
        addUS(scratch.productionModifier, scratch.tierOneExponent);
    }
    powInto(tierOneMultiplierHandle(index), scratch.productionModifier, tierOneBoughtHandle(index));
    if (index < TIER_ONE_COUNT - 1) {
        writeNumber(scratch.productionModifier, hasCondensedUpgrade(16) ? 50 : 10);
        powInto(scratch.tierOneExponent, scratch.productionModifier, tierOneEmpowermentHandle(index));
        mulUS(tierOneMultiplierHandle(index), scratch.tierOneExponent);
    }
    mulUS(tierOneMultiplierHandle(index), player.purifiedMeridiansMultiplier);
    if (index === 4 && hasCondensedUpgrade(4)) {
        mulUS(tierOneMultiplierHandle(index), CONDENSED_STAFF_MULTIPLIER);
    } else if ((index === 0 && hasCondensedUpgrade(2))
        || (index === 1 && hasCondensedUpgrade(3))
        || (index === 2 && hasCondensedUpgrade(6))
        || (index === 3 && hasCondensedUpgrade(5))) {
        mulUS(tierOneMultiplierHandle(index), CONDENSED_PRODUCER_MULTIPLIER);
    }
    if (hasTierOneAchievement(15)) {
        writeNumber(scratch.tierOneExponent, 1 + <f64>(index + 1) / 100);
        mulUS(tierOneMultiplierHandle(index), scratch.tierOneExponent);
    }
}

/** [/WASM] */

refreshTierOneDerivedState();
