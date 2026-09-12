import { gt, lte, multiplyInto, subUS, writeNumber } from "./break_eternity.js";
import { consumeTierOneRewardsChanged } from "./achievements.js";
import { addPlayerTime, gainCurrency } from "./currencies.js";
import { HANDLES } from "./player.js";
import { resetCastSpeed } from "./progression.js";
import { SCRATCH_HANDLES } from "./scratch.js";
import { refreshTierOneDerivedState } from "./tier_one.js";
import { PerformanceStats } from "./performance-stats.js";

// Hello Scarlet, what do you want?
// what do you want... do you want pets?
// oh you want food? you motherfucker...
// this is not newsticker suggestions

/** [WASM] */

const MAX_PRODUCTION_ENTITIES: i32 = 128;
const MAX_GROUPS: i32 = 32;
const MAX_MODIFIERS: i32 = 4096;

export const MODIFIER_SCOPE_GLOBAL: i32 = 0;
export const MODIFIER_SCOPE_GROUP: i32 = 1;
export const MODIFIER_SCOPE_ENTITY: i32 = 2;
export const MODIFIER_TYPE_PRODUCTION: i32 = 0;
export const MODIFIER_TYPE_COST: i32 = 1;
export const MODIFIER_TYPE_SPEED: i32 = 2;
export const GENERATOR_GROUP: i32 = 0;

const entityAmountHandle = new StaticArray<i32>(MAX_PRODUCTION_ENTITIES);
const entityDestinationHandle = new StaticArray<i32>(MAX_PRODUCTION_ENTITIES);
const entityBaseProductionHandle = new StaticArray<i32>(MAX_PRODUCTION_ENTITIES);
const entityBaseMultiplierHandle = new StaticArray<i32>(MAX_PRODUCTION_ENTITIES);
const entityGroup = new StaticArray<i32>(MAX_PRODUCTION_ENTITIES);

let productionEntityCount: i32 = 0;
let secondsHandle: i32 = 0;
let productionHandle: i32 = 0;
let modifierHandle: i32 = 0;
let castSpeedTimerHandle: i32 = 0;
let castSpeedMagnitudeHandle: i32 = 0;
let castSpeedCostHandle: i32 = 0;

const modifierScope = new StaticArray<i32>(MAX_MODIFIERS);
const modifierTarget = new StaticArray<i32>(MAX_MODIFIERS);
const modifierType = new StaticArray<i32>(MAX_MODIFIERS);
const modifierValue = new StaticArray<f64>(MAX_MODIFIERS);
const modifierActive = new StaticArray<u8>(MAX_MODIFIERS);
let modifierCount: i32 = 0;

let globalProductionMultiplier: f64 = 1;
let globalCostMultiplier: f64 = 1;
let globalSpeedMultiplier: f64 = 1;
const groupProductionMultiplier = new StaticArray<f64>(MAX_GROUPS);
const groupCostMultiplier = new StaticArray<f64>(MAX_GROUPS);
const groupSpeedMultiplier = new StaticArray<f64>(MAX_GROUPS);
const entityProductionMultiplier = new StaticArray<f64>(MAX_PRODUCTION_ENTITIES);
const entityCostMultiplier = new StaticArray<f64>(MAX_PRODUCTION_ENTITIES);
const entitySpeedMultiplier = new StaticArray<f64>(MAX_PRODUCTION_ENTITIES);

export function initializeTick(
    tickSecondsHandle: i32,
    tickProductionHandle: i32,
    tickModifierHandle: i32,
    speedTimerHandle: i32,
    speedMagnitudeHandle: i32,
    speedCostHandle: i32,
): void {
    secondsHandle = tickSecondsHandle;
    productionHandle = tickProductionHandle;
    modifierHandle = tickModifierHandle;
    castSpeedTimerHandle = speedTimerHandle;
    castSpeedMagnitudeHandle = speedMagnitudeHandle;
    castSpeedCostHandle = speedCostHandle;
    initializeModifierCaches();
}

export function registerProductionEntity(
    amountHandle: i32,
    destinationHandle: i32,
    baseProductionHandle: i32,
    baseMultiplierHandle: i32,
    group: i32,
): i32 {
    if (productionEntityCount >= MAX_PRODUCTION_ENTITIES) {
        throw new Error("Exceeded MAX_PRODUCTION_ENTITIES");
    }
    const entity = productionEntityCount++;
    entityAmountHandle[entity] = amountHandle;
    entityDestinationHandle[entity] = destinationHandle;
    entityBaseProductionHandle[entity] = baseProductionHandle;
    entityBaseMultiplierHandle[entity] = baseMultiplierHandle;
    entityGroup[entity] = group;
    return entity;
}

