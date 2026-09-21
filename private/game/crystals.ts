import { addUS, copyInto, createDecimal, createZero, gte, multiplyInto, mulUS, powUS, toNumber } from "../core/break_eternity.js";
import type { Player } from "../core/player.js";
import { hasTierOneAchievement } from "./achievements.js";

export interface CrystalDefinition {
    readonly id: number;
    readonly color: string;
    readonly variant: number;
    readonly effects: readonly string[];
    readonly rewards: readonly string[];
    readonly possible?: boolean;
    readonly locked?: boolean;
}

const CRYSTAL_GOAL_EXPONENTS = [
    1600, 4500, 450, 40, 200,
    2500, 25000, 40000, 65000, 100000,
    160000, 250000, 400000, 650000, 1000000,
] as const;

export const CRYSTAL_GOALS: readonly i32[] = CRYSTAL_GOAL_EXPONENTS.map((exponent) =>
    createDecimal(1, 1, exponent)
);

export const CRYSTALS: readonly CrystalDefinition[] = [
    { id: 1,  color: "#a8f5ff", variant: 1, effects: ["Mana production is raised to ^0.9."], rewards: ["Mana production is ×10 stronger."] },
    { id: 2,  color: "#77ddff", variant: 2, effects: ["Empowerments are disabled", "Crystal Matrices are disabled"], rewards: ["Empowerments are buffed based on Crystal Matrices (×{empowermentCMBuff})"] },
    { id: 3,  color: "#49b7f2", variant: 3, effects: ["Only producers are enabled"], rewards: ["Unlock Memories"] },
    { id: 4,  color: "#2877d2", variant: 4, effects: ["Only Mana Absorbers are available", "Sealed Meridians and Crystal Matrix costs are modified", "Start with 10 mana"], rewards: ["Mana Absorbers are buffed based on Sealed Meridians (×{manaAbsorberSMBuff})"] },
    { id: 5,  color: "#173b91", variant: 5, effects: ["Per-boost multiplier is fixed to ×1.1"], rewards: ["Per-boost multiplier is increased by +0.05×"] },
    { id: 6,  color: "#422d83", variant: 1, effects: ["All multipliers are raised ^0.1"], rewards: ["×10 All Production"], possible: false, locked: true },
    { id: 7,  color: "#78265f", variant: 2, effects: ["Placeholder", "Placeholder", "Placeholder"], rewards: ["Placeholder."], possible: false },
    { id: 8,  color: "#ae2d48", variant: 3, effects: ["Placeholder", "Placeholder", "Placeholder"], rewards: ["Placeholder"], possible: false },
    { id: 9,  color: "#dc3d32", variant: 4, effects: ["Placeholder", "Placeholder"], rewards: ["Placeholder"], possible: false },
    { id: 10, color: "#eb612d", variant: 5, effects: ["Placeholder", "Placeholder"], rewards: ["Placeholder"], possible: false },
    { id: 11, color: "#f1812e", variant: 1, effects: ["Placeholder", "Placeholder"], rewards: ["Placeholder"], possible: false },
    { id: 12, color: "#f5a83c", variant: 2, effects: ["Placeholder", "Placeholder", "Placeholder"], rewards: ["Placeholder"], possible: false },
    { id: 13, color: "#f5c76f", variant: 3, effects: ["Placeholder", "Placeholder", "Placeholder"], rewards: ["Placeholder"], possible: false },
    { id: 14, color: "#fae5b5", variant: 4, effects: ["Placeholder", "Placeholder", "Placeholder"], rewards: ["Placeholder"], possible: false },
    { id: 15, color: "#ffffff", variant: 5, effects: ["Placeholder", "Placeholder", "Placeholder"], rewards: ["Placeholder", "Placeholder"], possible: false },
];

