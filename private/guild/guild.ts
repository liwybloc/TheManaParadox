import { addUS, copyInto, createZero, divUS, gt, gte, log10Into, lte, mulUS, powUS, subUS, toNumber, writeDecimal, writeNumber } from "../core/break_eternity.js";
import { checkCoinAchievements, consumeCircularHabitsReward, hasTierOneAchievement, unlockTierOneAchievement } from "../game/achievements.js";
import { isProducerOnlyCrystalActive } from "../game/crystals.js";
import { focusGameSpeedMultiplier, isFocusing } from "../game/memories.js";
import type { Player } from "../core/player.js";
import type { Scratch } from "../core/scratch.js";
import { INVENTORY_ITEMS } from "./items.js";
import { GUILD_QUESTS } from "./quests.js";
import { GUILD_SHOP_UPGRADES } from "./shop.js";

type Num10 = [number, number, number, number, number, number, number, number, number, number];
export const GUILD_RANKS = ["F", "E", "D", "C", "B", "A", "S", "SS", "SSS"];
export const POTION_SPEED_TIMER_HANDLES: Num10 = Array.from({ length: 10 }, () => createZero()) as Num10;
export const POTION_SPEED_II_TIMER_HANDLES: Num10 = Array.from({ length: 10 }, () => createZero()) as Num10;
export const POTION_SPEED_III_TIMER_HANDLES: Num10 = Array.from({ length: 10 }, () => createZero()) as Num10;
declare const player: Player;
declare const scratch: Scratch;

/** [WASM] */

const NO_ACTIVE_QUEST: i32 = -1;
const INVENTORY_SIZE: i32 = 100;
const INVENTORY_WIDTH: i32 = 10;
const INVENTORY_EMPTY: u8 = 0;
const INVENTORY_WOLF_FUR: u8 = 1;
const INVENTORY_POTION_OF_SPEED: u8 = 2;
const INVENTORY_POTION_OF_SPEED_II: u8 = 19;
const INVENTORY_POTION_OF_SPEED_III: u8 = 20;
const INVENTORY_CONTINUATION: u8 = 255;
const MAX_QUEST_REWARDS: i32 = 3;
const QUEST_DEFINITION_COUNT: i32 = 22;
const QUEST_SLOT_COUNT: i32 = 6;
const SHOP_ITEM_COUNT: i32 = 3;
const SHOP_UPGRADE_COUNT: i32 = 9;
const inventorySlots = new StaticArray<u8>(INVENTORY_SIZE);
const inventoryItemWidths = new StaticArray<u8>(256);
const inventoryItemHeights = new StaticArray<u8>(256);
const inventoryItemSellMinimums = new StaticArray<u8>(256);
const inventoryItemSellMaximums = new StaticArray<u8>(256);
const questSlotLocked = new StaticArray<u8>(QUEST_SLOT_COUNT);
const questDefinitionIds = new StaticArray<i32>(QUEST_SLOT_COUNT);
const shopItemIds = new StaticArray<i32>(SHOP_ITEM_COUNT);
const shopItemCosts = new StaticArray<i32>(SHOP_ITEM_COUNT);
const shopItemRefreshTimers = new StaticArray<f64>(SHOP_ITEM_COUNT);
const shopUpgrades = new StaticArray<u8>(SHOP_UPGRADE_COUNT);
const shopUpgradeCosts = new StaticArray<i32>(SHOP_UPGRADE_COUNT);
const potionSpeedTimers = new StaticArray<i32>(10);
const potionSpeedIITimers = new StaticArray<i32>(10);
const potionSpeedIIITimers = new StaticArray<i32>(10);

const QUEST_REFRESH_TIME = 180;

let inventoryRevision: i32 = 0;
let questRefreshRemaining: f64 = QUEST_REFRESH_TIME;
let guildExperience: f64 = 0;
let combatRandomState: u32 = 0x6d2b79f5;
let questResultPending = false;
let lastWolfFurReward: i32 = 0;
let lastPotionReward: i32 = 0;
let lastWolfFurDropped: i32 = 0;
let lastPotionDropped: i32 = 0;
let lastCompletedQuestDefinition: i32 = 0;
const lastRewardItems = new StaticArray<i32>(MAX_QUEST_REWARDS);
const lastRewardAmounts = new StaticArray<i32>(MAX_QUEST_REWARDS);
const lastRewardDropped = new StaticArray<i32>(MAX_QUEST_REWARDS);
const questRewardItems = new StaticArray<i32>(QUEST_DEFINITION_COUNT * MAX_QUEST_REWARDS);
const questRewardMinimums = new StaticArray<i32>(QUEST_DEFINITION_COUNT * MAX_QUEST_REWARDS);
const questRewardMaximums = new StaticArray<i32>(QUEST_DEFINITION_COUNT * MAX_QUEST_REWARDS);

export function isGuildUnlocked(): bool {
    if (player.guildUnlocked) {
        unlockTierOneAchievement(25);
        return true;
    }
    writeDecimal(scratch.productionModifier, 1, 1, 210);
    if (!gte(player.mana, scratch.productionModifier)) return false;
    player.guildUnlocked = true;
    unlockTierOneAchievement(25);
    return true;
}

export function setGuildUnlocked(value: bool): void {
    player.guildUnlocked = value;
}

export function isGuildMember(): bool {
    return player.guildMember;
}

export function setGuildMember(value: bool): void {
    player.guildMember = value;
}

export function applyToGuild(): bool {
    if (!isGuildUnlocked() || player.guildMember) return false;
    player.guildMember = true;
    writeNumber(player.guildRank, 0);
    return true;
}