export function addModifier(scope: i32, target: i32, type: i32, value: f64): i32 {
    if (modifierCount >= MAX_MODIFIERS) throw new Error("Exceeded MAX_MODIFIERS");
    const modifier = modifierCount++;
    modifierScope[modifier] = scope;
    modifierTarget[modifier] = target;
    modifierType[modifier] = type;
    modifierValue[modifier] = value;
    modifierActive[modifier] = 1;
    refreshModifierCache(scope, target, type);
    return modifier;
}

export function removeModifier(modifier: i32): void {
    if (modifier < 0 || modifier >= modifierCount) throw new Error("Invalid modifier ID");
    if (modifierActive[modifier] === 0) return;
    modifierActive[modifier] = 0;
    refreshModifierCache(modifierScope[modifier], modifierTarget[modifier], modifierType[modifier]);
}

export function setModifierActive(modifier: i32, active: bool): void {
    if (modifier < 0 || modifier >= modifierCount) throw new Error("Invalid modifier ID");
    const value: u8 = active ? 1 : 0;
    if (modifierActive[modifier] === value) return;
    modifierActive[modifier] = value;
    refreshModifierCache(modifierScope[modifier], modifierTarget[modifier], modifierType[modifier]);
}

export function productionMultiplierFor(entity: i32): f64 {
    return globalProductionMultiplier
        * groupProductionMultiplier[entityGroup[entity]]
        * entityProductionMultiplier[entity];
}

export function costMultiplierFor(entity: i32): f64 {
    return globalCostMultiplier * groupCostMultiplier[entityGroup[entity]] * entityCostMultiplier[entity];
}

export function speedMultiplierFor(entity: i32): f64 {
    return globalSpeedMultiplier * groupSpeedMultiplier[entityGroup[entity]] * entitySpeedMultiplier[entity];
}

function tickProduction(deltaMilliseconds: f64, countTimePlayed: bool): void {
    writeNumber(secondsHandle, deltaMilliseconds / 1000);
    if (countTimePlayed) addPlayerTime(secondsHandle);
    applyCastSpeed();
    for (let entity: i32 = 0; entity < productionEntityCount; entity++) {
        multiplyInto(productionHandle, entityAmountHandle[entity], secondsHandle);
        multiplyInto(productionHandle, productionHandle, entityBaseProductionHandle[entity]);
        multiplyInto(productionHandle, productionHandle, entityBaseMultiplierHandle[entity]);
        writeNumber(modifierHandle, productionMultiplierFor(entity) * speedMultiplierFor(entity));
        multiplyInto(productionHandle, productionHandle, modifierHandle);
        gainCurrency(entityDestinationHandle[entity], productionHandle);
    }
}

function applyCastSpeed(): void {
    if (!gt(castSpeedTimerHandle, 0)) {
        writeNumber(castSpeedMagnitudeHandle, 1);
        writeNumber(castSpeedCostHandle, 1000);
        return;
    }
    if (lte(castSpeedTimerHandle, secondsHandle)) {
        resetCastSpeed();
    } else {
        subUS(castSpeedTimerHandle, secondsHandle);
    }
    multiplyInto(secondsHandle, secondsHandle, castSpeedMagnitudeHandle);
}

function initializeModifierCaches(): void {
    for (let group: i32 = 0; group < MAX_GROUPS; group++) {
        groupProductionMultiplier[group] = 1;
        groupCostMultiplier[group] = 1;
        groupSpeedMultiplier[group] = 1;
    }
    for (let entity: i32 = 0; entity < MAX_PRODUCTION_ENTITIES; entity++) {
        entityProductionMultiplier[entity] = 1;
        entityCostMultiplier[entity] = 1;
        entitySpeedMultiplier[entity] = 1;
    }
}