const unusedEffectHandle = createZero();
const unusedRewardHandle = createZero();
const crystalTwoEmpowermentBuff = createZero();
const crystalFourManaAbsorberBuff = createZero();
const crystalEffectHandles = [
    createDecimal(1, 0, 0.9), unusedEffectHandle, unusedEffectHandle,
    createDecimal(1, 0, 1), createDecimal(1, 0, 1), createDecimal(1, 0, 0.1),
    ...Array(6).fill(unusedEffectHandle),
    createDecimal(1, 0, 1.1), unusedEffectHandle, unusedEffectHandle,
    ...Array(CRYSTALS.length * 3 - 15).fill(unusedEffectHandle),
];
const crystalRewardHandles = [
    createDecimal(1, 0, 10), unusedRewardHandle, unusedRewardHandle,
    crystalTwoEmpowermentBuff, unusedRewardHandle, unusedRewardHandle,
    unusedRewardHandle, unusedRewardHandle, unusedRewardHandle,
    crystalFourManaAbsorberBuff, unusedRewardHandle, unusedRewardHandle,
    createDecimal(1, 0, 0.05), unusedRewardHandle, unusedRewardHandle,
    ...Array(CRYSTALS.length * 3 - 15).fill(unusedRewardHandle),
];

declare const player: Player;

/** [WASM] */

const CRYSTAL_COUNT: i32 = 15;
const CRYSTAL_VALUE_COUNT: i32 = 3;
let activeCrystal: i32 = -1;
const completedCrystals = new StaticArray<u8>(CRYSTAL_COUNT);
const fastestCrystalShatters = new StaticArray<f64>(CRYSTAL_COUNT);
const possibleCrystals = new StaticArray<u8>(CRYSTAL_COUNT);
const permanentlyLockedCrystals = new StaticArray<u8>(CRYSTAL_COUNT);
const crystalGoalHandles = new StaticArray<i32>(CRYSTAL_COUNT);
const effectHandles = new StaticArray<i32>(CRYSTAL_COUNT * CRYSTAL_VALUE_COUNT);
const rewardHandles = new StaticArray<i32>(CRYSTAL_COUNT * CRYSTAL_VALUE_COUNT);

export function initializeCrystal(
    index: i32,
    goalHandle: i32,
    possible: bool,
    permanentlyLocked: bool,
    effect0: i32,
    effect1: i32,
    effect2: i32,
    reward0: i32,
    reward1: i32,
    reward2: i32,
): void {
    if (index < 0 || index >= CRYSTAL_COUNT) return;
    crystalGoalHandles[index] = goalHandle;
    possibleCrystals[index] = possible ? 1 : 0;
    permanentlyLockedCrystals[index] = permanentlyLocked ? 1 : 0;
    const offset = index * CRYSTAL_VALUE_COUNT;
    effectHandles[offset] = effect0;
    effectHandles[offset + 1] = effect1;
    effectHandles[offset + 2] = effect2;
    rewardHandles[offset] = reward0;
    rewardHandles[offset + 1] = reward1;
    rewardHandles[offset + 2] = reward2;
}

export function crystalGoalHandle(index: i32): i32 {
    return index >= 0 && index < CRYSTAL_COUNT ? crystalGoalHandles[index] : 0;
}

export function crystalEffectHandle(index: i32, slot: i32): i32 {
    if (index < 0 || index >= CRYSTAL_COUNT || slot < 0 || slot >= CRYSTAL_VALUE_COUNT) return 0;
    return effectHandles[index * CRYSTAL_VALUE_COUNT + slot];
}

export function crystalRewardHandle(index: i32, slot: i32): i32 {
    if (index < 0 || index >= CRYSTAL_COUNT || slot < 0 || slot >= CRYSTAL_VALUE_COUNT) return 0;
    return rewardHandles[index * CRYSTAL_VALUE_COUNT + slot];
}

export function getActiveCrystal(): i32 {
    return activeCrystal;
}

export function setActiveCrystal(index: i32): void {
    activeCrystal = index >= 0 && index < CRYSTAL_COUNT ? index : -1;
}

export function isCrystalActive(): bool {
    return activeCrystal >= 0;
}

export function isSpecificCrystalActive(index: i32): bool {
    return activeCrystal === index;
}

export function isProducerOnlyCrystalActive(): bool {
    return activeCrystal === 2;
}