export function initializeQuestBoard(): void {
    for (let slot: i32 = 0; slot < QUEST_SLOT_COUNT; slot++) questDefinitionIds[slot] = slot;
}

export function questDefinitionId(slot: i32): i32 {
    return slot >= 0 && slot < QUEST_SLOT_COUNT ? questDefinitionIds[slot] : 0;
}

export function setQuestDefinitionId(slot: i32, id: i32): void {
    if (slot < 0 || slot >= QUEST_SLOT_COUNT) return;
    questDefinitionIds[slot] = <i32>Math.max(0, Math.min(QUEST_DEFINITION_COUNT - 1, id));
}

export function getGuildExperience(): f64 {
    return guildExperience;
}

export function setGuildExperience(experience: f64): void {
    guildExperience = Math.max(0, experience);
}

export function guildExperienceRequirement(): f64 {
    const rank = <i32>toNumber(player.guildRank);
    return rank === 0 ? 25 : rank === 1 ? 200 : Infinity;
}

export function isQuestActive(): bool {
    return toNumber(player.activeQuest) >= 0;
}

export function isQuestSlotLocked(index: i32): bool {
    return index >= 0 && index < QUEST_SLOT_COUNT && questSlotLocked[index] !== 0;
}

export function setQuestSlotLocked(index: i32, locked: bool): void {
    if (index < 0 || index >= QUEST_SLOT_COUNT) return;
    questSlotLocked[index] = locked ? 1 : 0;
}

export function getQuestRefreshRemaining(): f64 {
    return questRefreshRemaining;
}

export function setQuestRefreshRemaining(seconds: f64): void {
    questRefreshRemaining = Math.max(0, Math.min(QUEST_REFRESH_TIME, seconds));
}

export function updateQuestBoard(deltaSeconds: f64): void {
    if (consumeCircularHabitsReward()) placeInventoryItems(INVENTORY_POTION_OF_SPEED_II, 3);
    if (!player.guildMember || deltaSeconds <= 0) return;
    updateShopItemRefreshes(deltaSeconds);
    if (isQuestActive()) return;
    questRefreshRemaining -= deltaSeconds;
    if (questRefreshRemaining > 0) return;
    for (let index: i32 = 0; index < QUEST_SLOT_COUNT; index++) questSlotLocked[index] = 0;
    refreshQuestDefinitions();
    refreshShopItems();
    questRefreshRemaining = QUEST_REFRESH_TIME;
}

export function activeQuestIndex(): i32 {
    return <i32>toNumber(player.activeQuest);
}

export function hasGuildShopUpgrade(index: i32): bool {
    return index >= 0 && index < SHOP_UPGRADE_COUNT && shopUpgrades[index] !== 0;
}

export function setGuildShopUpgrade(index: i32, purchased: bool): void {
    if (index < 0 || index >= SHOP_UPGRADE_COUNT) return;
    shopUpgrades[index] = purchased ? 1 : 0;
}

export function configureGuildShopUpgradeCost(index: i32, cost: i32): void {
    if (index < 0 || index >= SHOP_UPGRADE_COUNT || cost < 0) return;
    shopUpgradeCosts[index] = cost;
}

export function visibleQuestSlotCount(): i32 {
    return 3 + (hasGuildShopUpgrade(2) ? 1 : 0) + (hasGuildShopUpgrade(4) ? 1 : 0) + (hasGuildShopUpgrade(6) ? 1 : 0);
}

export function shopItemId(slot: i32): i32 { return slot >= 0 && slot < SHOP_ITEM_COUNT ? shopItemIds[slot] : 0; }
export function shopItemCost(slot: i32): i32 { return slot >= 0 && slot < SHOP_ITEM_COUNT ? shopItemCosts[slot] : 0; }
export function shopItemRefreshTimer(slot: i32): f64 { return slot >= 0 && slot < SHOP_ITEM_COUNT ? shopItemRefreshTimers[slot] : 0; }
export function setShopItemId(slot: i32, item: i32): void { if (slot >= 0 && slot < SHOP_ITEM_COUNT) shopItemIds[slot] = item; }
export function setShopItemCost(slot: i32, cost: i32): void { if (slot >= 0 && slot < SHOP_ITEM_COUNT) shopItemCosts[slot] = cost; }
export function setShopItemRefreshTimer(slot: i32, seconds: f64): void {
    if (slot >= 0 && slot < SHOP_ITEM_COUNT) shopItemRefreshTimers[slot] = Math.max(0, Math.min(30, seconds));
}

export function ensureShopItems(): void {
    for (let slot: i32 = 0; slot < SHOP_ITEM_COUNT; slot++) {
        if (!isInventoryItem(<u8>shopItemIds[slot]) || shopItemCosts[slot] <= 0) rollShopItem(slot);
    }
}

export function canBuyShopItem(slot: i32): bool {
    if (slot < 0 || slot >= SHOP_ITEM_COUNT || shopItemIds[slot] <= 0 || shopItemRefreshTimers[slot] > 0) return false;
    writeNumber(scratch.productionModifier, shopItemCosts[slot]);
    return gte(player.coins, scratch.productionModifier) && findInventorySpace(<u8>shopItemIds[slot]) >= 0;
}

export function buyShopItem(slot: i32): bool {
    if (!canBuyShopItem(slot)) return false;
    subUS(player.coins, shopItemCosts[slot]);
    placeInventoryItems(<u8>shopItemIds[slot], 1);
    shopItemRefreshTimers[slot] = 30;
    return true;
}