function refreshModifierCache(scope: i32, target: i32, type: i32): void {
    const value = calculateModifier(scope, target, type);

    switch (scope) {
        case MODIFIER_SCOPE_GLOBAL:
            switch (type) {
                case MODIFIER_TYPE_PRODUCTION:
                    globalProductionMultiplier = value;
                    break;
                case MODIFIER_TYPE_COST:
                    globalCostMultiplier = value;
                    break;
                case MODIFIER_TYPE_SPEED:
                    globalSpeedMultiplier = value;
                    break;
            }
            break;

        case MODIFIER_SCOPE_GROUP:
            switch (type) {
                case MODIFIER_TYPE_PRODUCTION:
                    groupProductionMultiplier[target] = value;
                    break;
                case MODIFIER_TYPE_COST:
                    groupCostMultiplier[target] = value;
                    break;
                case MODIFIER_TYPE_SPEED:
                    groupSpeedMultiplier[target] = value;
                    break;
            }
            break;

        default:
            switch (type) {
                case MODIFIER_TYPE_PRODUCTION:
                    entityProductionMultiplier[target] = value;
                    break;
                case MODIFIER_TYPE_COST:
                    entityCostMultiplier[target] = value;
                    break;
                case MODIFIER_TYPE_SPEED:
                    entitySpeedMultiplier[target] = value;
                    break;
            }
            break;
    }
}

function calculateModifier(scope: i32, target: i32, type: i32): f64 {
    let result: f64 = 1;
    for (let modifier: i32 = 0; modifier < modifierCount; modifier++) {
        if (modifierActive[modifier] === 0) continue;
        if (modifierScope[modifier] !== scope) continue;
        if (modifierTarget[modifier] !== target) continue;
        if (modifierType[modifier] !== type) continue;
        result *= modifierValue[modifier];
    }
    return result;
}

export function tick(deltaMilliseconds: f64, countTimePlayed: bool): void {
    tickProduction(deltaMilliseconds, countTimePlayed);
    if (consumeTierOneRewardsChanged()) refreshTierOneDerivedState();
}

export function simulateTicks(durationMilliseconds: f64, stepMilliseconds: f64, countTimePlayed: bool): void {
    if (durationMilliseconds <= 0 || stepMilliseconds <= 0) return;
    let remainingMilliseconds = durationMilliseconds;
    while (remainingMilliseconds > 0) {
        const tickMilliseconds = Math.min(stepMilliseconds, remainingMilliseconds);
        tick(tickMilliseconds, countTimePlayed);
        remainingMilliseconds -= tickMilliseconds;
    }
}

/** [/WASM] */

initializeTick(
    SCRATCH_HANDLES.tierOneSeconds,
    SCRATCH_HANDLES.tierOneProduction,
    SCRATCH_HANDLES.productionModifier,
    HANDLES.castSpeedTimer,
    HANDLES.castSpeedMagnitude,
    HANDLES.castSpeedCost,
);

registerProductionEntity(
    HANDLES.count_manufactureStaff,
    HANDLES.count_creationManufactory,
    1,
    HANDLES.multiplier_manufactureStaff,
    0,
);
registerProductionEntity(
    HANDLES.count_creationManufactory,
    HANDLES.count_conjugationCreation,
    1,
    HANDLES.multiplier_creationManufactory,
    0,
);
registerProductionEntity(
    HANDLES.count_conjugationCreation,
    HANDLES.count_conduitConjugation,
    1,
    HANDLES.multiplier_conjugationCreation,
    0,
);
registerProductionEntity(
    HANDLES.count_conduitConjugation,
    HANDLES.count_manaConduit,
    1,
    HANDLES.multiplier_conduitConjugation,
    0,
);
registerProductionEntity(
    HANDLES.count_manaConduit,
    HANDLES.mana,
    3,
    HANDLES.multiplier_manaConduit,
    0,
);

const UPDATE_RATE_STORAGE_KEY = "updateRate";
const MIN_UPDATE_RATE = 10;
const MAX_UPDATE_RATE = 200;
const DEFAULT_UPDATE_RATE = 33;
let updateRate = loadUpdateRate();
const BASE_SIMULATION_BATCH_SIZE = 5000;
const MAX_SIMULATION_BATCH_SIZE = 250_000;
const simulationListeners = new Set<(state: TimeSimulationState) => void>();
let simulationActive = false;
let simulationBatchSize = BASE_SIMULATION_BATCH_SIZE;
let simulationSkipRequested = false;
let simulationTotalMilliseconds = 0;
let simulationCompletedMilliseconds = 0;

