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
    readString,
    clampToBoundary,
    eq,
    reachesLayerBoundary,
    toNumber,
    writeDecimal,
} from "./break_eternity.js";

interface PlayerHandles {
    mana: i32;

    statistics_totalManaProduced: i32;
    statistics_totalTimePlayed: i32;

    infinity_break_index: i32,

    multiplier_currencyGlobal: i32;
    multiplier_timePlayedAchievement: i32;
    constant_timeAchievementDivisor: i32;
    scratch_currencyGain: i32;

    count_manaConduit: i32;
    count_conduitConjugation: i32;
    count_conjugationCreation: i32;
    count_creationManufactory: i32;
    count_manufactureStaff: i32;
}

interface Player extends PlayerHandles {}

interface Player {
    achievement_buymanaconduit: bool;
    achievement_buyconduitconjugation: bool;
    achievement_buyconjugationcreation: bool;
    achievement_buycreationmanufactory: bool;
    achievement_buymanufacturestaff: bool;
    achievement_playtwohours: bool;
    achievement_upgrademastery: bool;
    achievement_havesixstaff: bool;
    achievement_produce1e50mana: bool;
    achievement_castspeedminute: bool;
}

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

    matrixOwned: i32;
    matrixCost: i32;
    matrixPower: i32;
    matrixSpeedPower: i32;
}

export const HANDLES: PlayerHandles = {
    mana: createDecimal(1, 0, 10),
    
    statistics_totalManaProduced: createDecimal(0, 0, 0),
    statistics_totalTimePlayed: createDecimal(0, 0, 0),

    infinity_break_index: createDecimal(0, 0, 0),
    
    multiplier_currencyGlobal: createDecimal(1, 0, 1),
    multiplier_timePlayedAchievement: createDecimal(1, 0, 1),
    constant_timeAchievementDivisor: createDecimal(1, 0, 500),
    scratch_currencyGain: createDecimal(0, 0, 0),

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

    matrixOwned: createDecimal(0, 0, 0),
    matrixCost: createDecimal(1, 0, 10),
    matrixPower: createDecimal(1, 0, 0.5),
    matrixSpeedPower: createDecimal(1, 0, 2),
};

/** [WASM] */

export const player: Player = {
    mana: 0,

    statistics_totalManaProduced: 0,
    statistics_totalTimePlayed: 0,

    infinity_break_index: 0,

    multiplier_currencyGlobal: 0,
    multiplier_timePlayedAchievement: 0,
    constant_timeAchievementDivisor: 0,
    scratch_currencyGain: 0,
    
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

    matrixOwned: 0,
    matrixCost: 0,
    matrixPower: 0,
    matrixSpeedPower: 0,

    achievement_buymanaconduit: false,
    achievement_buyconduitconjugation: false,
    achievement_buyconjugationcreation: false,
    achievement_buycreationmanufactory: false,
    achievement_buymanufacturestaff: false,
    achievement_playtwohours: false,
    achievement_upgrademastery: false,
    achievement_havesixstaff: false,
    achievement_produce1e50mana: false,
    achievement_castspeedminute: false,
};

const TIER_ONE_COUNT: i32 = 5;

export function initializeCurrencies(
    totalManaProduced: i32,
    totalTimePlayed: i32,
    globalMultiplier: i32,
    currencyGain: i32,
    timePlayedAchievementMultiplier: i32,
    timeAchievementDivisor: i32,
): void {
    player.statistics_totalManaProduced = totalManaProduced;
    player.statistics_totalTimePlayed = totalTimePlayed;
    player.multiplier_currencyGlobal = globalMultiplier;
    player.scratch_currencyGain = currencyGain;
    player.multiplier_timePlayedAchievement = timePlayedAchievementMultiplier;
    player.constant_timeAchievementDivisor = timeAchievementDivisor;
}

export function gainCurrency(currency: i32, amount: i32): void {
    if (currency === player.mana) {
        multiplyInto(player.scratch_currencyGain, amount, player.multiplier_currencyGlobal);
        addUS(currency, player.scratch_currencyGain);
        addUS(player.statistics_totalManaProduced, player.scratch_currencyGain);
        clampManaToInfinityBoundary();
        return;
    }
    addUS(currency, amount);
}

