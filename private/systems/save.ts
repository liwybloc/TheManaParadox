import { getLayer, getMagnitude, getSign, writeDecimal } from "../core/break_eternity.js";
import { checkOfflineAchievement, hasBoostedProducerThisCondense, hasCombatUsedNonFreeze, hasPotionUsedThisCondense, hasTierOneAchievement as hasAchievement, refreshAchievementRewards, setBoostedProducerThisCondense, setCombatUsedNonFreeze, setPotionUsedThisCondense, setTierOneAchievement } from "../game/achievements.js";
import { getTotalMessageTickersSeen, hasSeenMessageTicker, MESSAGE_TICKER_COUNT, setSeenMessageTicker, setTotalMessageTickersSeen } from "../game/message_tickers.js";
import { getTotalMemories, isFocusing, setFocusing, setTotalMemories } from "../game/memories.js";
import { CRYSTALS, getActiveCrystal, getFastestCrystalShatter, hasCompletedCrystal, setActiveCrystal, setCompletedCrystal, setFastestCrystalShatter } from "../game/crystals.js";
import { clampManaToInfinityBoundary } from "../game/currencies.js";
import { isCourageUnlocked, setCourageUnlocked } from "../game/courage.js";
import { CONDENSED_HANDLES, CONDENSED_UPGRADE_COUNT, hasCircleTwoCondensedUpgrade, hasCondensed, hasCondensedUpgrade, refreshCondensedUpgradeState, setCircleTwoCondensedUpgrade, setCondensedUpgrade, setHasCondensed } from "../game/condensed.js";
import { HANDLES } from "../core/player.js";
import { applyCondensedResetStartingValues, hasCastSpeedUsedThisCondense, hasSealedMeridianThisReset, refreshMatrixDerivedState, refreshSealedMeridiansDerivedState, setCastSpeedUsedThisCondense, setSealedMeridianThisReset } from "../game/progression.js";
import { refreshTierOneDerivedState } from "../game/tier_one.js";
import { simulateTime } from "./tick.js";
import { ensureInventoryPlacements, ensureShopItems, getGuildExperience, getGuildExperienceForQuestRank, getQuestRefreshRemaining, hasActivePotionEffects, hasGuildShopUpgrade, isGuildMember, isGuildUnlocked, isQuestSlotLocked, POTION_SPEED_II_TIMER_HANDLES, POTION_SPEED_III_TIMER_HANDLES, POTION_SPEED_TIMER_HANDLES, questDefinitionId, rawInventorySlot, refreshPotionEffectState, repairGuildCurrency, resetCombatSpellCosts, setGuildExperience, setGuildExperienceForQuestRank, setGuildMember, setGuildShopUpgrade, setGuildUnlocked, setQuestDefinitionId, setQuestRefreshRemaining, setQuestSlotLocked, setRawInventorySlot, setShopItemCost, setShopItemId, setShopItemRefreshTimer, shopItemCost, shopItemId, shopItemRefreshTimer } from "../guild/guild.js";
import { equippedItem, setEquippedItem } from "../guild/equipment.js";
import { autocasterActionCooldown, autocasterAssignment, autocasterNameIndex, autocasterPurifyMinimumRelativeMultiplier, autocasterRosterPosition, autocasterTier, autocasterWageTimer, autocasterWorkedThisPeriod, producerAutocasterCastsMax, setAutocasterActionCooldown, setAutocasterAssignment, setAutocasterNameIndex, setAutocasterPurifyMinimumRelativeMultiplier, setAutocasterRosterPosition, setAutocasterTier, setAutocasterWageTimer, setAutocasterWorkedThisPeriod, setProducerAutocasterCastsMax } from "../guild/autocasters.js";

