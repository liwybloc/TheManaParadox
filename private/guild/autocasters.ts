import { addUS, gte, subUS } from "../core/break_eternity.js";
import { canCondense } from "../game/condensed.js";
import { increaseMatrix, sealMeridians } from "../game/progression.js";
import { buyMaxTierOne, buyTierOne, canPurifyMeridiansAtRelativeMultiplier, empowerTierOne, purifyMeridians } from "../game/tier_one.js";
import type { Player } from "../core/player.js";
import { checkCoinAchievements, hasTierOneAchievement, unlockTierOneAchievement } from "../game/achievements.js";

declare const player: Player;

/** [WASM] */

const MAX_AUTOCASTERS: i32 = 9;
const AUTOCASTER_TASK_COUNT: i32 = 9;
const WAGE_PERIOD_SECONDS: f64 = 600;
const UNASSIGNED: i32 = -1;

const tiers = new StaticArray<i32>(MAX_AUTOCASTERS);
const nameIndices = new StaticArray<i32>(MAX_AUTOCASTERS);
const assignments = new StaticArray<i32>(MAX_AUTOCASTERS);
const rosterPositions = new StaticArray<i32>(MAX_AUTOCASTERS);
const actionCooldowns = new StaticArray<f64>(MAX_AUTOCASTERS);
const wageTimers = new StaticArray<f64>(MAX_AUTOCASTERS);
const workedThisPeriod = new StaticArray<u8>(MAX_AUTOCASTERS);
let autoCondenseRequested: bool = false;
const producerCastOne = new StaticArray<u8>(5);
let purifyMinimumRelativeMultiplier: f64 = 1.01;

export function isAutocasterHired(index: i32): bool {
    return isValidCaster(index) && tiers[index] !== 0;
}

export function autocasterTier(index: i32): i32 {
    return isAutocasterHired(index) ? tiers[index] : 0;
}

export function autocasterNameIndex(index: i32): i32 {
    return isAutocasterHired(index) ? nameIndices[index] : UNASSIGNED;
}

export function autocasterAssignment(index: i32): i32 {
    return isAutocasterHired(index) ? assignments[index] : UNASSIGNED;
}

export function autocasterRosterPosition(index: i32): i32 {
    return isAutocasterHired(index) ? rosterPositions[index] : UNASSIGNED;
}

export function autocasterActionCooldown(index: i32): f64 {
    return isValidCaster(index) ? actionCooldowns[index] : 0;
}

export function autocasterWageTimer(index: i32): f64 {
    return isValidCaster(index) ? wageTimers[index] : 0;
}

export function autocasterWorkedThisPeriod(index: i32): bool {
    return isValidCaster(index) && workedThisPeriod[index] !== 0;
}

export function producerAutocasterCastsMax(index: i32): bool {
    return index >= 0 && index < 5 && producerCastOne[index] === 0;
}

export function setProducerAutocasterCastsMax(index: i32, value: bool): void {
    if (index >= 0 && index < 5) producerCastOne[index] = value ? 0 : 1;
}

export function autocasterPurifyMinimumRelativeMultiplier(): f64 {
    return purifyMinimumRelativeMultiplier;
}

export function setAutocasterPurifyMinimumRelativeMultiplier(value: f64): void {
    purifyMinimumRelativeMultiplier = Math.max(1.01, Math.min(100, value));
}

export function autocasterHireCost(tier: i32): i32 {
    switch (tier) {
        case 1: return 2;
        case 2: return 5;
        case 3: return 10;
        default: return 0;
    }
}

export function autocasterWageForTier(tier: i32): i32 {
    switch (tier) {
        case 1: return 1;
        case 2: return 2;
        case 3: return 4;
        default: return 0;
    }
}

export function canHireAutocaster(tier: i32): bool {
    return tier >= 1 && tier <= 3 && firstAvailableCaster() >= 0 && gte(player.coins, autocasterHireCost(tier));
}

