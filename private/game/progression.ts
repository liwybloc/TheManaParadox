import { addInto, addUS, ceilInto, divInto, divUS, gt, gte, multiplyInto, mulUS, powInto, powUS, subUS, writeDecimal, writeNumber } from "../core/break_eternity.js";
import { checkCastSpeedAchievements, hasTierOneAchievement, unlockTierOneAchievement } from "./achievements.js";
import { hasCondensedUpgrade } from "./condensed.js";
import type { Player } from "../core/player.js";
import type { Scratch } from "../core/scratch.js";
import { resetMeridianPurification, resetTierOneAmounts } from "./tier_one.js";

declare const player: Player;
declare const scratch: Scratch;

/** [WASM] */

const CONDENSED_CAST_SPEED_POWER_BONUS: f64 = 0.25;

export function castSpeed(): bool {
    if (!canCastSpeed()) return false;
    player.castSpeedUsedThisCondense = true;
    subUS(player.mana, player.castSpeedCost);
    if (!gt(player.castSpeedTimer, 0)) {
        multiplyInto(player.castSpeedMagnitude, player.sealedMeridiansSpeedEffect, player.matrixSpeedPower);
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

export function sealMeridians(): bool {
    if (!canSealMeridians()) return false;
    player.meridianSealedThisReset = true;
    const speedIsActive = gt(player.castSpeedTimer, 0);
    addUS(player.sealedMeridiansOwned, 1);
    refreshSealedMeridiansDerivedState();
    refreshMatrixDerivedState();
    refreshSealedMeridiansDerivedState();
    if (gte(player.sealedMeridians, 5)) unlockTierOneAchievement(6);
    if (speedIsActive) mulUS(player.castSpeedMagnitude, 2);
    resetTierOne();
    return true;
}

export function canSealMeridians(): bool {
    return gte(player.count_manufactureStaff, player.sealMeridiansCost);
}

export function areSealedMeridiansVisible(): bool {
    return gt(player.sealedMeridiansOwned, 0) || gt(player.bought_manufactureStaff, 0);
}

export function refreshSealedMeridiansDerivedState(): void {
    addInto(player.sealedMeridians, player.sealedMeridiansOwned, 1);
    writeNumber(scratch.productionModifier, hasTierOneAchievement(20) ? 2.85 : 3);
    powInto(player.sealMeridiansCost, scratch.productionModifier, player.sealedMeridiansOwned);
    ceilInto(player.sealMeridiansCost, player.sealMeridiansCost);
    powInto(player.sealedMeridiansSpeedEffect, sealedMeridianMagnitudeHandle(), player.sealedMeridiansOwned);
}

export function sealedMeridianMagnitudeHandle(): i32 {
    if (hasCondensedUpgrade(15)) return player.matrixSpeedPower;
    writeNumber(scratch.productionModifier, 2);
    return scratch.productionModifier;
}

export function increaseMatrix(): bool {
    if (!canIncreaseMatrix()) return false;
    if (!player.meridianSealedThisReset) unlockTierOneAchievement(20);
    addUS(player.matrixOwned, 1);
    refreshMatrixDerivedState();
    resetTierOne();
    resetSealedMeridians();
    player.meridianSealedThisReset = false;
    return true;
}

export function canIncreaseMatrix(): bool {
    return gte(player.count_manufactureStaff, player.matrixCost);
}

export function isMatrixVisible(): bool {
    return areSealedMeridiansVisible() || gt(player.matrixOwned, 0);
}

export function refreshMatrixDerivedState(): void {
    powInto(player.matrixCost, 10, player.matrixOwned);
    mulUS(player.matrixCost, 10);
    multiplyInto(player.matrixSpeedPower, player.matrixOwned, matrixMagnitudeHandle());
    addUS(player.matrixSpeedPower, 2);
    if (hasCondensedUpgrade(1)) {
        writeNumber(scratch.productionModifier, CONDENSED_CAST_SPEED_POWER_BONUS);
        addUS(player.matrixSpeedPower, scratch.productionModifier);
    }
    if (hasCondensedUpgrade(17)) {
        addInto(scratch.productionModifier, player.sealedMeridians, 0);
        writeNumber(scratch.tierOneSeconds, 50);
        // Meditation power bonus = Sealed Meridians / 50.
        divUS(scratch.productionModifier, scratch.tierOneSeconds);
        addUS(player.matrixSpeedPower, scratch.productionModifier);
    }
}

export function matrixMagnitudeHandle(): i32 {
    writeNumber(scratch.productionModifier, 0);
    addUS(scratch.productionModifier, player.matrixPower);
    if (hasTierOneAchievement(12)) {
        writeNumber(scratch.tierOneSeconds, 0.1);
        addUS(scratch.productionModifier, scratch.tierOneSeconds);
    }
    return scratch.productionModifier;
}

export function crystalMatrixEffectHandle(): i32 {
    matrixMagnitudeHandle();
    mulUS(scratch.productionModifier, player.matrixOwned);
    return scratch.productionModifier;
}

export function matrixOtherEffectHandle(): i32 {
    writeNumber(scratch.productionModifier, 0);
    if (hasCondensedUpgrade(1)) {
        writeNumber(scratch.tierOneSeconds, CONDENSED_CAST_SPEED_POWER_BONUS);
        addUS(scratch.productionModifier, scratch.tierOneSeconds);
    }
    if (hasCondensedUpgrade(17)) {
        addInto(scratch.tierOneSeconds, player.sealedMeridians, 0);
        divUS(scratch.tierOneSeconds, 50);
        addUS(scratch.productionModifier, scratch.tierOneSeconds);
    }
    return scratch.productionModifier;
}

export function resetSealedMeridians(): void {
    writeNumber(player.sealedMeridiansOwned, hasCondensedUpgrade(10) ? 1 : 0);
    refreshSealedMeridiansDerivedState();
    refreshMatrixDerivedState();
    refreshSealedMeridiansDerivedState();
}

function resetTierOne(): void {
    if (hasCondensedUpgrade(7)) writeDecimal(player.mana, 1, 1, 20);
    else writeNumber(player.mana, hasTierOneAchievement(8) ? 500 : 10);
    resetTierOneAmounts();
    resetMeridianPurification();
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
    writeNumber(player.matrixOwned, hasTierOneAchievement(21) ? 1 : 0);
    applyCondensedSealedMeridiansMinimum();
    refreshMatrixDerivedState();
    refreshSealedMeridiansDerivedState();
}

export function applyCondensedSealedMeridiansMinimum(): void {
    if (hasCondensedUpgrade(10) && !gt(player.sealedMeridiansOwned, 0)) {
        writeNumber(player.sealedMeridiansOwned, 1);
        refreshSealedMeridiansDerivedState();
        refreshMatrixDerivedState();
        refreshSealedMeridiansDerivedState();
    }
}

export function hasSealedMeridianThisReset(): bool {
    return player.meridianSealedThisReset;
}

export function setSealedMeridianThisReset(value: bool): void {
    player.meridianSealedThisReset = value;
}

export function hasCastSpeedUsedThisCondense(): bool {
    return player.castSpeedUsedThisCondense;
}

export function setCastSpeedUsedThisCondense(value: bool): void {
    player.castSpeedUsedThisCondense = value;
}

/** [/WASM] */

refreshSealedMeridiansDerivedState();
refreshMatrixDerivedState();
refreshSealedMeridiansDerivedState();