export function canBuyGuildShopUpgrade(index: i32): bool {
    if (index < 0 || index >= SHOP_UPGRADE_COUNT || hasGuildShopUpgrade(index)) return false;
    const requiredRank: i32 = index < 3 ? 0 : index < 6 ? 1 : 2;
    if (<i32>toNumber(player.guildRank) < requiredRank) return false;
    writeNumber(scratch.productionModifier, guildShopUpgradeCost(index));
    return gte(player.coins, scratch.productionModifier);
}

export function buyGuildShopUpgrade(index: i32): bool {
    if (!canBuyGuildShopUpgrade(index)) return false;
    subUS(player.coins, guildShopUpgradeCost(index));
    setGuildShopUpgrade(index, true);
    refreshPotionEffectState();
    inventoryRevision++;
    return true;
}

function guildShopUpgradeCost(index: i32): i32 {
    return index >= 0 && index < SHOP_UPGRADE_COUNT ? shopUpgradeCosts[index] : 0;
}

function refreshShopItems(): void {
    for (let slot: i32 = 0; slot < SHOP_ITEM_COUNT; slot++) {
        rollShopItem(slot);
        shopItemRefreshTimers[slot] = 0;
    }
}

function updateShopItemRefreshes(deltaSeconds: f64): void {
    for (let slot: i32 = 0; slot < SHOP_ITEM_COUNT; slot++) {
        if (shopItemRefreshTimers[slot] <= 0) continue;
        shopItemRefreshTimers[slot] -= deltaSeconds;
        if (shopItemRefreshTimers[slot] > 0) continue;
        shopItemRefreshTimers[slot] = 0;
        rollShopItem(slot);
    }
}

function rollShopItem(slot: i32): void {
    const item = 1 + nextCombatRandom(25);
    const maximumSell = inventoryItemSellMaximum(item);
    shopItemIds[slot] = item;
    shopItemCosts[slot] = maximumSell + nextCombatRandom(maximumSell + 1);
}

export function combatShieldHandle(): i32 {
    return player.combatShield;
}

export function wolfineHealthPercent(): f64 {
    copyInto(scratch.currencyGain, player.wolfineHealth);
    divUS(scratch.currencyGain, enemyMaximumHealth(activeQuestIndex()));
    return Math.max(0, Math.min(1, toNumber(scratch.currencyGain)));
}

export function enemyMaximumHealth(questSlot: i32): i32 {
    const rank = questRank(questSlot);
    writeNumber(scratch.enemyMaximumHealth, rank <= 0 ? 150 : rank === 1 ? 250 : 500);
    return scratch.enemyMaximumHealth;
}

export function combatShieldPercent(): f64 {
    if (!gt(player.combatShieldMaximum, 0)) return 0;
    writeNumber(scratch.currencyGain, 0);
    addUS(scratch.currencyGain, player.combatShield);
    divUS(scratch.currencyGain, player.combatShieldMaximum);
    return Math.max(0, Math.min(1, toNumber(scratch.currencyGain)));
}

export function canCastCombatSpell(index: i32): bool {
    return isQuestActive() && index >= 0 && index < 3 && gte(player.mana, combatSpellCost(index));
}

export function hasQuestResult(): bool {
    return questResultPending;
}

export function lastQuestWolfFurReward(): i32 {
    return lastWolfFurReward;
}

export function lastQuestPotionReward(): i32 {
    return lastPotionReward;
}

export function lastCompletedQuestDefinitionId(): i32 {
    return lastCompletedQuestDefinition;
}

export function lastQuestRewardCount(): i32 { return MAX_QUEST_REWARDS; }
export function lastQuestRewardItem(index: i32): i32 { return index >= 0 && index < MAX_QUEST_REWARDS ? lastRewardItems[index] : 0; }
export function lastQuestRewardAmount(index: i32): i32 { return index >= 0 && index < MAX_QUEST_REWARDS ? lastRewardAmounts[index] : 0; }
export function lastQuestRewardDropped(index: i32): i32 { return index >= 0 && index < MAX_QUEST_REWARDS ? lastRewardDropped[index] : 0; }

export function dismissQuestResult(): void {
    questResultPending = false;
}

export function lastQuestWolfFurDropped(): i32 {
    return lastWolfFurDropped;
}

export function lastQuestPotionDropped(): i32 {
    return lastPotionDropped;
}

export function inventoryItemAt(position: i32): i32 {
    if (position < 0 || position >= INVENTORY_SIZE) return 0;
    const item = inventorySlots[position];
    return item === INVENTORY_CONTINUATION ? 0 : item;
}

export function rawInventorySlot(position: i32): i32 {
    return position >= 0 && position < INVENTORY_SIZE ? inventorySlots[position] : 0;
}

export function setRawInventorySlot(position: i32, item: i32): void {
    if (position < 0 || position >= INVENTORY_SIZE || item < 0 || item > 255) return;
    inventorySlots[position] = <u8>item;
    inventoryRevision++;
}

export function configureInventoryItem(item: i32, width: i32, height: i32): void {
    if (item <= 0 || item >= 255 || width <= 0 || height <= 0) return;
    inventoryItemWidths[item] = <u8>width;
    inventoryItemHeights[item] = <u8>height;
}

export function configureInventoryItemSellPrice(item: i32, minimum: i32, maximum: i32): void {
    if (item <= 0 || item >= 255 || minimum < 0 || maximum < minimum || maximum >= 255) return;
    inventoryItemSellMinimums[item] = <u8>minimum;
    inventoryItemSellMaximums[item] = <u8>maximum;
}

