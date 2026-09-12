import { addInto, addUS, divInto, divUS, gt, gte, multiplyInto, mulUS, powInto, powUS, roundInto, subUS, writeDecimal, writeNumber } from "./break_eternity.js";
import { checkCastSpeedAchievements, hasTierOneAchievement, unlockTierOneAchievement } from "./achievements.js";
import { hasCondensedUpgrade } from "./condensed.js";
import type { Player } from "./player.js";
import type { Scratch } from "./scratch.js";
import { resetBolster, resetTierOneAmounts } from "./tier_one.js";

declare const player: Player;
declare const scratch: Scratch;

/** [WASM] */

const CONDENSED_CAST_SPEED_POWER_BONUS: f64 = 0.25;

export function castSpeed(): bool {
    if (!canCastSpeed()) return false;
    subUS(player.mana, player.castSpeedCost);
    if (!gt(player.castSpeedTimer, 0)) {
        multiplyInto(player.castSpeedMagnitude, player.masterySpeedEffect, player.matrixSpeedPower);
    } else {
        mulUS(player.castSpeedMagnitude, player.matrixSpeedPower);
    }
    addUS(player.castSpeedTimer, hasTierOneAchievement(9) ? 20 : 15);
    if (hasCondensedUpgrade(11) && !gt(player.castSpeedCost, 0)) {
        writeNumber(player.castSpeedCost, 1000);
    } else {
        writeNumber(scratch.productionModifier, hasCondensedUpgrade(8) ? 1.9 : 2);
        powUS(player.castSpeedCost, scratch.productionModifier);
    }
    checkCastSpeedAchievements();
    return true;
}

export function canCastSpeed(): bool {
    return gte(player.mana, player.castSpeedCost);
}

export function castSpeedMax(): void {
    while (castSpeed()) {}
}

export function increaseMastery(): bool {
    if (!canIncreaseMastery()) return false;
    const speedIsActive = gt(player.castSpeedTimer, 0);
    addUS(player.masteryOwned, 1);
    refreshMasteryDerivedState();
    refreshMatrixDerivedState();
    refreshMasteryDerivedState();
    if (gte(player.masteryLevel, 5)) unlockTierOneAchievement(6);
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
    roundInto(player.masteryCost, player.masteryCost);
    if (hasCondensedUpgrade(15)) {
        powInto(player.masterySpeedEffect, player.matrixSpeedPower, player.masteryOwned);
    } else {
        powInto(player.masterySpeedEffect, 2, player.masteryOwned);
    }
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
    if (hasCondensedUpgrade(1)) {
        writeNumber(scratch.productionModifier, CONDENSED_CAST_SPEED_POWER_BONUS);
        addUS(player.matrixSpeedPower, scratch.productionModifier);
    }
    if (hasCondensedUpgrade(17)) {
        addInto(scratch.productionModifier, player.masteryLevel, 0);
        writeNumber(scratch.tierOneSeconds, 50);
        // cast speed power bonus = Mastery level / 50.
        divUS(scratch.productionModifier, scratch.tierOneSeconds);
        addUS(player.matrixSpeedPower, scratch.productionModifier);
    }
}

export function resetMastery(): void {
    writeNumber(player.masteryOwned, hasCondensedUpgrade(10) ? 1 : 0);
    refreshMasteryDerivedState();
    refreshMatrixDerivedState();
    refreshMasteryDerivedState();
}

function resetTierOne(): void {
    if (hasCondensedUpgrade(7)) writeDecimal(player.mana, 1, 1, 20);
    else writeNumber(player.mana, hasTierOneAchievement(8) ? 500 : 10);
    resetTierOneAmounts();
    resetBolster();
    resetCastSpeed();
}

export function resetCastSpeed(): void {
    writeNumber(player.castSpeedTimer, 0);
    writeNumber(player.castSpeedMagnitude, 1);
    writeNumber(player.castSpeedCost, hasCondensedUpgrade(11) ? 0 : 1000);
}

export function applyCondensedResetStartingValues(): void {
    if (hasCondensedUpgrade(7)) writeDecimal(player.mana, 1, 1, 20);
    else writeNumber(player.mana, hasTierOneAchievement(8) ? 500 : 10);
    applyCondensedMasteryMinimum();
}

export function applyCondensedMasteryMinimum(): void {
    if (hasCondensedUpgrade(10) && !gt(player.masteryOwned, 0)) {
        writeNumber(player.masteryOwned, 1);
        refreshMasteryDerivedState();
        refreshMatrixDerivedState();
        refreshMasteryDerivedState();
    }
}

/** [/WASM] */

refreshMasteryDerivedState();
refreshMatrixDerivedState();
refreshMasteryDerivedState();