const STORAGE_KEY = "saveData";
const RECOVERY_STORAGE_KEY = "saveDataRecovery";
const SAVE_PREFIX = "TheManaParadoxSaveFormat";
const CURRENT_SAVE_VERSION = "017";
const SAVE_SUFFIX = "EndOfSaveData";
const DECIMAL_BYTES = 13;
const AUTOSAVE_INTERVAL = 30_000;
export const development = window.location.href.includes("localhost");
let pendingSave: Promise<void> = Promise.resolve();
let savingEnabled = true;

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
const achievementFields007 = achievementSaveFields(5, 20);
const achievementFields008 = achievementSaveFields(5, 25);
const achievementFields009 = achievementSaveFields(5, 30);
const achievementFields011 = achievementSaveFields(5, 35);
const ascensionAchievementFields011 = achievementSaveFields(2, 40);
const achievementFields012 = achievementSaveFields(3, 42);
const achievementFields015 = achievementSaveFields(5, 45);
const messageTickerFields: readonly SaveField[] = [
    callbackNumberSaveField(getTotalMessageTickersSeen, setTotalMessageTickersSeen),
    ...Array.from({ length: MESSAGE_TICKER_COUNT }, (_, index) => booleanSaveField(
        () => hasSeenMessageTicker(index),
        (seen) => setSeenMessageTicker(index, seen),
    )),
];
const crystalFields: readonly SaveField[] = [
    callbackInt32SaveField(getActiveCrystal, setActiveCrystal, -1),
    ...CRYSTALS.map((_, index) => booleanSaveField(
        () => hasCompletedCrystal(index),
        (completed) => setCompletedCrystal(index, completed),
    )),
];
const crystalShatterTimeFields: readonly SaveField[] = CRYSTALS.map((_, index) => callbackNumberSaveField(
    () => getFastestCrystalShatter(index),
    (seconds) => setFastestCrystalShatter(index, seconds),
));
const circleTwoCondensedUpgradeFields = Array.from({ length: CONDENSED_UPGRADE_COUNT }, (_, index) => booleanSaveField(
    () => hasCircleTwoCondensedUpgrade(index),
    (purchased) => setCircleTwoCondensedUpgrade(index, purchased),
));
const condensedUpgradeFields = Array.from({ length: CONDENSED_UPGRADE_COUNT - 1 }, (_, index) => booleanSaveField(
    () => hasCondensedUpgrade(index),
    (purchased) => setCondensedUpgrade(index, purchased),
));
const totalManaProducedField = decimalSaveField(HANDLES.statistics_totalManaProduced, [0, 0, 0]);
const totalTimePlayedField = decimalSaveField(HANDLES.statistics_totalTimePlayed, [0, 0, 0]);
const gameTimePlayedField = decimalSaveField(HANDLES.statistics_gameTimePlayed, [0, 0, 0]);
const memoryFields: readonly SaveField[] = [
    callbackInt32SaveField(getTotalMemories, setTotalMemories),
    booleanSaveField(isFocusing, setFocusing),
];
const totalClicksField = decimalSaveField(HANDLES.statistics_totalClicks, [0, 0, 0]);
const ascensionHallUnlockedField = decimalSaveField(CONDENSED_HANDLES.ascensionHallUnlocked, [0, 0, 0]);
const totalCondensesField = decimalSaveField(HANDLES.statistics_condenses, [0, 0, 0]);
const totalCondensedManaField = decimalSaveField(HANDLES.statistics_condensedManaProduced, [0, 0, 0]);
const castSpeedTimerField = decimalSaveField(HANDLES.castSpeedTimer, [0, 0, 0]);
const castSpeedMagnitudeField = decimalSaveField(HANDLES.castSpeedMagnitude, [1, 0, 1]);
const castSpeedCostField = decimalSaveField(HANDLES.castSpeedCost, [1, 0, 1000]);
const sealedMeridiansOwnedField = decimalSaveField(HANDLES.sealedMeridiansOwned, [0, 0, 0]);
const matrixOwnedField = decimalSaveField(HANDLES.matrixOwned, [0, 0, 0]);
const matrixPowerField = decimalSaveField(HANDLES.matrixPower, [1, 0, 0.5]);
const infinityBreakIndexField = decimalSaveField(HANDLES.mana_circle_tier, [0, 0, 0]);
const empowermentFields = [
    decimalSaveField(HANDLES.empowerment_manaConduit, [0, 0, 0]),
    decimalSaveField(HANDLES.empowerment_conduitConjugation, [0, 0, 0]),
    decimalSaveField(HANDLES.empowerment_conjugationCreation, [0, 0, 0]),
    decimalSaveField(HANDLES.empowerment_creationManufactory, [0, 0, 0]),
    decimalSaveField(HANDLES.legacy_000, [0, 0, 0]),
];
const purifiedMeridiansMultiplierField = decimalSaveField(HANDLES.purifiedMeridiansMultiplier, [1, 0, 1]);
const courageUnlockedField = booleanSaveField(isCourageUnlocked, setCourageUnlocked);
const courageTimerField = decimalSaveField(HANDLES.courageTimer, [0, 0, 0]);
const courageCooldownField = decimalSaveField(HANDLES.courageCooldown, [0, 0, 0]);
const timeThisCondenseField = decimalSaveField(HANDLES.statistics_timeThisCondense, [0, 0, 0]);
const fastestCondenseField = decimalSaveField(HANDLES.statistics_fastestCondense, [0, 0, 0]);
const meridianSealedThisResetField = booleanSaveField(hasSealedMeridianThisReset, setSealedMeridianThisReset);
const castSpeedUsedThisCondenseField = booleanSaveField(hasCastSpeedUsedThisCondense, setCastSpeedUsedThisCondense);
const guildUnlockedField = booleanSaveField(isGuildUnlocked, setGuildUnlocked);
const guildMemberField = booleanSaveField(isGuildMember, setGuildMember);
const guildFields: readonly SaveField[] = [
    guildUnlockedField,
    guildMemberField,
    decimalSaveField(HANDLES.guildRank, [0, 0, 0]),
    decimalSaveField(HANDLES.activeQuest, [-1, 0, 1]),
    decimalSaveField(HANDLES.enemyHealth, [0, 0, 0]),
    decimalSaveField(HANDLES.combatShieldMaximum, [0, 0, 0]),
    decimalSaveField(HANDLES.combatFreezeTurns, [0, 0, 0]),
    decimalSaveField(HANDLES.fireballCost, [1, 1, 40]),
    decimalSaveField(HANDLES.whirlwindCost, [1, 1, 80]),
    decimalSaveField(HANDLES.freezeCost, [1, 1, 120]),
    decimalSaveField(HANDLES.inventoryWolfFur, [0, 0, 0]),
    decimalSaveField(HANDLES.inventoryPotionOfSpeed, [0, 0, 0]),
];
const inventorySlotFields: readonly SaveField[] = Array.from({ length: 100 }, (_, position) => callbackUint8SaveField(
    () => rawInventorySlot(position),
    (item) => setRawInventorySlot(position, item),
));
const questBoardFields: readonly SaveField[] = [
    ...Array.from({ length: 3 }, (_, index) => booleanSaveField(
        () => isQuestSlotLocked(index),
        (locked) => setQuestSlotLocked(index, locked),
    )),
    callbackNumberSaveField(getQuestRefreshRemaining, setQuestRefreshRemaining, 180),
    callbackNumberSaveField(getGuildExperience, setGuildExperience, 0),
    ...Array.from({ length: 3 }, (_, index) => callbackInt32SaveField(
        () => questDefinitionId(index),
        (id) => setQuestDefinitionId(index, id),
        index,
    )),
];
const extendedGuildFields: readonly SaveField[] = [
    ...Array.from({ length: 2 }, (_, offset) => booleanSaveField(
        () => isQuestSlotLocked(offset + 3),
        (locked) => setQuestSlotLocked(offset + 3, locked),
    )),
    ...Array.from({ length: 2 }, (_, offset) => callbackInt32SaveField(
        () => questDefinitionId(offset + 3),
        (id) => setQuestDefinitionId(offset + 3, id),
        offset + 3,
    )),
    ...Array.from({ length: 6 }, (_, index) => booleanSaveField(
        () => hasGuildShopUpgrade(index),
        (purchased) => setGuildShopUpgrade(index, purchased),
    )),
    ...Array.from({ length: 3 }, (_, index) => callbackInt32SaveField(
        () => shopItemId(index),
        (item) => setShopItemId(index, item),
        0,
    )),
    ...Array.from({ length: 3 }, (_, index) => callbackInt32SaveField(
        () => shopItemCost(index),
        (cost) => setShopItemCost(index, cost),
        0,
    )),
    ...Array.from({ length: 3 }, (_, index) => callbackNumberSaveField(
        () => shopItemRefreshTimer(index),
        (seconds) => setShopItemRefreshTimer(index, seconds),
        0,
    )),
];
const dRankGuildFields: readonly SaveField[] = [
    booleanSaveField(() => isQuestSlotLocked(5), (locked) => setQuestSlotLocked(5, locked)),
    callbackInt32SaveField(() => questDefinitionId(5), (id) => setQuestDefinitionId(5, id), 5),
    ...Array.from({ length: 3 }, (_, offset) => booleanSaveField(
        () => hasGuildShopUpgrade(offset + 6),
        (purchased) => setGuildShopUpgrade(offset + 6, purchased),
    )),
];
const potionSpeedIIITimerFields = POTION_SPEED_III_TIMER_HANDLES.map((handle) => decimalSaveField(handle, [0, 0, 0]));
const autocasterFields: readonly SaveField[] = Array.from({ length: 9 }, (_, index) => [
    callbackInt32SaveField(() => autocasterTier(index), (value) => setAutocasterTier(index, value), 0),
    callbackInt32SaveField(() => autocasterNameIndex(index), (value) => setAutocasterNameIndex(index, value), -1),
    callbackInt32SaveField(() => autocasterAssignment(index), (value) => setAutocasterAssignment(index, value), -1),
    callbackInt32SaveField(() => autocasterRosterPosition(index), (value) => setAutocasterRosterPosition(index, value), -1),
    callbackNumberSaveField(() => autocasterActionCooldown(index), (value) => setAutocasterActionCooldown(index, value), 0),
    callbackNumberSaveField(() => autocasterWageTimer(index), (value) => setAutocasterWageTimer(index, value), 0),
    booleanSaveField(() => autocasterWorkedThisPeriod(index), (value) => setAutocasterWorkedThisPeriod(index, value)),
]).flat();
const autocasterSettingFields: readonly SaveField[] = [
    ...Array.from({ length: 5 }, (_, index) => booleanSaveField(
        () => producerAutocasterCastsMax(index),
        (value) => setProducerAutocasterCastsMax(index, value),
        true,
    )),
    callbackNumberSaveField(autocasterPurifyMinimumRelativeMultiplier, setAutocasterPurifyMinimumRelativeMultiplier, 1.01),
];

