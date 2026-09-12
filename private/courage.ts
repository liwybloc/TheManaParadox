import { addUS, gt, gte, log10Into, mulUS, subUS, toNumber, writeDecimal, writeNumber } from "./break_eternity.js";
import { hasCondensedUpgrade } from "./condensed.js";
import type { Player } from "./player.js";
import type { Scratch } from "./scratch.js";

declare const player: Player;
declare const scratch: Scratch;

/** [WASM] */

const COURAGE_DURATION: f64 = 15;
const COURAGE_COOLDOWN: f64 = 30;

export function isCourageVisible(): bool {
    if (player.courageUnlocked) return true;
    writeDecimal(scratch.currencyGain, 1, 1, 290);
    if (!gte(player.mana, scratch.currencyGain)) return false;
    player.courageUnlocked = true;
    return true;
}

export function isCourageUnlocked(): bool {
    return player.courageUnlocked;
}

export function setCourageUnlocked(unlocked: bool): void {
    player.courageUnlocked = unlocked;
}

export function activateCourage(): bool {
    if (!player.courageUnlocked || gt(player.courageCooldown, 0)) return false;
    writeNumber(player.courageTimer, hasCondensedUpgrade(12) ? COURAGE_DURATION * 2 : COURAGE_DURATION);
    writeNumber(player.courageCooldown, hasCondensedUpgrade(14) ? COURAGE_COOLDOWN * 0.75 : COURAGE_COOLDOWN);
    writeNumber(player.courageMultiplier, 10);
    if (hasCondensedUpgrade(18)) {
        writeNumber(scratch.productionModifier, 0);
        addUS(addUS(scratch.productionModifier, player.condensedMana), 1);
        log10Into(scratch.productionModifier, scratch.productionModifier);
        addUS(scratch.productionModifier, 1);
        mulUS(player.courageMultiplier, scratch.productionModifier);
    }
    return true;
}

export function isCourageActive(): bool {
    return gt(player.courageTimer, 0);
}

export function updateCourage(deltaSeconds: i32): bool {
    const elapsed = Math.max(0, toNumber(deltaSeconds));
    const active = isCourageActive();
    if (elapsed === 0) return active;

    reduceTimer(player.courageTimer, deltaSeconds, elapsed);
    reduceTimer(player.courageCooldown, deltaSeconds, elapsed);
    return active;
}

function reduceTimer(timer: i32, deltaSeconds: i32, elapsed: f64): void {
    if (!gt(timer, 0)) return;
    if (toNumber(timer) <= elapsed) writeNumber(timer, 0);
    else subUS(timer, deltaSeconds);
}

/** [/WASM] */
