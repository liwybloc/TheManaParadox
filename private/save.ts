import { getLayer, getMagnitude, getSign, writeDecimal } from "./break_eternity.js";
import { checkOfflineAchievement, hasTierOneAchievement as hasAchievement, refreshAchievementRewards, setTierOneAchievement } from "./achievements.js";
import { clampManaToInfinityBoundary } from "./currencies.js";
import { isCourageUnlocked, setCourageUnlocked } from "./courage.js";
import { CONDENSED_HANDLES, CONDENSED_UPGRADE_COUNT, hasCondensed, hasCondensedUpgrade, refreshCondensedUpgradeState, setCondensedUpgrade, setHasCondensed } from "./condensed.js";
import { HANDLES } from "./player.js";
import { refreshMasteryDerivedState, refreshMatrixDerivedState } from "./progression.js";
import { refreshTierOneDerivedState } from "./tier_one.js";
import { simulateTime } from "./tick.js";

const STORAGE_KEY = "saveData";
const SAVE_PREFIX = "TheManaParadoxSaveFormat";
const CURRENT_SAVE_VERSION = "005";
const SAVE_SUFFIX = "EndOfSaveData";
const DECIMAL_BYTES = 13;
const AUTOSAVE_INTERVAL = 30_000;
export const development = window.location.href.includes("localhost");

export interface SaveValue<T> {
    value: T;
}

export interface SaveField {
    readonly byteLength: number;
    write(view: DataView, offset: number): void;
    read(view: DataView, offset: number): void;
    reset(): void;
}

const lastSaveTimestamp: SaveValue<number> = { value: 0 };

const savedHandles001: readonly i32[] = [
    HANDLES.mana,
    HANDLES.count_manaConduit,
    HANDLES.count_conduitConjugation,
    HANDLES.count_conjugationCreation,
    HANDLES.count_creationManufactory,
    HANDLES.count_manufactureStaff,
    HANDLES.bought_manaConduit,
    HANDLES.bought_conduitConjugation,
    HANDLES.bought_conjugationCreation,
    HANDLES.bought_creationManufactory,
    HANDLES.bought_manufactureStaff,
];

const savedFields001: readonly SaveField[] = savedHandles001.map((handle, index) =>
    decimalSaveField(handle, index === 0 ? [1, 0, 10] : [0, 0, 0]),
);

function achievementSaveFields(length: number, offset: number): readonly SaveField[] {
    return Array.from({ length }, (_, localIndex) => {
        const achievementIndex = localIndex + offset;
        return booleanSaveField(
            () => hasAchievement(achievementIndex),
            (unlocked) => setTierOneAchievement(achievementIndex, unlocked),
        );
    });
}

const achievementFields002 = achievementSaveFields(10, 0);
const achievementFields003 = achievementSaveFields(5, 10);
const achievementFields004 = achievementSaveFields(5, 15);
const condensedUpgradeFields = Array.from({ length: CONDENSED_UPGRADE_COUNT - 1 }, (_, index) => booleanSaveField(
    () => hasCondensedUpgrade(index),
    (purchased) => setCondensedUpgrade(index, purchased),
));
const totalManaProducedField = decimalSaveField(HANDLES.statistics_totalManaProduced, [0, 0, 0]);
const totalTimePlayedField = decimalSaveField(HANDLES.statistics_totalTimePlayed, [0, 0, 0]);
const totalClicksField = decimalSaveField(HANDLES.statistics_totalClicks, [0, 0, 0]);
const condensedGainMultiplierBoughtField = decimalSaveField(CONDENSED_HANDLES.gainMultiplierBought, [0, 0, 0]);
const totalCondensesField = decimalSaveField(HANDLES.statistics_condenses, [0, 0, 0]);
const totalCondensedManaField = decimalSaveField(HANDLES.statistics_condensedManaProduced, [0, 0, 0]);
const condensePreservedFields = new Set([
    ...achievementFields002,
    ...achievementFields003,
    ...achievementFields004,
    totalManaProducedField,
    totalTimePlayedField,
    totalClicksField,
    totalCondensesField,
    totalCondensedManaField,
    ...condensedUpgradeFields,
    condensedGainMultiplierBoughtField,
]);