export function hireAutocaster(tier: i32, nameIndex: i32): i32 {
    if (!canHireAutocaster(tier) || nameIndex < 0) return UNASSIGNED;
    const index = firstAvailableCaster();
    const position = firstAvailableRosterPosition();
    if (index < 0) return UNASSIGNED;
    subUS(player.coins, autocasterHireCost(tier));
    tiers[index] = tier;
    nameIndices[index] = nameIndex;
    assignments[index] = UNASSIGNED;
    rosterPositions[index] = position;
    actionCooldowns[index] = 0;
    wageTimers[index] = 0;
    workedThisPeriod[index] = 0;
    unlockTierOneAchievement(35);
    if (tier >= 3) unlockTierOneAchievement(37);
    return index;
}

export function assignAutocaster(caster: i32, task: i32): bool {
    if (!isAutocasterHired(caster)) return false;
    if (task === UNASSIGNED) {
        const position = firstAvailableRosterPosition();
        if (position < 0) return false;
        assignments[caster] = UNASSIGNED;
        rosterPositions[caster] = position;
        actionCooldowns[caster] = 0;
        return true;
    }
    if (!isValidTask(task) || tiers[caster] < minimumTierForTask(task) || casterAssignedToTask(task) >= 0) return false;
    assignments[caster] = task;
    rosterPositions[caster] = UNASSIGNED;
    actionCooldowns[caster] = 0;
    return true;
}

export function moveAutocaster(caster: i32, position: i32): bool {
    if (!isAutocasterHired(caster) || assignments[caster] !== UNASSIGNED || position < 0 || position >= MAX_AUTOCASTERS) return false;
    const occupant = casterAtRosterPosition(position);
    if (occupant >= 0 && occupant !== caster) return false;
    rosterPositions[caster] = position;
    return true;
}

export function sellAutocaster(caster: i32): bool {
    if (!isAutocasterHired(caster)) return false;
    const tier = tiers[caster];
    addUS(player.coins, tier === 1 ? 1 : tier === 2 ? 2 : 5);
    checkCoinAchievements();
    dismissAutocaster(caster);
    return true;
}

export function casterAssignedToTask(task: i32): i32 {
    if (!isValidTask(task)) return UNASSIGNED;
    for (let caster: i32 = 0; caster < MAX_AUTOCASTERS; caster++) {
        if (isAutocasterHired(caster) && assignments[caster] === task) return caster;
    }
    return UNASSIGNED;
}

export function updateAutocasters(deltaSeconds: f64): void {
    if (deltaSeconds <= 0) return;
    for (let caster: i32 = 0; caster < MAX_AUTOCASTERS; caster++) {
        if (!isAutocasterHired(caster)) continue;
        updateWage(caster, deltaSeconds);
        if (!isAutocasterHired(caster) || assignments[caster] < 0) continue;
        updateAction(caster, deltaSeconds);
    }
}

export function consumeAutoCondenseRequest(): bool {
    if (!autoCondenseRequested) return false;
    autoCondenseRequested = false;
    return true;
}

export function setAutocasterTier(index: i32, value: i32): void {
    if (!isValidCaster(index)) return;
    tiers[index] = value >= 1 && value <= 3 ? value : 0;
    if (tiers[index] === 0) clearCaster(index);
}
export function setAutocasterNameIndex(index: i32, value: i32): void { if (isValidCaster(index)) nameIndices[index] = value; }
export function setAutocasterAssignment(index: i32, value: i32): void { if (isValidCaster(index)) assignments[index] = value; }
export function setAutocasterRosterPosition(index: i32, value: i32): void { if (isValidCaster(index)) rosterPositions[index] = value; }
export function setAutocasterActionCooldown(index: i32, value: f64): void { if (isValidCaster(index)) actionCooldowns[index] = Math.max(0, value); }
export function setAutocasterWageTimer(index: i32, value: f64): void { if (isValidCaster(index)) wageTimers[index] = Math.max(0, value); }
export function setAutocasterWorkedThisPeriod(index: i32, value: bool): void { if (isValidCaster(index)) workedThisPeriod[index] = value ? 1 : 0; }

