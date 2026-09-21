export interface ArmorSetEffects {
    readonly pieces: readonly [string, string, string, string];
    readonly setBonus: string;
}

export const ARMOR_SET_EFFECTS: Readonly<Record<string, ArmorSetEffects>> = {
    Apprentice: {
        pieces: ["+2% Mana production", "+4% Mana production", "+3% Mana production", "+1% Mana production"],
        setBonus: "+10% Mana production",
    },
    Ironbark: {
        pieces: ["6% less damage taken in battles", "8% less damage taken in battles", "7% less damage taken in battles", "4% less damage taken in battles"],
        setBonus: "+25% maximum Shield",
    },
    Wolfine: {
        pieces: ["+6% battle damage", "+10% battle damage", "+8% battle damage", "+6% battle damage"],
        setBonus: "+20% battle damage",
    },
    Mireguard: {
        pieces: ["+8% maximum Shield", "+14% maximum Shield", "+11% maximum Shield", "+7% maximum Shield"],
        setBonus: "Regain 20% of maximum Shield after winning a battle",
    },
    Runestone: {
        pieces: ["+5% Mana production", "+9% Mana production", "+7% Mana production", "+4% Mana production"],
        setBonus: "Crystal Matrices are 10% stronger",
    },
    Wispweave: {
        pieces: ["+2% game speed", "+4% game speed", "+3% game speed", "+1% game speed"],
        setBonus: "+10% game speed",
    },
    Arcane: {
        pieces: ["+10% Mana production", "+10% Mana production", "+10% Mana production", "+10% Mana production"],
        setBonus: "Mana production is ×1.5",
    },
    Phantom: {
        pieces: ["+5% game speed", "+5% game speed", "+5% game speed", "+5% game speed"],
        setBonus: "+25% battle damage and game speed",
    },
    Wyrmscale: {
        pieces: ["10% less damage taken in battles", "15% less damage taken in battles", "12% less damage taken in battles", "8% less damage taken in battles"],
        setBonus: "+50% maximum Shield",
    },
    "Dragon Glass": {
        pieces: ["+15% battle damage", "+25% battle damage", "+20% battle damage", "+10% battle damage"],
        setBonus: "Battle damage is ×2",
    },
};

/** [WASM] */

const EQUIPPED_ARMOR_SLOT_COUNT: i32 = 4;
const ARMOR_START: i32 = 26;
const ARMOR_SET_COUNT: i32 = 10;
const equippedItems = new StaticArray<u8>(EQUIPPED_ARMOR_SLOT_COUNT);

export function equippedItem(slot: i32): i32 {
    return slot >= 0 && slot < EQUIPPED_ARMOR_SLOT_COUNT ? equippedItems[slot] : 0;
}

export function setEquippedItem(slot: i32, item: i32): void {
    if (slot < 0 || slot >= EQUIPPED_ARMOR_SLOT_COUNT) return;
    equippedItems[slot] = <u8>item;
}

export function equipmentManaProductionMultiplier(): f64 {
    let multiplier = 1 + armorPiecePercent(0, 2, 4, 3, 1) + armorPiecePercent(4, 5, 9, 7, 4)
        + armorPiecePercent(6, 10, 10, 10, 10);
    if (hasCompleteArmorSet(0)) multiplier += 0.1;
    if (hasCompleteArmorSet(6)) multiplier *= 1.5;
    return multiplier;
}

export function equipmentBattleDamageMultiplier(): f64 {
    let multiplier = 1 + armorPiecePercent(2, 6, 10, 8, 6) + armorPiecePercent(7, 0, 0, 0, 0)
        + armorPiecePercent(9, 15, 25, 20, 10);
    if (hasCompleteArmorSet(2)) multiplier += 0.2;
    if (hasCompleteArmorSet(7)) multiplier += 0.25;
    if (hasCompleteArmorSet(9)) multiplier *= 2;
    return multiplier;
}

export function equipmentDamageTakenMultiplier(): f64 {
    const reduction = armorPiecePercent(1, 6, 8, 7, 4) + armorPiecePercent(8, 10, 15, 12, 8);
    return Math.max(0, 1 - reduction);
}

export function equipmentMaximumShieldMultiplier(): f64 {
    let multiplier = 1 + armorPiecePercent(3, 8, 14, 11, 7);
    if (hasCompleteArmorSet(1)) multiplier += 0.25;
    if (hasCompleteArmorSet(8)) multiplier += 0.5;
    return multiplier;
}

export function equipmentGameSpeedMultiplier(): f64 {
    let multiplier = 1 + armorPiecePercent(5, 2, 4, 3, 1) + armorPiecePercent(7, 5, 5, 5, 5);
    if (hasCompleteArmorSet(5)) multiplier += 0.1;
    if (hasCompleteArmorSet(7)) multiplier += 0.25;
    return multiplier;
}

export function equipmentCrystalMatrixMultiplier(): f64 {
    return hasCompleteArmorSet(4) ? 1.1 : 1;
}

export function hasMireguardSetBonus(): bool {
    return hasCompleteArmorSet(3);
}

function armorPiecePercent(set: i32, helmet: f64, chestplate: f64, leggings: f64, boots: f64): f64 {
    let percent: f64 = 0;
    if (equippedArmorSet(0) === set) percent += helmet;
    if (equippedArmorSet(1) === set) percent += chestplate;
    if (equippedArmorSet(2) === set) percent += leggings;
    if (equippedArmorSet(3) === set) percent += boots;
    return percent / 100;
}

function hasCompleteArmorSet(set: i32): bool {
    for (let slot: i32 = 0; slot < EQUIPPED_ARMOR_SLOT_COUNT; slot++) {
        if (equippedArmorSet(slot) !== set) return false;
    }
    return true;
}

function equippedArmorSet(slot: i32): i32 {
    const item = equippedItem(slot);
    if (item < ARMOR_START || item >= ARMOR_START + ARMOR_SET_COUNT * EQUIPPED_ARMOR_SLOT_COUNT) return -1;
    return (item - ARMOR_START) / EQUIPPED_ARMOR_SLOT_COUNT;
}

/** [/WASM] */
