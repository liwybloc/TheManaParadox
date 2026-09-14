import { addInto, addUS, copyInto, createDecimal, createZero, divInto, divUS, eq, floorInto, gt, gte, log10Into, lt, lte, subUS, writeDecimal, writeNumber } from "../core/break_eternity.js";
import { unlockTierOneAchievement } from "./achievements.js";
import { isQuestActive } from "../guild/guild.js";
import type { Player } from "../core/player.js";
import type { Scratch } from "../core/scratch.js";

type CondensedUpgradeDefinition = {
    slot: number;
    title: string;
    cost: [number, number, number];
}

export const CONDENSED_HANDLES = {
    ascensionHallUnlocked: createZero(),
};

const CONDENSED_UPGRADE_DEFINITIONS: CondensedUpgradeDefinition[] = [
    { slot: 0,  title: "Increase Mana Absorber per-purchase multipler by +0.1x", cost: [1, 0, 1] },
    { slot: 4,  title: "Increase Cast Speed power by +0.25x", cost: [1, 0, 1] },

    { slot: 5,  title: "Mana Absorbers produce x2 more", cost: [1, 0, 1]},
    { slot: 6,  title: "Pylons produce x2 more", cost: [1, 0, 2]},
    { slot: 7,  title: "Meridians produce 5x more", cost: [1, 0, 3]},
    { slot: 8,  title: "Creation Manufactories produce 2x more", cost: [1, 0, 2]},
    { slot: 9,  title: "Conduits produce 2x more", cost: [1, 0, 1]},

    { slot: 10, title: "Start each reset with 1e20 mana", cost: [1, 0, 100] },
    { slot: 11, title: "Decrease cast speed cost growth to ^1.9", cost: [1, 0, 100] },

    { slot: 13, title: "Decrease empowerment cost growth to ^1.9", cost: [1, 0, 100] },
    { slot: 14, title: "Start each reset with 2 Sealed Meridians", cost: [1, 0, 100] },

    { slot: 15, title: "First Cast Speed is free", cost: [1, 0, 10] },
    { slot: 16, title: "Courage duration is increased by 25%", cost: [1, 0, 10] },
    { slot: 17, title: "Mana is increased based on condensed mana\n(Currently: {condensedManaBuff})", cost: [1, 0, 10] },
    { slot: 18, title: "Courage cooldown is decreased by 25%", cost: [1, 0, 10] },
    { slot: 19, title: "Sealed Meridian magnitude is increased based on Crystal Matrix effect", cost: [1, 0, 10] },

    { slot: 21, title: "Empowerments are x5 stronger", cost: [1, 0, 1024] },
    { slot: 22, title: "Cast Speed power is slightly increased based on Sealed Meridians\n(Currently: {sealedMeridiansCastPowerBuff})", cost: [1, 0, 1024] },
    { slot: 23, title: "Condensed Mana boosts Courage power\n(Currently: {condensedCourageBuff})", cost: [1, 0, 1024] },
    
    {
        slot: 12,
        title: "Unlock the Guild's Ascension Hall",
        cost: [1, 0, 8192],
    },
];

export const CONDENSED_UPGRADES = CONDENSED_UPGRADE_DEFINITIONS.map((upgrade) => {
    return { ...upgrade, costHandle: createDecimal(...upgrade.cost) };
});
export const CONDENSED_UPGRADE_COUNT = CONDENSED_UPGRADES.length;
export const CONDENSED_UPGRADE_PLACEHOLDERS = {
    condensedManaBuff: { handle: createDecimal(1, 0, 1), prefix: "×" },
    sealedMeridiansCastPowerBuff: { handle: createDecimal(1, 0, 1), prefix: "+" },
    condensedCourageBuff: { handle: createDecimal(1, 0, 1), prefix: "×" },
};

declare const player: Player;
declare const scratch: Scratch;

/** [WASM] */

const CONDENSED_UPGRADE_COUNT_WASM: i32 = 20;
const condensedUpgrades = new StaticArray<u8>(CONDENSED_UPGRADE_COUNT_WASM);
const condensedUpgradeCosts = new StaticArray<i32>(CONDENSED_UPGRADE_COUNT_WASM);
let ascensionHallUnlocked: i32 = 0;
let condensedManaBuff: i32 = 0;
let sealedMeridiansCastPowerBuff: i32 = 0;
let condensedCourageBuff: i32 = 0;

export function initializeCondensedHandles(
    ascensionHall: i32,
    manaBuff: i32,
    castPowerBuff: i32,
    courageBuff: i32,
): void {
    ascensionHallUnlocked = ascensionHall;
    condensedManaBuff = manaBuff;
    sealedMeridiansCastPowerBuff = castPowerBuff;
    condensedCourageBuff = courageBuff;
}

export function initializeCondensedUpgradeCost(index: i32, costHandle: i32): void {
    if (index < 0 || index >= CONDENSED_UPGRADE_COUNT_WASM) return;
    condensedUpgradeCosts[index] = costHandle;
}

