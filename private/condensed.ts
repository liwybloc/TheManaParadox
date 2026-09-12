import { addInto, addUS, copyInto, createDecimal, createZero, divInto, divUS, floorInto, gt, gte, log10Into, lte, multiplyInto, mulUS, powInto, subUS, writeDecimal, writeNumber } from "./break_eternity.js";
import { unlockTierOneAchievement } from "./achievements.js";
import type { Player } from "./player.js";
import type { Scratch } from "./scratch.js";

type CondensedUpgradeDefinition = {
    slot: number;
    title: string;
    cost: [number, number, number];
    repeatable?: boolean;
    amountHandle?: i32;
    effectHandle?: i32;
}

export const CONDENSED_HANDLES = {
    gainMultiplierBought: createZero(),
    gainMultiplier: createDecimal(1, 0, 1),
};

const CONDENSED_UPGRADE_DEFINITIONS: CondensedUpgradeDefinition[] = [
    { slot: 0,  title: "Increase Mana Conduit per-purchase multipler by +0.1x", cost: [1, 0, 1] },
    { slot: 4,  title: "Increase Cast Speed power by +0.25x", cost: [1, 0, 1] },

    { slot: 5,  title: "Mana Conduits produce x2 more", cost: [1, 0, 1]},
    { slot: 6,  title: "Conduit Conjugations produce x2 more", cost: [1, 0, 2]},
    { slot: 7,  title: "Manufacture Staffs produce 5x more", cost: [1, 0, 3]},
    { slot: 8,  title: "Creation Manufactories produce 2x more", cost: [1, 0, 2]},
    { slot: 9,  title: "Conjugation Creations prdouce 2x more", cost: [1, 0, 1]},

    { slot: 10, title: "Start each reset with 1e20 mana", cost: [1, 0, 100] },
    { slot: 11, title: "Decrease cast speed cost growth to ^1.9", cost: [1, 0, 100] },

    { slot: 13, title: "Decrease empowerment cost growth to ^1.9", cost: [1, 0, 100] },
    { slot: 14, title: "Start each reset at Mastery Level 2", cost: [1, 0, 100] },

    { slot: 15, title: "First Cast Speed is free", cost: [1, 0, 10] },
    { slot: 16, title: "Courage duration is increased by 100%", cost: [1, 0, 10] },
    { slot: 17, title: "Mana is increased based on condensed mana\n(Currently: {condensedManaBuff})", cost: [1, 0, 10] },
    { slot: 18, title: "Courage cooldown is decreased by 25%", cost: [1, 0, 10] },
    { slot: 19, title: "Mastery magnitude effect is increased based on Crystal Matrix effect", cost: [1, 0, 10] },

    { slot: 21, title: "Empowerments are x5 stronger", cost: [1, 0, 1024] },
    { slot: 22, title: "Cast Speed power is slightly increased based on Mastery level\n(Currently: {masteryCastPowerBuff})", cost: [1, 0, 1024] },
    { slot: 23, title: "Condensed Mana boosts Courage power\n(Currently: {condensedCourageBuff})", cost: [1, 0, 1024] },
    
    {
        slot: 12,
        title: "Multiply condensed mana gain by x2",
        cost: [1, 0, 10],
        repeatable: true,
        amountHandle: CONDENSED_HANDLES.gainMultiplierBought,
        effectHandle: CONDENSED_HANDLES.gainMultiplier,
    },
];

export const CONDENSED_UPGRADES = CONDENSED_UPGRADE_DEFINITIONS.map((upgrade) => {
    return { ...upgrade, costHandle: createDecimal(...upgrade.cost) };
});
export const CONDENSED_UPGRADE_COUNT = CONDENSED_UPGRADES.length;
export const CONDENSED_UPGRADE_PLACEHOLDERS = {
    condensedManaBuff: { handle: createDecimal(1, 0, 1), prefix: "×" },
    masteryCastPowerBuff: { handle: createDecimal(1, 0, 1), prefix: "+" },
    condensedCourageBuff: { handle: createDecimal(1, 0, 1), prefix: "×" },
};

declare const player: Player;
declare const scratch: Scratch;

/** [WASM] */

const CONDENSED_UPGRADE_COUNT_WASM: i32 = 20;
const condensedUpgrades = new StaticArray<u8>(CONDENSED_UPGRADE_COUNT_WASM);
const condensedUpgradeCosts = new StaticArray<i32>(CONDENSED_UPGRADE_COUNT_WASM);
let condensedGainMultiplierBought: i32 = 0;
let condensedGainMultiplier: i32 = 0;
let condensedManaBuff: i32 = 0;
let masteryCastPowerBuff: i32 = 0;
let condensedCourageBuff: i32 = 0;

export function initializeCondensedHandles(
    gainMultiplierBought: i32,
    gainMultiplier: i32,
    manaBuff: i32,
    castPowerBuff: i32,
    courageBuff: i32,
): void {
    condensedGainMultiplierBought = gainMultiplierBought;
    condensedGainMultiplier = gainMultiplier;
    condensedManaBuff = manaBuff;
    masteryCastPowerBuff = castPowerBuff;
    condensedCourageBuff = courageBuff;
}