const savedFields002: readonly SaveField[] = [
    ...savedFields001,
    decimalSaveField(HANDLES.castSpeedTimer, [0, 0, 0]),
    decimalSaveField(HANDLES.castSpeedMagnitude, [1, 0, 1]),
    decimalSaveField(HANDLES.castSpeedCost, [1, 0, 1000]),
    decimalSaveField(HANDLES.masteryOwned, [0, 0, 0]),
    decimalSaveField(HANDLES.matrixOwned, [0, 0, 0]),
    decimalSaveField(HANDLES.matrixPower, [1, 0, 0.5]),
    totalManaProducedField,
    totalTimePlayedField,
    decimalSaveField(HANDLES.infinity_break_index, [0, 0, 0]),
    ...achievementFields002,
];

const savedFields003: readonly SaveField[] = [
    ...savedFields002,
    decimalSaveField(HANDLES.empowerment_manaConduit, [0, 0, 0]),
    decimalSaveField(HANDLES.empowerment_conduitConjugation, [0, 0, 0]),
    decimalSaveField(HANDLES.empowerment_conjugationCreation, [0, 0, 0]),
    decimalSaveField(HANDLES.empowerment_creationManufactory, [0, 0, 0]),
    decimalSaveField(HANDLES.legacy_000, [0, 0, 0]),
    decimalSaveField(HANDLES.bolsterMultiplier, [1, 0, 1]),
    ...achievementFields003,
    totalClicksField,
    numberSaveField(lastSaveTimestamp, 0),
];

const savedFields004: readonly SaveField[] = [
    ...savedFields003,
    booleanSaveField(isCourageUnlocked, setCourageUnlocked),
    decimalSaveField(HANDLES.courageTimer, [0, 0, 0]),
    decimalSaveField(HANDLES.courageCooldown, [0, 0, 0]),
    decimalSaveField(HANDLES.condensedMana, [0, 0, 0]),
    booleanSaveField(hasCondensed, setHasCondensed),
    ...condensedUpgradeFields,
    condensedGainMultiplierBoughtField,
];

const savedFields005: readonly SaveField[] = [
    ...savedFields004,
    decimalSaveField(HANDLES.statistics_timeThisCondense, [0, 0, 0]),
    totalCondensesField,
    totalCondensedManaField,
    ...achievementFields004,
];

export function exportSave(): string {
    lastSaveTimestamp.value = Date.now();
    const bytes = new Uint8Array(totalByteLength(savedFields005));
    const view = new DataView(bytes.buffer);
    let offset = 0;
    for (const field of savedFields005) {
        field.write(view, offset);
        offset += field.byteLength;
    }
    return `${SAVE_PREFIX}${CURRENT_SAVE_VERSION}${bytesToBase64(bytes)}${SAVE_SUFFIX}`;
}

export function importSave(saveData: string): void {
    if (!saveData.startsWith(SAVE_PREFIX) || !saveData.endsWith(SAVE_SUFFIX)) {
        throw new Error("Unrecognized Mana Paradox save format");
    }
    const version = saveData.slice(SAVE_PREFIX.length, SAVE_PREFIX.length + 3);
    const encoded = saveData.slice(SAVE_PREFIX.length + 3, -SAVE_SUFFIX.length);
    switch (version) {
        case "001":
            importFields(encoded, savedFields001);
            break;
        case "002":
            importFields(encoded, savedFields002);
            break;
        case "003":
            importFields(encoded, savedFields003);
            break;
        case "004":
            importFields(encoded, savedFields004);
            break;
        case "005":
            importFields(encoded, savedFields005);
            break;
        default:
            throw new Error(`Unsupported Mana Paradox save version ${version}`);
    }
    refreshTierOneDerivedState();
    refreshMasteryDerivedState();
    refreshMatrixDerivedState();
    refreshCondensedUpgradeState();
    clampManaToInfinityBoundary();
    simulateOfflineTime();
}

function simulateOfflineTime(): void {
    const now = Date.now();
    if (lastSaveTimestamp.value <= 0 || lastSaveTimestamp.value >= now) return;
    const offlineSeconds = (now - lastSaveTimestamp.value) / 1000;
    checkOfflineAchievement(offlineSeconds);
    void simulateTime(offlineSeconds, false);
}

function importFields(encoded: string, fields: readonly SaveField[]): void {
    const bytes = base64ToBytes(encoded);
    const expectedLength = totalByteLength(fields);
    if (!development && bytes.length !== expectedLength) {
        throw new Error(`Invalid save payload length: expected ${expectedLength} bytes, received ${bytes.length}`);
    }
    for (const field of savedFields005) field.reset();
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 0;
    for (const field of fields) {
        if (offset + field.byteLength > bytes.length) break;
        field.read(view, offset);
        offset += field.byteLength;
    }
}

