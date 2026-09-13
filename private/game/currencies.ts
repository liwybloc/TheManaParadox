import {
    addUS,
    clampToBoundary,
    gt,
    log10Into,
    mulUS,
    multiplyInto,
    reachesLayerBoundary,
    toNumber,
    writeNumber,
} from "../core/break_eternity.js";
import { checkManaAchievements, checkTimeAchievements } from "./achievements.js";
import { hasCondensedUpgrade } from "./condensed.js";
import { hasGuildShopUpgrade } from "../guild/guild.js";
import type { Player } from "../core/player.js";
import type { Scratch } from "../core/scratch.js";

declare const player: Player;
declare const scratch: Scratch;

/** [WASM] */

const CONDENSE_LOG10_REQUIREMENT: f64 = 308.25471555991675;

export function gainCurrency(currency: i32, amount: i32): void {
    if (currency === player.mana) {
        multiplyInto(scratch.currencyGain, amount, player.multiplier_currencyGlobal);
        if (hasGuildShopUpgrade(1)) mulUS(scratch.currencyGain, 2);
        if (hasCondensedUpgrade(13)) {
            writeNumber(scratch.productionModifier, 0);
            addUS(addUS(scratch.productionModifier, player.condensedMana), 1);
            mulUS(scratch.currencyGain, scratch.productionModifier);
        }
        addUS(currency, scratch.currencyGain);
        addUS(player.statistics_totalManaProduced, scratch.currencyGain);
        clampManaToInfinityBoundary();
        checkManaAchievements();
        return;
    }
    addUS(currency, amount);
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

export function addPlayerTime(amount: i32): void {
    addUS(player.statistics_totalTimePlayed, amount);
    addUS(player.statistics_timeThisCondense, amount);
    checkTimeAchievements();
}

export function cheatSomeCookies(): void {
    gainCurrency(player.mana, player.mana);
}

/** [/WASM] */