const savedFields002: readonly SaveField[] = [
    ...savedFields001,
    castSpeedTimerField,
    castSpeedMagnitudeField,
    castSpeedCostField,
    sealedMeridiansOwnedField,
    matrixOwnedField,
    matrixPowerField,
    totalManaProducedField,
    totalTimePlayedField,
    infinityBreakIndexField,
    ...achievementFields002,
];

const savedFields003: readonly SaveField[] = [
    ...savedFields002,
    ...empowermentFields,
    purifiedMeridiansMultiplierField,
    ...achievementFields003,
    totalClicksField,
    numberSaveField(lastSaveTimestamp, 0),
];

const savedFields004: readonly SaveField[] = [
    ...savedFields003,
    courageUnlockedField,
    courageTimerField,
    courageCooldownField,
    decimalSaveField(HANDLES.condensedMana, [0, 0, 0]),
    booleanSaveField(hasCondensed, setHasCondensed),
    ...condensedUpgradeFields,
    ascensionHallUnlockedField,
];

const savedFields005: readonly SaveField[] = [
    ...savedFields004,
    timeThisCondenseField,
    totalCondensesField,
    totalCondensedManaField,
    ...achievementFields004,
];

const savedFields006: readonly SaveField[] = [
    ...savedFields005,
    fastestCondenseField,
];