export function canCondense(): bool {
    if (isQuestActive()) return false;
    writeDecimal(scratch.productionModifier, 1, 1, 308.25471555991675);
    return gte(player.mana, scratch.productionModifier);
}

export function calculateCondenseGain(): bool {
    if (!canCondense()) return false;
    if (!player.castSpeedUsedThisCondense) unlockTierOneAchievement(21);
    if (!player.potionUsedThisCondense) unlockTierOneAchievement(30);
    if (!player.boostedProducerThisCondense) unlockTierOneAchievement(33);
    if (!gt(player.statistics_fastestCondense, 0)
        || gt(player.statistics_fastestCondense, player.statistics_timeThisCondense)) {
        copyInto(player.statistics_fastestCondense, player.statistics_timeThisCondense);
    }
    if (lt(player.statistics_timeThisCondense, 60)) unlockTierOneAchievement(15);
    writeNumber(scratch.productionModifier, 1);
    if (lte(player.purifiedMeridiansMultiplier, scratch.productionModifier)) unlockTierOneAchievement(17);
    if (eq(player.mana_circle_tier, 0)) {
        writeNumber(scratch.condenseGain, 1);
    } else {
        log10Into(scratch.condenseGain, player.mana);
        writeNumber(scratch.productionModifier, 308);
        divUS(scratch.condenseGain, scratch.productionModifier);
        floorInto(scratch.condenseGain, scratch.condenseGain);
    }
    addUS(player.statistics_condensedManaProduced, scratch.condenseGain);
    return true;
}

export function completeCondense(): void {
    addUS(player.condensedMana, scratch.condenseGain);
    addUS(player.statistics_condenses, 1);
    if (gte(player.condensedMana, 10)) unlockTierOneAchievement(22);
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
    if (index === CONDENSED_UPGRADE_COUNT_WASM - 1) return gt(ascensionHallUnlocked, 0);
    return index >= 0 && index < CONDENSED_UPGRADE_COUNT_WASM && condensedUpgrades[index] !== 0;
}

export function setCondensedUpgrade(index: i32, purchased: bool): void {
    if (index < 0 || index >= CONDENSED_UPGRADE_COUNT_WASM) return;
    if (index === CONDENSED_UPGRADE_COUNT_WASM - 1) {
        writeNumber(ascensionHallUnlocked, purchased ? 1 : 0);
        return;
    }
    condensedUpgrades[index] = purchased ? 1 : 0;
}

export function isAscensionHallUnlocked(): bool {
    return hasCondensedUpgrade(CONDENSED_UPGRADE_COUNT_WASM - 1);
}

export function canSeeAscensionHallUpgrade(): bool {
    for (let index: i32 = 0; index < CONDENSED_UPGRADE_COUNT_WASM - 1; index++) {
        if (!hasCondensedUpgrade(index)) return false;
    }
    return true;
}

export function condensedUpgradeCostHandle(index: i32): i32 {
    if (index < 0 || index >= CONDENSED_UPGRADE_COUNT_WASM) return 0;
    return condensedUpgradeCosts[index];
}

export function canBuyCondensedUpgrade(index: i32): bool {
    return (index !== CONDENSED_UPGRADE_COUNT_WASM - 1 || canSeeAscensionHallUpgrade())
        && !hasCondensedUpgrade(index)
        && gte(player.condensedMana, condensedUpgradeCostHandle(index));
}

export function buyCondensedUpgrade(index: i32): bool {
    if (!canBuyCondensedUpgrade(index)) return false;
    subUS(player.condensedMana, condensedUpgradeCostHandle(index));
    setCondensedUpgrade(index, true);
    checkAllCondensedUpgradesAchievement();
    return true;
}

function checkAllCondensedUpgradesAchievement(): void {
    for (let index: i32 = 0; index < CONDENSED_UPGRADE_COUNT_WASM; index++) {
        if (!hasCondensedUpgrade(index)) return;
    }
    unlockTierOneAchievement(23);
}

export function refreshCondensedUpgradeState(): void {
    addInto(condensedManaBuff, player.condensedMana, 1);
    divInto(sealedMeridiansCastPowerBuff, player.sealedMeridians, 50);
    addInto(condensedCourageBuff, player.condensedMana, 1);
    log10Into(condensedCourageBuff, condensedCourageBuff);
    addUS(condensedCourageBuff, 1);
}

/** [/WASM] */

for (let index = 0; index < CONDENSED_UPGRADES.length; index++) {
    initializeCondensedUpgradeCost(index, CONDENSED_UPGRADES[index].costHandle);
}
initializeCondensedHandles(
    CONDENSED_HANDLES.ascensionHallUnlocked,
    CONDENSED_UPGRADE_PLACEHOLDERS.condensedManaBuff.handle,
    CONDENSED_UPGRADE_PLACEHOLDERS.sealedMeridiansCastPowerBuff.handle,
    CONDENSED_UPGRADE_PLACEHOLDERS.condensedCourageBuff.handle,
);
refreshCondensedUpgradeState();