export function configureQuestReward(quest: i32, reward: i32, item: i32, minimum: i32, maximum: i32): void {
    if (quest < 0 || quest >= QUEST_DEFINITION_COUNT || reward < 0 || reward >= MAX_QUEST_REWARDS) return;
    if (item <= 0 || item >= 255 || minimum < 0 || maximum < minimum) return;
    const index = quest * MAX_QUEST_REWARDS + reward;
    questRewardItems[index] = item;
    questRewardMinimums[index] = minimum;
    questRewardMaximums[index] = maximum;
}

export function getInventoryRevision(): i32 {
    return inventoryRevision;
}

export function packedInventorySlots(index: i32): i32 {
    if (index < 0 || index >= 25) return 0;
    const offset = index * 4;
    return <i32>inventorySlots[offset]
        | (<i32>inventorySlots[offset + 1] << 8)
        | (<i32>inventorySlots[offset + 2] << 16)
        | (<i32>inventorySlots[offset + 3] << 24);
}

export function setPackedInventorySlots(index: i32, packed: i32): void {
    if (index < 0 || index >= 25) return;
    const offset = index * 4;
    inventorySlots[offset] = <u8>packed;
    inventorySlots[offset + 1] = <u8>(packed >> 8);
    inventorySlots[offset + 2] = <u8>(packed >> 16);
    inventorySlots[offset + 3] = <u8>(packed >> 24);
    inventoryRevision++;
}

export function moveInventoryItem(source: i32, position: i32): bool {
    if (source < 0 || source >= INVENTORY_SIZE) return false;
    const item = inventorySlots[source];
    if (!isInventoryItem(item) || !inventoryPositionFits(item, position, source)) return false;
    clearInventoryItem(source, item);
    placeInventoryItem(position, item);
    inventoryRevision++;
    return true;
}

export function drinkSpeedPotion(position: i32): bool {
    return drinkPotion(position, INVENTORY_POTION_OF_SPEED);
}

export function drinkPotion(position: i32, itemId: i32): bool {
    if (isProducerOnlyCrystalActive() || position < 0 || position >= INVENTORY_SIZE || inventorySlots[position] !== itemId) return false;
    if (!applyPotionEffect(itemId)) return false;
    clearInventoryItem(position, <u8>itemId);
    if (itemId === INVENTORY_POTION_OF_SPEED) subUS(player.inventoryPotionOfSpeed, 1);
    inventoryRevision++;
    player.potionUsedThisCondense = true;
    unlockTierOneAchievement(27);
    return true;
}

export function sellInventoryItem(position: i32, itemId: i32): i32 {
    if (position < 0 || position >= INVENTORY_SIZE || inventorySlots[position] !== itemId) return 0;
    const minimum = inventoryItemSellMinimum(itemId);
    const maximum = inventoryItemSellMaximum(itemId);
    if (minimum <= 0 || maximum < minimum) return 0;
    const coins = minimum + nextCombatRandom(maximum - minimum + 1);
    clearInventoryItem(position, <u8>itemId);
    if (itemId === INVENTORY_POTION_OF_SPEED) subUS(player.inventoryPotionOfSpeed, 1);
    if (itemId === INVENTORY_WOLF_FUR) subUS(player.inventoryWolfFur, 1);
    addUS(player.coins, coins);
    checkCoinAchievements();
    inventoryRevision++;
    return coins;
}

export function sellAllInventoryItems(includePotions: bool): i32 {
    const soldFullInventory = includePotions && isInventoryFull();
    let coins: i32 = 0;
    for (let position: i32 = 0; position < INVENTORY_SIZE; position++) {
        const item = inventorySlots[position];
        if (!isInventoryItem(item)) continue;
        if (!includePotions && isPotion(item)) continue;
        coins += sellInventoryItem(position, item);
    }
    if (soldFullInventory) unlockTierOneAchievement(34);
    return coins;
}

export function drinkAllPotions(): i32 {
    let consumed: i32 = 0;
    for (let position: i32 = 0; position < INVENTORY_SIZE; position++) {
        const item = inventorySlots[position];
        if (!isPotion(item)) continue;
        if (drinkPotion(position, item)) consumed++;
    }
    if (consumed >= 20) unlockTierOneAchievement(31);
    return consumed;
}

function isInventoryFull(): bool {
    for (let position: i32 = 0; position < INVENTORY_SIZE; position++) {
        if (inventorySlots[position] === INVENTORY_EMPTY) return false;
    }
    return true;
}

function isPotion(item: i32): bool {
    return item === INVENTORY_POTION_OF_SPEED || item === INVENTORY_POTION_OF_SPEED_II || item === INVENTORY_POTION_OF_SPEED_III;
}

export function applyPotionEffect(itemId: i32): bool {
    const duration = potionDuration(itemId);
    const effect = potionEffect(itemId);
    return duration > 0 && effect > 0 && applyTimedPotionEffect(itemId, duration, effect);
}

export function potionDuration(itemId: i32): i32 {
    const baseDuration: i32 = itemId === INVENTORY_POTION_OF_SPEED ? 120
        : itemId === INVENTORY_POTION_OF_SPEED_II ? 60
        : itemId === INVENTORY_POTION_OF_SPEED_III ? 30 : 0;
    let duration = hasGuildShopUpgrade(0) ? baseDuration * 2 : baseDuration;
    if (hasTierOneAchievement(31)) duration += 30;
    return duration;
}

export function potionEffect(itemId: i32): f64 {
    const baseEffect: f64 = itemId === INVENTORY_POTION_OF_SPEED ? 4
        : itemId === INVENTORY_POTION_OF_SPEED_II ? 14
        : itemId === INVENTORY_POTION_OF_SPEED_III ? 63 : 0;
    return potionSpeedEffect(baseEffect);
}

