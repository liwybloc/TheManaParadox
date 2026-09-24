import {
    addInto,
    addUS,
    clampToBoundary,
    copyInto,
    gt,
    gte,
    log10Into,
    mulUS,
    reachesLayerBoundary,
    subUS,
    toNumber,
    writeDecimal,
    writeNumber,
} from "../core/break_eternity.js";
import { checkManaAchievements, checkTimeAchievements } from "./achievements.js";
import { hasCondensedEffect } from "./condensed.js";
import { applyCrystalManaGainModifiers, clampManaToActiveCrystalGoal } from "./crystals.js";
import { hasMemoryMilestone, memoryManaMultiplierHandle } from "./memories.js";
import { hasGuildShopUpgrade } from "../guild/guild.js";
import { equipmentManaProductionMultiplier } from "../guild/equipment.js";
import type { Player } from "../core/player.js";
import type { Scratch } from "../core/scratch.js";

declare const player: Player;
declare const scratch: Scratch;

/** [WASM] */

const CONDENSE_LOG10_REQUIREMENT: f64 = 308.25471555991675;
const OOM_RATE_THRESHOLD: f64 = 40;

export function getIncType(): i32 {
    writeDecimal(scratch.productionModifier, 1, 1, OOM_RATE_THRESHOLD);
    return gt(player.mana, scratch.productionModifier) ? 1 : 0;
}

export function gainCurrency(currency: i32, amount: i32): void {
    gainCurrencyInternal(currency, amount, false);
}

export function gainProductionCurrency(currency: i32, amount: i32): void {
    gainCurrencyInternal(currency, amount, true);
}

function gainCurrencyInternal(currency: i32, amount: i32, trackProductionRate: bool): void {
    if (currency === player.mana) {
        copyInto(scratch.currencyGain, amount);
        applyManaGainModifiers(scratch.currencyGain);
        addUS(currency, scratch.currencyGain);
        addUS(player.statistics_totalManaProduced, scratch.currencyGain);
        if (trackProductionRate) {
            copyInto(scratch.manaPerSecond, scratch.currencyGain);
            mulUS(scratch.manaPerSecond, scratch.updatesPerSecond);
            writeNumber(scratch.oomPerSecond, 0);
            if (getIncType() === 1) {
                addInto(scratch.productionModifier, player.mana, scratch.manaPerSecond);
                log10Into(scratch.productionModifier, scratch.productionModifier);
                log10Into(scratch.oomPerSecond, player.mana);
                subUS(scratch.productionModifier, scratch.oomPerSecond);
                copyInto(scratch.oomPerSecond, scratch.productionModifier);
            }
        }
        clampManaToInfinityBoundary();
        clampManaToActiveCrystalGoal();
        updateHighestManaReached();
        checkManaAchievements();
        return;
    }
    addUS(currency, amount);
}

export function updateHighestManaReached(): void {
    if (gt(player.mana, player.highestManaReached)) copyInto(player.highestManaReached, player.mana);
}

export function applyManaGainModifiers(amount: i32): void {
    mulUS(amount, player.multiplier_currencyGlobal);
    writeNumber(scratch.productionModifier, equipmentManaProductionMultiplier());
    mulUS(amount, scratch.productionModifier);
    if (hasMemoryMilestone(5)) mulUS(amount, memoryManaMultiplierHandle());
    if (hasGuildShopUpgrade(7)) mulUS(amount, 2);
    if (hasCondensedEffect(13)) {
        writeNumber(scratch.productionModifier, 0);
        addUS(addUS(scratch.productionModifier, player.condensedMana), 1);
        mulUS(amount, scratch.productionModifier);
    }
    applyCrystalManaGainModifiers(amount);
}

export function clampManaToInfinityBoundary(): void {
    clampToBoundary(player.mana, <i32>toNumber(player.mana_circle_tier));
}

export function isAtInfinityBoundary(value: i32): bool {
    return reachesLayerBoundary(value, <i32>toNumber(player.mana_circle_tier));
}

export function manaCondenseProgress(): f64 {
    if (reachesLayerBoundary(player.mana, 0)) return 1;
    if (!gt(player.mana, 1)) return 0;

    log10Into(scratch.currencyGain, player.mana);
    return Math.max(0, Math.min(1, toNumber(scratch.currencyGain) / CONDENSE_LOG10_REQUIREMENT));
}

export function manaGoalProgress(startExponent: f64, endExponent: f64, maximum: f64): f64 {
    if (endExponent <= startExponent || !gt(player.mana, 1)) return 0;
    log10Into(scratch.currencyGain, player.mana);
    const exponent = toNumber(scratch.currencyGain);
    const progress = (exponent - startExponent) / (endExponent - startExponent);
    return Math.max(0, Math.min(maximum, progress));
}

export function addPlayerTime(amount: i32): void {
    addUS(player.statistics_totalTimePlayed, amount);
    addCondenseTime(amount);
    checkTimeAchievements();
}

export function addCondenseTime(amount: i32): void {
    addUS(player.statistics_timeThisCondense, amount);
}

export function addGameTime(amount: i32): void {
    addUS(player.statistics_gameTimePlayed, amount);
}

export function cheatSomeCookies(): void {
    gainCurrency(player.mana, player.mana);
}

/** [/WASM] */