function updateWage(caster: i32, deltaSeconds: f64): void {
    if (wageTimers[caster] <= 0) return;
    wageTimers[caster] -= deltaSeconds;
    if (wageTimers[caster] > 0) return;
    wageTimers[caster] = 0;
    if (workedThisPeriod[caster] === 0) return;
    workedThisPeriod[caster] = 0;
    const wage = autocasterWageForTier(tiers[caster]);
    if (!gte(player.coins, wage)) {
        dismissAutocaster(caster);
        return;
    }
    subUS(player.coins, wage);
}

function updateAction(caster: i32, deltaSeconds: f64): void {
    const speedMultiplier: f64 = hasTierOneAchievement(37) ? 2 : 1;
    actionCooldowns[caster] = Math.max(0, actionCooldowns[caster] - deltaSeconds * speedMultiplier);
    if (actionCooldowns[caster] > 0) return;
    const task = assignments[caster];
    let acted = false;
    if (task < 5) {
        if (tiers[caster] >= 2 && empowerTierOne(task)) acted = true;
        if (producerAutocasterCastsMax(task) ? buyMaxTierOne(task) : buyTierOne(task)) acted = true;
    } else {
        switch (task) {
            case 5:
                if (!autoCondenseRequested && canCondense()) {
                    autoCondenseRequested = true;
                    acted = true;
                }
                break;
            case 6:
                if (canPurifyMeridiansAtRelativeMultiplier(purifyMinimumRelativeMultiplier)) acted = purifyMeridians();
                break;
            case 7: acted = sealMeridians(); break;
            case 8: acted = increaseMatrix(); break;
        }
    }
    if (!acted) return;
    actionCooldowns[caster] = baseCooldownForTask(task) / (tiers[caster] >= 3 ? 2 : 1);
    workedThisPeriod[caster] = 1;
    if (wageTimers[caster] <= 0) wageTimers[caster] = WAGE_PERIOD_SECONDS;
}

function dismissAutocaster(caster: i32): void {
    clearCaster(caster);
}

function clearCaster(caster: i32): void {
    tiers[caster] = 0;
    nameIndices[caster] = UNASSIGNED;
    assignments[caster] = UNASSIGNED;
    rosterPositions[caster] = UNASSIGNED;
    actionCooldowns[caster] = 0;
    wageTimers[caster] = 0;
    workedThisPeriod[caster] = 0;
}

function firstAvailableCaster(): i32 {
    for (let index: i32 = 0; index < MAX_AUTOCASTERS; index++) if (!isAutocasterHired(index)) return index;
    return UNASSIGNED;
}

function casterAtRosterPosition(position: i32): i32 {
    for (let caster: i32 = 0; caster < MAX_AUTOCASTERS; caster++) {
        if (isAutocasterHired(caster) && assignments[caster] === UNASSIGNED && rosterPositions[caster] === position) return caster;
    }
    return UNASSIGNED;
}

function firstAvailableRosterPosition(): i32 {
    for (let position: i32 = 0; position < MAX_AUTOCASTERS; position++) if (casterAtRosterPosition(position) < 0) return position;
    return UNASSIGNED;
}

function minimumTierForTask(task: i32): i32 { return task === 5 || task === 6 ? 2 : 1; }

function baseCooldownForTask(task: i32): f64 {
    if (task < 5) return 1;
    if (task === 5) return 30;
    if (task === 6) return 10;
    return 5;
}

function isValidCaster(index: i32): bool { return index >= 0 && index < MAX_AUTOCASTERS; }
function isValidTask(index: i32): bool { return index >= 0 && index < AUTOCASTER_TASK_COUNT; }

/** [/WASM] */