export function clearPotionEffect(itemId: i32, effectIndex: i32): bool {
    switch (itemId) {
        case INVENTORY_POTION_OF_SPEED:
            return clearTimedPotionEffect(itemId, effectIndex, potionSpeedEffect(4));
        case INVENTORY_POTION_OF_SPEED_II:
            return clearTimedPotionEffect(itemId, effectIndex, potionSpeedEffect(14));
        case INVENTORY_POTION_OF_SPEED_III:
            return clearTimedPotionEffect(itemId, effectIndex, potionSpeedEffect(63));
        default:
            return false;
    }
}

export function clearAllPotionEffects(): void {
    for (let index: i32 = 0; index < 10; index++) {
        clearPotionEffect(INVENTORY_POTION_OF_SPEED, index);
        clearPotionEffect(INVENTORY_POTION_OF_SPEED_II, index);
        clearPotionEffect(INVENTORY_POTION_OF_SPEED_III, index);
    }
}

export function refreshPotionEffectState(): void {
    writeNumber(scratch.gameSpeed, 1);
    for (let index: i32 = 0; index < 10; index++) {
        if (gt(potionSpeedTimers[index], 0)) addPotionSpeed(potionSpeedEffect(4));
        if (gt(potionSpeedIITimers[index], 0)) addPotionSpeed(potionSpeedEffect(14));
        if (gt(potionSpeedIIITimers[index], 0)) addPotionSpeed(potionSpeedEffect(63));
    }
}

function potionSpeedEffect(baseEffect: f64): f64 {
    let effect = baseEffect;
    if (hasTierOneAchievement(30)) effect *= 1.25;
    if (hasGuildShopUpgrade(3)) effect *= 1.5;
    return effect;
}

export function updatePotionEffects(seconds: i32): void {
    updateTimedPotionEffects(INVENTORY_POTION_OF_SPEED, seconds);
    updateTimedPotionEffects(INVENTORY_POTION_OF_SPEED_II, seconds);
    updateTimedPotionEffects(INVENTORY_POTION_OF_SPEED_III, seconds);
}

function applyTimedPotionEffect(itemId: i32, duration: i32, speed: f64): bool {
    for (let index: i32 = 0; index < 10; index++) {
        const timer = potionTimer(itemId, index);
        if (gt(timer, 0)) continue;
        writeNumber(timer, duration);
        addPotionSpeed(speed);
        return true;
    }
    return false;
}

function clearTimedPotionEffect(itemId: i32, effectIndex: i32, speed: f64): bool {
    if (effectIndex < 0 || effectIndex >= 10) return false;
    const timer = potionTimer(itemId, effectIndex);
    if (!gt(timer, 0)) return false;
    writeNumber(timer, 0);
    writeNumber(scratch.productionModifier, speed);
    subUS(scratch.gameSpeed, scratch.productionModifier);
    return true;
}

function addPotionSpeed(speed: f64): void {
    writeNumber(scratch.productionModifier, speed);
    addUS(scratch.gameSpeed, scratch.productionModifier);
}

function updateTimedPotionEffects(itemId: i32, seconds: i32): void {
    for (let index: i32 = 0; index < 10; index++) {
        const timer = potionTimer(itemId, index);
        if (!gt(timer, 0)) continue;
        if (lte(timer, seconds)) clearPotionEffect(itemId, index);
        else subUS(timer, seconds);
    }
}

function potionTimer(itemId: i32, index: i32): i32 {
    if (itemId === INVENTORY_POTION_OF_SPEED) return potionSpeedTimers[index];
    if (itemId === INVENTORY_POTION_OF_SPEED_II) return potionSpeedIITimers[index];
    return potionSpeedIIITimers[index];
}

export function getGameSpeed(): i32 {
    if (isProducerOnlyCrystalActive()) {
        writeNumber(scratch.effectiveGameSpeed, 1);
        return scratch.effectiveGameSpeed;
    }
    copyInto(scratch.effectiveGameSpeed, scratch.gameSpeed);
    if (gt(player.courageTimer, 0)) mulUS(scratch.effectiveGameSpeed, player.courageMultiplier);
    if (isFocusing()) mulUS(scratch.effectiveGameSpeed, focusGameSpeedMultiplier());
    return scratch.effectiveGameSpeed;
}

export function isGameSpeedIncreased(): bool {
    return gt(getGameSpeed(), 1);
}

export function hasActivePotionEffects(): bool {
    return gt(scratch.gameSpeed, 1);
}

export function initializePotionSpeedTimers(
    timer0: i32, timer1: i32, timer2: i32, timer3: i32, timer4: i32,
    timer5: i32, timer6: i32, timer7: i32, timer8: i32, timer9: i32,
): void {
    potionSpeedTimers[0] = timer0; potionSpeedTimers[1] = timer1; potionSpeedTimers[2] = timer2;
    potionSpeedTimers[3] = timer3; potionSpeedTimers[4] = timer4; potionSpeedTimers[5] = timer5;
    potionSpeedTimers[6] = timer6; potionSpeedTimers[7] = timer7; potionSpeedTimers[8] = timer8;
    potionSpeedTimers[9] = timer9;
}

export function initializePotionSpeedIITimers(
    timer0: i32, timer1: i32, timer2: i32, timer3: i32, timer4: i32,
    timer5: i32, timer6: i32, timer7: i32, timer8: i32, timer9: i32,
): void {
    potionSpeedIITimers[0] = timer0; potionSpeedIITimers[1] = timer1; potionSpeedIITimers[2] = timer2;
    potionSpeedIITimers[3] = timer3; potionSpeedIITimers[4] = timer4; potionSpeedIITimers[5] = timer5;
    potionSpeedIITimers[6] = timer6; potionSpeedIITimers[7] = timer7; potionSpeedIITimers[8] = timer8;
    potionSpeedIITimers[9] = timer9;
}