const savedFields007: readonly SaveField[] = [
    ...savedFields006,
    ...achievementFields007,
    meridianSealedThisResetField,
    castSpeedUsedThisCondenseField,
];

const savedFields008: readonly SaveField[] = [
    ...savedFields007,
    ...guildFields,
    decimalSaveField(HANDLES.inventoryWolfFurPosition, [-1, 0, 1]),
    decimalSaveField(HANDLES.inventoryPotionPosition, [-1, 0, 1]),
    decimalSaveField(HANDLES.statistics_questsCompleted, [0, 0, 0]),
    ...achievementFields008,
    ...inventorySlotFields,
    ...questBoardFields,
    decimalSaveField(HANDLES.combatShield, [0, 0, 0]),
    decimalSaveField(HANDLES.potionSpeedTimer, [0, 0, 0]),
    ...POTION_SPEED_TIMER_HANDLES.map((handle) => decimalSaveField(handle, [0, 0, 0])),
    ...POTION_SPEED_II_TIMER_HANDLES.map((handle) => decimalSaveField(handle, [0, 0, 0])),
    decimalSaveField(HANDLES.coins, [0, 0, 0]),
    ...extendedGuildFields,
    ...dRankGuildFields,
];

// idk why this is = savedFields008 i think i messed up ordering somewhere
const savedFields009: readonly SaveField[] = savedFields008;

