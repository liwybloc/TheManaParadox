import { addInto, addUS, gt, gte, multiplyInto, mulUS, powInto, powUS, roundInto, subUS, writeNumber } from "./break_eternity.js";
import { checkCastSpeedAchievements, hasTierOneAchievement, unlockTierOneAchievement } from "./achievements.js";
import { hasCondensedUpgrade } from "./condensed.js";
import type { Player } from "./player.js";
import { resetBolster, resetTierOneAmounts } from "./tier_one.js";

declare const player: Player;

/** [WASM] */

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
    checkCastSpeedAchievements();
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
}

export function resetMastery(): void {
    writeNumber(player.masteryOwned, 0);
    refreshMasteryDerivedState();
}

function resetTierOne(): void {
    writeNumber(player.mana, hasTierOneAchievement(8) ? 500 : 10);
    resetTierOneAmounts();
    resetBolster();
    resetCastSpeed();
}

export function resetCastSpeed(): void {
    writeNumber(player.castSpeedTimer, 0);
    writeNumber(player.castSpeedMagnitude, 1);
    writeNumber(player.castSpeedCost, 1000);
}

/** [/WASM] */

refreshMasteryDerivedState();
refreshMatrixDerivedState();