export function initializePotionSpeedIIITimers(
    timer0: i32, timer1: i32, timer2: i32, timer3: i32, timer4: i32,
    timer5: i32, timer6: i32, timer7: i32, timer8: i32, timer9: i32,
): void {
    potionSpeedIIITimers[0] = timer0; potionSpeedIIITimers[1] = timer1; potionSpeedIIITimers[2] = timer2;
    potionSpeedIIITimers[3] = timer3; potionSpeedIIITimers[4] = timer4; potionSpeedIIITimers[5] = timer5;
    potionSpeedIIITimers[6] = timer6; potionSpeedIIITimers[7] = timer7; potionSpeedIIITimers[8] = timer8;
    potionSpeedIIITimers[9] = timer9;
}

export function ensureInventoryPlacements(): void {
    let wolfFur: i32 = 0;
    let potions: i32 = 0;
    let needsRepair = false;
    const storedItems = new StaticArray<u8>(INVENTORY_SIZE);
    let storedItemCount: i32 = 0;
    for (let position: i32 = 0; position < INVENTORY_SIZE; position++) {
        const item = inventorySlots[position];
        if (isInventoryItem(item)) {
            storedItems[storedItemCount++] = item;
            if (!storedInventoryShapeIsValid(position, item)) needsRepair = true;
            if (item === INVENTORY_WOLF_FUR) wolfFur++;
            else if (item === INVENTORY_POTION_OF_SPEED) potions++;
        }
        else if (!isInventoryItem(item) && item !== INVENTORY_CONTINUATION) inventorySlots[position] = INVENTORY_EMPTY;
    }
    if (needsRepair) {
        for (let position: i32 = 0; position < INVENTORY_SIZE; position++) inventorySlots[position] = INVENTORY_EMPTY;
        for (let index: i32 = 0; index < storedItemCount; index++) {
            const position = findInventorySpace(storedItems[index]);
            if (position >= 0) placeInventoryItem(position, storedItems[index]);
        }
    }
    if (wolfFur === 0 && potions === 0) {
        const legacyWolfFur = <i32>Math.min(100, toNumber(player.inventoryWolfFur));
        const legacyPotions = <i32>Math.min(100, toNumber(player.inventoryPotionOfSpeed));
        wolfFur = placeInventoryItems(INVENTORY_WOLF_FUR, legacyWolfFur);
        potions = placeInventoryItems(INVENTORY_POTION_OF_SPEED, legacyPotions);
    }
    writeNumber(player.inventoryWolfFur, wolfFur);
    writeNumber(player.inventoryPotionOfSpeed, potions);
    inventoryRevision++;
}

function storedInventoryShapeIsValid(position: i32, item: u8): bool {
    const width = inventoryItemWidth(item);
    const height = inventoryItemHeight(item);
    if (position % INVENTORY_WIDTH + width > INVENTORY_WIDTH) return false;
    if (position / INVENTORY_WIDTH + height > INVENTORY_SIZE / INVENTORY_WIDTH) return false;
    for (let row: i32 = 0; row < height; row++) {
        for (let column: i32 = 0; column < width; column++) {
            if (row === 0 && column === 0) continue;
            if (inventorySlots[position + row * INVENTORY_WIDTH + column] !== INVENTORY_CONTINUATION) return false;
        }
    }
    return true;
}

export function questRank(index: i32): i32 {
    const id = questDefinitionId(index);
    return id >= 17 ? 2 : id >= 12 ? 1 : 0;
}

export function acceptGuildQuest(index: i32): bool {
    if (!player.guildMember || isQuestActive() || index < 0 || index >= visibleQuestSlotCount() || isQuestSlotLocked(index)) return false;
    questResultPending = false;
    writeNumber(player.activeQuest, index);
    copyInto(player.wolfineHealth, enemyMaximumHealth(index));
    writeNumber(player.combatFreezeTurns, 0);
    player.combatUsedNonFreeze = false;
    log10Into(player.combatShieldMaximum, player.mana);
    log10Into(player.combatShield, player.mana);
    resetCombatSpellCosts();
    return true;
}

export function castCombatSpell(index: i32): bool {
    if (!isQuestActive() || index < 0 || index >= 3) return false;
    const cost = combatSpellCost(index);
    if (!gte(player.mana, cost)) return false;
    divUS(player.mana, cost);
    if (index !== 2) player.combatUsedNonFreeze = true;
    writeNumber(scratch.productionModifier, 1.1);
    powUS(cost, scratch.productionModifier);
    const scalingExponent = index === 0 ? 10 : index === 1 ? 20 : hasTierOneAchievement(32) ? 10 : 30;
    writeDecimal(scratch.productionModifier, 1, 1, scalingExponent);
    mulUS(cost, scratch.productionModifier);
    subUS(player.wolfineHealth, combatSpellDamage(index));
    if (index === 2) writeNumber(player.combatFreezeTurns, 2);
    if (lte(player.wolfineHealth, 0)) {
        finishQuest(true);
        return true;
    }
    wolfineTurn();
    return true;
}

export function abandonGuildQuest(): void {
    if (isQuestActive()) finishQuest(false);
}

export function isManaConduitProductionDisabled(): bool {
    return isQuestActive();
}

export function setActiveQuest(index: i32): void {
    writeNumber(player.activeQuest, index);
}