const savedFields010: readonly SaveField[] = [
    ...savedFields009,
    ...potionSpeedIIITimerFields,
    ...achievementFields009,
    booleanSaveField(hasPotionUsedThisCondense, setPotionUsedThisCondense),
    booleanSaveField(hasBoostedProducerThisCondense, setBoostedProducerThisCondense),
    booleanSaveField(hasCombatUsedNonFreeze, setCombatUsedNonFreeze),
];

const savedFields011: readonly SaveField[] = [
    ...savedFields010,
    ...achievementFields011,
    ...ascensionAchievementFields011,
    ...autocasterFields,
    ...autocasterSettingFields,
];

const savedFields012: readonly SaveField[] = [
    ...savedFields011,
    ...achievementFields012,
    ...circleTwoCondensedUpgradeFields,
];

const savedFields013: readonly SaveField[] = [
    ...savedFields012,
    ...messageTickerFields,
];

const savedFields014: readonly SaveField[] = [
    ...savedFields013,
    ...crystalFields,
];

const savedFields015: readonly SaveField[] = [
    ...savedFields014,
    ...crystalShatterTimeFields,
    ...achievementFields015,
    gameTimePlayedField,
    ...memoryFields,
];

const savedFields016: readonly SaveField[] = [
    ...savedFields015,
    ...Array.from({ length: 9 }, (_, rank) => callbackNumberSaveField(
        () => getGuildExperienceForQuestRank(rank),
        (experience) => setGuildExperienceForQuestRank(rank, experience),
    )),
];

const savedFields017: readonly SaveField[] = [
    ...savedFields016,
    ...Array.from({ length: 4 }, (_, slot) => callbackUint8SaveField(
        () => equippedItem(slot),
        (item) => setEquippedItem(slot, item),
    )),
    ...Array.from({ length: 3 }, (_, offset) => booleanSaveField(
        () => hasGuildShopUpgrade(offset + 9),
        (purchased) => setGuildShopUpgrade(offset + 9, purchased),
    )),
];

