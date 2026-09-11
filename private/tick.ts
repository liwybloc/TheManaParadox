import { addUS, gt, lte, multiplyInto, subUS, writeNumber } from "./break_eternity.js";
import { HANDLES } from "./player.js";

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

function tickProduction(deltaMilliseconds: f64): void {
    writeNumber(secondsHandle, deltaMilliseconds / 1000);
    applyCastSpeed();
    for (let entity: i32 = 0; entity < productionEntityCount; entity++) {
        multiplyInto(productionHandle, entityAmountHandle[entity], secondsHandle);
        multiplyInto(productionHandle, productionHandle, entityBaseProductionHandle[entity]);
        multiplyInto(productionHandle, productionHandle, entityBaseMultiplierHandle[entity]);
        writeNumber(modifierHandle, productionMultiplierFor(entity) * speedMultiplierFor(entity));
        multiplyInto(productionHandle, productionHandle, modifierHandle);
        addUS(entityDestinationHandle[entity], productionHandle);
    }
}

function applyCastSpeed(): void {
    if (!gt(castSpeedTimerHandle, 0)) {
        writeNumber(castSpeedMagnitudeHandle, 1);
        writeNumber(castSpeedCostHandle, 1000);
        return;
    }
    if (lte(castSpeedTimerHandle, secondsHandle)) {
        writeNumber(castSpeedTimerHandle, 0);
        writeNumber(castSpeedMagnitudeHandle, 1);
        writeNumber(castSpeedCostHandle, 1000);
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

export function tick(deltaMilliseconds: f64): void {
    tickProduction(deltaMilliseconds);
}

/** [/WASM] */

initializeTick(
    HANDLES.scratch_tierOneSeconds,
    HANDLES.scratch_tierOneProduction,
    HANDLES.scratch_productionModifier,
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

const UPDATE_RATE = 33;
function runTick(timePassed = UPDATE_RATE): void {
    const start = performance.now();
    tick(timePassed);
    setTimeout(runTick, Math.max(0, UPDATE_RATE - (performance.now() - start)));
}
runTick();