export function initializeCondensedUpgradeCost(index: i32, costHandle: i32): void {
    if (index < 0 || index >= CONDENSED_UPGRADE_COUNT_WASM) return;
    condensedUpgradeCosts[index] = costHandle;
}

export function canCondense(): bool {
    writeDecimal(scratch.productionModifier, 1, 1, 308.25471555991675);
    return gte(player.mana, scratch.productionModifier);
}

export function calculateCondenseGain(): bool {
    if (!canCondense()) return false;
    if (!gt(player.statistics_fastestCondense, 0)
        || gt(player.statistics_fastestCondense, player.statistics_timeThisCondense)) {
        copyInto(player.statistics_fastestCondense, player.statistics_timeThisCondense);
    }
    writeNumber(scratch.productionModifier, 1800);
    if (gt(scratch.productionModifier, player.statistics_timeThisCondense)) unlockTierOneAchievement(15);
    writeNumber(scratch.productionModifier, 1);
    if (lte(player.bolsterMultiplier, scratch.productionModifier)) unlockTierOneAchievement(17);
    log10Into(scratch.condenseGain, player.mana);
    writeNumber(scratch.productionModifier, 308);
    divUS(scratch.condenseGain, scratch.productionModifier);
    floorInto(scratch.condenseGain, scratch.condenseGain);
    mulUS(scratch.condenseGain, condensedGainMultiplier);
    addUS(player.statistics_condensedManaProduced, scratch.condenseGain);
    addUS(scratch.condenseGain, player.condensedMana);
    return true;
}

export function completeCondense(): void {
    addUS(player.condensedMana, scratch.condenseGain);
    addUS(player.statistics_condenses, 1);
    if (gte(player.statistics_condenses, 50)) unlockTierOneAchievement(18);
    player.hasCondensed = true;
}

export function hasCondensed(): bool {
    return player.hasCondensed;
}

export function setHasCondensed(value: bool): void {
    player.hasCondensed = value;
}

export function hasCondensedUpgrade(index: i32): bool {
    if (index === CONDENSED_UPGRADE_COUNT_WASM - 1) return gt(condensedGainMultiplierBought, 0);
    return index >= 0 && index < CONDENSED_UPGRADE_COUNT_WASM && condensedUpgrades[index] !== 0;
}

export function setCondensedUpgrade(index: i32, purchased: bool): void {
    if (index < 0 || index >= CONDENSED_UPGRADE_COUNT_WASM) return;
    condensedUpgrades[index] = purchased ? 1 : 0;
}

export function condensedUpgradeCostHandle(index: i32): i32 {
    if (index < 0 || index >= CONDENSED_UPGRADE_COUNT_WASM) return 0;
    return condensedUpgradeCosts[index];
}

export function canBuyCondensedUpgrade(index: i32): bool {
    return (index === CONDENSED_UPGRADE_COUNT_WASM - 1 || !hasCondensedUpgrade(index))
        && gte(player.condensedMana, condensedUpgradeCostHandle(index));
}

export function buyCondensedUpgrade(index: i32): bool {
    if (!canBuyCondensedUpgrade(index)) return false;
    subUS(player.condensedMana, condensedUpgradeCostHandle(index));
    if (index === CONDENSED_UPGRADE_COUNT_WASM - 1) {
        addUS(condensedGainMultiplierBought, 1);
        refreshCondensedUpgradeState();
        return true;
    }
    setCondensedUpgrade(index, true);
    return true;
}

export function refreshCondensedUpgradeState(): void {
    powInto(condensedGainMultiplier, 2, condensedGainMultiplierBought);
    const repeatableCost = condensedUpgradeCosts[CONDENSED_UPGRADE_COUNT_WASM - 1];
    powInto(repeatableCost, 10, condensedGainMultiplierBought);
    mulUS(repeatableCost, 10);

    addInto(condensedManaBuff, player.condensedMana, 1);
    divInto(masteryCastPowerBuff, player.masteryLevel, 50);
    addInto(condensedCourageBuff, player.condensedMana, 1);
    log10Into(condensedCourageBuff, condensedCourageBuff);
    addUS(condensedCourageBuff, 1);
}

/** [/WASM] */

for (let index = 0; index < CONDENSED_UPGRADES.length; index++) {
    initializeCondensedUpgradeCost(index, CONDENSED_UPGRADES[index].costHandle);
}
initializeCondensedHandles(
    CONDENSED_HANDLES.gainMultiplierBought,
    CONDENSED_HANDLES.gainMultiplier,
    CONDENSED_UPGRADE_PLACEHOLDERS.condensedManaBuff.handle,
    CONDENSED_UPGRADE_PLACEHOLDERS.masteryCastPowerBuff.handle,
    CONDENSED_UPGRADE_PLACEHOLDERS.condensedCourageBuff.handle,
);
refreshCondensedUpgradeState();