function totalByteLength(fields: readonly SaveField[]): number {
    return fields.reduce((total, field) => total + field.byteLength, 0);
}

export function decimalSaveField(handle: i32, defaultValue: readonly [number, number, number]): SaveField {
    return {
        byteLength: DECIMAL_BYTES,
        write: (view, offset) => writeDecimalRecord(view, offset, handle),
        read: (view, offset) => readDecimalRecord(view, offset, handle),
        reset: () => writeDecimal(handle, defaultValue[0], defaultValue[1], defaultValue[2]),
    };
}

export function booleanSaveField(
    getValue: () => boolean,
    setValue: (value: boolean) => void,
    defaultValue = false,
): SaveField {
    return {
        byteLength: 1,
        write: (view, offset) => view.setUint8(offset, getValue() ? 1 : 0),
        read: (view, offset) => {
            const value = view.getUint8(offset);
            if (value > 1) throw new Error(`Invalid saved boolean ${value}`);
            setValue(value === 1);
        },
        reset: () => setValue(defaultValue),
    };
}

export function int32SaveField(state: SaveValue<number>, defaultValue = 0): SaveField {
    return {
        byteLength: 4,
        write: (view, offset) => view.setInt32(offset, state.value, true),
        read: (view, offset) => { state.value = view.getInt32(offset, true); },
        reset: () => { state.value = defaultValue; },
    };
}

export function numberSaveField(state: SaveValue<number>, defaultValue = 0): SaveField {
    return {
        byteLength: 8,
        write: (view, offset) => view.setFloat64(offset, state.value, true),
        read: (view, offset) => { state.value = view.getFloat64(offset, true); },
        reset: () => { state.value = defaultValue; },
    };
}

export function saveGame(): void {
    try {
        localStorage.setItem(STORAGE_KEY, exportSave());
    } catch (error) {
        console.error("Failed to save The Mana Paradox", error);
    }
}

export function resetGame(): void {
    for (const field of savedFields005) field.reset();
    refreshAchievementRewards();
    refreshTierOneDerivedState();
    refreshMasteryDerivedState();
    refreshMatrixDerivedState();
    refreshCondensedUpgradeState();
    clampManaToInfinityBoundary();
    localStorage.removeItem(STORAGE_KEY);
    saveGame();
}

export function resetForCondense(): void {
    for (const field of savedFields005) {
        if (!condensePreservedFields.has(field)) field.reset();
    }
    refreshAchievementRewards();
    refreshTierOneDerivedState();
    refreshMasteryDerivedState();
    refreshMatrixDerivedState();
    refreshCondensedUpgradeState();
    clampManaToInfinityBoundary();
}

export function loadGame(): boolean {
    const saveData = localStorage.getItem(STORAGE_KEY);
    if (!saveData) return false;
    try {
        importSave(saveData);
        return true;
    } catch (error) {
        console.error("Failed to load The Mana Paradox save", error);
        return false;
    }
}

function writeDecimalRecord(view: DataView, offset: number, handle: i32): void {
    const layer = getLayer(handle);
    const sign = getSign(handle);
    if (!Number.isInteger(layer) || layer < -0x80000000 || layer > 0x7fffffff) {
        throw new Error(`Decimal layer ${layer} cannot be represented by the save format`);
    }
    if (sign !== -1 && sign !== 0 && sign !== 1) {
        throw new Error(`Decimal sign ${sign} cannot be represented by the save format`);
    }
    view.setInt32(offset, layer, true);
    view.setInt8(offset + 4, sign);
    view.setFloat64(offset + 5, getMagnitude(handle), true);
}

function readDecimalRecord(view: DataView, offset: number, handle: i32): void {
    const layer = view.getInt32(offset, true);
    const sign = view.getInt8(offset + 4);
    const magnitude = view.getFloat64(offset + 5, true);
    if (sign !== -1 && sign !== 0 && sign !== 1) throw new Error(`Invalid Decimal sign ${sign}`);
    writeDecimal(handle, sign, layer, magnitude);
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";
    const chunkSize = 8192;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(binary);
}

function base64ToBytes(encoded: string): Uint8Array {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return bytes;
}

loadGame();
(window as any).saveGame = saveGame;
window.setInterval(saveGame, AUTOSAVE_INTERVAL);
window.addEventListener("pagehide", saveGame);