function wolfineTurn(): void {
    if (gt(player.combatFreezeTurns, 0)) {
        subUS(player.combatFreezeTurns, 1);
        return;
    }
    const rankMultiplier = 1 << questRank(activeQuestIndex());
    const damage = (20 + nextCombatRandom(31)) * rankMultiplier;
    subUS(player.combatShield, damage);
    if (lte(player.combatShield, 0)) finishQuest(false);
}

function nextCombatRandom(range: i32): i32 {
    combatRandomState = combatRandomState * 1664525 + 1013904223;
    if(combatRandomState > 1e100) {
        combatRandomState = 0x8fadef;
    }
    return <i32>(combatRandomState % <u32>range);
}

function finishQuest(victory: bool): void {
    if (victory) {
        const completedSlot = activeQuestIndex();
        const completedQuest = questDefinitionId(completedSlot);
        if (questRank(completedSlot) >= 2 && !player.combatUsedNonFreeze) unlockTierOneAchievement(32);
        const unlockedDRankAchievement = questRank(completedSlot) >= 2 && unlockTierOneAchievement(39);
        lastCompletedQuestDefinition = completedQuest;
        if (completedSlot >= 0 && completedSlot < QUEST_SLOT_COUNT) questSlotLocked[completedSlot] = 1;
        awardQuestRewards(completedQuest);
        if (unlockedDRankAchievement) placeInventoryItems(INVENTORY_POTION_OF_SPEED_III, 5);
        lastWolfFurReward = rewardAmountForItem(INVENTORY_WOLF_FUR);
        lastPotionReward = rewardAmountForItem(INVENTORY_POTION_OF_SPEED);
        lastWolfFurDropped = rewardDroppedForItem(INVENTORY_WOLF_FUR);
        lastPotionDropped = rewardDroppedForItem(INVENTORY_POTION_OF_SPEED);
        questResultPending = true;
        addUS(player.statistics_questsCompleted, 1);
        guildExperience += Math.pow(2, questRank(completedSlot) + 1);
        const currentRank = <i32>toNumber(player.guildRank);
        const requirement = currentRank === 0 ? 25 : currentRank === 1 ? 200 : Infinity;
        if (guildExperience >= requirement) {
            writeNumber(player.guildRank, currentRank + 1);
            unlockTierOneAchievement(29);
            refreshQuestDefinitions();
        }
        unlockTierOneAchievement(26);
        if (gte(player.statistics_questsCompleted, 10)) unlockTierOneAchievement(28);
    }
    writeNumber(player.activeQuest, NO_ACTIVE_QUEST);
    writeNumber(player.wolfineHealth, 0);
    writeNumber(player.combatShield, 0);
    writeNumber(player.combatFreezeTurns, 0);
    player.combatUsedNonFreeze = false;
    resetCombatSpellCosts();
}

function refreshQuestDefinitions(): void {
    const rank = <i32>toNumber(player.guildRank);
    const maximumId = rank >= 2 ? 21 : rank >= 1 ? 16 : 11;
    for (let slot: i32 = 0; slot < QUEST_SLOT_COUNT; slot++) {
        let id: i32;
        do id = nextCombatRandom(maximumId + 1);
        while (questDefinitionAlreadyUsed(slot, id));
        questDefinitionIds[slot] = id;
    }
}

function questDefinitionAlreadyUsed(slot: i32, id: i32): bool {
    for (let previous: i32 = 0; previous < slot; previous++) if (questDefinitionIds[previous] === id) return true;
    return false;
}

function awardQuestRewards(quest: i32): void {
    for (let reward: i32 = 0; reward < MAX_QUEST_REWARDS; reward++) {
        const item = questRewardItem(quest, reward);
        const minimum = questRewardMinimum(quest, reward);
        const maximum = questRewardMaximum(quest, reward);
        if (item === 0 || maximum <= 0) {
            lastRewardItems[reward] = 0;
            lastRewardAmounts[reward] = 0;
            lastRewardDropped[reward] = 0;
            continue;
        }
        const amount = minimum + nextCombatRandom(maximum - minimum + 1);
        lastRewardItems[reward] = item;
        lastRewardAmounts[reward] = amount;
        lastRewardDropped[reward] = amount - placeInventoryItems(<u8>item, amount);
    }
}

function questRewardItem(quest: i32, reward: i32): i32 {
    if (quest < 0 || quest >= QUEST_DEFINITION_COUNT || reward < 0 || reward >= MAX_QUEST_REWARDS) return 0;
    return questRewardItems[quest * MAX_QUEST_REWARDS + reward];
}

function questRewardMinimum(quest: i32, reward: i32): i32 {
    if (quest < 0 || quest >= QUEST_DEFINITION_COUNT || reward < 0 || reward >= MAX_QUEST_REWARDS) return 0;
    return questRewardMinimums[quest * MAX_QUEST_REWARDS + reward];
}

function questRewardMaximum(quest: i32, reward: i32): i32 {
    if (quest < 0 || quest >= QUEST_DEFINITION_COUNT || reward < 0 || reward >= MAX_QUEST_REWARDS) return 0;
    return questRewardMaximums[quest * MAX_QUEST_REWARDS + reward];
}

function rewardAmountForItem(item: u8): i32 {
    let amount: i32 = 0;
    for (let reward: i32 = 0; reward < MAX_QUEST_REWARDS; reward++) if (lastRewardItems[reward] === item) amount += lastRewardAmounts[reward];
    return amount;
}

function rewardDroppedForItem(item: u8): i32 {
    let amount: i32 = 0;
    for (let reward: i32 = 0; reward < MAX_QUEST_REWARDS; reward++) if (lastRewardItems[reward] === item) amount += lastRewardDropped[reward];
    return amount;
}

