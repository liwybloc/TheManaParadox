import { getLayer, getMagnitude, getSign, writeDecimal } from "./break_eternity.js";
import { HANDLES, refreshMasteryDerivedState, refreshTierOneDerivedState } from "./player.js";

const STORAGE_KEY = "saveData";
const SAVE_PREFIX = "TheManaParadoxSaveFormat";
const CURRENT_SAVE_VERSION = "003";
const SAVE_SUFFIX = "EndOfSaveData";
const DECIMAL_BYTES = 13;
const AUTOSAVE_INTERVAL = 30_000;

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

const savedHandles002: readonly i32[] = [
    ...savedHandles001,
    HANDLES.castSpeedTimer,
    HANDLES.castSpeedMagnitude,
    HANDLES.castSpeedCost,
];

const savedHandles003: readonly i32[] = [
    ...savedHandles002,
    HANDLES.masteryOwned,
];

export function exportSave(): string {
    const bytes = new Uint8Array(savedHandles003.length * DECIMAL_BYTES);
    const view = new DataView(bytes.buffer);
    for (let index = 0; index < savedHandles003.length; index++) {
        writeDecimalRecord(view, index * DECIMAL_BYTES, savedHandles003[index]!);
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
            importHandles(encoded, savedHandles001);
            resetCastSpeed();
            resetMastery();
            break;
        case "002":
            importHandles(encoded, savedHandles002);
            resetMastery();
            break;
        case "003":
            importHandles(encoded, savedHandles003);
            break;
        default:
            throw new Error(`Unsupported Mana Paradox save version ${version}`);
    }
    refreshTierOneDerivedState();
    refreshMasteryDerivedState();
}

function importHandles(encoded: string, handles: readonly i32[]): void {
    const bytes = base64ToBytes(encoded);
    const expectedLength = handles.length * DECIMAL_BYTES;
    if (bytes.length !== expectedLength) {
        throw new Error(`Invalid save payload length: expected ${expectedLength} bytes, received ${bytes.length}`);
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let index = 0; index < handles.length; index++) {
        readDecimalRecord(view, index * DECIMAL_BYTES, handles[index]!);
    }
}

function resetCastSpeed(): void {
    writeDecimal(HANDLES.castSpeedTimer, 0, 0, 0);
    writeDecimal(HANDLES.castSpeedMagnitude, 1, 0, 1);
    writeDecimal(HANDLES.castSpeedCost, 1, 0, 1000);
}

function resetMastery(): void {
    writeDecimal(HANDLES.masteryOwned, 0, 0, 0);
}

export function saveGame(): void {
    try {
        localStorage.setItem(STORAGE_KEY, exportSave());
    } catch (error) {
        console.error("Failed to save The Mana Paradox", error);
    }
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