export function clampManaToInfinityBoundary(): void {
    clampToBoundary(player.mana, <i32>toNumber(player.infinity_break_index));
}

export function isAtInfinityBoundary(value: i32): bool {
    return reachesLayerBoundary(value, <i32>toNumber(player.infinity_break_index));
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
                                  scratch_productionModifier: i32, infinity_break_index: i32): void {
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
    player.infinity_break_index = infinity_break_index;

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

export function initializeMatrix(owned: i32, cost: i32, power: i32, speedPower: i32): void {
    player.matrixOwned = owned;
    player.matrixCost = cost;
    player.matrixPower = power;
    player.matrixSpeedPower = speedPower;
    refreshMatrixDerivedState();
}

export function castSpeed(): bool {
    if (!canCastSpeed()) return false;
    subUS(player.mana, player.castSpeedCost);
    if (!gt(player.castSpeedTimer, 0)) {
        multiplyInto(player.castSpeedMagnitude, player.masterySpeedEffect, player.matrixSpeedPower);
    } else {
        mulUS(player.castSpeedMagnitude, player.matrixSpeedPower);
    }
    addUS(player.castSpeedTimer, hasTierOneAchievement(9) ? 20 : 15);
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
    unlockTierOneAchievement(6);
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

export function increaseMatrix(): bool {
    if (!canIncreaseMatrix()) return false;
    addUS(player.matrixOwned, 1);
    refreshMatrixDerivedState();
    resetTierOne();
    resetMastery();
    return true;
}

export function canIncreaseMatrix(): bool {
    return gte(player.count_manufactureStaff, player.matrixCost);
}

export function isMatrixVisible(): bool {
    return isMasteryVisible() || gt(player.matrixOwned, 0);
}

export function refreshMatrixDerivedState(): void {
    powInto(player.matrixCost, 10, player.matrixOwned);
    mulUS(player.matrixCost, 10);
    multiplyInto(player.matrixSpeedPower, player.matrixOwned, player.matrixPower);
    addUS(player.matrixSpeedPower, 2);
}

export function resetMastery(): void {
    writeNumber(player.masteryOwned, 0);
    refreshMasteryDerivedState();
}

function resetTierOne(): void {
    writeNumber(player.mana, hasTierOneAchievement(8) ? 500 : 10);
    for (let index: i32 = 0; index < TIER_ONE_COUNT; index++) {
        writeNumber(tierOneAmountHandle(index), 0);
        writeNumber(tierOneBoughtHandle(index), 0);
    }
    resetCastSpeed();
    refreshTierOneDerivedState();
}

export function resetCastSpeed(): void {
    writeNumber(player.castSpeedTimer, 0);
    writeNumber(player.castSpeedMagnitude, 1);
    writeNumber(player.castSpeedCost, 1000);
}

export function buyTierOne(index: i32): bool {
    if (index < 0 || index >= TIER_ONE_COUNT) return false;
    if (!isTierOneVisible(index)) return false;
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
    unlockTierOneAchievement(index);
    refreshTierOneCost(index);
    refreshTierOneMultiplier(index);
    return true;
}

export function hasTierOneAchievement(index: i32): bool {
    switch (index) {
        case 0: return player.achievement_buymanaconduit;
        case 1: return player.achievement_buyconduitconjugation;
        case 2: return player.achievement_buyconjugationcreation;
        case 3: return player.achievement_buycreationmanufactory;
        case 4: return player.achievement_buymanufacturestaff;
        case 5: return player.achievement_playtwohours;
        case 6: return player.achievement_upgrademastery;
        case 7: return player.achievement_havesixstaff;
        case 8: return player.achievement_produce1e50mana;
        case 9: return player.achievement_castspeedminute;
        default: return false;
    }
}

export function setTierOneAchievement(index: i32, unlocked: bool): void {
    switch (index) {
        case 0: player.achievement_buymanaconduit = unlocked; break;
        case 1: player.achievement_buyconduitconjugation = unlocked; break;
        case 2: player.achievement_buyconjugationcreation = unlocked; break;
        case 3: player.achievement_buycreationmanufactory = unlocked; break;
        case 4: player.achievement_buymanufacturestaff = unlocked; break;
        case 5: player.achievement_playtwohours = unlocked; break;
        case 6: player.achievement_upgrademastery = unlocked; break;
        case 7: player.achievement_havesixstaff = unlocked; break;
        case 8: player.achievement_produce1e50mana = unlocked; break;
        case 9: player.achievement_castspeedminute = unlocked; break;
    }
    refreshAchievementRewards();
}

function unlockTierOneAchievement(index: i32): void {
    setTierOneAchievement(index, true);
    if (index === 4 && eq(player.count_manufactureStaff, 6)) {
        setTierOneAchievement(7, true);
    }
}

export function refreshAchievementRewards(): void {
    writeNumber(player.multiplier_currencyGlobal, 1);
    for (let index: i32 = 0; index < TIER_ONE_COUNT; index++) {
        if (!hasTierOneAchievement(index)) continue;
        writeNumber(player.scratch_currencyGain, <f64>(index + 1) / 100);
        addUS(player.multiplier_currencyGlobal, player.scratch_currencyGain);
    }
    writeNumber(player.multiplier_timePlayedAchievement, 1);
    if (hasTierOneAchievement(5)) {
        divInto(
            player.scratch_currencyGain,
            player.statistics_totalTimePlayed,
            player.constant_timeAchievementDivisor,
        );
        log10Into(player.scratch_currencyGain, player.scratch_currencyGain);
        if (gt(player.scratch_currencyGain, 1)) {
            writeNumber(player.multiplier_timePlayedAchievement, 0);
            addUS(player.multiplier_timePlayedAchievement, player.scratch_currencyGain);
        }
    }
    mulUS(player.multiplier_currencyGlobal, player.multiplier_timePlayedAchievement);
}

export function checkAchievements(): void {
    writeNumber(player.scratch_currencyGain, 7200);
    if (gte(player.statistics_totalTimePlayed, player.scratch_currencyGain)) unlockTierOneAchievement(5);
    if (gt(player.masteryOwned, 0)) unlockTierOneAchievement(6);
    if (eq(player.count_manufactureStaff, 6)) unlockTierOneAchievement(7);
    writeDecimal(player.scratch_currencyGain, 1, 1, 50);
    if (gte(player.statistics_totalManaProduced, player.scratch_currencyGain)) unlockTierOneAchievement(8);
    writeNumber(player.scratch_currencyGain, 60);
    if (gt(player.castSpeedTimer, player.scratch_currencyGain)) unlockTierOneAchievement(9);
    refreshAchievementRewards();
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

export function addPlayerTime(amount: i32): void {
    addUS(player.statistics_totalTimePlayed, amount);
}

export function cheatSomeCookies(): void {
    gainCurrency(player.mana, player.mana);
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
    HANDLES.infinity_break_index,
);
initializeCurrencies(
    HANDLES.statistics_totalManaProduced,
    HANDLES.statistics_totalTimePlayed,
    HANDLES.multiplier_currencyGlobal,
    HANDLES.scratch_currencyGain,
    HANDLES.multiplier_timePlayedAchievement,
    HANDLES.constant_timeAchievementDivisor,
);
refreshAchievementRewards();
initializeCastSpeed(HANDLES.castSpeedTimer, HANDLES.castSpeedMagnitude, HANDLES.castSpeedCost);
initializeMastery(HANDLES.masteryOwned, HANDLES.masteryLevel, HANDLES.masteryCost, HANDLES.masterySpeedEffect);
initializeMatrix(HANDLES.matrixOwned, HANDLES.matrixCost, HANDLES.matrixPower, HANDLES.matrixSpeedPower);

(globalThis as any).readValue = (value: keyof typeof HANDLES) => {
    return readString(HANDLES[value] ?? HANDLES.mana);
}
(globalThis as any).assignValue = (value: keyof typeof HANDLES, number: number) => {
    writeNumber(HANDLES[value] ?? HANDLES.mana, number);
    refreshTierOneDerivedState();
    refreshMasteryDerivedState();
    refreshMatrixDerivedState();
    clampManaToInfinityBoundary();
}