const condenseResetFields: readonly SaveField[] = [
    ...savedFields001,
    castSpeedTimerField,
    castSpeedMagnitudeField,
    castSpeedCostField,
    sealedMeridiansOwnedField,
    matrixOwnedField,
    matrixPowerField,
    ...empowermentFields,
    purifiedMeridiansMultiplierField,
    courageUnlockedField,
    courageTimerField,
    courageCooldownField,
    timeThisCondenseField,
    meridianSealedThisResetField,
    castSpeedUsedThisCondenseField,
    booleanSaveField(hasPotionUsedThisCondense, setPotionUsedThisCondense),
    booleanSaveField(hasBoostedProducerThisCondense, setBoostedProducerThisCondense),
    booleanSaveField(hasCombatUsedNonFreeze, setCombatUsedNonFreeze),
];

export async function exportSave(): Promise<string> {
    lastSaveTimestamp.value = Date.now();
    const bytes = new Uint8Array(totalByteLength(savedFields017));
    const view = new DataView(bytes.buffer);
    let offset = 0;
    for (const field of savedFields017) {
        field.write(view, offset);
        offset += field.byteLength;
    }
    const compressed = await compressBytes(bytes);
    return `${SAVE_PREFIX}${CURRENT_SAVE_VERSION}${bytesToBase64(compressed)}${SAVE_SUFFIX}`;
}