function placeInventoryItems(item: u8, amount: i32): i32 {
    let placed: i32 = 0;
    for (; placed < amount; placed++) {
        const position = findInventorySpace(item);
        if (position < 0) break;
        placeInventoryItem(position, item);
    }
    if (placed > 0 && item <= INVENTORY_POTION_OF_SPEED) addUS(inventoryAmountHandle(item), placed);
    if (placed > 0) inventoryRevision++;
    return placed;
}

function findInventorySpace(item: u8): i32 {
    for (let position: i32 = 0; position < INVENTORY_SIZE; position++) {
        if (inventoryPositionFits(item, position, -1)) return position;
    }
    return -1;
}

function inventoryPositionFits(item: u8, position: i32, ignoredPosition: i32): bool {
    if (!isInventoryItem(item) || position < 0 || position >= INVENTORY_SIZE) return false;
    const width = inventoryItemWidth(item);
    const height = inventoryItemHeight(item);
    if (position % INVENTORY_WIDTH + width > INVENTORY_WIDTH) return false;
    if (position / INVENTORY_WIDTH + height > INVENTORY_SIZE / INVENTORY_WIDTH) return false;
    for (let row: i32 = 0; row < height; row++) {
        for (let column: i32 = 0; column < width; column++) {
            const checked = position + row * INVENTORY_WIDTH + column;
            if (ignoredPosition >= 0 && inventoryCellBelongsToItem(checked, ignoredPosition, item)) continue;
            if (inventorySlots[checked] !== INVENTORY_EMPTY) return false;
        }
    }
    return true;
}

function placeInventoryItem(position: i32, item: u8): void {
    const width = inventoryItemWidth(item);
    const height = inventoryItemHeight(item);
    for (let row: i32 = 0; row < height; row++) {
        for (let column: i32 = 0; column < width; column++) {
            inventorySlots[position + row * INVENTORY_WIDTH + column] = row === 0 && column === 0 ? item : INVENTORY_CONTINUATION;
        }
    }
}

function clearInventoryItem(position: i32, item: u8): void {
    const width = inventoryItemWidth(item);
    const height = inventoryItemHeight(item);
    for (let row: i32 = 0; row < height; row++) {
        for (let column: i32 = 0; column < width; column++) {
            inventorySlots[position + row * INVENTORY_WIDTH + column] = INVENTORY_EMPTY;
        }
    }
}

function isInventoryItem(item: u8): bool {
    return item >= INVENTORY_WOLF_FUR && item <= 25;
}

export function inventoryItemSellMinimum(item: i32): i32 {
    if (item < 0 || item >= 256) return 0;
    return effectiveInventorySellPrice(<i32>inventoryItemSellMinimums[item]);
}

export function inventoryItemSellMaximum(item: i32): i32 {
    if (item < 0 || item >= 256) return 0;
    return effectiveInventorySellPrice(<i32>inventoryItemSellMaximums[item]);
}

function effectiveInventorySellPrice(price: i32): i32 {
    return hasTierOneAchievement(34) ? <i32>Math.ceil(<f64>price * 1.5) : price;
}

function inventoryItemWidth(item: u8): i32 {
    const width = inventoryItemWidths[item];
    return width > 0 ? width : 1;
}

function inventoryItemHeight(item: u8): i32 {
    const height = inventoryItemHeights[item];
    return height > 0 ? height : 1;
}

function inventoryCellBelongsToItem(cell: i32, position: i32, item: u8): bool {
    const relative = cell - position;
    if (relative < 0) return false;
    const row = relative / INVENTORY_WIDTH;
    const column = relative % INVENTORY_WIDTH;
    return row < inventoryItemHeight(item) && column < inventoryItemWidth(item);
}

function inventoryAmountHandle(item: u8): i32 {
    return item === INVENTORY_WOLF_FUR ? player.inventoryWolfFur : player.inventoryPotionOfSpeed;
}

function combatSpellCost(index: i32): i32 {
    switch (index) {
        case 0: return player.fireballCost;
        case 1: return player.whirlwindCost;
        case 2: return player.freezeCost;
        default: return 0;
    }
}

function combatSpellDamage(index: i32): i32 {
    switch (index) {
        case 0: return 35;
        case 1: return 60;
        case 2: return 10;
        default: return 0;
    }
}

export function resetCombatSpellCosts(): void {
    writeDecimal(player.fireballCost, 1, 1, 40);
    writeDecimal(player.whirlwindCost, 1, 1, 80);
    writeDecimal(player.freezeCost, 1, 1, 120);
}

/** [/WASM] */

initializeQuestBoard();
initializePotionSpeedTimers(...POTION_SPEED_TIMER_HANDLES);
initializePotionSpeedIITimers(...POTION_SPEED_II_TIMER_HANDLES);
initializePotionSpeedIIITimers(...POTION_SPEED_III_TIMER_HANDLES);
for (const item of INVENTORY_ITEMS) {
    configureInventoryItem(item.id, item.width, item.height);
    configureInventoryItemSellPrice(item.id, item.sellPrice[0], item.sellPrice[1]);
}
for (const upgrade of GUILD_SHOP_UPGRADES) {
    configureGuildShopUpgradeCost(upgrade.id, upgrade.cost);
}
refreshShopItems();
for (const quest of GUILD_QUESTS) {
    quest.rewards.forEach((reward, rewardIndex) => {
        const [minimumText, maximumText = minimumText] = reward.amount.split("-");
        configureQuestReward(quest.id, rewardIndex, reward.item, Number(minimumText), Number(maximumText));
    });
}
