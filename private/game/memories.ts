import { addUS, copyInto, divUS, gt, log10Into, powInto, subUS, toNumber, writeNumber } from "../core/break_eternity.js";
import { hasCompletedCrystal, isCrystalActive } from "./crystals.js";
import type { Player } from "../core/player.js";
import type { Scratch } from "../core/scratch.js";

export const MEMORY_MILESTONES = [
    1, 3, 5, 10, 25, 50, 100, 250, 1_000, 2_500, 5_000, 10_000, 50_000, 100_000,
] as const;

export const MEMORY_MILESTONE_REWARDS: Readonly<Record<number, string>> = {
    1: "Gain ×2 more condensed mana",
    3: "Courage is ×2 stronger",
    5: "Mana is multiplied based on current mana (Currently: ×{amount})",
    10: "The game speed decrease in focus is slightly weaker",
    25: "Unlock the Guild's Library",
};

declare const scratch: Scratch;
declare const player: Player;

/** [WASM] */

let totalMemories: i32 = 0;
let focusing: bool = false;

export function getTotalMemories(): i32 {
    return totalMemories;
}

export function setTotalMemories(value: i32): void {
    totalMemories = value < 0 ? 0 : value;
}

export function hasMemoryMilestone(requirement: i32): bool {
    return totalMemories >= requirement;
}

export function isFocusing(): bool {
    return focusing;
}

export function setFocusing(value: bool): void {
    focusing = value;
}

export function baseMemoryChance(): f64 {
    return 1 / (totalMemories + 1);
}

export function memoryChance(condensedManaGained: i32): f64 {
    const baseChance = baseMemoryChance();
    if (!gt(condensedManaGained, 0)) return baseChance;
    copyInto(scratch.currencyGain, condensedManaGained);
    addUS(scratch.currencyGain, 1);
    log10Into(scratch.currencyGain, scratch.currencyGain);
    divUS(scratch.currencyGain, 50);
    const condensedManaBonus = Math.max(0, toNumber(scratch.currencyGain));
    return Math.min(1, baseChance + condensedManaBonus);
}

export function focusGameSpeedMultiplier(): i32 {
    log10Into(scratch.manaExponent, player.mana);
    if (gt(scratch.manaExponent, 1)) {
        subUS(scratch.manaExponent, 1);
        divUS(scratch.manaExponent, 25);
    } else {
        writeNumber(scratch.manaExponent, 0);
    }
    writeNumber(scratch.currencyGain, -0.5);
    subUS(scratch.currencyGain, scratch.manaExponent);
    powInto(scratch.manaExponent, hasMemoryMilestone(10) ? 95 : 100, scratch.currencyGain);
    return scratch.manaExponent;
}

export function memoryManaMultiplierHandle(): i32 {
    if (!hasMemoryMilestone(5) || !gt(player.mana, 10)) {
        writeNumber(scratch.manaExponent, 1);
        return scratch.manaExponent;
    }
    log10Into(scratch.manaExponent, player.mana);
    return scratch.manaExponent;
}

export function toggleFocus(): bool {
    if (focusing) {
        focusing = false;
        return true;
    }
    if (!hasCompletedCrystal(2) || isCrystalActive()) return false;
    focusing = true;
    return true;
}

export function resolveFocusedCondense(roll: f64, chance: f64): bool {
    if (!focusing) return false;
    if (roll >= chance) return false;
    totalMemories++;
    return true;
}

/** [/WASM] */