export async function importSave(saveData: string): Promise<void> {
    if (!saveData.startsWith(SAVE_PREFIX) || !saveData.endsWith(SAVE_SUFFIX)) {
        throw new Error("Unrecognized Mana Paradox save format");
    }
    const version = saveData.slice(SAVE_PREFIX.length, SAVE_PREFIX.length + 3);
    const encoded = saveData.slice(SAVE_PREFIX.length + 3, -SAVE_SUFFIX.length);
    switch (version) {
        case "001":
            await importFields(encoded, savedFields001);
            break;
        case "002":
            await importFields(encoded, savedFields002);
            break;
        case "003":
            await importFields(encoded, savedFields003);
            break;
        case "004":
            await importFields(encoded, savedFields004);
            break;
        case "005":
            await importFields(encoded, savedFields005);
            break;
        case "006":
            await importFields(encoded, savedFields006);
            break;
        case "007":
            await importFields(encoded, savedFields007);
            break;
        case "008":
            await importFields(encoded, savedFields008);
            break;
        case "009":
            await importFields(encoded, savedFields009, true);
            break;
        case "010":
            await importFields(encoded, savedFields010, true);
            break;
        case "011":
            await importFields(encoded, savedFields011, true);
            break;
        case "012":
            await importFields(encoded, savedFields012, true);
            break;
        case "013":
            await importFields(encoded, savedFields013, true);
            break;
        case "014":
            await importFields(encoded, savedFields014, true);
            break;
        case "015":
            await importFields(encoded, savedFields015, true);
            break;
        case "016":
            await importFields(encoded, savedFields016, true);
            break;
        case "017":
            await importFields(encoded, savedFields017, true);
            break;
        default:
            throw new Error(`Unsupported Mana Paradox save version ${version}`);
    }
    refreshCondensedUpgradeState();
    refreshSealedMeridiansDerivedState();
    refreshMatrixDerivedState();
    refreshSealedMeridiansDerivedState();
    refreshTierOneDerivedState();
    resetCombatSpellCosts();
    ensureInventoryPlacements();
    ensureShopItems();
    repairGuildCurrency();
    refreshPotionEffectState();
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

async function importFields(encoded: string, fields: readonly SaveField[], compressed = false): Promise<void> {
    const bytesRaw = base64ToBytes(encoded);
    const bytes = compressed ? await decompressBytes(bytesRaw) : bytesRaw;
    const expectedLength = totalByteLength(fields);
    const currentVersionFields = fields === savedFields017;
    if (!development && (!currentVersionFields || bytes.length > expectedLength) && bytes.length !== expectedLength) {
        throw new Error(`Invalid save payload length: expected ${expectedLength} bytes, received ${bytes.length}`);
    }
    for (const field of savedFields017) field.reset();
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

function callbackInt32SaveField(getValue: () => number, setValue: (value: number) => void, defaultValue = 0): SaveField {
    return {
        byteLength: 4,
        write: (view, offset) => view.setInt32(offset, getValue(), true),
        read: (view, offset) => setValue(view.getInt32(offset, true)),
        reset: () => setValue(defaultValue),
    };
}

function callbackUint8SaveField(getValue: () => number, setValue: (value: number) => void, defaultValue = 0): SaveField {
    return {
        byteLength: 1,
        write: (view, offset) => view.setUint8(offset, getValue()),
        read: (view, offset) => setValue(view.getUint8(offset)),
        reset: () => setValue(defaultValue),
    };
}

function callbackNumberSaveField(getValue: () => number, setValue: (value: number) => void, defaultValue = 0): SaveField {
    return {
        byteLength: 8,
        write: (view, offset) => view.setFloat64(offset, getValue(), true),
        read: (view, offset) => setValue(view.getFloat64(offset, true)),
        reset: () => setValue(defaultValue),
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

export async function saveGame(): Promise<void> {
    if (!savingEnabled) return;
    pendingSave = pendingSave.then(async () => {
        localStorage.setItem(STORAGE_KEY, await exportSave());
    }).catch((error) => {
        console.error("Failed to save The Mana Paradox", error);
    });
    return pendingSave;
}

export function resetGame(): void {
    savingEnabled = true;
    for (const field of savedFields017) field.reset();
    refreshAchievementRewards();
    refreshCondensedUpgradeState();
    refreshSealedMeridiansDerivedState();
    refreshMatrixDerivedState();
    refreshSealedMeridiansDerivedState();
    refreshTierOneDerivedState();
    refreshPotionEffectState();
    ensureShopItems();
    clampManaToInfinityBoundary();
    localStorage.removeItem(STORAGE_KEY);
    void saveGame();
}

export function resetForCondense(): void {
    for (const field of condenseResetFields) field.reset();
    refreshAchievementRewards();
    refreshCondensedUpgradeState();
    refreshSealedMeridiansDerivedState();
    refreshMatrixDerivedState();
    refreshSealedMeridiansDerivedState();
    refreshTierOneDerivedState();
    applyCondensedResetStartingValues();
    refreshPotionEffectState();
    setPotionUsedThisCondense(hasActivePotionEffects());
    clampManaToInfinityBoundary();
}

export async function loadGame(): Promise<boolean> {
    const saveData = localStorage.getItem(STORAGE_KEY);
    if (!saveData) return false;
    localStorage.setItem(RECOVERY_STORAGE_KEY, saveData);
    try {
        await importSave(saveData);
        return true;
    } catch (error) {
        savingEnabled = false;
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

async function compressBytes(bytes: Uint8Array): Promise<Uint8Array> {
    const stream = new Blob([copyToArrayBuffer(bytes)]).stream().pipeThrough(new CompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompressBytes(bytes: Uint8Array): Promise<Uint8Array> {
    const stream = new Blob([copyToArrayBuffer(bytes)]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}

function copyToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    return buffer;
}

const hadStoredSave = localStorage.getItem(STORAGE_KEY) !== null;
const loadedStoredSave = await loadGame();
if (hadStoredSave && !loadedStoredSave) savingEnabled = false;
(window as any).saveGame = saveGame;
window.setInterval(saveGame, AUTOSAVE_INTERVAL);
window.addEventListener("pagehide", saveGame);