export interface TimeSimulationState {
    readonly active: boolean;
    readonly totalSeconds: number;
    readonly simulatedSeconds: number;
    readonly progress: number;
    readonly speed: number;
}

export function getUpdateRate(): number {
    return updateRate;
}

export function setUpdateRate(value: number): number {
    updateRate = Math.max(MIN_UPDATE_RATE, Math.min(MAX_UPDATE_RATE, Math.round(value)));
    try {
        localStorage.setItem(UPDATE_RATE_STORAGE_KEY, String(updateRate));
    } catch (error) {
        console.error("Failed to save update rate", error);
    }
    return updateRate;
}

export function subscribeToTimeSimulation(listener: (state: TimeSimulationState) => void): () => void {
    simulationListeners.add(listener);
    listener(currentSimulationState());
    return () => simulationListeners.delete(listener);
}

export async function simulateTime(seconds: number, countTimePlayed = true): Promise<void> {
    if (simulationActive) return;
    const finiteSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    if (finiteSeconds === 0) return;

    simulationActive = true;
    simulationBatchSize = BASE_SIMULATION_BATCH_SIZE;
    simulationSkipRequested = false;
    simulationTotalMilliseconds = finiteSeconds * 1000;
    simulationCompletedMilliseconds = 0;
    notifySimulationListeners();

    try {
        while (simulationCompletedMilliseconds < simulationTotalMilliseconds) {
            const remainingMilliseconds = simulationTotalMilliseconds - simulationCompletedMilliseconds;
            if (simulationSkipRequested) {
                tick(remainingMilliseconds, countTimePlayed);
                simulationCompletedMilliseconds = simulationTotalMilliseconds;
                notifySimulationListeners();
                break;
            }

            const remainingTicks = Math.ceil(remainingMilliseconds / updateRate);
            const batchTicks = Math.min(remainingTicks, simulationBatchSize);
            const batchMilliseconds = Math.min(remainingMilliseconds, batchTicks * updateRate);
            simulateTicks(batchMilliseconds, updateRate, countTimePlayed);
            simulationCompletedMilliseconds += batchMilliseconds;
            notifySimulationListeners();
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
    } finally {
        simulationActive = false;
        notifySimulationListeners();
    }
}

export function speedUpTimeSimulation(): void {
    if (!simulationActive) return;
    simulationBatchSize = Math.min(MAX_SIMULATION_BATCH_SIZE, simulationBatchSize * 5);
    notifySimulationListeners();
}

export function skipTimeSimulation(): void {
    if (simulationActive) simulationSkipRequested = true;
}

function currentSimulationState(): TimeSimulationState {
    return {
        active: simulationActive,
        totalSeconds: simulationTotalMilliseconds / 1000,
        simulatedSeconds: simulationCompletedMilliseconds / 1000,
        progress: simulationTotalMilliseconds === 0
            ? 0
            : Math.min(1, simulationCompletedMilliseconds / simulationTotalMilliseconds),
        speed: simulationBatchSize / BASE_SIMULATION_BATCH_SIZE,
    };
}

function notifySimulationListeners(): void {
    const state = currentSimulationState();
    for (const listener of simulationListeners) listener(state);
}

function loadUpdateRate(): number {
    try {
        const storedValue = localStorage.getItem(UPDATE_RATE_STORAGE_KEY);
        if (storedValue === null) return DEFAULT_UPDATE_RATE;
        const savedValue = Number(storedValue);
        if (Number.isFinite(savedValue)) {
            return Math.max(MIN_UPDATE_RATE, Math.min(MAX_UPDATE_RATE, Math.round(savedValue)));
        }
    } catch (error) {
        console.error("Failed to load update rate", error);
    }
    return DEFAULT_UPDATE_RATE;
}

let lastTickTimestamp = performance.now();

function runTick(): void {
    PerformanceStats.begin("tick");
    const start = performance.now();
    const elapsedMilliseconds = Math.max(0, start - lastTickTimestamp);
    lastTickTimestamp = start;
    if (!simulationActive) {
        if (elapsedMilliseconds > 500) {
            void simulateTime(elapsedMilliseconds / 1000, true);
        } else {
            tick(elapsedMilliseconds, true);
        }
    }
    const deltaTime = performance.now() - start;
    setTimeout(runTick, Math.max(0, updateRate - deltaTime));
    PerformanceStats.end("tick");
}

runTick();
(globalThis as any).simulateTime = simulateTime;