export function isManaAbsorberOnlyCrystalActive(): bool {
    return activeCrystal === 3;
}

export function isCrystalUnlocked(index: i32): bool {
    if (index < 0 || index >= CRYSTAL_COUNT || permanentlyLockedCrystals[index] !== 0) return false;
    return index === 0 || hasCompletedCrystal(index - 1);
}

export function enterCrystal(index: i32): bool {
    if (!isCrystalUnlocked(index) || activeCrystal >= 0) return false;
    activeCrystal = index;
    return true;
}

export function escapeCrystal(): bool {
    if (activeCrystal < 0) return false;
    activeCrystal = -1;
    return true;
}

export function hasCompletedCrystal(index: i32): bool {
    return index >= 0 && index < CRYSTAL_COUNT && completedCrystals[index] !== 0;
}

export function setCompletedCrystal(index: i32, completed: bool): void {
    if (index < 0 || index >= CRYSTAL_COUNT) return;
    completedCrystals[index] = completed ? 1 : 0;
}

export function getFastestCrystalShatter(index: i32): f64 {
    return index >= 0 && index < CRYSTAL_COUNT ? fastestCrystalShatters[index] : 0;
}

export function setFastestCrystalShatter(index: i32, seconds: f64): void {
    if (index < 0 || index >= CRYSTAL_COUNT) return;
    fastestCrystalShatters[index] = Math.max(0, seconds);
}

export function isActiveCrystalGoalReached(): bool {
    return activeCrystal >= 0 && gte(player.mana, crystalGoalHandle(activeCrystal));
}

export function clampManaToActiveCrystalGoal(): void {
    if (activeCrystal >= 0 && possibleCrystals[activeCrystal] !== 0 && isActiveCrystalGoalReached()) {
        copyInto(player.mana, crystalGoalHandle(activeCrystal));
    }
}

export function canShatterActiveCrystal(): bool {
    return activeCrystal >= 0
        && possibleCrystals[activeCrystal] !== 0
        && isActiveCrystalGoalReached();
}

export function shatterActiveCrystal(): bool {
    if (!canShatterActiveCrystal()) return false;
    const elapsed = toNumber(player.statistics_timeThisCondense);
    const fastest = fastestCrystalShatters[activeCrystal];
    if (fastest <= 0 || elapsed < fastest) fastestCrystalShatters[activeCrystal] = elapsed;
    completedCrystals[activeCrystal] = 1;
    activeCrystal = -1;
    return true;
}

export function applyCrystalManaGainModifiers(amount: i32): void {
    if (activeCrystal === 0) powUS(amount, crystalEffectHandle(0, 0));
    if (hasCompletedCrystal(0)) mulUS(amount, crystalRewardHandle(0, 0));
}

export function refreshCrystalRewardEffects(): void {
    copyInto(crystalRewardHandle(1, 0), player.matrixPower);
    if (hasTierOneAchievement(12)) addUS(crystalRewardHandle(1, 0), crystalEffectHandle(1, 2));
    multiplyInto(crystalRewardHandle(1, 0), crystalRewardHandle(1, 0), player.matrixOwned);
    mulUS(crystalRewardHandle(1, 0), 2);
    addUS(crystalRewardHandle(1, 0), 1);

    copyInto(crystalRewardHandle(3, 0), player.sealedMeridiansSpeedEffect);
    powUS(crystalRewardHandle(3, 0), 2);
}

/** [/WASM] */

for (let index = 0; index < CRYSTALS.length; index++) {
    const offset = index * 3;
    initializeCrystal(
        index,
        CRYSTAL_GOALS[index],
        CRYSTALS[index].possible ?? true,
        CRYSTALS[index].locked ?? false,
        crystalEffectHandles[offset],
        crystalEffectHandles[offset + 1],
        crystalEffectHandles[offset + 2],
        crystalRewardHandles[offset],
        crystalRewardHandles[offset + 1],
        crystalRewardHandles[offset + 2],
    );
}
refreshCrystalRewardEffects();
